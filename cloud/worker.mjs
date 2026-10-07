// Kenneth portal · original Dashy frontend + Cloudflare Assets + KV.
// Runtime ADMIN_TOKEN only; never put the password in frontend build variables.
import validSchema from './config-validator.cjs';
import { CLOUD_CAPABILITIES } from './capabilities.mjs';
import { readWeather } from './weather.mjs';
import { discoverIcon, fetchPublicIcon, publicIconUrl } from './icon-discovery.mjs';
const CONFIG_KEY = 'kenneth-home:dashy:v1';
const OLD_CONFIG_KEY = 'kenneth-home:config:v1';
const FAVORITES_KEY = 'kenneth-home:theme-favorites:v1';
export const DEFAULT_CONFIG = {
  pageInfo: { title: 'Home Lab', description: '', logo: '/mech/blue.png' },
  appConfig: { theme: 'nord-frost', language: 'zh-CN', layout: 'auto', iconSize: 'medium',
    defaultOpeningMethod: 'newtab', enableServiceWorker: false, enableErrorReporting: false,
    statusCheck: false, disableUpdateChecks: true, faviconApi: 'local',
    enableFontAwesome: false, enableMaterialDesignIcons: false, webSearch: { disableWebSearch: true } },
  sections: [],
};
const BASE_HEADERS = {'cache-control':'no-store','x-content-type-options':'nosniff','referrer-policy':'no-referrer'};

function json(data, status=200, extraHeaders={}) {
  return new Response(JSON.stringify(data), {status,headers:{...BASE_HEADERS,'content-type':'application/json; charset=utf-8',...extraHeaders}});
}
function fail(message,status=400) { const e=new Error(message);e.status=status;throw e; }
const SESSION_SECONDS=12*60*60;
const encoder=new TextEncoder();
function requirePassword(env){
  if(typeof env.ADMIN_TOKEN!=='string'||!env.ADMIN_TOKEN) fail('请检查 ADMIN_TOKEN，当前未读取到管理员密码',503);
  return env.ADMIN_TOKEN;
}
async function checkPassword(value,env){
  const expected=requirePassword(env);
  if(typeof value!=='string'||value.length>1024) fail('管理员密码不正确',401);
  const [a,b]=await Promise.all([crypto.subtle.digest('SHA-256',encoder.encode(value)),crypto.subtle.digest('SHA-256',encoder.encode(expected))]);
  const aa=new Uint8Array(a),bb=new Uint8Array(b);let mismatch=0;
  for(let i=0;i<aa.length;i++) mismatch|=aa[i]^bb[i];
  if(mismatch) fail('管理员密码不正确',401);
}
function sessionName(req){return new URL(req.url).protocol==='https:'?'__Host-kh_session':'kh_session';}
function cookie(req,value,seconds){return sessionName(req)+'='+value+'; Path=/; HttpOnly; SameSite=Strict; Max-Age='+seconds+(new URL(req.url).protocol==='https:'?'; Secure':'');}
function base64url(bytes){return btoa(String.fromCharCode(...new Uint8Array(bytes))).replaceAll('+','-').replaceAll('/','_').replaceAll('=','');}
function unbase64url(s){return Uint8Array.from(atob(s.replaceAll('-','+').replaceAll('_','/')),c=>c.charCodeAt(0));}
async function sessionKey(env){return crypto.subtle.importKey('raw',encoder.encode(requirePassword(env)),{name:'HMAC',hash:'SHA-256'},false,['sign','verify']);}
function signatureInput(req,payload){return encoder.encode('kenneth-home:v02:'+new URL(req.url).host+':'+payload);}
async function newSession(req,env){
  const payload=String(Math.floor(Date.now()/1000)+SESSION_SECONDS)+'.'+crypto.randomUUID();
  const sig=await crypto.subtle.sign('HMAC',await sessionKey(env),signatureInput(req,payload));
  return payload+'.'+base64url(sig);
}
async function authorize(req,env){
  requirePassword(env);
  const value=(req.headers.get('cookie')||'').split(';').map(s=>s.trim()).find(s=>s.startsWith(sessionName(req)+'='))?.slice(sessionName(req).length+1)||'';
  const match=/^(\d{10})\.([a-f0-9-]{36})\.([A-Za-z0-9_-]{43})$/.exec(value);
  if(!match) fail('请先登录总站',401);
  const expires=Number(match[1]),now=Math.floor(Date.now()/1000);
  if(expires<=now||expires>now+SESSION_SECONDS+60) fail('登录已过期，请重新输入管理员密码',401);
  let valid=false;
  try{valid=await crypto.subtle.verify('HMAC',await sessionKey(env),unbase64url(match[3]),signatureInput(req,match[1]+'.'+match[2]));}catch{}
  if(!valid) fail('登录已过期，请重新输入管理员密码',401);
}
function sameOrigin(req,u){
  const origin=req.headers.get('origin');
  if(origin&&origin!==u.origin) fail('请从总站页面操作',403);
  if(req.headers.get('sec-fetch-site')==='cross-site') fail('跨站请求已拒绝',403);
}
async function limitedBody(req,maxBytes=3000000) {
  if(!req.headers.get('content-type')?.toLowerCase().startsWith('application/json')) fail('请使用 JSON 格式',415);
  if(Number(req.headers.get('content-length')||0)>maxBytes) fail('配置文件过大',413);
  const reader=req.body?.getReader();if(!reader) fail('配置不能为空');
  const chunks=[];let size=0;
  while(true){const {value,done}=await reader.read();if(done)break;size+=value.length;if(size>maxBytes){await reader.cancel();fail('配置文件过大',413);}chunks.push(value);}
  const body=new Uint8Array(size);let offset=0;for(const c of chunks){body.set(c,offset);offset+=c.length;}
  try{return JSON.parse(new TextDecoder().decode(body));}catch{fail('JSON 格式不正确');}
}

