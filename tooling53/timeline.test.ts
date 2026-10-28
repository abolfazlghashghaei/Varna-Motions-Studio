import {describe,it,expect} from 'vitest';
import {createRequire} from 'node:module';
import {workspace} from './contracts';
const require=createRequire(import.meta.url),C=require('../Varna_Motion_Studio/js/editor51-core.js'),T=require('../Varna_Motion_Studio/js/timeline53-core.js'),E=require('../Varna_Motion_Studio/js/export53-core.js');
function fixture(){const p=C.fresh();p.assets.push({id:'source',name:'Source.mov',kind:'video',duration:60});for(let i=0;i<3;i++){const c=C.add(p,'source','v1',i*5);Object.assign(c,{id:'c'+i,in:10,out:15});}return p;}
describe('source edit transactions',()=>{
 it('slips source content while preserving cuts',()=>{const p=fixture();T.slip(p,'c1',2);expect(p.clips.map((c:any)=>[c.start,c.in,c.out])).toEqual([[0,10,15],[5,12,17],[10,10,15]]);expect(()=>C.validate(p)).not.toThrow();});
 it.each(['left','right'])('ripple trims %s and keeps downstream cuts contiguous',edge=>{const p=fixture();T.ripple(p,'c1',edge,1);expect(C.end(p.clips[1])).toBe(p.clips[2].start);expect(p.clips[1].start).toBe(5);});
 it('rolls two source ranges without changing total duration',()=>{const p=fixture();T.roll(p,'c0',1);expect(p.clips[1]).toMatchObject({start:6,in:11});expect(C.duration(p)).toBe(15);});
 it('slides without changing the selected source range',()=>{const p=fixture();T.slide(p,'c1',1);expect(p.clips[1]).toMatchObject({start:6,in:10,out:15});expect(C.end(p.clips[0])).toBe(6);expect(p.clips[2].start).toBe(11);expect(C.duration(p)).toBe(15);});
 it.each([['slip',100],['roll',100],['slide',-100],['trackSelect',-100]])('rolls back invalid %s', (fn,delta)=>{const p=fixture(),before=JSON.stringify(p);expect(()=>T[fn](p,'c1',delta)).toThrow();expect(JSON.stringify(p)).toBe(before);});
 it('rejects locked and non-touching edits',()=>{const p=fixture();p.clips[2].start=12;expect(()=>T.roll(p,'c1',1)).toThrow(/touching/);p.tracks.find((t:any)=>t.id==='v1').locked=true;expect(()=>T.slip(p,'c1',1)).toThrow(/locked/);});
 it('selects all followers exactly once',()=>{const p=fixture();T.trackSelect(p,'c1',2);expect(p.clips.map((c:any)=>c.start)).toEqual([0,7,12]);});
 it('closes gaps with real undo/redo',()=>{const p=fixture();p.clips[2].start=12;const h=C.history(p);h.change((p:any)=>T.closeGap(p,'v1',11));expect(h.get().clips[2].start).toBe(10);h.undo();expect(h.get().clips[2].start).toBe(12);h.redo();expect(h.get().clips[2].start).toBe(10);});
});
describe('interchange, scale and export',()=>{
 it('round trips OTIO trims, gaps and styled captions',()=>{const p=fixture();p.clips[2].start=12;p.captions=[{id:'caption',start:1,end:3,text:'سلام Hello',style:{color:'#ff0000'},words:[]}];const d=T.fromOtio(T.otio(p));expect(d.clips.map((c:any)=>[c.start,c.in,c.out])).toEqual(p.clips.map((c:any)=>[c.start,c.in,c.out]));expect(d.captions).toEqual(p.captions);expect(()=>C.validate(d)).not.toThrow();});
 it('rejects overlapping export and transitions on import',()=>{const p=fixture();p.clips[1].start=4;expect(()=>T.otio(p)).toThrow(/non-overlapping/);const d=T.otio(fixture());d.tracks.children[1].children[0].OTIO_SCHEMA='Transition.1';expect(()=>T.fromOtio(d)).toThrow(/Unsupported/);});
 it('honors a valid work area and rejects out-of-range marks',()=>{const p=fixture();p.workArea53={start:2,end:10};expect(T.range(p)).toEqual({start:2,end:10});p.workArea53.end=100;expect(()=>T.range(p)).toThrow();});
 it.each(T.presets)('validates sequence preset %s',(_id,_name,width,height,fps)=>expect(()=>C.validate({...C.fresh(),width,height,fps})).not.toThrow());
 it('accepts fractional frame rates and rejects excessive pixel counts',()=>{expect(C.validate({...C.fresh(),fps:30000/1001}).fps).toBeCloseTo(29.97,2);expect(()=>C.validate({...C.fresh(),width:7680,height:7680})).toThrow(/budget/);});
 it('finds the active clips among 10,000 edits on 128 tracks',()=>{const p=C.fresh();p.tracks=Array.from({length:128},(_,i)=>({id:'t'+i,kind:'video'}));p.clips=Array.from({length:10000},(_,i)=>({id:'c'+i,trackId:'t'+i%128,start:Math.floor(i/128)*5,in:0,out:2}));expect(T.active(p,11)).toHaveLength(128);expect(T.active(p,13)).toHaveLength(0);});
 it('enables NLE only in AE',()=>{expect(workspace('ae').editor).toBe(true);for(const host of ['premiere','resolve'] as const)expect(workspace(host).editor).toBe(false);});
 it.each(Object.keys(E.profiles))('uses a fixed encoder for %s',(profile)=>{const p=E.build(profile,'input with spaces','output');expect(p.args.at(-1)).toBe('output');expect(p.args).toContain(p.encoder);});
 it('rejects arbitrary encoder options',()=>expect(()=>E.build('custom -exec','a','b')).toThrow());
});
