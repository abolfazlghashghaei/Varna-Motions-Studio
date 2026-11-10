/* Test-only Chromium 99 feature profile. Not a browser/version/CEF emulator.
   Remove unsupported CSS before parsing, rather than merely overriding CSS.supports. */
const postcss=require('postcss');
function unsupportedDeclaration(prop,value){return /^(container|container-type|container-name)$/.test(prop)||/color-mix\s*\(/i.test(value)||/(?:\d|\))\s*(?:[dsl]v[whib]|[dsl]vmin|[dsl]vmax|cq(?:w|h|i|b|min|max))\b/i.test(value);}
function transform(css,stats={},file='unknown'){const tree=postcss.parse(css);stats.rules=stats.rules||0;stats.declarations=stats.declarations||0;stats.removals=stats.removals||[];
 tree.walkAtRules(rule=>{if(['container','scope','starting-style'].includes(rule.name)){stats.rules++;stats.removals.push({file,line:rule.source?.start?.line,rule:rule.name||rule.selector});rule.remove();}});
 tree.walkRules(rule=>{if(rule.selector.includes(':has(')||rule.selector.includes('&')||rule.parent?.type==='rule'){stats.rules++;stats.removals.push({file,line:rule.source?.start?.line,rule:rule.name||rule.selector});rule.remove();}});
 tree.walkDecls(decl=>{if(unsupportedDeclaration(decl.prop,decl.value)){stats.declarations++;stats.removals.push({file,line:decl.source?.start?.line,property:decl.prop,value:decl.value});decl.remove();}});
 return tree.toString();
}
function disableFeatures(){
 const supports=CSS.supports.bind(CSS);CSS.supports=function(property,value){const expression=String(property)+' '+String(value||'');if(/container|color-mix\(|:has\(|(?:\d|\))\s*(?:[dsl]v[whib]|[dsl]vmin|[dsl]vmax|cq(?:w|h|i|b|min|max))\b|selector\([^)]*&/i.test(expression))return false;return value===undefined?supports(property):supports(property,value);};
 // No unavailable ECMAScript APIs may accidentally hide a runtime dependency.
 for(const [object,key]of [[Array.prototype,'toSorted'],[Array.prototype,'toReversed'],[Array.prototype,'toSpliced'],[Array.prototype,'with'],[Object,'groupBy'],[Map,'groupBy'],[Promise,'withResolvers'],[String.prototype,'isWellFormed'],[String.prototype,'toWellFormed']])if(Object.prototype.hasOwnProperty.call(object,key))Object.defineProperty(object,key,{value:undefined,configurable:true,writable:true});
 window.__CEP70_PROFILE__={targetChromium:99,actualUserAgent:navigator.userAgent,cssParsingIsModern:true,nativeCEF:false};
}
function sanitizeInjectedStyles(){let removed=0;
 function walk(group){for(let i=group.cssRules.length-1;i>=0;i--){const r=group.cssRules[i];if(r.constructor.name==='CSSContainerRule'||r.constructor.name==='CSSScopeRule'||r.selectorText?.includes(':has(')||r.selectorText?.includes('&')){group.deleteRule(i);removed++;continue;}if(r.style)for(const property of Array.from(r.style)){const value=r.style.getPropertyValue(property);if(/^(container|container-type|container-name)$/.test(property)||/color-mix\s*\(/i.test(value)||/(?:\d|\))\s*(?:[dsl]v[whib]|cq(?:w|h|i|b|min|max))\b/i.test(value)){r.style.removeProperty(property);removed++;}}if(r.cssRules)walk(r);}}
 for(const sheet of document.styleSheets)if(!sheet.href)walk(sheet);
 return removed;
}
module.exports={transform,disableFeatures,sanitizeInjectedStyles,unsupportedDeclaration};
