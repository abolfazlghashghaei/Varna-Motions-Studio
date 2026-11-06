package com.varnalabs.mobile;

import android.media.*;
import android.os.SystemClock;
import java.io.*;
import java.nio.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.function.BooleanSupplier;

/** Calibrate codec priming once, then remove only whole priming AAC frames.
 * No device-specific fixed delay: the remaining sub-frame delay is <1024 samples.
 */
final class Aac65 {
    interface Samples { byte[] block(long at,int count)throws Exception; }
    static final ConcurrentHashMap<String,Integer> DELAYS=new ConcurrentHashMap<>();
    static MediaFormat format(){MediaFormat f=MediaFormat.createAudioFormat("audio/mp4a-latm",48000,2);f.setInteger(MediaFormat.KEY_AAC_PROFILE,MediaCodecInfo.CodecProfileLevel.AACObjectLC);f.setInteger(MediaFormat.KEY_BIT_RATE,192000);return f;}
    static int encode(MainActivity owner,File file,long frames,Samples samples,BooleanSupplier cancel,Audio65.Progress progress)throws Exception{
        String name=new MediaCodecList(MediaCodecList.REGULAR_CODECS).findEncoderForFormat(format());if(name==null)throw new IOException("AAC encoder unavailable");
        Integer delay=DELAYS.get(name);if(delay==null){progress.update("audio calibration",0,1);delay=calibrate(owner,name,cancel);DELAYS.put(name,delay);progress.update("audio calibration",1,1);}
        write(file,name,frames,samples,(delay/1024)*1024,cancel,progress);return delay;
    }
    static int calibrate(MainActivity owner,String codec,BooleanSupplier cancel)throws Exception{
        final float[] reference=new float[8192];for(int i=2048;i<6144;i++){double t=(i-2048)/48000.0;reference[i]=(float)(.35*Math.sin(2*Math.PI*(200*t+40000*t*t)));}
        File probe=new File(owner.getCacheDir(),"aac65-probe-"+System.nanoTime()+".m4a");
        try{write(probe,codec,reference.length,(at,count)->{ByteBuffer b=ByteBuffer.allocate(count*4).order(ByteOrder.LITTLE_ENDIAN);for(int i=0;i<count;i++){short sample=(short)Math.round(reference[(int)at+i]*32767);b.putShort(sample);b.putShort(sample);}return b.array();},0,cancel,(s,n,t)->{});
            float[] decoded=decode(probe,cancel);double best=-1;int lag=0;
            for(int shift=0;shift<=4096;shift++){double cross=0,energy=0,refEnergy=0;for(int i=0;i<2048;i++){int at=3072+i+shift;if(at>=decoded.length)break;double a=reference[3072+i],b=decoded[at];cross+=a*b;energy+=b*b;refEnergy+=a*a;}double score=cross/Math.sqrt(Math.max(1e-12,energy*refEnergy));if(score>best){best=score;lag=shift;}}
            if(best<.75)throw new IOException("Cannot establish AAC priming safely");return lag;
        }finally{probe.delete();}
    }
    static void write(File file,String name,long total,Samples samples,int trim,BooleanSupplier cancel,Audio65.Progress progress)throws Exception{
        MediaCodec encoder=null;MediaMuxer muxer=null;boolean started=false,muxStarted=false,success=false;long firstPts=Long.MIN_VALUE;
        try{encoder=MediaCodec.createByCodecName(name);encoder.configure(format(),null,null,MediaCodec.CONFIGURE_FLAG_ENCODE);encoder.start();started=true;muxer=new MediaMuxer(file.getAbsolutePath(),MediaMuxer.OutputFormat.MUXER_OUTPUT_MPEG_4);
            long at=0,deadline=SystemClock.elapsedRealtime()+300000;int track=-1;boolean inputEnd=false,outputEnd=false;MediaCodec.BufferInfo info=new MediaCodec.BufferInfo();
            while(!outputEnd){Audio65.check(cancel);if(SystemClock.elapsedRealtime()>deadline)throw new IOException("AAC encoding timeout");
                if(!inputEnd){int index=encoder.dequeueInputBuffer(1000);if(index>=0){ByteBuffer b=encoder.getInputBuffer(index);b.clear();int count=(int)Math.min(Math.min(1024,b.remaining()/4),total-at);byte[] data=samples.block(at,count);b.put(data);encoder.queueInputBuffer(index,0,data.length,at*1000000/48000,count==0?MediaCodec.BUFFER_FLAG_END_OF_STREAM:0);at+=count;inputEnd=count==0;progress.update("audio encoding",(int)at,(int)total);}}
                int index=encoder.dequeueOutputBuffer(info,1000);if(index==MediaCodec.INFO_OUTPUT_FORMAT_CHANGED){track=muxer.addTrack(encoder.getOutputFormat());muxer.start();muxStarted=true;}
                else if(index>=0){ByteBuffer b=encoder.getOutputBuffer(index);if((info.flags&MediaCodec.BUFFER_FLAG_CODEC_CONFIG)!=0)info.size=0;
                    if(info.size>0){if(!muxStarted)throw new IOException("AAC format unavailable");if(firstPts==Long.MIN_VALUE)firstPts=info.presentationTimeUs;long time=info.presentationTimeUs-firstPts-trim*1000000L/48000;
                        if(time>=0){b.position(info.offset);b.limit(info.offset+info.size);info.presentationTimeUs=time;muxer.writeSampleData(track,b,info);}}
                    outputEnd=(info.flags&MediaCodec.BUFFER_FLAG_END_OF_STREAM)!=0;encoder.releaseOutputBuffer(index,false);}}
            muxer.stop();muxStarted=false;success=true;
        }finally{if(encoder!=null){try{if(started)encoder.stop();}finally{encoder.release();}}if(muxer!=null){try{if(muxStarted)muxer.stop();}finally{muxer.release();}}if(!success)file.delete();}
    }
    static float[] decode(File file,BooleanSupplier cancel)throws Exception{
        MediaExtractor source=new MediaExtractor();MediaCodec decoder=null;boolean started=false;float[] pcm=new float[20000];int used=0;
        try{source.setDataSource(file.getAbsolutePath());source.selectTrack(0);MediaFormat f=source.getTrackFormat(0);decoder=MediaCodec.createDecoderByType(f.getString(MediaFormat.KEY_MIME));decoder.configure(f,null,null,0);decoder.start();started=true;
            boolean inputEnd=false,outputEnd=false;int channels=2,encoding=2;MediaCodec.BufferInfo info=new MediaCodec.BufferInfo();long deadline=SystemClock.elapsedRealtime()+30000;
            while(!outputEnd){Audio65.check(cancel);if(SystemClock.elapsedRealtime()>deadline)throw new IOException("AAC calibration decode timeout");
                if(!inputEnd){int i=decoder.dequeueInputBuffer(1000);if(i>=0){ByteBuffer b=decoder.getInputBuffer(i);int n=source.readSampleData(b,0);if(n<0){decoder.queueInputBuffer(i,0,0,0,MediaCodec.BUFFER_FLAG_END_OF_STREAM);inputEnd=true;}else{decoder.queueInputBuffer(i,0,n,source.getSampleTime(),0);source.advance();}}}
                int i=decoder.dequeueOutputBuffer(info,1000);if(i==MediaCodec.INFO_OUTPUT_FORMAT_CHANGED){f=decoder.getOutputFormat();channels=f.getInteger(MediaFormat.KEY_CHANNEL_COUNT);encoding=f.containsKey(MediaFormat.KEY_PCM_ENCODING)?f.getInteger(MediaFormat.KEY_PCM_ENCODING):2;if(f.getInteger(MediaFormat.KEY_SAMPLE_RATE)!=48000||(encoding!=2&&encoding!=4))throw new IOException("Unsupported AAC calibration PCM");}
                else if(i>=0){ByteBuffer b=decoder.getOutputBuffer(i).order(ByteOrder.LITTLE_ENDIAN);int bytes=encoding==4?4:2,count=info.size/(channels*bytes);if(used+count>pcm.length)throw new IOException("Calibration PCM too large");for(int n=0;n<count;n++)pcm[used++]=encoding==4?b.getFloat(info.offset+n*channels*bytes):b.getShort(info.offset+n*channels*bytes)/32768f;outputEnd=(info.flags&MediaCodec.BUFFER_FLAG_END_OF_STREAM)!=0;decoder.releaseOutputBuffer(i,false);}}
            return java.util.Arrays.copyOf(pcm,used);
        }finally{if(decoder!=null){try{if(started)decoder.stop();}finally{decoder.release();}}source.release();}
    }
}
