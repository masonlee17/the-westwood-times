(function () {
  var searchBtn  = document.getElementById('search-btn');
  var overlay    = document.getElementById('search-overlay');
  var closeBtn   = document.getElementById('search-close');
  var input      = overlay ? overlay.querySelector('.search-input') : null;
  var results    = document.getElementById('search-results');

  if (!overlay) return;

  // Detect if we're in a subdirectory (e.g. legal/)
  var base = (window.location.pathname.indexOf('/legal/') !== -1) ? '../' : '';

  function openSearch() {
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
    if (input) setTimeout(function () { input.focus(); }, 50);
  }

  function closeSearch() {
    overlay.classList.remove('open');
    document.body.style.overflow = '';
    if (input) input.value = '';
    if (results) results.innerHTML = '';
  }

  function doSearch(query) {
    if (!results) return;
    query = query.trim().toLowerCase();
    if (!query) { results.innerHTML = ''; return; }

    // Check dynamic environments
    var envMatches = (window.ENV_SEARCH || []).filter(function (e) {
      return e.name.toLowerCase().indexOf(query) !== -1;
    });

    // If article index not loaded yet, show a loading state and retry once ready
    if (!window.SEARCH_INDEX || !window.SEARCH_INDEX.length) {
      if (envMatches.length === 0) {
        results.innerHTML = '<p class="search-no-results">Loading index…</p>';
        setTimeout(function () { doSearch(input ? input.value : ''); }, 600);
      } else {
        renderResults(envMatches, [], query);
      }
      return;
    }

    var articleMatches = window.SEARCH_INDEX.filter(function (item) {
      return item.title.toLowerCase().indexOf(query) !== -1;
    });

    if (envMatches.length === 0 && articleMatches.length === 0) {
      results.innerHTML = '<p class="search-no-results">No results for &ldquo;' + escapeHtml(query) + '&rdquo;</p>';
      return;
    }

    renderResults(envMatches, articleMatches, query);
  }

  function renderResults(envMatches, articleMatches, query) {
    var html = '<ul class="search-result-list">';
    envMatches.forEach(function (env) {
      html += '<li><a href="#" class="env-search-link" data-slug="' + escapeHtml(env.slug) +
        '" data-question="' + escapeHtml(env.question) + '">&#x1F512; ' +
        highlightMatch(env.name, query) + '</a></li>';
    });
    articleMatches.forEach(function (item) {
      html += '<li><a href="' + base + item.slug + '.html">' + highlightMatch(item.title, query) + '</a></li>';
    });
    html += '</ul>';
    results.innerHTML = html;

    results.querySelectorAll('.env-search-link').forEach(function (a) {
      a.addEventListener('click', function (e) {
        e.preventDefault();
        showEnvGate(a.dataset.slug, a.dataset.question, base);
      });
    });
  }

  function escapeHtml(str) {
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  function highlightMatch(title, query) {
    var idx = title.toLowerCase().indexOf(query);
    if (idx === -1) return escapeHtml(title);
    return escapeHtml(title.slice(0, idx))
      + '<mark>' + escapeHtml(title.slice(idx, idx + query.length)) + '</mark>'
      + escapeHtml(title.slice(idx + query.length));
  }

  // ── Gate modal for dynamic environments ──
  function showEnvGate(slug, question, base) {
    var existing = document.getElementById('env-gate-modal');
    if (existing) existing.parentNode.removeChild(existing);

    var modal = document.createElement('div');
    modal.id = 'env-gate-modal';
    modal.style.cssText = [
      'position:fixed;inset:0;z-index:9999',
      'background:rgba(0,0,0,0.82)',
      'display:flex;align-items:center;justify-content:center',
      'animation:wgFadeIn 0.15s ease'
    ].join(';');

    modal.innerHTML = [
      '<div style="background:#1a1a1a;border:1px solid #333;border-radius:14px;padding:36px 32px;width:340px;max-width:90vw;text-align:center;">',
        '<div style="font-size:32px;margin-bottom:14px;">&#x1F512;</div>',
        '<h2 style="font-size:18px;font-weight:900;color:#fff;margin-bottom:8px;">' + escapeHtml(question || 'Enter Password') + '</h2>',
        '<p id="env-gate-err" style="font-size:13px;color:#cc0000;min-height:18px;margin-bottom:10px;display:none;">Wrong password — try again.</p>',
        '<input id="env-gate-input" type="password" placeholder="Enter password…"',
          ' style="width:100%;box-sizing:border-box;background:#111;border:1px solid #333;border-radius:7px;',
          'color:#fff;font-size:15px;padding:11px 14px;margin-bottom:16px;outline:none;">',
        '<div style="display:flex;gap:10px;">',
          '<button id="env-gate-cancel" style="flex:1;background:#222;border:1px solid #333;border-radius:7px;color:rgba(255,255,255,0.5);font-size:13px;font-weight:700;padding:11px;cursor:pointer;">Cancel</button>',
          '<button id="env-gate-enter" style="flex:1;background:#2774AE;border:none;border-radius:7px;color:#fff;font-size:13px;font-weight:700;padding:11px;cursor:pointer;">Enter</button>',
        '</div>',
      '</div>'
    ].join('');

    document.body.appendChild(modal);
    setTimeout(function () { document.getElementById('env-gate-input').focus(); }, 60);

    function destroy() {
      if (modal.parentNode) modal.parentNode.removeChild(modal);
    }

    function attempt() {
      var pw = document.getElementById('env-gate-input').value;
      fetch('/api/env/' + encodeURIComponent(slug) + '/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pw: pw })
      })
        .then(function (r) { return r.json(); })
        .then(function (d) {
          if (d.ok) {
            sessionStorage.setItem('env_' + slug, pw);
            destroy();
            window.location.href = base + slug + '.html';
          } else {
            var err = document.getElementById('env-gate-err');
            if (err) err.style.display = 'block';
            var inp = document.getElementById('env-gate-input');
            if (inp) { inp.value = ''; inp.focus(); }
          }
        })
        .catch(function () {
          var err = document.getElementById('env-gate-err');
          if (err) { err.textContent = 'Error — try again.'; err.style.display = 'block'; }
        });
    }

    document.getElementById('env-gate-enter').addEventListener('click', attempt);
    document.getElementById('env-gate-cancel').addEventListener('click', destroy);
    document.getElementById('env-gate-input').addEventListener('keydown', function (e) {
      if (e.key === 'Enter') attempt();
      if (e.key === 'Escape') destroy();
    });
    modal.addEventListener('click', function (e) { if (e.target === modal) destroy(); });
  }

  if (searchBtn) searchBtn.addEventListener('click', openSearch);
  if (closeBtn)  closeBtn.addEventListener('click', closeSearch);

  if (input) {
    input.addEventListener('input', function () { doSearch(input.value); });
  }

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeSearch();
  });

  overlay.addEventListener('click', function (e) {
    if (e.target === overlay) closeSearch();
  });

  var form = overlay.querySelector('form');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      doSearch(input ? input.value : '');
    });
  }
})();
