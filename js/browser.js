// Generic vocab browser. config:
// { dataUrl, columns: [{label, index, cls, hanzi(bool)}], searchIdx: [i,...],
//   levelIdx: index-or-null, levels: [{value,label}] or null (auto from data),
//   pageSize, mount: element, tabsMount: element (optional),
//   searchMount, resultMount, pagerMount, countMount }
function createVocabBrowser(cfg) {
  var state = { data: [], filtered: [], page: 1, query: "", level: "" };
  var pageSize = cfg.pageSize || 50;

  function normalize(s) {
    // Lowercase, strip pinyin tone diacritics (nǐ -> ni) and spaces so that
    // searches like "ni hao" or "nihao" match "nǐhǎo".
    return (s || "")
      .toString()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, "");
  }

  function applyFilter() {
    var q = normalize(state.query);
    var lvl = state.level;
    state.filtered = state.data.filter(function (row) {
      if (lvl && cfg.levelIdx !== null && cfg.levelIdx !== undefined) {
        if (row[cfg.levelIdx] !== lvl) return false;
      }
      if (!q) return true;
      for (var k = 0; k < cfg.searchIdx.length; k++) {
        var v = normalize(row[cfg.searchIdx[k]]);
        if (v.indexOf(q) !== -1) return true;
      }
      return false;
    });
    state.page = 1;
    render();
  }

  function renderCount() {
    cfg.countMount.textContent =
      state.filtered.length + " entri ditemukan (dari total " + state.data.length + ")";
  }

  function renderTable() {
    var start = (state.page - 1) * pageSize;
    var pageRows = state.filtered.slice(start, start + pageSize);
    var html = '<table class="datatable"><thead><tr>';
    cfg.columns.forEach(function (c) {
      html += "<th>" + c.label + "</th>";
    });
    html += "</tr></thead><tbody>";
    if (pageRows.length === 0) {
      html +=
        '<tr><td colspan="' +
        cfg.columns.length +
        '" style="text-align:center;color:#888;padding:16px;">Tidak ada hasil. Coba ubah kata kunci pencarian.</td></tr>';
    }
    pageRows.forEach(function (row) {
      html += "<tr>";
      cfg.columns.forEach(function (c) {
        var val = row[c.index];
        var cellClass = c.cls ? ' class="' + c.cls + '"' : "";
        var content = c.hanzi ? makeClickableHanzi(val) : escapeHtml(val);
        html += "<td" + cellClass + ">" + content + "</td>";
      });
      html += "</tr>";
    });
    html += "</tbody></table>";
    cfg.resultMount.innerHTML = html;
  }

  function renderPager() {
    var totalPages = Math.max(1, Math.ceil(state.filtered.length / pageSize));
    if (state.page > totalPages) state.page = totalPages;
    var html = "";
    html +=
      '<button ' +
      (state.page <= 1 ? "disabled" : "") +
      ' onclick="window.__vb_' +
      cfg.id +
      '.goto(1)">&laquo; Awal</button>';
    html +=
      '<button ' +
      (state.page <= 1 ? "disabled" : "") +
      ' onclick="window.__vb_' +
      cfg.id +
      '.goto(' +
      (state.page - 1) +
      ')">&lsaquo; Sebelumnya</button>';
    html += ' <span>Halaman ' + state.page + " dari " + totalPages + "</span> ";
    html +=
      '<button ' +
      (state.page >= totalPages ? "disabled" : "") +
      ' onclick="window.__vb_' +
      cfg.id +
      '.goto(' +
      (state.page + 1) +
      ')">Berikutnya &rsaquo;</button>';
    html +=
      '<button ' +
      (state.page >= totalPages ? "disabled" : "") +
      ' onclick="window.__vb_' +
      cfg.id +
      '.goto(' +
      totalPages +
      ')">Akhir &raquo;</button>';
    cfg.pagerMount.innerHTML = html;
  }

  function render() {
    renderCount();
    renderTable();
    renderPager();
  }

  var api = {
    goto: function (p) {
      state.page = p;
      render();
    },
    setQuery: function (q) {
      state.query = q;
      applyFilter();
    },
    setLevel: function (lvl) {
      state.level = lvl;
      applyFilter();
    },
    getData: function () {
      return state.data;
    },
    load: function () {
      cfg.resultMount.innerHTML = '<div class="loadingnote">Memuat data...</div>';
      return fetch(cfg.dataUrl)
        .then(function (r) { return r.json(); })
        .then(function (d) {
          state.data = d;
          applyFilter();
        });
    },
  };
  window["__vb_" + cfg.id] = api;
  return api;
}

function debounce(fn, wait) {
  var t = null;
  return function () {
    var args = arguments;
    clearTimeout(t);
    t = setTimeout(function () {
      fn.apply(null, args);
    }, wait);
  };
}
