# Known Issues

Bugs identificados pero deliberadamente no corregidos en el momento en que se encontraron, junto
con la razón. No es un backlog de features — solo defectos conocidos.

## La excepción wildcard `dark-glow: *` en `index.html` es una decisión deliberada, no heredada

**Dónde**: `.impeccable/config.json`, la entrada `{"rule": "dark-glow", "value": "*", "files":
["index.html"]}` agregada en la spec `004-deuda-diseno-animaciones` y reconfirmada en la spec
`007-cierre-pendientes-v2`.

**Por qué existe**: `dark-glow` no está en `directValueRules` del checker
(`impeccable-config.mjs`), así que no admite un valor de color puntual — solo puede excepcionarse
por archivo completo, con wildcard. La excepción es correcta en intención: cubre los 12 glows de
color documentados como "Shadow Vocabulary" en `DESIGN.md` (glow dorado del campeón, azul de
foco/botón primario, verde de botón success, rojo de sortear-equipos). En la spec
`007-cierre-pendientes-v2` se corrió el checker con la excepción vacía y se confirmó de nuevo,
número por número, que los 12 hallazgos de `dark-glow` en `index.html` corresponden exactamente a
esos 12 glows ya documentados — ninguno más, ninguno menos.

**Decisión**: mantener el wildcard tal cual, como decisión deliberada y verificada, no como algo
heredado sin revisar. La alternativa de acotar la excepción a los 12 valores de color puntuales
sigue sin ser posible porque el checker no soporta valor puntual para esta regla (mismo límite
técnico que hacía inertes las dos excepciones específicas de `side-tab`, ya eliminadas — ver
`specs/007-cierre-pendientes-v2/`), y acotarla por selector CSS tampoco es confiable porque los
glows viven en selectores distintos (`.btn-primary`, `.btn-primary:focus`, `.btn-primary:active`,
`.btn-success:hover`, `.campeon-card`, etc.), algunos ya como `color-mix()` con variables.

**Riesgo residual, sin cambios**: el wildcard no distingue un glow aprobado de uno nuevo. Si en el
futuro se agrega a `index.html` un glow de color que **no** sea parte del Shadow Vocabulary
documentado, el checker no lo va a reportar — quedará invisible bajo esta misma excepción,
indistinguible de los 12 ya aprobados. **Cualquier glow nuevo en `index.html` debe revisarse
manualmente contra `DESIGN.md` antes de asumir que esta excepción lo cubre.**

**Fix sugerido (no implementado)**: si el checker de Impeccable en algún momento agrega
`dark-glow` a `directValueRules` (soporte para valor puntual, igual que ya existe para
`design-system-color`), acotar esta excepción a los ~12 valores de color específicos del Shadow
Vocabulary documentados en `DESIGN.md`, en vez de mantener el wildcard de archivo completo.

## Service worker: una versión nueva puede tardar en activarse en una PWA instalada

**Dónde**: `sw.js` (raíz del repo, agregado en la spec `007-cierre-pendientes-v2`), eventos
`install`/`activate` — deliberadamente sin `self.skipWaiting()` ni `clients.claim()`.

**Síntoma**: cuando se publica una versión nueva de `sw.js`, el navegador la instala y la deja en
estado `waiting` hasta que se cierran **todas** las pestañas/ventanas controladas por la versión
anterior. En una PWA instalada en el celular, la app casi nunca se cierra del todo (queda en
segundo plano en vez de cerrarse), así que ese `waiting` puede durar mucho tiempo — el organizador
puede seguir viendo la versión vieja de la app durante varios días después de un deploy, sin
ningún aviso de que hay una versión nueva disponible.

**Por qué no se corrige ahora**: es la contrapartida deliberada de la decisión central del service
worker (ver `specs/007-cierre-pendientes-v2/contracts/service-worker-contract.md` § 4-5, D-SW-5 en
`research.md`): usar `skipWaiting()`/`clients.claim()` activaría la versión nueva mientras un
organizador tiene el torneo abierto en una pestaña en medio de un partido, recargando o
reemplazando el service worker que sirve esa sesión en curso — un riesgo mucho peor que mostrar una
versión vieja por unos días. Se prioriza no interrumpir un torneo en vivo por sobre la
propagación rápida de actualizaciones.

**Fix sugerido (no implementado)**: agregar un mecanismo de aviso ("hay una versión nueva
disponible, tocá para actualizar") que detecte `registration.waiting` y ofrezca una recarga
**voluntaria** del usuario (nunca automática) — típicamente escuchando el evento `updatefound` y
exponiendo un botón/toast que llame a `registration.waiting.postMessage({type:'SKIP_WAITING'})`
más un listener de `self.addEventListener('message', ...)` en `sw.js` que recién ahí llame a
`self.skipWaiting()`. Explícitamente fuera de alcance de la spec `007-cierre-pendientes-v2`, junto
con sincronización en background.
