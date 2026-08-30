# Implementation Plan: Historial de equipos y administración del registro de jugadores

**Branch**: `005-administracion-registro-jugadores` | **Date**: 2026-08-30 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/005-administracion-registro-jugadores/spec.md`

## Summary

Extiende `jugadores_conocidos` (spec 003) con un campo `historial` por entrada — lista de
`{ equipo, competicion, fecha }`, una por cada torneo confirmado en el que participó ese jugador
(research.md §1-§3, data-model.md) — y agrega una pantalla de administración del registro completo
(modal nuevo `#modal-admin-registro`, accesible desde Config) que permite ver, editar el nombre de
presentación, y borrar cualquier entrada, con el historial visible como detalle expandible de solo
lectura (research.md §5-§6, contracts/admin-registro-contract.md). El hallazgo técnico central
(research.md §2) es que el punto donde el historial debe agregarse NO es donde spec 003 actualiza
nombre/`ultimoUso` (`confirmarJugadores()`, que ocurre antes de que exista asignación de equipo)
sino `confirmarEquipos()`, la transición donde `estado.jugadores[i].equipo` ya está definitivamente
fijado — sin esto, cada entrada de historial se crearía con equipo vacío. Editar o borrar una
entrada del registro nunca toca `estado.jugadores`/`torneo_data`: la independencia entre `jugador`
(registro) y `jugador_en_torneo`, ya cerrada por spec 003, es la garantía que hace seguro borrar un
jugador que está en el roster de un torneo activo (research.md §8,
contracts/admin-registro-contract.md Garantía 4-5). `motor.js` y `competiciones.js` no cambian
(verificado, research.md §4 / SC-004) — `competiciones.js` solo se lee para resolver el nombre de
competición al armar una entrada de historial.

## Technical Context

**Language/Version**: JavaScript ES6+ (vanilla, sin transpilar), HTML5, CSS3 — sin cambios respecto
a specs 001-004.

**Primary Dependencies**: Tailwind CSS vía CDN, Font Awesome 6 vía CDN, Google Fonts — sin
dependencias nuevas.

**Storage**: `localStorage`. Extiende la clave existente `jugadores_conocidos` (spec 003) con un
campo nuevo por entrada, `historial` (array de `{ equipo, competicion, fecha }`, ver
data-model.md). No se toca `torneo_data`/`version: 2` ni se introduce clave nueva — sigue habiendo
exactamente dos claves de `localStorage` en total (Principio V/D1 intactos).

**Testing**: Sin framework de tests automatizados (Principio I). Validación manual vía
`quickstart.md`. La verificación de "`motor.js`/`competiciones.js` no cambian" (SC-004) se hace por
diff de git, no por test.

**Target Platform**: Igual que specs 001-004 — navegadores modernos de escritorio y Chrome
Android/Safari iOS 15+, servido vía `file://` o GitHub Pages. Sin uso de `color-mix()` ni ninguna
otra feature CSS nueva en esta spec.

**Project Type**: Single-page app estática de 3(+) archivos, sin backend — sin cambios de
estructura.

**Performance Goals**: Sin metas nuevas — `historial` agrega como mucho un array corto por entrada
(uno por torneo jugado, volumen entre amigos, ver spec.md Assumptions); ni la escritura en
`confirmarEquipos()` ni la lectura al abrir el modal de administración son operaciones con impacto
medible.

**Constraints**: Mismas que specs 001-004 (Principio I: sin backend/build tools; Principio II:
motor agnóstico de competición y de este registro — verificado sin excepciones en research.md §4).
Es transversal a competiciones (spec.md FR-011): no vive en `COMPETICIONES` ni en
`competiciones.js` (que solo se lee, nunca se modifica, research.md §3).

