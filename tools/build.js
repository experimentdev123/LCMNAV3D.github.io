/*  LCM Nav3D docs — SEO + correctness pass.
 *  Idempotent: regenerates the <head> block and normalises breadcrumbs/images/nav.
 *  Run (from the site root):  node tools/build.js .
 */
const fs = require('fs'), path = require('path');
const { PAGES, SECTIONS } = require(path.join(__dirname, 'seo-pages.js'));

const ROOT = process.argv[2];
const SITE = 'https://lcmnav3d.github.io';
const OG_IMG = `${SITE}/og.jpg`;
const OG_W = 1200, OG_H = 675;
const BUILD_DATE = '2026-08-16';
const AUTHOR = 'L. Charitha Madhushanka';
const PUBLISHER = 'UEDEV Labs';
const PUBLISHER_URL = 'https://uedevlabs.github.io/';
const FAB = 'https://www.fab.com/listings/92f05e42-d7be-4de3-abe8-7b0a3e70ba73';
const DISCORD = 'https://discord.gg/nXkpD6uaBG';
const YOUTUBE = 'https://www.youtube.com/watch?v=7_F3AvgQIQU';

// Paste the token from Search Console → Add property → HTML tag (the content="..."
// value only) and re-run the build. Emitted on every page so verification survives
// whichever URL Google fetches. Leave empty to omit the tag entirely.
const GSC_VERIFICATION = '';

const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const canonicalOf = f => f === 'index.html' ? `${SITE}/` : `${SITE}/${f}`;

// The working tree is CRLF throughout. Normalise to LF so the transforms below can
// match on \n, then restore CRLF on write so we don't churn every line in the diff.
const readLF = p => fs.readFileSync(p, 'utf8').replace(/\r\n/g, '\n');
const writeCRLF = (p, s) => fs.writeFileSync(p, s.replace(/\r\n/g, '\n').replace(/\n/g, '\r\n'));

