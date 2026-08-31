# Implementation Plan: Cierre de pendientes v2

**Branch**: `007-cierre-pendientes-v2` | **Date**: 2026-08-30 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/007-cierre-pendientes-v2/spec.md`

## Summary

Cuatro áreas independientes de deuda conocida, sin dependencias entre sí: (1) los nombres de ronda
del bracket pasan a derivarse de la profundidad total del bracket en vez de la cantidad de rondas
generadas hasta el momento; (2) `validarJugadores()` pasa a dos pasadas para marcar **todas** las
instancias de un nombre duplicado; (3) se limpian dos excepciones inertes de
`.impeccable/config.json` y se documentan las que quedan; (4) se agrega un service worker que
habilita uso offline real sin romper el modo `file://`.

Las áreas 1 y 2 son ediciones acotadas en `app.js`. La 3 es configuración y documentación. La 4
agrega un único archivo nuevo (`sw.js`) más un bloque de registro condicional al final de `app.js`.
`motor.js` y `competiciones.js` no se tocan en ninguna.

## Technical Context

**Language/Version**: JavaScript ES6+ (sin transpilación, sin ES modules), HTML5, CSS3

**Primary Dependencies**: Tailwind CSS (CDN), Font Awesome 6.5.0 (cdnjs), Google Fonts (Bebas Neue
+ Inter). Ninguna dependencia nueva. Service Worker API (nativa del navegador, cero librerías).

**Storage**: `localStorage` — **sin cambios** en esta feature. El service worker cachea recursos
estáticos, no datos de torneo. Export/import JSON intacto.

**Testing**: Verificación funcional en navegador real con Playwright (criterio de aceptación no
opcional, ver [quickstart.md](./quickstart.md)). Verificación determinística de diseño con
`.agents/skills/impeccable/scripts/detect.mjs`. No hay framework de tests unitarios en el proyecto
y esta spec no introduce uno.

**Target Platform**: Chrome para Android, Safari para iPhone (iOS 15+), navegadores de escritorio
modernos (Chrome, Safari, Firefox, Edge). Servido por GitHub Pages bajo subpath, y también abierto
directo por `file://`.

**Project Type**: Aplicación web estática de archivo único por capa (sin build), servible como
archivos planos.

**Performance Goals**: Sin regresión de tiempo de carga. Tras la primera carga, el shell se sirve
desde caché sin pedir red. No hay presupuesto numérico nuevo definido para esta feature.

**Constraints**:

- **Diff cero en `motor.js` y `competiciones.js`** — verificado con `git diff` antes de cerrar. Si
  una tarea parece requerirlos, se detiene y se flaguea; no se resuelve sobre la marcha.
- Sin build tools, sin Node en runtime, sin ES modules. Los `<script>` de `index.html` conservan
  su orden actual.
- Ningún archivo nuevo o modificado puede hardcodear `"mundialito-web"` ni la URL de Pages.
- El modo `file://` debe comportarse **idéntico** a hoy, sin errores de consola.
- Sin `skipWaiting()` ni `clients.claim()`.

**Scale/Scope**: 4 áreas · 1 archivo nuevo (`sw.js`) · 3 archivos modificados (`app.js`,
`.impeccable/config.json`, `KNOWN_ISSUES.md`) · ~4 sitios puntuales de edición en `app.js`.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Evaluado contra `.specify/memory/constitution.md` v1.0.0.

