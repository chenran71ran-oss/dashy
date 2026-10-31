import fs from 'node:fs';
import path from 'node:path';
import * as sass from 'sass';
import { parse, compileStyle } from '@vue/compiler-sfc';
import { Window } from 'happy-dom';
import { themeLabels } from '../../src/utils/ThemeCatalog.js';
import { contrastRatio, compositeColor } from '../../src/utils/ThemeContrast.js';

const root = path.resolve(import.meta.dirname, '../..');
const options = {silenceDeprecations:['import','global-builtin','color-functions'],loadPaths:[root,`${root}/src/styles`],importers:[{findFileUrl:url=>url.startsWith('@/')?new URL(`file://${root}/src/${url.slice(2)}`):null}]};
const components = {
 item:'src/components/LinkItems/Item.vue', collapsable:'src/components/LinkItems/Collapsable.vue',
 minimal:'src/views/Minimal.vue', section:'src/components/MinimalView/MinimalSection.vue', heading:'src/components/MinimalView/MinimalHeading.vue',
 sidebar:'src/components/Workspace/SideBar.vue', sideitem:'src/components/Workspace/SideBarItem.vue', sidesection:'src/components/Workspace/SideBarSection.vue',
 search:'src/components/Settings/SearchBar.vue', workspaceView:'src/views/Workspace.vue',
};
const chunks=[];
let css='body { background:var(--background);color:var(--foreground); }';
for(const [id,file] of Object.entries(components)) {
 const {descriptor}=parse(fs.readFileSync(path.join(root,file),'utf8'));
 for(const style of descriptor.styles) {
  const source=sass.compileString(style.content,options).css;
  const result=compileStyle({source,filename:file,id:`data-v-${id}`,scoped:style.scoped});
  if(result.errors.length) throw result.errors[0];
  chunks.push(result.code);
 }
}
css+=sass.compileString("@import 'src/styles/color-palette.scss';@import 'src/styles/dimensions.scss';@import 'src/styles/color-themes.scss';",options).css;
if(process.argv.includes('--fixed')) css+=fs.readFileSync(path.join(root,'src/styles/theme-readability.scss'),'utf8');
// Model CSS interaction states deterministically; no application/network/credentials are loaded.
css=css.replace(/:hover/g,'.audit-hover').replace(/:focus(?!-)/g,'.audit-focus');
const w=new Window({width:1440,height:1000});
const doc=w.document;for(const source of [...chunks,css]) {const sheet=doc.createElement('style');sheet.textContent=source.replace(/@charset [^;]+;/g,'').replace(/:hover/g,'.audit-hover').replace(/:focus(?!-)/g,'.audit-focus');doc.head.append(sheet);}
const attr=(html,id)=>html.replace(/<([a-z][\w-]*)(?=[\s>])/g,`<$1 data-v-${id}`);
function cards(){return Array.from({length:8},(_,i)=>attr(`<div class="item-wrapper"><a class="item size-large"><div class="tile-title"><span class="text" data-audit="title-${i}">Example site</span><p class="description" data-audit="description-${i}">English website description</p></div></a></div>`,'item')).join('');}
const minimal=attr('<div class="minimal-home focus-home"><div class="item-group-container">','minimal')+attr('<div class="minimal-section-heading"><h3 class="section-title" data-audit="tab">Category</h3></div><div class="minimal-section-heading selected"><h3 class="section-title" data-audit="tab-selected">Selected</h3></div>','heading')+attr('<div class="minimal-section-inner focus-category"><div class="section-items">','section')+cards()+'</div></div></div>'+attr('<section class="filter-container"><form class="minimal"><div class="search-wrap"><input id="filter-tiles" data-audit="search" /></div></form></section>','search')+'</div>';
const home=attr('<div class="home"><div class="collapsable"><div class="section-header"><h3 data-audit="heading">Category</h3></div><div class="collapsible-content"><div class="content-inner"><div class="section-items">','collapsable')+cards()+'</div></div></div></div></div>';
const workspace=attr('<div class="work-space">','workspaceView')+attr('<nav class="side-bar"><div class="side-bar-section">','sidebar')+attr('<div class="sub-side-bar">','sidesection')+attr('<div class="side-bar-item text-only"><p class="small-title" data-audit="sidebar-label">Website</p></div>','sideitem')+'</div></div></nav>'+attr('<main class="workspace-main"><div class="workspace-empty"><h2 data-audit="workspace-title">Workspace</h2><p data-audit="workspace-hint">Choose a website on the left.</p></div></main></div>','workspaceView');
const cache=new Map();
function color(value){
 value=(value||'transparent').trim();
 if(['transparent','none','initial',''].includes(value))return [0,0,0,0];
 if(cache.has(value))return cache.get(value);
 let rgba;
 if(/^#[\da-f]+$/i.test(value)){let h=value.slice(1);if(h.length<5)h=[...h].map(x=>x+x).join('');rgba=[0,2,4].map(i=>parseInt(h.slice(i,i+2),16));rgba.push(h.length===8?parseInt(h.slice(6),16)/255:1);}
 else if(/^rgba?\(/.test(value)){rgba=value.match(/[\d.]+/g).map(Number);if(rgba.length===3)rgba.push(1);}
 else if(value==='currentcolor')throw Error('unresolved currentColor');
 else {const out=sass.compileString(`@use 'sass:color';$c:${value};a {r:color.channel($c,'red',$space:rgb);g:color.channel($c,'green',$space:rgb);b:color.channel($c,'blue',$space:rgb);a:color.channel($c,'alpha');}`,options).css;rgba=[...out.matchAll(/:\s*([\d.]+)/g)].map(x=>Number(x[1]));if(rgba.length!==4)throw Error(`Unsupported color: ${value}`);}
 cache.set(value,rgba);return rgba;
}
function background(el){
 if(!el||el===doc.documentElement)return [255,255,255];
 const style=w.getComputedStyle(el);let bg=style.backgroundColor;
 if(bg.toLowerCase()==='currentcolor')bg=style.color;
 // A page image or gradient has no single colour; approximate it with the theme's declared background.
 if(el===doc.body && /url\(|gradient\(/.test(style.backgroundImage) && color(bg)[3]===0) {
  limitations.add(`${doc.documentElement.dataset.theme||'default'}: background image/gradient requires visual verification`);
  bg=w.getComputedStyle(doc.documentElement).getPropertyValue('--background')||bg;
 }
 return compositeColor(color(bg),background(el.parentElement));
}
const rows=[];const limitations=new Set();
for(const [theme,label] of Object.entries(themeLabels)){
 if(theme==='default')doc.documentElement.removeAttribute('data-theme');else doc.documentElement.dataset.theme=theme;
 for(const [view,html] of Object.entries({home,minimal,workspace})) {
  doc.body.innerHTML=html;
  for(const state of ['normal','hover']) {
   doc.body.innerHTML=html;
   for(const e of doc.querySelectorAll('.item-wrapper,.item,.side-bar-item'))e.classList.toggle('audit-hover',state==='hover');
   for(const el of doc.querySelectorAll('[data-audit]')) {
    const style=w.getComputedStyle(el);const bg=background(el);let fg=color(style.color);
    let opacity=1;for(let e=el;e&&e!==doc.body;e=e.parentElement){const st=w.getComputedStyle(e);opacity*=Number(st.opacity||1);if(/url\(|gradient\(/.test(st.backgroundImage))limitations.add(`${theme}: background image/gradient requires visual verification`);}
    fg=compositeColor([...fg.slice(0,3),(fg[3]??1)*opacity],bg);
    rows.push({theme,label,view,state,part:el.dataset.audit,color:style.color,opacity,background:bg,ratio:+contrastRatio(fg,bg).toFixed(2)});
   }
  }
 }
}
const output=process.argv.includes('--fixed')?'after':'before';
fs.writeFileSync(path.join(root,`scripts/theme-audit/${output}.json`),JSON.stringify({rows,limitations:[...limitations]},null,2)+'\n');
if(process.argv.includes('--fixed') && rows.some(r=>r.ratio<4.5)) process.exitCode=1;
console.log(JSON.stringify({themes:Object.keys(themeLabels).length,checks:rows.length,failures:rows.filter(r=>r.ratio<4.5).length,limitations:[...limitations]},null,2));
await w.happyDOM.close();
