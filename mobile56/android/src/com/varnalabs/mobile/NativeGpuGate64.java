package com.varnalabs.mobile;

import android.graphics.SurfaceTexture;
import android.media.MediaCodec;
import android.media.MediaCodecInfo;
import android.media.MediaExtractor;
import android.media.MediaFormat;
import android.media.MediaMuxer;
import android.opengl.EGL14;
import android.opengl.EGLConfig;
import android.opengl.EGLContext;
import android.opengl.EGLDisplay;
import android.opengl.EGLExt;
import android.opengl.EGLSurface;
import android.opengl.GLES11Ext;
import android.opengl.GLES20;
import android.os.Handler;
import android.os.Looper;
import android.os.SystemClock;
import android.view.Surface;
import android.view.TextureView;
import android.widget.FrameLayout;
import java.io.File;
import java.io.IOException;
import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.nio.FloatBuffer;
import java.util.ArrayList;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;
import org.json.JSONArray;
import org.json.JSONObject;

/** Debug-only native rendering acceptance gate, not the production timeline renderer.
 * Decodes two real files to external textures, draws the same scene to preview and
 * encoder surfaces, and muxes an MP4 without bitmap capture or frame bridge calls.
 */
final class NativeGpuGate64 implements Runnable {
    private final MainActivity owner;
    private final String request;
    private final JSONObject scene;
    private final AtomicBoolean cancelled = new AtomicBoolean();
    private final Handler main = new Handler(Looper.getMainLooper());
    private final ArrayList<Source> sources = new ArrayList<>();
    private final FloatBuffer vertices = ByteBuffer.allocateDirect(16 * 4)
        .order(ByteOrder.nativeOrder()).asFloatBuffer();
    private EGLDisplay display = EGL14.EGL_NO_DISPLAY;
    private EGLContext context = EGL14.EGL_NO_CONTEXT;
    private EGLSurface previewEgl = EGL14.EGL_NO_SURFACE, encodeEgl = EGL14.EGL_NO_SURFACE;
    private TextureView preview;
    private Surface previewSurface, inputSurface;
    private SurfaceTexture previewTexture;
    private MediaCodec encoder;
    private MediaMuxer muxer;
    private File output;
    private boolean muxStarted, encoderStarted, successful;
    private int muxTrack = -1, encodedFrames, program, width, height, fps;
    private volatile String stage = "preparing";

    NativeGpuGate64(MainActivity owner, String request, String json) throws Exception {
        this.owner = owner;
        this.request = request;
        if (json == null || json.length() > 65536) throw new IOException("Gate scene is too large");
        this.scene = new JSONObject(json);
    }

    void start() { new Thread(this, "VarnaGpuGate64").start(); }
    void cancel() { cancelled.set(true); }
    String stage() { return stage; }

    private void check() throws IOException {
        if (cancelled.get() || owner.isDestroyed()) throw new IOException("Native GPU gate cancelled");
    }

