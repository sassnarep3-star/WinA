// Progressive enhancements only. Every page works without this file.
(function () {
  // Sortable tables: click a header to sort; keyboard via Enter/Space on the header button.
  function cellValue(td) {
    var t = td.textContent.trim().replace(/\s+/g, " ");
    var n = parseFloat(t.replace(/[^0-9.\-]/g, ""));
    return isNaN(n) || !/^[\s\S]*\d/.test(t) ? { s: t.toLowerCase() } : { n: n, s: t.toLowerCase() };
  }
  function makeSortable(table) {
    var heads = table.querySelectorAll("thead th");
    heads.forEach(function (th, col) {
      var label = th.textContent;
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "sort";
      btn.textContent = label;
      btn.setAttribute("aria-label", "Sort by " + label);
      th.textContent = "";
      th.appendChild(btn);
      th.setAttribute("aria-sort", "none");
      btn.addEventListener("click", function () {
        var tbody = table.tBodies[0];
        var rows = Array.prototype.slice.call(tbody.rows).filter(function (r) { return !r.classList.contains("empty"); });
        var dir = th.getAttribute("aria-sort") === "ascending" ? -1 : 1;
        heads.forEach(function (h) { h.setAttribute("aria-sort", "none"); var a = h.querySelector(".arrow"); if (a) a.remove(); });
        th.setAttribute("aria-sort", dir === 1 ? "ascending" : "descending");
        var arrow = document.createElement("span"); arrow.className = "arrow"; arrow.setAttribute("aria-hidden", "true");
        arrow.textContent = dir === 1 ? "▲" : "▼"; th.appendChild(arrow);
        rows.sort(function (a, b) {
          var x = cellValue(a.cells[col]), y = cellValue(b.cells[col]);
          if (x.n !== undefined && y.n !== undefined) return (x.n - y.n) * dir;
          return x.s.localeCompare(y.s) * dir;
        });
        rows.forEach(function (r) { tbody.appendChild(r); });
      });
    });
  }
  document.querySelectorAll("table.data-table").forEach(makeSortable);

  // Suggestions: copy a plain-text summary of the choices made.
  var copy = document.getElementById("copy-choices");
  if (copy) {
    copy.addEventListener("click", function () {
      var lines = [];
      document.querySelectorAll("fieldset.decision").forEach(function (fs) {
        var checked = fs.querySelector("input:checked");
        lines.push(fs.dataset.id + ": " + (checked ? checked.value : "no choice"));
      });
      var text = "My choices for the suggestions:\n" + lines.join("\n");
      var out = document.getElementById("choices-out");
      if (out) { out.value = text; out.focus(); out.select(); }
      var status = document.getElementById("copy-status");
      if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(function () { if (status) status.textContent = "Copied."; },
          function () { if (status) status.textContent = "Select the text below and copy it."; });
      } else if (status) { status.textContent = "Select the text below and copy it."; }
    });
  }
})();
