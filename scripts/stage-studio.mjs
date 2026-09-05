import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const output=path.join(root,'studio/dist/client'),docs=path.join(root,'docs');
if(!fs.existsSync(path.join(output,'index.html')))throw new Error('Build studio first.');
for(const entry of fs.readdirSync(output)){
 if(['.vite','.assetsignore','_headers'].includes(entry))continue;
 fs.cpSync(path.join(output,entry),path.join(docs,entry),{recursive:true});
}
// Old HashRouter capability bookmarks should keep opening their original detail.
const index=path.join(docs,'index.html');let html=fs.readFileSync(index,'utf8');
html=html.replace('<head>','<head><script>if(location.hash.startsWith("#/capability/"))location.replace("/classic/"+location.hash);</script>');
fs.writeFileSync(index,html);
fs.writeFileSync(path.join(docs,'.nojekyll'),'');
fs.writeFileSync(path.join(docs,'CNAME'),'piguannan.com\n');
console.log('Staged the static studio into docs without removing existing pages.');
