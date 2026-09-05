// Character detail popup - looks up Unihan data for a single hanzi.
var __unihanData = null;
var __unihanLoading = null;

function escapeHtml(s) {
  if (s === undefined || s === null) return "";
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function loadUnihan() {
  if (__unihanData) return Promise.resolve(__unihanData);
  if (__unihanLoading) return __unihanLoading;
  __unihanLoading = fetch("data/unihan.json")
    .then(function (r) { return r.json(); })
    .then(function (d) { __unihanData = d; return d; });
  return __unihanLoading;
}

function ensureCharDetailPanel() {
  if (document.getElementById("chardetail")) return;

  var backdrop = document.createElement("div");
  backdrop.id = "cdbackdrop";
  backdrop.onclick = closeCharDetail;
  document.body.appendChild(backdrop);

  var panel = document.createElement("div");
  panel.id = "chardetail";
  panel.innerHTML =
    '<div class="cdhead"><span id="cdchar">字</span>' +
    '<a href="#" class="cdclose" onclick="closeCharDetail(); return false;" title="Tutup">[tutup &times;]</a></div>' +
    '<div class="cdbody" id="cdbody">...</div>';
  document.body.appendChild(panel);

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeCharDetail();
  });
}

function showCharDetail(ch) {
  ensureCharDetailPanel();
  var panel = document.getElementById("chardetail");
  var backdrop = document.getElementById("cdbackdrop");
  var body = document.getElementById("cdbody");
  document.getElementById("cdchar").textContent = ch;
  panel.style.display = "block";
  if (backdrop) backdrop.style.display = "block";
  body.innerHTML = '<div class="loadingnote">Memuat data karakter...</div>';
  loadUnihan().then(function (data) {
    var e = data[ch];
    var rows = "";
    var big = '<div class="cdbig">' + escapeHtml(ch) + "</div>";
    if (!e) {
      body.innerHTML = big + "<p>Tidak ada data Unihan untuk karakter ini (kemungkinan karakter jarang/varian).</p>";
      return;
    }
    var mandarin = e[0], cantonese = e[1], def_en = e[2], strokes = e[3], hanyupinyin = e[4], def_id = e[5];
    function row(label, val) {
      if (!val) return "";
      return "<tr><td class=\"k\">" + label + "</td><td>" + escapeHtml(val) + "</td></tr>";
    }
    rows += row("Pinyin (Mandarin)", mandarin);
    rows += row("Kantonis (Jyutping)", cantonese);
    rows += row("Jumlah Goresan", strokes);
    rows += row("Arti (Indonesia)", def_id);
    rows += row("Definisi (Inggris)", def_en);
    if (!mandarin && !cantonese && !def_en && !def_id && !strokes) {
      rows = "<tr><td colspan=2>Tidak ada data tambahan tersedia.</td></tr>";
    }
    body.innerHTML = big + "<table>" + rows + "</table>";
  });
}

function closeCharDetail() {
  var panel = document.getElementById("chardetail");
  var backdrop = document.getElementById("cdbackdrop");
  if (panel) panel.style.display = "none";
  if (backdrop) backdrop.style.display = "none";
}

// Wrap a hanzi string into clickable spans for each character
function makeClickableHanzi(str) {
  if (!str) return "";
  var out = "";
  for (var i = 0; i < str.length; i++) {
    var ch = str[i];
    if (/[\u4e00-\u9fff\u3400-\u4dbf]/.test(ch)) {
      out += '<span class="charlink" onclick="showCharDetail(\'' + ch + "')\">" + ch + "</span>";
    } else {
      out += escapeHtml(ch);
    }
  }
  return out;
}
