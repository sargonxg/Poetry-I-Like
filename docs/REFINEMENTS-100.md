# One hundred implemented reading-room refinements

This record describes the November 12 forest-refinement branch. The interface
still opens with a library, one poem and a quiet reading companion. Most tools
are behind the Aa dialog or a native disclosure. These are code changes, not
100 extra panels or a list of future promises.

The collection remains 121 full-text selections by 104 poets and 50 external
reading references. No modern protected verse was added. The original woodland
is an illustration, not a photograph. References below name the relevant source
or helper; tests and rendered-browser limits are stated at the end.

| No. | Implemented refinement | Source or evidence |
| --- | --- | --- |
| 1 | Replaced the repeated triangle-tree landscape with deciduous woodland. | assets/forest.svg; scripts/forest-art.py |
| 2 | Gave the woodland generator a fixed random seed for repeatable output. | scripts/forest-art.py: Random(76411) |
| 3 | Drew curved, tapering trunks rather than straight rectangular tree forms. | scripts/forest-art.py: trunk paths |
| 4 | Added irregular bark marks to foreground trunks. | scripts/forest-art.py: foreground bark paths |
| 5 | Added long, forked branches attached to those trunks. | scripts/forest-art.py: direction/branch loop |
| 6 | Built irregular broadleaf canopy clusters. | scripts/forest-art.py: leaves definition and use nodes |
| 7 | Separated near, middle and distant woodland layers by scale and color. | scripts/forest-art.py: three depth layers |
| 8 | Added static mist between layers to make distance legible. | scripts/forest-art.py: inter-layer mist paths |
| 9 | Added a winding woodland path with a quiet central clearing. | scripts/forest-art.py: path gradient/path shape |
| 10 | Added ground plants and small patches of dappled light. | scripts/forest-art.py: ground plants/light marks |
| 11 | Embedded the original art in the built file; no image service is needed. | scripts/build.mjs; tests/build.test.mjs |
| 12 | Bounded pointer depth to 3.5 pixels horizontally and 2.5 vertically. | src/app.mjs: pointermove handler |
| 13 | Scheduled depth changes only in response to pointer input. | src/app.mjs: depthFrame requestAnimationFrame guard |
| 14 | Disabled pointer depth for coarse pointers. | src/app.mjs: fine/depthEnabled |
| 15 | Followed the device's reduced-motion preference for both depth and rain. | src/app.mjs: reduce; src/style.css: reduced-motion media rule |
| 16 | Added an explicit depth switch in settings. | src/index.html: forest-depth |
| 17 | Made visual rain opt-in rather than an idle animation. | DEFAULT_SETTINGS.rain; visual-rain control |
| 18 | Kept rain decoration to 32 CSS-animated drops. | src/app.mjs: rain loop |
| 19 | Canceled pending depth frames and reset transforms when hidden or leaving. | src/app.mjs: stopDepth/visibilitychange/pagehide |
| 20 | Added a higher-contrast media preference that makes paper opaque. | src/style.css: prefers-contrast rule |
| 21 | Removed spaced-uppercase decorative labels from the reading layout. | src/index.html; src/style.css: caption/brand labels |
| 22 | Increased secondary text contrast and kept reading labels distinct from body text. | src/style.css: ink/secondary palette, poem-meta/source-line |
| 23 | Added a book-serif stack suited to sustained reading. | src/style.css: reader-font |
| 24 | Kept Georgia as an explicit alternate serif. | src/app.mjs: applySettings; font-family control |
| 25 | Added a sans-serif reading option. | src/app.mjs: applySettings; font-family control |
| 26 | Expanded the text-size control to 17–32 pixels. | font-size control; validateSettings |
| 27 | Added adjustable line spacing from 1.4 to 2.3. | line-height control; validateSettings |
| 28 | Added a maximum reading-measure control from 36 to 72 characters. | measure control; poem-lines max-width |
| 29 | Added small, bounded letter-spacing adjustments. | letter-spacing control; validateSettings |
| 30 | Added paper-opacity control with an 85% lower bound. | paper-opacity control; validateSettings |
| 31 | Added soft-white, white and evening paper choices. | paper-tone control; paper/evening CSS |
| 32 | Applied reading changes live without changing the selected poem. | src/app.mjs: applySettings |
| 33 | Persisted and validated reading preferences locally. | validateSettings; KEY.settings |
| 34 | Added a reading-settings reset that preserves saved poems. | reset-settings handler |
| 35 | Added Just the poem to hide the sidebars. | reading-mode handler/CSS |
| 36 | Used a hanging indent when a verse line wraps on narrow screens. | src/style.css: verse-line padding/text-indent |
| 37 | Added public-domain poem copy with its source citation. | copy-poem handler; disabled for references |
| 38 | Added a separate citation-copy action. | citation helper; copy-citation handler |
| 39 | Added poem and optional focused-line link copying without leaking local file paths. | shareFragment; share-poem handler |
| 40 | Added a clean print layout that removes chrome and retains the source. | print-poem handler; print CSS |
| 41 | Derived line, stanza and word counts from the actual displayed text. | poemFacts; tests/reader.test.mjs |
| 42 | Counted lines containing question marks for a grounded rereading prompt. | poemFacts.questions; form-notice |
| 43 | Identified opening words recurring on at least three lines. | poemFacts.repeatedStart; tests/reader.test.mjs |
| 44 | Estimated reading time from the stored text rather than a made-up duration. | readingMinutes; poemFacts |
| 45 | Added ten original questions that guide a second reading. | data/reading-guides.json: prompts |
| 46 | Added a distinct writing exercise for each of seven themes. | src/app.mjs: exercises |
| 47 | Added twelve brief factual poet notes with explicit source links. | data/reading-guides.json: poets |
| 48 | Used source-record context for other poets rather than inventing biographies. | src/app.mjs: poet-bio fallback |
| 49 | Put source-edition and rights details behind a disclosure. | Edition and source disclosure; edition-note/rights-basis |
| 50 | Added three short reading paths, including a clearly marked modern Italian shelf. | data/reading-guides.json: paths |
| 51 | Made search insensitive to common accents and Polish ł. | fold; tests/reader.test.mjs |
| 52 | Let a remembered line find its poem. | filterCollection scope all; tests/reader.test.mjs |
| 53 | Added a title-and-poet-only search scope. | scope control; filterCollection |
| 54 | Bounded the search field to 160 characters. | search maxlength and input slice |
| 55 | Bounded matching to twelve query words and folds each record once per search. | filterCollection |
| 56 | Added separate full-poem and modern-reference filters. | kind control; tests/reader.test.mjs |
| 57 | Added real record counts to theme options. | src/app.mjs: theme option construction |
| 58 | Added real record counts to language options. | src/app.mjs: language option construction |
| 59 | Added sorting by poet, then title. | filterCollection sort poet |
| 60 | Added sorting by title. | filterCollection sort title |
| 61 | Added short-read ordering that keeps references after actual full texts. | filterCollection sort short; tests/reader.test.mjs |
| 62 | Added one-action filter reset without changing the selected poem. | clear-filters handler |
| 63 | Added useful empty states for filtered and saved shelves. | drawShelf empty-state text |
| 64 | Limited the initial result DOM to 24 entries. | state.shown/drawShelf |
| 65 | Added 24-result increments while preserving the library's scroll position. | show-more handler |
| 66 | Restricted random selection to full texts in the current filtered view. | randomPoem; fullTexts |
| 67 | Avoided immediately repeating the open poem during random selection. | nextRandom; tests/collection.test.mjs |
| 68 | Bounded session reading history to 100 entries. | selectPoem/back |
| 69 | Remembered the last known poem in this browser. | KEY.last; initial selection validation |
| 70 | Validated shared poem IDs and focused-line indexes before applying bookmarks. | parseFragment; tests/reader.test.mjs |
| 71 | Stored only known saved-poem IDs, capped at 250. | normalizeSaved; KEY.saved |
| 72 | Discarded duplicate and stale saved IDs. | normalizeSaved; tests/collection.test.mjs |
| 73 | Added a versioned shelf export containing IDs rather than verse. | exportShelf; tests/reader.test.mjs |
| 74 | Rejected imported shelf files over 64 KB before reading them. | import-shelf handler; importShelf |
| 75 | Validated import format/count and merged only known selections. | importShelf; import-shelf handler; tests/reader.test.mjs |
| 76 | Added note download with a source citation and a 10,000-character field bound. | private-note maxlength; download-note handler |
| 77 | Kept notes ephemeral and cleared them when selecting another poem. | drawPoem; note privacy copy |
| 78 | Preserved an in-progress note when saving or unsaving the current poem. | save-poem updates only the shelf |
| 79 | Added saved-shelf clearing without changing the underlying collection. | clear-saved handler |
| 80 | Added removal of only this reader's local preference/saved keys. | clear-local handler; KEY |
| 81 | Added a keyboard skip link to the poem. | src/index.html: skip-link/main |
| 82 | Moved focus to the selected poem heading when navigation permits it. | drawPoem focus option |
| 83 | Replaced the settings strip with a native modal dialog. | settings dialog; settings-toggle/close-settings |
| 84 | Put the mobile library in a native dialog and restored it to its desktop home on close. | showLibrary; libraryAnchor; library-dialog close |
| 85 | Used native Escape/focus behavior and an explicit close control for both dialogs. | src/index.html: dialog controls |
| 86 | Added 44-pixel controls for principal actions and mobile library controls. | button defaults; library-dialog CSS |
| 87 | Added Up/Down and Home/End line navigation in the poem region. | keydown handler; safeLine |
| 88 | Debounced search announcements and exposed result counts as polite status. | searchTimer; shelf-count role/status |
| 89 | Kept save/shelf/view/sound pressed states and mobile-library expanded state explicit. | updateSaved; shelf/reading-mode/audio/library handlers |
| 90 | Rendered record data as text and allowed only HTTPS external source URLs. | textContent/setLink; safeSource |
| 91 | Replaced a short noise loop with two independent 7/11-second ambience layers. | src/audio.mjs: WoodlandAudio.start |
| 92 | Added separate rain, forest-air and stream spectra. | WoodlandAudio filters; sound-type control |
| 93 | Added slow independent gain modulation instead of a repeating electronic bird chirp. | WoodlandAudio movement/depth oscillators |
| 94 | Added a dynamics compressor, gradual gain changes and a 35% volume ceiling. | WoodlandAudio limiter/setVolume; validateSettings |
| 95 | Added a bounded 5–60-minute sound sleep timer. | WoodlandAudio.setTimer; sleep-timer |
| 96 | Kept audio entirely user-initiated, locally synthesized and download-free. | sound-toggle; WoodlandAudio |
| 97 | Closed audio contexts on hidden/page exit and guarded against stale asynchronous starts. | WoodlandAudio.generation; visibility/pagehide handlers |
| 98 | Added exact CSP script/style hashes, blocked network connections and denied unused browser capabilities. | scripts/build.mjs; tests/build.test.mjs |
| 99 | Added a self-contained-file size budget, script parse check and build-placeholder check. | tests/build.test.mjs |
| 100 | Expanded automated checks to cover reader logic, import/bookmark bounds, derived observations and release security. | tests/collection.test.mjs; tests/reader.test.mjs; tests/build.test.mjs |

## Verification and limits

The local build and Node tests are run for this branch. The tests do not prove
sound quality, screen-reader usability, color contrast in every scene or every
external site's continued availability. No local preview server was started in
the managed environment because its required browser-control capability was
unavailable. The parent task owns new Cloudflare Browser Rendering captures.
Existing screenshots are retained until the owner supplies replacements.

The twelve biography notes use concise factual descriptions and linked sources;
their external URLs were not all rechecked live during this refinement. The
original full-text source and rights records remain unchanged. Themes are
editorial suggestions. Automated observations are counts of the displayed text,
not claims of formal literary scholarship.

Clipboard support depends on browser permissions. Static hosts that do not
support Cloudflare's _headers format need equivalent configuration. The app does
not provide login; private hosting still requires an external access policy.
