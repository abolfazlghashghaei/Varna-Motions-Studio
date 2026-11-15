/* Local boundary grouping; original text and editorial overrides remain intact. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.VarnaSentence66=api;})(typeof window!=='undefined'?window:null,function(){'use strict';
const clone=x=>JSON.parse(JSON.stringify(x));
function immutable(value){if(!value||typeof value!=='object'||Object.isFrozen(value))return value;Object.freeze(value);for(const key of Object.keys(value))immutable(value[key]);return value;}
function terminal(text){const t=String(text||'');if(/^(?:Mr|Mrs|Ms|Dr|Prof|e\.g|i\.e)\.$/i.test(t)||/^(?:[A-Z]\.){2,}$/.test(t))return false;return /[.!?؟…]+[»”’"')\]]*$/.test(t);}
function options(value){const o=value||{};return {maxWords:Math.floor(Math.max(2,Math.min(30,+o.maxWords||12))),gap:Math.max(.1,Math.min(3,+o.gap||.7)),across:o.across===true};}
function fingerprint(group){const meta={};for(const key of Object.keys(group).sort())if(!['id','wordIds','preserve','manual','textOverride','startOverride','endOverride'].includes(key))meta[key]=group[key];return JSON.stringify(meta);}
function editable(group){return !group.manual&&group.textOverride==null&&(group.wordIds||[]).length>0;}
function anchored(group){return [group.startOverride,group.endOverride].some(x=>x!=null&&x!=='');}
function split(groups,words,value,nextId){const o=options(value),byId=new Map(words.map(w=>[w.id,w])),out=[];
 function get(id){const word=byId.get(id);if(!word||!Number.isFinite(+word.start)||!Number.isFinite(+word.end)||!(+word.end>+word.start))throw Error('Missing word timing; segmentation stopped');return word;}
 function emit(group){if(!editable(group)){out.push(clone(group));return;}
  const chunks=[];let bucket=[];for(let i=0;i<group.wordIds.length;i++){const id=group.wordIds[i],word=get(id),next=i+1<group.wordIds.length?get(group.wordIds[i+1]):null;if(next&&+next.start<+word.start)throw Error('Word order changed; segmentation stopped');bucket.push(id);if(bucket.length>=o.maxWords||terminal(word.editedText??word.text)||(next&&next.start-word.end>=o.gap)){chunks.push(bucket);bucket=[];}}if(bucket.length)chunks.push(bucket);
  chunks.forEach((ids,i)=>{const g=clone(group);g.id=i===0?group.id:nextId();g.wordIds=ids;g.preserve=true;g.startOverride=i===0?group.startOverride:null;g.endOverride=i===chunks.length-1?group.endOverride:null;out.push(g);});
 }
 let run=null,last=null,meta='';function flush(){if(run)emit(run);run=null;last=null;meta='';}
 for(const group of groups){if(!o.across||!editable(group)||anchored(group)){flush();emit(group);continue;}
  const first=get(group.wordIds[0]),signature=fingerprint(group),tail=get(group.wordIds[group.wordIds.length-1]);
  const join=run&&meta===signature&&!terminal(last.editedText??last.text)&&first.start>=last.start&&first.start-last.end<o.gap&&first.start>=last.end-.05&&!group.wordIds.some(id=>run.wordIds.includes(id));
  if(!join){flush();run=clone(group);meta=signature;}else run.wordIds=run.wordIds.concat(group.wordIds);last=tail;
 }flush();return out;
}
function snapshot(S){return clone({groups:S.groups,words:S.words,nextGroup:S.nextGroup,selectedId:S.selectedId});}
function restore(S,data){Object.assign(S,clone(data));S.selectedWordIds.clear();}
function toggle(S,enabled,value,rebuild){const o=options(value);let state=S.projectBrain.sentence66?clone(S.projectBrain.sentence66):null;if(!state)state={enabled:false,original:snapshot(S),processed:null};if(state.enabled===enabled&&!rebuild)return;
 const before=snapshot(S),undo=S.undoStack.slice(),redo=S.redoStack.slice(),selected=new Set(S.selectedWordIds);S.pushUndo();
 try{if(enabled){const source=snapshot(S),hash=JSON.stringify({groups:source.groups,words:source.words,nextGroup:source.nextGroup});if(state.processed&&!rebuild&&state.sourceHash!==hash)throw Error('Original text changed; use Rebuild to preserve deliberate control over the edited version');state.original=source;state.sourceHash=hash;if(state.processed&&!rebuild)restore(S,state.processed);else{let next=Math.max(S.nextGroup,1,...S.groups.map(g=>(+g.id||0)+1));const selectedWord=S.groups.find(g=>g.id===S.selectedId)?.wordIds?.[0],groups=split(S.groups,S.words,o,()=>next++);S.groups=groups;S.nextGroup=next;S.selectedId=groups.find(g=>selectedWord!=null&&g.wordIds?.includes(selectedWord))?.id??(groups.some(g=>g.id===S.selectedId)?S.selectedId:groups[0]?.id||null);state.options=o;state.processed=snapshot(S);}}
 else{state.processed=snapshot(S);restore(S,state.original);}state.enabled=enabled;S.projectBrain.sentence66=immutable(state);
 }catch(error){restore(S,before);S.undoStack=undo;S.redoStack=redo;S.selectedWordIds=selected;throw error;}
}
return {terminal,split,toggle,immutable,options};
});
