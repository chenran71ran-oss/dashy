import { favoriteThemesKey, readThemeFavorites } from './ThemeCatalog';
async function request(method='GET', body) {
  const response=await fetch('/api/theme-favorites',{method,credentials:'same-origin',cache:'no-store',headers:body?{'Content-Type':'application/json'}:{},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(8000)});
  if(!response.ok)throw new Error('收藏同步失败，请稍后重试');
  return response.json();
}
export function cacheFavorites(favorites) {
  try { localStorage.setItem(favoriteThemesKey,JSON.stringify(favorites)); } catch { /* Cloud storage remains authoritative. */ }
  window.dispatchEvent(new Event('home-lab-theme-favorites'));
}
export async function loadFavoriteThemes() {
  const local=readThemeFavorites(localStorage);
  if(!window.__KH_CLOUD_AUTH)return local;
  let result=await request();
  // Import existing desktop stars only when the shared list has never been created.
  if(!result.exists&&local.length)result=await request('POST',{favorites:local});
  cacheFavorites(result.favorites);return result.favorites;
}
export async function setFavoriteTheme(theme,favorite) {
  if(!window.__KH_CLOUD_AUTH){const saved=readThemeFavorites(localStorage).filter(x=>x!==theme);if(favorite)saved.push(theme);cacheFavorites(saved);return saved;}
  const result=await request('PATCH',{theme,favorite});cacheFavorites(result.favorites);return result.favorites;
}
