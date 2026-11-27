/* Historia de España — línea del tiempo a pantalla completa.
   Hitos (EVS) y personajes (PEOPLE) ordenados por año; varios por año. Se activa con #linea.
   Optimizada: solo se maquetan los ~9 años cercanos, las imágenes se cargan al acercarse,
   el fondo ondula despacio (sin movimiento si el sistema pide reducirlo) y el bucle se pausa con la pestaña oculta. */
(function () {
"use strict";
var $ = function (s, r) { return (r || document).querySelector(s); };
var LS = { E: true, P: true, W: true };
var WT = null;                                    // tema de cada hecho mundial: el del hito español más cercano en el tiempo
var G = [], els = [], N = 0, pos = 0, target = 0, hue = 40, htarget = 40, shown = -1, openU = null;
var wdirty = true, lastHue = 0, built = false, running = false, moved = false, hintOn = true, dirty = true, lastWave = 0;
var root, stage, rail, eraEl, bgEl, pn, sc, cv, cx, CW = 0, CH = 0, DPR = 1, cur, hintEl, cntEl;
var still = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
var MARKS = [-1200000, -15000, -3000, -218, 409, 711, 1031, 1212, 1479, 1700, 1808, 1898, 1931, 1975, 2000];
function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
function E(s) { return window.esc ? window.esc(s) : String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
function yl(y) {                                    // etiqueta del año; las cifras prehistóricas se abrevian
  if (y < -100000) return (Math.round(-y / 1e5) / 10).toString().replace(".", ",") + " M a. C.";
  return window.fy ? window.fy(y) : String(y);
}
function hueOf(t) { return Math.round(32 + (t - 1) * 24) % 360; }          // ocre → rojo → malva → azul → verde
function key(u) { return u.k === "e" ? "e" + u.i : u.k === "w" ? "w" + u.i : "p" + u.id; }
function wtema(i) {
  if (!WT) WT = window.MUNDO.map(function (w) { var b = EVS[0], d = 1e9; EVS.forEach(function (e) { var x = Math.abs(e.y - w.y); if (x < d) { d = x; b = e; } }); return b.tema; });
  return WT[i];
}
var GLOBE = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><path d="M3 12h18"/></svg>';
function units() {
  var out = [];
  if (LS.E) EVS.forEach(function (e, i) { out.push({ k: "e", i: i, y: e.y, tema: e.tema }); });
  if (LS.W && window.MUNDO) MUNDO.forEach(function (w, i) { out.push({ k: "w", i: i, y: w.y, tema: wtema(i) }); });
  if (LS.P) PEOPLE.forEach(function (p) {
    var y = p.nac != null ? p.nac : p.mue; if (y == null) return;
    out.push({ k: "p", id: p.id, y: y, tema: p.tema, died: p.nac == null });
  });
  out.sort(function (a, b) { return a.y - b.y || (a.k < b.k ? -1 : a.k > b.k ? 1 : 0) || a.tema - b.tema; });
  return out;
}
function group() {
  G = [];
  units().forEach(function (u) {
    var y = Math.floor(u.y), g = G[G.length - 1];
    if (g && g.y === y) g.u.push(u); else G.push({ y: y, u: [u], tema: u.tema });
  });
  N = G.length;
}
function cardHTML(u) {
  if (u.k === "e") {
    var e = EVS[u.i], ep = EPM[e.ep];
    var eth = e.img ? '<span class="th' + (e.pt ? "" : " ph") + '"><img data-src="' + E(e.img) + '" alt="" decoding="async" draggable="false"></span>' : '<span class="th ev" style="--h:' + hueOf(e.tema) + '">' + e.tema + '</span>';
    return '<li><button type="button" data-k="' + key(u) + '">' + eth + '<span class="tx"><b>' + E(e.t) + "</b><small>Hito · " + E(ep ? ep.nombre : "") + "</small></span></button></li>";
  }
  if (u.k === "w") {
    var w = MUNDO[u.i];
    return '<li><button type="button" data-k="' + key(u) + '"><span class="th wd">' + GLOBE + '</span><span class="tx"><b>' + E(w.t) + "</b><small>Mundo</small></span></button></li>";
  }
  var p = PM[u.id];
  var th = p.img ? '<span class="th"><img data-src="' + E(p.img) + '" alt="" decoding="async" draggable="false"></span>'
    : '<span class="th ev" style="--h:' + hueOf(p.tema) + '">' + E(window.ini ? ini(p.nombre) : p.nombre.charAt(0)) + "</span>";
  return '<li><button type="button" data-k="' + key(u) + '">' + th + '<span class="tx"><b>' + E(p.nombre) + "</b><small>" + (u.died ? "Muere · " : "Nace · ") + E(p.cargo) + "</small></span></button></li>";
}
function render() {
  group(); stage.textContent = ""; rail.textContent = ""; els = []; shown = -1;
  if (!N) { stage.innerHTML = '<p class="tlnone">Activa al menos una capa.</p>'; return; }
  els = G.map(function (g) {
    var d = document.createElement("div"); d.className = "tli"; var t = yl(g.y);
    d.innerHTML = '<div class="y' + (t.length > 8 ? " long" : "") + '">' + E(t) + "</div>" +
      '<ul class="evs">' + g.u.map(cardHTML).join("") + "</ul>" +
      (g.u.length > 1 ? '<div class="n">+ ' + (g.u.length - 1) + (g.u.length === 2 ? " entrada más" : " entradas más") + "</div>" : "") +
      '<div class="e">' + E(TEMAS[g.tema - 1].nombre) + "</div>";
    d._v = 0; d.style.visibility = "hidden"; stage.appendChild(d); return d;
  });
  var mi = 0, lastL = -99, w = rail.clientWidth || 320;
  G.forEach(function (g, i) {
    var x = N > 1 ? i / (N - 1) * 100 : 0, tk = document.createElement("div"), mk = false;
    while (mi < MARKS.length && g.y >= MARKS[mi]) { mk = true; mi++; }
    tk.className = "tk" + (mk ? " m" : ""); tk.style.left = x + "%"; rail.appendChild(tk);
    if (mk && x / 100 * w - lastL > 58) { var l = document.createElement("div"); l.className = "tlb"; l.style.left = x + "%"; if (x < 6) l.style.transform = "none"; l.textContent = yl(MARKS[mi - 1]); rail.appendChild(l); lastL = x / 100 * w; }
  });
  cur = document.createElement("div"); cur.className = "cur"; rail.appendChild(cur);
  cntEl.textContent = G.reduce(function (s, g) { return s + g.u.length; }, 0) + " entradas";
  dirty = true;
}
function build() {
  if (built) return; built = true;
  root = $("#tl2");
  root.innerHTML =
    '<div id="tlbg"></div><canvas id="tlwaves" aria-hidden="true"></canvas>' +
    '<div class="tlh"><div class="tlf" role="group" aria-label="Capas"><button type="button" class="on" data-l="E" aria-pressed="true">Hitos</button><button type="button" class="on" data-l="P" aria-pressed="true">Personajes</button><button type="button" class="on" data-l="W" aria-pressed="true">Mundo</button><span id="tlcnt"></span></div><div class="tlera" id="tlera" aria-live="polite"></div></div>' +
    '<div id="tlstage"></div><div id="tlsc"></div><aside id="tlpn" role="dialog" aria-label="Ficha"></aside>' +
    '<button class="tlnavb" id="tlpv" type="button" aria-label="Anterior">‹</button><button class="tlnavb" id="tlnx" type="button" aria-label="Siguiente">›</button>' +
    '<div id="tlhint">Rueda, flechas o arrastra · pulsa una entrada para ver su ficha</div><div id="tlrail" aria-hidden="true"></div>';
  stage = $("#tlstage"); rail = $("#tlrail"); eraEl = $("#tlera"); bgEl = $("#tlbg"); pn = $("#tlpn"); sc = $("#tlsc"); cv = $("#tlwaves"); cx = cv.getContext("2d"); hintEl = $("#tlhint"); cntEl = $("#tlcnt");
  bind(); render();
}
function GAP() { var w = root.clientWidth; return w < 640 ? w * .8 : Math.min(430, w * .34); }
function go(i) { target = clamp(Math.round(i), 0, Math.max(N - 1, 0)); dirty = true; if (hintOn) { hintOn = false; hintEl.style.opacity = 0; } }
function lazy(el) { var im = el.querySelectorAll("img[data-src]"); for (var k = 0; k < im.length; k++) { im[k].src = im[k].dataset.src; im[k].removeAttribute("data-src"); } }
function layout() {
  var gap = GAP(), lo = Math.max(0, Math.floor(pos - 4)), hi = Math.min(N - 1, Math.ceil(pos + 4)), i, el, d, a;
  for (i = 0; i < els.length; i++) {
    el = els[i];
    if (i < lo || i > hi) { if (el._v) { el.style.visibility = "hidden"; el._v = 0; } continue; }
    d = i - pos; a = Math.abs(d);
    if (a > 3.2) { if (el._v) { el.style.visibility = "hidden"; el.style.opacity = 0; el._v = 0; } continue; }
    if (!el._v) { el._v = 1; el.style.visibility = "visible"; lazy(el); }
    var s = 1 - Math.min(a, 1) * .5 - Math.max(a - 1, 0) * .08;
    var x = (d < 0 ? -1 : 1) * (a < 1 ? a * gap : gap + (a - 1) * gap * .55);
    var o = a < 1 ? 1 - a * .72 : Math.max(0, .28 - (a - 1) * .14), y = a < 1 ? a * 10 : 10;
    el.style.transform = "translate(-50%,-50%) translate(" + x.toFixed(1) + "px," + y.toFixed(1) + "px) scale(" + s.toFixed(3) + ")";
    el.style.opacity = o.toFixed(3);
  }
  if (cur) cur.style.left = (N > 1 ? pos / (N - 1) * 100 : 0) + "%";
}
function focus() {
  if (!N) return; var i = clamp(Math.round(pos), 0, N - 1); if (i === shown) return;
  if (shown >= 0 && els[shown]) els[shown].classList.remove("f");
  shown = i; els[i].classList.add("f");
  var g = G[i]; htarget = hueOf(g.tema); eraEl.textContent = TEMAS[g.tema - 1] ? TEMAS[g.tema - 1].nombre : "";
  /* el panel solo se cierra si el DESTINO no contiene la ficha abierta (al viajar entre años, los intermedios no cuentan) */
  var dest = G[clamp(Math.round(target), 0, N - 1)] || g;
  if (pn.classList.contains("on") && openU && !dest.u.some(function (u) { return key(u) === openU; })) closePn();
}
function fit() { if (!cv) return; wdirty = true; DPR = .6; CW = cv.clientWidth; CH = cv.clientHeight; cv.width = CW * DPR; cv.height = CH * DPR; cx.setTransform(DPR, 0, 0, DPR, 0, 0); }
function waves(t) {
  cx.clearRect(0, 0, CW, CH); if (still) t = 0;
  for (var k = 0; k < 3; k++) {
    var amp = 26 + k * 16, ph = t * (.2 + k * .07) + k * 1.7 + pos * .35, base = CH * (.46 + k * .17), x, y;
    cx.beginPath();
    for (x = 0; x <= CW; x += 20) { y = base + Math.sin(x / CW * Math.PI * (1.4 + k * .35) + ph) * amp + Math.sin(x / CW * Math.PI * 3.1 + ph * 1.6) * amp * .35; x ? cx.lineTo(x, y) : cx.moveTo(x, y); }
    cx.strokeStyle = "hsla(" + (hue + k * 8) + ",55%,68%," + (.2 - k * .04) + ")"; cx.lineWidth = 1; cx.stroke();
    cx.lineTo(CW, CH); cx.lineTo(0, CH); cx.closePath(); cx.fillStyle = "hsla(" + (hue + k * 8) + ",45%," + (32 + k * 4) + "%,.07)"; cx.fill();
  }
}
function tick(now) {
  if (!running) return;
  requestAnimationFrame(tick);
  if (document.hidden) return;
  var d = target - pos, moving = Math.abs(d) > .0004;
  if (moving) pos += d * .095; else if (pos !== target) pos = target;
  var dh = htarget - hue; if (dh > 180) dh -= 360; else if (dh < -180) dh += 360;
  var hmove = Math.abs(dh) > .6; if (hmove) { hue += dh * .06; if (now - lastHue > 60) { lastHue = now; bgEl.style.setProperty("--hue", hue.toFixed(0)); } } else if (dh !== 0) { hue = htarget; bgEl.style.setProperty("--hue", hue.toFixed(0)); }
  if (moving || dirty) { layout(); focus(); dirty = false; }
  if (still) { if (moving || hmove || wdirty) { wdirty = false; waves(0); } }          // con «reducir movimiento» el fondo es estático: solo se redibuja si algo cambia
  else if (now - lastWave > (moving ? 80 : 60)) { lastWave = now; waves(now / 1000); }   // el fondo ondula despacio: ~15 fps bastan
}
function chip(txt, attrs) { return '<button type="button" class="chp" ' + attrs + ">" + E(txt) + "</button>"; }
function openU_(k) {
  var u = null, gi = -1;
  function find() { u = null; gi = -1; G.some(function (g, i) { return g.u.some(function (x) { if (key(x) === k) { u = x; gi = i; return true; } return false; }); }); }
  find();
  if (!u) { var L = k.charAt(0).toUpperCase(); if (LS[L] === false) { setLayer(L, true, k); find(); } }
  if (!u) return; openU = k;
  if (gi !== Math.round(target)) go(gi);
  var h = "", x = '<button class="x" type="button" aria-label="Cerrar">×</button>';
  pn.style.setProperty("--hue", hueOf(u.tema));
  if (u.k === "e") {
    var e = EVS[u.i], ep = EPM[e.ep], ps = PEOPLE.filter(function (p) { return p.eps.indexOf(e.ep) >= 0; }).slice(0, 10);
    var ds = DOCS.filter(function (d) { return d.ep === e.ep; }).slice(0, 6);
    var near = EVS.map(function (v, i) { return { v: v, i: i }; }).filter(function (o) { return o.v.tema === e.tema && o.i !== u.i; })
      .sort(function (a, b) { return Math.abs(a.v.y - e.y) - Math.abs(b.v.y - e.y); }).slice(0, 6).sort(function (a, b) { return a.v.y - b.v.y; });
    h = x + '<div class="k">Tema ' + e.tema + " · " + E(TEMAS[e.tema - 1].nombre) + "</div><h2>" + E(e.t) + '</h2><div class="yr">' + E(yl(e.y)) + " · epígrafe " + E(e.ep) + "</div>" +
      (e.img ? '<figure class="pimg' + (e.pt ? "" : " dimg") + '"><img src="' + E(e.img) + '" alt="' + E(e.ic || e.t) + '" draggable="false">' + (e.pt ? "" : "<figcaption>" + E(e.ic || "") + "</figcaption>") + "</figure>" : "") +
      "<h3>Epígrafe</h3><p class=\"sub\">" + E(ep ? ep.nombre : "") + "</p>" +
      '<p class="pact"><button type="button" class="pbtn" data-full="e' + u.i + '">Abrir ficha completa</button></p>' + arteLink(e.y) +
      (ps.length ? "<h3>Personajes del epígrafe</h3><div class=\"chs\">" + ps.map(function (p) { return chip(p.nombre, 'data-k="p' + p.id + '"'); }).join("") + "</div>" : "") +
      (ds.length ? "<h3>Documentos</h3><div class=\"chs\">" + ds.map(function (d) { return chip(d.id + " · " + (d.titulo.length > 30 ? d.titulo.slice(0, 28) + "…" : d.titulo), 'data-d="' + d.id + '"'); }).join("") + "</div>" : "") +
      (near.length ? "<h3>Más de este tema</h3><ul>" + near.map(function (o) { return '<li><button type="button" data-k="e' + o.i + '"><b>' + E(yl(o.v.y)) + "</b><span>" + E(o.v.t) + "</span></button></li>"; }).join("") + "</ul>" : "");
  } else if (u.k === "w") {
    var w = MUNDO[u.i];
    var es = EVS.map(function (v, i) { return { v: v, i: i }; }).sort(function (a, b) { return Math.abs(a.v.y - w.y) - Math.abs(b.v.y - w.y); }).slice(0, 6).sort(function (a, b) { return a.v.y - b.v.y; });
    var ws = MUNDO.map(function (v, i) { return { v: v, i: i }; }).filter(function (o) { return o.i !== u.i; }).sort(function (a, b) { return Math.abs(a.v.y - w.y) - Math.abs(b.v.y - w.y); }).slice(0, 3).sort(function (a, b) { return a.v.y - b.v.y; });
    h = x + '<div class="k">Contexto internacional</div><h2>' + E(w.t) + '</h2><div class="yr">' + E(yl(w.y)) + "</div>" +
      '<h3>Qué significa para España</h3><p class="sub">' + E(w.n) + "</p>" + arteLink(w.y) +
      "<h3>En España, por entonces</h3><ul>" + es.map(function (o) { return '<li><button type="button" data-k="e' + o.i + '"><b>' + E(yl(o.v.y)) + "</b><span>" + E(o.v.t) + "</span></button></li>"; }).join("") + "</ul>" +
      "<h3>Otros hechos del mundo</h3><ul>" + ws.map(function (o) { return '<li><button type="button" data-k="w' + o.i + '"><b>' + E(yl(o.v.y)) + "</b><span>" + E(o.v.t) + "</span></button></li>"; }).join("") + "</ul>";
  } else {
    var p = PM[u.id], eps = (p.eps || []).map(function (i) { return EPM[i]; }).filter(Boolean);
    var evs = EVS.map(function (v, i) { return { v: v, i: i }; }).filter(function (o) { return p.eps.indexOf(o.v.ep) >= 0; }).slice(0, 6);
    var cat = CATS[p.cat] ? CATS[p.cat][0] : "";
    h = x + (p.img ? '<div class="pimg"><img src="' + E(p.img) + '" alt="Retrato de ' + E(p.nombre) + '" draggable="false"></div>' : "") +
      '<div class="k">' + E(cat) + " · tema " + p.tema + "</div><h2>" + E(p.nombre) + '</h2><div class="yr">' + E(window.life ? life(p) : "") + " · " + E(p.cargo) + "</div>" +
      '<p class="sub">' + E(p.sem || p.nota) + "</p>" +
      '<p class="pact"><button type="button" class="pbtn" data-full="p' + p.id + '">Abrir ficha completa</button></p>' + arteLink(p.nac != null ? p.nac : p.mue, p.id) +
      (eps.length ? "<h3>Epígrafes</h3><p class=\"sub small\">" + eps.map(function (q) { return E(q.id + " · " + q.nombre); }).join("<br>") + "</p>" : "") +
      (evs.length ? "<h3>Hitos del epígrafe</h3><ul>" + evs.map(function (o) { return '<li><button type="button" data-k="e' + o.i + '"><b>' + E(yl(o.v.y)) + "</b><span>" + E(o.v.t) + "</span></button></li>"; }).join("") + "</ul>" : "");
  }
  pn.innerHTML = h; pn.classList.add("on"); sc.classList.add("on"); pn.scrollTop = 0;
  var xb = pn.querySelector(".x"); if (xb) xb.focus({ preventScroll: true });
}
function arteLink(y, pid) {
  var a = window.arteHref && window.arteHref(y, pid);
  return a ? '<p class="pact"><a class="pbtn alt" href="' + E(a.u) + '" target="_blank" rel="noopener">' + E(a.t) + " ↗</a></p>" : "";
}
function closePn() { pn.classList.remove("on"); sc.classList.remove("on"); openU = null; }
function railTo(ev) { var r = rail.getBoundingClientRect(); go((ev.clientX - r.left) / r.width * (N - 1)); }
function setLayer(l, on, keep) {
  var b = root.querySelector('.tlf [data-l="' + l + '"]'); LS[l] = on;
  if (b) { b.classList.toggle("on", on); b.setAttribute("aria-pressed", String(on)); }
  var y = G[Math.round(target)] ? G[Math.round(target)].y : 1500;
  if (keep) { var m = keep.charAt(0) === "e" ? EVS[+keep.slice(1)] : keep.charAt(0) === "w" ? MUNDO[+keep.slice(1)] : PM[keep.slice(1)]; if (m) y = m.y != null ? m.y : (m.nac != null ? m.nac : m.mue); }
  closePn(); render();
  var gi = 0; G.some(function (g, k) { if (g.y >= y) { gi = k; return true; } gi = k; return false; }); go(gi); pos = target;
}
function bind() {
  pn.addEventListener("click", function (ev) {
    if (ev.target.closest(".x")) { closePn(); return; }
    var f = ev.target.closest("[data-full]"); if (f) { var v = f.dataset.full; if (v.charAt(0) === "e") openEvent(+v.slice(1)); else openPers(v.slice(1)); return; }
    var d = ev.target.closest("[data-d]"); if (d) { openDoc(d.dataset.d); return; }
    var b = ev.target.closest("[data-k]"); if (b) openU_(b.dataset.k);
  });
  sc.addEventListener("click", closePn);
  stage.addEventListener("click", function (ev) { var b = ev.target.closest("button[data-k]"); if (b && !moved) openU_(b.dataset.k); });
  root.querySelector(".tlf").addEventListener("click", function (ev) {
    var b = ev.target.closest("button[data-l]"); if (!b) return;
    var l = b.dataset.l, act = ["E", "P", "W"].filter(function (c) { return LS[c]; }).length;
    if (LS[l] && act === 1) return;                                // siempre queda una capa activa
    setLayer(l, !LS[l]);
  });
  var acc = 0, lastW = 0;
  root.addEventListener("wheel", function (ev) {
    if (pn.contains(ev.target)) return; ev.preventDefault();
    var d = Math.abs(ev.deltaX) > Math.abs(ev.deltaY) ? ev.deltaX : ev.deltaY; acc += d;
    if (Math.abs(acc) > 40 && performance.now() - lastW > 90) { go(target + (acc > 0 ? 1 : -1)); acc = 0; lastW = performance.now(); }
  }, { passive: false });
  document.addEventListener("keydown", function (ev) {
    if (!running || ev.ctrlKey || ev.metaKey || ev.altKey || document.querySelector("dialog[open]")) return;
    var t = ev.target; if (t && (t.tagName === "INPUT" || t.tagName === "SELECT" || t.tagName === "TEXTAREA")) return;
    var k = ev.key;
    if (k === "Escape") { closePn(); return; }
    if (k === "Enter" && (!t || t === document.body) && N) { ev.preventDefault(); openU_(key(G[Math.round(target)].u[0])); return; }
    if (k === "ArrowRight" || k === "ArrowDown" || k === "PageDown") { ev.preventDefault(); go(target + 1); }
    else if (k === "ArrowLeft" || k === "ArrowUp" || k === "PageUp") { ev.preventDefault(); go(target - 1); }
    else if (k === "Home") go(0); else if (k === "End") go(N - 1);
  });
  $("#tlpv").onclick = function () { go(target - 1); }; $("#tlnx").onclick = function () { go(target + 1); };
  var drag = null;
  stage.addEventListener("pointerdown", function (ev) { drag = { x: ev.clientX, p: pos, id: ev.pointerId }; moved = false; });
  stage.addEventListener("pointermove", function (ev) {
    if (!drag) return; var dx = ev.clientX - drag.x;
    if (!moved && Math.abs(dx) > 7) { moved = true; try { stage.setPointerCapture(drag.id); } catch (_) {} }
    if (moved) { pos = clamp(drag.p - dx / GAP(), 0, N - 1); target = pos; dirty = true; }
  });
  function end() { if (!drag) return; var m = moved; drag = null; if (m) go(Math.round(pos)); setTimeout(function () { moved = false; }, 0); }
  stage.addEventListener("pointerup", end); stage.addEventListener("pointercancel", end);
  var rd = false;
  rail.addEventListener("pointerdown", function (ev) { rd = true; rail.setPointerCapture(ev.pointerId); railTo(ev); });
  rail.addEventListener("pointermove", function (ev) { if (rd) railTo(ev); }); rail.addEventListener("pointerup", function () { rd = false; });
  window.addEventListener("resize", function () { if (running) { fit(); sizeTop(); dirty = true; } });
}
function sizeTop() { var m = document.querySelector("header.top"); root.style.setProperty("--hh", (m ? m.offsetHeight : 58) + "px"); }
function jumpTo(p) {
  var gi = -1;
  if (p.k) G.some(function (g, i) { return g.u.some(function (u) { if (key(u) === p.k) { gi = i; return true; } return false; }); });
  else if (p.t) G.some(function (g, i) { if (g.tema === +p.t) { gi = i; return true; } return false; });
  else if (p.y != null) G.some(function (g, i) { if (g.y >= +p.y) { gi = i; return true; } return false; });
  if (gi < 0) { gi = 0; G.some(function (g, i) { if (g.y >= 1808) { gi = i; return true; } return false; }); }
  go(gi); pos = target; dirty = true;
}
var pend = null;
window.renderLinea = function () {
  build(); document.body.classList.add("ln"); fit(); sizeTop();
  if (pend || !window._lnSeen) { jumpTo(pend || {}); window._lnSeen = true; }
  var open = pend && pend.k; pend = null;
  if (!running) { running = true; requestAnimationFrame(tick); }
  dirty = true;
  if (open) { var k = G[Math.round(target)]; if (k) openU_(open); }
};
window.lineaPend = function (p) { pend = p || null; };
window.lineaStop = function () { running = false; document.body.classList.remove("ln"); if (pn) closePn(); };
/* abrir desde fuera: lineaIr({k:"e12"}|{k:"p"+id}|{t:4}|{y:1808}) */
window.lineaIr = function (p) { pend = p || null; if (location.hash === "#linea") { if (built) renderLinea(); } else location.hash = "#linea"; };
})();
