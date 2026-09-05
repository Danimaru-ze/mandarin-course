function debounce(fn, wait) {
  var t = null;
  return function () {
    var args = arguments;
    clearTimeout(t);
    t = setTimeout(function () { fn.apply(null, args); }, wait);
  };
}

function normalizeStr(s) {
  return (s || "")
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "");
}

// Character grid browser: data = [[char, level], ...]
function createCharGridBrowser(cfg) {
  var state = { data: [], filtered: [], page: 1, query: "", level: "" };
  var pageSize = cfg.pageSize || 300;

  function applyFilter() {
    var rawQ = (state.query || "").trim();
    var q = normalizeStr(rawQ);
    state.filtered = state.data.filter(function (row) {
      if (state.level && row[1] !== state.level) return false;
      if (!rawQ) return true;
      var ch = row[0];
      if (ch.indexOf(rawQ) !== -1) return true;
      if (typeof __unihanData !== "undefined" && __unihanData && __unihanData[ch]) {
        var u = __unihanData[ch];
        var py = normalizeStr(u[0]);
        var def_id = normalizeStr(u[5]);
        var def_en = normalizeStr(u[2]);
        if (py.indexOf(q) !== -1) return true;
        if (def_id.indexOf(q) !== -1) return true;
        if (def_en.indexOf(q) !== -1) return true;
      }
      return false;
    });
    state.page = 1;
    render();
  }

  function renderCount() {
    cfg.countMount.textContent =
      state.filtered.length + " karakter ditemukan (dari total " + state.data.length + ")";
  }

  function renderGrid() {
    var start = (state.page - 1) * pageSize;
    var pageRows = state.filtered.slice(start, start + pageSize);
    if (pageRows.length === 0) {
      cfg.resultMount.innerHTML =
        '<div style="text-align:center;color:#888;padding:16px;">Tidak ada karakter yang cocok. Coba ubah kata kunci pencarian.</div>';
      return;
    }
    var html = '<div class="chargrid-flex">';
    pageRows.forEach(function (row) {
      var ch = row[0];
      var u = (typeof __unihanData !== "undefined" && __unihanData) ? __unihanData[ch] : null;
      var titleStr = ch;
      var subText = "";
      if (u) {
        var py = u[0] || "";
        var idMeaning = u[5] || "";
        var enMeaning = u[2] || "";
        titleStr = ch + (py ? " [" + py + "]" : "") + (idMeaning ? " - " + idMeaning : "") + (enMeaning ? " (" + enMeaning + ")" : "");
        subText = idMeaning || enMeaning || "";
      }
      html +=
        '<div onclick="showCharDetail(\'' + ch + '\')" ' +
        'title="' + escapeHtml(titleStr) + '" ' +
        'style="width:58px;text-align:center;border:1px solid #CCCCCC;background:#F8F8F5;padding:6px 2px;cursor:pointer;border-radius:2px;" ' +
        'onmouseover="this.style.background=\'#FFF3CF\'" onmouseout="this.style.background=\'#F8F8F5\'">' +
        '<div style="font-size:22px;line-height:1.2;">' + escapeHtml(ch) + '</div>' +
        '<div style="font-size:9.5px;color:#666;">Lv ' + escapeHtml(row[1]) + '</div>' +
        (subText ? '<div style="font-size:9px;color:#2C5F8A;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:52px;margin-top:2px;">' + escapeHtml(subText) + '</div>' : '') +
        '</div>';
    });
    html += "</div>";
    cfg.resultMount.innerHTML = html;
  }

  function renderPager() {
    var totalPages = Math.max(1, Math.ceil(state.filtered.length / pageSize));
    if (state.page > totalPages) state.page = totalPages;
    var html = "";
    html += '<button ' + (state.page <= 1 ? "disabled" : "") + ' onclick="window.__cg_' + cfg.id + '.goto(1)">&laquo; Awal</button>';
    html += '<button ' + (state.page <= 1 ? "disabled" : "") + ' onclick="window.__cg_' + cfg.id + '.goto(' + (state.page - 1) + ')">&lsaquo; Sebelumnya</button>';
    html += ' <span>Halaman ' + state.page + " dari " + totalPages + "</span> ";
    html += '<button ' + (state.page >= totalPages ? "disabled" : "") + ' onclick="window.__cg_' + cfg.id + '.goto(' + (state.page + 1) + ')">Berikutnya &rsaquo;</button>';
    html += '<button ' + (state.page >= totalPages ? "disabled" : "") + ' onclick="window.__cg_' + cfg.id + '.goto(' + totalPages + ')">Akhir &raquo;</button>';
    cfg.pagerMount.innerHTML = html;
  }

  function render() {
    renderCount();
    renderGrid();
    renderPager();
  }

  var api = {
    goto: function (p) { state.page = p; render(); },
    setQuery: function (q) { state.query = q; applyFilter(); },
    setLevel: function (lvl) { state.level = lvl; applyFilter(); },
    load: function () {
      cfg.resultMount.innerHTML = '<div class="loadingnote">Memuat data...</div>';
      var pUnihan = typeof loadUnihan === "function" ? loadUnihan() : Promise.resolve({});
      return Promise.all([
        fetch(cfg.dataUrl).then(function (r) { return r.json(); }),
        pUnihan
      ]).then(function (results) {
        state.data = results[0];
        applyFilter();
      });
    },
  };
  window["__cg_" + cfg.id] = api;
  return api;
}
