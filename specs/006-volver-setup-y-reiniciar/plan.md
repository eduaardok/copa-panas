# Implementation Plan: Navegación de vuelta y reinicio consciente

**Branch**: `006-volver-setup-y-reiniciar` | **Date**: 2026-08-30 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/006-volver-setup-y-reiniciar/spec.md`

## Summary

Agrega dos entradas de navegación distintas hacia `screen-competicion`, con fricción proporcional a
lo que hay en juego (research.md §1). En `screen-setup` (recién elegida una competición, sin datos
sustanciales aún), un ícono nuevo `#btn-volver-competicion` reutiliza exactamente el mismo mecanismo
que ya usa "Reiniciar torneo" — `limpiarStorage()` + `location.reload()` — sin modal ni oferta de
exportar (research.md §2, hallazgo clave: `aplicarPaletaCompeticion()` nunca revierte las variables
CSS que aplicó, así que solo un reload deja `:root` en estado neutro sin reinventar un mecanismo de
reset de paleta). En `screen-config`, el flujo de "Reiniciar torneo" gana un modal propio
`#modal-reiniciar` (no reutiliza el `#modal-confirm` genérico, research.md §3) con tres acciones:
exportar (dispara `exportarJSON()` sin cerrar el modal), cancelar, y confirmar el borrado — el modal
solo se cierra y ejecuta `limpiarStorage()` + `location.reload()` al confirmar, nunca al exportar.

## Technical Context

**Language/Version**: JavaScript ES6+ (vanilla, sin transpilar), HTML5, CSS3 — sin cambios respecto
a specs 001-005.

**Primary Dependencies**: Tailwind CSS vía CDN, Font Awesome 6 vía CDN, Google Fonts — sin
dependencias nuevas.

**Storage**: `localStorage`, clave `torneo_data` (`CLAVE_LS`) ya existente. Ninguna clave nueva ni
campo nuevo persistido — ambos flujos terminan en `limpiarStorage()`, ya existente, que borra por
completo esa clave. `jugadores_conocidos` (D4) no se toca en ningún caso.

**Testing**: Sin framework de tests automatizados (Principio I). Validación manual vía
`quickstart.md`.

**Target Platform**: Igual que specs 001-005 — navegadores modernos de escritorio y Chrome
Android/Safari iOS 15+, servido vía `file://` o GitHub Pages. Sin CSS nuevo que dependa de
`color-mix()` ni ninguna otra feature no soportada en iOS 15+.

**Project Type**: Single-page app estática de 3(+) archivos, sin backend — sin cambios de
estructura.

**Performance Goals**: Sin metas nuevas — ambos flujos son interacciones puntuales de un solo
usuario (un tap), sin impacto medible.

**Constraints**: Principio I (sin backend/build tools) intacto — no se agrega dependencia. Principio
II (motor agnóstico) intacto — no se toca `motor.js`. Principio VI (Impeccable/Kowalski) aplica al
modal nuevo: reutiliza el esqueleto `.modal-overlay`/`.modal-box` y el patrón de cierre animado
`cerrarModalConAnimacion()` ya existentes (app.js:500-511), sin inventar transición nueva.

**Scale/Scope**: Un botón/ícono nuevo en una screen existente (`screen-setup`), un modal nuevo en
`index.html` con tres botones, y el wiring de eventos correspondiente en `app.js`. Ningún valor
nuevo de `estado.fase`, ninguna screen nueva de router.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio / Decisión | Evaluación |
|---|---|
| I. Sin backend, sin build tools | PASS — cero dependencias nuevas; solo markup + wiring reutilizando funciones ya existentes (`limpiarStorage`, `exportarJSON`, `cerrarModalConAnimacion`). |
| II. Motor desacoplado de tema/competición | PASS — `motor.js` no se toca (fuera de alcance explícito del spec). Ambos flujos operan sobre `estado`/`localStorage`, nunca sobre el motor de cálculo. |
| III. Spec-driven | PASS — este plan deriva de `spec.md`, que ya cerró (D-NAV-1/2/3, sección Assumptions) los puntos que podrían haber quedado ambiguos. |
| IV. Formato como configuración | N/A — no se toca `configFormato` más allá de descartarlo por completo junto con el resto del estado, igual que ya hace "Reiniciar torneo" hoy. |
| V. Un torneo activo, global | PASS — ambos flujos terminan en `screen-competicion` (alcanzable solo sin torneo activo, D1) vía el mismo mecanismo de borrado total ya usado por "Reiniciar torneo"; no se crea un segundo camino de estado. |
| VI. Compatibilidad Impeccable/Kowalski | PASS — el modal nuevo reutiliza el esqueleto y el cierre animado ya establecidos; el ícono de "volver" en setup no introduce animación nueva, solo un control más en una pantalla ya estática. |
| D1 (torneo activo global) | PASS — "volver" desde setup y "Reiniciar torneo" son las dos únicas puertas hacia `screen-competicion`, ambas vía borrado total del torneo activo — consistente con D1, sin excepciones nuevas. |
| D2 (asignación de equipos) | N/A — no se toca la asignación de equipos. |
| D3 (formato personalizable) | N/A — no se cambia cómo se configura el formato, solo se descarta junto con el resto del estado al volver o reiniciar. |
| D4 (pool de jugadores reutilizable) | PASS — `jugadores_conocidos` es una clave de `localStorage` completamente separada de `torneo_data`; ninguno de los dos flujos la toca (research.md §4). |

