/* WinA site behaviour: search, suggestion filters, path chooser (records only). */
(function () {
  'use strict';

  // year stamp in footer
  document.querySelectorAll('[data-year]').forEach(function (el) {
    el.textContent = String(new Date().getFullYear());
  });

  // ---------- Site search (client-side over /search-index.json) ----------
  var input = document.getElementById('q');
  var results = document.getElementById('results');
  if (input && results) {
    var index = [];
    fetch('search-index.json').then(function (r) { return r.json(); }).then(function (data) {
      index = data;
      var params = new URLSearchParams(location.search);
      var initial = params.get('q');
      if (initial) { input.value = initial; run(initial); }
    }).catch(function () {
      results.innerHTML = '<p class="search-empty">Search index unavailable. Try the footer links instead.</p>';
    });

    function score(item, terms) {
      var hay = (item.title + ' ' + item.kicker + ' ' + item.text).toLowerCase();
      var s = 0;
      for (var i = 0; i < terms.length; i++) {
        if (hay.indexOf(terms[i]) === -1) return 0;
        s += (item.title.toLowerCase().indexOf(terms[i]) !== -1) ? 3 : 1;
      }
      return s;
    }

    function run(q) {
      var terms = q.toLowerCase().split(/\s+/).filter(Boolean);
      if (!terms.length) { results.innerHTML = ''; return; }
      var hits = index.map(function (it) { return { it: it, s: score(it, terms) }; })
        .filter(function (h) { return h.s > 0; })
        .sort(function (a, b) { return b.s - a.s; })
        .slice(0, 20);
      if (window.WinAAnalytics) window.WinAAnalytics.record('search_query', { q_length: q.length });
      if (!hits.length) {
        results.innerHTML = '<p class="search-empty">No matches for “' + escapeHtml(q) + '”. Try “air fryer”, “capacity”, “thermometer”, or “disclosure”.</p>';
        return;
      }
      results.innerHTML = hits.map(function (h) {
        return '<a class="search-hit" href="' + h.it.url + '">' +
          '<span class="hit-kicker">' + escapeHtml(h.it.kicker || 'Page') + '</span>' +
          '<h3>' + escapeHtml(h.it.title) + '</h3>' +
          '<p>' + escapeHtml(h.it.text || '') + '</p></a>';
      }).join('');
    }

    var form = document.getElementById('search-form');
    if (form) form.addEventListener('submit', function (e) {
      e.preventDefault();
      var q = input.value.trim();
      if (q) {
        history.replaceState(null, '', '?q=' + encodeURIComponent(q));
        run(q);
      }
    });

    function escapeHtml(s) {
      return String(s).replace(/[&<>"']/g, function (c) {
        return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
      });
    }
  }

  // ---------- Suggestion filters ----------
  var filterRow = document.querySelector('.filter-row');
  if (filterRow) {
    filterRow.addEventListener('click', function (e) {
      var btn = e.target.closest('button[data-filter]');
      if (!btn) return;
      filterRow.querySelectorAll('button').forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
      var f = btn.getAttribute('data-filter');
      document.querySelectorAll('.suggestion').forEach(function (card) {
        var st = card.getAttribute('data-status') || '';
        var show = f === 'all' ||
          (f === 'done' && st.indexOf('implemented') !== -1) ||
          (f === 'gated' && st.indexOf('gated') !== -1) ||
          (f === 'standing' && st.indexOf('standing') !== -1);
        card.style.display = show ? '' : 'none';
      });
    });
  }

  // ---------- Path chooser: RECORDS A CHOICE, APPLIES NOTHING ----------
  var chooser = document.getElementById('path-chooser');
  if (chooser) {
    var KEY = 'wina.path.choice';
    var saved = null;
    try { saved = localStorage.getItem(KEY); } catch (e) {}

    function paint(choice) {
      chooser.querySelectorAll('.path-card').forEach(function (card) {
        var id = card.getAttribute('data-path');
        card.classList.toggle('selected', id === choice);
        var radio = card.querySelector('input[type=radio]');
        if (radio) radio.checked = (id === choice);
      });
      var out = document.getElementById('choice-out');
      if (out) {
        out.textContent = choice
          ? 'Recorded locally: ' + choice + '. Nothing on the site changed — a human reviews and applies paths on purpose.'
          : 'No path recorded yet.';
      }
    }

    paint(saved);
    chooser.addEventListener('change', function (e) {
      var radio = e.target.closest('input[type=radio]');
      if (!radio) return;
      try { localStorage.setItem(KEY, radio.value); } catch (err) {}
      paint(radio.value);
    });
    var clear = document.getElementById('choice-clear');
    if (clear) clear.addEventListener('click', function () {
      try { localStorage.removeItem(KEY); } catch (err) {}
      paint(null);
    });
  }
})();
