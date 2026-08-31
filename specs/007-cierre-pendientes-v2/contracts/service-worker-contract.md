# Contrato: Service Worker (`sw.js`)

**Área**: 4 | **Archivo nuevo**: `sw.js` (raíz del sitio) | **Registrador**: `app.js` (al final)

## 1. Condición de registro (no negociable)

```js
if ((location.protocol === 'http:' || location.protocol === 'https:') && 'serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js');
}
```

- Bajo `file:`, esta condición es `false` y no se ejecuta ninguna otra línea relacionada con el
  service worker. No se emite ningún `console.error`/`console.warn` en ese modo (FR-012,
  Principio I).
- El registro usa ruta **relativa** (`'./sw.js'`), nunca absoluta — el scope resultante queda
  acotado al directorio de registro, correcto tanto en la raíz de un server local como bajo el
  subpath de GitHub Pages (FR-014).

## 2. `CACHE_NAME`

```js
const CACHE_NAME = 'copa-panas-v1';
```

- Nombre de **producto**, no de repositorio. No contiene `"mundialito-web"` ni ninguna URL de
  Pages.
- Se incrementa (`copa-panas-v2`, etc.) en cualquier cambio futuro al conjunto de recursos
  precacheados — fuera del alcance de esta spec definir ese proceso más allá de dejar la constante
  preparada para incrementarse.

## 3. Evento `install` — precache

### 3.1 Shell local (atómico)

```js
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
```

Precacheado con `cache.addAll(SHELL_LOCAL)` (rutas resueltas contra `self.registration.scope`,
nunca con `/` inicial). Es atómico deliberadamente: si un recurso local falla, el `install` entero
falla — un shell incompleto no es un shell utilizable offline. **15 rutas** (sin `'./'`): la
petición de directorio ya la resuelve la sección 5.1 sirviendo `./index.html` cacheado, así que
agregar `'./'` al `addAll()` no aporta nada al comportamiento real y sí arriesga que el `install`
entero falle por una entrada que se comporta distinto entre el servidor local (Playwright, V1) y
GitHub Pages.

### 3.2 Recursos externos (tolerante)

```text
- https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@300;400;500;600;700&display=swap
- https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css
- https://cdn.tailwindcss.com
```

Cada uno se pide **individualmente** (no dentro del mismo `addAll` que el shell local) con
`Promise.allSettled`. Si el `fetch` normal falla (por ejemplo, CORS no garantizado en algún CDN),
se reintenta una vez con `new Request(url, { mode: 'no-cors' })` antes de darse por vencido para
ese recurso puntual. Un fallo en un externo **no** aborta el `install` ni afecta el shell local
(D-SW-1, D-SW-2 en `research.md`).

**Respuesta opaca del camino `no-cors`**: una respuesta obtenida en modo `no-cors` es opaca —
`status` es siempre `0` y `.ok` es siempre `false`, aunque la petición haya funcionado
perfectamente. El chequeo `.ok` de la sección 5.2 (cache-first con relleno de runtime cache) **no
aplica a este camino**: ahí sí importa distinguir éxito de fallo porque hay una respuesta normal
con la que comparar. Acá, si el `fetch(request, { mode: 'no-cors' })` no lanzó excepción, la
respuesta (opaca, `.ok === false` y todo) se cachea igual — condicionar por `.ok` en este fallback
haría que nunca se cacheara nada por esta vía, dejando ese externo permanentemente fuera de la
caché.

## 4. Evento `activate` — limpieza de versiones viejas

```js
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
});
```

- **No** se llama `self.skipWaiting()` en `install`.
- **No** se llama `clients.claim()` en `activate`.
- Consecuencia aceptada y documentada en `KNOWN_ISSUES.md`: una versión nueva del service worker
  queda en `waiting` hasta que se cierren todas las pestañas que controlan la versión anterior — en
  una PWA instalada esto puede tardar mucho. Es la contrapartida deliberada de no interrumpir un
  torneo en curso (D-SW-5).

## 5. Evento `fetch` — estrategia de servicio

### 5.1 Navegaciones → shell cacheado

```js
if (event.request.mode === 'navigate') {
  event.respondWith(
    caches.match(new URL('./index.html', self.registration.scope))
      .then(cached => cached || fetch(event.request))
  );
  return;
}
```

Sin esto, abrir `https://usuario.github.io/<repo>/` (URL de directorio, no de archivo) sin red no
encuentra coincidencia exacta en caché y la navegación falla aunque el precache haya sido perfecto.
Este comportamiento es lo que hace pasar el escenario de subpath (D-SW-3, verificación V2).

### 5.2 Todo lo demás → cache-first con relleno de runtime cache

```js
event.respondWith(
  caches.match(event.request).then(cached => {
    if (cached) return cached;
    return fetch(event.request).then(response => {
      if (response.ok && esOrigenCacheable(event.request.url)) {
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
      }
      return response;
    }).catch(() => cached); // si no hay red y tampoco había caché, deja que falle naturalmente
  })
);
```

`esOrigenCacheable()` incluye al menos `fonts.gstatic.com` y los hosts de webfonts de
`cdnjs.cloudflare.com` — los archivos de fuente reales que los dos CSS externos referencian y que
no se conocen de antemano (runtime cache, cache-first). Sin esto, el modo offline queda sin
tipografía ni iconografía, que es peor experiencia que no tener offline (requisito explícito del
usuario).

## 6. Fuera de alcance de este contrato

- Prompt de "hay una versión nueva disponible" — no se implementa.
- Sincronización en background (`sync` event) — no se implementa.
- Cualquier interacción con `localStorage` o el flujo de export/import JSON — el service worker no
  los toca (FR-016).

## 7. Verificación de contrato

Ver `quickstart.md`, escenarios V1–V3. Ningún paso de este contrato se da por cumplido sin una
corrida real de Playwright contra el escenario correspondiente.
