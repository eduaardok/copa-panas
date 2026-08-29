# Implementation Plan: Registro persistente de jugadores (Copa Panas v2)

**Branch**: `003-registro-jugadores` | **Date**: 2026-08-29 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/003-registro-jugadores/spec.md`

## Summary

Agregar una clave de `localStorage` nueva e independiente, `jugadores_conocidos`, que persiste la
identidad reutilizable de jugadores entre torneos (D4), separada de `torneo_data` y de
`estado.jugadores` (verificado por lectura completa de `app.js`, research.md §1-§3). El único
punto de integración real es la pantalla de registro de jugadores del setup
(`app.js:271-416`, `#lista-jugadores`): se agrega un botón condicional "Importar del registro"
(visible solo si hay al menos un jugador conocido, FR-003/FR-007) que abre un modal con el mismo
patrón ya usado por los otros 4 modales de la app (research.md §5), y la actualización del
registro pasa a ser automática y silenciosa al confirmar un torneo (`confirmarJugadores()`,
research.md §7) — sin botón de guardado aparte, resolviendo así, dentro del propio código, los
tres puntos que D4 dejaba abiertos y que `spec.md` ya cerró como decisiones de diseño. Se endurece
además la normalización de nombres (`normalizarNombreJugador`, research.md §2) para que la regla
de deduplicación sea una sola función compartida entre el roster en edición y el registro, en vez
de dos comparaciones ad-hoc que podrían divergir. El riesgo técnico real detectado (research.md
§6) es que la importación no debe reconstruir `#lista-jugadores` desde `estado.jugadores`
(perdería nombres tipeados y aún no confirmados) — se resuelve escribiendo directamente sobre los
`<input>` existentes/nuevos. `motor.js` no cambia (verificado, research.md §4 / SC-004).

## Technical Context

**Language/Version**: JavaScript ES6+ (vanilla, sin transpilar), HTML5, CSS3 — sin cambios
respecto a spec 001/002.

**Primary Dependencies**: Tailwind CSS vía CDN, Font Awesome 6 vía CDN, Google Fonts — sin
dependencias nuevas.

**Storage**: `localStorage`. Clave nueva `jugadores_conocidos` (array JSON de
`{ nombreNormalizado, nombre, ultimoUso }`, ver data-model.md), completamente independiente de
`torneo_data`/`version: 2` — no requiere migración de esquema de `estado` (Principio V/D1 intactos:
sigue habiendo un solo torneo activo, esta spec no toca ese mecanismo).

**Testing**: Sin framework de tests automatizados (Principio I). Validación manual vía
`quickstart.md`. La verificación de "motor.js no cambia" (SC-004) se hace por diff de git, no por
test.

**Target Platform**: Igual que spec 001/002 — navegadores modernos de escritorio y Chrome
Android/Safari iOS 15+, servido vía `file://` o GitHub Pages. Sin uso de `color-mix()` ni ninguna
otra feature CSS nueva en esta spec — no hereda la excepción puntual de compatibilidad de spec 002.

**Project Type**: Single-page app estática de 3(+) archivos, sin backend — sin cambios de
estructura.

**Performance Goals**: Sin metas nuevas — `jugadores_conocidos` es un array pequeño (jugadores
entre amigos, no a escala, ver spec.md Assumptions); leerlo/escribirlo es una operación
`JSON.parse`/`stringify` puntual en el flujo de setup, sin impacto medible.

**Constraints**: Mismas que spec 001/002 (Principio I: sin backend/build tools; Principio II:
motor agnóstico de competición y, en esta spec, agnóstico también del registro de jugadores —
verificado sin excepciones en research.md §4). Es transversal a competiciones (spec.md FR-008):
no vive en `COMPETICIONES` ni en `competiciones.js`.

**Scale/Scope**: Un flujo de UI nuevo (modal de importación) dentro de una pantalla ya existente
(`screen-setup`), sin pantallas nuevas de router (`estado.fase` no gana ningún valor nuevo).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio / Decisión | Evaluación |
|---|---|
| I. Sin backend, sin build tools | PASS — solo `localStorage` nuevo y JS/HTML/CSS al mismo patrón sin bundler. Ninguna dependencia nueva. |
| II. Motor desacoplado de tema/competición | PASS — verificado por grep de `motor.js` (research.md §4): 0 referencias a `jugadores_conocidos` ni a ninguna clave de `localStorage`. Ningún cambio a `motor.js` en esta spec. |
| III. Spec-driven | PASS — este plan deriva de `spec.md`, que ya resolvió los tres puntos abiertos de D4 como "Decisiones de diseño" antes de este plan (dedup por nombre normalizado, sin historial de equipos, actualización automática al confirmar). |
| IV. Formato como configuración | N/A — esta spec no toca formato de torneo. |
| V. Un torneo activo, global | PASS — sin cambios; `jugadores_conocidos` es una clave completamente separada de `torneo_data`, no introduce un segundo mecanismo de "torneo activo" ni de archivado. |
| VI. Compatibilidad Impeccable/Kowalski | PASS — el modal nuevo reutiliza el esqueleto ya establecido (`modal-overlay`/`modal-box`, cierre por X y por clic fuera, sin animación nueva que inventar) — coherencia visual entre pantallas ya cubierta por los estilos existentes de modal. |
| D1 (torneo activo global) | PASS — sin cambios de mecanismo; reutilizar jugadores no crea un segundo torneo ni una ruta alterna a `screen-competicion`. |
| D2 (mismo mecanismo de asignación de equipo) | N/A — el registro actúa antes de la asignación de equipo; un jugador importado entra al roster igual que uno tipeado a mano y pasa por el mismo flujo D2 sin distinción. |
| D3 (formato personalizable con default por competición) | N/A — sin relación con formato. |
| D4 (pool de jugadores reutilizable) | **Esta spec la implementa** — mecanismo concreto (clave `jugadores_conocidos`, dedup por nombre normalizado, sin historial de equipos, actualización automática) ya cerrado en spec.md y detallado en research.md/data-model.md. |

