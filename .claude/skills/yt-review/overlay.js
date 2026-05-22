// yt-review overlay: scrape today's watch history + inject the selection UI.
// Run in the youtube.com/feed/history tab via javascript_tool. Returns a status string.
// Reads back via read-selection.js (checkbox state lives in the DOM, not a closure).
(() => {
  document.getElementById('yt-review-overlay')?.remove();

  // --- scrape: walk date headers + lockups in document order, scope to "Today" ---
  const nodes = [...document.querySelectorAll('#title, yt-lockup-view-model')];
  let section = '(top)';
  const seen = new Set();
  const data = [];
  nodes.forEach(el => {
    if (el.id === 'title') {
      const t = el.textContent.trim();
      if (t && t.length < 40 && !t.startsWith('http')) section = t;
      return;
    }
    if (section !== 'Today') return;
    const a = el.querySelector('a[class*="MetadataViewModelTitle"]');
    if (!a) return;
    const u = new URL(a.href);
    let id = u.searchParams.get('v');
    if (!id && u.pathname.startsWith('/shorts/')) id = u.pathname.split('/')[2];
    if (!id || seen.has(id)) return;
    seen.add(id);
    const bar = el.querySelector('[class*="WatchedProgressBarSegment"]');
    let pct = 0;
    if (bar) {
      const w = parseFloat(getComputedStyle(bar).width);
      const pw = parseFloat(getComputedStyle(bar.parentElement).width);
      if (w && pw) pct = Math.round(w / pw * 100);
    }
    const cm = el.querySelector('yt-content-metadata-view-model')?.textContent?.trim() || '';
    const channel = cm.split('•')[0].trim();
    data.push({ id, title: (a.textContent || '').trim(), watched: pct, channel });
  });

  window.__YT_DATA = data;
  window.__YT_DONE = false;
  window.__YT_PICKS = [];
  const sel = new Set();

  // --- build overlay ---
  const mk = (tag, css, txt) => {
    const e = document.createElement(tag);
    if (css) e.style.cssText = css;
    if (txt != null) e.textContent = txt; // textContent only — YouTube enforces Trusted Types, innerHTML is blocked
    return e;
  };

  const o = mk('div', 'position:fixed;inset:0;z-index:2147483647;background:#0b0d10;color:#e6e8eb;font:14px/1.4 -apple-system,system-ui,sans-serif;display:flex;flex-direction:column;');
  o.id = 'yt-review-overlay';

  const head = mk('div', 'padding:16px 20px;border-bottom:1px solid #232830;display:flex;align-items:center;gap:16px;flex:0 0 auto;');
  head.append(
    mk('div', 'font-size:16px;font-weight:600;', 'Review watch history — Today'),
    mk('div', 'color:#8b949e;', '↑/↓ or j/k move · Space toggles · click a row · then Lock in'),
    (() => { const c = mk('div', 'margin-left:auto;font-weight:600;color:#58a6ff;', '0 selected'); c.id = 'ytr-count'; return c; })()
  );

  const list = mk('div', 'flex:1 1 auto;overflow:auto;padding:8px 12px;outline:none;');
  list.tabIndex = 0;
  let focus = 0;

  data.forEach((d, i) => {
    const r = mk('div', 'display:flex;align-items:center;gap:14px;padding:8px 12px;border-radius:10px;cursor:pointer;');
    r.dataset.i = i;
    const box = mk('div', 'width:18px;height:18px;border:2px solid #4b5563;border-radius:4px;flex:0 0 auto;display:flex;align-items:center;justify-content:center;font-size:13px;color:#0b0d10;');
    box.className = 'ytr-box';
    const thumb = mk('img', 'width:96px;height:54px;flex:0 0 auto;object-fit:cover;border-radius:6px;background:#161b22;');
    thumb.src = 'https://i.ytimg.com/vi/' + d.id + '/mqdefault.jpg';
    thumb.loading = 'lazy';
    const meta = mk('div', 'flex:1 1 auto;min-width:0;');
    const col = d.watched >= 80 ? '#2ea043' : d.watched >= 40 ? '#bf8700' : '#6e7681';
    const sub = mk('div', 'font-size:12px;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:#8b949e;');
    if (d.channel) sub.appendChild(document.createTextNode(d.channel + '  ·  '));
    const badge = mk('span', `color:${col};font-weight:600;font-variant-numeric:tabular-nums;`, d.watched + '% watched');
    sub.appendChild(badge);
    meta.append(
      mk('div', 'white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-weight:500;', d.title),
      sub
    );
    r.append(box, thumb, meta);
    list.append(r);
    r.addEventListener('click', () => { focus = i; toggle(i); paint(); });
  });

  function toggle(i) { const id = data[i].id; sel.has(id) ? sel.delete(id) : sel.add(id); }
  function paint() {
    [...list.children].forEach((r, i) => {
      const on = sel.has(data[i].id);
      r.style.background = i === focus ? '#161b22' : 'transparent';
      r.style.boxShadow = i === focus ? 'inset 0 0 0 1px #30363d' : 'none';
      const box = r.querySelector('.ytr-box');
      box.style.background = on ? '#58a6ff' : 'transparent';
      box.style.borderColor = on ? '#58a6ff' : '#4b5563';
      box.textContent = on ? '✓' : '';
    });
    document.getElementById('ytr-count').textContent = sel.size + ' selected';
  }

  list.addEventListener('keydown', e => {
    if (e.key === 'ArrowDown' || e.key === 'j') { focus = Math.min(data.length - 1, focus + 1); e.preventDefault(); e.stopPropagation(); paint(); list.children[focus].scrollIntoView({ block: 'nearest' }); }
    else if (e.key === 'ArrowUp' || e.key === 'k') { focus = Math.max(0, focus - 1); e.preventDefault(); e.stopPropagation(); paint(); list.children[focus].scrollIntoView({ block: 'nearest' }); }
    else if (e.key === ' ') { toggle(focus); e.preventDefault(); e.stopPropagation(); paint(); }
  }, true);

  const foot = mk('div', 'padding:14px 20px;border-top:1px solid #232830;display:flex;gap:12px;align-items:center;flex:0 0 auto;');
  const lock = mk('button', 'background:#238636;color:#fff;border:0;padding:9px 18px;border-radius:8px;font-weight:600;cursor:pointer;font-size:14px;', 'Lock in selection');
  const cancel = mk('button', 'background:transparent;color:#8b949e;border:1px solid #30363d;padding:9px 16px;border-radius:8px;cursor:pointer;', 'Cancel');
  const status = mk('div', 'margin-left:auto;color:#8b949e;');
  lock.addEventListener('click', () => {
    window.__YT_PICKS = data.filter(d => sel.has(d.id));
    window.__YT_DONE = true;
    status.textContent = 'Locked ' + sel.size + ' — now type "done" in chat so Claude reads it.';
    lock.style.background = '#1f6f2c';
  });
  cancel.addEventListener('click', () => { window.__YT_PICKS = []; window.__YT_DONE = 'cancel'; o.remove(); });
  foot.append(lock, cancel, status);

  o.append(head, list, foot);
  document.body.append(o);
  paint();
  list.focus();
  return 'overlay ready with ' + data.length + ' rows';
})();
