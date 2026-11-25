# Poetry collection

The selected shelf has 401 complete poems by 139 poets. It includes 240 English, 58 Italian, 57 French and 46 Polish originals. The 55 external readings include contemporary poetry, published excerpts and the Concordia Discors selection. An additional 2,401 English works sit in the on-demand historical archive.

Every selected poem carries the source URL, original language, edition, reuse basis and a dated text check. Blank lines mark stanza breaks. Each English translation belongs to its original poem. The checked-in JSON powers both the standalone reader and the personal site.

## Editions

The [edition manifest](editions-20261124.json) identifies 227 additions in 17 historic editions. Each individual record has the exact source page or volume anchor, a SHA-256 of the complete displayed verse and the hash of the checked source. The selections include abolitionist poetry by Frances Ellen Watkins Harper and Sarah Louisa Forten Purvis, Ameen Rihani, Baudelaire, Desbordes-Valmore, Leopardi, Pascoli, Norwid and Słowacki. Themes describe the individual selection.

* **Standard Ebooks** supplies identified English originals. Its editors dedicate their work to the public domain in the United States and internationally using CC0. Line breaks, indents and stanza breaks follow each article. [Public-domain dedication](https://standardebooks.org/public-domain)
* **Wikisource** supplies French and Italian originals from scanned historical editions. Each work links to its contributors through the source page and page history. The display removes page furniture and marginal line numbers. For Desbordes-Valmore, it begins with the numbered poem after the separately attributed epigraphs. The underlying originals are public domain. Credit applies to these transcriptions under the linked licence. [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/)
* **Wolne Lektury** identifies the original author, rights and print source in each Polish edition’s XML metadata. The poems retain stanza divisions, credited epigraphs and numbered sections. The reader omits modern footnotes and thematic annotations. The XML citation sits beside the displayed-text check. [Wolne Lektury rights](https://wolnelektury.pl/info/prawa/)
* **PoetryDB** provides earlier selected texts and the larger English archive. Credit applies to the data; each historic original retains its own public-domain basis. [PoetryDB](https://poetrydb.org/) · [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)
* **Academy of American Poets** is the edition for the migrated selections *Ozymandias* and *A Noiseless Patient Spider*. Each retains its original audit and site bookmark. The earlier Ozymandias archive identifier is an alias for the selected edition. [Ozymandias](https://poets.org/poem/ozymandias) · [A Noiseless Patient Spider](https://poets.org/poem/noiseless-patient-spider)

The 30 AI-generated English translations include a visible method and credit. Frederick Townsend’s 1887 translation of Leopardi’s *L’infinito* retains his attribution and its publication details. All 15 lines were checked against two transcriptions of the volume. [Wikisource](https://en.wikisource.org/wiki/Poems_of_Giacomo_Leopardi/Poem_12) · [Project Gutenberg](https://www.gutenberg.org/ebooks/19315)

The [November 12 source audit](source-audit-20261112.json) records text-level checks for the earlier selections. The [collection receipt](provenance.json) records the current counts, checksums and later additions. The November 25 link check opened all 55 reference records, including all 43 Concordia Discors section anchors. Modern favourites such as Krynicki, Montale and Sbarbaro link to the publisher or literary source. Some external readings are excerpts, as indicated by their labels.

## Reproduce the edition check

The standard build uses local JSON. For an editorial recheck of the 227 additions, install Python 3.9 or later with lxml, then run from the repository root.

```sh
python3 -m pip install lxml
python3 scripts/import-historic-editions.py --cache /tmp/poetry-editions --fetch
python3 scripts/import-historic-editions.py --cache /tmp/poetry-editions
node --test tests/editions.test.mjs
```

The first command that runs the importer fetches each missing source into the chosen cache. The second replays it offline. A changed poem title, line sequence or source layout stops the import for editorial review. The checked-in manifest preserves the original source-page digest across changes to unrelated page furniture. Data tests match every displayed hash and check new works against all previous selections and the historical archive.

The archive has its own source URLs, byte bounds and hashes in its [manifest](archive/manifest.json). Use `scripts/import-archive.py` with the PoetryDB response snapshots named there to reproduce the shelves. The standalone app’s fonts, paintings, reader and original forest illustration carry separate credits.
