<template>
  <main class="cloud-login">
    <form class="cloud-login-panel" @submit.prevent="login">
      <MechLogo syncFavicon />
      <p class="cloud-label">HOME LAB / PERSONAL PORTAL</p>
      <h1>Home Lab</h1>
      <p>输入管理员密码，进入你的导航面板。</p>
      <label for="admin-password">管理员密码</label>
      <input id="admin-password" v-model="password" type="password" autocomplete="current-password" required autofocus :disabled="busy">
      <p class="cloud-error" role="alert">{{ error }}</p>
      <button type="submit" :disabled="busy">{{ busy ? '正在登录…' : '进入总站 →' }}</button>
      <small>网站与分类由你添加 · 云端保存</small>
    </form>
  </main>
</template>
<script setup>
import { ref } from 'vue';
import MechLogo from './components/PageStrcture/MechLogo.vue';
const emit = defineEmits(['authenticated']);
const password = ref('');
const busy = ref(false);
const error = ref('');
async function login() {
  busy.value = true;
  error.value = '';
  try {
    const response = await fetch('/api/login', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: password.value }) });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || '登录失败');
    password.value = '';
    emit('authenticated');
  } catch (e) { error.value = e.message || '网络连接失败，请重试'; }
  finally { busy.value = false; }
}
</script>
<style>
.cloud-login{position:fixed;inset:0;overflow:auto;box-sizing:border-box;display:grid;place-items:center;background:#3b4252;color:#d8dee9;padding:24px;font-family:Raleway,"Microsoft YaHei",sans-serif;background-image:linear-gradient(#88c0d00a 1px,transparent 1px),linear-gradient(90deg,#88c0d00a 1px,transparent 1px);background-size:32px 32px}
.cloud-login-panel{box-sizing:border-box;width:min(100%,430px);padding:32px;background:#2e3440;border:5px solid #88c0d0;box-shadow:0 8px 24px #0003;border-radius:8px}
.cloud-login h1{font-size:30px;margin:12px 0}.cloud-login p{line-height:1.6;font-size:14px}.cloud-label{font-family:monospace;color:#88c0d0;font-size:11px!important;letter-spacing:1px}.cloud-login label{display:block;margin:24px 0 8px;font-size:14px}.cloud-login input{box-sizing:border-box;width:100%;padding:13px;background:#434c5e;border:1px solid #81a1c1;border-radius:5px;color:#eceff4;font-size:16px}.cloud-login input:focus{outline:2px solid #88c0d0;outline-offset:3px}.cloud-login button{width:100%;min-height:46px;border:0;border-radius:5px;background:#88c0d0;color:#2e3440;cursor:pointer;font-size:16px;font-weight:700}.cloud-login button:disabled{opacity:.6}.cloud-error{min-height:22px;color:#bf616a}.cloud-login small{display:block;text-align:center;margin-top:20px;color:#9aa4b7}
</style>