    @Override public void run() {
        long started = SystemClock.elapsedRealtime();
        JSONObject answer = null; String failure = null;
        try {
            width = scene.getInt("width"); height = scene.getInt("height"); fps = scene.getInt("fps");
            int frames = scene.getInt("frames");
            JSONArray clips = scene.getJSONArray("clips");
            if (width < 160 || height < 90 || width % 2 != 0 || height % 2 != 0 ||
                (long) width * height > 1280 * 720 || fps < 12 || fps > 30 ||
                frames < 1 || frames > fps * 10 || clips.length() < 1 || clips.length() > 2)
                throw new IOException("Gate supports 1-2 video layers, up to 720p/30fps and 10 seconds");
            createPreview();
            createEgl();
            program = createProgram();
            for (int i = 0; i < clips.length(); i++) sources.add(new Source(clips.getJSONObject(i)));
            createEncoder();
            stage = "rendering";
            for (int frame = 0; frame < frames; frame++) {
                check();
                long pts = frame * 1000000L / fps;
                for (Source source : sources) source.decode(pts);
                makeCurrent(previewEgl);
                draw(width, height);
                if (!EGL14.eglSwapBuffers(display, previewEgl)) throw eglError("Preview swap");
                makeCurrent(encodeEgl);
                draw(width, height);
                EGLExt.eglPresentationTimeANDROID(display, encodeEgl, pts * 1000L);
                if (!EGL14.eglSwapBuffers(display, encodeEgl)) throw eglError("Encoder swap");
                drain(false);
            }
            stage = "finishing";
            encoder.signalEndOfInputStream();
            drain(true);
            if (encodedFrames != frames) throw new IOException("Encoded frame count mismatch: " + encodedFrames);
            muxer.stop(); muxStarted = false;
            muxer.release(); muxer = null;
            check();
            JSONObject result = new JSONObject();
            result.put("file", output.getName());
            result.put("frames", encodedFrames);
            result.put("layers", sources.size());
            result.put("width", width); result.put("height", height); result.put("fps", fps);
            result.put("elapsedMs", SystemClock.elapsedRealtime() - started);
            result.put("cpuReadbacks", 0);
            result.put("renderer", "native EGL / external OES / encoder Surface");
            result.put("glesVersion", GLES20.glGetString(GLES20.GL_VERSION));
            result.put("colorScope", "SDR BT.601 acceptance fixtures; production BT.709 conversion still pending");
            result.put("scope", "rendering acceptance gate; video only; not full MVP");
            successful = true;
            owner.lastExport = output.getName();
            answer = result;
        } catch (Exception error) {
            failure = error.getMessage() == null ? error.toString() : error.getMessage();
        } finally {
            stage = "closed";
            close();
            owner.callback(request, answer, failure);
        }
    }

    private void createPreview() throws Exception {
        CountDownLatch available = new CountDownLatch(1);
        main.post(() -> {
            if (cancelled.get() || owner.isDestroyed()) { available.countDown(); return; }
            preview = new TextureView(owner);
            preview.setOpaque(true);
            preview.setSurfaceTextureListener(new TextureView.SurfaceTextureListener() {
                public void onSurfaceTextureAvailable(SurfaceTexture texture, int w, int h) {
                    previewTexture = texture; available.countDown();
                }
                public void onSurfaceTextureSizeChanged(SurfaceTexture t, int w, int h) {}
                public boolean onSurfaceTextureDestroyed(SurfaceTexture t) { cancel(); return true; }
                public void onSurfaceTextureUpdated(SurfaceTexture t) {}
            });
            FrameLayout root = (FrameLayout) owner.web.getParent();
            FrameLayout.LayoutParams params = new FrameLayout.LayoutParams(width, height);
            params.gravity = android.view.Gravity.CENTER;
            root.addView(preview, params);
        });
        if (!available.await(15, TimeUnit.SECONDS)) throw new IOException("Native preview surface timeout");
        check();
        if (previewTexture == null) throw new IOException("Native preview surface unavailable");
        previewTexture.setDefaultBufferSize(width, height);
        previewSurface = new Surface(previewTexture);
    }

    private void createEgl() throws Exception {
        display = EGL14.eglGetDisplay(EGL14.EGL_DEFAULT_DISPLAY);
        int[] version = new int[2];
        if (!EGL14.eglInitialize(display, version, 0, version, 1)) throw eglError("Initialize EGL");
        EGLConfig[] configs = new EGLConfig[1]; int[] count = new int[1];
        int[] attrs = { EGL14.EGL_RED_SIZE, 8, EGL14.EGL_GREEN_SIZE, 8, EGL14.EGL_BLUE_SIZE, 8,
            EGL14.EGL_ALPHA_SIZE, 8, EGL14.EGL_RENDERABLE_TYPE, 0x0040,
            EGL14.EGL_SURFACE_TYPE, EGL14.EGL_WINDOW_BIT, 0x3142, 1, EGL14.EGL_NONE };
        if (!EGL14.eglChooseConfig(display, attrs, 0, configs, 0, 1, count, 0) || count[0] == 0)
            throw new IOException("No recordable EGL config");
        config = configs[0];
        context = EGL14.eglCreateContext(display, config, EGL14.EGL_NO_CONTEXT,
            new int[] { EGL14.EGL_CONTEXT_CLIENT_VERSION, 3, EGL14.EGL_NONE }, 0);
        if (context == EGL14.EGL_NO_CONTEXT) throw eglError("Create EGL context");
        previewEgl = EGL14.eglCreateWindowSurface(display, config, previewSurface,
            new int[] { EGL14.EGL_NONE }, 0);
        makeCurrent(previewEgl);
    }
    private EGLConfig config;