// Natural pixel dimensions, read from the PNG headers, so we can emit width/height
// attributes and stop the images shifting the layout as they load.
const IMG_DIMS = {};
for (const dir of ['.', 'images']) {
  const d = path.join(ROOT, dir);
  for (const f of fs.readdirSync(d)) {
    if (!f.endsWith('.png')) continue;
    const b = fs.readFileSync(path.join(d, f));
    if (b.slice(12, 16).toString() !== 'IHDR') continue;
    IMG_DIMS[dir === '.' ? f : `${dir}/${f}`] = { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
  }
}

// ── JSON-LD ────────────────────────────────────────────────────────────────────
const ORG = {
  '@type': 'Organization',
  '@id': `${SITE}/#organization`,
  name: PUBLISHER,
  url: PUBLISHER_URL,
  logo: { '@type': 'ImageObject', url: `${SITE}/logo.png`, width: 49, height: 60 },
  sameAs: [PUBLISHER_URL, 'https://www.fab.com/sellers/UEDEV', DISCORD],
};
const WEBSITE = {
  '@type': 'WebSite',
  '@id': `${SITE}/#website`,
  url: `${SITE}/`,
  name: 'LCM Nav3D Documentation',
  description: PAGES['index.html'].desc,
  inLanguage: 'en',
  publisher: { '@id': `${SITE}/#organization` },
};
const SOFTWARE = {
  '@type': 'SoftwareApplication',
  '@id': `${SITE}/#software`,
  name: 'LCM Nav3D',
  alternateName: 'LCM Nav3D — True Volumetric 3D Navigation for Unreal Engine',
  applicationCategory: 'DeveloperApplication',
  applicationSubCategory: 'Game Engine Plugin',
  operatingSystem: 'Windows 64-bit, Linux',
  softwareRequirements: 'Unreal Engine 5.2 to 5.8',
  url: `${SITE}/`,
  downloadUrl: FAB,
  image: OG_IMG,
  description:
    'A sparse voxel octree navigation plugin for Unreal Engine that pathfinds through true 3D volume '
    + 'rather than a walkable surface, for flying, swimming and free-floating agents and Mass Entity crowds.',
  author: { '@type': 'Person', name: AUTHOR },
  publisher: { '@id': `${SITE}/#organization` },
  featureList: [
    'Sparse voxel octree 3D pathfinding',
    'Flying, swimming and free-floating agent locomotion',
    'Mass Entity crowds at 10,000+ agents',
    'True volumetric EQS generators and tests',
    'Dynamic runtime obstacles',
    'Hybrid Recast and Nav3D navigation in one level',
    'Behavior Tree and StateTree tasks',
    'Gameplay Debugger integration',
  ],
};

function breadcrumbLd(file, meta) {
  const items = [{ '@type': 'ListItem', position: 1, name: 'Documentation', item: `${SITE}/` }];
  if (meta.section) {
    const s = SECTIONS[meta.section];
    items.push({ '@type': 'ListItem', position: 2, name: s.name, item: `${SITE}/${s.href}` });
    items.push({ '@type': 'ListItem', position: 3, name: meta.crumb, item: canonicalOf(file) });
  }
  return { '@type': 'BreadcrumbList', '@id': `${canonicalOf(file)}#breadcrumb`, itemListElement: items };
}

function jsonLd(file, meta, h1) {
  const url = canonicalOf(file);
  // SOFTWARE is emitted on every page, not just the home page: each page's graph has
  // to resolve on its own, and repeating the entity reinforces it site-wide.
  const graph = [ORG, WEBSITE, SOFTWARE];
  if (file === 'index.html') {
    graph.push({
      '@type': 'WebPage', '@id': `${url}#webpage`, url, name: meta.title,
      description: meta.desc, isPartOf: { '@id': `${SITE}/#website` },
      about: { '@id': `${SITE}/#software` }, inLanguage: 'en',
      primaryImageOfPage: { '@type': 'ImageObject', url: OG_IMG, width: OG_W, height: OG_H },
      datePublished: BUILD_DATE, dateModified: BUILD_DATE,
    });
  } else {
    graph.push(breadcrumbLd(file, meta), {
      '@type': 'TechArticle', '@id': `${url}#article`,
      headline: h1 || meta.crumb, name: meta.title, description: meta.desc, url,
      inLanguage: 'en',
      isPartOf: { '@id': `${SITE}/#website` },
      about: { '@id': `${SITE}/#software` },
      breadcrumb: { '@id': `${url}#breadcrumb` },
      mainEntityOfPage: { '@type': 'WebPage', '@id': url },
      image: { '@type': 'ImageObject', url: OG_IMG, width: OG_W, height: OG_H },
      author: { '@type': 'Person', name: AUTHOR },
      publisher: { '@id': `${SITE}/#organization` },
      datePublished: BUILD_DATE, dateModified: BUILD_DATE,
      proficiencyLevel: 'Beginner',
      dependencies: 'Unreal Engine 5.2 to 5.8',
    });
    // Google restricted FAQ rich results to authoritative sites in 2023, so this
    // earns no snippet there — it is still read by Bing and by AI answer engines.
    if (meta.faq) graph.push({
      '@type': 'FAQPage', '@id': `${url}#faq`,
      mainEntity: meta.faq.map(([q, a]) => ({
        '@type': 'Question', name: q,
        acceptedAnswer: { '@type': 'Answer', text: a },
      })),
    });
  }
  return JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }, null, 1);
}

// ── <head> ─────────────────────────────────────────────────────────────────────
function head(file, meta, h1) {
  const url = canonicalOf(file);
  const isHome = file === 'index.html';
  return `<title>${esc(meta.title)}</title>
<meta name="description" content="${esc(meta.desc)}">
<link rel="canonical" href="${url}">
<meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1">
<meta name="author" content="${esc(AUTHOR)}">
<meta name="generator" content="LCM Nav3D docs">${GSC_VERIFICATION
  ? `\n<meta name="google-site-verification" content="${esc(GSC_VERIFICATION)}">`
  : `\n<!-- Search Console: set GSC_VERIFICATION in build.js to emit the verification tag here. -->`}
<meta name="theme-color" content="#ffffff" media="(prefers-color-scheme:light)">
<meta name="theme-color" content="#0f1211" media="(prefers-color-scheme:dark)">
<meta name="color-scheme" content="light dark">
<meta property="og:type" content="${isHome ? 'website' : 'article'}">
<meta property="og:site_name" content="LCM Nav3D Documentation">
<meta property="og:locale" content="en_GB">
<meta property="og:url" content="${url}">
<meta property="og:title" content="${esc(meta.title)}">
<meta property="og:description" content="${esc(meta.desc)}">
<meta property="og:image" content="${OG_IMG}">
<meta property="og:image:type" content="image/jpeg">
<meta property="og:image:width" content="${OG_W}">
<meta property="og:image:height" content="${OG_H}">
<meta property="og:image:alt" content="LCM Nav3D - True Volumetric 3D Navigation for Unreal Engine">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(meta.title)}">
<meta name="twitter:description" content="${esc(meta.desc)}">
<meta name="twitter:image" content="${OG_IMG}">
<meta name="twitter:image:alt" content="LCM Nav3D - True Volumetric 3D Navigation for Unreal Engine">
<link rel="icon" href="favicon.png" type="image/png">
<link rel="apple-touch-icon" href="favicon.png">
<link rel="alternate" type="application/atom+xml" title="LCM Nav3D Documentation" href="${SITE}/feed.xml">
<link rel="sitemap" type="application/xml" href="${SITE}/sitemap.xml">
<link rel="stylesheet" href="style.css">
<script type="application/ld+json">
${jsonLd(file, meta, h1)}
</script>
</head>`;
}

