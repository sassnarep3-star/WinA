// ============================================================
// The two "fronts" of the publication.
//
// A reader arriving from a search engine is looking for one of
// two jobs, not for a list of five products. This module writes
// each job as a page: which products belong to it, which
// decision the buyer is actually making, and what would make
// each recommendation wrong.
//
// Rules that keep this honest:
//   · No product claim appears here that is not already in
//     data/products.json with a source.
//   · No superlative ("best"), no price, no rating, no test.
//   · Every "pick" is tied to a stated trade-off, so a reader
//     can disagree with it using their own kitchen as evidence.
// ============================================================

export const services = [
  {
    slug: "dinner-in-one-drawer",
    name: "Dinner in one drawer",
    kicker: "Air fryers",
    category: "air-fryers",
    title: "Dinner in one drawer: which air fryer fits a weeknight",
    dek: "Three air fryers, three different answers to the same Tuesday-night problem: protein and a side, hot, at the same time, without turning on the oven.",
    lede:
      "Most air fryer advice starts with crispness. That is the least useful thing to compare, because every machine in this set moves hot air over food and every one of them will brown a chip. The decisions that actually change your weeknight are how many things can cook at once, whether the second thing has to wait, and how much counter the machine takes when it is not in use.",
    plate: "steam",
    plateCaption: "Illustration, not a product photograph. No appliance is depicted.",
    sections: [
      {
        h: "The three decisions, in the order they cost you money",
        body: [
          "**How many temperatures at once.** A single drawer runs one temperature per cycle. If your plate is fries at one heat and chicken at another, a single-drawer machine makes you choose: compromise on one, or run two cycles. Two drawers, or a large oven chamber, changes that arithmetic.",
          "**Whether the food lies flat or piles up.** A drawer holds a pile you can shake. A tray holds something whole and flat. Whole birds, salmon sides and sheet-pan vegetables are tray jobs, and no amount of drawer capacity turns a pile into a tray.",
          "**Where it lives when it is idle.** These are not appliances you put away. Whatever you buy occupies counter space permanently, and a dual-drawer body is wider than the capacity number suggests. This is the decision people make last and regret most."
        ]
      },
      {
        h: "How to tell which one is yours",
        body: [
          "Write down the last five dinners you actually cooked — not the ones you plan to cook in January. Against each, note two things: was it one item or two at different temperatures, and did it go in as a pile or a tray?",
          "Four of five piles of one thing: you want volume in one chamber. Three or more two-part dinners: you want two chambers. Anything with a whole bird or a flat tray: you are shopping for a small oven, and the drawer-shaped machines are the wrong category regardless of size."
        ]
      },
      {
        h: "What we will not tell you",
        body: [
          "We have not cooked in any of these machines. Nothing on this site was tested, and no page claims otherwise — that constraint is what keeps the rest of this readable. Retailer ratings, review counts and current prices are also absent: Amazon's program policies restrict displaying them without its API, and we have no API access.",
          "What is here is what the official listings and the manufacturers' own pages state, each row marked with how well it is supported, plus the trade-offs those specifications imply. Where a number could not be confirmed from an official source, the row is blank rather than estimated."
        ]
      }
    ],
    picks: [
      {
        slug: "chefman-6-quart-dual-basket",
        forWho: "Two-part dinners, cooked separately, finished together",
        reason:
          "Two independent drawers with a sync-finish feature is the direct answer to the two-temperature problem, and it does it in a smaller footprint than an oven-style body.",
        against: "Six quarts is two three-quart cooks, not one six-quart cook. A whole chicken does not fit."
      },
      {
        slug: "chefman-8-quart-turbofry",
        forWho: "Single-batch cooking, one temperature, as much as possible",
        reason:
          "One large drawer holds a genuinely big batch. If your dinners are piles of one thing, this removes the batching that a dual drawer forces on you.",
        against: "One chamber means one temperature. Two-part dinners turn into two cycles."
      },
      {
        slug: "emeril-lagasse-26qt-french-door",
        forWho: "Tray cooking and whole-bird nights",
        reason:
          "A 26-quart French-door chamber takes a tray and takes something whole. It is the only unit in this set that can do those jobs at all.",
        against: "It is a small oven, and it behaves like one: more to heat, more to wash, most of a counter permanently."
      }
    ],
    faq: [
      {
        q: "Is a bigger air fryer always better?",
        a: "No. Capacity costs counter space and, for basket units, it costs a second temperature. The useful question is what size batch your normal dinner is, not the largest batch you might someday cook."
      },
      {
        q: "Can an air fryer replace an oven?",
        a: "An oven-style unit can take over some oven jobs. A drawer cannot take a tray or a whole bird. If replacing the oven is the goal, only one form factor in this set is in the conversation."
      },
      {
        q: "Why are there no prices or star ratings on this page?",
        a: "Amazon's program policies restrict displaying current prices, ratings and reviews without its API, and prohibit price tracking outright. We have no API access, so the numbers are absent rather than stale or invented."
      }
    ]
  },
  {
    slug: "hands-off-the-grill",
    name: "Hands off the grill",
    kicker: "Thermometers",
    category: "thermometers",
    title: "Hands off the grill: instant-read or leave-in, and when you need both",
    dek: "One thermometer answers “is this done right now?”. The other answers “tell me when it is done” while the lid stays shut. Most serious cooks eventually own both, in that order.",
    lede:
      "A thermometer is the cheapest piece of kit in a kitchen that reliably changes the outcome of a cook, and it is also the one people buy twice. The first purchase is usually an instant-read, because it is the obvious tool. The second happens the first time you try to monitor a roast without opening the oven every ten minutes.",
    plate: "probe",
    plateCaption: "Illustration, not a product photograph. No specific thermometer is depicted.",
    sections: [
      {
        h: "What each one is actually for",
        body: [
          "**Instant-read** — you insert it, you read a number, you take it out. The job is a decision at a single moment: is the chicken thigh at temperature, is the steak where I want it before the sear, has the bread hit its mark. It is a spot check, and its value is speed and the fact that it lives in a drawer.",
          "**Leave-in, wireless** — the probe stays in the food while it cooks and reports continuously to a receiver or a phone. The job is a process, not a moment: a long roast, a brisket, anything on a closed grill or in an oven where opening the door costs you heat and time."
        ]
      },
      {
        h: "The questions that separate them",
        body: [
          "**Does the lid stay shut?** If the answer has to be yes for most of the cook, you need a leave-in. An instant-read with the lid open is a heat leak with a digital display.",
          "**How long is the cook?** Minutes: instant-read. An hour or more: leave-in, because you will otherwise check too often, and every check is a temperature drop.",
          "**Do you want a second screen in your life?** The wireless units in this set depend on an app for their best features. That is a real cost — of attention and of long-term software support, which we could not verify for any model here.",
          "**Are you cooking more than one thing?** Multiple probes let you track a joint and a side simultaneously. A single instant-read makes you serialise those checks."
        ]
      },
      {
        h: "What a specification does not tell you",
        body: [
          "Read time and stated accuracy are the numbers on the box. They do not tell you whether the probe survives being dropped, whether the app still gets updates in three years, or how the thing feels in a hand — all of which decide whether you reach for it.",
          "We could not verify long-term software support for either wireless option in this set, and we say so rather than implying it. Where a manufacturer's own page and its retail listing disagree — which happens on the units here — the disagreement is recorded on the product page instead of being smoothed over."
        ]
      }
    ],
    picks: [
      {
        slug: "thermomaven-1-sec-thermometer",
        forWho: "A drawer thermometer that gets used every day",
        reason:
          "One second to a reading is fast enough that the tool stops being a production and starts being a habit, which is the entire point of an instant-read.",
        against:
          "It measures only while inserted. There is no monitoring, no alerts, and no second probe."
      },
      {
        slug: "chef-iq-sense-gen3",
        forWho: "Long cooks where the lid stays closed",
        reason:
          "Multiple wireless probes that keep reporting while the food cooks is the capability an instant-read structurally cannot provide.",
        against:
          "It is a monitoring system with an app dependency, not a grab-and-check tool, and its usefulness over years depends on software support we could not verify."
      }
    ],
    faq: [
      {
        q: "Can I just use an instant-read for everything?",
        a: "For fast cooks, yes, and most people should start there. It stops working the moment opening the lid or door costs you the result — long roasts, closed grills, anything you want to leave alone."
      },
      {
        q: "Is a wireless probe worth it for a weekend cook?",
        a: "Only if the cook is long. For a steak or a chicken breast it adds setup and cleanup for a reading you could have taken in one second. For a roast, a brisket or an all-day smoke, it is the difference between monitoring and guessing."
      },
      {
        q: "Do these pages show accuracy test results?",
        a: "No. Accuracy figures on this site are the manufacturers' stated values, labelled as claims where we could not verify them independently. We have not tested any thermometer."
      }
    ]
  }
];

export const byline = {
  desk: "Counter Space editorial desk",
  descriptor: "Decision-first buying guides",
  // The byline is a desk, not a person, because no person has been named.
  // Naming a fictional author would be the single most damaging lie this
  // site could tell, so the transparency block says so instead.
  why: "This is a desk byline, not a named writer. No individual has been identified as the author, and inventing one would misrepresent who is accountable for the page. The editorial standard the desk works to is published in full on the About page."
};
