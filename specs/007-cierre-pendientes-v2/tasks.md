---

description: "Task list for 007-cierre-pendientes-v2"
---

# Tasks: Cierre de pendientes v2

**Input**: Design documents from `/specs/007-cierre-pendientes-v2/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: No hay framework de tests unitarios en el proyecto; la verificación es funcional en
navegador real (Playwright, no opcional) — ver Fase de Verificación por historia y quickstart.md.

**Organización**: Las cuatro áreas de la spec son historias de usuario independientes entre sí
(confirmado en spec.md y plan.md). Se implementan y verifican en cualquier orden.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Puede correr en paralelo (archivos distintos, sin dependencias)
- **[Story]**: US1 = nombres de ronda (P1), US2 = duplicados de jugadores (P2), US3 = higiene
  Impeccable (P3), US4 = service worker offline (P1)

## Path Conventions

Proyecto único, sin `src/`. Archivos en la raíz del repo:
`app.js`, `sw.js` (nuevo), `.impeccable/config.json`, `KNOWN_ISSUES.md`.

---

## Phase 1: Setup

**Propósito**: Dejar el entorno listo para poder verificar cualquier historia, sin tocar código de
producto todavía.

- [X] T001 Ejecutar `git status` y `git diff --stat motor.js competiciones.js` en la raíz del repo
      y confirmar árbol de trabajo limpio y diff vacío en esos dos archivos — este es el estado de
      partida contra el que se compara T0XX de la Fase de Polish al cerrar.
- [X] T002 Instalar los cuatro paquetes que requiere el checker de Impeccable en modo completo
      (`htmlparser2`, `css-select`, `css-tree`, `domutils`) **fuera del repositorio**, en el
      directorio padre (`WebPractice/`, no `WebPractice/mundialito-web/`), vía
      `cd .. && npm install --no-save --no-package-lock htmlparser2 css-select css-tree domutils`.
      Confirmar con `git status` en `mundialito-web/` que no aparece ningún archivo nuevo — ver
      research.md R0.
- [X] T003 Correr `node .agents/skills/impeccable/scripts/detect.mjs --json index.html styles.css app.js competiciones.js motor.js`
      y confirmar en stderr que **no** aparece la advertencia `DEGRADED`. Si aparece, T002 no
      tuvo efecto — resolver antes de continuar; ningún paso de US3 es válido en modo degradado.

**Checkpoint**: entorno listo para implementar y verificar cualquiera de las cuatro historias, en
cualquier orden.

---

## Phase 2: Foundational

No aplica. Las cuatro áreas de esta spec son independientes por diseño (spec.md, plan.md) y no
comparten infraestructura nueva que deba construirse antes de empezar cualquiera de ellas. Cada
historia parte directamente del código y configuración ya existentes en el repo.

---

## Phase 3: User Story 1 - Nombres de ronda correctos durante todo el torneo (Priority: P1) 🎯

**Goal**: Los nombres de ronda del bracket (Cuartos, Semifinales, Final) se calculan a partir de la
profundidad total del bracket, no de la cantidad de rondas generadas hasta el momento, y no cambian
una vez mostrados.

**Independent Test**: Generar un bracket de 8 clasificados y confirmar que cada ronda muestra su
nombre final desde que se genera, en bracket y dashboard, sin tocar ninguna otra área.

### Implementación para User Story 1

- [X] T004 [US1] En `renderizarEliminacion()` (app.js, ~línea 1890-1903): reutilizar la variable
      `totalJugadores` ya existente (con guarda `|| 2`) como profundidad del bracket
      (`Math.ceil(Math.log2(totalJugadores))`), y reemplazar los dos usos de
      `Math.pow(2, rondas.length - ronda)` (tabs de ronda, ~1893) y
      `Math.pow(2, rondas.length - rondaActiva)` (label de fase, ~1903) por
      `Math.pow(2, profundidadBracket - ronda)` / `Math.pow(2, profundidadBracket - rondaActiva)`.
      No modificar `nombreDeRonda()` ni ningún otro archivo — ver contracts/round-naming-contract.md.
- [X] T005 [US1] En `renderizarDashboard()` (app.js, ~línea 2036-2039): antes de calcular
      `totalEq`, derivar la profundidad del bracket con la misma fórmula y **la misma guarda**
      contra `clasificados.length` vacío que ya usa `renderizarEliminacion()`
      (`estado.clasificados.length || 2`) — esta guarda no existe hoy en `renderizarDashboard()`
      (hallazgo research.md R3) y agregarla es parte de esta tarea, no un paso aparte. Reemplazar
      `Math.pow(2, rondas.length - ronda)` (~2039) por `Math.pow(2, profundidadBracket - ronda)`.

### Verificación para User Story 1

- [X] T006 [US1] Ejecutar el escenario V4 de quickstart.md con Playwright: torneo de 8
      clasificados hasta la final, confirmando en bracket **y** dashboard que cada ronda muestra
      su nombre correcto desde que se genera y que ningún nombre cambia después.
- [X] T007 [US1] Ejecutar el escenario V5 de quickstart.md con una cantidad de clasificados que no
      sea potencia de 2 (6 o 5), confirmando contra la tabla de referencia de
      contracts/round-naming-contract.md.

**Checkpoint**: US1 completa y verificable de forma independiente — Áreas 2, 3 y 4 no tocadas.

---

## Phase 4: User Story 4 - La app sigue funcionando sin conexión durante un torneo en cancha (Priority: P1)

**Goal**: Tras una primera carga con conexión, la app queda disponible offline (interfaz completa,
registro de resultados persistente), sin romper el modo `file://` ni el comportamiento bajo
subpath de Pages.