**Scale/Scope**: Un campo nuevo en un esquema de datos ya existente, una función nueva enganchada en
un punto ya existente del flujo (`confirmarEquipos()`), y un modal nuevo accesible desde una screen
ya existente (`screen-config`) — sin pantallas nuevas de router (`estado.fase` no gana ningún valor
nuevo, research.md §5).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio / Decisión | Evaluación |
|---|---|
| I. Sin backend, sin build tools | PASS — solo extiende una clave de `localStorage` ya existente y agrega un modal siguiendo el patrón ya usado (`modal-overlay`/`modal-box`). Ninguna dependencia nueva. |
| II. Motor desacoplado de tema/competición | PASS — verificado por grep de `historial`/`jugadores_conocidos` contra `motor.js` (research.md §4): cero resultados, cero cambios a `motor.js` en esta spec. |
| III. Spec-driven | PASS — este plan deriva de `spec.md`, que ya resolvió como "Decisiones de diseño" todos los puntos que el pedido original dejaba abiertos (qué guarda el historial, dónde se muestra, mecanismo de actualización, efecto de borrar/editar sobre torneos ya confirmados, colisión de nombres). |
| IV. Formato como configuración | N/A — esta spec no toca formato de torneo. |
| V. Un torneo activo, global | PASS — sin cambios; `jugadores_conocidos` sigue siendo una clave completamente separada de `torneo_data`, extendida con un campo, no un segundo mecanismo de estado. |
| VI. Compatibilidad Impeccable/Kowalski | PASS — el modal nuevo reutiliza el esqueleto ya establecido (`modal-overlay`/`modal-box`, cierre por X y por clic fuera, `mostrarConfirm()` genérico para el borrado) — sin animación nueva que inventar más allá de la apertura/cierre de modal ya existente y su respeto a `prefers-reduced-motion`. |
| D1 (torneo activo global) | PASS — sin cambios de mecanismo; administrar el registro no crea un segundo torneo ni una ruta alterna a `screen-competicion`, y es alcanzable independientemente de si hay torneo activo (contrato admin-registro-contract.md Garantía 1). |
| D2 (mismo mecanismo de asignación de equipo) | N/A — el historial se registra después de que D2 ya asignó el equipo (research.md §2); no cambia cómo se asigna, solo cuándo se persiste ese dato en el registro. |
| D3 (formato personalizable con default por competición) | N/A — sin relación con formato. |
| D4 (pool de jugadores reutilizable) | PASS — esta spec extiende D4 (implementada en spec 003) cerrando los dos puntos que spec 003 dejó como deuda conocida explícita (historial de equipos, pantalla de administración), sin reabrir ninguna decisión ya cerrada de esa spec (dedup por nombre, actualización automática de nombre/ultimoUso). |

Sin violaciones. No se requiere Complexity Tracking.

**Re-chequeo post-diseño (tras Phase 1)**: `data-model.md` confirma que `historial` vive
exclusivamente dentro de `jugadores_conocidos`, sin agregar campos a `estado` ni a
`COMPETICIONES[id]` (Principio II/D4 intactos). `contracts/historial-equipos-contract.md` confirma
que el enganche en `confirmarEquipos()` no cambia el contrato de esa función más allá de una línea
final, y que `competiciones.js` solo se lee (Garantía 5-6). `contracts/admin-registro-contract.md`
confirma que ninguna operación de edición/borrado del registro escribe en `torneo_data` (Garantía
4-5) — D1 y la independencia `jugador`/`jugador_en_torneo` de spec 003 quedan intactas. Gate se
mantiene en PASS, sin cambios respecto al chequeo inicial.

## Project Structure

### Documentation (this feature)

```text
specs/005-administracion-registro-jugadores/
├── plan.md              # Este archivo
├── research.md          # Phase 0 — momento real de "torneo confirmado" para historial (§2,
│                         #   hallazgo crítico: confirmarEquipos(), no confirmarJugadores()),
│                         #   origen del nombre de competición (§3), verificación motor.js/
│                         #   competiciones.js sin cambios (§4), patrón de modal a reutilizar (§5),
│                         #   edición inline y detalle expandible (§6), colisión de nombres al
│                         #   editar (§7), independencia frente a torneo activo al borrar (§8),
│                         #   tolerancia de entradas sin historial (§9)
├── data-model.md         # Phase 1 — campo `historial`/entidad EntradaHistorial, ciclo de vida de
│                         #   historial y de edición/borrado, funciones nuevas/editadas en app.js
├── quickstart.md         # Phase 1 — guía de validación manual (6 escenarios)
├── contracts/
│   ├── historial-equipos-contract.md   # NUEVO — garantías del enganche en confirmarEquipos()
│   └── admin-registro-contract.md      # NUEVO — garantías de la pantalla de administración
└── tasks.md              # Phase 2 — generado por /speckit-tasks (no por este comando)
```

