const CACHE_NAME = 'worker-pwa-1';
const ASSETS = [
    '/',
    '/index.html',
    '/styles.css',
    '/src/scripts/app.mjs',
    '/src/scripts/connect_ws.mjs',
    '/src/models/MissingPerson.mjs',
    '/ws.js',
    '/manifest.json',
    '/icons/missing_person_01.jpeg',
    '/icons/missing_person_02.jpeg',
    '/icons/missing_person_03.jpeg',
    '/icons/missing_person_04.jpeg',
];

self.addEventListener("install", e => {
    console.log("[sw] Instalando Service Worker...")
    e.waitUntil(
        (async () => {
            const cache = await caches.open(CACHE_NAME);
            console.log("[sw] Cacheando recursos...");
            ASSETS.forEach(async path => {
                try {
                    const resp = await fetch(path, { cache: "reload" });
                    if (!resp || (!resp.ok && resp.type !== "opaque")) {
                        throw new Error("[sw] Error al obtener elemento:", resp);
                    }
                    await cache.put(path, resp.clone());
                    console.log("[sw] Cacheado -> ", path);
                } catch (err) {
                    console.error(`[sw] Fallo al cachear ${path}:`, err);
                }
            });
            await self.skipWaiting();
        })()
    );
});

self.addEventListener("activate", e => {
    console.log("[sw] Estado 'activo'");
    e.waitUntil(
        (async () => {
            const keys = await caches.keys();
            await Promise.all(
            keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
        );
        await self.clients.claim();
        })()
    );
});

self.addEventListener("fetch", e => {
    const req = e.request;
    console.log("[ws] Petición interceptada por el service worker");

    if (req.method !== "GET")
        return;

    if (req.mode === "navigate") {
        e.respondWith(
            fetch(req).then(async networkResp => {
                const copy = networkResp.clone();
                const cache = await caches.open(CACHE_NAME);
                cache.put("index.html", copy);
                console.log("[sw] HTML actualizado desde red");
                return networkResp;
            }).catch(() => {
                console.warn("[sw] HTML desde caché (offline)");
                return caches.match("index.html");
            })
        );
        return;
    }

    const isScript = req.destination === "script" || req.url.endsWith(".mjs") ||
        (req.headers.get("accept") && req.headers.get("accept").includes("javascript"));
    if (isScript) {
        e.respondWith(
            fetch(req).then(async networkResp => {
                if (networkResp && networkResp.ok && req.url.startsWith("http")) {
                    const copy = networkResp.clone();
                    const cache = await caches.open(CACHE_NAME);
                    cache.put(req, copy);
                    console.log("[sw] Script actualizado");
                }
                return networkResp;
            }).catch(() => {
                console.warn("[sw] Script desde caché (offline)");
                return caches.match(req);
            })
        );
        return;
    }

    const isCSS = req.destination === "style" || req.url.endsWith(".css");
    const isImage = req.destination === "image" || /\.(png|jpg|jpeg|gif|svg|webp)$/.test(req.url);

    if (isCSS || isImage) {
        e.respondWith(
            caches.match(req).then(cached => {
                if (cached) {
                    console.log("[sw] Recurso cacheado ->", req.url);
                    return cached;
                }
                return fetch(req).then(async networkResp => {
                    const copy = networkResp.clone();
                    const cache = await caches.open(CACHE_NAME);
                    cache.put(req, copy);
                    console.log("[sw] Nuevo recurso cacheado ->", req.url);
                    return networkResp;
                });
            })
        );
        return;
    }

    e.respondWith(fetch(req).catch(() => caches.match(req)));
});