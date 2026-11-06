package com.varnalabs.mobile;

import android.graphics.*;
import android.media.*;
import android.opengl.*;
import android.os.*;
import android.view.Surface;
import java.io.*;
import java.nio.*;
import java.util.*;
import java.util.concurrent.atomic.AtomicBoolean;
import org.json.*;

/** Surface-input MP4 export of an immutable media graph. No video frame crosses WebView. */
final class Export65 implements Runnable {
    final MainActivity owner;final String request;final Scene65 scene;
    final AtomicBoolean cancelled=new AtomicBoolean();final Handler main=new Handler(Looper.getMainLooper());
    final LinkedHashMap<String,Source> sources=new LinkedHashMap<>();
    final FloatBuffer vertices=ByteBuffer.allocateDirect(64).order(ByteOrder.nativeOrder()).asFloatBuffer();
    EGLDisplay display=EGL14.EGL_NO_DISPLAY;EGLContext context=EGL14.EGL_NO_CONTEXT;
    EGLSurface previewEgl=EGL14.EGL_NO_SURFACE,encodeEgl=EGL14.EGL_NO_SURFACE;EGLConfig config;
    Surface inputSurface;MediaCodec encoder;MediaMuxer muxer;File video,audioFile,staging,output;
    boolean muxStarted,encoderStarted,successful;int muxTrack=-1,encodedFrames,program,imageProgram;
    final int width,height,fps;final long snapshotBaseline;Audio65 audio;
    Export65(MainActivity owner,String request,String json)throws Exception{this.owner=owner;this.request=request;snapshotBaseline=owner.playback59.snapshots.get();scene=new Scene65(json);width=scene.width;height=scene.height;fps=scene.fps;}
    void start(){new Thread(this,"VarnaSurfaceExport65").start();}
    void cancel(){cancelled.set(true);}
    void check()throws IOException{if(cancelled.get()||owner.isDestroyed())throw new IOException("Export cancelled");}
    long lastProgress;
    void progress(String stage,int current,int total){long now=SystemClock.elapsedRealtime();if(current!=total&&now-lastProgress<100)return;lastProgress=now;try{JSONObject data=new JSONObject();data.put("stage",stage);data.put("current",current);data.put("total",total);data.put("job",request);owner.runOnUiThread(()->{if(!owner.isDestroyed())owner.web.evaluateJavascript("window.MobileProgress65&&MobileProgress65("+data.toString()+")",null);});}catch(Exception ignored){}}
    @Override public void run(){JSONObject answer=null;String error=null;long started=SystemClock.elapsedRealtime();
        try{for(Scene65.Clip c:scene.clips)owner.mediaFile(c.mediaId);audio=new Audio65(owner,scene,()->cancelled.get()||owner.isDestroyed(),this::progress);
            createEgl();program=createProgram(false);imageProgram=createProgram(true);createEncoder();
            int frames=(int)((scene.durationUs*fps+999999)/1000000);
            for(int i=0;i<frames;i++){check();long time=i*1000000L/fps;List<Scene65.Clip> active=scene.visual(time);Set<String> ids=new HashSet<>();for(Scene65.Clip c:active)ids.add(c.id);
                Iterator<Map.Entry<String,Source>> iterator=sources.entrySet().iterator();while(iterator.hasNext()){Map.Entry<String,Source> entry=iterator.next();if(!ids.contains(entry.getKey())){entry.getValue().close();iterator.remove();}}
                for(Scene65.Clip c:active){Source source=sources.get(c.id);if(source==null){source=new Source(c);sources.put(c.id,source);}source.decode(c.sourceTime(time));}
                makeCurrent(encodeEgl);draw(active);EGLExt.eglPresentationTimeANDROID(display,encodeEgl,time*1000);if(!EGL14.eglSwapBuffers(display,encodeEgl))throw eglError("Encoder swap");drain(false);progress("video",i+1,frames);}
            encoder.signalEndOfInputStream();drain(true);if(encodedFrames!=frames)throw new IOException("Encoded frame count mismatch");
            muxer.stop();muxStarted=false;muxer.release();muxer=null;
            long duration=frames*1000000L/fps;audioFile=audio.encode(owner,duration,()->cancelled.get()||owner.isDestroyed(),this::progress);check();
            staging=new File(owner.getCacheDir(),"mux65-"+System.nanoTime()+".mp4");
            if(audioFile!=null)mux(video,audioFile,staging);else VideoEncoder.copy(video,staging);
            check();output=owner.exportFile("Video_"+System.currentTimeMillis()+".mp4");if(!staging.renameTo(output))throw new IOException("Cannot publish output file");successful=true;owner.lastExport=output.getName();
            answer=new JSONObject();answer.put("file",output.getName());answer.put("frames",frames);answer.put("durationUs",duration);answer.put("audioEntries",audio.entries.size());answer.put("encoderDelaySamples",audio.encoderDelaySamples);answer.put("renderer","native EGL / encoder Surface");answer.put("videoFrameBridgeCalls",owner.playback59.snapshots.get()-snapshotBaseline);answer.put("elapsedMs",SystemClock.elapsedRealtime()-started);answer.put("color","SDR BT.601");
        }catch(Exception failure){error=failure.getMessage()==null?failure.toString():failure.getMessage();}
        finally{close();final JSONObject result=answer;final String message=error;owner.runOnUiThread(()->{if(owner.editor65.export==this)owner.editor65.export=null;owner.getWindow().clearFlags(android.view.WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);owner.callback(request,result,message);});}}
    void createEgl()throws Exception{
        display=EGL14.eglGetDisplay(EGL14.EGL_DEFAULT_DISPLAY);int[] versions=new int[2];if(!EGL14.eglInitialize(display,versions,0,versions,1))throw eglError("Initialize EGL");
        EGLConfig[] configs=new EGLConfig[1];int[] count=new int[1];int[] attrs={EGL14.EGL_RED_SIZE,8,EGL14.EGL_GREEN_SIZE,8,EGL14.EGL_BLUE_SIZE,8,EGL14.EGL_ALPHA_SIZE,8,EGL14.EGL_RENDERABLE_TYPE,0x40,EGL14.EGL_SURFACE_TYPE,EGL14.EGL_WINDOW_BIT|EGL14.EGL_PBUFFER_BIT,0x3142,1,EGL14.EGL_NONE};
        if(!EGL14.eglChooseConfig(display,attrs,0,configs,0,1,count,0)||count[0]==0)throw new IOException("Recordable GLES 3 is unavailable");config=configs[0];
        context=EGL14.eglCreateContext(display,config,EGL14.EGL_NO_CONTEXT,new int[]{EGL14.EGL_CONTEXT_CLIENT_VERSION,3,EGL14.EGL_NONE},0);if(context==EGL14.EGL_NO_CONTEXT)throw eglError("Create context");
        previewEgl=EGL14.eglCreatePbufferSurface(display,config,new int[]{EGL14.EGL_WIDTH,1,EGL14.EGL_HEIGHT,1,EGL14.EGL_NONE},0);makeCurrent(previewEgl);
    }
    void createEncoder()throws Exception{
        video=new File(owner.getCacheDir(),"video65-"+System.nanoTime()+".mp4");MediaFormat format=MediaFormat.createVideoFormat("video/avc",width,height);
        format.setInteger(MediaFormat.KEY_COLOR_FORMAT,MediaCodecInfo.CodecCapabilities.COLOR_FormatSurface);format.setInteger(MediaFormat.KEY_BIT_RATE,Math.max(2000000,width*height*6));format.setInteger(MediaFormat.KEY_FRAME_RATE,fps);format.setInteger(MediaFormat.KEY_I_FRAME_INTERVAL,1);
        format.setInteger(MediaFormat.KEY_COLOR_STANDARD,MediaFormat.COLOR_STANDARD_BT601_NTSC);format.setInteger(MediaFormat.KEY_COLOR_RANGE,MediaFormat.COLOR_RANGE_LIMITED);format.setInteger(MediaFormat.KEY_COLOR_TRANSFER,MediaFormat.COLOR_TRANSFER_SDR_VIDEO);
        encoder=MediaCodec.createEncoderByType("video/avc");encoder.configure(format,null,null,MediaCodec.CONFIGURE_FLAG_ENCODE);inputSurface=encoder.createInputSurface();encodeEgl=EGL14.eglCreateWindowSurface(display,config,inputSurface,new int[]{EGL14.EGL_NONE},0);if(encodeEgl==EGL14.EGL_NO_SURFACE)throw eglError("Create encoder surface");encoder.start();encoderStarted=true;
        muxer=new MediaMuxer(video.getAbsolutePath(),MediaMuxer.OutputFormat.MUXER_OUTPUT_MPEG_4);
    }
    private final class Source {
        final Scene65.Clip clip;
        final boolean image;
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