`contracts/registro-jugadores-schema.md` y `contracts/setup-import-contract.md` de spec 003 siguen
vigentes sin cambios — esta spec no modifica el flujo de importación de spec 003 ni el esquema base
de `nombreNormalizado`/`nombre`/`ultimoUso`, solo lo extiende (research.md §1).

### Source Code (repository root)

```text
index.html          # screen-config (líneas ~454-467, junto a "Datos del torneo"): agrega un botón
                      #   nuevo "Administrar registro de jugadores" (siempre visible, contrato
                      #   admin-registro-contract.md Garantía 1). Nuevo modal
                      #   #modal-admin-registro (mismo esqueleto que los modales existentes, ver
                      #   index.html:600-610 modal-importar-jugadores como referencia más cercana),
                      #   con lista de filas (nombre + botones editar/borrar/expandir) y bloque de
                      #   historial expandible por fila.
motor.js             # SIN CAMBIOS (verificado, research.md §4 / SC-004).
competiciones.js     # SIN CAMBIOS — solo se lee COMPETICIONES[id].nombre desde app.js, ya expuesto
                      #   (research.md §3); el historial es transversal a competiciones (spec.md
                      #   FR-011), no vive en COMPETICIONES.
app.js               # Nuevas funciones: agregarHistorialEquipos, abrirModalAdminRegistro,
                      #   cerrarModalAdminRegistro, toggleHistorialAdminRegistro,
                      #   iniciarEdicionNombreRegistro, guardarEdicionNombreRegistro,
                      #   borrarEntradaRegistro (data-model.md, tabla de funciones nuevas).
                      #   Edición puntual: confirmarEquipos() (app.js:719) gana una línea final que
                      #   llama a agregarHistorialEquipos(estado.jugadores,
                      #   COMPETICIONES[estado.competicion].nombre) antes de mostrarPantalla(...).
                      #   Wiring de eventos del nuevo botón/modal junto al resto de listeners de
                      #   screen-config (junto a app.js:2285, mismo bloque donde ya se conecta
                      #   btn-reiniciar), reutilizando mostrarConfirm() (app.js:308) para el
                      #   borrado.
styles.css           # Estilos puntuales para filas editables y bloque de historial expandible
                      #   (reutiliza clases ya existentes de modal-box/clasificado-row donde
                      #   alcance; solo agrega lo que no exista, ej. estado de fila en modo edición,
                      #   touch target ≥44px en botones de fila).
```

No hay `tests/` — mismo motivo que specs 001-004 (Principio I / Technical Context). Validación
manual vía `quickstart.md`.

**Structure Decision**: Se mantiene la separación de 3 archivos ya establecida (`motor.js` /
`competiciones.js` / `app.js`). Esta spec no agrega archivos nuevos ni cambia el orden de carga de
`<script>` — todo el trabajo cae dentro de `app.js` (persistencia + UI de administración) e
`index.html` (markup del botón + modal nuevo en `screen-config`), con CSS puntual en `styles.css`.
No se introduce un valor nuevo de `estado.fase` (research.md §5) — la pantalla de administración es
un modal, no una screen de router, manteniendo el mismo patrón arquitectónico que la importación de
spec 003. `competiciones.js` y `motor.js` quedan intactos, reforzando que tanto el historial como
la administración del registro son transversales y no una propiedad de competición ni del motor.

## Complexity Tracking

*Sin violaciones de la constitución — tabla no aplica.*
