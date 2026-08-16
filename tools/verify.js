const fs = require('fs'), path = require('path');
const ROOT = process.argv[2];
const SITE = 'https://lcmnav3d.github.io';
const files = fs.readdirSync(ROOT).filter(f => f.endsWith('.html'));
const html = Object.fromEntries(files.map(f => [f, fs.readFileSync(path.join(ROOT, f), 'utf8')]));
const ids = Object.fromEntries(files.map(f => [f, new Set([...html[f].matchAll(/\sid="([^"]+)"/g)].map(m => m[1]))]));
const exists = p => fs.existsSync(path.join(ROOT, decodeURIComponent(p.split('#')[0].split('?')[0])));
let fail = 0, warn = 0;
const bad = m => { console.log('  FAIL ' + m); fail++; };
const wrn = m => { console.log('  WARN ' + m); warn++; };

console.log('--- links & anchors ---');
for (const f of files) {
  for (const m of html[f].matchAll(/href="([^"]+)"/g)) {
    const h = m[1];
    if (/^(https?:|mailto:)/.test(h)) continue;
    if (h.startsWith('#')) { if (!ids[f].has(h.slice(1))) bad(`${f} -> ${h}`); continue; }
    const rel = h.startsWith('/') ? h.slice(1) : h;                 // 404.html uses root-absolute
    const [file, hash] = rel.split('#');
    if (file && !exists(file)) { bad(`${f} -> ${h} (missing file)`); continue; }
    if (hash && file.endsWith('.html') && ids[file] && !ids[file].has(hash)) bad(`${f} -> ${h} (missing anchor)`);
  }
  for (const m of html[f].matchAll(/<img[^>]*\ssrc="([^"]+)"/g))
    if (!/^https?:/.test(m[1]) && !exists(m[1].replace(/^\//, ''))) bad(`${f} img -> ${m[1]}`);
}

console.log('--- head / SEO ---');
const seenT = {}, seenD = {}, seenC = {};
for (const f of files) {
  const h = html[f];
  const g = (re) => (h.match(re) || [])[1];
  const title = g(/<title>([\s\S]*?)<\/title>/);
  const desc = g(/<meta name="description" content="([^"]*)"/);
  const canon = g(/<link rel="canonical" href="([^"]+)"/);
  const ogUrl = g(/<meta property="og:url" content="([^"]+)"/);
  if (f === '404.html') {
    if (!/noindex/.test(h)) bad('404.html should be noindex');
    continue;
  }
  if (!title) bad(`${f}: no title`);
  if (!desc) bad(`${f}: no description`);
  if (!canon) bad(`${f}: no canonical`);
  if (canon && !canon.startsWith(SITE)) bad(`${f}: canonical not on ${SITE}: ${canon}`);
  if (canon !== ogUrl) bad(`${f}: canonical != og:url (${canon} vs ${ogUrl})`);
  // Measure the decoded text: search engines see """, not "&quot;".
  const dec = s => s.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<')
                    .replace(/&gt;/g, '>').replace(/&amp;/g, '&');
  if (dec(title).length > 62) wrn(`${f}: title ${dec(title).length} chars (>62 may truncate)`);
  if (dec(desc).length < 120 || dec(desc).length > 165) wrn(`${f}: description ${dec(desc).length} chars`);
  if (/\.\.\.$|…$/.test(desc)) bad(`${f}: description is truncated`);
  if (/`/.test(title)) bad(`${f}: backtick in title`);
  if (/&(?!amp;|lt;|gt;|quot;|#)/.test(title)) bad(`${f}: unescaped & in title`);
  (seenT[title] ||= []).push(f); (seenD[desc] ||= []).push(f); (seenC[canon] ||= []).push(f);
  for (const tag of ['og:title', 'og:description', 'og:image', 'og:type', 'og:site_name',
                     'twitter:card', 'twitter:title', 'twitter:image'])
    if (!h.includes(`"${tag}"`)) bad(`${f}: missing ${tag}`);
  if ((h.match(/<h1[\s>]/g) || []).length !== 1) bad(`${f}: h1 count != 1`);
  if (!/rel="canonical"/.test(h)) bad(`${f}: no canonical`);
  if (!/max-image-preview:large/.test(h)) wrn(`${f}: no max-image-preview`);
}
for (const [k, v] of Object.entries(seenT)) if (v.length > 1) bad(`duplicate title across ${v.join(', ')}`);
for (const [k, v] of Object.entries(seenD)) if (v.length > 1) bad(`duplicate description across ${v.join(', ')}`);
for (const [k, v] of Object.entries(seenC)) if (v.length > 1) bad(`duplicate canonical across ${v.join(', ')}`);

console.log('--- JSON-LD ---');
const types = {};
for (const f of files) {
  for (const m of html[f].matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    let data;
    try { data = JSON.parse(m[1]); } catch (e) { bad(`${f}: JSON-LD parse error: ${e.message}`); continue; }
    const graph = data['@graph'] || [data];
    for (const node of graph) {
      types[node['@type']] = (types[node['@type']] || 0) + 1;
      if (!node['@type']) bad(`${f}: JSON-LD node without @type`);
    }
    // every internal @id reference must resolve to a node defined somewhere
    const defined = new Set(graph.map(n => n['@id']).filter(Boolean));
    JSON.stringify(graph).match(/"@id":"[^"]+"/g).forEach(() => {});
    (function walk(o) {
      if (Array.isArray(o)) return o.forEach(walk);
      if (o && typeof o === 'object') {
        const keys = Object.keys(o);
        if (keys.length === 1 && keys[0] === '@id' && !defined.has(o['@id']))
          bad(`${f}: JSON-LD dangling reference ${o['@id']}`);
        Object.values(o).forEach(walk);
      }
    })(graph);
  }
}
console.log('  node types: ' + Object.entries(types).map(([k, v]) => `${k}x${v}`).join(', '));

console.log('--- images ---');
for (const f of files)
  for (const m of html[f].matchAll(/<img\b[^>]*>/g)) {
    const t = m[0], src = (t.match(/src="([^"]+)"/) || [])[1];
    if (!/\salt=/.test(t)) bad(`${f}: img without alt: ${src}`);
    if (src === 'logo.png' || src === '/logo.png') continue;
    if (!/\swidth=/.test(t) || !/\sheight=/.test(t)) wrn(`${f}: img without dimensions: ${src}`);
  }

console.log('--- sitemap / robots / feed ---');
const sm = fs.readFileSync(path.join(ROOT, 'sitemap.xml'), 'utf8');
const locs = [...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
const canons = files.filter(f => f !== '404.html')
  .map(f => (html[f].match(/<link rel="canonical" href="([^"]+)"/) || [])[1]);
for (const c of canons) if (!locs.includes(c)) bad(`canonical not in sitemap: ${c}`);
for (const l of locs) if (!canons.includes(l)) bad(`sitemap URL has no page: ${l}`);
if (locs.includes(`${SITE}/404.html`)) bad('404 must not be in the sitemap');
const rb = fs.readFileSync(path.join(ROOT, 'robots.txt'), 'utf8');
if (!rb.includes(`${SITE}/sitemap.xml`)) bad('robots.txt sitemap line wrong');
if (/uedevlabs/.test(rb + sm)) bad('stale uedevlabs URL in robots/sitemap');
console.log(`  sitemap: ${locs.length} urls`);

console.log('--- stale URLs ---');
for (const f of [...files, 'sitemap.xml', 'robots.txt', 'feed.xml', 'search-index.json'])
  if (/uedevlabs\.github\.io\/lcm-nav3d/.test(fs.readFileSync(path.join(ROOT, f), 'utf8')))
    bad(`${f}: still references the dead uedevlabs.github.io/lcm-nav3d URL`);

console.log(`\n${fail ? 'FAILURES: ' + fail : 'no failures'}  |  warnings: ${warn}`);
