# LCM Nav3D Documentation

Documentation site for **LCM Nav3D** — true volumetric 3D navigation for Unreal Engine.

Live at **https://lcmnav3d.github.io/**

## Layout

| Path | What it is |
|---|---|
| `index.html` | Documentation overview and table of contents |
| `*.html` | One page per chapter (25 pages) |
| `404.html` | Not-found page, served by GitHub Pages for any missing path |
| `style.css` | The whole stylesheet, light and dark |
| `search.js` | Sidebar search and mobile navigation |
| `search-index.json` | Full-text search index, generated |
| `sitemap.xml`, `robots.txt`, `feed.xml` | Crawler files, generated |
| `og.jpg` | Social share image (1200x675) |
| `pdf/` | Manual and quick start as PDFs |
| `images/` | Screenshots |
| `tools/` | Build scripts — not part of the published site |

## Regenerating metadata

Page titles, meta descriptions, canonical URLs, Open Graph and Twitter tags,
JSON-LD structured data, breadcrumbs, image dimensions, the sitemap, the Atom
feed and the search index are all **generated**. Do not hand-edit them — edit the
source and re-run the build:

```bash
node tools/build.js .     # rewrite metadata across all pages
node tools/verify.js .    # check links, anchors, structured data, SEO rules
node tools/lint.js .      # check content for conversion residue and broken tables
```

`tools/build.js` is idempotent: running it twice in a row reports `0` changes the
second time. `verify.js` and `lint.js` both exit non-zero on a problem, so they can
gate a commit. Run all three before every push.

`lint.js` exists because the Markdown-to-HTML conversion silently dropped several
tables — any table cell containing a literal `|` (Unreal's `Category | Node`
naming) broke the Markdown parser and the table came through as a paragraph of raw
pipes. The lint catches that, plus unconverted `**bold**`, `](links)`, empty table
columns, mismatched column counts, unbalanced tags and mojibake.

To change a page's title or description, edit `tools/seo-pages.js` and re-run the
build. To change the site URL, the author, or the Search Console token, edit the
constants at the top of `tools/build.js`.

## Editing content

Page bodies are plain HTML between `<main id="content">` and `<div class="pager">`.
Edit those directly, then re-run `tools/build.js` so the search index picks up the
new text.

Adding a page means: create the HTML, add an entry to `tools/seo-pages.js`, add it
to the sidebar in every page, and wire the pager links either side of it.

## Deployment

GitHub Pages serves the repository root of the default branch. See
[`SEO.md`](SEO.md) for the post-deploy Search Console steps.
