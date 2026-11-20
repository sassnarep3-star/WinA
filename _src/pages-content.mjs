// ============================================================
// Prose for standalone pages. Same voice rules apply.
// ============================================================

export const about = {
  title: "About Counter Space",
  dek: "What this site is, what it is not, and the one limitation you should know before trusting anything here.",
  body: `
<h2>The short version</h2>
<p>Counter Space is a small buying guide for kitchen appliances that take up counter space. It currently covers three air fryers and two thermometers, chosen because those were the products we were asked to write about.</p>
<p>It is reader-supported. When you buy through a link here, we earn a commission from Amazon. That does not change what you pay.</p>

<h2>What we have not done</h2>
<p>We have not tested these appliances. We have not owned them, cooked in them, or measured them. No page on this site says otherwise, because saying otherwise would be a lie, and the FTC is explicit that you cannot describe experience with a product you have not tried.</p>
<p>So what is here instead? Writing about the decision rather than the verdict. What a two-drawer air fryer is good at and what it is bad at. Why a 26-quart oven and a 6-quart drawer are not competitors. When a connected thermometer is the wrong tool. That kind of thing can be written honestly from published specifications, and it is often more useful than a star rating anyway.</p>

<h2>What we could not show you</h2>
<p>Prices, star ratings, review counts and product photographs are all absent. This is not laziness. Amazon's program policies prohibit displaying customer ratings, reviews or current prices unless they are supplied through its own API, and prohibit price tracking outright. We do not have API access. Printing a price we saw once would produce a number that is wrong within days, and printing a rating would breach the terms.</p>
<p>Every specification is marked with how confident we are in it: verified from the official listing, stated by the maker but unverifiable by us, unverified, or withheld. Where a value could not be confirmed, the field is empty rather than filled with something plausible.</p>

<h2>How we make money</h2>
<p>Affiliate commissions from Amazon. Every outbound product link on this site is marked as sponsored, and the disclosure appears above the content on every page rather than buried in a footer.</p>
<p>We do not accept payment for placement. We do not rank products by commission rate, and we could not do so honestly even if we wanted to, because we have not verified the current commission rate for either category — it is an open question in our register.</p>

<h2>Corrections</h2>
<p>If a specification here is wrong, it should be fixed rather than defended. The register page lists every source used, with the date it was read, so any claim can be checked directly.</p>

<h2>What is still unresolved</h2>
<p>Plenty. A page listing every open question, and what would settle each one, is published at <a href="{BASE}/questions/">Open questions</a>. It is not a marketing page. It is the actual list.</p>
`
};

export const disclosure = {
  title: "Affiliate disclosure",
  dek: "The full statement, in the plainest terms available, plus the rules that shape what this site can and cannot show.",
  body: `
<h2>The required statement</h2>
<p class="lede"><strong>As an Amazon Associate I earn from qualifying purchases.</strong></p>
<p>That sentence appears under the masthead on every page of this site, and again in the footer. It is required by section 5 of the Amazon Associates Program Operating Agreement, and it is not negotiable wording.</p>

<h2>What it means for you</h2>
<p>If you click a product link on this site and then buy something on Amazon, we may receive a commission. You pay the same price you would have paid anyway. The commission comes out of Amazon's margin, not your pocket.</p>
<p>Not every click earns anything. A commission only applies if a purchase happens within the window Amazon sets, and Amazon decides what qualifies.</p>

<h2>How we mark links</h2>
<p>Every outbound product link is marked in three ways:</p>
<ul>
  <li>A visible "Sponsored" label or a plain-language note next to the link.</li>
  <li>The <code>rel="sponsored"</code> attribute in the markup.</li>
  <li>A link that goes directly to a visible <code>amazon.com</code> address, so the destination is never hidden.</li>
</ul>
<p>Amazon's policies require that it be clear you are linking to Amazon, and that the destination not be obscured. We do not route product links through a redirector or a shortener of our own.</p>

<h2>What we are not allowed to show, and do not</h2>
<ul>
  <li><strong>Star ratings and customer reviews.</strong> Prohibited without Creatives or Product Advertising API access.</li>
  <li><strong>Prices and price history.</strong> Prices must come from Amazon's API to stay accurate, and price tracking or alerting is prohibited outright.</li>
  <li><strong>Amazon logos and Program Content.</strong> Not used anywhere on this site.</li>
</ul>

<h2>Independence</h2>
<p>This site is not endorsed by, sponsored by, or affiliated with Amazon beyond participation in the Associates program. No brand mentioned here has reviewed or approved any page. We do not imply otherwise, and Amazon's operating agreement forbids implying otherwise.</p>

<h2>Editorial independence, honestly stated</h2>
<p>There is a real tension in affiliate publishing: the site earns when you buy, and the most useful advice is sometimes "do not buy this." We handle it by writing about trade-offs instead of winners, and by saying plainly which product is wrong for which person. That is not a guarantee of objectivity. It is the structure we can actually defend.</p>

<h2>Privacy</h2>
<p>What this site collects, and what it deliberately does not, is set out on the <a href="{BASE}/privacy/">privacy page</a>.</p>
`
};

