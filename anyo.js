/* Historia de España — «Un año»: para un año cualquiera, el mapa de la península y lo que pasaba en España, en el mundo y en el arte.
   Se puede comparar con un segundo año. Carga bajo demanda mapas.js y arte_min.js. */
(function () {
"use strict";
var $ = function (s, r) { return (r || document).querySelector(s); };
var ARTE = "https://artepau.pages.dev/";
var YEARS = [711, 1085, 1212, 1492, 1714, 1808, 1898, 1936, 1978];
var st = { a: 1808, b: null, mi: {} };
var loaded = {};
function E(s) { return window.esc ? window.esc(s) : String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
function yl(y) { return window.fy ? window.fy(y) : String(y); }
function need(src, ok, cb) {
  if (ok()) return cb();
  if (loaded[src]) { loaded[src].push(cb); return; }
  loaded[src] = [cb];
  var s = document.createElement("script"); s.src = src; s.onload = function () { var q = loaded[src]; loaded[src] = null; q.forEach(function (f) { f(); }); }; s.onerror = function () { var q = loaded[src]; loaded[src] = null; q.forEach(function (f) { f(true); }); };
  document.head.appendChild(s);
}
function mapFor(y) {
  var M = window.MAPAS.maps, m = M[0];
  M.forEach(function (x) { if (x.y <= y) m = x; });
  return m;
}
function mapSVG(m, uid, sel) {
  var A = window.MAPAS, id = "h" + uid;
  var s = '<svg class="ymap" viewBox="0 0 ' + A.w + " " + A.h + '" role="img" aria-label="Mapa de la península ibérica hacia ' + m.y + '"><defs><pattern id="' + id + '" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="3" height="7" fill="rgba(255,255,255,.55)"/></pattern></defs>' +
    '<rect class="sea" width="' + A.w + '" height="' + A.h + '"/><path class="oth" d="' + A.tierra + '" fill-rule="evenodd"/><path class="ibe" d="' + A.iberia + '" fill-rule="evenodd"/>';
  m.terr.forEach(function (t) {
    s += '<g class="ter' + (sel === t.i ? " on" : "") + '" data-t="' + t.i + '" tabindex="0" role="button" aria-label="' + E(t.n) + '"><path d="' + t.d + '" fill="' + t.c + '" fill-opacity="' + t.o + '" fill-rule="evenodd"/>' + (t.h ? '<path d="' + t.d + '" fill="url(#' + id + ')" fill-rule="evenodd"/>' : "") + "</g>";
  });
  m.terr.forEach(function (t) { s += '<text class="tl" x="' + t.x + '" y="' + t.y + '" text-anchor="middle">' + E(t.n) + "</text>"; });
  m.pts.forEach(function (p) { s += '<circle class="pt" cx="' + p[1] + '" cy="' + p[2] + '" r="2.6"/><text class="pl" x="' + (p[1] + 5) + '" y="' + (p[2] + 3) + '">' + E(p[0]) + "</text>"; });
  return s + "</svg>";
}
function era(y) {
  var b = EVS[0], d = 1e9; EVS.forEach(function (e) { var x = Math.abs(e.y - y); if (x < d) { d = x; b = e; } });
  return TEMAS[b.tema - 1];
}
function sec(t, body, n) { return body ? '<div class="ys"><h3>' + t + (n ? " <small>" + n + "</small>" : "") + "</h3>" + body + "</div>" : ""; }
function card(y, k) {
  var m = mapFor(y), mi = st.mi[k], sel = mi && mi.m === m.y ? mi.t : null;
  var er = era(y), near = EVS.map(function (e, i) { return { e: e, i: i, d: Math.abs(e.y - y) }; }).sort(function (a, b) { return a.d - b.d; }), nh = near.filter(function (o) { return o.d <= 3; });
  if (nh.length < 4) nh = near.slice(0, 5);
  nh = nh.slice(0, 7).sort(function (a, b) { return a.e.y - b.e.y; });
  var vivos = PEOPLE.filter(function (p) { var a = p.nac != null ? p.nac : p.mue - 60, z = p.mue != null ? p.mue : 2026; return a <= y && z >= y; });
  vivos.sort(function (a, b) { return (b.img ? 1 : 0) - (a.img ? 1 : 0) || Math.abs((a.nac || 0) + 40 - y) - Math.abs((b.nac || 0) + 40 - y); });
  var mundo = (window.MUNDO || []).map(function (w, i) { return { w: w, i: i, d: Math.abs(w.y - y) }; }).sort(function (a, b) { return a.d - b.d; }).slice(0, 4).sort(function (a, b) { return a.w.y - b.w.y; });
  var arte = (window.ARTE_MIN || []).map(function (o) { return { o: o, d: Math.abs(o[0] - y) }; }).filter(function (x) { return x.d <= 40; }).sort(function (a, b) { return a.d - b.d; }).slice(0, 6).sort(function (a, b) { return a.o[0] - b.o[0]; });
  var sub = sel ? m.terr.filter(function (t) { return t.i === sel; })[0] : null;
  return '<article class="ycard" data-k="' + k + '"><header><div class="yy">' + E(yl(y)) + '</div><div><b>' + E(er.nombre) + '</b><small>Tema ' + er.n + "</small></div>" +
    '<button class="btn small" type="button" data-yl="' + y + '">En la línea del tiempo</button></header>' +
    '<div class="ymw">' + mapSVG(m, k, sel) + '<div class="ycap"><b>' + E(m.y) + " · " + E(m.t) + "</b><p>" + E(sub ? sub.info : m.s) + (m.y !== y ? ' <span class="ynote">Mapa de referencia más cercano: ' + m.y + ".</span>" : "") + "</p></div>" +
    '<div class="ymc" role="group" aria-label="Mapas">' + window.MAPAS.maps.map(function (x) { return '<button type="button" data-mm="' + x.y + '"' + (x.y === m.y ? ' aria-pressed="true"' : "") + ">" + x.y + "</button>"; }).join("") + "</div></div>" +
    sec("En España", '<ul class="yl">' + nh.map(function (o) { return '<li><button type="button" data-ev="' + o.i + '"><b>' + E(yl(o.e.y)) + "</b><span>" + E(o.e.t) + "</span></button></li>"; }).join("") + "</ul>") +
    sec("Vivían", '<div class="ych">' + vivos.slice(0, 10).map(function (p) { return '<button type="button" class="chp" data-pp="' + p.id + '">' + (p.img ? '<img src="' + E(p.img) + '" alt="" loading="lazy" decoding="async">' : "") + E(p.nombre.length > 26 ? p.nombre.slice(0, 24) + "…" : p.nombre) + "</button>"; }).join("") + "</div>", vivos.length > 10 ? "y " + (vivos.length - 10) + " más" : "") +
    sec("En el mundo", '<ul class="yl">' + mundo.map(function (o) { return '<li class="w"><b>' + E(yl(o.w.y)) + "</b><span>" + E(o.w.t) + "</span></li>"; }).join("") + "</ul>") +
    sec("En el arte", arte.length ? '<div class="yar">' + arte.map(function (x) { var o = x.o; return '<a href="' + ARTE + "#cronologia?o=" + encodeURIComponent(o[2]) + '" target="_blank" rel="noopener" title="' + E(o[3]) + '"><img src="' + ARTE + E(o[5]) + '" alt="" loading="lazy" decoding="async"><span><b>' + E(o[3]) + "</b><small>" + E(o[1] || yl(o[0])) + "</small></span></a>"; }).join("") + "</div>" : '<p class="note">No hay obras del temario de Historia del Arte en estos años.</p>', "") +
    "</article>";
}
function render() {
  var V = $("#v-anyo"); if (!V) return;
  V.innerHTML = '<div class="vh"><h1>Un año</h1><p>Elige un año y mira, en una sola pantalla, el mapa de la península, lo que pasaba en España, en el resto del mundo y en el arte. Compara dos años para ver qué cambió.</p></div>' +
    '<div class="card yctl"><div class="field"><label for="yy-a">Año</label><input id="yy-a" type="number" min="-218" max="2024" step="1" value="' + st.a + '"></div>' +
    '<input id="yy-r" type="range" min="-218" max="2024" step="1" value="' + st.a + '" aria-label="Deslizador del año">' +
    '<div class="ych" id="yy-c">' + YEARS.map(function (y) { return '<button type="button" class="chp" data-y="' + y + '">' + y + "</button>"; }).join("") + "</div>" +
    '<button class="btn" type="button" id="yy-cmp">' + (st.b == null ? "Comparar con otro año" : "Quitar la comparación") + "</button>" +
    (st.b != null ? '<div class="field"><label for="yy-b">Segundo año</label><input id="yy-b" type="number" min="-218" max="2024" step="1" value="' + st.b + '"></div>' : "") + "</div>" +
    '<div class="ygr' + (st.b != null ? " two" : "") + '">' + card(st.a, "a") + (st.b != null ? card(st.b, "b") : "") + "</div>" +
    '<p class="note ysrc">Los mapas son esquemáticos: la costa procede de Natural Earth (dominio público) y las fronteras son un trazado orientativo, no una cartografía exacta. Las obras de arte enlazan con la web de Historia del Arte.</p>';
  bind(V);
}
function setYear(k, v) { v = Math.max(-218, Math.min(2024, Math.round(+v))); if (isNaN(v)) return; st[k] = v; st.mi[k] = null; render(); }
function bind(V) {
  var a = $("#yy-a", V), r = $("#yy-r", V), b = $("#yy-b", V);
  if (a) a.onchange = function () { setYear("a", a.value); };
  if (b) b.onchange = function () { setYear("b", b.value); };
  if (r) { r.oninput = function () { a.value = r.value; }; r.onchange = function () { setYear("a", r.value); }; }
  $("#yy-cmp", V).onclick = function () { st.b = st.b == null ? (st.a < 1900 ? 1936 : 1808) : null; render(); };
  V.onclick = function (ev) {
    var t = ev.target, c;
    if ((c = t.closest("[data-y]"))) { setYear(st.b != null && ev.shiftKey ? "b" : "a", c.dataset.y); return; }
    if ((c = t.closest("[data-yl]"))) { window.lineaIr && lineaIr({ y: +c.dataset.yl }); return; }
    if ((c = t.closest("[data-ev]"))) { openEvent(+c.dataset.ev); return; }
    if ((c = t.closest("[data-pp]"))) { openPers(c.dataset.pp); return; }
    var card_ = t.closest(".ycard"), k = card_ && card_.dataset.k;
    if ((c = t.closest("[data-mm]")) && k) { st.mi[k] = { m: +c.dataset.mm, t: null }; var y = k === "a" ? st.a : st.b; var mm = window.MAPAS.maps.filter(function (x) { return x.y === +c.dataset.mm; })[0]; rerender(k, mm); return; }
    if ((c = t.closest("[data-t]")) && k) { var cur = window.MAPAS.maps.filter(function (x) { return x.y === (st.mi[k] ? st.mi[k].m : mapFor(k === "a" ? st.a : st.b).y); })[0]; st.mi[k] = { m: cur.y, t: c.dataset.t }; rerender(k, cur); }
  };
  V.onkeydown = function (ev) { if (ev.key === "Enter" || ev.key === " ") { var g = ev.target.closest && ev.target.closest("[data-t]"); if (g) { ev.preventDefault(); g.dispatchEvent(new MouseEvent("click", { bubbles: true })); } } };
}
function rerender(k, m) {                                           // solo el mapa y su pie, para no perder el scroll
  var c = $('#v-anyo .ycard[data-k="' + k + '"]'); if (!c) return;
  var mi = st.mi[k], sel = mi && mi.t, sub = sel ? m.terr.filter(function (t) { return t.i === sel; })[0] : null, y = k === "a" ? st.a : st.b;
  var w = $(".ymw", c); if (!w) return;
  w.innerHTML = mapSVG(m, k, sel) + '<div class="ycap"><b>' + E(m.y) + " · " + E(m.t) + "</b><p>" + E(sub ? sub.info : m.s) + (m.y !== y ? ' <span class="ynote">Mapa elegido: ' + m.y + ".</span>" : "") + "</p></div>" +
    '<div class="ymc" role="group" aria-label="Mapas">' + window.MAPAS.maps.map(function (x) { return '<button type="button" data-mm="' + x.y + '"' + (x.y === m.y ? ' aria-pressed="true"' : "") + ">" + x.y + "</button>"; }).join("") + "</div>";
}
window.renderAnyo = function (p) {
  if (p && p.y != null && !isNaN(+p.y)) { st.a = Math.max(-218, Math.min(2024, Math.round(+p.y))); st.mi = {}; }
  var V = $("#v-anyo"); if (V && !V.firstChild) V.innerHTML = '<div class="vh"><h1>Un año</h1></div><p class="note" style="padding:0 20px">Cargando…</p>';
  need("mapas.js", function () { return !!window.MAPAS; }, function (e1) {
    need("arte_min.js", function () { return !!window.ARTE_MIN; }, function () { render(); });   // si falla arte_min, se muestra sin arte
  });
};
})();
