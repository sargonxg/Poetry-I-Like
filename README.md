# Poetry I Like

![App screenshot](screenshots/desktop.webp)

[Mobile view](screenshots/mobile.webp)

[100 implemented refinements](docs/REFINEMENTS-100.md) · [Browser review](docs/BROWSER-REVIEW-20261112.json)

[Mobile library](screenshots/library-mobile-20261112.webp) · [Reading settings](screenshots/reading-settings-20261112.webp)

A quiet browser reader for **121 full-text poems by 104 poets**, with 50 further
reading references. Browse by poet, theme or language; read one line at a time;
save a poem; turn on soft rain or a forest soundscape.

The room uses original forest artwork and translucent paper. There are no
accounts, analytics, model calls, external fonts or audio downloads.

## Open it

Node.js 20 or later is enough. There are no package dependencies.

~~~sh
git clone https://github.com/sargonxg/Poetry-I-Like.git
cd Poetry-I-Like
npm run build
npm run dev
~~~

Open **http://127.0.0.1:5175**. You can also open dist/index.html directly in a
browser after building: the reader, data, CSS, JavaScript and artwork are all
in that file. Sound needs a browser that supports Web Audio.

## A few ways to use the room

Search for a remembered line, a poet or a title. Accents are optional. Theme,
language and full-text/reference filters work together. Collection counts reflect
the records actually present. The library initially renders 24 results; show more
when needed. Reading paths offer a short starting sequence.

**Another poem** chooses a full text from the current view. It avoids repeating
the poem already open. **Back** returns through the current session. The room
remembers the last poem on this browser; a shared poem bookmark takes priority.

**Aa** opens reading settings: type size, line spacing, measure, letter spacing,
paper opacity, three typeface choices and an evening paper option. **Just the
poem** hides the sidebars. **Follow one line** works by clicking a line or using
Up/Down and Home/End while the poem region has keyboard focus. Line numbers are
optional. A line bookmark can be copied with **Copy link**.

**Beside the poem** keeps reading questions, display-derived observations, poet
sources, edition rights and writing prompts behind disclosures. The line/stanza
counts and repeated-opening observations describe the displayed text; they do
not claim to establish a poem's form or the writer's intention. Twelve poets
have brief factual notes with source links; other writers use a source-record
fallback rather than an invented biography.

Saved poems stay in this browser. Export or import a shelf of IDs from settings;
no poem text or private note is included. Notes stay in this tab, with a download
button before moving to another poem. Copy a public-domain text with its source,
copy a citation, or print a clean reading page.

**Sound off** starts optional locally synthesized rain. Settings also offer
forest air and a small stream, low-volume control and a sleep timer. Sound fades
out when you leave the tab. Optional rain animation and gentle pointer depth
respect reduced-motion preferences. The woodland is an original, reproducible
illustration of deciduous trees, not a stock photograph.

Modern writers including **Krynicki, Montale and Sbarbaro** appear as source-linked
reading references. Their protected verse is not republished. The collection
also links to [Concordia Discors poetry](https://concordiadiscors.org/poetry/).

See [100 implemented refinements](docs/REFINEMENTS-100.md) for precise source
locations and verification limits. The screen stays focused on reading rather
than exposing every control at once.

## Deploy a static copy

Upload the contents of dist/ to any static host. A Cloudflare Workers asset-only
configuration is included. It intentionally disables workers.dev and version
preview URLs; it does not create a public route or configure authentication.

~~~sh
npm run build
npx wrangler deploy
~~~

Configure your own domain/route and access policy in your Cloudflare account.
To keep a hosted room private, put the entire hostname behind Cloudflare Access
and test anonymous requests before sharing. The app itself has no login or
server. No database, storage bucket, model endpoint or scheduled job is needed.
The repository does not automatically deploy on push.

## Data and rights

Every entry in [data/poems.json](data/poems.json) keeps its source URL and a
rights record. Full texts are drawn from public-domain editions. Modern reading
references have empty lines arrays and an external source. Most of the library
is English; the language filter reflects the actual records.

PoetryDB collection data is **CC BY 4.0**. Individual original poem texts are
public domain in the cited editions; translation and copyright rules can vary
by jurisdiction. Do not replace historic originals with modern translations
without checking their rights. See [data/README.md](data/README.md) and
[data/provenance.json](data/provenance.json).

The reading questions, exercises, code and forest illustration are original to
this project. The notes are editorial invitations, not scholarly conclusions.

## Development and verification

~~~sh
npm test
npm run build
~~~

Twenty-one checks cover the collection/rights boundary, diacritic and full-text
search, combined filters, non-repeating random selection, settings validation,
bookmark/import bounds, display-derived annotations and compiled-build security. There are no
remote calls in the build. The build prints the HTML hash and collection counts.
The screenshot and interaction check record, when supplied, is in docs/.

The src/ directory contains readable HTML, CSS, behavior and pure selection
functions. scripts/build.mjs embeds the canonical collection and original SVG
into the static entry. scripts/dev.mjs serves an explicit local file allowlist.

## Privacy

Saved poem IDs use localStorage on this browser only. No text is uploaded.
Reading notes remain in memory, not persistent storage. Audio is synthesized
locally after a click and stops on page hide or the selected sleep timer. External source links are ordinary
links that open in another tab without access to the reader window.

Code and original artwork: [MIT](LICENSE). Collection data: CC BY 4.0 with source
attribution. The MIT license does not replace the separate rights of poem texts.

## Artwork and source guidance

The original woodland SVG is regenerated with:

~~~sh
python3 scripts/forest-art.py
~~~

The seed is fixed, so rebuilding the artwork is reproducible. The ordinary app
build uses the checked-in SVG and does not need Python. No third-party image or
recorded audio is redistributed. Reading-guide prose is original; biography
sources are explicit in data/reading-guides.json. Those links have not all been
rechecked live in this refinement task.

The generated Cloudflare headers include exact script/style CSP hashes, no
network connection permission, no-referrer, MIME sniffing protection and denied
camera/microphone/geolocation/payment capabilities. A static host that ignores
_headers must configure equivalent headers itself. Headers do not authenticate
visitors; private hosting still needs its own whole-host Access policy.
