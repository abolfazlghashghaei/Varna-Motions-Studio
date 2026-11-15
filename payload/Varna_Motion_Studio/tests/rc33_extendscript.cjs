const fs=require('fs'),path=require('path'),assert=require('assert/strict'),acorn=require('./vendor/acorn/acorn');
const root=path.resolve(__dirname,'..');const options={ecmaVersion:3,allowReserved:false};
// Node's modern vm accepts this identifier; the AE ExtendScript ES3 parser rejects it.
assert.throws(()=>acorn.parse('(function(){var native=function(){};native();})();',options),/reserved/);
let count=0;for(const name of fs.readdirSync(path.join(root,'host')).filter(n=>n.endsWith('.jsx'))){const source=fs.readFileSync(path.join(root,'host',name),'utf8');acorn.parse(source,options);count++;}
const combined=fs.readFileSync(path.join(root,'host/ghaf_host.jsx'),'utf8'),upgrade=fs.readFileSync(path.join(root,'host/upgrades27.jsx'),'utf8');assert(combined.includes(upgrade.trim()),'bundled host and standalone upgrade must match');
console.log('PASS RC33: ES3 syntax for all '+count+' host files, reserved-word regression reproduced/rejected, combined host synchronized');
