import os

BASE = "/Users/masonlee/Desktop/cnnheadlines"

HEADER = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{title} — CNN</title>
  <link rel="stylesheet" href="css/reset.css"><link rel="stylesheet" href="css/main.css">
  <link rel="stylesheet" href="css/ticker.css"><link rel="stylesheet" href="css/grid.css">
  <link rel="stylesheet" href="css/sidebar.css"><link rel="stylesheet" href="css/article.css">
</head>
<body>
  <header id="site-header" role="banner"><div class="header-inner">
    <button class="hamburger" id="hamburger-btn" aria-label="Open menu" aria-expanded="false"><span></span><span></span><span></span></button>
    <a href="index.html" class="logo-link"><img src="images/CNN.png" alt="CNN" class="site-logo"></a>
    <nav class="primary-nav" role="navigation" aria-label="Primary"><ul>
      <li><a href="index.html" class="nav-tab">Politics</a></li><li><a href="index.html" class="nav-tab">World</a></li>
      <li><a href="index.html" class="nav-tab">Business</a></li><li><a href="index.html" class="nav-tab">Entertainment</a></li>
      <li><a href="index.html" class="nav-tab">Tech</a></li><li><a href="index.html" class="nav-tab">Health</a></li>
      <li><a href="index.html" class="nav-tab">Science</a></li><li><a href="index.html" class="nav-tab">Travel</a></li>
    </ul></nav>
    <div class="header-actions">
      <button class="search-btn" id="search-btn" aria-label="Search"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><line x1="16.5" y1="16.5" x2="22" y2="22"/></svg></button>
      <a href="#" class="live-tv-btn">Live TV</a>
    </div>
  </div>
  <nav class="mobile-nav-drawer" id="mobile-nav-drawer"><ul><li><a href="index.html">Home</a></li></ul></nav>
  <div class="search-overlay" id="search-overlay" role="search"><form>
    <input type="search" class="search-input" placeholder="Search CNN…" autocomplete="off">
    <button type="button" class="search-close" id="search-close">✕</button>
  </form></div></header>
  <div class="breaking-ticker" aria-live="polite"><span class="ticker-label">{category}</span>
    <div class="ticker-track-wrapper"><div class="ticker-track">
      <span class="ticker-item">{ticker}</span><span class="ticker-sep">|</span>
      <span class="ticker-item">CNN — Your source for breaking news, analysis and more</span><span class="ticker-sep">|</span>
    </div></div>
  </div>"""

FOOTER = """
  <footer id="site-footer" role="contentinfo"><div class="footer-inner">
    <div class="footer-logo"><a href="index.html"><img src="images/CNN.png" alt="CNN" style="height:32px;width:auto;"></a></div>
    <nav class="footer-nav" aria-label="Footer">
      <div class="footer-col"><h4>News</h4><ul><li><a href="#">{category}</a></li><li><a href="#">World</a></li></ul></div>
      <div class="footer-col"><h4>Legal</h4><ul><li><a href="legal/parody.html">Legal Notice</a></li><li><a href="legal/privacy.html">Privacy Policy</a></li><li><a href="legal/terms.html">Terms of Use</a></li></ul></div>
    </nav>
  </div><hr class="footer-divider">
  <div class="footer-bottom"><p>&#169; 2026 CNN &#8212; This is a parody/fan site not affiliated with CNN or Warner Bros. Discovery.</p>
    <p class="footer-disclaimer"><a href="legal/parody.html" style="color:#666;text-decoration:underline;">Read our parody notice</a></p></div></footer>
  <script src="js/ticker.js"></script><script src="js/nav.js"></script><script src="js/search.js"></script>
