import {build} from 'esbuild';import fs from 'node:fs';import path from 'node:path';
const out='../Varna_Motion_Studio/tools/vendor/runtime53.cjs';fs.mkdirSync(path.dirname(out),{recursive:true});const result=await build({entryPoints:['runtime-entry.cjs'],outfile:out,bundle:true,platform:'node',target:'node16',format:'cjs',external:['bufferutil','utf-8-validate'],legalComments:'inline',metafile:true});
const notices=[],packages=new Set();for(const input of Object.keys(result.metafile.inputs)){const match=input.match(/node_modules\/((?:@[^/]+\/)?[^/]+)/);if(match)packages.add(match[1]);}for(const pkg of [...packages].sort()){const dir='node_modules/'+pkg,meta=JSON.parse(fs.readFileSync(dir+'/package.json'));const file=fs.readdirSync(dir).find(f=>/^licen[cs]e(?:\.md|\.txt)?$/i.test(f));if(!file)throw Error('Missing runtime notice: '+pkg);notices.push(pkg+' '+meta.version+'\n'+fs.readFileSync(dir+'/'+file,'utf8'));}
fs.writeFileSync('../Varna_Motion_Studio/tools/vendor/LICENSES53.txt',notices.join('\n\n----------------\n\n'));

// Remove whitespace-only comment lines emitted from upstream JSDoc.
fs.writeFileSync(out,fs.readFileSync(out,'utf8').replace(/^[ \t]+$/gm,''));
