/* Offline caption segmentation. It changes grouping, not grammar or vocabulary. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.VarnaSentence66=api;})(typeof window!=='undefined'?window:null,function(){'use strict';
const clone=x=>JSON.parse(JSON.stringify(x));
function terminal(text){const t=String(text||'');if(/^(?:Mr|Mrs|Ms|Dr|Prof|e\.g|i\.e)\.$/i.test(t)||/^(?:[A-Z]\.){2,}$/.test(t))return false;return /[.!?؟…]+[»"')\]]*$/.test(t);}
function split(groups,words,options,nextId){const byId=new Map(words.map(w=>[w.id,w])),cap=Math.max(2,Math.min(30,+options.maxWords||12)),gap=Math.max(.1,Math.min(3,+options.gap||.7)),out=[];
for(const group of groups){if(group.manual||group.textOverride!=null||!(group.wordIds||[]).length){out.push(clone(group));continue;}
let chunks=[],bucket=[];for(let i=0;i<group.wordIds.length;i++){const id=group.wordIds[i],word=byId.get(id),next=byId.get(group.wordIds[i+1]);if(!word)throw Error('Missing word timing; segmentation stopped');bucket.push(id);if(bucket.length>=cap||terminal(word.editedText??word.text)||(next&&next.start-word.end>=gap)){chunks.push(bucket);bucket=[];}}if(bucket.length)chunks.push(bucket);
chunks.forEach((ids,i)=>{const g=clone(group);g.id=i===0?group.id:nextId();g.wordIds=ids;g.preserve=true;g.startOverride=i===0?group.startOverride:null;g.endOverride=i===chunks.length-1?group.endOverride:null;out.push(g);});}
return out;}
function snapshot(S){return clone({groups:S.groups,words:S.words,nextGroup:S.nextGroup,selectedId:S.selectedId});}
function restore(S,data){Object.assign(S,clone(data));S.selectedWordIds.clear();}
function toggle(S,enabled,options,rebuild){let state=S.projectBrain.sentence66?clone(S.projectBrain.sentence66):null;if(!state){state={enabled:false,original:snapshot(S),processed:null};}
if(state.enabled===enabled&&!rebuild)return;
const before=snapshot(S),undo=S.undoStack.slice(),redo=S.redoStack.slice(),selected=new Set(S.selectedWordIds);S.pushUndo();
try{if(enabled){const source=snapshot(S),hash=JSON.stringify({groups:source.groups,words:source.words,nextGroup:source.nextGroup});if(state.processed&&!rebuild&&state.sourceHash!==hash)throw Error('Original text changed; use Rebuild to preserve deliberate control over the edited version');state.original=source;state.sourceHash=hash;if(state.processed&&!rebuild)restore(S,state.processed);else{let next=S.nextGroup;const groups=split(S.groups,S.words,options,()=>next++);S.groups=groups;S.nextGroup=next;S.selectedId=groups.some(g=>g.id===S.selectedId)?S.selectedId:groups[0]?.id||null;state.options=clone(options);state.processed=snapshot(S);}}
else{state.processed=snapshot(S);restore(S,state.original);}state.enabled=enabled;S.projectBrain.sentence66=state;
}catch(error){restore(S,before);S.undoStack=undo;S.redoStack=redo;S.selectedWordIds=selected;throw error;}}
return {terminal,split,toggle};
});