        Source(Scene65.Clip clip) throws Exception {
            this.clip = clip; this.image = clip.kind.equals("image");
            try {
                if (image) {
                    int[] names=new int[1];GLES20.glGenTextures(1,names,0);textureId=names[0];
                    GLES20.glBindTexture(GLES20.GL_TEXTURE_2D,textureId);
                    GLES20.glTexParameteri(GLES20.GL_TEXTURE_2D,GLES20.GL_TEXTURE_MIN_FILTER,GLES20.GL_LINEAR);
                    GLES20.glTexParameteri(GLES20.GL_TEXTURE_2D,GLES20.GL_TEXTURE_MAG_FILTER,GLES20.GL_LINEAR);
                    GLES20.glTexParameteri(GLES20.GL_TEXTURE_2D,GLES20.GL_TEXTURE_WRAP_S,GLES20.GL_CLAMP_TO_EDGE);
                    GLES20.glTexParameteri(GLES20.GL_TEXTURE_2D,GLES20.GL_TEXTURE_WRAP_T,GLES20.GL_CLAMP_TO_EDGE);
                    Bitmap bitmap=Preview65.loadImage(owner,clip.mediaId);
                    try{android.opengl.GLUtils.texImage2D(GLES20.GL_TEXTURE_2D,0,bitmap,0);}finally{bitmap.recycle();}
                    android.opengl.Matrix.setIdentityM(transform,0);transform[5]=-1;transform[13]=1;
                    haveFrame=true;return;
                }
                String id = clip.mediaId;
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
                extractor.seekTo(clip.in,MediaExtractor.SEEK_TO_PREVIOUS_SYNC);
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
            if (image || (haveFrame && lastPts >= targetUs)) return;
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
            return; // Audio padding may extend a container slightly beyond its final video frame.
        }

        void close() {
            if (decoder != null) { try { if (decoderStarted) decoder.stop(); } catch (Exception ignored) {} decoder.release(); }
            extractor.release();
            if (surface != null) surface.release();
            if (texture != null) texture.release();
            if (textureId != 0) GLES20.glDeleteTextures(1, new int[] {textureId}, 0);
        }
    }

