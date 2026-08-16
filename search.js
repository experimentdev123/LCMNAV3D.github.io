(function () {
  'use strict';

  // ── mobile navigation ───────────────────────────────────────────────────────
  var burger = document.getElementById('burger');
  var side = document.querySelector('nav.side');
  if (burger && side) {
    burger.addEventListener('click', function () {
      var open = side.classList.toggle('open');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  // ── search ──────────────────────────────────────────────────────────────────
  var box = document.getElementById('q');
  var out = document.getElementById('results');
  var status = document.getElementById('q-status');
  if (!box || !out) return;

  var index = null;      // loaded lazily — the index is ~40 KB gzipped and most
  var pending = null;    // visitors never open the search box at all.
  var sel = -1;

  // Returns the in-flight request when one is already running. Handing back a
  // fresh resolved promise instead would let `load().then(render)` re-enter
  // render immediately, spinning the microtask queue until the fetch landed.
  function load() {
    if (index) return Promise.resolve();
    if (pending) return pending;
    pending = fetch('search-index.json')
      .then(function (r) { return r.json(); })
      .then(function (data) { index = data; })
      .catch(function () { index = []; });
    return pending;
  }
  box.addEventListener('focus', load, { once: true });

  function esc(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;')
            .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function mark(text, q) {
    var i = text.toLowerCase().indexOf(q);
    if (i < 0) return esc(text);
    return esc(text.slice(0, i)) + '<mark>' + esc(text.slice(i, i + q.length)) +
           '</mark>' + esc(text.slice(i + q.length));
  }

  /** Pull a readable window of body text around the first hit, trimmed to word
   *  boundaries so snippets never start or end mid-word. */
  function snippet(body, q) {
    var i = body.toLowerCase().indexOf(q);
    if (i < 0) return '';
    var start = Math.max(0, i - 45);
    var end = Math.min(body.length, i + q.length + 75);
    var text = body.slice(start, end);
    if (start > 0) text = text.replace(/^\S*\s/, '');
    if (end < body.length) text = text.replace(/\s\S*$/, '');
    return (start > 0 ? '…' : '') + text + (end < body.length ? '…' : '');
  }

  function score(p, q) {
    var t = p.t.toLowerCase(), d = (p.d || '').toLowerCase(), b = p.b.toLowerCase();
    var s = 0;
    if (t === q) s += 100;
    if (t.indexOf(q) > -1) s += 30;
    if (d.indexOf(q) > -1) s += 10;
    if (b.indexOf(q) > -1) s += 1;
    return s;
  }

  function render() {
    var q = box.value.toLowerCase().trim();
    sel = -1;
    if (q.length < 2) { out.innerHTML = ''; say(''); return; }
    if (!index) { load().then(render); return; }

    var hits = index.map(function (p) { return { p: p, s: score(p, q) }; })
                    .filter(function (h) { return h.s > 0; })
                    .sort(function (a, b) { return b.s - a.s; })
                    .slice(0, 8);

    if (!hits.length) {
      out.innerHTML = '<span class="nores">No results for “' + esc(box.value.trim()) + '”</span>';
      say('No results');
      return;
    }

    out.innerHTML = hits.map(function (h) {
      var s = snippet(h.p.b, q) || h.p.d || '';
      return '<a role="option" aria-selected="false" href="' + esc(h.p.u) + '">' +
             mark(h.p.t, q) +
             (s ? '<span class="s">' + mark(s, q) + '</span>' : '') + '</a>';
    }).join('');
    say(hits.length + (hits.length === 1 ? ' result' : ' results'));
  }

  function say(msg) { if (status) status.textContent = msg; }

  function move(delta) {
    var items = out.querySelectorAll('a');
    if (!items.length) return;
    if (sel > -1) { items[sel].classList.remove('sel'); items[sel].setAttribute('aria-selected', 'false'); }
    sel = (sel + delta + items.length) % items.length;
    items[sel].classList.add('sel');
    items[sel].setAttribute('aria-selected', 'true');
    items[sel].scrollIntoView({ block: 'nearest' });
  }

  var timer;
  box.addEventListener('input', function () {
    clearTimeout(timer);
    timer = setTimeout(render, 90);
  });

  box.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowDown') { e.preventDefault(); move(1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); move(-1); }
    else if (e.key === 'Enter') {
      var items = out.querySelectorAll('a');
      var target = items[sel > -1 ? sel : 0];
      if (target) { e.preventDefault(); window.location.href = target.getAttribute('href'); }
    } else if (e.key === 'Escape') {
      box.value = ''; out.innerHTML = ''; say(''); box.blur();
    }
  });

  document.addEventListener('click', function (e) {
    if (!out.contains(e.target) && e.target !== box) { out.innerHTML = ''; sel = -1; }
  });

  // "/" focuses search, the convention on documentation sites.
  document.addEventListener('keydown', function (e) {
    if (e.key !== '/' || e.ctrlKey || e.metaKey || e.altKey) return;
    var el = document.activeElement, tag = el ? el.tagName : '';
    if (tag === 'INPUT' || tag === 'TEXTAREA' || (el && el.isContentEditable)) return;
    e.preventDefault();
    side && side.classList.contains('open') === false && window.innerWidth <= 900 && burger.click();
    box.focus();
    box.select();
  });
})();
