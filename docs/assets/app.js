/* The Preheat — the only script the site loads.
   No cookies, no identifiers, no third party. Events are sent only when a host is configured
   (body[data-endpoint]); with it blank — as shipped — this file counts nothing and sends nowhere. */
(() => {
  "use strict";
  const body = document.body;
  const base = body.dataset.base || ".";
  const endpoint = (body.dataset.endpoint || "").replace(/\/$/, "");
  const page = location.pathname.replace(/\/index\.html$/, "/") || "/";
  const day = () => new Date().toISOString().slice(0, 10);

  /* ------------------------------------------------------------------ events */
  function send(name, fields) {
    if (!endpoint) return;
    const payload = Object.assign({ e: name, p: page, t: day() }, fields || {});
    const url = endpoint + "/e";
    try {
      if (navigator.sendBeacon) {
        navigator.sendBeacon(url, new Blob([JSON.stringify(payload)], { type: "application/json" }));
      } else {
        fetch(url, { method: "POST", body: JSON.stringify(payload), headers: { "content-type": "application/json" }, keepalive: true, mode: "no-cors" });
      }
    } catch (_) {
      /* a blocked or offline counter must never break the page */
    }
  }
  if (endpoint) send("page_view", {});

  document.addEventListener("click", (ev) => {
    const a = ev.target.closest && ev.target.closest('a[data-track="outbound_click"]');
    if (a) {
      send("outbound_click", { l: a.dataset.product || "", slot: a.dataset.slot || "in-text" });
      return;
    }
    const lock = ev.target.closest && ev.target.closest('[data-track="gate_block"]');
    if (lock) {
      send("gate_block", { l: lock.dataset.product || "", reason: lock.dataset.reason || "unverified-listing", slot: lock.dataset.slot || "" });
      let note = lock.parentElement.querySelector(".unlocknote");
      if (!note) {
        note = document.createElement("p");
        note.className = "unlocknote";
        note.style.cssText = "font-size:.8rem;color:var(--ink-3);margin:.6rem 0 0;border-top:1px dotted var(--rule);padding-top:.5rem";
        note.innerHTML =
          'Locked because no official listing has been confirmed for this record. <a href="' +
          base +
          '/flagged/#flg-001">What has to happen</a> · <a href="' +
          base +
          '/decision-brief/#q-01">the one answer</a>.';
        lock.parentElement.appendChild(note);
      }
      note.hidden = !note.hidden;
    }
  });

  if ("IntersectionObserver" in window) {
    const seen = new WeakSet();
    const io = new IntersectionObserver(
      (entries) => {
        for (const en of entries) {
          if (!en.isIntersecting || seen.has(en.target)) continue;
          seen.add(en.target);
          const el = en.target;
          setTimeout(() => {
            if (el.getBoundingClientRect().top < window.innerHeight * 1.4) send("product_card_impression", { l: el.dataset.product || "" });
          }, 1000);
        }
      },
      { threshold: 0.5 }
    );
    document.querySelectorAll("[data-impression]").forEach((el) => io.observe(el));
  }

  /* ------------------------------------------------------------------- tools */
  const num = (v) => {
    const n = parseFloat(v);
    return Number.isFinite(n) && n >= 0 ? n : null;
  };
  const money = (n) => n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: n < 10 ? 3 : 0 });
  const TOOLS = {
    costrun: {
      fields: [
        { k: "watts", label: "Power (W)", ph: "1500" },
        { k: "minutes", label: "Minutes per day", ph: "35" },
        { k: "rate", label: "Cost per kWh", ph: "0.28" },
        { k: "days", label: "Days per week", val: "5" }
      ],
      run(v) {
        const w = num(v.watts), m = num(v.minutes), r = num(v.rate), d = num(v.days) || 7;
        if (w === null || m === null || r === null) return { out: "Add power, minutes and your rate.", work: "" };
        const hrsWeek = (m / 60) * d;
        const kwhYear = (w / 1000) * hrsWeek * (52 / 1);
        const costYear = kwhYear * r;
        const cycling = costYear * 0.72;
        return {
          out: money(costYear) + " a year",
          sub: money(costYear / 12) + " a month · " + money((w / 1000) * r) + " per hour at full draw",
          work:
            `kWh/yr = ${w} W ÷ 1000 × (${m} min ÷ 60) × ${d} days × 52 = ${kwhYear.toFixed(1)} kWh\n` +
            `cost/yr = ${kwhYear.toFixed(1)} kWh × ${r} = ${money(costYear)}\n` +
            `if the element cycles and averages ~72% of rated draw: ${money(cycling)} — an illustrative second assumption, not a measurement of any appliance.`,
          inputs: { w, m, r, d }
        };
      }
    },
    footprint: {
      fields: [
        { k: "aw", label: "Appliance width (cm)" },
        { k: "ad", label: "Appliance depth (cm)" },
        { k: "ah", label: "Appliance height (cm)" },
        { k: "gap", label: "Clearance each side/back (cm)", val: "10" },
        { k: "cw", label: "Counter width free (cm)" },
        { k: "cd", label: "Counter depth free (cm)" },
        { k: "ch", label: "Clear height under cabinet (cm)" }
      ],
      run(v) {
        const aw = num(v.aw), ad = num(v.ad), ah = num(v.ah), g = num(v.gap) || 0, cw = num(v.cw), cd = num(v.cd), ch = num(v.ch);
        if (aw === null || ad === null) return { out: "Start with the appliance width and depth.", work: "" };
        const needW = aw + 2 * g, needD = ad + g, needH = ah;
        const verdict = [];
        verdict.push(cw === null ? "width: enter your counter width" : (cw >= needW ? `width OK, ${fmt(cw - needW)} cm spare` : `too wide by ${fmt(needW - cw)} cm`));
        verdict.push(cd === null ? "depth: enter your counter depth" : (cd >= needD ? `depth OK, ${fmt(cd - needD)} cm spare` : `too deep by ${fmt(needD - cd)} cm`));
        verdict.push(ch === null ? "height: enter the clearance under your cabinet" : (ch >= needH ? `height OK, ${fmt(ch - needH)} cm spare` : `too tall by ${fmt(needH - ch)} cm`));
        return {
          out: verdict.filter((x) => !x.includes("enter")).length === 3 && verdict.every((x) => x.includes("OK")) ? "It fits, with the gap you specified" : "Check the failing dimension below",
          sub: verdict.join(" · "),
          work:
            `needed width  = ${aw} + 2 × ${g} clearance = ${fmt(needW)} cm\n` +
            `needed depth  = ${ad} + ${g} at the back      = ${fmt(needD)} cm\n` +
            `needed height = ${ah} cm (no clearance added — your manual may demand some above)`
        };
      }
    }
  };
  const fmt = (n) => (Math.round(n * 10) / 10).toString().replace(/\.0$/, "");

  document.querySelectorAll("[data-tool]").forEach((host) => {
    const tool = TOOLS[host.dataset.tool];
    if (!tool) return;
    host.innerHTML = "";
    const grid = document.createElement("div");
    grid.className = "tool__grid";
    const out = document.createElement("output");
    out.className = "tool__out";
    out.textContent = host.classList.contains("toolbox--page") ? "Fill the boxes and the numbers appear." : "Fill these in and the arithmetic shows below.";
    const sub = document.createElement("p");
    sub.className = "tool__sub";
    sub.style.cssText = "font-size:.88rem;color:var(--ink-2);margin:.35rem 0 0";
    const work = document.createElement("p");
    work.className = "tool__work";
    const inputs = {};
    tool.fields.forEach((f) => {
      const label = document.createElement("label");
      label.innerHTML = `<span>${f.label}</span>`;
      const i = document.createElement("input");
      i.type = "number";
      i.min = "0";
      i.step = "any";
      i.inputMode = "decimal";
      if (f.ph) i.placeholder = f.ph;
      if (f.val) i.value = f.val;
      i.id = `t-${host.dataset.tool}-${f.k}-${Math.random().toString(36).slice(2, 7)}`;
      label.htmlFor = i.id;
      label.appendChild(i);
      grid.appendChild(label);
      inputs[f.k] = i;
    });
    const go = () => {
      const vals = {};
      for (const [k, i] of Object.entries(inputs)) vals[k] = i.value;
      const res = tool.run(vals);
      out.textContent = res.out;
      sub.textContent = res.sub || "";
      work.textContent = res.work || "";
    };
    Object.values(inputs).forEach((i) => i.addEventListener("input", go));
    host.append(grid, out, sub, work);
    if (host.dataset.warn) {
      const w = document.createElement("p");
      w.className = "tool__warn";
      w.textContent = host.dataset.warn;
      host.appendChild(w);
    }
    if (!host.classList.contains("toolbox--page")) {
      const more = document.createElement("p");
      more.className = "tool__more";
      more.style.cssText = "font-size:.8rem;color:var(--ink-3);margin:.7rem 0 0";
      more.innerHTML = `The same tool, full size, lives in <a href="${base}/tools/">the tools page</a>. Nothing you type here is sent anywhere.`;
      host.appendChild(more);
    }
  });

  /* ------------------------------------------------------------------ search */
  const searchHost = document.querySelector("[data-search]");
  if (searchHost) {
    const input = searchHost.querySelector("input");
    const count = searchHost.querySelector("[data-count]");
    const list = document.querySelector("[data-results]");
    let idx = [];
    fetch(base + "/search.json")
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => {
        idx = d;
        if (input.value) run(input.value);
      })
      .catch(() => {
        count.textContent = "index unavailable offline";
      });
    const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
    function run(q) {
      const needle = q.trim().toLowerCase();
      if (needle.length < 2) {
        list.innerHTML = "";
        count.textContent = idx.length ? idx.length + " pages indexed" : "";
        return;
      }
      const terms = needle.split(/\s+/).filter(Boolean);
      const hits = [];
      for (const it of idx) {
        const hay = it.w + " " + it.t.toLowerCase();
        if (!terms.every((t) => hay.includes(t))) continue;
        const score = terms.reduce((a, t) => a + (it.t.toLowerCase().includes(t) ? 4 : 1), 0);
        hits.push({ it, score });
      }
      hits.sort((a, b) => b.score - a.score);
      const top = hits.slice(0, 12);
      count.textContent = top.length + " match" + (top.length === 1 ? "" : "es");
      list.innerHTML = top
        .map((h) => `<li><span class="kind">${esc(h.it.k)}</span><a href="${base}${h.it.u}">${esc(h.it.t)}</a><span>${esc(h.it.d)}</span></li>`)
        .join("");
    }
    input.addEventListener("input", () => run(input.value));
    searchHost.addEventListener("submit", (e) => e.preventDefault());
    if (location.search.includes("q=")) {
      input.value = new URLSearchParams(location.search).get("q") || "";
      run(input.value);
    }
    input.focus({ preventScroll: true });
  }

  /* ------------------------------------------------------- suggestion filters */
  const filters = document.querySelector("[data-filters]");
  if (filters) {
    const items = [...document.querySelectorAll(".sugg")];
    const tracks = [...document.querySelectorAll(".track")];
    const countEl = filters.querySelector("[data-filtercount]");
    const sel = [...filters.querySelectorAll("[data-filter]")];
    const meta = new Map(
      items.map((el) => [
        el,
        {
          track: el.closest(".track") ? el.closest(".track").dataset.track : "",
          status: (el.querySelector(".chip") ? el.querySelector(".chip").textContent.trim() : ""),
          path: el.outerHTML.includes("chip--path") ? [...el.querySelectorAll(".chip--path")].map((c) => c.textContent).join("") : ""
        }
      ])
    );
    function apply() {
      const want = Object.fromEntries(sel.map((s) => [s.dataset.filter, s.value]));
      let shown = 0;
      items.forEach((el) => {
        const m = meta.get(el);
        const ok =
          (!want.track || m.track === want.track) &&
          (!want.status || m.status.toLowerCase() === want.status.toLowerCase()) &&
          (!want.path || m.path.includes("PATH-" + want.path));
        el.dataset.hidden = ok ? "0" : "1";
        if (ok) shown++;
      });
      tracks.forEach((t) => {
        const any = [...t.querySelectorAll(".sugg")].some((e) => e.dataset.hidden !== "1");
        t.dataset.hidden = any ? "0" : "1";
      });
      if (countEl) countEl.textContent = `${shown} of ${items.length} shown`;
    }
    sel.forEach((s) => s.addEventListener("change", apply));
  }

  /* ------------------------------------------------------ decision persistence
     Stored in this browser only (localStorage), never transmitted. It exists so a
     reviewer can mark up the board and copy the result into COORDINATION.md. */
  const KEY = "preheat.decisions.v1";
  const read = () => {
    try {
      return JSON.parse(localStorage.getItem(KEY) || "{}");
    } catch (_) {
      return {};
    }
  };
  const save = (o) => {
    try {
      localStorage.setItem(KEY, JSON.stringify(o));
    } catch (_) {}
  };
  document.querySelectorAll("[data-decision]").forEach((box) => {
    const id = box.dataset.decision;
    const saved = read()[id];
    box.querySelectorAll("[data-choice]").forEach((r) => {
      if (saved && r.value === saved) r.checked = true;
      r.addEventListener("change", () => {
        const o = read();
        o[id] = r.value;
        save(o);
      });
    });
  });
  const exp = document.querySelector("[data-export-decisions]");
  if (exp)
    exp.addEventListener("click", async () => {
      const o = read();
      const text = JSON.stringify({ brand: body.dataset.brand, exported: new Date().toISOString(), decisions: o }, null, 2);
      try {
        await navigator.clipboard.writeText(text);
        exp.textContent = `Copied — ${Object.keys(o).length} decisions`;
      } catch (_) {
        const ta = document.createElement("textarea");
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        ta.remove();
        exp.textContent = "Copied to clipboard";
      }
      setTimeout(() => (exp.textContent = "Copy decisions as JSON"), 2600);
    });
  const clr = document.querySelector("[data-clear-decisions]");
  if (clr)
    clr.addEventListener("click", () => {
      try {
        localStorage.removeItem(KEY);
      } catch (_) {}
      document.querySelectorAll('[data-decision] [data-choice]').forEach((r) => (r.checked = false));
    });

  /* ------------------------------------------------------------------ chrome */
  const btn = document.querySelector(".menubtn");
  if (btn)
    btn.addEventListener("click", () => {
      const open = body.classList.toggle("nav-open");
      btn.setAttribute("aria-expanded", open ? "true" : "false");
    });
  document.querySelectorAll("[data-print]").forEach((b) => b.addEventListener("click", (e) => {
    e.preventDefault();
    window.print();
  }));
})();