| Principio / Decisión | Estado | Justificación |
|---|---|---|
| **I. Sin backend, sin build tools** | ✅ Pasa | El service worker es API nativa del navegador — cero librerías, cero build, cero Node en runtime. El modo `file://` se preserva explícitamente vía registro condicional (FR-012). Los parsers instalados para el checker (R0) viven **fuera del repo** y son herramienta de desarrollo, no runtime. |
| **II. Motor desacoplado de tema y competición** | ✅ Pasa | Refuerza el principio: `motor.js` con diff cero y `nombreDeRonda()` intacto. El cambio del Área 1 mueve el cálculo hacia `app.js`, del lado correcto de la frontera. |
| **III. Spec-driven, no vibe coding** | ✅ Pasa | Esta spec existe antes de la implementación; los tres desvíos detectados en research (R0, R3, D-SW-3) están documentados y no se resolvieron en silencio. |
| **IV. Formato como configuración** | ✅ N/A | Ninguna área toca parámetros de formato de torneo. |
| **V. Un torneo activo, global** | ✅ Pasa | El service worker no cachea estado de torneo ni toca `localStorage` (FR-016). El modelo de un torneo activo no cambia. |
| **VI. Compatibilidad con Impeccable y skills de Emil** | ✅ Pasa | Área 3 es exactamente higiene de esa herramienta. No se agrega UI ni animación nueva en ninguna área; SC-004 exige que el checker no reporte hallazgos nuevos. |
| **D1–D4** | ✅ N/A | Ninguna área toca torneo activo, asignación de equipos, formato, ni pool de jugadores. El Área 2 toca la *validación de entrada* de nombres, no el registro persistido de D4. |

**Resultado del gate inicial: PASA sin violaciones.** La sección Complexity Tracking queda vacía.

**Re-evaluación post-Phase 1: PASA.** Los artefactos de diseño no introdujeron ninguna violación
nueva. El único punto que ameritó revisión fue la instalación de los parsers del checker (R0)
frente al Principio I: se resolvió instalándolos fuera del repositorio, dejando `git status` limpio
y la app sin dependencias de build.

## Project Structure

### Documentation (this feature)

```text
specs/007-cierre-pendientes-v2/
├── plan.md                        # Este archivo
├── spec.md                        # Qué se construye (comportamiento observable)
├── research.md                    # Fase 0 — hallazgos verificados y decisiones
├── data-model.md                  # Fase 1 — entidades y derivaciones
├── quickstart.md                  # Fase 1 — guía de validación ejecutable
├── contracts/
│   ├── service-worker-contract.md # Contrato de caché, scope y ciclo de vida
│   └── round-naming-contract.md   # Contrato de derivación de nombre de ronda
├── checklists/
│   └── requirements.md            # Checklist de calidad de la spec
└── tasks.md                       # Fase 2 — generado por /speckit.tasks
```

### Source Code (repository root)

```text
mundialito-web/
├── index.html            # SIN CAMBIOS (orden de <script> intacto)
├── styles.css            # SIN CAMBIOS
├── motor.js              # SIN CAMBIOS — diff cero obligatorio
├── competiciones.js      # SIN CAMBIOS — diff cero obligatorio
├── app.js                # MODIFICADO — Áreas 1, 2 y registro del SW (Área 4)
├── sw.js                 # NUEVO — Área 4
├── manifest.json         # SIN CAMBIOS (ya 100% relativo, verificado en R5)
├── assets/branding/      # SIN CAMBIOS (9 archivos, entran al precache)
├── .impeccable/
│   └── config.json       # MODIFICADO — Área 3
└── KNOWN_ISSUES.md       # MODIFICADO — Área 3 y consecuencia aceptada de D-SW-5
```

**Structure Decision**: se mantiene la estructura plana existente del proyecto — sin `src/`, sin
carpetas nuevas. `sw.js` va en la raíz porque el scope de un service worker no puede exceder el
directorio desde el que se sirve: ubicado en la raíz del sitio publicado, controla toda la app.

## Áreas de implementación

### Área 1 — Nombres de ronda del bracket

Contrato completo en [contracts/round-naming-contract.md](./contracts/round-naming-contract.md).

Tres sitios en `app.js`, todos con la misma sustitución conceptual: reemplazar `rondas.length` por
la profundidad total del bracket, `Math.ceil(Math.log2(clasificados))`, fija desde que se arman los
cruces.

| Sitio | Línea aprox. | Situación actual |
|---|---|---|
| `renderizarEliminacion()` — tabs de ronda | ~1893 | `Math.pow(2, rondas.length - ronda)` |
| `renderizarEliminacion()` — label de fase | ~1903 | `Math.pow(2, rondas.length - rondaActiva)` |
| `renderizarDashboard()` — secciones de ronda | ~2039 | `Math.pow(2, rondas.length - ronda)` |