    private void createEncoder() throws Exception {
        output = owner.exportFile("GpuGate64_" + System.currentTimeMillis() + ".mp4");
        MediaFormat format = MediaFormat.createVideoFormat("video/avc", width, height);
        format.setInteger(MediaFormat.KEY_COLOR_FORMAT, MediaCodecInfo.CodecCapabilities.COLOR_FormatSurface);
        format.setInteger(MediaFormat.KEY_BIT_RATE, Math.max(1000000, width * height * 6));
        format.setInteger(MediaFormat.KEY_FRAME_RATE, fps);
        format.setInteger(MediaFormat.KEY_I_FRAME_INTERVAL, 1);
        format.setInteger(MediaFormat.KEY_COLOR_STANDARD, MediaFormat.COLOR_STANDARD_BT601_NTSC);
        format.setInteger(MediaFormat.KEY_COLOR_RANGE, MediaFormat.COLOR_RANGE_LIMITED);
        format.setInteger(MediaFormat.KEY_COLOR_TRANSFER, MediaFormat.COLOR_TRANSFER_SDR_VIDEO);
        encoder = MediaCodec.createEncoderByType("video/avc");
        encoder.configure(format, null, null, MediaCodec.CONFIGURE_FLAG_ENCODE);
        inputSurface = encoder.createInputSurface();
        encodeEgl = EGL14.eglCreateWindowSurface(display, config, inputSurface,
            new int[] { EGL14.EGL_NONE }, 0);
        if (encodeEgl == EGL14.EGL_NO_SURFACE) throw eglError("Create encoder EGL surface");
        encoder.start(); encoderStarted = true;
        muxer = new MediaMuxer(output.getAbsolutePath(), MediaMuxer.OutputFormat.MUXER_OUTPUT_MPEG_4);
    }

    private final class Source {
        final MediaExtractor extractor = new MediaExtractor();
        MediaCodec decoder;
        SurfaceTexture texture;
        Surface surface;
        int textureId;
        boolean decoderStarted, inputEnded, outputEnded, haveFrame;
        long lastPts = -1;
        int produced, consumed;
        final Object frameLock = new Object();
        final float[] transform = new float[16];
        final float[] rect = new float[4];

