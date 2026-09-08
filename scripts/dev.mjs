import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..', 'dist');
const port = Number(process.env.PORT || 3000);
const host = process.env.HOST || '0.0.0.0';

const mime = new Map([
  ['.html', 'text/html; charset=utf-8'], ['.js', 'text/javascript; charset=utf-8'],
  ['.css', 'text/css; charset=utf-8'], ['.json', 'application/json; charset=utf-8'],
  ['.svg', 'image/svg+xml'], ['.png', 'image/png'], ['.jpg', 'image/jpeg'],
  ['.jpeg', 'image/jpeg'], ['.webp', 'image/webp'], ['.ico', 'image/x-icon'], ['.txt', 'text/plain; charset=utf-8'],
]);
function safeFile(urlPath) {
  const clean = decodeURIComponent(urlPath.split('?')[0]).replace(/^\/+/, '');
  const candidate = path.resolve(root, clean || 'index.html');
  return candidate.startsWith(root + path.sep) || candidate === root ? candidate : null;
}
function sendFile(res, filename) {
  fs.readFile(filename, (error, data) => {
    if (error) { res.writeHead(500, {'content-type':'text/plain; charset=utf-8'}); res.end('Unable to read static file.'); return; }
    const ext = path.extname(filename).toLowerCase();
    res.writeHead(200, {
      'content-type': mime.get(ext) || 'application/octet-stream',
      // Never cache local QA files: prevents stale UI after a rebuild.
      'cache-control': 'no-store, no-cache, must-revalidate, max-age=0',
      'pragma': 'no-cache', 'expires': '0'
    });
    res.end(data);
  });
}
const server = http.createServer((req,res)=>{
  if(req.method!=='GET'&&req.method!=='HEAD'){res.writeHead(405,{allow:'GET, HEAD'});res.end();return;}
  const candidate=safeFile(req.url||'/');
  if(candidate&&fs.existsSync(candidate)&&fs.statSync(candidate).isFile()){
    if(req.method==='HEAD'){res.writeHead(200,{'content-type':mime.get(path.extname(candidate).toLowerCase())||'application/octet-stream','cache-control':'no-store'});res.end();return;}
    sendFile(res,candidate);return;
  }
  const index=path.join(root,'index.html');
  if(req.method==='HEAD'){res.writeHead(200,{'content-type':'text/html; charset=utf-8','cache-control':'no-store'});res.end();}
  else sendFile(res,index);
});
server.on('error',(error)=>{
  if(error?.code==='EADDRINUSE'){
    console.error(`\nPort ${port} is already in use. Close the existing server or run:`);
    console.error(`  $env:PORT=3001; npm run dev:static\n`);
    process.exit(1);
  }
  throw error;
});
server.listen(port,host,()=>{
  console.log(`ADOPTVILLA static build running at http://localhost:${port}`);
  console.log('Tip: for development use `npm run dev` (Vite source server).');
});