**Independent Test**: Cargar la app una vez online, cortar la red, y confirmar que sigue disponible
y permite registrar un resultado que persiste — sin depender de que ninguna otra área esté hecha.

**Nota de orden**: se ubica antes de US2/US3 en este documento por ser también P1, pero no depende
de ellas ni de US1 — puede implementarse en cualquier momento.

### Implementación para User Story 4

- [X] T008 [P] [US4] Crear `sw.js` en la raíz del repo con `CACHE_NAME = 'copa-panas-v1'` (nombre
      de producto, nunca `"mundialito-web"` ni URL de Pages) y el arreglo `SHELL_LOCAL` de 15
      rutas relativas (sin `'./'`): `./index.html`, `./styles.css`, `./motor.js`,
      `./competiciones.js`, `./app.js`, `./manifest.json`, y los 9 archivos de
      `./assets/branding/` — ver contracts/service-worker-contract.md § 3.1 y data-model.md.
- [X] T009 [US4] En `sw.js`, implementar el evento `install`: `cache.addAll(SHELL_LOCAL)` atómico
      para el shell local, y en paralelo (`Promise.allSettled`) una petición individual por cada
      uno de los 3 recursos externos (hoja de Google Fonts, CSS de FontAwesome 6.5.0, script de
      Tailwind CDN — URLs exactas en contracts/service-worker-contract.md § 3.2). Para cada
      externo: si el `fetch` normal falla, reintentar una vez con
      `new Request(url, { mode: 'no-cors' })` y cachear esa respuesta si el `fetch` no lanzó
      excepción, **sin condicionar por `.ok`** (la respuesta `no-cors` es opaca por diseño — ver
      contracts/service-worker-contract.md § 3.2 y research.md D-SW-2). Depende de T008.
- [X] T010 [US4] En `sw.js`, implementar el evento `activate`: borrar toda entrada de
      `caches.keys()` cuyo nombre no sea `CACHE_NAME`. No incluir `self.skipWaiting()` en
      `install` ni `clients.claim()` en `activate` — ver contracts/service-worker-contract.md § 4
      y la consecuencia aceptada en research.md D-SW-5.
- [X] T011 [US4] En `sw.js`, implementar el evento `fetch` con dos ramas: (a) si
      `event.request.mode === 'navigate'`, responder con la entrada cacheada de
      `./index.html` resuelta contra `self.registration.scope` (esto es lo que hace pasar el
      escenario de subpath — contracts/service-worker-contract.md § 5.1); (b) para todo lo demás,
      cache-first: si hay entrada cacheada, servirla; si no, hacer `fetch`, y si la respuesta es
      `.ok` y el origen es cacheable (`fonts.gstatic.com` o webfonts de `cdnjs.cloudflare.com`),
      guardarla en `CACHE_NAME` antes de devolverla (runtime cache — contracts/service-worker-contract.md
      § 5.2). Depende de T009, T010.
- [X] T012 [US4] Al final de `app.js`, agregar el registro condicional del service worker:
      `if ((location.protocol === 'http:' || location.protocol === 'https:') && 'serviceWorker' in navigator) { navigator.serviceWorker.register('./sw.js'); }`
      sin ningún otro código relacionado fuera de ese `if` — bajo `file:` la condición debe ser
      `false` y no debe emitirse ningún log ni error. No modificar el orden de los `<script>` en
      `index.html`. Depende de T011.

### Verificación para User Story 4