export const privacy = {
  title: "Privacy",
  dek: "What is collected, what is not, and why the answer is currently closer to nothing than you might expect.",
  body: `
<h2>The short version</h2>
<p>This site does not set cookies. It does not fingerprint your browser. It does not run third-party trackers, advertising pixels, or social embeds. There is no login and no account.</p>

<h2>What is measured</h2>
<p>Five events are defined for this site: a page view, an outbound click, a guide read, a comparison view, and an intent to subscribe. Each is designed to carry only the page path, an ASIN where relevant, and a coarse viewport size.</p>
<p><strong>None of it is currently being recorded.</strong> No analytics collector is deployed, so the client is switched off rather than sending events into a void. This is documented on the <a href="{BASE}/analytics/">measurement page</a>.</p>
<p>If a collector is deployed later, the design is: first-party and self-hosted, no cookies, no identifiers, no cross-site tracking, raw events discarded after thirty days and only daily totals kept.</p>

<h2>The email form</h2>
<p>The subscribe form in the footer is not connected to any email service. If you submit it, nothing is transmitted, nothing is stored, and no address leaves your browser. The page says so at the point where you would find out the hard way.</p>

<h2>What Amazon sees</h2>
<p>When you click a product link, you leave this site and arrive at Amazon. From that moment Amazon's own privacy notice governs what happens, and it is a separate relationship from this one. The link carries our Associates tracking tag, which tells Amazon which site referred you. That is how the commission is attributed, and it is the whole purpose of the tag.</p>

<h2>What this site does not do</h2>
<ul>
  <li>No cookies of any kind.</li>
  <li>No third-party scripts, fonts, or images loaded from other domains.</li>
  <li>No advertising network, retargeting, or pixel.</li>
  <li>No selling, sharing, or renting of any data, because none is collected.</li>
  <li>No collection of payment information, ever.</li>
</ul>

<h2>Third parties</h2>
<p>The site is served by GitHub Pages, which is a third party and will see standard web server information such as your IP address as part of delivering the page. That is a property of any web host and is outside this site's control. No analytics service, CDN of our own, or processor receives anything from this site.</p>

<h2>If this changes</h2>
<p>Any future addition of analytics, email, or third-party tooling would require this page to be rewritten before the tool goes live, and the change recorded. Amazon's program policies also require accurate disclosure of cookies, pixels and third-party technologies, so this page is a compliance document as well as a courtesy.</p>

<h2>Contact and correction</h2>
<p>There is no contact form, because a form would be another thing collecting data. Corrections are handled through the source register, which lists every claim and where it came from.</p>
`
};

