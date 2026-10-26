(function(w){'use strict';
// Keep the production input and its ID as the single source of truth.
// input updates preview continuously; change commits once at gesture end.
const fields=new WeakMap(),sources=new Set(),special=/^(videoScrub|motionScrub|tablePreviewTime|tableStartRange|tableEndRange|startRange|endRange)$/;
const bounds={fontSize:[1,2000],quickFontSize:[1,2000],posX:[-100,200],posY:[-100,200],tracking:[-1000,1000],leading:[0,2000],quickBgOpacity:[0,100],quickBgPadding:[0,500],quickBgRound:[0,2000],quickBgBorder:[0,100],quickBgHighlight:[0,100],quickBgShadow:[0,100],reviewMaxWords:[1,100],maxLines:[1,6],wordsPerLine:[1,100]};
let active=null;
function step(el){const n=Number(el.step);return el.step&&el.step!=='any'&&n>0?n:1;}
function value(el,n){const low=el.min===''?-Infinity:Number(el.min),high=el.max===''?Infinity:Number(el.max);n=Math.max(low,Math.min(high,n));return Number(n.toFixed(8));}
function snap(el,n){if(el.step==='any')return value(el,n);const unit=step(el),base=el.min===''?0:Number(el.min);return value(el,base+Math.round((n-base)/unit)*unit);}
function blocked(el){return el.disabled||el.readOnly||el.matches(':disabled');}
function emit(el,type){el.dispatchEvent(new Event(type,{bubbles:true}));}
function rangeBounds(el){const n=Number(el.value)||0;let lo=el.min===''?Math.min(0,n<0?n*2:0):Number(el.min),hi=el.max===''?Math.max(100,Math.abs(n)*2,lo+100):Number(el.max);if(!(hi>lo))hi=lo+step(el);return [lo,hi];}
function sync(el){const f=fields.get(el);if(!f)return;const disabled=blocked(el);f.handle.disabled=disabled;if(f.number!==el){f.number.disabled=disabled;f.number.readOnly=!!el.readOnly;f.number.min=el.min;f.number.max=el.max;f.number.step=el.step||'1';if(document.activeElement!==f.number)f.number.value=el.value;}
 if(f.slider!==el){f.slider.disabled=disabled;if(!active||active.el!==el){const b=rangeBounds(el);f.slider.min=b[0];f.slider.max=b[1];f.slider.step=el.step==='any'?'any':String(step(el));}f.slider.value=el.value===''?f.slider.min:el.value;}
 f.box.classList.toggle('numeric37-disabled',disabled);f.box.classList.toggle('numeric37-empty',el.value==='');
 const lo=Number(f.slider.min),hi=Number(f.slider.max),percent=hi>lo?Math.max(0,Math.min(100,(Number(f.slider.value)-lo)/(hi-lo)*100)):0;f.slider.style.setProperty('--numeric-progress',percent+'%');
}
function set(el,n){fields.get(el).cancelledSlider=false;el.value=snap(el,n);sync(el);emit(el,'input');}
function begin(el,target,e,kind){if(e.button!==0||blocked(el))return false;if(active)finish(false);fields.get(el).cancelledSlider=false;active={el,target,id:e.pointerId,lastX:e.clientX,x:e.clientX,n:Number(el.value)||0,original:el.value,kind,moved:false};fields.get(el).box.classList.add('dragging37');document.body.classList.add('scrubbing37');if(kind==='scrub'){e.preventDefault();e.stopPropagation();target.setPointerCapture(e.pointerId);}return true;}
function finish(commit){const a=active;if(!a)return;active=null;const f=fields.get(a.el);f.box.classList.remove('dragging37');document.body.classList.remove('scrubbing37');try{if(a.target.hasPointerCapture(a.id))a.target.releasePointerCapture(a.id);}catch(e){}
 if(!commit){a.el.value=a.original;emit(a.el,'input');f.cancelledSlider=true;f.cancelValue=a.original;}else if(a.kind==='scrub'&&a.moved&&a.el.value!==a.original)emit(a.el,'change');
 if(commit&&a.kind==='scrub'&&!a.moved&&a.target===f.number){f.number.focus();f.number.select();}sync(a.el);
}
function scrub(el,target){target.addEventListener('pointerdown',e=>{if(target===fields.get(el).number&&document.activeElement===target)return;begin(el,target,e,'scrub');});
 target.addEventListener('pointermove',e=>{const a=active;if(!a||a.target!==target||a.id!==e.pointerId||a.kind!=='scrub')return;if(blocked(el)){finish(false);return;}if(!a.moved&&Math.abs(e.clientX-a.x)<3)return;a.moved=true;const delta=e.clientX-a.lastX;a.lastX=e.clientX;const factor=e.shiftKey?.1:(e.ctrlKey||e.metaKey?10:1);a.n=value(el,a.n+delta*step(el)*factor/3);set(el,a.n);});
 target.addEventListener('pointerup',e=>{if(active?.target===target&&active.id===e.pointerId)finish(true);});target.addEventListener('pointercancel',()=>{if(active?.target===target)finish(false);});target.addEventListener('lostpointercapture',()=>{if(active?.target===target)finish(true);});
}
function enhance(el){if(fields.has(el)){sources.add(el);sync(el);return;}if(el.dataset.numeric37||el.dataset.numericAux||!['number','range'].includes(el.type)||el.closest('.tp-dfwv')||el.classList.contains('paint-stop')||special.test(el.id)||el.dataset.numericSkip==='true')return;
 el.dataset.numeric37='true';if(bounds[el.id]){const b=bounds[el.id];if(el.min==='')el.min=b[0];if(el.max==='')el.max=b[1];}
 const label=el.getAttribute('aria-label')||el.closest('label')?.querySelector('span')?.textContent||el.id||'مقدار',box=document.createElement('span');box.className='numeric37';box.setAttribute('role','group');box.setAttribute('aria-label',label);el.before(box);box.append(el);
 const number=el.type==='number'?el:document.createElement('input'),slider=el.type==='range'?el:document.createElement('input'),handle=document.createElement('button');
 if(number!==el){number.type='number';number.dataset.numericAux='true';number.setAttribute('aria-label',label+' — مقدار عددی');}number.classList.add('numeric37-value');number.title='بکش برای تغییر · کلیک برای تایپ · Shift آهسته‌تر · Ctrl/Cmd سریع‌تر · Esc لغو';
 if(slider!==el){slider.type='range';slider.dataset.numericAux='true';slider.setAttribute('aria-label',label+' — نوار تنظیم');}if(!slider.getAttribute('aria-label')&&!slider.getAttribute('aria-labelledby'))slider.setAttribute('aria-label',label+' — نوار تنظیم');slider.classList.add('numeric37-slider');slider.dir='ltr';
 handle.type='button';handle.className='numeric37-handle';handle.textContent='↔';handle.setAttribute('aria-label','تغییر '+label+' با کشیدن یا کلیدهای جهت');handle.title=number.title;
 // Order deliberately retains input + handle for keyboard and existing integrations.
 box.append(number,handle,slider);const f={box,number,slider,handle,cancelledSlider:false};fields.set(el,f);sources.add(el);sync(el);scrub(el,number);scrub(el,handle);
 handle.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();});
 handle.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End'].includes(e.key)||blocked(el))return;e.preventDefault();e.stopPropagation();let n=Number(el.value)||0;if(e.key==='Home'){if(el.min==='')return;n=+el.min;}else if(e.key==='End'){if(el.max==='')return;n=+el.max;}else n+=step(el)*(e.ctrlKey||e.metaKey?10:1)*(['ArrowLeft','ArrowDown'].includes(e.key)?-1:1);set(el,n);emit(el,'change');});
 slider.addEventListener('pointerdown',e=>{f.cancelledSlider=false;if(blocked(el)){e.preventDefault();return;}begin(el,slider,e,'slider');});
 slider.addEventListener('input',e=>{if(f.cancelledSlider&&e.isTrusted){el.value=f.cancelValue;slider.value=el.value;e.stopImmediatePropagation();sync(el);}},true);
 slider.addEventListener('change',e=>{if(f.cancelledSlider){el.value=f.cancelValue;slider.value=el.value;e.stopImmediatePropagation();sync(el);}},true);
 slider.addEventListener('keydown',e=>{if(e.key!=='Escape')f.cancelledSlider=false;});
 slider.addEventListener('input',()=>{if(blocked(el))return;if(slider!==el){el.value=slider.value;emit(el,'input');}sync(el);});
 slider.addEventListener('change',()=>{if(f.cancelledSlider){f.cancelledSlider=false;return;}if(slider!==el&&!blocked(el))emit(el,'change');if(active?.el===el&&active.kind==='slider')finish(true);sync(el);});
 // Sliders can commit on change, release with no change, cancellation or focus loss.
 slider.addEventListener('pointerup',()=>{if(active?.el===el&&active.kind==='slider')finish(true);});slider.addEventListener('pointercancel',()=>{if(active?.el===el)finish(false);});
 if(number!==el){number.addEventListener('input',()=>{if(number.value!==''&&Number.isFinite(+number.value)&&!blocked(el)){f.cancelledSlider=false;set(el,+number.value);}});number.addEventListener('change',()=>{if(blocked(el))return;if(number.value!==''&&Number.isFinite(+number.value))set(el,+number.value);number.value=el.value;emit(el,'change');});}
 el.addEventListener('input',()=>sync(el));el.addEventListener('change',()=>{if(el.value!==''&&Number.isFinite(+el.value))el.value=snap(el,+el.value);sync(el);},true);
 el.addEventListener('focus',()=>sync(el));
}
function scan(root){if(root.matches?.('input[type=number],input[type=range]'))enhance(root);root.querySelectorAll('input[type=number],input[type=range]').forEach(enhance);}
function refresh(){for(const el of sources){if(!el.isConnected){sources.delete(el);continue;}if(el.offsetParent!==null)sync(el);}}
// Capture Escape before workspace navigation so cancellation stays in the current page.
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&active){e.preventDefault();e.stopImmediatePropagation();finish(false);}},true);w.addEventListener('blur',()=>finish(true));
scan(document);new MutationObserver(records=>{for(const r of records){if(r.type==='attributes'){if(fields.has(r.target))sync(r.target);else r.target.querySelectorAll('input[data-numeric37]').forEach(sync);continue;}for(const node of r.addedNodes)if(node.nodeType===1)scan(node);}}).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['disabled','readonly','min','max','step','value']});
// Existing controllers restore .value directly without events; mirror visible controls only.
w.setInterval(refresh,250);document.addEventListener('varna:page',refresh);w.VarnaNumeric37={scan,step,value,refresh};
})(window);