- [X] T013 [US4] Ejecutar el escenario V1 de quickstart.md con Playwright: servido por HTTP local,
      confirmar registro del service worker, cortar la red, recargar, confirmar interfaz completa
      (estilos, tipografía, íconos) y que se puede registrar un resultado que persiste. Sub-paso
      para cubrir FR-016 explícitamente: con el service worker activo y la red todavía cortada,
      exportar el JSON del torneo en curso (flujo de export existente, sin cambios) y guardar su
      contenido; luego importarlo de nuevo — en la misma sesión o en una pestaña nueva bajo el
      mismo origen — y confirmar que el estado reimportado es idéntico al exportado. El objetivo es
      confirmar que el mecanismo offline no intercepta ni altera el flujo de export/import (el
      service worker no cachea ni reescribe las descargas/lecturas de archivo JSON, ver
      contracts/service-worker-contract.md § 6).
- [X] T014 [US4] Ejecutar el escenario V2 de quickstart.md: la app copiada bajo un subpath
      (`/mundialito-web/`, sirviendo `http://localhost:PORT/mundialito-web/` con barra final, sin
      `index.html` explícito) se comporta igual que V1 offline — confirma que T011(a) funciona.
- [X] T015 [US4] Ejecutar el escenario V3 de quickstart.md: abrir por `file://`, confirmar cero
      mensajes de consola relacionados a `serviceWorker`/`sw.js` y comportamiento idéntico al
      actual.
- [X] T016 [US4] Con Playwright, servido por HTTP local: cargar la página y esperar (vía
      `page.evaluate`) a que `navigator.serviceWorker.ready` resuelva y
      `registration.active` no sea `null` (confirma la v1 instalada y activa). Sin cerrar esa
      misma pestaña/contexto, modificar `sw.js` en disco (un solo byte alcanza — por ejemplo un
      comentario nuevo — para que el navegador detecte un script distinto por comparación
      byte-a-byte). Disparar la detección de actualización invocando
      `registration.update()` vía `page.evaluate` (o recargando la misma pestaña una vez, sin
      cerrarla). Luego, vía `page.evaluate` sobre
      `navigator.serviceWorker.getRegistration()`, leer y aserear: `registration.waiting` no es
      `null` (la v2 quedó esperando, no se instaló sola); `navigator.serviceWorker.controller`
      sigue siendo el worker activo original (no cambió); y que la página no se recargó ni perdió
      su estado (por ejemplo, un valor puesto antes en el DOM o en una variable global sigue
      presente). Esto confirma T010 (ausencia de `skipWaiting()`/`clients.claim()`) con una corrida
      real, sin pasos manuales ni inspección de DevTools.

**Checkpoint**: US4 completa y verificable de forma independiente — Áreas 1, 2 y 3 no tocadas.

---

## Phase 5: User Story 2 - Ambos duplicados de nombre quedan señalados (Priority: P2)

**Goal**: Al escribir el mismo nombre de jugador en dos o más campos, todas las instancias
duplicadas quedan marcadas con `.error`, no solo la segunda.

**Independent Test**: Escribir el mismo nombre (con variaciones de mayúsculas/espacios) en dos
campos y confirmar que ambos quedan marcados, sin depender de otra funcionalidad.

### Implementación para User Story 2

- [X] T017 [US2] Reescribir `validarJugadores()` en `app.js` (~línea 644) a dos pasadas: (1)
      recorrer los inputs y construir un conteo de ocurrencias por nombre normalizado
      (`normalizarNombreJugador()`, sin cambios), contando **solo los normalizados no vacíos**
      (research.md R4); (2) recorrer de nuevo, limpiar `.error` de todos como hoy, y marcar
      `.error` en todo input vacío (igual que hoy) o cuyo normalizado tenga conteo > 1 en el mapa
      de la pasada 1. `valido` se sigue computando igual (false si algún input queda marcado).
      No modificar `normalizarNombreJugador()` ni el enganche de eventos en `crearFilaJugador()`.

### Verificación para User Story 2

- [X] T018 [US2] Ejecutar el escenario V6 de quickstart.md con Playwright: dos campos con el mismo
      nombre (incluida una variante de mayúsculas/espacios) → ambos con `.error`; agregar un
      tercer campo igual → los tres marcados; corregir uno → se retira la marca de los que dejan
      de estar en conflicto. Confirma también que FR-006 ya funcionaba sin cambios adicionales
      (research.md R4).

**Checkpoint**: US2 completa y verificable de forma independiente — Áreas 1, 3 y 4 no tocadas.

---

## Phase 6: User Story 3 - Configuración de excepciones de diseño honesta y documentada (Priority: P3)

**Goal**: `.impeccable/config.json` contiene únicamente excepciones que tienen efecto real, con
razones documentadas, y `KNOWN_ISSUES.md` refleja el estado final.

