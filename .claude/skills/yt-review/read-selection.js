// yt-review read-back: returns the checked rows from the overlay.
// Reads ✓ state straight from the DOM, so it works whether or not "Lock in" was clicked.
// Returns video ids (NOT full ?v= URLs) — YouTube's output filter blocks query strings.
(() => {
  const data = window.__YT_DATA || [];
  const rows = [...document.querySelectorAll('#yt-review-overlay [data-i]')];
  const picks = [];
  rows.forEach(r => {
    const box = r.querySelector('.ytr-box');
    if (box && box.textContent.trim() === '✓') {
      const d = data[+r.dataset.i];
      if (d) picks.push({ id: d.id, title: d.title, watched: d.watched, channel: d.channel });
    }
  });
  return JSON.stringify({ locked: window.__YT_DONE, count: picks.length, picks });
})();
