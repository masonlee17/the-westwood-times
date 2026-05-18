(function () {
  function showFeedback(btn, msg) {
    var orig = btn.textContent;
    var origBg = btn.style.background;
    var origColor = btn.style.color;
    btn.textContent = msg;
    btn.style.background = '#1a6fb5';
    btn.style.color = '#fff';
    setTimeout(function () {
      btn.textContent = orig;
      btn.style.background = origBg;
      btn.style.color = origColor;
    }, 2000);
  }

  function copyURL(btn) {
    var url = window.location.href;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url)
        .then(function () { showFeedback(btn, 'Copied!'); })
        .catch(function () { fallbackCopy(url, btn); });
    } else {
      fallbackCopy(url, btn);
    }
  }

  function fallbackCopy(text, btn) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.style.cssText = 'position:fixed;top:0;left:0;width:1px;height:1px;opacity:0';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    try { document.execCommand('copy'); showFeedback(btn, 'Copied!'); }
    catch (e) { showFeedback(btn, 'Copy failed'); }
    document.body.removeChild(ta);
  }

  // Share button — native share sheet on mobile/supported browsers, copy fallback on desktop
  var shareBtn = document.querySelector('.share-btn-fb');
  if (shareBtn) {
    shareBtn.removeAttribute('onclick');
    shareBtn.addEventListener('click', function () {
      if (navigator.share) {
        navigator.share({
          title: document.title.replace(/\s*—\s*The Westwood Times$/, ''),
          url: window.location.href
        }).catch(function () {});
      } else {
        copyURL(shareBtn);
      }
    });
  }

  // Copy button — copies current URL to clipboard
  var copyBtn = document.querySelector('.share-btn-link');
  if (copyBtn) {
    copyBtn.removeAttribute('onclick');
    copyBtn.addEventListener('click', function () { copyURL(copyBtn); });
  }
})();