**Independent Test**: Correr el checker antes y después del cambio de configuración y confirmar
que el conteo total de hallazgos no varía.

**Prerrequisito**: T002 y T003 (Fase de Setup) deben estar hechos — el baseline de esta historia
solo es válido en modo no degradado.

### Implementación para User Story 3

- [X] T019 [US3] Correr `node .agents/skills/impeccable/scripts/detect.mjs --json index.html styles.css app.js competiciones.js motor.js`,
      confirmar de nuevo ausencia de `DEGRADED` en stderr, y registrar el conteo total de
      hallazgos agrupando por la clave `antipattern` del JSON (no `rule`) — este es el baseline de
      SC-004. Valor esperado según research.md R1: **0** hallazgos en el estado actual del repo.
- [X] T020 [US3] En `.impeccable/config.json`, eliminar las dos entradas de `ignoreValues` con
      `"rule": "side-tab"` y `value` específico de `border-left` (`var(--gold)` y `var(--green)`)
      — son inertes por construcción, `side-tab` no pertenece a `directValueRules` del checker
      (research.md R2). Depende de T019.
- [X] T021 [US3] En `.impeccable/config.json`, ampliar el `reason` de la entrada wildcard
      restante de `side-tab` (`"value": "*"`, `files: ["styles.css", "index.html"]`) para que
      explique que cubre las tres atribuciones conocidas: el stripe tricolor del header (atribuido
      tanto a `styles.css:89` como a `index.html:0` por el motor de cascada estática) más los
      bordes `var(--gold)`/`var(--green)` de `.side-tab`/`.match-card`. No cambiar `files` ni
      `value`. Depende de T020.
- [X] T022 [US3] En `.impeccable/config.json`, actualizar el `reason` de la entrada wildcard de
      `dark-glow` en `index.html` (sin cambiar `value` ni `files` — no hay forma de acotarla sin
      modificar el checker) para dejar constancia de que cubre los 12 glows del Shadow Vocabulary
      de DESIGN.md (número verificado en research.md R1) y que cualquier glow nuevo en
      `index.html` requiere revisión manual contra DESIGN.md antes de asumirse cubierto.
- [X] T023 [US3] Correr el mismo comando de T019 con la configuración ya editada (T020-T022) y
      confirmar que el conteo total coincide exactamente con el baseline de T019. Si sube (por
      ejemplo a 4), detenerse y flaguear el análisis — no ajustar la wildcard hasta que dé cero.
- [X] T024 [US3] En `KNOWN_ISSUES.md`: eliminar la sección "Nombres de ronda intermedios pueden
      mostrarse mal durante la expansión del bracket" (resuelta por US1) y la sección "Dos
      excepciones `side-tab` de spec 001 (...) nunca tuvieron efecto" (resuelta por T020-T021).
      Reescribir la sección de `dark-glow` para reflejar que mantener el wildcard es ahora una
      decisión deliberada y documentada (con la razón de T022), no heredada. Depende de T023.
- [X] T025 [US3] Agregar a `KNOWN_ISSUES.md` la consecuencia aceptada de no usar `skipWaiting()`/
      `clients.claim()` en el service worker de US4 (research.md D-SW-5): un service worker nuevo
      puede quedarse en `waiting` mucho tiempo en una PWA instalada, y el organizador puede seguir
      viendo una versión vieja tras un deploy; se acepta a cambio de no interrumpir un torneo en
      curso. Esta tarea documenta una decisión de US4 pero vive en US3 porque es donde se edita
      `KNOWN_ISSUES.md` — no depende de que US4 esté implementada para escribirse.

**Checkpoint**: US3 completa y verificable de forma independiente — Áreas 1, 2 y 4 no tocadas
(salvo la nota de documentación de T025, que no requiere código de US4).

---

## Phase 7: Polish & Cross-Cutting

**Propósito**: Cierre de la spec completa, validaciones finales que abarcan más de una historia.

- [X] T026 Ejecutar `git diff --stat motor.js competiciones.js` y confirmar salida vacía
      (escenario V8 de quickstart.md) — restricción global de la spec, verificable solo una vez
      todas las historias deseadas están implementadas.
- [X] T027 [P] Revisar que ningún archivo nuevo o modificado (`sw.js`, `app.js`,
      `.impeccable/config.json`, `KNOWN_ISSUES.md`) contiene el string `"mundialito-web"` ni una
      URL de GitHub Pages — `grep -rn "mundialito-web" sw.js app.js .impeccable/config.json KNOWN_ISSUES.md`
      debe devolver vacío.
