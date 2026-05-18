(function () {
  var wrapper = document.querySelector('.ticker-track-wrapper');
  var track   = document.querySelector('.ticker-track');
  if (!wrapper || !track) return;

  // Build scroll inner container
  var inner = document.createElement('div');
  inner.className = 'ticker-scroll-inner';

  // Move original track into inner
  wrapper.removeChild(track);
  inner.appendChild(track);

  // Clone for seamless loop
  var clone = track.cloneNode(true);
  inner.appendChild(clone);

  wrapper.appendChild(inner);

  var position = 0;
  var speed    = 0.55; // px per frame
  var paused   = false;
  var trackW   = 0;

  function getTrackWidth() {
    trackW = track.offsetWidth;
  }

  getTrackWidth();
  window.addEventListener('resize', getTrackWidth);

  function tick() {
    if (!paused && trackW > 0) {
      position -= speed;
      if (position <= -trackW) {
        position = 0;
      }
      inner.style.transform = 'translateX(' + position + 'px)';
    }
    requestAnimationFrame(tick);
  }

  wrapper.addEventListener('mouseenter', function () { paused = true; });
  wrapper.addEventListener('mouseleave', function () { paused = false; });

  requestAnimationFrame(tick);
})();
