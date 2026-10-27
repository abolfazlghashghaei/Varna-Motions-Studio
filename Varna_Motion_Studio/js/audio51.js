/* One audio workspace. Existing engine handlers and project settings keep their identities. */
(function(w){'use strict';const $=s=>document.querySelector(s),studio=$('#audioStudio50'),old=$('#brainMusic');if(!studio||!old)return;
const engine=old.querySelector('.music-engine-controls');engine.querySelector('#brainMusicWorkflow').hidden=true;engine.classList.add('audio-engine51');studio.querySelector('.audio-heading50').after(engine);
for(const id of ['brainMusicModelStatus','brainMusicOpenModelSettings','brainMusicErrorDetails'])engine.after($('#'+id));
const direction=document.createElement('details');direction.id='audioDirection51';direction.innerHTML='<summary>سبک، ریتم و سازبندی</summary>';
const moved=new Set();for(const id of ['brainMusicBusiness','brainTempo','brainMusicEditSync','brainMusicMood']){const el=$('#'+id),row=el.closest('details')||el.closest('.form-grid');if(row&&!moved.has(row)){moved.add(row);if(row.tagName==='DETAILS'){row.querySelector('summary')?.remove();while(row.firstChild)direction.append(row.firstChild);row.remove();}else direction.append(row);}}
studio.querySelector('.audio-capability50').after(direction);
// Keep the canonical values used by saved projects, but show each choice exactly once.
for(const id of ['brainAudioKind','brainDurationMode','brainMusicDuration'])$('#'+id).closest('label').hidden=true;
const video=document.createElement('details');video.id='audioVideo51';video.innerHTML='<summary>هماهنگی خودکار با ویدیوی افتر</summary>';
const legacy=document.createElement('div');legacy.id='brainMusic';legacy.className='audio-video-body51';while(old.firstChild)legacy.append(old.firstChild);old.replaceWith(video);video.append(legacy);studio.append(video);
legacy.querySelector('.card-title')?.remove();$('#brainMusicStyle').closest('label').hidden=true;
const styles=$('#cueStyle50'),canonical=$('#brainMusicStyle');styles.addEventListener('change',()=>{canonical.value=styles.value;canonical.dispatchEvent(new Event('change',{bubbles:true}));});canonical.addEventListener('change',()=>{styles.value=canonical.value;});
// Surface the engine's actual failure next to the shared start/stop controls.
const restore=w.VarnaAudio50.restore;w.VarnaAudio50.restore=function(){restore();styles.value=canonical.value;};
const status=document.createElement('p');status.id='audioEngineStatus51';status.setAttribute('role','status');engine.after(status);
new MutationObserver(()=>{status.textContent=$('#brainMusicErrorLog').textContent||'';status.hidden=!status.textContent;}).observe($('#brainMusicErrorLog'),{childList:true,characterData:true,subtree:true});status.hidden=true;
document.addEventListener('varna:page',e=>{if(e.detail.name==='music'){studio.classList.remove('workflow-tab-hidden');video.classList.remove('workflow-tab-hidden');}});
})(window);