// ── transforms ─────────────────────────────────────────────────────────────────
function breadcrumb(file, meta) {
  if (file === 'index.html') return '';
  const s = SECTIONS[meta.section];
  return `  <nav class="crumbs" aria-label="Breadcrumb">`
    + `<a href="index.html">Documentation</a>`
    + `<span class="sep" aria-hidden="true">/</span>`
    + `<a href="${s.href}">${esc(s.name)}</a>`
    + `<span class="sep" aria-hidden="true">/</span>`
    + `<span aria-current="page">${esc(meta.crumb)}</span></nav>`;
}

/** Adds width/height/loading/decoding to <img> tags that lack them. First content
 *  image on a page stays eager so it is not deferred out of the LCP path. */
function fixImages(html) {
  let contentImageSeen = 0;
  return html.replace(/<img\b[^>]*>/g, tag => {
    const src = (tag.match(/\ssrc="([^"]+)"/) || [])[1];
    if (!src || /^https?:/.test(src)) return tag;
    const isChrome = src === 'logo.png';           // header logo, not content
    const dims = IMG_DIMS[src];
    // Strip the hints we own before re-adding them, so repeat runs replace rather
    // than append. (The first content image takes fetchpriority instead of
    // loading, so keying idempotency off `loading=` alone silently stacks them.)
    let out = tag.replace(/\s*\/?>$/, '')
      .replace(/\s(?:loading|decoding|fetchpriority)="[^"]*"/g, '');

    if (dims && !/\sheight=/.test(out)) {
      const declaredW = (out.match(/\swidth="(\d+)"/) || [])[1];
      if (declaredW) {
        out += ` height="${Math.round(Number(declaredW) * dims.h / dims.w)}"`;
      } else {
        out += ` width="${dims.w}" height="${dims.h}"`;
      }
    }
    if (!isChrome) {
      contentImageSeen++;
      out += contentImageSeen === 1
        ? ' decoding="async" fetchpriority="high"'   // in the LCP path, keep it eager
        : ' loading="lazy" decoding="async"';
    }
    return out + '>';
  });
}

const INDEX_ALT = {
  'images/setup-wizard.png': 'Setup Wizard panel',
  'images/health-check.png': 'Health Check panel',
  'images/tuner-3-measured-results.png': 'Auto-Tuner measured results',
  'images/manager-details-top.png': 'Navigation manager Details panel',
  'images/behavior-tree-example.png': 'A Behavior Tree driving a flying agent',
  'images/statetree-example.png': 'A StateTree driving a flying agent',
  'images/mass-entity-config.png': 'A Mass Entity Config asset with Nav3D traits',
  'images/eqs-example.png': 'A true-3D tactical EQS query',
};

