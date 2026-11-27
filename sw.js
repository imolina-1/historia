/* Funciona sin conexión. Cambia VERSION cuando se publique una versión nueva de la web. */
const VERSION = "hde-v2";
const CORE = ["./", "index.html", "identidad.css", "linea.css", "pau.css", "data.json", "extras.js", "pau.js", "linea.js", "anyo.js", "efemerides.js", "mundo.js", "nota.js", "pulso.js", "mapas.js", "arte_min.js", "fonts/inter-latin-wght-normal.woff2", "fonts/bricolage-latin-wdth-normal.woff2", "fonts/newsreader-latin-wght-normal.woff2", "fonts/newsreader-latin-wght-italic.woff2", "fonts/fraunces-latin-wght-normal.woff2", "fonts/atkinson-hyperlegible-latin-400-normal.woff2", "fonts/atkinson-hyperlegible-latin-700-normal.woff2", "fonts/atkinson-hyperlegible-latin-400-italic.woff2", "icon-192.png"];
self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSION).then(c => Promise.all(CORE.map(u => c.add(u).catch(() => console.warn("SW: no se pudo precargar", u))))).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== "GET" || u.origin !== location.origin || u.pathname.startsWith("/api/")) return;
  const estatico = /\.(webp|jpe?g|png|woff2|svg)$/i.test(u.pathname);
  if (estatico) {
    e.respondWith(caches.match(r).then(h => h || fetch(r).then(res => { if (res.ok) { const c = res.clone(); caches.open(VERSION).then(ch => ch.put(r, c)); } return res; })));
    return;
  }
  e.respondWith(fetch(r).then(res => { if (res.ok) { const c = res.clone(); caches.open(VERSION).then(ch => ch.put(r, c)); } return res; }).catch(() => caches.match(r, { ignoreSearch: true }).then(h => h || (r.mode === "navigate" ? caches.match("index.html") : Response.error()))));
});
