---

description: "Task list for Champions League (Copa Panas v2)"
---

# Tasks: Champions League (Copa Panas v2)

**Input**: Design documents from `/specs/002-champions-league/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md (todos
presentes y aprobados, incluidas las tres rondas de revisión de gaps: FR-004a/determinismo de
paleta, decisión del fondo/negro, y remediación de los 66 `rgba()` hardcodeados vía `color-mix()`)

**Tests**: No se generan tareas de test automatizado — el proyecto no usa framework de tests
(Principio I / Technical Context en plan.md). La validación es manual vía `quickstart.md`,
referenciada explícitamente en las tareas correspondientes.

**Organization**: Tareas agrupadas por user story (spec.md: US1 elegir Champions al crear un
torneo, US2 formato editable, US3 pulido de `screen-competicion`) para permitir implementación y
prueba independiente de cada una.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Puede ejecutarse en paralelo (archivos distintos, sin dependencias)
- **[Story]**: A qué user story pertenece (US1, US2, US3) — ausente en Setup/Foundational/Polish
- Cada tarea incluye ruta de archivo exacta

## Path Conventions

Mismo proyecto de archivo único que spec 001 (sin `src/`/`tests/`): `index.html`, `motor.js`,
`competiciones.js`, `app.js`, `styles.css`, en la raíz del repo. Esta spec no agrega archivos
nuevos (plan.md § Project Structure).

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirmar el estado base antes de tocar código — no hay archivos nuevos que crear
(la separación motor/competiciones/app ya existe desde spec 001).

- [X] T001 Confirmar que `git status` está limpio en `competiciones.js`, `app.js`, `styles.css`,
  `index.html` antes de empezar (línea base para verificar luego que `motor.js` no cambia, SC-002)
- [X] T002 [P] Correr `grep -cE "rgba\((201,168,76|224,24,45|0,82,200|0,166,78)" styles.css` y
  guardar el resultado (66, per research.md §7) como línea base para verificar el cierre de FR-010
  al final de Polish

**Checkpoint**: Línea base capturada — motor.js y el conteo de `rgba()` hardcodeados quedan como
referencia para las verificaciones finales.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: `COMPETICIONES.champions` completo + `aplicarPaletaCompeticion()` determinística.
Ninguna user story puede probarse de forma realista con una segunda competición real sin esto —
US1 necesita que Champions exista en `COMPETICIONES`, y las tres user stories dependen de que la
paleta se aplique correctamente sin importar el historial de la sesión (FR-004a).

**⚠️ CRITICAL**: No iniciar Phase 3+ hasta completar esta fase.

- [X] T003 En `competiciones.js`, agregar las constantes `VARIABLES_PALETA` (`['--red', '--blue',
  '--green', '--gold']`) y `FALLBACK_PALETA` (`{ '--green': '#00a64e' }`), fuera de
  `COMPETICIONES` — per data-model.md "Fallback de paleta" y research.md §1-2
- [X] T004 Reescribir `aplicarPaletaCompeticion(competicionId)` en `competiciones.js` para iterar
  `VARIABLES_PALETA` (no `Object.entries(comp.paletaCSS)`), aplicando
  `comp.paletaCSS[variable] ?? FALLBACK_PALETA[variable]` a `document.documentElement.style` para
  cada una — per `contracts/palette-application-contract.md` (garantías 1-3, FR-004a). Depende de
  T003. **No tocar los 3 call sites** (`app.js:226`, `1704`, `1778`) — el fix vive enteramente
  dentro de la función (research.md §1)
- [X] T005 Construir `COMPETICIONES.champions` completo en `competiciones.js`: `id: 'champions'`,
  `nombre: 'Champions League'`, `poolEquipos` (los 20 clubes de data-model.md/spec.md FR-003),
  `paletaCSS: { '--red': '#e63946', '--blue': '#0e1e5b', '--gold': '#c0c4cc' }` (sin `--green`,
  sin variable de fondo — per data-model.md "Decisión: el fondo no es parte de paletaCSS"),
  `textos` (las 6 claves ya usadas por Mundial, con los valores de
  `contracts/competition-config-schema.md` — "TORNEO CHAMPIONS", "Elige cómo asignar los clubes de
  {NOMBRE}", "SORTEANDO CLUBES", "Asignando clubes de {NOMBRE}...", `'champions'`, `'Torneo
  Champions'`), `formatoDefault: { grupos: 'ida_vuelta', eliminacion: 'ida_vuelta', penales: true }`
  (D3). Depende de T003
