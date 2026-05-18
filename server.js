const http = require('http');
const fs   = require('fs');
const path = require('path');

const PORT          = process.env.PORT || 3000;
const ROOT          = __dirname;
const DATA_DIR       = process.env.DATA_DIR ? path.resolve(process.env.DATA_DIR) : path.join(ROOT, 'data');
const ARTICLES_FILE  = path.join(DATA_DIR, 'articles.json');
const ADS_FILE       = path.join(DATA_DIR, 'ads.json');
const FEATURED_FILE  = path.join(DATA_DIR, 'featured.json');
const PASSWORDS_FILE = path.join(DATA_DIR, 'passwords.json');
const BLACKOUT_FILE  = path.join(DATA_DIR, 'blackout.json');
const ENVIRONMENTS_FILE = path.join(DATA_DIR, 'environments.json');
const UPLOADS_DIR    = path.join(DATA_DIR, 'uploads');
const MASTER_PW      = process.env.MASTER_PW || 'Zofivuqi47';

const MIME = {
  '.html': 'text/html', '.css': 'text/css', '.js': 'application/javascript',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif',
  '.ico': 'image/x-icon', '.json': 'application/json', '.woff2': 'font/woff2'
};

// Ensure directories exist
if (!fs.existsSync(DATA_DIR))    fs.mkdirSync(DATA_DIR,    { recursive: true });
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
if (!fs.existsSync(ARTICLES_FILE))  fs.writeFileSync(ARTICLES_FILE,  '[]', 'utf8');
if (!fs.existsSync(ADS_FILE))       fs.writeFileSync(ADS_FILE,       '[]', 'utf8');
if (!fs.existsSync(FEATURED_FILE))  fs.writeFileSync(FEATURED_FILE,  '[]', 'utf8');
if (!fs.existsSync(PASSWORDS_FILE))    fs.writeFileSync(PASSWORDS_FILE,   '[]', 'utf8');
if (!fs.existsSync(ENVIRONMENTS_FILE)) fs.writeFileSync(ENVIRONMENTS_FILE, '[]', 'utf8');
if (!fs.existsSync(BLACKOUT_FILE))  fs.writeFileSync(BLACKOUT_FILE, JSON.stringify([
  { name: 'Ryan Burack',       count: 3 },
  { name: 'Mason Lee',         count: 2 },
  { name: 'Alexander Coleman', count: 2 },
  { name: 'Cayden Lehr',       count: 1 },
  { name: 'Caden Cabrera',     count: 1 },
  { name: 'Alexander Prater',  count: 0 }
], null, 2), 'utf8');

// ── Articles store helpers ──
function readArticles() {
  try { return JSON.parse(fs.readFileSync(ARTICLES_FILE, 'utf8')); }
  catch (e) { return []; }
}
function writeArticles(arr) {
  fs.writeFileSync(ARTICLES_FILE, JSON.stringify(arr, null, 2), 'utf8');
  allArticlesCache = null; // bust cache on any write
}

// ── Ads store helpers ──
function readAds() {
  try { return JSON.parse(fs.readFileSync(ADS_FILE, 'utf8')); }
  catch (e) { return []; }
}
function writeAds(arr) {
  fs.writeFileSync(ADS_FILE, JSON.stringify(arr, null, 2), 'utf8');
}

// ── Featured store helpers ──
function readFeatured() {
  try { return JSON.parse(fs.readFileSync(FEATURED_FILE, 'utf8')); }
  catch (e) { return []; }
}
function writeFeatured(arr) {
  fs.writeFileSync(FEATURED_FILE, JSON.stringify(arr, null, 2), 'utf8');
}

// ── Blackout store helpers ──
function readBlackout() {
  try { return JSON.parse(fs.readFileSync(BLACKOUT_FILE, 'utf8')); }
  catch (e) { return []; }
}
function writeBlackout(arr) {
  fs.writeFileSync(BLACKOUT_FILE, JSON.stringify(arr, null, 2), 'utf8');
}

// ── Passwords store helpers ──
function readPasswords() {
  try { return JSON.parse(fs.readFileSync(PASSWORDS_FILE, 'utf8')); }
  catch (e) { return []; }
}
function writePasswords(arr) {
  fs.writeFileSync(PASSWORDS_FILE, JSON.stringify(arr, null, 2), 'utf8');
}

// ── All-articles cache (busted on any write or server start) ──
let allArticlesCache = null;

// ── Environments store helpers ──
function readEnvironments() {
  try { return JSON.parse(fs.readFileSync(ENVIRONMENTS_FILE, 'utf8')); }
  catch (e) { return []; }
}
function writeEnvironments(arr) {
  fs.writeFileSync(ENVIRONMENTS_FILE, JSON.stringify(arr, null, 2), 'utf8');
}
function findEnv(slug) {
  return readEnvironments().find(function(e) { return e.slug === slug; });
}
function saveEnv(updated) {
  const envs = readEnvironments();
  const idx  = envs.findIndex(function(e) { return e.slug === updated.slug; });
  if (idx === -1) return false;
  envs[idx] = updated;
  writeEnvironments(envs);
  return true;
}
function initEnvDefaults(env) {
  const members = env.members || [];
  if (!Array.isArray(env.blackout)) env.blackout = members.map(function(m) { return { name: m, count: 0 }; });
  if (!Array.isArray(env.awards))   env.awards   = [];
  if (!Array.isArray(env.chores))   env.chores   = [];
  if (!Array.isArray(env.board))    env.board    = [];
  if (!Array.isArray(env.polls))    env.polls    = [];
  if (!Array.isArray(env.scores))   env.scores   = members.map(function(m) { return { name: m, score: 0 }; });
  return env;
}
function isEnvAuth(pw, env) {
  return pw === MASTER_PW || pw === env.password;
}

function slugify(text) {
  return text.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '').trim()
    .replace(/\s+/g, '-').replace(/-+/g, '-').slice(0, 60);
}

function escHtml(str) {
  return String(str)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function json(res, status, obj) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(obj));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => { try { resolve(JSON.parse(body)); } catch(e) { reject(e); } });
    req.on('error', reject);
  });
}

