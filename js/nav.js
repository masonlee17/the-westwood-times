(function () {
  var hamburgerBtn  = document.getElementById('hamburger-btn');
  var mobileDrawer  = document.getElementById('mobile-nav-drawer');
  var siteHeader    = document.getElementById('site-header');
  var tabs          = document.querySelectorAll('.nav-tab');
  var sections      = document.querySelectorAll('.story-row[id]');
  var OFFSET        = 54 + 32; // header + ticker

  // ── Header scroll shadow ──
  if (siteHeader) {
    window.addEventListener('scroll', function () {
      siteHeader.classList.toggle('scrolled', window.scrollY > 10);
    }, { passive: true });
  }

  // ── Hamburger toggle ──
  if (hamburgerBtn && mobileDrawer) {
    hamburgerBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      var isOpen = mobileDrawer.classList.toggle('open');
      hamburgerBtn.classList.toggle('active', isOpen);
      hamburgerBtn.setAttribute('aria-expanded', String(isOpen));
    });

    document.addEventListener('click', function (e) {
      if (!hamburgerBtn.contains(e.target) && !mobileDrawer.contains(e.target)) {
        mobileDrawer.classList.remove('open');
        hamburgerBtn.classList.remove('active');
        hamburgerBtn.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // ── Tab click: smooth scroll to section (or navigate to homepage) ──
  tabs.forEach(function (tab) {
    tab.addEventListener('click', function (e) {
      var sectionId = 'section-' + tab.dataset.section;
      var target    = document.getElementById(sectionId);

      if (!target) {
        // Not on homepage — let the link navigate normally
        return;
      }

      e.preventDefault();
      tabs.forEach(function (t) { t.classList.remove('active'); });
      tab.classList.add('active');

      var top = target.getBoundingClientRect().top + window.scrollY - OFFSET - 8;
      window.scrollTo({ top: top, behavior: 'smooth' });

      // Close mobile drawer
      if (mobileDrawer) {
        mobileDrawer.classList.remove('open');
        if (hamburgerBtn) {
          hamburgerBtn.classList.remove('active');
          hamburgerBtn.setAttribute('aria-expanded', 'false');
        }
      }
    });
  });

  // ── Scroll spy ──
  if ('IntersectionObserver' in window && sections.length) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var name = entry.target.id.replace('section-', '');
          tabs.forEach(function (t) {
            t.classList.toggle('active', t.dataset.section === name);
          });
        }
      });
    }, {
      threshold: 0.25,
      rootMargin: '-' + OFFSET + 'px 0px -40% 0px'
    });

    sections.forEach(function (s) { observer.observe(s); });
  }
})();