**Notas de implementación**:

- En `renderizarEliminacion()` ya existe `totalJugadores` (línea ~1890, con guarda
  `|| 2`), calculada y **sin usar**. Se reutiliza para derivar la profundidad — no se introduce
  otra variable con el mismo dato.
- En `renderizarDashboard()` **no existe** esa guarda (hallazgo R3). Hay que derivar la profundidad
  con una guarda equivalente antes de usarla: con 0 o 1 clasificados, `Math.log2` da `-Infinity`/`0`
  y el nombre de ronda saldría `undefined`.
- `nombreDeRonda()` sigue recibiendo el mismo tipo de argumento (cantidad de equipos que arrancan
  la ronda, potencia de 2). `motor.js` no se toca.
- El fallback `|| \`Ronda ${n}\`` se conserva tal cual en los tres sitios.

### Área 2 — Duplicados en `validarJugadores()`

`app.js`, función desde la línea ~644. Se reescribe a dos pasadas:

1. **Pasada 1**: recorrer los inputs y contar ocurrencias de cada nombre normalizado, **contando
   solo los no vacíos** (R4 — incluir vacíos los haría duplicados entre sí, ruido conceptual).
2. **Pasada 2**: recorrer de nuevo; marcar `.error` en todo input vacío (igual que hoy) y en todo
   input cuyo normalizado tenga conteo mayor a 1. `valido` se computa igual.

**No se toca**: `normalizarNombreJugador()` (trim + colapso de espacios + case-insensitive, ya
correcta), ni el enganche de eventos. **FR-006 no requiere trabajo nuevo** (R4): `crearFilaJugador()`
ya llama a `validarJugadores` en cada `input`, y la función limpia `.error` de todos los inputs al
empezar, así que corregir un duplicado ya despinta a los que dejan de estar en conflicto. Solo hay
que **verificarlo** en navegador, no construir un mecanismo de limpieza nuevo.

### Área 3 — Higiene de `.impeccable/config.json`

**Orden obligatorio — el baseline se captura ANTES de tocar nada.**

1. **Baseline**: correr el checker y registrar el conteo. **Verificar que stderr no contenga la
   advertencia `DEGRADED`** (R0) — un baseline en modo degradado es inválido y se descarta. Baseline
   esperado: **0 hallazgos** (R1).
2. **Editar** `.impeccable/config.json`:
   - Eliminar las dos entradas `ignoreValues` con `"rule": "side-tab"` y valor específico de
     `border-left` (inertes por construcción, ver R2).
   - Dejar la entrada wildcard de `side-tab`, ampliando su `reason` para que explique que cubre las
     tres atribuciones conocidas: stripe tricolor del header (atribuido a `styles.css:89` **y** a
     `index.html:0` por el motor de cascada estática) más los bordes `var(--gold)`/`var(--green)`
     de `.side-tab`/`.match-card`.
   - **Mantener** la wildcard de `dark-glow` en `index.html` tal como está — no hay forma de
     acotarla sin modificar el checker. Solo actualizar su `reason` para dejar constancia de que
     cubre los 12 glows del Shadow Vocabulary de `DESIGN.md` (número verificado en R1) y que
     cualquier glow nuevo en `index.html` requiere revisión manual contra `DESIGN.md` antes de
     asumirse cubierto.
3. **Re-verificar**: correr el checker con **el mismo comando y la misma lista de archivos** y
   confirmar contra el baseline (SC-004). Si el conteo sube a 4, el análisis es incorrecto: se
   detiene y se flaguea, no se ajusta la wildcard hasta que dé cero.
4. **`KNOWN_ISSUES.md`**: remover las secciones resueltas (nombres de ronda; excepciones muertas de
   `side-tab`) y reescribir la de `dark-glow` como decisión deliberada y documentada, no heredada.

