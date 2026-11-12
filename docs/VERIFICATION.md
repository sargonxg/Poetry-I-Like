# Initial release verification · November 12, 2026

The initial source collection has 121 full-text selections by 104 poets and 50
external reading references. The full texts retain rights/source records.
Protected modern readings have no poem lines.

Completed locally:

- Five Node tests for rights/metadata boundaries, combined search filters,
  non-repeating random selection, saved-ID validation and safe external sources.
- npm test and npm run build.
- Syntax parsing of the one inline application script in the built HTML.
- Verification that the build has no unexpanded data/style/script markers.
- Manual source review of browser-only favorites, ephemeral notes, user-initiated
  synthesized audio and audio cleanup on page visibility changes.

The built index.html is self-contained: it includes the source data, original
forest SVG, styles and JavaScript. It needs no remote font, audio sample, model
endpoint, API or database. The local development server serves a fixed allowlist.

No local browser or preview server was started in the managed environment:
the required browser-control capability was not exposed. Screenshots and any
later deployed-browser checks belong to the personal-site owner and should be
recorded with their actual method. Audible audio quality and a manual
screen-reader pass have not been tested here.

The repository has not been deployed or pushed by this task owner. Its Wrangler
configuration disables public workers.dev/version previews. Hosting access
controls must be configured and verified by the eventual deployer.


## Forest refinement branch

Branch: codex/forest-refinement-20261112. The data counts and full-text rights
boundary are unchanged. The refined self-contained entry is below 1 MiB. It
includes new original woodland artwork and original reading guides.

Twenty-one individual Node checks across three files now cover source/rights,
search, settings bounds, shelf import/export, poem/line bookmarks, display-derived
observations, self-contained payload and exact CSP hashes. All pass locally.
The compiled inline script parses. A static check also confirms unique HTML IDs,
existing application targets and exactly 100 ordered evidence rows in
REFINEMENTS-100.md.

The original artwork generator is deterministic and can be run with Python;
the normal app build uses its checked-in SVG. No external image, recorded audio,
model call or backend service is used. New audio is synthetic ambience with a
limiter, smooth gain changes, independent layers and explicit timer/visibility
cleanup. Audible realism and device-specific audio quality remain untested here.

The parent task owns refreshed Cloudflare Browser Rendering screenshots and any
remote deployment. Existing screenshot files were not overwritten by this
refinement. Native dialogs, import/download/clipboard interactions, manual
screen-reader testing and every external biography URL still need human or
browser validation beyond the source/unit checks documented here.
