import assert from 'node:assert/strict';
import test from 'node:test';
import {readFile} from 'node:fs/promises';
import {gzipSync} from 'node:zlib';
import {readPoetryIndex} from '../src/library.mjs';
import {exportShelf,parseFragment} from '../src/core.mjs';

const root=new URL('../',import.meta.url);
const page='https://example.org/poetry';
const entries=[{id:'sonnet',aliases:['archive-0000000000000001'],verseCount:14}];

test('a curated poem keeps bookmarks, line numbers and saved shelves from its archive edition',()=>{
  assert.deepEqual(parseFragment('#poem=archive-0000000000000001&line=3',entries),{item:entries[0],line:3});
  assert.deepEqual(exportShelf(['archive-0000000000000001','sonnet'],entries).ids,['sonnet']);
});

test('inline books and the compressed standalone book resolve to the same records',async()=>{
  const book=Buffer.from(JSON.stringify(entries));
  const pack={encoding:'gzip-base64',bytes:book.length,body:gzipSync(book).toString('base64')};
  assert.deepEqual(await readPoetryIndex(entries,page),entries);
  assert.deepEqual(await readPoetryIndex(pack,page),entries);
  await assert.rejects(readPoetryIndex({...pack,bytes:book.length+1},page),/incomplete/);
});

test('the hosted index allows same-origin JSON and rejects remote, redirected or unavailable books',async t=>{
  const fetch=t.mock.method(globalThis,'fetch',async (url,options)=>{
    assert.equal(url.href,'https://example.org/editions/selected.json');
    assert.equal(options.redirect,'error');
    return Response.json(entries);
  });
  assert.deepEqual(await readPoetryIndex('/editions/selected.json',page),entries);
  await assert.rejects(readPoetryIndex('https://other.example.org/book.json',page));
  await assert.rejects(readPoetryIndex('data:application/json,[]',page));
  assert.equal(fetch.mock.callCount(),1);
  fetch.mock.mockImplementationOnce(async()=>new Response(null,{status:404}));
  await assert.rejects(readPoetryIndex('/editions/selected.json',page),/could not load/);
  fetch.mock.mockImplementationOnce(async()=>Response.json([]));
  await assert.rejects(readPoetryIndex('/editions/selected.json',page),/Empty/);
});

test('every museum record and source audit is distributed with its original attribution',async()=>{
  const read=path=>readFile(new URL(path,root));
  const catalogue=JSON.parse(await read('dist/assets/gallery/works.json'));
  assert.equal(catalogue.works.length,3);
  for(const work of catalogue.works){
    assert.equal(new URL(work.url).hostname,'www.nga.gov');
    assert.equal(new URL(work.rightsUrl).hostname,'www.nga.gov');
    assert(work.creditLine&&work.medium&&work.accession&&work.alt);
    for(const file of [work.mobileImage,work.image]){
      const webp=await read('dist/'+file);
      assert.equal(webp.toString('ascii',8,12),'WEBP');
    }
  }
  for(const source of ['source-audit-20261112.json','editions-20261124.json']){
    assert.deepEqual(await read('dist/data/'+source),await read('data/'+source));
  }
});
