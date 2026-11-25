#!/usr/bin/env python3
"""Rebuild the November 2026 reading selections from public, pinned editions.

Optional editorial tool: Python 3 with lxml. The reader and production build
use checked-in JSON and perform no fetches. See data/README.md for commands.
"""
import argparse
import copy
import hashlib
import json
import re
import unicodedata
from pathlib import Path
from urllib.request import Request, urlopen

from lxml import html

ROOT = Path(__file__).resolve().parents[1]
BATCH = 'public-editions-2026-11'
PROVIDERS = {
    'Standard Ebooks': ('Standard Ebooks', 'https://creativecommons.org/publicdomain/zero/1.0/'),
    'Wikisource': ('Wikisource contributors', 'https://creativecommons.org/licenses/by-sa/4.0/'),
    'Wolne Lektury': ('Fundacja Wolne Lektury', 'https://wolnelektury.pl/info/prawa/'),
}


def dump(value):
    return json.dumps(value, ensure_ascii=False, indent=2) + '\n'


def digest(value):
    return hashlib.sha256(value).hexdigest()


def text_key(value):
    return ''.join(c for c in unicodedata.normalize('NFKD', value.casefold()) if c.isalnum())


def clean(value):
    return ' '.join(value.replace('\u2060', '').replace('\u00ad', '').split())


def class_name(name):
    return f'contains(concat(" ",normalize-space(@class)," ")," {name} ")'


def normalize_lines(lines):
    verse = []
    for line in lines:
        if line.strip() or (verse and verse[-1].strip()):
            verse.append(line)
    while verse and not verse[-1].strip():
        verse.pop()
    if not verse or any(len(line) > 850 for line in verse):
        raise ValueError('Empty verse or missing line boundaries')
    return verse


def standard_verse(doc, item):
    matches = doc.xpath('//article[@id=$id]', id=item['section'])
    if len(matches) != 1:
        raise ValueError('Edition does not identify exactly one poem')
    poem = matches[0]
    if 'z3998:poem' not in poem.get('epub:type', '').split():
        raise ValueError('Article is not a poem')
    if any(child.tag not in ('h2', 'h3', 'p', 'footer', 'hr') for child in poem):
        raise ValueError('Composite work requires a separate editorial reading')
    heading = copy.deepcopy(poem.xpath('(./h2|./h3)[1]')[0])
    for anchor in heading.xpath('.//a'):
        if anchor.get('epub:type') == 'noteref':
            anchor.drop_tree()
    title = clean(heading.text_content())
    verse = []
    for stanza in poem.xpath('./p'):
        spans = stanza.xpath('./span')
        if not spans or any(child.tag not in ('span', 'br') for child in stanza):
            raise ValueError('Unrecognized stanza markup')
        if clean(stanza.text or '') or any(clean(child.tail or '') for child in stanza):
            raise ValueError('Non-line content in stanza')
        for line in spans:
            line = copy.deepcopy(line)
            for anchor in line.xpath('.//a'):
                if anchor.get('epub:type') == 'noteref':
                    anchor.drop_tree()
            indent = re.search(r'(?:^| )i(\d+)(?: |$)', line.get('class',''))
            verse.append(('  ' * int(indent.group(1)) if indent else '') + clean(line.text_content()))
        verse.append('')
    return title, normalize_lines(verse)