function buildArticleHtml(article) {
  const cat      = article.category.charAt(0).toUpperCase() + article.category.slice(1);
  const tagClass = 'tag-' + article.category;
  const now      = new Date().toLocaleDateString('en-US', {
    weekday: 'short', year: 'numeric', month: 'long', day: 'numeric'
  });
  const paragraphs = (article.body || '')
    .split(/\n\n+/).map(p => p.trim()).filter(Boolean)
    .map(p => `      <p>${escHtml(p)}</p>`).join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escHtml(article.headline)} — The Westwood Times</title>
  <meta name="description" content="${escHtml((article.dek || article.headline).slice(0, 160))}">
  <link rel="canonical" href="${BASE_URL}/${article.slug}.html">
  <meta property="og:type" content="article">
  <meta property="og:site_name" content="The Westwood Times">
  <meta property="og:title" content="${escHtml(article.headline)}">
  <meta property="og:description" content="${escHtml((article.dek || article.headline).slice(0, 160))}">
  <meta property="og:url" content="${BASE_URL}/${article.slug}.html">
  <meta property="og:image" content="${article.image || `https://picsum.photos/seed/${article.seed}/1400/560`}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escHtml(article.headline)}">
  <meta name="twitter:description" content="${escHtml((article.dek || article.headline).slice(0, 160))}">
  <meta name="twitter:image" content="${article.image || `https://picsum.photos/seed/${article.seed}/1400/560`}">
  <link rel="icon" type="image/png" href="images/twt_logo_new.png">
  <link rel="stylesheet" href="css/reset.css"><link rel="stylesheet" href="css/main.css">
  <link rel="stylesheet" href="css/ticker.css"><link rel="stylesheet" href="css/grid.css">
  <link rel="stylesheet" href="css/sidebar.css"><link rel="stylesheet" href="css/article.css">
</head>
<body>
  <div id="top-bar"><div class="topbar-inner"><span class="topbar-date" id="topbar-date"></span><span class="topbar-tagline">Independent &middot; Accurate &middot; Essential</span><div class="topbar-links"><a href="subscribe.html">Subscribe</a><a href="newsletter.html">Newsletter</a><a href="about.html">About</a></div></div></div>
  <header id="site-header" role="banner"><div class="header-inner">
    <button class="hamburger" id="hamburger-btn" aria-label="Open menu" aria-expanded="false"><span></span><span></span><span></span></button>
    <a href="index.html" class="logo-link"><img src="images/twt_logo_new.png" alt="The Westwood Times" class="site-logo"></a>
    <nav class="primary-nav" role="navigation" aria-label="Primary"><ul>
      <li><a href="index.html#section-social" class="nav-tab">Social</a></li><li><a href="index.html#section-village" class="nav-tab">Village News</a></li>
      <li><a href="index.html#section-sports" class="nav-tab">Sports</a></li><li><a href="index.html#section-community" class="nav-tab">Community</a></li>
      <li><a href="index.html#section-clubs" class="nav-tab">Clubs</a></li><li><a href="index.html#section-hill" class="nav-tab">Hill</a></li>
    </ul></nav>
    <div class="header-actions">
      <button class="search-btn" id="search-btn" aria-label="Search"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><line x1="16.5" y1="16.5" x2="22" y2="22"/></svg></button>
      <a href="subscribe.html" class="live-tv-btn">Subscribe</a>
    </div>
  </div>
  <nav class="mobile-nav-drawer" id="mobile-nav-drawer"><ul><li><a href="index.html">Home</a></li><li><a href="index.html#section-social">Social</a></li><li><a href="index.html#section-village">Village News</a></li><li><a href="index.html#section-sports">Sports</a></li><li><a href="index.html#section-community">Community</a></li><li><a href="index.html#section-clubs">Clubs</a></li><li><a href="index.html#section-hill">Hill</a></li></ul></nav>
  <div class="search-overlay" id="search-overlay" role="search"><form>
    <input type="search" class="search-input" placeholder="Search The Westwood Times…" autocomplete="off">
    <button type="button" class="search-close" id="search-close">&#x2715;</button>
  </form><div id="search-results" class="search-results"></div></div></header>

  <div class="breaking-ticker" aria-live="polite"><span class="ticker-label">${escHtml(cat)}</span>
    <div class="ticker-track-wrapper"><div class="ticker-track">
      <span class="ticker-item">${escHtml(article.headline)}</span><span class="ticker-sep">|</span>
    </div></div>
  </div>

  <main class="article-page" role="main">
    <nav class="article-breadcrumb" aria-label="Breadcrumb"><div class="breadcrumb-inner">
      <a href="index.html">Home</a><span class="breadcrumb-sep">›</span>
      <a href="index.html#section-${article.category}">${escHtml(cat)}</a><span class="breadcrumb-sep">›</span>
      <span class="breadcrumb-current">${escHtml(article.headline.slice(0, 60))}…</span>
    </div></nav>
    <img src="${article.image || `https://picsum.photos/seed/${article.seed}/1400/560`}" alt="" class="article-hero-img">
    <header class="article-header">
      <span class="category-tag ${tagClass}">${escHtml(cat)}</span>
      <h1 class="article-headline">${escHtml(article.headline)}</h1>
      ${article.dek ? `<p class="article-dek">${escHtml(article.dek)}</p>` : ''}
      <div class="article-meta">
        <div class="article-byline">TWT Staff</div>
        <div class="article-timestamp">Updated ${now}</div>
        <div class="share-buttons">
          <button class="share-btn share-btn-fb">Share</button>
          <button class="share-btn share-btn-link">Copy</button>
        </div>
      </div>
    </header>
    <div class="article-body">
${paragraphs || '      <p>Full story developing.</p>'}
    </div>
    <div class="article-tags"><span class="tags-label">Related:</span>
      <a href="index.html#section-${article.category}" class="tag-pill">${escHtml(cat)}</a>
    </div>
  </main>

  <footer id="site-footer" role="contentinfo"><div class="footer-inner">
    <div class="footer-logo"><a href="index.html"><img src="images/twt_logo_new.png" alt="The Westwood Times" style="height:40px;width:auto;"></a><p class="footer-tagline">Independent &middot; Accurate &middot; Essential<br>Westwood, Los Angeles &middot; Est. 2026</p></div>
    <nav class="footer-nav" aria-label="Footer">
      <div class="footer-col"><h4>Campus</h4><ul>
        <li><a href="index.html#section-social">Social</a></li>
        <li><a href="index.html#section-clubs">Clubs</a></li>
        <li><a href="index.html#section-community">Community</a></li>
        <li><a href="index.html#section-hill">Hill</a></li>
      </ul></div>
      <div class="footer-col"><h4>Westwood</h4><ul>
        <li><a href="index.html#section-village">Village News</a></li>
        <li><a href="index.html#section-sports">Sports</a></li>
        <li><a href="index.html#opinion-heading">Opinion</a></li>
        <li><a href="newsletter.html">Newsletter</a></li>
      </ul></div>
      <div class="footer-col"><h4>Company</h4><ul>
        <li><a href="about.html">About Us</a></li>
        <li><a href="sponsorships.html">Sponsorships</a></li>
        <li><a href="careers.html">Careers</a></li>
        <li><a href="newsletter.html">Newsletters</a></li>
        <li><a href="sponsorships.html">Advertise</a></li>
        <li><a href="about.html">Contact</a></li>
      </ul></div>
      <div class="footer-col"><h4>Legal</h4><ul>
        <li><a href="legal/parody.html">Legal Notice</a></li>
        <li><a href="legal/privacy.html">Privacy Policy</a></li>
        <li><a href="legal/terms.html">Terms of Use</a></li>
        <li><a href="legal/cookies.html">Cookie Settings</a></li>
      </ul></div>
    </nav>
  </div><hr class="footer-divider">
  <div class="footer-bottom"><p>&copy; 2026 The Westwood Times — All Rights Reserved.</p></div></footer>
  <script src="js/ticker.js"></script><script src="js/nav.js"></script><script src="js/search-data.js"></script><script src="js/search.js"></script><script src="js/ads.js"></script><script src="js/share.js"></script>
  <script>(function(){var el=document.getElementById("topbar-date");if(el){el.textContent=new Date().toLocaleDateString("en-US",{weekday:"long",year:"numeric",month:"long",day:"numeric"});}})()</script>