    void makeCurrent(EGLSurface surface)throws IOException{if(surface==EGL14.EGL_NO_SURFACE||!EGL14.eglMakeCurrent(display,surface,surface,context))throw eglError("Make current");}
    void draw(List<Scene65.Clip> active)throws IOException{
        GLES20.glViewport(0,0,width,height);GLES20.glClearColor(Color.red(scene.background)/255f,Color.green(scene.background)/255f,Color.blue(scene.background)/255f,1);GLES20.glClear(GLES20.GL_COLOR_BUFFER_BIT);
        GLES20.glEnable(GLES20.GL_BLEND);GLES20.glBlendFunc(GLES20.GL_SRC_ALPHA,GLES20.GL_ONE_MINUS_SRC_ALPHA);
        for(Scene65.Clip c:active){Source s=sources.get(c.id);int shader=s.image?imageProgram:program;GLES20.glUseProgram(shader);float[] r=scene.rectangle(c);float left=r[0]*2/width-1,right=(r[0]+r[2])*2/width-1,top=1-r[1]*2/height,bottom=1-(r[1]+r[3])*2/height;
            vertices.clear();vertices.put(new float[]{left,bottom,0,0,right,bottom,1,0,left,top,0,1,right,top,1,1});int pos=GLES20.glGetAttribLocation(shader,"aPosition"),uv=GLES20.glGetAttribLocation(shader,"aUv");vertices.position(0);GLES20.glVertexAttribPointer(pos,2,GLES20.GL_FLOAT,false,16,vertices);vertices.position(2);GLES20.glVertexAttribPointer(uv,2,GLES20.GL_FLOAT,false,16,vertices);GLES20.glEnableVertexAttribArray(pos);GLES20.glEnableVertexAttribArray(uv);
            GLES20.glUniformMatrix4fv(GLES20.glGetUniformLocation(shader,"uTransform"),1,false,s.transform,0);GLES20.glUniform1f(GLES20.glGetUniformLocation(shader,"uOpacity"),(float)c.opacity);GLES20.glActiveTexture(GLES20.GL_TEXTURE0);GLES20.glBindTexture(s.image?GLES20.GL_TEXTURE_2D:GLES11Ext.GL_TEXTURE_EXTERNAL_OES,s.textureId);GLES20.glUniform1i(GLES20.glGetUniformLocation(shader,"uVideo"),0);GLES20.glDrawArrays(GLES20.GL_TRIANGLE_STRIP,0,4);}
        int error=GLES20.glGetError();if(error!=GLES20.GL_NO_ERROR)throw new IOException("GPU error: "+error);
    }
    private static int shader(int kind, String text) throws IOException {
        int shader = GLES20.glCreateShader(kind); GLES20.glShaderSource(shader, text); GLES20.glCompileShader(shader);
        int[] result = new int[1]; GLES20.glGetShaderiv(shader, GLES20.GL_COMPILE_STATUS, result, 0);
        if (result[0] == 0) { String log = GLES20.glGetShaderInfoLog(shader); GLES20.glDeleteShader(shader); throw new IOException(log); }
        return shader;
    }

