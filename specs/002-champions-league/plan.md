# Implementation Plan: Champions League (Copa Panas v2)

**Branch**: `002-champions-league` | **Date**: 2026-08-27 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/002-champions-league/spec.md`

## Summary

Agregar Champions League como segunda entrada de `COMPETICIONES` en `competiciones.js` (pool de 20
clubes, paleta negro/plata/azul UEFA, textos, formato sugerido ida/vuelta), sin tocar `motor.js`
(verificado por lectura completa + grep, research.md §4). Junto con eso, corregir un gap técnico
real que la propia spec expone al dejar de haber una única competición: `aplicarPaletaCompeticion()`
solo aplica `setProperty()` sobre las variables que la competición define, por lo que una variable
omitida (`--green` en Champions) puede quedar con el valor heredado de una competición cargada
antes en la misma sesión (import de JSON sin recargar página es el único call site real donde esto
ocurre — research.md §1). Se resuelve con un reset determinístico de las 4 variables conocidas más
un fallback documentado por variable (FR-004a). Se descarta explícitamente agregar una variable de
fondo/negro a la paleta por competición (el `#0a0e14` del clarify original de Champions no tiene
mecanismo de aplicación en `VARIABLES_PALETA` y no se implementa — decisión cerrada en spec.md,
sesión "revisión de gaps de plan.md"; el fondo sigue siendo global por tema, no por competición).
Se pule `screen-competicion` para que 2+ tarjetas se vean como opciones equivalentes (grid en
desktop, acento propio por tarjeta en vez de heredar `--gold` global) — la estructura de datos ya
soporta N competiciones sin cambios (`Object.values(COMPETICIONES)`, app.js:207), el gap es
puramente visual. Por último, se corrigen 66 literales `rgba()` hardcodeados en `styles.css` (más
5 variables `-dim`/`-light` de `:root`) que reproducen los valores exactos de Mundial y nunca
referencian `--red/--blue/--green/--gold` — sin esto, SC-004 no se cumple en la práctica pese a que
los colores sólidos ya estén correctos (glows, sombras y fondos translúcidos, incluida la pantalla
de campeón, se verían siempre con tono de Mundial). Se remedian con `color-mix()` sobre las
variables base (research.md §7) — CSS puro, con degradación aceptada y documentada en
Safari/iOS < 16.2 (pierden el efecto translúcido puntual, nunca un color incorrecto).

## Technical Context

**Language/Version**: JavaScript ES6+ (vanilla, sin transpilar), HTML5, CSS3 — sin cambios respecto
a spec 001.

**Primary Dependencies**: Tailwind CSS vía CDN, Font Awesome 6 vía CDN, Google Fonts — sin
dependencias nuevas.

**Storage**: `localStorage`, misma clave `torneo_data`, mismo `version: 2` (spec 001) — agregar
`COMPETICIONES.champions` no cambia el esquema de `estado` ni requiere migración nueva.

**Testing**: Sin framework de tests automatizados (Principio I). Validación manual vía
`quickstart.md`. La verificación de "motor.js no cambia" (SC-002) se hace por diff de git, no por
test.

**Target Platform**: Igual que spec 001 — navegadores modernos de escritorio y Chrome
Android/Safari iOS 15+, servido vía `file://` o GitHub Pages.

**Project Type**: Single-page app estática de 3(+) archivos, sin backend — sin cambios de
estructura.

**Performance Goals**: Sin metas nuevas — el cambio de `aplicarPaletaCompeticion()` sigue siendo
`O(4)` `setProperty()` calls, sin impacto medible.

**Constraints**: Mismas que spec 001 (Principio I: sin backend/build tools; Principio II: motor
agnóstico de competición — verificado sin excepciones en research.md §4). Nueva: uso de
`color-mix()` (CSS nativo) para los tonos derivados de paleta — sin soporte en Safari/iOS < 16.2,
degradación aceptada y documentada explícitamente (research.md §7, spec.md FR-010/SC-004) en vez
de descartar el mecanismo o re-testear contra iOS real.

