import {THEMES,LANGUAGES,fullTexts,filterCollection,nextRandom,safeSource,poemIds,normalizeSaved,validateSettings,poemFacts,exportShelf,importedIds,citation,shareFragment,parseFragment,safeLine,stanzaRange,englishTranslation,shuffledPoemIds} from './core.mjs';
import {SOUND_LABELS,WoodlandAudio} from './audio.mjs';
import {openPoetryLibrary,readPoetryIndex} from './library.mjs';
import {openPaintingGallery} from './gallery.mjs';

async function startReader() {
const $=selector=>document.querySelector(selector);
const index=JSON.parse($('#poetry-data').textContent);
const collection=await readPoetryIndex(index);
const guides=JSON.parse($('#reading-guides').textContent);
const KEY={saved:'poetry-i-like:saved',settings:'poetry-i-like:settings',last:'poetry-i-like:last'};
function readStored(key,fallback){try{return JSON.parse(localStorage.getItem(key)||'null')??fallback;}catch{return fallback;}}
function writeStored(key,value){try{localStorage.setItem(key,JSON.stringify(value));return true;}catch{return false;}}
const files = JSON.parse($('#reading-files').textContent);
const archive = JSON.parse($('#archive-files').textContent);
const roomLibrary = openPoetryLibrary(collection, files, archive);
const featured = collection.find(poem => poem.id === 'lazarus-new-colossus') || collection[0];
const requestedPath = guides.paths.find(path => path.id === new URLSearchParams(location.search).get('path'));
const randomArrival = new URLSearchParams(location.search).get('pick') === 'random';
const bookmarkId = new URLSearchParams(location.hash.slice(1)).get('poem');
const curatedIds=poemIds(collection);
const storedLast = readStored(KEY.last, null);
const last = curatedIds.get(storedLast) || storedLast;
const stored = readStored(KEY.saved, []);
const archivedId = value => typeof value === 'string' && !curatedIds.has(value) && /^archive-[a-f0-9]{16}$/.test(value);
const savedIds = Array.isArray(stored) ? stored : [];
let initialError = '';
if ([bookmarkId, last, ...savedIds].some(archivedId)) {
  try { await roomLibrary.prepareArchive(); }
  catch (error) { initialError = error.message; }
}
let bookmark = parseFragment(location.hash, collection);
let initial = bookmark?.item || collection.find(item => item.id === requestedPath?.ids[0]) ||
  (randomArrival && nextRandom(fullTexts(collection.filter(item=>!item.archive)),last||featured.id)) ||
  collection.find(item => item.id === last) || featured;
try { await roomLibrary.read(initial); }
catch {
  await roomLibrary.read(featured);
  initial = featured;
  bookmark = null;
  initialError = 'The requested reading could not load. Select it again to retry.';
}

const state = {
  current: initial, saved: normalizeSaved(savedIds, collection), settings: validateSettings(readStored(KEY.settings, {})),
  history: [], query: '', theme: '', language: '', shelf: initial.archive ? 'archive' : 'selected',
  shown: 24, path: requestedPath?.id || '', line: bookmark?.line ?? 0,
  prompt: 0, readingMode: false, view: 'both', focusColumn: 'original', deck: [], deckKey: '',
};
let shufflePending=false;
let selectedInDialog=false;
let selectionVersion = 0;
let fetchingSearch = false;
let shelfRequest = 0;
const pixels = {
  'Emma Lazarus': 'lazarus', 'Emily Dickinson': 'dickinson', 'Giacomo Leopardi': 'leopardi',
  'Cyprian Kamil Norwid': 'norwid', 'Eugenio Montale': 'montale', 'Camillo Sbarbaro': 'sbarbaro',
  'Walt Whitman': 'whitman', 'Guillaume Apollinaire': 'apollinaire', 'Frances Ellen Watkins Harper': 'harper',
  'William Blake': 'blake', 'Percy Bysshe Shelley': 'shelley',
};
const reduce=matchMedia('(prefers-reduced-motion:reduce)'),small=matchMedia('(max-width:800px)'),fine=matchMedia('(pointer:fine)');
const libraryAnchor=document.createComment('Library home');$('#library').before(libraryAnchor);
const exercises={liberty:'Write four lines beginning “I am free to…” End with an ordinary action rather than an abstract ideal.',pluralism:'Describe one place through two voices. Let both remain believable; leave a point of disagreement unresolved.',conscience:'Choose a decision you noticed today. Describe the room and one gesture. Let the reader decide what it means.',love:'Write about someone through an object they use every day. Leave the name of the feeling out.',memory:'Recall one sound from a place you have left. Write six lines that move from that sound to the present.',nature:'Spend a minute watching something small outdoors. Write only what you can see or hear.',wonder:'Begin with “I had not noticed…” Follow the observation for five lines before explaining it.'};
function text(node,value){node.textContent=value;return node;}
function tell(message,settings=false){text($(settings?'#settings-status':'#reading-status'),message);}
function filtered() {
 const {shelf, query} = state;
 const pool = collection.filter(poem => {
  if (shelf === 'archive') return poem.archive;
  if (shelf === 'concordia') return poem.collection === 'Concordia Discors';
  if (shelf === 'modern') return poem.kind === 'reading' && !poem.collection;
  if (shelf === 'saved') return state.saved.includes(poem.id);
  return !poem.archive && (poem.kind === 'poem' || Boolean(query.trim()));
 });
 return filterCollection(pool, {...state, scope: shelf === 'archive' ? 'metadata' : 'all', textFor: roomLibrary.textFor});
}
function needsSearch() {
 return Boolean(state.query.trim() && state.shelf === 'selected' && !roomLibrary.searchable);
}
function isText(item=state.current){return item.kind==='poem'&&item.rights?.mode==='public-domain';}
function setLink(node,value,label){const source=safeSource(value);node.hidden=!source;if(source)node.href=source;if(label)node.textContent=label;}
function updateSaved(){const saved=state.saved.includes(state.current.id);$('#save-poem').setAttribute('aria-pressed',saved);text($('#save-poem'),saved?'Saved':'Save poem');$('#shelf').querySelector('[value=saved]').textContent = state.saved.length ? 'Saved poems (' + state.saved.length + ')' : 'Saved poems';}
function chooseTheme(theme){if(state.shelf==='archive'){state.shelf='selected';$('#shelf').value='selected';}state.theme=theme;state.shown=24;$('#theme').value=theme;drawShelf();if(small.matches)showLibrary(true);}
function drawShelf(){
 const archiveShelf = state.shelf === 'archive';
 $('#library-filters').hidden = archiveShelf;
 $('#search').placeholder = archiveShelf ? 'Poet or title' : 'Poet, title, or a remembered line';
 text($('#search-hint'), archiveShelf ? 'Historic English verse from PoetryDB.' : '');
 if (archiveShelf && !roomLibrary.archiveReady) return;
 if (needsSearch()) {
  text($('#shelf-count'), 'Searching poem text…');
  if (!fetchingSearch) {
   fetchingSearch = true;
   roomLibrary.prepareSearch().then(drawShelf).catch(() => {
    if (needsSearch()) text($('#shelf-count'), 'Search could not load. Edit the search to retry.');
   }).finally(() => { fetchingSearch = false; });
  }
  return;
 }
 const rows = filtered(), box = $('#poem-list');
 box.replaceChildren();
 text($('#shelf-count'), rows.length.toLocaleString() + (rows.length===1?' result':' results'));
 $('#clear-filters').hidden = !(state.query || state.theme || state.language);
 if(!rows.length){const p=document.createElement('p');p.className='empty';p.textContent=state.shelf==='saved'?'Your saved shelf is empty. Save a poem to find it here.':'Nothing matches those filters. Clear them or try a shorter phrase.';box.append(p);}
 for(const item of rows.slice(0,state.shown)){const b=document.createElement('button');b.className='poem-item'+(state.current.id===item.id?' active':'');b.setAttribute('aria-current',state.current.id===item.id?'true':'false');b.append(text(document.createElement('strong'),item.title),text(document.createElement('small'),item.poet));if(item.kind==='reading'){const label=document.createElement('span');label.className='ref-mark';label.textContent=item.label==='Read the excerpt'?'Excerpt at source':'At source';b.append(label);}b.addEventListener('click',()=>selectPoem(item));box.append(b);}
 $('#show-more').hidden=rows.length<=state.shown;text($('#show-more'),'Show '+Math.min(24,Math.max(0,rows.length-state.shown))+' more');
 const available=fullTexts(rows).some(item=>item.id!==state.current.id);
 $('#random-poem').disabled=shufflePending || !available;
 $('#random-poem').title=available ? 'Choose another complete poem from this shelf' : 'No other complete poem matches this shelf and its filters';
 updateSaved();
}
function renderFocus(){
 const focused=state.settings.focus&&isText(),stanza=state.settings.focusUnit==='stanza';
 const translation=englishTranslation(state.current);
 const independent=translation?.method==='published';
 const lines=independent && state.focusColumn==='english' ? translation.lines : state.current.lines;
 const range=stanza&&isText()?stanzaRange(lines,state.line):{start:state.line,end:state.line};
 for(const box of [$('#poem-lines'),$('#english-lines')]){
  const activeColumn=box.id==='english-lines'?'english':'original';
  box.classList.toggle('focused',focused&&(!independent||activeColumn===state.focusColumn));box.classList.toggle('numbered',state.settings.numbers);
  [...box.children].forEach((node,index)=>{
   node.classList.toggle('current',index>=range.start&&index<=range.end);
   node.classList.toggle('can-focus',focused&&!node.classList.contains('blank'));
  });
 }
 if(!focused){text($('#line-status'),'');return;}
 const before=lines.slice(0,state.line+1),unit=stanza?'Stanza':'Line';
 const number=stanza?poemFacts({lines:before}).stanzas:before.filter(value=>value.trim()).length;
 const total=poemFacts({lines})[stanza?'stanzas':'lines'];
 text($('#line-status'),unit+' '+number+' of '+total+'. Arrow keys move through the poem.');
}
function bookmarkLine(){
 return state.settings.focus && (state.focusColumn==='original'||englishTranslation(state.current)?.method!=='published') ? state.line : null;
}
function updateURL(){if(initialError)return;try{const url=new URL(location.href);url.searchParams.delete('pick');url.hash=shareFragment(state.current,bookmarkLine());if(state.path)url.searchParams.set('path',state.path);else url.searchParams.delete('path');history.replaceState(null,'',url);}catch{/* Opaque preview URLs still render normally. */}}
function chooseLine(index,column){
 if (!state.settings.focus) return;
 state.focusColumn=column;state.line=index;renderFocus();updateURL();
}
function drawPoem({focus=false}={}){
 const item=state.current,full=isText(),facts=poemFacts(item);text($('#edition'), item.collection || (item.archive ? 'Historic archive' : full ? 'Selected poem' : 'Modern reading'));
 const pixel = pixels[item.poet] || 'reader';
 $('#poet-pixel').src = 'assets/pixel/poets/' + pixel + '.png';
 text($('#poet'),item.poet);text($('#poem-title'),item.title);text($('#poem-meta'),item.original+' · '+(full?facts.minutes+' min read':'Reading link'));
 $('#poem-lines').replaceChildren();$('#poem-lines').hidden=!full;$('#reading-reference').hidden=full;
 if(full)for(const [index,value]of item.lines.entries()){const line=document.createElement('span');line.className='verse-line'+(!value.trim()?' blank':'');line.textContent=value||'\u00a0';if(value.trim())line.addEventListener('click',()=>chooseLine(index,'original'));$('#poem-lines').append(line);}
 $('#poem-lines').lang=item.language;const translation=full&&englishTranslation(item);$('#translation-controls').hidden=!translation;$('#translation-note').hidden=!translation;$('#english-column').hidden=!translation;$('#original-column').hidden=!full;
 $('#poem-text-grid').className='poem-text-grid'+(translation?' view-'+state.view:'');$('#english-lines').replaceChildren();
 if(translation){
  text($('#english-label'),translation.method==='published' ? 'English · '+(translation.translator||translation.credit) : 'English · AI-generated translation');
  for(const [index,value] of translation.lines.entries()){const line=document.createElement('span');line.className='verse-line'+(!value.trim()?' blank':'');line.textContent=value||'\u00a0';if(value.trim())line.addEventListener('click',()=>chooseLine(index,'english'));$('#english-lines').append(line);}
  text($('#translation-note'),translation.credit||'AI-generated English translation for this reading room.');
  if(translation.method==='published'){
   const link=document.createElement('a');link.href=safeSource(translation.source);link.target='_blank';link.rel='noopener noreferrer';
   $('#translation-note').append(' ',text(link,'Translation source'));
  }
 }
 for(const button of document.querySelectorAll('[data-language-view]'))button.setAttribute('aria-pressed',String(button.dataset.languageView===state.view));
 $('#original-label').hidden=!translation;
 $('#focus-mode').disabled = !full;
 const source = safeSource(item.source);
 setLink($('#source-link'), source, full ? 'Read the source' : item.label === 'Read the excerpt' ? 'Read at Concordia Discors' : 'Read the published text');
 text($('#rights-label'), full ? (item.archive ? 'PoetryDB · CC BY 4.0' : 'Historic original') : 'External reading');
 const note = item.note || '';
 $('#reading-note').hidden = !note || note.startsWith('An invitation to read slowly:');
 text($('#reading-note'), note);
 text($('#reading-prompt'), guides.prompts[state.prompt % guides.prompts.length]);
 const bio = guides.poets[item.poet];
 const biography = $('#poet-bio').closest('details');
 biography.hidden = !bio;
 text($('#poet-bio'), bio?.bio || '');
 setLink($('#poet-source'), bio?.source, 'Biographical source');
 text($('#edition-note'), item.original);
 text($('#rights-basis'), item.rights.basis || '');
 setLink($('#collection-source'), item.collectionSource && item.collectionSource !== source ? item.collectionSource : null, 'Concordia Discors context');
 text($('#exercise'),exercises[item.themes[0]]||exercises.wonder);$('#theme-tags').replaceChildren();for(const theme of item.themes){const b=document.createElement('button');b.textContent=theme;b.addEventListener('click',()=>chooseTheme(theme));$('#theme-tags').append(b);}
 $('#previous-poem').disabled=!state.history.length;renderFocus();renderPath();drawShelf();if(!initialError)writeStored(KEY.last,item.id);updateURL();if(focus)$('#poem-title').focus({preventScroll:true});
}
async function loadSelection(item) {
 if (!item) return false;
 const version = ++selectionVersion;
 try {
  await roomLibrary.read(item);
  if (version !== selectionVersion) return false;
  initialError = '';
  return true;
 } catch (error) {
  if (version === selectionVersion) tell(error.message + ' Select it again to retry.');
  return false;
 }
}
async function selectPoem(item, remember = true) {
 if (!await loadSelection(item)) return false;
 if (item.id !== state.current.id) {
  if (remember) {
   state.history.push(state.current.id);
   if (state.history.length > 100) state.history.shift();
  } else if (state.history.at(-1) === item.id) {
   state.history.pop();
  }
  state.current = item;
  state.line = 0;
  state.focusColumn='original';
  state.deck=state.deck.filter(id=>id!==item.id);
  $('#private-note').value='';
 }
 const mobileLibrary = $('#library-dialog');
 selectedInDialog=mobileLibrary.open;
 if (selectedInDialog) mobileLibrary.close();
 drawPoem({focus: !selectedInDialog});
 tell(item.title + ', by ' + item.poet);
 if (small.matches || $('#paper').getBoundingClientRect().bottom<80) $('#main').scrollIntoView({block: 'start', behavior: 'auto'});
 return true;
}
async function randomPoem(){
 if (shufflePending || needsSearch()) return;
 const rows = fullTexts(filtered());
 if (!rows.length) return;
 const key = rows.map(item => item.id).join('|');
 if (state.deckKey !== key || !state.deck.length) {
  state.deck = shuffledPoemIds(rows, state.current.id).filter(id=>id!==state.current.id);
  state.deckKey = key;
 }
 if (!state.deck.length) return;
 shufflePending=true;$('#random-poem').disabled=true;
 try { await selectPoem(rows.find(item=>item.id===state.deck[0])); }
 finally { shufflePending=false;drawShelf(); }
}
function back(){const id=state.history.at(-1);if(id)void selectPoem(collection.find(item=>item.id===id),false);}
for (const theme of THEMES) $('#theme').append(new Option(theme[0].toUpperCase()+theme.slice(1), theme));
for (const [code, name] of Object.entries(LANGUAGES)) {
 if (collection.some(item => item.language===code)) $('#language').append(new Option(name, code));
}
const locale = new Intl.NumberFormat('en');
text($('#collection-count'), locale.format(archive?.entries || 0) + ' historic archive entries');
$('#shelf').value = state.shelf;
const paths=new Map(guides.paths.map(path=>[path.id,path]));
const pathSelect=$('#reading-path');
$('#jump-to-tools').addEventListener('click',()=>{
 if (state.readingMode) setReadingMode(false);
 $('#reading-tools').scrollIntoView({block:'center',behavior:'instant'});
 pathSelect.focus({preventScroll:true});
});
for(const path of paths.values())pathSelect.add(new Option(path.title,path.id));
function renderPath(){
 const path=paths.get(state.path);
 const index=path?.ids.indexOf(state.current.id)??-1;
 if(index<0){state.path='';pathSelect.value='';}
 else pathSelect.value=state.path;
 $('#path-steps').hidden=index<0;
 $('#path-description').hidden=index<0;
 text($('#path-description'),path?.description||'');
 if(index<0)return;
 $('#path-back').disabled=index===0;
 $('#path-next').disabled=index===path.ids.length-1;
 text($('#path-progress'),(index+1)+' of '+path.ids.length);
}
function moveOnPath(offset){
 const path=paths.get(state.path);
 if(!path)return;
 const nextId=path.ids[path.ids.indexOf(state.current.id)+offset];
 void selectPoem(collection.find(item=>item.id===nextId));
}
pathSelect.addEventListener('change',()=>{
 state.path=pathSelect.value;
 const path=paths.get(state.path);
 if(!path){renderPath();updateURL();return;}
 if(path.ids.includes(state.current.id)){renderPath();updateURL();return;}
 void selectPoem(collection.find(item=>item.id===path.ids[0]));
});
$('#path-back').addEventListener('click',()=>moveOnPath(-1));
$('#path-next').addEventListener('click',()=>moveOnPath(1));
let searchTimer;$('#search').addEventListener('input',event=>{clearTimeout(searchTimer);state.query=event.target.value.slice(0,160);state.shown=24;searchTimer=setTimeout(drawShelf,100);});
for (const key of ['theme','language']) $('#'+key).addEventListener('change', event => {
 state[key] = event.target.value;
 state.shown = 24;
 drawShelf();
});
function clearFilters() {
 Object.assign(state, {query: '', theme: '', language: '', shown: 24});
 for (const id of ['search','theme','language']) $('#'+id).value = '';
}
$('#clear-filters').addEventListener('click', () => {
 clearFilters();
 drawShelf();
 $('#search').focus();
});
$('#shelf').addEventListener('change', async event => {
 const request = ++shelfRequest;
 state.shelf = event.target.value;
 clearFilters();
 if (state.shelf === 'archive' && !roomLibrary.archiveReady) {
  $('#poem-list').replaceChildren();
  $('#show-more').hidden = true;
  $('#clear-filters').hidden = true;
  $('#library-filters').hidden = true;
  $('#random-poem').disabled = true;
  text($('#shelf-count'), 'Opening the historic archive…');
  try { await roomLibrary.prepareArchive(); }
  catch (error) {
   if (request === shelfRequest) text($('#shelf-count'), error.message);
   return;
  }
 }
 if (request === shelfRequest) drawShelf();
});
for(const button of document.querySelectorAll('[data-language-view]'))button.addEventListener('click',()=>{state.view=button.dataset.languageView;if(state.view!=='both' && state.focusColumn!==state.view){state.focusColumn=state.view;state.line=0;}drawPoem();tell('Reading view: '+button.textContent);});
$('#show-more').addEventListener('click',()=>{state.shown+=24;const top=$('#poem-list').scrollTop;drawShelf();$('#poem-list').scrollTop=top;});
$('#random-poem').addEventListener('click',randomPoem);$('#previous-poem').addEventListener('click',back);
$('#save-poem').addEventListener('click',()=>{const id=state.current.id;state.saved=state.saved.includes(id)?state.saved.filter(value=>value!==id):normalizeSaved([...state.saved,id],collection);const persistent=writeStored(KEY.saved,state.saved);drawShelf();tell(state.saved.includes(id)?'Saved'+(persistent?' in this browser.':' for this tab. Browser storage is unavailable.'):'Removed from your saved shelf.');});
$('#new-prompt').addEventListener('click',()=>{state.prompt++;text($('#reading-prompt'),guides.prompts[state.prompt%guides.prompts.length]);});
function download(name,contents,type='text/plain'){const url=URL.createObjectURL(new Blob([contents],{type})),link=document.createElement('a');link.href=url;link.download=name;document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}
async function copy(value,message){try{await navigator.clipboard.writeText(value);tell(message);}catch{tell('Clipboard access is unavailable. Select the text to copy it, or use the source link.');}}
$('#copy-citation').addEventListener('click',()=>copy(citation(state.current),'Source citation copied.'));
$('#share-poem').addEventListener('click',()=>{const base=/^https?:$/.test(location.protocol)?location.origin+location.pathname+(state.path?'?path='+encodeURIComponent(state.path):''):'';copy(base+shareFragment(state.current,bookmarkLine()),base?'Poem link copied.':'Poem bookmark copied. On a hosted copy it becomes a full link.');});$('#print-poem').addEventListener('click',()=>window.print());
$('#download-note').addEventListener('click',()=>{const note=$('#private-note').value.trim();if(!note){tell('Write a note before downloading it.');return;}download('poetry-note.txt',citation(state.current)+'\n\n'+note);tell('Your note was downloaded.');});
$('#export-shelf').addEventListener('click',()=>{download('poetry-i-like-shelf.json',JSON.stringify(exportShelf(state.saved,collection),null,2)+'\n','application/json');tell('Saved poem IDs exported.',true);});
$('#import-shelf').addEventListener('change',async event=>{const file=event.target.files?.[0];if(!file)return;try{if(file.size>65536)throw Error('Choose a shelf file smaller than 64 KB.');const contents = await file.text();
 const entries=importedIds(contents);
 if (entries.some(archivedId) && !roomLibrary.archiveReady) await roomLibrary.prepareArchive();
 const ids = normalizeSaved(entries,collection);state.saved=normalizeSaved([...state.saved,...ids],collection);writeStored(KEY.saved,state.saved);drawShelf();tell('Imported '+ids.length+' known selections. Your shelf now has '+state.saved.length+'.',true);}catch(error){tell(error.message,true);}finally{event.target.value='';}});
function setReadingMode(enabled){
 state.readingMode=enabled;
 $('#workspace').classList.toggle('reading-mode',enabled);
 $('#reading-mode').setAttribute('aria-pressed',String(enabled));
 text($('#reading-mode'),enabled?'Show the room':'Just the poem');
}
$('#reading-mode').addEventListener('click',()=>{
 setReadingMode(!state.readingMode);
 $('#settings').close();
 $('#poem-title').focus({preventScroll:true});
});
function showLibrary(open){if(!small.matches)return;if(open){$('#library-slot').append($('#library'));$('#library-toggle').setAttribute('aria-expanded','true');$('#library-dialog').showModal();$('#search').focus();}else if($('#library-dialog').open)$('#library-dialog').close();}
$('#library-dialog').addEventListener('close',()=>{libraryAnchor.after($('#library'));$('#library-toggle').setAttribute('aria-expanded','false');$(selectedInDialog?'#poem-title':'#library-toggle').focus({preventScroll:true});selectedInDialog=false;});$('#close-library').addEventListener('click',()=>showLibrary(false));$('#library-toggle').addEventListener('click',()=>showLibrary(true));small.addEventListener('change',()=>{if(!small.matches&&$('#library-dialog').open)$('#library-dialog').close();});
$('#settings-toggle').addEventListener('click',()=>$('#settings').showModal());$('#close-settings').addEventListener('click',()=>$('#settings').close());
for(const dialog of [$('#settings'),$('#library-dialog')])dialog.addEventListener('click',event=>{if(event.target===dialog){const rect=dialog.getBoundingClientRect();if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)dialog.close();}});
let depthFrame=0,depthX=0,depthY=0;
function stopDepth(){cancelAnimationFrame(depthFrame);depthFrame=0;$('#forest').style.transform='translate3d(0,0,0)';}
function depthEnabled(){return state.settings.depth&&!reduce.matches&&fine.matches&&!document.hidden;}
function applySettings(persist = false) {
 const settings = state.settings;
 const root = document.documentElement;
 root.style.setProperty('--size', settings.size + 'px');
 root.style.setProperty('--leading', settings.leading);
 root.style.setProperty('--measure', settings.measure + 'ch');
 root.style.setProperty('--letter', settings.spacing + 'em');
 root.style.setProperty('--paper-alpha', settings.opacity / 100);
 root.style.setProperty('--reader-font', settings.font === 'sans' ? 'Arial,Helvetica,sans-serif' :
   settings.font === 'serif' ? 'Georgia,serif' : '"Source Serif 4",Georgia,serif');
 $('#paper').className = 'paper ' + settings.tone;
 for (const [id, key] of [['font-size','size'], ['line-height','leading'], ['focus-unit','focusUnit'], ['paper-tone','tone']]) {
  $('#' + id).value = settings[key];
 }
 $('#focus-mode').checked = settings.focus;
 $('#visual-rain').checked = settings.rain;
 $('#size-value').textContent = settings.size + ' px';
 $('#leading-value').textContent = settings.leading.toFixed(1);
 $('#ambient-volume').value = settings.volume;
 $('#ambient-level').textContent = settings.volume + '%';
 $('#rain').dataset.sound = settings.sound;
 $('#rain').classList.toggle('show', settings.rain && !reduce.matches);
 if (!depthEnabled()) stopDepth();
 renderFocus();
 if (persist && !writeStored(KEY.settings, settings)) tell('Preferences apply for this tab. Browser storage is unavailable.', true);
}
const soundSelect = $('#sound-type');
const button = $('#sound-toggle');
soundSelect.value = state.settings.sound;
function showSound(active, mode = 'off') {
 button.setAttribute('aria-pressed', String(active));
 button.dataset.audio = mode;
 button.setAttribute('aria-label', (active ? 'Pause ' : 'Play ') + SOUND_LABELS[soundSelect.value]);
 text(button, active ? 'Pause' : 'Play');
}
const audio = new WoodlandAudio((active, sound, mode) => showSound(active, mode));
let soundBusy = false;
button.addEventListener('click', async () => {
 if (audio.active || soundBusy) { await audio.stop(); return; }
 soundBusy = true;
 soundSelect.disabled = true;
 try { await audio.start(state.settings); }
 catch (error) { tell(error.message); }
 finally { soundBusy = false; soundSelect.disabled = false; }
});
soundSelect.addEventListener('change', event => {
 state.settings = validateSettings({...state.settings, sound: event.target.value});
 applySettings(true);
 if (audio.active) void audio.setSound(state.settings.sound).catch(error => tell(error.message));
 else showSound(false);
});
$('#ambient-volume').addEventListener('input', event => {
 state.settings = validateSettings({...state.settings, volume: Number(event.target.value)});
 applySettings(true);
 audio.setVolume(state.settings.volume);
});
for (const [id, key, type] of [
 ['font-size','size','number'], ['line-height','leading','number'], ['focus-unit','focusUnit','string'],
 ['paper-tone','tone','string'], ['focus-mode','focus','bool'], ['visual-rain','rain','bool'],
]) $('#' + id).addEventListener(type === 'number' ? 'input' : 'change', event => {
 const value = type === 'bool' ? event.target.checked : type === 'number' ? Number(event.target.value) : event.target.value;
 state.settings = validateSettings({...state.settings, [key]: value});
 applySettings(true);
 if (key === 'focus') updateURL();
});
showSound(false);
for(let i=0;i<32;i++){const drop=document.createElement('i');drop.style.left=(i*37%100)+'%';drop.style.animationDelay=(-i*.19)+'s';drop.style.animationDuration=(1.2+(i%7)*.18)+'s';$('#rain').append(drop);}
window.addEventListener('pointermove',event=>{if(!depthEnabled())return;depthX=(event.clientX/innerWidth-.5)*7;depthY=(event.clientY/innerHeight-.5)*5;if(!depthFrame)depthFrame=requestAnimationFrame(()=>{depthFrame=0;$('#forest').style.transform='translate3d('+depthX.toFixed(2)+'px,'+depthY.toFixed(2)+'px,0)';});},{passive:true});document.addEventListener('pointerleave',stopDepth);reduce.addEventListener('change',()=>applySettings());fine.addEventListener('change',()=>applySettings());
document.addEventListener('visibilitychange',()=>{document.body.toggleAttribute('data-room-hidden',document.hidden);if(document.hidden){void audio.stop();stopDepth();}});window.addEventListener('pagehide',()=>{audio.stop();stopDepth();clearTimeout(searchTimer);});
document.addEventListener('keydown',event=>{
 if ($('#settings').open || $('#library-dialog').open) return;
 const active=document.activeElement;
 if (['INPUT','TEXTAREA','SELECT'].includes(active?.tagName)) return;
 if (event.altKey && event.key==='ArrowRight') { event.preventDefault(); void randomPoem(); return; }
 if (event.altKey && event.key==='ArrowLeft') { event.preventDefault(); back(); return; }
 if (!state.settings.focus || !isText() || ![document.getElementById('poem-lines'),document.getElementById('english-lines')].includes(active)) return;
 const column=active.id==='english-lines' ? 'english' : 'original';
 const published=englishTranslation(state.current)?.method==='published';
 const lines=column==='english' && published ? state.current.translation.lines : state.current.lines;
 const line=published && state.focusColumn!==column ? 0 : state.line;
 const range=state.settings.focusUnit==='stanza' ? stanzaRange(lines,line) : {start:line,end:line};
 let next;
 if (event.key==='ArrowDown') next=safeLine({lines},range.end+1,1);
 else if (event.key==='ArrowUp') next=safeLine({lines},range.start-1,-1);
 else if (event.key==='Home') next=safeLine({lines},0,1);
 else if (event.key==='End') next=safeLine({lines},lines.length-1,-1);
 if (next!==undefined) { event.preventDefault(); chooseLine(next,column); }
});
window.addEventListener('hashchange', async () => {
 const id = new URLSearchParams(location.hash.slice(1)).get('poem');
 if (archivedId(id) && !roomLibrary.archiveReady) {
  try { await roomLibrary.prepareArchive(); }
  catch (error) { tell(error.message); return; }
 }
 const value = parseFragment(location.hash, collection);
 if (!value || !await loadSelection(value.item)) return;
 if (state.current.id!==value.item.id) $('#private-note').value='';
 state.current = value.item;
 state.focusColumn='original';
 state.line = value.line ?? 0;
 if (value.line !== null) state.settings.focus = true;
 drawPoem();
 applySettings();
 tell(value.item.title + ', by ' + value.item.poet);
});
$('.brand').addEventListener('click', event => {event.preventDefault(); void selectPoem(featured);});
if(bookmark?.line!==null&&bookmark?.line!==undefined)state.settings.focus=true;
applySettings();drawPoem();
if (initialError) tell(initialError);
}

try { openPaintingGallery(); } catch { /* The illustrated forest remains available offline. */ }
void startReader().catch(() => {
  const status = document.getElementById('reading-status');
  if (status) status.textContent = 'The library could not load. Reload to choose another poem.';
});