</body>
</html>`;
}

function buildEnvBgStyle(env) {
  const color = env.bgColor || '#0d0d0d';
  const img   = env.bgImage  || '';
  const safeImg = img.replace(/'/g, "\\'");
  let s = `body.env-page{background:${color}}body.env-page .env-gate{background:${color}}`;
  if (img) {
    s += `.rh-hero{background:linear-gradient(rgba(0,0,0,0.52),rgba(0,0,0,0.48)),url('${safeImg}')center/cover no-repeat!important}`;
    s += `.rh-hero::before{display:none!important}`;
    s += `body.env-page .env-gate{background:linear-gradient(rgba(0,0,0,0.68),rgba(0,0,0,0.64)),url('${safeImg}')center/cover no-repeat fixed}`;
  } else if (env.bgColor) {
    s += `.rh-hero{background:${color}!important}`;
    s += `.rh-hero::before{background:radial-gradient(ellipse at center,rgba(255,255,255,0.06) 0%,transparent 70%)!important}`;
  }
  return s;
}

function buildEnvHtml(env) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escHtml(env.name)} — The Westwood Times</title>
  <meta name="robots" content="noindex, nofollow">
  <link rel="icon" type="image/png" href="images/twt_logo_new.png">
  <link rel="stylesheet" href="css/reset.css">
  <link rel="stylesheet" href="css/main.css">
  <link rel="stylesheet" href="css/ticker.css">
  <link rel="stylesheet" href="css/grid.css">
  <link rel="stylesheet" href="css/sidebar.css">
  <link rel="stylesheet" href="css/env.css">
  <style>${buildEnvBgStyle(env)}</style>
</head>
<body class="env-page">
  <div id="top-bar"><div class="topbar-inner"><span class="topbar-date" id="topbar-date"></span><span class="topbar-tagline">Independent &middot; Accurate &middot; Essential</span><div class="topbar-links"><a href="subscribe.html">Subscribe</a><a href="newsletter.html">Newsletter</a><a href="about.html">About</a></div></div></div>
  <header id="site-header" role="banner"><div class="header-inner">
    <button class="hamburger" id="hamburger-btn" aria-label="Open menu" aria-expanded="false"><span></span><span></span><span></span></button>
    <a href="index.html" class="logo-link"><img src="images/twt_logo_new.png" alt="The Westwood Times" class="site-logo"></a>
    <nav class="primary-nav" role="navigation" aria-label="Primary"><ul>
      <li><a href="index.html#section-social" class="nav-tab">Social</a></li><li><a href="index.html#section-village" class="nav-tab">Village News</a></li>
      <li><a href="index.html#section-sports" class="nav-tab">Sports</a></li><li><a href="index.html#section-community" class="nav-tab">Community</a></li>
      <li><a href="index.html#section-clubs" class="nav-tab">Clubs</a></li><li><a href="index.html#section-hill" class="nav-tab">Hill</a></li>
    </ul></nav>
    <div class="header-actions">
      <button class="search-btn" id="search-btn" aria-label="Search"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><line x1="16.5" y1="16.5" x2="22" y2="22"/></svg></button>
      <a href="subscribe.html" class="live-tv-btn">Subscribe</a>
    </div>
  </div>
  <nav class="mobile-nav-drawer" id="mobile-nav-drawer"><ul><li><a href="index.html">Home</a></li><li><a href="index.html#section-social">Social</a></li><li><a href="index.html#section-village">Village News</a></li><li><a href="index.html#section-sports">Sports</a></li><li><a href="index.html#section-community">Community</a></li><li><a href="index.html#section-clubs">Clubs</a></li><li><a href="index.html#section-hill">Hill</a></li></ul></nav>
  <div class="search-overlay" id="search-overlay" role="search"><form>
    <input type="search" class="search-input" placeholder="Search The Westwood Times…" autocomplete="off">
    <button type="button" class="search-close" id="search-close">&#x2715;</button>
  </form><div id="search-results" class="search-results"></div></div></header>

  <div class="breaking-ticker" aria-live="polite"><span class="ticker-label">${escHtml(env.eyebrow || 'Private')}</span>
    <div class="ticker-track-wrapper"><div class="ticker-track">
      <span class="ticker-item">${escHtml(env.name)}</span><span class="ticker-sep">|</span>
      <span class="ticker-item">${escHtml(env.description || 'Members Only')}</span><span class="ticker-sep">|</span>
    </div></div>
  </div>

  <!-- Password Gate -->
  <div id="env-gate">
    <div class="env-gate-box">
      <div class="env-gate-eyebrow">${escHtml(env.eyebrow || 'Secret Page')}</div>
      <h1>${escHtml(env.name)}</h1>
      ${env.description ? `<p class="env-gate-desc">${escHtml(env.description)}</p>` : ''}
      <p class="env-gate-question">${escHtml(env.question || 'Enter the password to continue')}</p>
      <input type="password" id="env-gate-pw" placeholder="Password…" autocomplete="off">
      <div class="env-gate-error" id="env-gate-error" style="display:none">Wrong password — try again.</div>
      <button id="env-gate-btn">Enter</button>
    </div>
  </div>

  <!-- Content -->
  <div id="env-content" style="display:none">
    <div class="rh-hero">
      <div class="rh-hero-eyebrow">${escHtml(env.eyebrow || 'Members Only')}</div>
      <h1>${escHtml(env.name)}</h1>
      <p>${escHtml(env.description || '')}</p>
    </div>
    <div class="rh-tabs-bar" id="env-tabs"></div>
    <div id="env-panels"></div>
  </div>

  <footer id="site-footer" role="contentinfo"><div class="footer-inner">
    <div class="footer-logo"><a href="index.html"><img src="images/twt_logo_new.png" alt="The Westwood Times" style="height:40px;width:auto;"></a><p class="footer-tagline">Independent &middot; Accurate &middot; Essential<br>Westwood, Los Angeles &middot; Est. 2026</p></div>
    <nav class="footer-nav" aria-label="Footer">
      <div class="footer-col"><h4>Campus</h4><ul><li><a href="index.html#section-social">Social</a></li><li><a href="index.html#section-clubs">Clubs</a></li><li><a href="index.html#section-community">Community</a></li><li><a href="index.html#section-hill">Hill</a></li></ul></div>
      <div class="footer-col"><h4>Westwood</h4><ul><li><a href="index.html#section-village">Village News</a></li><li><a href="index.html#section-sports">Sports</a></li><li><a href="opinion-heading">Opinion</a></li><li><a href="newsletter.html">Newsletter</a></li></ul></div>
      <div class="footer-col"><h4>Company</h4><ul><li><a href="about.html">About Us</a></li><li><a href="sponsorships.html">Sponsorships</a></li><li><a href="careers.html">Careers</a></li><li><a href="about.html">Contact</a></li></ul></div>
      <div class="footer-col"><h4>Legal</h4><ul><li><a href="legal/parody.html">Legal Notice</a></li><li><a href="legal/privacy.html">Privacy Policy</a></li><li><a href="legal/terms.html">Terms of Use</a></li><li><a href="legal/cookies.html">Cookie Settings</a></li></ul></div>
    </nav>
  </div><hr class="footer-divider">
  <div class="footer-bottom"><p>&copy; 2026 The Westwood Times — All Rights Reserved.</p></div></footer>

  <script src="js/ticker.js"></script>
  <script src="js/nav.js"></script>
  <script src="js/search-data.js"></script>
  <script src="js/search.js"></script>
  <script>window.ENV_CONFIG = ${JSON.stringify({ slug: env.slug, name: env.name, question: env.question || '', features: env.features || [], members: env.members || [], description: env.description || '', eyebrow: env.eyebrow || 'Secret Page' })};</script>
  <script src="js/env.js"></script>
  <script>(function(){var el=document.getElementById("topbar-date");if(el){el.textContent=new Date().toLocaleDateString("en-US",{weekday:"long",year:"numeric",month:"long",day:"numeric"});}})()</script>
</body>
</html>`;
}

