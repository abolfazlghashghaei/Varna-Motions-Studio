/* Platform guides are editable estimates. TV graphics safe follows EBU R95. */
(function(root,factory){var api=factory(root.GHAFSafePresets||[]);if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.VarnaSafe=api;})(typeof window!=='undefined'?window:globalThis,function(presets){
'use strict';
function clamp(v,min,max){return Math.min(max,Math.max(min,+v||0));}
function rect(w,h,x1,y1,x2,y2){return {vertices:[[x1,y1],[x2,y1],[x2,y2],[x1,y2]],inTangents:[[0,0],[0,0],[0,0],[0,0]],outTangents:[[0,0],[0,0],[0,0],[0,0]],closed:true};}
function make(name,key,w,h,m,note,platform){w=clamp(w,100,8192);h=clamp(h,100,8192);m=m||{};var left=clamp(m.left,0,95),right=clamp(m.right,0,95),top=clamp(m.top,0,95),bottom=clamp(m.bottom,0,95);if(left+right>=100||top+bottom>=100)throw Error('جمع حاشیه‌های روبه‌رو باید کمتر از ۱۰۰ درصد باشد.');return {name,key,width:w,height:h,ratio:w+':'+h,note:note||'',platform:platform||'',customPaths:[{mode:3,paths:[rect(w,h,0,0,w,h),rect(w,h,w*left/100,h*top/100,w*(1-right/100),h*(1-bottom/100))]}]};}
function bounds(path){var v=path.vertices||[];if(!v.length)return null;return {x1:Math.min.apply(null,v.map(x=>+x[0])),x2:Math.max.apply(null,v.map(x=>+x[0])),y1:Math.min.apply(null,v.map(x=>+x[1])),y2:Math.max.apply(null,v.map(x=>+x[1]))};}
function point(path,x,y){var v=path.vertices||[],yes=false;for(var i=0,j=v.length-1;i<v.length;j=i++){var a=v[i],b=v[j];if((a[1]>y)!=(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])yes=!yes;}return yes;}
function allowed(p,x,y){if(x<0||x>p.width||y<0||y>p.height)return false;var good=false,bad=false;(p.customPaths||[]).forEach(function(op){var paths=op.paths||[];if(+op.mode===3){paths.slice(1).forEach(function(a){if(point(a,x,y))good=true;});}else paths.forEach(function(a){if(point(a,x,y))bad=true;});});return good&&!bad;}
// Reference safe regions are axis-aligned polygons. Grid decomposition preserves their union
// and subtracts reserved UI rails, including at boundaries shared by adjacent safe regions.
function regions(p){var xs=[0,p.width],ys=[0,p.height];(p.customPaths||[]).forEach(op=>(op.paths||[]).forEach(a=>(a.vertices||[]).forEach(v=>{xs.push(clamp(v[0],0,p.width));ys.push(clamp(v[1],0,p.height));})));function unique(a){a.sort((x,y)=>x-y);return a.filter((v,i)=>!i||v-a[i-1]>.001);}xs=unique(xs);ys=unique(ys);var out=[];for(var j=0;j<ys.length-1;j++)for(var i=0;i<xs.length-1;i++)if(allowed(p,(xs[i]+xs[i+1])/2,(ys[j]+ys[j+1])/2))out.push({x1:xs[i],x2:xs[i+1],y1:ys[j],y2:ys[j+1]});return out;}
function inner(p){var cells=regions(p),xs=[],ys=[],best=null,area=0;cells.forEach(b=>{xs.push(b.x1,b.x2);ys.push(b.y1,b.y2);});xs=[...new Set(xs)].sort((a,b)=>a-b);ys=[...new Set(ys)].sort((a,b)=>a-b);for(var a=0;a<xs.length-1;a++)for(var b=a+1;b<xs.length;b++)for(var c=0;c<ys.length-1;c++)for(var d=c+1;d<ys.length;d++){var A=(xs[b]-xs[a])*(ys[d]-ys[c]);if(A<=area)continue;var good=true;for(var i=a;i<b&&good;i++)for(var j=c;j<d;j++)if(!allowed(p,(xs[i]+xs[i+1])/2,(ys[j]+ys[j+1])/2)){good=false;break;}if(good){area=A;best={x1:xs[a],x2:xs[b],y1:ys[c],y2:ys[d]};}}return best;}
function resolve(p,manual){if(!p)return null;if(manual&&manual.mode==='manual')return make(p.name,p.key,manual.width,manual.height,manual.margins,p.note,platform(p));var copy=JSON.parse(JSON.stringify(p)),w=manual?Number(manual.width):p.width,h=manual?Number(manual.height):p.height;if(!isFinite(w)||!isFinite(h)||w<100||h<100||w>8192||h>8192)throw Error('ابعاد سیف‌زون معتبر نیست.');copy.width=w;copy.height=h;(copy.customPaths||[]).forEach(op=>(op.paths||[]).forEach(a=>{a.vertices=a.vertices.map(v=>[v[0]*w/p.width,v[1]*h/p.height]);for(var k of ['inTangents','outTangents'])if(a[k])a[k]=a[k].map(v=>[v[0]*w/p.width,v[1]*h/p.height]);}));return copy;}
function validPreset(p){if(!p||!p.key||!p.name||!Number.isFinite(+p.width)||!Number.isFinite(+p.height)||p.width<100||p.height<100||p.width>8192||p.height>8192||!Array.isArray(p.customPaths)||p.customPaths.length>24)throw Error('فایل هندسهٔ سیف‌زون معتبر نیست.');p.customPaths.forEach(op=>{if(![1,3].includes(+op.mode)||!Array.isArray(op.paths)||op.paths.length>24)throw Error('عملگر هندسه پشتیبانی نمی‌شود.');op.paths.forEach(a=>{if(!Array.isArray(a.vertices)||a.vertices.length!==4||a.vertices.some(v=>!Array.isArray(v)||v.length!==2||!v.every(Number.isFinite)))throw Error('مسیر باید مستطیل چهارگوش باشد.');for(var i=0;i<4;i++){var v=a.vertices[i],q=a.vertices[(i+1)%4];if(Math.abs(v[0]-q[0])>.001&&Math.abs(v[1]-q[1])>.001)throw Error('این نسخه فقط هندسهٔ مستطیلی را می‌پذیرد.');}if(['inTangents','outTangents'].some(k=>(a[k]||[]).some(v=>v.some(n=>Math.abs(n)>.000001))))throw Error('منحنی سیف‌زون در این نسخه پشتیبانی نمی‌شود.');});});if(!inner(p))throw Error('ناحیهٔ امن خالی است.');return JSON.parse(JSON.stringify(p));}
function margins(p){var b=inner(p);if(!b)return {left:10,right:10,top:10,bottom:10};return {left:Math.round(b.x1/p.width*1000)/10,right:Math.round((p.width-b.x2)/p.width*1000)/10,top:Math.round(b.y1/p.height*1000)/10,bottom:Math.round((p.height-b.y2)/p.height*1000)/10};}
function box(p){var b=inner(p);if(!b)return null;return {x1:clamp(b.x1/p.width,0,1),y1:clamp(b.y1/p.height,0,1),x2:clamp(b.x2/p.width,0,1),y2:clamp(b.y2/p.height,0,1),ratio:p.width/p.height};}
var extra=[
 ['Facebook Reels (9:16)','FACEBOOKREELS916',1080,1920,{left:9,right:15,top:14,bottom:25},'راهنمای محافظه‌کارانه؛ رابط پلتفرم تغییر می‌کند','reels'],
 ['Facebook Stories (9:16)','FACEBOOKSTORIES916',1080,1920,{left:8,right:8,top:15,bottom:20},'راهنمای قابل تنظیم','stories'],
 ['Snapchat Spotlight (9:16)','SNAPCHATSPOTLIGHT916',1080,1920,{left:10,right:17,top:15,bottom:23},'راهنمای قابل تنظیم','shorts'],
 ['LinkedIn Vertical (9:16)','LINKEDINVERTICAL916',1080,1920,{left:10,right:10,top:13,bottom:18},'راهنمای قابل تنظیم','feed'],
 ['Pinterest Vertical (2:3)','PINTEREST23',1000,1500,{left:9,right:9,top:12,bottom:16},'راهنمای قابل تنظیم','feed'],
 ['X / Twitter Vertical (9:16)','XVERTICAL916',1080,1920,{left:10,right:10,top:13,bottom:18},'راهنمای قابل تنظیم','feed'],
 ['Telegram Story (9:16)','TELEGRAMSTORY916',1080,1920,{left:8,right:8,top:13,bottom:19},'راهنمای قابل تنظیم','stories'],
 ['TV Broadcast 16:9 — HD','TVHD169',1920,1080,{left:5,right:5,top:5,bottom:5},'EBU R95: ناحیهٔ امن گرافیک ۵٪ از هر لبه','tv'],
 ['TV Broadcast 16:9 — UHD','TVUHD169',3840,2160,{left:5,right:5,top:5,bottom:5},'EBU R95: ناحیهٔ امن گرافیک ۵٪ از هر لبه','tv']
];
extra.forEach(function(x){presets.push(make.apply(null,x));});
function platform(p){if(p.platform)return p.platform;var k=String(p.key||'').toLowerCase();if(k.indexOf('tiktok')>=0)return 'tiktok';if(k.indexOf('shorts')>=0)return 'shorts';if(k.indexOf('reels')>=0)return 'reels';if(k.indexOf('stor')>=0)return 'stories';if(k.indexOf('feed')>=0||k.indexOf('threads')>=0)return 'feed';return 'none';}
function chrome(p){var kind=platform(p),w=p.width,h=p.height,s=Math.min(w,h),blocks=[];function add(x,y,bw,bh,opacity){blocks.push({x:x,y:y,w:bw,h:bh,opacity:opacity||14});}if(kind==='none'||kind==='tv')return blocks;
 add(w*.04,h*.025,w*.28,h*.017,12);add(w*.04,h*.96,w*.92,h*.015,15);
 if(kind==='tiktok'||kind==='shorts'||kind==='reels'){for(var i=0;i<4;i++)add(w*.89,h*(.54+i*.075),s*.065,s*.065,22);add(w*.055,h*.83,w*.55,h*.018,15);add(w*.055,h*.865,w*.42,h*.012,12);if(kind==='tiktok')add(w*.06,h*.925,w*.88,h*.025,22);else if(kind==='shorts')add(w*.05,h*.91,w*.58,h*.026,15);else add(w*.05,h*.91,w*.75,h*.018,15);}
 else if(kind==='stories'){add(w*.04,h*.05,w*.92,h*.008,16);add(w*.05,h*.89,w*.62,h*.04,16);}
 else {add(w*.06,h*.075,w*.36,h*.022,14);add(w*.06,h*.88,w*.78,h*.03,17);}
 return blocks;
}
return {make,inner,margins,box,platform,chrome,allowed,regions,resolve,validPreset};
});