Sin violaciones. No se requiere Complexity Tracking.

**Re-chequeo post-diseño (tras Phase 1)**: `data-model.md` confirma que `jugadores_conocidos` no
agrega campos a `estado` ni a `COMPETICIONES[id]` (Principio II/D4 intactos — el registro es
transversal, no vive en la capa de competición). `contracts/registro-jugadores-schema.md`
confirma independencia de clave frente a `torneo_data` (D1 intacto: un solo torneo activo, ahora
simplemente con un origen adicional de nombres). `contracts/setup-import-contract.md` confirma que
la opción de importar nunca reemplaza el alta manual ni introduce un paso obligatorio (Principio I,
simplicidad para un usuario nuevo — FR-007/SC-002). Gate se mantiene en PASS, sin cambios respecto
al chequeo inicial.

## Project Structure

### Documentation (this feature)

```text
specs/003-registro-jugadores/
├── plan.md              # Este archivo
├── research.md          # Phase 0 — dónde vive el flujo de alta (§1), normalización compartida
│                         #   (§2), esquema/clave de localStorage (§3), verificación motor.js (§4),
│                         #   patrón de modal a reutilizar (§5), riesgo de reconstrucción de DOM
│                         #   al importar (§6), disparador de guardado automático (§7),
│                         #   no-disrupción sin registro previo (§8)
├── data-model.md         # Phase 1 — entidad JugadorConocido, ciclo de vida, funciones nuevas/
│                         #   editadas en app.js
├── quickstart.md         # Phase 1 — guía de validación manual (5 escenarios)
├── contracts/
│   ├── registro-jugadores-schema.md   # NUEVO — garantías de independencia/tolerancia de la
│   │                                   #   clave jugadores_conocidos
│   └── setup-import-contract.md       # NUEVO — garantías de comportamiento del botón/modal de
│                                       #   importación en screen-setup
└── tasks.md              # Phase 2 — generado por /speckit-tasks (no por este comando)
```

`contracts/motor-api.md` de spec 001 y los contratos de spec 002 siguen vigentes sin cambios — no
se duplican aquí porque ninguna firma ni garantía de `motor.js` ni de `competiciones.js` cambia
(research.md §4; esta spec no toca `competiciones.js`).

### Source Code (repository root)

```text
index.html          # screen-setup (líneas ~169-177): agrega un botón "Importar del registro"
                      #   junto al label "Jugadores", condicional a jugadores_conocidos no vacío
                      #   (contrato setup-import-contract.md, garantía 1). Nuevo modal
                      #   #modal-importar-jugadores (mismo esqueleto que los 4 modales existentes,
                      #   ver index.html:497-576) con lista de checkboxes + botón "Agregar
                      #   seleccionados".
motor.js             # SIN CAMBIOS (verificado, research.md §4 / SC-004).
competiciones.js     # SIN CAMBIOS — el registro es transversal a competiciones (spec.md FR-008),
                      #   no vive en COMPETICIONES.
app.js               # Nueva constante CLAVE_LS_JUGADORES. Nuevas funciones:
                      #   normalizarNombreJugador, cargarJugadoresConocidos,
                      #   guardarJugadoresConocidos, actualizarRegistroJugadores,
                      #   abrirModalImportarJugadores, cerrarModalImportarJugadores,
                      #   importarJugadoresSeleccionados (data-model.md, tabla de funciones).
                      #   Ediciones puntuales: validarJugadores() usa normalizarNombreJugador();
                      #   confirmarJugadores() llama actualizarRegistroJugadores() al final;
                      #   inicializarSetup() evalúa visibilidad del botón de importar. Wiring de
                      #   eventos del nuevo botón/modal junto al resto de listeners de screen-setup
                      #   (junto a app.js:1820, mismo bloque donde ya se conecta
                      #   btn-confirmar-jugadores).
styles.css           # Estilos puntuales para la lista de checkboxes del modal (reutiliza clases
                      #   ya existentes de modal-box/form-group donde alcance; solo agrega lo que
                      #   no exista, ej. una fila de checkbox con touch target ≥44px).
```

No hay `tests/` — mismo motivo que spec 001/002 (Principio I / Technical Context). Validación
manual vía `quickstart.md`.

**Structure Decision**: Se mantiene la separación de 3 archivos ya establecida por spec 001/002
(`motor.js` / `competiciones.js` / `app.js`). Esta spec no agrega archivos nuevos ni cambia el
orden de carga de `<script>` — todo el trabajo cae dentro de `app.js` (persistencia + UI de
setup) e `index.html` (markup del botón + modal nuevo), con CSS puntual en `styles.css`,
preservando el patrón arquitectónico ya cerrado. `competiciones.js` y `motor.js` quedan intactos,
reforzando explícitamente que D4 es transversal y no una propiedad de competición ni del motor.

## Complexity Tracking

*Sin violaciones de la constitución — tabla no aplica.*