function validateUrl(value) {
  if (typeof value !== 'string' || value.length > 4096) fail('网址格式不正确');
  let parsed;
  try { parsed = new URL(value); } catch { fail('请填写完整的 HTTP/HTTPS 网址'); }
  if (!['http:', 'https:'].includes(parsed.protocol) || parsed.username || parsed.password) fail('网站仅支持不含账号密码的 HTTP/HTTPS 地址');
}
function validateConfig(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) fail('配置格式不正确');
  // Cloud adapter deliberately has one homepage and one administrator password.
  if (raw.pages?.length) fail('此版本使用首页分类和小分类，请勿添加独立 YAML 子页面');
  if (raw.appConfig?.auth?.users?.length || raw.appConfig?.auth?.enableKeycloak || raw.appConfig?.auth?.enableOidc) fail('登录统一使用 Cloudflare 的 ADMIN_TOKEN，无需设置第二套账户');
  if (!validSchema(raw)) fail('配置校验失败：' + (validSchema.errors?.[0]?.instancePath || '/') + ' ' + (validSchema.errors?.[0]?.message || '格式不正确'));
  const config = structuredClone(raw);
  config.pageInfo ||= {};
  if (!config.pageInfo.title || /^Kenneth\s*的/.test(config.pageInfo.title)) config.pageInfo.title = 'Home Lab';
  config.pageInfo.logo ||= '/kenneth-mech.svg';
  config.appConfig ||= {};
  delete config.appConfig.auth;
  config.appConfig.enableServiceWorker = false;
  config.appConfig.enableErrorReporting = false;
  config.appConfig.faviconApi = 'local';
  config.appConfig.enableFontAwesome = false;
  config.appConfig.enableMaterialDesignIcons = false;
  config.appConfig.webSearch = { ...config.appConfig.webSearch, disableWebSearch: true };
  config.appConfig.preventWriteToDisk = false;
  config.appConfig.disableUpdateChecks = true;
  config.pages = [];
  let count = 0;
  function items(list, depth = 0) {
    if (depth > 4) fail('小分类最多嵌套四层');
    for (const item of list || []) {
      if (++count > 200) fail('最多保存200个网站和小分类');
      if (item.url) validateUrl(item.url);
      if (item.statusCheckUrl) validateUrl(item.statusCheckUrl);
      if (item.localUrl) validateUrl(item.localUrl);
      if (item.icon && /^(javascript|vbscript):/i.test(item.icon)) fail('图标地址无效');
      if (item.subItems) items(item.subItems, depth + 1);
    }
  }
  if ((config.sections || []).length > 60) fail('最多60个分类');
  let widgetCount = 0;
  for (const section of config.sections || []) {
    for (const widget of section.widgets || []) {
      if (++widgetCount > 100) fail('最多保存100个小组件');
      const type = widget.type?.toLowerCase();
      // Unsupported upstream widgets remain in KV; the UI shows a deferred card.
      if (!CLOUD_CAPABILITIES.widgets.includes(type)) continue;
      const options = widget.options || {};
      if (type === 'clock') {
        try { new Intl.DateTimeFormat(options.format || 'zh-CN', { timeZone: options.timeZone || 'UTC' }).format(); }
        catch { fail('时钟的时区或语言格式无效'); }
      }
      if (type === 'image') {
        if (typeof options.imagePath !== 'string' || !options.imagePath.trim()) fail('图片小组件需要图片地址');
        if (!/^\/(?!\/)/.test(options.imagePath)) validateUrl(options.imagePath);
      }
      if (type === 'iframe') {
        validateUrl(options.url);
        if (options.frameHeight !== undefined && (!Number.isFinite(options.frameHeight) || options.frameHeight < 80 || options.frameHeight > 1200)) fail('嵌入网页高度应为80至1200像素');
      }
    }
    items(section.items);
  }
  return config;
}
function migrate(old) {
  const config = structuredClone(DEFAULT_CONFIG);
  config.pageInfo.title = old.title || config.pageInfo.title;
  config.pageInfo.description = old.subtitle || config.pageInfo.description;
  const icons = { play: '🎬', activity: '📊', globe: '🌐', book: '📚', tool: '🛠️', cloud: '☁️', server: '🖥️', shield: '🛡️', code: '💻', music: '🎵' };
  const sections = new Map();
  for (const link of old.links || []) {
    // Only skip the two historically auto-generated defaults; preserve user entries.
    if ((link.id === 'monitor' && link.name === '订阅监控' && link.url === 'https://sub-monitor.chenran71ran.cc/') ||
      (link.id === 'emby' && link.name === 'Emby' && link.url === 'https://emby.chenran71ran.cc/')) continue;
    const name = link.category || '未分类';
    if (!sections.has(name)) sections.set(name, { name, items: [] });
    const section = sections.get(name);
    const item = { title: link.name, url: link.url, description: link.description || '', icon: link.iconData || icons[link.icon] || '🔗', target: 'newtab' };
    if (link.hidden) item.displayData = { hideFromHomepage: true };
    if (link.subcategory) {
      let group = section.items.find((g) => g.title === link.subcategory && g.subItems);
      if (!group) { group = { title: link.subcategory, subItems: [] }; section.items.push(group); }
      group.subItems.push(item);
    } else if (link.pinned) section.items.unshift(item);
    else section.items.push(item);
  }
  config.sections = [...sections.values()];
  return validateConfig(config);
}
async function readConfig(env) {
  if (!env.HOME_KV) fail('请检查现有 HOME_KV 绑定', 503);
  const stored = await env.HOME_KV.get(CONFIG_KEY);
  if (stored !== null) {
    try { return validateConfig(JSON.parse(stored)); }
    catch (e) { fail('云端配置无法读取：' + e.message, 503); }
  }
  const legacy = await env.HOME_KV.get(OLD_CONFIG_KEY);
  if (legacy !== null) {
    try { return migrate(JSON.parse(legacy)); }
    catch (e) { fail('旧配置转换失败：' + e.message + '。旧配置仍保留在原 KV 键中。', 503); }
  }
  return structuredClone(DEFAULT_CONFIG);
}
export default {
  async fetch(req, env) {
    try {
      const u = new URL(req.url), method = req.method;
      if (u.protocol === 'http:' && !['localhost', '127.0.0.1', '[::1]'].includes(u.hostname)) {
        u.protocol = 'https:'; return Response.redirect(u.href, 308);
      }
      if (u.pathname === '/api/login' && method === 'POST') {
        sameOrigin(req, u);
        const body = await limitedBody(req, 6000);
        await checkPassword(body?.password, env);
        await readConfig(env);
        return json({ ok: true }, 200, { 'set-cookie': cookie(req, await newSession(req, env), SESSION_SECONDS) });
      }
      if (u.pathname === '/api/logout' && method === 'POST') {
        sameOrigin(req, u);
        return json({ ok: true }, 200, { 'set-cookie': cookie(req, '', 0) });
      }
      if (u.pathname === '/api/session' && method === 'GET') {
        await authorize(req, env); return json({ authenticated: true });
      }
      if (u.pathname === '/api/theme-favorites' && ['GET','POST','PATCH'].includes(method)) {
        sameOrigin(req,u);await authorize(req,env);
        if(!env.HOME_KV)fail('HOME_KV 未绑定',503);
        const saved=await env.HOME_KV.get(FAVORITES_KEY);
        let favorites=saved===null?[]:JSON.parse(saved);
        if(method!=='GET') {
          const body=await limitedBody(req,20000);
          if(method==='POST') {
            if(!Array.isArray(body.favorites)||body.favorites.length>200||body.favorites.some(x=>typeof x!=='string'||!x||x.length>100))fail('收藏主题格式不正确');
            if(saved===null)favorites=[...new Set(body.favorites)];
          } else {
            if(typeof body.theme!=='string'||!body.theme||body.theme.length>100||typeof body.favorite!=='boolean')fail('收藏主题格式不正确');
            favorites=favorites.filter(x=>x!==body.theme);
            if(body.favorite)favorites.push(body.theme);
            if(favorites.length>200)fail('收藏主题数量过多');
          }
          if(method==='PATCH'||saved===null)await env.HOME_KV.put(FAVORITES_KEY,JSON.stringify(favorites));
        }
        return json({favorites,exists:saved!==null||method!=='GET'});
      }
      if(u.pathname==='/api/icon-image' && method==='GET') {
        sameOrigin(req,u);await authorize(req,env);
        const value=u.searchParams.get('url');
        if(!value||value.length>4096)fail('图标地址无效');
        const target=publicIconUrl(value);
        const digest=await crypto.subtle.digest('SHA-256',encoder.encode(target.href));
        const key='kenneth-home:icon:'+base64url(digest);
        const cached=await env.HOME_KV?.get(key);let data;
        if(cached)data=JSON.parse(cached);
        else {
          const {bytes,mime}=await fetchPublicIcon(target.href);
          let binary='';for(let at=0;at<bytes.length;at+=8192)binary+=String.fromCharCode(...bytes.slice(at,at+8192));
          data={mime,body:btoa(binary)};
          // Cache contention must never turn a successfully fetched image into an error.
          if(env.HOME_KV)try { await env.HOME_KV.put(key,JSON.stringify(data),{expirationTtl:86400}); } catch { /* Return the image even when the cache write is unavailable. */ }
        }
        return new Response(Uint8Array.from(atob(data.body),c=>c.charCodeAt(0)),{headers:{...BASE_HEADERS,'content-type':data.mime,'content-security-policy':"default-src 'none'; sandbox",'x-frame-options':'DENY'}});
      }
      if (['/conf.yml', '/api/config'].includes(u.pathname) && method === 'GET') {
        await authorize(req, env);
        const config = await readConfig(env);
        return json(u.pathname === '/conf.yml' ? config : { config });
      }
      if (u.pathname === '/api/icon-discovery' && method === 'POST') {
        sameOrigin(req, u); await authorize(req, env);
        const body = await limitedBody(req, 4096);
        try { return json(await discoverIcon(body.origin)); }
        catch (error) { return json({ icon: '', source: 'unavailable', reason: ['dns','request','html','timeout'].includes(error.iconReason)?error.iconReason:'public-site-required' }); }
      }
      if (u.pathname === '/api/config' && ['POST', 'PUT'].includes(method)) {
        sameOrigin(req, u); await authorize(req, env);
        if (!env.HOME_KV) fail('HOME_KV 未绑定，修改尚未保存', 503);
        const body = await limitedBody(req);
        const config = validateConfig(body.config || body);
        await env.HOME_KV.put(CONFIG_KEY, JSON.stringify(config));
        return json({ success: true, message: '配置已保存到云端', config });
      }
      if (u.pathname === '/api/weather' && method === 'GET') {
        sameOrigin(req, u); await authorize(req, env);
        return json(await readWeather(u.searchParams, env));
      }
      if (u.pathname.startsWith('/api/')) return json({ error: '接口或方法不存在' }, 404);
      // No unauthenticated config-file fallback through SPA/static assets.
      if (/\.ya?ml$/i.test(u.pathname) || /^\/(?:config-manager|status-check|ping-check|system-info|cors-proxy|schema|get-user)(?:\/|$)/.test(u.pathname)) {
        await authorize(req, env); return json({ error: '此服务不在基础导航站范围内' }, 404);
      }
      if (!['GET', 'HEAD'].includes(method)) return json({ error: '请求方法不支持' }, 405);
      const response = await env.ASSETS.fetch(req);
      const headers = new Headers(response.headers);
      headers.set('x-content-type-options', 'nosniff');
      headers.set('referrer-policy', 'no-referrer');
      headers.set('x-frame-options', 'DENY');
      if (headers.get('content-type')?.includes('text/html')) headers.set('cache-control', 'no-store');
      return new Response(response.body, { status: response.status, headers });
    } catch (e) {
      return json({ success: false, error: e.status ? e.message : '服务暂时不可用，请重试', message: e.status ? e.message : '服务暂时不可用，请重试' }, e.status || 503);
    }
  },
};
