(function () {
  var videoItems  = document.querySelectorAll('.video-list-item');
  var mainThumb   = document.querySelector('#main-video .video-thumb');
  var captionTitle = document.querySelector('.video-caption h3');
  var playBtn     = document.querySelector('.play-btn');

  var videoData = {
    'vid1': {
      src:   'https://picsum.photos/seed/vid1/700/394',
      title: 'Inside the summit: exclusive access to behind-the-scenes negotiations'
    },
    'vid2': {
      src:   'https://picsum.photos/seed/vid2/700/394',
      title: 'The race to quantum computing: how three firms are betting everything'
    },
    'vid3': {
      src:   'https://picsum.photos/seed/vid3/700/394',
      title: 'Climate report: what the new data means for coastal communities'
    },
    'vid4': {
      src:   'https://picsum.photos/seed/vid4/700/394',
      title: 'Exclusive interview: leading economist on what comes after the rate pause'
    }
  };

  videoItems.forEach(function (item) {
    item.addEventListener('click', function () {
      var key = item.dataset.video;
      if (!key || !videoData[key]) return;

      videoItems.forEach(function (v) { v.classList.remove('active'); });
      item.classList.add('active');

      if (mainThumb) {
        mainThumb.src = videoData[key].src;
        mainThumb.alt = videoData[key].title;
      }
      if (captionTitle) {
        captionTitle.textContent = videoData[key].title;
      }
    });
  });

  // Play button: pulse animation (no real video in static demo)
  if (playBtn) {
    playBtn.addEventListener('click', function () {
      playBtn.style.transform = 'translate(-50%, -50%) scale(0.9)';
      setTimeout(function () {
        playBtn.style.transform = '';
      }, 200);
    });
  }
})();
