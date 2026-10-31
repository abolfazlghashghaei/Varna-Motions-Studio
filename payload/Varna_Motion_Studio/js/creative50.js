/* Original Varna native looks; no imported compositions or remote fonts. */
(function(root,factory){var api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.VarnaCreative50=api;})(typeof window!=='undefined'?window:this,function(){'use strict';
var looks=[
 {id:'fa-clean',name:'فارسی · روشن',sample:'حرکت با کلمه‌ها',fonts:['Vazirmatn','IRANYekan','Tahoma'],color:'#F3F8FF',entry:'rise',duration:.32,tracking:0},
 {id:'fa-ink',name:'فارسی · جوهری',sample:'ساده و خوانا',fonts:['Vazirmatn','Tahoma'],color:'#183046',fill:'#E2F3EF',entry:'type',duration:.35,round:12},
 {id:'fa-gold',name:'فارسی · طلایی',sample:'داستان یک برند',fonts:['IRANSans','Vazirmatn','Tahoma'],color:'#F3D49A',fill:'#252B36',entry:'fade',duration:.55,tracking:15},
 {id:'fa-coral',name:'فارسی · مرجانی',sample:'هر کلمه یک حس',fonts:['Vazirmatn','Tahoma'],color:'#FFB4A1',entry:'spring',duration:.45},
 {id:'fa-outline',name:'فارسی · دورخط',sample:'بگذار دیده شود',fonts:['Vazirmatn','Tahoma'],color:'#FFFFFF',entry:'pop',stroke:true,strokeHex:'#1A2337',strokeWidth:3},
 {id:'fa-mint',name:'فارسی · نعنایی',sample:'طراحی زنده',fonts:['Vazirmatn','Tahoma'],color:'#9CE9C3',fill:'#173A35',entry:'slide',duration:.4},
 {id:'en-editorial',name:'English · Editorial',sample:'Words in motion',fonts:['Georgia','TimesNewRomanPSMT'],color:'#F5DDB7',entry:'fade',duration:.5,tracking:22},
 {id:'en-tech',name:'English · Signal',sample:'DESIGN / SIGNAL',fonts:['Consolas','CourierNewPSMT'],color:'#8BE2F2',entry:'type',duration:.3,tracking:70},
 {id:'en-bold',name:'English · Impact',sample:'MAKE IT MOVE',fonts:['Arial-BoldMT','ArialMT'],color:'#FEF5EB',fill:'#D85147',entry:'pop',duration:.25,round:8},
 {id:'en-float',name:'English · Float',sample:'A softer rhythm',fonts:['TrebuchetMS','ArialMT'],color:'#B4C6FF',entry:'spring',duration:.65,tracking:35},
 {id:'en-noir',name:'English · Noir',sample:'Less. With purpose.',fonts:['Georgia','ArialMT'],color:'#17212D',fill:'#E5ECF1',entry:'rise',duration:.38,round:4},
 {id:'en-neon',name:'English · Electric',sample:'STAY CURIOUS',fonts:['Arial-BoldMT','ArialMT'],color:'#D4FF72',entry:'slide',duration:.3,tracking:55,stroke:true,strokeHex:'#122B2B',strokeWidth:2}
];
function get(id){for(var i=0;i<looks.length;i++)if(looks[i].id===id)return looks[i];throw Error('استایل پیدا نشد.');}
function font(spec,available,current){for(var i=0;i<spec.fonts.length;i++)for(var j=0;j<(available||[]).length;j++)if(String(available[j]).toLowerCase().indexOf(spec.fonts[i].toLowerCase())>=0)return available[j];return current||'ArialMT';}
function word(id,current,available,baseFont){var s=get(id),p=JSON.parse(JSON.stringify(current||{}));p.color=s.color;p.fontPS=font(s,available,baseFont);p.look48={tracking:s.tracking||0,stroke:s.stroke?'on':'off',strokeHex:s.strokeHex||'#101722',strokeWidth:s.strokeWidth||2};p.motion45={entry:s.entry,out:'fade',duration:s.duration||.35,outDuration:.18,delay:0,visible:0};p.background45=s.fill?{mode:'solid',fill:s.fill,fill2:s.fill,angle:135,opacity:94,padding:16,round:s.round||12,motion:'softScale',duration:s.duration||.35,out:'fade',outDuration:.18}:{mode:'none'};return p;}
function nativeLook(id,available,currentFont){var s=get(id);return {style:{fill:s.color,fontPS:font(s,available,currentFont),fillMode:'solid',tracking:s.tracking||0,stroke:!!s.stroke,strokeHex:s.strokeHex||'#101722',strokeWidth:s.strokeWidth||0},bg:{enabled:!!s.fill,engine:'native',style:'solid',hex:s.fill||'#152233',opacity:94,round:s.round||12,padding:16,gradientEnabled:false},word:{preset:s.entry==='spring'?'pop':s.entry==='slide'?'left':s.entry,order:'forward',timing:'speech',duration:s.duration||.35,distance:45,colorMode:'active',colorTarget:'all'},color:s.color};}
return {looks:looks,get:get,word:word,nativeLook:nativeLook,font:font};
});