export const marketing = {
  title: "Marketing plan",
  dek: "How this is meant to reach people, what it costs, and which parts cannot honestly start until something else is true first.",
  intro: `This is not a growth-hacking document. It is the sequence this publication can actually execute, in the order the dependencies allow, with the things that are guesses labelled as guesses.

Two constraints shape all of it. The site earns nothing until a click converts on Amazon, and no traffic source exists yet.`,
  sections: [
    {
      title: "Positioning",
      body: `<p>The category is crowded with review sites that claim testing they did not do, and with AI-generated listicles that all say the same five things. Both are easy to spot, and readers have learned to distrust the whole category.</p>
<p>The defensible position is narrow and a little uncomfortable: <strong>a site that admits what it has not tested, and is useful anyway.</strong> The writing focuses on the decision — form factor, batching, counter cost, cleanup — because that is what can be written honestly from published specifications, and it is also what the generic listicles skip.</p>
<p>Against a site that says "we tested 40 air fryers," this loses. Against a site that says "the Ninja is the best air fryer for families," it wins, because it tells you when the Ninja is wrong for you.</p>`
    },
    {
      title: "Who it is for",
      body: `<p>Someone standing in a kitchen, measuring a gap on the counter with their hands, deciding between two appliances. They are not reading for entertainment and they do not care about the brand's story. They want to know whether the thing fits, whether it does the two jobs they need, and whether they will still use it in a year.</p>
<p>That reader arrives from a search query with a decision inside it, converts at a reasonable rate, and does not need to be convinced the category is interesting. It is the only audience a small site can realistically serve.</p>`
    },
    {
      title: "The content engine: question-shaped guides",
      body: `<p>Every guide is titled as a question someone would actually type, and answers it without withholding the answer for a click. Four exist. The pattern is what matters, because it is repeatable:</p>
<ul>
<li>Name the real decision, not the product category.</li>
<li>Give the reader a way to decide for themselves, not just an answer.</li>
<li>Say when the recommendation is the wrong one.</li>
<li>Link to products only after the decision is clear.</li>
</ul>
<p>The current four are hypotheses about what people want to know. None of them is backed by search volume data, because none exists yet. That is stated on the <a href="{BASE}/questions/">open questions</a> page rather than disguised as research.</p>`
    },
    {
      title: "Sequence, because order matters",
      body: `<ol>
<li><strong>Prove the links work.</strong> One click per product, confirmed in the Associates tracking report. Everything else is worthless if this fails.</li>
<li><strong>Turn on measurement.</strong> Deploy the collector so clicks are counted from the first visitor, not the hundredth.</li>
<li><strong>Get indexed.</strong> Verify Search Console, submit the sitemap, confirm pages are actually in the index.</li>
<li><strong>Publish on a cadence.</strong> One guide a week for eight weeks. Each added to the sitemap and feed in the same commit.</li>
<li><strong>Read the query data.</strong> At week eight, replace the hypotheses with what Search Console says people searched.</li>
<li><strong>Then</strong> consider paid acquisition, an email list, or a second category.</li>
</ol>
<p>Steps five and six are the ones people skip, which is why most affiliate sites are a pile of articles with no evidence about which one worked.</p>`
    },
    {
      title: "Traffic channels, ranked by honesty",
      body: `<p><strong>Organic search.</strong> The only channel that compounds and the only one this site is built for. Slow: expect months before meaningful impressions, longer before clicks. Requires the sitemap, feed and canonical structure that are already in place, plus Search Console verification, which is not.</p>
<p><strong>Direct and referral.</strong> Close to zero without a distribution channel. There is no social presence, no newsletter, no community. This is the site's biggest structural weakness and it is recorded as such.</p>
<p><strong>Email.</strong> The right long-term answer, and premature right now: capturing addresses with nothing to send them is worse than not capturing them. Hold until a cadence exists.</p>
<p><strong>Paid search.</strong> Held. Bidding on Amazon trademarks is prohibited, and a new site with no conversion data cannot tell whether an ad is profitable. Advertising before measurement is guessing with a budget.</p>
<p><strong>Social.</strong> Not attempted. Would require a real person's voice and regular output, which is a different job from writing guides.</p>`
    },
    {
      title: "What we are allowed to do, and what we are not",
      body: `<p>These are not preferences. They come from the Associates Operating Agreement and the program policies, and breaching them risks losing the account entirely.</p>
<ul>
<li>No bidding on "amazon" or any Amazon trademark, or misspellings of it.</li>
<li>No paid search that sends users directly to Amazon; ads must land on this site.</li>
<li>No price trackers, price alerts, or price comparison over time.</li>
<li>No star ratings or review text without API access.</li>
<li>No Amazon logos or Program Content.</li>
<li>No implying Amazon endorses this site.</li>
<li>Disclosure above the content on every page, not only in the footer.</li>
</ul>
<p>Each of these is quoted with a source link on the <a href="{BASE}/register/">source register</a>.</p>`
    },
    {
      title: "What success looks like, without inventing numbers",
      body: `<p>No revenue forecast appears anywhere in this document, because a forecast here would be fiction. There is no traffic history, no conversion rate, no verified commission rate, and no enrolled-link proof. Four unknowns multiplied together do not produce a number worth printing.</p>
<p>What can be tracked, honestly and from day one: whether pages get indexed, whether anyone clicks through to Amazon, and whether the Associates report eventually shows orders. Those three are the real scoreboard, and the first two are measurable immediately once the collector is deployed.</p>
<p>The <a href="{BASE}/dashboard/">campaign ledger</a> starts empty with its columns defined, so the first genuine report can be entered without redesigning anything. An empty honest ledger is a working instrument. A ledger with placeholder figures is a liability.</p>`
    }
  ]
};

