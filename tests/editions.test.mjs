import { strict as assert } from 'node:assert';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { gunzipSync } from 'node:zlib';

const read = name => readFile(new URL('../data/' + name, import.meta.url));
const load = async name => JSON.parse(await read(name));
const collection = await load('poems.json');
const editions = await load('editions-20261124.json');
const archive = await load('archive/manifest.json');
const byId = new Map(collection.map(poem => [poem.id, poem]));
const selected = collection.filter(poem => poem.sourceCheck?.editionBatch === 'public-editions-2026-11');
const hash = value => createHash('sha256').update(value).digest('hex');
const key = text => text.toLowerCase().normalize('NFKD').replace(/[^\p{L}\p{N}]/gu, '');
const words = lines => lines.join(' ').toLowerCase().match(/[\p{L}\p{N}]+/gu) || [];

test('the collection receipt describes the exact original and translation counts', async () => {
  const audit = await load('provenance.json');
  const poems = collection.filter(poem => poem.kind === 'poem');
  assert.equal(audit.collectionSha256, hash(await read('poems.json')));
  assert.equal(audit.fullTextSelections, poems.length);
  assert.equal(audit.readingReferences, collection.length - poems.length);
  assert.equal(audit.fullTextPoets, new Set(poems.map(poem => poem.poet)).size);
  assert.equal(audit.allPoets, new Set(collection.map(poem => poem.poet)).size);
  for (const [language, count] of Object.entries(audit.languages)) {
    assert.equal(count, poems.filter(poem => poem.language === language).length);
  }
  for (const [method, count] of Object.entries(audit.translations)) {
    assert.equal(count, poems.filter(poem => poem.translation?.method === method).length);
  }
});

test('each new work matches the complete cited edition and its pinned verse hash', () => {
  const ids = new Set();
  const works = editions.editions.flatMap(edition => edition.items);
  assert(works.length >= 200);
  for (const edition of editions.editions) {
    for (const item of edition.items) {
      assert(!ids.has(item.id), item.id);
      ids.add(item.id);
      const poem = byId.get(item.id);
      assert.equal(poem.kind, 'poem');
      assert.equal(poem.poet, edition.author);
      assert.equal(poem.title, item.title);
      assert.equal(poem.language, edition.language);
      assert.equal(poem.source, item.source || edition.source + '#' + item.section);
      assert.equal(new URL(poem.source).protocol, 'https:');
      assert.equal(poem.sourceCheck.checkedAt, editions.checkedAt);
      assert.equal(poem.sourceCheck.sourceSha256, item.sourceSha256 || edition.sourceSha256);
      assert.match(poem.sourceCheck.sourceSha256, /^[a-f0-9]{64}$/);
      assert.equal(poem.sourceCheck.displayedTextSha256, item.textSha256);
      assert.equal(hash(poem.lines.join('\n')), item.textSha256);
      assert.equal(poem.sourceCheck.lines, poem.lines.filter(line => line.trim()).length);
      assert.equal(poem.rights.mode, 'public-domain');
      assert.equal(poem.rights.authorDied, edition.died);
      assert(poem.rights.authorDied < 1956);
      assert(poem.rights.basis && poem.rights.editionLicense);
      assert(!poem.translation);
      if (edition.provider === 'Wolne Lektury') {
        assert.equal(poem.sourceCheck.editionMetadata, poem.source.replace('/html/', '/xml/').replace(/\.html$/, '.xml'));
        assert.equal(poem.sourceCheck.printedEdition, item.printedEdition);
      }
    }
  }
  assert.deepEqual(ids, new Set(selected.map(poem => poem.id)));
});

test('newly featured works are distinct from existing selections and every archive shelf', async () => {
  const titles = new Set(), texts = new Set(), openings = new Set();
  const originals = collection.filter(poem => !selected.includes(poem));
  const remember = (poet, title, lines, adding = false) => {
    const authorTitle = key(poet) + '/' + key(title);
    const tokens = words(lines);
    const text = key(tokens.join(''));
    const opening = key(poet) + '/' + key(tokens.slice(0, 16).join(''));
    if (adding) {
      assert(!titles.has(authorTitle), title);
      assert(!texts.has(text), title);
      if (tokens.length >= 16) assert(!openings.has(opening), title);
    }
    titles.add(authorTitle);
    if (text) texts.add(text);
    if (tokens.length >= 16) openings.add(opening);
  };
  for (const poem of originals) remember(poem.poet, poem.title, poem.lines);
  const index = JSON.parse(gunzipSync(await read('archive/' + archive.catalogue.file)));
  const catalogue = new Map(index.map(([id, title, poet]) => [id, {title, poet}]));
  for (const shelf of archive.shelves) {
    for (const [id, lines] of JSON.parse(gunzipSync(await read('archive/' + shelf.file)))) {
      const {poet, title} = catalogue.get(id);
      remember(poet, title, lines);
    }
  }
  for (const poem of selected) remember(poem.poet, poem.title, poem.lines, true);
  const shelley = byId.get('shelley-ozymandias');
  assert.deepEqual(shelley.aliases, ['archive-145effb854854cbc']);
  assert(!catalogue.has(shelley.aliases[0]));
  assert.equal(shelley.sourceCheck.recommendedSource, shelley.source);
  assert.equal(byId.get('whitman-patient-spider').sourceCheck.status, 'verified');
});

test('the 1887 Townsend rendering belongs to the original and retains its historical publication credit', () => {
  const poem = byId.get('leopardi-infinito');
  const english = poem.translation;
  assert.equal(english.method, 'published');
  assert.equal(english.translator, 'Frederick Townsend');
  assert.match(english.credit, /1887/);
  assert.match(english.source, /^https:\/\/en\.wikisource\.org\/wiki\/Poems_of_Giacomo_Leopardi\/Poem_12$/);
  assert.match(english.verification, /The-Poems-of-Giacomo-Leopardi/);
  assert.equal(english.lines.length, 15);
  assert.equal(english.displayedTextSha256, hash(english.lines.join('\n')));
});

test('source layout keeps section voices and excludes unsigned editorial material', () => {
  const norwid = byId.get('cyprian-kamil-norwid-fortepian-chopina').lines;
  assert.deepEqual(norwid.filter(line => /^[IVX]+$/.test(line)), ['I','II','III','IV','V','VI','VII','VIII','IX','X']);
  assert(norwid.includes('Byron') && norwid.includes('Béranger'));
  const ode = byId.get('juliusz-slowacki-oda-do-wolnosci').lines;
  assert(ode.includes('I') && ode.includes('IX'));
  const valmore = byId.get('marceline-desbordes-valmore-le-mal-du-pays');
  assert.match(valmore.lines[0], /^Je veux aller mourir/);
  const swan = byId.get('charles-baudelaire-le-cygne');
  assert(swan.lines.includes('I') && swan.lines.includes('II'));
  assert.equal(byId.get('ameen-rihani-the-two-brothers').title, 'The Two Brothers');
});
