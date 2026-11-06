package com.varnalabs.mobile;
import android.os.*;
import org.json.*;
import java.io.*;
import java.util.concurrent.*;

/** Serial preparation, UI-thread preview ownership and independent immutable exports. */
final class Editor65 {
    final MainActivity owner;final Handler main=new Handler(Looper.getMainLooper());final ExecutorService worker=Executors.newSingleThreadExecutor();
    volatile long generation;volatile Preview65 preview;volatile Export65 export;volatile boolean destroyed;
    Editor65(MainActivity owner){this.owner=owner;}
    void open(String request,String json,long position,String bounds){main.post(()->{
        long revision=++generation;if(preview!=null){preview.close();preview=null;}owner.playback59.close();
        worker.execute(()->{Audio65 audio=null;try{
            Scene65 scene=new Scene65(json);for(Scene65.Clip c:scene.clips)owner.mediaFile(c.mediaId);
            audio=new Audio65(owner,scene,()->destroyed||generation!=revision,(s,n,t)->{});Audio65 prepared=audio;
            main.post(()->{if(destroyed||revision!=generation){prepared.close();owner.callback(request,null,"Preview replaced");return;}
                try{preview=new Preview65(owner,scene,prepared,request,position);preview.layout(bounds);preview.seek(request,position);}catch(Exception e){if(preview!=null){preview.close();preview=null;}owner.callback(request,null,e.getMessage());}});
        }catch(Exception e){if(audio!=null)audio.close();owner.callback(request,null,e.getMessage());}});
    });}
    void seek(String request,long time){main.post(()->{if(preview==null){owner.callback(request,null,"Native preview is not ready");return;}preview.seek(request,time);});}
    void play(String request){main.post(()->{if(preview==null){owner.callback(request,null,"Native preview is not ready");return;}preview.play();owner.callback(request,preview.state(),null);});}
    void transform(String id,double x,double y){main.post(()->{if(preview!=null)preview.transform(id,x,y);});}
    void capture(String request){main.post(()->{if(preview==null)owner.callback(request,null,"Preview is not ready");else preview.capture(request);});}
    void pause(){main.post(()->{if(preview!=null)preview.pause();});}
    void layout(String data){main.post(()->{try{if(preview!=null)preview.layout(data);}catch(Exception e){owner.web.evaluateJavascript("window.MobileError65&&MobileError65("+JSONObject.quote(e.getMessage())+")",null);}});}
    void closePreview(){main.post(()->{++generation;if(preview!=null){preview.close();preview=null;}});}
    void render(String request,String json){main.post(()->{if(export!=null||owner.exporting){owner.callback(request,null,"Another export is running");return;}
        ++generation;if(preview!=null){preview.close();preview=null;}owner.playback59.close();
        try{export=new Export65(owner,request,json);owner.getWindow().addFlags(android.view.WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);export.start();}catch(Exception e){owner.getWindow().clearFlags(android.view.WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);owner.callback(request,null,e.getMessage());}});}
    JSONObject state(){Preview65 p=preview;return p==null?new JSONObject():p.state();}
    void cancelExport(){Export65 current=export;if(current!=null)current.cancel();}
    void close(){destroyed=true;closePreview();cancelExport();worker.shutdown();}
}