def wiki_verse(doc, item, layout=None):
    scope = doc.get_element_by_id('mw-content-text')
    selector = './/div[' + class_name('poem') + ']'
    blocks = scope.xpath(selector)
    if layout == 'numbered-original':
        # Les Pleurs prints epigraphs by other authors before its numbered poem.
        # The scanned verse proper begins after that heading, even across pages.
        headings = [h for h in scope.xpath('.//h3') if re.fullmatch(r'[IVXLCDM]+\.', clean(h.text_content()))]
        if len(headings) != 1:
            raise ValueError('Missing or ambiguous poem opening')
        blocks = [node for el in headings[0].itersiblings() for node in el.iter()
                  if isinstance(node.tag, str) and 'poem' in node.get('class', '').split()]
    elif layout == 'fleurs-du-mal':
        # These editions also carry numbered movements and short dedications.
        container = scope.xpath('.//div[' + class_name('prp-pages-output') + ']')
        if len(container) != 1:
            raise ValueError('Missing source pages')
        material = []
        for node in container[0].iter():
            if not isinstance(node.tag, str):
                continue
            if node in blocks:
                material.append(node)
            elif node.tag == 'h4' or (node.tag == 'div' and node.getparent() is container[0] and
                                      re.fullmatch(r'À [A-ZÀ-Ÿ .-]{2,75}', clean(node.text_content()))):
                material.append(node)
        blocks = material
    if not blocks:
        raise ValueError('No Wikisource verse blocks')
    lines = []
    for original in blocks:
        if 'poem' not in original.get('class', '').split():
            lines.extend(['', clean(original.text_content()), ''])
            continue
        block = copy.deepcopy(original)
        for node in block.xpath('.//style|.//link|.//sup|.//*[' + class_name('numeroriga') + ']'):
            node.drop_tree()
        if any(child.tag != 'p' for child in block):
            raise ValueError('Poem contains section material requiring manual treatment')
        for pi, paragraph in enumerate(block.xpath('./p')):
            if pi:
                lines.append('')
            for br in paragraph.xpath('.//br'):
                br.tail = '\u241e' + (br.tail or '')
            lines.extend(clean(line) for line in paragraph.text_content().split('\u241e'))
    return item['title'], normalize_lines(lines)


def wolne_verse(doc, item):
    if not (doc.get('lang') == 'pl' or doc.xpath('//*[@lang="pl"]')):
        raise ValueError('Polish original required')
    if doc.get('id') != 'book-text':
        raise ValueError('Missing book text')
    lines = []
    verses = 0

    def without_editorial_marks(node):
        part = copy.deepcopy(node)
        for anchor in part.xpath('.//a[@class]'):
            if set(anchor.get('class', '').split()) & {'annotation', 'anchor', 'target', 'theme-begin', 'theme-end'}:
                anchor.drop_tree()
        return clean(part.text_content())

    for block in doc:
        if not isinstance(block.tag, str):
            continue
        role = block.get('class', '')
        if role == 'stanza':
            for verse in block.xpath('.//*[' + class_name('verse') + ']'):
                indent = '  ' if 'verse-indent' in verse.get('class', '').split() else ''
                lines.append(indent + without_editorial_marks(verse))
                verses += 1
            lines.append('')
        elif role == 'motto' and (quoted := block.xpath('.//*[' + class_name('verse') + ']')):
            lines.extend(without_editorial_marks(line) for line in quoted)
            lines.append('')
            verses += len(quoted)
        elif block.tag in ('h3', 'h4') or role in ('motto', 'motto_podpis', 'note', 'spacer-asterisk'):
            # Leave speakers, section marks, credited epigraphs and authorial
            # datelines in their printed order.
            lines.extend([without_editorial_marks(block), ''])
        elif block.tag == 'h1' or block.get('id') in ('toc', 'themes', 'footnotes', 'nota_red', 'nota-red', 'editorial-note', 'nota', 'references'):
            continue
        elif clean(block.text_content()):
            raise ValueError('Polish page contains unsupported text layout')
    if not verses or verses != len(doc.xpath('//*[' + class_name('verse') + ']')):
        raise ValueError('Unaccounted source verse')
    return item['title'], normalize_lines(lines)


def cache_source(url, cache, fetch):
    path = cache / (digest(url.encode()) + '.html')
    if not path.exists():
        if not fetch:
            raise ValueError(f'Missing source {url}; enable --fetch or supply the cache')
        req = Request(url, headers={'User-Agent':'Mozilla/5.0 (compatible; Poetry-I-Like editorial audit)'})
        with urlopen(req, timeout=30) as response:
            if response.status != 200 or response.url != url:
                raise ValueError('Source redirect or HTTP error: '+url)
            path.write_bytes(response.read())
    return path.read_bytes()


