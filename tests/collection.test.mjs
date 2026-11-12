import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {THEMES, fullTexts, filterCollection, nextRandom, safeSource, normalizeSaved} from '../src/core.mjs';
const data = JSON.parse(await readFile(new URL('../data/poems.json',import.meta.url)));
test('at least 100 real poems keep source and rights metadata, separately from protected readings',()=>{
 const texts=fullTexts(data); assert.equal(texts.length,121);assert.equal(new Set(texts.map(x=>x.poet)).size,104);assert.equal(new Set(data.map(x=>x.id)).size,data.length);
 for(const item of data){assert(safeSource(item.source));assert(item.themes.every(theme=>THEMES.includes(theme)));assert(item.note);if(item.rights.mode==='reference-only')assert.deepEqual(item.lines,[]);else{assert(item.rights.basis);assert(item.rights.authorDied<1930);if(item.rights.editionYear)assert(item.rights.editionYear<1931);else{assert.equal(item.rights.collectionLicense,'CC-BY-4.0');assert(item.rights.authorDied<1907);}}}
 assert.equal(data.filter(x=>x.rights.mode==='reference-only').length,50);
});
test('search applies words, theme and language together',()=>{
 assert.equal(filterCollection(data,{query:'lazarus colossus',theme:'liberty',language:'en'})[0].id,'lazarus-new-colossus');assert.equal(filterCollection(data,{query:'lazarus',language:'fr'}).length,0);
});
test('random selection does not repeat the current poem and empty shelves are safe',()=>{assert.equal(nextRandom([], 'x'),null);assert.equal(nextRandom([{id:'a'},{id:'b'}],'a',()=>0).id,'b');assert.equal(nextRandom([{id:'a'}],'a').id,'a');});
test('saved shelf discards unknown or malformed IDs',()=>{assert.deepEqual(normalizeSaved(['lazarus-new-colossus','bad','lazarus-new-colossus',{}],data),['lazarus-new-colossus']);assert.equal(filterCollection(data,{savedOnly:true,saved:['lazarus-new-colossus']}).length,1);});
test('source URLs reject active and credential-bearing schemes',()=>{for(const url of ['javascript:alert(1)','http://example.com','https://u:p@example.com','data:text/plain,a'])assert.equal(safeSource(url),null);});