const BASE_URL = 'https://www.thewestwoodtimes.com';
const SKIP_SLUGS = new Set(['index', 'about', 'article', 'sponsorships', 'careers', 'newsletter', 'subscribe']);

// ── Startup: seed Retirement Home into environments if not present ──
(function seedRetirementHome() {
  const envs = readEnvironments();
  if (envs.find(function(e) { return e.slug === 'retirement-home'; })) return;
  const bl = readBlackout();
  const rh = initEnvDefaults({
    slug: 'retirement-home', name: 'Retirement Home',
    eyebrow: 'THE WESTWOOD TIMES', description: 'The private retirement home network.',
    question: 'What Is The Wifi Password', password: 'TikiTiki!',
    features: ['blackout'],
    members: bl.map(function(b) { return b.name; })
  });
  rh.blackout = bl; // carry over existing data
  envs.push(rh);
  writeEnvironments(envs);
  fs.writeFileSync(path.join(ROOT, 'retirement-home.html'), buildEnvHtml(rh), 'utf8');
  console.log('Seeded Retirement Home environment.');
})();

// ── Startup: regenerate all environment HTML pages (restores pages lost after redeploy) ──
(function regenEnvPages() {
  const envs = readEnvironments();
  envs.forEach(function(env) {
    const htmlPath = path.join(ROOT, env.slug + '.html');
    try {
      fs.writeFileSync(htmlPath, buildEnvHtml(env), 'utf8');
    } catch(e) { console.error('Could not rebuild env page ' + env.slug + ':', e.message); }
  });
  if (envs.length > 0) console.log('Regenerated ' + envs.length + ' environment page(s).');
})();

// ── Startup: regenerate any missing article HTML files from articles.json ──
(function regenMissingHtml() {
  const articles = readArticles();
  let rebuilt = 0;
  articles.forEach(function(article) {
    const htmlPath = path.join(ROOT, article.slug + '.html');
    if (!fs.existsSync(htmlPath)) {
      try {
        fs.writeFileSync(htmlPath, buildArticleHtml(article), 'utf8');
        rebuilt++;
      } catch(e) { console.error('Could not rebuild ' + article.slug + ':', e.message); }
    }
  });
  if (rebuilt > 0) console.log('Rebuilt ' + rebuilt + ' missing article HTML file(s) from articles.json.');
})();

