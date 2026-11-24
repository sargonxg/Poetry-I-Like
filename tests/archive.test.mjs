import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {gunzipSync} from 'node:zlib';

test('the archive keeps each complete stored edition reachable within its declared read bound', async () => {
  const root = 'dist/data/archive/';
  const manifest = JSON.parse(await readFile(root + 'manifest.json', 'utf8'));
  async function unpack(entry) {
    const packed = await readFile(root + entry.file);
    assert.equal(packed.length, entry.bytes);
    assert.equal(createHash('sha256').update(packed).digest('hex'), entry.sha256);
    const raw = gunzipSync(packed, {maxOutputLength: entry.expandedBytes});
    assert.equal(raw.length, entry.expandedBytes);
    return JSON.parse(raw);
  }
  const catalog = await unpack(manifest.catalogue);
  assert.equal(catalog.length, manifest.entries);
  assert(catalog.length >= 2000);
  assert.equal(new Set(catalog.map(([id]) => id)).size, catalog.length);
  assert.equal(new Set(catalog.map(([,title,poet]) => poet + '\0' + title)).size, catalog.length);
  const pages = await Promise.all(manifest.shelves.map(unpack));
  assert.equal(pages.flat().length, catalog.length);
  for (const [id,title,poet,count,,shelf] of catalog) {
    const poem = pages[shelf].find(([candidate]) => candidate === id);
    assert.match(id, /^archive-[a-f0-9]{16}$/);
    assert(title && poet && poem);
    assert.equal(poem[1].length, count);
    assert(poem[1].some(line => line.trim()));
  }
  assert(manifest.shelves.every(page => page.expandedBytes <= 250_000));
});
