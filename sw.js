// Offline cache for the APP FILES ONLY. Family data lives in IndexedDB and is never touched here.
const VERSION = "0.3.0", PREFIX = "camp-entry-app-", CACHE = PREFIX + VERSION;
const FILES = ["./", "./index.html", "./manifest.json", "./icon.svg"];
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES))); });   // no skipWaiting: the page decides when to switch (after saving)
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => (k.startsWith(PREFIX) || k.startsWith("camp-entry-v")) && k !== CACHE).map(k => caches.delete(k))))); });   // only this app's own old caches
self.addEventListener("message", e => { if (e.data && e.data.type === "SKIP_WAITING") self.skipWaiting(); });
self.addEventListener("fetch", e => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== "GET" || u.origin !== self.location.origin) return;
  e.respondWith(caches.open(CACHE).then(async c => {
    const hit = await c.match(r, { ignoreSearch: true });
    const net = fetch(r).then(res => { if (res && res.ok) c.put(r, res.clone()); return res; }).catch(() => null);
    if (hit) { e.waitUntil(net); return hit; }                     // cache first (fast, works offline), refresh in the background
    return (await net) || (r.mode === "navigate" ? c.match("./index.html") : Response.error());
  }));
});
