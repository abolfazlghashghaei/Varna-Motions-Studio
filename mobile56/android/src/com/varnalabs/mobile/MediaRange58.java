package com.varnalabs.mobile;
final class MediaRange58 {
 static long[] parse(String value,long size){if(size<=0)throw new IllegalArgumentException("Empty media");if(value==null)return new long[]{0,size-1};if(!value.matches("bytes=(\\d*)-(\\d*)"))throw new IllegalArgumentException("Unsupported byte range");String[] parts=value.substring(6).split("-",-1);long start,end;if(parts[0].isEmpty()){long suffix=Long.parseLong(parts[1]);if(suffix<=0)throw new IllegalArgumentException();start=Math.max(0,size-suffix);end=size-1;}else{start=Long.parseLong(parts[0]);end=parts[1].isEmpty()?size-1:Math.min(size-1,Long.parseLong(parts[1]));}if(start<0||start>=size||end<start)throw new IllegalArgumentException();return new long[]{start,end};}
}
