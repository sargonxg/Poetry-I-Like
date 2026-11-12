/** Pure, deterministic helpers shared by the reader and its tests. */
export const THEMES = ['liberty','pluralism','conscience','love','memory','nature','wonder','ordinary life','exile','home','art','change','dignity','hope','humour','imagination','listening','music','peace','power','solidarity','solitude','stillness','time','uncertainty','witness'];
export const LANGUAGES = { en: 'English', it: 'Italian', pl: 'Polish', fr: 'French' };
export const DEFAULT_SETTINGS = Object.freeze({size:21,leading:1.8,measure:60,spacing:0,opacity:97,font:'book',tone:'paper',focus:false,numbers:false,depth:true,rain:false,sound:'rain',volume:12,timer:15});
export const fold = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/ł/g,'l').replace(/Ł/g,'l').toLocaleLowerCase();
export function fullTexts(collection) { return collection.filter(item => item.kind === 'poem' && item.rights?.mode === 'public-domain' && item.lines?.some(line => line.trim())); }
export function englishTranslation(item){return item.language!=='en'&&item.translation?.language==='en'&&item.translation?.method==='ai-generated'&&Array.isArray(item.translation.lines)&&item.translation.lines.some(line=>line.trim())?item.translation:null;}
export function shuffledPoemIds(rows,previous=null,random=Math.random){const ids=fullTexts(rows).map(item=>item.id);for(let i=ids.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[ids[i],ids[j]]=[ids[j],ids[i]];}if(ids.length>1&&ids[0]===previous)[ids[0],ids[1]]=[ids[1],ids[0]];return ids;}
export function filterCollection(collection, {query='',theme='',language='',savedOnly=false,saved=[],kind='',sort='collection',scope='all'}={}) {
 const words=fold(query).trim().split(/\s+/).filter(Boolean).slice(0,12);
 const rows=collection.filter(item=>{if((theme&&!item.themes.includes(theme))||(language&&item.language!==language)||(savedOnly&&!saved.includes(item.id))||(kind&&item.kind!==kind))return false;if(!words.length)return true;const haystack=fold(item.title+' '+item.poet+' '+(scope==='all'?item.lines.join(' ')+' '+(item.translation?.lines||[]).join(' '):''));return words.every(word=>haystack.includes(word));});
 if(sort==='poet')rows.sort((a,b)=>a.poet.localeCompare(b.poet)||a.title.localeCompare(b.title));
 if(sort==='title')rows.sort((a,b)=>a.title.localeCompare(b.title));
 if(sort==='short')rows.sort((a,b)=>(a.kind==='reading')-(b.kind==='reading')||readingMinutes(a.lines)-readingMinutes(b.lines)||a.lines.length-b.lines.length);
 return rows;
}
export function nextRandom(collection,currentId,random=Math.random) { const candidates=collection.filter(item=>item.id!==currentId);if(!candidates.length)return collection[0]||null;return candidates[Math.min(candidates.length-1,Math.max(0,Math.floor(random()*candidates.length)))]; }
export function safeSource(value) { try{const url=new URL(value);return url.protocol==='https:'&&!url.username&&!url.password?url.href:null;}catch{return null;} }
export function readingMinutes(lines) { return Math.max(1,Math.ceil(lines.join(' ').trim().split(/\s+/).filter(Boolean).length/170)); }
export function normalizeSaved(value,collection) { if(!Array.isArray(value))return[];const ids=new Set(collection.map(item=>item.id));return [...new Set(value.filter(id=>typeof id==='string'&&id.length<100&&ids.has(id)))].slice(0,250); }
export function validateSettings(input={}) {
 const result={...DEFAULT_SETTINGS};if(!input||typeof input!=='object'||Array.isArray(input))return result;
 for(const [key,min,max] of [['size',17,32],['leading',1.4,2.3],['measure',36,72],['spacing',0,.09],['opacity',85,100],['volume',0,35],['timer',5,60]])if(Number.isFinite(input[key]))result[key]=Math.min(max,Math.max(min,input[key]));
 for(const key of ['focus','numbers','depth','rain'])if(typeof input[key]==='boolean')result[key]=input[key];
 for(const [key,allowed]of [['font',['book','serif','sans']],['tone',['paper','white','evening']],['sound',['rain','forest','stream']]])if(allowed.includes(input[key]))result[key]=input[key];
 return result;
}
export function poemFacts(item) {
 const nonempty=item.lines.filter(line=>line.trim());let stanzas=0,inStanza=false;
 for(const line of item.lines){if(line.trim()&&!inStanza){stanzas++;inStanza=true;}else if(!line.trim())inStanza=false;}
 const words=nonempty.join(' ').match(/[\p{L}’']+/gu)||[];
 const repeated=new Map();for(const line of nonempty){const start=fold(line.trim().split(/\s+/).slice(0,2).join(' ')).replace(/[^\p{L}\s]/gu,'');if(start)repeated.set(start,(repeated.get(start)||0)+1);}
 const repeatedStart=[...repeated].filter(([,count])=>count>=3).sort((a,b)=>b[1]-a[1])[0]||null;
 return{lines:nonempty.length,stanzas,words:words.length,minutes:readingMinutes(item.lines),questions:nonempty.filter(line=>line.includes('?')).length,repeatedStart};
}
export function exportShelf(saved,collection) {return{format:'poetry-i-like:shelf/1',ids:normalizeSaved(saved,collection)};}
export function importShelf(text,collection) {
 if(typeof text!=='string'||text.length>65536)throw Error('Choose a shelf file smaller than 64 KB.');
 let value;try{value=JSON.parse(text);}catch{throw Error('This file is not valid JSON.');}
 if(!value||value.format!=='poetry-i-like:shelf/1'||!Array.isArray(value.ids)||value.ids.length>1000)throw Error('Choose an exported Poetry I Like shelf file.');
 return normalizeSaved(value.ids,collection);
}
export function citation(item) {return item.poet+'. '+item.title+'. '+item.original+'. '+item.source;}
export function shareFragment(item,line=null){return '#poem='+encodeURIComponent(item.id)+(Number.isInteger(line)&&line>=0?'&line='+line:'');}
export function parseFragment(hash,collection){try{const p=new URLSearchParams(String(hash).replace(/^#/,''));const item=collection.find(x=>x.id===p.get('poem'));if(!item)return null;const n=Number(p.get('line'));return{item,line:p.has('line')&&Number.isInteger(n)&&n>=0&&n<item.lines.length?n:null};}catch{return null;}}
export function safeLine(item,index,direction=1){if(!item.lines.length)return 0;let next=Math.max(0,Math.min(item.lines.length-1,index));while(next>=0&&next<item.lines.length&&!item.lines[next].trim())next+=direction;return next>=0&&next<item.lines.length?next:Math.max(0,item.lines.findLastIndex(line=>line.trim()));}
