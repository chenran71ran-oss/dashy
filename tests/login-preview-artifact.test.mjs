import assert from 'node:assert/strict';
import { test } from 'node:test';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Window } from 'happy-dom';

test('the generated HTML mounts and switches themes without Node globals', async () => {
  const root=path.dirname(path.dirname(fileURLToPath(import.meta.url)));
  const temp=fs.mkdtempSync(path.join(os.tmpdir(),'login-preview-test-'));
  const target=process.env.LOGIN_PREVIEW_HTML || path.join(temp,'preview.html');
  const outer=new Window({url:'https://preview.example'});
  const page=new Window({url:'https://preview.example',settings:{enableJavaScriptEvaluation:true,disableErrorCapturing:true,suppressInsecureJavaScriptEnvironmentWarning:true}});
  try {
    if(!process.env.LOGIN_PREVIEW_HTML)execFileSync(process.execPath,['scripts/build-login-preview.mjs',target],{cwd:root,stdio:'pipe'});
    outer.document.write(fs.readFileSync(target,'utf8'));
    const inner=outer.document.querySelector('iframe')?.getAttribute('srcdoc');
    assert.ok(inner,'the deliverable includes its component bundle');
    assert.equal(typeof page.process,'undefined');
    page.document.write(inner);
    await page.happyDOM.whenAsyncComplete();
    assert.ok(page.document.querySelector('.cloud-login'),'the final bundle mounts, rather than leaving a blank frame');
    assert.equal(page.document.querySelector('.cloud-login').dataset.loginTheme,'material-original');
    // Construct the event inside the artifact's realm, as a parent frame does.
    page.eval("window.dispatchEvent(new MessageEvent('message',{source:window.parent,data:{previewTheme:'dracula'}}))");
    await page.happyDOM.whenAsyncComplete();
    assert.equal(page.document.querySelector('.cloud-login').dataset.loginTheme,'dracula');
    const input=page.document.querySelector('input[name=password]');
    page.document.querySelector('.password-reveal').click();
    await page.happyDOM.whenAsyncComplete();
    assert.equal(input.type,'text');
    const response=await page.fetch('/api/login',{method:'POST',body:'preview-only'});
    assert.equal(response.status,401);
    assert.match((await response.json()).error,/不校验或发送真实密码/);
  } finally {
    await page.happyDOM.close();await outer.happyDOM.close();
    fs.rmSync(temp,{recursive:true,force:true});
  }
});
