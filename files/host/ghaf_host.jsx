/* RC43: initialize privately, then publish one complete adapter. All methods
   close over this adapter, regardless of evalFile scope or later global aliases. */
(function(root){
var previous43=root.VarnaHost43||root.GHAFHost||null;
/* ExtendScript may have no built-in JSON. Strict recursive parser; no eval. */
var GHAFJSON=(typeof JSON==='object'&&JSON)?JSON:{};
(function(J){
 if(typeof J.stringify!=='function')J.stringify=function(value){
  function quote(v){return '"'+String(v).replace(/[\\"\x00-\x1f\u2028\u2029]/g,function(c){var m={'"':'\\"','\\':'\\\\','\b':'\\b','\f':'\\f','\n':'\\n','\r':'\\r','\t':'\\t'};return m[c]||'\\u'+('0000'+c.charCodeAt(0).toString(16)).slice(-4);})+'"';}
  function enc(v,stack){var t=typeof v,i,out=[],k;if(v===null)return 'null';if(t==='string')return quote(v);if(t==='number')return isFinite(v)?String(v):'null';if(t==='boolean')return String(v);if(t!=='object')return undefined;for(i=0;i<stack.length;i++)if(stack[i]===v)throw Error('JSON cycle');stack.push(v);if(v instanceof Array){for(i=0;i<v.length;i++)out.push(enc(v[i],stack)||'null');stack.pop();return '['+out.join(',')+']';}for(k in v)if(Object.prototype.hasOwnProperty.call(v,k)){var x=enc(v[k],stack);if(x!==undefined)out.push(quote(k)+':'+x);}stack.pop();return '{'+out.join(',')+'}';}
  return enc(value,[]);
 };
 if(typeof J.parse!=='function')J.parse=function(text){
  var s=String(text),at=0,depth=0;function ws(){while(/\s/.test(s.charAt(at))&&at<s.length)at++;}function fail(){throw Error('Invalid JSON at '+at);}
  function str(){var o='',ch,h;at++;while(at<s.length){ch=s.charAt(at++);if(ch==='"')return o;if(ch==='\\'){ch=s.charAt(at++);if(ch==='u'){h=s.substr(at,4);if(!/^[0-9a-f]{4}$/i.test(h))fail();o+=String.fromCharCode(parseInt(h,16));at+=4;}else{var e={'"':'"','\\':'\\','/':'/','b':'\b','f':'\f','n':'\n','r':'\r','t':'\t'};if(!Object.prototype.hasOwnProperty.call(e,ch))fail();o+=e[ch];}}else{if(ch.charCodeAt(0)<32)fail();o+=ch;}}fail();}
  function val(){ws();if(++depth>200)fail();var ch=s.charAt(at),v,k,m;if(ch==='"')v=str();else if(ch==='{'||ch==='['){var arr=ch==='[';v=arr?[]:{};at++;ws();if(s.charAt(at)!==(arr?']':'}')){while(true){if(arr)v.push(val());else{ws();if(s.charAt(at)!=='"')fail();k=str();ws();if(s.charAt(at++)!==':')fail();var item=val();if(k!=='__proto__'&&k!=='constructor'&&k!=='prototype')v[k]=item;}ws();if(s.charAt(at)!==',')break;at++;}}if(s.charAt(at++)!==(arr?']':'}'))fail();}else if(s.substr(at,4)==='true'){v=true;at+=4;}else if(s.substr(at,5)==='false'){v=false;at+=5;}else if(s.substr(at,4)==='null'){v=null;at+=4;}else{m=/^-?(?:0|[1-9][0-9]*)(?:\.[0-9]+)?(?:[eE][+-]?[0-9]+)?/.exec(s.substring(at));if(!m)fail();v=Number(m[0]);at+=m[0].length;}depth--;return v;}
  var result=val();ws();if(at!==s.length)fail();return result;
 };
})(GHAFJSON);

/* GHAF Studio CEP 3.5 — After Effects host bridge */
var GHAFHost = {};
var carry43=['_aeSessionId','_lastComp36','_sourceTemplates38','_templateDestination38','_kineticDestination40'];
for(var carryIndex43=0;previous43&&carryIndex43<carry43.length;carryIndex43++)if(previous43[carry43[carryIndex43]]!=null)GHAFHost[carry43[carryIndex43]]=previous43[carry43[carryIndex43]];
GHAFHost._bootReady43=false;
GHAFHost._filePath = (typeof $!=='undefined' && $.fileName) ? (new File($.fileName)).fsName : '';
if(!GHAFHost._aeSessionId){GHAFHost._aeSessionId=String((new Date()).getTime())+"_"+String(Math.random()).replace(".","");}

GHAFHost._ok = function(data){ return GHAFJSON.stringify({ok:true,data:data}); };
GHAFHost._err = function(msg, extra){ return GHAFJSON.stringify({ok:false,error:String(msg||"ERROR"),extra:extra||null}); };
GHAFHost._parse = function(encoded){ return GHAFJSON.parse(decodeURIComponent(String(encoded||"%7B%7D"))); };
GHAFHost._activeComp = function(){
    try{ if(app.project && app.project.activeItem instanceof CompItem){GHAFHost._lastComp36=app.project.activeItem;return app.project.activeItem;} }catch(e){}
    return null;
};
GHAFHost._hex = function(h){
    h=String(h||"#FFFFFF").replace("#","");
    if(!/^[0-9A-Fa-f]{6}$/.test(h)) h="FFFFFF";
    return [parseInt(h.substr(0,2),16)/255,parseInt(h.substr(2,2),16)/255,parseInt(h.substr(4,2),16)/255];
};
GHAFHost.pickColor=function(){try{var v=$.colorPicker();if(v<0)return GHAFHost._ok({cancelled:true});var h=("000000"+(Number(v)>>>0).toString(16)).slice(-6).toUpperCase();return GHAFHost._ok({hex:"#"+h});}catch(e){return GHAFHost._err(e.toString());}};
GHAFHost._font = function(doc, ps){
    if(!ps) return;
    try{
        if(app.fonts && app.fonts.getFontsByPostScriptName){
            var ff=app.fonts.getFontsByPostScriptName(ps);
            if(ff && ff.length){ doc.fontObject=ff[0]; return; }
        }
    }catch(e){}
    try{doc.font=ps;}catch(e2){}
};
GHAFHost._rtl = function(doc, rtl){
    try{doc.composerEngine=ComposerEngine.UNIVERSAL_TYPE_ENGINE;}catch(e){}
    try{doc.everyLineComposer=true;}catch(e1){}
    try{doc.direction=rtl?ParagraphDirection.DIRECTION_RIGHT_TO_LEFT:ParagraphDirection.DIRECTION_LEFT_TO_RIGHT;}catch(e2){}
    // Preserve typed Latin/Arabic/Persian digits instead of forcing a global digit substitution.
    try{doc.digitSet=DigitSet.DEFAULT_DIGITS;}catch(e3){}
};

GHAFHost._removeNamedEffect=function(layer,name){try{var fx=layer.property('ADBE Effect Parade');for(var i=fx.numProperties;i>=1;i--){var e=fx.property(i);if(String(e.name||'')===name)e.remove();}}catch(e){}};
// Native Gradient Ramp: independently editable channels, with ES3-safe validation.
GHAFHost._paintNumber=function(v,f,lo,hi){var n=Number(v);if(v==null||!isFinite(n))n=f;return Math.max(lo,Math.min(hi,n));};
GHAFHost._paintRampPoints=function(pad,angle,balance,x1,y1,x2,y2,opt,ownBounds){
 var n=GHAFHost._paintNumber,o=opt||{},radial=o.type==='radial',scale=n(o.scale,100,10,400)/100,start=n(o.start,0,0,99)/100,end=n(o.end,100,start*100+1,100)/100,a=n(angle,90,-3600,3600),bal=n(balance,0,-100,100)/100;
 var ex='var r='+(ownBounds?'sourceRectAtTime(time,false)':'thisLayer.parent.sourceRectAtTime(time,false)')+';var p='+n(pad,0,0,1000)+';var w=Math.max(1,r.width+p*2),h=Math.max(1,r.height+p*2);var c=[r.left+r.width/2,r.top+r.height/2];var A='+a+'*Math.PI/180;var v=[Math.cos(A),Math.sin(A)];';
 var has=x1!=null&&y1!=null&&x2!=null&&y2!=null&&isFinite(Number(x1))&&isFinite(Number(y1))&&isFinite(Number(x2))&&isFinite(Number(y2));
 if(has)ex+='var a=[r.left-p+w*'+n(x1,0,0,1)+',r.top-p+h*'+n(y1,0,0,1)+'];var b=[r.left-p+w*'+n(x2,1,0,1)+',r.top-p+h*'+n(y2,1,0,1)+'];';
 else if(radial)ex+='var a=c;var L=Math.max(w,h)/2;var b=[c[0]+v[0]*L,c[1]+v[1]*L];';
 else ex+='var L=(Math.abs(w*v[0])+Math.abs(h*v[1]))/2;var sh='+bal+'*L*.76;var a=[c[0]-v[0]*L+v[0]*sh,c[1]-v[1]*L+v[1]*sh];var b=[c[0]+v[0]*L+v[0]*sh,c[1]+v[1]*L+v[1]*sh];';
 ex+='var d=[(b[0]-a[0])*'+scale+',(b[1]-a[1])*'+scale+'];if(Math.abs(d[0])+Math.abs(d[1])<.001)d=[1,0];';
 if(radial)ex+='var q=a;';else ex+='var q=[(a[0]+b[0]-d[0])/2,(a[1]+b[1]-d[1])/2];';
 return {start:ex+'[q[0]+d[0]*'+start+',q[1]+d[1]*'+start+'];',end:ex+'[q[0]+d[0]*'+end+',q[1]+d[1]*'+end+'];'};
};
GHAFHost._applyTextGradient=function(layer,st){
 GHAFHost._removeNamedEffect(layer,'VARNA Text Gradient');if(String(st.fillMode||'solid')!=='gradient')return;
 var o=st.fillGradient||{},rp=layer.property('ADBE Effect Parade').addProperty('ADBE Ramp');rp.name='VARNA Text Gradient';
 var pts=GHAFHost._paintRampPoints(0,st.fillAngle,st.fillBalance,null,null,null,null,o,true),a=st.fill||'#FFFFFF',b=st.fill2||a;
 rp.property(1).expression=pts.start;rp.property(3).expression=pts.end;rp.property(2).setValue(GHAFHost._hex(o.reverse?b:a));rp.property(4).setValue(GHAFHost._hex(o.reverse?a:b));rp.property(5).setValue(o.type==='radial'?2:1);rp.property(6).setValue(o.dither===false?0:8);rp.property(7).setValue(0);try{rp.moveTo(1);}catch(e){}
};
GHAFHost._applyTextGlow=function(layer,st,name){name=name||'VARNA Text Glow';GHAFHost._removeNamedEffect(layer,name);if(!st||!st.glowEnabled)return;try{var gl=layer.property('ADBE Effect Parade').addProperty('ADBE Glo2');gl.name=name;GHAFHost._setFx(gl,1,2);GHAFHost._setFx(gl,2,50);GHAFHost._setFx(gl,3,Math.max(0,Number(st.glowRadius==null?24:st.glowRadius)));GHAFHost._setFx(gl,4,Math.max(0,Number(st.glowIntensity==null?.75:st.glowIntensity)));GHAFHost._setFx(gl,7,2);GHAFHost._setFx(gl,12,GHAFHost._hex(st.glowColor||'#FFFFFF'));GHAFHost._setFx(gl,13,GHAFHost._hex(st.glowColor||'#FFFFFF'));}catch(e){}
};
GHAFHost._applyTextStyle = function(layer, st, text){
    var p=layer.property("ADBE Text Properties").property("ADBE Text Document"), d=p.value;
    d.text=String(text||"");
    d.fontSize=Number(st.size||72);
    d.applyFill=true; d.fillColor=GHAFHost._hex(st.fill||"#FFFFFF");
    try{d.tracking=Number(st.tracking||0);}catch(e){}
    try{
        if(Number(st.leading||0)>0){d.autoLeading=false;d.leading=Number(st.leading);} else d.autoLeading=true;
    }catch(e2){}
    d.applyStroke=!!st.stroke;
    if(st.stroke){
        try{d.strokeColor=GHAFHost._hex(st.strokeHex||"#000000");d.strokeWidth=Number(st.strokeWidth||2);}catch(e3){}
    }
    try{
        var a=Number(st.align||0);
        var jm=String(st.justifyMode||((st.justify)?(st.rtl?'right':'left'):'none'));
        if(jm==='right')d.justification=ParagraphJustification.FULL_JUSTIFY_LASTLINE_RIGHT;
        else if(jm==='center')d.justification=ParagraphJustification.FULL_JUSTIFY_LASTLINE_CENTER;
        else if(jm==='left')d.justification=ParagraphJustification.FULL_JUSTIFY_LASTLINE_LEFT;
        else if(jm==='full')d.justification=ParagraphJustification.FULL_JUSTIFY_LASTLINE_FULL;
        else d.justification=a===1?ParagraphJustification.RIGHT_JUSTIFY:(a===2?ParagraphJustification.LEFT_JUSTIFY:ParagraphJustification.CENTER_JUSTIFY);
    }catch(e4){}
    if(String(st.justifyMode||'none')!=='none'){
        try{
            var bw=layer.containingComp.width*Math.max(.3,Math.min(1,Number(st.boxWidthPct||82)/100));
            var bh=Math.max(100,layer.containingComp.height*.45);
            if(d.boxText){
                d.boxTextSize=[bw,bh];
                try{d.boxTextPos=[-bw/2,-bh/2];}catch(eBP){}
                try{d.boxAutoFitPolicy=BoxAutoFitPolicy.HEIGHT_PRECISE_BOUNDS;}catch(eFit){}
            }
        }catch(eBox){}
    }
    GHAFHost._font(d,st.fontPS||st.font||"ArialMT");
    GHAFHost._rtl(d,!!st.rtl);
    p.setValue(d);
    GHAFHost._applyTextGradient(layer,st);GHAFHost._applyTextGlow(layer,st,'VARNA Text Glow');
    GHAFHost._fitText(layer,st);
    try{layer.property("ADBE Transform Group").property("ADBE Position").setValue([layer.containingComp.width*Number(st.x==null?50:st.x)/100,layer.containingComp.height*Number(st.y==null?62:st.y)/100]);}catch(e5){}
};
GHAFHost._clearAnimators = function(layer){
    try{
        var a=layer.property("ADBE Text Properties").property("ADBE Text Animators");
        while(a && a.numProperties>0) a.property(1).remove();
    }catch(e){}
};
GHAFHost._clearTransformKeys = function(layer){
    try{
        var t=layer.property("ADBE Transform Group"), names=["ADBE Opacity","ADBE Position","ADBE Scale","ADBE Rotate Z"];
        for(var i=0;i<names.length;i++){
            var p=t.property(names[i]); if(!p) continue;
            while(p.numKeys>0) p.removeKey(1);
        }
    }catch(e){}
};
GHAFHost._applyTypingClicks=function(layer,g,a){
    try{if(!a||a.typeSound===false||!a.typingSfxPath)return 0;var f=new File(a.typingSfxPath);if(!f.exists)return 0;var c=layer.containingComp,item=GHAFHost._findFootageByFile(f.fsName);if(!item)item=app.project.importFile(new ImportOptions(f));if(!item)return 0;var txt=String(g.text||''),chars=[];for(var i=0;i<txt.length;i++)if(!/\s/.test(txt.charAt(i)))chars.push(i);if(!chars.length)return 0;var dur=Math.max(.08,Number(a.inDur||.42)),step=dur/Math.max(1,txt.length),stride=Math.max(1,Math.ceil(chars.length/18)),made=0;for(i=0;i<chars.length;i+=stride){var idx=chars[i],tm=Number(g.start||0)+idx*step,l=c.layers.add(item);l.name='GHAF_TYPE_CLICK_'+String(g.id||'')+'_'+made;l.startTime=tm;l.inPoint=Math.max(0,tm);l.outPoint=Math.min(c.duration,tm+Math.max(c.frameDuration,Number(item.duration||.06)));try{var al=l.property('ADBE Audio Group').property('ADBE Audio Levels'),db=Number(a.typeSoundDb==null?-22:a.typeSoundDb);al.setValue([db,db]);}catch(eDb){}try{l.shy=true;}catch(eShy){}made++;}try{c.hideShyLayers=true;}catch(eHide){}return made;}catch(e){return 0;}
};
GHAFHost._applyTypewriter=function(layer,g,a){
 var source=layer.property('ADBE Text Properties').property('ADBE Text Document');
 GHAFHost._clearAnimators(layer);source.expression=GHAFHost._typingExpression(a);
 GHAFHost._applyTypingClicks(layer,g,a);return true;
};
GHAFHost._prepareTypingBounds=function(text,g,bg){
 if(bg._typingExpand)delete bg._typingExpand;
 if(!bg.enabled||bg.followTyping===false||String((g.anim||{}).preset)!=='typewriter')return null;
 bg._typingExpand=true;return {name:text.name,off:Math.max(0,Number(g.anim.startOffset)||0)};
};
GHAFHost._linkTypingBounds=function(text,measure){
 if(!measure)return;var c=text.containingComp;
 for(var i=1;i<=c.numLayers;i++){var l=c.layer(i);if(l.parent===text&&String(l.name).indexOf(GHAFHost._nativeBgPrefix)===0){
  l.locked=false;var op=l.property('ADBE Transform Group').property('ADBE Opacity');
  op.expression='time < parent.inPoint+'+measure.off+' ? 0 : 100';l.locked=true;
 }}
};
GHAFHost._applyComposerCharSides = function(layer,g,a){
    try{
        var textProps=layer.property("ADBE Text Properties"),animators=textProps&&textProps.property("ADBE Text Animators");if(!animators)return false;
        var strength=Math.max(16,Number(a&&a.strength||45)*.9),fallbackStart=Number(g.start||layer.inPoint)+Math.max(0,Number(a&&a.startOffset||0)),fallbackEnd=Math.min(Number(g.end||layer.outPoint),fallbackStart+Math.max(.03,Number(a&&a.inDur||.48)));
        function makeSide(name,dx,parity){
            var an=animators.addProperty("ADBE Text Animator");an.name=name;var props=an.property("ADBE Text Animator Properties");
            GHAFHost._addAnimatorProp(props,"ADBE Text Opacity",0);GHAFHost._addAnimatorProp(props,"ADBE Text Position 3D",[dx,0,0]);
            var sel=null,amt=null;try{sel=an.property("ADBE Text Selectors").addProperty("ADBE Text Expressible Selector");amt=sel.property("ADBE Text Expressible Amount");}catch(eSel){}
            if(!amt){try{an.remove();}catch(er){}return false;}
            amt.expression="function mt(n,f){try{for(var i=1;i<=marker.numKeys;i++){if(marker.key(i).comment==n)return marker.key(i).time;}}catch(e){}return f;}var ls=inPoint,le=Math.max(ls+.001,outPoint),a=Math.min(le-.001,ls+"+off+"),b=mt('IN',Math.min(le,a+"+dur+"));b=Math.min(le,Math.max(a+.001,b));var lo=a,hi=b,span=Math.max(.001,hi-lo),n=Math.max(1,textTotal),slot=(textIndex-1)/Math.max(1,n-1),sa=lo+slot*span*.48,sb=Math.max(sa+.001,hi),v=ease(time,sa,sb,100,0);(textIndex%2=="+parity+")?v:0;";
            return true;
        }
        var ok1=makeSide("VARNA Composer · Char Side Left",-strength,1),ok2=makeSide("VARNA Composer · Char Side Right",strength,0);
        if(ok1||ok2)return true;
    }catch(e){}
    var fb={based:'chars',opacity:true,position:true,px:Math.max(16,Number(a&&a.strength||45)*.8),py:0,inDur:Math.max(.03,Number(a&&a.inDur||.48)),startOffset:Number(a&&a.startOffset||0)};GHAFHost._applyNativeAnimator(layer,g,fb);return false;
};
GHAFHost._applyComposerPreset = function(layer,g,a,preset){
    var s=Math.max(8,Number(a&&a.strength||45)),d=Math.max(.03,Number(a&&a.inDur||.48)),o=Math.max(0,Number(a&&a.startOffset||0)),x=null;
    if(preset==='acCharSides'){GHAFHost._applyComposerCharSides(layer,g,a);return true;}
    if(preset==='acSmoothRise')x={based:'words',opacity:true,position:true,px:0,py:Math.max(10,s*.34)};
    else if(preset==='acSoftSlide')x={based:'words',opacity:true,position:true,px:-Math.max(14,s*.48),py:0};
    else if(preset==='acScaleEase')x={based:'words',opacity:true,scale:true,scaleV:Math.max(70,100-s*.34)};
    else if(preset==='acElasticSoft')x={based:'words',opacity:true,scale:true,scaleV:Math.max(64,100-s*.48)};
    else if(preset==='acBlurFloat')x={based:'words',opacity:true,position:true,px:0,py:Math.max(10,s*.30),blur:true,blurV:Math.max(8,s*.38)};
    else if(preset==='acTrackingFlow')x={based:'chars',opacity:true,tracking:true,trackV:Math.max(36,s*1.15),blur:true,blurV:Math.max(3,s*.16)};
    else if(preset==='acWordCascade')x={based:'words',opacity:true,position:true,px:0,py:Math.max(16,s*.48),scale:true,scaleV:92};
    else if(preset==='acLineSweep')x={based:'lines',opacity:true,position:true,px:Math.max(14,s*.42),py:0};
    else if(preset==='acWordLift')x={based:'words',opacity:true,position:true,px:0,py:Math.max(18,s*.56)};
    else if(preset==='acWordFall')x={based:'words',opacity:true,position:true,px:0,py:-Math.max(18,s*.56)};
    else if(preset==='acWordSlideLeft')x={based:'words',opacity:true,position:true,px:-Math.max(22,s*.72),py:0};
    else if(preset==='acWordSlideRight')x={based:'words',opacity:true,position:true,px:Math.max(22,s*.72),py:0};
    else if(preset==='acWordScale')x={based:'words',opacity:true,scale:true,scaleV:Math.max(62,100-s*.62)};
    else if(preset==='acWordBlur')x={based:'words',opacity:true,blur:true,blurV:Math.max(10,s*.55),position:true,px:0,py:Math.max(6,s*.16)};
    else if(preset==='acWordStagger')x={based:'words',opacity:true,position:true,px:Math.max(10,s*.26),py:Math.max(12,s*.30),scale:true,scaleV:94};
    else if(preset==='acWordSwing')x={based:'words',opacity:true,rotation:true,rotV:-Math.max(6,s*.24),position:true,px:0,py:Math.max(8,s*.18)};
    else if(preset==='acCharRise')x={based:'chars',opacity:true,position:true,px:0,py:Math.max(15,s*.44)};
    else if(preset==='acCharDrop')x={based:'chars',opacity:true,position:true,px:0,py:-Math.max(15,s*.44)};
    else if(preset==='acCharSpread')x={based:'chars',opacity:true,tracking:true,trackV:Math.max(42,s*1.35)};
    else if(preset==='acCharWave')x={based:'chars',opacity:true,position:true,px:0,py:Math.max(12,s*.32),rotation:true,rotV:-Math.max(4,s*.12)};
    else if(preset==='acCharRotate')x={based:'chars',opacity:true,rotation:true,rotV:-Math.max(12,s*.44),scale:true,scaleV:88};
    else if(preset==='acCharFocus')x={based:'chars',opacity:true,blur:true,blurV:Math.max(10,s*.5),scale:true,scaleV:94};
    else if(preset==='acCharFlow')x={based:'chars',opacity:true,position:true,px:-Math.max(10,s*.25),py:Math.max(6,s*.12),blur:true,blurV:Math.max(4,s*.18)};
    else if(preset==='acLineRise')x={based:'lines',opacity:true,position:true,px:0,py:Math.max(18,s*.52)};
    else if(preset==='acLineSlideLeft')x={based:'lines',opacity:true,position:true,px:-Math.max(22,s*.7),py:0};
    else if(preset==='acLineSlideRight')x={based:'lines',opacity:true,position:true,px:Math.max(22,s*.7),py:0};
    else if(preset==='acLineScale')x={based:'lines',opacity:true,scale:true,scaleV:Math.max(68,100-s*.5)};
    else if(preset==='acLineBlur')x={based:'lines',opacity:true,blur:true,blurV:Math.max(10,s*.46)};
    else if(preset==='acLineCascade')x={based:'lines',opacity:true,position:true,px:Math.max(8,s*.2),py:Math.max(16,s*.38),scale:true,scaleV:94};
    /* R10 expanded native composer text set */
    else if(preset==='acWordFade')x={based:'words',opacity:true};
    else if(preset==='acWordTracking')x={based:'words',opacity:true,tracking:true,trackV:Math.max(32,s*.95)};
    else if(preset==='acWordRotate')x={based:'words',opacity:true,rotation:true,rotV:-Math.max(7,s*.25),scale:true,scaleV:92};
    else if(preset==='acWordBounce')x={based:'words',opacity:true,position:true,px:0,py:Math.max(20,s*.62),scale:true,scaleV:88};
    else if(preset==='acCharLeft')x={based:'chars',opacity:true,position:true,px:-Math.max(18,s*.55),py:0};
    else if(preset==='acCharRight')x={based:'chars',opacity:true,position:true,px:Math.max(18,s*.55),py:0};
    else if(preset==='acCharScale')x={based:'chars',opacity:true,scale:true,scaleV:Math.max(55,100-s*.75)};
    else if(preset==='acCharFlip')x={based:'chars',opacity:true,rotation:true,rotV:-Math.max(18,s*.7),scale:true,scaleV:82};
    else if(preset==='acCharBounce')x={based:'chars',opacity:true,position:true,px:0,py:Math.max(20,s*.58),scale:true,scaleV:84};
    else if(preset==='acLineDrop')x={based:'lines',opacity:true,position:true,px:0,py:-Math.max(18,s*.52)};
    else if(preset==='acLineTracking')x={based:'lines',opacity:true,tracking:true,trackV:Math.max(28,s*.82)};
    else if(preset==='acLineRotate')x={based:'lines',opacity:true,rotation:true,rotV:-Math.max(6,s*.22)};
    else if(preset==='acLineFade')x={based:'lines',opacity:true};
    if(!x)return false;x.inDur=d;x.startOffset=o;GHAFHost._applyNativeAnimator(layer,g,x);return true;
};
GHAFHost._markerProgressExpr=function(aName,bName,fa,fb,reverse){
    /* RC7: timing is live. Never bake caption start/end into an expression. */
    var head="function mt(n,f){try{for(var i=1;i<=marker.numKeys;i++){if(marker.key(i).comment==n)return marker.key(i).time;}}catch(e){}return f;}var ls=inPoint,le=Math.max(ls+.001,outPoint);",ex;
    if(aName==='IN'||bName==='IN')ex=head+"var a=ls,b=mt('IN',Math.min(le,ls+"+Math.max(.001,Number(fb)-Number(fa))+"));b=Math.min(le,Math.max(a+.001,b));";
    else if(aName==='OUT'||bName==='OUT')ex=head+"var a=mt('OUT',Math.max(ls,le-"+Math.max(.001,Number(fb)-Number(fa))+"));a=Math.max(ls,Math.min(le-.001,a));var b=le;";
    else ex=head+"var a=mt('"+aName+"',ls),b=mt('"+bName+"',le);a=Math.max(ls,Math.min(le-.001,a));b=Math.min(le,Math.max(a+.001,b));";
    ex+="var lo=Math.min(a,b),hi=Math.max(a,b),q=clamp((time-lo)/Math.max(.001,hi-lo),0,1);q=ease(q,0,1,0,1);";return ex+(reverse?'q=1-q;':'');
};
GHAFHost._isMarkerTransformPreset=function(p){return /^(fade|rise|floatIn|maskRise|pushUp|drop|fadeDown|slide|punchLeft|drift|cinemaDrift|pop|zoomOut|overshoot|spring|elastic|snap|microBounce|zoomIn|cinema|stretchIn|splitCenter|swing|flipIn)$/.test(String(p||''));};
GHAFHost._motionTransformParams=function(preset,str){var x={use:false,dx:0,dy:0,sx:100,sy:100,rv:0};preset=String(preset||'');str=Math.max(8,Number(str||45));if(preset==='fade'){x.use=true;}else if(preset==='rise'||preset==='floatIn'||preset==='maskRise'||preset==='pushUp'){x.use=true;x.dy=Math.max(14,str*(preset==='rise'?.9:.62));}else if(preset==='drop'||preset==='fadeDown'){x.use=true;x.dy=-Math.max(14,str*.62);}else if(preset==='slide'||preset==='punchLeft'){x.use=true;x.dx=-Math.max(20,str*(preset==='punchLeft'?1.05:.9));}else if(preset==='drift'||preset==='cinemaDrift'){x.use=true;x.dx=-Math.max(8,str*.38);x.dy=Math.max(3,str*.1);}else if(preset==='pop'||preset==='zoomOut'||preset==='overshoot'||preset==='spring'||preset==='elastic'||preset==='snap'||preset==='microBounce'){x.use=true;x.sx=x.sy=(preset==='pop'?Math.max(45,100-str*.7):(preset==='zoomOut'?82:(preset==='snap'?70:(preset==='elastic'?78:88))));}else if(preset==='zoomIn'||preset==='cinema'){x.use=true;x.sx=x.sy=(preset==='zoomIn'?118:104);}else if(preset==='stretchIn'||preset==='splitCenter'){x.use=true;x.sx=2;x.sy=100;}else if(preset==='swing'||preset==='flipIn'){x.use=true;x.rv=preset==='flipIn'?-18:-Math.max(8,str*.3);x.sx=x.sy=preset==='flipIn'?88:100;}return x;};
GHAFHost._applyMarkerTransformPreset=function(layer,g,a,preset){
 try{
  if(!GHAFHost._isMarkerTransformPreset(preset))return false;
  var off=Math.max(0,Number(a.startOffset||0)),id=Math.max(.03,Number(a.inDur||.42)),od=Math.max(.03,Number(a.outDur||.28)),T=layer.property('ADBE Transform Group'),op=T.property('ADBE Opacity'),pos=T.property('ADBE Position'),sc=T.property('ADBE Scale'),rot=T.property('ADBE Rotate Z'),str=Math.max(8,Number(a.strength||45)),inp=GHAFHost._motionTransformParams(preset,str),outName=String(a.outPreset||'none'),outBase=outName.indexOf('mirror:')===0?outName.substring(7):'',outp=GHAFHost._isMarkerTransformPreset(outBase)?GHAFHost._motionTransformParams(outBase,str):{use:false,dx:0,dy:0,sx:100,sy:100,rv:0};
  var pre="function mt(n,f){try{for(var i=1;i<=marker.numKeys;i++){if(marker.key(i).comment==n)return marker.key(i).time;}}catch(e){}return f;}var ls=inPoint,le=Math.max(ls+.001,outPoint),ia=Math.min(le-.001,ls+"+off+"),ib=mt('IN',Math.min(le,ia+"+id+"));ib=Math.min(le,Math.max(ia+.001,ib));var qi=ease(time,ia,Math.max(ia+.001,ib),0,1);"+(outp.use?"var oa=mt('OUT',Math.max(ib,le-"+od+"));oa=Math.max(ib,Math.min(le-.001,oa));var ob=le,qo=ease(time,oa,Math.max(oa+.001,ob),0,1);":"var qo=0;");
  if(op)try{op.expression=pre+'100*qi*(1-qo);';}catch(eO){}
  if(pos&&(inp.dx||inp.dy||outp.dx||outp.dy))try{pos.expression=pre+'var v=value;[v[0]+'+inp.dx+'*(1-qi)+'+outp.dx+'*qo,v[1]+'+inp.dy+'*(1-qi)+'+outp.dy+'*qo];';}catch(eP){}
  if(sc&&(inp.sx!==100||inp.sy!==100||outp.sx!==100||outp.sy!==100))try{sc.expression=pre+'var v=value;var cx='+inp.sx+'*(1-qi)+v[0]*qi,cy='+inp.sy+'*(1-qi)+v[1]*qi;[cx*(1-qo)+'+outp.sx+'*qo,cy*(1-qo)+'+outp.sy+'*qo];';}catch(eS){}
  if(rot&&(inp.rv||outp.rv))try{rot.expression=pre+inp.rv+'*(1-qi)+'+outp.rv+'*qo;';}catch(eR){}
  return true;
 }catch(e){return false;}
};

GHAFHost._animTransform = function(layer, g, a){
    if(!a)return;var preset=String(a.preset||'none');if(preset==='none'&&a.mode!=='native')return;
    if(preset==='typewriter'){GHAFHost._applyTypewriter(layer,g,a);return;}
    if(preset.indexOf('ac')===0&&GHAFHost._applyComposerPreset(layer,g,a,preset))return;
    if(GHAFHost._applyMarkerTransformPreset(layer,g,a,preset))return;
    var t0=Number(g.start||0)+Math.max(0,Number(a.startOffset)||0),t3=Number(g.end||t0+.5);t0=Math.min(t0,Math.max(Number(g.start||0),t3-.03));var dur=Math.max(.04,t3-t0),inD=Math.min(Math.max(.03,Number(a.inDur||.42)),dur*.68),outD=Math.min(Math.max(0,Number(a.outDur||0)),dur*.42),t1=Math.min(t3,t0+inD),t2=t3-outD;if(t2<t1)t2=t1;var T=layer.property('ADBE Transform Group');
    try{
        if(preset==='fade'){var op=T.property('ADBE Opacity');op.setValueAtTime(t0,0);op.setValueAtTime(t1,100);if(outD>0){op.setValueAtTime(t2,100);op.setValueAtTime(t3,0);}}
        else if(preset==='rise'){var pos=T.property('ADBE Position'),base=pos.value,str=Number(a.strength||45);pos.setValueAtTime(t0,[base[0],base[1]+str]);pos.setValueAtTime(t1,base);}
        else if(preset==='pop'){var sc=T.property('ADBE Scale'),sv=Math.max(35,100-Number(a.strength||45)*.72);sc.setValueAtTime(t0,[sv,sv]);sc.setValueAtTime(t1,[100,100]);}
        else if(preset==='slide'){var ps=T.property('ADBE Position'),bv=ps.value,sg=Number(a.strength||60);ps.setValueAtTime(t0,[bv[0]-sg,bv[1]]);ps.setValueAtTime(t1,bv);}
        else if(preset==='spring'){var sc2=T.property('ADBE Scale'),op2=T.property('ADBE Opacity'),amp=Math.min(12,3+Number(a.strength||45)*.09),tm=Math.min(t3,t0+inD*.72);if(op2){op2.setValueAtTime(t0,0);op2.setValueAtTime(t0+Math.min(.12,inD*.35),100);}sc2.setValueAtTime(t0,[92,92]);sc2.setValueAtTime(tm,[100+amp,100+amp]);sc2.setValueAtTime(t1,[100,100]);}
        else if(preset==='drift'){var dp=T.property('ADBE Position'),dop=T.property('ADBE Opacity'),db=dp.value,ds=Math.max(10,Number(a.strength||45)*.45);dop.setValueAtTime(t0,0);dop.setValueAtTime(t1,100);dp.setValueAtTime(t0,[db[0]-ds,db[1]+ds*.35]);dp.setValueAtTime(t1,db);}
        else if(preset==='elastic'){var es=T.property('ADBE Scale'),eop=T.property('ADBE Opacity'),ea=Math.min(18,6+Number(a.strength||45)*.16),e1=Math.min(t3,t0+inD*.58),e2=Math.min(t3,t0+inD*.82);eop.setValueAtTime(t0,0);eop.setValueAtTime(Math.min(t1,t0+.11),100);es.setValueAtTime(t0,[78,78]);es.setValueAtTime(e1,[100+ea,100+ea]);es.setValueAtTime(e2,[98,98]);es.setValueAtTime(t1,[100,100]);}
        else if(preset==='cinema'){var cs=T.property('ADBE Scale'),cop=T.property('ADBE Opacity');cop.setValueAtTime(t0,0);cop.setValueAtTime(t1,100);cs.setValueAtTime(t0,[103.5,103.5]);cs.setValueAtTime(t1,[100,100]);}
        else if(preset==='zoomIn'){var zi=T.property('ADBE Scale'),zio=T.property('ADBE Opacity');if(zio){zio.setValueAtTime(t0,0);zio.setValueAtTime(Math.min(t1,t0+.12),100);}zi.setValueAtTime(t0,[118,118]);zi.setValueAtTime(t1,[100,100]);}
        else if(preset==='zoomOut'){var zo=T.property('ADBE Scale'),zoo=T.property('ADBE Opacity');if(zoo){zoo.setValueAtTime(t0,0);zoo.setValueAtTime(Math.min(t1,t0+.12),100);}zo.setValueAtTime(t0,[82,82]);zo.setValueAtTime(t1,[100,100]);}
        else if(preset==='pushUp'||preset==='drop'){var vp=T.property('ADBE Position'),vop=T.property('ADBE Opacity'),vb=vp.value,vs=Math.max(14,Number(a.strength||45)*.72),dir=preset==='pushUp'?1:-1;if(vop){vop.setValueAtTime(t0,0);vop.setValueAtTime(t1,100);}vp.setValueAtTime(t0,[vb[0],vb[1]+vs*dir]);vp.setValueAtTime(t1,vb);}
        else if(preset==='snap'){var ss=T.property('ADBE Scale'),sop=T.property('ADBE Opacity'),sm=Math.min(t3,t0+inD*.72);if(sop){sop.setValueAtTime(t0,0);sop.setValueAtTime(Math.min(t1,t0+.09),100);}ss.setValueAtTime(t0,[70,70]);ss.setValueAtTime(sm,[108,108]);ss.setValueAtTime(t1,[100,100]);}
        else if(preset==='swing'){var ro=T.property('ADBE Rotate Z'),rop=T.property('ADBE Opacity'),rv=Math.max(8,Number(a.strength||45)*.34),rm=Math.min(t3,t0+inD*.58);if(rop){rop.setValueAtTime(t0,0);rop.setValueAtTime(Math.min(t1,t0+.11),100);}ro.setValueAtTime(t0,-rv);ro.setValueAtTime(rm,rv*.36);ro.setValueAtTime(t1,0);}
        else if(preset==='punchLeft'){var pl=T.property('ADBE Position'),plo=T.property('ADBE Opacity'),plb=pl.value,pls=Math.max(24,Number(a.strength||45)*1.15);plo.setValueAtTime(t0,0);plo.setValueAtTime(Math.min(t1,t0+.08),100);pl.setValueAtTime(t0,[plb[0]+pls,plb[1]]);pl.setValueAtTime(t1,plb);}
        else if(preset==='floatIn'){var fi=T.property('ADBE Position'),fio=T.property('ADBE Opacity'),fib=fi.value;fio.setValueAtTime(t0,0);fio.setValueAtTime(t1,100);fi.setValueAtTime(t0,[fib[0],fib[1]+Math.max(12,Number(a.strength||45)*.35)]);fi.setValueAtTime(t1,fib);}
        else if(preset==='overshoot'){var ov=T.property('ADBE Scale'),ovo=T.property('ADBE Opacity'),ovm=Math.min(t1,t0+inD*.72);ovo.setValueAtTime(t0,0);ovo.setValueAtTime(Math.min(t1,t0+.09),100);ov.setValueAtTime(t0,[86,86]);ov.setValueAtTime(ovm,[105,105]);ov.setValueAtTime(t1,[100,100]);}
        else if(preset==='flipIn'){var fr=T.property('ADBE Rotate Z'),fs=T.property('ADBE Scale'),fo=T.property('ADBE Opacity');fo.setValueAtTime(t0,0);fo.setValueAtTime(t1,100);fr.setValueAtTime(t0,-18);fr.setValueAtTime(t1,0);fs.setValueAtTime(t0,[88,88]);fs.setValueAtTime(t1,[100,100]);}
        else if(preset==='fadeDown'){var fd=T.property('ADBE Position'),fdo=T.property('ADBE Opacity'),fdb=fd.value;fdo.setValueAtTime(t0,0);fdo.setValueAtTime(t1,100);fd.setValueAtTime(t0,[fdb[0],fdb[1]-Math.max(12,Number(a.strength||45)*.4)]);fd.setValueAtTime(t1,fdb);}
        else if(preset==='stretchIn'){var sti=T.property('ADBE Scale'),sto=T.property('ADBE Opacity');sto.setValueAtTime(t0,0);sto.setValueAtTime(Math.min(t1,t0+.1),100);sti.setValueAtTime(t0,[25,100]);sti.setValueAtTime(t1,[100,100]);}
        else if(preset==='maskRise'){var mr=T.property('ADBE Position'),mro=T.property('ADBE Opacity'),mrb=mr.value,mrs=Math.max(18,Number(a.strength||45)*.6);mro.setValueAtTime(t0,0);mro.setValueAtTime(t1,100);mr.setValueAtTime(t0,[mrb[0],mrb[1]+mrs]);mr.setValueAtTime(t1,mrb);}
        else if(preset==='microBounce'){var mb=T.property('ADBE Scale'),mbo=T.property('ADBE Opacity'),mbm=Math.min(t1,t0+inD*.66);mbo.setValueAtTime(t0,0);mbo.setValueAtTime(Math.min(t1,t0+.08),100);mb.setValueAtTime(t0,[94,94]);mb.setValueAtTime(mbm,[102.5,102.5]);mb.setValueAtTime(t1,[100,100]);}
        else if(preset==='cinemaDrift'){var cd=T.property('ADBE Position'),cdo=T.property('ADBE Opacity'),cdb=cd.value,cds=Math.max(8,Number(a.strength||45)*.28);cdo.setValueAtTime(t0,0);cdo.setValueAtTime(t1,100);cd.setValueAtTime(t0,[cdb[0]-cds,cdb[1]+cds*.28]);cd.setValueAtTime(t1,cdb);}
        else if(preset==='splitCenter'){var spc=T.property('ADBE Scale'),spo=T.property('ADBE Opacity');spo.setValueAtTime(t0,0);spo.setValueAtTime(Math.min(t1,t0+.08),100);spc.setValueAtTime(t0,[2,100]);spc.setValueAtTime(t1,[100,100]);}
        else if(preset==='acSmoothRise'){var arp=T.property('ADBE Position'),aro=T.property('ADBE Opacity'),arb=arp.value,ary=Math.max(18,Number(a.strength||45)*.55);aro.setValueAtTime(t0,0);aro.setValueAtTime(t1,100);arp.setValueAtTime(t0,[arb[0],arb[1]+ary]);arp.setValueAtTime(t1,arb);}
        else if(preset==='acSoftSlide'){var asp=T.property('ADBE Position'),aso=T.property('ADBE Opacity'),asb=asp.value,asx=Math.max(20,Number(a.strength||45)*.72);aso.setValueAtTime(t0,0);aso.setValueAtTime(t1,100);asp.setValueAtTime(t0,[asb[0]-asx,asb[1]]);asp.setValueAtTime(t1,asb);}
        else if(preset==='acScaleEase'){var ase=T.property('ADBE Scale'),aseo=T.property('ADBE Opacity');aseo.setValueAtTime(t0,0);aseo.setValueAtTime(t1,100);ase.setValueAtTime(t0,[88,88]);ase.setValueAtTime(t1,[100,100]);}
        else if(preset==='acElasticSoft'){var aes=T.property('ADBE Scale'),aeo=T.property('ADBE Opacity'),aem=Math.min(t1,t0+inD*.72);aeo.setValueAtTime(t0,0);aeo.setValueAtTime(Math.min(t1,t0+.12),100);aes.setValueAtTime(t0,[91,91]);aes.setValueAtTime(aem,[102.8,102.8]);aes.setValueAtTime(t1,[100,100]);}
    }catch(e){}
    if(preset==='blur'){var aa={based:'chars',opacity:true,blur:true,blurV:Math.max(8,Number(a.strength||45)*.55),inDur:inD,startOffset:a.startOffset};GHAFHost._applyNativeAnimator(layer,g,aa);}
    else if(preset==='wordUp'){var bb={based:'words',opacity:true,position:true,px:0,py:Math.max(10,Number(a.strength||45)*.65),inDur:inD,startOffset:a.startOffset};GHAFHost._applyNativeAnimator(layer,g,bb);}
    else if(preset==='wordPop'){var wp={based:'words',opacity:true,scale:true,scaleV:Math.max(50,100-Number(a.strength||45)*.7),inDur:inD,startOffset:a.startOffset};GHAFHost._applyNativeAnimator(layer,g,wp);}
    else if(preset==='focus'){var fc={based:'chars',opacity:true,blur:true,blurV:Math.max(12,Number(a.strength||45)*.65),tracking:true,trackV:Math.max(20,Number(a.strength||45)*1.05),inDur:inD,startOffset:a.startOffset};GHAFHost._applyNativeAnimator(layer,g,fc);}
    else if(preset==='letterSpread'){var ls={based:'chars',opacity:true,tracking:true,trackV:Math.max(70,Number(a.strength||45)*1.7),inDur:inD,startOffset:a.startOffset};GHAFHost._applyNativeAnimator(layer,g,ls);}
    else if(preset==='lineReveal'){var lr={based:'lines',opacity:true,position:true,px:0,py:Math.max(12,Number(a.strength||45)*.55),inDur:inD,startOffset:a.startOffset};GHAFHost._applyNativeAnimator(layer,g,lr);}
    else if(preset==='wipeChars'){var wc={based:'chars',opacity:true,position:true,px:Math.max(9,Number(a.strength||45)*.42),py:0,inDur:inD,startOffset:a.startOffset};GHAFHost._applyNativeAnimator(layer,g,wc);}
    else if(preset==='softBlurUp'){var sbu={based:'words',opacity:true,position:true,px:0,py:Math.max(9,Number(a.strength||45)*.34),blur:true,blurV:Math.max(7,Number(a.strength||45)*.4),inDur:inD,startOffset:a.startOffset};GHAFHost._applyNativeAnimator(layer,g,sbu);}
    else if(preset==='kineticWords'){var kw={based:'words',opacity:true,position:true,px:0,py:Math.max(12,Number(a.strength||45)*.46),scale:true,scaleV:Math.max(72,100-Number(a.strength||45)*.38),inDur:inD,startOffset:a.startOffset};GHAFHost._applyNativeAnimator(layer,g,kw);}
    else if(preset==='wipeLeft'||preset==='wipeRight'){var wr={based:'chars',opacity:true,position:true,px:(preset==='wipeLeft'?-1:1)*Math.max(16,Number(a.strength||45)*.55),py:0,inDur:inD,startOffset:a.startOffset};GHAFHost._applyNativeAnimator(layer,g,wr);}
    else if(preset==='trackingTight'){var tt={based:'chars',opacity:true,tracking:true,trackV:-Math.max(18,Number(a.strength||45)*.7),inDur:inD,startOffset:a.startOffset};GHAFHost._applyNativeAnimator(layer,g,tt);}
    else if(preset==='headlineDrop'){var hd={based:'lines',opacity:true,position:true,px:0,py:-Math.max(14,Number(a.strength||45)*.5),inDur:inD,startOffset:a.startOffset};GHAFHost._applyNativeAnimator(layer,g,hd);}
    else if(preset==='acBlurFloat'){var abf={based:'words',opacity:true,position:true,px:0,py:Math.max(10,Number(a.strength||45)*.30),blur:true,blurV:Math.max(8,Number(a.strength||45)*.38),inDur:inD,startOffset:a.startOffset};GHAFHost._applyNativeAnimator(layer,g,abf);}
    else if(preset==='acTrackingFlow'){var atf={based:'chars',opacity:true,tracking:true,trackV:Math.max(42,Number(a.strength||45)*1.22),blur:true,blurV:Math.max(4,Number(a.strength||45)*.18),inDur:inD,startOffset:a.startOffset};GHAFHost._applyNativeAnimator(layer,g,atf);}
    else if(preset==='acWordCascade'){var awc={based:'words',opacity:true,position:true,px:0,py:Math.max(16,Number(a.strength||45)*.48),scale:true,scaleV:92,inDur:inD,startOffset:a.startOffset};GHAFHost._applyNativeAnimator(layer,g,awc);}
    else if(preset==='acLineSweep'){var als={based:'lines',opacity:true,position:true,px:Math.max(14,Number(a.strength||45)*.42),py:0,inDur:inD,startOffset:a.startOffset};GHAFHost._applyNativeAnimator(layer,g,als);}
    else if(preset==='tracking'||a.mode==='native')GHAFHost._applyNativeAnimator(layer,g,a);
    try{var props=[T.property('ADBE Opacity'),T.property('ADBE Position'),T.property('ADBE Scale'),T.property('ADBE Rotate Z')];for(var pi=0;pi<props.length;pi++){var pr=props[pi];if(!pr||pr.numKeys<1)continue;for(var ki=1;ki<=pr.numKeys;ki++){var dims=(pr.value instanceof Array)?pr.value.length:1,ease=[];for(var ei=0;ei<dims;ei++)ease.push(new KeyframeEase(0,92));pr.setTemporalEaseAtKey(ki,ease,ease);pr.setInterpolationTypeAtKey(ki,KeyframeInterpolationType.BEZIER,KeyframeInterpolationType.BEZIER);}}}catch(eEase){}
};
GHAFHost._addAnimatorProp = function(props, match, value){
    try{var p=props.addProperty(match);if(p){p.setValue(value);return p;}}catch(e){}return null;
};
GHAFHost._applyNativeAnimator = function(layer,g,a){
    try{
        var animators=layer.property("ADBE Text Properties").property("ADBE Text Animators");
        var an=animators.addProperty("ADBE Text Animator");an.name="VARNA Native Text Motion";
        var props=an.property("ADBE Text Animator Properties"),added=0;
        if(a.opacity){if(GHAFHost._addAnimatorProp(props,"ADBE Text Opacity",0))added++;}
        if(a.position){if(GHAFHost._addAnimatorProp(props,"ADBE Text Position 3D",[Number(a.px||0),Number(a.py==null?45:a.py),0]))added++;}
        if(a.scale){var sv=Number(a.scaleV==null?70:a.scaleV);if(GHAFHost._addAnimatorProp(props,"ADBE Text Scale 3D",[sv,sv,100]))added++;}
        if(a.rotation){if(GHAFHost._addAnimatorProp(props,"ADBE Text Rotation",Number(a.rotV||15)))added++;}
        if(a.blur){if(GHAFHost._addAnimatorProp(props,"ADBE Text Blur",[Number(a.blurV||20),Number(a.blurV||20)]))added++;}
        if((a.tracking || a.preset==="tracking")&&!/[\u0600-\u06ff]/.test(String(g.text||''))){if(GHAFHost._addAnimatorProp(props,"ADBE Text Tracking Amount",Number(a.trackV||40)))added++;}
        if(a.skew){if(GHAFHost._addAnimatorProp(props,"ADBE Text Skew",Number(a.skewV||20)))added++;}
        if(!added){try{an.remove();}catch(er){}return;}
        var sel=an.property("ADBE Text Selectors").addProperty("ADBE Text Selector");sel.name="VARNA IN · move marker / trim layer to retime";
        var adv=sel.property("ADBE Text Range Advanced");
        try{adv.property("ADBE Text Range Units").setValue(1);}catch(eu){}
        var based=a.based==="chars"?1:(a.based==="lines"?4:3);try{adv.property("ADBE Text Range Type2").setValue(based);}catch(eb){}
        try{var sm=adv.property("ADBE Text Selector Smoothness");if(sm)sm.setValue(100);}catch(eSm){}
        var sp=sel.property("ADBE Text Percent Start"),ep=sel.property("ADBE Text Percent End");if(ep)ep.setValue(100);
        if(sp){
            var off=Math.max(0,Number(a.startOffset)||0),td=Math.max(.03,Number(a.inDur||.35));
            var ex="function mt(n,f){try{for(var i=1;i<=marker.numKeys;i++){if(marker.key(i).comment==n)return marker.key(i).time;}}catch(e){}return f;}var ls=inPoint,le=Math.max(ls+.001,outPoint),a=Math.min(le-.001,ls+"+off+"),b=mt('IN',Math.min(le,a+"+td+"));b=Math.min(le,Math.max(a+.001,b));ease(time,a,Math.max(a+.001,b),0,100);";
            try{sp.expression=ex;}catch(eExp){var t0=layer.inPoint+off,te=Math.min(layer.outPoint,t0+td);sp.setValueAtTime(t0,0);sp.setValueAtTime(te,100);}
        }
    }catch(e){}
};
GHAFHost._findTextBox2 = function(layer, createIt){
    var parade=layer.property("ADBE Effect Parade"); if(!parade) return null;
    var i,n,m;
    for(i=1;i<=parade.numProperties;i++){
        var fx0=parade.property(i);
        n=String(fx0.name||"").replace(/\s+/g,"").toLowerCase();
        m=String(fx0.matchName||"").replace(/\s+/g,"").toLowerCase();
        if(n.indexOf("textbox2")>=0||m.indexOf("textbox2")>=0||String(fx0.name||"")==="GHAF Background") return fx0;
    }
    if(!createIt) return null;

    var candidates=[];
    try{
        if(app.effects){
            for(i=0;i<app.effects.length;i++){
                var e=app.effects[i],dn=String(e.displayName||""),mn=String(e.matchName||"");
                var norm=(dn+" "+mn).replace(/\s+/g,"").toLowerCase();
                if(norm.indexOf("textbox2")>=0){
                    if(mn)candidates.push(mn);
                    if(dn)candidates.push(dn);
                }
            }
        }
    }catch(eScan){}
    candidates=candidates.concat(["TextBox 2","TextBox2"]);
    for(i=0;i<candidates.length;i++){
        try{
            var fx=parade.addProperty(candidates[i]);
            if(fx){try{fx.name="GHAF Background";}catch(eN){}return fx;}
        }catch(eAdd){}
    }
    return null;
};
GHAFHost._findPropNamed = function(group, names){
    if(!group) return null;
    for(var i=1;i<=group.numProperties;i++){
        var p=group.property(i),nm=String(p.name||"");
        for(var j=0;j<names.length;j++) if(nm===names[j]) return p;
        try{if(p.numProperties>0){var r=GHAFHost._findPropNamed(p,names);if(r)return r;}}catch(e){}
    }
    return null;
};
GHAFHost._setNamed = function(group,names,val){
    var p=GHAFHost._findPropNamed(group,names);if(!p)return false;
    try{p.setValue(val);return true;}catch(e){return false;}
};
GHAFHost._nativeBgPrefix = "__GHAF_NATIVE_BG__";
GHAFHost._glassBlurPrefix = "__GHAF_GLASS_BLUR__";
GHAFHost._nativeBgFor = function(layer){
    var c=layer.containingComp,exact=GHAFHost._nativeBgPrefix+String(layer.name||'');
    for(var i=1;i<=c.numLayers;i++){var x=c.layer(i);try{if(String(x.name||'')===exact&&x.parent===layer)return x;}catch(e){}}
    for(i=1;i<=c.numLayers;i++){x=c.layer(i);if(String(x.name||'').indexOf(GHAFHost._nativeBgPrefix)===0&&String(x.name||'').indexOf('_R11_')<0&&String(x.name||'').indexOf(GHAFHost._nativeBgPrefix+'AE_TEXT_')!==0){try{if(x.parent===layer)return x;}catch(e2){}}}
    return null;
};
GHAFHost._removeNativeBg = function(layer){
    var c=layer.containingComp;
    for(var i=c.numLayers;i>=1;i--){
        var x=c.layer(i),nm=String(x.name||"");
        if(nm.indexOf(GHAFHost._nativeBgPrefix)===0){
            try{if(x.parent===layer){x.locked=false;x.remove();}}catch(e){}
        }
    }
    try{GHAFHost._removeGlassBlur(layer);}catch(eBlur){}
};
GHAFHost._glassBlurName=function(layer){return GHAFHost._glassBlurPrefix+String(layer.name||'Text');};
GHAFHost._glassBlurFor = function(layer){
    var c=layer.containingComp,nm=GHAFHost._glassBlurName(layer);for(var i=1;i<=c.numLayers;i++){var x=c.layer(i);if(String(x.name||'')===nm)return x;}return null;
};
GHAFHost._removeGlassBlur = function(layer){var c=layer.containingComp,nm=GHAFHost._glassBlurName(layer);for(var i=c.numLayers;i>=1;i--){var x=c.layer(i);if(String(x.name||'')===nm||String(x.name||'')===nm+'_EDGE'){try{x.locked=false;x.remove();}catch(e){}}}};
GHAFHost._applyGlassBlur = function(layer,bg,shapeLayer){
    try{
        var c=layer.containingComp,bl=GHAFHost._glassBlurFor(layer),nm=GHAFHost._glassBlurName(layer);
        if(!bl){bl=c.layers.addSolid([1,1,1],nm,c.width,c.height,c.pixelAspect,c.duration);bl.name=nm;bl.adjustmentLayer=true;bl.shy=true;bl.guideLayer=false;try{if(shapeLayer)bl.moveAfter(shapeLayer);else bl.moveAfter(layer);}catch(eM){}}
        bl.locked=false;bl.parent=null;bl.inPoint=layer.inPoint;bl.outPoint=layer.outPoint;bl.adjustmentLayer=true;bl.enabled=true;
        var tr=bl.property('ADBE Transform Group');try{tr.property('ADBE Anchor Point').setValue([c.width/2,c.height/2]);tr.property('ADBE Position').setValue([c.width/2,c.height/2]);tr.property('ADBE Scale').setValue([100,100]);tr.property('ADBE Opacity').setValue(100);}catch(eT){}
        var masks=bl.property('ADBE Mask Parade');while(masks.numProperties>0)masks.property(1).remove();var mk=masks.addProperty('ADBE Mask Atom');mk.name='VARNA R11 Glass Lens Mask';
        var pad=Number(bg.padding==null?38:bg.padding),round=Math.max(0,Number(bg.round==null?30:bg.round)),targetName=String(layer.name||'').replace(/\\/g,'\\\\').replace(/'/g,"\\'");
        mk.property('ADBE Mask Shape').expression="var t=thisComp.layer('"+targetName+"');var r=t.sourceRectAtTime(time,false);var p="+pad+";var a=thisLayer.fromComp(t.toComp([r.left-p,r.top-p]));var b=thisLayer.fromComp(t.toComp([r.left+r.width+p,r.top-p]));var c=thisLayer.fromComp(t.toComp([r.left+r.width+p,r.top+r.height+p]));var d=thisLayer.fromComp(t.toComp([r.left-p,r.top+r.height+p]));createPath([a,b,c,d],[],[],true);";
        try{mk.property('ADBE Mask Feather').setValue([Math.min(14,Math.max(2,round*.22)),Math.min(14,Math.max(2,round*.22))]);}catch(eF){}try{mk.property('ADBE Mask Expansion').setValue(1.2);}catch(eX){}
        var fx=bl.property('ADBE Effect Parade');while(fx.numProperties>0)try{fx.property(1).remove();}catch(eRm){break;}
        var ga=fx.addProperty('ADBE Gaussian Blur 2');ga.name='VARNA Lens Blur';try{ga.property(1).setValue(Math.max(0,Number(bg.glassBlur==null?24:bg.glassBlur)));}catch(eB){}try{ga.property(2).setValue(1);}catch(eR){}
        try{var td=fx.addProperty('ADBE Turbulent Displace');td.name='VARNA Lens Refraction';var lens=Math.max(0,Math.min(100,Number(bg.lensing==null?42:bg.lensing))),wave=Math.max(0,Math.min(100,Number(bg.edgeWave==null?14:bg.edgeWave)));GHAFHost._setNamed(td,['Amount'],Math.max(0.1,lens*.045+wave*.018));GHAFHost._setNamed(td,['Size'],Math.max(65,150-wave*.55));GHAFHost._setNamed(td,['Complexity'],1);GHAFHost._setNamed(td,['Evolution'],0);}catch(eTD){}
        try{var hs=fx.addProperty('ADBE HUE SATURATION');hs.name='VARNA Glass Saturation';var target=(Number(bg.glassSaturation==null?112:bg.glassSaturation)-100);for(var pi=1;pi<=hs.numProperties;pi++){var pr=hs.property(pi),pn=String(pr.name||'').toLowerCase();if(pn.indexOf('saturation')>=0){try{pr.setValue(target);}catch(eSat){}break;}}}catch(eHue){}
        bl.locked=true;try{c.hideShyLayers=true;}catch(eH){}return bl;
    }catch(e){return null;}
};
GHAFHost._glassRampPoints=function(layer,pad,angle,balance,x1,y1,x2,y2){
    var px1=Number(x1),py1=Number(y1),px2=Number(x2),py2=Number(y2),has=isFinite(px1)&&isFinite(py1)&&isFinite(px2)&&isFinite(py2);if(has){px1=Math.max(0,Math.min(1,px1));py1=Math.max(0,Math.min(1,py1));px2=Math.max(0,Math.min(1,px2));py2=Math.max(0,Math.min(1,py2));var ex0="var t=thisLayer.parent;var r=t.sourceRectAtTime(time,false);var p="+Number(pad||0)+";";return {start:ex0+"[r.left-p+(r.width+p*2)*"+px1+",r.top-p+(r.height+p*2)*"+py1+"];",end:ex0+"[r.left-p+(r.width+p*2)*"+px2+",r.top-p+(r.height+p*2)*"+py2+"];"};}var a=Number(angle==null?135:angle),b=Math.max(-100,Math.min(100,Number(balance||0))),ex="var t=thisLayer.parent;var r=t.sourceRectAtTime(time,false);var p="+Number(pad||0)+";var c=[r.left+r.width/2,r.top+r.height/2];var L=Math.max(r.width+p*2,r.height+p*2)*.72;var A="+a+"*Math.PI/180;var sh="+b+"/100*L*.38;";return {start:ex+"[c[0]-Math.cos(A)*L+Math.cos(A)*sh,c[1]-Math.sin(A)*L+Math.sin(A)*sh];",end:ex+"[c[0]+Math.cos(A)*L+Math.cos(A)*sh,c[1]+Math.sin(A)*L+Math.sin(A)*sh];"};
};
GHAFHost._addGlassRamp=function(shape,colorA,colorB,pad,angle,balance,x1,y1,x2,y2,options){
 try{var o=options||{},fx=shape.property('ADBE Effect Parade'),rp=fx.addProperty('ADBE Ramp');rp.name='VARNA Two Tint';
 var pts=GHAFHost._paintRampPoints(pad,angle,balance,x1,y1,x2,y2,o,false);
 rp.property(1).expression=pts.start;rp.property(3).expression=pts.end;rp.property(2).setValue(GHAFHost._hex(o.reverse?colorB:colorA));rp.property(4).setValue(GHAFHost._hex(o.reverse?colorA:colorB));rp.property(5).setValue(o.type==='radial'?2:1);rp.property(6).setValue(o.dither===false?0:8);rp.property(7).setValue(0);try{rp.moveTo(1);}catch(moveError){}return rp;
 }catch(e){return null;}
};
GHAFHost._continuousShape=function(vec,pad,round){
 var prop=vec.addProperty('ADBE Vector Shape - Group');prop.name='VARNA Continuous Corner';
 var expr='var r=thisLayer.parent.sourceRectAtTime(time,false),p='+Number(pad)+',q='+Number(round)+';var a=r.left-p,b=r.top-p,w=Math.max(2,r.width+2*p),h=Math.max(2,r.height+2*p),x=a+w,y=b+h,d=Math.max(0,Math.min(q,w*.46,h*.46)),k=d*.76;thisProperty.createPath([[a+d,b],[x-d,b],[x,b+d],[x,y-d],[x-d,y],[a+d,y],[a,y-d],[a,b+d]],[[-k,0],[0,0],[0,-k],[0,0],[k,0],[0,0],[0,k],[0,0]],[[0,0],[k,0],[0,0],[0,k],[0,0],[-k,0],[0,0],[0,-k]],true);';
 prop.property('ADBE Vector Shape').expression=expr;return prop;
};
GHAFHost._glassHelper=function(layer,bg,role,fillMode){
    try{var c=layer.containingComp,nm=GHAFHost._nativeBgPrefix+'_R11_'+role+'_'+String(layer.name||''),sh=null;for(var i=1;i<=c.numLayers;i++){var x=c.layer(i);if(String(x.name||'')===nm){sh=x;break;}}if(!sh){sh=c.layers.addShape();sh.name=nm;sh.parent=layer;sh.shy=true;try{sh.moveAfter(layer);}catch(eM){}}sh.locked=false;sh.inPoint=layer.inPoint;sh.outPoint=layer.outPoint;var tr=sh.property('ADBE Transform Group');try{tr.property('ADBE Position').setValue([Math.max(-500,Math.min(500,Number(bg.offsetX)||0)),Math.max(-500,Math.min(500,Number(bg.offsetY)||0))]);tr.property('ADBE Anchor Point').setValue([0,0]);tr.property('ADBE Scale').setValue([100,100]);}catch(eT){}var root=sh.property('ADBE Root Vectors Group');while(root.numProperties>0)root.property(1).remove();var grp=root.addProperty('ADBE Vector Group'),vec=grp.property('ADBE Vectors Group'),pad=Number(bg.padding==null?38:bg.padding),round=Number(bg.round==null?30:bg.round),rect=GHAFHost._continuousShape(vec,pad,round,bg.roundMode);if(fillMode){vec=sh.property('ADBE Root Vectors Group').property(1).property('ADBE Vectors Group');var f=vec.addProperty('ADBE Vector Graphic - Fill');f.property('ADBE Vector Fill Color').setValue(GHAFHost._hex(bg.hex||'#FFFFFF'));f.property('ADBE Vector Fill Opacity').setValue(Math.max(0,Number(bg.opacity==null?10:bg.opacity)));}else{vec=sh.property('ADBE Root Vectors Group').property(1).property('ADBE Vectors Group');var st=vec.addProperty('ADBE Vector Graphic - Stroke');st.property('ADBE Vector Stroke Color').setValue(GHAFHost._hex(bg.rimColor1||'#FFFFFF'));st.property('ADBE Vector Stroke Width').setValue(GHAFHost._paintNumber(bg.borderWidth,1.35,0,100));st.property('ADBE Vector Stroke Opacity').setValue(Math.max(0,Number(bg.borderOpacity==null?48:bg.borderOpacity)));}return sh;}catch(e){return null;}
};
GHAFHost._applyBgMarkerMotion=function(shape,bg){
    try{if(!shape||!bg||!bg.markerDriven||!shape.parent)return;var tr=shape.property('ADBE Transform Group'),op=tr.property('ADBE Opacity'),sc=tr.property('ADBE Scale'),ps=tr.property('ADBE Position'),mot=String(bg.motion||'none'),delay=Math.max(0,Number(bg.motionDelay||0)),dur=Math.max(.03,Number(bg.motionDur||.28)),od=Math.max(0,Number(bg.outDur||0));var pre="function mt(n,f){try{var m=thisLayer.parent.marker;for(var i=1;i<=m.numKeys;i++){if(m.key(i).comment==n)return m.key(i).time;}}catch(e){}return f;}var ls=thisLayer.parent.inPoint,le=Math.max(ls+.001,thisLayer.parent.outPoint),a=Math.min(le-.001,ls+"+delay+"),b=mt('IN',Math.min(le,a+"+dur+"));b=Math.min(le,Math.max(a+.001,b));var qi="+(mot==='none'?"1":"ease(time,a,Math.max(a+.001,b),0,1)")+";var c=mt('OUT',Math.max(b,le-"+od+"));c=Math.max(b,Math.min(le-.001,c));var qo="+(od>0&&String(bg.outPreset||'none')!=='none'?"ease(time,c,le,0,1)":"0")+";";if(op)op.expression=pre+'(time<ls||time>le)?0:value*qi*(1-qo);';if(sc){if(mot==='orbPulse'||mot==='glassWave')sc.expression=pre+'var v=value;var k=.94+.06*qi+Math.sin(time*'+(mot==='orbPulse'?'5':'3')+')*'+(mot==='orbPulse'?'.025':'.012')+'*qi;[v[0]*k*(1-qo),v[1]*k*(1-qo)];';else if(mot==='centerReveal')sc.expression=pre+'var v=value;var x=Math.max(2,v[0]*qi);[x*(1-qo)+2*qo,v[1]];';else if((mot==='softScale'||mot==='pop'))sc.expression=pre+'var v=value;var k=.90+.10*qi;[v[0]*k*(1-qo)+v[0]*.92*qo,v[1]*k*(1-qo)+v[1]*.92*qo];';}if(ps&&mot==='cosmicFloat')ps.expression=pre+'var v=value;[v[0]+Math.sin(time*1.8)*4*qi,v[1]+9*(1-qi)+Math.cos(time*1.4)*3*qi];';else if(ps&&(mot==='glide'||mot==='slide'||mot==='float'))ps.expression=pre+'var v=value;[v[0],v[1]+12*(1-qi)+12*qo];';}catch(e){}
};
GHAFHost._applyNativeBg = function(layer,bg){
    try{
        var c=layer.containingComp;/* R12 cleanup: remove the experimental R11 helper layers so old previews cannot stack over the restored glass. */for(var ci=c.numLayers;ci>=1;ci--){try{var cl=c.layer(ci),cn=String(cl.name||'');if(cn.indexOf(GHAFHost._nativeBgPrefix+'_R11_')===0&&cl.parent===layer){cl.locked=false;cl.remove();}}catch(eClean){}}var sh=GHAFHost._nativeBgFor(layer);
        if(!sh){
            sh=c.layers.addShape();sh.name=GHAFHost._nativeBgPrefix+layer.name;sh.shy=true;sh.guideLayer=false;sh.parent=layer;
            try{sh.moveAfter(layer);}catch(eMove){}
        }
        sh.locked=false;sh.inPoint=layer.inPoint;sh.outPoint=layer.outPoint;
        var ownFx=sh.property('ADBE Effect Parade');for(var fi=ownFx.numProperties;fi>=1;fi--){var fe=ownFx.property(fi);if(/^(VARNA |GHAF )/.test(String(fe.name)))fe.remove();}
        var tr=sh.property("ADBE Transform Group");
        try{tr.property("ADBE Position").setValue([0,0]);tr.property("ADBE Anchor Point").setValue([0,0]);tr.property("ADBE Scale").setValue([100,100]);tr.property("ADBE Opacity").setValue(100);}catch(eBase){}
        var root=sh.property("ADBE Root Vectors Group");while(root.numProperties>0)root.property(1).remove();
        var pad=Number(bg.padding==null?38:bg.padding),round=Number(bg.round==null?30:bg.round),style=String(bg.style||"solid"),grad2=GHAFHost._hex(bg.gradientColor2||"#DFF5FF"),rim1=GHAFHost._hex(bg.rimColor1||"#FFFFFF"),rim2=GHAFHost._hex(bg.rimColor2||bg.gradientColor2||"#BFD7E8"),gx1=Math.max(.02,Math.min(.98,Number(bg.gradientX1==null?.18:bg.gradientX1))),gy1=Math.max(.02,Math.min(.98,Number(bg.gradientY1==null?.18:bg.gradientY1))),gx2=Math.max(.02,Math.min(.98,Number(bg.gradientX2==null?.82:bg.gradientX2))),gy2=Math.max(.02,Math.min(.98,Number(bg.gradientY2==null?.82:bg.gradientY2))),gb=Math.max(-100,Math.min(100,Number(bg.gradientBalance==null?0:bg.gradientBalance))),ra=Number(bg.rimAngle==null?135:bg.rimAngle)*Math.PI/180,edgeDepth=Math.max(0,Math.min(100,Number(bg.edgeDepth==null?46:bg.edgeDepth))),lensing=Math.max(0,Math.min(100,Number(bg.lensing==null?38:bg.lensing))),edgeWave=Math.max(0,Math.min(100,Number(bg.edgeWave==null?14:bg.edgeWave)));
        if(style!=="liquid")GHAFHost._removeGlassBlur(layer);
        var grp=root.addProperty("ADBE Vector Group");grp.name="GHAF Glass Main";var vec=grp.property("ADBE Vectors Group");
        GHAFHost._continuousShape(vec,pad,round,bg.roundMode);
        vec=sh.property("ADBE Root Vectors Group").property(1).property("ADBE Vectors Group");var fill=vec.addProperty("ADBE Vector Graphic - Fill");fill.name="GHAF Fill";fill.property("ADBE Vector Fill Color").setValue(GHAFHost._hex(bg.hex||"#FFFFFF"));fill.property("ADBE Vector Fill Opacity").setValue(Number(bg.opacity==null?14:bg.opacity));
        vec=sh.property("ADBE Root Vectors Group").property(1).property("ADBE Vectors Group");var stroke=vec.addProperty("ADBE Vector Graphic - Stroke");stroke.name="GHAF Glass Border";stroke.property("ADBE Vector Stroke Color").setValue(style==="liquid"?[1,1,1]:GHAFHost._hex(bg.hex||"#0E1528"));stroke.property("ADBE Vector Stroke Width").setValue(style==="liquid"?1.35:0.7);stroke.property("ADBE Vector Stroke Opacity").setValue(style==="liquid"?Number(bg.borderOpacity==null?38:bg.borderOpacity):0);
        /* R10 optical glass layering: a cool tint, dual rim and low edge depth. This is intentionally native Shape-layer work so it stays editable in AE. */
        if(style==="liquid"&&bg.gradientEnabled!==false){
            var tg=root.addProperty("ADBE Vector Group");tg.name="VARNA Glass Gradient Tint";var tv=tg.property("ADBE Vectors Group"),trc=tv.addProperty("ADBE Vector Shape - Rect");
            var tintW=.54+Math.abs(gx2-gx1)*.34,tintH=.42+Math.abs(gy2-gy1)*.24,tintX=(gx2-.5)*.72,tintY=(gy2-.5)*.72+(gb/100)*.10;trc.property("ADBE Vector Rect Size").expression='var t=thisLayer.parent;var r=t.sourceRectAtTime(time,false);[Math.max(20,(r.width+'+(pad*2)+')*'+tintW+'),Math.max(10,(r.height+'+(pad*2)+')*'+tintH+')];';
            trc.property("ADBE Vector Rect Position").expression='var t=thisLayer.parent;var r=t.sourceRectAtTime(time,false);[r.left+r.width/2+(r.width+'+(pad*2)+')*'+tintX+',r.top+r.height/2+(r.height+'+(pad*2)+')*'+tintY+'];';trc.property("ADBE Vector Rect Roundness").setValue(Math.max(6,round*.9));
            var tf=tv.addProperty("ADBE Vector Graphic - Fill");tf.property("ADBE Vector Fill Color").setValue(grad2);tf.property("ADBE Vector Fill Opacity").setValue(Math.max(2,Math.min(24,Number(bg.opacity==null?14:bg.opacity)*.36)));
        }
        if(style==="liquid"){
            GHAFHost._applyGlassBlur(layer,bg,sh);
            var hi=root.addProperty("ADBE Vector Group");hi.name="GHAF Glass Highlight";var hv=hi.property("ADBE Vectors Group");
            var hr=hv.addProperty("ADBE Vector Shape - Rect");hr.name="GHAF Highlight Rect";
            hr.property("ADBE Vector Rect Size").expression='var t=thisLayer.parent;var r=t.sourceRectAtTime(time,false);[Math.max(20,r.width+'+(pad*1.35)+'),Math.max(8,(r.height+'+(pad*.7)+')*.42)];';
            var hiX=(gx1-.5)*.46,hiY=(gy1-.5)*.46;hr.property("ADBE Vector Rect Position").expression='var t=thisLayer.parent;var r=t.sourceRectAtTime(time,false);[r.left+r.width/2+(r.width+'+(pad*2)+')*'+hiX+',r.top+r.height/2+(r.height+'+(pad*2)+')*'+hiY+'];';
            hr.property("ADBE Vector Rect Roundness").setValue(Math.max(6,round*.82));
            var hf=hv.addProperty("ADBE Vector Graphic - Fill");hf.property("ADBE Vector Fill Color").setValue([1,1,1]);hf.property("ADBE Vector Fill Opacity").setValue(Number(bg.highlightOpacity==null?18:bg.highlightOpacity));
            var rim=root.addProperty("ADBE Vector Group");rim.name="GHAF Glass Rim";var rv=rim.property("ADBE Vectors Group");var rr=rv.addProperty("ADBE Vector Shape - Rect");rr.property("ADBE Vector Rect Size").expression='var t=thisLayer.parent;var r=t.sourceRectAtTime(time,false);[r.width+'+(pad*2-5)+',r.height+'+(pad*2-5)+'];';rr.property("ADBE Vector Rect Position").expression='var t=thisLayer.parent;var r=t.sourceRectAtTime(time,false);[r.left+r.width/2,r.top+r.height/2];';rr.property("ADBE Vector Rect Roundness").setValue(Math.max(4,round-3));var rs=rv.addProperty("ADBE Vector Graphic - Stroke");rs.property("ADBE Vector Stroke Color").setValue(rim1);rs.property("ADBE Vector Stroke Width").setValue(.65);rs.property("ADBE Vector Stroke Opacity").setValue(Math.max(6,Number(bg.highlightOpacity==null?18:bg.highlightOpacity)*.55));
            if(bg.rimGradient!==false){var r2=root.addProperty("ADBE Vector Group");r2.name="VARNA Glass Cool Rim";var r2v=r2.property("ADBE Vectors Group"),r2r=r2v.addProperty("ADBE Vector Shape - Rect");r2r.property("ADBE Vector Rect Size").expression='var t=thisLayer.parent;var r=t.sourceRectAtTime(time,false);[r.width+'+(pad*2-2)+',r.height+'+(pad*2-2)+'];';var rox=Math.cos(ra)*(0.4+edgeWave*.018),roy=Math.sin(ra)*(0.4+edgeWave*.018);r2r.property("ADBE Vector Rect Position").expression='var t=thisLayer.parent;var r=t.sourceRectAtTime(time,false);[r.left+r.width/2+'+rox+',r.top+r.height/2+'+roy+'];';r2r.property("ADBE Vector Rect Roundness").setValue(Math.max(4,round-1));var r2s=r2v.addProperty("ADBE Vector Graphic - Stroke");r2s.property("ADBE Vector Stroke Color").setValue(rim2);r2s.property("ADBE Vector Stroke Width").setValue(.9);r2s.property("ADBE Vector Stroke Opacity").setValue(Math.max(5,Number(bg.borderOpacity==null?38:bg.borderOpacity)*.48));}
            var dep=root.addProperty("ADBE Vector Group");dep.name="VARNA Glass Depth Edge";var dv=dep.property("ADBE Vectors Group"),dr=dv.addProperty("ADBE Vector Shape - Rect");dr.property("ADBE Vector Rect Size").expression='var t=thisLayer.parent;var r=t.sourceRectAtTime(time,false);[r.width+'+(pad*2+1)+',r.height+'+(pad*2+1)+'];';dr.property("ADBE Vector Rect Position").expression='var t=thisLayer.parent;var r=t.sourceRectAtTime(time,false);[r.left+r.width/2,r.top+r.height/2+1.25];';dr.property("ADBE Vector Rect Roundness").setValue(Math.max(4,round+1));var ds2=dv.addProperty("ADBE Vector Graphic - Stroke");ds2.property("ADBE Vector Stroke Color").setValue([.38,.41,.46]);ds2.property("ADBE Vector Stroke Width").setValue(1.05+edgeWave*.012);ds2.property("ADBE Vector Stroke Opacity").setValue(Math.max(2,edgeDepth*.24));
            var lens=root.addProperty("ADBE Vector Group");lens.name="VARNA Glass Lens Edge";var lv=lens.property("ADBE Vectors Group"),lr=lv.addProperty("ADBE Vector Shape - Rect");lr.property("ADBE Vector Rect Size").expression='var t=thisLayer.parent;var r=t.sourceRectAtTime(time,false);[r.width+'+(pad*2+3)+',r.height+'+(pad*2+3)+'];';lr.property("ADBE Vector Rect Position").expression='var t=thisLayer.parent;var r=t.sourceRectAtTime(time,false);[r.left+r.width/2-0.6,r.top+r.height/2-0.6];';lr.property("ADBE Vector Rect Roundness").setValue(Math.max(5,round+2));var ls=lv.addProperty("ADBE Vector Graphic - Stroke");ls.property("ADBE Vector Stroke Color").setValue([1,1,1]);ls.property("ADBE Vector Stroke Width").setValue(1.0+edgeWave*.01);ls.property("ADBE Vector Stroke Opacity").setValue(Math.max(2,lensing*.22));
            try{
                var fx=sh.property("ADBE Effect Parade"),ds=fx.property("GHAF Glass Shadow");if(!ds){ds=fx.addProperty("ADBE Drop Shadow");ds.name="GHAF Glass Shadow";}
                try{ds.property(1).setValue([0,0,0]);}catch(e1){}try{ds.property(2).setValue(Number(bg.shadowOpacity==null?20:bg.shadowOpacity));}catch(e2){}try{ds.property(4).setValue(8);}catch(e3){}try{ds.property(5).setValue(14);}catch(e4){}
            }catch(eShadow){}
            try{var bfx=sh.property("ADBE Effect Parade"),bev=bfx.property("VARNA Glass Bevel");if(!bev){bev=bfx.addProperty("ADBE Bevel Alpha");bev.name="VARNA Glass Bevel";}GHAFHost._setNamed(bev,["Edge Thickness","Thickness"],Math.max(.5,Math.min(4,1+lensing*.025)));GHAFHost._setNamed(bev,["Light Intensity","Intensity"],Math.max(.15,Math.min(1.4,.35+lensing*.008)));}catch(eBevel){}
            if(bg.glowEnabled){try{var gfx=sh.property("ADBE Effect Parade"),gl=gfx.property("GHAF Glass Glow");if(!gl){gl=gfx.addProperty("ADBE Glo2");gl.name="GHAF Glass Glow";}GHAFHost._setNamed(gl,["Glow Threshold"],35);GHAFHost._setNamed(gl,["Glow Radius"],Math.max(0,Number(bg.glowRadius==null?28:bg.glowRadius)));GHAFHost._setNamed(gl,["Glow Intensity"],Math.max(0,Number(bg.glowIntensity==null?.7:bg.glowIntensity)));GHAFHost._setNamed(gl,["Color A","Glow Color"],GHAFHost._hex(bg.glowColor||bg.hex||"#FFFFFF"));}catch(eGlow){}}
        }
        if(style!=="liquid"&&bg.gradientEnabled!==false){if(!GHAFHost._addGlassRamp(sh,bg.hex||'#FFFFFF',bg.gradientColor2||bg.hex||'#FFFFFF',pad,bg.gradientAngle,bg.gradientBalance,bg.gradientX1,bg.gradientY1,bg.gradientX2,bg.gradientY2,bg.surfaceGradient))throw Error('SOLID_GRADIENT_FAILED');}
        if(style!=="liquid"&&Number(bg.borderOpacity||0)>0&&GHAFHost._paintNumber(bg.borderWidth,1.35,0,100)>0){
         var sr=GHAFHost._glassHelper(layer,bg,'SOLID_RIM',false);if(!sr)throw Error('SOLID_RIM_FAILED');
         if(bg.rimGradient!==false&&!GHAFHost._addGlassRamp(sr,bg.rimColor1||'#FFFFFF',bg.rimColor2||bg.rimColor1||'#FFFFFF',pad,bg.rimAngle,bg.rimBalance,null,null,null,null,bg.strokeGradient))throw Error('SOLID_RIM_GRADIENT_FAILED');
         var srt=sr.property('ADBE Transform Group'),solidLink='thisComp.layer('+GHAFJSON.stringify(sh.name)+').transform.';
         srt.property('ADBE Anchor Point').expression=solidLink+'anchorPoint';srt.property('ADBE Position').expression=solidLink+'position';srt.property('ADBE Scale').expression=solidLink+'scale';srt.property('ADBE Opacity').expression=solidLink+'opacity';
        }
        if(style!=="liquid"&&Number(bg.shadowOpacity||0)>0){var solidShadow=sh.property('ADBE Effect Parade').addProperty('ADBE Drop Shadow');solidShadow.name='VARNA Solid Shadow';GHAFHost._setFx(solidShadow,2,Number(bg.shadowOpacity));GHAFHost._setFx(solidShadow,4,4);GHAFHost._setFx(solidShadow,5,16);}
        var mot=String(bg.motion||"none"),md=Math.max(.05,Number(bg.motionDur||.28)),t0=Math.min(layer.outPoint-.03,layer.inPoint+Math.max(0,Number(bg.motionDelay)||0)),t1=Math.min(layer.outPoint,t0+md),t3=layer.outPoint;
        if(mot!=="none"&&bg.markerDriven){
            var opm=tr.property("ADBE Opacity"),scm=tr.property("ADBE Scale"),psm=tr.property("ADBE Position"),inSX=100,inSY=100,inX=0,inY=0,outSX=100,outSY=100,outX=0,outY=0;
            if(mot==="pop"){inSX=92;inSY=92;}else if(mot==="softScale"){inSX=96;inSY=96;}else if(mot==="reveal"){inSX=18;inSY=100;}else if(mot==="centerReveal"){inSX=2;inSY=100;}else if(mot==="slide"){inY=18;}else if(mot==="glide"){inY=12;}else if(mot==="float"){inY=14;}
            var opKind=String(bg.outPreset||'none');if(opKind==='scaleOut'){outSX=94;outSY=94;}else if(opKind==='splitClose'){outSX=2;outSY=100;}else if(opKind==='slideDown'){outY=16;}else if(opKind==='softDropOut'){outY=14;}else if(opKind==='slideLeftOut'){outX=-22;}else if(opKind==='slideRightOut'){outX=22;}
            var od=Math.max(0,Number(bg.outDur||0)),fo=Math.max(layer.inPoint,t3-od);
            var common="function pm(n,f){try{var m=thisLayer.parent.marker;for(var i=1;i<=m.numKeys;i++){if(m.key(i).comment==n)return m.key(i).time;}}catch(e){}return f;}var ls=thisLayer.parent.inPoint,le=Math.max(ls+.001,thisLayer.parent.outPoint),a=Math.min(le-.001,ls+"+Math.max(0,Number(bg.motionDelay)||0)+"),b=pm('IN',Math.min(le,a+"+md+"));b=Math.min(le,Math.max(a+.001,b));var p=ease(time,a,Math.max(a+.001,b),0,1);var oa=pm('OUT',Math.max(b,le-"+od+"));oa=Math.max(b,Math.min(le-.001,oa));var q="+(od>0&&opKind!=='none'?"ease(time,oa,le,0,1)":"0")+";";
            if(opm)try{opm.expression=common+"100*p*(1-q);";}catch(eMOp){}
            if(psm)try{psm.expression=common+"var v=value;[v[0]+("+inX+")*(1-p)+("+outX+")*q,v[1]+("+inY+")*(1-p)+("+outY+")*q];";}catch(eMPos){}
            if(scm)try{scm.expression=common+"var v=value;var sx=("+inSX+")*(1-p)+v[0]*p,sy=("+inSY+")*(1-p)+v[1]*p;[sx*(1-q)+("+outSX+")*q,sy*(1-q)+("+outSY+")*q];";}catch(eMSc){}
        }else{
        if(mot!=="none"){
            var op=tr.property("ADBE Opacity"),sc=tr.property("ADBE Scale"),ps=tr.property("ADBE Position");
            if(mot==="fade"&&op){op.setValueAtTime(t0,0);op.setValueAtTime(t1,100);}
            else if(mot==="pop"&&op&&sc){op.setValueAtTime(t0,0);op.setValueAtTime(t1,100);sc.setValueAtTime(t0,[92,92]);sc.setValueAtTime(t1,[100,100]);}
            else if(mot==="slide"&&op&&ps){op.setValueAtTime(t0,0);op.setValueAtTime(t1,100);ps.setValueAtTime(t0,[0,18]);ps.setValueAtTime(t1,[0,0]);}
            else if(mot==="glide"&&op&&ps){op.setValueAtTime(t0,0);op.setValueAtTime(t1,100);ps.setValueAtTime(t0,[0,12]);ps.setValueAtTime(t1,[0,0]);}
            else if(mot==="breathe"&&sc){var mid=Math.min(t3,t1+Math.max(.15,(t3-t1)*.45));sc.setValueAtTime(t0,[98,98]);sc.setValueAtTime(t1,[100,100]);sc.setValueAtTime(mid,[101.5,101.5]);sc.setValueAtTime(t3,[100,100]);}
            else if(mot==="softScale"&&op&&sc){op.setValueAtTime(t0,0);op.setValueAtTime(t1,100);sc.setValueAtTime(t0,[96,96]);sc.setValueAtTime(t1,[100,100]);}
            else if((mot==="reveal"||mot==="centerReveal")&&op&&sc){op.setValueAtTime(t0,0);op.setValueAtTime(t1,100);sc.setValueAtTime(t0,[mot==="centerReveal"?2:18,100]);sc.setValueAtTime(t1,[100,100]);}
            else if(mot==="float"&&op&&ps){op.setValueAtTime(t0,0);op.setValueAtTime(t1,100);ps.setValueAtTime(t0,[0,14]);ps.setValueAtTime(t1,[0,0]);var fm=Math.min(t3,t1+Math.max(.2,(t3-t1)*.55));ps.setValueAtTime(fm,[0,-3]);ps.setValueAtTime(t3,[0,0]);}
        }
        }
        var outD=Math.max(0,Number(bg.outDur||0)),outPreset=String(bg.outPreset||'none');if(!bg.markerDriven&&outD>0&&outPreset!=='none'){var ot1=Math.max(layer.inPoint,t3-outD),oop=tr.property('ADBE Opacity'),osc=tr.property('ADBE Scale'),ops=tr.property('ADBE Position');if((outPreset==='fade'||outPreset==='blurOut')&&oop){oop.setValueAtTime(ot1,100);oop.setValueAtTime(t3,0);}else if(outPreset==='scaleOut'&&osc&&oop){osc.setValueAtTime(ot1,[100,100]);osc.setValueAtTime(t3,[94,94]);oop.setValueAtTime(ot1,100);oop.setValueAtTime(t3,0);}else if(outPreset==='splitClose'&&osc&&oop){osc.setValueAtTime(ot1,[100,100]);osc.setValueAtTime(t3,[2,100]);oop.setValueAtTime(ot1,100);oop.setValueAtTime(t3,0);}else if(outPreset==='slideDown'&&ops&&oop){ops.setValueAtTime(ot1,[0,0]);ops.setValueAtTime(t3,[0,16]);oop.setValueAtTime(ot1,100);oop.setValueAtTime(t3,0);}else if(outPreset==='slideLeftOut'&&ops&&oop){ops.setValueAtTime(ot1,[0,0]);ops.setValueAtTime(t3,[-22,0]);oop.setValueAtTime(ot1,100);oop.setValueAtTime(t3,0);}else if(outPreset==='slideRightOut'&&ops&&oop){ops.setValueAtTime(ot1,[0,0]);ops.setValueAtTime(t3,[22,0]);oop.setValueAtTime(ot1,100);oop.setValueAtTime(t3,0);}else if(outPreset==='softDropOut'&&ops&&oop){ops.setValueAtTime(ot1,[0,0]);ops.setValueAtTime(t3,[0,14]);oop.setValueAtTime(ot1,100);oop.setValueAtTime(t3,0);}}
        try{var props=[tr.property('ADBE Opacity'),tr.property('ADBE Scale'),tr.property('ADBE Position')];for(var ei=0;ei<props.length;ei++)if(props[ei]&&props[ei].numKeys>0){var pr=props[ei];for(var ki=1;ki<=pr.numKeys;ki++){var dims=(ei===0?1:2),ease=[],di;for(di=0;di<dims;di++)ease.push(new KeyframeEase(0,92));pr.setTemporalEaseAtKey(ki,ease,ease);pr.setInterpolationTypeAtKey(ki,KeyframeInterpolationType.BEZIER,KeyframeInterpolationType.BEZIER);}}}catch(easeError){}
        sh.enabled=true;sh.locked=true;try{c.hideShyLayers=true;}catch(eHide){}return true;
    }catch(e){return false;}
};
GHAFHost._applyTextBoxBg = function(layer,bg){
    var fx=GHAFHost._findTextBox2(layer,true); if(!fx) return false;
    try{fx.enabled=true;}catch(ee){}
    var changed=false;
    changed=GHAFHost._setNamed(fx,["Color","Background Color","Fill Color","Box Color"],GHAFHost._hex(bg.hex||"#000000"))||changed;
    changed=GHAFHost._setNamed(fx,["Opacity","Fill Opacity","Background Opacity","Box Opacity"],Number(bg.opacity==null?70:bg.opacity))||changed;
    changed=GHAFHost._setNamed(fx,["Uniform Expansion","Expansion","Padding","Box Padding"],Number(bg.padding==null?36:bg.padding))||changed;
    changed=GHAFHost._setNamed(fx,["Roundness","Radius","Corner Radius"],Number(bg.round==null?24:bg.round))||changed;
    GHAFHost._setNamed(fx,["Enabled","Enable","Use Background","Background Enabled"],1);
    return !!fx;
};
GHAFHost._removeTextBoxBg = function(layer){
    var old=GHAFHost._findTextBox2(layer,false);if(old)try{old.remove();}catch(e){}
};
/* Native optical approximation: tint surface, gradient rim and a masked edge lens. */
GHAFHost._setFx=function(fx,index,value){var p=fx.property(index);if(!p)throw Error('Missing effect property '+index);p.setValue(value);};
GHAFHost._roundedMaskExpr=function(shapeName,pad,round,inset){
 var name=GHAFJSON.stringify(shapeName);
 return 'var s=thisComp.layer('+name+');var t=s.parent;var r=t.sourceRectAtTime(time,false);var p='+pad+'-'+(inset||0)+';var x=r.left-p,y=r.top-p,w=Math.max(1,r.width+2*p),h=Math.max(1,r.height+2*p),R=Math.max(0,Math.min('+round+'-'+(inset||0)+',w/2,h/2)),k=.55228475;var v=[[x+R,y],[x+w-R,y],[x+w,y+R],[x+w,y+h-R],[x+w-R,y+h],[x+R,y+h],[x,y+h-R],[x,y+R]];var it=[[-k*R,0],[0,0],[0,-k*R],[0,0],[k*R,0],[0,0],[0,k*R],[0,0]],ot=[[0,0],[k*R,0],[0,0],[0,k*R],[0,0],[-k*R,0],[0,0],[0,-k*R]];function pt(a){return thisLayer.fromComp(s.toComp(a));}var vv=[],ii=[],oo=[];for(var i=0;i<v.length;i++){var a=pt(v[i]);vv.push(a);ii.push(pt(v[i]+it[i])-a);oo.push(pt(v[i]+ot[i])-a);}createPath(vv,ii,oo,true);';
};
GHAFHost._opticalBlur=function(text,surface,bg){
 var c=text.containingComp,pad=Number(bg.padding==null?38:bg.padding),round=Math.max(0,Number(bg.round==null?30:bg.round)),blur=Math.max(0,Number(bg.glassBlur==null?24:bg.glassBlur)),lens=Math.max(0,Number(bg.lensing==null?42:bg.lensing)),wave=Math.max(0,Number(bg.edgeWave==null?14:bg.edgeWave)),layers=[];
 function adjustment(suffix,ring){
  var l=c.layers.addSolid([1,1,1],GHAFHost._glassBlurName(text)+suffix,c.width,c.height,c.pixelAspect,c.duration);layers.push(l);l.adjustmentLayer=true;l.inPoint=text.inPoint;l.outPoint=text.outPoint;l.shy=true;l.moveAfter(surface);
  var masks=l.property('ADBE Mask Parade'),mask=masks.addProperty('ADBE Mask Atom');mask.property('ADBE Mask Shape').expression=GHAFHost._roundedMaskExpr(surface.name,pad,round,0);mask.property('ADBE Mask Feather').setValue(ring?[2,2]:[1,1]);
  if(ring){mask=masks.addProperty('ADBE Mask Atom');mask.maskMode=MaskMode.SUBTRACT;mask.property('ADBE Mask Shape').expression=GHAFHost._roundedMaskExpr(surface.name,pad,round,Math.max(4,6+lens*.08));mask.property('ADBE Mask Feather').setValue([2,2]);}
  l.property('ADBE Transform Group').property('ADBE Opacity').expression='thisComp.layer('+GHAFJSON.stringify(surface.name)+').transform.opacity';return l;
 }
 if(blur>0||Number(bg.glassSaturation==null?100:bg.glassSaturation)!==100){var l=adjustment('',false),fx=l.property('ADBE Effect Parade').addProperty('ADBE Gaussian Blur 2');GHAFHost._setFx(fx,1,blur);GHAFHost._setFx(fx,3,1);var hs=l.property('ADBE Effect Parade').addProperty('ADBE HUE SATURATION');hs.name='VARNA Glass Saturation';hs.property('ADBE HUE SATURATION-0004').setValue(Math.max(-100,Math.min(100,Number(bg.glassSaturation==null?100:bg.glassSaturation)-100)));}
 if(lens>0||wave>0){var e=adjustment('_EDGE',true),td=e.property('ADBE Effect Parade').addProperty('ADBE Turbulent Displace');td.name='VARNA Edge Refraction';GHAFHost._setFx(td,2,lens*.06+wave*.024+Number(bg.roughness||0)*.005);GHAFHost._setFx(td,3,Math.max(40,135-wave*.55));GHAFHost._setFx(td,5,1);}
 return layers;
};
GHAFHost._aeGlassInfo=function(){
 try{var effects=app.effects||[];for(var i=0;i<effects.length;i++){var item=effects[i],name=String(item.displayName||''),match=String(item.matchName||'');if(name==='AE Glass'||/SphereLabAEGlass/i.test(match))return {available:true,name:name,matchName:match};}}catch(e){}
 return {available:false,name:'',matchName:''};
};
GHAFHost.glassEffectStatus=function(){return GHAFHost._ok(GHAFHost._aeGlassInfo());};
GHAFHost._applyAEGlass=function(shape,settings){
 var found=GHAFHost._aeGlassInfo();if(!found.available||!found.matchName)throw Error('AE Glass در After Effects نصب یا بارگذاری نشده است');
 var fx=shape.property('ADBE Effect Parade').addProperty(found.matchName);if(!fx)throw Error('افکت AE Glass به Shape اضافه نشد');
 fx.name='VARNA · AE Glass';shape.adjustmentLayer=true;
 var keys=[['Light Angle','lightAngle',45],['Light Intensity','lightIntensity',100],['Refraction','refraction',100],['Depth','depth',70],['Dispersion','dispersion',50],['Frost','frost',0],['Splay','splay',0],['Magnify','magnify',0],['Effect Scale','effectScale',2],['Rim Scale','rimScale',.5]];
 for(var i=0;i<keys.length;i++){var k=keys[i],val=settings&&settings[k[1]]!=null?Number(settings[k[1]]):k[2];if(!isFinite(val))throw Error('مقدار نامعتبر AE Glass: '+k[0]);if(!GHAFHost._setNamed(fx,[k[0]],val))throw Error('کنترل AE Glass پیدا نشد: '+k[0]);}
 return fx;
};
GHAFHost._applyAEGlassBg=function(text,bg){
 var c=text.containingComp,old=GHAFHost._layerSet(c),shape=null;
 try{
  GHAFHost._removeNativeBg(text);GHAFHost._removeTextBoxBg(text);
  shape=GHAFHost._glassHelper(text,bg,'AE_GLASS',true);
  if(!shape)throw Error('ساخت Shape دنبال‌کنندهٔ متن ناموفق بود');
  shape.name=GHAFHost._nativeBgPrefix+text.name;
  var vec=shape.property('ADBE Root Vectors Group').property(1).property('ADBE Vectors Group');
  var shapeFill=null;for(var vi=1;vi<=vec.numProperties;vi++){var prop=vec.property(vi);if(prop.matchName==='ADBE Vector Graphic - Fill'){shapeFill=prop.property('ADBE Vector Fill Opacity');break;}}
  if(!shapeFill)shapeFill=vec.property(vec.numProperties).property('ADBE Vector Fill Opacity');if(!shapeFill)throw Error('Opacity سطح AE Glass پیدا نشد');shapeFill.setValue(100);
  GHAFHost._applyAEGlass(shape,bg.aeGlass||{});
  shape.moveAfter(text);shape.shy=true;
  var tr=shape.property('ADBE Transform Group');
  if(bg._typingExpand)tr.property('ADBE Opacity').expression='100';else if(bg.alwaysVisible)tr.property('ADBE Opacity').expression='100';else if(bg.inheritTransform)tr.property('ADBE Opacity').expression='parent.transform.opacity';
  else {var motion={};for(var key in bg)motion[key]=bg[key];motion.markerDriven=true;GHAFHost._applyBgMarkerMotion(shape,motion);}
  return true;
 }catch(e){GHAFHost._deleteLayers(GHAFHost._newLayers(c,old));throw Error('AE Glass: '+e);}
};
GHAFHost._applyAEGlassText=function(text,bg,style){
 style=style||{};var solid=Math.max(0,Math.min(100,Number(style.textSolidOpacity==null?0:style.textSolidOpacity)));
 var copy=text.duplicate();copy.name=GHAFHost._nativeBgPrefix+'AE_TEXT_'+text.name;copy.comment='VARNA_GLASS_TEXT:'+text.name;
 try{
  GHAFHost._clearTransformKeys(copy);
  var clean=copy.property('ADBE Transform Group');for(var ti=1;ti<=clean.numProperties;ti++)try{if(clean.property(ti).canSetExpression)clean.property(ti).expression='';}catch(eClear){}
  copy.parent=text;
  var tr=copy.property('ADBE Transform Group'),oldAnchor=text.property('ADBE Transform Group').property('ADBE Anchor Point').value;
  tr.property('ADBE Position').setValue(oldAnchor);tr.property('ADBE Anchor Point').setValue(oldAnchor);tr.property('ADBE Scale').setValue([100,100]);tr.property('ADBE Rotate Z').setValue(0);
  tr.property('ADBE Opacity').expression='100';
  copy.property('ADBE Text Properties').property('ADBE Text Document').expression='parent.text.sourceText';
  GHAFHost._removeTextSolidOpacity(copy);copy.enabled=true;
  if(solid>0)copy.moveAfter(text);else copy.moveBefore(text);
  GHAFHost._applyAEGlass(copy,style.textAEGlass||GHAFHost._defaultTextGlass());copy.shy=true;
  GHAFHost._setTextSolidOpacity(text,solid);return copy;
 }catch(e){copy.locked=false;copy.remove();throw e;}
};
GHAFHost._textylePreset=function(layer,relative,phase,a){
 if(!relative)return false;
 relative=String(relative).replace(/\\/g,'/');
 var path=/^[1-5]-(Simple|Modern|Around|Elastic|Funny)\/(IN|OUT)\/(Characters|Words|Lines)\/[^\/:*?"<>|]+\.ffx$/i.exec(relative);
 if(!path||path[2].toUpperCase()!==phase)throw Error('TEXTYLE_INVALID_PRESET');
 var root=new File($.fileName).parent.parent,asset=new File(root.fsName+'/assets/packs/textyle-presets/'+relative);
 if(!asset.exists)throw Error('TEXTYLE_PACK_NOT_INSTALLED: install Max to use this motion');
 var comp=layer.containingComp,oldTime=comp.time,selected=[];
 for(var i=1;i<=comp.numLayers;i++)if(comp.layer(i).selected)selected.push(comp.layer(i));
 try{
  for(var j=0;j<selected.length;j++)selected[j].selected=false;
  layer.selected=true;
  var span=Math.max(.03,layer.outPoint-layer.inPoint),time=phase==='IN'?layer.inPoint+Math.max(0,Number(a.startOffset)||0):Math.max(layer.inPoint,layer.outPoint-Math.min(span*.8,Math.max(.03,Number(a.outDur)||.28)));
  comp.time=Math.min(layer.outPoint-.001,time);layer.applyPreset(asset);return true;
 }finally{
  layer.selected=false;for(var k=0;k<selected.length;k++)try{selected[k].selected=true;}catch(eSelect){}
  comp.time=oldTime;
 }
};
GHAFHost._applyLiquidBg=function(layer,bg){
 var c=layer.containingComp,old=GHAFHost._layerSet(c);try{
  GHAFHost._removeNativeBg(layer);
  var fill=GHAFHost._glassHelper(layer,bg,'SURFACE',true);if(!fill)throw Error('GLASS_SURFACE_FAILED');fill.name=GHAFHost._nativeBgPrefix+layer.name;
  var rim=GHAFHost._glassHelper(layer,bg,'RIM',false);if(!rim)throw Error('GLASS_RIM_FAILED');
  var pad=Number(bg.padding==null?38:bg.padding),ca=bg.hex||'#FFFFFF',cb=bg.gradientEnabled===false?ca:(bg.gradientColor2||'#DDF3FF');
  var tint=GHAFHost._addGlassRamp(fill,ca,cb,pad,bg.gradientAngle,bg.gradientBalance,bg.gradientX1,bg.gradientY1,bg.gradientX2,bg.gradientY2,bg.surfaceGradient);if(!tint)throw Error('GLASS_GRADIENT_FAILED');
  if(bg.rimGradient!==false&&!GHAFHost._addGlassRamp(rim,bg.rimColor1||'#FFFFFF',bg.rimColor2||'#AFC6D5',pad,bg.rimAngle,bg.rimBalance,null,null,null,null,bg.strokeGradient))throw Error('GLASS_RIM_GRADIENT_FAILED');
  var rough=Math.max(0,Math.min(100,Number(bg.roughness==null?18:bg.roughness))),spec=Math.max(0,Math.min(100,Number(bg.specular==null?55:bg.specular))),depth=Math.max(0,Number(bg.edgeDepth==null?48:bg.edgeDepth));var fx=fill.property('ADBE Effect Parade'),shadow=fx.addProperty('ADBE Drop Shadow');shadow.name='VARNA Glass Depth';GHAFHost._setFx(shadow,2,Number(bg.shadowOpacity==null?10:bg.shadowOpacity));GHAFHost._setFx(shadow,3,(Number(bg.rimAngle==null?135:bg.rimAngle)+180)%360);GHAFHost._setFx(shadow,4,3+depth*.07);GHAFHost._setFx(shadow,5,14+depth*.3+rough*.08);
  var depth=Math.max(0,Number(bg.edgeDepth==null?48:bg.edgeDepth));if(depth>0){var bevel=fill.property('ADBE Effect Parade').addProperty('ADBE Bevel Alpha');bevel.name='VARNA Edge Light';GHAFHost._setFx(bevel,1,Math.max(.45,Math.min(7,.55+depth*.05)));GHAFHost._setFx(bevel,2,Number(bg.rimAngle==null?135:bg.rimAngle));GHAFHost._setFx(bevel,4,Math.max(0,Math.min(1.8,Number(bg.highlightOpacity==null?30:bg.highlightOpacity)*.007+spec*.008-rough*.0018)));}
  if(bg.glowEnabled){var glow=rim.property('ADBE Effect Parade').addProperty('ADBE Glo2');glow.name='VARNA Rim Glow';GHAFHost._setFx(glow,3,Number(bg.glowRadius==null?24:bg.glowRadius));GHAFHost._setFx(glow,4,Number(bg.glowIntensity==null?.45:bg.glowIntensity));GHAFHost._setFx(glow,7,2);GHAFHost._setFx(glow,12,GHAFHost._hex(bg.glowColor||'#FFFFFF'));GHAFHost._setFx(glow,13,GHAFHost._hex(bg.glowColor||'#FFFFFF'));}
  var tr=fill.property('ADBE Transform Group'),rr=layer.sourceRectAtTime(layer.inPoint,false),center=[rr.left+rr.width/2,rr.top+rr.height/2];
  tr.property('ADBE Anchor Point').setValue(center);tr.property('ADBE Position').setValue([center[0]+(Number(bg.offsetX)||0),center[1]+(Number(bg.offsetY)||0)]);
  if(bg._typingExpand)tr.property('ADBE Opacity').expression='100';else if(bg.alwaysVisible)tr.property('ADBE Opacity').expression='100';else if(bg.inheritTransform)tr.property('ADBE Opacity').expression='parent.transform.opacity';
  else {var motionBg={};for(var k in bg)motionBg[k]=bg[k];motionBg.markerDriven=true;GHAFHost._applyBgMarkerMotion(fill,motionBg);}
  // Rim follows the exact surface transform. No additional entrance/exit multiplication.
  var rt=rim.property('ADBE Transform Group');rt.property('ADBE Anchor Point').setValue(center);rt.property('ADBE Position').expression='thisComp.layer('+GHAFJSON.stringify(fill.name)+').transform.position';rt.property('ADBE Scale').expression='thisComp.layer('+GHAFJSON.stringify(fill.name)+').transform.scale';rt.property('ADBE Opacity').expression='thisComp.layer('+GHAFJSON.stringify(fill.name)+').transform.opacity';
  if(bg.aeOptics){
    // The optical layer sits between the text and Varna's own glass surface.
    var optic=GHAFHost._glassHelper(layer,bg,'OPTICS',true);if(!optic)throw Error('GLASS_OPTICS_FAILED');
    optic.name=GHAFHost._nativeBgPrefix+'_OPTICS_'+layer.name;
    var ov=optic.property('ADBE Root Vectors Group').property(1).property('ADBE Vectors Group');
    for(var oi=1;oi<=ov.numProperties;oi++)if(ov.property(oi).matchName==='ADBE Vector Graphic - Fill')ov.property(oi).property('ADBE Vector Fill Opacity').setValue(100);
    optic.moveAfter(layer);optic.property('ADBE Transform Group').property('ADBE Opacity').expression='100';
    GHAFHost._applyAEGlass(optic,bg.aeGlass||{});
  }else GHAFHost._opticalBlur(layer,fill,bg);return true;
 }catch(e){GHAFHost._deleteLayers(GHAFHost._newLayers(c,old));throw Error('Liquid Glass: '+e);}
};


GHAFHost._removeBgTextGlow=function(layer){GHAFHost._removeNamedEffect(layer,'VARNA Background Text Glow');};
GHAFHost._applyBgTextGlow=function(layer,bg){GHAFHost._removeNamedEffect(layer,'VARNA Text Glow');GHAFHost._removeTextBoxBg(layer);GHAFHost._removeNativeBg(layer);GHAFHost._applyTextGlow(layer,{glowEnabled:true,glowColor:bg.glowColor||bg.hex||'#FFFFFF',glowRadius:Number(bg.glowRadius==null?34:bg.glowRadius),glowIntensity:Number(bg.glowIntensity==null?1.15:bg.glowIntensity)},'VARNA Background Text Glow');return true;};
GHAFHost._applyBg = function(layer,bg){
    if(!bg || !bg.enabled){GHAFHost._removeBgTextGlow(layer);
        GHAFHost._removeTextBoxBg(layer);GHAFHost._removeNativeBg(layer);return true;
    }
    var engine=String(bg.engine||"auto"),style=String(bg.style||"solid");GHAFHost._removeBgTextGlow(layer);
    if(style==="aeGlass")return GHAFHost._applyAEGlassBg(layer,bg);
    if(style==="textGlow")return GHAFHost._applyBgTextGlow(layer,bg);
    if(style==="liquid"){GHAFHost._removeTextBoxBg(layer);return GHAFHost._applyLiquidBg(layer,bg);}
    if(bg.gradientEnabled!==false||bg.rimGradient!==false)engine="native";
    if(engine==="textbox2"){GHAFHost._removeNativeBg(layer);return GHAFHost._applyTextBoxBg(layer,bg);}
    if(engine==="native"){GHAFHost._removeTextBoxBg(layer);return GHAFHost._applyNativeBg(layer,bg);}
    GHAFHost._removeNativeBg(layer);if(GHAFHost._applyTextBoxBg(layer,bg))return true;GHAFHost._removeTextBoxBg(layer);return GHAFHost._applyNativeBg(layer,bg);
};
GHAFHost._composerOutConfig=function(a,preset){
 var s=Math.max(8,Number(a&&a.strength||45)),x=null;if(preset==='acCharSides')x={based:'chars',opacity:true,position:true,px:Math.max(16,s*.8),py:0};
 else if(preset==='acSmoothRise')x={based:'words',opacity:true,position:true,px:0,py:Math.max(10,s*.34)};else if(preset==='acSoftSlide')x={based:'words',opacity:true,position:true,px:-Math.max(14,s*.48),py:0};else if(preset==='acScaleEase'||preset==='acElasticSoft')x={based:'words',opacity:true,scale:true,scaleV:88};else if(preset==='acBlurFloat')x={based:'words',opacity:true,position:true,px:0,py:Math.max(10,s*.30),blur:true,blurV:Math.max(8,s*.38)};else if(preset==='acTrackingFlow')x={based:'chars',opacity:true,tracking:true,trackV:Math.max(36,s*1.15),blur:true,blurV:Math.max(3,s*.16)};else if(preset==='acWordCascade'||preset==='acWordStagger'||preset==='acWordBounce')x={based:'words',opacity:true,position:true,px:0,py:Math.max(16,s*.48),scale:true,scaleV:90};else if(preset==='acLineSweep'||preset==='acLineSlideRight')x={based:'lines',opacity:true,position:true,px:Math.max(14,s*.42),py:0};else if(preset==='acWordLift')x={based:'words',opacity:true,position:true,px:0,py:Math.max(18,s*.56)};else if(preset==='acWordFall')x={based:'words',opacity:true,position:true,px:0,py:-Math.max(18,s*.56)};else if(preset==='acWordSlideLeft')x={based:'words',opacity:true,position:true,px:-Math.max(22,s*.72),py:0};else if(preset==='acWordSlideRight')x={based:'words',opacity:true,position:true,px:Math.max(22,s*.72),py:0};else if(preset==='acWordScale')x={based:'words',opacity:true,scale:true,scaleV:Math.max(62,100-s*.62)};else if(preset==='acWordBlur')x={based:'words',opacity:true,blur:true,blurV:Math.max(10,s*.55),position:true,px:0,py:Math.max(6,s*.16)};else if(preset==='acWordSwing'||preset==='acWordRotate')x={based:'words',opacity:true,rotation:true,rotV:-Math.max(6,s*.24),position:true,px:0,py:Math.max(8,s*.18)};else if(preset==='acCharRise')x={based:'chars',opacity:true,position:true,px:0,py:Math.max(15,s*.44)};else if(preset==='acCharDrop')x={based:'chars',opacity:true,position:true,px:0,py:-Math.max(15,s*.44)};else if(preset==='acCharSpread'||preset==='acCharTracking')x={based:'chars',opacity:true,tracking:true,trackV:Math.max(42,s*1.35)};else if(preset==='acCharWave')x={based:'chars',opacity:true,position:true,px:0,py:Math.max(12,s*.32),rotation:true,rotV:-Math.max(4,s*.12)};else if(preset==='acCharRotate'||preset==='acCharFlip')x={based:'chars',opacity:true,rotation:true,rotV:-Math.max(12,s*.44),scale:true,scaleV:88};else if(preset==='acCharFocus')x={based:'chars',opacity:true,blur:true,blurV:Math.max(10,s*.5),scale:true,scaleV:94};else if(preset==='acCharFlow')x={based:'chars',opacity:true,position:true,px:-Math.max(10,s*.25),py:Math.max(6,s*.12),blur:true,blurV:Math.max(4,s*.18)};else if(preset==='acCharLeft')x={based:'chars',opacity:true,position:true,px:-Math.max(18,s*.55),py:0};else if(preset==='acCharRight')x={based:'chars',opacity:true,position:true,px:Math.max(18,s*.55),py:0};else if(preset==='acCharScale'||preset==='acCharBounce')x={based:'chars',opacity:true,scale:true,scaleV:82,position:preset==='acCharBounce',px:0,py:preset==='acCharBounce'?Math.max(20,s*.58):0};else if(preset==='acLineRise'||preset==='acLineCascade')x={based:'lines',opacity:true,position:true,px:0,py:Math.max(18,s*.52)};else if(preset==='acLineDrop')x={based:'lines',opacity:true,position:true,px:0,py:-Math.max(18,s*.52)};else if(preset==='acLineSlideLeft')x={based:'lines',opacity:true,position:true,px:-Math.max(22,s*.7),py:0};else if(preset==='acLineScale')x={based:'lines',opacity:true,scale:true,scaleV:Math.max(68,100-s*.5)};else if(preset==='acLineBlur')x={based:'lines',opacity:true,blur:true,blurV:Math.max(10,s*.46)};else if(preset==='acLineTracking')x={based:'lines',opacity:true,tracking:true,trackV:Math.max(28,s*.82)};else if(preset==='acLineRotate')x={based:'lines',opacity:true,rotation:true,rotV:-Math.max(6,s*.22)};else if(preset==='acWordFade')x={based:'words',opacity:true};else if(preset==='acLineFade')x={based:'lines',opacity:true};else if(preset==='acWordTracking')x={based:'words',opacity:true,tracking:true,trackV:Math.max(32,s*.95)};return x;
};
GHAFHost._textOutConfig=function(a,preset){var s=Math.max(8,Number(a&&a.strength||45));if(preset==='typewriter')return {based:'chars',opacity:true,position:true,px:Math.max(5,s*.12),py:0};if(preset==='blur')return {based:'chars',opacity:true,blur:true,blurV:Math.max(8,s*.55)};if(preset==='wordUp')return {based:'words',opacity:true,position:true,px:0,py:Math.max(10,s*.65)};if(preset==='wordPop')return {based:'words',opacity:true,scale:true,scaleV:Math.max(50,100-s*.7)};if(preset==='focus')return {based:'chars',opacity:true,blur:true,blurV:Math.max(12,s*.65),tracking:true,trackV:Math.max(20,s*1.05)};if(preset==='letterSpread'||preset==='tracking')return {based:'chars',opacity:true,tracking:true,trackV:Math.max(55,s*1.5)};if(preset==='lineReveal'||preset==='headlineDrop')return {based:'lines',opacity:true,position:true,px:0,py:preset==='headlineDrop'?-Math.max(14,s*.5):Math.max(12,s*.55)};if(preset==='wipeChars'||preset==='wipeRight')return {based:'chars',opacity:true,position:true,px:Math.max(12,s*.5),py:0};if(preset==='wipeLeft')return {based:'chars',opacity:true,position:true,px:-Math.max(12,s*.5),py:0};if(preset==='softBlurUp')return {based:'words',opacity:true,position:true,px:0,py:Math.max(9,s*.34),blur:true,blurV:Math.max(7,s*.4)};if(preset==='kineticWords')return {based:'words',opacity:true,position:true,px:0,py:Math.max(12,s*.46),scale:true,scaleV:Math.max(72,100-s*.38)};if(preset==='trackingTight')return {based:'chars',opacity:true,tracking:true,trackV:-Math.max(18,s*.7)};return null;};
GHAFHost._applyNativeOutroAnimator=function(layer,g,a,x){
 try{var animators=layer.property('ADBE Text Properties').property('ADBE Text Animators'),an=animators.addProperty('ADBE Text Animator');an.name='VARNA OUT · trim layer / move marker to retime';var props=an.property('ADBE Text Animator Properties'),added=0;if(x.opacity){if(GHAFHost._addAnimatorProp(props,'ADBE Text Opacity',0))added++;}if(x.position){if(GHAFHost._addAnimatorProp(props,'ADBE Text Position 3D',[Number(x.px||0),Number(x.py||0),0]))added++;}if(x.scale){var sv=Number(x.scaleV||78);if(GHAFHost._addAnimatorProp(props,'ADBE Text Scale 3D',[sv,sv,100]))added++;}if(x.rotation){if(GHAFHost._addAnimatorProp(props,'ADBE Text Rotation',Number(x.rotV||12)))added++;}if(x.blur){if(GHAFHost._addAnimatorProp(props,'ADBE Text Blur',[Number(x.blurV||18),Number(x.blurV||18)]))added++;}if(x.tracking&&!/[\u0600-\u06ff]/.test(String(g.text||''))){if(GHAFHost._addAnimatorProp(props,'ADBE Text Tracking Amount',Number(x.trackV||40)))added++;}if(!added){try{an.remove();}catch(eR){}return false;}var sel=an.property('ADBE Text Selectors').addProperty('ADBE Text Selector');sel.name='VARNA OUT · trim layer / move marker to retime';var adv=sel.property('ADBE Text Range Advanced');try{adv.property('ADBE Text Range Units').setValue(1);}catch(eU){}var based=x.based==='chars'?1:(x.based==='lines'?4:3);try{adv.property('ADBE Text Range Type2').setValue(based);}catch(eB){}try{var sm=adv.property('ADBE Text Selector Smoothness');if(sm)sm.setValue(100);}catch(eSm){}var sp=sel.property('ADBE Text Percent Start'),ep=sel.property('ADBE Text Percent End');if(sp)sp.setValue(0);var od=Math.max(.03,Number(a.outDur||.28));if(ep){var ex="function mt(n,f){try{for(var i=1;i<=marker.numKeys;i++){if(marker.key(i).comment==n)return marker.key(i).time;}}catch(e){}return f;}var ls=inPoint,le=Math.max(ls+.001,outPoint),a=mt('OUT',Math.max(ls,le-"+od+"));a=Math.max(ls,Math.min(le-.001,a));ease(time,a,le,0,100);";try{ep.expression=ex;}catch(eE){var t3=layer.outPoint,t2=Math.max(layer.inPoint,t3-od);ep.setValueAtTime(t2,0);ep.setValueAtTime(t3,100);}}return true;}catch(e){return false;}
};
GHAFHost._applyMirrorTransformOut=function(layer,g,a,preset){try{var t3=Math.min(layer.outPoint,Number(g.end||layer.outPoint)),t2=Math.max(layer.inPoint,t3-Math.max(.03,Number(a.outDur||.28))),pre=GHAFHost._markerProgressExpr('OUT','OUT',t2,t3,false),T=layer.property('ADBE Transform Group'),op=T.property('ADBE Opacity'),pos=T.property('ADBE Position'),sc=T.property('ADBE Scale'),rot=T.property('ADBE Rotate Z'),str=Math.max(8,Number(a.strength||45)),dx=0,dy=0,sx=100,sy=100,rv=0,use=false;if(preset==='fade'){use=true;}else if(preset==='rise'||preset==='floatIn'||preset==='maskRise'||preset==='pushUp'){use=true;dy=Math.max(14,str*.7);}else if(preset==='drop'||preset==='fadeDown'){use=true;dy=-Math.max(14,str*.7);}else if(preset==='slide'||preset==='punchLeft'){use=true;dx=-Math.max(20,str*.9);}else if(preset==='drift'||preset==='cinemaDrift'){use=true;dx=-Math.max(8,str*.38);dy=Math.max(3,str*.1);}else if(preset==='pop'||preset==='zoomOut'||preset==='overshoot'||preset==='spring'||preset==='elastic'||preset==='snap'||preset==='microBounce'||preset==='acScaleEase'||preset==='acElasticSoft'){use=true;sx=sy=86;}else if(preset==='zoomIn'||preset==='cinema'){use=true;sx=sy=116;}else if(preset==='stretchIn'||preset==='splitCenter'){use=true;sx=2;sy=100;}else if(preset==='swing'||preset==='flipIn'){use=true;rv=-18;sx=sy=preset==='flipIn'?88:100;}if(!use)return false;if(op)op.expression=pre+'100*(1-q);';if(pos&&(dx||dy))pos.expression=pre+'var v=value;[v[0]+'+dx+'*q,v[1]+'+dy+'*q];';if(sc&&(sx!==100||sy!==100))sc.expression=pre+'var v=value;[v[0]*(1-q)+'+sx+'*q,v[1]*(1-q)+'+sy+'*q];';if(rot&&rv)rot.expression=pre+rv+'*q;';return true;}catch(e){return false;}};
GHAFHost._applyOutro=function(layer,g,a){
    try{
        var kind=String(a&&a.outPreset||'none'),d=Math.max(0,Number(a&&a.outDur||0));if(kind==='none'||d<=0)return;
        if(kind.indexOf('mirror:')===0){var base=kind.substring(7),cfg=null;if(GHAFHost._isMarkerTransformPreset(base)){/* If IN is also a transform preset, _applyMarkerTransformPreset already owns both IN+OUT expressions. Otherwise apply OUT independently. */if(GHAFHost._isMarkerTransformPreset(String(a&&a.preset||'')))return;if(GHAFHost._applyMirrorTransformOut(layer,g,a,base))return;}if(base.indexOf('ac')===0)cfg=GHAFHost._composerOutConfig(a,base);if(!cfg)cfg=GHAFHost._textOutConfig(a,base);if(cfg&&GHAFHost._applyNativeOutroAnimator(layer,g,a,cfg))return;if(GHAFHost._applyMirrorTransformOut(layer,g,a,base))return;kind='fade';}
        var t3=Math.min(layer.containingComp.duration,Number(g.end||layer.outPoint)),t2=Math.max(Number(g.start||0),t3-d),tr=layer.property('ADBE Transform Group'),op=tr.property('ADBE Opacity'),pos=tr.property('ADBE Position'),sc=tr.property('ADBE Scale');
        var pre=GHAFHost._markerProgressExpr('OUT','OUT',t2,t3,false);
        if(op)try{op.expression=pre+'value*(1-q);';}catch(eOp){}
        if((kind==='slideDown'||kind==='softDropOut'||kind==='slideLeftOut'||kind==='slideRightOut')&&pos){var dx=0,dy=0;if(kind==='slideDown')dy=26;else if(kind==='softDropOut')dy=18;else if(kind==='slideLeftOut')dx=-32;else if(kind==='slideRightOut')dx=32;try{pos.expression=pre+'var v=value;[v[0]+('+dx+')*q,v[1]+('+dy+')*q];';}catch(ePos){}}
        if((kind==='scaleOut'||kind==='splitClose')&&sc){var tx=kind==='splitClose'?2:92,ty=kind==='splitClose'?100:92;try{sc.expression=pre+'var v=value;[v[0]*(1-q)+'+tx+'*q,v[1]*(1-q)+'+ty+'*q];';}catch(eSc){}}
        if(kind==='blurOut'){try{var anims=layer.property('ADBE Text Properties').property('ADBE Text Animators'),an=anims.addProperty('ADBE Text Animator');an.name='VARNA OUT · Blur';var pp=an.property('ADBE Text Animator Properties');GHAFHost._addAnimatorProp(pp,'ADBE Text Blur',[18,18]);var es=an.property('ADBE Text Selectors').addProperty('ADBE Text Expressible Selector'),am=es.property('ADBE Text Expressible Amount');if(am)am.expression=pre+'q*100;';}catch(eBlur){}}
    }catch(e){}
};
GHAFHost._markerTime=function(layer,name,fallback){try{var mp=layer.property('ADBE Marker');if(!mp)return fallback;for(var i=1;i<=mp.numKeys;i++){var mv=mp.keyValue(i),cm='';try{cm=String(mv.comment||'');}catch(e){}if(cm===name)return mp.keyTime(i);}}catch(e2){}return fallback;};
GHAFHost._addAnimMarkers=function(layer,g,a){
 var mp=layer.property('ADBE Marker');if(!mp)return;while(mp.numKeys>0)mp.removeKey(1);
 var gs=layer.inPoint,ge=layer.outPoint,span=ge-gs,hasIn=String(a&&a.preset||'none')!=='none'||(a&&a.mode==='native'),hasOut=String(a&&a.outPreset||'none')!=='none'&&Number(a.outDur)>0;
 var off=Math.max(0,Math.min(span*.8,Number(a.startOffset)||0)),id=Math.max(.001,Number(a.inDur)||.42),od=Math.max(.001,Number(a.outDur)||.28),available=span-off;
 if(hasIn&&hasOut&&id+od>available){var ratio=available/(id+od);id*=ratio;od*=ratio;}
 var inTime=Math.min(ge-.0001,gs+off+id),outTime=Math.max(gs,ge-od);if(hasIn&&hasOut&&outTime<=inTime)outTime=Math.min(ge-.00001,inTime+.00001);
 function add(t,name){mp.setValueAtTime(t,new MarkerValue(name));}
 if(hasIn)add(inTime,'IN');if(hasOut)add(outTime,'OUT');
};
GHAFHost._createTextLayer = function(comp,g,name){
    if(!isFinite(Number(g.start))||!isFinite(Number(g.end))||Number(g.end)<=Number(g.start)||Number(g.start)>=comp.duration)throw Error('CAPTION_OUTSIDE_COMP');
    var st=g.style||{},l=null,box=g.safeBox;
    if(box){
        if(!isFinite(Number(box.ratio))||Math.abs((comp.width/comp.height)/Number(box.ratio)-1)>.05)throw Error('SAFE_ZONE_ASPECT_MISMATCH');
        var safeWidth=(Number(box.x2)-Number(box.x1))*100;
        if(safeWidth<8||Number(box.y2)-Number(box.y1)<.04)throw Error('SAFE_ZONE_TOO_SMALL');
        st.fitWidthPct=Math.min(Number(st.fitWidthPct||82),safeWidth);
        st.boxWidthPct=Math.min(Number(st.boxWidthPct||82),safeWidth);
    }
    if(String(st.justifyMode||'none')!=='none'){
        var bw=comp.width*Math.max(.3,Math.min(1,Number(st.boxWidthPct||82)/100));
        var bh=Math.max(100,comp.height*.45);
        l=comp.layers.addBoxText([bw,bh]);
    }else l=comp.layers.addText(String(g.text||""));
    l.name=name;l.inPoint=Math.max(0,Number(g.start||0));l.outPoint=Math.min(comp.duration,Number(g.end));
    if(g.id!=null && /^GHAF_CAP_/.test(String(name||'')))try{l.comment='VARNA_CAPTION_ID:'+String(g.id);}catch(eTag){}
    GHAFHost._applyTextStyle(l,g.style||{},g.text||"");
    GHAFHost._clearAnimators(l);GHAFHost._clearTransformKeys(l);
    try{var rr=l.sourceRectAtTime(l.inPoint,false);l.property("ADBE Transform Group").property("ADBE Anchor Point").setValue([rr.left+rr.width/2,rr.top+rr.height/2]);}catch(eAnchor){}
    if(box)GHAFHost._enforceCaptionSafe(l,g,box);
    var aa=g.anim||{},bg=g.bg||{},sync=String(aa.syncMode||'separate');
    if(bg&&bg.enabled&&sync!=='separate'){
        bg.markerDriven=true;bg.motionDur=Math.max(.05,Number(aa.inDur||bg.motionDur||.28));bg.outDur=Math.max(0,Number(aa.outDur||0));bg.outPreset=String(aa.outPreset||'none');
        var off=Math.max(0,Number(aa.startOffset||0));bg.motionDelay=sync==='bgFirst'?Math.max(0,off-.08):(sync==='textFirst'?off+.08:off);
        var p=String(aa.preset||'none');if(p==='splitCenter'||p==='stretchIn'||p==='letterSpread'||p==='acCharSpread'||p==='acTrackingFlow')bg.motion='centerReveal';else if(p==='rise'||p==='floatIn'||p==='pushUp'||p==='drop'||p==='fadeDown'||p==='maskRise'||p==='lineReveal'||p==='wordUp'||p==='softBlurUp'||p==='acSmoothRise'||p==='acBlurFloat'||p==='acWordLift'||p==='acWordFall'||p==='acLineRise'||p==='acLineDrop'||p==='acLineCascade')bg.motion='glide';else if(p==='pop'||p==='spring'||p==='elastic'||p==='snap'||p==='overshoot'||p==='microBounce'||p==='zoomIn'||p==='zoomOut'||p==='wordPop'||p==='kineticWords'||p==='acScaleEase'||p==='acElasticSoft'||p==='acWordScale'||p==='acCharScale'||p==='acCharBounce'||p==='acLineScale')bg.motion='softScale';else if(p!=='none')bg.motion='fade';
    }
    if(bg&&bg.enabled&&sync==='together'&&GHAFHost._isMarkerTransformPreset(String(aa.preset||''))){bg.inheritTransform=true;bg.markerDriven=false;bg.motion='none';bg.outDur=0;}
    GHAFHost._addAnimMarkers(l,g,aa);
    var typingMeasure=GHAFHost._prepareTypingBounds(l,g,bg);
    if(!GHAFHost._applyBg(l,bg))throw new Error("BACKGROUND_APPLY_FAILED");

    if(aa.textyleIn)GHAFHost._textylePreset(l,aa.textyleIn,'IN',aa);else GHAFHost._animTransform(l,g,aa);
    if(aa.textyleOut)GHAFHost._textylePreset(l,aa.textyleOut,'OUT',aa);else GHAFHost._applyOutro(l,g,aa);if(bg.inheritTransform&&!bg.alwaysVisible){var bs=GHAFHost._nativeBgFor(l);if(bs){bs.locked=false;bs.property('ADBE Transform Group').property('ADBE Opacity').expression='parent.transform.opacity';bs.locked=true;}}if(GHAFHost._syncPersistedVendorEffects)GHAFHost._syncPersistedVendorEffects(l,st.vendorEffects||[]);if(st.aeGlassText)GHAFHost._applyAEGlassText(l,bg,st);GHAFHost._applyBgVendorEffects(l,bg);GHAFHost._linkTypingBounds(l,typingMeasure);return l;
};

GHAFHost._enforceCaptionSafe=function(layer,g,box){
    var c=layer.containingComp,st=g.style||{},bg=g.bg||{},padding=bg.enabled?Math.max(0,Number(bg.padding||0)):0;
    var glow=st.glowEnabled?Math.max(0,Number(st.glowRadius||0))*.35:0;
    var stroke=st.stroke?Math.max(0,Number(st.strokeWidth||0)):0;
    var emphasisScale37=g.highlight37?Math.max(1,Math.min(1.4,Number(g.highlight37.scale||100)/100)):1;
    var extraX=Number(st.size||72)*(emphasisScale37-1),extraY=extraX;
    var margin=padding+glow+stroke+3,x1=c.width*Number(box.x1)+margin,x2=c.width*Number(box.x2)-margin,y1=c.height*Number(box.y1)+margin,y2=c.height*Number(box.y2)-margin;
    var travelX=Math.min(80,Math.abs(Number(g.anim&&g.anim.px||0))),travelY=Math.min(80,Math.abs(Number(g.anim&&g.anim.py||0)));
    x1+=travelX+extraX;x2-=travelX+extraX;y1+=travelY+extraY;y2-=travelY+extraY;
    if(x2<=x1||y2<=y1)throw Error('SAFE_ZONE_NO_ROOM');
    var prop=layer.property('ADBE Text Properties').property('ADBE Text Document'),tr=layer.property('ADBE Transform Group'),r=null;
    for(var i=0;i<90;i++){
        r=layer.sourceRectAtTime(layer.inPoint,false);
        if(r.width<=x2-x1&&r.height<=y2-y1)break;
        var d=prop.value;if(d.fontSize<=6)throw Error('SAFE_ZONE_TEXT_TOO_LARGE');
        d.fontSize=Math.max(6,d.fontSize*.95);if(!d.autoLeading&&d.leading)d.leading*=.95;prop.setValue(d);
    }
    r=layer.sourceRectAtTime(layer.inPoint,false);
    if(r.width>x2-x1+1||r.height>y2-y1+1)throw Error('SAFE_ZONE_TEXT_TOO_LARGE');
    tr.property('ADBE Anchor Point').setValue([r.left+r.width/2,r.top+r.height/2]);
    var wanted=tr.property('ADBE Position').value,px=Math.min(x2-r.width/2,Math.max(x1+r.width/2,wanted[0])),py=Math.min(y2-r.height/2,Math.max(y1+r.height/2,wanted[1]));
    tr.property('ADBE Position').setValue([px,py]);
};



GHAFHost._shapeRect = function(comp, name, size, pos, opts){
    var sh=comp.layers.addShape(); sh.name=name; sh.guideLayer=true; sh.shy=true; sh.inPoint=0; sh.outPoint=comp.duration;
    var root=sh.property("ADBE Root Vectors Group");
    var rect=root.addProperty("ADBE Vector Shape - Rect");
    rect.property("ADBE Vector Rect Size").setValue([Math.max(1,Number(size[0]||1)),Math.max(1,Number(size[1]||1))]);
    if(opts && opts.fill){
        var fl=root.addProperty("ADBE Vector Graphic - Fill");
        fl.property("ADBE Vector Fill Color").setValue(opts.fill.color||[0,0,0]);
        try{fl.property("ADBE Vector Fill Opacity").setValue(Number(opts.fill.opacity||10));}catch(e1){}
    }
    if(opts && opts.stroke){
        var st=root.addProperty("ADBE Vector Graphic - Stroke");
        st.property("ADBE Vector Stroke Color").setValue(opts.stroke.color||[1,1,1]);
        st.property("ADBE Vector Stroke Width").setValue(Number(opts.stroke.width||2));
        try{st.property("ADBE Vector Stroke Opacity").setValue(Number(opts.stroke.opacity||100));}catch(e2){}
    }
    try{sh.property("ADBE Transform Group").property("ADBE Position").setValue([Number(pos[0]||0),Number(pos[1]||0)]);}catch(e3){}
    return sh;
};
GHAFHost._createSafeOverlay = function(c, p){
    var l=Number(p.left||0),r=Number(p.right||0),t=Number(p.top||0),b=Number(p.bottom||0);
    var color=GHAFHost._hex(p.overlayColor||"#000000"), op=Number(p.overlayOpacity==null?16:p.overlayOpacity);
    var safeW=Math.max(1,c.width-l-r), safeH=Math.max(1,c.height-t-b);
    GHAFHost._shapeRect(c,"__GHAF_SAFE_OVERLAY_TOP__",   [c.width,Math.max(1,t)],[c.width/2,Math.max(1,t)/2],{fill:{color:color,opacity:op}});
    GHAFHost._shapeRect(c,"__GHAF_SAFE_OVERLAY_BOTTOM__", [c.width,Math.max(1,b)],[c.width/2,c.height-Math.max(1,b)/2],{fill:{color:color,opacity:op}});
    GHAFHost._shapeRect(c,"__GHAF_SAFE_OVERLAY_LEFT__",   [Math.max(1,l),safeH],[Math.max(1,l)/2,t+safeH/2],{fill:{color:color,opacity:op}});
    GHAFHost._shapeRect(c,"__GHAF_SAFE_OVERLAY_RIGHT__",  [Math.max(1,r),safeH],[c.width-Math.max(1,r)/2,t+safeH/2],{fill:{color:color,opacity:op}});
    GHAFHost._shapeRect(c,"__GHAF_SAFE_ZONE__", [safeW,safeH],[l+safeW/2,t+safeH/2],{stroke:{color:[0.42,0.96,0.64],width:2,opacity:100}});
};

GHAFHost._clearVectorRoot = function(root){
    try{while(root.numProperties>0)root.property(1).remove();}catch(e){}
};
GHAFHost._shapeFromVertices = function(vs,sx,sy){
    var sh=new Shape(),v=[],it=[],ot=[];
    for(var i=0;i<vs.length;i++){v.push([Number(vs[i][0])*sx,Number(vs[i][1])*sy]);it.push([0,0]);ot.push([0,0]);}
    sh.vertices=v;sh.inTangents=it;sh.outTangents=ot;sh.closed=true;return sh;
};
GHAFHost._applyPresetSafeZone = function(c,p){
    var preset=p.preset||{},ops=preset.customPaths||[];
    var layer=null;
    for(var i=1;i<=c.numLayers;i++)if(c.layer(i).name==="__GHAF_SAFE_ZONE__"){layer=c.layer(i);break;}
    if(!layer){layer=c.layers.addShape();layer.name="__GHAF_SAFE_ZONE__";}
    layer.locked=false;layer.enabled=true;layer.shy=false;layer.guideLayer=(p.guideLayer!==false);layer.inPoint=0;layer.outPoint=c.duration;
    var root=layer.property("ADBE Root Vectors Group");GHAFHost._clearVectorRoot(root);
    var sx=preset.width?c.width/Number(preset.width):1,sy=preset.height?c.height/Number(preset.height):1;
    var rgb=GHAFHost._hex(p.overlayColor||"#000000"),op=Number(p.overlayOpacity==null?22:p.overlayOpacity);
    for(i=0;i<ops.length;i++){
        var data=ops[i],grp=root.addProperty("ADBE Vector Group");grp.name="GHAF Safe Op "+(i+1);
        var vec=grp.property("ADBE Vectors Group"),paths=data.paths||[];
        for(var j=0;j<paths.length;j++){
            var pp=vec.addProperty("ADBE Vector Shape - Group");
            pp.name="Path "+(j+1);
            pp.property("ADBE Vector Shape").setValue(GHAFHost._shapeFromVertices(paths[j].vertices||[],sx,sy));
        }
        if(paths.length>1){
            var mg=vec.addProperty("ADBE Vector Filter - Merge");
            try{mg.property("ADBE Vector Merge Type").setValue(Number(data.mode||1));}catch(eM){}
        }
        var fill=vec.addProperty("ADBE Vector Graphic - Fill");
        fill.property("ADBE Vector Fill Color").setValue(rgb);
        fill.property("ADBE Vector Fill Opacity").setValue(op);
    }
    if(p.showChrome&&p.chrome)for(i=0;i<p.chrome.length;i++){
        var b=p.chrome[i],gr=root.addProperty('ADBE Vector Group');gr.name='Platform UI guide '+(i+1);
        var vectors=gr.property('ADBE Vectors Group'),sh=vectors.addProperty('ADBE Vector Shape - Group');
        sh.property('ADBE Vector Shape').setValue(GHAFHost._shapeFromVertices([[b.x,b.y],[b.x+b.w,b.y],[b.x+b.w,b.y+b.h],[b.x,b.y+b.h]],sx,sy));
        var chromeFill=vectors.addProperty('ADBE Vector Graphic - Fill');chromeFill.property('ADBE Vector Fill Color').setValue([1,1,1]);chromeFill.property('ADBE Vector Fill Opacity').setValue(Math.min(28,Number(b.opacity||14)));
    }
    try{layer.property("ADBE Transform Group").property("ADBE Anchor Point").setValue([0,0]);}catch(e1){}
    try{layer.property("ADBE Transform Group").property("ADBE Position").setValue([0,0]);}catch(e2){}
    try{layer.moveToBeginning();}catch(e3){}
    layer.locked=!!p.lockLayer;
    try{layer.comment="GHAF_SAFE_PRESET="+String(preset.key||preset.name||"");}catch(e4){}
    return layer;
};
GHAFHost.ping = function(){return GHAFHost._ok({version:"4.5.0-rc.47",host:app.version});};
GHAFHost.sessionInfo = function(){return GHAFHost._ok({sessionId:GHAFHost._aeSessionId,host:app.version});};
GHAFHost.getSelectionInfo = function(){
    try{
        var c=GHAFHost._activeComp(); 
        if(!c) return GHAFHost._err("ابتدا یک Composition را فعال کنید");
        var ls=c.selectedLayers;
        if(!ls || ls.length!==1) return GHAFHost._err("لطفاً فقط یک لایه را در Timeline انتخاب کنید");
        var l=ls[0], path="", dur=0, isFootage=false;
        try{
            if(l.source && l.source.file){
                path=l.source.file.fsName;
                dur=Number(l.source.duration||0);
                isFootage=true;
            }
        }catch(e){}
        if(l.timeRemapEnabled) return GHAFHost._err("TIME_REMAP_UNSUPPORTED");
        if(Number(l.stretch)<=0) return GHAFHost._err("NEGATIVE_STRETCH_UNSUPPORTED");

        var stretch=Number(l.stretch||100);
        var sourceStart=0, sourceEnd=dur;
        if(isFootage){
            sourceStart=(Number(l.inPoint)-Number(l.startTime))*(100/stretch);
            sourceEnd=(Number(l.outPoint)-Number(l.startTime))*(100/stretch);
            if(sourceStart<0)sourceStart=0;
            if(dur>0 && sourceEnd>dur)sourceEnd=dur;
        }

        var layerType="unknown";
        try{
            if(l.matchName==="ADBE Text Layer") layerType="text";
            else if(isFootage) layerType="footage";
            else if(l.matchName==="ADBE Vector Layer") layerType="shape";
            else if(l.source) layerType="precomp";
        }catch(e2){}

        if(!isFootage||!path)return GHAFHost._err("یک لایه ویدیو یا صدای دارای فایل انتخاب کنید.");
        if(!l.hasAudio)return GHAFHost._err("لایه انتخاب‌شده صدا ندارد.");
        return GHAFHost._ok({
            comp:c.name,
            compId:c.id,
            compWidth:c.width,
            compHeight:c.height,
            compDuration:c.duration,
            frameRate:c.frameRate,
            layer:l.name,
            layerType:layerType,
            path:path,
            compIn:Number(l.inPoint),
            compOut:Number(l.outPoint),
            sourceStart:sourceStart,
            sourceDuration:Math.max(0,sourceEnd-sourceStart),
            stretch:stretch
        });
    }catch(e){
        return GHAFHost._err(e.toString());
    }
};
GHAFHost.importTimelineText = function(encoded){
    try{
        var p=GHAFHost._parse(encoded), c=GHAFHost._activeComp();
        if(!c) return GHAFHost._err("ابتدا یک Composition را فعال کنید");
        var scope=String(p.scope||"all"), includeGhaf=!!p.includeGhaf, layers=[], i;
        if(scope==="selected"){
            var sel=c.selectedLayers||[];
            for(i=0;i<sel.length;i++) layers.push(sel[i]);
        }else{
            for(i=1;i<=c.numLayers;i++) layers.push(c.layer(i));
        }
        var out=[];
        function cleanText(x){return String(x==null?"":x).replace(/\r/g,"\n").replace(/^\s+|\s+$/g,"");}
        function add(text,start,end,layerName,layerIndex,keyIndex){
            text=cleanText(text); start=Math.max(0,Number(start||0)); end=Math.min(c.duration,Math.max(start+0.001,Number(end||start+c.frameDuration)));
            if(!text || !(end>start)) return;
            var previous=out.length?out[out.length-1]:null;
            if(previous&&previous.index===layerIndex&&previous.text===text&&Math.abs(previous.end-start)<.0001){previous.end=end;return;}
            out.push({text:text,start:start,end:end,layer:layerName,index:layerIndex,key:keyIndex||0});
        }
        for(i=0;i<layers.length;i++){
            var l=layers[i], name=String(l.name||"");
            var tp=null; try{tp=l.property("ADBE Text Properties");}catch(eTP){}
            if(!tp) continue;
            if(!includeGhaf && (name.indexOf("GHAF_CAP_")===0 || name==="__GHAF_LIVE_PREVIEW__" || name.indexOf("__GHAF_EXT_STAGE__")===0 || name.indexOf("GHAF_EXT_CAP_")===0 || name==="GHAF_MARKER_CAPTIONS")) continue;
            var prop=null; try{prop=tp.property("ADBE Text Document");}catch(eProp){}
            if(!prop) continue;
            var lin=Math.max(0,Number(l.inPoint||0)), lout=Math.min(c.duration,Number(l.outPoint||c.duration));
            if(!(lout>lin)) continue;
            var numKeys=0; try{numKeys=prop.numKeys||0;}catch(eNK){}
            if(numKeys>0){
                var times=[], k;
                // Include the layer's state at inPoint, even when the first Source Text key starts later.
                times.push({time:lin,key:0});
                for(k=1;k<=numKeys;k++){
                    var kt=Number(prop.keyTime(k));
                    if(kt>lin+c.frameDuration*.25 && kt<lout-c.frameDuration*.25) times.push({time:kt,key:k});
                }
                times.sort(function(a,b){return a.time-b.time;});
                for(k=0;k<times.length;k++){
                    var t0=times[k].time, t1=(k+1<times.length)?times[k+1].time:lout, d=null;
                    try{d=prop.valueAtTime(t0+Math.min(c.frameDuration*.1,Math.max(0,(t1-t0)*.01)),false);}catch(eVT){try{d=prop.value;}catch(eV){}}
                    add(d&&d.text!=null?d.text:d,t0,t1,name,l.index,times[k].key);
                }
            }else{
                var d0=null; try{d0=prop.value;}catch(eVal){}
                add(d0&&d0.text!=null?d0.text:d0,lin,lout,name,l.index,0);
            }
        }
        out.sort(function(a,b){if(a.start!==b.start)return a.start-b.start;if(a.end!==b.end)return a.end-b.end;return a.index-b.index;});
        return GHAFHost._ok({comp:c.name,count:out.length,items:out});
    }catch(e){return GHAFHost._err(e.toString());}
};
GHAFHost.listFonts = function(){
    try{
        var out=[],seen={};
        try{if(app.fonts&&app.fonts.pollForAndPushNonSystemFontFoldersChanges)app.fonts.pollForAndPushNonSystemFontFoldersChanges();}catch(ePoll){}
        if(app.fonts&&app.fonts.allFonts){
            var fams=app.fonts.allFonts;
            for(var i=0;i<fams.length;i++){
                var group=fams[i];if(!group)continue;
                var n=(typeof group.length==='number')?group.length:1;
                for(var j=0;j<n;j++){
                    var f=(n===1&&group.postScriptName)?group:group[j];if(!f)continue;
                    var ps=String(f.postScriptName||f.name||'');if(!ps||seen[ps])continue;seen[ps]=1;
                    out.push({ps:ps,family:String(f.nativeFamilyName||f.familyName||f.fullName||ps),style:String(f.nativeStyleName||f.styleName||''),fullName:String(f.fullName||'')});
                }
            }
        }
        return GHAFHost._ok({fonts:out,revision:(app.fonts&&app.fonts.fontServerRevision!=null)?app.fonts.fontServerRevision:null});
    }catch(e){return GHAFHost._err(e.toString());}
};
GHAFHost.detectTextBox2 = function(){
    try{
        var found=false;
        if(app.effects){for(var i=0;i<app.effects.length;i++){var d=String(app.effects[i].displayName||""),m=String(app.effects[i].matchName||"");if(d==="TextBox 2"||d==="TextBox2"||m==="TextBox 2"||m==="TextBox2"){found=true;break;}}}
        if(!found){var c=GHAFHost._activeComp();if(c){var t=c.layers.addText("GHAF");found=!!GHAFHost._findTextBox2(t,true);t.remove();}}
        return GHAFHost._ok({installed:found});
    }catch(e){return GHAFHost._err(e.toString());}
};
GHAFHost.removeLivePreview = function(encoded){var p=GHAFHost._parse(encoded),c=GHAFHost._activeComp();if(p.compId!=null){c=null;for(var i=1;i<=app.project.numItems;i++){var item=app.project.item(i);if(item instanceof CompItem&&item.id===p.compId){c=item;break;}}}if(!c)return GHAFHost._ok({removed:0});var layers=GHAFHost._previewLayers(c);GHAFHost._deleteLayers(layers);if(GHAFHost._livePreviewRecords)delete GHAFHost._livePreviewRecords[String(c.id)];return GHAFHost._ok({removed:layers.length,compId:c.id});};
GHAFHost.setCompTime = function(encoded){var p=GHAFHost._parse(encoded),c=GHAFHost._activeComp();if(!c)return GHAFHost._err("NO_COMP");try{c.time=Math.max(0,Math.min(c.duration,Number(p.time||0)));if(p.focusViewer!==false)c.openInViewer();return GHAFHost._ok({time:c.time});}catch(e){return GHAFHost._err(e.toString());}};
GHAFHost.importAep = function(encoded){var p=GHAFHost._parse(encoded);try{var f=new File(p.path);if(!f.exists)return GHAFHost._err("FILE_NOT_FOUND");var io=new ImportOptions(f);var it=app.project.importFile(io);return GHAFHost._ok({name:it?it.name:""});}catch(e){return GHAFHost._err(e.toString());}};
GHAFHost.createSafeZone = function(encoded){
    var p=GHAFHost._parse(encoded),c=GHAFHost._activeComp();if(!c)return GHAFHost._err("NO_COMP");
    app.beginUndoGroup("GHAF Safest Zone");
    try{
        if(p.resize&&p.preset&&p.preset.width&&p.preset.height){
            c.width=Math.round(Number(p.preset.width));c.height=Math.round(Number(p.preset.height));
        }
        GHAFHost.removeSafeZone();
        if(p.preset&&p.preset.customPaths&&p.preset.customPaths.length){
            var layer=GHAFHost._applyPresetSafeZone(c,p);
            c.openInViewer();app.endUndoGroup();
            return GHAFHost._ok({name:p.preset.name,key:p.preset.key,width:c.width,height:c.height,layer:layer.name});
        }
        app.endUndoGroup();return GHAFHost._err("PRESET_GEOMETRY_MISSING");
    }catch(e){app.endUndoGroup();return GHAFHost._err(e.toString());}
};
GHAFHost.removeSafeZone = function(){
    var c=GHAFHost._activeComp();if(!c)return GHAFHost._ok({});
    try{
        for(var i=c.numLayers;i>=1;i--){var n=String(c.layer(i).name||"");if(n==="__GHAF_SAFE_ZONE__"||n.indexOf("__GHAF_SAFE_OVERLAY_")===0)c.layer(i).remove();}
    }catch(e){}
    return GHAFHost._ok({});
};
GHAFHost.setSafeZoneVisible = function(encoded){
    var p=GHAFHost._parse(encoded),c=GHAFHost._activeComp();if(!c)return GHAFHost._err("NO_COMP");
    try{
        var visible=p.visible!==false;
        for(var i=1;i<=c.numLayers;i++)if(c.layer(i).name==="__GHAF_SAFE_ZONE__"){c.layer(i).locked=false;c.layer(i).enabled=visible;c.layer(i).locked=true;}
        return GHAFHost._ok({visible:visible});
    }catch(e){return GHAFHost._err(e.toString());}
};
/* Resolve an explicit output target without relying on panel/project focus. */
GHAFHost._outputComp36=function(p){
 p=p||{};var active=GHAFHost._activeComp(),i,item;
 function find(id){if(active&&active.id===Number(id))return active;for(var j=1;app.project&&j<=app.project.numItems;j++){var it=app.project.item(j);if(it instanceof CompItem&&it.id===Number(id))return it;}return null;}
 if(p.compId!=null)return find(p.compId);
 if(active)return active;
 if(p.fallbackCompId!=null){item=find(p.fallbackCompId);if(item&&(!p.fallbackCompName||item.name===String(p.fallbackCompName)))return item;}
 var remembered=GHAFHost._lastComp36;if(remembered){try{item=find(remembered.id);if(item===remembered)return item;}catch(stale){}}
 var selected=app.project&&app.project.selection||[],found=null;
 for(i=0;i<selected.length;i++)if(selected[i] instanceof CompItem){if(found)return null;found=selected[i];}
 return found;
};
GHAFHost.getOutputComps36=function(){try{var active=GHAFHost._activeComp(),items=[];for(var i=1;i<=app.project.numItems;i++){var c=app.project.item(i);if(c instanceof CompItem)items.push({id:c.id,name:c.name,width:c.width,height:c.height,duration:c.duration});}return GHAFHost._ok({activeId:active?active.id:null,items:items});}catch(e){return GHAFHost._err(String(e));}};
GHAFHost._outputSession=null;
/* Output blocks stay ordered independently of AE's add-at-top behavior. */
GHAFHost._outputLayers=function(c){var out=[],a=GHAFHost._layerSet(c);for(var i=0;i<a.length;i++){var n=String(a[i].name||'');if(/^GHAF_CAP_|^GHAF_MARKER_CAPTIONS|^GHAF_TYPE_CLICK_/.test(n)||(/^__GHAF_NATIVE_BG__|^__GHAF_GLASS_BLUR__|^__GHAF_TEMPLATE_BG__|^__GHAF_TYPE_MEASURE__|^__VARNA_BG_ANCHOR__/.test(n)&&/GHAF_CAP_|GHAF_MARKER_CAPTIONS/.test(n)))out.push(a[i]);}return out;};
GHAFHost._finishOutputBlock35=function(c,layers,g,previousTail){
 var solo=false,i,j;for(i=1;i<=c.numLayers;i++)if(c.layer(i).solo)solo=true;
 var samples=[Number(g.start)+.001,(Number(g.start)+Math.min(c.duration,Number(g.end)))/2,Math.min(c.duration,Number(g.end))-.001];
 function scan(group,layer,depth){if(!group||depth>24)return;for(var k=1;k<=group.numProperties;k++){var p=group.property(k);if(!p)continue;if(p.numProperties)scan(p,layer,depth+1);else if(p.canSetExpression&&p.expressionEnabled&&p.expression){for(var t=0;t<samples.length;t++){p.valueAtTime(samples[t],false);if(p.expressionError)throw Error(layer.name+' / '+p.name+': '+p.expressionError);}}}}
 for(i=0;i<layers.length;i++){var l=layers[i],locked=l.locked,measurement=/^__GHAF_TYPE_MEASURE__|^__VARNA_BG_ANCHOR__/.test(String(l.name||''));try{l.locked=false;if(!measurement){l.guideLayer=false;l.enabled=true;if(solo)l.solo=true;}scan(l,l,0);}finally{l.locked=locked;}}
 if(previousTail){var tail=previousTail;for(i=0;i<layers.length;i++){var item=layers[i],wasLocked=item.locked;try{item.locked=false;item.moveAfter(tail);tail=item;}finally{item.locked=wasLocked;}}}
 return layers.length?layers[layers.length-1]:previousTail;
};

GHAFHost.abortOutputSession=function(encoded){
 var p=GHAFHost._parse(encoded),s=GHAFHost._outputSession;if(!s)return GHAFHost._ok({removed:0});
 if(p.token&&p.token!==s.token)return GHAFHost._err('OUTPUT_SESSION_MISMATCH');
 var count=s.created.length;app.beginUndoGroup('Varna Cancel Output');
 try{GHAFHost._deleteLayers(s.created);GHAFHost._outputSession=null;app.endUndoGroup();return GHAFHost._ok({removed:count});}
 catch(e){app.endUndoGroup();return GHAFHost._err(String(e));}
};
GHAFHost.beginOutputSession=function(encoded){
 var p=GHAFHost._parse(encoded),c=GHAFHost._outputComp36(p);if(!c)return GHAFHost._err('NO_COMP');
 if(p.compId!=null&&p.compId!==c.id)return GHAFHost._err('Composition changed; retry output.');
 if(GHAFHost._outputSession){var old=GHAFHost._outputSession;var aborted=GHAFJSON.parse(GHAFHost.abortOutputSession(encodeURIComponent(GHAFJSON.stringify({token:old.token}))));if(!aborted.ok)return GHAFHost._err('OUTPUT_CLEANUP_FAILED');}
 var token=String(new Date().getTime())+'_'+Math.floor(Math.random()*1000000);
 GHAFHost._outputSession={token:token,comp:c,previous:GHAFHost._outputLayers(c),created:[],count:0,expected:Number(p.expected||0),clearOld:p.clearOld===true,tail:null};
 return GHAFHost._ok({token:token});
};
GHAFHost.commitOutputSession=function(encoded){
 var p=GHAFHost._parse(encoded),s=GHAFHost._outputSession,c=s?s.comp:null;
 if(!s||p.token!==s.token||!c)return GHAFHost._err('OUTPUT_SESSION_MISMATCH');
 if(s.count!==s.expected)return GHAFHost._err('OUTPUT_INCOMPLETE');
 app.beginUndoGroup('Varna Complete Output');
 try{if(s.clearOld)GHAFHost._deleteLayers(s.previous);GHAFHost._outputSession=null;app.endUndoGroup();return GHAFHost._ok({created:s.count});}
 catch(e){app.endUndoGroup();return GHAFHost._err(String(e));}
};
GHAFHost.buildOutput = function(encoded){
    var p=GHAFHost._parse(encoded),session=GHAFHost._outputSession,c=(p.sessionToken&&session)?session.comp:GHAFHost._outputComp36(p);if(!c)return GHAFHost._err("NO_COMP");
    if(p.compId!=null&&p.compId!==c.id)return GHAFHost._err('Composition changed; retry output.');if(p.sessionToken&&(!session||session.token!==p.sessionToken||session.comp.id!==c.id||Number(p.done)!==session.count))return GHAFHost._err('OUTPUT_SESSION_MISMATCH');var stamp=p.sessionToken||String(new Date().getTime());var groups=p.groups||[],mode=p.mode||"separateFirst";if(!groups.length)return GHAFHost._err("NO_CAPTIONS");
    app.beginUndoGroup("GHAF Studio Output");
    try{
        var before=GHAFHost._layerSet(c),oldOutput=GHAFHost._outputLayers(c),outputTail=p.sessionToken?session.tail:null;
        if(mode==="marker"){
            var base=groups[0],bst=base.style||{},l=null;
            if(bst.justify){var bw=c.width*Math.max(.3,Math.min(1,Number(bst.boxWidthPct||82)/100));l=c.layers.addBoxText([bw,Math.max(100,c.height*.45)]);}else l=c.layers.addText("");
            l.name="GHAF_MARKER_CAPTIONS_"+stamp;l.inPoint=0;l.outPoint=c.duration;GHAFHost._applyTextStyle(l,base.style||{},"");if(!GHAFHost._applyBg(l,base.bg||{}))throw new Error("BACKGROUND_FAILED");
            var mp=l.property("ADBE Marker");
            for(var i=0;i<groups.length;i++){var g=groups[i],mv=new MarkerValue(String(g.text||""));mv.chapter="GHAF "+(i+1);mp.setValueAtTime(Number(g.start||0),mv);var next=i+1<groups.length?Number(groups[i+1].start):c.duration;if(Number(g.end)<next-c.frameDuration*.5){var blank=new MarkerValue("");mp.setValueAtTime(Number(g.end),blank);}}
            l.property("ADBE Text Properties").property("ADBE Text Document").expression='var m=thisLayer.marker;if(m.numKeys<1)"";else{var n=m.nearestKey(time).index;if(m.key(n).time>time)n--;n<1?"":m.key(n).comment;}';
            if(p.jsonComment)try{l.comment="GHAF_CAPTIONS_JSON="+GHAFJSON.stringify(groups);}catch(ec){}
            GHAFHost._finishOutputBlock35(c,GHAFHost._newLayers(c,before),{start:0,end:c.duration},null);if(p.clearOld)GHAFHost._deleteLayers(oldOutput);app.endUndoGroup();return GHAFHost._ok({created:1});
        }
        var order=[],i;if(mode==="separateLast"){for(i=groups.length-1;i>=0;i--)order.push(i);}else{for(i=0;i<groups.length;i++)order.push(i);}
        var createdCount=0,errors=[];
        for(var oi=0;oi<order.length;oi++){
            i=order[oi];var gg=groups[i],nm="GHAF_CAP_"+stamp+"_"+("000"+(i+1+Number(p.offset||0))).slice(-3),captionBefore=GHAFHost._layerSet(c);
            try{GHAFHost._createCaption(c,gg,nm);var block=GHAFHost._newLayers(c,captionBefore);outputTail=GHAFHost._finishOutputBlock35(c,block,gg,outputTail);createdCount++;}
            catch(firstErr){
                if(p.strict)throw Error('کپشن '+(i+1+Number(p.offset||0))+' ['+gg.start+' تا '+gg.end+']: '+String(firstErr));
                GHAFHost._deleteLayers(GHAFHost._newLayers(c,captionBefore));
                try{var safeG={text:String(gg.text||''),start:Number(gg.start||0),end:Number(gg.end||0),style:gg.style||{},anim:{mode:'none',preset:'none',outPreset:'none',inDur:0,outDur:0,typeSound:false},bg:{enabled:false},safeBox:gg.safeBox||null};GHAFHost._createCaption(c,safeG,nm+'_SAFE');createdCount++;errors.push({index:i+Number(p.offset||0),error:String(firstErr),recovered:true,mode:'safe-text'});}
                catch(safeErr){GHAFHost._deleteLayers(GHAFHost._newLayers(c,captionBefore));if(gg.safeBox){errors.push({index:i+Number(p.offset||0),error:String(firstErr)+' | '+String(safeErr),recovered:false});continue;}try{var fl=c.layers.addText(String(gg.text||''));fl.name=nm+'_PLAIN';fl.inPoint=Math.max(0,Number(gg.start||0));fl.outPoint=Math.min(c.duration,Number(gg.end||fl.inPoint+.5));try{fl.property('ADBE Transform Group').property('ADBE Position').setValue([c.width/2,c.height*.82]);}catch(ePos){}createdCount++;errors.push({index:i+Number(p.offset||0),error:String(firstErr)+' | '+String(safeErr),recovered:true,mode:'plain-text'});}catch(finalErr){errors.push({index:i+Number(p.offset||0),error:String(firstErr)+' | '+String(safeErr)+' | '+String(finalErr),recovered:false});}}
            }
        }
        if(createdCount!==groups.length)throw new Error('OUTPUT_INCOMPLETE');
        if(p.sessionToken){var added=GHAFHost._newLayers(c,before);for(var si=0;si<added.length;si++)session.created.push(added[si]);session.count+=createdCount;session.tail=outputTail;}
        if(p.clearOld)GHAFHost._deleteLayers(oldOutput);
        app.endUndoGroup();return GHAFHost._ok({created:createdCount,errors:errors});
    }catch(e){if(before)GHAFHost._deleteLayers(GHAFHost._newLayers(c,before));app.endUndoGroup();return GHAFHost._err(e.toString());}
};
GHAFHost.checkOutput = function(encoded){
    var c=GHAFHost._outputComp36(GHAFHost._parse(encoded)),tb=false;
    try{if(c){var t=c.layers.addText("GHAF");tb=!!GHAFHost._findTextBox2(t,true);t.remove();}}catch(e){}
    return GHAFHost._ok({comp:!!c,id:c?c.id:null,name:c?c.name:"",compName:c?c.name:"",duration:c?c.duration:0,frameRate:c?c.frameRate:0,width:c?c.width:0,height:c?c.height:0,textBox2:tb});
};

GHAFHost.getActiveCompInfo=function(){var c=GHAFHost._activeComp();if(!c)return GHAFHost._err("NO_COMP");return GHAFHost._ok({name:c.name,id:c.id,duration:c.duration,width:c.width,height:c.height,frameRate:c.frameRate,layers:c.numLayers});};
GHAFHost.getVarnaCaptionLayers=function(){
    var c=GHAFHost._activeComp();if(!c)return GHAFHost._err('NO_COMP');
    try{
        var items=[],i,layer,id,source,doc,pos,transform,color,k,hex;
        for(i=1;i<=c.numLayers;i++){
            layer=c.layer(i);
            if(!/^GHAF_CAP_/.test(String(layer.name||'')))continue;
            var match=/^VARNA_CAPTION_ID:(\d+)(?:\n|$)/.exec(String(layer.comment||''));
            if(!match)continue;
            id=Number(match[1]);if(!isFinite(id)||id<1)continue;
            source=layer.property('ADBE Text Properties');if(!source)continue;
            doc=source.property('ADBE Text Document').value;
            transform=layer.property('ADBE Transform Group');pos=transform.property('ADBE Position');
            color=doc.fillColor||[1,1,1];hex='#';for(k=0;k<3;k++){var n=Math.max(0,Math.min(255,Math.round(Number(color[k]||0)*255)));hex+=('0'+n.toString(16)).slice(-2);}
            items.push({id:id,layerId:layer.id,layerName:layer.name,text:String(doc.text||''),start:Number(layer.inPoint),end:Number(layer.outPoint),
                font:String(doc.font||''),size:Number(doc.fontSize||0),fill:hex.toUpperCase(),
                position:pos&&pos.numKeys===0&&!pos.expressionEnabled?pos.value:null});
        }
        return GHAFHost._ok({compId:c.id,width:c.width,height:c.height,items:items});
    }catch(e){return GHAFHost._err(e.toString());}
};
GHAFHost.getProjectLocation=function(){try{var f=app.project&&app.project.file;if(!f)return GHAFHost._ok({saved:false,folder:'',file:''});return GHAFHost._ok({saved:true,folder:f.parent.fsName,file:f.fsName});}catch(e){return GHAFHost._err(e.toString());}};
GHAFHost._stateFolder=function(create){var root=app.project.rootFolder,tag='__VARNA_PROJECT_STATE__',i,x;for(i=1;i<=root.numItems;i++){x=root.item(i);if(x instanceof FolderItem&&x.name===tag)return x;}return create?app.project.items.addFolder(tag):null;};
GHAFHost.getProjectState=function(){
 try{
  var f=GHAFHost._stateFolder(false);if(!f)return GHAFHost._ok({packet:null});
  var meta=GHAFJSON.parse(f.comment||'{}'),holder=f,chunks=[],seen={},i,part,index;
  if(!meta||meta.version!==1||typeof meta.count!=='number'||!isFinite(meta.count)||meta.count<0||meta.count>500||meta.count!==Math.floor(meta.count))return GHAFHost._err('Invalid project data');
  if(meta.folder){holder=null;for(i=1;i<=f.numItems;i++){part=f.item(i);if(part instanceof FolderItem&&part.name===meta.folder){holder=part;break;}}if(!holder)return GHAFHost._err('Incomplete project data');}
  for(i=1;i<=holder.numItems;i++){
   part=holder.item(i);if(!(part instanceof FolderItem)||!/^part_\d+$/.test(part.name))continue;
   index=Number(part.name.slice(5));if(index>=meta.count||seen['p'+index])return GHAFHost._err('Invalid project data chunk');seen['p'+index]=true;chunks[index]=part.comment||'';
  }
  for(i=0;i<meta.count;i++)if(typeof chunks[i]!=='string'||!chunks[i]||chunks[i].length>12000)return GHAFHost._err('Incomplete project data');
  return GHAFHost._ok({packet:{version:meta.version,hash:meta.hash,chunks:chunks}});
 }catch(e){return GHAFHost._err(e.toString());}
};
GHAFHost.saveProjectState = function(encoded) {
    var stagedFolder = null;
    try {
        var request = GHAFHost._parse(encoded);
        var statePacket = request.packet;
        var index, charIndex, chunkFolder, encodedChunk;
        if (!statePacket || statePacket.version !== 1 || !statePacket.chunks || statePacket.chunks.length > 500)
            return GHAFHost._err('Invalid project data');
        for (index = 0; index < statePacket.chunks.length; index++) {
            encodedChunk = statePacket.chunks[index];
            if (typeof encodedChunk !== 'string' || encodedChunk.length > 12000)
                return GHAFHost._err('Invalid project data chunk');
            for (charIndex = 0; charIndex < encodedChunk.length; charIndex++) {
                if ('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/='.indexOf(encodedChunk.charAt(charIndex)) < 0)
                    return GHAFHost._err('Invalid project data chunk');
            }
        }
        var stateFolder = GHAFHost._stateFolder(true);
        var snapshotFolderName = 'snapshot_' + new Date().getTime() + '_' + Math.floor(Math.random() * 1000000);
        stagedFolder = app.project.items.addFolder(snapshotFolderName);
        stagedFolder.parentFolder = stateFolder;
        for (index = 0; index < statePacket.chunks.length; index++) {
            chunkFolder = app.project.items.addFolder('part_' + index);
            chunkFolder.parentFolder = stagedFolder;
            chunkFolder.comment = statePacket.chunks[index];
        }
        stateFolder.comment = GHAFJSON.stringify({version: 1, hash: String(statePacket.hash || ''), count: statePacket.chunks.length, folder: snapshotFolderName});
        stagedFolder = null;
        for (index = stateFolder.numItems; index >= 1; index--) {
            try {
                chunkFolder = stateFolder.item(index);
                if (chunkFolder instanceof FolderItem && chunkFolder.name !== snapshotFolderName) {
                    while (chunkFolder.numItems) chunkFolder.item(chunkFolder.numItems).remove();
                    chunkFolder.remove();
                }
            } catch (cleanupError) {}
        }
        return GHAFHost._ok({chunks: statePacket.chunks.length});
    } catch (saveError) {
        if (stagedFolder) {
            try {
                while (stagedFolder.numItems) stagedFolder.item(stagedFolder.numItems).remove();
                stagedFolder.remove();
            } catch (cleanupError) {}
        }
        return GHAFHost._err(saveError.toString());
    }
};
GHAFHost.saveCurrentProject=function(){try{app.project.save();var file=app.project.file;return GHAFHost._ok({file:file?file.fsName:''});}catch(e){return GHAFHost._err(e.toString());}};
GHAFHost.previewCaption=function(encoded){
 var p=GHAFHost._parse(encoded),c=GHAFHost._activeComp();if(!c)return GHAFHost._err('NO_COMP');
 try{var start=Math.max(0,Math.min(c.duration,Number(p.start)||0)),end=Math.max(start+.01,Math.min(c.duration,Number(p.end)||start+1));c.time=start;c.workAreaStart=start;c.workAreaDuration=Math.min(end-start,c.duration-start);var audioOnly=p.audioOnly===true;
  if(!audioOnly)c.openInViewer();var id=app.findMenuCommandId(audioOnly?'Audio Preview (Work Area)':'Play Current Preview');if(id>0)app.executeCommand(id);return GHAFHost._ok({start:start,end:end,playing:id>0,audioOnly:audioOnly});
 }catch(e){return GHAFHost._err(e.toString());}
};
GHAFHost.analyzeComposition=function(encoded){
    var p=GHAFHost._parse(encoded),c=GHAFHost._activeComp();if(!c)return GHAFHost._err("NO_COMP");
    try{var events=[],audio=[],video=[],captions=p.captions||[],diag=Math.sqrt(c.width*c.width+c.height*c.height);
        function add(t,type,strength,name,reason,meta){t=Number(t);if(!isFinite(t)||t<0||t>c.duration)return;events.push({time:t,type:type,strength:Math.max(1,Math.min(100,Number(strength||50))),layer:String(name||""),reason:String(reason||""),meta:meta||{}});}
        function delta(a,b){if(a instanceof Array&&b instanceof Array){var sum=0,n=Math.min(a.length,b.length);for(var z=0;z<n;z++){var d=Number(b[z])-Number(a[z]);sum+=d*d;}return Math.sqrt(sum);}return Math.abs(Number(b)-Number(a));}
        function keys(prop,type,name,kind,base){try{if(prop&&prop.numKeys>0){for(var k=1;k<=prop.numKeys;k++){if(!(k===1||k===prop.numKeys||prop.numKeys<=8||k%2===0))continue;var prev=Math.max(1,k-1),next=Math.min(prop.numKeys,k+1),v0=prop.keyValue(prev),v1=prop.keyValue(next),d=delta(v0,v1),strength=base||58,meta={property:kind,delta:d,duration:Math.abs(prop.keyTime(next)-prop.keyTime(prev))};if(d<.0001)continue;meta.velocity=d/Math.max(.001,meta.duration);if(kind==='position')strength=Math.min(100,42+(d/Math.max(1,diag))*150);else if(kind==='scale')strength=Math.min(100,40+d*.55);else if(kind==='rotation')strength=Math.min(100,42+d*.82);else if(kind==='opacity')strength=Math.min(100,38+d*.48);add(prop.keyTime(k),type,strength,name,"Animated "+kind,meta);}}}catch(e){} }
        function scanEffectKeys(group,name,depth,eventType){if(!group||depth>3)return;try{for(var n=1;n<=group.numProperties;n++){var pr=group.property(n);if(!pr)continue;try{if(pr.numKeys>0&&pr.propertyValueType!==PropertyValueType.NO_VALUE){keys(pr,eventType||'effect',name,String(pr.name||'effect'),66);}}catch(eK){}try{if(pr.numProperties>0)scanEffectKeys(pr,name,depth+1,eventType);}catch(eG){}}}catch(e){}}
        for(var i=1;i<=c.numLayers;i++){var l=c.layer(i),nm=String(l.name||""),isText=false;if(GHAFHost._managedVisual(l))continue;var generatedAudio=/^(GHAF_SFX_|VARNA_SFX_|VARNA_GENERATED_SFX_|VARNA_MUSIC_)/.test(nm),isCaption=/^(GHAF_CAP_|GHAF_MARKER_CAPTIONS)/.test(nm);try{isText=!!l.property("ADBE Text Properties")||nm.indexOf("GHAF_CAP_")===0;}catch(eT){}
            if(!l.enabled&&!l.audioEnabled)continue;
            if(!generatedAudio&&isText){add(l.inPoint,"textIn",34,nm,"Static text in",{duration:l.outPoint-l.inPoint});add(Math.max(l.inPoint,l.outPoint-c.frameDuration),"textOut",28,nm,"Static text out",{duration:l.outPoint-l.inPoint});try{var ans=l.property('ADBE Text Properties').property('ADBE Text Animators');if(ans)for(var ai=1;ai<=ans.numProperties;ai++){var an=ans.property(ai),sels=an.property('ADBE Text Selectors');if(sels)scanEffectKeys(sels,nm,0,'typography');var props=an.property('ADBE Text Animator Properties');if(props)scanEffectKeys(props,nm,0,'typography');}}catch(eTa){}}
            else if(!generatedAudio&&l.enabled&&l.hasVideo&&l.source){add(l.inPoint,"cut",50,nm,"Layer in",{duration:l.outPoint-l.inPoint});}
            try{var tr=l.property("ADBE Transform Group");if(!generatedAudio&&l.enabled&&tr){keys(tr.property("ADBE Position"),isText?"typography":"motion",nm,"position");keys(tr.property("ADBE Scale"),isText?"typography":"motion",nm,"scale");keys(tr.property("ADBE Rotate Z"),isText?"typography":"motion",nm,"rotation");keys(tr.property("ADBE Opacity"),isText?"typography":"motion",nm,"opacity");}}catch(eK){}
            try{if(!generatedAudio&&l.enabled)scanEffectKeys(l.property('ADBE Effect Parade'),nm,0,isText?'typography':'effect');}catch(eFx){}
            try{var mk=l.property("ADBE Marker");if(mk&&!generatedAudio)for(var mi=1;mi<=mk.numKeys;mi++){var mv=mk.keyValue(mi),comment="";try{comment=mv.comment||"";}catch(eCm){}if(!((isText||isCaption)&&/^(IN|OUT)$/.test(comment)))add(mk.keyTime(mi),"marker",72,nm,comment?"Marker: "+comment:"Layer marker",{comment:comment});}}catch(eM){}
            try{if(l.hasAudio&&l.audioEnabled&&l.source&&l.source.file){var lev=null;try{lev=l.property("ADBE Audio Group").property("ADBE Audio Levels").value;}catch(eL){}audio.push({layer:nm,layerId:l.id,layerIndex:l.index,hasLevelKeys:!!(l.property("ADBE Audio Group").property("ADBE Audio Levels").numKeys),hasLevelExpression:!!(l.property("ADBE Audio Group").property("ADBE Audio Levels").expressionEnabled),timeRemap:!!l.timeRemapEnabled,path:l.source.file.fsName,inPoint:l.inPoint,outPoint:l.outPoint,startTime:l.startTime,stretch:l.stretch||100,sourceDuration:l.source.duration||0,levels:lev,balanceBase:GHAFHost._audioBase(l,lev)});}}catch(eA){}
            try{if(l.enabled&&l.hasVideo&&l.source&&l.source.file&&!/\.(wav|mp3|aif|aiff|m4a|ogg|flac)$/i.test(l.source.file.name||'')){video.push({layer:nm,layerIndex:l.index,path:l.source.file.fsName,inPoint:l.inPoint,outPoint:l.outPoint,startTime:l.startTime,stretch:l.stretch||100,sourceDuration:l.source.duration||0});}}catch(eV){}
        }
        /* R13 edit-boundary context: distinguish real shot boundaries/overlaps from a generic layer-in. */
        try{var vv=video.slice(0);vv.sort(function(a,b){return Number(a.inPoint||0)-Number(b.inPoint||0);});for(var vi=0;vi<vv.length;vi++){var cur=vv[vi],best=null,bestDelta=999;for(var pj=0;pj<vi;pj++){var prev=vv[pj],d=Number(cur.inPoint||0)-Number(prev.outPoint||0);if(Math.abs(d)<Math.abs(bestDelta)){best=prev;bestDelta=d;}}if(best&&Math.abs(bestDelta)<=Math.max(c.frameDuration*2.5,.09)){var overlap=Math.max(0,-bestDelta),strength=overlap>c.frameDuration*.75?80:74,kind=overlap>c.frameDuration*.75?'effect':'cut',why=overlap>c.frameDuration*.75?'Overlapping edit / transition boundary':'Hard edit boundary';add(Number(cur.inPoint||0),kind,strength,cur.layer,why,{property:overlap>0?'transition':'edit-boundary',previousLayer:best.layer,overlap:overlap});}}}catch(eB){}
        for(i=0;i<captions.length;i++){var cp=captions[i]||{},an=cp.anim||{},pr=String(an.preset||'none');if(pr&&pr!=='none'){var str=/^(pop|elastic|wordPop|snap|swing)$/.test(pr)?84:(pr==='typewriter'?68:74);add(Number(cp.start||0)+Math.max(0,Number(an.startOffset)||0),'typography',str,'Caption '+(i+1),'Declared typography: '+pr,{preset:pr,captionId:cp.id});}}
        try{var cm=c.markerProperty;if(cm)for(var ci=1;ci<=cm.numKeys;ci++){var cv=cm.keyValue(ci),cc="";try{cc=cv.comment||"";}catch(eCC){}add(cm.keyTime(ci),"marker",84,c.name,cc?"Comp marker: "+cc:"Comp marker",{comment:cc});}}catch(eC){}
        for(var ei=0;ei<events.length;ei++){var ee=events[ei];ee.meta=ee.meta||{};if(/^(GHAF_CAP_|GHAF_MARKER_CAPTIONS|Caption )/.test(ee.layer)){ee.meta.role='caption';}}
        events.sort(function(a,b){return a.time-b.time;});var clean=[];for(i=0;i<events.length;i++){var ev=events[i],prev=clean.length?clean[clean.length-1]:null;if(prev&&Math.abs(prev.time-ev.time)<.055&&prev.type===ev.type&&prev.layer===ev.layer){if(ev.strength>prev.strength)clean[clean.length-1]=ev;}else clean.push(ev);}return GHAFHost._ok({comp:{name:c.name,id:c.id,duration:c.duration,workAreaStart:c.workAreaStart,workAreaDuration:c.workAreaDuration,width:c.width,height:c.height,frameRate:c.frameRate},events:clean,audioSources:audio,videoSources:video,captions:captions});
    }catch(e){return GHAFHost._err(e.toString());}
};
GHAFHost.importProjectMusic=function(encoded){
 var p=GHAFHost._parse(encoded),c=GHAFHost._activeComp(),projectFile=app.project&&app.project.file;
 if(!c||!projectFile)return GHAFHost._err('SAVE_PROJECT_AND_SELECT_COMP');
 if(p.compId!=null&&Number(p.compId)!==Number(c.id))return GHAFHost._err('COMP_CHANGED_REANALYZE_MUSIC');
 var file=new File(String(p.path||'')),projectDir=String(projectFile.parent.fsName).toLowerCase();
 if(!file.exists||!/\.wav$/i.test(file.name)||String(file.parent.name).toLowerCase()!=='varna_audio'||String(file.parent.parent.fsName).toLowerCase()!==projectDir)return GHAFHost._err('INVALID_PROJECT_MUSIC_PATH');
 app.beginUndoGroup('Varna Add Project Music');var item=null,created=false,layer=null;
 try{item=GHAFHost._findFootageByFile(file.fsName);if(!item){item=app.project.importFile(new ImportOptions(file));created=true;}
  if(!item||!item.hasAudio)throw Error('MUSIC_FILE_HAS_NO_AUDIO');
  layer=c.layers.add(item);layer.name=(p.kind==='sfx'?'VARNA_GENERATED_SFX_':'VARNA_MUSIC_')+String(new Date().getTime());var start=Math.max(0,Math.min(c.duration-c.frameDuration,Number(p.start)||0));layer.startTime=start;layer.inPoint=start;layer.outPoint=Math.min(c.duration,start+item.duration);if(layer.outPoint<=layer.inPoint)throw Error('MUSIC_DURATION_INVALID');
  try{layer.property('ADBE Audio Group').property('ADBE Audio Levels').setValue([-12,-12]);}catch(eLevel){}
  return GHAFHost._ok({layer:layer.name,start:layer.inPoint,end:layer.outPoint,path:file.fsName});
 }catch(e){try{if(layer)layer.remove();}catch(eL){}try{if(created&&item)item.remove();}catch(eI){}return GHAFHost._err('MUSIC_IMPORT_FAILED: '+e);}
 finally{app.endUndoGroup();}
};
GHAFHost.placeBroll=function(encoded){
 var p=GHAFHost._parse(encoded),c=GHAFHost._activeComp();if(!c)return GHAFHost._err('NO_COMP');
 if(p.compId!=null&&Number(p.compId)!==Number(c.id))return GHAFHost._err('COMP_CHANGED_RECHECK_BROLL');
 var f=new File(String(p.path||'')),si=Number(p.sourceIn),so=Number(p.sourceOut),at=p.atTime==null?Number(c.time):Number(p.atTime);
 if(!f.exists||!/\.(mp4|mov|m4v|mkv|avi|webm|mpg|mpeg)$/i.test(f.name))return GHAFHost._err('BROLL_FILE_MISSING_OR_UNSUPPORTED');
 if(!isFinite(si)||!isFinite(so)||si<0||so<=si||!isFinite(at)||at<0||at>=c.duration)return GHAFHost._err('BROLL_RANGE_INVALID');
 app.beginUndoGroup('Varna Insert B-roll');var item=null,created=false,layer=null;
 try{
  item=GHAFHost._findFootageByFile(f.fsName);if(!item){item=app.project.importFile(new ImportOptions(f));created=true;}
  if(!item||!item.hasVideo||so>item.duration+.06)throw Error('BROLL_SOURCE_RANGE_INVALID');
  layer=c.layers.add(item);layer.name='VARNA_BROLL_'+f.name;layer.startTime=at-si;layer.inPoint=at;layer.outPoint=Math.min(c.duration,at+so-si);
  if(layer.outPoint<=layer.inPoint)throw Error('BROLL_OUTSIDE_COMP');
  try{layer.audioEnabled=false;}catch(eMute){}
  var lastCaption=0;for(var i=1;i<=c.numLayers;i++){var other=c.layer(i);if(other===layer)continue;if(/^VARNA_CAPTION_ID:/.test(String(other.comment||'')))lastCaption=Math.max(lastCaption,i);}
  if(lastCaption){var target=c.layer(lastCaption);layer.moveAfter(target);}else layer.moveToBeginning();
  return GHAFHost._ok({layer:layer.name,start:layer.inPoint,end:layer.outPoint,sourceIn:si,sourceOut:so});
 }catch(e){try{if(layer)layer.remove();}catch(ignore){}try{if(created&&item)item.remove();}catch(ignore2){}return GHAFHost._err('BROLL_INSERT_FAILED: '+e);}
 finally{app.endUndoGroup();}
};
GHAFHost.editSelectedVideoAtPlayhead=function(encoded){
 var p=GHAFHost._parse(encoded),c=GHAFHost._activeComp();if(!c)return GHAFHost._err('NO_COMP');
 var selected=c.selectedLayers||[];if(selected.length!==1)return GHAFHost._err('SELECT_ONE_VIDEO_LAYER');
 var layer=selected[0],mode=String(p.mode||''),t=Number(c.time),frame=Math.max(.001,Number(c.frameDuration)||.04);
 if(!layer||layer.locked||!layer.hasVideo||!(layer.source instanceof FootageItem)||!layer.source.file||!isFinite(t)||t<=layer.inPoint+frame||t>=layer.outPoint-frame)return GHAFHost._err('PLAYHEAD_MUST_BE_INSIDE_SELECTED_VIDEO');
 if(mode!=='split'&&mode!=='trimIn'&&mode!=='trimOut')return GHAFHost._err('INVALID_TIMELINE_ACTION');
 app.beginUndoGroup('Varna Timeline '+mode);var copy=null;
 try{if(mode==='split'){copy=layer.duplicate();copy.inPoint=t;layer.outPoint=t;}else if(mode==='trimIn')layer.inPoint=t;else layer.outPoint=t;
  return GHAFHost._ok({action:mode,time:t,layer:layer.name,second:copy?copy.name:''});
 }catch(e){try{if(copy)copy.remove();}catch(ignore){}return GHAFHost._err('TIMELINE_EDIT_FAILED: '+e);}
 finally{app.endUndoGroup();}
};
GHAFHost.refreshCaptionStyles=function(encoded){
 var p=GHAFHost._parse(encoded),c=GHAFHost._activeComp();if(!c)return GHAFHost._err('NO_COMP');
 var groups=p.groups||[],byId={},updated=0,skipped=0;for(var gi=0;gi<groups.length;gi++)byId[String(groups[gi].id)]=groups[gi];
 for(gi=0;gi<groups.length;gi++)if(((groups[gi].style||{}).aeGlassText||((groups[gi].bg||{}).enabled&&((groups[gi].bg||{}).style==='aeGlass'||(groups[gi].bg||{}).aeOptics)))&&!GHAFHost._aeGlassInfo().available)return GHAFHost._err('AE Glass در After Effects بارگذاری نشده است');
 app.beginUndoGroup('Varna Update Caption Looks');try{
  var targets=[];for(var li=1;li<=c.numLayers;li++){var candidate=c.layer(li),nm=String(candidate.name||'');if(nm.indexOf(GHAFHost._nativeBgPrefix)===0||nm.indexOf('__GHAF_TYPE_MEASURE__')===0)continue;if(/^VARNA_CAPTION_ID:/.test(String(candidate.comment||'')))targets.push(candidate);}for(var i=0;i<targets.length;i++){var l=targets[i],tag=String(l.comment||''),match=/^VARNA_CAPTION_ID:([^\r\n]+)/.exec(tag),g=match&&byId[match[1]];
   if(!g)continue;if(!l.property('ADBE Text Properties')){if(l.source&&String(l.source.comment||'')==='VARNA_SMART_CAPTION'){var oldSource=l.source,newLayer=GHAFHost._createCaption(c,g,l.name);newLayer.moveBefore(l);l.locked=false;l.remove();try{if(oldSource.usedIn.length===0)oldSource.remove();}catch(eCleanup){}updated++;}else skipped++;continue;}
   for(var k=c.numLayers;k>=1;k--){var child=c.layer(k),nm=String(child.name||'');if(nm==='__GHAF_TYPE_MEASURE__'+l.name||nm===GHAFHost._nativeBgPrefix+'AE_TEXT_'+l.name){child.locked=false;child.remove();}}
   GHAFHost._removeNativeBg(l);GHAFHost._removeTextBoxBg(l);
   l.enabled=true;GHAFHost._removeTextSolidOpacity(l);if(p.updateMotion)GHAFHost._resetCaptionMotion(l,g);GHAFHost._applyTextStyle(l,g.style||{},g.text||'');if(p.updateMotion){var aa=g.anim||{};GHAFHost._addAnimMarkers(l,g,aa);if(aa.textyleIn)GHAFHost._textylePreset(l,aa.textyleIn,'IN',aa);else GHAFHost._animTransform(l,g,aa);if(aa.textyleOut)GHAFHost._textylePreset(l,aa.textyleOut,'OUT',aa);else GHAFHost._applyOutro(l,g,aa);}var bg=g.bg||{},measure=GHAFHost._prepareTypingBounds(l,g,bg);
   if(!GHAFHost._applyBg(l,bg))throw Error('BACKGROUND_APPLY_FAILED: '+l.name);
   GHAFHost._syncPersistedVendorEffects(l,(g.style||{}).vendorEffects||[]);if((g.style||{}).aeGlassText)GHAFHost._applyAEGlassText(l,bg,g.style||{});GHAFHost._applyBgVendorEffects(l,bg);GHAFHost._linkTypingBounds(l,measure);
   updated++;
  }
  return GHAFHost._ok({updated:updated,skipped:skipped});
 }catch(e){return GHAFHost._err('STYLE_UPDATE_FAILED after '+updated+' captions: '+e+' · Undo in After Effects (Ctrl+Z)');}finally{app.endUndoGroup();}
};
GHAFHost._findFootageByFile=function(path){try{for(var i=1;i<=app.project.numItems;i++){var it=app.project.item(i);if(it instanceof FootageItem&&it.file&&it.file.fsName===path)return it;}}catch(e){}return null;};
GHAFHost._removeLayersByPrefix=function(c,prefixes){var removed=0;if(!c)return removed;for(var i=c.numLayers;i>=1;i--){var l=c.layer(i),n=String(l.name||''),hit=false;for(var j=0;j<prefixes.length;j++)if(n.indexOf(prefixes[j])===0){hit=true;break;}if(hit){try{l.locked=false;l.remove();removed++;}catch(e){}}}return removed;};
GHAFHost.removeSfxPreview=function(){var c=GHAFHost._activeComp();if(!c)return GHAFHost._err('NO_COMP');app.beginUndoGroup('Remove Varna SFX Preview');try{var n=GHAFHost._removeLayersByPrefix(c,['VARNA_SFX_PREVIEW_']);app.endUndoGroup();return GHAFHost._ok({removed:n});}catch(e){app.endUndoGroup();return GHAFHost._err(e.toString());}};
GHAFHost.removeGhafSfx=function(){var c=GHAFHost._activeComp();if(!c)return GHAFHost._err('NO_COMP');app.beginUndoGroup('Remove Varna SFX');try{var n=GHAFHost._removeLayersByPrefix(c,['GHAF_SFX_']);app.endUndoGroup();return GHAFHost._ok({removed:n});}catch(e){app.endUndoGroup();return GHAFHost._err(e.toString());}};
GHAFHost._audioFingerprint=function(prop){
 var keys=[];function ease(e){var a=[];for(var n=0;n<e.length;n++)a.push([e[n].speed,e[n].influence]);return a;}
 for(var i=1;i<=prop.numKeys;i++){var k={time:prop.keyTime(i),value:prop.keyValue(i)};try{k.inType=String(prop.keyInInterpolationType(i));k.outType=String(prop.keyOutInterpolationType(i));k.inEase=ease(prop.keyInTemporalEase(i));k.outEase=ease(prop.keyOutTemporalEase(i));k.auto=prop.keyTemporalAutoBezier(i);k.continuous=prop.keyTemporalContinuous(i);}catch(e){}keys.push(k);}
 return GHAFJSON.stringify({keys:keys,value:prop.numKeys?null:prop.value,expression:String(prop.expression||'')});
};
GHAFHost._audioBase=function(layer,levels){try{var m=/VARNA_AUDIO_STATE:([^\r\n]+)/.exec(String(layer.comment||''));if(m)return GHAFJSON.parse(m[1]).base||levels;}catch(e){}return levels;};
GHAFHost._findAudioLayer=function(c,x){
 var l=null,i;if(x.layerId!=null){for(i=1;i<=c.numLayers;i++){l=c.layer(i);if(l.id===x.layerId)return l;}return null;}
 if(x.layerIndex>=1&&x.layerIndex<=c.numLayers){l=c.layer(Number(x.layerIndex));try{if((!x.layerName||l.name===x.layerName)&&(!x.path||(l.source&&l.source.file&&l.source.file.fsName===x.path)))return l;}catch(e){}}
 return null;
};
GHAFHost.applyAudioBalance=function(encoded){
 var p=GHAFHost._parse(encoded),c=GHAFHost._activeComp();if(!c)return GHAFHost._err('NO_COMP');if(p.compId!=null&&p.compId!==c.id)return GHAFHost._err('کامپوزیشن تغییر کرده؛ تحلیل صدا را دوباره انجام دهید.');
 var plan=p.plan||[],wins=(p.duckWindows||[]).slice(0),merged=[],duck=Math.max(0,Number(p.duckDb)||0),applied=0,skipped=0,warnings=[];
 wins.sort(function(a,b){return a.start-b.start;});for(var wi=0;wi<wins.length;wi++){var w=wins[wi];if(!isFinite(w.start)||!isFinite(w.end)||w.end<=w.start)continue;var last=merged.length?merged[merged.length-1]:null;if(last&&w.start<=last.end+.36)last.end=Math.max(last.end,w.end);else merged.push({start:Number(w.start),end:Number(w.end)});}
 app.beginUndoGroup('Varna Audio Balance');try{
  for(var i=0;i<plan.length;i++){
   var x=plan[i],l=GHAFHost._findAudioLayer(c,x),al=null;if(!l){skipped++;warnings.push('Layer missing: '+(x.layerName||i));continue;}
   try{al=l.property('ADBE Audio Group').property('ADBE Audio Levels');}catch(eA){}
   if(!al){skipped++;continue;}if(al.expressionEnabled){skipped++;warnings.push('Expression preserved: '+l.name);continue;}
   var comment=String(l.comment||''),match=/VARNA_AUDIO_STATE:([^\r\n]+)/.exec(comment),saved=null;
   if(match)try{saved=GHAFJSON.parse(match[1]);}catch(eParse){}
   if(saved&&saved.fingerprint!==GHAFHost._audioFingerprint(al)){skipped++;warnings.push('User changes preserved: '+l.name);continue;}
   if(!saved&&al.numKeys>0){skipped++;warnings.push('Manual keys preserved: '+l.name);continue;}
   var base=saved?saved.base:al.value,g=Number(x.gainDb),before={keys:[],value:al.value};if(!isFinite(g)){skipped++;warnings.push('Invalid gain: '+l.name);continue;}
   if(x.truePeak!=null&&isFinite(Number(x.truePeak))&&p.truePeak!=null)g=Math.min(g,Number(p.truePeak)-Number(x.truePeak)-Math.max(Number(base[0])||0,Number(base[1])||0));
   for(var ki=1;ki<=al.numKeys;ki++)before.keys.push([al.keyTime(ki),al.keyValue(ki)]);
   try{
    while(al.numKeys>0)al.removeKey(al.numKeys);
    var bv=[Math.max(-192,Math.min(24,Number(base[0])+g)),Math.max(-192,Math.min(24,Number(base[1])+g))],used=false;
    al.setValue(bv);
    if(p.applyDucking!==false&&(x.role==='music'||x.role==='ambience')){
     for(wi=0;wi<merged.length;wi++){
      w=merged[wi];var ws=Math.max(l.inPoint,w.start),we=Math.min(l.outPoint,w.end);if(we<=ws)continue;
      var pre=Math.max(l.inPoint,ws-.18),post=Math.min(l.outPoint,we+.18),dv=[Math.max(-192,bv[0]-duck),Math.max(-192,bv[1]-duck)];
      if(pre<ws)al.setValueAtTime(pre,bv);al.setValueAtTime(ws,dv);al.setValueAtTime(we,dv);if(post>we)al.setValueAtTime(post,bv);used=true;
     }
    }
    var clean=comment.replace(/(?:\r?\n)?VARNA_AUDIO_(?:STATE|BASE):[^\r\n]*/g,'');
    l.comment=clean+(clean?'\n':'')+'VARNA_AUDIO_STATE:'+GHAFJSON.stringify({base:base,fingerprint:GHAFHost._audioFingerprint(al)});applied++;
   }catch(e){while(al.numKeys>0)al.removeKey(al.numKeys);if(before.keys.length){for(ki=0;ki<before.keys.length;ki++)al.setValueAtTime(before.keys[ki][0],before.keys[ki][1]);}else al.setValue(before.value);skipped++;warnings.push(l.name+': '+e);}
  }
  return GHAFHost._ok({applied:applied,skipped:skipped,warnings:warnings});
 }finally{app.endUndoGroup();}
};
GHAFHost.applySfxPlan=function(encoded){
 var p=GHAFHost._parse(encoded),c=GHAFHost._activeComp();if(!c)return GHAFHost._err('NO_COMP');if(p.compId!=null&&p.compId!==c.id)return GHAFHost._err('کامپوزیشن تغییر کرده؛ تحلیل SFX را دوباره انجام دهید.');
 var plan=p.plan||[],placements=[],errors=[],made=[],preview=!!p.preview,prefix=preview?'VARNA_SFX_PREVIEW_':'GHAF_SFX_',stamp=String(new Date().getTime());
 app.beginUndoGroup(preview?'Varna SFX Preview':'Varna SFX');
 try{for(var i=0;i<plan.length;i++){
  var x=plan[i],tm=Number(x.eventTime!=null?x.eventTime:x.time),l=null;
  try{
   if(!isFinite(tm)||tm<0||tm>=c.duration)throw Error('INVALID_EVENT_TIME');
   var f=new File(x.path);if(!f.exists)throw Error('AUDIO_FILE_MISSING');var item=GHAFHost._findFootageByFile(f.fsName);if(!item)item=app.project.importFile(new ImportOptions(f));
   if(!item||!item.hasAudio)throw Error('SOURCE_HAS_NO_AUDIO');
   var align=x.align==='end'?'end':'start',dur=Number(item.duration);if(!isFinite(dur)||dur<=0)throw Error('INVALID_AUDIO_DURATION');
   if(x.duration!=null&&isFinite(Number(x.duration))&&x.duration>0)dur=Math.min(dur,Number(x.duration));
   var placeStart=align==='end'?tm-dur:tm,visibleStart=Math.max(0,placeStart),visibleEnd=Math.min(c.duration,align==='end'?tm:tm+dur);if(visibleEnd<=visibleStart)throw Error('EMPTY_CUE');
   l=c.layers.add(item);l.name=prefix+stamp+'_'+String(x.category||'fx').toUpperCase()+'_'+i;l.startTime=placeStart;l.inPoint=visibleStart;l.outPoint=visibleEnd;
   var al=l.property('ADBE Audio Group').property('ADBE Audio Levels'),db=Number(x.db==null?-18:x.db);if(!isFinite(db))throw Error('INVALID_GAIN');db=Math.max(-192,Math.min(24,db));al.setValue([db,db]);
   var delta=Math.abs((align==='end'?l.outPoint:l.inPoint)-tm);if(delta>c.frameDuration/2+.00001)throw Error('PLACEMENT_ERROR '+delta);
   l.comment=(preview?'VARNA_SFX_PREVIEW ':'GHAF_SFX ')+GHAFJSON.stringify({eventTime:tm,originalEventTime:x.originalEventTime,category:x.category,ambient:!!x.ambient,align:align,source:x.path});
   if(preview){l.guideLayer=true;l.label=13;}
   placements.push({planIndex:i,eventTime:tm,startTime:l.startTime,inPoint:l.inPoint,outPoint:l.outPoint,delta:delta});made.push(l);
  }catch(e){if(l)try{l.remove();}catch(eR){}errors.push({planIndex:i,eventTime:tm,error:String(e)});}
 }
 if(preview&&made.length){for(i=c.numLayers;i>=1;i--){var old=c.layer(i),n=String(old.name||'');if(n.indexOf(prefix)===0&&n.indexOf(prefix+stamp+'_')!==0){old.locked=false;old.remove();}}}
 return GHAFHost._ok({created:made.length,preview:preview,placements:placements,errors:errors});
 }finally{app.endUndoGroup();}
};

// Isolated render session. Each host call renders one frame so cancellation stays responsive.
GHAFHost.beginMotionPreview=function(encoded){
 var p=GHAFHost._parse(encoded),source=GHAFHost._outputComp36(p),c=null,stage=null,captionLayers47=[];
 if(!source)return GHAFHost._err("NO_COMP");
 if(GHAFHost._motionSession)return GHAFHost._err("PREVIEW_BUSY");
 try{
  var g=p.group,start=Math.max(0,Number(g.start)),end=Math.min(source.duration,Number(g.end)),maxSize=Math.max(240,Math.min(900,Number(p.maxSize)||640)),maxDuration=Math.max(1,Math.min(12,Number(p.maxDuration)||8));
  if(!(end>start))throw new Error("CAPTION_OUTSIDE_COMP");
  var folder=new Folder(String(p.folder).replace(/\\/g,'/'));if(!folder.exists&&!folder.create())throw new Error("PREVIEW_FOLDER_MISSING");
  var probe=new File(folder.absoluteURI+'/write-test.tmp');if(!probe.open('w'))throw Error('دسترسی نوشتن فایل لازم است: Preferences > Scripting & Expressions > Allow Scripts to Write Files');probe.write('ok');probe.close();probe.remove();var created=[];
  c=source.duplicate();c.name="__GHAF_MOTION_TEMP__";
  for(var i=c.numLayers;i>=1;i--){var l=c.layer(i),n=String(l.name);if(GHAFHost._previewName(n)||n.indexOf("GHAF_TYPE_CLICK_")===0||n.indexOf("GHAF_CAP_")===0||n.indexOf("GHAF_MARKER_CAPTIONS")===0||n.indexOf(GHAFHost._nativeBgPrefix)===0||n.indexOf(GHAFHost._glassBlurPrefix)===0){l.locked=false;l.remove();}}
  var beforeCaption=GHAFHost._layerSet(c);g.anim=g.anim||{};g.anim.typeSound=false;var text=GHAFHost._createCaption(c,g,"__GHAF_MOTION_TEXT__",created);
  var freshCaption=GHAFHost._newLayers(c,beforeCaption),solo=false;captionLayers47=freshCaption;for(i=1;i<=c.numLayers;i++)if(c.layer(i).solo)solo=true;if(solo)for(i=0;i<freshCaption.length;i++)freshCaption[i].solo=true;
  var scale=Math.min(1,maxSize/Math.max(c.width*c.pixelAspect,c.height)),w=Math.max(4,Math.round(c.width*c.pixelAspect*scale)),h=Math.max(4,Math.round(c.height*scale));
  stage=app.project.items.addComp("__GHAF_MOTION_RENDER__",w,h,1,c.duration,c.frameRate);
  var video=stage.layers.add(c);video.property("ADBE Transform Group").property("ADBE Scale").setValue([scale*100,scale*100]);
  var token=String((new Date()).getTime());GHAFHost._motionSession={token:token,comp:c,stage:stage,folder:folder,created:created,captionLayers47:captionLayers47,method:p.method||"direct",start:start,end:Math.min(end,start+maxDuration)};
  source.openInViewer();return GHAFHost._ok({token:token,start:start,duration:Math.min(maxDuration,end-start),clipped:end-start>maxDuration});
 }catch(e){if(stage)try{stage.remove();}catch(ignoreStage){}if(captionLayers47.length)try{GHAFHost._deleteLayers(captionLayers47);}catch(ignoreCaption){}if(c)try{c.remove();}catch(ignore){}if(created)for(var ci=created.length-1;ci>=0;ci--)try{created[ci].remove();}catch(ignoreChild){}GHAFHost._motionSession=null;return GHAFHost._err(e.toString());}
};
GHAFHost.motionPreviewFrame=function(encoded){var p=GHAFHost._parse(encoded),s=GHAFHost._motionSession;
 if(!s||s.token!==p.token)return GHAFHost._err("PREVIEW_SESSION_MISSING");
 try{var t=Math.max(s.start,Math.min(s.end-s.comp.frameDuration,Number(p.time))),f=new File(s.folder.absoluteURI+"/frame_"+Math.max(0,Math.floor(Number(p.index)))+".png");
  if(s.method==='queue')return GHAFHost._ok({path:GHAFHost._queueFrame(s.stage,t,f)});
  app.beginSuppressDialogs();try{s.stage.saveFrameToPng(t,f);}finally{app.endSuppressDialogs(false);}return GHAFHost._ok({path:f.fsName,pending:!f.exists});}catch(e){return GHAFHost._err(e.toString());}
};
GHAFHost.endMotionPreview=function(encoded){var p=GHAFHost._parse(encoded),s=GHAFHost._motionSession;if(s&&s.token===p.token){GHAFHost._motionSession=null;try{s.stage.remove();GHAFHost._deleteLayers(s.captionLayers47||[]);s.comp.remove();for(var ci=s.created.length-1;ci>=0;ci--)try{s.created[ci].remove();}catch(cleanupError){}}catch(e){return GHAFHost._err(e.toString());}}return GHAFHost._ok({});};
GHAFHost._createCaption=function(c,g,name){if(g.anim&&g.anim.smartTemplate&&GHAFHost._createSmartCaption)return GHAFHost._createSmartCaption(c,g,name);return GHAFHost._createTextLayer(c,g,name);};
// AE measures the composed text with the installed font, providing the final fit gate.
GHAFHost._fitText=function(layer,st){
 if(!st.maxLines)return true;
 var prop=layer.property('ADBE Text Properties').property('ADBE Text Document'),limit=Math.max(1,Number(st.maxLines)),width=layer.containingComp.width*Number(st.fitWidthPct||82)/100;
 for(var i=0;i<70;i++){
  var d=prop.value,r=layer.sourceRectAtTime(Math.max(layer.inPoint,0),false),count=0;try{count=d.composedLineCount;}catch(e){}
  if((!count||count<=limit)&&r.width<=width+1)return true;
  if(d.text.indexOf('ـ')>=0)d.text=d.text.replace(/ـ/g,'');else {if(d.fontSize<=6)return false;d.fontSize=Math.max(6,d.fontSize*.96);if(!d.autoLeading&&d.leading)d.leading*=.96;}
  prop.setValue(d);
 }
 return false;
};
GHAFHost._queueFrame=function(comp,time,file){
 var rq=app.project.renderQueue;if(rq.rendering)throw Error('رندر دیگری در حال اجراست');var old=[],item=null;
 try{for(var i=1;i<=rq.numItems;i++){var it=rq.item(i);old.push({item:it,render:it.render});if(it.render)it.render=false;}
  item=rq.items.add(comp);item.timeSpanStart=time;item.timeSpanDuration=comp.frameDuration;var om=item.outputModule(1),templates=om.templates,template='';
  for(i=0;i<templates.length;i++)if(/PNG/i.test(templates[i])){template=templates[i];break;}
  if(!template)throw Error('یک Output Module Template با نام GHAF PNG و فرمت PNG Sequence در Render Queue ذخیره کن؛ سپس دوباره امتحان کن');
  om.applyTemplate(template);om=item.outputModule(1);om.file=file;item.render=true;rq.render();
  var candidates=file.parent.getFiles('*.png');for(i=0;i<candidates.length;i++)if(candidates[i].name.indexOf(file.name.replace(/\.png$/i,''))===0)return candidates[i].fsName;
  throw Error('رندر PNG فایلی تولید نکرد');
 }finally{if(item)try{item.remove();}catch(e){}for(var j=0;j<old.length;j++)try{old[j].item.render=old[j].render;}catch(e2){}}
};

GHAFHost.renderSfxAnalysisFrames=function(encoded){
 var p=GHAFHost._parse(encoded),c=GHAFHost._activeComp();if(!c)return GHAFHost._err('NO_COMP');
 try{var folder=new Folder(p.folder);if(!folder.exists)folder.create();var times=p.times||[],out=[];
  for(var i=0;i<times.length;i++){var t=Math.max(0,Math.min(c.duration-c.frameDuration,Number(times[i]||0))),base=new File(folder.fsName+'/sfx_'+('000'+i).slice(-3)+'.png');app.beginSuppressDialogs();try{c.saveFrameToPng(t,base);}finally{app.endSuppressDialogs(false);}out.push({time:t,path:base.fsName});}
  return GHAFHost._ok({frames:out});
 }catch(e){return GHAFHost._err(e.toString());}
};
GHAFHost.recoverMotionPreview=function(){var s=GHAFHost._motionSession;if(!s)return GHAFHost._ok({});var folder=s.folder.fsName;var result=GHAFHost.endMotionPreview(encodeURIComponent(GHAFJSON.stringify({token:s.token})));var parsed=GHAFJSON.parse(result);return parsed.ok?GHAFHost._ok({folder:folder}):result;};

/* VarnaLabs table builder. All generated layers remain editable in the current comp. */
GHAFHost.getTimelineTime=function(){var c=GHAFHost._activeComp();return c?GHAFHost._ok({compId:c.id,time:c.time,duration:c.duration,frameRate:c.frameRate}):GHAFHost._err('NO_COMP');};
GHAFHost.getTimelineInfo=function(){var c=GHAFHost._activeComp();if(!c)return GHAFHost._err('NO_COMP');try{var markers=[],mp=c.markerProperty;if(mp)for(var i=1;i<=mp.numKeys;i++){var mv=mp.keyValue(i),comment='';try{comment=mv.comment||'';}catch(e){}markers.push({time:mp.keyTime(i),comment:comment});}return GHAFHost._ok({time:c.time,duration:c.duration,frameRate:c.frameRate,compId:c.id,width:c.width,height:c.height,workAreaStart:c.workAreaStart,workAreaDuration:c.workAreaDuration,markers:markers});}catch(e){return GHAFHost._err(e.toString());}};
GHAFHost._varnaEase=function(prop,times){
    try{for(var i=0;i<times.length;i++){var ix=prop.nearestKeyIndex(times[i]),e=new KeyframeEase(0,78),ee=[],dims=prop.isSpatial?1:(prop.value instanceof Array?prop.value.length:1);for(var d=0;d<dims;d++)ee.push(e);prop.setTemporalEaseAtKey(ix,ee,ee);prop.setInterpolationTypeAtKey(ix,KeyframeInterpolationType.BEZIER,KeyframeInterpolationType.BEZIER);}}catch(e){}
};
GHAFHost._varnaAnimate=function(layer,kind,start,end){
    if(kind==='none'||end<=start)return;
    var tr=layer.property('ADBE Transform Group'),op=tr.property('ADBE Opacity'),pos=tr.property('ADBE Position'),sc=tr.property('ADBE Scale'),v;
    op.setValueAtTime(start,0);op.setValueAtTime(end,100);GHAFHost._varnaEase(op,[start,end]);
    if(kind==='rise'){v=pos.value;pos.setValueAtTime(start,[v[0],v[1]+28]);pos.setValueAtTime(end,v);GHAFHost._varnaEase(pos,[start,end]);}
    else if(kind==='slideLeft'){v=pos.value;pos.setValueAtTime(start,[v[0]-42,v[1]]);pos.setValueAtTime(end,v);GHAFHost._varnaEase(pos,[start,end]);}
    else if(kind==='slideRight'){v=pos.value;pos.setValueAtTime(start,[v[0]+42,v[1]]);pos.setValueAtTime(end,v);GHAFHost._varnaEase(pos,[start,end]);}
    else if(kind==='drop'){v=pos.value;pos.setValueAtTime(start,[v[0],v[1]-34]);pos.setValueAtTime(end,v);GHAFHost._varnaEase(pos,[start,end]);}
    else if(kind==='scale'){sc.setValueAtTime(start,[94,94]);sc.setValueAtTime(end,[100,100]);GHAFHost._varnaEase(sc,[start,end]);}
    else if(kind==='pop'){var mid=start+(end-start)*.68;sc.setValueAtTime(start,[82,82]);sc.setValueAtTime(mid,[104,104]);sc.setValueAtTime(end,[100,100]);GHAFHost._varnaEase(sc,[start,mid,end]);}
};
GHAFHost._varnaCellShape=function(w,h,roundness,mode,top,left,bottom,right){
    try{
        var r=Math.max(0,Math.min(Number(roundness)||0,Math.min(w,h)/2));
        if(mode!=='outerCorners')return null;
        var tl=(top&&left)?r:0,tr=(top&&right)?r:0,br=(bottom&&right)?r:0,bl=(bottom&&left)?r:0,k=.5522847498,hw=w/2,hh=h/2,sh=new Shape();
        sh.vertices=[[-hw+tl,-hh],[hw-tr,-hh],[hw,-hh+tr],[hw,hh-br],[hw-br,hh],[-hw+bl,hh],[-hw,hh-bl],[-hw,-hh+tl]];
        sh.inTangents=[[-k*tl,0],[0,0],[0,-k*tr],[0,0],[k*br,0],[0,0],[0,k*bl],[0,0]];
        sh.outTangents=[[0,0],[k*tr,0],[0,0],[0,k*br],[0,0],[-k*bl,0],[0,0],[0,-k*tl]];
        sh.closed=true;return sh;
    }catch(e){return null;}
};
function tableDividers(rows,cols,merges,direction){
 var out=[],xs=[0],ys=[0],total=0,i,j,m;
 for(i=0;i<cols.length;i++)total+=Number(cols[i]);for(i=0;i<cols.length;i++)xs.push(xs[i]+Number(cols[i])/total);
 total=0;for(i=0;i<rows.length;i++)total+=Number(rows[i]);for(i=0;i<rows.length;i++)ys.push(ys[i]+Number(rows[i])/total);
 function visible(axis,boundary,slot){for(var k=0;k<merges.length;k++){m=merges[k];if(axis==='h'&&boundary>m.r&&boundary<m.r+m.rs&&slot>=m.c&&slot<m.c+m.cs)return false;if(axis==='v'&&boundary>m.c&&boundary<m.c+m.cs&&slot>=m.r&&slot<m.r+m.rs)return false;}return true;}
 function x(v){return direction==='rtl'?1-v:v;}
 for(i=1;i<rows.length;i++){var begin=-1;for(j=0;j<=cols.length;j++){var show=j<cols.length&&visible('h',i,j);if(show&&begin<0)begin=j;if(!show&&begin>=0){out.push([x(xs[begin]),ys[i],x(xs[j]),ys[i]]);begin=-1;}}}
 for(i=1;i<cols.length;i++){var first=-1;for(j=0;j<=rows.length;j++){var on=j<rows.length&&visible('v',i,j);if(on&&first<0)first=j;if(!on&&first>=0){out.push([x(xs[i]),ys[first],x(xs[i]),ys[j]]);first=-1;}}}return out;
}
GHAFHost._tableDividers=tableDividers;
GHAFHost._tableComp=function(p){var c=GHAFHost._activeComp();if(p.compId!=null&&(!c||c.id!==Number(p.compId))){try{c=app.project.itemByID(Number(p.compId));}catch(e){c=null;}if(!c||!(c instanceof CompItem))return null;}return c;};
GHAFHost.removeVarnaTablePreview=function(encoded){var p=encoded?GHAFHost._parse(encoded):{},c=GHAFHost._tableComp(p);if(!c)return GHAFHost._err('NO_COMP');var n=0;app.beginUndoGroup('Remove Varna Table Preview');try{for(var i=c.numLayers;i>=1;i--)if(String(c.layer(i).name).indexOf('__VARNA_TABLE_PREVIEW__')===0){c.layer(i).remove();n++;}return GHAFHost._ok({removed:n});}catch(e){return GHAFHost._err(e.toString());}finally{app.endUndoGroup();}};
GHAFHost._tableSurfaceEntry=function(layer,kind,start,end){
 if(kind==='none'||end<=start)return;var tr=layer.property('ADBE Transform Group'),sc=tr.property('ADBE Scale'),pos=tr.property('ADBE Position'),v=pos.value,op=tr.property('ADBE Opacity'),mid=start+(end-start)*.65;
 op.setValueAtTime(start,0);op.setValueAtTime(Math.min(end,start+(end-start)*.35),100);
 if(kind==='spring'){sc.setValueAtTime(start,[88,88]);sc.setValueAtTime(mid,[103,103]);sc.setValueAtTime(end,[100,100]);}
 else if(kind==='stretch'){sc.setValueAtTime(start,[108,74]);sc.setValueAtTime(mid,[98,103]);sc.setValueAtTime(end,[100,100]);}
 else {sc.setValueAtTime(start,[kind==='float'?97:94,kind==='float'?97:94]);sc.setValueAtTime(end,[100,100]);}
 if(kind==='float'){pos.setValueAtTime(start,[v[0],v[1]+42]);pos.setValueAtTime(end,v);GHAFHost._varnaEase(pos,[start,end]);}
 GHAFHost._varnaEase(sc,kind==='spring'||kind==='stretch'?[start,mid,end]:[start,end]);
};
GHAFHost.buildVarnaTable=function(encoded){
    var p=GHAFHost._parse(encoded),c=GHAFHost._tableComp(p);if(!c)return GHAFHost._err('NO_COMP');var oldPreview=[];for(var op=1;op<=c.numLayers;op++)if(String(c.layer(op).name).indexOf('__VARNA_TABLE_PREVIEW__')===0)oldPreview.push(c.layer(op));var rows=p.rows||[],cols=p.cols||[],cells=p.cells||[],nr=rows.length,nc=cols.length;if(nr<1||nc<1||nr*nc>400||cells.length!==nr)return GHAFHost._err('INVALID_GRID');
    var rw=[],cw=[],rh=0,ct=0,i,j;for(i=0;i<nr;i++){if(!cells[i]||cells[i].length!==nc||!isFinite(Number(rows[i]))||Number(rows[i])<=0)return GHAFHost._err('INVALID_ROW');rh+=Number(rows[i]);}for(j=0;j<nc;j++){if(!isFinite(Number(cols[j]))||Number(cols[j])<=0)return GHAFHost._err('INVALID_COLUMN');ct+=Number(cols[j]);}
    var merges=p.merges||[],occupied={},mi,rr,cc,m;for(mi=0;mi<merges.length;mi++){m=merges[mi];if(!m||m.r%1||m.c%1||m.rs%1||m.cs%1||m.r<0||m.c<0||m.rs<1||m.cs<1||m.r+m.rs>nr||m.c+m.cs>nc)return GHAFHost._err('INVALID_MERGE');for(rr=m.r;rr<m.r+m.rs;rr++)for(cc=m.c;cc<m.c+m.cs;cc++){var mk=rr+':'+cc;if(occupied[mk])return GHAFHost._err('OVERLAPPING_MERGE');occupied[mk]=m;}}
    var settings=p.cellSettings||{},markers=p.markers||[],width=Math.max(80,Math.min(c.width*3,Number(p.width)||850)),height=Math.max(60,Math.min(c.height*3,Number(p.height)||360)),start=Math.max(0,Number(p.start)||0),duration=Math.max(.04,Number(p.duration)||4),delay=Math.max(0,Number(p.delay)||0),anim=Math.max(0,Number(p.animDuration)||0),requestedEnd=isFinite(Number(p.end))?Number(p.end):start+duration,end=Math.min(c.duration,requestedEnd);if(start>=c.duration||end<=start)return GHAFHost._err('TIME_OUTSIDE_COMP');duration=end-start;
    var motion=String(p.motion||'none'),stagger=String(p.stagger||'rows'),direction=String(p.direction||'rtl'),motionRe=/^(none|fade|rise|scale|slideLeft|slideRight|drop|pop)$/;if(!motionRe.test(motion)||!/^(all|rows|columns)$/.test(stagger)||!/^(rtl|ltr|auto)$/.test(direction))return GHAFHost._err('INVALID_MOTION');for(i=0;i<nr;i++)rw[i]=height*Number(rows[i])/rh;for(j=0;j<nc;j++)cw[j]=width*Number(cols[j])/ct;
    if(direction==='auto')direction=/[\u0600-\u06ff]/.test(cells.join(' '))?'rtl':'ltr';
    var color=GHAFHost._hex(p.fill),border=GHAFHost._hex(p.stroke),ink=GHAFHost._hex(p.text),headerColor=GHAFHost._hex(p.headerFill||p.fill),headerInk=GHAFHost._hex(p.headerText||p.text),zebraColor=GHAFHost._hex(p.zebraFill||p.fill),line=Math.max(0,Number(p.line)||0),font=Math.max(6,Number(p.font)||34),roundness=Math.max(0,Number(p.roundness)||0),frameOpacity=Math.max(0,Math.min(100,isFinite(Number(p.frameOpacity))?Number(p.frameOpacity):46)),cellOpacity=Math.max(0,Math.min(100,isFinite(Number(p.cellOpacity))?Number(p.cellOpacity):35)),headerOpacity=Math.max(0,Math.min(100,isFinite(Number(p.headerOpacity))?Number(p.headerOpacity):cellOpacity)),zebraOpacity=Math.max(0,Math.min(100,isFinite(Number(p.zebraOpacity))?Number(p.zebraOpacity):cellOpacity)),headerRow=!!p.headerRow,zebra=!!p.zebra,roundMode=String(p.roundMode||'all'),liquidGlass=!!p.liquidGlass,aeGlassTable=p.glassEngine==='aeGlass',glassRim=Math.max(0,Math.min(100,Number(p.glassRim==null?58:p.glassRim))),glassTint2=GHAFHost._hex(p.glassTint2||'#DCEEFF'),glassAngle=Number(p.glassAngle==null?135:p.glassAngle),glassBalance=Math.max(-100,Math.min(100,Number(p.glassBalance||0))),glassRim1=GHAFHost._hex(p.glassRim1||'#FFFFFF'),glassRim2=GHAFHost._hex(p.glassRim2||'#C6E5F5'),glassDepth=Math.max(0,Math.min(100,Number(p.glassDepth==null?48:p.glassDepth))),glassLensing=Math.max(0,Math.min(100,Number(p.glassLensing==null?38:p.glassLensing))),glassWave=Math.max(0,Math.min(100,Number(p.glassWave==null?12:p.glassWave))),created=[],tag=(p.preview?'__VARNA_TABLE_PREVIEW__':'VARNA_TABLE_')+String((new Date()).getTime()),top=(c.height-height)/2,y=top;
    var unified=p.unified===true,centerX=isFinite(Number(p.x))&&p.x!=null?Number(p.x):c.width/2,centerY=isFinite(Number(p.y))&&p.y!=null?Number(p.y):c.height/2,dx=centerX-c.width/2,dy=centerY-c.height/2,dividerOpacity=Math.max(0,Math.min(100,p.dividerOpacity==null?100:Number(p.dividerOpacity))),surfaceEntry=String(p.surfaceEntry||'soft');if(!/^(none|soft|spring|float|stretch)$/.test(surfaceEntry))return GHAFHost._err('INVALID_SURFACE_ENTRY');
    function markerAt(v){if(v===''||v==null)return null;var ix=Number(v);return markers[ix]&&isFinite(Number(markers[ix].time))?Number(markers[ix].time):null;}
    function clampTime(v,a,b){v=Number(v);if(!isFinite(v))return a;return Math.max(a,Math.min(b,v));}
    if(aeGlassTable&&!GHAFHost._aeGlassInfo().available)return GHAFHost._err('AE Glass در After Effects نصب یا بارگذاری نشده است');
    app.beginUndoGroup('VarnaLabs Create Table');try{
        if(liquidGlass&&!aeGlassTable){try{var adj=c.layers.addSolid([1,1,1],tag+'_glass_blur',c.width,c.height,1,c.duration);created.push(adj);adj.adjustmentLayer=true;adj.inPoint=start;adj.outPoint=end;var masks=adj.property('ADBE Mask Parade'),mask=masks.addProperty('ADBE Mask Atom'),sp=new Shape(),lx=(c.width-width)/2,ty=(c.height-height)/2;sp=GHAFHost._varnaCellShape(width,height,roundMode==='none'?0:roundness,'outerCorners',true,true,true,true);for(var vi=0;vi<sp.vertices.length;vi++){sp.vertices[vi][0]+=c.width/2;sp.vertices[vi][1]+=c.height/2;}mask.property('ADBE Mask Shape').setValue(sp);try{mask.property('ADBE Mask Feather').setValue([1,1]);}catch(eMF){}var fx=adj.property('ADBE Effect Parade'),bl=fx.addProperty('ADBE Gaussian Blur 2');try{bl.property(1).setValue(22);}catch(eB){}try{bl.property(3).setValue(1);}catch(eE){}try{var td=fx.addProperty('ADBE Turbulent Displace');td.name='VARNA Table Lens Refraction';GHAFHost._setNamed(td,['Amount'],Math.max(0,glassLensing*.025+glassWave*.012));GHAFHost._setNamed(td,['Size'],Math.max(80,150-glassWave*.45));GHAFHost._setNamed(td,['Complexity'],1);}catch(eTD){}adj.shy=true;}catch(eGlass){}}
        var frame=c.layers.addShape();created.push(frame);frame.name=tag+'_frame';frame.inPoint=start;frame.outPoint=end;var fg=frame.property('ADBE Root Vectors Group').addProperty('ADBE Vector Group'),fv=fg.property('ADBE Vectors Group'),fr=fv.addProperty('ADBE Vector Shape - Rect');fr.property('ADBE Vector Rect Size').setValue([width,height]);fr.property('ADBE Vector Rect Roundness').setValue(roundMode==='none'?0:roundness);var ff=fv.addProperty('ADBE Vector Graphic - Fill');ff.property('ADBE Vector Fill Color').setValue(color);ff.property('ADBE Vector Fill Opacity').setValue(aeGlassTable?100:frameOpacity);if(line>0){var fs=fv.addProperty('ADBE Vector Graphic - Stroke');fs.property('ADBE Vector Stroke Color').setValue(liquidGlass?glassRim2:border);fs.property('ADBE Vector Stroke Width').setValue(Math.max(.1,liquidGlass?line*1.25:line));if(liquidGlass){try{fs.property('ADBE Vector Stroke Opacity').setValue(Math.max(18,glassRim*.62));}catch(eFO){}var fhi=fv.addProperty('ADBE Vector Graphic - Stroke');fhi.property('ADBE Vector Stroke Color').setValue(glassRim1);fhi.property('ADBE Vector Stroke Width').setValue(Math.max(.4,line*.55));try{fhi.property('ADBE Vector Stroke Opacity').setValue(glassRim);}catch(eFH){}}}frame.property('ADBE Transform Group').property('ADBE Position').setValue([c.width/2,c.height/2]);if(liquidGlass&&!aeGlassTable){try{var framp=frame.property('ADBE Effect Parade').addProperty('ADBE Ramp');framp.name='VARNA Table Two Tint';var A=glassAngle*Math.PI/180,L=Math.max(width,height)*.72,shift=glassBalance/100*L*.38,cx=c.width/2,cy=c.height/2;framp.property(1).setValue([cx-Math.cos(A)*L+Math.cos(A)*shift,cy-Math.sin(A)*L+Math.sin(A)*shift]);framp.property(2).setValue(color);framp.property(3).setValue([cx+Math.cos(A)*L+Math.cos(A)*shift,cy+Math.sin(A)*L+Math.sin(A)*shift]);framp.property(4).setValue(glassTint2);try{framp.property(5).setValue(1);}catch(eRS){}try{framp.property(7).setValue(0);}catch(eRB){}}catch(eRamp){}try{var bev=frame.property('ADBE Effect Parade').addProperty('ADBE Bevel Alpha');bev.name='VARNA Table Edge Depth';GHAFHost._setNamed(bev,['Edge Thickness','Thickness'],Math.max(.4,glassDepth*.015));GHAFHost._setNamed(bev,['Light Intensity','Intensity'],Math.min(1,glassDepth*.005));}catch(eBev){}}if(aeGlassTable)GHAFHost._applyAEGlass(frame,p.aeGlass||{});if(!unified)GHAFHost._varnaAnimate(frame,motion,start,Math.min(end,start+anim));
        for(i=0;i<nr;i++){for(j=0;j<nc;j++){
            m=occupied[i+':'+j];if(m&&(m.r!==i||m.c!==j))continue;
            var cs=m?m.cs:1,rs=m?m.rs:1,cellW=0,cellH=0,k,left=(c.width-width)/2,colBefore=0,colThrough=0;
            for(k=j;k<j+cs;k++)cellW+=cw[k];for(k=i;k<i+rs;k++)cellH+=rw[k];for(k=0;k<j;k++)colBefore+=cw[k];for(k=0;k<j+cs;k++)colThrough+=cw[k];
            var cellX=direction==='rtl'?left+width-colThrough:left+colBefore,cell=settings[i+':'+j]||{},cellStart=cell.start==null||cell.start===''?start:Number(cell.start),cellDuration=cell.duration==null||cell.duration===''?null:Number(cell.duration),cellAnim=cell.animDuration==null||cell.animDuration===''?anim:Number(cell.animDuration),cellMotion=cell.motion&&cell.motion!=='inherit'?String(cell.motion):motion;
            if(!isFinite(cellStart)||!isFinite(cellAnim)||(cellDuration!==null&&(!isFinite(cellDuration)||cellDuration<=0))||!motionRe.test(cellMotion))throw Error('INVALID_CELL_SETTINGS '+i+':'+j);
            var slot=cell.start==null||cell.start===''?start+delay*(stagger==='rows'?i:(stagger==='columns'?j:0)):cellStart;slot=Math.max(start,slot);var cellEnd=cellDuration===null?end:Math.min(end,slot+cellDuration);if(slot>=end||cellEnd<=slot)continue;
            var t2=Math.min(cellEnd,slot+cellAnim),shape=null;
            if(!unified){shape=c.layers.addShape();created.push(shape);shape.name=tag+'_R'+(i+1)+'_C'+(j+1)+'_cell';shape.inPoint=slot;shape.outPoint=cellEnd;
            var isHeader=headerRow&&i===0,isZebra=zebra&&i%2===1,cellBorder=cell.stroke?GHAFHost._hex(cell.stroke):border,cellLine=(cell.line!=null&&cell.line!==''?Math.max(0,Number(cell.line)):line),fillColor=cell.fill?GHAFHost._hex(cell.fill):(isHeader?headerColor:(isZebra?zebraColor:color)),fillOpacity=isHeader?headerOpacity:(isZebra?zebraOpacity:cellOpacity),root=shape.property('ADBE Root Vectors Group'),group=root.addProperty('ADBE Vector Group'),vec=group.property('ADBE Vectors Group'),topCell=i===0,bottomCell=i+rs===nr,leftCell=direction==='rtl'?(j+cs===nc):(j===0),rightCell=direction==='rtl'?(j===0):(j+cs===nc),customShape=null,isOuterCorner=(topCell&&(leftCell||rightCell))||(bottomCell&&(leftCell||rightCell));if((roundMode==='outerCorners'||roundMode==='corners')&&isOuterCorner)customShape=GHAFHost._varnaCellShape(cellW,cellH,roundness,'outerCorners',topCell,leftCell,bottomCell,rightCell);if(customShape){var pathProp=vec.addProperty('ADBE Vector Shape - Group');pathProp.property('ADBE Vector Shape').setValue(customShape);}else{var rect=vec.addProperty('ADBE Vector Shape - Rect');rect.property('ADBE Vector Rect Size').setValue([cellW,cellH]);rect.property('ADBE Vector Rect Roundness').setValue((roundMode==='none'||roundMode==='outerCorners'||roundMode==='corners')?0:Math.min(roundness,Math.max(0,Math.min(cellW,cellH)/2)));}var fill=vec.addProperty('ADBE Vector Graphic - Fill');fill.property('ADBE Vector Fill Color').setValue(fillColor);fill.property('ADBE Vector Fill Opacity').setValue(aeGlassTable?100:(liquidGlass?Math.min(fillOpacity,isHeader?12:6):fillOpacity));shape.property('ADBE Transform Group').property('ADBE Position').setValue([cellX+cellW/2,y+cellH/2]);if(aeGlassTable)GHAFHost._applyAEGlass(shape,p.aeGlass||{});GHAFHost._varnaAnimate(shape,cellMotion,slot,t2);}
            var value=String(cells[i][j]==null?'':cells[i][j]);if(value){
                var mt=markerAt(cell.textMarker),textSlot=slot,tm=String(cell.textTimingMode||'inherit');if(tm==='marker'&&mt!==null)textSlot=mt;else if((tm==='custom'||tm==='playhead')&&cell.textStart!==''&&cell.textStart!=null&&isFinite(Number(cell.textStart)))textSlot=Number(cell.textStart);else if(cell.textStart!==''&&cell.textStart!=null&&isFinite(Number(cell.textStart)))textSlot=Number(cell.textStart);textSlot=clampTime(textSlot,slot,cellEnd-c.frameDuration);
                var textEnd=cell.textEnd!==''&&cell.textEnd!=null&&isFinite(Number(cell.textEnd))?Number(cell.textEnd):cellEnd;textEnd=Math.min(cellEnd,Math.max(textSlot+c.frameDuration,Math.min(end,textEnd)));if(textEnd<=textSlot)continue;
                var textMotion=cell.textMotion&&cell.textMotion!=='inherit'?String(cell.textMotion):cellMotion,textAnim=cell.textAnimDuration==null||cell.textAnimDuration===''?cellAnim:Math.max(0,Number(cell.textAnimDuration));if(!motionRe.test(textMotion)&&textMotion.indexOf('ac')!==0)throw Error('INVALID_TEXT_MOTION');var layer=c.layers.addText(value);created.push(layer);layer.name=tag+'_R'+(i+1)+'_C'+(j+1)+'_text';layer.inPoint=textSlot;layer.outPoint=textEnd;
                var doc=layer.property('ADBE Text Properties').property('ADBE Text Document'),d=doc.value;d.text=value;d.fontSize=cell.fontSize!==''&&cell.fontSize!=null&&isFinite(Number(cell.fontSize))?Math.max(6,Number(cell.fontSize)):font;d.fillColor=cell.textColor?GHAFHost._hex(cell.textColor):(isHeader?headerInk:ink);GHAFHost._font(d,cell.fontPS||p.fontPS||'ArialMT');d.applyFill=true;var align=String(cell.textAlign||'center');d.justification=align==='right'?ParagraphJustification.RIGHT_JUSTIFY:(align==='left'?ParagraphJustification.LEFT_JUSTIFY:ParagraphJustification.CENTER_JUSTIFY);var rtlText=direction==='rtl'?true:(direction==='ltr'?false:/[^\u0000-\u007f]/.test(value));GHAFHost._rtl(d,rtlText);doc.setValue(d);var box=layer.sourceRectAtTime(textSlot,false),limit=0;while((box.width>cellW*.88||box.height>cellH*.85)&&limit<18&&d.fontSize>8){d.fontSize=Math.max(8,d.fontSize*.88);doc.setValue(d);box=layer.sourceRectAtTime(textSlot,false);limit++;}var tx=align==='left'?cellX+cellW*.06:align==='right'?cellX+cellW*.94-box.width:cellX+cellW/2-box.width/2,va=String(cell.verticalAlign||'middle'),ty=va==='top'?y+cellH*.075:va==='bottom'?y+cellH*.925-box.height:y+cellH/2-box.height/2;layer.property('ADBE Transform Group').property('ADBE Position').setValue([tx-box.left,ty-box.top]);if(textMotion.indexOf('ac')===0){var ag={start:textSlot,end:textEnd,text:value},aa={preset:textMotion,inDur:textAnim,outPreset:'none',strength:45,typeSound:false};GHAFHost._addAnimMarkers(layer,ag,aa);if(!GHAFHost._applyComposerPreset(layer,ag,aa,textMotion))throw Error('UNSUPPORTED_CELL_MOTION');}else GHAFHost._varnaAnimate(layer,textMotion,textSlot,Math.min(textEnd,textSlot+textAnim));
            }
        }y+=rw[i];}
        if(line>0){var segments=GHAFHost._tableDividers(rows,cols,merges,direction),lines=c.layers.addShape();created.push(lines);lines.name=tag+'_dividers';lines.inPoint=start;lines.outPoint=end;lines.property('ADBE Transform Group').property('ADBE Position').setValue([c.width/2,c.height/2]);var lr=lines.property('ADBE Root Vectors Group');for(var si=0;si<segments.length;si++){var sg=segments[si],lg=lr.addProperty('ADBE Vector Group').property('ADBE Vectors Group'),lp=lg.addProperty('ADBE Vector Shape - Group'),path=new Shape();path.vertices=[[sg[0]*width-width/2,sg[1]*height-height/2],[sg[2]*width-width/2,sg[3]*height-height/2]];path.inTangents=[[0,0],[0,0]];path.outTangents=[[0,0],[0,0]];path.closed=false;lp.property('ADBE Vector Shape').setValue(path);var ls=lg.addProperty('ADBE Vector Graphic - Stroke');ls.property('ADBE Vector Stroke Color').setValue(border);ls.property('ADBE Vector Stroke Width').setValue(line);ls.property('ADBE Vector Stroke Opacity').setValue(dividerOpacity);}}
        // Shared controller moves the whole glass plane, dividers and text together.
        if(unified){var handle=c.layers.addNull();created.push(handle);handle.name=tag+'_surface_control';handle.inPoint=start;handle.outPoint=end;handle.property('ADBE Transform Group').property('ADBE Position').setValue([c.width/2,c.height/2]);for(var hi=0;hi<created.length-1;hi++){created[hi].parent=handle;created[hi].property('ADBE Transform Group').property('ADBE Opacity').expression='value * parent.transform.opacity / 100';}handle.property('ADBE Transform Group').property('ADBE Position').setValue([centerX,centerY]);GHAFHost._tableSurfaceEntry(handle,surfaceEntry,start,Math.min(end,start+anim));}else{for(var pi=0;pi<created.length;pi++){var pp=created[pi].property('ADBE Transform Group').property('ADBE Position'),pv=pp.value; if(dx||dy){if(pp.numKeys){for(var pk=1;pk<=pp.numKeys;pk++){var kv=pp.keyValue(pk);pp.setValueAtKey(pk,[kv[0]+dx,kv[1]+dy]);}}else pp.setValue([pv[0]+dx,pv[1]+dy]);}}}
        for(var gi=0;gi<created.length;gi++){created[gi].guideLayer=!!p.preview;created[gi].shy=!!p.preview;}GHAFHost._deleteLayers(oldPreview);if(!p.preview)c.time=start;app.endUndoGroup();return GHAFHost._ok({layers:created.length,tag:tag,start:start,end:end});
    }catch(e){for(i=created.length-1;i>=0;i--)try{created[i].remove();}catch(ignore){}app.endUndoGroup();return GHAFHost._err(e.toString());}
};


GHAFHost.capabilities=function(){
 var methods={},name,c=GHAFHost._activeComp(),required=['getSelectionInfo','getTimelineInfo','buildOutput','updateLivePreview','removeLivePreview','buildVarnaTable','removeVarnaTablePreview','analyzeComposition','applySfxPlan','removeSfxPreview','applyAudioBalance','listFonts','getProjectLocation','runDiagnostics'];
 for(var i=0;i<required.length;i++){name=required[i];methods[name]=typeof GHAFHost[name]==='function';}
 var layers=0;try{layers=c?c.selectedLayers.length:0;}catch(e){}
 return GHAFHost._ok({version:'4.5.0-rc.47',host:app.version,methods:methods,context:{comp:!!c,compId:c?c.id:null,selectedLayers:layers,time:c?c.time:null,duration:c?c.duration:null},checks:{compositionAccess:true,selectedLayerAccess:!!c,activeTiming:!!c,textCreation:!!(c&&c.layers&&c.layers.addText),markerAccess:!!(c&&c.markerProperty),audioCreation:!!(c&&c.layers&&c.layers.add),preview:methods.updateLivePreview&&methods.removeLivePreview,table:methods.buildVarnaTable&&methods.removeVarnaTablePreview,sfx:methods.applySfxPlan,background:typeof GHAFHost._applyBg==='function'},runtimeVerified:false});
};
GHAFHost._previewName=function(n){return /^(__GHAF_LIVE_PREVIEW__|__VARNA_LIVE_CAP_|__VARNA_TABLE_PREVIEW__|VARNA_SFX_PREVIEW_)/.test(String(n||''));};
GHAFHost._managedVisual=function(l){var n=String(l.name||'');return GHAFHost._previewName(n)||/^(__GHAF_NATIVE_BG__|__GHAF_GLASS_BLUR__|__GHAF_TEMPLATE_BG__|__GHAF_TYPE_MEASURE__|GHAF_TYPE_CLICK_)/.test(n);};
GHAFHost._layerSet=function(c){var a=[];for(var i=1;i<=c.numLayers;i++)a.push(c.layer(i));return a;};
GHAFHost._newLayers=function(c,old){var a=[];for(var i=1;i<=c.numLayers;i++){var l=c.layer(i),found=false;for(var j=0;j<old.length;j++)if(old[j]===l){found=true;break;}if(!found)a.push(l);}return a;};
GHAFHost._deleteLayers=function(a){var solids=[],smartComps=[];for(var i=a.length-1;i>=0;i--)try{var l=a[i],n=String(l.name||'');try{if((/^__GHAF_GLASS_BLUR__/.test(n)||/^__?VARNA_TABLE_/.test(n)||/^VARNA_TABLE_/.test(n))&&l.source&&typeof SolidSource!=='undefined'&&l.source.mainSource instanceof SolidSource)solids.push(l.source);}catch(eS){}try{if(l.source instanceof CompItem&&l.source.comment==='VARNA_SMART_CAPTION')smartComps.push(l.source);}catch(smartError){}l.locked=false;l.remove();}catch(e){}for(i=0;i<smartComps.length;i++)try{if(smartComps[i].usedIn.length===0)smartComps[i].remove();}catch(smartCleanup){}for(i=0;i<solids.length;i++)try{if(solids[i].usedIn.length===0)solids[i].remove();}catch(eR){}};
GHAFHost._previewLayers=function(c){var a=[];for(var i=1;i<=c.numLayers;i++){var l=c.layer(i),n=String(l.name||''),live=/^(__GHAF_LIVE_PREVIEW__|__VARNA_LIVE_CAP_)/.test(n);try{live=live||(l.parent&&/^(__GHAF_LIVE_PREVIEW__|__VARNA_LIVE_CAP_)/.test(String(l.parent.name)));}catch(e){}if(/VARNA_LIVE_OWNER/.test(String(l.comment||'')))live=true;if(live||(/^(?:__GHAF_NATIVE_BG__|__GHAF_GLASS_BLUR__|__GHAF_TEMPLATE_BG__|__GHAF_TYPE_MEASURE__)/.test(n)&&/__GHAF_LIVE_PREVIEW__|__VARNA_LIVE_CAP_/.test(n)))a.push(l);}return a;};
GHAFHost.updateLivePreview=function(encoded){
 var p=GHAFHost._parse(encoded),c=GHAFHost._activeComp();if(!c)return GHAFHost._err('NO_COMP');if(p.compId!=null&&c.id!==p.compId)return GHAFHost._err('Composition changed; previous preview preserved.');var groups=p.groups||[],old=GHAFHost._layerSet(c),previous=GHAFHost._previewLayers(c),stamp=String(new Date().getTime());if(!groups.length&&p.group)groups=[p.group];
 app.beginUndoGroup('Varna Preview');try{
  for(var i=0;i<groups.length;i++){var g=groups[i];g.anim=g.anim||{};g.anim.typeSound=false;GHAFHost._createCaption(c,g,'__VARNA_LIVE_CAP_'+stamp+'_'+i);}
  var fresh=GHAFHost._newLayers(c,old);for(i=0;i<fresh.length;i++){fresh[i].locked=false;fresh[i].enabled=true;fresh[i].guideLayer=true;fresh[i].shy=true;}
  GHAFHost._deleteLayers(previous);c.openInViewer();return GHAFHost._ok({created:groups.length,followTimeline:true,compId:c.id});
 }catch(e){GHAFHost._deleteLayers(GHAFHost._newLayers(c,old));return GHAFHost._err(String(e));}finally{app.endUndoGroup();}
};
GHAFHost._removeAllLivePreviewLayers=function(){var total=0;for(var i=1;i<=app.project.numItems;i++){var c=app.project.item(i);if(c instanceof CompItem){var layers=GHAFHost._previewLayers(c);total+=layers.length;GHAFHost._deleteLayers(layers);}}return total;};
GHAFHost.runDiagnostics=function(encoded){
 var p=GHAFHost._parse(encoded),original=GHAFHost._activeComp(),c=null,results=[],beforeItems=app.project.numItems;
 function check(name,fn){try{fn();results.push({name:name,pass:true});}catch(e){results.push({name:name,pass:false,error:String(e)});}}
 app.beginUndoGroup('Varna temporary diagnostics');
 try{
  c=app.project.items.addComp('__VARNA_DIAGNOSTIC__',960,540,1,10,30);c.openInViewer();
  check('Text / IN OUT / background',function(){var g={id:1,text:'سلام Varna Motion Studio',start:1,end:6,style:{size:44,rtl:true},anim:{mode:'simple',preset:'rise',outPreset:'mirror:rise',inDur:.4,outDur:.4,syncMode:'together',typeSound:false},bg:{enabled:true,style:'liquid',engine:'native',opacity:12,round:24,padding:24}};var l=GHAFHost._createCaption(c,g,'GHAF_CAP_DIAGNOSTIC');if(!l||l.inPoint!==1||l.outPoint!==6)throw Error('Caption timing');if(l.property('ADBE Marker').numKeys!==2)throw Error('IN/OUT markers');});
  check('3x3 RTL table / merge / interval',function(){var r=GHAFJSON.parse(GHAFHost.buildVarnaTable(encodeURIComponent(GHAFJSON.stringify({rows:[1,1,1],cols:[1,1,1],cells:[['الف','ب','ج'],['۱','۲','۳'],['A','B','C']],merges:[{r:0,c:0,rs:1,cs:2}],direction:'rtl',start:2,end:8,motion:'rise',stagger:'all',roundMode:'outerCorners',preview:true}))));if(!r.ok||r.data.layers<2)throw Error(r.error||'Empty table');});
  check('Table preview cleanup',function(){var r=GHAFJSON.parse(GHAFHost.removeVarnaTablePreview());if(!r.ok||!r.data.removed)throw Error('No preview removed');});
  if(p.audioPath)check('Audio placement at 4 seconds',function(){var r=GHAFJSON.parse(GHAFHost.applySfxPlan(encodeURIComponent(GHAFJSON.stringify({plan:[{path:p.audioPath,eventTime:4,category:'click',db:-24}],preview:true}))));if(!r.ok||r.data.created!==1||r.data.placements[0].delta>c.frameDuration/2)throw Error(r.error||'SFX timing');});
  check('Expression evaluation',function(){function walk(group){for(var j=1;j<=group.numProperties;j++){var pr=group.property(j);if(pr.numProperties)walk(pr);else if(pr.canSetExpression&&pr.expression){pr.valueAtTime(2,false);if(pr.expressionError)throw Error(pr.name+': '+pr.expressionError);}}}for(var i=1;i<=c.numLayers;i++)walk(c.layer(i));});
 }catch(e){results.push({name:'Diagnostic setup',pass:false,error:String(e)});}
 finally{if(c)try{c.remove();}catch(eC){}for(var i=app.project.numItems;i>beforeItems;i--)try{var it=app.project.item(i);if(it.usedIn&&it.usedIn.length===0)it.remove();}catch(eI){}if(original)try{original.openInViewer();}catch(eO){}app.endUndoGroup();}
 var pass=results.length>0;for(var k=0;k<results.length;k++)if(!results[k].pass)pass=false;
 return GHAFHost._ok({version:'4.5.0-rc.47',host:app.version,passed:pass,checks:results,visualReviewRequired:true});
};

/* Companion effects are applied to AE layers, so their native controls and licensing stay in AE. */
GHAFHost._vendorEffectNames={cosmic:'Cosmic',glassary:'Glassary',cuttana:'CuttanaNir'};
GHAFHost._vendorTarget=function(c,target){
    if(!c||!c.selectedLayers||c.selectedLayers.length!==1)throw Error('یک لایهٔ متن یا Shape را در کامپ انتخاب کن');
    var layer=c.selectedLayers[0];
    if(target==='background'){
        var bg=GHAFHost._nativeBgFor(layer);
        if(!bg && layer.matchName==='ADBE Vector Layer')bg=layer;
        if(!bg)throw Error('اول بک‌گراند Varna را بساز یا Shape بک‌گراند را انتخاب کن');
        layer=bg;
    }else if(layer.matchName!=='ADBE Text Layer')throw Error('برای استایل متن، یک Text Layer انتخاب کن');
    return layer;
};
GHAFHost._vendorProps=function(effect){
    var result=[],count=0;
    function scan(group,path,depth,labels){if(depth>6)return;labels=labels||[];for(var i=1;i<=group.numProperties&&count<160;i++){
        var prop=group.property(i),next=path.concat([i]);if(!prop)continue;
        if(prop.numProperties){scan(prop,next,depth+1,labels.concat([String(prop.name||'')]));continue;}
        var val;try{val=prop.value;}catch(e){continue;}
        var kind=typeof val==='number'?'number':(val instanceof Array&&typeof val[0]==='number'?'vector':'readonly');try{if(typeof PropertyValueType!=='undefined'&&prop.propertyValueType===PropertyValueType.COLOR)kind='color';}catch(typeError){}
        if(kind==='number'&&!isFinite(val))kind='readonly';if(kind==='color'&&(!(val instanceof Array)||val.length<3))kind='readonly';if(kind==='color'||kind==='vector'){for(var vi=0;vi<val.length;vi++)if(typeof val[vi]!=='number'||!isFinite(val[vi])){kind='readonly';break;}}if(kind==='readonly')val=null;
        result.push({group:labels.join(' / '),path:next,name:String(prop.name||prop.matchName||i),matchName:String(prop.matchName||''),kind:kind,value:val,min:prop.hasMin?prop.minValue:null,max:prop.hasMax?prop.maxValue:null});count++;
    }}
    scan(effect,[],0);return result;
};
GHAFHost.applyVendorEffect=function(encoded){var p=GHAFHost._parse(encoded),name=GHAFHost._vendorEffectNames[p.effect],c=GHAFHost._activeComp();if(!c)return GHAFHost._err('NO_COMP');if(!name)return GHAFHost._err('Unknown companion effect');
    app.beginUndoGroup('Varna · '+name);try{var layer=GHAFHost._vendorTarget(c,p.target==='background'?'background':'text'),fx=layer.property('ADBE Effect Parade'),effect=null,tag='VARNA · '+name;
        for(var i=1;i<=fx.numProperties;i++)if(fx.property(i).name===tag){effect=fx.property(i);break;}
        if(!effect){try{effect=fx.addProperty(name);}catch(addError){throw Error(name+' در After Effects بارگذاری نشده است؛ نصب Max و راه‌اندازی دوباره AE را بررسی کن. '+addError);}}
        effect.name=tag;var controls=GHAFHost._vendorProps(effect),reply={effect:p.effect,layer:layer.name,controls:controls};app.endUndoGroup();return GHAFHost._ok(reply);
    }catch(e){app.endUndoGroup();return GHAFHost._err(e.toString());}
};
GHAFHost.inspectVendorEffect=function(encoded){var p=GHAFHost._parse(encoded),name=GHAFHost._vendorEffectNames[p.effect],c=GHAFHost._activeComp();if(!c)return GHAFHost._err('NO_COMP');if(!name)return GHAFHost._err('Unknown companion effect');try{
    var layer=GHAFHost._vendorTarget(c,p.target==='background'?'background':'text'),fx=layer.property('ADBE Effect Parade'),effect=null;
    for(var i=1;i<=fx.numProperties;i++)if(fx.property(i).name==='VARNA · '+name){effect=fx.property(i);break;}
    if(!effect)throw Error('افکت '+name+' هنوز روی لایهٔ انتخابی اعمال نشده است');return GHAFHost._ok({layer:layer.name,controls:GHAFHost._vendorProps(effect)});
 }catch(e){return GHAFHost._err(e.toString());}};
GHAFHost.setVendorEffectControl=function(encoded){var p=GHAFHost._parse(encoded),name=GHAFHost._vendorEffectNames[p.effect],c=GHAFHost._activeComp();if(!c)return GHAFHost._err('NO_COMP');if(!name)return GHAFHost._err('Unknown companion effect');
 app.beginUndoGroup('Varna · '+name+' control');try{var layer=GHAFHost._vendorTarget(c,p.target==='background'?'background':'text'),fx=layer.property('ADBE Effect Parade'),effect=null;
 for(var i=1;i<=fx.numProperties;i++)if(fx.property(i).name==='VARNA · '+name){effect=fx.property(i);break;}
 if(!effect)throw Error('افکت روی لایهٔ انتخابی نیست');var path=p.path;if(!(path instanceof Array)||!path.length||path.length>5)throw Error('مسیر کنترل معتبر نیست');var prop=effect;
 for(i=0;i<path.length;i++){var index=Number(path[i]);if(!isFinite(index)||index<1||index>prop.numProperties||index!==Math.floor(index))throw Error('مسیر کنترل معتبر نیست');prop=prop.property(index);}
 var old=prop.value,v;if(typeof old==='number'){v=Number(p.value);if(!isFinite(v))throw Error('مقدار عددی نامعتبر است');}else if(old instanceof Array && old.length>=3 && p.value instanceof Array){v=[];for(i=0;i<old.length;i++){var n=Number(p.value[i]);if(!isFinite(n))throw Error('رنگ نامعتبر است');v.push(Math.max(0,Math.min(1,n)));}}else throw Error('این کنترل از داخل Varna قابل ویرایش نیست؛ در Effect Controls خود AE تغییر بده');
 prop.setValue(v);app.endUndoGroup();return GHAFHost._ok({name:prop.name,value:prop.value});
 }catch(e){app.endUndoGroup();return GHAFHost._err(e.toString());}};
GHAFHost.importSmartCaptions=function(){if(!app.project)return GHAFHost._err('No After Effects project');var path=File(GHAFHost._filePath).parent.parent.fsName+'/assets/vendor/Smart Captions Engine/01. Smart Captions Engine/Smart Captions Engine.aep',f=new File(path);if(!f.exists)return GHAFHost._err('Smart Captions project is not installed');app.beginUndoGroup('Varna · import Smart Captions');try{var item=app.project.importFile(new ImportOptions(f));app.endUndoGroup();return GHAFHost._ok({name:item?item.name:'Smart Captions Engine'});}catch(e){app.endUndoGroup();return GHAFHost._err(e.toString());}};
GHAFHost.openCompanionScript=function(encoded){var p=GHAFHost._parse(encoded),names={writetyper:'WriteTyper',glassary:'Glassary',cuttana:'CuttanaNir'},name=names[p.script];if(!name)return GHAFHost._err('Unknown companion script');try{var id=app.findMenuCommandId(name);if(id>0){app.executeCommand(id);return GHAFHost._ok({name:name,opened:true});}return GHAFHost._err(name+' در منوی Window پیدا نشد؛ پس از نصب Max یک بار AE را ببند و باز کن.');}catch(e){return GHAFHost._err(e.toString());}};

/* R9: single safe CEP entry point. Every panel->AE call goes through this method. */
GHAFHost.dispatch = function(method, encoded){
    try{
        method=String(method||'');
        if(!method || method==='dispatch' || method.charAt(0)==='_') return GHAFHost._err('HOST_METHOD_NOT_ALLOWED: '+method);
        var fn=GHAFHost[method];
        if(typeof fn!=='function') return GHAFHost._err('HOST_METHOD_NOT_FOUND: '+method);
        return fn(encoded);
    }catch(e){
        var context=' [method: '+String(method||'unknown');if(e&&e.line!=null)context+=', line: '+String(e.line);context+=']';
        return GHAFHost._err('HOST_DISPATCH_ERROR: '+String(e)+context);
    }
};


/* Integrated adapters are inline. */
GHAFHost._repairGlassaryName=function(layer){var fx=layer.property('ADBE Effect Parade');if(!fx)return;for(var i=1;i<=fx.numProperties;i++)if(String(fx.property(i).name)==='VARNA · Glassary')fx.property(i).name='Glassary';};
/* Adapters operate through the original tool handlers. Licensing and vendor assets are intact. */
GHAFHost._vendorMatch=function(key){var name=GHAFHost._vendorEffectNames[key];if(!name)throw Error('Unknown effect');try{for(var i=0;i<app.effects.length;i++)if(String(app.effects[i].displayName).toLowerCase()===name.toLowerCase())return app.effects[i].matchName;}catch(e){}return name;};
GHAFHost.vendorEffectSchema=function(encoded){
 var p=GHAFHost._parse(encoded),c=GHAFHost._activeComp(),l=null,probeLayers=[],selected=c?c.selectedLayers:[];
 if(!c)return GHAFHost._err('NO_COMP');app.beginUndoGroup('Varna effect controls');
 try{if(p.preferSelection&&selected.length===1){var existingLayer=GHAFHost._vendorTarget(c,p.target==='background'?'background':'text'),parade=existingLayer.property('ADBE Effect Parade'),match=GHAFHost._vendorMatch(p.effect);if(p.effect==='glassary')GHAFHost._repairGlassaryName(existingLayer);for(var ix=1;ix<=parade.numProperties;ix++)if(parade.property(ix).matchName===match||parade.property(ix).name===GHAFHost._vendorEffectNames[p.effect]||parade.property(ix).name==='VARNA · '+GHAFHost._vendorEffectNames[p.effect])return GHAFHost._ok({effect:p.effect,controls:GHAFHost._vendorProps(parade.property(ix)),source:'selected'});}var before=GHAFHost._layerSet(c);l=c.layers.addText('VARNA');var effect;if(p.effect==='glassary'){var shape=GHAFHost._glassHelper(l,{padding:24,round:24,opacity:100},'SCHEMA',true);if(!shape)throw Error('GLASSARY_PROBE_SHAPE_FAILED');effect=GHAFHost._convertGlassaryShape(shape);}else effect=l.property('ADBE Effect Parade').addProperty(GHAFHost._vendorMatch(p.effect));probeLayers=GHAFHost._newLayers(c,before);return GHAFHost._ok({effect:p.effect,controls:GHAFHost._vendorProps(effect)});}
 catch(e){return GHAFHost._err('افکت در AE بارگذاری نشد: '+String(e));}
 finally{if(typeof before!=='undefined')probeLayers=GHAFHost._newLayers(c,before);if(probeLayers.length)GHAFHost._deleteLayers(probeLayers);else if(l)try{l.locked=false;l.remove();}catch(ignore){}for(var i=0;i<selected.length;i++)try{selected[i].selected=true;}catch(eSelect){}app.endUndoGroup();}
};
GHAFHost._applyPersistedVendorEffects=function(layer,items){if(!items||!items.length)return;if(!layer)throw Error('Vendor effect layer missing');for(var i=0;i<items.length;i++){var item=items[i],name=GHAFHost._vendorEffectNames[item.effect];if(!name)continue;var fx=layer.property('ADBE Effect Parade'),effect=null;for(var j=1;j<=fx.numProperties;j++)if(fx.property(j).name==='VARNA · '+name||fx.property(j).matchName===GHAFHost._vendorMatch(item.effect)){effect=fx.property(j);break;}if(!effect)effect=item.effect==='glassary'?GHAFHost._convertGlassaryShape(layer):fx.addProperty(GHAFHost._vendorMatch(item.effect));if(item.effect==='glassary'){GHAFHost._repairGlassaryName(layer);layer.comment=String(layer.comment||'').replace(/\n?VARNA_GLASSARY_MANAGED/g,'')+'\nVARNA_GLASSARY_MANAGED';}else effect.name='VARNA · '+name;for(j=0;j<(item.parameters||[]).length;j++){var setting=item.parameters[j],prop=effect,path=setting.path||[];for(var k=0;k<path.length;k++){var n=Number(path[k]);if(n!==Math.floor(n)||n<1||n>prop.numProperties)throw Error(name+' control path changed');prop=prop.property(n);}if(path.length){var same=false;try{same=GHAFJSON.stringify(prop.value)===GHAFJSON.stringify(setting.value);}catch(eValue){}if(!same){if(prop.numKeys>0)prop.setValueAtTime(layer.inPoint,setting.value);else prop.setValue(setting.value);}}}}};
GHAFHost.loadEmbeddedHost=function(encoded){var p=GHAFHost._parse(encoded),files={orb:'Orb Reactor/com.anas.orbreactor/host/index.jsx',railcut:'Railcut/Railcut/jsx/hostscript.jsx'};if(!files[p.tool])return GHAFHost._err('Unknown embedded tool');try{var f=new File(File(GHAFHost._filePath).parent.parent.fsName+'/assets/vendor/'+files[p.tool]);if(!f.exists)throw Error('Tool files are not installed. Install Max.');GHAFHost._embeddedLoaded=GHAFHost._embeddedLoaded||{};if(!GHAFHost._embeddedLoaded[p.tool]||(p.tool==='orb'&&(!$.global.VarnaOrbHost||typeof $.global.VarnaOrbHost.aeGetActiveCompInfo!=='function'))){$.evalFile(f);GHAFHost._embeddedLoaded[p.tool]=true;}return GHAFHost._ok({loaded:true});}catch(e){return GHAFHost._err(String(e));}};
GHAFHost._scriptUIs=GHAFHost._scriptUIs||{};GHAFHost._scriptFiles={writetyper:'WriteTyper/WriteTyper.jsxbin',glassary:'Glassary/Glassary-ScriptUI/Glassary.jsxbin',cuttana:'CuttanaNir3/CuttanaNir.jsxbin'};
GHAFHost._scriptUITree=function(tool,root){var out=[],icon=0,count=0,labels={writetyper:['ساخت تایپ','به‌روزرسانی','پیش‌نمایش','حذف','ذخیرهٔ پریست','دربارهٔ ابزار','تنظیمات'],glassary:['مربع شیشه‌ای','دایرهٔ شیشه‌ای','مثلث گرد','مستطیل شیشه‌ای','شیشه از مسیر','اعمال به Shape انتخابی']};function scan(n,path,depth){if(depth>12||count++>240)return;var type=String(n.type||''),text=String(n.text||''),p={path:path,type:type,text:text,label:text||String(n.helpTip||''),context:'',enabled:n.enabled!==false};var ancestor=n.parent,contexts=[];for(var ai=0;ancestor&&ai<4;ai++,ancestor=ancestor.parent)if(ancestor.text)contexts.unshift(String(ancestor.text));p.context=contexts.join(' / ');if(type==='iconbutton'){if(!p.label)p.label=labels[tool]&&labels[tool][icon]||'فرمان '+(icon+1);icon++;}try{if(type==='checkbox'||type==='radiobutton')p.value=!!n.value;else if(type==='slider'){p.value=Number(n.value);p.min=Number(n.minvalue);p.max=Number(n.maxvalue);}else if(type==='dropdownlist'||type==='listbox'){p.items=[];for(var j=0;j<n.items.length;j++)p.items.push(String(n.items[j].text));p.value=n.selection?n.selection.index:0;}else if(type==='edittext')p.value=text;}catch(e){}if(path.length&&type!=='group'&&type!=='panel'&&type!=='window')out.push(p);if(n.children)for(var i=0;i<n.children.length;i++)scan(n.children[i],path.concat([i]),depth+1);}scan(root,[],0);return {tool:tool,controls:out};};
GHAFHost.initScriptTool=function(encoded){var p=GHAFHost._parse(encoded),tool=String(p.tool||''),relative=GHAFHost._scriptFiles[tool];if(!relative)return GHAFHost._err('Unknown script');try{var root=GHAFHost._scriptUIs[tool];if(!root){var f=new File(File(GHAFHost._filePath).parent.parent.fsName+'/assets/vendor/'+relative);if(!f.exists)throw Error('Install Max to use this tool');var result=$.evalFile(f);if(result&&result.children)root=result;var names={writetyper:['WriteTyper','WriteTyper v1.0.0'],glassary:['Glassary','Glassary v1.6'],cuttana:['CuttanaNir','CuttanaNir3','CuttanaNir 3']};for(var i=0;i<names[tool].length&&!root;i++)root=Window.find('palette',names[tool][i]);if(!root||!root.children)throw Error('رابط قابل اتصال این اسکریپت باینری پیدا نشد.');root.hide();GHAFHost._scriptUIs[tool]=root;}return GHAFHost._ok(GHAFHost._scriptUITree(tool,root));}catch(e){return GHAFHost._err(String(e));}};
GHAFHost.scriptToolAction=function(encoded){var p=GHAFHost._parse(encoded),root=GHAFHost._scriptUIs[p.tool];if(!root)return GHAFHost._err('Script is not initialized');try{var control=root,path=p.path;if(!(path instanceof Array)||!path.length||path.length>12)throw Error('Invalid control path');for(var i=0;i<path.length;i++){var ix=Number(path[i]);if(!control.children||ix<0||ix>=control.children.length||ix!==Math.floor(ix))throw Error('Invalid control');control=control.children[ix];}var type=String(control.type);if(p.action==='click'){if(type!=='button'&&type!=='iconbutton')throw Error('Not a button');control.notify('onClick');}else{if(type==='checkbox'||type==='radiobutton')control.value=!!p.value;else if(type==='dropdownlist'||type==='listbox'){var index=Number(p.value);if(index!==Math.floor(index)||index<0||index>=control.items.length)throw Error('Invalid item');control.selection=index;}else if(type==='slider'){var value=Number(p.value);if(!isFinite(value))throw Error('Invalid value');control.value=Math.max(control.minvalue,Math.min(control.maxvalue,value));}else if(type==='edittext')control.text=String(p.value==null?'':p.value);else throw Error('Unsupported control');control.notify(type==='checkbox'||type==='radiobutton'?'onClick':'onChange');}root.hide();return GHAFHost._ok(GHAFHost._scriptUITree(p.tool,root));}catch(e){try{root.hide();}catch(ignore){}return GHAFHost._err(String(e));}};
GHAFHost.prepareSmartTemplates=function(){try{var comps=[],before={};for(var i=1;i<=app.project.numItems;i++){var item=app.project.item(i);before[item.id]=true;if(item instanceof CompItem&&String(item.comment||'').indexOf('VARNA_SMART_TEMPLATE')===0)comps.push(item);}if(!comps.length){var f=new File(File(GHAFHost._filePath).parent.parent.fsName+'/assets/vendor/Smart Captions Engine/01. Smart Captions Engine/Smart Captions Engine.aep');if(!f.exists)throw Error('Install Max');app.project.importFile(new ImportOptions(f));for(i=1;i<=app.project.numItems;i++){item=app.project.item(i);if(!before[item.id]&&item instanceof CompItem){item.comment='VARNA_SMART_TEMPLATE\n'+String(item.comment||'');comps.push(item);}}}var list=[];for(i=0;i<comps.length;i++){var c=comps[i],texts=[];for(var j=1;j<=c.numLayers;j++)if(c.layer(j).property('ADBE Text Properties'))texts.push({index:j,name:c.layer(j).name,editable:!c.layer(j).property('ADBE Text Properties').property('ADBE Text Document').expression});if(texts.length)list.push({id:c.id,name:c.name,duration:c.duration,texts:texts});}if(!list.length)throw Error('No editable text template found');return GHAFHost._ok({templates:list});}catch(e){return GHAFHost._err(String(e));}};
GHAFHost._smartComp=function(id){var c=app.project.itemByID(id);if(c instanceof CompItem&&String(c.comment||'').indexOf('VARNA_SMART_TEMPLATE')===0)return c;throw Error('قالب در پروژهٔ فعلی پیدا نشد؛ قالب‌ها را دوباره بارگذاری کن.');};
GHAFHost.smartTemplateControls=function(encoded){var p=GHAFHost._parse(encoded);try{var c=GHAFHost._smartComp(Number(p.compId)),out=[];for(var i=1;i<=c.numLayers;i++){var l=c.layer(i),fx=l.property('ADBE Effect Parade');if(!fx)continue;for(var j=1;j<=fx.numProperties;j++){var props=GHAFHost._vendorProps(fx.property(j));for(var k=0;k<props.length;k++){props[k].layerIndex=i;props[k].effectIndex=j;props[k].group=l.name+' · '+fx.property(j).name;out.push(props[k]);}}}return GHAFHost._ok({controls:out});}catch(e){return GHAFHost._err(String(e));}};
GHAFHost._createSmartCaption=function(comp,g,name){var cfg=g.anim.smartTemplate,template=GHAFHost._smartComp(Number(cfg.compId)),copy=null,layer=null;try{copy=template.duplicate();copy.name='__VARNA_SMART_'+String(g.id||0);copy.comment='VARNA_SMART_CAPTION';var text=copy.layer(Number(cfg.textLayerIndex));if(!text||!text.property('ADBE Text Properties'))throw Error('Template text unavailable');var source=text.property('ADBE Text Properties').property('ADBE Text Document');source.expression='';while(source.numKeys>0)source.removeKey(1);var d=source.value;d.text=String(g.text||'');source.setValue(d);text.inPoint=0;text.outPoint=copy.duration;if((g.style||{}).brandStyled)GHAFHost._applyTextStyle(text,g.style,g.text||'');if((g.style||{}).vendorEffects)GHAFHost._applyPersistedVendorEffects(text,g.style.vendorEffects);for(var i=0;i<(cfg.controls||[]).length;i++){var v=cfg.controls[i],pr=copy.layer(v.layerIndex).property('ADBE Effect Parade').property(v.effectIndex);for(var j=0;j<v.path.length;j++)pr=pr.property(v.path[j]);if(pr.numKeys>0)pr.setValueAtTime(0,v.value);else pr.setValue(v.value);}if(g.bg&&g.bg.enabled){var bg={};for(var key in g.bg)bg[key]=g.bg[key];bg.markerDriven=false;GHAFHost._applyBg(text,bg);GHAFHost._applyBgVendorEffects(text,bg);}if((g.style||{}).aeGlassText)GHAFHost._applyAEGlassText(text,g.bg||{},g.style);layer=comp.layers.add(copy);layer.name=name;layer.comment='VARNA_CAPTION_ID:'+String(g.id||0);layer.startTime=Number(g.start);layer.stretch=(Number(g.end)-Number(g.start))/copy.duration*100;layer.inPoint=Number(g.start);layer.outPoint=Math.min(comp.duration,Number(g.end));var tr=layer.property('ADBE Transform Group'),scale=Math.min(comp.width/copy.width,comp.height/copy.height)*100;if(g.safeBox){var b=g.safeBox;scale=Math.min(comp.width*(b.x2-b.x1)/copy.width,comp.height*(b.y2-b.y1)/copy.height)*100;tr.property('ADBE Position').setValue([comp.width*(b.x1+b.x2)/2,comp.height*(b.y1+b.y2)/2]);}else tr.property('ADBE Position').setValue([comp.width/2,comp.height/2]);tr.property('ADBE Scale').setValue([scale,scale]);return layer;}catch(e){if(layer)try{layer.remove();}catch(ignore){}if(copy)try{copy.remove();}catch(ignore2){}throw e;}};

GHAFHost._syncPersistedVendorEffects=function(layer,items){
 var fx=layer.property('ADBE Effect Parade'),keep={};for(var i=0;i<items.length;i++)keep['VARNA · '+GHAFHost._vendorEffectNames[items[i].effect]]=true;
 for(i=fx.numProperties;i>=1;i--){var pr=fx.property(i),name=String(pr.name);if(name==='Glassary'&&/VARNA_GLASSARY_MANAGED/.test(String(layer.comment||''))&&!keep['VARNA · Glassary'])pr.remove();else if((name==='VARNA · Cosmic'||name==='VARNA · Glassary'||name==='VARNA · CuttanaNir')&&!keep[name])pr.remove();}
 GHAFHost._applyPersistedVendorEffects(layer,items);
};

/* Varna workflow adapters. Original vendor files and licensing are unchanged. */
GHAFHost._typingExpression=function(a){
 a=a||{};var off=Math.max(0,Number(a.startOffset)||0),dur=Math.max(.03,Number(a.inDur)||.42),direction=String(a.typingDirection||'auto'),variance=Math.max(0,Math.min(1,Number(a.typingVariance)||0)),pause=Math.max(0,Math.min(5,Number(a.typingPause)||0));
 return "var s=value.toString(),u=[],w=[],sum=0,pending='';for(var i=0;i<s.length;i++){var ch=s.charAt(i),n=s.charCodeAt(i);if(n>=55296&&n<=56319&&i+1<s.length)ch+=s.charAt(++i);if(/[\\u0300-\\u036f\\u064b-\\u065f\\u0670\\ufe00-\\ufe0f\\u200c\\u200d\\u200e\\u200f\\u2066-\\u2069]/.test(ch)){if(u.length)u[u.length-1]+=ch;else pending+=ch;}else if(u.length&&u[u.length-1].charAt(u[u.length-1].length-1)==='\\u200d')u[u.length-1]+=ch;else{u.push(pending+ch);pending='';}}for(i=0;i<u.length;i++){var v=1+"+variance+"*((i*17+13)%11)/10;if(/[.,;:!?،؛؟]/.test(u[i]))v+="+pause+";sum+=v;w.push(sum);}if(u.length>1)sum=w[u.length-2];function mt(n,f){for(var k=1;k<=marker.numKeys;k++)if(marker.key(k).comment==n)return marker.key(k).time;return f;}var a=inPoint+"+off+",b=Math.max(a+.001,mt('IN',Math.min(outPoint,a+"+dur+"))),q=Math.max(0,Math.min(1,(time-a)/(b-a))),n=0;if(time>=a&&u.length){n=1;while(n<u.length&&w[n-1]/Math.max(.001,sum)<=q)n++;}var out='';"+(direction==='reverse'?"for(i=Math.max(0,u.length-n);i<u.length;i++)out+=u[i];":"for(i=0;i<n;i++)out+=u[i];")+"out;";
};
GHAFHost._removeTextSolidOpacity=function(text){try{var group=text.property('ADBE Text Properties').property('ADBE Text Animators');for(var i=group.numProperties;i>=1;i--)if(group.property(i).name==='VARNA · Text Solid Opacity')group.property(i).remove();}catch(e){}};
GHAFHost._setTextSolidOpacity=function(text,opacity){
 GHAFHost._removeTextSolidOpacity(text);var group=text.property('ADBE Text Properties').property('ADBE Text Animators'),anim=group.addProperty('ADBE Text Animator');anim.name='VARNA · Text Solid Opacity';anim.property('ADBE Text Animator Properties').addProperty('ADBE Text Opacity').setValue(Math.max(0,Math.min(100,Number(opacity))));
 var range=anim.property('ADBE Text Selectors').addProperty('ADBE Text Selector');range.property('ADBE Text Percent Start').setValue(0);range.property('ADBE Text Percent End').setValue(100);
};
GHAFHost._ensureScriptTool=function(tool){
 if(GHAFHost._scriptUIs[tool])return GHAFHost._scriptUIs[tool];
 var result=GHAFJSON.parse(GHAFHost.initScriptTool(encodeURIComponent(GHAFJSON.stringify({tool:tool}))));if(!result.ok)throw Error(result.error);return GHAFHost._scriptUIs[tool];
};
GHAFHost._scriptControl=function(root,path){var c=root;for(var i=0;i<path.length;i++)c=c.children[path[i]];return c;};
GHAFHost._originalScriptButton=function(tool,pattern){
 var root=GHAFHost._ensureScriptTool(tool),controls=GHAFHost._scriptUITree(tool,root).controls,icons=[];
 for(var i=0;i<controls.length;i++){var p=controls[i];if(p.type==='iconbutton')icons.push(p);if((p.type==='button'||p.type==='iconbutton')&&pattern.test(p.label+' '+p.text))return GHAFHost._scriptControl(root,p.path);}
 var candidates=[];for(i=0;i<controls.length;i++){var row=controls[i];if((row.type==='button'||row.type==='iconbutton')&&pattern.test(row.context||''))candidates.push(row);}if(candidates.length===1)return GHAFHost._scriptControl(root,candidates[0].path);if(tool==='glassary'&&icons.length===6)return GHAFHost._scriptControl(root,icons[5].path);
 throw Error('فرمان اصلی '+tool+' در پنل پیدا نشد؛ از تنظیمات کامل ابزار استفاده کن.');
};
GHAFHost._convertGlassaryShape=function(shape){
 var c=shape.containingComp,selected=c.selectedLayers||[],oldName=shape.name,locked=shape.locked;GHAFHost._repairGlassaryName(shape);
 try{for(var i=0;i<selected.length;i++)selected[i].selected=false;shape.locked=false;shape.selected=true;
  var beforeGlassary=GHAFHost._layerSet(c);var command=GHAFHost._originalScriptButton('glassary',/apply.*(shape|select)|selected.*shape|اعمال به Shape/i);command.notify('onClick');var createdGlassary=GHAFHost._newLayers(c,beforeGlassary),owner=shape.parent&&String(shape.name).indexOf(GHAFHost._nativeBgPrefix)===0?shape.parent.name:shape.name;for(var gi=0;gi<createdGlassary.length;gi++)createdGlassary[gi].comment=String(createdGlassary[gi].comment||'')+'\nVARNA_VENDOR_OWNER:'+owner;
  var root=GHAFHost._scriptUIs.glassary;if(root)root.hide();var fx=shape.property('ADBE Effect Parade'),match=GHAFHost._vendorMatch('glassary'),effect=null;
  for(i=1;i<=fx.numProperties;i++)if(fx.property(i).matchName===match||String(fx.property(i).name)==='Glassary')effect=fx.property(i);
  if(!effect)throw Error('فرمان Glassary اجرا شد، اما افکت روی Shape دنبال‌کننده ساخته نشد.');shape.name=oldName;return effect;
 }finally{try{shape.selected=false;shape.locked=locked;}catch(e){}for(var j=0;j<selected.length;j++)try{selected[j].selected=true;}catch(ignore){} }
};
GHAFHost.applyGlassarySelection=function(){
 var c=GHAFHost._activeComp();if(!c)return GHAFHost._err('NO_COMP');var selection=c.selectedLayers||[],shapes=[];
 for(var i=0;i<selection.length;i++){var l=selection[i],shape=l.matchName==='ADBE Vector Layer'?l:GHAFHost._nativeBgFor(l);if(shape)shapes.push(shape);}
 if(!shapes.length)return GHAFHost._err('یک Shape یا متن دارای بک‌گراند را در AE انتخاب کن.');
 app.beginUndoGroup('Varna · Glassary selected shapes');try{for(i=0;i<shapes.length;i++){var effect=GHAFHost._convertGlassaryShape(shapes[i]);shapes[i].comment=String(shapes[i].comment||'')+'\nVARNA_GLASSARY_MANAGED';}return GHAFHost._ok({updated:shapes.length});}catch(e){return GHAFHost._err(String(e));}finally{app.endUndoGroup();}
};
GHAFHost._chooseScriptOption=function(tool,pattern,choice){
 var root=GHAFHost._ensureScriptTool(tool),rows=GHAFHost._scriptUITree(tool,root).controls;
 for(var i=0;i<rows.length;i++){var p=rows[i],control=GHAFHost._scriptControl(root,p.path);
  if(p.items){for(var j=0;j<p.items.length;j++)if(pattern.test(p.items[j])){control.selection=j;control.notify('onChange');return true;}}
  if(pattern.test(p.label+' '+p.text)&&(p.type==='checkbox'||p.type==='radiobutton')){control.value=!!choice;control.notify('onClick');return true;}
 }return false;
};
GHAFHost.scriptToolPreset=function(encoded){
 var p=GHAFHost._parse(encoded),tool=p.tool,c=GHAFHost._activeComp();if(!c)return GHAFHost._err('NO_COMP');if(tool!=='writetyper'&&tool!=='cuttana')return GHAFHost._err('Unknown script');
 try{
  var selection=c.selectedLayers||[];if((tool==='writetyper'||p.preset==='automatic')&&(selection.length!==1||selection[0].matchName!=='ADBE Text Layer'))throw Error('یک لایهٔ متن را در تایم‌لاین AE انتخاب کن.');
  var before=GHAFHost._layerSet(c),clip={start:selection.length?selection[0].inPoint:0,end:selection.length?selection[0].outPoint:c.duration},directionApplied=false;
  var root=GHAFHost._ensureScriptTool(tool),pattern;
  if(tool==='writetyper'){
   if(!GHAFHost._chooseScriptOption(tool,p.rig==='dynamic'?/\bdynamic\b/i:/\bstable\b/i,true))throw Error('گزینهٔ '+(p.rig==='dynamic'?'Dynamic':'Stable')+' در پنل اصلی پیدا نشد.');
   pattern=/create.*(rig|typ)|apply.*(rig|typ)|make.*rig|ساخت تایپ/i;
  }else{
   var patterns={automatic:/full\s*auto(?:matic)?|fully\s*automatic/i,writeon:/make animations?|create animations?/i,trail:/animated trail|create.*trail|\btrail\b/i};pattern=patterns[p.preset];if(!pattern)throw Error('Unknown Cuttana preset');
   if(p.direction==='rtl')directionApplied=GHAFHost._chooseScriptOption(tool,/right.?to.?left|\brtl\b/i,true);else if(p.direction==='ltr')directionApplied=GHAFHost._chooseScriptOption(tool,/left.?to.?right|\bltr\b/i,true);
  }
  var button;if(p.path){button=GHAFHost._scriptControl(root,p.path);if(!button||!/^button$|^iconbutton$/.test(String(button.type)))throw Error('فرمان انتخابی معتبر نیست.');}else button=GHAFHost._originalScriptButton(tool,pattern);if(button.enabled===false)throw Error('فرمان اصلی غیرفعال است؛ لایهٔ متن را در AE انتخاب کن.');button.notify('onClick');root.hide();if(tool==='cuttana'&&!directionApplied)directionApplied=GHAFHost._orderNewWriteOnLayers(c,before,p.direction,clip);return GHAFHost._ok({tool:tool,preset:p.preset||p.rig,directionApplied:tool==='cuttana'?directionApplied:null});
 }catch(e){return GHAFHost._err(String(e));}
};
GHAFHost.activateVarnaWorkspace=function(encoded){
 var p=GHAFHost._parse(encoded),profile=String(p.profile||''),names={text:'Varna - Text',motion:'Varna - Motion',edit:'Varna - Edit'};if(!names[profile])return GHAFHost._err('Unknown workflow');
 var name=String(p.name||names[profile]);if(name.length>120||/[\r\n]/.test(name))return GHAFHost._err('Invalid workspace name');
 try{var command=app.findMenuCommandId(name),switched=false;if(command>0){app.executeCommand(command);switched=true;}var c=GHAFHost._activeComp();if(c&&profile!=='text')c.openInViewer();return GHAFHost._ok({profile:profile,name:name,switched:switched});}catch(e){return GHAFHost._err(String(e));}
};
GHAFHost.expressionIssues=function(){
 var c=GHAFHost._activeComp(),issues=[];if(!c)return GHAFHost._err('NO_COMP');
 function scan(group,layer,depth){if(!group||depth>12||issues.length>=25)return;for(var i=1;i<=group.numProperties;i++){var p=group.property(i);if(p.numProperties)scan(p,layer,depth+1);else try{if(p.canSetExpression&&p.expressionEnabled){p.valueAtTime(c.time,false);if(p.expressionError)issues.push({layer:layer.name,property:p.name,error:String(p.expressionError)});}}catch(e){issues.push({layer:layer.name,property:p.name,error:String(e)});}}}
 for(var j=1;j<=c.numLayers;j++)scan(c.layer(j),c.layer(j),0);return GHAFHost._ok({issues:issues});
};
GHAFHost.applyVendorValues=function(encoded){
 var p=GHAFHost._parse(encoded),c=GHAFHost._activeComp();if(!c)return GHAFHost._err('NO_COMP');app.beginUndoGroup('Varna material');try{var l=GHAFHost._vendorTarget(c,p.target==='background'?'background':'text'),locked=l.locked;l.locked=false;try{GHAFHost._applyPersistedVendorEffects(l,[{effect:p.effect,parameters:p.parameters||[]}]);}finally{l.locked=locked;}return GHAFHost._ok({layer:l.name});}catch(e){return GHAFHost._err(String(e));}finally{app.endUndoGroup();}
};
GHAFHost.applyTextGlassSelection=function(encoded){
 var p=GHAFHost._parse(encoded),c=GHAFHost._activeComp();if(!c)return GHAFHost._err('NO_COMP');app.beginUndoGroup('Varna glass text');try{var text=GHAFHost._vendorTarget(c,'text');for(var i=c.numLayers;i>=1;i--)if(c.layer(i).name===GHAFHost._nativeBgPrefix+'AE_TEXT_'+text.name){var l=c.layer(i);l.locked=false;l.remove();}text.enabled=true;GHAFHost._removeTextSolidOpacity(text);if(p.removeCosmic)GHAFHost._removeNamedEffect(text,'VARNA · Cosmic');if(p.enabled)GHAFHost._applyAEGlassText(text,{aeGlass:p.aeGlass||{}},{textSolidOpacity:p.opacity,textAEGlass:p.aeGlass||{}});return GHAFHost._ok({layer:text.name});}catch(e){return GHAFHost._err(String(e));}finally{app.endUndoGroup();}
};
GHAFHost._orderNewWriteOnLayers=function(c,before,direction,clip){
 var created=GHAFHost._newLayers(c,before),rows=[],slots=[];
 function onset(group,depth,min){if(!group||depth>12)return min;for(var j=1;j<=group.numProperties;j++){var p=group.property(j);if(p.numProperties)min=onset(p,depth+1,min);else try{if(p.numKeys>1)min=Math.min(min,p.keyTime(1));}catch(e){}}return min;}
 for(var i=0;i<created.length;i++){var l=created[i];if(l.matchName!=='ADBE Vector Layer'||l.guideLayer)continue;try{var tr=l.property('ADBE Transform Group'),position=tr.property('ADBE Position').value,scale=tr.property('ADBE Scale').value,anchor=tr.property('ADBE Anchor Point').value,r=l.sourceRectAtTime(Math.max(l.inPoint,l.outPoint-.001),false),time=onset(l,0,Infinity);if(!isFinite(time))continue;rows.push({layer:l,x:position[0]+(r.left+r.width/2-anchor[0])*scale[0]/100,time:time});slots.push(time);}catch(eBounds){}}
 if(rows.length<2)return false;slots.sort(function(a,b){return a-b;});if(slots[slots.length-1]-slots[0]<.001)return false;
 rows.sort(function(a,b){return direction==='rtl'?b.x-a.x:a.x-b.x;});
 for(i=0;i<rows.length;i++){l=rows[i].layer;var delta=slots[i]-rows[i].time,start=l.startTime,ip=l.inPoint,op=l.outPoint;var ni=Math.max(clip.start,ip+delta),no=Math.min(clip.end,op+delta);if(no<=ni)continue;l.startTime=start+delta;l.inPoint=ni;l.outPoint=no;}
 return true;
};

GHAFHost.scriptToolCommands=function(encoded){var p=GHAFHost._parse(encoded);try{var root=GHAFHost._ensureScriptTool(p.tool),rows=GHAFHost._scriptUITree(p.tool,root).controls,commands=[];for(var i=0;i<rows.length;i++){var r=rows[i];if(r.type==='button'||r.type==='iconbutton')commands.push({path:r.path,label:(r.context?r.context+' · ':'')+(r.label||r.text),enabled:r.enabled});}return GHAFHost._ok({commands:commands});}catch(e){return GHAFHost._err(String(e));}};

GHAFHost._defaultTextGlass=function(){return {lightAngle:45,lightIntensity:100,refraction:100,depth:70,dispersion:50,frost:0,splay:0,magnify:0,effectScale:2,rimScale:.5};};
/* Owned helper layers preserve one background geometry, with separate color and optical passes. */
GHAFHost._prepareTypingBounds=function(text,g,bg){
 if(bg._typingExpand)delete bg._typingExpand;if(!bg.enabled||String((g.anim||{}).preset)!=='typewriter')return null;
 var measure={off:Math.max(0,Number(g.anim.startOffset)||0),grow:bg.followTyping!==false,name:text.name};
 if(measure.grow){bg._typingExpand=true;return measure;}
 var full=text.duplicate();full.name='__GHAF_TYPE_MEASURE__'+text.name;full.comment='VARNA_TYPE_MEASUREMENT';full.enabled=false;full.guideLayer=true;full.shy=true;full.locked=false;
 var source=full.property('ADBE Text Properties').property('ADBE Text Document');source.expression='';while(source.numKeys>0)source.removeKey(1);GHAFHost._clearAnimators(full);measure.name=full.name;full.locked=true;return measure;
};
GHAFHost._typingBoundsExpression=function(expr,measure){
 var pattern=/((?:thisLayer\.)?parent|t)\.sourceRectAtTime\(time,\s*false\)/g;if(!pattern.test(expr)||expr.indexOf('function varnaRect(')>=0)return expr;
 var fn=measure.grow?'function varnaRect(t){var a=t.sourceRectAtTime(time,false);if(time<=t.inPoint+'+measure.off+')return a;var s=[a,t.sourceRectAtTime(Math.max(t.inPoint+'+measure.off+',time-.025),false),t.sourceRectAtTime(Math.max(t.inPoint+'+measure.off+',time-.05),false)];var r={left:0,top:0,width:0,height:0};for(var j=0;j<3;j++){r.left+=s[j].left/3;r.top+=s[j].top/3;r.width+=s[j].width/3;r.height+=s[j].height/3;}return r;}': 'function varnaRect(t){return thisComp.layer('+GHAFJSON.stringify(measure.name)+').sourceRectAtTime(time,false);}';
 return fn+'\n'+expr.replace(pattern,'varnaRect($1)');
};
GHAFHost._linkTypingBounds=function(text,measure){
 if(!measure)return;var c=text.containingComp;
 function scan(group,depth){if(!group||depth>12)return;for(var j=1;j<=group.numProperties;j++){var prop=group.property(j);if(prop.numProperties)scan(prop,depth+1);else if(prop.canSetExpression&&prop.expression&&String(prop.expression).indexOf('Glassary')<0)prop.expression=GHAFHost._typingBoundsExpression(prop.expression,measure);}}
 for(var i=1;i<=c.numLayers;i++){var l=c.layer(i),nm=String(l.name||'');if((l.parent===text&&nm.indexOf(GHAFHost._nativeBgPrefix)===0&&nm.indexOf(GHAFHost._nativeBgPrefix+'AE_TEXT_')!==0)||nm===GHAFHost._glassBlurName(text)||nm===GHAFHost._glassBlurName(text)+'_EDGE'){
 var locked=l.locked;l.locked=false;scan(l,0);
 // Layer-name lookup also works for the unparented, comp-sized optical blur pass.
 if(measure.grow&&nm.indexOf(GHAFHost._nativeBgPrefix+'COSMIC_COLOR_')!==0)l.property('ADBE Transform Group').property('ADBE Opacity').expression='time < thisComp.layer('+GHAFJSON.stringify(text.name)+').inPoint+'+measure.off+' ? 0 : 100';l.locked=locked;
 }}
};
GHAFHost._vendorPassFill=function(shape,opacity){var root=shape.property('ADBE Root Vectors Group');function scan(g,d){if(!g||d>8)return;for(var i=1;i<=g.numProperties;i++){var p=g.property(i);if(p.matchName==='ADBE Vector Graphic - Fill')p.property('ADBE Vector Fill Opacity').setValue(opacity);else if(p.numProperties)scan(p,d+1);}}scan(root,0);};
GHAFHost._applyBgVendorEffects=function(text,bg){
 if(!bg||!bg.enabled||!(bg.vendorEffects||[]).length)return;var shape=GHAFHost._nativeBgFor(text);if(!shape)throw Error('افکت بک‌گراند به Shape نیاز دارد.');
 if(bg.vendorMode!=='combined'){var locked=shape.locked;shape.locked=false;try{GHAFHost._syncPersistedVendorEffects(shape,bg.vendorEffects);}finally{shape.locked=locked;}return;}
 for(var i=0;i<bg.vendorEffects.length;i++){var item=bg.vendorEffects[i],glass=item.effect==='glassary',pass=GHAFHost._glassHelper(text,bg,glass?'VENDOR_OPTICS':'COSMIC_COLOR',true);if(!pass)throw Error('ساخت لایهٔ ترکیبی ناموفق بود.');pass.name=GHAFHost._nativeBgPrefix+(glass?'VENDOR_OPTICS_':'COSMIC_COLOR_')+text.name;pass.comment='VARNA_MATERIAL_PASS';pass.locked=false;
 GHAFHost._vendorPassFill(pass,100);GHAFHost._syncPersistedVendorEffects(pass,[item]);
 var tr=pass.property('ADBE Transform Group');if(glass){pass.moveAfter(text);tr.property('ADBE Opacity').expression='100';}else{pass.moveAfter(shape);var alpha=Math.max(0,Math.min(100,Number(bg.vendorBlendOpacity==null?70:bg.vendorBlendOpacity)));tr.property('ADBE Opacity').expression='thisComp.layer('+GHAFJSON.stringify(shape.name)+').transform.opacity*'+alpha+'/100';}pass.locked=true;
 }
};
/* Clear only active transform channels. Hidden 3D/follower properties can reject even an empty expression. */
GHAFHost._clearTransformExpressions46=function(layer){
 var tr=layer.property('ADBE Transform Group');if(!tr||typeof tr.property!=='function')return;
 function clear(p){if(p&&p.canSetExpression!==false&&p.expression)p.expression='';}
 var names=['ADBE Anchor Point','ADBE Scale','ADBE Rotate Z','ADBE Opacity'],i,position=tr.property('ADBE Position');
 if(layer.threeDLayer){names.push('ADBE Orientation');names.push('ADBE Rotate X');names.push('ADBE Rotate Y');}
 for(i=0;i<names.length;i++)clear(tr.property(names[i]));
 if(position&&position.dimensionsSeparated&&typeof position.getSeparationFollower==='function'){
  for(i=0;i<(layer.threeDLayer?3:2);i++)clear(position.getSeparationFollower(i));
 }else clear(position);
};
GHAFHost._resetCaptionMotion=function(layer,g){
 var c=layer.containingComp;for(var i=c.numLayers;i>=1;i--)if(String(c.layer(i).name).indexOf('GHAF_TYPE_CLICK_'+String(g.id)+'_')===0){var click=c.layer(i);click.locked=false;click.remove();}
 var source=layer.property('ADBE Text Properties').property('ADBE Text Document');source.expression='';GHAFHost._clearAnimators(layer);GHAFHost._clearTransformKeys(layer);GHAFHost._clearTransformExpressions46(layer);
};

/* Incremental, transactional live preview. Unchanged groups keep their actual layer identities. */
GHAFHost._livePreviewRecords=GHAFHost._livePreviewRecords||{};
GHAFHost.updateLivePreview=function(encoded){
 var p=GHAFHost._parse(encoded),c=GHAFHost._outputComp36(p);if(!c)return GHAFHost._err('NO_COMP');if(p.compId!=null&&c.id!==Number(p.compId))return GHAFHost._err('Composition changed; previous preview preserved.');
 var groups=p.groups||[],old=GHAFHost._layerSet(c),previous=GHAFHost._previewLayers(c),records=GHAFHost._livePreviewRecords[String(c.id)]||[],next=[],keep=[],reused=0,changed=0,stamp=String(new Date().getTime());if(!groups.length&&p.group)groups=[p.group];
 function present(layer){for(var i=0;i<old.length;i++)if(old[i]===layer)return true;return false;}
 function retained(layer){for(var i=0;i<keep.length;i++)if(keep[i]===layer)return true;return false;}
 app.beginUndoGroup('Varna Preview');try{
  for(var i=0;i<groups.length;i++){var g=groups[i];g.anim=g.anim||{};g.anim.typeSound=false;var key=String(g.id==null?i:g.id),signature=GHAFJSON.stringify(g),record=null;
   for(var j=0;j<records.length;j++)if(records[j].key===key&&records[j].signature===signature){var valid=records[j].layers.length>0;for(var k=0;k<records[j].layers.length;k++)if(!present(records[j].layers[k]))valid=false;if(valid)record=records[j];break;}
   if(record){reused++;next.push(record);for(j=0;j<record.layers.length;j++)keep.push(record.layers[j]);continue;}
   var before=GHAFHost._layerSet(c);GHAFHost._createCaption(c,g,'__VARNA_LIVE_CAP_'+stamp+'_'+i);var fresh=GHAFHost._newLayers(c,before);
   for(j=0;j<fresh.length;j++){var layer=fresh[j];layer.locked=false;layer.enabled=true;layer.guideLayer=true;layer.shy=true;layer.comment=String(layer.comment||'')+'\nVARNA_LIVE_OWNER';keep.push(layer);}
   next.push({key:key,signature:signature,layers:fresh});changed++;
  }
  var stale=[];for(i=0;i<previous.length;i++)if(!retained(previous[i]))stale.push(previous[i]);GHAFHost._deleteLayers(stale);GHAFHost._livePreviewRecords[String(c.id)]=next;if(p.seekPreview45===true&&groups.length){var focus=groups[0],st=Math.max(0,Number(focus.start)||0),en=Math.min(c.duration,Number(focus.end)||st+c.frameDuration);c.time=Math.max(0,Math.min(c.duration-c.frameDuration,st+Math.min(.6,Math.max(c.frameDuration,(en-st)*.55))));}if(p.focusViewer!==false)c.openInViewer();return GHAFHost._ok({created:groups.length,changed:changed,reused:reused,followTimeline:true,compId:c.id});
 }catch(e){GHAFHost._deleteLayers(GHAFHost._newLayers(c,old));return GHAFHost._err(String(e));}finally{app.endUndoGroup();}
};

(function(){var base=GHAFHost._removeNativeBg;GHAFHost._removeNativeBg=function(layer){var c=layer.containingComp,owned=[],tag='VARNA_VENDOR_OWNER:'+layer.name;for(var i=1;i<=c.numLayers;i++){var l=c.layer(i),lines=String(l.comment||'').split(/\r?\n/);for(var j=0;j<lines.length;j++)if(lines[j]===tag){owned.push(l);break;}}GHAFHost._deleteLayers(owned);return base(layer);};})();

GHAFHost._safeLayers=function(c){var out=[];for(var i=1;i<=c.numLayers;i++){var l=c.layer(i),n=String(l.name||'');if(n==='__GHAF_SAFE_ZONE__'||n.indexOf('__GHAF_SAFE_OVERLAY_')===0||n==='__VARNA_SOCIAL_GUIDE__')out.push(l);}return out;};
GHAFHost.createSafeZone=function(encoded){
 var p=GHAFHost._parse(encoded),c=GHAFHost._activeComp();if(!c)return GHAFHost._err('NO_COMP');if(!p.preset||!(p.preset.customPaths||[]).length)return GHAFHost._err('PRESET_GEOMETRY_MISSING');
 var old=GHAFHost._layerSet(c),previous=GHAFHost._safeLayers(c),saved=[],width=c.width,height=c.height,guide=null,item=null,imported=false;
 app.beginUndoGroup('Varna Social Safe Zone');try{
  if(p.socialGuidePath){guide=new File(p.socialGuidePath);if(!guide.exists)throw Error('تصویر راهنما پیدا نشد؛ دوباره از پنل اعمال کن.');}
  if(p.resize){c.width=Math.round(Number(p.preset.width));c.height=Math.round(Number(p.preset.height));}else if(Math.abs((c.width/c.height)/(p.preset.width/p.preset.height)-1)>.05)throw Error('نسبت سیف‌زون با Composition متفاوت است؛ فرمت مناسب را انتخاب کن یا تغییر ابعاد Composition را روشن کن.');
  for(var i=0;i<previous.length;i++){saved.push({layer:previous[i],name:previous[i].name,locked:previous[i].locked});previous[i].locked=false;previous[i].name='__VARNA_OLD_SAFE_'+String(new Date().getTime())+'_'+i;}
  var options={};for(var key in p)options[key]=p[key];if(guide){options.showChrome=false;options.overlayOpacity=0;}
  var zone=GHAFHost._applyPresetSafeZone(c,options);zone.enabled=p.visible!==false;
  if(guide){item=GHAFHost._findFootageByFile(guide.fsName);if(!item){item=app.project.importFile(new ImportOptions(guide));imported=true;}var layer=c.layers.add(item);layer.name='__VARNA_SOCIAL_GUIDE__';layer.comment='VARNA_SOCIAL_GUIDE:'+p.preset.key;layer.guideLayer=p.guideLayer!==false;layer.inPoint=0;layer.outPoint=c.duration;layer.enabled=p.visible!==false;var tr=layer.property('ADBE Transform Group');tr.property('ADBE Position').setValue([c.width/2,c.height/2]);tr.property('ADBE Scale').setValue([c.width/item.width*100,c.height/item.height*100]);tr.property('ADBE Opacity').setValue(100);layer.moveToBeginning();layer.locked=!!p.lockLayer;}
  GHAFHost._deleteLayers(previous);c.openInViewer();return GHAFHost._ok({name:p.preset.name,key:p.preset.key,width:c.width,height:c.height,layer:zone.name,socialGuide:!!guide});
 }catch(e){GHAFHost._deleteLayers(GHAFHost._newLayers(c,old));for(var j=0;j<saved.length;j++)try{saved[j].layer.locked=false;saved[j].layer.name=saved[j].name;saved[j].layer.locked=saved[j].locked;}catch(ignore){}c.width=width;c.height=height;try{if(imported&&item.usedIn.length===0)item.remove();}catch(eCleanup){}return GHAFHost._err(String(e));}finally{app.endUndoGroup();}
};
GHAFHost.removeSafeZone=function(){var c=GHAFHost._activeComp();if(!c)return GHAFHost._ok({removed:0});var list=GHAFHost._safeLayers(c);GHAFHost._deleteLayers(list);return GHAFHost._ok({removed:list.length});};
GHAFHost.setSafeZoneVisible=function(encoded){var p=GHAFHost._parse(encoded),c=GHAFHost._activeComp();if(!c)return GHAFHost._err('NO_COMP');try{var list=GHAFHost._safeLayers(c);for(var i=0;i<list.length;i++){var locked=list[i].locked;list[i].locked=false;list[i].enabled=p.visible!==false;list[i].locked=locked;}return GHAFHost._ok({visible:p.visible!==false});}catch(e){return GHAFHost._err(String(e));}};

GHAFHost._bridgeRevision='rc47.2';GHAFHost._tableRevision=1;

/* RC27: explicit ownership, exact guide geometry, independent surfaces, portable brand assets. */
GHAFHost._typingExpression=function(a){
 a=a||{};var off=Math.max(0,Number(a.startOffset)||0),dur=Math.max(.03,Number(a.inDur)||.42),variance=Math.max(0,Math.min(1,Number(a.typingVariance)||0)),pause=Math.max(0,Math.min(5,Number(a.typingPause)||0));
 return "var s=(value.text!==undefined?value.text:value.toString()),u=[],w=[],sum=0,pending='';for(var i=0;i<s.length;i++){var ch=s.charAt(i),n=s.charCodeAt(i);if(n>=55296&&n<=56319&&i+1<s.length)ch+=s.charAt(++i);if(/[\\u0300-\\u036f\\u064b-\\u065f\\u0670\\ufe00-\\ufe0f\\u200c\\u200d\\u200e\\u200f\\u2066-\\u2069]/.test(ch)){if(u.length)u[u.length-1]+=ch;else pending+=ch;}else if(u.length&&u[u.length-1].charAt(u[u.length-1].length-1)==='\\u200d')u[u.length-1]+=ch;else{u.push(pending+ch);pending='';}}for(i=0;i<u.length;i++){sum+=1+"+variance+"*((i*17+13)%11)/10+(/[.,;:!?،؛؟]/.test(u[i])?"+pause+":0);w.push(sum);}function mt(n,f){try{for(var k=1;k<=thisLayer.marker.numKeys;k++)if(thisLayer.marker.key(k).comment===n)return thisLayer.marker.key(k).time;}catch(e){}return f;}var a=Math.min(outPoint-.001,inPoint+"+off+"),b=Math.min(outPoint,Math.max(a+.001,mt('IN',a+"+dur+"))),q=Math.max(0,Math.min(1,(time-a)/(b-a))),n=0;if(time>=b)n=u.length;else if(time>=a&&u.length){n=1;var total=w[Math.max(0,u.length-2)]||1;while(n<u.length&&w[n-1]/total<=q)n++;}var out='';"+(a.typingDirection==='reverse'?"for(i=Math.max(0,u.length-n);i<u.length;i++)out+=u[i];":"for(i=0;i<n;i++)out+=u[i];")+"out;";
};
GHAFHost._applyTypewriter=function(layer,g,a){
 var source=layer.property('ADBE Text Properties').property('ADBE Text Document');GHAFHost._clearAnimators(layer);source.expression=GHAFHost._typingExpression(a);source.expressionEnabled=true;
 source.valueAtTime(Math.min(layer.outPoint-.001,layer.inPoint+.05),false);if(source.expressionError)throw Error('TYPEWRITER_EXPRESSION: '+source.expressionError);
 GHAFHost._applyTypingClicks(layer,g,a);return true;
};
GHAFHost.applyTypingSelection=function(encoded){
 var p=GHAFHost._parse(encoded),c=GHAFHost._activeComp();if(!c)return GHAFHost._err('NO_COMP');var selected=c.selectedLayers||[],texts=[];for(var i=0;i<selected.length;i++)if(selected[i].matchName==='ADBE Text Layer')texts.push(selected[i]);if(!texts.length)return GHAFHost._err('یک یا چند Text Layer را در AE انتخاب کن.');
 function clearMeasurement(text){for(var mi=c.numLayers;mi>=1;mi--){var measured=c.layer(mi);if(measured.name==='__GHAF_TYPE_MEASURE__'+text.name&&String(measured.comment||'')==='VARNA_TYPE_MEASUREMENT'){measured.locked=false;measured.remove();}}}
 app.beginUndoGroup('Varna Typewriter');try{for(i=0;i<texts.length;i++){
  var l=texts[i],a=p.anim||{},src=l.property('ADBE Text Properties').property('ADBE Text Document'),g={id:'selected_'+l.index,text:String(src.valueAtTime(l.outPoint-.001,true).text),start:l.inPoint,end:l.outPoint,anim:a,bg:p.bg||{}};
  GHAFHost._resetCaptionMotion(l,g);GHAFHost._addAnimMarkers(l,g,a);if(a.typingEnabled!==false)GHAFHost._applyTypewriter(l,g,a);if(a.outPreset)GHAFHost._applyOutro(l,g,a);
  // An explicit disabled background must remove the previous owned result too.
  if(p.bg){
   GHAFHost._removeNativeBg(l);
   clearMeasurement(l);
   var m=GHAFHost._prepareTypingBounds(l,g,g.bg);if(!GHAFHost._applyBg(l,g.bg)){clearMeasurement(l);throw Error('BACKGROUND_APPLY_FAILED');}
   GHAFHost._applyBgVendorEffects(l,g.bg);GHAFHost._linkTypingBounds(l,m);GHAFHost._finalizeBackground27(l,g.bg,g);
  }
 }return GHAFHost._ok({updated:texts.length});}catch(e){return GHAFHost._err(String(e));}finally{app.endUndoGroup();}
};
/* Circular radius reaches exactly half the shorter edge. Continuous corners remain an option. */
GHAFHost._continuousShape=function(vec,pad,round,mode){
 var prop=vec.addProperty('ADBE Vector Shape - Group');prop.name='VARNA '+(mode==='continuous'?'Continuous':'Circular')+' Corner';
 prop.property('ADBE Vector Shape').expression='var r=thisLayer.parent.sourceRectAtTime(time,false),p='+Number(pad)+',q='+Number(round)+';var a=r.left-p,b=r.top-p,w=Math.max(2,r.width+2*p),h=Math.max(2,r.height+2*p),x=a+w,y=b+h,d=Math.max(0,Math.min(q,w/2,h/2)),k=d*'+(mode==='continuous'?'.76':'.5522847498307936')+';createPath([[a+d,b],[x-d,b],[x,b+d],[x,y-d],[x-d,y],[a+d,y],[a,y-d],[a,b+d]],[[-k,0],[0,0],[0,-k],[0,0],[k,0],[0,0],[0,k],[0,0]],[[0,0],[k,0],[0,0],[0,k],[0,0],[-k,0],[0,0],[0,-k]],true);';return prop;
};
GHAFHost._backgroundMotion27=function(shape,bg){
 if(!shape||!shape.parent)return;var tr=shape.property('ADBE Transform Group'),mot=String(bg.motion||'none'),out=String(bg.outPreset||'none'),dur=Math.max(.03,Number(bg.motionDur)||.28),od=Math.max(0,Number(bg.outDur)||0),delay=Math.max(0,Number(bg.motionDelay)||0),ind=bg.independentMotion!==false;
 var pre="var ls=parent.inPoint,le=Math.max(ls+.001,parent.outPoint),a=Math.min(le-.001,ls+"+delay+"),b=Math.min(le,a+"+dur+");function mt(n,f){try{for(var j=1;j<=parent.marker.numKeys;j++)if(parent.marker.key(j).comment===n)return parent.marker.key(j).time;}catch(e){}return f;}"+(ind?'':"b=Math.min(le,Math.max(a+.001,mt('IN',b)));" )+"var qi="+(mot==='none'?'1':'ease(time,a,Math.max(a+.001,b),0,1)')+",os=Math.max(b,le-"+od+");"+(ind?'':"os=Math.max(b,Math.min(le-.001,mt('OUT',os)));" )+"var qo="+(od>0&&out!=='none'?'ease(time,os,le,0,1)':'0')+";var t=Math.max(0,time-b);";
 var opacity=tr.property('ADBE Opacity'),scale=tr.property('ADBE Scale'),position=tr.property('ADBE Position');
 for(var k=1;k<=tr.numProperties;k++){var p=tr.property(k);if(p.matchName==='ADBE Opacity'||p.matchName==='ADBE Scale'||p.matchName==='ADBE Position'){while(p.numKeys>0)p.removeKey(1);p.expression='';}}
 opacity.setValue(100);opacity.expression=pre+'(time<ls||time>=le)?0:value*qi*(1-qo);';
 var sx=100,sy=100,dx=0,dy=0;if(mot==='pop')sx=sy=90;if(mot==='softScale')sx=sy=96;if(mot==='reveal')sx=18;if(mot==='centerReveal')sx=0;if(mot==='slide')dy=22;if(mot==='glide'||mot==='float')dy=14;
 var ox=out==='splitClose'?0:out==='scaleOut'?92:100,oy=out==='scaleOut'?92:100,odx=out==='slideLeftOut'?-24:out==='slideRightOut'?24:0,ody=out==='slideDown'?18:0;
 var wave=mot==='orbPulse'?'1+.025*Math.sin(t*5)*qi':mot==='glassWave'?'1+.012*Math.sin(t*3)*qi':mot==='breathe'?'1+.015*Math.sin(t*2)*qi':'1';
 scale.setValue([100,100]);scale.expression=pre+'var k='+wave+';[('+sx+'*(1-qi)+100*qi)*(1-qo)*k+'+ox+'*qo,('+sy+'*(1-qi)+100*qi)*(1-qo)*k+'+oy+'*qo];';
 var drift=mot==='cosmicFloat'?'[Math.sin(t*1.8)*4*qi,Math.cos(t*1.4)*3*qi]':mot==='float'?'[0,-3*Math.sin(t*2)*qi]':'[0,0]';
 position.expression=pre+'var v=value,d='+drift+';[v[0]+'+dx+'*(1-qi)+'+odx+'*qo+d[0],v[1]+'+dy+'*(1-qi)+'+ody+'*qo+d[1]];';
};
GHAFHost._bgOwned27=function(l,text){return String(l.comment||'').indexOf('VARNA_BG_OWNER:'+text.name+'\n')>=0||String(l.comment||'')==='VARNA_BG_ANCHOR:'+text.name;};
(function(){var originalNativeBgFor=GHAFHost._nativeBgFor,remove=GHAFHost._removeNativeBg,apply=GHAFHost._applyBg;
 GHAFHost._nativeBgFor=function(text){var found=originalNativeBgFor(text);if(found)return found;var c=text.containingComp;for(var i=1;i<=c.numLayers;i++){var l=c.layer(i);if(l.name===GHAFHost._nativeBgPrefix+text.name&&GHAFHost._bgOwned27(l,text))return l;}return null;};
 GHAFHost._removeNativeBg=function(text){var c=text.containingComp,owned=[];for(var i=1;i<=c.numLayers;i++)if(GHAFHost._bgOwned27(c.layer(i),text))owned.push(c.layer(i));GHAFHost._deleteLayers(owned);return remove(text);};
 GHAFHost._applyBg=function(text,bg){var copy={};for(var k in bg)copy[k]=bg[k];if(copy.roundMode==='capsule')copy.round=10000;if(copy.independentMotion!==false){copy.markerDriven=false;copy.inheritTransform=false;}return apply(text,copy);};
})();
GHAFHost._finalizeBackground27=function(text,bg,g){
 if(!bg||!bg.enabled)return;var c=text.containingComp,shapes=[],surface=GHAFHost._nativeBgFor(text),i;if(!surface)return;
 for(i=1;i<=c.numLayers;i++){var l=c.layer(i);if(l.parent===text&&String(l.name).indexOf(GHAFHost._nativeBgPrefix)===0&&String(l.name).indexOf(GHAFHost._nativeBgPrefix+'AE_TEXT_')!==0)shapes.push(l);}
 // Already detached surfaces have their own anchor; repeating finalization must not duplicate it.
 if(!shapes.length)return;var anchor=text;
 if(bg.independentMotion!==false){
  anchor=text.duplicate();anchor.name='__VARNA_BG_ANCHOR__'+text.name;anchor.comment='VARNA_BG_ANCHOR:'+text.name;anchor.locked=false;anchor.enabled=false;anchor.guideLayer=true;anchor.shy=true;GHAFHost._clearAnimators(anchor);GHAFHost._clearTransformKeys(anchor);var src=anchor.property('ADBE Text Properties').property('ADBE Text Document');src.expression='';var tr=anchor.property('ADBE Transform Group');GHAFHost._clearTransformExpressions46(anchor);var fx=anchor.property('ADBE Effect Parade');while(fx.numProperties)fx.property(1).remove();
  if(g&&g.style){GHAFHost._applyTextStyle(anchor,g.style,g.text);if(g.safeBox)GHAFHost._enforceCaptionSafe(anchor,g,g.safeBox);}var r=anchor.sourceRectAtTime(anchor.inPoint,false);tr.property('ADBE Anchor Point').setValue([r.left+r.width/2,r.top+r.height/2]);tr.property('ADBE Scale').setValue([100,100]);tr.property('ADBE Rotate Z').setValue(0);tr.property('ADBE Opacity').setValue(100);src.expression='thisComp.layer('+GHAFJSON.stringify(text.name)+').text.sourceText';var markers=anchor.property('ADBE Marker');while(markers.numKeys)markers.removeKey(1);anchor.locked=true;
 }
 for(i=0;i<shapes.length;i++){l=shapes[i];l.locked=false;var lt=l.property('ADBE Transform Group'),base=lt.property('ADBE Position').valueAtTime(l.inPoint,true);l.parent=anchor;lt.property('ADBE Position').expression='';lt.property('ADBE Position').setValue([Number(bg.offsetX)||0,Number(bg.offsetY)||0]);lt.property('ADBE Anchor Point').expression='';lt.property('ADBE Anchor Point').setValue([0,0]);lt.property('ADBE Rotate Z').setValue(0);l.comment=String(l.comment||'')+'\nVARNA_BG_OWNER:'+text.name+'\n';
  if(l===surface)GHAFHost._backgroundMotion27(l,bg);
  else{var link='thisComp.layer('+GHAFJSON.stringify(surface.name)+').transform.';lt.property('ADBE Position').expression=link+'position';lt.property('ADBE Scale').expression=link+'scale';lt.property('ADBE Opacity').expression=link+'opacity'+(String(l.name).indexOf('COSMIC_COLOR_')>=0?'*'+Math.max(0,Math.min(100,Number(bg.vendorBlendOpacity==null?70:bg.vendorBlendOpacity)))+'/100':'');}
  l.locked=true;
 }
};
(function(){var create=GHAFHost._createTextLayer,refresh=GHAFHost.refreshCaptionStyles;
 GHAFHost._createTextLayer=function(c,g,name){if(g.bg&&g.bg.independentMotion!==false&&g.anim){var copy=GHAFJSON.parse(GHAFJSON.stringify(g));copy.anim.syncMode='separate';g=copy;}var l=create(c,g,name);GHAFHost._finalizeBackground27(l,g.bg,g);return l;};
 GHAFHost.refreshCaptionStyles=function(encoded){var result=GHAFJSON.parse(refresh(encoded));if(!result.ok)return GHAFJSON.stringify(result);var p=GHAFHost._parse(encoded),c=GHAFHost._activeComp();try{for(var j=0;j<(p.groups||[]).length;j++){var g=p.groups[j],list=[];for(var i=1;i<=c.numLayers;i++)if(String(c.layer(i).comment||'').split('\n')[0]==='VARNA_CAPTION_ID:'+g.id)list.push(c.layer(i));for(i=0;i<list.length;i++)GHAFHost._finalizeBackground27(list[i],g.bg,g);}return GHAFJSON.stringify(result);}catch(e){return GHAFHost._err(String(e));}};
})();
/* Explicit cleanup only affects owned original-tool output, never an arbitrary selected Shape. */
(function(){var action=GHAFHost.scriptToolAction;
 GHAFHost.scriptToolAction=function(encoded){var p=GHAFHost._parse(encoded),c=GHAFHost._activeComp(),before=c?GHAFHost._layerSet(c):[],r=GHAFJSON.parse(action(encoded));if(r.ok&&c&&p.tool==='glassary'&&p.action==='click'){var layers=GHAFHost._newLayers(c,before),stamp=String(new Date().getTime());for(var i=0;i<layers.length;i++)layers[i].comment=String(layers[i].comment||'')+'\nVARNA_GLASSARY_OBJECT:'+stamp;}return GHAFJSON.stringify(r);};
})();
GHAFHost.listGlassaryObjects=function(){var c=GHAFHost._activeComp();if(!c)return GHAFHost._err('NO_COMP');var list=[];for(var i=1;i<=c.numLayers;i++){var l=c.layer(i),tag=/VARNA_GLASSARY_OBJECT:([^\r\n]+)/.exec(String(l.comment||''));if(tag)list.push({id:tag[1],index:l.index,name:l.name});}return GHAFHost._ok({objects:list});};
GHAFHost.removeGlassaryObject=function(encoded){var p=GHAFHost._parse(encoded),c=GHAFHost._activeComp();if(!c)return GHAFHost._err('NO_COMP');var list=[];for(var i=1;i<=c.numLayers;i++){var l=c.layer(i),tag=/VARNA_GLASSARY_OBJECT:([^\r\n]+)/.exec(String(l.comment||''));if(tag&&tag[1]===String(p.id))list.push(l);}app.beginUndoGroup('Remove Glassary Object');try{GHAFHost._deleteLayers(list);return GHAFHost._ok({removed:list.length});}finally{app.endUndoGroup();}};
/* Import helpers reuse footage and replace only assets carrying this brand's ownership tag. */
GHAFHost.importBrandAssets=function(encoded){var p=GHAFHost._parse(encoded),c=GHAFHost._activeComp();if(!c)return GHAFHost._err('NO_COMP');var assets=p.assets||[],files=[],old=GHAFHost._layerSet(c),createdItems=[],previous=[],imported=0,placed=0,resources=0;
 try{for(var i=0;i<assets.length;i++){var a=assets[i];if(a.enabled===false)continue;var f=new File(String(a.path||''));if(!f.exists)throw Error('فایل برند پیدا نشد: '+a.name);files.push({asset:a,file:f});}}catch(e){return GHAFHost._err(String(e));}
 app.beginUndoGroup('Varna Brand Assets');try{var tag='VARNA_BRAND_ASSET:'+String(p.brandId)+':';for(i=1;i<=c.numLayers;i++)if(String(c.layer(i).comment||'').indexOf(tag)===0)previous.push(c.layer(i));
 for(i=0;i<files.length;i++){a=files[i].asset;f=files[i].file;if(!/\.(png|jpe?g|webp|gif|psd|ai|eps|tiff?|bmp|exr|mp4|mov|m4v|avi|webm|wav|mp3|aif[f]?|m4a|aep)$/i.test(f.name)){resources++;continue;}var item=GHAFHost._findFootageByFile(f.fsName);if(!item){item=app.project.importFile(new ImportOptions(f));createdItems.push(item);}imported++;
 if(a.placement!=='timeline'||!(item instanceof FootageItem))continue;var l=c.layers.add(item);l.name='VARNA_BRAND_'+a.name;l.comment=tag+a.id;var start=Math.max(0,Number(a.start)||0);l.startTime=start;l.inPoint=start;l.outPoint=Math.min(c.duration,item.mainSource&&item.mainSource.isStill?c.duration:start+item.duration);if(l.outPoint<=l.inPoint)throw Error('زمان دارایی برند خارج از کامپ است.');var tr=l.property('ADBE Transform Group');if(item.hasVideo){var pct=Math.max(1,Math.min(100,Number(a.widthPct)||12)),scale=c.width*pct/100/item.width*100;tr.property('ADBE Scale').setValue([scale,scale]);tr.property('ADBE Position').setValue([c.width*(a.x==null?50:Number(a.x))/100,c.height*(a.y==null?12:Number(a.y))/100]);}if(item.hasAudio&&a.role!=='audio')l.audioEnabled=false;placed++;}
 GHAFHost._deleteLayers(previous);return GHAFHost._ok({imported:imported,placed:placed,resources:resources});
 }catch(e){GHAFHost._deleteLayers(GHAFHost._newLayers(c,old));for(i=createdItems.length-1;i>=0;i--)try{if(createdItems[i].usedIn.length===0)createdItems[i].remove();}catch(ignore){}return GHAFHost._err(String(e));}finally{app.endUndoGroup();}
};
GHAFHost.configureVideoComp=function(encoded){var p=GHAFHost._parse(encoded),w=Number(p.width),h=Number(p.height),fps=Number(p.fps),d=Number(p.duration),c=GHAFHost._activeComp();if(!isFinite(w)||!isFinite(h)||w<100||h<100||w>8192||h>8192||!isFinite(fps)||fps<1||fps>120||!isFinite(d)||d<=0||d>10800)return GHAFHost._err('تنظیمات پروژهٔ ویدیو معتبر نیست.');app.beginUndoGroup('Varna Video Project');try{if(p.mode==='new')c=app.project.items.addComp(String(p.name||'Varna Video'),Math.round(w),Math.round(h),1,d,fps);else{if(!c)throw Error('NO_COMP');c.width=Math.round(w);c.height=Math.round(h);c.frameRate=fps;c.duration=d;}c.openInViewer();return GHAFHost._ok({compId:c.id,width:c.width,height:c.height,fps:c.frameRate,duration:c.duration});}catch(e){return GHAFHost._err(String(e));}finally{app.endUndoGroup();}};
GHAFHost._fitVideo27=function(l,c,item,mode){if(mode==='original')return;var ratio=mode==='fill'?Math.max(c.width/(item.width*(item.pixelAspect||1)),c.height/item.height):Math.min(c.width/(item.width*(item.pixelAspect||1)),c.height/item.height),tr=l.property('ADBE Transform Group');tr.property('ADBE Scale').setValue([ratio*100,ratio*100]);tr.property('ADBE Position').setValue([c.width/2,c.height/2]);};
(function(){var place=GHAFHost.placeBroll;GHAFHost.placeBroll=function(encoded){var p=GHAFHost._parse(encoded),r=GHAFJSON.parse(place(encoded));if(!r.ok)return GHAFJSON.stringify(r);var c=GHAFHost._activeComp(),l=null;for(var i=1;i<=c.numLayers;i++)if(c.layer(i).name===r.data.layer&&Math.abs(c.layer(i).inPoint-r.data.start)<.001){l=c.layer(i);break;}try{if(!l)throw Error('لایهٔ ویدیو پیدا نشد.');GHAFHost._fitVideo27(l,c,l.source,p.fit||'fit');l.audioEnabled=p.audio===true;if(p.fade>0){var fade=Math.min((l.outPoint-l.inPoint)/2,Number(p.fade)),op=l.property('ADBE Transform Group').property('ADBE Opacity');op.setValueAtTime(l.inPoint,0);op.setValueAtTime(l.inPoint+fade,100);op.setValueAtTime(l.outPoint-fade,100);op.setValueAtTime(l.outPoint,0);}return GHAFJSON.stringify(r);}catch(e){if(l)l.remove();return GHAFHost._err(String(e));}};})();
GHAFHost.videoInspector=function(){var c=GHAFHost._activeComp();if(!c)return GHAFHost._err('NO_COMP');var selection=c.selectedLayers;if(selection.length!==1||!selection[0].source||!selection[0].source.hasVideo)return GHAFHost._err('یک لایهٔ ویدیو انتخاب کن.');var l=selection[0];return GHAFHost._ok({index:l.index,name:l.name,compId:c.id,start:l.inPoint,end:l.outPoint,speed:10000/l.stretch,scale:l.property('ADBE Transform Group').property('ADBE Scale').value[0],x:l.property('ADBE Transform Group').property('ADBE Position').value[0]/c.width*100,y:l.property('ADBE Transform Group').property('ADBE Position').value[1]/c.height*100,opacity:l.property('ADBE Transform Group').property('ADBE Opacity').value,audio:l.audioEnabled});};
GHAFHost.applyVideoInspector=function(encoded){var p=GHAFHost._parse(encoded),c=GHAFHost._activeComp();if(!c||Number(p.compId)!==c.id)return GHAFHost._err('کامپ تغییر کرده؛ مشخصات ویدیو را دوباره بخوان.');var l=c.layer(Number(p.index));if(!l||l.name!==p.name||!l.source||!l.source.hasVideo)return GHAFHost._err('لایه تغییر کرده؛ مشخصات ویدیو را دوباره بخوان.');var speed=Number(p.speed);if(!isFinite(speed)||speed<10||speed>1000||l.timeRemapEnabled||l.stretch<=0)return GHAFHost._err('سرعت باید ۱۰ تا ۱۰۰۰ درصد باشد؛ Time Remap یا ویدیوی معکوس را جدا تنظیم کن.');for(var key in {scale:1,x:1,y:1,opacity:1})if(!isFinite(Number(p[key])))return GHAFHost._err('مقدار Inspector معتبر نیست.');app.beginUndoGroup('Varna Video Inspector');try{var ip=l.inPoint,srcIn=(ip-l.startTime)/(l.stretch/100),srcOut=(l.outPoint-l.startTime)/(l.stretch/100),tr=l.property('ADBE Transform Group');l.stretch=10000/speed;l.startTime=ip-srcIn*l.stretch/100;l.inPoint=ip;l.outPoint=Math.min(c.duration,l.startTime+srcOut*l.stretch/100);tr.property('ADBE Scale').setValue([Number(p.scale),Number(p.scale)]);tr.property('ADBE Position').setValue([c.width*Number(p.x)/100,c.height*Number(p.y)/100]);tr.property('ADBE Opacity').setValue(Math.max(0,Math.min(100,Number(p.opacity))));l.audioEnabled=!!p.audio;return GHAFHost._ok({updated:true});}catch(e){return GHAFHost._err(String(e));}finally{app.endUndoGroup();}};

(function(){var helper=GHAFHost._glassHelper;GHAFHost._glassHelper=function(text,bg,role,fill){var b={};for(var k in bg)b[k]=bg[k];if(b.roundMode==='capsule')b.round=10000;return helper(text,b,role,fill);};})();
GHAFHost.removeSelectedGlassary=function(){var c=GHAFHost._activeComp();if(!c)return GHAFHost._err('NO_COMP');var selected=c.selectedLayers||[],remove=[],tags=[];for(var i=0;i<selected.length;i++){var l=selected[i],fx=l.property('ADBE Effect Parade'),isGlass=false;if(l.matchName!=='ADBE Vector Layer')continue;for(var j=1;fx&&j<=fx.numProperties;j++)if(/Glassary/i.test(String(fx.property(j).name)+' '+String(fx.property(j).matchName)))isGlass=true;if(isGlass||/VARNA_GLASSARY_OBJECT:/.test(String(l.comment||''))){remove.push(l);tags.push('VARNA_VENDOR_OWNER:'+l.name);}}if(!remove.length)return GHAFHost._err('شیپ Glassary را در تایم‌لاین AE انتخاب کن.');for(i=1;i<=c.numLayers;i++){l=c.layer(i);for(j=0;j<tags.length;j++)if(String(l.comment||'').split(/\r?\n/).join('\n').indexOf(tags[j])>=0){var seen=false;for(var k=0;k<remove.length;k++)if(remove[k]===l)seen=true;if(!seen)remove.push(l);break;}}app.beginUndoGroup('Remove Selected Glassary');try{GHAFHost._deleteLayers(remove);return GHAFHost._ok({removed:remove.length});}finally{app.endUndoGroup();}};
GHAFHost.textOpticsSchema=function(){var c=GHAFHost._activeComp(),l=null;if(!c)return GHAFHost._err('NO_COMP');var found=GHAFHost._aeGlassInfo();if(!found.available)return GHAFHost._err('AE Glass در AE بارگذاری نشده است.');app.beginUndoGroup('Read AE Glass letter controls');try{l=c.layers.addText('VARNA');var fx=l.property('ADBE Effect Parade').addProperty(found.matchName);return GHAFHost._ok({controls:GHAFHost._vendorProps(fx)});}catch(e){return GHAFHost._err(String(e));}finally{if(l)l.remove();app.endUndoGroup();}};
GHAFHost._setOpticsParameters27=function(copy,items){if(!items||!items.length)return;var fx=copy.property('ADBE Effect Parade'),effect=null;for(var i=1;i<=fx.numProperties;i++)if(fx.property(i).name==='VARNA · AE Glass')effect=fx.property(i);if(!effect)throw Error('AE Glass روی حروف پیدا نشد.');for(i=0;i<items.length;i++){var row=items[i],p=effect;for(var j=0;j<row.path.length;j++){var n=Number(row.path[j]);if(n!==Math.floor(n)||n<1||n>p.numProperties)throw Error('مسیر کنترل AE Glass تغییر کرده است.');p=p.property(n);}if(row.path.length){if(p.numKeys)p.setValueAtTime(copy.inPoint,row.value);else p.setValue(row.value);}}};
(function(){var apply=GHAFHost._applyAEGlassText,selection=GHAFHost.applyTextGlassSelection;
 GHAFHost._applyAEGlassText=function(text,bg,style){var copy=apply(text,bg,style);GHAFHost._setOpticsParameters27(copy,(style||{}).textAEParameters);return copy;};
 GHAFHost.applyTextGlassSelection=function(encoded){var p=GHAFHost._parse(encoded),r=GHAFJSON.parse(selection(encoded));if(!r.ok||!p.enabled||!p.parameters)return GHAFJSON.stringify(r);try{var c=GHAFHost._activeComp(),text=GHAFHost._vendorTarget(c,'text');for(var i=1;i<=c.numLayers;i++)if(c.layer(i).name===GHAFHost._nativeBgPrefix+'AE_TEXT_'+text.name)GHAFHost._setOpticsParameters27(c.layer(i),p.parameters);return GHAFJSON.stringify(r);}catch(e){return GHAFHost._err(String(e));}};
})();

/* Native audio mix: the source composition remains intact; only an owned staging comp/queue item is removed. */
GHAFHost.getCompositionSource=function(encoded){try{var p=GHAFHost._parse(encoded),c=GHAFHost._activeComp();if(!c)throw Error('ابتدا Composition را فعال کن.');if(c.hasAudio===false)throw Error('کامپوزیشن فعال صدا ندارد.');var start=p.range==='workArea'?Math.max(0,c.workAreaStart):0,end=p.range==='workArea'?Math.min(c.duration,start+c.workAreaDuration):c.duration;if(end<=start)throw Error('محدودهٔ صوتی کامپوزیشن خالی است.');return GHAFHost._ok({kind:'composition',comp:c.name,compId:c.id,compWidth:c.width,compHeight:c.height,compDuration:c.duration,frameRate:c.frameRate,layer:c.name,layerType:'composition',range:p.range==='workArea'?'workArea':'full',path:'',compIn:start,compOut:end,sourceStart:0,sourceDuration:end-start,stretch:100});}catch(e){return GHAFHost._err(String(e));}};
GHAFHost.renderCompositionAudio=function(encoded){
 var p=GHAFHost._parse(encoded),rq=app.project.renderQueue,c=null,stage=null,item=null,old=[],folder=null,result=null,error=null,i;
 try{
  if(rq.rendering)throw Error('صف رندر در حال اجراست؛ پس از پایان آن تحلیل صدا را اجرا کن.');
  for(i=1;i<=app.project.numItems;i++){var it=app.project.item(i);if(it instanceof CompItem&&it.id===Number(p.compId)){c=it;break;}}
  if(!c)throw Error('کامپوزیشن منبع دیگر وجود ندارد؛ منبع را دوباره بخوان.');if(c.hasAudio===false)throw Error('کامپوزیشن صدا ندارد.');
  var start=p.range==='workArea'?Math.max(0,c.workAreaStart):0,end=p.range==='workArea'?Math.min(c.duration,start+c.workAreaDuration):c.duration;if(end<=start)throw Error('محدودهٔ تحلیل خالی است.');
  folder=new Folder(String(p.folder||''));if(!p.folder||!folder.exists)throw Error('پوشهٔ موقت صدا آماده نیست.');
  // A tiny staging picture avoids rendering the video. Audio is evaluated by AE, including nested comps, audio effects, solo/mute and time mapping.
  stage=app.project.items.addComp('__VARNA_AUDIO_MIX_'+new Date().getTime(),4,4,1,c.duration,c.frameRate);var sourceLayer=stage.layers.add(c);sourceLayer.startTime=0;sourceLayer.inPoint=0;sourceLayer.outPoint=c.duration;sourceLayer.audioEnabled=true;sourceLayer.enabled=false;
  for(i=1;i<=rq.numItems;i++){var q=rq.item(i);if(q.render){old.push(q);q.render=false;}}
  item=rq.items.add(stage);item.timeSpanStart=start;item.timeSpanDuration=end-start;
  var templates=item.outputModule(1).templates||[],chosen='',priority=[/\bwave?\b|\.wav\b/i,/aiff/i,/audio.*only|only.*audio/i,/lossless|無損|بدون.*افت/i];
  for(var k=0;k<priority.length&&!chosen;k++)for(i=0;i<templates.length;i++)if(priority[k].test(String(templates[i]))){chosen=String(templates[i]);break;}
  if(chosen)item.outputModule(1).applyTemplate(chosen);
  var om=item.outputModule(1),settings=om.getSettings(GetSettingsFormat.STRING_SETTABLE),audioKey=null;
  for(var key in settings)if(/^(output audio|audio output)$/i.test(key))audioKey=key;
  if(audioKey){var audioSettings={};audioSettings[audioKey]='On';om.setSettings(audioSettings);om=item.outputModule(1);}
  var actual=om.getSettings(GetSettingsFormat.STRING),format=String(actual.Format||''),audioState=String(actual[audioKey||'Output Audio']||actual['Audio Output']||'');
  if(/^(off|false|0)$/i.test(audioState))throw Error('Audio Output قالب رندر خاموش است. یک قالب Audio Only / WAV / AIFF با صدای روشن در Output Module ذخیره کن.');
  var audioOnly=/wav|wave|aiff|audio.*only/i.test(format+' '+chosen),movie=/avi|quicktime|mov|mxf/i.test(format+' '+chosen);
  if(!audioOnly&&!movie)throw Error('قالب خروجی صدا در این نصب آماده نیست. در Render Queue یک Output Module با فرمت WAV یا AIFF و صدای روشن ذخیره کن؛ سپس دوباره اجرا کن.');
  var extension=/aiff/i.test(format+' '+chosen)?'.aif':/wav|wave/i.test(format+' '+chosen)?'.wav':/avi/i.test(format)?'.avi':'.mov';
  om.file=new File(folder.fsName+'/composition_mix'+extension);item.render=true;rq.render();
  if(item.status!==RQItemStatus.DONE)throw Error('رندر صدای کامپوزیشن کامل نشد یا لغو شد.');
  var rendered=item.outputModule(1).file;if(!rendered||!rendered.exists||rendered.length<=44)throw Error('فایل صدای کامپوزیشن تولید نشد.');
  result={kind:'composition',comp:c.name,compId:c.id,compWidth:c.width,compHeight:c.height,compDuration:c.duration,frameRate:c.frameRate,layer:c.name,layerType:'composition',path:rendered.fsName,compIn:start,compOut:end,sourceStart:0,sourceDuration:end-start,stretch:100,range:p.range||'full',temporary:true,template:chosen||format};
 }catch(e){error=String(e);}finally{
  if(item)try{item.remove();}catch(cleanItem){}if(stage)try{stage.remove();}catch(cleanComp){}
  for(i=0;i<old.length;i++)try{old[i].render=true;}catch(restoreQueue){}
  if(c)try{c.openInViewer();}catch(viewer){}
 }
 return error?GHAFHost._err(error):GHAFHost._ok(result);
};

/* Round the optical mask with the exact surface path, including independent surface motion. */
(function(){var original=GHAFHost._applyGlassBlur,applyBg=GHAFHost._applyBg;GHAFHost._applyBg=function(text,bg){var b={};for(var k in bg)b[k]=bg[k];if(b.roundMode==='capsule')b.engine='native';return applyBg(text,b);};GHAFHost._applyGlassBlur=function(text,bg,shape){var l=original(text,bg,shape);shape=shape||GHAFHost._nativeBgFor(text);if(!l||!shape)return l;var locked=l.locked;try{l.locked=false;var mask=l.property('ADBE Mask Parade').property(1),name=GHAFJSON.stringify(shape.name);mask.property('ADBE Mask Shape').expression='var s=thisComp.layer('+name+'),p=s.content("GHAF Glass Main").content(1).path,v=p.points(),a=p.inTangents(),b=p.outTangents(),V=[],A=[],B=[];for(var i=0;i<v.length;i++){var c=thisLayer.fromComp(s.toComp(v[i])),u=thisLayer.fromComp(s.toComp([v[i][0]+a[i][0],v[i][1]+a[i][1]])),w=thisLayer.fromComp(s.toComp([v[i][0]+b[i][0],v[i][1]+b[i][1]]));V.push(c);A.push([u[0]-c[0],u[1]-c[1]]);B.push([w[0]-c[0],w[1]-c[1]]);}createPath(V,A,B,true);';mask.property('ADBE Mask Feather').setValue([1,1]);l.property('ADBE Transform Group').property('ADBE Opacity').expression='thisComp.layer('+name+').transform.opacity';}finally{l.locked=locked;}return l;};})();

/* Native emphasis and shared stack handles. ES3 / CEP host only. */
GHAFHost._highlight37=function(layer,h,g){
 if(GHAFHost._wordHighlight39&&((h&&h.indices)||g))return GHAFHost._wordHighlight39(layer,h,g);
 var text=layer.property('ADBE Text Properties');if(!text){if(h&&h.ranges&&h.ranges.length)throw Error('HIGHLIGHT_NEEDS_NATIVE_TEXT');return;}var animators=text.property('ADBE Text Animators'),i;
 for(i=animators.numProperties;i>=1;i--)if(String(animators.property(i).name).indexOf('VARNA EMPHASIS37 ')===0)animators.property(i).remove();
 if(!h||!h.ranges||!h.ranges.length)return;
 for(i=0;i<h.ranges.length;i++){
  var index=Number(h.ranges[i].start),end=Number(h.ranges[i].end);if(!isFinite(index)||index<0||index!==Math.floor(index)||!isFinite(end)||end<=index)throw Error('HIGHLIGHT_WORD_INDEX_INVALID');
  var an=animators.addProperty('ADBE Text Animator');an.name='VARNA EMPHASIS37 '+index;
  var props=an.property('ADBE Text Animator Properties');props.addProperty('ADBE Text Fill Color').setValue(GHAFHost._hex(h.color||'#F8CB67'));
  if(Number(h.scale||100)!==100){var size=Math.max(80,Math.min(140,Number(h.scale)));props.addProperty('ADBE Text Scale 3D').setValue([size,size,100]);}
  var selector=an.property('ADBE Text Selectors').addProperty('ADBE Text Selector'),advanced=selector.property('ADBE Text Range Advanced');
  advanced.property('ADBE Text Range Units').setValue(2);advanced.property('ADBE Text Range Type2').setValue(1);
  advanced.property('ADBE Text Selector Smoothness').setValue(0);
  selector.property('ADBE Text Index Start').setValue(index);selector.property('ADBE Text Index End').setValue(end);
 }
};
GHAFHost._finishStacks37=function(s){
 if(s.stacksFinished37)return;var groups={},order=[],i,j;
 for(i=0;i<s.created.length;i++){var layer=s.created[i],m=String(layer.comment||'').match(/\nVARNA_STACK37:(\{[^\n]+\})/);if(!m)continue;var data=GHAFJSON.parse(m[1]),key=String(data.id);if(!groups[key]){groups[key]={data:data,layers:[]};order.push(key);}groups[key].layers.push(layer);}
 for(i=0;i<order.length;i++){
  var group=groups[order[i]],items=group.layers,anchor=s.comp.layers.addNull();s.created.push(anchor);anchor.name='GHAF_STACK37_'+s.token+'_'+order[i];anchor.comment='VARNA_STACK_HANDLE37';
  var tr=anchor.property('ADBE Transform Group');tr.property('ADBE Anchor Point').setValue([0,0]);tr.property('ADBE Position').setValue([Number(group.data.x),Number(group.data.y)]);
  var start=s.comp.duration,end=0,solo=false;for(j=0;j<items.length;j++){start=Math.min(start,items[j].inPoint);end=Math.max(end,items[j].outPoint);if(items[j].solo)solo=true;}
  anchor.inPoint=Math.max(0,start);anchor.outPoint=Math.min(s.comp.duration,end);anchor.guideLayer=false;anchor.solo=solo;
  for(j=0;j<items.length;j++){var l=items[j],locked=l.locked;try{l.locked=false;if(!l.parent&&!/^GHAF_TYPE_CLICK_/.test(l.name))l.parent=anchor;}finally{l.locked=locked;}}
 }
 s.stacksFinished37=true;
};
(function(){
 var create=GHAFHost._createTextLayer,refresh=GHAFHost.refreshCaptionStyles,finish=GHAFHost._finishOutputBlock35,outputs=GHAFHost._outputLayers,commit=GHAFHost.commitOutputSession;
 GHAFHost._createTextLayer=function(c,g,name){var layer=create(c,g,name);GHAFHost._highlight37(layer,g.highlight37,g);return layer;};
 GHAFHost.refreshCaptionStyles=function(encoded){var result=refresh(encoded),r=GHAFJSON.parse(result);if(!r.ok)return result;var p=GHAFHost._parse(encoded),c=GHAFHost._activeComp();if(!c)return result;app.beginUndoGroup('Varna Refresh Caption Emphasis');try{for(var i=0;i<(p.groups||[]).length;i++){var g=p.groups[i];for(var j=1;j<=c.numLayers;j++){var l=c.layer(j);if(String(l.comment||'').split('\n')[0]==='VARNA_CAPTION_ID:'+String(g.id)){var locked=l.locked;try{l.locked=false;GHAFHost._highlight37(l,g.highlight37,g);}finally{l.locked=locked;}}}}}catch(e){return GHAFHost._err(String(e));}finally{app.endUndoGroup();}return result;};
 GHAFHost._finishOutputBlock35=function(c,layers,g,tail){var result=finish(c,layers,g,tail);if(g.stack37)for(var i=0;i<layers.length;i++){var l=layers[i],locked=l.locked;try{l.locked=false;l.comment=String(l.comment||'')+'\nVARNA_STACK37:'+GHAFJSON.stringify(g.stack37);}finally{l.locked=locked;}}return result;};
 GHAFHost._outputLayers=function(c){var result=outputs(c);for(var i=1;i<=c.numLayers;i++)if(/^GHAF_STACK37_/.test(c.layer(i).name))result.push(c.layer(i));return result;};
 GHAFHost.commitOutputSession=function(encoded){var p=GHAFHost._parse(encoded),s=GHAFHost._outputSession;if(!s||p.token!==s.token||s.count!==s.expected)return commit(encoded);app.beginUndoGroup('Varna Caption Stack Handles');try{GHAFHost._finishStacks37(s);}catch(e){return GHAFHost._err(String(e));}finally{app.endUndoGroup();}return commit(encoded);};
})();

/* Reuse complete, matching native caption blocks; replace changed blocks at commit. */
GHAFHost._buildMeta37=function(l){var m=String(l.comment||'').match(/\nVARNA_BUILD37:([^\n]+)/);if(!m)return null;try{return GHAFJSON.parse(m[1]);}catch(e){return null;}};
GHAFHost._restoreOrder37=function(s){if(!s||!s.orderChanged37)return;for(var i=s.beginOrder37.length-1;i>=0;i--){var l=s.beginOrder37[i],locked=l.locked;try{l.locked=false;l.moveToBeginning();}catch(e){}finally{try{l.locked=locked;}catch(ignore){}}}};
(function(){var begin=GHAFHost.beginOutputSession,build=GHAFHost.buildOutput,commit=GHAFHost.commitOutputSession,abort=GHAFHost.abortOutputSession;
 GHAFHost.beginOutputSession=function(encoded){var p=GHAFHost._parse(encoded);if(p.update37)p.clearOld=true;var result=begin(encodeURIComponent(GHAFJSON.stringify(p))),r=GHAFJSON.parse(result);if(r.ok){var s=GHAFHost._outputSession;s.update37=p.update37===true;s.reused37=[];s.blocks37=[];s.beginOrder37=GHAFHost._layerSet(s.comp);}return result;};
 GHAFHost.buildOutput=function(encoded){var p=GHAFHost._parse(encoded),s=GHAFHost._outputSession;if(!s||!s.update37||!p.sessionToken||p.sessionToken!==s.token||p.done!==s.count||(p.compId!=null&&p.compId!==s.comp.id)||!p.groups||p.groups.length!==1)return build(encoded);
  var g=p.groups[0],signature=GHAFJSON.stringify({group:g,comp:[s.comp.width,s.comp.height,s.comp.duration,s.comp.frameRate,s.comp.pixelAspect],revision:GHAFHost._bridgeRevision}),i,j,meta,block=[],matched=null;
  // Shared stacks are rebuilt as a set, retaining their common parent and timing.
  if(!g.stack37)for(i=0;i<s.previous.length;i++){meta=GHAFHost._buildMeta37(s.previous[i]);if(meta&&meta.id===g.id&&meta.signature===signature){matched=meta;break;}}
  if(matched){for(i=0;i<s.previous.length;i++){meta=GHAFHost._buildMeta37(s.previous[i]);if(meta&&meta.block===matched.block&&meta.signature===signature)block.push(s.previous[i]);}if(block.length!==matched.count)block=[];}
  if(block.length){s.reused37=s.reused37.concat(block);s.blocks37.push({layers:block,g:g});s.count++;return GHAFHost._ok({created:1,reused37:1,errors:[]});}
  var before=s.created.length,result=build(encoded),r=GHAFJSON.parse(result);if(!r.ok)return result;block=s.created.slice(before);var tag={id:g.id,signature:signature,block:s.token+'_'+s.count,count:block.length};
  for(i=0;i<block.length;i++){var l=block[i],locked=l.locked;try{l.locked=false;l.comment=String(l.comment||'')+'\nVARNA_BUILD37:'+GHAFJSON.stringify(tag);}finally{l.locked=locked;}}
  s.blocks37.push({layers:block,g:g});return result;
 };
 GHAFHost.commitOutputSession=function(encoded){var p=GHAFHost._parse(encoded),s=GHAFHost._outputSession;if(!s||!s.update37||p.token!==s.token||s.count!==s.expected)return commit(encoded);
  app.beginUndoGroup('Varna Update Caption Blocks');try{var tail=null,i,j;for(i=0;i<s.blocks37.length;i++){var block=s.blocks37[i].layers;for(j=0;j<block.length;j++){var l=block[j],locked=l.locked;try{l.locked=false;s.orderChanged37=true;if(tail)l.moveAfter(tail);else l.moveToBeginning();tail=l;}finally{l.locked=locked;}}}
   var previous=[];for(i=0;i<s.previous.length;i++){var keep=false;for(j=0;j<s.reused37.length;j++)if(s.previous[i]===s.reused37[j]){keep=true;break;}if(!keep)previous.push(s.previous[i]);}s.previous=previous;
  }catch(e){GHAFHost._restoreOrder37(s);return GHAFHost._err(String(e));}finally{app.endUndoGroup();}
  return commit(encoded);
 };
 GHAFHost.abortOutputSession=function(encoded){var s=GHAFHost._outputSession,result=abort(encoded),r=GHAFJSON.parse(result);if(r.ok)GHAFHost._restoreOrder37(s);return result;};
})();

/* User-supplied AEP/MOGRT adapters. Original assets are never edited in place. */
GHAFHost._templateCatalog38=function(){
 if(GHAFHost._catalog38)return GHAFHost._catalog38;
 var f=new File(File(GHAFHost._filePath).parent.parent.fsName+'/assets/templates38/catalog.json');f.encoding='UTF-8';
 if(!f.open('r'))throw Error('کتابخانهٔ قالب‌ها نصب نیست؛ بستهٔ کامل RC43 را نصب کن.');try{GHAFHost._catalog38=GHAFJSON.parse(f.read());}finally{f.close();}return GHAFHost._catalog38;
};
GHAFHost._templateSpec38=function(id){var list=GHAFHost._templateCatalog38();for(var i=0;i<list.length;i++)if(list[i].id===id)return list[i];throw Error('شناسهٔ قالب معتبر نیست.');};
GHAFHost._templateComp38=function(spec){
 GHAFHost._sourceTemplates38=GHAFHost._sourceTemplates38||{};var cacheKey=spec.assetKey+'|'+spec.compName,cached=GHAFHost._sourceTemplates38[cacheKey];if(cached)try{if(app.project.itemByID&&app.project.itemByID(cached.id)===cached)return cached;}catch(cacheError){}
 var prefix='VARNA_TEMPLATE38_ASSET:'+spec.assetKey+'\n',i,item,found=null,before={},added=[];
 for(i=1;i<=app.project.numItems;i++){item=app.project.item(i);before[item.id]=true;if(item instanceof CompItem&&String(item.comment||'').indexOf(prefix)===0&&item.name===spec.compName)found=item;}
 if(found){GHAFHost._sourceTemplates38[cacheKey]=found;return found;}
 var f=new File(File(GHAFHost._filePath).parent.parent.fsName+'/assets/templates38/'+spec.asset);if(!f.exists)throw Error('فایل قالب پیدا نشد: '+spec.label);
 try{app.project.importFile(new ImportOptions(f));for(i=1;i<=app.project.numItems;i++){item=app.project.item(i);if(!before[item.id]){added.push(item);if(item instanceof CompItem){item.comment=prefix+String(item.comment||'');if(item.name===spec.compName)found=item;}}}if(!found)throw Error('کامپوزیشن '+spec.compName+' در فایل قالب پیدا نشد.');GHAFHost._sourceTemplates38[cacheKey]=found;return found;}
 catch(e){added=[];for(i=1;i<=app.project.numItems;i++){item=app.project.item(i);if(!before[item.id])added.push(item);}for(i=added.length-1;i>=0;i--)try{added[i].remove();}catch(ignore){}throw e;}
};
/* Only writable leaf properties belong in the template inspector. AE also exposes
 * empty structural groups and built-in compositing groups in every effect. */
GHAFHost._templateStructural47=function(prop){var name=String(prop&&prop.matchName||'');return name==='ADBE Effect Built In Params'||name==='ADBE Group End'||name==='ADBE Effect Compositing Group'||name==='ADBE Effect Mask Parade';};
GHAFHost._templateInventory38=function(root){
 var slots=[],controls=[],seen={},layers=[];
 function scan(comp,path,depth){
  if(depth>16||seen[comp.id])return;seen[comp.id]=true;
  for(var i=1;i<=comp.numLayers;i++){
   var layer=comp.layer(i),route=path.concat([i]),text=layer.property('ADBE Text Properties');layers.push({path:route,name:layer.name});
   if(text){var source=text.property('ADBE Text Document');if(source){var value=source.value;if(value&&(!source.expression||/EDIT TEXT HERE/i.test(layer.name)))slots.push({path:route,name:comp.name+' / '+layer.name,text:String(value.text||''),preferred:/EDIT TEXT HERE/i.test(layer.name)?100:(!layer.guideLayer&&!/measure/i.test(layer.name)?10:0)});}}
   var effects=layer.property('ADBE Effect Parade');
   if(effects)for(var j=1;j<=effects.numProperties;j++){
    var effect=effects.property(j),props=GHAFHost._vendorProps(effect);
    for(var k=0;k<props.length;k++){
     var item=props[k];item.layerPath=route;item.effectIndex=j;item.effectName=effect.name;item.effectMatchName=String(effect.matchName||'');
     var target=GHAFHost._templateProperty38(root,item,true);if(!target)continue;
     if(item.kind==='readonly'){var raw=target.value;if(Object.prototype.toString.call(raw)==='[object Array]'&&raw.length){var valid=true;for(var vi=0;vi<raw.length;vi++)if(typeof raw[vi]!=='number'||!isFinite(raw[vi]))valid=false;if(valid){item.kind='vector';item.value=raw;}}if(item.kind==='readonly')continue;}
     item.matchName=String(target.matchName||'');item.group=layer.name+' · '+effect.name;controls.push(item);
    }
   }
   if(layer.source instanceof CompItem)scan(layer.source,route,depth+1);
  }
 }
 scan(root,[],0);slots.sort(function(a,b){return b.preferred-a.preferred||a.name.localeCompare(b.name);});return {slots:slots,controls:controls,layers:layers};
};
GHAFHost.prepareTemplate38=function(encoded){
 var p=GHAFHost._parse(encoded),destination=GHAFHost._activeComp();if(destination&&String(destination.comment||'').indexOf('VARNA_TEMPLATE38_')!==0)GHAFHost._templateDestination38=destination;app.beginUndoGroup('Varna Import Caption Template');try{var spec=GHAFHost._templateSpec38(String(p.id)),comp=GHAFHost._templateComp38(spec),info=GHAFHost._templateInventory38(comp);if(!info.slots.length)throw Error('متن قابل ویرایشی در قالب پیدا نشد.');return GHAFHost._ok({id:spec.id,compId:comp.id,name:comp.name,duration:comp.duration,width:comp.width,height:comp.height,slots:info.slots,controls:info.controls,fonts:spec.fonts||[]});}catch(e){return GHAFHost._err(String(e));}finally{app.endUndoGroup();}
};
GHAFHost._templateLayer38=function(comp,path){
 if(!path||typeof path==='string'||!path.length||path.length>17)throw Error('مسیر کنترل قالب معتبر نیست.');var layer;
 for(var i=0;i<path.length;i++){var n=Number(path[i]);if(!comp||!isFinite(n)||n<1||n!==Math.floor(n)||n>comp.numLayers)throw Error('لایهٔ قالب تغییر کرده؛ تنظیمات را دوباره بخوان.');layer=comp.layer(n);if(!layer)throw Error('لایهٔ قالب پیدا نشد.');if(i<path.length-1){comp=layer.source;if(!(comp instanceof CompItem))throw Error('پیش‌کامپ قالب پیدا نشد.');}}
 return layer;
};
GHAFHost._templateProperty38=function(comp,p,allowUnsupported){
 if(!p||!p.path||typeof p.path==='string'||!p.path.length||p.path.length>28)throw Error('مسیر ویژگی قالب معتبر نیست.');
 var layer=GHAFHost._templateLayer38(comp,p.layerPath),effects=layer.property('ADBE Effect Parade'),index=Number(p.effectIndex);
 if(!effects||!isFinite(index)||index<1||index!==Math.floor(index)||index>effects.numProperties)throw Error('کنترل قالب تغییر کرده؛ دوباره بخوان.');
 var effect=effects.property(index);if(!effect||(p.effectName&&effect.name!==p.effectName)||(p.effectMatchName&&effect.matchName!==p.effectMatchName))throw Error('کنترل قالب تغییر کرده؛ دوباره بخوان.');
 var prop=effect;
 for(var i=0;i<p.path.length;i++){
  var n=Number(p.path[i]);if(!prop||!isFinite(n)||n!==Math.floor(n)||n<1||n>prop.numProperties)throw Error('مسیر ویژگی قالب تغییر کرده.');prop=prop.property(n);
  if(GHAFHost._templateStructural47(prop)){if(allowUnsupported)return null;throw Error('این گروه ساختاری، کنترل قابل ویرایش قالب نیست.');}
 }
 if(!prop||(p.matchName&&String(prop.matchName||'')!==p.matchName))throw Error('ویژگی قالب تغییر کرده؛ تنظیمات را دوباره بخوان.');
 if(prop.numProperties>0||typeof prop.setValue!=='function'){if(allowUnsupported)return null;throw Error('این گروه، کنترل قابل ویرایش قالب نیست.');}
 return prop;
};
GHAFHost._templateValue47=function(prop,value,replaceAnimation){
 var old=prop.value,v,i,isArray=function(x){return Object.prototype.toString.call(x)==='[object Array]';};
 if(typeof old==='number'){
  v=Number(value);if(!isFinite(v))throw Error('مقدار عددی کنترل قالب معتبر نیست.');
  if(prop.hasMin&&v<prop.minValue||prop.hasMax&&v>prop.maxValue)throw Error('مقدار کنترل قالب خارج از بازه است.');
 }else if(isArray(old)&&isArray(value)&&old.length===value.length){v=[];for(i=0;i<value.length;i++){var number=Number(value[i]);if(!isFinite(number))throw Error('مقدار رنگ یا بردار قالب معتبر نیست.');v.push(number);}}
 else throw Error('نوع مقدار کنترل قالب معتبر نیست.');
 if(replaceAnimation){if(prop.canSetExpression!==false&&prop.expression)prop.expression='';while(prop.numKeys>0)prop.removeKey(1);}
 if(prop.numKeys>0)prop.setValueAtTime(0,v);else prop.setValue(v);
};
GHAFHost._templateWalk38=function(comp,callback){var seen={};function walk(c){if(seen[c.id])return;seen[c.id]=true;callback(c);for(var i=1;i<=c.numLayers;i++)if(c.layer(i).source instanceof CompItem)walk(c.layer(i).source);}walk(comp);};
GHAFHost._cloneTemplate38=function(source,owner,created){
 var map={},pairs=[],names={},serial=String(new Date().getTime())+'_'+Math.floor(Math.random()*1000000),assetTag=String(source.comment||'').split('\n')[0];if(assetTag.indexOf('VARNA_TEMPLATE38_ASSET:')!==0)assetTag='';
 function clone(c){if(map[c.id])return map[c.id];if(pairs.length>=240)throw Error('تعداد پیش‌کامپ‌های قالب از حد پشتیبانی بیشتر است.');var copy=c.duplicate();created.push(copy);map[c.id]=copy;copy.name='__VARNA_TEMPLATE38_'+serial+'_'+owner+'_'+c.id;copy.comment='VARNA_TEMPLATE38_INSTANCE:'+serial;names[c.name]=copy.name;pairs.push({source:c,copy:copy});for(var i=1;i<=copy.numLayers;i++){var l=copy.layer(i);if(l.source instanceof CompItem)l.replaceSource(clone(l.source),false);}return copy;}
 var root=clone(source);
 // Redirect literal comp("name") links to this caption's private dependency graph.
 function visit(group,fn,depth){if(!group||depth>28)return;for(var i=1;i<=group.numProperties;i++){var p=group.property(i);if(p.numProperties)visit(p,fn,depth+1);else if(p.canSetExpression&&p.expression)fn(p);}}
 for(var i=0;i<pairs.length;i++)for(var j=1;j<=pairs[i].copy.numLayers;j++)visit(pairs[i].copy.layer(j),function(p){var ex=String(p.expression);if(/(?:^|[^\w.])comp\(\s*[^\s"']/.test(ex))throw Error('قالب پیوند پویای کامپوزیشن دارد؛ برای جداسازی این پیوند باید در AE تنظیم شود.');ex.replace(/(?:^|[^\w.])comp\(\s*(["'])([^"']+)\1\s*\)/g,function(all,quote,name){if(!names[name]){var found=false;for(var n=1;n<=app.project.numItems;n++){var candidate=app.project.item(n),tag=String(candidate.comment||'').split('\n')[0];if(candidate instanceof CompItem&&candidate.name===name&&(assetTag?tag===assetTag:tag.indexOf('VARNA_TEMPLATE38_ASSET:')===0)){clone(candidate);found=true;break;}}if(!found&&assetTag)throw Error('پیش‌کامپ وابستهٔ قالب در همین دارایی پیدا نشد: '+name);}return all;});},0);
 for(i=0;i<pairs.length;i++)for(j=1;j<=pairs[i].copy.numLayers;j++)visit(pairs[i].copy.layer(j),function(p){p.expression=String(p.expression).replace(/(^|[^\w.])comp\(\s*(["'])([^"']+)\2\s*\)/g,function(all,lead,quote,name){return names[name]?lead+'comp('+GHAFJSON.stringify(names[name])+')':all;});},0);
 return root;
};
GHAFHost._cleanTemplateCopies38=function(items){for(var pass=0;pass<items.length+1;pass++){var changed=false;for(var i=items.length-1;i>=0;i--)try{if(items[i]&&items[i].usedIn.length===0){items[i].remove();items[i]=null;changed=true;}}catch(ignore){}if(!changed)break;}};
GHAFHost._templateRaw38=function(g){return String(g.rawText!=null?g.rawText:g.text||'').replace(/[\u200E\u200F\u202A-\u202E\u2066-\u2069]/g,'').replace(/\s+/g,' ').replace(/^\s+|\s+$/g,'');};
GHAFHost._templateActive38=function(root,g,cfg,inventory){
 if(cfg.activeMode==='template')return;var raw=GHAFHost._templateRaw38(g),total=raw?raw.split(/\s+/).length:0,timing=g.timing38||[],duration=Number(g.end)-Number(g.start),mode=cfg.activeMode||'speech',indices=[],seen={},i,j;
 if(!total||!(duration>0))return;
 if(mode==='important'&&g.highlight37&&(g.highlight37.rawIndices38||g.highlight37.indices)){var selected=g.highlight37.rawIndices38||g.highlight37.indices;for(i=0;i<selected.length;i++){var index=Number(selected[i]);if(isFinite(index)&&index===Math.floor(index)&&index>=0&&index<total&&!seen['w'+index]){seen['w'+index]=true;indices.push(index);}}indices.sort(function(a,b){return a-b;});}
 if(!indices.length)for(i=0;i<total;i++)indices.push(i);
 var active=[],auto=[],wordDur=[],delay=[];
 for(i=0;i<inventory.controls.length;i++){
  var p=inventory.controls[i];/* Expression-control primary value only; exclude compositing parameters. */
  if(!p.path||p.path.length!==1||Number(p.path[0])!==1||p.kind!=='number')continue;
  var target=GHAFHost._templateProperty38(root,p,true);if(!target||typeof target.value!=='number')continue;
  if(p.effectName==='Active Word')active.push(target);if(p.effectName==='Auto Animate')auto.push(target);if(p.effectName==='Word Duration')wordDur.push(target);if(p.effectName==='Start Delay')delay.push(target);
 }
 for(i=0;i<auto.length;i++)GHAFHost._templateValue47(auto[i],0,true);
 for(i=0;i<wordDur.length;i++)GHAFHost._templateValue47(wordDur[i],root.duration/Math.max(1,total),true);
 for(i=0;i<delay.length;i++)GHAFHost._templateValue47(delay[i],0,true);
 for(i=0;i<active.length;i++){
  var prop=active[i];if(prop.canSetExpression!==false&&prop.expression)prop.expression='';while(prop.numKeys)prop.removeKey(1);
  for(j=0;j<indices.length;j++){var index=indices[j],when=j===0?0:((timing.length===total&&timing[index]&&isFinite(Number(timing[index].start)))?(Number(timing[index].start)-Number(g.start))/duration*root.duration:index/Math.max(1,total)*root.duration);when=Math.max(0,Math.min(root.duration-root.frameDuration,when));prop.setValueAtTime(when,index+1);}
  for(j=1;j<=prop.numKeys;j++)prop.setInterpolationTypeAtKey(j,KeyframeInterpolationType.HOLD,KeyframeInterpolationType.HOLD);
 }
};
GHAFHost._validateTemplate38=function(root,label){
 GHAFHost._templateWalk38(root,function(c){var times=[0,Math.min(c.duration-c.frameDuration,c.duration*.5),Math.max(0,c.duration-c.frameDuration)];function scan(group,layer,depth){if(!group||depth>28)return;for(var i=1;i<=group.numProperties;i++){var p=group.property(i);if(p.numProperties)scan(p,layer,depth+1);else if(p.canSetExpression&&p.expressionEnabled&&p.expression){for(var n=0;n<times.length;n++){p.valueAtTime(times[n],false);if(p.expressionError)throw Error('قالب '+label+' / '+layer.name+' / '+p.name+': '+p.expressionError);}}}}for(var i=1;i<=c.numLayers;i++)scan(c.layer(i),c.layer(i),0);});
};
GHAFHost._createTemplate38=function(comp,g,name){
 var cfg=g.anim.template38,spec=GHAFHost._templateSpec38(String(cfg.id)),source=GHAFHost._templateComp38(spec),created=[],copy=null,layer=null;
 if(!isFinite(Number(g.start))||!isFinite(Number(g.end))||Number(g.end)<=Number(g.start)||Number(g.start)>=comp.duration)throw Error('CAPTION_OUTSIDE_COMP');
 if(cfg.colorPolicy40==='override'&&cfg.emphasisColor&&!(cfg.emphasisTargets40&&cfg.emphasisTargets40.length))throw Error('نقش رنگ را صریحاً انتخاب کن.');var raw=GHAFHost._templateRaw38(g),words=raw?raw.split(/\s+/):[];if(spec.family==='creative'&&words.length>150)throw Error('این قالب حداکثر ۱۵۰ واژه دارد؛ کپشن را کوتاه‌تر کن.');
 try{
  copy=GHAFHost._cloneTemplate38(source,String(g.id||0),created);var info=GHAFHost._templateInventory38(copy),slots=cfg.slots&&cfg.slots.length?cfg.slots:(spec.family==='creative'&&info.slots.length?[info.slots[0].path]:[]),i,j;
  if(!slots.length){for(i=0;i<info.slots.length;i++)if(info.slots[i].preferred>0)slots.push(info.slots[i].path);if(!slots.length&&info.slots.length)slots.push(info.slots[0].path);}
  if(!slots.length)throw Error('جایگاه متن قالب انتخاب نشده.');
  for(i=0;i<slots.length;i++){var text=GHAFHost._templateLayer38(copy,slots[i]),textProps=text.property('ADBE Text Properties');if(!textProps)throw Error('جایگاه انتخاب‌شده، لایهٔ متن نیست.');var prop=textProps.property('ADBE Text Document');if(!prop||!prop.value)throw Error('متن قابل ویرایش قالب پیدا نشد.');var doc=prop.value;prop.expression='';while(prop.numKeys>0)prop.removeKey(1);var from=Math.floor(i*words.length/slots.length),to=Math.floor((i+1)*words.length/slots.length);doc.text=slots.length===1?raw:words.slice(from,to).join(' ');GHAFHost._rtl(doc,!!(g.style&&g.style.rtl));if(cfg.panelFont&&g.style)GHAFHost._font(doc,g.style.fontPS);prop.setValue(doc);}
  if(cfg.panelFont&&g.style)GHAFHost._templateWalk38(copy,function(c){for(var n=1;n<=c.numLayers;n++){var tp=c.layer(n).property('ADBE Text Properties');if(tp){var pr=tp.property('ADBE Text Document'),d=pr.value;GHAFHost._font(d,g.style.fontPS);GHAFHost._rtl(d,!!g.style.rtl);if(pr.numKeys===0)pr.setValue(d);}}});
  for(i=0;i<(cfg.parameters||[]).length;i++){var setting=cfg.parameters[i],target=GHAFHost._templateProperty38(copy,setting,true);/* RC46 snapshots may contain unsupported empty/compositing groups. */if(target)GHAFHost._templateValue47(target,setting.value,false);}
  GHAFHost._templateActive38(copy,g,cfg,info);
  if(cfg.colorPolicy40==='override'&&cfg.emphasisColor&&g.highlight37){var bindings=cfg.emphasisTargets40||[];for(i=0;i<info.controls.length;i++){var linked=false;for(var bc=0;bc<bindings.length;bc++)if(GHAFJSON.stringify(bindings[bc].layerPath)===GHAFJSON.stringify(info.controls[i].layerPath)&&Number(bindings[bc].effectIndex)===Number(info.controls[i].effectIndex)&&GHAFJSON.stringify(bindings[bc].path)===GHAFJSON.stringify(info.controls[i].path))linked=true;if(linked&&info.controls[i].kind==='color'){var colorProp=GHAFHost._templateProperty38(copy,info.controls[i]),rgb=GHAFHost._hex(g.highlight37.color),oldColor=colorProp.value;GHAFHost._templateValue47(colorProp,oldColor&&oldColor.length===4?rgb.concat([oldColor[3]]):rgb,true);}}}
  GHAFHost._validateTemplate38(copy,spec.label);
  layer=comp.layers.add(copy);layer.name=name;layer.comment='VARNA_CAPTION_ID:'+String(g.id||0)+'\nVARNA_TEMPLATE38:'+spec.id;layer.startTime=Number(g.start);layer.stretch=(Number(g.end)-Number(g.start))/copy.duration*100;layer.inPoint=Number(g.start);layer.outPoint=Math.min(comp.duration,Number(g.end));
  var tr=layer.property('ADBE Transform Group'),scale=Math.min(comp.width/copy.width,comp.height/copy.height)*100,x=comp.width*Number(g.style&&g.style.x!=null?g.style.x:50)/100,y=comp.height*Number(g.style&&g.style.y!=null?g.style.y:50)/100;
  if(g.safeBox){var b=g.safeBox;if(Math.abs((comp.width/comp.height)/Number(b.ratio)-1)>.05)throw Error('SAFE_ZONE_ASPECT_MISMATCH');scale=Math.min(comp.width*(b.x2-b.x1)/copy.width,comp.height*(b.y2-b.y1)/copy.height)*100;x=comp.width*(b.x1+b.x2)/2;y=comp.height*(b.y1+b.y2)/2;}
  tr.property('ADBE Anchor Point').setValue([copy.width/2,copy.height/2]);tr.property('ADBE Position').setValue([x,y]);tr.property('ADBE Scale').setValue([scale,scale]);return layer;
 }catch(e){if(layer)try{layer.remove();}catch(ignore){}GHAFHost._cleanTemplateCopies38(created);throw e;}
};
(function(){var create=GHAFHost._createCaption,remove=GHAFHost._deleteLayers,refresh=GHAFHost.refreshCaptionStyles,target=GHAFHost._outputComp36,list=GHAFHost.getOutputComps36;
 GHAFHost._outputComp36=function(p){var c=target(p);if(p.compId!=null||!c||String(c.comment||'').indexOf('VARNA_TEMPLATE38_')!==0)return c;for(var f=1;f<=app.project.numItems;f++){var candidate=app.project.item(f);if(candidate instanceof CompItem&&String(candidate.comment||'').indexOf('VARNA_TEMPLATE38_')!==0&&((p.fallbackCompId!=null&&candidate.id===Number(p.fallbackCompId))||(p.fallbackCompId==null&&p.fallbackCompName&&candidate.name===p.fallbackCompName)))return candidate;}var previous=GHAFHost._templateDestination38;if(previous)for(var i=1;i<=app.project.numItems;i++)if(app.project.item(i)===previous)return previous;return null;};
 GHAFHost.getOutputComps36=function(encoded){var reply=GHAFJSON.parse(list(encoded));if(!reply.ok)return GHAFJSON.stringify(reply);var keep=[],all=reply.data.items||[],hidden={};for(var j=1;j<=app.project.numItems;j++){var item=app.project.item(j);if(String(item.comment||'').indexOf('VARNA_TEMPLATE38_')===0)hidden['id'+item.id]=true;}for(var i=0;i<all.length;i++)if(!hidden['id'+all[i].id])keep.push(all[i]);reply.data.items=keep;return GHAFJSON.stringify(reply);};
 GHAFHost._createCaption=function(c,g,name){if(g.anim&&g.anim.template38&&g.anim.template38.id)return GHAFHost._createTemplate38(c,g,name);return create(c,g,name);};
 GHAFHost.refreshCaptionStyles=function(encoded){var p=GHAFHost._parse(encoded),normal=[],templated=[],i,j,c=GHAFHost._activeComp();for(i=0;i<(p.groups||[]).length;i++){var g=p.groups[i];if(g.anim&&g.anim.template38&&g.anim.template38.id)templated.push(g);else normal.push(g);}if(!templated.length)return refresh(encoded);if(!c)return GHAFHost._err('NO_COMP');var input={};for(var k in p)input[k]=p[k];input.groups=normal;var reply=GHAFJSON.parse(refresh(encodeURIComponent(GHAFJSON.stringify(input))));if(!reply.ok)return GHAFJSON.stringify(reply);var old=[],fresh=[];app.beginUndoGroup('Varna Update Imported Caption Templates');try{for(i=0;i<templated.length;i++)for(j=1;j<=c.numLayers;j++){var candidate=c.layer(j);if(String(candidate.comment||'').split('\n')[0]==='VARNA_CAPTION_ID:'+templated[i].id&&candidate.source instanceof CompItem&&String(candidate.source.comment||'').indexOf('VARNA_TEMPLATE38_INSTANCE:')===0)old.push({layer:candidate,g:templated[i]});}for(i=0;i<old.length;i++){var layer=GHAFHost._createTemplate38(c,old[i].g,old[i].layer.name);fresh.push(layer);layer.moveBefore(old[i].layer);if(old[i].layer.parent)layer.parent=old[i].layer.parent;}var removeOld=[];for(i=0;i<old.length;i++)removeOld.push(old[i].layer);GHAFHost._deleteLayers(removeOld);reply.data.updated+=fresh.length;reply.data.skipped=Math.max(0,Number(reply.data.skipped||0)-fresh.length);return GHAFJSON.stringify(reply);}catch(e){GHAFHost._deleteLayers(fresh);return GHAFHost._err(String(e));}finally{app.endUndoGroup();}};
 GHAFHost._deleteLayers=function(layers){
  var tags=[],owned=[],i,j,k;
  for(i=0;i<layers.length;i++)try{var source=layers[i].source,tag=String(source&&source.comment||'');if(source instanceof CompItem&&tag.indexOf('VARNA_TEMPLATE38_INSTANCE:')===0){var known=false;for(j=0;j<tags.length;j++)if(tags[j]===tag)known=true;if(!known)tags.push(tag);}}catch(ignore){}
  remove(layers);
  /* Literal comp() peers are not layer.source descendants. Retain the whole
   * private graph while any peer is still used by an outside composition. */
  for(i=0;i<tags.length;i++){
   var peers=[],retained=false;
   for(j=1;j<=app.project.numItems;j++){var candidate=app.project.item(j);if(candidate instanceof CompItem&&String(candidate.comment||'')===tags[i])peers.push(candidate);}
   for(j=0;j<peers.length;j++){var users=peers[j].usedIn;for(k=0;k<users.length;k++)if(String(users[k].comment||'')!==tags[i])retained=true;}
   if(!retained)for(j=0;j<peers.length;j++)owned.push(peers[j]);
  }
  GHAFHost._cleanTemplateCopies38(owned);
 };
})();

/* RC43: word-index selection; full-source native word motion and color timing. ES3. */
GHAFHost._wordSelector39=function(anim,index){
 var sel=anim.property('ADBE Text Selectors').addProperty('ADBE Text Selector'),adv=sel.property('ADBE Text Range Advanced');
 adv.property('ADBE Text Range Units').setValue(2);adv.property('ADBE Text Range Type2').setValue(3);adv.property('ADBE Text Selector Smoothness').setValue(0);
 sel.property('ADBE Text Index Start').setValue(index);sel.property('ADBE Text Index End').setValue(index+1);return sel;
};
GHAFHost._wordTimes39=function(g){
 var data=g.word39&&g.word39.times,raw=String(g.rawText!=null?g.rawText:g.text||'').replace(/[\u200e\u200f\u202a-\u202e\u2066-\u2069]/g,'').replace(/^\s+|\s+$/g,''),n=raw?raw.split(/\s+/).length:0,out=[],timing=g.timing38||[],cfg=g.anim&&g.anim.word39||{},duration=Math.max(.001,Number(g.end)-Number(g.start)),valid=cfg.timing!=='even'&&timing.length===n,i;
 for(i=0;i<n;i++)if(valid&&(!isFinite(Number(timing[i].start))||!isFinite(Number(timing[i].end))||Number(timing[i].end)<=Number(timing[i].start)||(i>0&&Number(timing[i].start)<Number(timing[i-1].start))))valid=false;
 for(i=0;i<n;i++){
  var a=valid?(Number(timing[i].start)-Number(g.start))/duration:i/Math.max(1,n),b=valid?(Number(timing[i].end)-Number(g.start))/duration:(i+1)/Math.max(1,n);
  out.push([Math.max(0,Math.min(1,a)),Math.max(0,Math.min(1,b))]);
 }
 if(cfg.order==='reverse')out.reverse();
 if(data&&data.length===n){for(i=0;i<n;i++)if(!data[i]||!isFinite(Number(data[i][0]))||!isFinite(Number(data[i][1]))||Number(data[i][1])<Number(data[i][0]))throw Error('WORD_TIMING_INVALID');else out[i]=[Math.max(0,Math.min(1,Number(data[i][0]))),Math.max(0,Math.min(1,Number(data[i][1])))];}
 return out;
};
GHAFHost._wordProgress39=function(g,index){
 var times=GHAFHost._wordTimes39(g),cfg=g.anim&&g.anim.word39||{},window=times[index]||[0,1],span=Math.max(.001,Number(g.end)-Number(g.start)),transition=Math.max(.001,Math.min(Math.max(.03,Number(cfg.duration)||.22)/span,Math.max(.001,(window[1]-window[0])*.85)));
 return 'var r=(time-inPoint)/Math.max(.001,outPoint-inPoint),q=ease(r,'+window[0]+','+Math.min(1,window[0]+transition)+',0,1);';
};
GHAFHost._wordMotion39=function(layer,g){
 var cfg=g.anim&&g.anim.word39||{},kind=String(cfg.preset||'none');if(kind==='none')return;
 var text=layer.property('ADBE Text Properties'),animators=text.property('ADBE Text Animators'),times=GHAFHost._wordTimes39(g),distance=Math.max(0,Math.min(500,Number(cfg.distance)||0)),i;
 if(times.length>300)throw Error('حرکت کلمه‌ای برای هر کپشن حداکثر ۳۰۰ واژه دارد؛ کپشن را تقسیم کن.');
 if(kind==='type'){
  var an=animators.addProperty('ADBE Text Animator');an.name='VARNA WORD39 type';an.property('ADBE Text Animator Properties').addProperty('ADBE Text Opacity').setValue(0);
  var sel=an.property('ADBE Text Selectors').addProperty('ADBE Text Selector'),adv=sel.property('ADBE Text Range Advanced');adv.property('ADBE Text Range Units').setValue(1);adv.property('ADBE Text Range Type2').setValue(1);adv.property('ADBE Text Selector Smoothness').setValue(0);
  var str=String(g.text||'').replace(/[\r\n\u200e\u200f\u202a-\u202e\u2066-\u2069\u064b-\u065f\u0670]/g,''),count=Math.max(1,str.length),dur=Math.max(.03,Math.min(Number(cfg.duration)||.22,Math.max(.03,Number(g.end)-Number(g.start)))),fraction=Math.min(1,dur/Math.max(.001,Number(g.end)-Number(g.start))),expr='var q=Math.max(0,Math.min(1,(time-inPoint)/Math.max(.001,(outPoint-inPoint)*'+fraction+'))),p=Math.floor(q*'+count+')/'+count+'*100;';
  if(cfg.order==='reverse'){sel.property('ADBE Text Percent Start').setValue(0);sel.property('ADBE Text Percent End').expression=expr+'100-p;';}else{sel.property('ADBE Text Percent End').setValue(100);sel.property('ADBE Text Percent Start').expression=expr+'p;';}return;
 }
 for(i=0;i<times.length;i++){
  var a=animators.addProperty('ADBE Text Animator');a.name='VARNA WORD39 '+i;var props=a.property('ADBE Text Animator Properties'),progress=GHAFHost._wordProgress39(g,i);
  props.addProperty('ADBE Text Opacity').expression=progress+'q*100;';
  if(kind==='drop'||kind==='rise'||kind==='left'||kind==='right'){var x=kind==='left'?-distance:kind==='right'?distance:0,y=kind==='drop'?-distance:kind==='rise'?distance:0;props.addProperty('ADBE Text Position 3D').expression=progress+'['+x+'*(1-q),'+y+'*(1-q),0];';}
  if(kind==='pop')props.addProperty('ADBE Text Scale 3D').expression=progress+'var s=q<.75?linear(q,0,.75,65,108):linear(q,.75,1,108,100);[s,s,100];';
  GHAFHost._wordSelector39(a,i);
 }
};
GHAFHost._wordHighlight39=function(layer,h,g){
 var text=layer.property('ADBE Text Properties'),animators=text.property('ADBE Text Animators'),cfg=g&&g.anim&&g.anim.word39||{},indices=h&&h.indices||[],mode=String(cfg.colorMode||'static'),i;
 for(i=animators.numProperties;i>=1;i--){var name=String(animators.property(i).name);if(name.indexOf('VARNA EMPHASIS37 ')===0||name.indexOf('VARNA EMPHASIS39 ')===0)animators.property(i).remove();}
 if(mode==='none')return;
 if(cfg.colorTarget==='all'&&g){indices=[];var all=GHAFHost._wordTimes39(g);for(i=0;i<all.length;i++)indices.push(i);}
 var seen={},times=g?GHAFHost._wordTimes39(g):null,color=GHAFHost._hex(h&&h.color||cfg.color||'#F8CB67'),base=GHAFHost._hex(g&&g.style&&g.style.fill||'#FFFFFF'),scale=Math.max(80,Math.min(140,Number(h&&h.scale||100)));
 for(i=0;i<indices.length;i++){
  var index=Number(indices[i]);if(!isFinite(index)||index<0||index!==Math.floor(index)||times&&index>=times.length)throw Error('HIGHLIGHT_WORD_INDEX_INVALID');if(seen['w'+index])continue;seen['w'+index]=true;
  var an=animators.addProperty('ADBE Text Animator');an.name='VARNA EMPHASIS39 '+index;var props=an.property('ADBE Text Animator Properties'),p=props.addProperty('ADBE Text Fill Color'),when=times&&times[index],cond='true';
  if(when&&(mode==='active'||mode==='spoken'))cond='r>='+when[0]+(mode==='active'?'&&r<'+when[1]:'');
  var expression='var r=(time-inPoint)/Math.max(.001,outPoint-inPoint),on=('+cond+');';if(mode==='active'||mode==='spoken')p.expression=expression+'on?'+GHAFJSON.stringify(color)+':'+GHAFJSON.stringify(base)+';';else p.setValue(color);
  if(scale!==100){var sp=props.addProperty('ADBE Text Scale 3D');if(mode==='active'||mode==='spoken')sp.expression=expression+'var s=on?'+scale+':100;[s,s,100];';else sp.setValue([scale,scale,100]);}
  GHAFHost._wordSelector39(an,index);
 }
};
(function(){var motion=GHAFHost._animTransform,refresh=GHAFHost.refreshCaptionStyles;
 GHAFHost._animTransform=function(layer,g,a){if(a&&a.word39&&a.word39.preset&&a.word39.preset!=='none')return GHAFHost._wordMotion39(layer,g);return motion(layer,g,a);};
 /* Style updates use the same word schedule as new output, without depending on global preview state. */
 GHAFHost.refreshCaptionStyles=function(encoded){var p=GHAFHost._parse(encoded);for(var i=0;i<(p.groups||[]).length;i++)if(p.groups[i].anim&&p.groups[i].anim.word39)p.updateMotion=true;return refresh(encodeURIComponent(GHAFJSON.stringify(p)));};
})();

/* Old preview signatures do not encode renderer behavior; rebuild once after upgrade. */
if(GHAFHost._livePreviewRevision39!==GHAFHost._bridgeRevision){GHAFHost._livePreviewRecords={};GHAFHost._livePreviewRevision39=GHAFHost._bridgeRevision;}

var VarnaKinetic40 =
/* One ES3 geometry/timing implementation for CEP preview and the AE host. */
(function(root,factory){var api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.VarnaKinetic40=api;return api;})(typeof window!=='undefined'?window:this,function(){
function clamp(x,a,b){return Math.max(a,Math.min(b,x));}function num(x,d){x=Number(x);return isFinite(x)?x:d;}
function key(s){return String(s||'').replace(/[ـ\u200e\u200f\u202a-\u202e\u2066-\u2069]/g,'').replace(/ي/g,'ی').replace(/ك/g,'ک').toLowerCase().replace(/^[\s.,!?؟،؛:«»"'()[\]{}]+|[\s.,!?؟،؛:«»"'()[\]{}]+$/g,'');}
function words(s){return String(s||'').match(/\S+/g)||[];}
function config(c){c=c||{};return {enabled:c.enabled!==false,pattern:/^(zigzag|stairs|center|left|right|free)$/.test(c.pattern)?c.pattern:'zigzag',group:clamp(Math.floor(num(c.group,1)),1,8),entry:/^(none|type|rise|drop|pop|fade|slide|spring)$/.test(c.entry)?c.entry:'type',timing:c.timing==='even'?'even':'speech',hold:c.hold==='single'?'single':'cumulative',reveal:clamp(num(c.reveal,.3),.03,2),gap:clamp(num(c.gap,1.35),1,3),spread:clamp(num(c.spread,.32),0,1),area:{x:clamp(num(c.area&&c.area.x,50),5,95),y:clamp(num(c.area&&c.area.y,50),5,95),w:clamp(num(c.area&&c.area.w,72),15,96),h:clamp(num(c.area&&c.area.h,64),15,94)},segments:c.segments||null,customText:String(c.customText||''),useKeywords:c.useKeywords!==false};}
function split(text,size,phrases){var ts=words(text),out=[],units=[],p=[],i,j,k,limit=Math.max(1,Math.floor(Number(size)||1));for(i=0;i<(phrases||[]).length;i++)p.push(words(phrases[i]));p.sort(function(a,b){return b.length-a.length;});for(i=0;i<ts.length;){var count=1;for(j=0;j<p.length;j++){var match=p[j].length>0&&i+p[j].length<=ts.length;for(k=0;match&&k<p[j].length;k++)if(key(ts[i+k])!==key(p[j][k]))match=false;if(match){count=p[j].length;break;}}if(/^(آقای|اقای|خانم|دکتر|مهندس|mr|mrs|ms|dr)$/i.test(key(ts[i]))&&i+1<ts.length)count=Math.max(2,count);units.push({from:i,to:i+count});i+=count;}var pending=null;for(i=0;i<units.length;i++){var u=units[i];if(pending&&u.to-pending.from>limit){out.push(pending);pending=null;}if(!pending)pending={from:u.from,to:u.to};else pending.to=u.to;}if(pending)out.push(pending);return out;}
function manual(text,lines){var ts=words(text),rows=String(lines||'').split(/[\r\n]+/),out=[],at=0,i,j;for(i=0;i<rows.length;i++){var row=words(rows[i]);if(!row.length)continue;for(j=0;j<row.length;j++)if(at+j>=ts.length||key(row[j])!==key(ts[at+j]))throw Error('سطرها باید تمام واژه‌های متن فعلی را به همان ترتیب داشته باشند.');out.push({from:at,to:at+row.length});at+=row.length;}if(at!==ts.length)throw Error('بخشی از متن جا افتاده؛ هیچ واژه‌ای حذف نمی‌شود.');return out;}
function motion45(value,c){var m=value||{};return {entry:/^(inherit|none|type|rise|drop|pop|fade|slide|spring)$/.test(m.entry)?m.entry:'inherit',out:/^(none|fade|rise|drop|pop|slide)$/.test(m.out)?m.out:'none',duration:m.duration==null?c.reveal:clamp(num(m.duration,c.reveal),.03,2),outDuration:clamp(num(m.outDuration,.2),.03,2),delay:clamp(num(m.delay,0),0,20),visible:clamp(num(m.visible,0),0,120)};}
function background45(value){var b=value||{};return {mode:/^(inherit|none|solid|gradient)$/.test(b.mode)?b.mode:'inherit',fill:/^#[0-9a-f]{6}$/i.test(b.fill||'')?b.fill:'#182031',fill2:/^#[0-9a-f]{6}$/i.test(b.fill2||'')?b.fill2:'#345484',angle:clamp(num(b.angle,135),0,360),opacity:clamp(num(b.opacity,92),0,100),padding:clamp(num(b.padding,16),0,160),round:clamp(num(b.round,12),0,200),motion:/^(none|fade|pop|slide|reveal|softScale|centerReveal)$/.test(b.motion)?b.motion:'none',duration:clamp(num(b.duration,.25),.03,3),delay:clamp(num(b.delay,0),0,10),out:/^(none|fade|scaleOut|splitClose|slideDown|slideLeftOut|slideRightOut)$/.test(b.out)?b.out:'none',outDuration:clamp(num(b.outDuration,.2),.03,3)};}
function look48(value){var v=value||{};return {tracking:v.tracking==null?null:clamp(num(v.tracking,0),-200,600),stroke:/^(inherit|on|off)$/.test(v.stroke)?v.stroke:'inherit',strokeHex:/^#[0-9a-f]{6}$/i.test(v.strokeHex||'')?v.strokeHex:'#101722',strokeWidth:clamp(num(v.strokeWidth,2),.1,20)};}
function individual48(text,segments){var ts=words(text),out=[],i,j,k;if(ts.length>32)throw Error('برای ویرایش مستقل، صحنه را به حداکثر ۳۲ کلمه تقسیم کن.');for(i=0;i<ts.length;i++){var original=null;for(j=0;j<(segments||[]).length;j++)if(i>=segments[j].from&&i<segments[j].to){original=segments[j];break;}var p={};if(original)for(k in original)if(Object.prototype.hasOwnProperty.call(original,k))p[k]=original[k];p.from=i;p.to=i+1;if(original&&original.to-original.from>1){delete p.x;delete p.y;}out.push(p);}return out;}
function pieceBackground(base,p){var b=background45(p&&p.background45),result={},k;for(k in base)if(Object.prototype.hasOwnProperty.call(base,k))result[k]=base[k];if(b.mode==='inherit')return result;if(b.mode==='none'){result.enabled=false;return result;}return {enabled:true,engine:'native',style:'solid',hex:b.fill,opacity:b.opacity,padding:b.padding,round:b.round,roundMode:'circular',gradientEnabled:b.mode==='gradient',gradientColor2:b.fill2,gradientAngle:b.angle,gradientBalance:0,borderOpacity:0,borderWidth:0,shadowOpacity:0,highlightOpacity:0,glowEnabled:false,aeOptics:false,independentMotion:true,motion:b.motion,motionDur:b.duration,motionDelay:b.delay,outPreset:b.out,outDur:b.outDuration};}
function resolve(g,options,phrases){var c=config(options),ts=words(g.rawText!=null?g.rawText:g.text),rows=c.customText?manual(ts.join(' '),c.customText):c.segments||split(ts.join(' '),c.group,phrases),at=0,start=num(g.start,0),duration=num(g.end,0)-start,timing=g.timing38||[],valid=c.timing==='speech'&&timing.length===ts.length,out=[],i;
if(!(duration>0))throw Error('مدت صحنه معتبر نیست.');if(!rows.length||rows.length>32)throw Error('هر صحنه باید ۱ تا ۳۲ قطعه داشته باشد؛ متن را کوتاه‌تر کن.');for(i=0;i<timing.length&&valid;i++)if(!isFinite(Number(timing[i].start))||!isFinite(Number(timing[i].end))||Number(timing[i].end)<=Number(timing[i].start)||(i&&Number(timing[i].start)<Number(timing[i-1].start)))valid=false;
for(i=0;i<rows.length;i++){var s=rows[i],from=Number(s.from),to=Number(s.to);if(from!==at||from!==Math.floor(from)||to!==Math.floor(to)||to<=from||to>ts.length)throw Error('تقسیم‌بندی با متن فعلی یکسان نیست؛ سطرها را دوباره بساز.');at=to;var a=valid?clamp((Number(timing[from].start)-start)/duration,0,.99):i/rows.length*.8,b=valid?clamp((Number(timing[to-1].end)-start)/duration,a,1):(i+1)/rows.length*.8;out.push({from:from,to:to,text:ts.slice(from,to).join(' '),start:a,speechEnd:b,end:1,x:s.x!=null?clamp(num(s.x,.5),0,1):null,y:s.y!=null?clamp(num(s.y,.5),0,1):null,scale:clamp(num(s.scale,1),.5,2),color:/^#[0-9a-f]{6}$/i.test(s.color||'')?s.color:null,rotation:clamp(num(s.rotation,0),-30,30),fontPS:String(s.fontPS||'').slice(0,128),look48:look48(s.look48),motion45:motion45(s.motion45,c),background45:background45(s.background45)});}
if(at!==ts.length)throw Error('تمام کلمات باید در صحنه باشند.');for(i=0;i<out.length;i++)out[i].start=clamp(out[i].start+out[i].motion45.delay/duration,0,.99);for(i=0;i<out.length;i++){out[i].end=c.hold==='single'&&i+1<out.length?Math.max(out[i].start+.001,out[i+1].start):1;if(out[i].motion45.visible>0)out[i].end=Math.min(1,Math.max(out[i].start+.001,out[i].start+out[i].motion45.visible/duration));}return {pieces:out,config:c,timed:valid&&g.timingQuality40!=='cue',timingSource:valid?(g.timingQuality40||'word'):'even',duration:duration};}
function bounds(c,w,h,safe){var a=c.area,b={x1:clamp((a.x-a.w/2)/100,0,1)*w,x2:clamp((a.x+a.w/2)/100,0,1)*w,y1:clamp((a.y-a.h/2)/100,0,1)*h,y2:clamp((a.y+a.h/2)/100,0,1)*h};if(safe){b.x1=Math.max(b.x1,num(safe.x1,0)*w);b.x2=Math.min(b.x2,num(safe.x2,1)*w);b.y1=Math.max(b.y1,num(safe.y1,0)*h);b.y2=Math.min(b.y2,num(safe.y2,1)*h);}if(b.x2-b.x1<w*.08||b.y2-b.y1<h*.05)throw Error('ناحیهٔ تایپوگرافی در محدودهٔ امن جا نمی‌شود.');return b;}
function layout(r,width,height,m,safe){var c=r.config,b=bounds(c,width,height,safe),n=r.pieces.length,w=b.x2-b.x1,h=b.y2-b.y1,maxW=0,totalH=0,i;for(i=0;i<n;i++){var angle=r.pieces[i].rotation*Math.PI/180,ww=m[i].width*r.pieces[i].scale,hh=m[i].height*r.pieces[i].scale;maxW=Math.max(maxW,Math.abs(Math.cos(angle))*ww+Math.abs(Math.sin(angle))*hh);totalH+=(Math.abs(Math.sin(angle))*ww+Math.abs(Math.cos(angle))*hh)*(i+1<n?c.gap:1);}var reserve=/^(zigzag|stairs)$/.test(c.pattern)?1-c.spread*.65:1,scale=Math.min(1,w*Math.max(.35,reserve)/Math.max(1,maxW),h/Math.max(1,totalH));if(scale<.22)throw Error('برای خوانایی، متن را به صحنه‌های کوتاه‌تر تقسیم کن.');var y=(b.y1+b.y2-totalH*scale)/2,out=[];for(i=0;i<n;i++){var p=r.pieces[i],mw=m[i].width*p.scale*scale,mh=m[i].height*p.scale*scale,x=(b.x1+b.x2)/2,cy=y+mh/2;if(c.pattern==='zigzag')x+=(i%2?1:-1)*w*c.spread/2;if(c.pattern==='stairs')x+=(n===1?0:i/(n-1)-.5)*w*c.spread;if(c.pattern==='left')x=b.x1+mw/2;if(c.pattern==='right')x=b.x2-mw/2;if(p.x!=null)x=b.x1+p.x*w;if(p.y!=null)cy=b.y1+p.y*h;var a=p.rotation*Math.PI/180,rw=Math.abs(Math.cos(a))*mw+Math.abs(Math.sin(a))*mh,rh=Math.abs(Math.sin(a))*mw+Math.abs(Math.cos(a))*mh;cy=y+rh/2;if(p.y!=null)cy=b.y1+p.y*h;out.push({x:clamp(x,b.x1+rw/2,b.x2-rw/2),y:clamp(cy,b.y1+rh/2,b.y2-rh/2),scale:scale*p.scale,rotation:p.rotation,width:mw,height:mh});y+=rh*c.gap;}return {items:out,bounds:b,scale:scale};}
return {config:config,key:key,words:words,split:split,manual:manual,resolve:resolve,layout:layout,bounds:bounds,motion45:motion45,background45:background45,pieceBackground:pieceBackground,look48:look48,individual48:individual48};
});

/* Avoid a RegExp literal here: the reported native loader stopped on this line. */
GHAFHost._rtlText40=function(text,rtl){
 if(!rtl)return text;var value=String(text),out='',i=0,start,c;
 function word(ch){var n=ch.charCodeAt(0);return (n>=48&&n<=57)||(n>=65&&n<=90)||(n>=97&&n<=122)||(n>=1776&&n<=1785)||(n>=1632&&n<=1641);}
 while(i<value.length){if(!word(value.charAt(i))){out+=value.charAt(i++);continue;}start=i;
  while(i<value.length){if(word(value.charAt(i))){i++;continue;}c=value.charAt(i);if('._:/%+-'.indexOf(c)>=0&&i+1<value.length&&word(value.charAt(i+1))){i++;continue;}break;}
  out+='\u2066'+value.substring(start,i)+'\u2069';
 }return out;
};
GHAFHost._isOwnedCaptionSource40=function(s){return typeof CompItem!=='undefined'&&s instanceof CompItem&&/^(VARNA_KINETIC40_INSTANCE:|VARNA_TEMPLATE38_INSTANCE:|VARNA_SMART_CAPTION)/.test(String(s.comment||''));};
GHAFHost._createKinetic40=function(c,g,name){
 var scene=VarnaKinetic40.resolve(g,g.anim.kinetic40,g.protected40||[]),span=Number(g.end)-Number(g.start),copy=null,layer=null,i;
 if(!isFinite(Number(g.start))||span<=0||Number(g.start)>=c.duration)throw Error('CAPTION_OUTSIDE_COMP');
 if(g.safeBox&&Math.abs(c.width/c.height/Number(g.safeBox.ratio)-1)>.05)throw Error('SAFE_ZONE_ASPECT_MISMATCH');
 try{
  copy=app.project.items.addComp('__VARNA_SCENE40_'+g.id+'_'+new Date().getTime(),c.width,c.height,c.pixelAspect||1,Math.max(c.frameDuration,span),c.frameRate);copy.comment='VARNA_KINETIC40_INSTANCE:'+g.id;
  var texts=[],data=[],measures=[],backgrounds=[],base=GHAFJSON.parse(GHAFJSON.stringify(g.style||{})),selected=g.highlight37&&(g.highlight37.rawIndices38||g.highlight37.indices)||[];
  for(i=0;i<scene.pieces.length;i++){
   var p=scene.pieces[i],st=GHAFJSON.parse(GHAFJSON.stringify(base)),bg=VarnaKinetic40.pieceBackground(g.bg||{},p);backgrounds.push(bg);
   st.justifyMode='none';st.align=0;st.maxLines=0;st.fitWidthPct=100;st.boxWidthPct=100;st.rtl=/[\u0600-\u06ff]/.test(p.text);if(p.fontPS)st.fontPS=p.fontPS;if(p.look48.tracking!=null)st.tracking=p.look48.tracking;if(p.look48.stroke!=='inherit'){st.stroke=p.look48.stroke==='on';st.strokeHex=p.look48.strokeHex;st.strokeWidth=p.look48.strokeWidth;}if(p.color){st.fill=p.color;st.fillMode='solid';}
   // Measure complete native text first; create its background once after final placement.
   var d={id:String(g.id)+'_'+i,text:GHAFHost._rtlText40(p.text,st.rtl),rawText:p.text,start:0,end:copy.duration,style:st,bg:{enabled:false},anim:{mode:'simple',preset:'none',outPreset:'none',typeSound:false,syncMode:'separate'},highlight37:null},l=GHAFHost._createTextLayer(copy,d,'قطعه '+(i+1)+' · '+p.text),r=l.sourceRectAtTime(0,false);
   texts.push(l);data.push(d);var factor=1,pad=bg.enabled?Math.max(0,Number(bg.padding)||0)*2:0;
   if(scene.config.useKeywords)for(var hi=0;hi<selected.length;hi++)if(Number(selected[hi])>=p.from&&Number(selected[hi])<p.to)factor=Math.max(1,Math.min(1.4,Number(g.highlight37.scale||100)/100));
   measures.push({width:Math.max(1,r.width)*factor+pad,height:Math.max(Number(st.size)||72,r.height)*factor+pad});
  }
  var plan=VarnaKinetic40.layout(scene,c.width,c.height,measures,g.safeBox),handle=copy.layers.addNull();handle.name='کنترل کل صحنه · جابه‌جایی و اندازه';handle.comment='VARNA_KINETIC40_HANDLE';handle.inPoint=0;handle.outPoint=copy.duration;handle.property('ADBE Transform Group').property('ADBE Anchor Point').setValue([0,0]);handle.property('ADBE Transform Group').property('ADBE Position').setValue([0,0]);
  for(i=0;i<texts.length;i++){
   var p=scene.pieces[i],l=texts[i],d=data[i],pos=plan.items[i],motion=p.motion45,kind=motion.entry==='inherit'?scene.config.entry:motion.entry;
   var available=Math.max(copy.frameDuration,(p.end-p.start)*span),next=i+1<scene.pieces.length?scene.pieces[i+1].start:1;
   var pacing=Math.max(copy.frameDuration,Math.min(available,Math.max(copy.frameDuration,(next-p.start)*span)));
   var reveal=Math.max(.03,Math.min(motion.duration*Math.max(1,(p.to-p.from)*.65),pacing*.85));
   d.start=p.start*span;d.end=Math.max(d.start+copy.frameDuration,Math.min(copy.duration,p.end*span));
   d.style.size=Math.max(1,(Number(base.size)||72)*pos.scale);if(d.style.stroke)d.style.strokeWidth=(Number(d.style.strokeWidth)||2)*pos.scale;if(Number(base.leading)>0)d.style.leading=Number(base.leading)*pos.scale;
   d.style.x=pos.x/c.width*100;d.style.y=pos.y/c.height*100;d.bg=GHAFJSON.parse(GHAFJSON.stringify(backgrounds[i]));if(d.bg.enabled&&d.bg.padding!=null)d.bg.padding=Number(d.bg.padding)*pos.scale;if(d.bg.enabled&&d.bg.round!=null)d.bg.round=Number(d.bg.round)*pos.scale;
   l.inPoint=d.start;l.outPoint=d.end;GHAFHost._resetCaptionMotion(l,d);GHAFHost._applyTextStyle(l,d.style,d.text);
   var rr=l.sourceRectAtTime(d.start,false),tr=l.property('ADBE Transform Group');tr.property('ADBE Anchor Point').setValue([rr.left+rr.width/2,rr.top+rr.height/2]);tr.property('ADBE Rotate Z').setValue(pos.rotation);
   d.anim={mode:'simple',preset:kind==='type'?'none':kind,outPreset:motion.out==='none'?'none':'mirror:'+motion.out,inDur:reveal,outDur:Math.min(motion.outDuration,available*.4),strength:Math.max(12,d.style.size*.5),typeSound:false,syncMode:'separate',word39:{preset:kind==='type'?'type':'none',order:'forward',timing:'even',duration:reveal,distance:30,colorMode:'static',colorTarget:'important'}};
   GHAFHost._addAnimMarkers(l,d,d.anim);GHAFHost._animTransform(l,d,d.anim);GHAFHost._applyOutro(l,d,d.anim);
   if(kind==='spring'){var springExpr=GHAFHost._markerProgressExpr('IN','IN',d.start,d.start+reveal,false)+"var u=q>=1?1:1-Math.exp(-7*q)*Math.cos(12*q);var sf=.88+.12*u;";if(motion.out==='pop')springExpr+=GHAFHost._markerProgressExpr('OUT','OUT',Math.max(d.start,d.end-d.anim.outDur),d.end,false)+'sf*=1-.14*q;';tr.property('ADBE Scale').expression=springExpr+'[value[0]*sf,value[1]*sf];';}
   var local=[];if(scene.config.useKeywords)for(var j=0;j<selected.length;j++)if(Number(selected[j])>=p.from&&Number(selected[j])<p.to)local.push(Number(selected[j])-p.from);
   d.highlight37={indices:local,color:p.color||g.highlight37&&g.highlight37.color||'#F8CB67',scale:g.highlight37&&g.highlight37.scale||100};GHAFHost._highlight37(l,d.highlight37,d);
   if(!GHAFHost._applyBg(l,d.bg))throw Error('BACKGROUND_APPLY_FAILED');GHAFHost._applyBgVendorEffects(l,d.bg);l.parent=handle;
   GHAFHost._finalizeBackground27(l,d.bg,d);
   // Independent backgrounds keep design rotation and follow the scene handle.
   for(var bi=1;bi<=copy.numLayers;bi++){var bgLayer=copy.layer(bi);if(String(bgLayer.comment||'')==='VARNA_BG_ANCHOR:'+l.name){var locked=bgLayer.locked;bgLayer.locked=false;bgLayer.parent=handle;bgLayer.property('ADBE Transform Group').property('ADBE Rotate Z').setValue(pos.rotation);bgLayer.locked=locked;}}
  }
  GHAFHost._validateTemplate38(copy,'تایپوگرافی');layer=c.layers.add(copy);layer.name=name;layer.comment='VARNA_CAPTION_ID:'+g.id+'\nVARNA_KINETIC40:'+g.id;layer.startTime=Number(g.start);layer.inPoint=Number(g.start);layer.outPoint=Math.min(c.duration,Number(g.end));
  var t=layer.property('ADBE Transform Group');t.property('ADBE Anchor Point').setValue([c.width/2,c.height/2]);t.property('ADBE Position').setValue([c.width/2,c.height/2]);t.property('ADBE Scale').setValue([100,100]);layer.stretch=100;/* The child duration already equals the cue span; native playback needs no Time Remap. */GHAFHost._kineticDestination40=c;return layer;
 }catch(e){if(layer)try{layer.remove();}catch(ignore){}if(copy)try{if(copy.usedIn.length===0)copy.remove();}catch(ignore2){}throw e;}
};
GHAFHost._captionBlock40=function(c,root){var out=[root],meta=GHAFHost._buildMeta37?GHAFHost._buildMeta37(root):null;for(var i=1;i<=c.numLayers;i++){var l=c.layer(i);if(l===root)continue;var m=GHAFHost._buildMeta37?GHAFHost._buildMeta37(l):null;if(meta&&m&&meta.block===m.block){out.push(l);continue;}if(/^__GHAF_NATIVE_BG__|^__GHAF_GLASS_BLUR__|^__GHAF_TEMPLATE_BG__|^__GHAF_TYPE_MEASURE__|^__VARNA_BG_ANCHOR__/.test(String(l.name||''))&&(l.parent===root||String(l.name).slice(-String(root.name).length)===String(root.name)))out.push(l);}return out;};
GHAFHost.openKineticCaption40=function(encoded){var p=GHAFHost._parse(encoded),c=GHAFHost._outputComp36(p);if(!c)return GHAFHost._err('NO_COMP');for(var i=1;i<=c.numLayers;i++){var l=c.layer(i);if(String(l.comment||'').split('\n')[0]==='VARNA_CAPTION_ID:'+p.id&&l.source instanceof CompItem&&String(l.source.comment||'').indexOf('VARNA_KINETIC40_INSTANCE:')===0){l.source.openInViewer();return GHAFHost._ok({name:l.source.name,opened:true});}}return GHAFHost._err('ابتدا خروجی این صحنه را بساز.');};
(function(){var create=GHAFHost._createCaption,remove=GHAFHost._deleteLayers,refresh=GHAFHost.refreshCaptionStyles,target=GHAFHost._outputComp36,list=GHAFHost.getOutputComps36;
GHAFHost._createCaption=function(c,g,name){if(g.anim&&g.anim.kinetic40&&g.anim.kinetic40.enabled!==false)return GHAFHost._createKinetic40(c,g,name);return create(c,g,name);};
GHAFHost._deleteLayers=function(layers){var comps=[],i;for(i=0;i<layers.length;i++)try{if(layers[i].source instanceof CompItem&&String(layers[i].source.comment||'').indexOf('VARNA_KINETIC40_INSTANCE:')===0)comps.push(layers[i].source);}catch(ignore){}remove(layers);for(i=0;i<comps.length;i++)try{if(comps[i].usedIn.length===0)comps[i].remove();}catch(ignore2){}};
GHAFHost._outputComp36=function(p){var c=target(p);if(p.compId!=null||!c||String(c.comment||'').indexOf('VARNA_KINETIC40_INSTANCE:')!==0)return c;for(var i=1;i<=app.project.numItems;i++){var candidate=app.project.item(i);if(candidate instanceof CompItem&&!/^(VARNA_KINETIC40_INSTANCE:|VARNA_TEMPLATE38_)/.test(String(candidate.comment||''))&&((p.fallbackCompId!=null&&candidate.id===Number(p.fallbackCompId))||(p.fallbackCompId==null&&p.fallbackCompName&&candidate.name===p.fallbackCompName)||candidate===GHAFHost._kineticDestination40))return candidate;}return null;};
GHAFHost.getOutputComps36=function(encoded){var r=GHAFJSON.parse(list(encoded));if(!r.ok)return GHAFJSON.stringify(r);var hidden={},keep=[],i;for(i=1;i<=app.project.numItems;i++){var c=app.project.item(i);if(String(c.comment||'').indexOf('VARNA_KINETIC40_INSTANCE:')===0)hidden['c'+c.id]=true;}for(i=0;i<(r.data.items||[]).length;i++)if(!hidden['c'+r.data.items[i].id])keep.push(r.data.items[i]);r.data.items=keep;return GHAFJSON.stringify(r);};
GHAFHost.refreshCaptionStyles=function(encoded){var p=GHAFHost._parse(encoded),c=GHAFHost._activeComp();if(!c)return refresh(encoded);var normal=[],rebuild=[],before=GHAFHost._layerSet(c),old=[],i,j;for(i=0;i<(p.groups||[]).length;i++){var g=p.groups[i],roots=[];for(j=1;j<=c.numLayers;j++){var l=c.layer(j);if(String(l.comment||'').split('\n')[0]==='VARNA_CAPTION_ID:'+g.id)roots.push(l);}var complex=!!(g.anim&&(g.anim.kinetic40&&g.anim.kinetic40.enabled!==false||g.anim.template38&&g.anim.template38.id));for(j=0;j<roots.length;j++)if(GHAFHost._isOwnedCaptionSource40(roots[j].source))complex=true;if(complex){for(j=0;j<roots.length;j++)rebuild.push({g:g,root:roots[j]});}else normal.push(g);}
var input={};for(var k in p)input[k]=p[k];input.groups=normal;if(!rebuild.length)return refresh(encodeURIComponent(GHAFJSON.stringify(input)));app.beginUndoGroup('Varna Replace Caption Renderer');try{for(i=0;i<rebuild.length;i++){var item=rebuild[i],prior=GHAFHost._layerSet(c),made=GHAFHost._createCaption(c,item.g,item.root.name),block=GHAFHost._newLayers(c,prior);made.comment='VARNA_CAPTION_ID:'+item.g.id+'\n'+String(made.comment||'').replace(/^VARNA_CAPTION_ID:[^\n]*\n?/,'');GHAFHost._finishOutputBlock35(c,block,item.g,null);made.moveBefore(item.root);if(item.root.parent)made.parent=item.root.parent;made.locked=item.root.locked;old=old.concat(GHAFHost._captionBlock40(c,item.root));}var result=GHAFJSON.parse(refresh(encodeURIComponent(GHAFJSON.stringify(input))));if(!result.ok)throw Error(result.error);GHAFHost._deleteLayers(old);result.data.updated=Number(result.data.updated||0)+rebuild.length;return GHAFJSON.stringify(result);}catch(e){GHAFHost._deleteLayers(GHAFHost._newLayers(c,before));return GHAFHost._err(String(e));}finally{app.endUndoGroup();}};
})();
/* RC43: read-only preflight and receipts for uncertain CEP replies. ES3. */
GHAFHost.checkOutput=function(encoded){var c=GHAFHost._outputComp36(GHAFHost._parse(encoded));return GHAFHost._ok({comp:!!c,id:c?c.id:null,name:c?c.name:'',compName:c?c.name:'',duration:c?c.duration:0,frameRate:c?c.frameRate:0,width:c?c.width:0,height:c?c.height:0,textBox2:null,readOnly41:true});};
GHAFHost.detectTextBox2=function(){try{var found=false,list=app.effects||[];for(var i=0;i<list.length;i++){var d=String(list[i].displayName||''),m=String(list[i].matchName||'');if(d==='TextBox 2'||d==='TextBox2'||m==='TextBox 2'||m==='TextBox2'){found=true;break;}}return GHAFHost._ok({installed:found,readOnly41:true});}catch(e){return GHAFHost._err(String(e));}};
GHAFHost._newLayers=function(c,old){var known={},fallback=[],out=[],i,j,id,l;for(i=0;i<old.length;i++){try{id=old[i].id;}catch(e){id=null;}if(id!=null)known['l'+id]=true;else fallback.push(old[i]);}for(i=1;i<=c.numLayers;i++){l=c.layer(i);try{id=l.id;}catch(e2){id=null;}if(id!=null){if(!known['l'+id])out.push(l);}else{var found=false;for(j=0;j<fallback.length;j++)if(fallback[j]===l){found=true;break;}if(!found)out.push(l);}}return out;};
(function(){var begin=GHAFHost.beginOutputSession,commit=GHAFHost.commitOutputSession,abort=GHAFHost.abortOutputSession;
GHAFHost.beginOutputSession=function(encoded){var p=GHAFHost._parse(encoded),s=GHAFHost._outputSession;if(p.requestId41&&s&&s.requestId41===p.requestId41)return GHAFHost._ok({token:s.token});var result=begin(encoded),r=GHAFJSON.parse(result);if(r.ok&&GHAFHost._outputSession)GHAFHost._outputSession.requestId41=p.requestId41||null;return result;};
GHAFHost.commitOutputSession=function(encoded){var s=GHAFHost._outputSession,result=commit(encoded),r=GHAFJSON.parse(result);if(r.ok&&s)GHAFHost._outputReceipt41={token:s.token,requestId41:s.requestId41,status:'committed',created:s.count};return result;};
GHAFHost.abortOutputSession=function(encoded){var s=GHAFHost._outputSession,result=abort(encoded),r=GHAFJSON.parse(result);if(r.ok&&s)GHAFHost._outputReceipt41={token:s.token,requestId41:s.requestId41,status:'aborted',removed:r.data.removed};return result;};
GHAFHost.getOutputSession41=function(encoded){var p=GHAFHost._parse(encoded),s=GHAFHost._outputSession,r=GHAFHost._outputReceipt41;return GHAFHost._ok({session:s&&(!p.requestId41||p.requestId41===s.requestId41)?{token:s.token,requestId41:s.requestId41,count:s.count,expected:s.expected,compId:s.comp.id}:null,receipt:r&&(!p.requestId41||p.requestId41===r.requestId41)?r:null});};
})();

/* Only publish readiness after every adapter has completed initialization. */
/* Never publish a partial adapter or rely on its error helper to report boot failure. */
if(!VarnaKinetic40||typeof VarnaKinetic40.resolve!=='function'||typeof VarnaKinetic40.pieceBackground!=='function')throw Error('HOST_KINETIC_INITIALIZATION_INCOMPLETE');
GHAFHost._kinetic45=VarnaKinetic40;
var required43=['_ok','_err','_parse','dispatch','ping','capabilities','getProjectLocation','getSelectionInfo','getTimelineInfo','getActiveCompInfo','buildOutput','checkOutput','removeLivePreview','updateLivePreview','beginOutputSession','commitOutputSession','abortOutputSession','getOutputSession41','renderCompositionAudio'];
for(var requiredIndex43=0;requiredIndex43<required43.length;requiredIndex43++)if(typeof GHAFHost[required43[requiredIndex43]]!=='function')throw Error('HOST_INITIALIZATION_INCOMPLETE: '+required43[requiredIndex43]);
if(previous43&&previous43._bootReady43===true&&previous43._bridgeRevision===GHAFHost._bridgeRevision&&previous43._livePreviewRevision39===GHAFHost._bridgeRevision&&previous43._livePreviewRecords)GHAFHost._livePreviewRecords=previous43._livePreviewRecords;
GHAFHost._bootReady43=true;
root.GHAFJSON=GHAFJSON;
root.GHAFHost=GHAFHost;
root.VarnaHost43=GHAFHost;
})((typeof $!=='undefined'&&$.global)?$.global:this);
