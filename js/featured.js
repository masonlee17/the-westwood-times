(function () {
  'use strict';

  var CAT_COLORS = {
    social: '#2774AE', 'village-news': '#1e6e3a', sports: '#cc0000',
    community: '#6a2ab3', clubs: '#b36a2a', hill: '#1a9090', opinion: '#555',
    politics: '#cc0000', world: '#1a6fb5', business: '#2a7a2a',
    tech: '#6a2ab3', health: '#b36a2a', science: '#1a9090',
    entertainment: '#b31a6a', travel: '#2a5ab3'
  };

  function buildCard(a) {
    var color    = CAT_COLORS[a.category] || '#555';
    var catLabel = a.category ? (a.category.charAt(0).toUpperCase() + a.category.slice(1).replace(/-/g,' ')) : '';
    var imgSrc   = a.image || ('https://picsum.photos/seed/' + (a.seed || a.slug || 'card') + '/400/225');

    var card = document.createElement('a');
    card.href = a.slug + '.html';
    card.className = 'fslider-card';

    card.innerHTML =
      '<div class="fslider-img-wrap">'
      + '<img src="' + imgSrc + '" alt="" loading="lazy">'
      + '</div>'
      + '<div class="fslider-body">'
      + '<span class="fslider-tag" style="background:' + color + '">' + catLabel + '</span>'
      + '<p class="fslider-headline">' + a.headline + '</p>'
      + '</div>';

    return card;
  }

  fetch('/api/featured')
    .then(function (r) { return r.json(); })
    .then(function (articles) {
      if (!articles || !articles.length) return;

      var section = document.getElementById('featured-slider-section');
      var track   = document.getElementById('featured-slider-track');
      if (!section || !track) return;

      articles.forEach(function (a) { track.appendChild(buildCard(a)); });
      section.style.display = 'block';
    })
    .catch(function () {});
})();
