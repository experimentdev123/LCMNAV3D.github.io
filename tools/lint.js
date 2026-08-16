/*  Content-quality lint for the LCM Nav3D docs.
 *  Catches Markdown-to-HTML conversion residue and structural defects that
 *  tools/verify.js (which checks metadata and links) does not look at.
 *
 *  Run (from the site root):  node tools/lint.js .
 */
const fs = require('fs'), path = require('path');
const ROOT = process.argv[2] || '.';
// Search-engine ownership tokens are bare files with no content to lint.
const NON_PAGE = /^(google[0-9a-f]+|BingSiteAuth|yandex_[0-9a-f]+|pinterest-[0-9a-z]+)\.html$/i;
const files = fs.readdirSync(ROOT).filter(f => f.endsWith('.html') && !NON_PAGE.test(f));
const hits = {};
const add = (k, m) => (hits[k] ||= []).push(m);

// Text of one block element, tags stripped. Checks run per block so that adjacent
// cells ("<td>Goal</td><td>Goal Mode</td>") never look like duplicated words.
const BLOCK = /<(p|li|td|th|h[1-6]|blockquote|figcaption)\b[^>]*>([\s\S]*?)<\/\1>/g;
const strip = s => s.replace(/<[^>]+>/g, ' ')
  .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&[a-z]+;/g, ' ')
  .replace(/\s+/g, ' ').trim();

for (const f of files) {
  const raw = fs.readFileSync(path.join(ROOT, f), 'utf8').replace(/\r\n/g, '\n');
  const main = (raw.split(/<main[^>]*>/)[1] || '').split('</main>')[0];
  // drop the breadcrumb: its last crumb repeats the <h1> by design
  const body = main.replace(/<nav class="crumbs"[\s\S]*?<\/nav>/, '').split('<div class="pager">')[0];

  // ── conversion residue ──
  if (/---\|/.test(body)) add('unconverted markdown table', f);
  if (/\*\*/.test(body)) add('literal ** bold', `${f}: ${(body.match(/.{0,50}\*\*.{0,50}/) || [])[0]}`);
  if (/\]\(/.test(body)) add('literal ]( link', `${f}: ${(body.match(/.{0,60}\]\(.{0,40}/) || [])[0]}`);
  if (/^[ \t]*#{1,6}[ \t]+\S/m.test(strip(body))) add('literal # heading', f);

  // a <p> holding what is really a table row
  for (const m of body.matchAll(/<p>[\s\S]*?<\/p>/g)) {
    const txt = strip(m[0]);
    const pipes = (txt.match(/\|/g) || []).length;
    if (pipes >= 4) add('paragraph with >=4 pipes (probable broken table)',
      `${f}: ${pipes} pipes: ${txt.slice(0, 80)}`);
  }

  // ── encoding damage ──
  for (const bad of ['â€™', 'â€œ', 'Ã©', 'ï»¿', '�'])
    if (raw.includes(bad)) add('mojibake', `${f}: ${JSON.stringify(bad)}`);

  // ── tables ──
  for (const t of body.matchAll(/<table>[\s\S]*?<\/table>/g)) {
    const tbl = t[0];
    const heads = [...tbl.matchAll(/<th\b[^>]*>([\s\S]*?)<\/th>/g)];
    const rows = [...tbl.matchAll(/<tr>([\s\S]*?)<\/tr>/g)].filter(r => r[1].includes('<td'));
    if (!rows.length) { add('table with no data rows', f); continue; }
    for (const r of rows) {
      const cells = (r[1].match(/<td\b/g) || []).length;
      if (heads.length && cells !== heads.length)
        add('table column mismatch', `${f}: ${heads.length} headers vs ${cells} cells`);
    }
    // A column that is empty in every row is dead weight — but only report it when
    // it carries a header, or trails the table. An unlabelled interior column is a
    // deliberate gutter between two side-by-side pairs (see settings.html).
    heads.forEach((h, i) => {
      const allEmpty = rows.every(r => {
        const cells = [...r[1].matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/g)];
        return cells[i] && strip(cells[i][1]) === '' && !/<(img|svg|video|picture)\b/.test(cells[i][1]);
      });
      const labelled = strip(h[1]) !== '', trailing = i === heads.length - 1;
      if (allEmpty && (labelled || trailing))
        add('table column empty in every row', `${f}: "${strip(h[1]) || '(blank header)'}"`);
    });
    if (!/<div class="table-wrap"/.test(body.slice(Math.max(0, t.index - 90), t.index)))
      add('table without a .table-wrap scroll container', f);
  }

  // ── empty elements ──
  for (const m of body.matchAll(/<(h[1-6]|p|li|a)\b([^>]*)>\s*<\/\1>/g))
    add('empty element', `${f}: <${m[1]}>`);

  // ── tag balance ──
  const stack = [], VOID = new Set(['img', 'br', 'hr', 'input', 'source', 'col', 'meta', 'link']);
  for (const m of body.matchAll(/<(\/?)([a-z0-9]+)([^>]*)>/gi)) {
    const [, close, tag, attrs] = m, t = tag.toLowerCase();
    if (VOID.has(t) || attrs.trim().endsWith('/')) continue;
    if (!close) stack.push(t);
    else if (stack.pop() !== t) { add('mismatched tag', `${f}: stray </${t}>`); stack.length = 0; break; }
  }
  if (stack.length) add('unclosed tag', `${f}: ${stack.slice(0, 4).join(', ')}`);

  // ── per-block prose checks ──
  for (const m of body.matchAll(BLOCK)) {
    if (/<(pre|code)\b/.test(m[2])) continue;          // identifiers repeat legitimately
    const txt = strip(m[2]);
    for (const d of txt.matchAll(/\b(\w{3,})\s+\1\b/gi))
      if (!/^(that|had|very|finishes)$/i.test(d[1])) add('doubled word', `${f}: "${d[0]}"`);
  }

  // ── source-era leftovers ──
  for (const re of [/in this folder/i, /TODO|FIXME|XXX|Lorem ipsum|PLACEHOLDER/])
    if (re.test(strip(body))) add('source-era leftover', `${f}: ${(strip(body).match(re) || [])[0]}`);
  for (const m of body.matchAll(/href="([^"]*\.md)"/g)) add('.md link', `${f} -> ${m[1]}`);
}

const keys = Object.keys(hits).sort();
if (!keys.length) { console.log('lint: clean - no content defects found'); process.exit(0); }
for (const k of keys) {
  console.log(`\n## ${k}  (${hits[k].length})`);
  hits[k].slice(0, 12).forEach(x => console.log('   ' + x));
  if (hits[k].length > 12) console.log(`   ... and ${hits[k].length - 12} more`);
}
console.log(`\nlint: ${keys.reduce((a, k) => a + hits[k].length, 0)} issues`);
process.exit(1);
