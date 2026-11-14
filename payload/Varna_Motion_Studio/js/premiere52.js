(function(w){'use strict';const call=(method,payload)=>new Promise((resolve,reject)=>w.__adobe_cep__.evalScript('VarnaPremiere52.run('+JSON.stringify(method)+','+JSON.stringify(encodeURIComponent(JSON.stringify(payload)))+')',raw=>{try{const r=JSON.parse(raw);if(!r.ok)throw Error(r.error);resolve(r.data);}catch(e){reject(e);}}));
let saved={};try{saved=JSON.parse(localStorage.getItem('GHAF_Studio_2_Settings')||'{}');}catch(ignore){}w.GHAFState={settings:{...w.GHAFNode.defaults,...saved},projectBrain:{}};
w.VarnaPremiere53={call};
})(window);