Sin violaciones. No se requiere Complexity Tracking.

**Re-chequeo post-diseño (tras Phase 1)**: `data-model.md` confirma que ningún campo nuevo se agrega
a `estado` ni a `COMPETICIONES[id]` — el "estado a descartar" es exactamente el mismo objeto que ya
persiste `guardar()`, sin esquema nuevo. `contracts/volver-y-reiniciar-contract.md` confirma que
ambos flujos convergen en el mismo par de llamadas (`limpiarStorage()` + `location.reload()`) y que
la exportación dentro del modal de reinicio nunca dispara ese borrado por sí sola (Garantías 1-5).
Gate se mantiene en PASS, sin cambios respecto al chequeo inicial.

## Project Structure

### Documentation (this feature)

```text
specs/006-volver-setup-y-reiniciar/
├── plan.md              # Este archivo
├── research.md          # Phase 0 — por qué "volver" reusa reload en vez de revertir la paleta en
│                         #   memoria (§2, hallazgo clave sobre aplicarPaletaCompeticion), por qué el
│                         #   modal de reinicio es nuevo en vez de extender #modal-confirm (§3),
│                         #   verificación de que jugadores_conocidos queda intacto (§4)
├── data-model.md         # Phase 1 — qué campos de `estado` se descartan en cada flujo, funciones
│                         #   nuevas/editadas en app.js
├── quickstart.md         # Phase 1 — guía de validación manual (escenarios de spec.md)
├── contracts/
│   └── volver-y-reiniciar-contract.md   # NUEVO — garantías de ambos flujos de navegación
└── tasks.md              # Phase 2 — generado por /speckit-tasks (no por este comando)
```

### Source Code (repository root)

```text
index.html          # screen-setup (línea ~95, hero de "CREA TU TORNEO"): agrega
                      #   #btn-volver-competicion, ícono-botón (fa-arrow-left) en la esquina superior
                      #   del hero, visualmente distinto del patrón "Atrás" de botón ancho usado entre
                      #   pasos del wizard (screen-equipos #btn-back-setup, screen-grupos-config
                      #   #btn-back-equipos) — FR-010, es una salida del flujo, no un paso atrás
                      #   dentro de él.
                      # screen-config (línea ~496, junto a #btn-reiniciar): el botón y su tarjeta de
                      #   "Zona de peligro" no cambian de lugar ni de rótulo (FR-004/D-NAV-3).
                      # Nuevo modal #modal-reiniciar (mismo esqueleto .modal-overlay/.modal-box que
                      #   #modal-confirm, línea ~585, como referencia de estructura): título y texto
                      #   explícitos sobre ir a elegir otra competición (FR-005), botón "Exportar
                      #   antes de borrar" (reutiliza el ícono/copy de #btn-exportar), y los dos
                      #   botones ya usados en #modal-confirm (Cancelar / Confirmar).
motor.js             # SIN CAMBIOS (fuera de alcance explícito de spec.md).
competiciones.js     # SIN CAMBIOS (fuera de alcance explícito de spec.md).
app.js               # Función nueva: volverASeleccionCompeticion() — llama limpiarStorage() +
                      #   location.reload(), enganchada al click de #btn-volver-competicion junto al
                      #   resto de listeners de screen-setup (cerca de app.js:554,
                      #   inicializarSetup()).
                      # Funciones nuevas: abrirModalReiniciar() / cerrarModalReiniciar() — replacement
                      #   puntual del uso actual de mostrarConfirm() en el listener de #btn-reiniciar
                      #   (app.js:2501-2509), ya que ese modal genérico no admite una tercera acción
                      #   no destructiva (research.md §3). El botón "Exportar" del nuevo modal llama
                      #   directamente a exportarJSON() (app.js:2125, sin cambios) y no cierra el
                      #   modal. El botón "Confirmar" ejecuta limpiarStorage() + location.reload(),
                      #   igual que hoy.
styles.css           # Estilo puntual para el ícono-botón de "volver" en setup (touch target ≥44px,
                      #   sin depender de :hover como único estado, consistente con el resto de
                      #   botones-ícono ya existentes, ej. #btn-theme-toggle).
```

No hay `tests/` — mismo motivo que specs 001-005 (Principio I / Technical Context). Validación
manual vía `quickstart.md`.

**Structure Decision**: Se mantiene la separación de 3 archivos ya establecida (`motor.js` /
`competiciones.js` / `app.js`), sin archivos nuevos. Todo el trabajo cae dentro de `index.html`
(markup del ícono nuevo + modal nuevo), `app.js` (dos funciones nuevas + edición puntual del
listener de `#btn-reiniciar`) y `styles.css` (estilo del ícono-botón). No se introduce ningún valor
nuevo de `estado.fase` ni pantalla nueva de router — ambas entradas siguen desembocando en la misma
`screen-competicion` que ya existe.

## Complexity Tracking

*Sin violaciones de la constitución — tabla no aplica.*
