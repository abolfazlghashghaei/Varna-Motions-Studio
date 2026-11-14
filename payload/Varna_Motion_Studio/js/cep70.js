/* AE-only compatibility adapters. No project data, IDs, native handlers or user text change. */
(function(w){'use strict';
const root=document.documentElement;if(!root.hasAttribute('data-ui-a68'))return;
function supports(property,value){try{return !!(w.CSS&&CSS.supports(property,value));}catch(e){return false;}}
function selector(value){try{return !!(w.CSS&&CSS.supports('selector('+value+')'));}catch(e){return false;}}
function layers(){const style=document.createElement('style');style.textContent='@layer cep70-capability-probe {}';document.head.append(style);let supported=false;try{supported=!!style.sheet.cssRules[0].cssRules;}catch(e){}style.remove();return supported;}
const features={layers:layers(),has:selector(':has(*)'),colorMix:supports('color','color-mix(in srgb,black,white)'),containerQueries:supports('container-type','inline-size'),dynamicViewport:supports('height','100dvh'),resizeObserver:typeof w.ResizeObserver==='function',mutationObserver:typeof w.MutationObserver==='function'};
root.dataset.cep70Has=features.has?'on':'off';root.dataset.cep70ColorMix=features.colorMix?'on':'off';
const marked=new Set();let frame=0;
function mark(node,key){if(!node)return;node.setAttribute('data-cep70-'+key,'');marked.add(node);}
function refresh(){frame=0;if(features.has)return;
 for(const node of marked)for(const attribute of Array.from(node.attributes))if(/^data-cep70-has-/.test(attribute.name))node.removeAttribute(attribute.name);marked.clear();
 mark(document.getElementById('fontSelect')?.closest('.card'),'has-font');
 for(const node of document.querySelectorAll('.inline-control>.numeric37'))mark(node.parentElement,'has-numeric');
 for(const node of document.querySelectorAll('.control textarea'))mark(node.closest('.control'),'has-textarea');
 for(const node of document.querySelectorAll('.asset-row label input[type=checkbox]'))mark(node.closest('label'),'has-checkbox');
 for(const node of document.querySelectorAll('.card-title .card-icon'))mark(node.closest('.card-title'),'has-card-icon');
 for(const row of document.querySelectorAll('.director-item'))if(Array.from(row.querySelectorAll('input')).some(input=>input.checked))mark(row,'has-checked');
}
function schedule(){if(frame||features.has)return;frame=requestAnimationFrame(refresh);}
if(!features.has){new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true});document.addEventListener('change',schedule);document.addEventListener('varna:page',schedule);refresh();}
w.VarnaCEP70={features,refresh,supports,selector};
})(window);
