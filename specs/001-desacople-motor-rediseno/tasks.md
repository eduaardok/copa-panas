---

description: "Task list for Desacople de motor y rediseño visual (Copa Panas v2)"
---

# Tasks: Desacople de motor y rediseño visual (Copa Panas v2)

**Input**: Design documents from `/specs/001-desacople-motor-rediseno/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md (todos presentes)

**Tests**: No se generan tareas de test automatizado — el proyecto no usa framework de tests
(Principio I / Technical Context en plan.md). La validación es manual vía `quickstart.md`,
referenciada explícitamente en las tareas correspondientes.

**Organization**: Tareas agrupadas por user story (spec.md) para permitir implementación y
prueba independiente de cada una.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Puede ejecutarse en paralelo (archivos distintos, sin dependencias)
- **[Story]**: A qué user story pertenece (US1, US2, US3) — ausente en Setup/Foundational/Polish
- Cada tarea incluye ruta de archivo exacta

## Path Conventions

Proyecto de archivo único (sin `src/`/`tests/`) — ver plan.md § Project Structure:
`index.html`, `motor.js` (nuevo), `competiciones.js` (nuevo), `app.js`, `styles.css`, en la raíz
del repo.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Preparar los archivos nuevos y su carga, sin build tools.

- [x] T001 Crear `motor.js` vacío en la raíz del repo, con comentario de cabecera (estilo igual al
  de `app.js:1-4`) indicando que este archivo NO debe referenciar competición, tema ni pools de
  equipos (Principio II)
- [x] T002 [P] Crear `competiciones.js` vacío en la raíz del repo, con comentario de cabecera
  indicando que es el único punto de configuración por competición
- [x] T003 En `index.html`, agregar `<script src="./motor.js"></script>` y
  `<script src="./competiciones.js"></script>` justo antes del `<script src="./app.js">`
  existente, en ese orden (motor → competiciones → app)

**Checkpoint**: Los tres archivos cargan en orden correcto sin romper la app actual (sigue
funcionando igual que antes, todavía sin contenido nuevo).

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Motor desacoplado + configuración de competición completa. Ninguna user story puede
implementarse ni probarse de forma realista sin esto — la pantalla de selección de competición
(US1) necesita `COMPETICIONES` completo, y la validación de no-regresión (US2) necesita el motor
ya parametrizado.

**⚠️ CRITICAL**: No iniciar Phase 3+ hasta completar esta fase.

**⚠️ SECUENCIA OBLIGATORIA**: T004 y T005 (auditoría de strings + actualización del contrato)
deben completarse **antes** de dar T011 (`competiciones.js` con `COMPETICIONES.mundial`
completo) por terminada. No cerrar T011 con un objeto `textos` parcial "para completar después" —
el riesgo es que algún string quede hardcodeado en `app.js` sin que nadie lo note.

- [x] T004 Auditar `app.js` e `index.html` con grep (ej.
  `grep -inE "FC ?26|Mundial|Asignando equipos|SORTEO|Torneo FC"`) para encontrar **todos** los
  strings de UI hardcodeados específicos de Mundial más allá de los 3 ya listados en
  `specs/001-desacople-motor-rediseno/contracts/competition-config-schema.md`
  (`tituloSorteoEquipos`, `subtituloSorteoEquipos`, `nombreExportDefault`) — incluir como mínimo:
  textos del modal de sorteo de grupos (`mostrarModalSorteo`, título/subtítulo "REALIZANDO
  SORTEO"/"SORTEO COMPLETADO"), mensajes de la pantalla de campeón, título/subtítulo por defecto
  del header (`'TORNEO FC 26'`), nombre por defecto usado en `copiarResumen()`
  (`'Torneo FC 26'`, app.js:1638), texto del botón/label "Elige cómo asignar los equipos de FC 26"
  e "Sortear equipos" (index.html:160,176), y cualquier otro string que mencione "FC 26"/"Mundial"
  encontrado por el grep. Documentar el inventario completo (string actual → nombre de campo
  propuesto) como referencia para T005 y T011
- [x] T005 Actualizar `specs/001-desacople-motor-rediseno/contracts/competition-config-schema.md`:
  ampliar el bloque `textos: { ... }` del esquema para listar **todos** los campos finales
  encontrados en T004 (no solo los 3 iniciales), y actualizar la sección "Instancia para esta spec
  (Mundial)" con el mapeo completo string-actual → campo. Depende de T004
- [x] T006 [P] Mover `calcularPosiciones` y `calcularClasificadosGeneral` a `motor.js` tal cual
  (ya son agnósticas de competición según research.md §4 verificado en sesión de plan) —
  eliminarlas de `app.js`, per `contracts/motor-api.md`
- [x] T007 Mover y parametrizar `generarCalendarioGrupos(jugadoresIds, formatoGrupos)` en
  `motor.js`: si `formatoGrupos === 'ida_vuelta'`, generar el segundo set de partidos (vuelta)
  con local/visitante invertidos y `vuelta: true`, per research.md §5 y `contracts/motor-api.md`.
  Depende de T001
- [x] T008 Mover y parametrizar `generarPartidosEliminacion(cruces, ronda, formatoEliminacion)`
  en `motor.js`: crear 1 partido por cruce (`leg: 1`) si `'unico'`, o 2 (`leg: 1`/`leg: 2`,
  local/visitante invertidos en el leg 2) si `'ida_vuelta'`, per research.md §5. Depende de T001
- [x] T009 Mover y reescribir `avanzarEliminacion(cruces, partidosDeRonda, configFormato)` en
  `motor.js`: calcular ganador por marcador agregado cuando hay 2 legs; si hay empate agregado,
  aplicar los criterios de desempate del motor (diferencia de gol → goles a favor → resultado
  directo); si persiste el empate exacto y `configFormato.penales === true`, pedir penales
  (`desempateGanadorId`/`desempateTipo:'penales'`); si `configFormato.penales === false`, devolver
  el cruce en `crucesPendientes` en vez de forzar penales, per `contracts/motor-api.md`. Depende
  de T008
- [x] T010 [P] Mover `NOMBRES_RONDAS` a `motor.js` como función `nombreDeRonda(totalEquipos)`
  (misma tabla de valores, fallback `Ronda ${n}`), per research.md §7. Depende de T001
- [x] T011 Construir `COMPETICIONES.mundial` completo en `competiciones.js`: `poolEquipos` (copiado
  de `EQUIPOS_POOL`, app.js:13-17), `paletaCSS` (`--red`/`--blue`/`--green`/`--gold` con los
  valores actuales de `:root`), `textos` completo (usando el inventario finalizado en T005),
  `formatoDefault: { grupos: 'unico', eliminacion: 'unico', penales: true }`, per
  `contracts/competition-config-schema.md`. **Depende de T002, T004 y T005** — no cerrar esta
  tarea si `textos` no refleja el inventario completo de T005
- [x] T012 En `app.js`, agregar `version: 2`, `competicion: null` y `configFormato: null` a
  `crearEstadoVacio()`, per data-model.md
- [x] T013 Implementar `migrarEstado(datos)` en `app.js` per research.md §3 (si `datos.version` es
  `undefined`, inyectar `competicion: 'mundial'` y
  `configFormato: {grupos:'unico', eliminacion:'unico', penales:true}`, fijar `version: 2`) y
  usarla tanto en `cargar()` (app.js:76-88) como en `importarJSON()` (app.js:1620-1635),
  corrigiendo de paso el merge superficial de `meta` que hoy solo hace `cargar()`. Depende de T012
- [x] T014 Reemplazar las 4 referencias directas a `EQUIPOS_POOL` en `app.js`
  (`renderizarAsignacionEquipos` app.js:378/405, `mostrarAnimacionSorteoEquipos` app.js:424,
  `confirmarEquipos` app.js:481) por `COMPETICIONES[estado.competicion].poolEquipos`. Depende de
  T011
- [x] T015 Reemplazar las clases Tailwind `wc-red`/`wc-blue`/`wc-green` y los usos hardcodeados de
  paleta por las variables CSS `--red`/`--blue`/`--green`/`--gold` aplicadas vía
  `COMPETICIONES[id].paletaCSS` (research.md §4); quitar las entradas `wc-*` de
  `tailwind.config` en `index.html:24-31`. Depende de T011
- [x] T016 Actualizar `guardarResultado`/`abrirModalResultado` en `app.js` (app.js:1043-1126) para
  leer `estado.configFormato.penales` en vez de derivar el pedido de penales solo del string
  `tipo === 'eliminacion'`, e implementar el selector manual de desempate ("Empate sin definir —
  elegí quién avanza") para el caso `penales: false` + empate persistente, per
  `contracts/motor-api.md`. Depende de T009, T012
- [x] T016a Extender el selector manual de desempate para que esté disponible en **cualquier**
  partido de eliminación con resultado empatado, sin importar `configFormato.penales` — no solo
  como fallback de `penales:false` (T016). Con `penales:true`, `actualizarSeccionDesempate()` en
  `app.js` debe mostrar los botones de penales **y**, además, una opción visible para definir
  manualmente quién avanza (no oculta ni condicionada). `resolverCruce()` en `motor.js` no cambia
  — sigue resolviendo por `desempateGanadorId` sin importar cómo se cargó. Sin cambio de esquema
  en `desempateTipo` (sigue `'penales'` \| `'manual'` — ver data-model.md, razonamiento en
  research.md §5a). Ver Clarification "extensión del selector manual" en spec.md (FR-004a).
  Depende de T016
- [x] T017 Conectar los call sites de `generarPartidosEliminacion`/`avanzarEliminacion` en
  `app.js` para pasar `estado.configFormato`, y actualizar `renderizarMatchCard`/
  `renderizarEliminacion` (app.js:986-1016, 1377-1450) para mostrar leg 1/leg 2 y marcador
  agregado cuando `configFormato.eliminacion === 'ida_vuelta'`. Depende de T008, T009, T016
- [x] T018 Actualizar `renderizarFaseGrupos` (app.js:902-984) para agrupar/etiquetar partidos de
  ida y vuelta (campo `vuelta`) cuando `configFormato.grupos === 'ida_vuelta'`. Depende de T007

**Checkpoint**: `motor.js` queda desacoplado y verificable por grep (quickstart Escenario 6);
`competiciones.js` tiene el inventario completo de textos de Mundial; `configFormato` (incluyendo
ida/vuelta y penales configurables) funciona de punta a punta. Las tres user stories pueden
construirse sobre esta base.

---

## Phase 3: User Story 1 - Elegir competición antes de crear un torneo (Priority: P1) 🎯 MVP

**Goal**: Pantalla de selección de competición alcanzable solo sin torneo activo (D1), que lleva
a Mundial con el mismo flujo de setup de siempre.

**Independent Test**: Con `localStorage` vacío, abrir la app y verificar que aparece la pantalla
de selección de competición (no el setup directo); elegir Mundial y verificar que el setup
arranca igual que en v1 (quickstart.md Escenario 1).

### Implementation for User Story 1

- [x] T019 [US1] Agregar la pantalla `<section id="screen-competicion">` en `index.html`
  (estructura básica, antes de `screen-setup`), listando las competiciones disponibles — estilo
  mínimo funcional, el pulido visual llega en US3
- [x] T020 [US1] Implementar `inicializarSeleccionCompeticion()` en `app.js`: renderiza las
  opciones desde `COMPETICIONES`, y al elegir una fija `estado.competicion = id`,
  `estado.configFormato = {...COMPETICIONES[id].formatoDefault}`, guarda, y avanza a
  `screen-setup`. Depende de T011
- [x] T021 [US1] Actualizar `inicializar()` en `app.js` (app.js:1688-1709): cuando `cargar()`
  devuelve `false` (sin torneo activo), mostrar `screen-competicion` en vez de `screen-setup`
  directamente (FR-001/D1). Depende de T020
- [x] T022 [US1] Actualizar `irAFaseCorrecta()` (app.js:188-199) y cualquier navegación por
  URL/back para que `screen-competicion` nunca sea alcanzable mientras exista torneo activo —
  redirigir siempre a la pantalla de la fase actual (FR-002, edge case de navegación)
- [x] T023 [US1] Actualizar el handler de "Reiniciar torneo" en `screen-config` para que, tras
  `limpiarStorage()`, navegue a `screen-competicion` en vez de a `screen-setup` (D1)
- [x] T024 [US1] Aplicar `COMPETICIONES[id].paletaCSS` vía
  `document.documentElement.style.setProperty(...)` al elegir competición en T020, y también al
  cargar un torneo activo existente en `cargar()`, para que la paleta correcta esté siempre
  activa. Depende de T011, T013

**Checkpoint**: User Story 1 funcional y probable de forma independiente (quickstart Escenario 1).

- [x] T024a Agregar la UI faltante para editar `configFormato` antes de confirmar el torneo
  (FR-004/D3) — sección "Formato del torneo" en `screen-setup` (`index.html`): toggles
  grupos/eliminación (partido único / ida y vuelta) y switch de penales, poblados desde
  `estado.configFormato` en `inicializarSetup()` y leídos/persistidos en `confirmarJugadores()`
  (`app.js`). **No estaba en el desglose original de tasks.md** — T012-T018 cubrían
  `configFormato` como dato/motor pero ninguna tarea preveía la superficie de UI para editarlo;
  se detectó como gap real al intentar correr quickstart.md Escenario 3 en el navegador (no había
  forma de que un usuario real fijara `ida_vuelta`/`penales:false`) y se corrigió antes de seguir.

---

## Phase 4: User Story 2 - Completar un torneo Mundial de punta a punta tras el refactor (Priority: P1)

**Goal**: Garantía de no-regresión — el flujo completo de Mundial (incluyendo el nuevo
`configFormato`) produce los mismos resultados de negocio que v1.

**Independent Test**: Ejecutar un torneo completo de 8 jugadores end-to-end y verificar que cada
regla de negocio (desempates, avance de bracket, penales) da el mismo resultado que antes del
refactor (quickstart.md Escenario 2).

### Implementation for User Story 2

- [x] T025 [US2] Ejecutar quickstart.md Escenario 2 completo (torneo de 8 jugadores, formato por
  defecto) y corregir cualquier desvío de comportamiento encontrado respecto a la app
  pre-refactor. Depende de Phase 2 completa
- [x] T026 [US2] Verificar y corregir que `exportarJSON()`/`importarJSON()` incluyen
  `version`/`competicion`/`configFormato` en el round-trip (quickstart Escenario 2 paso 7, FR-007)
- [x] T027 [US2] Ejecutar quickstart.md Escenario 3 completo (`ida_vuelta` + `penales: false`) y
  corregir cualquier problema encontrado en los paths nuevos del motor (Phase 2)
- [x] T028 [US2] Ejecutar quickstart.md Escenario 4 completo (migración de datos v1) y corregir
  cualquier caso límite de migración encontrado
- [x] T029 [US2] Ejecutar quickstart.md Escenario 6 (verificación por grep del desacople de
  `motor.js`) y corregir cualquier referencia residual a competición encontrada — operacionaliza
  SC-006

**Checkpoint**: User Story 2 funcional y probable de forma independiente; no-regresión confirmada
y el nuevo `configFormato` funciona de punta a punta.

**Verificación real (no solo trace de código)**: Escenarios 1-4 de `quickstart.md` corridos con
Playwright + Chrome real (headless) contra `index.html` servido localmente — no solo inspección
de código. Encontró y forzó la corrección de un gap real: no existía UI para editar
`configFormato` (FR-004) antes de esta verificación; se agregó la sección "Formato del torneo" en
`screen-setup` (`index.html`, `inicializarSetup`/`confirmarJugadores` en `app.js`). Confirmado en
navegador: selección de competición y gating D1, tabla de posiciones con desempate por diferencia
de gol, penales en eliminación única, campeón + confetti, export/import con
`version`/`competicion`/`configFormato` intactos, ida/vuelta en grupos (12 partidos, 6+6) y en
eliminación (leg 1/leg 2, marcador agregado), selector manual de desempate con `penales:false`
(incluye el caso de re-invocar el avance del bracket tras la elección manual — confirmado que
genera la ronda siguiente correctamente), y migración silenciosa de datos v1
(`version`/`competicion`/`configFormato` inyectados, sin pérdida de datos). Cero errores de
consola en las cuatro corridas. Hallazgo pre-existente **no introducido por este refactor** (FR-006
exige preservar el comportamiento de v1 tal cual): los nombres de ronda intermedios del bracket
(`nombreDeRonda`, ya presente como `NOMBRES_RONDAS[n]` en v1) pueden mostrarse incorrectos mientras
el bracket todavía se está expandiendo, porque la fórmula `Math.pow(2, rondas.length - ronda)`
depende de cuántas rondas existen *hasta ahora*, no de la profundidad final del bracket — se
autocorrige una vez generada la ronda final. Queda documentado para una spec futura, no se tocó
aquí por ser comportamiento heredado idéntico a v1.

---

## Phase 5: User Story 3 - Percibir una identidad visual distinta y coherente (Priority: P2)

**Goal**: Rediseño visual responsive aplicado a las 9 pantallas, con animaciones con propósito y
respeto de `prefers-reduced-motion`.

**Independent Test**: Recorrer las 9 pantallas en mobile/tablet/desktop y verificar lenguaje
visual coherente, sin estilo previo remanente, y animaciones reducidas correctamente con
`prefers-reduced-motion` activo (quickstart.md Escenario 5).

### Implementation for User Story 3

- [x] T030 [P] [US3] Agregar guards `@media (prefers-reduced-motion: reduce)` a todas las
  animaciones/transiciones de `styles.css` (keyframes `slideInUp`, `spin-bombo`, `fadeIn`,
  `slideUp`, `pulse-glow`, `toastIn`, y transiciones de transform/opacity), per FR-011
- [x] T031 [P] [US3] Agregar guards `matchMedia('(prefers-reduced-motion: reduce)')` a las
  animaciones JS de `app.js` (`mostrarAnimacionSorteoEquipos`, `mostrarModalSorteo`,
  `lanzarConfetti`), reduciendo/desactivando el efecto decorativo sin perder el feedback de
  confirmación, per FR-011
- [x] T032 [US3] Definir breakpoints `sm`/`lg` en `styles.css` per research.md §6 y adaptar
  `#bottom-nav` para ocultarse desde `lg:` y ser reemplazado por navegación persistente no
  flotante en desktop
