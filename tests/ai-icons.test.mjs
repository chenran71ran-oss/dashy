import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {websiteIcon,portalIconPath} from '../src/utils/PortalIcons.js';
test('AI brands use self-contained vector icons and migrate saved official favicons',()=>{
  for(const [id,host] of [['chatgpt','chatgpt.com'],['claude','claude.ai'],['gemini','gemini.google.com']]){
    const url=`https://${host}/`;
    const path=portalIconPath(websiteIcon({url,icon:`https://${host}/favicon.ico`}));
    assert.equal(path,`/portal-icons/${id}-hq.svg`);
    const svg=fs.readFileSync(new URL(`../public${path}`,import.meta.url),'utf8');
    assert.match(svg,/viewBox=/);assert.doesNotMatch(svg,/<(?:image|script)|(?:href|url\()=/);
    assert.equal(websiteIcon({url,icon:'/custom.png'}),'/custom.png');
    assert.equal(websiteIcon({url,icon:'https://my-images.example/avatar.png'}),'https://my-images.example/avatar.png');
    assert.equal(websiteIcon({url,icon:`https://${host}.evil.example/favicon.ico`}),`https://${host}.evil.example/favicon.ico`);
  }
  assert.equal(websiteIcon({url:'https://chatgpt.com',icon:'si-openai'}),'portal-chatgpt');
  assert.equal(websiteIcon({url:'https://other.example',icon:'si-openai'}),'si-openai');
});