        Source(JSONObject clip) throws Exception {
            try {
                String id = clip.getString("mediaId");
                JSONArray r = clip.getJSONArray("rect");
                if (r.length() != 4) throw new IOException("Invalid layer rectangle");
                for (int i = 0; i < 4; i++) {
                    double n = r.getDouble(i);
                    if (!Double.isFinite(n) || n < 0 || n > 1) throw new IOException("Invalid normalized layer rectangle");
                    rect[i] = (float) n;
                }
                if (rect[2] <= 0 || rect[3] <= 0 || rect[0] + rect[2] > 1.00001 || rect[1] + rect[3] > 1.00001)
                    throw new IOException("Layer rectangle is outside the composition");
                extractor.setDataSource(owner.mediaFile(id).getAbsolutePath());
                MediaFormat format = null;
                for (int i = 0; i < extractor.getTrackCount(); i++) {
                    MediaFormat candidate = extractor.getTrackFormat(i);
                    if (candidate.getString(MediaFormat.KEY_MIME).startsWith("video/")) {
                        extractor.selectTrack(i); format = candidate; break;
                    }
                }
                if (format == null) throw new IOException("Gate requires video inputs");
                if (format.containsKey(MediaFormat.KEY_COLOR_TRANSFER)) {
                    int transfer = format.getInteger(MediaFormat.KEY_COLOR_TRANSFER);
                    if (transfer == MediaFormat.COLOR_TRANSFER_ST2084 || transfer == MediaFormat.COLOR_TRANSFER_HLG)
                        throw new IOException("HDR requires a color-managed compositor; not supported by this gate");
                }
                int[] names = new int[1]; GLES20.glGenTextures(1, names, 0); textureId = names[0];
                GLES20.glBindTexture(GLES11Ext.GL_TEXTURE_EXTERNAL_OES, textureId);
                GLES20.glTexParameteri(GLES11Ext.GL_TEXTURE_EXTERNAL_OES, GLES20.GL_TEXTURE_MIN_FILTER, GLES20.GL_LINEAR);
                GLES20.glTexParameteri(GLES11Ext.GL_TEXTURE_EXTERNAL_OES, GLES20.GL_TEXTURE_MAG_FILTER, GLES20.GL_LINEAR);
                GLES20.glTexParameteri(GLES11Ext.GL_TEXTURE_EXTERNAL_OES, GLES20.GL_TEXTURE_WRAP_S, GLES20.GL_CLAMP_TO_EDGE);
                GLES20.glTexParameteri(GLES11Ext.GL_TEXTURE_EXTERNAL_OES, GLES20.GL_TEXTURE_WRAP_T, GLES20.GL_CLAMP_TO_EDGE);
                texture = new SurfaceTexture(textureId);
                texture.setOnFrameAvailableListener(t -> {
                    synchronized (frameLock) { produced++; frameLock.notifyAll(); }
                }, main);
                surface = new Surface(texture);
                decoder = MediaCodec.createDecoderByType(format.getString(MediaFormat.KEY_MIME));
                decoder.configure(format, surface, null, 0);
                decoder.start(); decoderStarted = true;
            } catch (Exception error) { close(); throw error; }
        }

        void decode(long targetUs) throws Exception {
            if (haveFrame && lastPts >= targetUs) return;
            long deadline = SystemClock.elapsedRealtime() + 15000;
            MediaCodec.BufferInfo info = new MediaCodec.BufferInfo();
            while (!outputEnded) {
                check();
                if (SystemClock.elapsedRealtime() > deadline) throw new IOException("GPU source decode timeout");
                if (!inputEnded) {
                    int index = decoder.dequeueInputBuffer(1000);
                    if (index >= 0) {
                        ByteBuffer buffer = decoder.getInputBuffer(index);
                        int bytes = extractor.readSampleData(buffer, 0);
                        if (bytes < 0) {
                            decoder.queueInputBuffer(index, 0, 0, 0, MediaCodec.BUFFER_FLAG_END_OF_STREAM); inputEnded = true;
                        } else {
                            decoder.queueInputBuffer(index, 0, bytes, extractor.getSampleTime(), 0); extractor.advance();
                        }
                    }
                }
                int index = decoder.dequeueOutputBuffer(info, 1000);
                if (index < 0) continue;
                boolean eos = (info.flags & MediaCodec.BUFFER_FLAG_END_OF_STREAM) != 0;
                boolean render = info.size > 0 && (info.presentationTimeUs >= targetUs || eos);
                decoder.releaseOutputBuffer(index, render);
                if (render) {
                    synchronized (frameLock) {
                        while (produced == consumed) {
                            check();
                            long left = deadline - SystemClock.elapsedRealtime();
                            if (left <= 0) throw new IOException("SurfaceTexture frame timeout");
                            frameLock.wait(Math.min(left, 200));
                        }
                        consumed = produced;
                    }
                    makeCurrent(previewEgl);
                    texture.updateTexImage(); texture.getTransformMatrix(transform);
                    lastPts = info.presentationTimeUs; haveFrame = true;
                }
                if (eos) outputEnded = true;
                if (render) return;
            }
            if (!haveFrame) throw new IOException("No decoded video frame");
            throw new IOException("Source ended before the requested gate duration");
        }