- [x] T033 [US3] Adaptar `renderizarFaseGrupos` (tabla de posiciones) y `renderizarEliminacion`
  (bracket) para usar layouts de múltiples columnas / mayor contexto simultáneo desde `lg:`, en
  vez del layout apilado mobile centrado en columna angosta (FR-010a)
- [x] T034 [US3] Aplicar el lenguaje visual rediseñado (cards, botones, tablas) a las 9 pantallas
  de FR-009 (selección de competición, setup, asignación de equipos, config. de grupos, fase de
  grupos, clasificados, eliminación, dashboard, config), usando las skills `impeccable`/
  `emil-design-eng` per CLAUDE.md, dentro de la paleta ya establecida (negro/rojo/azul/verde/
  dorado, FR-010)
- [x] T035 [US3] Verificar touch targets ≥44px en mobile y uso de `dvh` (no `vh`) en las 9
  pantallas rediseñadas (FR-010a, SC-007)
- [x] T036 [US3] Ejecutar quickstart.md Escenario 5 completo en los tres anchos de referencia y
  corregir cualquier problema responsive o de motion encontrado

**Checkpoint**: Las tres user stories funcionan de forma independiente y en conjunto.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Cierre de la feature — limpieza final y verificación cruzada contra la constitución.

- [x] T037 [P] Actualizar los comentarios de cabecera de `styles.css` y `app.js` para quitar el
  framing "FC 26"-específico ahora que la app está preparada multi-competición