**No se agrega `sw.js` a la lista de archivos del checker** — no es código de UI y rompería la
comparabilidad con el baseline.

### Área 4 — Service worker

Contrato completo en [contracts/service-worker-contract.md](./contracts/service-worker-contract.md).

**Registro** (`app.js`, al final): condicional estricto —
`if ((location.protocol === 'http:' || location.protocol === 'https:') && 'serviceWorker' in navigator)`.
Bajo `file://` no se evalúa nada más y no se emite ningún error. Registro con
`navigator.serviceWorker.register('./sw.js')`, con `.catch()` silencioso o log discreto que no
ensucie consola.

**`sw.js`** (raíz):

- `CACHE_NAME` versionado explícito con nombre de **producto**, no de repo: `copa-panas-v1`.
- `install`: shell local (15 rutas, R5 — sin `'./'`, cubierto por el manejo de navegaciones) con
  `cache.addAll()` atómico; los 3 externos individualmente con `Promise.allSettled` y fallback
  `no-cors` (D-SW-1, D-SW-2) para que un CDN caído no aborte todo el precache. El fallback
  `no-cors` cachea la respuesta si el `fetch` no lanzó excepción, sin condicionar por `.ok`
  (opaca por diseño).
- `activate`: borrar toda caché cuyo nombre no sea `CACHE_NAME`. Sin `skipWaiting()`, sin
  `clients.claim()`.
- `fetch`: cache-first. Las navegaciones (`request.mode === 'navigate'`) responden con la entrada
  cacheada de `./index.html` (**D-SW-3 — sin esto el escenario de subpath falla**). Runtime cache
  cache-first para `fonts.gstatic.com` y los webfonts de cdnjs, cuyas URLs no se conocen de
  antemano y sin las cuales el offline queda sin tipografía ni íconos.
- Todas las rutas relativas (`./index.html`, `./assets/branding/icon-192.png`), resueltas contra
  `self.registration.scope`. Nunca `/` inicial, nunca el nombre del repo.

**Consecuencia aceptada de D-SW-5**, a agregar a `KNOWN_ISSUES.md` al cerrar: en una PWA instalada
en móvil la app casi nunca se cierra del todo, así que un service worker nuevo puede quedarse en
`waiting` mucho tiempo y el organizador seguir viendo una versión vieja tras un deploy. Se acepta a
cambio de no recargar la app en medio de un torneo en vivo. La solución futura sería un aviso de
versión nueva con recarga voluntaria — fuera del alcance de esta spec, junto con sincronización en
background y cualquier cambio a la persistencia.

## Verificación

Playwright real. **Ninguna tarea de verificación se marca completa sin corrida efectiva** — no
alcanza con trazar el código. Escenarios completos y comandos en [quickstart.md](./quickstart.md):

| # | Escenario | Cubre |
|---|---|---|
| V1 | HTTP local: SW se registra; red cortada → app completa con estilos/tipografía/íconos, registrar resultado que persiste | SC-005, FR-011, FR-013 |
| V2 | Servido desde subpath (no solo raíz) → precache no falla | SC-005, FR-014 |
| V3 | `file://` → comportamiento idéntico, sin errores de SW en consola | SC-006, FR-012 |
| V4 | Torneo de 8 clasificados hasta la final; nombres correctos desde que se generan y sin cambiar después, en bracket **y** dashboard | SC-001, FR-001, FR-002 |
| V5 | Repetir V4 con cantidad de clasificados que no sea potencia de 2 | SC-002, FR-003 |
| V6 | Dos campos con mismo nombre → **ambos** con `.error`; con tres campos iguales → los tres; al corregir uno se retira la marca de los que dejan de estar en conflicto | SC-003, FR-004, FR-006 |
| V7 | Checker de Impeccable: conteo idéntico al baseline, en modo no degradado | SC-004, FR-009 |
| V8 | `git diff --stat motor.js competiciones.js` vacío | Restricción global |

## Complexity Tracking

> Sin violaciones al Constitution Check. Sección vacía intencionalmente.
