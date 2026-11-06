package com.varnalabs.mobile;

import android.media.*;
import android.os.SystemClock;
import java.io.*;
import java.nio.*;
import java.security.MessageDigest;
import java.util.*;
import java.util.function.BooleanSupplier;

/** Bounded-memory audio graph: decode trimmed clips to disposable PCM cache,
 * mix blocks for both AudioTrack playback and AAC export on one 48kHz clock. */
final class Audio65 implements AutoCloseable {
    static final int RATE=48000, BLOCK=1024;
    static final Object CACHE_LOCK=new Object();
    final List<Entry> entries=new ArrayList<>();
    static final class Entry { final Scene65.Clip clip; final File pcm; Entry(Scene65.Clip c,File f){clip=c;pcm=f;} }
    interface Progress { void update(String stage,int current,int total); }
    Audio65(MainActivity owner,Scene65 scene,BooleanSupplier cancel,Progress progress)throws Exception {
        File folder=new File(owner.getCacheDir(),"pcm65");if(!folder.exists()&&!folder.mkdirs())throw new IOException("Cannot create audio cache");
        synchronized(CACHE_LOCK) {
        long usable=folder.getUsableSpace();
        for(int i=0;i<scene.audio.size();i++) {
            check(cancel);Scene65.Clip c=scene.audio.get(i);File source=owner.mediaFile(c.mediaId);
            String key=c.mediaId+":"+source.length()+":"+source.lastModified()+":"+c.in+":"+c.out;
            byte[] hash=MessageDigest.getInstance("SHA-256").digest(key.getBytes("UTF-8"));StringBuilder name=new StringBuilder();
            for(byte b:hash)name.append(String.format(java.util.Locale.ROOT,"%02x",b&255));
            File pcm=new File(folder,name+".pcm");long expected=((c.out-c.in)*RATE+999999)/1000000*4;
            if(!pcm.isFile()||pcm.length()!=expected) {
                if(expected>usable-32L*1024*1024)throw new IOException("Not enough space for trimmed audio cache");
                File temporary=new File(folder,name+".part");temporary.delete();
                boolean audio=false;
                try { audio=decode(owner,c,temporary,expected,cancel);check(cancel);if(audio&&!temporary.renameTo(pcm))throw new IOException("Cannot publish audio cache"); }
                finally { temporary.delete(); }
                if(!audio){progress.update("audio preparation",i+1,scene.audio.size());continue;}
                usable-=expected;
            }
            pcm.setLastModified(System.currentTimeMillis());entries.add(new Entry(c,pcm));
            progress.update("audio preparation",i+1,scene.audio.size());
        }
        // Disposable caches are not project assets. Never delete a cache used by this graph.
        File[] all=folder.listFiles((d,n)->n.endsWith(".pcm"));long bytes=0;
        if(all!=null){Arrays.sort(all,Comparator.comparingLong(File::lastModified));for(File f:all)bytes+=f.length();
            for(File f:all)if(bytes>256L*1024*1024&&!entries.stream().anyMatch(e->e.pcm.equals(f))){long n=f.length();if(f.delete())bytes-=n;}}
        }
    }
    static void check(BooleanSupplier cancel)throws IOException{if(cancel.getAsBoolean())throw new IOException("Operation cancelled");}
    static boolean decode(MainActivity owner,Scene65.Clip c,File output,long bytes,BooleanSupplier cancel)throws Exception {
        MediaExtractor extractor=new MediaExtractor();MediaCodec decoder=null;boolean started=false;
        try(RandomAccessFile file=new RandomAccessFile(output,"rw")) {
            extractor.setDataSource(owner.mediaFile(c.mediaId).getAbsolutePath());MediaFormat format=null;
            for(int i=0;i<extractor.getTrackCount();i++)if(extractor.getTrackFormat(i).getString(MediaFormat.KEY_MIME).startsWith("audio/")){format=extractor.getTrackFormat(i);extractor.selectTrack(i);break;}
            if(format==null)return false;
            file.setLength(bytes);extractor.seekTo(c.in,MediaExtractor.SEEK_TO_PREVIOUS_SYNC);
            decoder=MediaCodec.createDecoderByType(format.getString(MediaFormat.KEY_MIME));decoder.configure(format,null,null,0);decoder.start();started=true;
            int rate=format.getInteger(MediaFormat.KEY_SAMPLE_RATE),channels=format.getInteger(MediaFormat.KEY_CHANNEL_COUNT),encoding=AudioFormat.ENCODING_PCM_16BIT;
            boolean inputEnd=false,outputEnd=false;MediaCodec.BufferInfo info=new MediaCodec.BufferInfo();long deadline=SystemClock.elapsedRealtime()+180000;
            while(!outputEnd){check(cancel);if(SystemClock.elapsedRealtime()>deadline)throw new IOException("Audio preparation timeout");
                if(!inputEnd){int i=decoder.dequeueInputBuffer(1000);if(i>=0){ByteBuffer b=decoder.getInputBuffer(i);long pts=extractor.getSampleTime();int n=pts<0||pts>=c.out?-1:extractor.readSampleData(b,0);if(n<0){decoder.queueInputBuffer(i,0,0,0,MediaCodec.BUFFER_FLAG_END_OF_STREAM);inputEnd=true;}else{decoder.queueInputBuffer(i,0,n,pts,0);extractor.advance();}}}
                int i=decoder.dequeueOutputBuffer(info,1000);
                if(i==MediaCodec.INFO_OUTPUT_FORMAT_CHANGED){format=decoder.getOutputFormat();rate=format.getInteger(MediaFormat.KEY_SAMPLE_RATE);channels=format.getInteger(MediaFormat.KEY_CHANNEL_COUNT);encoding=format.containsKey(MediaFormat.KEY_PCM_ENCODING)?format.getInteger(MediaFormat.KEY_PCM_ENCODING):AudioFormat.ENCODING_PCM_16BIT;
                    if((encoding!=AudioFormat.ENCODING_PCM_FLOAT&&encoding!=AudioFormat.ENCODING_PCM_16BIT)||channels<1||channels>8||rate<8000||rate>192000)throw new IOException("Unsupported decoded audio format");}
                else if(i>=0){ByteBuffer b=decoder.getOutputBuffer(i).order(ByteOrder.LITTLE_ENDIAN);int sampleBytes=encoding==AudioFormat.ENCODING_PCM_FLOAT?4:2,frames=info.size/(channels*sampleBytes);
                    long first=Math.max(0,(long)Math.ceil((info.presentationTimeUs-c.in)*RATE/1000000.0));
                    long last=Math.min(bytes/4,(long)Math.ceil(((info.presentationTimeUs-c.in)/1000000.0+(double)frames/rate)*RATE));
                    byte[] chunk=new byte[BLOCK*4];long at=first;
                    while(at<last){check(cancel);int count=(int)Math.min(BLOCK,last-at);ByteBuffer target=ByteBuffer.wrap(chunk).order(ByteOrder.LITTLE_ENDIAN);
                        for(int n=0;n<count;n++){double source=((at+n)/(double)RATE+c.in/1000000.0-info.presentationTimeUs/1000000.0)*rate;int frame=Math.max(0,Math.min(frames-1,(int)Math.round(source)));
                            for(int ch=0;ch<2;ch++){int pos=info.offset+(frame*channels+Math.min(ch,channels-1))*sampleBytes;float v=encoding==AudioFormat.ENCODING_PCM_FLOAT?b.getFloat(pos):b.getShort(pos)/32768f;target.putShort((short)Math.round(Math.max(-1,Math.min(1,v))*32767));}}
                        file.seek(at*4);file.write(chunk,0,count*4);at+=count;}
                    outputEnd=(info.flags&MediaCodec.BUFFER_FLAG_END_OF_STREAM)!=0;decoder.releaseOutputBuffer(i,false);}
            }
            return true;
        } finally {if(decoder!=null){try{if(started)decoder.stop();}finally{decoder.release();}}extractor.release();}
    }
    Mixer mixer()throws IOException{return new Mixer();}
    final class Mixer implements AutoCloseable {
        final List<RandomAccessFile> files=new ArrayList<>();final float[] sum=new float[BLOCK*2];final byte[] scratch=new byte[BLOCK*4];
        Mixer()throws IOException{try{for(Entry e:entries)files.add(new RandomAccessFile(e.pcm,"r"));}catch(IOException e){close();throw e;}}
        byte[] block(long projectFrame,int count)throws IOException {
            Arrays.fill(sum,0);for(int i=0;i<entries.size();i++){Entry e=entries.get(i);Scene65.Clip c=e.clip;long begin=Math.round(c.start*RATE/1000000.0),end=begin+e.pcm.length()/4;
                long first=Math.max(projectFrame,begin),last=Math.min(projectFrame+count,end);if(last<=first)continue;
                int n=(int)(last-first);RandomAccessFile f=files.get(i);f.seek((first-begin)*4);f.readFully(scratch,0,n*4);ByteBuffer b=ByteBuffer.wrap(scratch).order(ByteOrder.LITTLE_ENDIAN);
                for(int j=0;j<n;j++){double gain=c.gainAt((first+j)*1000000/RATE);int offset=(int)(first-projectFrame+j)*2;sum[offset]+=b.getShort()/32768f*gain;sum[offset+1]+=b.getShort()/32768f*gain;}}
            byte[] result=new byte[count*4];ByteBuffer b=ByteBuffer.wrap(result).order(ByteOrder.LITTLE_ENDIAN);for(int i=0;i<count*2;i++)b.putShort((short)Math.round(Math.max(-1,Math.min(1,sum[i]))*32767));return result;
        }
        public void close(){for(RandomAccessFile f:files)try{f.close();}catch(IOException ignored){}}
    }
    final class Playback {
        final AtomicStop stop=new AtomicStop();final long startUs,endUs;volatile AudioTrack track;volatile boolean running,finished;volatile String error;volatile long lastUs;long wall;
        Playback(long start,long end){startUs=start;endUs=end;lastUs=start;wall=SystemClock.elapsedRealtimeNanos();
            if(entries.isEmpty()){running=true;return;}new Thread(this::write,"VarnaAudio65").start();}
        void write(){AudioTrack local=null;try(Mixer mixer=mixer()){
            int min=AudioTrack.getMinBufferSize(RATE,AudioFormat.CHANNEL_OUT_STEREO,AudioFormat.ENCODING_PCM_16BIT);
            if(min<0)throw new IOException("AudioTrack format unavailable");
            local=new AudioTrack.Builder().setAudioAttributes(new AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_MEDIA).setContentType(AudioAttributes.CONTENT_TYPE_MOVIE).build())
                .setAudioFormat(new AudioFormat.Builder().setSampleRate(RATE).setChannelMask(AudioFormat.CHANNEL_OUT_STEREO).setEncoding(AudioFormat.ENCODING_PCM_16BIT).build())
                .setTransferMode(AudioTrack.MODE_STREAM).setBufferSizeInBytes(Math.max(BLOCK*8,min*2)).build();track=local;
            long begin=Math.round(startUs*RATE/1000000.0),end=(endUs*RATE+999999)/1000000,submitted=0;
            local.play();running=true;
            while(begin+submitted<end&&!stop.value){int count=(int)Math.min(BLOCK,end-begin-submitted);byte[] data=mixer.block(begin+submitted,count);int offset=0;
                while(offset<data.length&&!stop.value){int n=local.write(data,offset,data.length-offset,AudioTrack.WRITE_NON_BLOCKING);if(n<0)throw new IOException("AudioTrack write failed: "+n);if(n==0)Thread.sleep(2);else offset+=n;}submitted+=offset/4;}
            while(!stop.value&&Integer.toUnsignedLong(local.getPlaybackHeadPosition())<submitted)Thread.sleep(4);
            if(!stop.value){lastUs=endUs;finished=true;}
        }catch(Exception e){if(!stop.value)error=e.getMessage();}finally{if(local!=null){try{local.pause();local.flush();}catch(Exception ignored){}local.release();}track=null;running=false;}}
        long position(){if(finished)return endUs;AudioTrack t=track;try{if(t!=null)lastUs=Math.min(endUs,startUs+Integer.toUnsignedLong(t.getPlaybackHeadPosition())*1000000/RATE);
            else if(entries.isEmpty()&&!stop.value){lastUs=Math.min(endUs,startUs+(SystemClock.elapsedRealtimeNanos()-wall)/1000);if(lastUs>=endUs)finished=true;}}catch(IllegalStateException ignored){}return lastUs;}
        void stop(){lastUs=position();stop.value=true;}
    }
    static final class AtomicStop {volatile boolean value;}
    Playback play(long from,long to){return new Playback(from,to);}
    volatile int encoderDelaySamples;
    File encode(MainActivity owner,long duration,BooleanSupplier cancel,Progress progress)throws Exception {
        if(entries.isEmpty())return null;
        File out=new File(owner.getCacheDir(),"audio65-"+System.nanoTime()+".m4a");
        try(Mixer mixer=mixer()){encoderDelaySamples=Aac65.encode(owner,out,(duration*RATE+999999)/1000000,mixer::block,cancel,progress);return out;}
        catch(Exception e){out.delete();throw e;}
    }

    public void close(){}
}
