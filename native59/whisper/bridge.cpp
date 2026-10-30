#include <jni.h>
#include <atomic>
#include <string>
#include <sstream>
#include "whisper.h"
static std::atomic<bool> cancelled{false};static std::atomic<int> progress{0};
static std::string escape(const char *p){std::string out="\"";for(unsigned char c:std::string(p?p:"")){if(c=='"'||c=='\\'){out+='\\';out+=c;}else if(c=='\n')out+="\\n";else if(c=='\r')out+="\\r";else if(c=='\t')out+="\\t";else if(c>=32)out+=c;}return out+'"';}
extern "C" JNIEXPORT void JNICALL Java_com_varnalabs_mobile_ASR59_cancelNative(JNIEnv*,jclass){cancelled=true;}
extern "C" JNIEXPORT jint JNICALL Java_com_varnalabs_mobile_ASR59_progressNative(JNIEnv*,jclass){return progress.load();}
extern "C" JNIEXPORT jbyteArray JNICALL Java_com_varnalabs_mobile_ASR59_transcribeNative(JNIEnv *env,jclass,jfloatArray input,jstring model,jstring language){
 cancelled=false;progress=0;const char *path=env->GetStringUTFChars(model,nullptr),*lang=env->GetStringUTFChars(language,nullptr);auto cp=whisper_context_default_params();cp.use_gpu=false;auto *ctx=whisper_init_from_file_with_params(path,cp);std::ostringstream out;
 if(!ctx)out<<"{\"error\":\"Whisper model could not be loaded\"}";
 else {auto params=whisper_full_default_params(WHISPER_SAMPLING_GREEDY);params.n_threads=4;params.language=lang;params.translate=false;params.print_progress=false;params.print_realtime=false;params.print_timestamps=false;params.token_timestamps=true;params.progress_callback=[](whisper_context*,whisper_state*,int value,void*){progress=value;};params.abort_callback=[](void*){return cancelled.load();};float *pcm=env->GetFloatArrayElements(input,nullptr);int result=whisper_full(ctx,params,pcm,env->GetArrayLength(input));env->ReleaseFloatArrayElements(input,pcm,JNI_ABORT);if(result!=0||cancelled)out<<"{\"error\":\""<<(cancelled?"Cancelled":"Local transcription failed")<<"\"}";else{out<<"{\"segments\":[";for(int i=0;i<whisper_full_n_segments(ctx);i++){if(i)out<<",";out<<"{\"start\":"<<whisper_full_get_segment_t0(ctx,i)/100.0<<",\"end\":"<<whisper_full_get_segment_t1(ctx,i)/100.0<<",\"text\":"<<escape(whisper_full_get_segment_text(ctx,i))<<"}";}out<<"]}";progress=100;}whisper_free(ctx);}
 env->ReleaseStringUTFChars(model,path);env->ReleaseStringUTFChars(language,lang);std::string value=out.str();jbyteArray bytes=env->NewByteArray(value.size());env->SetByteArrayRegion(bytes,0,value.size(),reinterpret_cast<const jbyte*>(value.data()));return bytes;
}
