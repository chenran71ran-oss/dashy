<template>
  <main class="cloud-login" :style="themeStyles" :data-login-theme="theme">
    <div class="login-content">
    <div class="login-shell">
      <section class="login-identity" aria-labelledby="portal-title">
        <MechLogo syncFavicon class="login-mech" />
        <p class="login-wordmark">PERSONAL PORTAL</p>
        <h1 id="portal-title">Home Lab<span aria-hidden="true">.</span></h1>
        <p class="login-intro">你的站点、工具与灵感，<br class="desktop-break">从这里开始。</p>
      </section>
      <form class="cloud-login-panel" @submit.prevent="login" aria-labelledby="login-title" :aria-busy="busy">
        <div class="login-form-heading"><span class="login-kicker">WELCOME BACK</span><h2 id="login-title">进入你的空间</h2></div>
        <label for="admin-password">管理员密码</label>
        <div class="login-password-field">
          <input id="admin-password" name="password" v-model="password" :type="revealPassword ? 'text' : 'password'" autocomplete="current-password" required :disabled="busy" :aria-invalid="!!error" aria-describedby="login-error" placeholder="请输入密码">
          <button class="password-reveal" type="button" :aria-label="revealPassword ? '隐藏密码' : '显示密码'" :aria-pressed="revealPassword" :disabled="busy" @click="revealPassword = !revealPassword">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/><path v-if="revealPassword" d="m3 3 18 18"/></svg>
          </button>
        </div>
        <p id="login-error" class="cloud-error" role="alert">{{ error }}</p>
        <button class="login-submit" type="submit" :disabled="busy"><span>{{ busy ? '正在登录…' : '进入总站' }}</span><span aria-hidden="true">{{ busy ? '···' : '→' }}</span></button>
        <p class="login-helper">登录后继续你的导航与工作台。</p>
      </form>
    </div>
    <p class="login-footer"><span class="login-footer-brand">HOME LAB</span><span class="login-footer-divider" aria-hidden="true">/</span><span class="login-footer-copy">你的个人工作空间</span></p>
    </div>
  </main>