**Scale/Scope**: 2 competiciones operativas (Mundial + Champions) sobre el modelo ya preparado para
N (spec 001); mismas 9+1 pantallas de flujo, sin pantallas nuevas — el único cambio de UI nuevo es
el pulido de `screen-competicion` (ya existía desde spec 001, T019).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio / Decisión | Evaluación |
|---|---|
| I. Sin backend, sin build tools | PASS — solo se agregan datos a `competiciones.js` existente y CSS/JS al mismo patrón sin bundler. Ninguna dependencia nueva. |
| II. Motor desacoplado de tema/competición | PASS — verificado por lectura completa de `motor.js` (270 líneas) + grep (research.md §4): 0 referencias a competición. Ningún cambio a `motor.js` en esta spec. |
| III. Spec-driven | PASS — este plan deriva de `spec.md` con ambas sesiones de clarify ya integradas (pool de clubes, D4 diferido, hex de paleta, alcance de `screen-competicion`, FR-004a, edge case de import). |
| IV. Formato como configuración | PASS — `COMPETICIONES.champions.formatoDefault` es un valor inicial editable, igual mecanismo que Mundial, sin rama `if competicion === 'champions'` en ningún lado. |
| V. Un torneo activo global | PASS — sin cambios; agregar una competición no toca el mecanismo de `torneo_data` único. |
| VI. Compatibilidad Impeccable/Kowalski | PASS — el pulido de `screen-competicion` (grid responsive, acento por tarjeta) reutiliza el mismo lenguaje visual y los breakpoints ya establecidos por spec 001 (`styles.css:1381,1390`), sin introducir animación nueva; `prefers-reduced-motion` ya cubierto por las reglas existentes de `.competicion-card` (`styles.css:391-394`). La remediación de los 66 `rgba()` (research.md §7) reafirma este principio en vez de tensionarlo — hace que el glow de la pantalla de campeón y demás acentos translúcidos respeten "coherencia visual entre pantallas y entre competiciones", que hoy no cumplen para Champions. |
| D1 (torneo activo global) | PASS — sin cambios de mecanismo; el edge case nuevo (Escenario 4 de quickstart) no introduce una segunda ruta a `screen-competicion`, solo corrige un caso de import JSON dentro del mismo torneo activo. |
| D2 (mismo mecanismo de asignación de equipo) | PASS — Champions usa `jugador.equipo` + los mismos dos modos (aleatorio/manual), solo cambia la fuente del pool (`COMPETICIONES.champions.poolEquipos`). |
| D3 (formato personalizable con default por competición) | PASS — Champions sugiere ida/vuelta en grupos y eliminación (ya cerrado en la constitución), editable siempre. |
| D4 (pool de jugadores reutilizable) | N/A — explícitamente diferido a spec futura (spec.md Assumptions, clarify Session 2026-08-27). |

Sin violaciones. No se requiere Complexity Tracking.

**Re-chequeo post-diseño (tras Phase 1)**: `data-model.md` confirma que `COMPETICIONES.champions`
reutiliza exactamente el shape ya cerrado por spec 001 (Principio II/IV intactos, sin campos
nuevos de esquema); `contracts/palette-application-contract.md` confirma que el fix de
`aplicarPaletaCompeticion()` vive enteramente en `competiciones.js` (0 referencias nuevas desde
`motor.js`, Principio II intacto) y que su alcance es determinismo de aplicación, no una decisión
de marca nueva (no reabre FR-004 del clarify). La remediación de los 66 `rgba()` (research.md §7,
data-model.md "Variables derivadas") es CSS puro sobre `styles.css` — no toca `motor.js`, no
agrega variables a `VARIABLES_PALETA`/`aplicarPaletaCompeticion()`, no introduce build tools
(Principio I intacto pese a ampliar el alcance de líneas tocadas). Gate se mantiene en PASS, sin
cambios respecto al chequeo inicial.

