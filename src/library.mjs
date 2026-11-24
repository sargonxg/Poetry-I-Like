/** Local editions, and an optional archive packed at build time. */
export function openPoetryLibrary(collection, files, archive) {
  const byId = new Map(collection.map(poem => [poem.id, poem]));
  const requests = new Map();
  let archiveIndex;
  let verseSearch;

  function getJson(path, {expandedBytes} = {}) {
    if (!path) return Promise.reject(new Error('An edition is missing its source file.'));
    if (!requests.has(path)) {
      const promise = fetch(path, {credentials: 'same-origin'}).then(async response => {
        if (!response.ok) throw new Error('This part of the library could not load.');
        if (!expandedBytes) return response.json();
        if (!globalThis.DecompressionStream || !response.body) {
          throw new Error('This browser cannot open the archive. Read the selected poems or visit PoetryDB.');
        }
        const stream = response.body.pipeThrough(new DecompressionStream('gzip'));
        const reader = stream.getReader();
        const decoder = new TextDecoder();
        let length = 0;
        let text = '';
        try {
          for (;;) {
            const {done, value} = await reader.read();
            if (done) break;
            length += value.byteLength;
            if (length > expandedBytes) throw new Error('The archive file exceeds its expected length.');
            text += decoder.decode(value, {stream: true});
          }
        } finally {
          await reader.cancel();
        }
        return JSON.parse(text + decoder.decode());
      }).catch(error => {
        requests.delete(path);
        throw error;
      });
      requests.set(path, promise);
    }
    return requests.get(path);
  }

  async function prepareArchive() {
    if (archiveIndex) return archiveIndex;
    if (!archive || !/^https?:$/.test(location.protocol)) {
      throw new Error('Open the hosted reading room to browse the historic archive.');
    }
    const index = await getJson(archive.base + archive.catalogue.file, archive.catalogue);
    if (archiveIndex) return archiveIndex;
    archiveIndex = index.map(([id, title, poet, verseCount, minutes, shelf]) => ({
      id, title, poet, verseCount, minutes, shelf, kind: 'poem', language: 'en', themes: [], archive: true,
    }));
    for (const poem of archiveIndex) byId.set(poem.id, poem);
    collection.push(...archiveIndex);
    return archiveIndex;
  }

  async function read(poem) {
    if (Array.isArray(poem.lines)) return poem;
    if (poem.archive) {
      const entry = archive.shelves[poem.shelf];
      const pages = await getJson(archive.base + entry.file, entry);
      for (const [id, lines, edition] of pages) {
        const summary = byId.get(id);
        if (!summary) continue;
        const author = encodeURIComponent(summary.poet + ':abs');
        const title = encodeURIComponent(summary.title + ':abs');
        const source = 'https://poetrydb.org/author,title/' + author + ';' + title;
        Object.assign(summary, {
          lines, original: edition || 'PoetryDB historic archive',
          source, credit: 'PoetryDB · CC BY 4.0',
          rights: {mode: 'public-domain', basis: archive.attribution},
          note: '',
        });
      }
    } else {
      const editions = await getJson(files.shelves[poem.shelf]);
      for (const edition of editions) Object.assign(byId.get(edition.id), edition);
    }
    if (!Array.isArray(poem.lines)) throw new Error('The edition could not be found.');
    return poem;
  }

  async function prepareSearch() {
    if (files?.search) verseSearch = await getJson(files.search);
  }

  return {
    read, prepareArchive, prepareSearch,
    get archiveReady() { return Boolean(archiveIndex); },
    get searchable() { return !files?.search || Boolean(verseSearch); },
    textFor(poem) {
      return verseSearch?.[poem.id] || (poem.lines || []).join(' ') + ' ' + (poem.translation?.lines || []).join(' ');
    },
  };
}