    private static int createProgram(boolean image) throws IOException {
        int vertex = shader(GLES20.GL_VERTEX_SHADER,
            "attribute vec2 aPosition; attribute vec2 aUv; uniform mat4 uTransform; varying vec2 vUv;" +
            "void main(){gl_Position=vec4(aPosition,0.,1.);vUv=(uTransform*vec4(aUv,0.,1.)).xy;}");
        int fragment;
        try { fragment = shader(GLES20.GL_FRAGMENT_SHADER,
            (image?"precision mediump float;uniform sampler2D uVideo;":"#extension GL_OES_EGL_image_external : require\nprecision mediump float;uniform samplerExternalOES uVideo;") +
            "uniform float uOpacity; varying vec2 vUv; void main(){vec4 c=texture2D(uVideo,vUv);gl_FragColor=vec4(c.rgb,c.a*uOpacity);}");
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

    void mux(File video,File audio,File out)throws Exception{
        MediaMuxer target=new MediaMuxer(out.getAbsolutePath(),MediaMuxer.OutputFormat.MUXER_OUTPUT_MPEG_4);MediaExtractor[] inputs={new MediaExtractor(),new MediaExtractor()};boolean started=false;
        try{int[] tracks=new int[2];for(int j=0;j<2;j++){inputs[j].setDataSource((j==0?video:audio).getAbsolutePath());int index=-1;for(int i=0;i<inputs[j].getTrackCount();i++)if(inputs[j].getTrackFormat(i).getString(MediaFormat.KEY_MIME).startsWith(j==0?"video/":"audio/")){index=i;break;}if(index<0)throw new IOException("Output track missing");tracks[j]=target.addTrack(inputs[j].getTrackFormat(index));inputs[j].selectTrack(index);}target.start();started=true;
            ByteBuffer data=ByteBuffer.allocate(8*1024*1024);MediaCodec.BufferInfo info=new MediaCodec.BufferInfo();for(int j=0;j<2;j++){int n;while((n=inputs[j].readSampleData(data,0))>=0){check();info.set(0,n,inputs[j].getSampleTime(),inputs[j].getSampleFlags());target.writeSampleData(tracks[j],data,info);inputs[j].advance();}}}
        finally{for(MediaExtractor input:inputs)input.release();try{if(started)target.stop();}finally{target.release();}}
    }
    void close(){if(display!=EGL14.EGL_NO_DISPLAY&&context!=EGL14.EGL_NO_CONTEXT&&previewEgl!=EGL14.EGL_NO_SURFACE)EGL14.eglMakeCurrent(display,previewEgl,previewEgl,context);
        for(Source source:sources.values())try{source.close();}catch(Exception ignored){}if(program!=0)GLES20.glDeleteProgram(program);if(imageProgram!=0)GLES20.glDeleteProgram(imageProgram);
        if(encoder!=null){try{if(encoderStarted)encoder.stop();}catch(Exception ignored){}try{encoder.release();}catch(Exception ignored){}}
        if(muxer!=null){try{if(muxStarted)muxer.stop();}catch(Exception ignored){}try{muxer.release();}catch(Exception ignored){}}
        if(display!=EGL14.EGL_NO_DISPLAY){EGL14.eglMakeCurrent(display,EGL14.EGL_NO_SURFACE,EGL14.EGL_NO_SURFACE,EGL14.EGL_NO_CONTEXT);if(encodeEgl!=EGL14.EGL_NO_SURFACE)EGL14.eglDestroySurface(display,encodeEgl);if(previewEgl!=EGL14.EGL_NO_SURFACE)EGL14.eglDestroySurface(display,previewEgl);if(context!=EGL14.EGL_NO_CONTEXT)EGL14.eglDestroyContext(display,context);EGL14.eglReleaseThread();EGL14.eglTerminate(display);}
        if(inputSurface!=null)inputSurface.release();if(audio!=null)audio.close();if(video!=null)video.delete();if(audioFile!=null)audioFile.delete();if(staging!=null)staging.delete();if(!successful&&output!=null)output.delete();
    }
}
