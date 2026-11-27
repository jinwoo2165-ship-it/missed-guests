// 오프라인에서도 열리도록 앱 파일을 기기에 보관합니다. 앱을 고치면 VERSION을 올리세요.
const VERSION = "v3";
const FONT_CACHE = "missed-guests-fonts";
const FONT_HOSTS = ["fonts.googleapis.com", "fonts.gstatic.com"];
const CACHE = "missed-guests-" + VERSION;
const FILES = ["./", "./index.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png", "./apple-touch-icon.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith("missed-guests-") && k !== CACHE && k !== FONT_CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// 인터넷이 되면 최신 파일을 받아 보관하고, 안 되면 보관해 둔 파일로 엽니다.
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  const url = new URL(e.request.url);
  // 글꼴은 한 번 받으면 기기에 보관해 두고 계속 씁니다.
  if (FONT_HOSTS.includes(url.hostname)) {
    e.respondWith(
      caches.open(FONT_CACHE).then((c) => c.match(e.request).then((hit) => hit || fetch(e.request).then((res) => {
        if (res.ok || res.type === "opaque") c.put(e.request, res.clone());
        return res;
      })))
    );
    return;
  }
  if (url.origin !== location.origin) return;
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(e.request, copy)); }
        return res;
      })
      .catch(() => caches.match(e.request, { ignoreSearch: true }).then((r) => r || caches.match("./index.html")))
  );
});