// ── main ───────────────────────────────────────────────────────────────────────
let changed = 0;
for (const [file, meta] of Object.entries(PAGES)) {
  const p = path.join(ROOT, file);
  let html = readLF(p);
  const before = html;

  const h1 = ((html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/) || [])[1] || '')
    .replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();

  // 1. head
  html = html.replace(/<title>[\s\S]*?<\/head>/, () => head(file, meta, h1));

  // 2. skip link + landmark roles
  html = html.replace(/<\/head><body>\s*\n<header class="top">/,
    '</head><body>\n<a class="skip" href="#content">Skip to content</a>\n<header class="top">');
  html = html.replace(/<button id="burger" aria-label="Menu">/,
    '<button id="burger" type="button" aria-label="Toggle navigation" aria-expanded="false" aria-controls="sidenav">');
  html = html.replace(/<nav class="side">/, '<nav class="side" id="sidenav" aria-label="Documentation">');
  html = html.replace(/<main>/, '<main id="content">');

  // 3. active sidebar entry gets aria-current
  html = html.replace(/(<a href="[^"]+" data-slug="[^"]+")( class="on")(?: aria-current="page")?>/,
    '$1$2 aria-current="page">');

  // 4. breadcrumb — the generator left a dangling "Documentation / " with no page name
  html = html.replace(
    /[ \t]*<p style="color:var\(--muted\);font-size:13\.5px;margin:0 0 6px">[\s\S]*?<\/p>\n|[ \t]*<nav class="crumbs"[\s\S]*?<\/nav>\n/,
    () => { const c = breadcrumb(file, meta); return c ? c + '\n' : ''; });

  // 5. images
  if (file === 'index.html') {
    for (const [src, alt] of Object.entries(INDEX_ALT))
      html = html.replace(new RegExp(`<img src="${src.replace(/[.\/]/g, m => '\\' + m)}"(?![^>]*\\salt=)`),
        `<img src="${src}" alt="${alt}"`);
  }
  html = fixImages(html);

  // 6. search results need a live region for screen readers
  html = html.replace(/<div id="results"><\/div>/,
    '<div id="results" role="listbox" aria-label="Search results"></div>\n  <p id="q-status" class="visually-hidden" role="status" aria-live="polite"></p>');

  // 7. give every table a scroll container. Unwrap first so repeat runs replace
  //    rather than nest. tabindex+role let keyboard users scroll a wide table.
  html = html.replace(/<div class="table-wrap"[^>]*>\s*(<table>[\s\S]*?<\/table>)\s*<\/div>/g, '$1');
  html = html.replace(/<table>[\s\S]*?<\/table>/g,
    t => `<div class="table-wrap" tabindex="0" role="region" aria-label="Table">\n${t}\n</div>`);

  if (html !== before) { writeCRLF(p, html); changed++; }
}
console.log(`rewrote ${changed} / ${Object.keys(PAGES).length} pages`);

// ── sitemap ────────────────────────────────────────────────────────────────────
const PRIORITY = f => f === 'index.html' ? '1.0'
  : /^(installation|core-concepts|your-first-flying-agent)\.html$/.test(f) ? '0.9'
  : /^bt-/.test(f) ? '0.6' : '0.8';
writeCRLF(path.join(ROOT, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${Object.keys(PAGES).map(f =>
    `  <url>\n    <loc>${canonicalOf(f)}</loc>\n    <lastmod>${BUILD_DATE}</lastmod>\n`
    + `    <changefreq>monthly</changefreq>\n    <priority>${PRIORITY(f)}</priority>\n  </url>`).join('\n')}
</urlset>\n`);

// ── robots.txt ─────────────────────────────────────────────────────────────────
writeCRLF(path.join(ROOT, 'robots.txt'),
  `# https://lcmnav3d.github.io/
User-agent: *
Allow: /

Sitemap: ${SITE}/sitemap.xml\n`);

// ── Atom feed ──────────────────────────────────────────────────────────────────
writeCRLF(path.join(ROOT, 'feed.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>LCM Nav3D Documentation</title>
  <subtitle>${esc(PAGES['index.html'].desc)}</subtitle>
  <link href="${SITE}/feed.xml" rel="self"/>
  <link href="${SITE}/"/>
  <id>${SITE}/</id>
  <updated>${BUILD_DATE}T00:00:00Z</updated>
  <author><name>${esc(AUTHOR)}</name></author>
  <rights>Copyright (c) 2026 ${esc(AUTHOR)}. All rights reserved.</rights>
${Object.entries(PAGES).map(([f, m]) => `  <entry>
    <title>${esc(m.title)}</title>
    <link href="${canonicalOf(f)}"/>
    <id>${canonicalOf(f)}</id>
    <updated>${BUILD_DATE}T00:00:00Z</updated>
    <summary>${esc(m.desc)}</summary>
  </entry>`).join('\n')}
</feed>\n`);

// ── search index (rebuilt from the corrected HTML) ──────────────────────────────
const idx = Object.entries(PAGES).map(([f, m]) => {
  const html = readLF(path.join(ROOT, f));
  const main = (html.split('<main id="content">')[1] || '').split('<div class="pager">')[0];
  const body = main
    .replace(/<(script|style)[\s\S]*?<\/\1>/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ')
    .replace(/&[a-z]+;/g, ' ')
    .replace(/\s+/g, ' ').trim();
  return { t: m.crumb || 'Overview', u: f, d: m.desc, b: body.slice(0, 6000) };
});
fs.writeFileSync(path.join(ROOT, 'search-index.json'), JSON.stringify(idx));
console.log(`search index: ${idx.length} entries, ${(fs.statSync(path.join(ROOT, 'search-index.json')).size / 1024).toFixed(0)} KB`);
