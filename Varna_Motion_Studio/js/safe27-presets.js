/* Verified source geometry is separate from reference and editable UI approximations. */
(function(w){'use strict';const P=w.GHAFSafePresets,S=w.VarnaSafe;for(const p of P){p.geometrySource=p.key.startsWith('TV')?'EBU R95':'Safest Zone 1.0.1 / editable guide';p.verifiedAt='2026-10-14';}
P.push({...S.make('Instagram / Facebook Reels Ads · Meta','META_REELS_ADS_VERIFIED',1080,1920,{left:6,right:6,top:14,bottom:35},'حاشیه‌های منتشرشدهٔ Meta برای تبلیغات Reels؛ حالت ارگانیک جداست.','reels'),geometrySource:'Meta Ads Guide',sourceURL:'https://www.facebook.com/business/ads-guide/update/video/instagram-reels',verifiedAt:'2026-10-14'});
P.push({...S.make('TV 16:9 · EBU Action Safe 3.5%','EBU_ACTION_SAFE',1920,1080,{left:3.5,right:3.5,top:3.5,bottom:3.5},'EBU R95 · ناحیهٔ امن حرکت، جدا از ناحیهٔ امن گرافیک ۵٪','tv'),geometrySource:'EBU R95',sourceURL:'https://tech.ebu.ch/publications/r095',verifiedAt:'2026-10-14'});
try{const saved=JSON.parse(localStorage.getItem('VARNA_SAFE_CUSTOM_V1')||'[]');for(const p of saved.slice(0,30))if(!P.some(x=>x.key===p.key))P.push(S.validPreset(p));}catch(e){}
})(window);
