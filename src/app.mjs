import { THEMES, LANGUAGES, fullTexts, filterCollection, nextRandom, safeSource, readingMinutes, normalizeSaved } from './core.mjs';
const collection = JSON.parse(document.querySelector('#poetry-data').textContent);
const $ = selector => document.querySelector(selector);
const state = { current: collection.find(item => item.id === 'lazarus-new-colossus') || collection[0], saved: [], history: [], query: '', theme: '', language: '', savedOnly: false, focus: false, line: 0, prompt: 0 };
try { state.saved = normalizeSaved(JSON.parse(localStorage.getItem('poetry-i-like:saved') || '[]'), collection); } catch {}
const prompts = [
  'Which image stays with you after the last line? Read that line aloud.',
  'Where does the voice change direction? Find the word that turns the poem.',
  'Which sound repeats? Follow it through a second reading.',
  'What does the poem leave unsaid? Stay with that space for a moment.',
  'Try reading it once as a letter to one person. What changes?',
  'Which line would you carry into tomorrow?',
  'Where do you agree with the speaker? Where do you resist?',
  'Read the first line, then the last. What has moved between them?',
  'Find a concrete thing: a door, a tree, a body. What work does it do here?',
  'Pause at each line ending, then read it as a sentence. Listen for the difference.'
];
const exercises = {
  liberty: 'Write four lines beginning “I am free to…” End with a small, ordinary action rather than an abstract ideal.',
  pluralism: 'Describe one place through two different voices. Let both remain believable; do not force them to agree.',
  conscience: 'Choose a decision you noticed today. Describe the room and one gesture. Leave the judgement out.',
  love: 'Write about someone through an object they use every day. Do not name the feeling.',
  memory: 'Recall one sound from a place you have left. Write six lines that move from that sound to the present.',
  nature: 'Spend one minute watching something small outdoors. Write only what you can see or hear.',
  wonder: 'Begin with “I had not noticed…” Follow the observation for five lines before explaining anything.'
};
for (const theme of THEMES) { const o = document.createElement('option'); o.value = theme; o.textContent = theme[0].toUpperCase() + theme.slice(1); $('#theme').append(o); }
for (const [code, name] of Object.entries(LANGUAGES)) { const o = document.createElement('option'); o.value = code; o.textContent = name; $('#language').append(o); }
function filtered() { return filterCollection(collection, { ...state, saved: state.saved }); }
function saveState() { try { localStorage.setItem('poetry-i-like:saved', JSON.stringify(state.saved)); } catch {} }
function drawShelf() {
  const rows = filtered(); $('#poem-list').replaceChildren();
  $('#shelf-count').textContent = rows.length + (rows.length === 1 ? ' selection' : ' selections') + (state.savedOnly ? ' saved' : '');
  $('#saved-count').textContent = state.saved.length;
  $('#collection-count').textContent = fullTexts(collection).length + ' full texts · 104 poets';
  if (!rows.length) { const p = document.createElement('p'); p.className = 'empty'; p.textContent = state.savedOnly ? 'Save a poem with the heart to return to it here.' : 'No poems match. Try another word or theme.'; $('#poem-list').append(p); }
  for (const item of rows) {
    const button = document.createElement('button'); button.className = 'poem-item' + (state.current.id === item.id ? ' active' : ''); button.setAttribute('aria-current', state.current.id === item.id ? 'true' : 'false');
    const title = document.createElement('strong'); title.textContent = item.title;
    const poet = document.createElement('small'); poet.textContent = item.poet;
    button.append(title, poet);
    if (item.kind !== 'poem') { const mark = document.createElement('span'); mark.className = 'ref-mark'; mark.textContent = 'Reading link'; button.append(mark); }
    button.addEventListener('click', () => selectPoem(item)); $('#poem-list').append(button);
  }
}
function renderFocus() {
  const container = $('#poem-lines'); container.classList.toggle('focused', state.focus);
  [...container.children].forEach((line, index) => { line.classList.toggle('current', state.line === index); line.classList.toggle('can-focus', state.focus && !line.classList.contains('blank')); });
}
function renderPoem() {
  const item = state.current; const isFull = item.kind === 'poem' && item.rights?.mode === 'public-domain';
  $('#edition').textContent = isFull ? 'One poem, a little space' : 'From the reading shelf';
  $('#poet').textContent = item.poet; $('#poem-title').textContent = item.title;
  $('#poem-meta').textContent = item.original + ' · ' + (isFull ? readingMinutes(item.lines) + ' min read' : 'Reading reference');
  $('#reading-note').textContent = item.note; $('#exercise').textContent = exercises[item.themes[0]] || exercises.wonder;
  $('#poem-lines').replaceChildren(); $('#reading-reference').hidden = isFull;
  if (isFull) for (const [index, text] of item.lines.entries()) { const line = document.createElement('span'); line.className = 'verse-line' + (!text ? ' blank' : ''); line.textContent = text || '\u00a0'; if (text) line.addEventListener('click', () => { if (state.focus) { state.line = index; renderFocus(); } }); $('#poem-lines').append(line); }
  const source = safeSource(item.source); $('#source-link').hidden = !source; if (source) $('#source-link').href = source;
  $('#source-link').textContent = isFull ? 'Original text & source ↗' : 'Read the authorized edition ↗';
  $('#rights-label').textContent = isFull ? 'Public-domain edition' : 'External reading · no verse reproduced';
  $('#save-poem').setAttribute('aria-pressed', state.saved.includes(item.id)); $('#save-poem').replaceChildren();
  const heart = document.createElement('span'); heart.setAttribute('aria-hidden', 'true'); heart.textContent = state.saved.includes(item.id) ? '♥' : '♡'; $('#save-poem').append(heart, document.createTextNode(state.saved.includes(item.id) ? ' Saved' : ' Save'));
  $('#theme-tags').replaceChildren(); for (const theme of item.themes) { const b = document.createElement('button'); b.textContent = theme; b.addEventListener('click', () => { state.theme = theme; $('#theme').value = theme; drawShelf(); if (matchMedia('(max-width:760px)').matches) showLibrary(true); }); $('#theme-tags').append(b); }
  $('#previous-poem').disabled = !state.history.length;
  $('#reading-prompt').textContent = prompts[state.prompt % prompts.length];
  $('#paper').classList.remove('read-transition'); void $('#paper').offsetWidth; $('#paper').classList.add('read-transition');
  $('#private-note').value = ''; renderFocus(); drawShelf();
}
function selectPoem(item, remember = true) { if (!item || item.id === state.current.id) return; if (remember) { state.history.push(state.current.id); if (state.history.length > 100) state.history.shift(); } state.current = item; state.line = 0; renderPoem(); $('#reading-status').textContent = item.title + ', by ' + item.poet; if (matchMedia('(max-width:760px)').matches) { showLibrary(false); $('#main').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion:reduce)').matches ? 'auto' : 'smooth', block: 'start' }); } }
$('#random-poem').addEventListener('click', () => { const rows = filtered(); const texts = fullTexts(rows); selectPoem(nextRandom(texts.length ? texts : rows, state.current.id)); });
$('#previous-poem').addEventListener('click', () => { const id = state.history.pop(); selectPoem(collection.find(item => item.id === id), false); });
$('#save-poem').addEventListener('click', () => { const note = $('#private-note').value; const id = state.current.id; state.saved = state.saved.includes(id) ? state.saved.filter(value => value !== id) : [...state.saved, id]; saveState(); renderPoem(); $('#private-note').value = note; });
$('#search').addEventListener('input', event => { state.query = event.target.value.slice(0, 160); drawShelf(); });
$('#theme').addEventListener('change', event => { state.theme = event.target.value; drawShelf(); }); $('#language').addEventListener('change', event => { state.language = event.target.value; drawShelf(); });
for (const [selector, savedOnly] of [['#all-tab', false], ['#saved-tab', true]]) $(selector).addEventListener('click', () => { state.savedOnly = savedOnly; $('#all-tab').classList.toggle('selected', !savedOnly); $('#saved-tab').classList.toggle('selected', savedOnly); $('#all-tab').setAttribute('aria-pressed', !savedOnly); $('#saved-tab').setAttribute('aria-pressed', savedOnly); drawShelf(); });
$('#new-prompt').addEventListener('click', () => { state.prompt++; $('#reading-prompt').textContent = prompts[state.prompt % prompts.length]; });
$('#settings-toggle').addEventListener('click', () => { const open = $('#settings').hidden; $('#settings').hidden = !open; $('#settings-toggle').setAttribute('aria-expanded', open); });
$('#font-size').addEventListener('input', event => document.documentElement.style.setProperty('--size', event.target.value + 'px'));
$('#paper-tone').addEventListener('change', event => $('#paper').className = 'paper ' + event.target.value);
$('#focus-mode').addEventListener('change', event => { state.focus = event.target.checked; renderFocus(); });
function showLibrary(open) { $('#library').classList.toggle('open', open); $('#library-toggle').setAttribute('aria-expanded', open); }
$('#library-toggle').addEventListener('click', () => showLibrary(!$('#library').classList.contains('open')));
$('.brand').addEventListener('click', event => { event.preventDefault(); selectPoem(collection[0]); });
document.addEventListener('keydown', event => { if (['INPUT','TEXTAREA','SELECT','BUTTON','A'].includes(document.activeElement.tagName)) return; if (state.focus && ['ArrowDown','ArrowUp'].includes(event.key)) { event.preventDefault(); const direction = event.key === 'ArrowDown' ? 1 : -1; let next = state.line + direction; while (next >= 0 && next < state.current.lines.length && !state.current.lines[next]) next += direction; state.line = Math.max(0, Math.min(state.current.lines.length - 1, next)); renderFocus(); } });
let audio = null, audioBusy = false;
async function stopSound() { if (!audio) return; const current = audio; audio = null; clearInterval(current.birds); current.gain.gain.setTargetAtTime(0, current.context.currentTime, .12); setTimeout(() => current.context.close().catch(() => {}), 500); $('#sound-toggle').setAttribute('aria-pressed', 'false'); $('#sound-toggle').innerHTML = '<span aria-hidden="true">◌</span> Sound off'; }
async function startSound() {
  await stopSound(); const Audio = window.AudioContext || window.webkitAudioContext; if (!Audio) { $('#sound-toggle').textContent = 'Sound unavailable'; return; }
  const context = new Audio(); await context.resume(); if (document.hidden) { await context.close(); return; } const gain = context.createGain(); gain.gain.value = 0; gain.connect(context.destination);
  const type = $('#sound-type').value; const buffer = context.createBuffer(2, context.sampleRate * 4, context.sampleRate);
  for (let channel = 0; channel < 2; channel++) { const data = buffer.getChannelData(channel); let previous = 0; for (let index = 0; index < data.length; index++) { const white = Math.random() * 2 - 1; previous = (previous + .02 * white) / 1.02; data[index] = type === 'rain' ? (white * .34 + previous * 2.5) : previous * 5; } }
  const noise = context.createBufferSource(); noise.buffer = buffer; noise.loop = true; const filter = context.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = type === 'rain' ? 1800 : 750; noise.connect(filter); filter.connect(gain); noise.start();
  gain.gain.setTargetAtTime(Number($('#volume').value) / 100, context.currentTime, .5);
  let birds = null;
  if (type === 'forest') birds = setInterval(() => { if (context.state !== 'running') return; const voice = context.createOscillator(), envelope = context.createGain(), time = context.currentTime; voice.type = 'sine'; voice.frequency.setValueAtTime(1700 + Math.random() * 450, time); voice.frequency.exponentialRampToValueAtTime(2600, time + .11); voice.frequency.exponentialRampToValueAtTime(1300, time + .28); envelope.gain.setValueAtTime(0, time); envelope.gain.linearRampToValueAtTime(.09, time + .03); envelope.gain.exponentialRampToValueAtTime(.001, time + .3); voice.connect(envelope); envelope.connect(gain); voice.start(time); voice.stop(time + .32); }, 6900);
  audio = { context, gain, birds }; $('#sound-toggle').setAttribute('aria-pressed', 'true'); $('#sound-toggle').innerHTML = '<span aria-hidden="true">◉</span> ' + (type === 'rain' ? 'Soft rain' : 'Forest air');
}
async function changeSound(enable) { if (audioBusy) return; audioBusy = true; try { if (enable) await startSound(); else await stopSound(); } catch { $('#sound-toggle').textContent = 'Sound unavailable'; } finally { audioBusy = false; } }
$('#sound-toggle').addEventListener('click', () => changeSound(!audio));
$('#sound-type').addEventListener('change', () => { if (audio) changeSound(true); }); $('#volume').addEventListener('input', event => { if (audio) audio.gain.gain.setTargetAtTime(Number(event.target.value) / 100, audio.context.currentTime, .1); });
window.addEventListener('pagehide', () => { if (audio) { clearInterval(audio.birds); audio.context.close().catch(() => {}); audio = null; } });
document.addEventListener('visibilitychange', () => { if (document.hidden && audio) stopSound(); });
renderPoem();
