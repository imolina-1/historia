/* Historia de España — simulador de nota de acceso y de admisión (PAU, RD 534/2024).
   Nota de acceso = 0,6 · nota media de Bachillerato + 0,4 · media de la fase de acceso (esta, al menos 4; la nota de acceso, al menos 5).
   Nota de admisión = nota de acceso + a · M1 + b · M2, con a y b = 0,1 o 0,2 según universidad y grado y M1, M2 las dos mejores materias de la fase de admisión (con 5 o más). Máximo: 14. */
(function () {
"use strict";
var KEY = "notapau", EX = [["len", "Lengua Castellana y Literatura"], ["his", "Historia de España"], ["idi", "Lengua extranjera"], ["mod", "Materia de modalidad"]];
var DEF = { nmb: 7, len: 6, his: 6, idi: 6, mod: 6, adm: [{ n: 0, c: .2 }, { n: 0, c: .1 }, { n: 0, c: 0 }], obj: 8 };
function num(v, a, b, d) { v = parseFloat(String(v).replace(",", ".")); return isFinite(v) ? Math.max(a, Math.min(b, v)) : d; }
function fm(x, n) { return (Math.round(x * Math.pow(10, n === undefined ? 2 : n)) / Math.pow(10, n === undefined ? 2 : n)).toFixed(n === undefined ? 2 : n).replace(".", ","); }
function load() { var s = null; try { s = window.LS && LS.get(KEY, null); } catch (e) {} var o = JSON.parse(JSON.stringify(DEF)); if (s && typeof s === "object") { Object.keys(DEF).forEach(function (k) { if (s[k] !== undefined && k !== "adm") o[k] = s[k]; }); if (Array.isArray(s.adm)) o.adm = DEF.adm.map(function (d, i) { return s.adm[i] ? { n: num(s.adm[i].n, 0, 10, 0), c: [0, .1, .2].indexOf(+s.adm[i].c) >= 0 ? +s.adm[i].c : d.c } : d; }); } return o; }
function save(o) { try { LS.set(KEY, o); } catch (e) {} }
function calc(o, over) {
  var v = Object.assign({}, o, over || {});
  var cfa = EX.reduce(function (s, e) { return s + num(v[e[0]], 0, 10, 0); }, 0) / EX.length;
  var nau = .6 * num(v.nmb, 0, 10, 0) + .4 * cfa;
  var okF = cfa >= 4, okN = okF && nau >= 5;
  var cand = v.adm.filter(function (m) { return m.n >= 5 && m.c > 0; }).map(function (m) { return m.n * m.c; }).sort(function (a, b) { return b - a; });
  var extra = (cand[0] || 0) + (cand[1] || 0);
  return { cfa: cfa, nau: nau, okF: okF, okN: okN, extra: extra, adm: nau + extra, cand: cand };
}
window.tkNota = function (el) {
  var o = load();
  el.innerHTML =
    '<div class="card" id="np"><p class="note" style="margin:0 0 12px">Calcula tu nota de acceso y de admisión y mira qué compensa mejorar.</p>' +
    '<div class="npg"><div class="field"><label for="np-nmb">Nota media de Bachillerato</label><input id="np-nmb" type="number" inputmode="decimal" min="5" max="10" step="0.01" value="' + o.nmb + '"></div></div>' +
    '<h3 class="nph">Fase de acceso: cuatro ejercicios</h3><div class="npg">' +
    EX.map(function (e) { return '<div class="field"><label for="np-' + e[0] + '">' + e[1] + '</label><input id="np-' + e[0] + '" type="number" inputmode="decimal" min="0" max="10" step="0.1" value="' + o[e[0]] + '"></div>'; }).join("") +
    '</div><h3 class="nph">Fase de admisión (voluntaria)</h3><p class="note" style="margin:0 0 8px">Hasta tres materias. Cuentan las dos que más suman, y solo si sacas un 5 o más. La ponderación (0,1 o 0,2) depende de la universidad y del grado.</p>' +
    '<div class="npa">' + o.adm.map(function (m, i) { return '<div class="field"><label for="np-a' + i + '">Materia ' + (i + 1) + ': nota</label><input id="np-a' + i + '" type="number" inputmode="decimal" min="0" max="10" step="0.1" value="' + (m.n || "") + '" placeholder="–"></div><div class="field"><label for="np-c' + i + '">Ponderación</label><select id="np-c' + i + '"><option value="0"' + (m.c === 0 ? " selected" : "") + '>No la uso</option><option value="0.1"' + (m.c === .1 ? " selected" : "") + '>0,1</option><option value="0.2"' + (m.c === .2 ? " selected" : "") + '>0,2</option></select></div>'; }).join("") + '</div></div>' +
    '<div id="np-r"></div>';
  var ids = ["nmb"].concat(EX.map(function (e) { return e[0]; }));
  function read() {
    ids.forEach(function (k) { o[k] = num($("#np-" + k).value, k === "nmb" ? 5 : 0, 10, DEF[k]); });
    o.adm = o.adm.map(function (m, i) { return { n: num($("#np-a" + i).value, 0, 10, 0), c: +$("#np-c" + i).value }; });
  }
  function $(s) { return el.querySelector(s); }
  function show() {
    var r = calc(o), his = calc(o, { his: Math.min(10, o.his + 1) }), pt = EX.map(function (e) { return [e[1], calc(o, (function () { var x = {}; x[e[0]] = Math.min(10, o[e[0]] + 1); return x; })()).nau - r.nau]; });
    var tg = num(o.obj, 5, 10, 8), needCfa = (tg - .6 * o.nmb) / .4, needHis = needCfa * 4 - (o.len + o.idi + o.mod);
    var hisTxt = needHis > 10 ? "Con esas tres notas no se llega a ese objetivo ni con un 10 en Historia: hay que subir también otras." : needHis <= 0 ? "Ya llegas a esa nota aunque suspendas Historia (cuenta que la media de la fase de acceso debe ser 4 como mínimo)." : "Necesitas al menos un <b>" + fm(Math.max(needHis, 0), 1) + "</b> en Historia de España, con las otras tres como las has puesto.";
    $("#np-r").innerHTML =
      '<div class="stats4" style="margin-top:16px">' +
      '<div class="stt"><b>' + fm(r.cfa) + '</b><span>media de la fase de acceso' + (r.okF ? "" : " · menos de 4: no se calcula la nota") + '</span></div>' +
      '<div class="stt"><b>' + fm(r.nau) + '</b><span>nota de acceso (sobre 10)' + (r.okN ? "" : " · menos de 5") + '</span></div>' +
      '<div class="stt"><b>' + fm(r.adm) + '</b><span>nota de admisión (sobre 14)</span></div>' +
      '<div class="stt"><b>+' + fm(his.nau - r.nau) + '</b><span>por cada punto más en Historia</span></div></div>' +
      '<div class="card" style="margin-top:14px"><h3 class="nph" style="margin-top:0">Qué compensa</h3><p class="note" style="margin:0 0 8px">Un punto más en cada ejercicio de la fase de acceso suma lo mismo, porque la media es aritmética: ' +
      fm(pt[0][1]) + ' a la nota de acceso. Una materia de admisión con ponderación 0,2 suma hasta 0,20 por punto, el doble, pero solo cuentan dos y solo si llegas a 5.</p>' +
      '<div class="field" style="max-width:320px"><label for="np-obj">Nota de acceso que quiero</label><input id="np-obj" type="number" inputmode="decimal" min="5" max="10" step="0.1" value="' + o.obj + '"></div>' +
      '<p style="margin:10px 0 0">' + hisTxt + '</p></div>' +
      '<p class="note" style="margin-top:12px">Orientativo. Fuente: Real Decreto 534/2024 y normas de cada universidad. La ponderación de cada materia la publica cada universidad para cada grado: consúltala en su web.</p>';
    var obj = $("#np-obj"); if (obj) obj.onchange = function () { o.obj = num(obj.value, 5, 10, 8); save(o); show(); };
  }
  el.querySelectorAll("#np input,#np select").forEach(function (i) { i.addEventListener("input", function () { read(); save(o); show(); }); });
  show();
};
})();
