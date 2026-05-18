(function () {
  var container, track, loaded = false, current = 0, cards = [];
  var animFrame = null, locked = false;

  function escHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function easeOutQuart(t) {
    return 1 - Math.pow(1 - t, 4);
  }

  // Move the track div via transform — no native scroll involved
  function animateTo(fromY, toY, duration, onDone) {
    if (animFrame) cancelAnimationFrame(animFrame);
    var dist = toY - fromY;
    if (Math.abs(dist) < 1) {
      track.style.transform = 'translateY(' + toY + 'px)';
      if (onDone) onDone();
      return;
    }
    var startTime = null;
    function step(ts) {
      if (!startTime) startTime = ts;
      var p = Math.min((ts - startTime) / duration, 1);
      track.style.transform = 'translateY(' + (fromY + dist * easeOutQuart(p)) + 'px)';
      if (p < 1) {
        animFrame = requestAnimationFrame(step);
      } else {
        track.style.transform = 'translateY(' + toY + 'px)';
        if (onDone) onDone();
      }
    }
    animFrame = requestAnimationFrame(step);
  }

  function currentY() {
    var m = new window.WebKitCSSMatrix
      ? new WebKitCSSMatrix(track.style.transform)
      : { m42: 0 };
    // Parse translateY from the inline style directly — most reliable
    var match = (track.style.transform || '').match(/translateY\(([^p]+)px\)/);
    return match ? parseFloat(match[1]) : 0;
  }

  function goTo(idx, onDone) {
    if (!cards.length) { if (onDone) onDone(); return; }
    idx = Math.max(0, Math.min(idx, cards.length - 1));
    current = idx;
    var targetY = -idx * container.clientHeight;
    animateTo(currentY(), targetY, 340, onDone);
  }

  function attachEvents() {
    // ── Desktop: wheel ──────────────────────────────────────
    // Ignore small deltaY (trackpad drift/sensitivity).
    // Lock until animation callback fires — exactly one card per gesture.
    container.addEventListener('wheel', function (e) {
      e.preventDefault();
      if (locked) return;
      if (Math.abs(e.deltaY) < 20) return;   // dead zone — ignore tiny scrolls
      locked = true;
      goTo(current + (e.deltaY > 0 ? 1 : -1), function () {
        // Brief cooldown after landing so momentum ticks don't chain
        setTimeout(function () { locked = false; }, 80);
      });
    }, { passive: false });

    // ── Mobile: touch ────────────────────────────────────────
    var touchStartY = 0, touchStartTime = 0, dragY = 0;

    container.addEventListener('touchstart', function (e) {
      if (animFrame) { cancelAnimationFrame(animFrame); animFrame = null; }
      locked = false;
      touchStartY    = e.touches[0].clientY;
      touchStartTime = Date.now();
      dragY = currentY();
    }, { passive: true });

    container.addEventListener('touchmove', function (e) {
      e.preventDefault();
      // Live drag — follow finger
      var dy = e.touches[0].clientY - touchStartY;
      track.style.transform = 'translateY(' + (dragY + dy) + 'px)';
    }, { passive: false });

    container.addEventListener('touchend', function (e) {
      var dy  = e.changedTouches[0].clientY - touchStartY;
      var vel = dy / Math.max(Date.now() - touchStartTime, 1); // px/ms, positive = swipe down
      if (Math.abs(dy) > 40 || Math.abs(vel) > 0.3) {
        goTo(current + (dy < 0 ? 1 : -1)); // swipe up → next card
      } else {
        goTo(current); // snap back
      }
    }, { passive: true });
  }

  function buildCard(a, i) {
    var card = document.createElement('div');
    card.className = 'reel-card';
    var imgSrc = a.image || ('https://picsum.photos/seed/' + escHtml(a.slug || String(i)) + '/800/1200');
    card.innerHTML =
      '<img class="reel-card-img" src="' + escHtml(imgSrc) + '" alt="" loading="' + (i < 3 ? 'eager' : 'lazy') + '">' +
      '<div class="reel-card-overlay"></div>' +
      '<div class="reel-card-content">' +
        '<span class="reel-card-category">' + escHtml(a.category || 'news') + '</span>' +
        '<h2 class="reel-card-headline">' + escHtml(a.headline || '') + '</h2>' +
        '<a href="' + escHtml(a.slug || '#') + '.html" class="reel-read-btn">Read Story &#8250;</a>' +
      '</div>';
    return card;
  }

  function buildNav() {
    if (document.getElementById('reel-nav')) return;
    var nav = document.createElement('div');
    nav.id = 'reel-nav';
    nav.className = 'reel-nav';
    nav.innerHTML =
      '<button class="reel-nav-btn" id="reel-up" aria-label="Previous">' +
        '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"/></svg>' +
      '</button>' +
      '<button class="reel-nav-btn" id="reel-down" aria-label="Next">' +
        '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>' +
      '</button>';
    document.body.appendChild(nav);
    document.getElementById('reel-up').addEventListener('click',   function () { if (!locked) goTo(current - 1); });
    document.getElementById('reel-down').addEventListener('click', function () { if (!locked) goTo(current + 1); });
  }

  function render(articles) {
    container.innerHTML = '';
    cards = [];
    if (!articles.length) {
      container.innerHTML = '<div class="reel-empty">No stories yet.</div>';
      return;
    }

    // Build a track div — this is what we translate, not scrollTop
    track = document.createElement('div');
    track.id = 'reels-track';
    track.style.transform = 'translateY(0px)';

    articles.forEach(function (a, i) {
      var card = buildCard(a, i);
      track.appendChild(card);
      cards.push(card);
    });

    container.appendChild(track);
    buildNav();
    attachEvents();
  }

  function showNav(visible) {
    var el = document.getElementById('reel-nav');
    if (el) el.style.display = visible ? 'flex' : 'none';
  }

  function init() {
    container = document.getElementById('reels-container');
    if (!container) return;
    if (loaded) { showNav(true); return; }
    loaded = true;
    showNav(true);
    container.innerHTML = '<div class="reel-loading">Loading\u2026</div>';
    fetch('/api/all-articles')
      .then(function (r) { return r.json(); })
      .then(function (data) {
        var all = (data.custom || []).concat(data.static || []).filter(function (a) {
          return a && a.headline;
        });
        render(all);
      })
      .catch(function () {
        container.innerHTML = '<div class="reel-empty">Could not load stories.</div>';
      });
  }

  document.addEventListener('keydown', function (e) {
    var rm = document.getElementById('reels-mode');
    if (!rm || rm.style.display === 'none') return;
    if (e.key === 'ArrowDown' || e.key === 'j') { e.preventDefault(); if (!locked) goTo(current + 1); }
    if (e.key === 'ArrowUp'   || e.key === 'k') { e.preventDefault(); if (!locked) goTo(current - 1); }
  });

  window.initReels = init;
  window.hideReelsNav = function () { showNav(false); };
})();