</template>
<script setup>
import { ref,onMounted,onBeforeUnmount } from 'vue';
import MechLogo from './components/PageStrcture/MechLogo.vue';
import { resolveLoginAppearance,applyLoginAppearance } from './utils/LoginAppearance';
const emit=defineEmits(['authenticated']);
const password=ref(''),busy=ref(false),error=ref(''),revealPassword=ref(false);
const theme=ref('nord-frost'),themeStyles=ref({});
let savedAppearance={},alive=true;
let controller,refreshTimer;
function syncAppearance(){
  const appearance=resolveLoginAppearance(savedAppearance);
  theme.value=appearance.theme;themeStyles.value=applyLoginAppearance(appearance);
}
syncAppearance();
async function refreshAppearance(){
  if(document.hidden || controller)return;
  controller=new AbortController();
  const timer=setTimeout(()=>controller?.abort(),3000);
  try{
    const response=await fetch('/api/login-appearance',{credentials:'same-origin',cache:'no-store',signal:controller.signal});
    if(response.ok && alive){savedAppearance=await response.json();if(alive)syncAppearance();}
  }catch{/* Keep the last successful appearance while offline. */}
  finally{clearTimeout(timer);controller=undefined;}
}
onMounted(()=>{
  refreshAppearance();refreshTimer=setInterval(refreshAppearance,15000);
  window.addEventListener('focus',refreshAppearance);document.addEventListener('visibilitychange',refreshAppearance);
});
onBeforeUnmount(()=>{alive=false;controller?.abort();clearInterval(refreshTimer);window.removeEventListener('focus',refreshAppearance);document.removeEventListener('visibilitychange',refreshAppearance);});
async function login(){
  if(busy.value)return;
  busy.value=true;error.value='';
  try{
    const response=await fetch('/api/login',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({password:password.value})});
    const data=await response.json();if(!response.ok)throw new Error(data.error||'登录失败');
    password.value='';revealPassword.value=false;emit('authenticated');
  }catch(e){error.value=e.message||'网络连接失败，请重试';}
  finally{busy.value=false;}
}
</script>
<style scoped>
.cloud-login{position:fixed;inset:0;overflow:auto;box-sizing:border-box;display:flex;flex-direction:column;justify-content:center;align-items:center;min-height:100dvh;padding:48px 24px 28px;background:var(--login-page,#eceff4);color:var(--login-page-text,#2e3440);font-family:var(--login-font,system-ui,sans-serif);color-scheme:light dark;isolation:isolate}.cloud-login::before{content:"";position:fixed;inset:0;z-index:-1;pointer-events:none;background:radial-gradient(ellipse at 5% 12%,color-mix(in srgb,var(--login-accent) var(--login-glow-start),transparent),transparent 58%),radial-gradient(ellipse at 95% 90%,color-mix(in srgb,var(--login-accent) var(--login-glow-end),transparent),transparent 55%)}
.login-content{display:flex;flex-direction:column;align-items:center;gap:28px;width:min(100%,752px);margin:auto 0;flex-shrink:0}
.login-shell{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,368px);align-items:center;gap:40px;width:100%}
.login-identity{min-width:0;padding:20px 0}.login-mech{width:120px;height:120px;margin-bottom:28px}.login-wordmark{font-size:11px;font-weight:700;letter-spacing:.18em;line-height:1.5;margin:0 0 12px}.login-identity h1{font-family:var(--font-headings,inherit);font-size:52px;line-height:1.12;letter-spacing:-.04em;font-weight:750;margin:0 0 20px}.login-identity h1 span{color:var(--login-focus)}.login-intro{font-size:18px;line-height:1.75;margin:0;max-width:28ch}
.cloud-login-panel{box-sizing:border-box;min-width:0;width:100%;padding:36px 32px 28px;background:var(--login-panel);color:var(--login-text);border:1px solid color-mix(in srgb,var(--login-accent) 24%,var(--login-panel));border-top:3px solid var(--login-accent);border-radius:16px;box-shadow:0 18px 60px color-mix(in srgb,var(--login-page-text) 10%,transparent)}
.login-kicker{font-size:10px;font-weight:700;letter-spacing:.15em;color:var(--login-muted)}.login-form-heading h2{font-size:25px;line-height:1.4;margin:10px 0 8px;letter-spacing:-.025em}
.cloud-login label{display:block;font-size:13px;font-weight:650;margin:26px 0 10px}.login-password-field{position:relative;min-width:0}.cloud-login input{box-sizing:border-box;display:block;width:100%;min-height:50px;padding:12px 52px 12px 14px;background:var(--login-field);color:var(--login-field-text);border:1px solid color-mix(in srgb,var(--login-field-text) 35%,transparent);border-radius:6px;font:inherit;font-size:16px}.cloud-login input::placeholder{color:var(--login-field-muted);opacity:1}.cloud-login input:focus{outline:2px solid var(--login-focus);outline-offset:-1px}.cloud-login input[aria-invalid=true]{border-color:var(--login-error)}
.password-reveal{position:absolute;right:2px;top:2px;display:grid;place-items:center;width:46px;height:46px;border:0;border-radius:4px;background:transparent;color:var(--login-field-muted);cursor:pointer}.password-reveal svg{width:20px;height:20px}.password-reveal:hover{background:color-mix(in srgb,var(--login-text) 8%,transparent)}
.cloud-error{min-height:24px;font-size:13px;line-height:1.6;color:var(--login-error);margin:8px 0 10px;overflow-wrap:anywhere}.login-submit{display:flex;align-items:center;justify-content:space-between;box-sizing:border-box;width:100%;min-height:50px;padding:12px 16px;border:1px solid var(--login-focus);border-radius:6px;background:var(--login-accent);color:var(--login-on-accent);font:inherit;font-size:15px;font-weight:700;cursor:pointer}.login-submit:hover{filter:brightness(.96)}.cloud-login button:focus-visible{outline:2px solid var(--login-focus);outline-offset:3px}.cloud-login button:disabled{opacity:.65;cursor:wait}.login-helper{font-size:12px;line-height:1.7;margin:18px 0 0;color:var(--login-muted)}.login-footer{display:flex;justify-content:center;align-items:center;gap:12px;font-size:11px;line-height:1.6;text-align:center;letter-spacing:.06em;margin:0}.login-footer-brand{font-weight:650;letter-spacing:.12em}
@media(max-width:700px){
  .cloud-login{padding:32px 20px 24px}
  .login-content{width:min(100%,384px);gap:20px}
  .login-shell{grid-template-columns:minmax(0,1fr);gap:26px}
  .login-identity{display:flex;flex-direction:column;align-items:center;text-align:center;padding:0}
  .login-mech{width:80px;height:80px;margin:0 0 16px}
  .login-wordmark{font-size:10px;margin:0 0 6px}
  .login-identity h1{font-size:36px;line-height:1.1;margin:0}
  .login-intro{font-size:15px;line-height:1.7;margin:12px 0 0;max-width:100%;text-wrap:balance}
  .desktop-break{display:none}
  .cloud-login-panel{padding:26px 24px 24px}
  .login-form-heading{text-align:center}
  .login-form-heading h2{font-size:23px;margin-bottom:0}
  .cloud-login label{font-size:14px;margin-top:24px}
  .login-submit{position:relative;justify-content:center}
  .login-submit>span:last-child{position:absolute;right:16px}
  .login-helper{font-size:13px;text-align:center}
  .login-footer{flex-direction:column;gap:4px;width:100%;padding-top:18px;border-top:1px solid color-mix(in srgb,var(--login-page-text) 15%,transparent)}
  .login-footer-brand{font-size:10px}
  .login-footer-copy{font-size:12px;letter-spacing:.04em}
  .login-footer-divider{display:none}
}
@media(max-width:360px){.cloud-login{padding:20px 16px}.cloud-login-panel{padding:24px 20px}.login-intro{font-size:16px}}
@media(prefers-reduced-motion:no-preference){.login-submit,.password-reveal{transition:background-color .15s,filter .15s}}
</style>
