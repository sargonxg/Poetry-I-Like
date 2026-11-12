import {test} from 'node:test';
import assert from 'node:assert/strict';
import {englishTranslation,shuffledPoemIds,filterCollection} from '../src/core.mjs';
const poem=(id,extra={})=>({id,kind:'poem',language:'it',lines:['Una parola.'],rights:{mode:'public-domain'},...extra});
test('the reader only labels a stored attributed English rendering as a translation',()=>{
 const translation={language:'en',method:'ai-generated',lines:['A word.'],credit:'AI-generated English translation for this site.'};
 assert.equal(englishTranslation(poem('a',{translation})),translation);
 assert.equal(englishTranslation(poem('a',{language:'en',translation})),null);
 assert.equal(englishTranslation(poem('a',{translation:{...translation,lines:[]}})),null);
 assert.equal(englishTranslation(poem('a',{translation:{...translation,method:'unknown'}})),null);
});
test('a shuffled shelf visits every full poem once and starts away from the previous poem',()=>{
 const rows=[poem('a'),poem('b'),poem('c'),poem('reference',{kind:'reading',lines:[],rights:{mode:'reference-only'}})];
 const deck=shuffledPoemIds(rows,'a',()=>.999);
 assert.notEqual(deck[0],'a');assert.equal(deck.length,3);assert.equal(new Set(deck).size,3);assert(!deck.includes('reference'));
 assert.deepEqual(shuffledPoemIds([rows[0]],'a'),['a']);assert.deepEqual(shuffledPoemIds([],null),[]);
});

test('a remembered English rendering finds its original while metadata search stays separate',()=>{const item=poem('it',{title:'Titolo',poet:'Autore',themes:['wonder'],translation:{language:'en',method:'ai-generated',lines:['The limitless horizon.']}});assert.equal(filterCollection([item],{query:'limitless'}).length,1);assert.equal(filterCollection([item],{query:'limitless',scope:'metadata'}).length,0);});
