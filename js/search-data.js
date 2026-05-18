// Dynamic search index — built from /api/all-articles on every load
window.SEARCH_INDEX = [];
window.ENV_SEARCH = [];

fetch('/api/all-articles')
  .then(function (r) { return r.json(); })
  .then(function (data) {
    var all = (data.custom || []).concat(data.static || []);
    window.SEARCH_INDEX = all.map(function (a) {
      return { slug: a.slug, title: a.headline };
    });
  })
  .catch(function () {});

fetch('/api/environments/public')
  .then(function (r) { return r.json(); })
  .then(function (envs) {
    window.ENV_SEARCH = envs || [];
  })
  .catch(function () {});
