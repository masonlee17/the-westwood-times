(function () {
  var categoryColors = {
    social: '#8B2FC9', village: '#B5601E', sports: '#2774AE',
    community: '#1a8070', clubs: '#C88B14', hill: '#1e4d8c', opinion: '#555'
  };

  function escHtml(str) {
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  function inject(articles) {
    if (!articles.length) return;

    var section = document.createElement('section');
    section.className = 'story-row custom-articles-row';
    section.id = 'section-custom';

    var html = '<div class="container"><div class="row-header">'
      + '<h2 class="row-title"><span style="background:#cc0000;color:#fff;padding:2px 8px;border-radius:2px;font-size:inherit;font-weight:900">Breaking</span></h2>'
      + '</div><div class="row-grid">';

    articles.forEach(function (a) {
      var cat   = a.category.charAt(0).toUpperCase() + a.category.slice(1);
      var color = categoryColors[a.category] || '#555';
      var img   = a.image || ('https://picsum.photos/seed/' + a.seed + '/340/200');
      html += '<article class="row-card">'
        + '<a href="' + (a.slug ? a.slug + '.html' : 'article.html') + '">'
        + '<div class="img-wrap"><img src="' + escHtml(img) + '" alt="" style="object-fit:cover;width:100%;height:200px"></div>'
        + '<div class="card-body">'
        + '<span class="category-tag" style="background:' + color + '">' + escHtml(cat) + '</span>'
        + '<h3 class="card-headline">' + escHtml(a.headline) + '</h3>'
        + (a.dek ? '<p class="card-dek">' + escHtml(a.dek) + '</p>' : '')
        + '</div></a></article>';
    });

    html += '</div></div>';
    section.innerHTML = html;

    var target = document.querySelector('.main-grid-section');
    if (target) target.parentNode.insertBefore(section, target);
  }

  fetch('/api/articles')
    .then(function (r) { return r.json(); })
    .then(inject)
    .catch(function () {}); // fail silently if server is unavailable
})();
