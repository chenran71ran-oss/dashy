// Cloud-hosted Home Lab uses one root-owned appearance across all devices/pages.
export const appearanceKeys=['theme','dayTheme','nightTheme','customColors'];
export function withoutLocalAppearance(config={}) {
  return Object.fromEntries(Object.entries(config).filter(([key])=>!appearanceKeys.includes(key)));
}
export function withSharedAppearance(config={},shared={}) {
  return {...withoutLocalAppearance(config),...Object.fromEntries(appearanceKeys.filter(key=>Object.hasOwn(shared,key)).map(key=>[key,shared[key]]))};
}
let writes=Promise.resolve(),nextWrite=0;
async function send(theme,options) {
  const response=await fetch('/api/theme',{method:'PATCH',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({theme,...options}),signal:AbortSignal.timeout(8000)});
  const data=await response.json();
  if(!response.ok)throw new Error(data.error||'主题未保存，请重试');
  return data;
}
export function saveSharedTheme(theme,options={}) {
  writes=writes.catch(()=>{}).then(async()=>{
    const delay=Math.max(0,nextWrite-Date.now());if(delay)await new Promise(resolve=>setTimeout(resolve,delay));
    try{return await send(theme,options);}finally{nextWrite=Date.now()+1100;}
  });
  return writes;
}
