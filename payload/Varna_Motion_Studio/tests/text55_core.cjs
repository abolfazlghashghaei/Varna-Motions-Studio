'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),C=require('../js/text55-core.js');const dict=l=>({aff:fs.readFileSync(path.join(__dirname,'../assets/text55',l+'.aff'),'utf8'),dic:fs.readFileSync(path.join(__dirname,'../assets/text55',l+'.dic'),'utf8')});const e=C.create({fa:dict('fa'),en:dict('en')});
for(const [wrong,right]of [['helo','hello'],['recieve','receive'],['سللام','سلام'],['salam','سلام'],['mikham','می‌خوام']]){const r=e.suggest(wrong);assert(r.suggestions.some(c=>c.text===right),wrong);assert.equal(r.auto,null);}
for(const word of ['سلام','میخوام','می‌خوام','چطوری','ممنون','hello','man','to','on','video','FFmpeg','NASA','https://example.com','user@example.com'])assert.equal(e.suggest(word).correct,true,word);
assert.deepEqual(e.suggest('salam',{finglish:false}).suggestions.filter(c=>c.kind==='finglish'),[]);
assert(e.suggest('man',{language:'finglish'}).suggestions.some(c=>c.text==='من'));
assert.equal(e.suggest('كلمه').auto.text,'کلمه');assert.equal(e.suggest('سللام').auto,null);
const original='سلام،سللام؟ hello! https://example.com/test user@example.com';const rows=e.inspect(original);assert(rows.some(r=>r.token==='سللام'));for(const r of rows)assert.equal(original.slice(r.start,r.end),r.token);
assert(e.inspect('می روم').some(r=>r.suggestions.some(c=>c.text==='می‌روم'&&c.kind==='spacing')));
assert.equal(e.inspect('سللام',{protectedPhrases:['سللام']} ).length,0);
e.setUserWords(['سللام','Varna']);assert.equal(e.suggest('سللام').correct,true);assert.equal(e.suggest('Varna').correct,true);e.setUserWords([]);assert.equal(e.suggest('سللام').correct,false);
const edit=C.applyEdit('abc helo def',{start:4,end:8,wrong:'helo'},'hello',{start:9,end:12,direction:'forward'});assert.deepEqual(edit,{text:'abc hello def',selection:{start:10,end:13,direction:'forward'}});assert.throws(()=>C.applyEdit('abc',{start:0,end:3,wrong:'xyz'},'def'),/changed/);assert.throws(()=>C.applyEdit('abc',{start:-1,end:4},''));
assert.throws(()=>e.inspect('a'.repeat(20001)),/20,000/);
console.log('PASS offline Persian/English spelling, Finglish approval, protected English/code/names, punctuation spans, personal dictionary removal, safe normalization, stale range and caret mapping.');
