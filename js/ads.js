(function () {
  'use strict';

  function getPageType() {
    var p = window.location.pathname;
    return (p === '/' || p.endsWith('index.html')) ? 'homepage' : 'article';
  }

  function shouldShow(ad, pageType) {
    if (!ad.image) return false;
    if (ad.placement === 'all' || !ad.placement) return true;
    if (ad.placement === 'homepage' && pageType === 'homepage') return true;
    if (ad.placement === 'articles' && pageType === 'article') return true;
    return false;
  }

  function buildBanner(ad) {
    var wrap = document.createElement('div');
    wrap.className = 'ad-slot-banner';

    var lbl = document.createElement('div');
    lbl.className = 'ad-slot-label';
    lbl.textContent = 'Advertisement';

    var inner = document.createElement('div');
    inner.className = 'ad-slot-inner';

    var img = document.createElement('img');
    img.src = ad.image;
    img.alt = ad.label || 'Advertisement';
    img.className = 'ad-banner-img';

    if (ad.url) {
      var a = document.createElement('a');
      var href = ad.url;
      if (href && !/^https?:\/\//i.test(href)) href = 'https://' + href;
      a.href = href;
      a.target = '_blank';
      a.rel = 'noopener sponsored';
      a.className = 'ad-banner-link';
      a.appendChild(img);
      inner.appendChild(a);
    } else {
      inner.appendChild(img);
    }

    wrap.appendChild(lbl);
    wrap.appendChild(inner);
    return wrap;
  }

  function injectAds(ads) {
    var pageType = getPageType();
    var eligible = ads.filter(function (ad) { return shouldShow(ad, pageType); });
    if (!eligible.length) return;

    var slots = document.querySelectorAll('.ad-slot');
    slots.forEach(function (slot, i) {
      slot.appendChild(buildBanner(eligible[i % eligible.length]));
      slot.style.display = 'block';
    });
  }

  fetch('/api/ads')
    .then(function (r) { return r.json(); })
    .then(injectAds)
    .catch(function () {});
})();
