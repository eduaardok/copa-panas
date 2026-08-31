// Service worker de Copa Panas — habilita uso offline real después de una primera carga
// exitosa con conexión. Ver specs/007-cierre-pendientes-v2/contracts/service-worker-contract.md.
//
// Restricciones no negociables (ver plan.md / CLAUDE.md Principio I):
// - Rutas siempre relativas al scope de registro (el sitio se sirve bajo un subpath en
//   GitHub Pages) — nunca con "/" inicial, nunca el nombre del repositorio.
// - Sin skipWaiting() ni clients.claim(): una versión nueva no debe interrumpir un torneo
//   en curso ya abierto en una pestaña.

const CACHE_NAME = 'copa-panas-v1';

const SHELL_LOCAL = [
  './index.html',
  './styles.css',
  './motor.js',
  './competiciones.js',
  './app.js',
  './manifest.json',
  './assets/branding/apple-touch-icon.png',
  './assets/branding/favicon-16x16.png',
  './assets/branding/favicon-32x32.png',
  './assets/branding/icon-192.png',
  './assets/branding/icon-512.png',
  './assets/branding/wordmark-dark.png',
  './assets/branding/wordmark-light.png',
  './assets/branding/wordmark-mono-black.png',
  './assets/branding/wordmark-mono-white.png',
];

const EXTERNOS = [
  'https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@300;400;500;600;700&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css',
  'https://cdn.tailwindcss.com',
];

const HOSTS_RUNTIME_CACHEABLES = ['fonts.gstatic.com', 'cdnjs.cloudflare.com'];

function esOrigenCacheable(url) {
  try {
    const host = new URL(url).host;
    return HOSTS_RUNTIME_CACHEABLES.includes(host);
  } catch {
    return false;
  }
}

async function precachearExterno(cache, url) {
  try {
    const resp = await fetch(url);
    if (resp.ok) {
      await cache.put(url, resp);
      return;
    }
  } catch {
    // sigue al fallback no-cors
  }
  try {
    // Respuesta opaca por diseño (status 0, .ok === false) — se cachea igual si el fetch no
    // lanzó excepción, porque .ok nunca es true en modo no-cors.
    const respOpaca = await fetch(new Request(url, { mode: 'no-cors' }));
    await cache.put(url, respOpaca);
  } catch {
    // el externo queda fuera de la caché; no aborta el install (Promise.allSettled en el caller)
  }
}

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    const rutasAbsolutas = SHELL_LOCAL.map(ruta => new URL(ruta, self.registration.scope).toString());
    await cache.addAll(rutasAbsolutas);
    await Promise.allSettled(EXTERNOS.map(url => precachearExterno(cache, url)));
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
});

self.addEventListener('fetch', event => {
  const { request } = event;

  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);
      const indexUrl = new URL('./index.html', self.registration.scope).toString();
      const cached = await cache.match(indexUrl);
      return cached || fetch(request);
    })());
    return;
  }

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(request);
    if (cached) return cached;
    try {
      const response = await fetch(request);
      if (response.ok && esOrigenCacheable(request.url)) {
        cache.put(request, response.clone());
      }
      return response;
    } catch (err) {
      if (cached) return cached;
      throw err;
    }
  })());
});
