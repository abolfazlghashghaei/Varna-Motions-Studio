// Geometric invariants independent of UI selectors and native Adobe rendering.
const assert=require('node:assert/strict'),M=require('../js/transform89.js');
const near=(a,b)=>assert(Math.abs(a-b)<1e-8,`${a} != ${b}`);
let cases=0;
for(const rotation of [-170,-90,-25,0,35,90,170])for(const scale of [25,100,250])for(const anchor of [[0,0],[37,-24]]){
 const value={x:960,y:540,width:640,height:360,rotation,scale,opacity:80,ax:anchor[0],ay:anchor[1]};
 const moved=M.changeAnchor(value,31,-19);
 for(const [x,y]of [[-320,-180],[320,-180],[-320,180],[320,180],[0,0]]){const a=M.point(value,x,y),b=M.point(moved,x,y);near(a.x,b.x);near(a.y,b.y);cases++;}
 for(const [x,y]of [[-1,-1],[1,-1],[-1,1],[1,1]]){
  const resized=M.anchoredResize(value,x,y,43,28,false,{width:5760,height:3240});
  const old=M.point(value,-x*value.width/2,-y*value.height/2),next=M.point(resized,-x*resized.width/2,-y*resized.height/2);near(old.x,next.x);near(old.y,next.y);cases++;
  const locked=M.anchoredResize(value,x,y,43,28,true,{width:5760,height:3240});near(locked.width/locked.height,value.width/value.height);cases++;
 }
 for(const axis of ['x','y'])for(const edge of ['start','center','end']){
  const extent=axis==='x'?1920:1080,margin=24,position=M.alignedPosition(value,axis,edge,extent,margin),aligned={...value,[axis]:position};
  const coords=[[-1,-1],[1,-1],[1,1],[-1,1]].map(([x,y])=>M.point(aligned,x*value.width/2,y*value.height/2)[axis]);
  const low=Math.min(...coords),high=Math.max(...coords);if(high-low>extent||edge==='center')near((low+high)/2,extent/2);else if(edge==='start')near(low,Math.min(margin,(extent-(high-low))/2));else near(high,extent-Math.min(margin,(extent-(high-low))/2));cases++;
 }
}
assert.equal(M.timecode(65.5,30),'00:01:05:15');
console.log('PASS UI91 transforms: '+cases+' anchor, opposite-edge resize, aspect lock and rotated visual-alignment invariants. Native AE rendering untested.');
