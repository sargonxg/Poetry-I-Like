# Poetry I Like

A browser reading room with **145 complete poems by 126 poets**, including 10
Italian, 10 French and 10 Polish originals with English translations. Nine modern
favourites link to readable editions. They are counted separately from poems.

Search a remembered line, choose a language or theme, save a poem, or read a
shuffled shelf without repeats. Original, English and side-by-side views keep
the source text close to each translation. The forest and optional rain stay
behind the reading; sound starts only when chosen.

## Run locally

Node.js 20 or later. No package dependencies or API keys.

```sh
git clone https://github.com/sargonxg/Poetry-I-Like.git
cd Poetry-I-Like
npm test
npm run dev
```

Open http://127.0.0.1:5175. `npm run build` creates a self-contained
`dist/index.html`, including the collection, Source Serif 4, illustration and
reader. It also opens directly as a local file. External edition links need an
internet connection; reading and locally synthesized sound do not.

## Read and return

The library starts with complete poems. Reading links have a separate shelf.
Search works across titles, poets and original lines; language and theme
filters combine. The random shelf visits every selection before reshuffling.

Save poems in this browser. Export/import a shelf of IDs, share a poem or line
bookmark, copy a source citation, print, or download a private note. Notes remain
in the tab and clear when switching poems; download a note before leaving it.

Reading settings offer size, spacing, line focus, plain paper and sound. No
account, analytics, model endpoint or reading history leaves the browser.

## Sources, translations and audit

`data/poems.json` is the canonical collection. Each full text carries an edition,
rights basis and source check. `data/source-audit-20261112.json` documents
source-text verification, excerpt corrections and held records. Broken compound
PoetryDB URLs were replaced with verified title endpoints. Three edition
variants were replaced with the exact source text; Giusti's Sant'Ambrogio is
now the complete 96-line poem.

Full texts use public-domain originals. PoetryDB collection data is CC BY 4.0;
original texts and translations have distinct rights. Modern favourites such as
Krynicki, Montale and Sbarbaro remain external references with no protected verse
stored. Book listings, lectures and unavailable links are excluded from that
shelf. [Concordia Discors](https://concordiadiscors.org/poetry/) provides reading
inspiration; a collection listing does not count as a complete poem.

New English translations are **AI-generated for this project** and labelled in
the reader, exports and each record. They are not established published
translations; no human editorial review is claimed. Read the original alongside
them. Source Serif 4 is by Adobe, distributed under its retained OFL licence.

## Static hosting

```sh
npm run build
```

Deploy only `dist/`. A Workers Static Assets configuration is included; it does
not activate a route, configure authentication or set a spending cap. An
owner-private copy needs whole-host Cloudflare Access configured separately.
No database, bucket, backend, subscription or scheduled work is required.

## Verification

`npm test` checks content/rights separation, multilingual minimums, translation
attribution, search, saved shelves, bookmark validation, non-repeating shuffles,
settings and emitted CSP hashes. Browser captures and their limits are recorded
in `docs/`. Existing captures predate this multilingual release until replaced.
