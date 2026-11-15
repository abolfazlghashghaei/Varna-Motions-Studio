/* Private-library routing and original native recipes. Vendor files are external. */
(function(root,factory){var api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.VarnaUserLibrary81=api;return api;})(typeof window!=='undefined'?window:this,function(){
 var packs=[
  {id:'hook-titles-25',fa:'۲۵ عنوان هوک',en:'25 Hook Titles',kind:'project',entry:'hook-titles-25/Hook Texts Pack.aep',count:25},
  {id:'social-hooks-100',fa:'۱۰۰ متن هوک',en:'100 Social Hooks',kind:'project',entry:'social-hooks-100/100 Hooks.aep',count:100},
  {id:'lower-thirds-100',fa:'۱۰۰ عنوان معرفی',en:'100 Lower Thirds',kind:'lower',entry:'',count:100},
  {id:'instagram-ui-100',fa:'۱۰۰ عنصر اجتماعی',en:'100 Social Elements',kind:'project',entry:'instagram-ui-100/Instagram Elements UI Pack.aep',count:100},
  {id:'saas-gradients-20',fa:'۲۰ پس‌زمینهٔ تکنولوژی',en:'20 SaaS Gradients',kind:'project',entry:'saas-gradients-20/After Effects/SaaS Gradients.aep',count:20},
  {id:'highlighter-2',fa:'هایلایتر اصلی',en:'Highlighter 2',kind:'script',entry:'highlighter-2/Highlighter.jsxbin',count:1},
  {id:'atools-2.106',fa:'Amanow / ATools ۲٫۱۰۶',en:'Amanow / ATools 2.106',kind:'cep',entry:'atools-2.106/index.html',host:'atools-2.106/jsx/host.jsxbin',extensionId:'com.amanow.tools.panel',count:1}
 ];
 var gradients=[
  ['azure','آبی تکنولوژی','Azure',['#07182E','#235BE8','#72DAFF']],['mint','نعنا','Mint',['#07332C','#25B58A','#B2FFE2']],
  ['violet','بنفش','Violet',['#1D1037','#7840CE','#C9A1FF']],['ember','کهربا','Ember',['#381C15','#DB6339','#FFCC8F']],
  ['rose','رز','Rose',['#36132E','#BB3B88','#FFB9D9']],['ice','یخی','Ice',['#12313F','#51BFD1','#D4FAFF']],
  ['lime','لیمویی','Lime',['#1C3012','#68A63C','#D5FF8B']],['cobalt','کبالت','Cobalt',['#0D143B','#3154BD','#A5BEFF']],
  ['sunset','غروب','Sunset',['#2C174D','#C74E91','#FFA47F']],['sand','ماسه','Sand',['#3B2B1F','#BE976B','#FFE7BC']],
  ['aqua','آبی سبز','Aqua',['#052E38','#008FA7','#91F4EB']],['lavender','اسطوخودوس','Lavender',['#292047','#9679C2','#E8D4FF']],
  ['coral','مرجانی','Coral',['#401D24','#E7676B','#FFC5A6']],['forest','جنگل','Forest',['#0E2B22','#2D795B','#A7D8A2']],
  ['steel','فولادی','Steel',['#192734','#5D7C96','#C9D9E6']],['gold','طلایی','Gold',['#35250B','#BC8E21','#FFE6A0']],
  ['berry','تمشک','Berry',['#311635','#96356E','#EB91C9']],['ocean','اقیانوس','Ocean',['#061D37','#176EA8','#6BC9E5']],
  ['peach','هلویی','Peach',['#432A23','#D9976C','#FFE1BE']],['mono','خاکستری','Monochrome',['#111B24','#576875','#CAD6DC']]
 ];
 var titles=[
  ['hook-bold','هوک درشت','Bold hook','hook','pop','pop:quick'],['hook-question','پرسش','Question hook','hook','rise','expand-x:soft'],
  ['hook-quote','نقل‌قول','Quote','hook','fade','curtain-top:cinema'],['hook-step','مراحل','Steps','hook','slide','wipe-left:quick'],
  ['hook-sale','پیشنهاد ویژه','Offer','hook','overshoot','elastic-both:bold'],['hook-warning','نکتهٔ مهم','Important tip','hook','rise','slide-down:soft'],
  ['lower-left','معرفی چپ','Left lower third','lower','slide','wipe-left:soft'],['lower-right','معرفی راست','Right lower third','lower','rise','wipe-right:soft'],
  ['lower-line','معرفی خطی','Underlined lower third','lower','fade','expand-x:cinema'],['lower-stack','معرفی دوخطی','Stacked lower third','lower','rise','curtain-bottom:soft'],
  ['lower-minimal','معرفی ساده','Minimal lower third','lower','fade','expand-both:cinema'],['lower-badge','معرفی نشان‌دار','Badge lower third','lower','pop','pop:soft'],
  ['social-follow','دنبال‌کردن','Follow','social','pop','pop:quick'],['social-like','پسندیدن','Like','social','overshoot','elastic-both:spring'],
  ['social-comment','دیدگاه','Comment','social','rise','curtain-bottom:quick'],['social-save','ذخیره','Save','social','slide','wipe-right:quick'],
  ['social-poll','نظرسنجی','Poll','social','splitCenter','expand-x:soft'],['social-notice','اعلان','Notification','social','drop','slide-up:soft']
 ];
 function copy(v){return JSON.parse(JSON.stringify(v));}
 function pack(id){for(var i=0;i<packs.length;i++)if(packs[i].id===id)return copy(packs[i]);return null;}
 function asset(id){
  var p=pack(id);if(p&&p.kind!=='lower')return p;
  var m=/^lower-(\d{3})$/.exec(String(id));if(!m)return null;
  var n=Number(m[1]);if(n<1||n>100)return null;
  return {id:id,pack:'lower-thirds-100',kind:'project',fa:'معرفی '+m[1],en:'Lower third '+m[1],entry:'lower-thirds-100/Original CEP/library/LT_'+m[1]+'.aep',poster:'lower-thirds-100/Original CEP/media/posters/'+m[1]+'.jpg',clip:'lower-thirds-100/Original CEP/media/clips/'+m[1]+'.webm'};
 }
 function palette(id){for(var i=0;i<gradients.length;i++)if(gradients[i][0]===id)return {id:id,fa:gradients[i][1],en:gradients[i][2],colors:gradients[i][3].slice(0)};return null;}
 function title(id){for(var i=0;i<titles.length;i++)if(titles[i][0]===id)return {id:id,fa:titles[i][1],en:titles[i][2],role:titles[i][3],textMotion:titles[i][4],bgMotion:titles[i][5]};return null;}
 return {packs:function(){return copy(packs);},asset:asset,pack:pack,palette:palette,palettes:function(){var out=[];for(var i=0;i<gradients.length;i++)out.push(palette(gradients[i][0]));return out;},title:title,titles:function(){var out=[];for(var i=0;i<titles.length;i++)out.push(title(titles[i][0]));return out;}};
});
