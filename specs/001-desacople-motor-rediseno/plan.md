# Implementation Plan: Desacople de motor y rediseño visual (Copa Panas v2)

**Branch**: `001-desacople-motor-rediseno` | **Date**: 2026-08-25 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-desacople-motor-rediseno/spec.md`

## Summary

Separar el motor de cálculo de torneo (calendario, posiciones/desempates, bracket de eliminación)
de todo lo específico de Mundial 2026 (pool de equipos, paleta, textos), introduciendo una capa de
configuración de competición que el motor consume mediante parámetros, nunca referencias directas.
Se agrega una pantalla de selección de competición (solo Mundial disponible hoy), un objeto de
configuración de formato editable (partido único/ida-vuelta en grupos y eliminación, penales
sí/no) que hoy no existe en el código, migración silenciosa de torneos guardados en el esquema
previo (vía campo `version` explícito), y un rediseño visual responsive (mobile-first, con soporte
real de desktop) aplicado a las 9 pantallas del flujo. Enfoque técnico: dividir `app.js` en tres
archivos cargados por `<script>` sin bundler (`motor.js` puro, `competiciones.js` de
configuración, `app.js` de UI/estado/router), y generalizar `generarCalendarioGrupos` /
`generarPartidosEliminacion` / `avanzarEliminacion` para soportar ida/vuelta y penales
configurables — funcionalidad que hoy no existe (el motor actual solo soporta partido único).

## Technical Context

**Language/Version**: JavaScript ES6+ (vanilla, sin transpilar), HTML5, CSS3

**Primary Dependencies**: Tailwind CSS vía CDN (JIT en navegador, sin build), Font Awesome 6 vía
CDN, Google Fonts (Bebas Neue, Inter) — sin dependencias npm, sin frameworks

**Storage**: `localStorage`, clave `torneo_data` para el torneo activo (esquema versionado desde
esta feature, ver Data Model). Sin backend, sin IndexedDB.

**Testing**: Sin framework de tests automatizados (restricción del proyecto: sin build
tools/Node — Principio I). Validación manual guiada por `quickstart.md`, con los mismos escenarios
Given/When/Then de `spec.md`. Cualquier verificación de "el motor no referencia X" (SC-006) se hace
por inspección de código (grep), no por test unitario.

**Target Platform**: Navegadores modernos de escritorio (Chrome, Safari, Firefox, Edge) y móviles
(Chrome Android, Safari iOS 15+), servido vía `file://` o GitHub Pages.

**Project Type**: Single-page app estática de 3(+) archivos, sin backend.

**Performance Goals**: Sin metas de throughput (no hay red ni backend); el criterio es fluidez de
interacción local — animaciones a 60fps vía `transform`/`opacity` (FR-012), sin jank perceptible en
listas de hasta ~32 jugadores.

**Constraints**: Sin backend, sin build tools ni bundlers (Principio I); debe abrir directo con
`file://` y con GitHub Pages; `localStorage` tiene límite práctico ~5-10MB (no es un riesgo real
para el volumen de datos de un torneo); todo el motor debe ser agnóstico de competición (Principio
II, regla dura).