- [x] T038 Correr los 6 escenarios completos de `quickstart.md` como pase de regresión final antes
  de cerrar la feature
- [x] T039 Correr `/speckit-analyze` contra la constitución antes de dar la tarea por terminada,
  per CLAUDE.md

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: sin dependencias — inicia de inmediato
- **Foundational (Phase 2)**: depende de Setup — bloquea las 3 user stories. **T011 depende
  explícitamente de T004+T005** (auditoría de strings antes de dar `competiciones.js` por
  completo)
- **User Stories (Phase 3-5)**: todas dependen de Foundational completo
  - US1 (P1) y US2 (P1) pueden avanzar en paralelo entre sí una vez completada Phase 2
  - US3 (P2) puede empezar en paralelo con US1/US2 en la parte de `prefers-reduced-motion`
    (T030/T031, no tocan pantallas específicas), pero T034 (aplicar el lenguaje visual a las 9
    pantallas) es más eficiente después de que US1 haya agregado `screen-competicion` (T019)
- **Polish (Phase 6)**: depende de que las 3 user stories estén completas

### User Story Dependencies

- **US1 (P1)**: depende solo de Foundational — sin dependencia de US2/US3
- **US2 (P1)**: depende solo de Foundational — sin dependencia de US1/US3 (usa el flujo de setup
  existente, no la pantalla nueva, para su prueba independiente si se ejecuta antes que US1;
  aunque en la práctica ambas P1 se completan juntas antes de pasar a US3)