export const seo = {
  title: "Search and findability",
  dek: "One site for search engines to index, a stated reason to rank it, and an honest account of what is still unverified.",
  sections: [
    {
      title: "One canonical site",
      body: `<p>Everything published here lives under a single origin with a single sitemap. There is no duplicate staging site, no competing subdomain, and no second copy of the same guide in a different folder. Every page declares a canonical URL, so even if a page is reachable through more than one path, search engines are told which one counts.</p>
<p>The site is a static build with no client-side routing, so every URL is a real document that returns a real HTML page. Crawlers do not need to execute JavaScript to see the content — what you read is what is in the source.</p>`
    },
    {
      title: "What is in place",
      body: `<ul>
<li><strong>A sitemap</strong> listing every public page with a last-modified date, referenced from <code>robots.txt</code>.</li>
<li><strong>An RSS feed</strong> carrying the guides, so the publication has a subscribable surface from day one.</li>
<li><strong>Per-page titles and descriptions</strong> written for a human deciding whether to click, not stuffed with keywords.</li>
<li><strong>Structured data</strong> where it is honest to use it: <code>Article</code> on guides, <code>ItemList</code> on category pages, <code>WebSite</code> on the front page.</li>
<li><strong>Semantic HTML</strong> — one <code>h1</code> per page, real headings, real lists, real tables with captions and scoped headers.</li>
<li><strong>Fast by construction</strong> — no framework, no web font request, no third-party script. The page is the document.</li>
</ul>`
    },
    {
      title: "Why it deserves to rank",
      body: `<p>Not because of technical tricks — those are table stakes and everyone has them. The reason is that each guide answers a question in a way the competing pages do not: it gives the reader a decision procedure instead of a verdict, and it says plainly when the recommended product is wrong for them.</p>
<p>It also refuses to fabricate. No invented prices, no borrowed star ratings, no claimed testing. On a topic where most pages are generated and interchangeable, a page that is specific about trade-offs and honest about its limits has something no amount of keyword optimisation can imitate.</p>`
    },
    {
      title: "What is not verified",
      body: `<p>Search Console ownership has not been confirmed, because that requires account access. A placeholder verification token is in the markup and clearly marked as such.</p>
<p><strong>Until that is replaced, this site has no idea whether it is indexed, what it ranks for, or whether anyone arrives.</strong> It is the single highest-value five-minute task remaining, and it is recorded as an open action rather than described as done.</p>
<p>No search volume data exists for any of the guide topics. The titles are editorial hypotheses about what people might ask, not evidence about what they do ask. Publishing more guides and reading the query report is how that changes.</p>`
    },
    {
      title: "What we will not do",
      body: `<p>No buying of Amazon trademarks as search keywords, whether through ads or any other mechanism — that is prohibited and would risk the account. No keyword-stuffed doorway pages. No spinning one article into twenty near-duplicate variants to chase long-tail queries; it works briefly and then gets the whole domain discounted. No cloaking the destination of a product link.</p>
<p>The build enforces part of this mechanically: a page cannot publish without a unique title and description, and the validation step fails if any outbound Amazon link is missing its sponsored marking.</p>`
    }
  ]
};

