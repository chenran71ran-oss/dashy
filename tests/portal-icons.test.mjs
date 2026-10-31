import test from 'node:test';
import assert from 'node:assert/strict';
import { matchPortalIcon, websiteFavicon, websiteIcon, portalIconPath } from '../src/utils/PortalIcons.js';
test('Brog Hub replaces its temporary book icon while preserving later custom choices', () => {
  const url = 'https://aileader.chenran71ran.cc/';
  assert.equal(matchPortalIcon(url).id, 'brog-hub');
  assert.equal(portalIconPath(websiteIcon({ url, icon: 'lucide-book' })), '/portal-icons/brog-hub.svg');
  assert.equal(websiteIcon({ url, icon: '/my-next-icon.png' }), '/my-next-icon.png');
  assert.equal(websiteIcon({ url: 'https://other.example/', icon: 'lucide-book' }), 'lucide-book');
  assert.equal(matchPortalIcon('https://sub.aileader.chenran71ran.cc/'), undefined);
  assert.equal(matchPortalIcon('https://aileader.chenran71ran.cc.evil.example/'), undefined);
});
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
  assert.equal(portalIconPath('portal-chatgpt'), '/portal-icons/chatgpt-official.svg');
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
  assert.equal(portalIconPath('portal-deepseek'), '/portal-icons/brand/deepseek.svg');
  assert.equal(websiteIcon({url:'https://platform.deepseek.com/',icon:'/custom.png'}), '/custom.png');
  assert.equal(matchPortalIcon('https://deepseek.com.untrusted.example/'), undefined);
});
test('saved raster copies of a brand logo use the bundled vector mark, other custom images are kept', () => {
  const vector = (url, icon) => portalIconPath(websiteIcon({ url, icon }));
  assert.equal(vector('https://www.douyin.com/', 'https://raw.githubusercontent.com/chenran71ran-oss/QX-icons/main/icons/apps/TikTok.jpg'), '/portal-icons/brand/tiktok.svg');
  assert.equal(vector('https://www.douyin.com/', 'https://is1-ssl.mzstatic.com/image/thumb/Purple/v4/a/AppIcon.png/512x512bb.jpg'), '/portal-icons/brand/tiktok.svg');
  assert.equal(vector('https://www.xiaohongshu.com/explore', 'https://cdn.example.com/icons/小红书.png'), '/portal-icons/xiaohongshu.svg');
  assert.equal(vector('https://www.xiaohongshu.com/', 'https://cdn.example.com/icons/xiaohongshu-512x512.png'), '/portal-icons/xiaohongshu.svg');
  assert.equal(vector('https://github.com/', '/portal-icons/qx/GitHub.png'), '/portal-icons/brand/github.svg');
  assert.equal(vector('https://t.me/', 'https://telegram.org/favicon.ico'), '/portal-icons/brand/telegram.svg');
  assert.equal(vector('https://manus.im/app', 'https://raw.githubusercontent.com/chenran71ran-oss/QX-icons/main/icons/clash/apps/Manus-transparent-v1.png'), '/portal-icons/brand/manus.svg');
  assert.equal(vector('https://manus.im/', '✋'), '/portal-icons/brand/manus.svg');
  assert.equal(vector('https://grok.com/', ''), '/portal-icons/brand/grok.svg');
  assert.equal(websiteIcon({ url: 'https://muse.ai/', icon: 'auto' }), 'auto'); // the card resolves 'auto' to the bundled mark itself
  assert.equal(websiteIcon({ url: 'https://github.com/', icon: 'https://cdn.example.com/me.png' }), 'https://cdn.example.com/me.png');
  assert.equal(websiteIcon({ url: 'https://example.com/', icon: 'https://cdn.example.com/tiktok.png' }), 'https://cdn.example.com/tiktok.png');
  assert.equal(websiteIcon({ url: 'https://www.douyin.com/', icon: 'javascript:alert(1)//TikTok.png' }), 'javascript:alert(1)//TikTok.png');
});
