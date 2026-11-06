package com.varnalabs.mobile;

import android.graphics.*;
import android.net.Uri;
import android.os.*;
import android.view.*;
import android.widget.*;
import androidx.media3.common.*;
import androidx.media3.exoplayer.*;
import java.io.*;
import java.util.*;

/** Native media surfaces above the WebView; no video bitmaps cross the JS bridge.
 * Uses the same immutable graph, rectangles, source times and audio mixer as export.
 */
final class Preview65 {
    final MainActivity owner;final Scene65 scene;final Audio65 audio;final String token;final long snapshotBaseline;
    final Handler main=new Handler(Looper.getMainLooper());final FrameLayout frame;
    final LinkedHashMap<String,Node> nodes=new LinkedHashMap<>();final HashMap<String,float[]> drag=new HashMap<>();
    volatile boolean closed,playing;boolean presented,visible;volatile long timeUs;volatile String error;
    volatile int[] screenRect={0,0,0,0};Audio65.Playback clock;String seekRequest;long seekDeadline;int sequence;String order="";long lastEmit;
    final Runnable tick=this::tick;
    final class Node {
        final Scene65.Clip clip;final View view;ExoPlayer player;Bitmap bitmap;boolean ready,loading,seenFrame;long lastCorrection;int[] rectangle;
        Node(Scene65.Clip c)throws Exception{clip=c;
            if(c.kind.equals("video")){
                TextureView video=new TextureView(owner);view=video;player=new ExoPlayer.Builder(owner).build();
                player.setTrackSelectionParameters(player.getTrackSelectionParameters().buildUpon().setTrackTypeDisabled(C.TRACK_TYPE_AUDIO,true).build());
                player.setVolume(0);player.setSeekParameters(SeekParameters.EXACT);player.setVideoTextureView(video);
                player.addListener(new Player.Listener(){public void onRenderedFirstFrame(){ready=true;seenFrame=true;}public void onPlayerError(PlaybackException e){error=e.getErrorCodeName()+": "+e.getMessage();}});
                player.setMediaItem(MediaItem.fromUri(Uri.fromFile(owner.mediaFile(c.mediaId))));player.seekTo(c.sourceTime(timeUs)/1000);player.prepare();
            }else{ImageView image=new ImageView(owner);image.setScaleType(ImageView.ScaleType.FIT_XY);view=image;loading=true;
                owner.editor65.worker.execute(()->{Bitmap decoded=null;String failure=null;try{decoded=loadImage(owner,c.mediaId);}catch(Exception e){failure=e.getMessage();}final Bitmap loaded=decoded;final String message=failure;
                    main.post(()->{if(closed||nodes.get(c.id)!=this){if(loaded!=null)loaded.recycle();return;}loading=false;if(message!=null)error=message;else{bitmap=loaded;image.setImageBitmap(bitmap);ready=true;}});});}
            view.setClickable(false);frame.addView(view);
        }
        void close(){if(player!=null)player.release();frame.removeView(view);if(bitmap!=null){((ImageView)view).setImageDrawable(null);bitmap.recycle();}}
    }
    Preview65(MainActivity owner,Scene65 scene,Audio65 audio,String token,long position)throws Exception{
        this.owner=owner;this.scene=scene;this.audio=audio;this.token=token;snapshotBaseline=owner.playback59.snapshots.get();timeUs=position;frame=new FrameLayout(owner);frame.setClipChildren(true);frame.setBackgroundColor(scene.background);
        ((FrameLayout)owner.web.getParent()).addView(frame,new FrameLayout.LayoutParams(1,1));frame.setAlpha(0);
    }
    static Bitmap loadImage(MainActivity owner,String id)throws Exception{
        String file=owner.mediaFile(id).getAbsolutePath();BitmapFactory.Options options=new BitmapFactory.Options();options.inJustDecodeBounds=true;BitmapFactory.decodeFile(file,options);
        if(options.outWidth<=0||options.outHeight<=0)throw new IOException("Image cannot be decoded");
        options.inSampleSize=1;while(Math.max(options.outWidth,options.outHeight)/options.inSampleSize>2048)options.inSampleSize*=2;
        options.inJustDecodeBounds=false;options.inPremultiplied=false;options.inPreferredColorSpace=ColorSpace.get(ColorSpace.Named.SRGB);Bitmap bitmap=BitmapFactory.decodeFile(file,options);if(bitmap==null)throw new IOException("Image cannot be decoded");
        int orientation=imageOrientation(file);Matrix transform=new Matrix();switch(orientation){case 2:transform.setScale(-1,1);break;case 3:transform.setRotate(180);break;case 4:transform.setScale(1,-1);break;case 5:transform.setRotate(90);transform.postScale(-1,1);break;case 6:transform.setRotate(90);break;case 7:transform.setRotate(-90);transform.postScale(-1,1);break;case 8:transform.setRotate(-90);break;default:return bitmap;}
        Bitmap rotated=Bitmap.createBitmap(bitmap,0,0,bitmap.getWidth(),bitmap.getHeight(),transform,true);if(rotated!=bitmap)bitmap.recycle();return rotated;
    }
    static int imageOrientation(String file){try{return new android.media.ExifInterface(file).getAttributeInt(android.media.ExifInterface.TAG_ORIENTATION,1);}catch(IOException ignored){return 1;}}
    static org.json.JSONObject probe(MainActivity owner,String id)throws Exception{String file=owner.mediaFile(id).getAbsolutePath();BitmapFactory.Options bounds=new BitmapFactory.Options();bounds.inJustDecodeBounds=true;BitmapFactory.decodeFile(file,bounds);if(bounds.outWidth<1)return owner.playback59.probe(id);int orientation=imageOrientation(file);boolean swap=orientation>=5&&orientation<=8;org.json.JSONObject result=new org.json.JSONObject();result.put("kind","image");result.put("duration",86400);result.put("width",swap?bounds.outHeight:bounds.outWidth);result.put("height",swap?bounds.outWidth:bounds.outHeight);result.put("rotation",0);return result;}
    void layout(String data)throws Exception{
        org.json.JSONObject b=new org.json.JSONObject(data);double x=Scene65.number(b,"x",0,0,1),y=Scene65.number(b,"y",0,0,1),w=Scene65.number(b,"w",1,0,1),h=Scene65.number(b,"h",1,0,1);
        int fw=Math.max(1,(int)Math.round(owner.web.getWidth()*w)),fh=Math.max(1,(int)Math.round(owner.web.getHeight()*h));
        FrameLayout.LayoutParams params=new FrameLayout.LayoutParams(fw,fh);params.leftMargin=(int)Math.round(owner.web.getWidth()*x);params.topMargin=(int)Math.round(owner.web.getHeight()*y);
        frame.setLayoutParams(params);visible=b.optBoolean("visible",false);frame.setAlpha(visible&&presented?1:0);int[] at=new int[2];owner.web.getLocationOnScreen(at);screenRect=new int[]{at[0]+params.leftMargin,at[1]+params.topMargin,fw,fh};
        if(!b.optBoolean("visible",false)&&(playing||clock!=null))pause();update();
    }
    void seek(String request,long target){if(seekRequest!=null)owner.callback(seekRequest,state(),null);seekRequest=request;pause();timeUs=Math.max(0,Math.min(scene.durationUs,target));sequence++;seekDeadline=SystemClock.elapsedRealtime()+15000;
        try{update();for(Node n:nodes.values())if(n.player!=null){n.ready=false;n.player.seekTo(n.clip.sourceTime(timeUs)/1000);}}catch(Exception e){error=e.getMessage();}
        main.removeCallbacks(tick);main.post(tick);
    }
    void update()throws Exception{
        Set<String> active=new HashSet<>();List<Scene65.Clip> rows=scene.visual(Math.min(timeUs,scene.durationUs-1));StringBuilder currentOrder=new StringBuilder();for(Scene65.Clip c:rows)currentOrder.append(c.id).append("/");boolean reorder=!order.equals(currentOrder.toString());order=currentOrder.toString();
        for(Scene65.Clip c:rows)active.add(c.id);
        Iterator<Map.Entry<String,Node>> it=nodes.entrySet().iterator();while(it.hasNext()){Node n=it.next().getValue();if(!active.contains(n.clip.id)){n.close();it.remove();}}
        for(Scene65.Clip c:rows){Node n=nodes.get(c.id);if(n==null){n=new Node(c);nodes.put(c.id,n);}if(reorder)n.view.bringToFront();float[] r=scene.rectangle(c);float[] d=drag.get(c.id);if(d!=null){r[0]+=(d[0]-c.x)*scene.width/100;r[1]+=(d[1]-c.y)*scene.height/100;}int width=Math.max(1,Math.round(r[2]*Math.max(1,frame.getLayoutParams().width)/scene.width)),height=Math.max(1,Math.round(r[3]*Math.max(1,frame.getLayoutParams().height)/scene.height));
            FrameLayout.LayoutParams p=new FrameLayout.LayoutParams(width,height);p.leftMargin=Math.round(r[0]*frame.getLayoutParams().width/scene.width);p.topMargin=Math.round(r[1]*frame.getLayoutParams().height/scene.height);if(n.rectangle==null||n.rectangle[0]!=p.leftMargin||n.rectangle[1]!=p.topMargin||n.rectangle[2]!=width||n.rectangle[3]!=height){n.view.setLayoutParams(p);n.rectangle=new int[]{p.leftMargin,p.topMargin,width,height};}if(n.view.getAlpha()!=(float)c.opacity)n.view.setAlpha((float)c.opacity);
            if(n.player!=null){long wanted=c.sourceTime(timeUs)/1000;if(playing&&n.player.getPlaybackState()==Player.STATE_READY&&SystemClock.elapsedRealtime()-n.lastCorrection>400&&Math.abs(n.player.getCurrentPosition()-wanted)>45){n.player.seekTo(wanted);n.lastCorrection=SystemClock.elapsedRealtime();}if(n.player.getPlayWhenReady()!=playing)n.player.setPlayWhenReady(playing);}}
    }
    void transform(String id,double x,double y){try{if(id==null){drag.clear();}else{if(!Double.isFinite(x)||!Double.isFinite(y)||x< -100||x>100||y< -100||y>100)throw new IOException("Invalid drag position");drag.put(id,new float[]{(float)x,(float)y});}update();}catch(Exception e){error=e.getMessage();emit();}}
    void play(){if(closed)return;pause();owner.getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);error=null;clock=audio.play(timeUs,scene.durationUs);playing=true;main.removeCallbacks(tick);main.post(tick);}
    void pause(){if(clock!=null){timeUs=clock.position();clock.stop();clock=null;}playing=false;if(owner.editor65.export==null&&!owner.exporting)owner.getWindow().clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);for(Node n:nodes.values())if(n.player!=null)n.player.pause();emit();}
    void tick(){if(closed)return;
        try{
            if(playing&&clock!=null){timeUs=clock.position();if(clock.error!=null)throw new IOException(clock.error);if(clock.finished||timeUs>=scene.durationUs){timeUs=scene.durationUs;pause();}}
            update();boolean ready=true;for(Node n:nodes.values())if(!n.ready&&n.seenFrame&&n.player!=null&&n.player.getPlaybackState()==Player.STATE_READY&&n.player.getCurrentPosition()==n.clip.sourceTime(timeUs)/1000)n.ready=true;
            for(Node n:nodes.values())ready&=n.ready;
            if(ready){presented=true;frame.setAlpha(visible?1:0);}
            if(error!=null)throw new IOException(error);
            if(seekRequest!=null){if(ready){String request=seekRequest;seekRequest=null;owner.callback(request,state(),null);}else if(SystemClock.elapsedRealtime()>seekDeadline)throw new IOException("Native surface did not become ready");}
            if(SystemClock.elapsedRealtime()-lastEmit>=50||!playing){lastEmit=SystemClock.elapsedRealtime();emit();}if(playing||seekRequest!=null)main.postDelayed(tick,33);
        }catch(Exception e){error=e.getMessage();playing=false;if(clock!=null){clock.stop();clock=null;}if(seekRequest!=null){owner.callback(seekRequest,null,error);seekRequest=null;}emit();}
    }
    void capture(String request){try{pause();Bitmap image=Bitmap.createBitmap(scene.width,scene.height,Bitmap.Config.ARGB_8888);Canvas canvas=new Canvas(image);canvas.drawColor(scene.background);Paint paint=new Paint(Paint.ANTI_ALIAS_FLAG|Paint.FILTER_BITMAP_FLAG);
        for(Scene65.Clip c:scene.visual(Math.min(timeUs,scene.durationUs-1))){Node n=nodes.get(c.id);if(n==null||!n.ready)throw new IOException("Preview is not ready for PNG");Bitmap source=n.player!=null?((TextureView)n.view).getBitmap():n.bitmap;if(source==null)throw new IOException("Video surface is unavailable");float[] r=scene.rectangle(c);paint.setAlpha((int)Math.round(c.opacity*255));canvas.drawBitmap(source,null,new RectF(r[0],r[1],r[0]+r[2],r[1]+r[3]),paint);if(n.player!=null)source.recycle();}
        owner.frames59.execute(()->{try{File file=owner.exportFile("Frame_"+System.currentTimeMillis()+".png");try(FileOutputStream output=new FileOutputStream(file)){if(!image.compress(Bitmap.CompressFormat.PNG,100,output))throw new IOException("Cannot encode PNG");}owner.callback(request,org.json.JSONObject.quote(file.getName()),null);}catch(Exception e){owner.callback(request,null,e.getMessage());}finally{image.recycle();}});
    }catch(Exception e){owner.callback(request,null,e.getMessage());}}
    org.json.JSONObject state(){org.json.JSONObject result=new org.json.JSONObject();try{result.put("session",token);result.put("time",timeUs/1000000.0);result.put("playing",playing);result.put("renderer","native surfaces");result.put("audioClock",audio.entries.isEmpty()?"monotonic":"AudioTrack 48000 Hz");result.put("audioEntries",audio.entries.size());result.put("videoFrameBridgeCalls",owner.playback59.snapshots.get()-snapshotBaseline);result.put("totalLegacySnapshots",owner.playback59.snapshots.get());result.put("error",error==null?org.json.JSONObject.NULL:error);result.put("rect",new org.json.JSONArray(screenRect));}catch(Exception ignored){}return result;}
    void emit(){org.json.JSONObject data=state();owner.web.evaluateJavascript("window.MobileTimeline65&&MobileTimeline65("+data.toString()+")",null);}
    void close(){if(closed)return;pause();closed=true;main.removeCallbacks(tick);if(seekRequest!=null){owner.callback(seekRequest,null,"Preview replaced");seekRequest=null;}for(Node n:nodes.values())n.close();nodes.clear();((FrameLayout)owner.web.getParent()).removeView(frame);audio.close();}
}
