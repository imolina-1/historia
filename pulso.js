/* «La clase en cifras»: contadores anónimos y públicos (sobres abiertos, preguntas, minutos…).
   Módulo común a Historia de España PAU y Historia del Arte PAU. No envía ningún identificador:
   solo sumas («+1 sobre», «+3 preguntas») que el servidor agrega por día. Se puede desactivar en el propio panel.
   Configuración (antes de cargar este fichero):
     window.PULSO_CFG = { b: "es" | "arte", api: "https://…/api/lb", temas: function(){ return [{n:1,name:"…"},…] }, link: "#clasif" } */
(function () {
"use strict";
var C = window.PULSO_CFG || {}, KEY = "pulso_q_" + (C.b || "es"), OFF = "pulso_off", API = (C.api || "") + (C.api && C.api.indexOf("?") >= 0 ? "&" : "?") + "pulse=1";
var q = {}, timer = null, cache = null, cacheT = 0, boxes = [], poll = null;
var still = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
function ls(k, v) { try { if (v === undefined) return localStorage.getItem(k); if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) {} return null; }
function on() { return ls(OFF) !== "1"; }
function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
function nf(n) { return Math.round(n).toLocaleString("es-ES"); }
try { q = JSON.parse(ls(KEY) || "{}") || {}; } catch (e) { q = {}; }
function save() { ls(KEY, Object.keys(q).length ? JSON.stringify(q) : null); }
function add(k, n) {
  if (!on()) return; n = n === undefined ? 1 : n; if (!(n > 0)) return;
  q[k] = (q[k] || 0) + n; save(); clearTimeout(timer); timer = setTimeout(flush, 45000);
}
function flush(beacon) {
  clearTimeout(timer); timer = null;
  var keys = Object.keys(q); if (!keys.length || !on()) return;
  var d = q; q = {}; save();
  try {
    fetch(API, { method: "POST", keepalive: !!beacon, headers: { "content-type": "application/json" }, body: JSON.stringify({ d: d }) })
      .then(function (r) { return r.json(); })
      .then(function (j) { if (!j || !j.ok) throw 0; cache = null; })
      .catch(function () { Object.keys(d).forEach(function (k) { q[k] = (q[k] || 0) + d[k]; }); save(); });
  } catch (e) { Object.keys(d).forEach(function (k) { q[k] = (q[k] || 0) + d[k]; }); save(); }
}
/* Posición en la clase, sin identificador: una vez cada 7 días el dispositivo suma 1 a la casilla de su tramo de XP (escala logarítmica, 20 tramos).
   El servidor solo guarda cuántos dispositivos hay en cada tramo; no sabe cuáles. */
function xpNow() { try { return Math.max(0, Math.floor(Number(C.xp && C.xp()) || 0)); } catch (e) { return 0; } }
function bin(x) { return Math.max(0, Math.min(19, Math.floor(Math.log(x / 25 + 1) / Math.LN2 * 2))); }
function dnum() { return Math.floor(Date.now() / 864e5); }
function reportXp() {
  var x = xpNow(), k = "pulso_xw_" + (C.b || "es"), last = +ls(k) || 0;
  if (!on() || x < 1 || dnum() - last < 7) return;
  ls(k, String(dnum())); add("xw" + bin(x), 1);
}
function today() { var d = new Date(); return d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate(); }
function session() { var k = "pulso_ses_" + (C.b || "es"); if (on() && ls(k) !== today()) { ls(k, today()); add("ses", 1); } setTimeout(reportXp, 6000); }
document.addEventListener("visibilitychange", function () { if (document.visibilityState === "hidden") flush(true); });
window.addEventListener("pagehide", function () { flush(true); });
if (Object.keys(q).length) timer = setTimeout(flush, 8000);

function get(cb, force) {
  if (!force && cache && Date.now() - cacheT < 30000) { cb(cache); return; }
  var c = new AbortController(), to = setTimeout(function () { c.abort(); }, 9000);
  fetch(API, { signal: c.signal }).then(function (r) { return r.json(); }).then(function (j) {
    clearTimeout(to); if (j && j.ok) { cache = j; cacheT = Date.now(); cb(j); } else cb(null);
  }).catch(function () { clearTimeout(to); cb(null); });
}

/* ---------- presentación ---------- */
var CSS = ".pu{margin:22px 0 10px}.pu-h{display:flex;align-items:baseline;justify-content:space-between;gap:10px;flex-wrap:wrap}.pu-h h2{margin:0;font-size:1.3rem}" +
  ".pu-live{display:inline-flex;align-items:center;gap:7px;font-family:var(--ui,system-ui,sans-serif);font-weight:700;font-size:.66rem;line-height:1;letter-spacing:.14em;text-transform:uppercase;color:var(--muted)}" +
  ".pu-live i{width:8px;height:8px;border-radius:50%;background:#2fb36b;animation:puP 2.2s infinite}@keyframes puP{0%{box-shadow:0 0 0 0 rgba(47,179,107,.55)}70%,100%{box-shadow:0 0 0 8px rgba(47,179,107,0)}}" +
  ".pu-big{display:grid;grid-template-columns:repeat(auto-fit,minmax(148px,1fr));gap:12px;margin-top:14px}" +
  ".pu-big>div,.pu-c{background:var(--surface);border:1px solid var(--line);border-radius:var(--r,14px);padding:14px 16px}" +
  ".pu-big b{display:block;font-family:var(--display,inherit);font-weight:800;font-size:clamp(1.7rem,4.4vw,2.3rem);line-height:1;letter-spacing:-.02em;font-variant-numeric:tabular-nums;color:var(--ink)}" +
  ".pu-big span{display:block;margin-top:6px;font-size:.84rem;color:var(--muted);line-height:1.3}" +
  ".pu-big em{display:inline-block;margin-top:8px;font-family:var(--ui,system-ui,sans-serif);font-weight:700;font-size:.7rem;line-height:1;font-style:normal;letter-spacing:.04em;padding:4px 8px;border-radius:999px;background:var(--pu-hi,#eee);color:var(--pu-hi-ink,var(--ink))}" +
  ".pu-row{display:grid;grid-template-columns:1.25fr 1fr;gap:12px;margin-top:12px}@media(max-width:760px){.pu-row{grid-template-columns:1fr}}" +
  ".pu-c h3{margin:0 0 10px;font-size:1.02rem}.pu-c p{margin:0;font-size:.88rem;color:var(--muted);line-height:1.4}" +
  ".pu-goal{height:14px;border-radius:999px;background:var(--line);overflow:hidden;margin:10px 0 8px}.pu-goal i{display:block;height:100%;border-radius:999px;background:var(--pu-bar,var(--ink));transition:width 1s cubic-bezier(.2,.8,.2,1)}" +
  ".pu-goal+p b{color:var(--ink)}" +
  ".pu-ch{width:100%;height:auto;display:block}.pu-ch .b{fill:var(--pu-bar,var(--ink));opacity:.35}.pu-ch .b.t{opacity:1;fill:var(--pu-hi2,var(--pu-bar,var(--ink)))}.pu-ch .b.m{opacity:.85}.pu-ch text{font-family:var(--ui,system-ui,sans-serif);font-weight:600;font-size:5.4px;fill:var(--muted)}" +
  ".pu-tm{display:grid;gap:6px;margin-top:2px}.pu-t{display:grid;grid-template-columns:2.2ch 1fr 5.4ch;gap:8px;align-items:center;font-size:.86rem}.pu-t .n{font-weight:800;color:var(--muted);font-variant-numeric:tabular-nums}" +
  ".pu-t .nm{position:relative;height:22px;border-radius:6px;background:var(--line);overflow:hidden}.pu-t .nm i{position:absolute;inset:0 auto 0 0;background:var(--pu-bar,var(--ink));opacity:.28;border-radius:6px}.pu-t .nm span{position:relative;display:block;padding:0 8px;line-height:22px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:.8rem;color:var(--ink)}" +
  ".pu-t.hard .nm i{background:#d94a3a;opacity:.4}.pu-t.best .nm i{background:#2fb36b;opacity:.4}.pu-t .v{text-align:right;font-weight:700;font-variant-numeric:tabular-nums}.pu-t.no .v{color:var(--muted);font-weight:500}" +
  ".pu-k{display:flex;gap:6px;flex-wrap:wrap;margin-top:10px;font-size:.78rem;color:var(--muted)}.pu-k b{color:var(--ink)}.pu-k .tg{margin-left:auto}" +
  ".pu-off{all:unset;cursor:pointer;text-decoration:underline;text-underline-offset:2px}.pu-err{padding:14px;color:var(--muted)}" +
  ".pu-tick{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin:14px 0;padding:10px 14px;border:1px solid var(--line);background:var(--surface);border-radius:999px;font-size:.88rem;color:var(--ink);text-decoration:none;max-width:fit-content}" +
  ".pu-tick:hover{border-color:var(--ink)}.pu-tick b{font-variant-numeric:tabular-nums}.pu-tick .go{color:var(--muted);font-size:.8rem}" +
  "@media(prefers-reduced-motion:reduce){.pu-live i{animation:none}.pu-goal i{transition:none}}";
function css() { if (document.getElementById("pu-css")) return; var s = document.createElement("style"); s.id = "pu-css"; s.textContent = CSS; document.head.appendChild(s); }

var MILES = [25, 50, 100, 250, 500, 1000, 2500, 5000, 10000, 25000, 50000];
function dayStreak(days) {
  var n = 0, i = 29; if (!(days[29] && days[29].ses > 0)) i = 28;
  for (; i >= 0; i--) { if (days[i] && days[i].ses > 0) n++; else break; }
  return n;
}
function countUp(el, to) {
  if (still || to < 20) { el.textContent = nf(to); return; }
  var t0 = performance.now(), D = 900;
  (function f(t) { var p = Math.min(1, (t - t0) / D), e = 1 - Math.pow(1 - p, 3); el.textContent = nf(to * e); if (p < 1) requestAnimationFrame(f); })(t0);
}
function chart(days, key) {
  var W = 300, H = 74, bw = 8.4, g = 1.6, mx = 1, i, o = "";
  for (i = 0; i < 30; i++) mx = Math.max(mx, (days[i] && days[i][key]) || 0);
  for (i = 0; i < 30; i++) {
    var v = (days[i] && days[i][key]) || 0, h = Math.max(v ? 2 : 0.8, v / mx * (H - 20)), x = i * (bw + g) + 2;
    o += '<rect class="b' + (i === 29 ? " t" : "") + (v === mx && v > 0 ? " m" : "") + '" x="' + x.toFixed(1) + '" y="' + (H - 12 - h).toFixed(1) + '" width="' + bw + '" height="' + h.toFixed(1) + '" rx="2"><title>' + (v ? nf(v) : "0") + "</title></rect>";
  }
  var pk = 0; for (i = 0; i < 30; i++) if (((days[i] && days[i][key]) || 0) === mx && mx > 1) pk = i;
  return '<svg class="pu-ch" viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="Preguntas respondidas cada día, últimos 30 días">' + o +
    '<text x="2" y="' + (H - 1) + '">hace 30 días</text><text x="' + (W - 2) + '" y="' + (H - 1) + '" text-anchor="end">hoy</text>' +
    (mx > 1 ? '<text x="' + Math.min(W - 40, Math.max(2, pk * (bw + g) - 8)) + '" y="8">máx. ' + nf(mx) + "</text>" : "") + "</svg>";
}
function pos(d) {
  var xw = d.xw || [], tot = 0, i, x = xpNow(), me = x > 0 ? bin(x) : -1, mx = 1;
  for (i = 0; i < 20; i++) { tot += xw[i] || 0; mx = Math.max(mx, xw[i] || 0); }
  var h = '<div class="pu-c pu-pos"><h3>Tu sitio en la clase</h3>';
  if (tot < 10) return h + "<p>Cuando haya unos cuantos alumnos más estudiando esta semana verás aquí cómo vas.</p></div>";
  var below = 0; if (me >= 0) { for (i = 0; i < me; i++) below += xw[i] || 0; below += (xw[me] || 0) / 2; }
  var pc = me >= 0 ? Math.max(1, Math.min(99, Math.round(below / tot * 100))) : null, o = "", W = 300, H = 62, bw = 12.4, g = 2.4;
  for (i = 0; i < 20; i++) {
    var v = xw[i] || 0, hh = Math.max(v ? 2 : 0.8, v / mx * (H - 16));
    o += '<rect class="b' + (i === me ? " t" : "") + '" x="' + (i * (bw + g) + 2).toFixed(1) + '" y="' + (H - 10 - hh).toFixed(1) + '" width="' + bw + '" height="' + hh.toFixed(1) + '" rx="2"><title>' + v + "</title></rect>";
  }
  return h + (pc != null ? "<p style=\"font-size:1rem;color:var(--ink)\">Vas por delante del <b>" + pc + " %</b> de la clase que ha estudiado en los últimos 7 días.</p>" : "<p>Gana algo de XP y aparecerás en el gráfico.</p>") +
    '<svg class="pu-ch" viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="Reparto de la clase por XP">' + o + '<text x="2" y="' + (H - 1) + '">menos XP</text><text x="' + (W - 2) + '" y="' + (H - 1) + '" text-anchor="end">más XP</text></svg>' +
    "<p>" + nf(tot) + " dispositivos en los últimos 7 días" + (me >= 0 ? ". La barra marcada eres tú" : "") + ". No se guarda quién es quién, solo cuántos hay en cada tramo.</p></div>";
}
function body(d) {
  var t = d.t || {}, days = d.days || {}, hoy = days[29] || {}, ayer = days[28] || {};
  var pk = t.pk || 0, qn = t.q || 0, qo = t.qo || 0, mn = t.mn || 0, nw = t.nw || 0, lg = t.lg || 0;
  var next = MILES.filter(function (m) { return m > pk; })[0] || (Math.ceil((pk + 1) / 50000) * 50000), prev = MILES.filter(function (m) { return m <= pk; }).pop() || 0;
  var pct = Math.round((pk - prev) / (next - prev) * 100), st = dayStreak(days);
  var delta = function (a, b, unit) { if (!a) return ""; return '<em>hoy +' + nf(a) + (unit || "") + "</em>"; };
  var T = (C.temas ? C.temas() : []).map(function (x) { var a = t["t" + x.n + "a"] || 0, o = t["t" + x.n + "o"] || 0; return { n: x.n, name: x.name, a: a, p: a ? o / a : null }; });
  var ok = T.filter(function (x) { return x.a >= 25; }), hard = ok.slice().sort(function (a, b) { return a.p - b.p; })[0], best = ok.slice().sort(function (a, b) { return b.p - a.p; })[0];
  if (hard && best && hard.n === best.n) best = null;
  var rows = T.map(function (x) {
    var cls = x.a < 25 ? "no" : (hard && x.n === hard.n ? "hard" : (best && x.n === best.n ? "best" : ""));
    return '<div class="pu-t ' + cls + '"><span class="n">' + x.n + '</span><span class="nm"><i style="width:' + (x.p == null ? 0 : Math.round(x.p * 100)) + '%"></i><span>' + esc(x.name) + '</span></span><span class="v">' + (x.p == null ? "—" : Math.round(x.p * 100) + " %") + "</span></div>";
  }).join("");
  var live = '<span class="pu-live"><i aria-hidden="true"></i>En directo</span>';
  return '<div class="pu-h"><h2>La clase en cifras</h2>' + live + "</div>" +
    '<div class="pu-big"><div><b data-c="' + pk + '">0</b><span>sobres abiertos</span>' + delta(hoy.pk) + "</div>" +
    '<div><b data-c="' + qn + '">0</b><span>preguntas respondidas' + (qn ? " · " + Math.round(qo / qn * 100) + " % de aciertos" : "") + "</span>" + delta(hoy.q) + "</div>" +
    '<div><b data-c="' + Math.round(mn / 60) + '">0</b><span>horas de estudio entre todos</span>' + delta(hoy.mn, " min") + "</div>" +
    '<div><b data-c="' + nw + '">0</b><span>cromos distintos conseguidos' + (lg ? " · " + nf(lg) + " legendarios" : "") + "</span>" + delta(hoy.nw) + "</div></div>" +
    '<div class="pu-row"><div class="pu-c"><h3>Meta de la clase: ' + nf(next) + ' sobres</h3><div class="pu-goal" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + pct + '"><i style="width:0" data-w="' + Math.max(2, pct) + '%"></i></div>' +
    "<p><b>" + nf(next - pk) + "</b> para llegar a " + nf(next) + (st > 1 ? " · la clase lleva <b>" + st + " días seguidos</b> estudiando" : "") + "</p>" +
    '<h3 style="margin-top:16px">Preguntas por día</h3>' + chart(days, "q") + "</div>" +
    '<div class="pu-c"><h3>Aciertos por tema</h3><div class="pu-tm">' + rows + "</div>" +
    '<p style="margin-top:10px">' + (hard ? "Lo más difícil ahora: <b>tema " + hard.n + "</b> (" + Math.round(hard.p * 100) + " %)." : "Aparecerán cuando haya al menos 25 respuestas por tema.") + (best ? " Lo más dominado: <b>tema " + best.n + "</b> (" + Math.round(best.p * 100) + " %)." : "") + "</p></div></div>" +
    '<div class="pu-row" style="grid-template-columns:1fr">' + pos(d) + "</div>" +
    '<div class="pu-k"><span><b>' + nf(d.players || 0) + "</b> en la clasificación · <b>" + nf(d.activeToday || 0) + "</b> activos hoy</span>" +
    '<span class="tg">Anónimo: solo se suman cifras, sin identificadores. <button type="button" class="pu-off" data-off>' + (on() ? "No contar mi actividad" : "Volver a contar mi actividad") + "</button></span></div>";
}
function paint(el, d) {
  if (!el.isConnected) return;
  var first = !el._painted; el._painted = 1;
  el.innerHTML = body(d);
  [].slice.call(el.querySelectorAll("b[data-c]")).forEach(function (b) { var v = +b.dataset.c; if (first) countUp(b, v); else b.textContent = nf(v); });
  [].slice.call(el.querySelectorAll("i[data-w]")).forEach(function (i) { requestAnimationFrame(function () { requestAnimationFrame(function () { i.style.width = i.dataset.w; }); }); });
  var off = el.querySelector("[data-off]"); if (off) off.onclick = function () { if (on()) { ls(OFF, "1"); q = {}; save(); } else ls(OFF, null); paint(el, d); };
}
function render(el) {
  if (!el) return; css(); el.classList.add("pu"); el._painted = 0;
  if (!el._painted && !el.firstChild) el.innerHTML = '<div class="pu-h"><h2>La clase en cifras</h2></div><div class="pu-err">Cargando…</div>';
  get(function (d) { if (!d) { el.innerHTML = '<div class="pu-h"><h2>La clase en cifras</h2></div><div class="pu-err">No se pueden cargar ahora las cifras de la clase.</div>'; return; } paint(el, d); });
  if (boxes.indexOf(el) < 0) boxes.push(el);
  if (!poll) poll = setInterval(function () {
    boxes = boxes.filter(function (b) { return b.isConnected; }); if (!boxes.length) { clearInterval(poll); poll = null; return; }
    if (document.hidden) return; get(function (d) { if (d) boxes.forEach(function (b) { if (b.classList.contains("pu")) paint(b, d); }); }, true);
  }, 60000);
}
function ticker(el, href) {
  if (!el) return; css();
  get(function (d) {
    if (!d || !el.isConnected) { el && (el.hidden = true); return; }
    var h = (d.days && d.days[29]) || {}, t = d.t || {}, parts = [];
    if (h.pk) parts.push("<b>" + nf(h.pk) + "</b> " + (h.pk === 1 ? "sobre" : "sobres"));
    if (h.q) parts.push("<b>" + nf(h.q) + "</b> preguntas");
    if (h.mn >= 5) parts.push("<b>" + (h.mn >= 90 ? nf(h.mn / 60) + " h" : nf(h.mn) + " min") + "</b> de estudio");
    if (!parts.length && !(t.pk || 0)) { el.hidden = true; return; }
    var txt = parts.length ? "Hoy en clase: " + parts.join(" · ") : "La clase lleva <b>" + nf(t.pk) + "</b> sobres abiertos";
    el.className = "pu-tick"; el.href = href || C.link || "#clasif"; el.hidden = false;
    el.innerHTML = '<span class="pu-live"><i aria-hidden="true"></i></span><span>' + txt + '</span><span class="go">Ver la clase en cifras →</span>';
  });
}
window.PULSO = { pos: function (cb) { get(function (d) { if (!d) return cb(null); var x = xpNow(), tot = 0, i; for (i = 0; i < 20; i++) tot += (d.xw || [])[i] || 0; if (tot < 10 || x < 1) return cb(null); var m = bin(x), b = 0; for (i = 0; i < m; i++) b += d.xw[i] || 0; b += (d.xw[m] || 0) / 2; cb(Math.max(1, Math.min(99, Math.round(b / tot * 100)))); }); }, add: add, flush: flush, session: session, render: render, ticker: ticker, get: get, on: on };
session();
})();