- [X] T006 [P] En `styles.css` (`:root`, líneas 9-20), reemplazar los valores hex/rgba fijos de
  `--red-dim`, `--blue-dim`, `--green-dim`, `--gold-dim`, `--gold-light` por fórmulas
  `color-mix(in srgb, var(--rol) X%, transparent)` con el mismo % de alpha que tenían — per
  `contracts/derived-tones-contract.md` y research.md §7. No depende de T003-T005 (archivo
  distinto, cambio de CSS puro)
- [X] T007 [P] En `styles.css`, reemplazar los 66 literales `rgba(201,168,76|224,24,45|0,82,200|
  0,166,78, alpha)` restantes (fuera de `:root`, ya cubiertos por T006) por
  `color-mix(in srgb, var(--rol) <alpha%>, transparent)` o por la variable `-dim`/`-light`
  correspondiente cuando el alpha coincida exactamente (evitar duplicar la misma fórmula) — per
  `contracts/derived-tones-contract.md`. Incluye explícitamente `.glow-gold` (`styles.css:1239-1241`)
  y el resto del bloque de la pantalla de campeón (`styles.css:1222-1246`). Depende de T006 (para
  reusar las variables `-dim`/`-light` ya corregidas donde el alpha coincida)
- [X] T008 Verificar con `grep -cE "rgba\((201,168,76|224,24,45|0,82,200|0,166,78)" styles.css` que
  el resultado es `0` (FR-010, contrato `derived-tones-contract.md`). Depende de T006, T007

**Checkpoint**: `COMPETICIONES` tiene dos competiciones completas y coherentes; la paleta se aplica
de forma determinística sin importar el historial de la sesión; toda la superficie visual (sólida
y translúcida) responde a `--red/--blue/--green/--gold`. Las tres user stories pueden construirse
sobre esta base.

---

## Phase 3: User Story 1 - Elegir Champions League al crear un torneo (Priority: P1) 🎯 MVP

**Goal**: Con `COMPETICIONES.champions` ya completo (Foundational), un usuario puede elegirla
desde `screen-competicion` y completar un torneo end-to-end con el pool, paleta y textos correctos.

**Independent Test**: Con `localStorage` vacío, elegir Champions League, asignar equipos desde el
pool de 20 clubes, y verificar que toda pantalla del flujo (incluida la de campeón) refleja la
paleta de Champions (quickstart.md Escenario 1).

### Implementation for User Story 1

- [X] T009 [US1] Ejecutar quickstart.md Escenario 1 completo (pasos 1-7) contra la app real y
  corregir cualquier desvío encontrado — en particular, confirmar que
  `inicializarSeleccionCompeticion()` (app.js:203-218, ya genérica desde spec 001) lista ambas
  competiciones sin cambios de código, y que `COMPETICIONES[estado.competicion].poolEquipos`
  (app.js, ya parametrizado desde spec 001) sirve los 20 clubes de Champions correctamente al
  elegirla. Depende de Phase 2 completa
