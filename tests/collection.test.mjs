import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {THEMES, fullTexts, filterCollection, nextRandom, safeSource, normalizeSaved} from '../src/core.mjs';
const data = JSON.parse(await readFile(new URL('../data/poems.json',import.meta.url)));
test('at least 100 real poems keep source and rights metadata, separately from protected readings',()=>{
 const texts=fullTexts(data); assert(texts.length>=100);assert(new Set(texts.map(x=>x.poet)).size>=70);assert.equal(new Set(data.map(x=>x.id)).size,data.length);
 for(const item of data){assert(safeSource(item.source));assert(item.themes.every(theme=>THEMES.includes(theme)),item.id);assert.equal(typeof item.note,'string');if(item.rights.mode==='reference-only')assert.deepEqual(item.lines,[]);else{assert(item.rights.basis);assert(item.rights.authorDied<=1955,item.id);assert(item.sourceCheck,item.id+' has no source verification');if(item.translation){const edition=item.translation;
    if(edition.method==='published'){
      assert(edition.translator && edition.credit && safeSource(edition.source),item.id);
      assert(edition.lines.some(line=>line.trim()),item.id);
    }else{
      assert.equal(edition.method,'ai-generated');assert(edition.credit.includes('AI-generated'));assert.equal(edition.lines.length,item.lines.length);
    }}}}
 for(const language of ['it','fr','pl'])assert(texts.filter(x=>x.language===language).length>=10,language);
 assert(data.filter(x=>x.rights.mode==='reference-only').every(x=>x.sourceCheck));
});
test('search applies words, theme and language together',()=>{
 assert.equal(filterCollection(data,{query:'lazarus colossus',theme:'liberty',language:'en'})[0].id,'lazarus-new-colossus');assert.equal(filterCollection(data,{query:'lazarus',language:'fr'}).length,0);
});
test('random selection does not repeat the current poem and empty shelves are safe',()=>{assert.equal(nextRandom([], 'x'),null);assert.equal(nextRandom([{id:'a'},{id:'b'}],'a',()=>0).id,'b');assert.equal(nextRandom([{id:'a'}],'a').id,'a');});
test('saved shelf discards unknown or malformed IDs',()=>{assert.deepEqual(normalizeSaved(['lazarus-new-colossus','bad','lazarus-new-colossus',{}],data),['lazarus-new-colossus']);assert.equal(filterCollection(data,{savedOnly:true,saved:['lazarus-new-colossus']}).length,1);});
test('source URLs reject active and credential-bearing schemes',()=>{for(const url of ['javascript:alert(1)','http://example.com','https://u:p@example.com','data:text/plain,a'])assert.equal(safeSource(url),null);});
