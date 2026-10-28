import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {websiteIcon,portalIconPath} from '../src/utils/PortalIcons.js';
test('AI brands use self-contained vector icons and migrate saved official favicons',()=>{
  for(const [id,host] of [['chatgpt','chatgpt.com'],['claude','claude.ai'],['gemini','gemini.google.com']]){
    const url=`https://${host}/`;
    const path=portalIconPath(websiteIcon({url,icon:`https://${host}/favicon.ico`}));
    assert.equal(path,id==='chatgpt'?'/portal-icons/chatgpt-official.svg':`/portal-icons/${id}-hq.svg`);
    const svg=fs.readFileSync(new URL(`../public${path}`,import.meta.url),'utf8');
    assert.match(svg,/viewBox=/);assert.doesNotMatch(svg,/<(?:image|script)|(?:href|url\()=/);
    assert.equal(websiteIcon({url,icon:'/custom.png'}),'/custom.png');
    assert.equal(websiteIcon({url,icon:'https://my-images.example/avatar.png'}),'https://my-images.example/avatar.png');
    assert.equal(websiteIcon({url,icon:`https://${host}.evil.example/favicon.ico`}),`https://${host}.evil.example/favicon.ico`);
  }
  assert.equal(websiteIcon({url:'https://chatgpt.com',icon:'si-openai'}),'portal-chatgpt');
  assert.equal(websiteIcon({url:'https://other.example',icon:'si-openai'}),'si-openai');
});
test('NotebookLM legacy artwork and DeepSeek monochrome glyphs use official local images',()=>{
  for(const host of ['notebooklm.google','notebooklm.google.com','notebook.google']) {
    const icon=websiteIcon({url:`https://${host}/`,icon:'si-notebooklm'});
    assert.equal(portalIconPath(icon),'/portal-icons/notebooklm-official.svg');
    assert.equal(websiteIcon({url:`https://${host}/`,icon:`https://${host}/_/static/branding/v4/light_mode/favicon/favicon.svg`}),'portal-notebooklm');
    assert.equal(websiteIcon({url:`https://${host}/`,icon:'/my-avatar.png'}),'/my-avatar.png');
  }
  assert.equal(websiteIcon({url:'https://platform.deepseek.com/',icon:'si-deepseek'}),'portal-deepseek');
  assert.equal(websiteIcon({url:'https://platform.deepseek.com/',icon:'https://fe-static.deepseek.com/platform/favicon.svg'}),'portal-deepseek');
  assert.equal(websiteIcon({url:'https://chatgpt.com/',icon:'/portal-icons/chatgpt-hq.svg'}),'portal-chatgpt');
  const gpt=fs.readFileSync(new URL('../public/portal-icons/chatgpt-official.svg',import.meta.url),'utf8');
  assert.doesNotMatch(gpt,/#10a37f/i);
  const notebook=fs.readFileSync(new URL('../public/portal-icons/notebooklm-official.svg',import.meta.url),'utf8');
  assert.match(notebook,/#3186FF/);assert.match(notebook,/#A9A8FF/);
});