- **US3 (P2)**: depende de Foundational; T034 depende funcionalmente de que T019 (pantalla de
  selección) exista para poder rediseñarla

### Parallel Opportunities

- T001/T002 en paralelo (archivos distintos)
- T006 y T010 en paralelo dentro de Foundational (no dependen entre sí)
- Dentro de US3: T030 y T031 en paralelo (archivos distintos: `styles.css` vs `app.js`)
- T037 en paralelo con T038/T039 en Polish

---

## Parallel Example: Foundational

```bash
# En paralelo, una vez creado motor.js (T001):
Task: "Mover calcularPosiciones/calcularClasificadosGeneral a motor.js"      # T006
Task: "Mover NOMBRES_RONDAS a motor.js como nombreDeRonda(totalEquipos)"     # T010
```

---

## Implementation Strategy

### MVP First (User Story 1 + User Story 2, ambas P1)

1. Completar Phase 1: Setup
2. Completar Phase 2: Foundational (CRÍTICO — incluye la auditoría de strings secuenciada antes
   de cerrar `competiciones.js`)
3. Completar Phase 3 (US1) y Phase 4 (US2)
4. **DETENER y VALIDAR**: correr quickstart.md Escenarios 1, 2, 3, 4, 6
5. Este es el MVP funcional — el motor está desacoplado y el flujo Mundial no tiene regresiones

### Incremental Delivery

1. Setup + Foundational → base lista, con `competiciones.js` auditado y completo
2. US1 + US2 → validar independientemente → demo del desacople funcionando
3. US3 → validar independientemente (quickstart Escenario 5) → demo del rediseño visual completo
4. Polish → regresión final + `/speckit-analyze`

---

## Notes

- [P] = archivos distintos, sin dependencias entre sí
- [Story] mapea cada tarea a su user story para trazabilidad
- La secuencia T004 → T005 → T011 es obligatoria: no se da `competiciones.js` por completo sin
  el inventario de strings ya auditado, tal como se pidió explícitamente antes de generar esta
  lista
- Confirmar después de cada tarea o grupo lógico de tareas
- Detenerse en cada checkpoint para validar la user story de forma independiente
