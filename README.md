# The Westwood Times

A self-contained Node.js news publication website covering UCLA, Westwood, and campus life.
No external dependencies — built with plain Node.js, HTML, CSS, and vanilla JavaScript.

---

## Table of Contents

- [Stack](#stack)
- [Project Structure](#project-structure)
- [Running Locally](#running-locally)
- [Deployment](#deployment)
- [Server & API](#server--api)
- [Data Storage](#data-storage)
- [Password System](#password-system)
- [Environments System](#environments-system)
- [Admin Panel](#admin-panel)
- [Frontend Architecture](#frontend-architecture)
- [CSS Modules](#css-modules)
- [JavaScript Modules](#javascript-modules)
- [Content Categories](#content-categories)
- [Article System](#article-system)
- [Ad System](#ad-system)
- [Featured Articles](#featured-articles)
- [Search System](#search-system)
- [Navigation System](#navigation-system)
- [SEO](#seo)
- [Design System](#design-system)
- [Hardcoded Values](#hardcoded-values)
- [Security Notes](#security-notes)
- [AI Editing Rules](#ai-editing-rules)
- [Tasks](#tasks)

---

## Stack

- **Backend:** Node.js (built-in `http`, `fs`, `path` — zero npm dependencies)
- **Frontend:** Vanilla HTML, CSS, JavaScript
- **Storage:** JSON files on disk (configurable via `DATA_DIR` env var)
- **Image uploads:** Base64 → disk (`$DATA_DIR/uploads/`, served at `/images/uploads/`)
- **Deployment:** Railway.app (configured via `railway.json`)
- **Node requirement:** `>=18.0.0`

---

## Project Structure

```
/
├── server.js                  # Node.js HTTP server + all API routes
├── package.json               # No dependencies, just start script
├── railway.json               # Railway deployment config
├── .railwayignore             # Files excluded from Railway deploy
├── robots.txt                 # Search engine crawl rules + sitemap pointer
├── .gitignore
│
├── index.html                 # Homepage
├── article.html               # Static article template (example)
├── about.html                 # About page + admin panel (password-gated)
├── subscribe.html
├── newsletter.html
├── sponsorships.html
├── careers.html
├── [slug].html                # 70+ individual article files
│
├── css/
│   ├── reset.css              # Universal reset
│   ├── main.css               # Design system, header, nav, search
│   ├── ticker.css             # Breaking news ticker
│   ├── hero.css               # Homepage hero section
│   ├── grid.css               # Story card grids, section layouts
│   ├── article.css            # Article page layout
│   └── sidebar.css            # Ads, footer, trending
│
├── js/
│   ├── nav.js                 # Hamburger, scroll spy, active tabs
│   ├── ticker.js              # Animated ticker loop
│   ├── search-data.js         # Builds article + environment search index from API
│   ├── search.js              # Search UI, filtering, env gate modal
│   ├── featured.js            # Featured slider population
│   ├── custom-articles.js     # Injects DB articles into homepage grid
│   ├── ads.js                 # Ad loading and injection
│   ├── env.js                 # Shared JS for all generated environment pages
│   └── video.js               # Video spotlight section
│
├── css/
│   └── env.css                # Shared dark-theme CSS for all environment pages
│
├── data/
│   ├── articles.json          # DB-created articles (auto-created if missing)
│   ├── ads.json               # Ad entries (auto-created if missing)
│   ├── featured.json          # Featured article list, max 5 (auto-created)
│   ├── passwords.json         # Limited passwords with publish slot counts (auto-created)
│   ├── blackout.json          # Default blackout chart data (auto-created)
│   └── environments.json      # All custom environments + their feature data (auto-created)
│
├── images/
│   ├── twt_logo_new.png       # Primary site logo + favicon
│   ├── logo.svg
│   └── uploads/               # User-uploaded images (auto-created; path may differ if DATA_DIR is set)
│
└── legal/
    ├── parody.html
    ├── privacy.html
    ├── terms.html
    └── cookies.html
```

---

## Running Locally

```bash
node server.js
# Serves at http://localhost:3000
```

To override the port or master password:
```bash
PORT=8080 MASTER_PW=yourpassword node server.js
```

---

## Deployment

Configured for [Railway.app](https://railway.app). The `railway.json` sets:
- Builder: NIXPACKS
- Start command: `node server.js`
- Restart policy: ON_FAILURE, max 3 retries

**Deploy command (run from project folder `cnnheadlines`):**
```bash
cd ~/Desktop/cnnheadlines && railway up
```

**First-time setup:**
```bash
npm install -g @railway/cli
railway login
railway init
railway variables set MASTER_PW=yourpassword
railway up
```

**Persistent storage on Railway (required to survive redeploys):**

All mutable data (articles, environments, ads, passwords, uploads) is stored under `DATA_DIR`. To persist it across deploys:

1. In the Railway dashboard, attach a Volume to your service and set the mount path to `/data`
2. Add the environment variable `DATA_DIR=/data` to your service
3. The server will automatically create all JSON files and the uploads folder inside `/data` on first start

Without a volume, every `railway up` resets all runtime data. Environments are regenerated from `environments.json` on startup, so as long as `environments.json` lives on the volume the pages come back automatically. Volumes require a paid Railway plan.

**Live site:** https://www.thewestwoodtimes.com
**Google Search Console:** verified, sitemap submitted at `/sitemap.xml`

---

## Server & API

All routes are handled in `server.js`. The server also serves all static files (HTML, CSS, JS, images).

### Environment Variables

| Variable | Default | Purpose |
|---|---|---|
| `PORT` | `3000` | HTTP listen port |
| `MASTER_PW` | `'Zofivuqi47'` | Admin password for protected endpoints |
| `DATA_DIR` | `./data` (inside project root) | Directory for all JSON data files and uploaded images. Set to `/data` on Railway when a volume is mounted there. |

### API Endpoints

#### Auth

| Method | Path | Description |
|---|---|---|
| POST | `/api/auth` | Validates password. Body: `{ pw }`. Returns `{ ok, role, uses? }`. Does NOT consume a use on login — uses are consumed on publish. |

Response for master: `{ ok: true, role: 'master' }`
Response for limited: `{ ok: true, role: 'limited', uses: N }`
Response for invalid: `{ ok: false, role: null }`

#### Passwords (master only)

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/passwords?pw=MASTER` | Master | Returns all limited passwords with remaining publish slots |
| POST | `/api/passwords` | Master | Creates or updates a limited password. Body: `{ pw: masterPw, newPw, uses }` |
| DELETE | `/api/passwords/:pw?pw=MASTER` | Master | Deletes a limited password by value |

#### Articles

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/articles` | None | Returns all articles |
| GET | `/api/articles?pw=X` | Limited PW | Returns articles tagged to that password |
| GET | `/api/articles?pw=MASTER` | Master PW | Returns all articles |
| POST | `/api/create-article` | Password in body | Creates article + writes HTML file. Consumes one publish slot if limited password. |
| DELETE | `/api/articles/:slug` | None | Deletes article + removes HTML file |
| GET | `/api/all-articles` | None | Returns `{ custom, static }` — DB articles + all static HTML files |

#### Ads

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/ads` | None | Returns all ads |
| POST | `/api/create-ad` | None | Creates a new ad |
| DELETE | `/api/ads/:id` | None | Deletes ad by ID |

#### Featured

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/featured` | None | Returns featured articles list |
| PUT | `/api/featured` | Master PW | Updates featured list (body: `{ pw, articles }`) |

#### Images

| Method | Path | Description |
|---|---|---|
| POST | `/api/upload-image` | Accepts `{ filename, data }` where data is base64. Returns `{ ok, path }` |

#### Environments (public)

| Method | Path | Description |
|---|---|---|
| GET | `/api/environments/public` | Returns `[{slug, name, question}]` for all environments — no auth required. Used by search to populate `window.ENV_SEARCH`. |
| GET | `/api/env/:slug` | Returns public info for a single environment (slug, name, question, description, eyebrow, features). Used by the gate overlay. |
| POST | `/api/env/:slug/auth` | Body: `{ pw }`. Validates the room password. Returns `{ ok: true/false }`. |

#### Environments (master only)

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/environments?pw=MASTER` | Master | Returns all environments with full metadata (no data arrays). |
| POST | `/api/environments` | Master (in body) | Creates a new environment. Writes `environments.json` and generates `/{slug}.html`. |
| PUT | `/api/environments/:slug` | Master (in body) | Edits an existing environment's metadata (name, eyebrow, description, question, password, features, members). Regenerates the HTML page. |
| DELETE | `/api/environments/:slug?pw=MASTER` | Master | Deletes the environment from `environments.json` and removes the HTML file. |

#### Environment features (room password required)

All feature routes are under `/api/env/:slug/`. Writes require `pw` in the request body or query string matching either the master password or the room password.

| Method | Path | Description |
|---|---|---|
| GET | `/api/env/:slug/blackout` | Returns blackout chart data `[{name, count}]` |
| POST | `/api/env/:slug/blackout/increment` | Body: `{pw, name}`. Increments blackout count for a person. |
| POST | `/api/env/:slug/blackout/decrement` | Body: `{pw, name}`. Decrements (min 0). |
| GET | `/api/env/:slug/awards` | Returns awards array |
| PUT | `/api/env/:slug/awards` | Body: `{pw, awards}`. Replaces full awards list. |
| GET | `/api/env/:slug/chores` | Returns chores list |
| POST | `/api/env/:slug/chores` | Body: `{pw, text}`. Adds a chore. |
| PUT | `/api/env/:slug/chores/:id` | Body: `{pw}`. Toggles chore completion. |
| DELETE | `/api/env/:slug/chores/:id?pw=X` | Deletes a chore. |
| GET | `/api/env/:slug/board` | Returns message board posts. |
| POST | `/api/env/:slug/board` | Body: `{pw, text, author, image?}`. Posts a message. `image` is a URL from `/api/upload-image`. New posts get `reactions: {}`. |
| DELETE | `/api/env/:slug/board/:id?pw=X` | Deletes a board post. |
| POST | `/api/env/:slug/board/:id/react` | Body: `{emoji}`. Increments reaction count. Allowed: 👍❤️😂🔥😮. No auth required (open reactions). |
| GET | `/api/env/:slug/polls` | Returns polls list. |
| POST | `/api/env/:slug/polls` | Body: `{pw, question, options}`. Creates a poll. |
| POST | `/api/env/:slug/polls/:id/vote` | Body: `{option}`. Records a vote on a poll option. |
| DELETE | `/api/env/:slug/polls/:id?pw=X` | Deletes a poll. |
| GET | `/api/env/:slug/scores` | Returns scores leaderboard `[{name, score}]` sorted descending. |
| PUT | `/api/env/:slug/scores` | Body: `{pw, scores}`. Replaces full scores list. |

#### SEO

| Method | Path | Description |
|---|---|---|
| GET | `/sitemap.xml` | Dynamically generated sitemap listing all pages |
| GET | `/robots.txt` | Static file — allows all crawlers, points to sitemap |

### POST /api/create-article payload

```json
{
  "headline": "Required",
  "category": "Required — social|village|sports|community|clubs|hill",
  "body": "Article text. Paragraphs separated by double newlines.",
  "dek": "Optional subheadline/summary",
  "image": "Optional image URL — falls back to picsum",
  "date": "Optional — defaults to today",
  "password": "The submitting user's password — used to consume a publish slot"
}
```

The server generates a slug from the headline (lowercase, hyphenated, max 60 chars) and writes a complete HTML file to disk at `/{slug}.html`. If the password is a limited password, one publish slot is consumed. If no slots remain, returns 403.

### POST /api/create-ad payload

```json
{
  "image": "Required — URL or path to ad image",
  "label": "Optional label shown on ad",
  "url": "Optional destination URL",
  "placement": "all | homepage | articles — defaults to all"
}
```

### PUT /api/featured payload

```json
{
  "pw": "MASTER_PW value",
  "articles": [
    { "slug": "article-slug", "headline": "Title", "category": "social", "image": "https://..." }
  ]
}
```

Max 5 articles. Excess items are truncated silently.

---

## Data Storage

All data is stored as JSON files under `DATA_DIR` (defaults to `./data`). The server auto-creates all files if missing. Set the `DATA_DIR` environment variable to a Railway Volume mount path (e.g. `/data`) to persist data across redeploys.

### data/articles.json

Array of article objects:
```json
[
  {
    "slug": "url-safe-title",
    "headline": "Full Title",
    "category": "social",
    "body": "Paragraph one.\n\nParagraph two.",
    "dek": "Optional summary",
    "image": "https://...",
    "date": "Apr 4, 2026",
    "password": "",
    "seed": 4821
  }
]
```

Newest articles are prepended (index 0 = most recent).

### data/ads.json

```json
[
  {
    "id": "1712345678901",
    "image": "https://...",
    "label": "Sponsor Name",
    "url": "https://sponsor.com",
    "placement": "all",
    "date": "Apr 4, 2026"
  }
]
```

### data/featured.json

Array of up to 5 article references. Stores the full image URL (including resolved picsum fallback) so the slider always shows the correct image:
```json
[
  { "slug": "article-slug", "headline": "Title", "category": "sports", "image": "https://..." }
]
```

### data/passwords.json

Array of limited passwords with publish slot counts:
```json
[
  { "pw": "friend-password", "uses": 3 }
]
```

`uses` = number of articles this password can still publish. Decremented by 1 each time `POST /api/create-article` is called with this password. Entry is removed when `uses` reaches 0. The master password is never stored here — it comes from the `MASTER_PW` env variable and has unlimited publishes.

### data/blackout.json

Default blackout chart data used to seed the Retirement Home environment on first startup:
```json
[
  { "name": "Ryan Burack", "count": 3 },
  { "name": "Mason Lee", "count": 2 }
]
```

Once the Retirement Home is seeded into `environments.json`, this file is no longer read at runtime — blackout data lives inside the environment object.

### data/environments.json

Array of environment objects. Each environment stores both its config and all live feature data inline:
```json
[
  {
    "slug": "retirement-home",
    "name": "Retirement Home",
    "eyebrow": "THE WESTWOOD TIMES",
    "description": "The private retirement home network.",
    "question": "What Is The Wifi Password",
    "password": "TikiTiki!",
    "features": ["blackout"],
    "members": ["Ryan Burack", "Mason Lee"],
    "blackout": [{ "name": "Ryan Burack", "count": 3 }],
    "awards": [],
    "chores": [],
    "board": [
      {
        "id": "1712345678901",
        "author": "Mason",
        "text": "Hello world",
        "image": "/images/uploads/abc.jpg",
        "reactions": { "👍": 2, "❤️": 1 },
        "date": "Apr 6, 2026"
      }
    ],
    "polls": [
      {
        "id": "1712345678902",
        "question": "Best dining hall?",
        "options": [{ "text": "De Neve", "votes": 3 }, { "text": "Feast", "votes": 1 }]
      }
    ],
    "scores": [{ "name": "Mason Lee", "score": 42 }]
  }
]
```

**Generated HTML files:** For each environment entry, the server writes `/{slug}.html` to the project root at creation time and on every startup (via `regenEnvPages()`). If the HTML file is lost (e.g., after a Railway redeploy without a volume), it is automatically restored from `environments.json` on next boot.

---

## Password System

The site uses a two-tier password system managed in `about.html`.

### How it works

**Master password** (`MASTER_PW` env var):
- Unlimited logins, unlimited article publishes
- Access to: article creation, ad management, featured article picker, password manager

**Limited passwords** (stored in `data/passwords.json`):
- Unlimited logins — uses are NOT consumed on login
- Each password has a `uses` count = number of articles they can publish
- After publishing, `uses` decrements by 1. At 0, the password is deleted
- Access to: article creation only (their articles only, no admin tools)

### How to log in

Go to `thewestwoodtimes.com/about.html`. The contact form doubles as the password gate — enter the password in the **Message** field and click Send.

### Creating limited passwords

In the admin panel (master session only), enter a password string and number of publish slots, then click "Add Password". The password is immediately usable on any device.

### Admin panel commands (master only)

The contact form also supports shortcut commands when signed in as master:
- **Firstname field** = new limited password to create
- **Lastname field** = number of publish slots
- Fill both + send → creates the password and logs you in

---

## Environments System

Custom environments are private, password-gated mini-sites attached to The Westwood Times. Each environment is a generated HTML page (`/{slug}.html`) with a dark-theme gate overlay, a tab bar, and a set of interactive features. All feature data is stored inline in `data/environments.json`.

### Architecture

- **Config + data in one object** — each environment in `environments.json` stores both its settings (name, password, features) and all live feature data (blackout chart, board posts, poll votes, etc.) in a single JSON object.
- **Shared rendering** — all generated pages load `css/env.css` and `js/env.js`. Per-environment config is baked into the HTML as `window.ENV_CONFIG` at generation time.
- **Auth** — a gate overlay prompts for the security question/password. On success, the password is stored in `sessionStorage` as `env_{slug}` and all subsequent write API calls include it automatically.
- **Startup regeneration** — on every server start, all env HTML pages are regenerated from `environments.json`. This restores pages lost after a Railway redeploy (as long as the JSON file is on a persistent volume).

### Features

Each environment can have any combination of these features (selected at creation/edit time):

| Feature | Description |
|---|---|
| `blackout` | Bar chart tracking a count per member. Members can be incremented/decremented with password confirmation. Top scorer gets a gold bar. |
| `awards` | Card grid of award entries (title, recipient, color). Editable inline. |
| `chores` | Checklist of tasks. Add, toggle completion, delete. |
| `board` | Message board with author name, text, optional image attachment (uploads to `/api/upload-image`), and 5-emoji reaction bar (👍❤️😂🔥😮). Reactions increment without deduplication. |
| `polls` | Create polls with multiple options. Click a bar to vote. Results shown as filled bars with vote counts. |
| `scores` | Numeric leaderboard sorted highest-first with 🥇🥈🥉 medals. Bulk-editable via a score editor form. |

### Creating an environment (admin panel)

1. Sign in as master at `about.html`
2. Go to the **New Environments** tab
3. Fill in: Name, Slug (auto-generated from name), Description, Eyebrow, Security Question, Password
4. Check the desired features
5. Add member names (used to pre-populate blackout and scores)
6. Click **Create Environment** — the page is written to `/{slug}.html` immediately

### Editing an environment

In the **New Environments** tab, all created environments are listed with an **Edit** button. Clicking it opens a modal pre-filled with the current config. Saving calls `PUT /api/environments/:slug` and regenerates the HTML page. Feature data (board posts, votes, etc.) is never touched by the edit form — only metadata.

### Retirement Home

The Retirement Home (`/retirement-home.html`) is automatically seeded into `environments.json` on first server startup using the data from `blackout.json`. After seeding, it appears in the admin environment list alongside all custom environments and is fully editable (name, question, password, features, members). Its page is regenerated from the shared template on every startup.

### Searching for environments

All environment names appear in the site search bar. Typing a name shows a 🔒 result. Clicking it opens a gate modal with the environment's custom security question. Entering the correct password stores it in `sessionStorage` and navigates to the environment page.

---

## Admin Panel

The admin panel lives at `about.html` behind the contact form password gate. It uses a **tabbed layout** with six tabs:

| Tab | Access | Description |
|---|---|---|
| Featured Articles | Master only | Drag-select up to 5 articles to pin to the homepage featured slider |
| Article Creation | All passwords | Write and publish a new article |
| New Environments | Master only | Create, edit, and delete custom environment pages |
| New Passwords | Master only | Create limited passwords with publish slot counts |
| Created Articles | All passwords | View and delete published articles |
| Ads | Master only | Create and delete ad entries |

Master-only tabs are hidden automatically when a limited password is used to log in.

---

## Frontend Architecture

Every HTML page follows the same structure:

```
top bar → header → ticker → [page content] → footer
```

Script load order on homepage:
```html
ticker.js → nav.js → search-data.js → search.js → featured.js → custom-articles.js → ads.js → video.js
```

Script load order on article pages:
```html
ticker.js → nav.js → search-data.js → search.js → ads.js
```

Legal pages use `../` relative paths for all CSS and JS assets.

---

## CSS Modules

Each CSS file has a single responsibility. Load order in HTML:

```html
<link rel="stylesheet" href="css/reset.css">
<link rel="stylesheet" href="css/main.css">
<link rel="stylesheet" href="css/ticker.css">
<link rel="stylesheet" href="css/hero.css">      <!-- homepage only -->
<link rel="stylesheet" href="css/grid.css">
<link rel="stylesheet" href="css/sidebar.css">
<link rel="stylesheet" href="css/article.css">   <!-- article pages only -->
```

### reset.css
Universal box-sizing, zero margins/padding, font inheritance for form elements, responsive images.

### main.css
The core design system. Contains:
- CSS custom properties (colors, fonts, dimensions)
- Top bar (`.topbar-inner`, `.topbar-date`, `.topbar-tagline`, `.topbar-links`)
- Site header (`.header-inner`, `.logo-link`, `.site-logo`, `.primary-nav`)
- Hamburger button (`.hamburger`, `span` bars)
- Mobile drawer (`.mobile-nav-drawer`)
- Search overlay (`.search-overlay`, `.search-input`, `.search-results`, `.search-close`)
- Responsive breakpoints at 1024px and 480px

### ticker.css
- `.breaking-ticker` — fixed bar below header
- `.ticker-label` — category badge on left
- `.ticker-track-wrapper` — overflow hidden container
- `.ticker-track` — animated sliding element
- `.ticker-item` — individual headline
- `.ticker-sep` — pipe separator
- Pauses animation on hover

### hero.css
Homepage hero layout:
- `.hero-section` — full-width container
- `.hero-primary` — large left story (image + overlay text)
- `.hero-secondary` — right column stack of 2 stories
- `.hero-strip` — 3-column row below hero
- Reflows to single column on mobile

### grid.css
Story card grid system:
- `.fslider-wrap` — featured slider (dark background, horizontal scroll)
- `.fslider-card` — individual featured card
- `.story-section` — section container with heading
- `.row-grid` — horizontal scrolling flex row of cards (overflow-x: auto, scrollbar hidden)
- `.row-card` — individual article card (flex: 0 0 260px, shrinks to 220px on tablet, 180px on mobile)
- `.category-tag` — colored label badge
- `.video-section` — dark theme video spotlight
- Responsive breakpoints at 1024px and 640px

**Category tag colors** (applied via `.tag-[category]` classes):
- `.tag-social` → `#8B2FC9` (purple)
- `.tag-village` → `#B5601E` (brown)
- `.tag-sports` → `#2774AE` (blue)
- `.tag-community` → `#1a8070` (teal)
- `.tag-clubs` → `#C88B14` (gold)
- `.tag-hill` → `#1e4d8c` (navy)
- `.tag-opinion` → `#555555` (gray)

### article.css
- `.article-page` — max-width centered container
- `.article-breadcrumb` — nav trail at top
- `.article-hero-img` — full-width hero image
- `.article-header` — title/meta block
- `.article-headline` — large H1
- `.article-dek` — subheadline paragraph
- `.article-meta` — byline + date + share buttons
- `.article-body` — prose container (first-letter drop cap)
- `.article-body blockquote` — pull quote with blue left border
- `.article-tags` — tag pills at bottom
- `.share-btn` — share/copy/post buttons

### sidebar.css
- `.ad-slot` — advertisement container
- `.ad-banner-img` — ad image fill
- Footer: `.footer-inner`, `.footer-logo`, `.footer-nav`, `.footer-col`
- `.footer-divider`, `.footer-bottom` — copyright strip

---

## JavaScript Modules

### nav.js

Handles all navigation interaction:
- Toggles `.mobile-nav-drawer` open/closed via `#hamburger-btn`
- Nav tab clicks: on homepage, extracts `data-section` attribute and smooth-scrolls to `#section-[name]` with `OFFSET = 86px`. On article pages (where the section doesn't exist), lets the link navigate normally to `index.html#section-[name]`
- IntersectionObserver watches each `.story-row[id]` and adds `.active` to matching nav tab
- Closes mobile menu on outside click

### ticker.js

Animates the breaking news ticker:
- Clones `.ticker-track` for seamless loop
- Moves at `speed = 0.55` pixels per `requestAnimationFrame`
- Resets position when first clone scrolls fully out
- Pauses on `mouseenter`, resumes on `mouseleave`
- Recalculates on `window resize`

### search-data.js

Builds the search index on page load:
- Fetches `/api/all-articles` → `window.SEARCH_INDEX = [{ slug, title }, ...]`
- Fetches `/api/environments/public` → `window.ENV_SEARCH = [{ slug, name, question }, ...]`
- Both fetches run in parallel; either can fail independently without breaking the other

### search.js

Powers the search UI:
- `#search-btn` opens `.search-overlay`
- `#search-close` and Escape key close it
- Input filters both `window.SEARCH_INDEX` (articles) and `window.ENV_SEARCH` (environments)
- Article results render as `<a>` links with matched text highlighted
- Environment results render with a 🔒 icon and a click handler that opens `showEnvGate()`
- `showEnvGate(slug, question, base)` — builds a modal showing the environment's custom security question, POSTs to `/api/env/:slug/auth`, stores the password in `sessionStorage` on success, and navigates to `/{slug}.html`
- Detects `/legal/` subdirectory and adjusts link paths accordingly

### featured.js

Populates the featured slider:
- Fetches `/api/featured`
- Renders `.fslider-card` elements with image, category tag, and headline
- Maps category names to hex colors (17 categories defined)
- Falls back to `picsum.photos/seed/{seed|slug}/400/225` if image is missing
- Injects into `#featured-slider-track` and shows `#featured-slider-section`

### custom-articles.js

Injects database-created articles into the homepage grid:
- Fetches `/api/articles`
- Matches articles to their section by category
- Creates `.row-card` elements and prepends them to the correct `.row-grid`

### ads.js

Loads and injects ads:
- Fetches `/api/ads` on page load
- Detects current page (homepage vs article) from `window.location.pathname`
- Filters ads by `placement` field (`all`, `homepage`, `articles`)
- Injects into `.ad-slot` elements in order
- Converts relative image paths to absolute, ensures `https://` on external URLs

### env.js

Shared JavaScript loaded by all generated environment pages. Reads `window.ENV_CONFIG` baked into the page HTML and drives the full environment UI:

- `initGate()` — checks `sessionStorage.getItem('env_' + slug)`, shows gate overlay if not authenticated, POSTs to `/api/env/:slug/auth` to validate
- `buildTabs()` — creates tab buttons and panels for each active feature
- `loadFeature(f)` — dispatches to individual feature renderers
- `apiGet/apiPost/apiPut/apiDel` — helpers that auto-inject `pw: storedPw` from sessionStorage into all write requests
- Feature renderers: `renderBlackout()`, `renderAwards()`, `renderChores()`, `renderBoard()`, `renderPolls()`, `renderScores()`
- Board image upload: file input → FileReader → base64 → `POST /api/upload-image` → attach URL to post
- Board reactions: emoji buttons that `POST /api/env/:slug/board/:id/react` and update in-place without full reload

`window.ENV_CONFIG` shape:
```json
{
  "slug": "retirement-home",
  "name": "Retirement Home",
  "question": "What Is The Wifi Password",
  "features": ["blackout"],
  "members": ["Ryan Burack", "Mason Lee"],
  "description": "...",
  "eyebrow": "THE WESTWOOD TIMES"
}
```

### env.css

Shared dark-theme stylesheet for all generated environment pages. Key classes:

| Class | Purpose |
|---|---|
| `.env-gate`, `.env-gate-box` | Full-screen gate overlay |
| `.rh-hero` | Dark gradient hero section with eyebrow + title |
| `.rh-tabs-bar`, `.rh-tab-btn.active` | Tab navigation (gold underline on active) |
| `.rh-bars`, `.rh-bar`, `.rh-bar.top` | Blackout bar chart (gold for top scorer) |
| `.rh-award-card.gold/blue/red/green` | Award cards by color |
| `.env-chore-item` | Chore row with checkbox and delete button |
| `.env-message`, `.env-message-image` | Board post and attached image |
| `.env-react-btn`, `.env-react-btn.lit` | Emoji reaction buttons (gold when count > 0) |
| `.env-poll-bar-fill` | Animated poll result bar |
| `.env-scores-row` | Leaderboard row |
| `.env-dark-input/select/btn/textarea` | Dark-themed form elements |

### video.js

Controls the video spotlight section:
- `.video-list-item` elements each have a `data-vid` attribute
- Click updates the main `.video-thumb` image src and `.video-caption` text
- Tracks selected state with `.active` class

---

## Content Categories

The site has 7 content categories. These drive routing, tag colors, and section IDs.

| Category | Section ID | Tag Class | Color |
|---|---|---|---|
| Social | `#section-social` | `.tag-social` | `#8B2FC9` |
| Village News | `#section-village` | `.tag-village` | `#B5601E` |
| Sports | `#section-sports` | `.tag-sports` | `#2774AE` |
| Community | `#section-community` | `.tag-community` | `#1a8070` |
| Clubs | `#section-clubs` | `.tag-clubs` | `#C88B14` |
| Hill | `#section-hill` | `.tag-hill` | `#1e4d8c` |
| Opinion | `#opinion-heading` | `.tag-opinion` | `#555555` |

When creating articles via API, `category` must be one of: `social`, `village`, `sports`, `community`, `clubs`, `hill`.

---

## Article System

### Static articles
Pre-written HTML files committed to the repo. The server parses them at runtime to extract title, category, and image for search indexing and the featured picker. They are not stored in `articles.json`.

### Dynamic articles (DB articles)
Created via `POST /api/create-article`. The server:
1. Checks publish slot availability if a limited password is provided (returns 403 if exhausted)
2. Generates a slug (lowercase, hyphenated, max 60 chars)
3. Writes a full HTML file to `/{slug}.html` using `buildArticleHtml()`
4. Saves metadata to `data/articles.json`
5. Decrements the password's publish slot count

`buildArticleHtml()` produces a complete standalone page with:
- Full site header, footer, ticker, nav
- Breadcrumb navigation
- Hero image (falls back to `https://picsum.photos/seed/{seed}/1400/560`)
- Article body (double-newline → `<p>` tags)
- Full Open Graph and Twitter meta tags using the article's headline, dek, and image
- Canonical URL tag
- Favicon

All user content is escaped via `escHtml()`.

---

## Ad System

Ads are created via `POST /api/create-ad` and stored in `data/ads.json`. On page load, `ads.js` fetches all ads and injects them into `.ad-slot` elements.

**Placement targeting:**
- `"all"` — appears on every page
- `"homepage"` — only on `index.html`
- `"articles"` — only on article pages (any page not named `index.html`)

If there are more ads than slots, only the first N ads (matching page type) fill the available slots.

---

## Featured Articles

Up to 5 articles can be pinned to the featured slider on the homepage. Managed via the admin panel (master only) or directly via API:
- `GET /api/featured` — read current featured list
- `PUT /api/featured` — update list (requires master password in body)

Featured articles are displayed by `featured.js` in `#featured-slider-track`. Each card links to `/{slug}.html`.

**Important:** The featured picker resolves the full image URL (including picsum fallback using the article's numeric seed) before saving to `featured.json`. This ensures the slider shows the correct image even for articles without an explicit image URL.

---

## Search System

Search is client-side. On page load, `search-data.js` builds two indexes:

- `window.SEARCH_INDEX` — all articles (from `/api/all-articles`), both DB-created and static HTML files
- `window.ENV_SEARCH` — all environment names and their security questions (from `/api/environments/public`)

When the user opens the search overlay and types, `search.js` filters both indexes simultaneously. Article matches link directly to `/{slug}.html`. Environment matches show a 🔒 icon and open a gate modal on click — the modal shows the environment's custom security question and validates the password server-side before navigating.

Static HTML files are indexed by `/api/all-articles`, which reads each `.html` file and extracts the `<title>` tag. Environment HTML files are excluded from the article index (they appear in `ENV_SEARCH` instead).

---

## Navigation System

Primary nav tabs on desktop correspond to homepage sections:

| Tab label | `data-section` | Scrolls to |
|---|---|---|
| Social | `social` | `#section-social` |
| Village News | `village` | `#section-village` |
| Sports | `sports` | `#section-sports` |
| Community | `community` | `#section-community` |
| Clubs | `clubs` | `#section-clubs` |
| Hill | `hill` | `#section-hill` |

Scroll offset is `86px` to account for the fixed header (54px) + ticker (32px).

On article pages, nav tabs navigate to `index.html#section-[name]` and do not call `preventDefault()`.

---

## SEO

### robots.txt
Located at `/robots.txt`. Allows all crawlers and points to the sitemap:
```
User-agent: *
Allow: /
Sitemap: https://www.thewestwoodtimes.com/sitemap.xml
```

### sitemap.xml
Dynamically generated at `/sitemap.xml` by server.js. Lists:
- Homepage (`priority: 1.0`, `changefreq: daily`)
- All dynamic articles from `articles.json` (`priority: 0.8`, `changefreq: weekly`)
- All static HTML article files (`priority: 0.7`, `changefreq: monthly`)

Excludes: `index`, `about`, `article`, `sponsorships`, `careers`, `newsletter`, `subscribe`, and all environment slugs (read live from `environments.json` at request time).

### Meta tags
All pages have:
- `<meta name="description">` — pulled from article dek, or a hardcoded description for index/about
- `<link rel="canonical">` — absolute URL for the page
- `<meta property="og:title/description/url/image/type">`
- `<meta name="twitter:card/title/description/image">`
- `<link rel="icon">` — favicon using `images/twt_logo_new.png`

### Google Search Console
Property verified at `https://www.thewestwoodtimes.com` via HTML meta tag on `index.html`. Sitemap submitted. Do not remove the `google-site-verification` meta tag from `index.html`.

---

## Design System

### Colors

| Name | Hex | Used for |
|---|---|---|
| Primary blue | `#2774AE` | UCLA brand, sports tags, links |
| Dark header | `#003B5C` | Header background |
| Topbar | `#00243a` | Top bar background |
| UCLA gold | `#FFD100` | Accents, active nav underline |
| Body bg | `#fafaf9` | Page background |
| Text | `#111111` | Body text |
| Text muted | `#6b6b6b` | Bylines, meta |
| Borders | `#e4e4e2` | Dividers, card borders |
| Breaking red | `#cc0000` | Subscribe page accent |

### Typography

- Font stack: `'Helvetica Neue', Helvetica, Arial, sans-serif`
- Heading weights: 700–900
- Body weight: 400

### Layout

- Max content width: `1260px`
- Topbar height: `30px`
- Header height: `54px`
- Ticker height: `32px`
- Total fixed nav offset: `86px`

### Responsive Breakpoints

- `1024px` — hide primary nav, show hamburger, collapse some grids
- `640px` — single-column layouts, smaller fonts, full-width elements
- `480px` — further mobile compression

---

## Hardcoded Values

These values appear in source files and would need to be updated if the publication changes:

| Value | Location | Notes |
|---|---|---|
| Publication name: "The Westwood Times" | All HTML files, server.js | In `<title>`, header, footer |
| Tagline: "Independent · Accurate · Essential" | All HTML files | In top bar and footer |
| Location: "Westwood, Los Angeles" | Footer in all HTML | |
| Founded: "Est. 2026" | Footer in all HTML | |
| Logo file: `images/twt_logo_new.png` | All HTML files | Referenced directly, also used as favicon |
| Base URL: `https://www.thewestwoodtimes.com` | server.js `BASE_URL` | Used in sitemap, canonical, and OG tags |
| Google site verification tag | index.html | Do not remove |
| editorial@westwoodtimes.com | Legal pages | |
| corrections@westwoodtimes.com | Legal pages | |
| Picsum fallback images | server.js | `https://picsum.photos/seed/...` |
| Nav scroll offset: `86` | js/nav.js `OFFSET` | Must match actual header + ticker height |
| Max featured articles: `5` | server.js | In `PUT /api/featured` handler |
| Max slug length: `60` | server.js | In `slugify()` |
| Default byline: "TWT Staff" | server.js `buildArticleHtml()` | |

---

## Security Notes

- **Master password** is set via `MASTER_PW` environment variable. The fallback hardcoded value in `server.js` should be treated as a secret — do not commit a real password as the fallback.
- **Password validation is server-side only.** The master password never appears in client-side code. Limited passwords are validated via `/api/auth` and never exposed to the browser.
- **Publish slots are enforced server-side.** Clients cannot bypass the slot limit by calling `/api/create-article` directly — the server checks `passwords.json` independently.
- **XSS**: All user-provided content rendered in HTML is escaped via `escHtml()` in `server.js`. Do not bypass this.
- **Path traversal**: Static file serving validates that `filePath.startsWith(ROOT)`. Do not remove this check.
- **CORS**: `OPTIONS` requests return open CORS headers. Lock this down if the API should not be publicly accessible.
- **No authentication on ad endpoints**: `POST /api/create-ad` and `DELETE /api/ads/:id` have no password protection. Add a check if needed.

---

## AI Editing Rules

Follow these rules strictly when making any changes to this codebase:

### General

1. **No external npm packages.** The server uses only built-in Node.js modules. Do not add a `dependencies` section to `package.json` unless explicitly asked.
2. **No framework migrations.** Do not rewrite into Express, Next.js, React, or any other framework. All code is intentionally vanilla.
3. **No TypeScript.** All JS files are plain `.js`.
4. **Preserve the zero-dependency philosophy.** Any new backend feature should use `fs`, `http`, `path`, or other built-in modules only.

### HTML Files

5. **Every HTML page must include the full header and footer.** Do not create partial templates — each file is standalone.
6. **CSS and JS load order must be preserved.** Do not reorder or remove stylesheet links. See [Frontend Architecture](#frontend-architecture) for correct order.
7. **Legal pages use `../` relative paths** for all CSS/JS assets. All other pages use root-relative paths (`css/`, `js/`, `images/`).
8. **Do not rename category slugs** (`social`, `village`, `sports`, `community`, `clubs`, `hill`). They are used as CSS class suffixes, section IDs, API filters, and nav `data-section` attributes simultaneously.
9. **Do not remove the Google site verification meta tag** from `index.html`. Removing it breaks Search Console verification.
10. **Each page must have exactly one favicon link** (`<link rel="icon" type="image/png" href="images/twt_logo_new.png">`).

### CSS

11. **Add new styles to the appropriate module**, not to `main.css` by default. Use `article.css` for article pages, `grid.css` for story card layouts, `sidebar.css` for footer/ads.
12. **Do not add inline styles** to HTML files. Use CSS classes.
13. **Respect the responsive breakpoints** at `1024px` and `640px`. Any new layout component needs mobile rules.
14. **Category tag colors are defined in `grid.css`** as `.tag-[category]` classes. If adding a new category, add its color there and also in `featured.js`'s color map.
15. **`.row-grid` is a horizontal scrolling flex container.** Do not change it back to CSS grid. Cards use `flex: 0 0 260px` with `flex-shrink: 0`.

### JavaScript

16. **All JS is vanilla — no `import`/`export`, no bundler.** Scripts are loaded via `<script src>` tags and communicate via global variables (e.g., `window.SEARCH_INDEX`).
17. **Do not modify `search-data.js`** without also checking `search.js` — they share `window.SEARCH_INDEX`.
18. **`nav.js` offset constant is `OFFSET = 86`.** If the header or ticker height changes in CSS, update this value to match.
19. **`ads.js` placement logic** uses `window.location.pathname` to determine page type. Homepage is detected as `pathname === '/' || pathname.endsWith('index.html')`.
20. **Nav tabs on article pages must not call `e.preventDefault()`** unless the target section exists on the current page. The current logic checks for the section element first.

### Server

21. **All API routes are in `server.js`.** Do not split routes into separate files.
22. **`buildArticleHtml()` generates complete standalone pages.** Any change to the site header/footer template must be made in two places: the static HTML files AND `buildArticleHtml()`. This includes meta tags, favicon, nav links, and footer links.
23. **`escHtml()` must be used on all user-provided string output** inside `buildArticleHtml()`. Do not skip it.
24. **Slug uniqueness:** When creating an article, the server filters duplicates by slug before prepending. If you change `slugify()`, ensure it remains deterministic and URL-safe.
25. **Data file paths are relative to `__dirname`.** Do not use `process.cwd()`.
26. **`writeFeatured()` silently truncates to 5 items.** This is intentional.
27. **`BASE_URL` is defined at the top of `server.js`.** Use it for all absolute URL construction (sitemap, canonical tags, OG tags). Do not hardcode the domain elsewhere in server.js.
28. **Publish slot logic is in `POST /api/create-article`**, not in `/api/auth`. Login does not consume slots — only publishing does.

### Content & Copy

29. **Publication name is "The Westwood Times"** — never abbreviated differently in visible UI (use "TWT" only in logo alt text or internal references).
30. **Byline is hardcoded as "TWT Staff"** in `buildArticleHtml()`. Change this if per-author bylines are needed.
31. **Fallback images come from Picsum** (`https://picsum.photos/seed/{seed}/1400/560`). Do not change the dimensions without updating `article.css` hero image sizing.

### Data

32. **`articles.json` is prepended (newest first).** Maintain this order — the homepage grid relies on it.
33. **Do not add required fields to the article schema** without updating both `buildArticleHtml()` and the admin UI that calls `POST /api/create-article`.
34. **`featured.json` stores full image URLs** (including resolved picsum fallback), not empty strings. The picker computes the fallback before saving.
35. **`passwords.json` entries are deleted when `uses` reaches 0.** Do not set `uses` to 0 and leave the entry — remove it.

### SEO

36. **The sitemap is generated dynamically** by the `/sitemap.xml` route in `server.js`. It reads live data from `articles.json` and the filesystem. Do not create a static `sitemap.xml` file.
37. **`robots.txt` is a static file** at the project root. Keep the sitemap URL pointing to `https://www.thewestwoodtimes.com/sitemap.xml`.

### Environments

38. **`buildEnvHtml()` generates complete standalone pages** — the same header/footer/ticker rules that apply to `buildArticleHtml()` apply here. Any site-wide structural change must be reflected in both builders.
39. **`window.ENV_CONFIG` is baked in at generation time.** It does not update live. If you change a field in `environments.json` you must regenerate the HTML (call `PUT /api/environments/:slug` or restart the server).
40. **All environment feature data lives inside `environments.json`** — not in separate files. Do not create `data/env-{slug}-board.json` etc. The inline approach keeps everything in one place and simplifies backup/restore.
41. **`env.js` and `env.css` are shared across all environment pages.** A change to either file affects every environment. Do not embed feature JS inline in generated pages.
42. **`/api/environments/public` is intentionally unauthenticated.** It only returns slug, name, and question — no passwords. Do not add the password field to this endpoint.
43. **Reactions are not deduplicated** — each click adds 1. This is intentional (simple, no user tracking). Do not add session/cookie deduplication unless explicitly asked.
44. **`DATA_DIR` controls where all data lives.** Do not hardcode paths like `path.join(ROOT, 'data', ...)` — always use the named constants (`ARTICLES_FILE`, `ENVIRONMENTS_FILE`, etc.) which are already resolved from `DATA_DIR`.
45. **Uploaded images are served via a dedicated route** (`GET /images/uploads/:file` → `UPLOADS_DIR`). This works whether `DATA_DIR` is inside or outside the project root. Do not assume uploads are always under `ROOT/images/uploads`.

---

## Tasks

Planned features not yet built. Read carefully before implementing — each section includes full context, exact file locations, and implementation steps.

---

### Task 1 — Cookie-Based Session System for Environments

**Status:** Not started.

**Why this exists:**
Environment pages (password-gated group spaces) have interactive features: polls, reactions, chat. Currently these are stateless — anyone can reload the page and vote again, and chat messages have no verified author. The goal is to persist identity across reloads within the same browser so that (a) poll votes are deduplicated and (b) chat messages are attributed to a consistent identity.

This is **not** Google OAuth. It is a lightweight server-issued session cookie tied to the environment password. If someone goes incognito they get a new session — that is acceptable for this use case. The audience is small trusted groups who already have the environment password.

---

**What currently exists (read this first):**

- `server.js` — all backend logic. Zero npm dependencies. Uses only `http`, `fs`, `path`. All routes are in one file. Do not split into separate files.
- `data/environments.json` — array of environment objects. Each has `slug`, `name`, `password`, `question`, `features`, `members`, etc.
- `data/sessions.json` — **does not exist yet**. You will create it.
- `js/env.js` — client-side JS for environment pages. Handles poll voting, reactions, chat. Currently sends no identity with requests.
- Environment HTML pages are generated by `buildEnvHtml()` in `server.js` and written to `/{slug}.html`.
- The existing password gate is in `js/env.js` — user enters the password, it is validated client-side against `window.ENV_CONFIG.password` (hashed or plaintext depending on current implementation). **Read env.js carefully before touching auth flow.**

---

**Implementation plan — do these in order:**

#### Step 1 — Cookie parser utility (server.js)

Add a `parseCookies(req)` helper function near the top of `server.js` alongside the other helpers (`readBody`, `json`, `escHtml`, etc.):

```js
function parseCookies(req) {
  const raw = req.headers.cookie || '';
  return Object.fromEntries(
    raw.split(';').map(s => s.trim().split('=').map(decodeURIComponent))
      .filter(p => p.length === 2)
  );
}
```

Also add a `generateSessionId()` helper:

```js
function generateSessionId() {
  return require('crypto').randomBytes(32).toString('hex');
}
```

No npm packages — `crypto` is a Node.js built-in.

---

#### Step 2 — Session store (server.js + data/sessions.json)

Add session file constant near the other file constants at the top of `server.js`:

```js
const SESSIONS_FILE = path.join(DATA_DIR, 'sessions.json');
```

Add init check alongside the other `if (!fs.existsSync(...))` blocks:

```js
if (!fs.existsSync(SESSIONS_FILE)) fs.writeFileSync(SESSIONS_FILE, '[]', 'utf8');
```

Add read/write helpers:

```js
function readSessions() {
  try { return JSON.parse(fs.readFileSync(SESSIONS_FILE, 'utf8')); }
  catch(e) { return []; }
}
function writeSessions(arr) {
  fs.writeFileSync(SESSIONS_FILE, JSON.stringify(arr, null, 2), 'utf8');
}
```

Session object shape:

```json
{
  "id": "64-char hex string",
  "envSlug": "environment-slug",
  "displayName": "Ryan",
  "createdAt": 1712345678901,
  "expiresAt": 1714937678901
}
```

Sessions expire after **30 days**. Add a cleanup helper that removes expired sessions (call it at server startup and optionally on each session write):

```js
function cleanExpiredSessions() {
  const now = Date.now();
  const active = readSessions().filter(s => s.expiresAt > now);
  writeSessions(active);
}
```

---

#### Step 3 — Session issuance endpoint (server.js)

Add a new route `POST /api/env-session`:

```
Body: { slug, password, displayName }
```

- Validate `password` against the environment's password in `environments.json`
- If valid: generate a session ID, write to `sessions.json`, return the session ID in a `Set-Cookie` header
- If invalid: return 403

Cookie settings:
- `HttpOnly` — JS cannot read it (prevents XSS theft)
- `SameSite=Strict` — no cross-site sending
- `Secure` — only over HTTPS (Railway provides this; omit in local dev by checking `process.env.NODE_ENV !== 'production'`)
- `Max-Age=2592000` — 30 days in seconds
- Cookie name: `twt_session`

Place this route **before** the static file handler, alongside the other `/api/` routes.

---

#### Step 4 — Session validation helper (server.js)

Add a helper that takes a request and an environment slug and returns the session object or null:

```js
function getSession(req, envSlug) {
  const cookies = parseCookies(req);
  const id = cookies['twt_session'];
  if (!id) return null;
  const session = readSessions().find(s => s.id === id && s.envSlug === envSlug && s.expiresAt > Date.now());
  return session || null;
}
```

---

#### Step 5 — Protect interactive endpoints (server.js)

The following environment interaction endpoints currently accept any request. Update each to call `getSession()` and reject with 403 if no valid session:

- `POST /api/environments/:slug/poll-vote` (or equivalent poll voting route — find it in server.js)
- `POST /api/environments/:slug/chat` (or equivalent chat posting route — find it in server.js)
- Any other write endpoints on environments that should be identity-gated

For read endpoints (GET reactions, GET chat messages) — do NOT require a session. Reads stay public within the page.

---

#### Step 6 — Update env.js (client-side)

The client currently sends poll/chat requests with no identity. After this change, identity comes from the cookie automatically (browser sends it with every same-origin request). **No changes needed to request headers** — `HttpOnly` cookies are sent automatically.

The only client-side change needed: after the user successfully enters the environment password, call `POST /api/env-session` with `{ slug, password, displayName }` to get a session issued. The `displayName` can be:
- A name the user types (add a "Your name" field to the password gate)
- Or default to "Member" if left blank

Store the `displayName` in `localStorage` so it persists across reloads without re-entering. The session cookie handles deduplication; localStorage handles display.

Update `js/env.js` — in the password gate success handler, fire the session issuance call before unlocking the content. If the session call fails, still unlock (session is a nice-to-have, not a hard gate).

---

#### Step 7 — Deduplicate poll votes (server.js)

In the poll vote handler, before recording a vote:
1. Call `getSession(req, slug)`
2. If session exists, check whether `session.id` is already in the vote's voter list
3. If already voted: return `{ ok: false, error: 'Already voted' }`
4. If not voted: record the vote and add `session.id` to the voter list

The poll data structure in `environments.json` will need a `voters` array per option (or per poll). Add `voters: []` to each poll option when polls are created.

If no session exists (anonymous user): allow the vote but do not add to voter list (current behavior preserved as fallback).

---

#### Step 8 — Attribute chat messages (server.js + env.js)

In the chat post handler:
1. Call `getSession(req, slug)`
2. If session exists: set `message.author = session.displayName`, `message.sessionId = session.id`
3. If no session: set `message.author = 'Anonymous'`

In `env.js`, render chat messages with the author name displayed.

---

**Files to modify:**
- `server.js` — Steps 1–5, 7–8 (backend)
- `js/env.js` — Step 6, 8 (client)
- `data/sessions.json` — created automatically on first run

**Files to NOT modify:**
- Any static article HTML files
- `index.html`, `about.html`, `css/main.css` (unless adding a display name input to the env password gate UI, which lives in `buildEnvHtml()` in server.js)
- `data/environments.json` structure — only add `voters: []` to poll options, do not change top-level shape

**Do not add npm packages.** `crypto` is a Node.js built-in and is the only new module needed.

**Test locally before deploying:**
```bash
node server.js
# Open an environment page, enter password + display name
# Vote on a poll, reload — vote should not be accepted again
# Post a chat message — should show display name
```

**Deploy:**
```bash
cd ~/Desktop/cnnheadlines && railway up
```

---

### Task 2 — Image Load Optimization

**Status:** Not started.

**Why this exists:**
On initial page load the browser fetches every `<img>` in `index.html` simultaneously — including cards far below the fold that the user may never scroll to. This wastes bandwidth, slows the page, and hurts LCP (Largest Contentful Paint). `featured.js` and `reels.js` already handle this correctly with `loading="lazy"`; the static HTML does not.

No npm packages, no build step, no image CDN required. All three fixes are pure HTML attribute changes.

---

**What currently exists (read this first):**

- `index.html` — static HTML file. Card images use `<img src="..." alt="">` with no lazy loading attributes. The primary hero image (`.hero-primary > img`) and secondary hero cards (`.hero-secondary-card img`) are above the fold and must load eagerly.
- `js/featured.js` — dynamically rendered featured slider cards already include `loading="lazy"` on their `<img>` tags.
- `js/reels.js` — already applies `loading="eager"` to the first 3 cards and `loading="lazy"` to the rest.
- Image sources are mostly external (`upload.wikimedia.org`) and some local (`images/` directory).

---

**Three changes to make — all in `index.html`:**

#### Fix 1 — `loading="lazy"` on all below-the-fold card images

Every `<img>` inside `.row-card`, `.col-card`, `.standard-card`, and any other card component that is not in the hero block should receive `loading="lazy"`. The hero images (`.hero-primary img` and `.hero-secondary-card img`) must stay as-is (no `loading` attribute = browser default eager).

Pattern to find: all `<img` tags inside card articles that do not already have `loading=`.

Add `loading="lazy"` to each. Example:

```html
<!-- before -->
<img src="https://upload.wikimedia.org/..." alt="">

<!-- after -->
<img src="https://upload.wikimedia.org/..." alt="" loading="lazy">
```

Do not touch hero images. Do not touch images inside `<template>` tags or JS strings.

#### Fix 2 — `fetchpriority="high"` on the primary hero image

The single largest above-the-fold image is the `.hero-primary > img`. Add `fetchpriority="high"` to it so the browser prioritizes it over everything else.

```html
<!-- before -->
<img src="..." alt="..." class="hero-img">

<!-- after -->
<img src="..." alt="..." class="hero-img" fetchpriority="high">
```

#### Fix 3 — `preconnect` hint for Wikimedia in `<head>`

Most images are hosted on `upload.wikimedia.org`. Adding a preconnect link tells the browser to open the TCP/TLS connection to that host before any image request is made, shaving 100–300ms off the first Wikimedia image load.

Add this in `<head>` after the existing `<link rel="preconnect" ...>` tags (or after `<meta charset>` if none exist):

```html
<link rel="preconnect" href="https://upload.wikimedia.org" crossorigin>
```

---

**Files to modify:**
- `index.html` only — three small changes described above.

**Files to NOT modify:**
- `server.js` — no server changes needed.
- Any `.css` files — no CSS changes needed.
- `js/featured.js`, `js/reels.js` — already correct.

**Test locally before deploying:**
```bash
node server.js
# Open http://localhost:3000
# Open DevTools → Network → Img filter
# Scroll down — images below the fold should show "lazy" in the Initiator column
# Primary hero should load immediately on paint
# Check Console for any errors
```

**Deploy:**
```bash
cd ~/Desktop/cnnheadlines && railway up
```
