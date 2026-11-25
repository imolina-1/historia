/* Historia de España — «Un año»: mapa de la península, España, mundo y arte de un año. Se puede comparar con otro.
   Carga bajo demanda mapas.js y arte_min.js. */
(function () {
"use strict";
var $ = function (s, r) { return (r || document).querySelector(s); };
var ARTE = "https://artepau.pages.dev/";
var YEARS = [711, 1085, 1212, 1492, 1714, 1808, 1898, 1936, 1978];
var MIN = -218, MAX = 2024;
var st = { a: 1808, b: null, mi: {} }, loaded = {}, tm = {};
function E(s) { return typeof esc === "function" ? esc(s) : String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
function yl(y) { return typeof fy === "function" ? fy(y) : String(y); }
function need(src, ok, cb) {
  if (ok()) return cb();
  if (loaded[src]) { loaded[src].push(cb); return; }
  loaded[src] = [cb];
  var s = document.createElement("script"); s.src = src;
  s.onload = function () { var q = loaded[src]; loaded[src] = null; q.forEach(function (f) { f(); }); };
  s.onerror = function () { var q = loaded[src]; loaded[src] = null; q.forEach(function (f) { f(true); }); };
  document.head.appendChild(s);
}
function maps() { return window.MAPAS.maps; }
function mapFor(y) { var m = null; maps().forEach(function (x) { if (x.y <= y) m = x; }); return m; }
function mapBy(y) { return maps().filter(function (x) { return x.y === y; })[0] || null; }
function cur(k) { var mi = st.mi[k], y = st[k]; return mi ? mapBy(mi.m) : mapFor(y); }

/* ---------- mapa ---------- */
function mapSVG(m, uid, sel) {
  var A = window.MAPAS, id = "h" + uid;
  var s = '<svg class="ymap" viewBox="0 0 ' + A.w + " " + A.h + '" role="img" aria-label="Mapa de la península ibérica' + (m ? " hacia " + m.y : "") + '"><defs><pattern id="' + id + '" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="3" height="7" fill="rgba(255,255,255,.55)"/></pattern></defs>' +
    '<rect class="sea" width="' + A.w + '" height="' + A.h + '"/><path class="oth" d="' + A.tierra + '" fill-rule="evenodd"/><path class="ibe" d="' + A.iberia + '" fill-rule="evenodd"/>';
  if (m) {
    m.terr.forEach(function (t) {
      s += '<g class="ter' + (sel === t.i ? " on" : "") + '" data-t="' + t.i + '" tabindex="0" role="button" aria-label="' + E(t.n) + '"><path d="' + t.d + '" fill="' + t.c + '" fill-opacity="' + t.o + '" fill-rule="evenodd"/>' + (t.h ? '<path d="' + t.d + '" fill="url(#' + id + ')" fill-rule="evenodd"/>' : "") + "</g>";
    });
    m.terr.forEach(function (t) { s += '<text class="tl" x="' + t.x + '" y="' + t.y + '" text-anchor="middle">' + E(t.n) + "</text>"; });
    m.pts.forEach(function (p) { s += '<circle class="pt" cx="' + p[1] + '" cy="' + p[2] + '" r="2.6"/><text class="pl" x="' + (p[1] + 5) + '" y="' + (p[2] + 3) + '">' + E(p[0]) + "</text>"; });
  }
  return s + "</svg>";
}
function mapBlock(k) {
  var y = st[k], m = cur(k), mi = st.mi[k], sel = mi ? mi.t : null, sub = m && sel ? m.terr.filter(function (t) { return t.i === sel; })[0] : null, auto = !mi;
  var cap = m ? "<b>" + m.y + " · " + E(m.t) + "</b><p>" + E(sub ? sub.info : m.s) + (m.y !== y && auto ? ' <span class="ynote">Mapa de ' + m.y + ".</span>" : "") + "</p>" : "<b>Sin mapa</b><p>Los mapas empiezan en el año 711.</p>";
  return mapSVG(m, k, sel) + '<div class="ycap">' + cap + "</div>" +
    '<div class="ymc" role="group" aria-label="Mapas">' + maps().map(function (x) { return '<button type="button" data-mm="' + x.y + '"' + (m && x.y === m.y ? ' aria-pressed="true"' : "") + ">" + x.y + "</button>"; }).join("") + "</div>";
}

/* ---------- tarjeta ---------- */
function era(y) {
  var b = EVS[0], d = 1e9; EVS.forEach(function (e) { var x = Math.abs(e.y - y); if (x < d) { d = x; b = e; } });
  return TEMAS[b.tema - 1];
}
function head(y) {
  var er = era(y);
  return '<div class="yy">' + E(yl(y)) + '</div><div class="yr"><b>' + E(er.nombre) + "</b><small>Tema " + er.n + '</small></div><button class="btn small" type="button" data-yl="' + y + '">En la línea del tiempo</button>';
}
function sec(t, body, n) { return body ? '<div class="ys"><h3>' + t + (n ? " <small>" + n + "</small>" : "") + "</h3>" + body + "</div>" : ""; }
function lists(y) {
  var near = EVS.map(function (e, i) { return { e: e, i: i, d: Math.abs(e.y - y) }; }).sort(function (a, b) { return a.d - b.d; }), nh = near.filter(function (o) { return o.d <= 3; });
  if (nh.length < 4) nh = near.slice(0, 5);
  nh = nh.slice(0, 7).sort(function (a, b) { return a.e.y - b.e.y; });
  var vivos = PEOPLE.filter(function (p) { var a = p.nac != null ? p.nac : p.mue - 60, z = p.mue != null ? p.mue : 2026; return a <= y && z >= y; });
  vivos.sort(function (a, b) { return (b.img ? 1 : 0) - (a.img ? 1 : 0) || Math.abs((a.nac || 0) + 40 - y) - Math.abs((b.nac || 0) + 40 - y); });
  var mundo = (window.MUNDO || []).map(function (w) { return { w: w, d: Math.abs(w.y - y) }; }).sort(function (a, b) { return a.d - b.d; }).slice(0, 4).sort(function (a, b) { return a.w.y - b.w.y; });
  var arte = (window.ARTE_MIN || []).map(function (o) { return { o: o, d: Math.abs(o[0] - y) }; }).filter(function (x) { return x.d <= 40; }).sort(function (a, b) { return a.d - b.d; }).slice(0, 6).sort(function (a, b) { return a.o[0] - b.o[0]; });
  return sec("En España", '<ul class="yl">' + nh.map(function (o) { return '<li><button type="button" data-ev="' + o.i + '"><b>' + E(yl(o.e.y)) + "</b><span>" + E(o.e.t) + "</span></button></li>"; }).join("") + "</ul>") +
    sec("Vivían", '<div class="ych">' + vivos.slice(0, 10).map(function (p) { return '<button type="button" class="chp" data-pp="' + p.id + '">' + (p.img ? '<img src="' + E(p.img) + '" alt="" loading="lazy" decoding="async">' : "") + E(p.nombre.length > 26 ? p.nombre.slice(0, 24) + "…" : p.nombre) + "</button>"; }).join("") + "</div>", vivos.length > 10 ? "y " + (vivos.length - 10) + " más" : "") +
    sec("En el mundo", '<ul class="yl">' + mundo.map(function (o) { return '<li class="w"><b>' + E(yl(o.w.y)) + "</b><span>" + E(o.w.t) + "</span></li>"; }).join("") + "</ul>") +
    sec("En el arte", arte.length ? '<div class="yar">' + arte.map(function (x) { var o = x.o; return '<a href="' + ARTE + "#cronologia?o=" + encodeURIComponent(o[2]) + '" target="_blank" rel="noopener" title="' + E(o[3]) + '"><img src="' + ARTE + E(o[5]) + '" alt="" loading="lazy" decoding="async"><span><b>' + E(o[3]) + "</b><small>" + E(o[1] || yl(o[0])) + "</small></span></a>"; }).join("") + "</div>" : '<p class="note">No hay obras del temario de Arte en estos años.</p>');
}
function card(k) {
  var y = st[k];
  return '<article class="ycard" data-k="' + k + '"><div class="ystage"><header class="yh">' + head(y) + "</header>" +
    '<div class="yctl"><button type="button" class="stp" data-s="-10" aria-label="10 años antes">−10</button><button type="button" class="stp" data-s="-1" aria-label="Un año antes">−1</button>' +
    '<input type="number" class="yn" min="' + MIN + '" max="' + MAX + '" step="1" value="' + y + '" aria-label="Año">' +
    '<button type="button" class="stp" data-s="1" aria-label="Un año después">+1</button><button type="button" class="stp" data-s="10" aria-label="10 años después">+10</button>' +
    '<input type="range" class="yr2" min="' + MIN + '" max="' + MAX + '" step="1" value="' + y + '" aria-label="Deslizador del año"></div>' +
    '<div class="ych sc">' + YEARS.map(function (v) { return '<button type="button" class="chp" data-y="' + v + '">' + v + "</button>"; }).join("") + "</div>" +
    '<div class="ymw">' + mapBlock(k) + '</div></div><div class="ylists">' + lists(y) + "</div></article>";
}
function render() {
  var V = $("#v-anyo"); if (!V) return;
  V.innerHTML = '<div class="vh"><h1>Un año</h1><p>El mapa, España, el mundo y el arte de un año.</p></div>' +
    '<div class="yb"><button class="btn" type="button" id="yy-cmp">' + (st.b == null ? "Comparar con otro año" : "Quitar la comparación") + "</button></div>" +
    '<div class="ygr' + (st.b != null ? " two" : "") + '">' + card("a") + (st.b != null ? card("b") : "") + "</div>";
  $("#yy-cmp", V).onclick = function () { st.b = st.b == null ? (st.a < 1900 ? 1936 : 1808) : null; render(); };
  V.onclick = onclick; V.oninput = oninput; V.onchange = onchange; V.onkeydown = onkey;
}
function cardEl(k) { return $('#v-anyo .ycard[data-k="' + k + '"]'); }
function refresh(k, now) {
  var c = cardEl(k); if (!c) return; var y = st[k];
  $(".yh", c).innerHTML = head(y);
  var n = $(".yn", c), r = $(".yr2", c); if (n && document.activeElement !== n) n.value = y; if (r && document.activeElement !== r) r.value = y;
  var w = $(".ymw", c), sig = y + "|" + (cur(k) ? cur(k).y : 0) + "|" + JSON.stringify(st.mi[k] || 0) + "|" + (cur(k) && cur(k).y !== y);
  if (w && w._sig !== sig) { w._sig = sig; w.innerHTML = mapBlock(k); }
  clearTimeout(tm[k]);
  var go = function () { var l = $(".ylists", c); if (l) l.innerHTML = lists(st[k]); };
  if (now) go(); else tm[k] = setTimeout(go, 130);
}
function setYear(k, v, now) {
  v = Math.max(MIN, Math.min(MAX, Math.round(+v))); if (isNaN(v)) return;
  if (v !== st[k]) st.mi[k] = null; st[k] = v; refresh(k, now);
}
function kOf(t) { var c = t.closest(".ycard"); return c && c.dataset.k; }
function oninput(ev) { var t = ev.target, k = kOf(t); if (k && t.classList.contains("yr2")) setYear(k, t.value, false); }
function onchange(ev) { var t = ev.target, k = kOf(t); if (!k) return; if (t.classList.contains("yn")) setYear(k, t.value, true); else if (t.classList.contains("yr2")) setYear(k, t.value, true); }
function onkey(ev) {
  if (ev.key !== "Enter" && ev.key !== " ") return;
  var g = ev.target.closest && ev.target.closest("[data-t]"); if (g) { ev.preventDefault(); g.dispatchEvent(new MouseEvent("click", { bubbles: true })); }
}
function onclick(ev) {
  var t = ev.target, c, k = kOf(t);
  if ((c = t.closest("[data-s]")) && k) { setYear(k, st[k] + (+c.dataset.s), true); return; }
  if ((c = t.closest("[data-y]")) && k) { setYear(k, c.dataset.y, true); return; }
  if ((c = t.closest("[data-yl]"))) { window.lineaIr && lineaIr({ y: +c.dataset.yl }); return; }
  if ((c = t.closest("[data-ev]"))) { openEvent(+c.dataset.ev); return; }
  if ((c = t.closest("[data-pp]"))) { openPers(c.dataset.pp); return; }
  if ((c = t.closest("[data-mm]")) && k) { st.mi[k] = { m: +c.dataset.mm, t: null }; refresh(k, true); return; }
  if ((c = t.closest("[data-t]")) && k) { var m = cur(k); st.mi[k] = { m: m.y, t: c.dataset.t }; refresh(k, true); }
}
window.renderAnyo = function (p) {
  if (p && p.y != null && p.y !== "" && !isNaN(+p.y)) { st.a = Math.max(MIN, Math.min(MAX, Math.round(+p.y))); st.mi = {}; }
  var V = $("#v-anyo"); if (V && !V.firstChild) V.innerHTML = '<div class="vh"><h1>Un año</h1></div><p class="note" style="padding:0 20px">Cargando…</p>';
  need("mapas.js", function () { return !!window.MAPAS; }, function (e1) {
    if (e1) { if (V) V.innerHTML = '<div class="vh"><h1>Un año</h1></div><p class="note" style="padding:0 20px">No se han podido cargar los mapas.</p>'; return; }
    need("arte_min.js", function () { return !!window.ARTE_MIN; }, function () { render(); });
  });
};
})();
