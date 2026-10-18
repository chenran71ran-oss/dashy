import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../cloud/worker.mjs';
test('signed-out appearance reads expose only validated theme colors',async()=>{
  let writes=0;
  const config={pageInfo:{title:'Private title'},sections:[{name:'Private section',items:[{title:'Private',url:'https://private.example/?token=secret'}]}],appConfig:{theme:'material-original',dayTheme:'nord-frost',nightTheme:'dracula',customColors:{'material-original':{primary:'#123456',background:'#fafafa','font-body':'private-font','background-image':'url(https://private.example/secret.png)'}}}};
  const env={ADMIN_TOKEN:'never-public',HOME_KV:{get:async()=>JSON.stringify(config),put:async()=>writes++}};
  const response=await worker.fetch(new Request('https://home.example/api/login-appearance'),env);
  assert.equal(response.status,200);
  const data=await response.json();
  assert.deepEqual(data,{theme:'material-original',dayTheme:'nord-frost',nightTheme:'dracula',customColors:{'material-original':{primary:'#123456',background:'#fafafa'}}});
  assert.equal(writes,0);assert.ok(!JSON.stringify(data).includes('private'));assert.ok(!JSON.stringify(data).includes('never-public'));
  assert.equal((await worker.fetch(new Request('https://home.example/api/config'),env)).status,401);
});
test('appearance failures cannot prevent rendering the login form',async()=>{
  const response=await worker.fetch(new Request('https://home.example/api/login-appearance'),{HOME_KV:{get:async()=>{throw new Error('offline');}}});
  assert.equal(response.status,200);assert.equal((await response.json()).theme,'nord-frost');
});
