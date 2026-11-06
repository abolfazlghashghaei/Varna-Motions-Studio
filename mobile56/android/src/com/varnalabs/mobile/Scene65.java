package com.varnalabs.mobile;

import android.graphics.Color;
import java.io.IOException;
import java.util.*;
import org.json.*;

/** Immutable validated media graph shared by native preview and export. */
final class Scene65 {
    final int width, height, fps, background;
    final long durationUs;
    final List<Clip> clips = new ArrayList<>();
    final List<Clip> audio = new ArrayList<>();
    static final class Clip {
        final String id, mediaId, kind, fit;
        final long start, in, out, end;
        final double x, y, scale, opacity, gain, fadeIn, fadeOut;
        final int width, height;
        Clip(JSONObject c) throws Exception {
            id = c.getString("id"); mediaId = c.getString("mediaId"); kind = c.getString("kind");
            if (!id.matches("[A-Za-z0-9_-]{1,160}") || !mediaId.matches("[a-f0-9-]{36}") ||
                !Arrays.asList("video","image","audio").contains(kind)) throw new IOException("Invalid scene media reference");
            start = integer(c,"startUs",0,180000000); in = integer(c,"inUs",0,86400000000L);
            out = integer(c,"outUs",in+1,86400000000L); end = start+out-in;
            if (end > 180000000) throw new IOException("Native MVP supports projects up to 3 minutes");
            x = number(c,"x",0,-100,100); y = number(c,"y",0,-100,100);
            scale = number(c,"scale",100,1,400); opacity = number(c,"opacity",1,0,1);
            gain = number(c,"gain",1,0,3); fadeIn = number(c,"fadeIn",0,0,30); fadeOut = number(c,"fadeOut",0,0,30);
            fit = c.optString("fit","contain");
            if (!fit.equals("contain") && !fit.equals("cover")) throw new IOException("Unsupported fit");
            width = c.optInt("width",0); height = c.optInt("height",0);
            if (!kind.equals("audio") && (width < 1 || height < 1 || width > 65536 || height > 65536))
                throw new IOException("Invalid source dimensions");
        }
        boolean active(long t) { return t >= start && t < end; }
        long sourceTime(long t) { return in + t - start; }
        double gainAt(long t) {
            return gain * Math.max(0,Math.min(1,Math.min(fadeIn>0?(t-start)/1000000.0/fadeIn:1,
                fadeOut>0?(end-t)/1000000.0/fadeOut:1)));
        }
    }
    Scene65(String json) throws Exception {this(json,false);}
    Scene65(String json,boolean offlineAudio) throws Exception {
        if (json == null || json.length() > 4*1024*1024) throw new IOException("Scene is too large");
        JSONObject p = new JSONObject(json);
        if (!p.getString("format").equals("varna-native-scene") || p.getInt("version") != 1)
            throw new IOException("Unsupported native graph version");
        width = (int)integer(p,"width",160,1920); height = (int)integer(p,"height",90,1920);
        fps = (int)integer(p,"fps",12,30); durationUs = integer(p,"durationUs",1,180000000);
        if (width%2!=0 || height%2!=0 || (long)width*height>2073600) throw new IOException("Native graph supports up to 1080p");
        background = Color.parseColor(p.optString("background","#000000"));
        JSONArray a = p.getJSONArray("clips");
        if (a.length()>256) throw new IOException("Too many clips");
        Set<String> ids = new HashSet<>();
        TreeMap<Long,int[]> counts = new TreeMap<>();
        for (int i=0;i<a.length();i++) {
            Clip c = new Clip(a.getJSONObject(i));
            if (!ids.add(c.id)) throw new IOException("Duplicate clip ID");
            if (c.end>durationUs) throw new IOException("Clip exceeds project duration");
            clips.add(c);
            if (!c.kind.equals("image") && c.gain>0) audio.add(c);
            int k = c.kind.equals("video")?0:c.kind.equals("image")?1:2;
            counts.computeIfAbsent(c.start,t->new int[3])[k]++;
            counts.computeIfAbsent(c.end,t->new int[3])[k]--;
        }
        int[] active = new int[3];
        for (int[] change:counts.values()) {
            for(int i=0;i<3;i++)active[i]+=change[i];
            if(active[0]>2 || active[1]>4 || active[0]+active[2]>(offlineAudio?64:8))
                throw new IOException("Native preview budget: 2 video, 4 image and 8 audible layers at once");
        }
    }
    List<Clip> visual(long time) {
        List<Clip> rows = new ArrayList<>();
        for(Clip c:clips)if(!c.kind.equals("audio")&&c.active(time))rows.add(c);
        return rows;
    }
    float[] rectangle(Clip c) {
        double fit = c.fit.equals("cover")?Math.max((double)width/c.width,(double)height/c.height):Math.min((double)width/c.width,(double)height/c.height);
        double w = c.width*fit*c.scale/100, h = c.height*fit*c.scale/100;
        return new float[]{(float)(width*.5+c.x*width/100-w*.5),(float)(height*.5+c.y*height/100-h*.5),(float)w,(float)h};
    }
    static long integer(JSONObject p,String key,long lo,long hi) throws Exception {
        double n = p.getDouble(key);
        if(!Double.isFinite(n)||n!=Math.rint(n)||n<lo||n>hi)throw new IOException("Invalid "+key);
        return (long)n;
    }
    static double number(JSONObject p,String key,double def,double lo,double hi)throws Exception {
        double n = p.optDouble(key,def);
        if(!Double.isFinite(n)||n<lo||n>hi)throw new IOException("Invalid "+key);
        return n;
    }
}
