// Isolated visual demo. No requests or real credentials leave this page.
import { createApp } from 'vue';
import CloudLogin from '../src/CloudLogin.vue';
import '../src/styles/login-palettes.scss';
let selectedTheme='material-original';

window.fetch=async url=>Response.json(url==='/api/login-appearance'?{theme:selectedTheme}:{error:'这是设计预览，不校验或发送真实密码。'},{status:url==='/api/login-appearance'?200:401});
window.addEventListener('message',event=>{
  if(event.source!==window.parent || typeof event.data?.previewTheme!=='string')return;
  selectedTheme=event.data.previewTheme;window.dispatchEvent(new Event('focus'));
});
createApp(CloudLogin).mount('#app');
document.querySelector('input[name=password]').placeholder='设计预览，无需输入真实密码';