**Scale/Scope**: Un torneo activo global (D1); 1 competición operativa hoy (Mundial) sobre un
modelo preparado para N; hasta 9 pantallas de flujo (selección de competición, setup, asignación
de equipos, config. de grupos, fase de grupos, clasificados, eliminación, dashboard, config)
rediseñadas en 3 anchos de referencia (mobile/tablet/desktop).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio / Decisión | Evaluación |
|---|---|
| I. Sin backend, sin build tools | PASS — se mantiene HTML/CSS/JS estático; dividir `app.js` en `motor.js`/`competiciones.js`/`app.js` no introduce build step, solo más `<script>` tags cargados en orden. Ninguna librería nueva. |
| II. Motor desacoplado de tema/competición | PASS (es el objetivo central) — `motor.js` no importará `competiciones.js` ni conocerá IDs/nombres de competición; solo recibe datos + objeto de configuración de formato como parámetros. Se verifica con grep (SC-006) antes de cerrar la feature. |
| III. Spec-driven | PASS — este plan deriva de `spec.md` con clarifications ya integradas; no se agrega alcance no cubierto por FRs. |
| IV. Formato como configuración | PASS — el objeto `configFormato` (grupos, eliminación, penales) se resuelve como dato en `estado`, inicializado desde el default de la competición y editable por el usuario (FR-004), nunca como rama `if competicion === 'mundial'` dentro del motor. |
| V. Un torneo activo global | PASS — se mantiene una sola clave `torneo_data`; la pantalla de selección de competición solo es alcanzable cuando `cargar()` no devuelve torneo activo (D1), igual que hoy pero con el nuevo paso previo. |
| VI. Compatibilidad Impeccable/Kowalski | PASS — el rediseño (FR-009 a FR-012) se ejecuta como pase de diseño posterior a este plan usando las skills `impeccable`/`emil-design-eng`; este plan solo fija la estructura de datos/CSS (variables por competición, `prefers-reduced-motion`) que esas skills necesitan para operar, no re-implementa reglas de motion propias. |
| D1 (torneo activo global) | PASS — ver fila V. |
| D2 (mismo mecanismo de asignación de equipo) | PASS — se mantiene `jugador.equipo` + los dos modos (aleatorio/manual) en `app.js`; solo cambia la fuente del pool (`competiciones.js` en vez de `EQUIPOS_POOL` global). |
| D3 (formato personalizable con default por competición) | PASS — ver fila IV; Mundial sugiere partido único + penales activos (comportamiento actual preservado), editable siempre. |
| D4 (pool de jugadores reutilizable) | N/A — explícitamente fuera de alcance de esta spec (ver spec.md Assumptions); no se toca `estado.jugadores` como lista por-torneo. |

Sin violaciones. No se requiere Complexity Tracking.

**Re-chequeo post-diseño (tras Phase 1)**: `research.md` y `data-model.md` confirman que
`configFormato` y `COMPETICIONES` son datos puros consumidos por parámetro (Principio II/IV
intactos), que la migración usa un campo `version` explícito sin ramas por nombre de competición
(D1/D3 intactos), y que ninguna decisión técnica introduce backend, build tools o dependencias
nuevas (Principio I intacto). Gate se mantiene en PASS, sin cambios respecto al chequeo inicial.

## Project Structure

### Documentation (this feature)

```text
specs/001-desacople-motor-rediseno/
├── plan.md              # Este archivo
├── research.md          # Phase 0 — decisiones técnicas
├── data-model.md        # Phase 1 — esquema de estado.torneo_data, configFormato, COMPETICIONES
├── quickstart.md        # Phase 1 — guía de validación manual end-to-end
├── contracts/
│   ├── motor-api.md              # firmas de motor.js, regla de "cero referencias a competición"
│   └── competition-config-schema.md  # esquema que debe cumplir cada entrada de COMPETICIONES
└── tasks.md              # Phase 2 — generado por /speckit-tasks (no por este comando)
```

### Source Code (repository root)

```text
index.html          # Estructura de las 9+1 pantallas (screens), carga los <script> en orden
motor.js             # NUEVO — motor puro: calendario, posiciones/desempates, bracket,
                      #   avance de eliminación. Cero referencias a competición/tema/color.
competiciones.js     # NUEVO — registro de configuración por competición (hoy solo `mundial`):
                      #   pool de equipos, paleta (variables CSS a aplicar), textos del flujo
                      #   de asignación, formato sugerido por defecto (grupos/eliminación/penales).
app.js               # UI, estado (`estado`), router (`estado.fase`), persistencia
                      #   (guardar/cargar/migrarEstado), event handlers. Consume motor.js y
                      #   competiciones.js; no contiene lógica de cálculo propia.
styles.css           # Estilos + variables CSS por competición + prefers-reduced-motion +
                      #   breakpoints nuevos (mobile/tablet/desktop)
```

No hay `tests/` porque el proyecto no usa framework de tests (Principio I / Technical Context).
La validación es manual vía `quickstart.md`.

**Structure Decision**: Se mantiene la app como archivos estáticos servidos sin build. La única
estructura nueva es dividir el actual `app.js` monolítico (1994 líneas) en tres `<script>` cargados
en orden (`motor.js` → `competiciones.js` → `app.js`) directamente en `index.html`, sin módulos
ES ni bundler — variables globales igual que hoy, solo reorganizadas por responsabilidad. Esto
satisface Principio II (el motor queda físicamente separado y auditable con grep) sin violar
Principio I (nada de Node/build tools).

## Complexity Tracking

*Sin violaciones de la constitución — tabla no aplica.*