        void close() {
            if (decoder != null) { try { if (decoderStarted) decoder.stop(); } catch (Exception ignored) {} decoder.release(); }
            extractor.release();
            if (surface != null) surface.release();
            if (texture != null) texture.release();
            if (textureId != 0) GLES20.glDeleteTextures(1, new int[] {textureId}, 0);
        }
    }

    private void makeCurrent(EGLSurface surface) throws IOException {
        if (surface == EGL14.EGL_NO_SURFACE || !EGL14.eglMakeCurrent(display, surface, surface, context))
            throw eglError("Make EGL current");
    }

    private void draw(int w, int h) throws IOException {
        GLES20.glViewport(0, 0, w, h);
        GLES20.glClearColor(0, 0, 0, 1); GLES20.glClear(GLES20.GL_COLOR_BUFFER_BIT);
        GLES20.glUseProgram(program);
        int pos = GLES20.glGetAttribLocation(program, "aPosition"), uv = GLES20.glGetAttribLocation(program, "aUv");
        for (Source source : sources) {
            float left = source.rect[0] * 2 - 1, right = (source.rect[0] + source.rect[2]) * 2 - 1;
            float top = 1 - source.rect[1] * 2, bottom = 1 - (source.rect[1] + source.rect[3]) * 2;
            vertices.clear();
            vertices.put(new float[] {left,bottom,0,0, right,bottom,1,0, left,top,0,1, right,top,1,1});
            vertices.position(0); GLES20.glVertexAttribPointer(pos, 2, GLES20.GL_FLOAT, false, 16, vertices);
            vertices.position(2); GLES20.glVertexAttribPointer(uv, 2, GLES20.GL_FLOAT, false, 16, vertices);
            GLES20.glEnableVertexAttribArray(pos); GLES20.glEnableVertexAttribArray(uv);
            GLES20.glUniformMatrix4fv(GLES20.glGetUniformLocation(program, "uTransform"), 1, false, source.transform, 0);
            GLES20.glActiveTexture(GLES20.GL_TEXTURE0);
            GLES20.glBindTexture(GLES11Ext.GL_TEXTURE_EXTERNAL_OES, source.textureId);
            GLES20.glUniform1i(GLES20.glGetUniformLocation(program, "uVideo"), 0);
            GLES20.glDrawArrays(GLES20.GL_TRIANGLE_STRIP, 0, 4);
        }
        int error = GLES20.glGetError();
        if (error != GLES20.GL_NO_ERROR) throw new IOException("GPU drawing error: " + error);
    }

    private static int shader(int kind, String text) throws IOException {
        int shader = GLES20.glCreateShader(kind); GLES20.glShaderSource(shader, text); GLES20.glCompileShader(shader);
        int[] result = new int[1]; GLES20.glGetShaderiv(shader, GLES20.GL_COMPILE_STATUS, result, 0);
        if (result[0] == 0) { String log = GLES20.glGetShaderInfoLog(shader); GLES20.glDeleteShader(shader); throw new IOException(log); }
        return shader;
    }

    private static int createProgram() throws IOException {
        int vertex = shader(GLES20.GL_VERTEX_SHADER,
            "attribute vec2 aPosition; attribute vec2 aUv; uniform mat4 uTransform; varying vec2 vUv;" +
            "void main(){gl_Position=vec4(aPosition,0.,1.);vUv=(uTransform*vec4(aUv,0.,1.)).xy;}");
        int fragment;
        try { fragment = shader(GLES20.GL_FRAGMENT_SHADER,
            "#extension GL_OES_EGL_image_external : require\nprecision mediump float;" +
            "uniform samplerExternalOES uVideo; varying vec2 vUv; void main(){gl_FragColor=texture2D(uVideo,vUv);}");
        } catch (Exception error) { GLES20.glDeleteShader(vertex); throw error; }
        int p = GLES20.glCreateProgram(); GLES20.glAttachShader(p, vertex); GLES20.glAttachShader(p, fragment); GLES20.glLinkProgram(p);
        GLES20.glDeleteShader(vertex); GLES20.glDeleteShader(fragment);
        int[] result = new int[1]; GLES20.glGetProgramiv(p, GLES20.GL_LINK_STATUS, result, 0);
        if (result[0] == 0) { String log = GLES20.glGetProgramInfoLog(p); GLES20.glDeleteProgram(p); throw new IOException(log); }
        return p;
    }

