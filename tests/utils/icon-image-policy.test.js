import {iconCrossOrigin} from '@/utils/IconImagePolicy';
afterEach(()=>{delete window.__KH_CLOUD_AUTH;});
it('makes direct HTTPS, HTTP and protocol-relative external images anonymous in cloud mode',()=>{
 window.__KH_CLOUD_AUTH=true;
 for(const source of ['https://private.example/favicon.ico','http://private.example/icon.png','//private.example/logo.png'])expect(iconCrossOrigin(source)).toBe('anonymous');
});
it('keeps proxy and bundled images same-origin',()=>{
 window.__KH_CLOUD_AUTH=true;
 expect(iconCrossOrigin('/api/icon-image?url=https%3A%2F%2Fprivate.example')).toBeUndefined();
 expect(iconCrossOrigin('/portal-icons/paperless-gpt.svg')).toBeUndefined();
});
it('preserves the existing non-cloud deployment behavior',()=>{
 expect(iconCrossOrigin('https://public.example/icon.png')).toBeUndefined();
});