def extract(doc, edition, item):
    if edition['provider'] == 'Wikisource':
        return wiki_verse(doc, item, edition.get('layout'))
    return {'Standard Ebooks': standard_verse, 'Wolne Lektury': wolne_verse}[edition['provider']](doc, item)


def build_entry(edition, item, lines, title, checked, source_digest):
    provider = edition['provider']
    entity, license_url = PROVIDERS[provider]
    language = edition['language']
    languages = {'en': 'English', 'fr': 'French', 'it': 'Italian', 'pl': 'Polish'}
    source = item.get('source') or edition['source'] + '#' + item['section']
    rights = {
        'mode': 'public-domain',
        'authorDied': edition['died'],
        'basis': item.get('rightsBasis', edition['rightsBasis']),
        'editionLicense': license_url,
    }
    edition_year = item.get('editionYear') or edition.get('editionYear')
    if edition_year:
        rights['editionYear'] = edition_year
    labels = {
        'Standard Ebooks': 'Standard Ebooks · CC0 edition',
        'Wikisource': 'Wikisource · CC BY-SA 4.0 transcription',
        'Wolne Lektury': 'Wolne Lektury · historic Polish text',
    }
    methods = {
        'Standard Ebooks': 'Complete identified poem article and every verse span.',
        'Wikisource': 'Full verse of the identified work; prefatory quotations and editorial page furniture excluded.',
        'Wolne Lektury': 'All source stanzas with section headings, speaker labels and credited epigraphs. Editorial markers excluded.',
    }
    evidence = {
        'status': 'verified',
        'editionBatch': BATCH,
        'checkedAt': checked,
        'sourceSha256': source_digest,
        'displayedTextSha256': digest('\n'.join(lines).encode()),
        'lines': sum(bool(line.strip()) for line in lines),
        'verifiedBy': methods[provider],
    }
    if item.get('editionSource'):
        evidence.update(editionMetadata=item['editionSource'], printedEdition=item['printedEdition'])
    return {
        'id': item['id'], 'kind': 'poem', 'poet': edition['author'],
        'title': title, 'language': language,
        'original': edition['edition'] + ' · ' + languages[language], 'lines': lines,
        'themes': item['themes'], 'note': item.get('note', ''),
        'source': source, 'label': labels[provider],
        'credit': entity + ' · original ' + languages[language] + ' text',
        'rights': rights, 'sourceCheck': evidence,
    }


def build(cache, fetch=False):
    manifest = json.loads((ROOT / 'data/editions-20261124.json').read_text())
    data_file = ROOT / 'data/poems.json'
    original = json.loads(data_file.read_text())
    retained = [row for row in original if row['sourceCheck'].get('editionBatch') != BATCH]
    additions = []
    cache.mkdir(exist_ok=True, parents=True)
    for edition in manifest['editions']:
        previous_url = None
        for item in edition['items']:
            url = item.get('source') or edition['source']
            if url != previous_url:
                raw = cache_source(url, cache, fetch)
                doc = html.fromstring(raw, parser=html.HTMLParser(encoding='utf-8'))
                previous_url = url
            title, lines = extract(doc, edition, item)
            if digest('\n'.join(lines).encode()) != item['textSha256'] or title != item['title']:
                raise ValueError('Verse or title has changed; review the edition: ' + url)
            # Page furniture can change while the identified verse stays intact.
            # The retained audit hash identifies the originally reviewed page.
            pinned = item.get('sourceSha256') or edition['sourceSha256']
            additions.append(build_entry(edition, item, lines, title, manifest['checkedAt'], pinned))
    readings = [row for row in retained if row['kind'] == 'reading']
    collection = [row for row in retained if row['kind'] == 'poem'] + additions + readings
    if len({row['id'] for row in collection}) != len(collection):
        raise ValueError('Duplicate work identifier')
    data_file.write_text(dump(collection))
    print(f'Loaded {len(additions)} complete poems from {len(manifest["editions"])} editions.')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--cache',type=Path,required=True)
    parser.add_argument('--fetch',action='store_true',help='Download missing public editions during the editorial import only')
    args = parser.parse_args()
    build(args.cache,args.fetch)