</body>
</html>"""

articles = [
  {
    "file": "remote-destinations.html",
    "title": "The world's most remote destinations are suddenly within reach",
    "category": "Travel",
    "cat_tag": "tag-travel",
    "ticker": "Adventure travel boom: remote destinations now reachable thanks to new direct routes",
    "seed": "remote-travel",
    "hero_alt": "A small boat approaches a remote tropical island with emerald water",
    "caption": "New air routes and expedition cruises are opening access to destinations that once required weeks of planning and multiple connecting flights.",
    "dek": "A combination of new direct flights, purpose-built expedition vessels, and digital nomad infrastructure is making it easier than ever to reach the world's most far-flung corners — and travel writers say the shift is transforming which places are considered worth the journey.",
    "byline": "By Ingrid Vasquez",
    "byline2": "CNN Travel Correspondent",
    "lede": "For most of travel history, truly remote destinations came with a tax: days of connections, physical hardship, and logistical complexity that filtered out all but the most committed adventurers. That equation is changing rapidly.",
    "p2": "A wave of new long-haul direct routes, opened by carriers eager to capture the post-pandemic surge in experiential travel, has slashed journey times to a growing list of destinations that previously required two or three connections. At the same time, a new generation of purpose-built expedition vessels — smaller, faster, and equipped with amenity standards that once belonged only to major cruise ships — has brought previously inaccessible island chains and polar coastlines within reach of travelers without specialized outdoor skills.",
    "p3": "Tour operators report bookings for remote destinations up 38% year-over-year, driven by travelers who describe themselves as seeking experiences they cannot find closer to home. \"The client profile has broadened dramatically,\" said one expedition travel agent whose business has grown fivefold in three years. \"We're getting bookings from people who have never camped a day in their lives, who want to see a place before it changes. That motivation is very powerful.\"",
    "quote": "We're getting bookings from people who have never camped a day in their lives. They want to see a place before it changes — and that motivation is very powerful.",
    "quote_cite": "— Expedition travel agent",
    "inline_seed": "expedition-boat",
    "inline_alt": "Expedition vessel anchored in a fjord surrounded by glaciated mountains",
    "inline_cap": "Modern expedition vessels combine the range to reach remote destinations with the comfort of boutique hotels.",
    "p4": "The trend raises complex questions about the sustainability of places that derived much of their appeal from their inaccessibility. Ecologists and conservation advocates are warning that increased visitor numbers to fragile ecosystems — from island biospheres to polar regions — will require strict capacity management that existing regulatory frameworks are not equipped to provide. \"There is a real tension between access and preservation,\" said one conservation scientist who studies tourism impacts in protected areas. \"Connecting people with nature is valuable, but not if the connection destroys what drew them there in the first place.\"",
    "p5": "Several destinations have already moved to limit annual visitor numbers through permit systems and seasonal closures. Travel operators that have built their businesses around remote destination access say they support such measures — both out of genuine environmental concern and because scarcity is a core part of their product's appeal. The challenge will be building governance frameworks fast enough to keep pace with the speed at which the industry is opening new frontiers.",
    "tags": ["Travel", "Adventure", "Tourism", "Sustainability"],
    "rel1": ("overtourism.html", "travel3", "tag-travel", "Overtourism backlash grows in popular European destinations ahead of peak summer season"),
    "rel2": ("airline-routes.html", "travel2", "tag-travel", "Airlines expand direct routes to secondary airports as travelers seek to skip congested hubs"),
    "rel3": ("sustainable-travel.html", "travel4", "tag-travel", "Sustainable travel certificates gain traction as eco-conscious tourists demand verified credentials"),
  },
  {
    "file": "house-committee.html",
    "title": "House committee opens formal inquiry into federal contracting irregularities",
    "category": "Politics",
    "cat_tag": "tag-politics",
    "ticker": "House committee launches formal inquiry into federal contracting practices",
    "seed": "congress-hearing",
    "hero_alt": "Lawmakers seated at a curved hearing table with microphones during a committee session",
    "caption": "The House committee convened Thursday to announce the formal scope of its inquiry into contracting practices.",
    "dek": "The inquiry, which follows months of preliminary investigation and whistleblower testimony, will focus on a series of multibillion-dollar contracts awarded without competitive bidding — a process that investigators say may have cost taxpayers hundreds of millions of dollars.",
    "byline": "By Marcus Trent",
    "byline2": "CNN Politics Correspondent",
    "lede": "The House oversight committee voted Thursday to open a formal inquiry into a series of federal contracting practices that investigators say may have systematically disadvantaged competitive bidders and benefited a small group of connected firms over the past several years.",
    "p2": "The inquiry, which passed on a largely party-line vote, will examine more than two dozen contracts collectively worth approximately $18 billion that were awarded through expedited procedures that bypass the standard competitive solicitation process. Investigators say preliminary document review has already revealed significant gaps in justification memos and evidence that some required notifications were either filed late or not at all.",
    "p3": "\"This is not a partisan investigation — it's a taxpayer protection investigation,\" said the committee chair at a press conference following the vote. \"When the government awards contracts worth billions without competition, every American has a stake in understanding whether that process was legitimate.\" Minority members disputed that characterization, arguing the investigation was politically motivated and that expedited contracting had statutory justifications.",
    "quote": "When the government awards contracts worth billions without competition, every American has a stake in understanding whether that process was legitimate.",
    "quote_cite": "— House Oversight Committee Chair",
    "inline_seed": "government-contract",
    "inline_alt": "Stack of official government documents and folders on a conference table",
    "inline_cap": "Investigators say they have already reviewed thousands of pages of documents and will be calling additional witnesses in the coming weeks.",
    "p4": "The committee has issued subpoenas to four current and former agency officials and is seeking records from at least three private contractors who received the awards in question. Legal counsel for two of those contractors indicated Thursday that their clients would cooperate with document requests while potentially contesting certain elements of the subpoena scope. The timeline for document production is expected to run through the summer.",
    "p5": "Watchdog organizations that have tracked contracting practices for years said the inquiry addressed practices that have been flagged repeatedly in agency inspector general reports without triggering significant corrective action. \"The audits keep identifying the same problems and the same actors,\" said one procurement specialist at a government accountability nonprofit. \"A formal congressional investigation with subpoena power is a different level of scrutiny, and it's warranted.\"",
    "tags": ["Politics", "Congress", "Government", "Accountability"],
    "rel1": ("midterm-poll.html", "pol2", "tag-politics", "Midterm poll shows dramatic shift in voter priorities around healthcare and housing costs"),
    "rel2": ("ballot-measures.html", "pol4", "tag-politics", "State legislatures advance competing ballot measures on voting rights and election security"),
    "rel3": ("article.html", "pol1", "tag-politics", "Senate reaches landmark bipartisan deal on infrastructure and climate spending"),
  },
  {
    "file": "ballot-measures.html",
    "title": "State legislatures advance competing ballot measures on voting rights and election security",
    "category": "Politics",
    "cat_tag": "tag-politics",
    "ticker": "Competing ballot measures on voting rights advance in state legislatures across the country",
    "seed": "ballot-voting",
    "hero_alt": "Person dropping a ballot into an official collection box",
    "caption": "Election administrators in multiple states are bracing for significant changes to voting procedures ahead of November.",
    "dek": "Advocates on both sides of the voting rights debate have mobilized significant resources as state legislatures move forward with measures that would expand access in some states while tightening identification and verification requirements in others.",
    "byline": "By Rosa Delgado",
    "byline2": "CNN Politics Correspondent",
    "lede": "At least seventeen state legislatures have advanced voting-related ballot measures in the past six weeks, setting up what election law experts are describing as the most consequential midterm-year reckoning over electoral rules since the widespread legislative changes that followed the 2020 election cycle.",
    "p2": "The measures vary dramatically in their approach and intent. Several states are advancing measures that would automatically register eligible voters through government databases, expand early voting windows, and allow same-day registration at polling locations. In other states, legislatures have put forward measures that would introduce stricter photo identification requirements, eliminate drop boxes, and require signature matching for all mail-in ballots.",
    "p3": "Election law scholars say the diverging approaches reflect genuinely different theories about the relationship between access and security in democratic systems — but also note that the evidence base for many of the claims advanced in support of tighter restrictions remains contested. \"The debate has become highly polarized, but there are legitimate empirical questions underneath it that deserve serious engagement,\" said one constitutional law professor who has consulted for election administrators in multiple states.",
    "quote": "The debate has become highly polarized, but there are legitimate empirical questions underneath it that deserve serious engagement from both sides.",
    "quote_cite": "— Constitutional law professor",
    "inline_seed": "election-admin",
    "inline_alt": "Election workers processing ballots at a counting center",
    "inline_cap": "Election administrators say new requirements create significant logistical challenges regardless of which direction they push.",
    "p4": "Legal challenges are expected the moment any of the more restrictive measures pass, with civil rights organizations that have been tracking the legislative calendar for months saying they are already prepared with lawsuits in multiple jurisdictions. The litigation landscape is complicated by several Supreme Court decisions over the past decade that have shifted the standards applied to voting rights claims, leaving the ultimate outcome of any legal challenge genuinely uncertain.",
    "p5": "For voters in the affected states, the practical effects will not be fully clear until after election administrators have time to implement any new rules — a process that takes months and affects training, equipment procurement, and public communication. Several election officials expressed concern in interviews that last-minute rule changes, regardless of their intent, create confusion that disproportionately affects voters who are less familiar with the system.",
    "tags": ["Politics", "Elections", "Voting Rights", "Democracy"],
    "rel1": ("midterm-poll.html", "pol2", "tag-politics", "Midterm poll shows dramatic shift in voter priorities around healthcare and housing costs"),
    "rel2": ("house-committee.html", "pol3", "tag-politics", "House committee opens formal inquiry into federal contracting irregularities"),
    "rel3": ("governor-emergency.html", "storm-prep", "tag-politics", "Governor announces statewide emergency declaration ahead of intensifying storm season"),
  },
  {
    "file": "diplomatic-talks.html",
    "title": "Diplomatic talks resume as regional powers seek lasting solution to border dispute",
    "category": "World",
    "cat_tag": "tag-world",
    "ticker": "Diplomatic talks resume; six nations gathered for third round of border negotiations",
    "seed": "diplomacy-talks",
    "hero_alt": "Diplomats seated around a large oval conference table in a formal negotiating chamber",
    "caption": "The third round of negotiations is taking place under the auspices of international mediators who brokered a temporary ceasefire four months ago.",
    "dek": "Envoys from six nations have gathered for the latest round of talks aimed at establishing a permanent resolution to a territorial dispute that has simmered for decades and periodically erupted into armed confrontation, most recently 18 months ago.",
    "byline": "By James Whitfield",
    "byline2": "CNN World Correspondent",
    "lede": "Diplomatic delegations from six regional powers convened Thursday for a third round of internationally mediated talks aimed at establishing a durable framework for resolving a border dispute that has defied resolution for more than two decades and twice escalated into significant military confrontations.",
    "p2": "The talks, hosted in a neutral capital and brokered by a team of international mediators, are the most substantive yet in a process that began 18 months ago following a ceasefire agreement that ended the most recent episode of fighting. Both sides described the atmosphere at the opening session as businesslike and cautious — a step forward from earlier rounds that were characterized by procedural disputes over even the basic framing of the agenda.",
    "p3": "The core disagreement centers on a stretch of contested territory that sits astride valuable trade routes and contains natural resources that both parties claim. Previous negotiations collapsed repeatedly over questions of sovereignty, resource rights, and the status of communities of mixed heritage who live in the disputed zone. This round of talks is attempting to bracket those larger questions and reach agreement on practical interim arrangements — security monitoring, economic access, and civilian movement — that could reduce tensions regardless of how the ultimate political questions are eventually resolved.",
    "quote": "We are not here to solve everything at once. We are here to build enough trust that the next conversation can go further than this one.",
    "quote_cite": "— Lead mediator, opening session remarks",
    "inline_seed": "border-region",
    "inline_alt": "Border crossing point with flags of multiple nations visible",
    "inline_cap": "Communities living near the disputed border have lived under uncertainty for years, waiting for a resolution that has repeatedly proved elusive.",
    "p4": "Humanitarian organizations have been lobbying mediators to ensure that civilian welfare is addressed explicitly in any framework agreement, pointing to restrictions on movement and trade that have impoverished communities on both sides of the disputed line. Several aid organizations were granted observer status at this round of talks for the first time — a symbolic concession that advocates described as meaningful even if it does not affect the substance of negotiations.",
    "p5": "Regional analysts said expectations for a breakthrough in this round were appropriately limited, but expressed cautious optimism that the parties were at least genuinely engaged rather than performing diplomacy for domestic political purposes. \"Both governments face real pressure at home to show progress,\" said one former diplomat who has followed the dispute for two decades. \"That can cut either way — it can push parties toward a deal, or it can make concessions politically impossible. Right now I'm cautiously in the first camp.\"",
    "tags": ["World", "Diplomacy", "International Relations", "Border"],
    "rel1": ("un-ceasefire.html", "world-ceasefire", "tag-world", "UN envoy calls for immediate ceasefire as civilian death toll surpasses 4,000"),
    "rel2": ("humanitarian-crisis.html", "world2", "tag-world", "Humanitarian crisis deepens in conflict zone as aid convoys face access restrictions"),
    "rel3": ("pacific-islands.html", "world4", "tag-world", "Pacific island nations form new coalition to press industrialized countries on emissions targets"),
  },
]

TAG_COLORS = {
    "Politics": "tag-politics", "World": "tag-world", "Business": "tag-business",
    "Tech": "tag-tech", "Health": "tag-health", "Science": "tag-science",
    "Entertainment": "tag-entertainment", "Travel": "tag-travel", "Opinion": "tag-opinion",
}

def make_article(a):
    tag_cls = TAG_COLORS.get(a["category"], "tag-world")
    rel_html = ""
    for slug, seed, rtag, rhead in [a["rel1"], a["rel2"], a["rel3"]]:
        rel_html += f"""<article class="related-card"><a href="{slug}"><img src="https://picsum.photos/seed/{seed}/480/300" alt=""><div class="card-body"><span class="category-tag {rtag}">{a["category"] if rtag == a["cat_tag"] else rtag.replace("tag-","").capitalize()}</span><h3 class="card-headline">{rhead}</h3></div></a></article>"""
    
    tags_html = "".join(f'<a href="#" class="tag-pill">{t}</a>' for t in a["tags"])
    
    html = HEADER.format(title=a["title"], category=a["category"], ticker=a["ticker"])
    html += f"""
  <main class="article-page" role="main">
    <nav class="article-breadcrumb" aria-label="Breadcrumb"><div class="breadcrumb-inner">
      <a href="index.html">Home</a><span class="breadcrumb-sep">›</span><a href="#">{a["category"]}</a><span class="breadcrumb-sep">›</span>
      <span class="breadcrumb-current">{a["title"][:60]}...</span>
    </div></nav>
    <img src="https://picsum.photos/seed/{a["seed"]}/1400/560" alt="{a["hero_alt"]}" class="article-hero-img">
    <p class="article-hero-caption">{a["caption"]} | CNN / Staff</p>
    <header class="article-header">
      <span class="category-tag {a["cat_tag"]}">{a["category"]}</span>
      <h1 class="article-headline">{a["title"]}</h1>
      <p class="article-dek">{a["dek"]}</p>
      <div class="article-meta">
        <div class="article-byline">By {a["byline"]}<br><span>{a["byline2"]}</span></div>
        <div class="article-timestamp">Updated 9:00 AM ET, Fri April 4, 2026</div>
        <div class="share-buttons">
          <button class="share-btn share-btn-fb" onclick="return false;">Share</button>
          <button class="share-btn share-btn-x" onclick="return false;">Post</button>
          <button class="share-btn share-btn-link" onclick="return false;">Copy</button>
        </div>
      </div>
    </header>
    <div class="article-body">
      <p>{a["lede"]}</p>
      <p>{a["p2"]}</p>
      <p>{a["p3"]}</p>
      <blockquote class="pull-quote"><p>&#8220;{a["quote"]}&#8221;</p><cite>&#8212; {a["quote_cite"]}</cite></blockquote>
      <figure class="article-inline-img">
        <img src="https://picsum.photos/seed/{a["inline_seed"]}/900/500" alt="{a["inline_alt"]}">
        <figcaption>{a["inline_cap"]} | CNN</figcaption>
      </figure>
      <p>{a["p4"]}</p>
      <p>{a["p5"]}</p>
    </div>
    <div class="article-tags"><span class="tags-label">Related:</span>{tags_html}</div>
    <section class="related-stories" aria-labelledby="related-heading">
      <div class="row-header"><h2 class="row-title" id="related-heading"><span class="row-accent">Related Stories</span></h2></div>
      <div class="related-grid">{rel_html}</div>
    </section>
  </main>"""
    html += FOOTER.format(category=a["category"])
    return html

for a in articles:
    path = os.path.join(BASE, a["file"])
    with open(path, "w") as f:
        f.write(make_article(a))
    print(f"Written: {a['file']}")
