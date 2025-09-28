const CACHE_NAME = 'worker-pwa-1';
const ASSETS = [
    './',
    './index.html',
    './styles.css',
    './src/scripts/app.mjs',
    './src/models/MissingPerson.mjs',
    './manifest.json',
    './icons/missing_person_01.jpeg',
    './icons/missing_person_02.jpeg',
    './icons/missing_person_03.jpeg',
    './icons/missing_person_04.jpeg',
];

self.addEventListener('install', (event) => {
    console.log('[sw] Instalando Service Worker...');
    event.waitUntil(
        (async () => {
            const cache = await caches.open(CACHE_NAME);
            console.log('[sw] Cacheando recursos...');
            for (const path of ASSETS) {
                try {
                    const response = await fetch(path, { cache: 'reload' });
                    if (!response || (!response.ok && response.type !== 'opaque')) {
                        throw new Error(`[sw] Error al obtener: ${path}`);
                    }
                    await cache.put(path, response.clone());
                    console.log('[sw] Cacheado ->', path);
                } catch (err) {
                    console.error(`[sw] Fallo al cachear ${path}:`, err);
                }
            }
            await self.skipWaiting();
        })()
    );
});

self.addEventListener('activate', (event) => {
    console.log('[sw] Activado');
    event.waitUntil(
        (async () => {
            const keys = await caches.keys();
            await Promise.all(
                keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
            );
            await self.clients.claim();
        })()
    );
});

self.addEventListener('fetch', (event) => {
    const req = event.request;

    if (req.method !== 'GET') return;

    event.respondWith(
        (async () => {
            try {
                const networkResponse = await fetch(req);
                if (networkResponse && networkResponse.ok) {
                    const cache = await caches.open(CACHE_NAME);
                    await cache.put(req, networkResponse.clone());
                    console.log('[sw] Actualizado desde red ->', req.url);
                }
                return networkResponse;
            } catch (err) {
                console.log('[sw] Offline, sirviendo desde caché ->', req.url);
                const cached = await caches.match(req);
                return cached || new Response('Recurso no disponible', { status: 503 });
            }
        })()
    );
});