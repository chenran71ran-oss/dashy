import test from 'node:test';
import assert from 'node:assert/strict';
import { matchPortalIcon, websiteFavicon, websiteIcon, portalIconPath } from '../src/utils/PortalIcons.js';
test('Google AI Studio keeps its own product identity, while unknown Google apps are not assigned Google Search',()=>{
  assert.equal(matchPortalIcon('https://aistudio.google.com/usage').id,'aistudio');
  assert.equal(matchPortalIcon('https://unknown-app.google.com/'),undefined);
  assert.equal(matchPortalIcon('https://www.google.com/').id,'google');
});
test('brand domains match precisely, including known self-hosted Emby', () => {
  assert.equal(matchPortalIcon('https://chatgpt.com/c/test').id, 'chatgpt');
  assert.equal(matchPortalIcon('https://gemini.google.com/app').id, 'gemini');
  assert.equal(matchPortalIcon('https://emby.example.test/').id, 'emby');
  assert.equal(matchPortalIcon('https://chatgpt.com.evil.example/'), undefined);
  assert.equal(matchPortalIcon('https://notchatgpt.com/'), undefined);
});
test('automatic icons use the catalog while preserving explicit custom images', () => {
  assert.equal(websiteIcon({ title: 'ChatGPT', url: 'https://chatgpt.com/', icon: '🧠' }), 'portal-chatgpt');
  assert.equal(websiteIcon({ url: 'https://chatgpt.com/', icon: '/custom.png' }), '/custom.png');
  assert.equal(websiteIcon({ url: 'https://example.com/', icon: '🚀' }), '🚀');
  assert.equal(websiteIcon({ url: 'https://example.com/' }), 'auto');
  assert.equal(portalIconPath('portal-chatgpt'), '/portal-icons/qx/ChatGPT.png');
});
test('favicon lookup omits paths, query strings and fragments, and rejects unsafe URLs', () => {
  assert.equal(websiteFavicon('https://example.com/private/path?token=test-only#secret'), 'https://example.com/favicon.ico');
  assert.equal(websiteFavicon('javascript:alert(1)'), '');
  assert.equal(websiteFavicon('https://user:pass@example.com/'), '');
});
test('DeepSeek API and chat share the verified brand catalog without replacing manual choices', () => {
  for (const host of ['deepseek.com', 'www.deepseek.com', 'platform.deepseek.com', 'chat.deepseek.com', 'api-docs.deepseek.com']) {
    assert.equal(matchPortalIcon(`https://${host}/`).id, 'deepseek');
    assert.equal(websiteIcon({url:`https://${host}/`,title:'DeepSeek API'}), 'portal-deepseek');
  }
  assert.equal(portalIconPath('portal-deepseek'), '/portal-icons/deepseek.svg');
  assert.equal(websiteIcon({url:'https://platform.deepseek.com/',icon:'/custom.png'}), '/custom.png');
  assert.equal(matchPortalIcon('https://deepseek.com.untrusted.example/'), undefined);
});