// Per-product marketing copy. Written to be usable as-is: one hook, one short
// social post, one paragraph for a newsletter, and the sentence that has to
// travel with any of them. Every factual claim here is traceable to the
// product's own record; nothing is exaggerated to make the copy land.
export const promo = {
  title: "Marketing kit",
  dek: "Ready-to-use copy for all five products, written under the same rules as the site: no invented prices, no claimed testing, disclosure travelling with every post.",
  intro:
    "The marketing plan on the previous page says where the traffic should come from. This page is the copy that goes into it. Each entry is short on purpose — a hook, a social post, a newsletter paragraph — and every one of them carries the Associate statement, because a disclosure that lives only on the site does not cover a post that leaves it.",
  rules: [
    "No price, no star rating, no review count. Amazon prohibits displaying them outside approved tooling, and a price in a social post goes stale in a week.",
    "No testing claim. Nobody here used these machines, so no post says 'we tried' or 'our favourite'.",
    "Every post carries the disclosure. On a platform with no visible footer, that means in the text, not behind a link.",
    "The claim in the copy is the claim in the register. If the register says unverified, the copy does not say it.",
    "Link to the review page, not straight to Amazon, unless the platform makes the tag impossible to attach — then use the tagged link and say it is sponsored in the same breath."
  ],
  entries: [
    {
      slug: "chefman-6-quart-dual-basket",
      hook: "The two-drawer answer for people who cook two things at once",
      social:
        "Most air fryer regret isn't about crispness. It's running the machine twice. Two independent 3-quart drawers, two temperatures, and a Sync Finish that holds the faster one so the protein and the side land together. 6 quarts total — which is two small cooks, not one big one. → [review]",
      newsletter:
        "If your weeknight plate is a main plus a side, the constraint you will hit first is not basket size but one temperature at a time. The Chefman 6-Quart splits into two independent 3-quart drawers with a Sync Finish, so both finish together. The honest trade: 6 quarts total is two small cooks, not one big one. We publish the published specifications and leave the rest blank rather than guessing. → [review]",
      disclosureNote:
        "Sponsored. As an Amazon Associate I earn from qualifying purchases.",
      caution: "Do not call it 'large'. Six quarts split in half is the whole trade-off, and the copy should not paper over it."
    },
    {
      slug: "emeril-lagasse-26qt-french-door",
      hook: "The one that replaces an oven instead of sitting beside one",
      social:
        "A drawer holds a pile. An oven holds a tray. If dinner is a whole chicken or a full sheet of vegetables, you need the second shape — 26 quarts behind French doors, at the cost of most of a counter. → [review]",
      newsletter:
        "There is a real fork in this category and it is not brand versus brand. A basket machine gives you a drawer you pull toward you; an oven gives you a box you reach into. The Emeril 26QT is firmly the second: rotisserie, broil, bake and dehydrate in one cavity, 26 quarts, and a footprint that takes a substantial piece of counter. If you want fries in small batches fast, this is the wrong machine. → [review]",
      disclosureNote:
        "Sponsored. As an Amazon Associate I earn from qualifying purchases.",
      caution: "The preset count is published as 24, 25 and '10-in-1' by different official pages. Do not put a number in a post."
    },
    {
      slug: "chefman-8-quart-turbofry",
      hook: "One big drawer, four jobs, and a two-minute high-heat finish",
      social:
        "One drawer means one temperature at a time — which is fine if you cook one thing well. 8 quarts, four functions, and a Hi-Fry burst to 450°F for the last two minutes that browns what 400°F left pale. → [review]",
      newsletter:
        "Single-basket machines get dismissed as the beginner option, and that is mostly wrong. One 8-quart drawer is easier to fill, toss and wash than two smaller ones, and it holds a lot of one thing. The Chefman TurboFry 4-in-1 adds a Hi-Fry finish — 450°F for the final two minutes, not a continuous 450°F cycle, which is a distinction the marketing copy elsewhere tends to blur. → [review]",
      disclosureNote:
        "Sponsored. As an Amazon Associate I earn from qualifying purchases.",
      caution: "Hi-Fry is two minutes, not a range. Calling this a 450°F air fryer is the single easiest way to be wrong in public."
    },
    {
      slug: "thermomaven-1-sec-thermometer",
      hook: "The cheap insurance that stops you guessing",
      social:
        "One second to a reading is the threshold where checking temperature stops feeling like a delay — which is the only reason people actually do it. NIST-certified claim, AAA battery, no app, no account. → [review]",
      newsletter:
        "The best thermometer is the one you actually pick up. A one-second read is fast enough that checking stops being a chore, and this one runs on a single AAA with nothing to pair and no account to create. The manufacturer states NIST certification to ±0.5°F; we could not verify the certificate itself, so we report it as the manufacturer's claim rather than repeating it as fact. → [review]",
      disclosureNote:
        "Sponsored. As an Amazon Associate I earn from qualifying purchases.",
      caution: "The listing says IP67; the manufacturer's own page says '100% waterproof' and publishes no IP number. Say 'waterproof as described by the manufacturer' or say nothing."
    },
    {
      slug: "chef-iq-sense-gen3",
      hook: "For the cook who wants to be in another room",
      social:
        "A leave-in probe earns its price on long, indirect cooks — a smoker, a slow roast, a turkey — where the whole point is not opening the lid. Three probes, five sensors, 1,000°F rating, unlimited range through the hub. → [review]",
      newsletter:
        "An instant-read answers 'is this done yet?' for something you are standing next to. A wireless probe answers it for something in another room, over hours. The CHEF iQ Sense runs three probes with four internal sensors plus an ambient one, rated to 1,000°F, reporting through a Wi-Fi hub. If you do not cook low and slow, most of what you are paying for is a feature you will not use — and that is worth saying plainly. → [review]",
      disclosureNote:
        "Sponsored. As an Amazon Associate I earn from qualifying purchases.",
      caution: "The one-probe configuration is what this ASIN ships. Do not describe it as a three-probe bundle without checking the current listing."
    }
  ],
  checklist: [
    "Does the post carry the Associate statement in the visible text?",
    "Is every number in the post a number the register supports?",
    "Would the post still be true if the price doubled tomorrow? If not, it is a price post — cut it.",
    "Does the link go to the review page, and is the review page's own disclosure above the fold?",
    "Is there any implied endorsement by Amazon or the manufacturer? There must not be."
  ]
};
