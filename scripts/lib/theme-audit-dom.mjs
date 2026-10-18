import {Window} from 'happy-dom';
export function themeAuditDom(css) {
  const page=new Window({url:'https://audit.example'});
  const native=page.getComputedStyle.bind(page);
  const normalize=color=>{
    if(/^#[a-f\d]{3,8}$/i.test(color)) {
      let hex=color.slice(1);if(hex.length<=4)hex=[...hex].map(x=>x+x).join('');
      const values=[0,2,4].map(at=>parseInt(hex.slice(at,at+2),16));
      if(hex.length===8)values.push(parseInt(hex.slice(6,8),16)/255);
      return `${values.length===4?'rgba':'rgb'}(${values.join(', ')})`;
    }
    return ({white:'rgb(255, 255, 255)',black:'rgb(0, 0, 0)',transparent:'rgba(0, 0, 0, 0)'})[color]||color;
  };
  page.getComputedStyle=element=>{
    const computed=native(element);
    return new Proxy(computed,{get(target,key){
      if(key!=='color')return typeof target[key]==='function'?target[key].bind(target):target[key];
      let value=element.style.color || target.color || '';
      for(let depth=0;depth<20 && value.includes('var(');depth++)value=value.replace(/var\((--[\w-]+)(?:,\s*([^()]*))?\)/g,(_,name,fallback)=>native(page.document.documentElement).getPropertyValue(name).trim()||fallback||'');
      return normalize(value);
    }});
  };
  const style=page.document.createElement('style');style.textContent=css;page.document.head.append(style);
  return page;
}
