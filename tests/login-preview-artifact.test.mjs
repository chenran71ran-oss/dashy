import assert from 'node:assert/strict';
import { test } from 'node:test';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Window } from 'happy-dom';
import { themeLabels } from '../src/utils/ThemeCatalog.js';
import { contrastRatio } from '../src/utils/ThemeContrast.js';
const settle=()=>new Promise(resolve=>setTimeout(resolve,0));

test('the generated HTML mounts and switches themes without Node globals', async () => {
  const root=path.dirname(path.dirname(fileURLToPath(import.meta.url)));
  const temp=fs.mkdtempSync(path.join(os.tmpdir(),'login-preview-test-'));
  const target=process.env.LOGIN_PREVIEW_HTML || path.join(temp,'preview.html');
  const outer=new Window({url:'https://preview.example'});
  const page=new Window({url:'https://preview.example',settings:{enableJavaScriptEvaluation:true,disableErrorCapturing:true,suppressInsecureJavaScriptEnvironmentWarning:true}});
  // Happy DOM leaves resolved colors as hex while browsers return rgb/rgba.
  // Normalize computed values for this DOM engine; audit the actual theme CSS.
  const nativeComputed=page.getComputedStyle.bind(page);
  page.getComputedStyle=element=>{
    const computed=nativeComputed(element);
    return new Proxy(computed,{get(target,key){
      if(key!=='color')return typeof target[key]==='function'?target[key].bind(target):target[key];
      let value=element.style.color || target.color;
      for(let depth=0;depth<15 && value.includes('var(');depth++)value=value.replace(/var\((--[\w-]+)(?:,\s*([^()]*))?\)/g,(_,name,fallback)=>nativeComputed(page.document.documentElement).getPropertyValue(name).trim()||fallback||'');
      if(value && !value.includes('var(')) {
        const probe=page.document.createElement('i');probe.style.color=value;page.document.body.appendChild(probe);
        let color=nativeComputed(probe).color;probe.remove();
        if(/^#[a-f\d]{3,8}$/i.test(color)) {
          let hex=color.slice(1);if(hex.length<=4)hex=[...hex].map(v=>v+v).join('');
          const channels=[0,2,4].map(at=>parseInt(hex.slice(at,at+2),16));
          if(hex.length===8)channels.push(parseInt(hex.slice(6,8),16)/255);
          color=`${channels.length===4?'rgba':'rgb'}(${channels.join(', ')})`;
        }
        return ({white:'rgb(255, 255, 255)',black:'rgb(0, 0, 0)',transparent:'rgba(0, 0, 0, 0)'})[color]||color;
      }
      return target.color;
    }});
  };
  try {
    if(!process.env.LOGIN_PREVIEW_HTML)execFileSync(process.execPath,['scripts/build-login-preview.mjs',target],{cwd:root,stdio:'pipe'});
    outer.document.write(fs.readFileSync(target,'utf8'));
    const inner=outer.document.querySelector('iframe')?.getAttribute('srcdoc');
    assert.ok(inner,'the deliverable includes its component bundle');
    assert.equal(typeof page.process,'undefined');
    page.document.write(inner);
    await settle();
    assert.ok(page.document.querySelector('.cloud-login'),'the final bundle mounts, rather than leaving a blank frame');
    assert.equal(page.document.querySelector('.cloud-login').dataset.loginTheme,'material-original');
    // Construct the event inside the artifact's realm, as a parent frame does.
    page.eval("window.dispatchEvent(new MessageEvent('message',{source:window.parent,data:{previewTheme:'dracula'}}))");
    await settle();
    assert.equal(page.document.querySelector('.cloud-login').dataset.loginTheme,'dracula');
    const input=page.document.querySelector('input[name=password]');
    page.document.querySelector('.password-reveal').click();
    await settle();
    assert.equal(input.type,'text');
    const response=await page.fetch('/api/login',{method:'POST',body:'preview-only'});
    assert.equal(response.status,401);
    assert.match((await response.json()).error,/不校验或发送真实密码/);
    const audit=[];
    for(const theme of Object.keys(themeLabels)) {
      page.eval(`window.dispatchEvent(new MessageEvent('message',{source:window.parent,data:{previewTheme:${JSON.stringify(theme)}}}))`);
      await settle();
      const login=page.document.querySelector('.cloud-login');
      assert.equal(login.dataset.loginTheme,theme);
      const colors=Object.fromEntries(['page','panel','field','text','field-text','field-muted','page-text','muted','accent','on-accent','focus','error'].map(key=>[key,login.style.getPropertyValue('--login-'+key)]));
      const rgb=key=>colors[key].match(/[\d.]+/g).map(Number);
      for(const [foreground,surface] of [['text','panel'],['muted','panel'],['error','panel'],['field-text','field'],['field-muted','field'],['page-text','page'],['on-accent','accent']])assert.ok(contrastRatio(rgb(foreground),rgb(surface))>=4.45,`${theme}: ${foreground} contrast on ${surface}`);
      assert.ok(contrastRatio(rgb('focus'),rgb('panel'))>=2.95,`${theme}: focus contrast`);
      if(theme==='material-original')assert.equal(colors.panel,'rgb(255, 255, 255)','light Material uses its white content card, not its blue navigation surface');
      const glow=parseFloat(login.style.getPropertyValue('--login-glow-start'))/64;
      const tinted=rgb('page').map((v,i)=>v*(1-glow)+rgb('accent')[i]*glow);
      assert.ok(contrastRatio(rgb('page-text'),tinted)>=4.45,`${theme}: page text remains readable over the accent glow`);
      audit.push({theme,...colors});
    }
    if(process.env.LOGIN_THEME_AUDIT)fs.writeFileSync(process.env.LOGIN_THEME_AUDIT,JSON.stringify(audit,null,2));
  } finally {
    await page.happyDOM.close();await outer.happyDOM.close();
    fs.rmSync(temp,{recursive:true,force:true});
  }
});
