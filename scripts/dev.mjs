import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
const files = new Map([['/', ['dist/index.html','text/html']], ['/index.html',['dist/index.html','text/html']], ['/data/poems.json',['dist/data/poems.json','application/json']], ['/data/provenance.json',['dist/data/provenance.json','application/json']], ['/data/reading-guides.json',['dist/data/reading-guides.json','application/json']]]);
const port = Number(process.env.PORT || 5175);
if (!Number.isInteger(port) || port < 1024 || port > 65535) throw Error('PORT must be an integer from 1024 to 65535');
createServer(async (req,res) => { try { const path = new URL(req.url,'http://127.0.0.1').pathname; const file = files.get(path); if(!file) { res.writeHead(404,{'Content-Type':'text/html'});res.end(await readFile('dist/404.html'));return; }res.writeHead(200,{'Content-Type':file[1]+'; charset=utf-8','X-Content-Type-Options':'nosniff'});res.end(await readFile(file[0])); }catch {res.writeHead(500);res.end('Build the app first.');} }).listen(port,'127.0.0.1',()=>console.log('Reading room: http://127.0.0.1:' + port));
