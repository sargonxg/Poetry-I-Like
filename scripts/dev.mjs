import {createServer} from 'node:http';
import {readFile, realpath} from 'node:fs/promises';
import {extname, resolve, sep} from 'node:path';
const root=await realpath('dist');
const policyPrefix='Content-Security-Policy: ';
const types={'.html':'text/html; charset=utf-8','.json':'application/json; charset=utf-8','.gz':'application/octet-stream','.mp3':'audio/mpeg','.webp':'image/webp','.png':'image/png','.svg':'image/svg+xml','.txt':'text/plain; charset=utf-8'};
const port=Number(process.env.PORT || 5175);
if (!Number.isInteger(port)||port<1024||port>65535) throw Error('PORT must be an integer from 1024 to 65535');
createServer(async (request,response)=>{
 if(request.method!=='GET'&&request.method!=='HEAD'){response.writeHead(405,{Allow:'GET, HEAD'}).end();return;}
 try {
  const pathname=decodeURIComponent(new URL(request.url,'http://127.0.0.1').pathname);
  const file=await realpath(resolve(root,'.'+(pathname==='/'?'/index.html':pathname)));
  const type=types[extname(file)];
  if(!type || !file.startsWith(root+sep)) throw Error('File unavailable');
  const bytes=await readFile(file);
  const fields={'Content-Type':type,'Content-Length':bytes.length,'X-Content-Type-Options':'nosniff'};
  if (type.startsWith('text/html')) {
   const headers=await readFile(resolve(root,'_headers'),'utf8');
   const policy=headers.split('\n').map(line=>line.trim()).find(line=>line.startsWith(policyPrefix));
   fields['Content-Security-Policy']=policy.slice(policyPrefix.length);
  }
  response.writeHead(200,fields);
  response.end(request.method==='HEAD'?undefined:bytes);
 } catch {
  response.writeHead(404,{'Content-Type':'text/html; charset=utf-8','X-Content-Type-Options':'nosniff'});
  response.end(request.method==='HEAD'?undefined:await readFile(resolve(root,'404.html')));
 }
}).listen(port,'127.0.0.1',()=>console.log('Reading room: http://127.0.0.1:'+port));
