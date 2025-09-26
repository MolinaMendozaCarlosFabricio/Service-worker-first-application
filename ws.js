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
            caches.match("index.html").then((cached) => cached || fetch(req))
        );
        return;
    }

    const isScript = req.destination === "script" || req.url.endsWith(".mjs") || (req.headers.get("accept") && req.headers.get("accept").includes("javascript"));
    if (isScript) {
        console.log("[ws] En busca de actualizaciones para scripts");
        e.respondWith(
            fetch(req).then((networkResp) => {
                if (networkResp && networkResp.ok && req.url.startsWith("http")) {
                    const copy = networkResp.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
                    console.log("[ws] Scripts actualizados");
                }
                return networkResp;
            }).catch(async () => {
                return caches.match(req)
                .then((cached) => {
                    if(cached) {
                        console.log("[ws] Scripts cargados desde la caché")
                        return cached;
                    }
                    return new Response("", {
                        status: 503,
                        statusText: "Servicio no disponible",
                    });
                });
            })
        );
        return;
    }

    e.respondWith(
        caches.match(req).then((cached) => {
            if (cached) return cached;
            return fetch(req)
            .then((networkResp) => {
                return networkResp;
            })
            .catch(() => {
                return caches.match("index.html");
            });
        })
    );
});