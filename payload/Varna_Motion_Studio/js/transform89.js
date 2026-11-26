(function (root) {
  'use strict';
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const radians = angle => angle * Math.PI / 180;
  const degrees = angle => angle * 180 / Math.PI;
  function rotate(x, y, angle) {
    const c = Math.cos(radians(angle)), s = Math.sin(radians(angle));
    return {x:x*c-y*s, y:x*s+y*c};
  }
  function point(value, x, y) {
    const k = value.scale / 100;
    const p = rotate((x-value.ax)*k, (y-value.ay)*k, value.rotation);
    return {x:value.x+value.ax+p.x, y:value.y+value.ay+p.y};
  }
  function changeAnchor(value, dx, dy) {
    const k = value.scale / 100;
    const local = rotate(dx/k, dy/k, -value.rotation);
    return {...value, x:value.x+dx-local.x, y:value.y+dy-local.y, ax:value.ax+local.x, ay:value.ay+local.y};
  }
  function anchoredResize(value, edgeX, edgeY, dx, dy, locked, limits) {
    const k = value.scale / 100;
    const motion = rotate(dx/k, dy/k, -value.rotation);
    let width = edgeX ? value.width + edgeX*motion.x : value.width;
    let height = edgeY ? value.height + edgeY*motion.y : value.height;
    if (locked) {
      const x = width/value.width, y = height/value.height;
      const factor = Math.abs(x-1) >= Math.abs(y-1) ? x : y;
      const ratio = clamp(factor, Math.max(80/value.width,60/value.height),
        Math.min(limits.width/value.width,limits.height/value.height));
      width=value.width*ratio; height=value.height*ratio;
    }
    width=clamp(width,80,limits.width); height=clamp(height,60,limits.height);
    const shift = rotate(edgeX*(width-value.width)*k/2, edgeY*(height-value.height)*k/2,value.rotation);
    return {...value,width,height,x:value.x+shift.x,y:value.y+shift.y};
  }
  function snapMove(value, next, viewport, margin, allow) {
    const guides = [];
    if (!allow) return {value:next,guides};
    const corners = [[-.5,-.5],[.5,-.5],[.5,.5],[-.5,.5]].map(([x,y])=>point(next,x*value.width,y*value.height));
    const center = point(next,0,0);
    for (const [axis, limit] of [['x',viewport.width],['y',viewport.height]]) {
      const coords = corners.map(p=>p[axis]);
      const bounds = [Math.min(...coords),center[axis],Math.max(...coords)];
      const targets = [0,limit/2,limit];
      let best = margin, delta = 0, guide;
      for (const n of bounds) for (const t of targets) {
        if (Math.abs(t-n) <= best) { best=Math.abs(t-n); delta=t-n; guide=t; }
      }
      if (guide!==undefined) { next[axis]+=delta; guides.push([axis,guide]); }
    }
    return {value:next,guides};
  }
  // Alignment uses the visual bounds, including scale, rotation and anchor.
  function alignedPosition(value, axis, edge, extent, requestedMargin) {
    const coords = [[-1,-1],[1,-1],[1,1],[-1,1]].map(([x,y]) =>
      point(value,x*value.width/2,y*value.height/2)[axis]);
    const min=Math.min(...coords), max=Math.max(...coords), size=max-min;
    const margin=clamp(requestedMargin,0,Math.max(0,(extent-size)/2));
    const delta=edge==='start'&&size<=extent?margin-min:
      edge==='end'&&size<=extent?extent-margin-max:extent/2-(min+max)/2;
    return value[axis]+delta;
  }
  function timecode(seconds, rate) {
    const fps = Math.max(1,Math.round(rate||30));
    const frames = Math.max(0, Math.floor(seconds*(rate||30)+1e-6));
    return [Math.floor(frames/fps/3600),Math.floor(frames/fps/60)%60,Math.floor(frames/fps)%60,frames%fps]
      .map(part=>String(part).padStart(2,'0')).join(':');
  }
  const api = {clamp,rotate,point,changeAnchor,anchoredResize,snapMove,degrees,timecode,alignedPosition};
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.VarnaTransform89 = api;
})(typeof window === 'undefined' ? null : window);