- [X] T028 Ejecutar los ocho escenarios de quickstart.md (V1-V8) de corrido, en el orden del
      documento, como pase final de aceptación de la spec completa.

---

## Dependencies & Execution Order

### Fases

- **Setup (Fase 1)**: sin dependencias, primero.
- **Foundational (Fase 2)**: no aplica — ver nota en esa sección.
- **US1, US2, US3, US4 (Fases 3-6)**: cada una depende solo de Setup, no entre sí. Se pueden hacer
  en cualquier orden, o en paralelo si hay más de una persona/agente trabajando.
  - Excepción de orden interno: dentro de **US3**, T019 (baseline) debe ir antes que T020-T023
    (edición) — es orden obligatorio de la propia historia, no una dependencia entre historias.
- **Polish (Fase 7)**: depende de que todas las historias que se vayan a entregar estén completas.

### Dentro de cada historia

- **US1**: T004 y T005 tocan sitios distintos de `app.js` pero son conceptualmente el mismo
  cambio — se recomienda hacerlos en la misma sesión de edición aunque no son estrictamente
  secuenciales entre sí. T006-T007 (verificación) van después de ambas.
- **US4**: T008 → T009 → T010 → T011 → T012 es una cadena secuencial real (cada uno construye
  sobre el `sw.js` del anterior). T013-T016 (verificación) van al final.
- **US2**: T017 (única tarea de implementación) → T018 (verificación).
- **US3**: T019 (baseline) → T020 → T021 → T022 (edición de config, secuencial porque tocan el
  mismo archivo) → T023 (re-verificación) → T024 → T025 (KNOWN_ISSUES.md).

### Oportunidades de paralelismo

- T008 (crear `sw.js` con `SHELL_LOCAL`) es la única tarea `[P]` real dentro de una historia
  (US4), porque no depende de ningún archivo que otra tarea esté tocando a la vez.
- Las cuatro historias completas (US1, US2, US3, US4) son paralelizables entre sí si hay más de
  un desarrollador/agente: tocan superficies de archivo distintas salvo `app.js`, donde US1
  (líneas ~1890-2040) y US4 (al final del archivo, registro del SW) y US2 (~línea 644) no se
  superponen — coordinar solo para evitar conflictos de merge triviales.
- T027 (grep de hardcodes) es paralelizable con T026 y T028.

---

## Parallel Example: Fase de Setup + una historia

```bash
# Setup, en orden (T002 depende de tener node/npm disponible, T003 depende de T002):
Task: "T001 Verificar git status y diff limpio en motor.js/competiciones.js"
Task: "T002 Instalar parsers del checker fuera del repo"
Task: "T003 Confirmar modo no degradado del checker"

# Con Setup listo, historias completas en paralelo (si hay capacidad):
Task: "Fase 3 completa (US1) — nombres de ronda"
Task: "Fase 4 completa (US4) — service worker"
Task: "Fase 5 completa (US2) — duplicados"
Task: "Fase 6 completa (US3) — config Impeccable"
```

---

## Implementation Strategy

### MVP (si hubiera que elegir una sola historia primero)

Ambas P1 (US1 y US4) son candidatas a MVP porque son las que afectan directamente la experiencia
del organizador en vivo. Sugerido: **US1 primero** (más chica, tres ediciones puntuales en
`app.js`, sin archivo nuevo) para validar el flujo de verificación con Playwright antes de abordar
la superficie más grande de US4 (service worker).

### Entrega incremental

1. Fase 1 (Setup) → entorno listo.
2. US1 → verificar independientemente (V4, V5) → nombres de ronda corregidos en producción.
3. US4 → verificar independientemente (V1-V3) → offline real habilitado.
4. US2 → verificar independientemente (V6) → validación de duplicados corregida.
5. US3 → verificar independientemente (V7) → configuración de Impeccable saneada,
   `KNOWN_ISSUES.md` al día.
6. Fase 7 (Polish) → V8 + grep de hardcodes + pase completo de quickstart.md → spec cerrada.

Cada historia agrega valor sin romper las anteriores; ninguna depende de que otra esté terminada
para poder mergearse o publicarse.

---

## Notes

- [P] = archivos distintos, sin dependencias entre sí.
- Cada tarea de "Verificación" es Playwright real contra el escenario de quickstart.md indicado —
  ninguna se da por completa con solo lectura de código.
- `motor.js` y `competiciones.js` no aparecen en ninguna tarea de implementación — su diff cero se
  verifica en T001 (antes) y T026 (después).
- Evitar: agregar `sw.js` a la lista de archivos del checker de Impeccable (rompería la
  comparabilidad del baseline de T019/T023 — no es código de UI).