- [X] T010 [US1] Verificar específicamente el edge case de spec.md ("¿qué referencia visual usa la
  pantalla de campeón para Champions?") — confirmar en navegador que `#dashboard-campeon`
  (index.html:403-411, ya genérico: "CAMPEÓN" + nombre + equipo dinámicos, sin texto fijo de
  Mundial) muestra el glow y el texto en plata de Champions tras T007. Depende de T009

**Checkpoint**: User Story 1 funcional y probable de forma independiente (quickstart Escenario 1).

---

## Phase 4: User Story 2 - Formato de Champions editable (Priority: P2)

**Goal**: El formato sugerido de Champions (ida/vuelta en grupos y eliminación, D3) es editable
antes de confirmar el torneo, con el mismo mecanismo genérico ya usado por Mundial (Principio IV).

**Independent Test**: Elegir Champions, cambiar el formato sugerido antes de confirmar, y verificar
que el torneo resultante respeta la elección del usuario, no el default (quickstart.md Escenario 2).

### Implementation for User Story 2

- [X] T011 [US2] Ejecutar quickstart.md Escenario 2 completo contra la app real — confirmar que la
  sección "Formato del torneo" de `screen-setup` (ya existente desde spec 001, T024a) se puebla
  correctamente con `COMPETICIONES.champions.formatoDefault` (`ida_vuelta`/`ida_vuelta`/`true`) al
  elegir Champions, es editable, y que el torneo se genera con el formato que el usuario confirmó,
  sin ninguna rama `if competicion === 'champions'` en `app.js` ni en `motor.js`. Depende de
  Phase 2 completa
- [X] T012 [US2] Corregir cualquier desvío encontrado en T011 — si `formatoDefault` no se lee
  correctamente para Champions, el bug está en cómo `app.js` consume `COMPETICIONES[id]
  .formatoDefault` (mecanismo genérico ya usado por Mundial, T020 de spec 001), nunca agregando un
  caso especial por nombre de competición

**Checkpoint**: User Story 2 funcional y probable de forma independiente (quickstart Escenario 2).

---

## Phase 5: User Story 3 - Pantalla de selección de competición con 2+ opciones (Priority: P2)

**Goal**: `screen-competicion` presenta Mundial y Champions con igual jerarquía visual, cada una
identificable por su propia paleta, aprovechando el ancho disponible en desktop.

**Independent Test**: Con las dos competiciones registradas, abrir `screen-competicion` en mobile,
tablet y desktop, y verificar layout + acento por tarjeta (quickstart.md Escenario 3).

### Implementation for User Story 3

- [X] T013 [US3] En `app.js`, actualizar `inicializarSeleccionCompeticion()` (app.js:203-218) para
  que cada `btn.competicion-card` reciba un estilo inline con una custom property local (ej.
  `--card-accent`) leída directamente de `comp.paletaCSS['--gold'] ?? FALLBACK_PALETA['--gold']`,
  en vez de depender de `var(--gold)` global — per research.md §5 punto 2. Quitar la clase fija
  `text-gold` del ícono (`app.js:212`) y aplicar el color vía la custom property local
  (`style="color: var(--card-accent)"` en el `<i>`). Depende de T003 (usa `FALLBACK_PALETA`)
- [X] T014 [P] [US3] En `styles.css`, actualizar `.competicion-card:hover` /
  `.competicion-card:focus-visible` (styles.css:378-383) para usar `border-color:
  var(--card-accent)` / `background: color-mix(in srgb, var(--card-accent) 8%, transparent)` en
  vez de `var(--gold)` fijo — coherente con T007/T013. No depende de T013 (archivo distinto), pero
  ambas deben cerrarse juntas para que el efecto sea visible
- [X] T015 [P] [US3] En `styles.css`, agregar una regla `@media (min-width: 640px)` para
  `#lista-competiciones` que la convierta en grid de 2 columnas cuando haya 2+ tarjetas
  (`display: grid; grid-template-columns: repeat(2, 1fr); gap: ...`), reemplazando el apilado
  vertical de `space-y-3` (index.html:75) en ese breakpoint — per research.md §5 punto 1. Archivo
  distinto de T013, puede avanzar en paralelo
- [X] T016 [US3] Ejecutar quickstart.md Escenario 3 completo (mobile/tablet/desktop, hover/focus
  por teclado) y corregir cualquier problema visual encontrado. Depende de T013, T014, T015

**Checkpoint**: Las tres user stories funcionan de forma independiente y en conjunto.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Cierre de la feature — verificaciones finales que cruzan las tres user stories.

- [X] T017 [P] Verificar por grep que `motor.js` no cambió una sola línea respecto a la línea base
  de T001 (`git diff --stat motor.js` vacío) — operacionaliza SC-002/FR-006, análogo a T029 de
  spec 001
- [X] T018 [P] Correr `grep -inE "mundial|champions|fc ?26|EQUIPOS_POOL|COMPETICIONES" motor.js`
  y confirmar 0 resultados fuera del comentario de cabecera que documenta la regla — re-verifica
  Principio II tras el resto de las tareas (research.md §4)
- [X] T019 Ejecutar quickstart.md Escenario 4 completo (determinismo de paleta sin recargar
  página) con navegador real — no solo trace de código. Escenario específico: crear/activar un
  torneo Mundial, sin recargar la página usar "Importar JSON" con un archivo de un torneo
  **Champions**, y confirmar en DevTools (Elements → Styles de `<html>`, o
  `getComputedStyle(document.documentElement).getPropertyValue('--green')`) que las 4 variables
  quedan en el valor de Champions/fallback documentado — en particular que `--green` no arrastra
  ningún estado del torneo Mundial anterior. Repetir en el sentido inverso (Champions activo →
  importar Mundial). Corregir cualquier desvío encontrado. Depende de T004
- [X] T020 Correr los 4 escenarios completos de `quickstart.md` de punta a punta (1-4) con
  navegador real (Chrome real, headless o interactivo — mismo estándar que spec 001 T025-T029) en
  los tres anchos de referencia (mobile/tablet/desktop), como pase de regresión final antes de
  cerrar la feature. Documentar cualquier hallazgo y su resolución (o, si es un hallazgo
  pre-existente no introducido por esta spec, documentarlo igual que spec 001 hizo con
  `nombreDeRonda`, sin corregirlo fuera de alcance). Depende de T009, T010, T011, T012, T016, T019
- [X] T021 Correr `/speckit-analyze` contra la constitución antes de dar la tarea por terminada,
  per CLAUDE.md

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: sin dependencias — inicia de inmediato
- **Foundational (Phase 2)**: depende de Setup — bloquea las 3 user stories. Dentro de esta fase:
  T004 depende de T003; T005 depende de T003; T007 depende de T006; T008 depende de T006 y T007
- **User Stories (Phase 3-5)**: todas dependen de Foundational completo
  - US1 (P1) puede avanzar primero — es el MVP
  - US2 (P2) y US3 (P2) pueden avanzar en paralelo entre sí y con US1 una vez completada Phase 2,
    ya que tocan superficies distintas (US2: lectura de `formatoDefault` ya genérica; US3:
    `screen-competicion`)
- **Polish (Phase 6)**: depende de que las 3 user stories estén completas (T020 depende
  explícitamente de T009, T010, T011, T012, T016, T019)

### User Story Dependencies

- **US1 (P1)**: depende solo de Foundational — sin dependencia de US2/US3
- **US2 (P2)**: depende solo de Foundational — reutiliza la UI de formato ya construida por
  spec 001 (T024a), sin código nuevo propio más allá de la verificación
- **US3 (P2)**: depende de Foundational (T013 usa `FALLBACK_PALETA` de T003); sin dependencia de
  US1/US2 más allá de que ambas competiciones ya existan en `COMPETICIONES`

### Parallel Opportunities

- T001/T002 en paralelo dentro de Setup
- T006 puede iniciar en paralelo con T003-T005 dentro de Foundational (archivo distinto:
  `styles.css` vs `competiciones.js`); T007 depende de T006
- Dentro de US3: T014 y T015 en paralelo (ambas en `styles.css` pero reglas independientes;
  cuidado con conflictos de merge si se editan simultáneamente el mismo archivo — coordinar orden
  de commit aunque el trabajo se piense en paralelo)
- T017 y T018 en paralelo en Polish (ambas son verificaciones de solo lectura sobre `motor.js`)

---

## Parallel Example: Foundational

```bash
# En paralelo, apenas se define VARIABLES_PALETA/FALLBACK_PALETA (T003):
Task: "Reescribir aplicarPaletaCompeticion() para iterar VARIABLES_PALETA"      # T004
Task: "Construir COMPETICIONES.champions completo"                              # T005

# En paralelo con lo anterior (archivo distinto):
Task: "Reemplazar --red-dim/--blue-dim/--green-dim/--gold-dim/--gold-light por color-mix()"  # T006
```

---

## Implementation Strategy

### MVP First (User Story 1)

1. Completar Phase 1: Setup
2. Completar Phase 2: Foundational (CRÍTICO — incluye la remediación completa de `color-mix()`,
   sin la cual SC-004 no se cumple aunque US1 "funcione" superficialmente)
3. Completar Phase 3 (US1)
4. **DETENER y VALIDAR**: correr quickstart.md Escenario 1
5. Este es el MVP funcional — Champions League es elegible y su flujo completo refleja su propia
   identidad visual

### Incremental Delivery

1. Setup + Foundational → base lista, con paleta determinística y sin `rgba()` hardcodeados
2. US1 → validar independientemente (quickstart Escenario 1) → demo de Champions funcionando
3. US2 → validar independientemente (quickstart Escenario 2) → demo de formato editable
4. US3 → validar independientemente (quickstart Escenario 3) → demo de `screen-competicion` pulida
5. Polish → Escenario 4 (determinismo en vivo) + regresión final + `/speckit-analyze`

---

## Notes

- [P] = archivos distintos o reglas independientes sin dependencias entre sí
- [Story] mapea cada tarea a su user story para trazabilidad
- La secuencia T003 → T004/T005 y T006 → T007 → T008 es obligatoria dentro de Foundational — no
  se da la fase por completa sin que el grep de T008 devuelva 0
- T019 (Escenario 4 en navegador real) es la verificación que demuestra en vivo el fix de
  FR-004a — no basta con inspección de código, tal como se pidió explícitamente
- Confirmar después de cada tarea o grupo lógico de tareas
- Detenerse en cada checkpoint para validar la user story de forma independiente
