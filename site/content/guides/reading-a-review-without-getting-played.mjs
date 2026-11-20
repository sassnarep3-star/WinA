export const meta = {
  slug: "reading-a-review-without-getting-played",
  title: "How to read an appliance review without getting played",
  dek: "Half a dozen tells that separate a publication from a content farm — including the ones this site is guilty of.",
  section: "kitchen-gear-basics",
  seasons: ["evergreen"],
  published: "2026-11-20",
  lastReviewed: "2026-11-20",
  readMinutes: 7,
  hypotheses: "Written as the honest answer to the question our own about-page invites: why trust this one.",
  sourceIds: ["SRC-10", "SRC-11", "SRC-12", "SRC-02"],
  faq: [
    { q: "Are affiliate sites ever honest?", a: "The payment model does not decide honesty; it decides incentive. What you can check is whether a page names its sources, admits what it did not test, and refuses to rate things it has not measured. Those are visible on the page." },
    { q: "What is the single fastest tell?", a: "A verdict with no method. If a page says a model is the best and never says what it compared, against what, on what date, the sentence is decoration." },
    { q: "Should I trust star ratings?", a: "Ask whose scale it is. A lab score, an aggregate of owner reviews, and an editorial opinion are three different numbers wearing the same five stars." }
  ]
};

export const body = `
<section>
  <p class="lede">You are reading a review site. So are about four million other pages, and most of them were assembled rather than written. Here is the short list of tells, some of which apply to us.</p>
</section>

<section>
  <h2>Six tells, in the order they catch a copycat</h2>
  <table class="compare" data-quote="example">
    <thead><tr><th>Tell</th><th>What it looks like</th><th>What it means</th></tr></thead>
    <tbody>
      <tr><td>The round-robin intro</td><td>"Cooking has never been easier…" followed by three sentences about air frying generally</td><td>No decision was made. Delete to the first number.</td></tr>
      <tr><td>Superlatives without a base</td><td>"best", "top-rated", "#1" with no comparison set and no date</td><td>A ranking that was not computed.</td></tr>
      <tr><td>Specs as opinions</td><td>"the 1,700 W element delivers exceptional power" — nothing measured</td><td>The brochure, paraphrased for a commission.</td></tr>
      <tr><td>Sourced star ratings</td><td>"4.6 out of 5" with no count, no date, no whose-scale</td><td>A number that will be wrong within a week.</td></tr>
      <tr><td>Everything is a winner</td><td>six products, six verdicts, all glowing, no trade-off named</td><td>Copy written to avoid disappointing any destination page.</td></tr>
      <tr><td>No way to check</td><td>no links to the listing, the manual, the agency page, the study</td><td>The author did not want a reader to follow up.</td></tr>
    </tbody>
  </table>
</section>

<section>
  <h2>What a real review owes you</h2>
  <ul class="ticks">
    <li>An honest statement of method. Tested in a lab, tested at home, or not tested at all. "Not tested, here is a checklist" is a legitimate kind of page; pretending otherwise is not.</li>
    <li>Claims that could be disproved by looking. A dimension, a temperature ceiling, a warranty term, a policy clause — checkable in under a minute.</li>
    <li>A date, and a review interval, so a stale price or a superseded model is at least visible as such.</li>
    <li>The money relationship stated where you are about to click, not on a page three clicks away. That one is not a courtesy; in the United States it is the Federal Trade Commission's standard for a material connection — disclose it clearly and conspicuously — and it is a written requirement of the Amazon Associates agreement to identify yourself as an Associate in specific words.</li>
  </ul>
</section>

<section>
  <h2>Hold this site to the same list</h2>
  <p>We have not tested anything, and we say so on every page rather than in a footer. We print no star ratings, because the ratings we could see belong to other people's scales. We print no prices, because we have no live feed. Our affiliate links are labelled as paid links where they appear, and until a listing is verified there is no link to click at all — which is the only defensible reason a buy button on this site currently says <em>locked</em>.</p>
  <p class="actions"><a class="btn ghost" href="{{base}}/verify/">See exactly what we verified, line by line</a> <a class="btn ghost" href="{{base}}/flagged/">And what we could not</a></p>
  <div class="callout plain">
    <p><strong>The uncomfortable version.</strong> A site that publishes its own compliance register is not automatically good. It is only checkable. Use that. Check it the way you would check a spec sheet, and if a row does not hold up, the argument for buying from us has just been settled by someone better placed than either of us.</p>
  </div>
</section>
`;