## Project Structure

### Documentation (this feature)

```text
specs/002-champions-league/
├── plan.md              # Este archivo
├── research.md          # Phase 0 — call sites de aplicarPaletaCompeticion(), fallback de
│                         #   --green, estructura de COMPETICIONES.champions, verificación
│                         #   motor.js, gap visual de screen-competicion, deuda de naming,
│                         #   66 rgba() hardcodeados + color-mix() (§7)
├── data-model.md         # Phase 1 — delta sobre data-model.md de spec 001: COMPETICIONES.champions,
│                         #   VARIABLES_PALETA/FALLBACK_PALETA
├── quickstart.md         # Phase 1 — guía de validación manual (4 escenarios)
├── contracts/
│   ├── competition-config-schema.md   # extiende el contrato de spec 001: paletaCSS puede omitir
│   │                                   #   claves + instancia Champions completa
│   ├── palette-application-contract.md  # NUEVO — garantías de determinismo de
│   │                                     #   aplicarPaletaCompeticion() (FR-004a)
│   └── derived-tones-contract.md        # NUEVO — remediación de los 66 rgba() vía
│                                         #   color-mix() (FR-010, research.md §7)
└── tasks.md              # Phase 2 — generado por /speckit-tasks (no por este comando)
```

`contracts/motor-api.md` de spec 001 sigue vigente sin cambios — no se duplica en esta carpeta
porque ninguna firma ni garantía de `motor.js` cambia (research.md §4).

### Source Code (repository root)

```text
index.html          # Sin pantallas nuevas. #lista-competiciones (screen-competicion) gana grid
                      #   responsive; sin cambios estructurales en el resto.
motor.js             # SIN CAMBIOS (verificado, research.md §4 / SC-002).
competiciones.js     # Se agrega COMPETICIONES.champions (pool, paleta, textos, formatoDefault),
                      #   más las constantes VARIABLES_PALETA y FALLBACK_PALETA, y se reescribe
                      #   aplicarPaletaCompeticion() para iterar VARIABLES_PALETA en vez de
                      #   Object.entries(comp.paletaCSS) (FR-004a).
app.js               # inicializarSeleccionCompeticion() (app.js:203-218): cada tarjeta pasa a
                      #   leer comp.paletaCSS directamente para su acento local (custom property
                      #   por tarjeta) en vez de depender de var(--gold) global. Sin cambios en
                      #   los 3 call sites de aplicarPaletaCompeticion() (app.js:226, 1704, 1778)
                      #   — el fix vive dentro de la función, no en sus llamadores (research.md §1).
styles.css           # .competicion-card gana una regla @media (min-width: 640px) para grid de
                      #   2 columnas, y el hover/focus pasa a usar la custom property local de
                      #   cada tarjeta en vez de var(--gold) fijo. Además: las 5 variables
                      #   -dim/-light de :root y los 66 literales rgba() hardcodeados pasan a
                      #   color-mix(in srgb, var(--rol) X%, transparent) (research.md §7).
```

No hay `tests/` — mismo motivo que spec 001 (Principio I / Technical Context). Validación manual
vía `quickstart.md`.

**Structure Decision**: Se mantiene la separación de 3 archivos ya establecida por spec 001
(`motor.js` / `competiciones.js` / `app.js`, cargados en orden vía `<script>` sin bundler). Esta
spec no agrega archivos nuevos — todo el trabajo cae dentro de `competiciones.js` (datos +
determinismo de paleta), `app.js` (una función existente ajustada) y `styles.css` (CSS nuevo para
`.competicion-card`), preservando exactamente el patrón arquitectónico que spec 001 dejó cerrado.

## Complexity Tracking

*Sin violaciones de la constitución — tabla no aplica.*
