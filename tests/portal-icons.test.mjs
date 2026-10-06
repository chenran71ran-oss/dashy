import test from 'node:test';
import assert from 'node:assert/strict';
import { matchPortalIcon, websiteFavicon, websiteIcon, portalIconPath } from '../src/utils/PortalIcons.js';
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
