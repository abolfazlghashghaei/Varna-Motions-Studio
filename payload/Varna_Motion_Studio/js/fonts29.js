(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.VarnaFonts=api;})(typeof window!=='undefined'?window:globalThis,function(){'use strict';
function key(s){return String(s||'').toLowerCase().replace(/ي|ى/g,'ی').replace(/ك/g,'ک').replace(/[\u064b-\u065f\u200c\u200f\u200e]/g,'').replace(/یکان/g,'yekan').replace(/وزیر/g,'vazir').replace(/ایران\s*سنس/g,'iransans').replace(/بخ/g,'bakh').replace(/[\s_\-—]+/g,'');}
function filter(fonts,q){const parts=String(q||'').trim().split(/\s+/).map(key).filter(Boolean);return fonts.filter(f=>parts.every(p=>key(f.label+' '+f.ps).includes(p)));}
return {key,filter};
});
