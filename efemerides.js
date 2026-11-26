/* Efemérides: qué pasó cada día del curso. Datos en data.json («efem»): [día, mes, año, texto, tema, personaje]. */
(function () {
"use strict";
var $ = function (s, r) { return (r || document).querySelector(s); };
var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
var MES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
var DIAS = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
var st = { m: null, d: null, q: null, ok: 0, n: 0 };
function E(s) { return typeof esc === "function" ? esc(s) : String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
function yl(y) { return typeof fy === "function" ? fy(y) : String(y); }
function nm(p) { return typeof clean === "function" ? clean(p.nombre) : p.nombre; }
function now() { var t = new Date(); return { d: t.getDate(), m: t.getMonth() + 1, y: t.getFullYear(), t: t }; }
function list() { return typeof EFE !== "undefined" ? EFE : []; }
function day(d, m) { return list().filter(function (e) { return e[0] === d && e[1] === m; }).sort(function (a, b) { return a[2] - b[2]; }); }
function idx(e) { return list().indexOf(e); }
function lbl(d, m) { return d + " de " + MES[m - 1]; }

/* Los siguientes días con efemérides, empezando por hoy */
function upcoming(n) {
  var T = now(), out = [], t0 = Date.UTC(T.y, T.m - 1, T.d);
  for (var i = 0; i < 400 && out.length < n; i++) {
    var dt = new Date(t0 + i * 864e5), d = dt.getUTCDate(), m = dt.getUTCMonth() + 1, l = day(d, m);
    if (l.length) out.push({ d: d, m: m, en: i, list: l });
  }
  return out;
}

function ago(y) {
  var n = now().y - y; if (n <= 0) return "";
  return "hace " + n + (n === 1 ? " año" : " años");
}
function card(e, mini) {
  var p = e[5] && typeof PM !== "undefined" && PM[e[5]], i = idx(e), tm = (typeof TEMAS !== "undefined" ? TEMAS : []).filter(function (x) { return x.n === e[4]; })[0];
  return '<article class="efc' + (mini ? " mini" : "") + '"><div class="efy"><b>' + E(yl(e[2])) + "</b><small>" + ago(e[2]) + "</small></div>" +
    '<div class="efb"><p>' + E(e[3]) + "</p>" + (tm ? '<span class="eft">Tema ' + tm.n + " · " + E(tm.nombre) + "</span>" : "") +
    '<div class="efa">' + (p ? '<button type="button" class="btn small" data-pp="' + E(p.id) + '">' + E(nm(p)) + "</button>" : "") +
    '<button type="button" class="btn small" data-yl="' + e[2] + '">En la línea del tiempo</button>' +
    '<button type="button" class="btn small" data-sh="' + i + '">Compartir imagen</button></div></div></article>';
}

/* ---------- vista ---------- */
function hero() {
  var T = now(), hoy = day(T.d, T.m), nx, h;
  if (hoy.length) {
    h = '<div class="efd"><small>Tal día como hoy</small><b>' + T.d + "</b><span>" + MES[T.m - 1] + "</span></div>";
    return '<section class="efh">' + h + '<div class="efl">' + hoy.map(function (e) { return card(e); }).join("") + "</div></section>";
  }
  nx = upcoming(1)[0];
  if (!nx) return "";
  h = '<div class="efd"><small>' + (nx.en === 1 ? "Mañana" : "En " + nx.en + " días") + "</small><b>" + nx.d + "</b><span>" + MES[nx.m - 1] + "</span></div>";
  return '<section class="efh">' + h + '<div class="efl"><p class="efn">Hoy no hay efeméride en el temario. La siguiente:</p>' + nx.list.map(function (e) { return card(e); }).join("") + "</div></section>";
}
function week() {
  var T = now(), l = upcoming(9).filter(function (o) { return !(o.d === T.d && o.m === T.m); }).slice(0, 6);
  if (!l.length) return "";
  return '<div class="sech"><h2>Próximos días</h2></div><ul class="efw">' + l.map(function (o) {
    var e = o.list[0];
    return '<li><button type="button" data-go="' + o.d + "-" + o.m + '"><span class="efwd"><b>' + o.d + "</b>" + MES[o.m - 1].slice(0, 3) + '</span><span class="efwt"><b>' + E(yl(e[2])) + "</b> " + E(e[3]) + (o.list.length > 1 ? " <i>+" + (o.list.length - 1) + "</i>" : "") + "</span></button></li>";
  }).join("") + "</ul>";
}
function cal() {
  var T = now(), m = st.m, n = DIAS[m - 1], h = "";
  for (var d = 1; d <= n; d++) {
    var c = day(d, m).length;
    h += '<button type="button" class="efcd' + (c ? " has" : "") + (st.d === d ? " on" : "") + (T.d === d && T.m === m ? " hoy" : "") + '" data-cd="' + d + '" aria-label="' + lbl(d, m) + (c ? ", " + c + (c === 1 ? " efeméride" : " efemérides") : "") + '"><b>' + d + "</b>" + (c ? "<i>" + c + "</i>" : "") + "</button>";
  }
  return '<div class="efm" role="tablist" aria-label="Mes">' + MES.map(function (x, i) {
    return '<button type="button" role="tab" data-cm="' + (i + 1) + '" aria-selected="' + (st.m === i + 1) + '">' + x.slice(0, 3) + "</button>";
  }).join("") + '</div><div class="efg" aria-label="' + MES[m - 1] + '">' + h + '</div><div id="efsel" class="efsel">' + sel() + "</div>";
}
function sel() {
  if (!st.d) return '<p class="efn">Elige un día marcado.</p>';
  var l = day(st.d, st.m);
  if (!l.length) return '<p class="efn">' + lbl(st.d, st.m) + ": sin efemérides.</p>";
  return '<h3 class="efsh">' + lbl(st.d, st.m) + "</h3>" + l.map(function (e) { return card(e); }).join("");
}

/* ---------- adivina el año ---------- */
function pool() { return list().filter(function (e) { return !/\b(1\d{3}|20\d\d)\b/.test(e[3]) && e[2] > 700; }); }
function newQ() {
  var P = pool(), e = P[Math.floor(Math.random() * P.length)], opts = [e[2]], tries = 0;
  while (opts.length < 4 && tries++ < 200) {
    var dy = (Math.floor(Math.random() * 8) + 2) * (Math.random() < .5 ? -1 : 1) * (e[2] > 1800 ? 1 : (e[2] > 1400 ? 5 : 12));
    var y = e[2] + dy; if (opts.indexOf(y) < 0 && y <= now().y) opts.push(y);
  }
  opts.sort(function (a, b) { return a - b; });
  st.q = { e: e, opts: opts, done: false };
}
function quiz() {
  var q = st.q, e = q.e;
  return '<div class="efq"><p class="efqd">' + lbl(e[0], e[1]) + '</p><p class="efqt">' + E(e[3]) + '</p><div class="efqo">' + q.opts.map(function (y) {
    return '<button type="button" class="btn" data-qy="' + y + '"' + (q.done ? " disabled" : "") + (q.done && y === e[2] ? ' data-r="ok"' : (q.done && y === q.pick ? ' data-r="no"' : "")) + ">" + E(yl(y)) + "</button>";
  }).join("") + "</div>" + (q.done ? '<p class="efqr"><b>' + (q.pick === e[2] ? "Correcto." : "Fue en " + E(yl(e[2])) + ".") + "</b>" + (q.xp ? " +1 XP." : "") + ' <button type="button" class="btn small primary" data-qn="1">Otra</button></p>' : "") +
    '<p class="efqs">' + st.ok + " de " + st.n + " acertadas</p></div>";
}
function answer(y) {
  var q = st.q; if (!q || q.done) return;
  q.done = true; q.pick = y; st.n++;
  var ok = y === q.e[2]; if (ok) {
    st.ok++;
    try {
      var g = G(), k = now().t.toISOString().slice(0, 10), z = g.efq && g.efq.d === k ? g.efq : (g.efq = { d: k, n: 0 });
      if (z.n < 5) { z.n++; AL().xp += 1; q.xp = true; saveST(); }
    } catch (e) {}
  }
  $("#efq").innerHTML = quiz();
}

/* ---------- calendario .ics ---------- */
function ics() {
  var L = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Historia de España PAU//Efemérides//ES", "CALSCALE:GREGORIAN", "X-WR-CALNAME:Efemérides · Historia de España"], stamp = new Date().toISOString().replace(/[-:]/g, "").slice(0, 15) + "Z";
  function esc2(s) { return String(s).replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,"); }
  list().forEach(function (e, i) {
    var p2 = function (n) { return (n < 10 ? "0" : "") + n; };
    L.push("BEGIN:VEVENT", "UID:efe-" + i + "@historiapau", "DTSTAMP:" + stamp, "DTSTART;VALUE=DATE:2001" + p2(e[1]) + p2(e[0]), "RRULE:FREQ=YEARLY", "SUMMARY:" + esc2(yl(e[2]) + " · " + e[3]), "TRANSP:TRANSPARENT", "END:VEVENT");
  });
  L.push("END:VCALENDAR");
  var b = new Blob([L.join("\r\n")], { type: "text/calendar" }), a = document.createElement("a");
  a.href = URL.createObjectURL(b); a.download = "efemerides-historia-de-espana.ics"; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(function () { URL.revokeObjectURL(a.href); }, 5000);
  if (typeof toast === "function") toast("Archivo de calendario descargado.");
}

/* ---------- imagen para compartir ---------- */
function wrapT(x, t, maxW, maxL) {
  var ws = String(t).split(" "), L = [], l = "";
  ws.forEach(function (w) { var s = l ? l + " " + w : w; if (x.measureText(s).width > maxW && l) { L.push(l); l = w; } else l = s; });
  if (l) L.push(l);
  if (L.length > maxL) { L.length = maxL; L[maxL - 1] = L[maxL - 1].replace(/[ ,.;:]*$/, "") + "…"; }
  return L;
}
async function imagen(e) {
  try { await Promise.all([document.fonts.load("italic 500 60px Newsreader"), document.fonts.load("600 200px Newsreader"), document.fonts.load("700 30px Inter")]); } catch (er) {}
  var W = 1080, H = 1350, c = document.createElement("canvas"); c.width = W; c.height = H;
  var x = c.getContext("2d"), g = x.createRadialGradient(W * .5, 0, 80, W * .5, 0, 1300);
  g.addColorStop(0, "#2a2016"); g.addColorStop(1, "#120e0a"); x.fillStyle = g; x.fillRect(0, 0, W, H);
  x.strokeStyle = "#ffc933"; x.lineWidth = 3; x.strokeRect(36, 36, W - 72, H - 72);
  x.textAlign = "center"; x.textBaseline = "alphabetic";
  x.fillStyle = "#ffc933"; x.font = "700 30px Inter, sans-serif"; if ("letterSpacing" in x) x.letterSpacing = "8px";
  x.fillText("TAL DÍA COMO HOY", W / 2, 150);
  x.fillStyle = "#f4ecdc"; x.font = "600 52px Inter, sans-serif"; if ("letterSpacing" in x) x.letterSpacing = "1px";
  x.fillText(lbl(e[0], e[1]), W / 2, 226);
  if ("letterSpacing" in x) x.letterSpacing = "0px";
  var ys = yl(e[2]), fs = 300; x.fillStyle = "#ffc933";
  do { x.font = "600 " + fs + "px Newsreader, Georgia, serif"; fs -= 10; } while (x.measureText(ys).width > W - 200 && fs > 120);
  x.fillText(ys, W / 2, 520);
  x.strokeStyle = "rgba(255,201,51,.5)"; x.lineWidth = 2; x.beginPath(); x.moveTo(W / 2 - 80, 590); x.lineTo(W / 2 + 80, 590); x.stroke();
  x.fillStyle = "#f4ecdc"; var s = 62, L;
  do { x.font = "italic 500 " + s + "px Newsreader, Georgia, serif"; L = wrapT(x, e[3], W - 220, 99); s -= 3; } while (L.length > 7 && s > 38);
  var y0 = 700, lh = s * 1.3 + 4;
  L.forEach(function (t, i) { x.fillText(t, W / 2, y0 + i * lh); });
  x.fillStyle = "rgba(244,236,220,.55)"; x.font = "700 26px Inter, sans-serif"; if ("letterSpacing" in x) x.letterSpacing = "5px";
  x.fillText("HISTORIA DE ESPAÑA · PAU", W / 2, H - 92);
  return c;
}
async function compartir(e, btn) {
  if (btn) { btn.disabled = true; btn.dataset.t = btn.textContent; btn.textContent = "Preparando…"; }
  try {
    var cv = await imagen(e), blob = await new Promise(function (r) { cv.toBlob(r, "image/png"); });
    if (!blob) throw 0;
    var f = new File([blob], "efemeride-" + e[2] + "-" + e[1] + "-" + e[0] + ".png", { type: "image/png" });
    if (navigator.canShare && navigator.canShare({ files: [f] })) {
      try { await navigator.share({ files: [f], title: "Tal día como hoy", text: yl(e[2]) + " · " + e[3] }); return; } catch (er) { if (er && er.name === "AbortError") return; }
    }
    var a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = f.name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 5000);
    if (typeof toast === "function") toast("Imagen guardada.");
  } catch (er) { if (typeof toast === "function") toast("No se ha podido crear la imagen."); }
  finally { if (btn) { btn.disabled = false; btn.textContent = btn.dataset.t || "Compartir imagen"; } }
}

function onclick(ev) {
  var t = ev.target, c;
  if ((c = t.closest("[data-pp]"))) { openPers(c.dataset.pp); return; }
  if ((c = t.closest("[data-yl]"))) { window.lineaIr && lineaIr({ y: +c.dataset.yl }); return; }
  if ((c = t.closest("[data-sh]"))) { var e = list()[+c.dataset.sh]; if (e) compartir(e, c); return; }
  if ((c = t.closest("[data-cm]"))) { st.m = +c.dataset.cm; st.d = null; var l = day(1, st.m); for (var d = 1; d <= DIAS[st.m - 1]; d++) if (day(d, st.m).length) { st.d = d; break; } paint(); return; }
  if ((c = t.closest("[data-cd]"))) { st.d = +c.dataset.cd; $$(".efcd").forEach(function (b) { b.classList.toggle("on", b === c); }); $("#efsel").innerHTML = sel(); return; }
  if ((c = t.closest("[data-go]"))) { var p = c.dataset.go.split("-"); st.m = +p[1]; st.d = +p[0]; paint(); var el = $("#efsel"); if (el) el.scrollIntoView({ behavior: "smooth", block: "center" }); return; }
  if ((c = t.closest("[data-qy]"))) { answer(+c.dataset.qy); return; }
  if (t.closest("[data-qn]")) { newQ(); $("#efq").innerHTML = quiz(); return; }
  if (t.closest("#efics")) { ics(); return; }
}
function paint() {
  var V = $("#v-efemerides"); if (!V) return;
  var c = $("#efcal"); if (c) c.innerHTML = cal();
}
window.renderEfem = function () {
  var V = $("#v-efemerides"); if (!V) return;
  var T = now();
  if (!list().length) { V.innerHTML = '<div class="vh"><h1>Efemérides</h1></div><p class="note">Cargando…</p>'; setTimeout(window.renderEfem, 400); return; }
  if (st.m == null) { st.m = T.m; st.d = day(T.d, T.m).length ? T.d : null; if (!st.d) for (var d = 1; d <= DIAS[st.m - 1]; d++) if (day(d, st.m).length) { st.d = d; break; } }
  if (!st.q) newQ();
  V.innerHTML = '<div class="vh"><h1>Efemérides</h1><p>' + list().length + " fechas del curso, para cada día del año.</p></div>" + hero() + week() +
    '<div class="sech"><h2>Calendario</h2></div><div id="efcal">' + cal() + "</div>" +
    '<div class="sech"><h2>¿En qué año?</h2></div><div id="efq">' + quiz() + "</div>" +
    '<div class="efbt"><button type="button" class="btn" id="efics">Añadir las efemérides a mi calendario</button></div>';
  V.onclick = onclick;
};
})();
