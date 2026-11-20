export const meta = {
  slug: "no-hype-capacity-checklist",
  title: "A no-hype checklist for comparing air fryer capacity",
  dek: "Quarts measure the box, not the dinner. Here is how to read a capacity number without being sold a fantasy about a whole chicken.",
  section: "air-fryers",
  seasons: ["holiday-cooking", "batch-cooking"],
  published: "2026-11-20",
  lastReviewed: "2026-11-20",
  readMinutes: 6,
  hypotheses: "Written as a working-title guide from the project brief; no popularity or search-volume claim is being made.",
  sourceIds: ["SRC-14"],
  faq: [
    { q: "Is a bigger air fryer always better?", a: "No. A cavity you cannot fill wastes counter space and takes longer to come up to temperature. Bigger is better only when you cook in one pass for more people than a basket can hold." },
    { q: "How many quarts for a family of four?", a: "We will not answer that, because the honest answer depends on the food, not the household. Four boneless thighs in a single layer is a different question from four whole breasts, and a tray of wings is a different question again." },
    { q: "Does a rack double the capacity?", a: "It doubles the surface you can lay food on. It does not double the crisping, because the top rack shields the one below it from direct airflow and drips onto it." },
    { q: "Why not just believe the marketing image?", a: "Because images are usually staged with food piled in a way the recipe advice in the same manual then tells you not to do." }
  ]
};

export const body = `
<section>
  <p class="lede">A capacity number is the least comparable figure on an appliance page. Two machines both labelled 6 qt can hold different dinners, because the number describes air, not food.</p>
</section>

<section>
  <h2>Four different things a quarts number can mean</h2>
  <table class="compare">
    <thead><tr><th>What is measured</th><th>What you get</th><th>How to catch it</th></tr></thead>
    <tbody>
      <tr><td>Total cavity volume</td><td>The most generous reading; includes space the element eats</td><td>Compare with the "usable basket" figure if the manual gives one</td></tr>
      <tr><td>Removable basket volume</td><td>The number that matters for a single-layer cook</td><td>Look for whether the basket is measured with the tray in place</td></tr>
      <tr><td>Manufacturer's food claim</td><td>"1 whole chicken" or "2 lbs of fries" — a claim, not a dimension</td><td>Check whether the same page says to cook in a single layer</td></tr>
      <tr><td>Multi-drawer combined volume</td><td>Two cavities added together, never two cavities used together</td><td>Ask whether one drawer can hold the biggest thing you cook</td></tr>
    </tbody>
  </table>
</section>

<section>
  <h2>The single-layer rule, and why it is not a marketing invention</h2>
  <p>These appliances are small convection ovens. Hot air has to move across the surface of the food and carry moisture away. Pile it and you have steamed it. That is why the loudest crisping claims belong to the smallest loads, and why "just shake it halfway" is advice about crowding as much as about browning.</p>
  <p>So the useful capacity figure is not quarts. It is: <strong>what is the largest single layer of the food you cook most, and does it fit?</strong></p>
  <ul class="ticks">
    <li>Write down your most-cooked item in centimetres — a tray of four cutlets, a 2 lb bag of wedges, six thighs.</li>
    <li>Compare that with the basket's <em>inner</em> dimensions, which manuals often give and listings often omit.</li>
    <li>If the only figure on the page is quarts, treat the capacity as unknown until you find the inner measurement.</li>
  </ul>
</section>

<section>
  <h2>A printable way to compare, without a spreadsheet</h2>
  <p>Take three columns. Label them with the models you are actually considering — not categories, models, because two models from one brand can be a different machine in a new shell. Fill only the four rows that decide it: inner cooking area, wattage, temperature ceiling, and which parts come off to wash. Everything else is decoration.</p>
  <p class="actions"><a class="btn" href="{{base}}/section/air-fryers/" data-print="sheet">Print the comparison sheet</a></p>
</section>

<section>
  <h2>Capacity traps worth naming</h2>
  <ul class="cross">
    <li><strong>The window tax.</strong> A door with a window costs depth on the inside of the front wall.</li>
    <li><strong>The coil shelf.</strong> Anything above the food takes volume you will want for a tall item.</li>
    <li><strong>Two drawers, one dinner.</strong> Combined volume claims are real arithmetic about the wrong thing.</li>
    <li><strong>Rack-and-tray illusions.</strong> Third-party racks sold separately convert one cavity into two — and are usually not in the box, and not tested with it.</li>
  </ul>
  <div class="callout">
    <p><strong>One food-safety note that overrides all of this.</strong> Bigger loads are the usual reason a thick piece of poultry comes out underdone. Capacity changes the timing; it does not change the rule. Cook all poultry to a minimum internal temperature of 165 °F (73.9 °C), measured with a food thermometer, before removing it from the heat — the USDA FSIS chart is the source, and it is worth reading once.</p>
  </div>
  <div class="callout plain">
    <p><strong>What we did not do.</strong> No unit was loaded, timed, or weighed for this guide, and we did not scrape a single review corpus to average out a "best size for four". We are not able to tell you which number wins. We can tell you which numbers are worth writing down.</p>
  </div>
</section>
`;
