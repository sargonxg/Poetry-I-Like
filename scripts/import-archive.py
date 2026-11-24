#!/usr/bin/env python3
"""Build the historic English archive from local PoetryDB response snapshots."""
import argparse
import gzip
import hashlib
import json
import re
import unicodedata
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BATCH = 72


def key(value):
    return ''.join(c for c in unicodedata.normalize('NFKC', value).casefold() if c.isalnum())


def digest(data):
    return hashlib.sha256(data).hexdigest()


def encoded(value):
    return (json.dumps(value, ensure_ascii=False, separators=(',', ':')) + '\n').encode()


def pack(directory, name, value):
    raw = encoded(value)
    packed = gzip.compress(raw, compresslevel=9, mtime=0)
    (directory / name).write_bytes(packed)
    return {'file': name, 'bytes': len(packed), 'expandedBytes': len(raw), 'sha256': digest(packed)}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('snapshot', type=Path, help='Directory of PoetryDB JSON responses and receipts.json')
    parser.add_argument('--checked-on', default='2026-11-24')
    args = parser.parse_args()

    sources = json.loads((args.snapshot / 'receipts.json').read_text())
    sources = [source for source in sources if re.fullmatch(r'lines-(?:1-6|7-10|11-13|14|15-19|20-26|27-36|37-50|51-75)\.json', source['file'])]
    curated = json.loads((ROOT / 'data/poems.json').read_text())
    titles = {(key(p['poet']), key(p['title'])) for p in curated}
    texts = {key(''.join(p['lines'])) for p in curated if p['kind'] == 'poem'}
    records = []
    omitted = Counter()

    for source in sources:
        raw = (args.snapshot / source['file']).read_bytes()
        if digest(raw) != source['sha256']:
            raise ValueError('Source hash changed: ' + source['file'])
        for item in json.loads(raw):
            author = unicodedata.normalize('NFC', item['author']).strip()
            title = unicodedata.normalize('NFC', item['title']).strip()
            lines = [unicodedata.normalize('NFC', line.rstrip()) for line in item['lines']]
            # The contributor field for this group contains only a surname.
            if author == 'Robinson':
                omitted['ambiguous author'] += 1
                continue
            if not title or not any(line.strip() for line in lines) or any(len(line) > 1400 for line in lines):
                omitted['invalid display data'] += 1
                continue
            if re.search(r'\b(?:excerpt|fragment|extract)\b', title, re.I):
                omitted['labelled excerpt or fragment'] += 1
                continue
            title_key = key(author), key(title)
            text_key = key(''.join(lines))
            if title_key in titles or text_key in texts:
                omitted['duplicate title or verse'] += 1
                continue
            titles.add(title_key)
            texts.add(text_key)
            ident = 'archive-' + digest((author + '\0' + title).encode())[:16]
            word_count = len(' '.join(lines).split())
            edition = item.get('source', '')
            if not isinstance(edition, str) or len(edition) > 400:
                edition = ''
            records.append((ident, title, author, len(lines), max(1, (word_count + 169) // 170), lines, edition))

    records.sort(key=lambda row: (key(row[2]), key(row[1])))
    directory = ROOT / 'data/archive'
    directory.mkdir(exist_ok=True)
    for path in directory.glob('verse-*.json.gz'):
        path.unlink()

    shelves = []
    index = []
    for start in range(0, len(records), BATCH):
        shelf = len(shelves)
        batch = records[start:start+BATCH]
        shelves.append(pack(directory, f'verse-{shelf:02d}.json.gz', [[r[0], r[5], r[6]] for r in batch]))
        index.extend([[*r[:5], shelf] for r in batch])
    catalogue = pack(directory, 'catalogue.json.gz', index)
    manifest = {
        'format': 'poetry-i-like:historic-archive/1',
        'entries': len(records),
        'poets': len({r[2] for r in records}),
        'language': 'en',
        'source': 'https://poetrydb.org/',
        'license': 'https://creativecommons.org/licenses/by/4.0/',
        'attribution': 'Poetry data from PoetryDB, licensed under CC BY 4.0. Original texts are public domain.',
        'checkedOn': args.checked_on,
        'policy': 'Historic English entries up to 75 nonblank source lines. Preserve source text and stanzas, with trailing space normalization. Explicitly labelled extracts and records with ambiguous authorship are held. Deduplicate against the curated collection and among archive titles and text.',
        'omitted': dict(omitted),
        'sourceSnapshots': sources,
        'catalogue': catalogue,
        'shelves': shelves,
    }
    (directory / 'manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps({'entries': len(records), 'poets': manifest['poets'], 'packedBytes': sum(r['bytes'] for r in [catalogue, *shelves]), 'omitted': omitted}))


if __name__ == '__main__':
    main()