    private void drain(boolean finish) throws Exception {
        long deadline = SystemClock.elapsedRealtime() + 20000;
        MediaCodec.BufferInfo info = new MediaCodec.BufferInfo();
        for (;;) {
            check();
            int index = encoder.dequeueOutputBuffer(info, finish ? 10000 : 0);
            if (index == MediaCodec.INFO_OUTPUT_FORMAT_CHANGED) {
                if (muxStarted) throw new IOException("Encoder format changed twice");
                muxTrack = muxer.addTrack(encoder.getOutputFormat()); muxer.start(); muxStarted = true;
            } else if (index >= 0) {
                ByteBuffer buffer = encoder.getOutputBuffer(index);
                if ((info.flags & MediaCodec.BUFFER_FLAG_CODEC_CONFIG) != 0) info.size = 0;
                if (info.size > 0) {
                    if (!muxStarted || buffer == null) throw new IOException("Encoder output unavailable");
                    buffer.position(info.offset); buffer.limit(info.offset + info.size);
                    muxer.writeSampleData(muxTrack, buffer, info); encodedFrames++;
                }
                boolean eos = (info.flags & MediaCodec.BUFFER_FLAG_END_OF_STREAM) != 0;
                encoder.releaseOutputBuffer(index, false);
                if (eos) return;
            } else if (!finish) return;
            if (SystemClock.elapsedRealtime() > deadline) throw new IOException("Encoder drain timeout");
        }
    }

    private static IOException eglError(String operation) {
        return new IOException(operation + " failed: EGL 0x" + Integer.toHexString(EGL14.eglGetError()));
    }

    private void close() {
        if (display != EGL14.EGL_NO_DISPLAY && context != EGL14.EGL_NO_CONTEXT && previewEgl != EGL14.EGL_NO_SURFACE)
            EGL14.eglMakeCurrent(display, previewEgl, previewEgl, context);
        for (Source source : sources) { try { source.close(); } catch (Exception ignored) {} }
        if (program != 0) GLES20.glDeleteProgram(program);
        if (encoder != null) { try { if (encoderStarted) encoder.stop(); } catch (Exception ignored) {} try { encoder.release(); } catch (Exception ignored) {} }
        if (muxer != null) { try { if (muxStarted) muxer.stop(); } catch (Exception ignored) {} try { muxer.release(); } catch (Exception ignored) {} }
        if (display != EGL14.EGL_NO_DISPLAY) {
            EGL14.eglMakeCurrent(display, EGL14.EGL_NO_SURFACE, EGL14.EGL_NO_SURFACE, EGL14.EGL_NO_CONTEXT);
            if (encodeEgl != EGL14.EGL_NO_SURFACE) EGL14.eglDestroySurface(display, encodeEgl);
            if (previewEgl != EGL14.EGL_NO_SURFACE) EGL14.eglDestroySurface(display, previewEgl);
            if (context != EGL14.EGL_NO_CONTEXT) EGL14.eglDestroyContext(display, context);
            EGL14.eglReleaseThread(); EGL14.eglTerminate(display);
        }
        if (inputSurface != null) inputSurface.release();
        if (previewSurface != null) previewSurface.release();
        if (!successful && output != null) output.delete();
        main.post(() -> {
            if (preview != null && preview.getParent() instanceof FrameLayout)
                ((FrameLayout) preview.getParent()).removeView(preview);
            if (owner.gpuGate64 == this) owner.gpuGate64 = null;
        });
    }
}