// ── Request handler ──
const server = http.createServer(async (req, res) => {
  const url = req.url.split('?')[0];

  // GET /sitemap.xml
  if (req.method === 'GET' && url === '/sitemap.xml') {
    const custom  = readArticles();
    const customSlugs = new Set(custom.map(a => a.slug));
    const envSlugs    = new Set(readEnvironments().map(function(e) { return e.slug; }));
    const staticSlugs = fs.readdirSync(ROOT)
      .filter(f => f.endsWith('.html') && !f.startsWith('_') && !f.startsWith('legal/'))
      .map(f => f.replace('.html', ''))
      .filter(s => !SKIP_SLUGS.has(s) && !customSlugs.has(s) && !envSlugs.has(s));

    const allSlugs = [
      { slug: '', priority: '1.0', changefreq: 'daily' },
      ...custom.map(a => ({ slug: a.slug, priority: '0.8', changefreq: 'weekly' })),
      ...staticSlugs.map(s => ({ slug: s, priority: '0.7', changefreq: 'monthly' }))
    ];

    const urls = allSlugs.map(({ slug, priority, changefreq }) =>
      `  <url>\n    <loc>${BASE_URL}/${slug ? slug + '.html' : ''}</loc>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`
    ).join('\n');

    res.writeHead(200, { 'Content-Type': 'application/xml' });
    return res.end(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`);
  }

  // POST /api/auth — validate password server-side
  if (req.method === 'POST' && url === '/api/auth') {
    try {
      const { pw } = await readBody(req);
      if (!pw) return json(res, 400, { ok: false });
      if (pw === MASTER_PW) return json(res, 200, { ok: true, role: 'master' });
      // Check limited passwords on server — no longer consume on login
      const passwords = readPasswords();
      const entry = passwords.find(p => p.pw === pw && p.uses > 0);
      if (entry) {
        return json(res, 200, { ok: true, role: 'limited', uses: entry.uses });
      }
      return json(res, 200, { ok: false, role: null });
    } catch (e) { return json(res, 400, { ok: false }); }
  }

  // GET /api/passwords — list limited passwords (master only)
  if (req.method === 'GET' && url === '/api/passwords') {
    const qs = req.url.includes('?') ? req.url.split('?')[1] : '';
    const params = new URLSearchParams(qs);
    if (params.get('pw') !== MASTER_PW) return json(res, 403, { error: 'Unauthorized' });
    return json(res, 200, readPasswords());
  }

  // POST /api/passwords — create or update a limited password (master only)
  if (req.method === 'POST' && url === '/api/passwords') {
    try {
      const { pw, newPw, uses } = await readBody(req);
      if (pw !== MASTER_PW) return json(res, 403, { error: 'Unauthorized' });
      if (!newPw || !uses || uses < 1) return json(res, 400, { error: 'Missing fields' });
      const passwords = readPasswords();
      const idx = passwords.findIndex(p => p.pw === newPw);
      if (idx !== -1) { passwords[idx].uses = uses; } else { passwords.push({ pw: newPw, uses }); }
      writePasswords(passwords);
      return json(res, 200, { ok: true });
    } catch (e) { return json(res, 500, { error: e.message }); }
  }

  // DELETE /api/passwords/:pw — delete a limited password (master only)
  if (req.method === 'DELETE' && url.startsWith('/api/passwords/')) {
    const qs = req.url.includes('?') ? req.url.split('?')[1] : '';
    const params = new URLSearchParams(qs);
    if (params.get('pw') !== MASTER_PW) return json(res, 403, { error: 'Unauthorized' });
    const targetPw = decodeURIComponent(url.replace('/api/passwords/', '').split('?')[0]);
    writePasswords(readPasswords().filter(p => p.pw !== targetPw));
    return json(res, 200, { ok: true });
  }

  // GET /api/articles/:slug — single article detail (for edit prefill)
  if (req.method === 'GET' && url.startsWith('/api/articles/')) {
    const slug = url.replace('/api/articles/', '').split('?')[0].replace(/[^a-z0-9-]/g, '');
    const found = readArticles().find(a => a.slug === slug);
    if (found) return json(res, 200, found);
    const htmlPath = path.join(ROOT, slug + '.html');
    if (!fs.existsSync(htmlPath)) return json(res, 404, { error: 'Not found' });
    try {
      const html = fs.readFileSync(htmlPath, 'utf8');
      const titleRaw = (html.match(/<title>([^<]+)<\/title>/) || [])[1] || slug;
      const headline = titleRaw.replace(/ — The Westwood Times$/, '').replace(/ -- CNN$/, '').replace(/ - CNN$/, '');
      const category = (html.match(/class="category-tag tag-([^"]+)"/) || [])[1] || 'social';
      const dekMatch  = html.match(/<p[^>]*class="article-dek"[^>]*>([\s\S]*?)<\/p>/);
      const dek       = dekMatch ? dekMatch[1].replace(/<[^>]+>/g, '').trim() : '';
      const image     = (html.match(/<img[^>]+class="article-hero-img"[^>]*src="([^"]+)"/) ||
                         html.match(/<img[^>]+src="([^"]+)"[^>]+class="article-hero-img"/) || [])[1] || '';
      const bStart = html.indexOf('<div class="article-body">');
      const bEnd   = html.indexOf('<div class="article-tags">', bStart);
      const bodySection = (bStart !== -1 && bEnd !== -1)
        ? html.slice(bStart + '<div class="article-body">'.length, bEnd) : '';
      const body = (bodySection.match(/<p>([\s\S]*?)<\/p>/g) || [])
        .map(p => p.replace(/<[^>]+>/g, '')
          .replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>')
          .replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&#8220;/g,'\u201c')
          .replace(/&#8221;/g,'\u201d').replace(/&#8212;/g,'\u2014').trim())
        .filter(Boolean).join('\n\n');
      return json(res, 200, { slug, headline, category, dek, body, image, static: true });
    } catch(e) { return json(res, 500, { error: e.message }); }
  }

  // GET /api/articles?pw=
  if (req.method === 'GET' && url.startsWith('/api/articles') && !url.startsWith('/api/articles/')) {
    const qs = req.url.includes('?') ? req.url.split('?')[1] : '';
    const params = new URLSearchParams(qs);
    const pw  = params.get('pw');   // null if param absent
    const all = readArticles();
    // No pw (public homepage) or master pw → return everything
    // Limited pw → return only articles tagged to that password
    if (pw === null || pw === MASTER_PW) {
      return json(res, 200, all);
    } else {
      return json(res, 200, all.filter(a => a.password === pw));
    }
  }

  // POST /api/upload-image
  if (req.method === 'POST' && url === '/api/upload-image') {
    try {
      const { filename, data } = await readBody(req);
      const ext      = path.extname(filename).toLowerCase().replace(/[^a-z0-9.]/g, '') || '.jpg';
      const safeName = Date.now() + ext;
      fs.writeFileSync(path.join(UPLOADS_DIR, safeName), Buffer.from(data, 'base64'));
      return json(res, 200, { ok: true, path: 'images/uploads/' + safeName });
    } catch (e) { return json(res, 500, { error: e.message }); }
  }

  // POST /api/create-article
  if (req.method === 'POST' && url === '/api/create-article') {
    try {
      const article = await readBody(req);
      if (!article.headline || !article.category) return json(res, 400, { error: 'Missing fields' });

      // If submitted by a limited password, consume one publish slot
      if (article.password && article.password !== MASTER_PW) {
        const passwords = readPasswords();
        const idx = passwords.findIndex(p => p.pw === article.password && p.uses > 0);
        if (idx === -1) return json(res, 403, { error: 'No publish slots remaining for this password.' });
        passwords[idx].uses -= 1;
        if (passwords[idx].uses <= 0) passwords.splice(idx, 1);
        writePasswords(passwords);
      }

      const slug    = slugify(article.headline) || ('article-' + Date.now());
      article.slug  = slug;
      article.date  = article.date || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      article.password = article.password || '';

      // Write HTML file
      fs.writeFileSync(path.join(ROOT, slug + '.html'), buildArticleHtml(article), 'utf8');

      // Save to articles.json (prepend so newest first)
      const articles = readArticles().filter(a => a.slug !== slug); // avoid dupes
      articles.unshift(article);
      writeArticles(articles);

      return json(res, 200, { ok: true, slug });
    } catch (e) { return json(res, 500, { error: e.message }); }
  }

  // GET /api/ads
  if (req.method === 'GET' && url === '/api/ads') {
    return json(res, 200, readAds());
  }

  // POST /api/create-ad
  if (req.method === 'POST' && url === '/api/create-ad') {
    try {
      const ad = await readBody(req);
      if (!ad.image) return json(res, 400, { error: 'Missing image' });
      ad.id        = Date.now().toString();
      ad.placement = ad.placement || 'all';
      ad.date      = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      const ads = readAds();
      ads.unshift(ad);
      writeAds(ads);
      return json(res, 200, { ok: true, id: ad.id });
    } catch (e) { return json(res, 500, { error: e.message }); }
  }

  // DELETE /api/ads/:id
  if (req.method === 'DELETE' && url.startsWith('/api/ads/')) {
    const qs = req.url.includes('?') ? req.url.split('?')[1] : '';
    if (new URLSearchParams(qs).get('pw') !== MASTER_PW) return json(res, 403, { error: 'Unauthorized' });
    const id = url.replace('/api/ads/', '');
    writeAds(readAds().filter(a => a.id !== id));
    return json(res, 200, { ok: true });
  }

  // GET /api/all-articles — combines articles.json + static HTML files (cached)
  if (req.method === 'GET' && url === '/api/all-articles') {
    if (!allArticlesCache) {
      const custom      = readArticles();
      const customSlugs = new Set(custom.map(a => a.slug));
      const skip        = new Set(['index','about','article','sponsorships','retirement-home']);
      const envSlugsSet = new Set(readEnvironments().map(function(e) { return e.slug; }));
      const staticItems = fs.readdirSync(ROOT)
        .filter(f => f.endsWith('.html') && !f.startsWith('_') && !f.startsWith('legal'))
        .map(f => f.replace('.html',''))
        .filter(slug => !skip.has(slug) && !customSlugs.has(slug) && !envSlugsSet.has(slug))
        .map(slug => {
          try {
            const html  = fs.readFileSync(path.join(ROOT, slug + '.html'), 'utf8');
            const title = (html.match(/<title>([^<]+)<\/title>/) || [])[1] || slug;
            const cat   = (html.match(/class="category-tag tag-([^"]+)"/) || [])[1] || 'general';
            const img   = (
                           html.match(/<meta[^>]+property="og:image"[^>]+content="([^"]+)"/) ||
                           html.match(/<meta[^>]+content="([^"]+)"[^>]+property="og:image"/) ||
                           html.match(/<img[^>]+class="[^"]*article-hero-img[^"]*"[^>]*src="([^"]+)"/) ||
                           html.match(/<img[^>]+src="([^"]+)"[^>]*class="[^"]*article-hero-img[^"]*"/) ||
                           html.match(/<img[^>]+class="[^"]*hero-img[^"]*"[^>]*src="([^"]+)"/) ||
                           html.match(/<img[^>]+src="([^"]+)"[^>]*class="[^"]*hero-img[^"]*"/) ||
                           html.match(/<img[^>]+src="(https:\/\/[^"]+)"/)
                         || [])[1] || '';
            return { slug, headline: title.replace(/ — The Westwood Times$/, ''), category: cat, image: img, static: true };
          } catch(e) { return null; }
        }).filter(Boolean);
      allArticlesCache = { custom, static: staticItems };
    }
    return json(res, 200, allArticlesCache);
  }

  // GET /api/featured
  if (req.method === 'GET' && url === '/api/featured') {
    return json(res, 200, readFeatured());
  }

  // PUT /api/featured
  if (req.method === 'PUT' && url === '/api/featured') {
    try {
      const { pw, articles } = await readBody(req);
      if (pw !== MASTER_PW) return json(res, 403, { error: 'Unauthorized' });
      if (!Array.isArray(articles)) return json(res, 400, { error: 'Invalid payload' });
      writeFeatured(articles);
      return json(res, 200, { ok: true });
    } catch (e) { return json(res, 500, { error: e.message }); }
  }

  // PUT /api/articles/:slug — update article (master only)
  if (req.method === 'PUT' && url.startsWith('/api/articles/')) {
    try {
      const slug = url.replace('/api/articles/', '').split('?')[0].replace(/[^a-z0-9-]/g, '');
      const body = await readBody(req);
      if (body.pw !== MASTER_PW) return json(res, 403, { error: 'Unauthorized' });
      if (!body.headline || !body.category) return json(res, 400, { error: 'Missing fields' });

      const articles = readArticles();
      let article = articles.find(a => a.slug === slug);

      if (article) {
        // Update existing dynamic article in-place
        article.headline = body.headline;
        article.category = body.category;
        article.dek      = body.dek  || '';
        article.body     = body.body || '';
        if (body.image !== undefined) article.image = body.image;
      } else {
        // Static article — promote to dynamic by adding to articles.json
        article = {
          slug, headline: body.headline, category: body.category,
          dek: body.dek || '', body: body.body || '', image: body.image || '',
          date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          password: '', seed: Math.floor(Math.random() * 9999)
        };
        articles.unshift(article);
      }

      fs.writeFileSync(path.join(ROOT, slug + '.html'), buildArticleHtml(article), 'utf8');
      writeArticles(articles);
      return json(res, 200, { ok: true, slug });
    } catch(e) { return json(res, 500, { error: e.message }); }
  }

  // DELETE /api/articles/:slug
  if (req.method === 'DELETE' && url.startsWith('/api/articles/')) {
    const qs = req.url.includes('?') ? req.url.split('?')[1] : '';
    if (new URLSearchParams(qs).get('pw') !== MASTER_PW) return json(res, 403, { error: 'Unauthorized' });
    const slug     = url.replace('/api/articles/', '').replace(/[^a-z0-9-]/g, '');
    const articles = readArticles().filter(a => a.slug !== slug);
    writeArticles(articles);
    // Remove from featured if present
    writeFeatured(readFeatured().filter(a => a.slug !== slug));
    // Remove HTML file if it exists
    const htmlPath = path.join(ROOT, slug + '.html');
    if (fs.existsSync(htmlPath)) fs.unlinkSync(htmlPath);
    return json(res, 200, { ok: true });
  }

  // GET /api/blackout
  if (req.method === 'GET' && url === '/api/blackout') {
    return json(res, 200, readBlackout());
  }

  // POST /api/blackout/increment — body: { name, pw }
  if (req.method === 'POST' && url === '/api/blackout/increment') {
    try {
      const { name, pw } = await readBody(req);
      if (pw !== MASTER_PW && pw !== 'TikiTiki!') return json(res, 403, { error: 'Unauthorized' });
      const data  = readBlackout();
      const entry = data.find(e => e.name === name);
      if (!entry) return json(res, 404, { error: 'Person not found' });
      entry.count += 1;
      writeBlackout(data);
      return json(res, 200, { ok: true, count: entry.count });
    } catch (e) { return json(res, 500, { error: e.message }); }
  }

  // POST /api/blackout/decrement — body: { name, pw }
  if (req.method === 'POST' && url === '/api/blackout/decrement') {
    try {
      const { name, pw } = await readBody(req);
      if (pw !== MASTER_PW && pw !== 'TikiTiki!') return json(res, 403, { error: 'Unauthorized' });
      const data  = readBlackout();
      const entry = data.find(e => e.name === name);
      if (!entry) return json(res, 404, { error: 'Person not found' });
      if (entry.count > 0) entry.count -= 1;
      writeBlackout(data);
      return json(res, 200, { ok: true, count: entry.count });
    } catch (e) { return json(res, 500, { error: e.message }); }
  }

  // GET /api/environments/public — names/slugs/questions only, no auth required
  if (req.method === 'GET' && url === '/api/environments/public') {
    return json(res, 200, readEnvironments().map(function(e) {
      return { slug: e.slug, name: e.name, question: e.question || '' };
    }));
  }

  // ── GET/POST /api/environments ──
  if (req.method === 'GET' && url === '/api/environments') {
    const qs = req.url.includes('?') ? req.url.split('?')[1] : '';
    const params = new URLSearchParams(qs);
    if (params.get('pw') !== MASTER_PW) return json(res, 403, { error: 'Unauthorized' });
    return json(res, 200, readEnvironments().map(function(e) {
      return { slug: e.slug, name: e.name, eyebrow: e.eyebrow, description: e.description,
               question: e.question, password: e.password, features: e.features, members: e.members,
               bgColor: e.bgColor || '', bgImage: e.bgImage || '' };
    }));
  }
  if (req.method === 'POST' && url === '/api/environments') {
    try {
      const body = await readBody(req);
      if (body.pw !== MASTER_PW) return json(res, 403, { error: 'Unauthorized' });
      if (!body.name) return json(res, 400, { error: 'Name required' });
      const envSlug = body.slug || slugify(body.name) || ('env-' + Date.now());
      const envs = readEnvironments();
      if (envs.find(function(e) { return e.slug === envSlug; }))
        return json(res, 400, { error: 'Slug already in use' });
      const env = initEnvDefaults({
        slug: envSlug, name: body.name, description: body.description || '',
        eyebrow: body.eyebrow || 'Secret Page', question: body.question || 'Enter the password',
        password: body.password || '', features: body.features || ['blackout','awards'],
        members: body.members || [],
        bgColor: body.bgColor || '', bgImage: body.bgImage || ''
      });
      envs.push(env);
      writeEnvironments(envs);
      fs.writeFileSync(path.join(ROOT, envSlug + '.html'), buildEnvHtml(env), 'utf8');
      return json(res, 200, { ok: true, slug: envSlug });
    } catch (e) { return json(res, 500, { error: e.message }); }
  }
  if (req.method === 'PUT' && url.startsWith('/api/environments/')) {
    try {
      const body = await readBody(req);
      if (body.pw !== MASTER_PW) return json(res, 403, { error: 'Unauthorized' });
      const envSlug = decodeURIComponent(url.replace('/api/environments/', '').split('?')[0]);
      const envs = readEnvironments();
      const idx = envs.findIndex(function(e) { return e.slug === envSlug; });
      if (idx === -1) return json(res, 404, { error: 'Environment not found' });
      const env = envs[idx];
      if (body.name        !== undefined) env.name        = body.name;
      if (body.eyebrow     !== undefined) env.eyebrow     = body.eyebrow;
      if (body.description !== undefined) env.description = body.description;
      if (body.question    !== undefined) env.question    = body.question;
      if (body.password    !== undefined) env.password    = body.password;
      if (body.features    !== undefined) env.features    = body.features;
      if (body.members     !== undefined) env.members     = body.members;
      if (body.bgColor     !== undefined) env.bgColor     = body.bgColor;
      if (body.bgImage     !== undefined) env.bgImage     = body.bgImage;
      envs[idx] = env;
      writeEnvironments(envs);
      fs.writeFileSync(path.join(ROOT, env.slug + '.html'), buildEnvHtml(env), 'utf8');
      return json(res, 200, { ok: true });
    } catch(e) { return json(res, 500, { error: e.message }); }
  }
  if (req.method === 'DELETE' && url.startsWith('/api/environments/')) {
    const qs = req.url.includes('?') ? req.url.split('?')[1] : '';
    const params = new URLSearchParams(qs);
    if (params.get('pw') !== MASTER_PW) return json(res, 403, { error: 'Unauthorized' });
    const envSlug = decodeURIComponent(url.replace('/api/environments/', '').split('?')[0]);
    writeEnvironments(readEnvironments().filter(function(e) { return e.slug !== envSlug; }));
    const htmlPath = path.join(ROOT, envSlug + '.html');
    if (fs.existsSync(htmlPath)) fs.unlinkSync(htmlPath);
    return json(res, 200, { ok: true });
  }

  // ── /api/env/:slug/* ──
  if (url.startsWith('/api/env/')) {
    const parts   = url.split('/');  // ['','api','env',slug,feature,subId,action]
    const envSlug = parts[3];
    const feature = parts[4];
    const subId   = parts[5];
    const action  = parts[6];

    // GET /api/env/:slug (public info for gate)
    if (req.method === 'GET' && !feature) {
      const env = findEnv(envSlug);
      if (!env) return json(res, 404, { error: 'Not found' });
      return json(res, 200, { slug: env.slug, name: env.name, question: env.question,
        description: env.description, eyebrow: env.eyebrow, features: env.features });
    }

    // POST /api/env/:slug/auth
    if (req.method === 'POST' && feature === 'auth') {
      try {
        const { pw } = await readBody(req);
        const env = findEnv(envSlug);
        if (!env) return json(res, 404, { error: 'Not found' });
        return json(res, 200, { ok: isEnvAuth(pw, env) });
      } catch(e) { return json(res, 400, { ok: false }); }
    }

    // Blackout
    if (feature === 'blackout') {
      const env = findEnv(envSlug);
      if (!env) return json(res, 404, { error: 'Not found' });
      if (req.method === 'GET') return json(res, 200, env.blackout || []);
      if (req.method === 'POST' && (subId === 'increment' || subId === 'decrement')) {
        try {
          const { name, pw } = await readBody(req);
          if (!isEnvAuth(pw, env)) return json(res, 403, { error: 'Unauthorized' });
          const entry = (env.blackout || []).find(function(e) { return e.name === name; });
          if (!entry) return json(res, 404, { error: 'Person not found' });
          if (subId === 'increment') entry.count += 1;
          else if (entry.count > 0)  entry.count -= 1;
          saveEnv(env);
          return json(res, 200, { ok: true, count: entry.count });
        } catch(e) { return json(res, 500, { error: e.message }); }
      }
    }

    // Awards
    if (feature === 'awards') {
      const env = findEnv(envSlug);
      if (!env) return json(res, 404, { error: 'Not found' });
      if (req.method === 'GET') return json(res, 200, env.awards || []);
      if (req.method === 'PUT') {
        try {
          const { pw, awards } = await readBody(req);
          if (!isEnvAuth(pw, env)) return json(res, 403, { error: 'Unauthorized' });
          if (!Array.isArray(awards)) return json(res, 400, { error: 'Invalid' });
          env.awards = awards;
          saveEnv(env);
          return json(res, 200, { ok: true });
        } catch(e) { return json(res, 500, { error: e.message }); }
      }
    }

    // Chores
    if (feature === 'chores') {
      const env = findEnv(envSlug);
      if (!env) return json(res, 404, { error: 'Not found' });
      if (req.method === 'GET' && !subId) return json(res, 200, env.chores || []);
      if (req.method === 'POST' && !subId) {
        try {
          const { pw, task, assignee } = await readBody(req);
          if (!isEnvAuth(pw, env)) return json(res, 403, { error: 'Unauthorized' });
          if (!task) return json(res, 400, { error: 'Task required' });
          const chore = { id: Date.now().toString(), task, assignee: assignee || '', done: false,
            date: new Date().toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' }) };
          env.chores = env.chores || [];
          env.chores.push(chore);
          saveEnv(env);
          return json(res, 200, { ok: true, id: chore.id });
        } catch(e) { return json(res, 500, { error: e.message }); }
      }
      if (req.method === 'PUT' && subId) {
        try {
          const { pw } = await readBody(req);
          if (!isEnvAuth(pw, env)) return json(res, 403, { error: 'Unauthorized' });
          const chore = (env.chores || []).find(function(c) { return c.id === subId; });
          if (!chore) return json(res, 404, { error: 'Not found' });
          chore.done = !chore.done;
          saveEnv(env);
          return json(res, 200, { ok: true, done: chore.done });
        } catch(e) { return json(res, 500, { error: e.message }); }
      }
      if (req.method === 'DELETE' && subId) {
        const qs = req.url.includes('?') ? req.url.split('?')[1] : '';
        if (!isEnvAuth(new URLSearchParams(qs).get('pw'), env)) return json(res, 403, { error: 'Unauthorized' });
        env.chores = (env.chores || []).filter(function(c) { return c.id !== subId; });
        saveEnv(env);
        return json(res, 200, { ok: true });
      }
    }

    // Board
    if (feature === 'board') {
      const env = findEnv(envSlug);
      if (!env) return json(res, 404, { error: 'Not found' });
      if (req.method === 'GET' && !subId) return json(res, 200, env.board || []);
      if (req.method === 'POST' && !subId) {
        try {
          const { pw, text, author, image } = await readBody(req);
          if (!isEnvAuth(pw, env)) return json(res, 403, { error: 'Unauthorized' });
          if (!text && !image) return json(res, 400, { error: 'Text or image required' });
          const post = { id: Date.now().toString(), author: author || 'Anonymous',
            text: text || '', image: image || null, reactions: {},
            date: new Date().toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' }) };
          env.board = env.board || [];
          env.board.push(post);
          saveEnv(env);
          return json(res, 200, { ok: true, id: post.id });
        } catch(e) { return json(res, 500, { error: e.message }); }
      }
      if (req.method === 'POST' && subId && action === 'react') {
        try {
          const { emoji, action: act } = await readBody(req);
          const ALLOWED = ['👍','❤️','😂','🔥','😮'];
          if (!ALLOWED.includes(emoji)) return json(res, 400, { error: 'Invalid emoji' });
          const post = (env.board || []).find(function(p) { return p.id === subId; });
          if (!post) return json(res, 404, { error: 'Post not found' });
          post.reactions = post.reactions || {};
          if (act === 'remove') {
            post.reactions[emoji] = Math.max(0, (post.reactions[emoji] || 0) - 1);
            if (post.reactions[emoji] === 0) delete post.reactions[emoji];
          } else {
            post.reactions[emoji] = (post.reactions[emoji] || 0) + 1;
          }
          saveEnv(env);
          return json(res, 200, { ok: true, count: post.reactions[emoji] || 0 });
        } catch(e) { return json(res, 500, { error: e.message }); }
      }
      if (req.method === 'DELETE' && subId) {
        const qs = req.url.includes('?') ? req.url.split('?')[1] : '';
        if (!isEnvAuth(new URLSearchParams(qs).get('pw'), env)) return json(res, 403, { error: 'Unauthorized' });
        env.board = (env.board || []).filter(function(p) { return p.id !== subId; });
        saveEnv(env);
        return json(res, 200, { ok: true });
      }
    }

    // Polls
    if (feature === 'polls') {
      const env = findEnv(envSlug);
      if (!env) return json(res, 404, { error: 'Not found' });
      if (req.method === 'GET' && !subId) return json(res, 200, env.polls || []);
      if (req.method === 'POST' && !subId) {
        try {
          const { pw, question, options } = await readBody(req);
          if (!isEnvAuth(pw, env)) return json(res, 403, { error: 'Unauthorized' });
          if (!question || !Array.isArray(options) || options.length < 2) return json(res, 400, { error: 'Invalid poll' });
          const poll = { id: Date.now().toString(), question,
            options: options.map(function(t) { return { text: t, votes: [] }; }),
            date: new Date().toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' }) };
          env.polls = env.polls || [];
          env.polls.push(poll);
          saveEnv(env);
          return json(res, 200, { ok: true, id: poll.id });
        } catch(e) { return json(res, 500, { error: e.message }); }
      }
      if (req.method === 'POST' && subId && action === 'vote') {
        try {
          const { optionIndex } = await readBody(req);
          const poll = (env.polls || []).find(function(p) { return p.id === subId; });
          if (!poll) return json(res, 404, { error: 'Poll not found' });
          const oi = parseInt(optionIndex, 10);
          if (isNaN(oi) || oi < 0 || oi >= poll.options.length) return json(res, 400, { error: 'Invalid option' });
          poll.options[oi].votes = poll.options[oi].votes || [];
          poll.options[oi].votes.push({ date: new Date().toISOString() });
          saveEnv(env);
          return json(res, 200, { ok: true });
        } catch(e) { return json(res, 500, { error: e.message }); }
      }
      if (req.method === 'DELETE' && subId && !action) {
        const qs = req.url.includes('?') ? req.url.split('?')[1] : '';
        if (!isEnvAuth(new URLSearchParams(qs).get('pw'), env)) return json(res, 403, { error: 'Unauthorized' });
        env.polls = (env.polls || []).filter(function(p) { return p.id !== subId; });
        saveEnv(env);
        return json(res, 200, { ok: true });
      }
    }

    // Scores
    if (feature === 'scores') {
      const env = findEnv(envSlug);
      if (!env) return json(res, 404, { error: 'Not found' });
      if (req.method === 'GET') return json(res, 200, env.scores || []);
      if (req.method === 'PUT') {
        try {
          const { pw, scores } = await readBody(req);
          if (!isEnvAuth(pw, env)) return json(res, 403, { error: 'Unauthorized' });
          if (!Array.isArray(scores)) return json(res, 400, { error: 'Invalid' });
          env.scores = scores;
          saveEnv(env);
          return json(res, 200, { ok: true });
        } catch(e) { return json(res, 500, { error: e.message }); }
      }
    }

    return json(res, 404, { error: 'Not found' });
  }

  // OPTIONS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE', 'Access-Control-Allow-Headers': 'Content-Type' });
    return res.end();
  }

  // Serve uploaded images from DATA_DIR (works whether or not DATA_DIR is inside ROOT)
  if (req.method === 'GET' && url.startsWith('/images/uploads/')) {
    const filename = path.basename(decodeURIComponent(url.replace('/images/uploads/', '')));
    const filePath = path.join(UPLOADS_DIR, filename);
    if (fs.existsSync(filePath)) {
      const mime = MIME[path.extname(filename).toLowerCase()] || 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': mime });
      return res.end(fs.readFileSync(filePath));
    }
    res.writeHead(404, { 'Content-Type': 'text/plain' }); return res.end('Not found');
  }

  // Static files
  let filePath = path.join(ROOT, url === '/' ? '/index.html' : url);
  if (!filePath.startsWith(ROOT)) { res.writeHead(403); return res.end('Forbidden'); }

  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404, { 'Content-Type': 'text/plain' }); return res.end('Not found'); }
    const mime = MIME[path.extname(filePath).toLowerCase()] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': mime });
    res.end(data);
  });
});

server.listen(PORT, () => console.log(`Serving at http://localhost:${PORT}`));
