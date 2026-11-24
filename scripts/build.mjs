import { readFile, writeFile, mkdir, rm, copyFile, cp } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const read = path => readFile(path, 'utf8');
const collection = JSON.parse(await read('data/poems.json'));
const source = await read('src/index.html');
const guides = await read('data/reading-guides.json');
const archive = JSON.parse(await read('data/archive/manifest.json'));
const archiveFiles = {base:'data/archive/', entries:archive.entries, attribution:archive.attribution,
  catalogue:archive.catalogue, shelves:archive.shelves};
const forest = Buffer.from(await read('assets/forest.svg')).toString('base64');
const serifFont=(await readFile('assets/fonts/source-serif4-latin.woff2')).toString('base64');
const serifExtFont=(await readFile('assets/fonts/source-serif4-latin-ext.woff2')).toString('base64');
const css = (await read('src/style.css')).replace('/*__FOREST__*/', 'data:image/svg+xml;base64,' + forest).replace('/*__SERIF_FONT__*/','data:font/woff2;base64,'+serifFont).replace('/*__SERIF_EXT_FONT__*/','data:font/woff2;base64,'+serifExtFont);
const modules = await Promise.all(['core','audio','library','reading-music','app'].map(name => read('src/' + name + '.mjs')));
const runtime = modules.map(source => source.replace(/^import[^\n]+\n/gm, '').replace(/^export /gm, '')).join('\n');
const data = JSON.stringify(collection).replaceAll('<', '\\u003c');
const html = source.replace('/*__STYLE__*/', () => css).replace('/*__DATA__*/', () => data)
  .replace('/*__GUIDES__*/', () => guides.replaceAll('<', '\\u003c'))
  .replace('/*__ARCHIVE__*/', () => JSON.stringify(archiveFiles)).replace('/*__SCRIPT__*/', () => runtime);
await rm('dist', {recursive:true, force:true}); await mkdir('dist', {recursive:true});
await writeFile('dist/index.html', html);
await mkdir('dist/assets',{recursive:true});
for (const folder of ['ambience','pixel']) await cp('assets/'+folder,'dist/assets/'+folder,{recursive:true});
await writeFile('dist/404.html', '<!doctype html><html lang="en"><meta charset="utf-8"><title>Page not found</title><h1>That page is not here.</h1><p><a href="/">Return to the reading room</a></p></html>');
const hash=value=>createHash('sha256').update(value).digest('base64');
const csp="default-src 'none'; script-src 'sha256-"+hash(runtime)+"'; style-src 'sha256-"+hash(css)+"'; img-src 'self' data:; connect-src 'self'; font-src data:; media-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'; object-src 'none'";
await writeFile('dist/_headers', '/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: no-referrer\n  Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()\n  Content-Security-Policy: '+csp+'\n');
await mkdir('dist/licenses',{recursive:true});await copyFile('assets/fonts/SOURCE-SERIF-4-OFL.txt','dist/licenses/SOURCE-SERIF-4-OFL.txt');
await mkdir('dist/data', {recursive:true}); await copyFile('data/poems.json','dist/data/poems.json'); await copyFile('data/provenance.json','dist/data/provenance.json'); await copyFile('data/reading-guides.json','dist/data/reading-guides.json');
await cp('data/archive','dist/data/archive',{recursive:true});
console.log(JSON.stringify({built:true,html_bytes:Buffer.byteLength(html),poems:collection.filter(item=>item.kind==='poem').length,reading_references:collection.filter(item=>item.kind==='reading').length,archive_entries:archive.entries,sha256:createHash('sha256').update(html).digest('hex')},null,2));
