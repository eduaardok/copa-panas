---

description: "Task list for Registro persistente de jugadores (Copa Panas v2)"
---

# Tasks: Registro persistente de jugadores (Copa Panas v2)

**Input**: Design documents from `/specs/003-registro-jugadores/`

**Prerequisites**: plan.md, spec.md, research.md (incluye §6a, wiring de validación en vivo en
filas creadas por el import), data-model.md, contracts/, quickstart.md (incluye Escenario 4b)

**Tests**: No se generan tareas de test automatizado — el proyecto no usa framework de tests
(Principio I / Technical Context en plan.md). La validación es manual vía `quickstart.md`,
referenciada explícitamente en las tareas correspondientes.

**Organization**: Tareas agrupadas por user story (spec.md: US1 reutilizar jugadores de torneos
anteriores, US2 primer uso sin fricción, US3 el registro crece automáticamente) para permitir
implementación y prueba independiente de cada una.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Puede ejecutarse en paralelo (archivos distintos, sin dependencias)
- **[Story]**: A qué user story pertenece (US1, US2, US3) — ausente en Setup/Foundational/Polish
- Cada tarea incluye ruta de archivo exacta

## Path Conventions

Mismo proyecto de archivo único que spec 001/002 (sin `src/`/`tests/`): `index.html`, `motor.js`,
`competiciones.js`, `app.js`, `styles.css`, en la raíz del repo. Esta spec no agrega archivos
nuevos (plan.md § Project Structure). `motor.js` y `competiciones.js` no se tocan en ninguna tarea.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirmar el estado base antes de tocar código — no hay archivos nuevos que crear.

- [X] T001 Confirmar que `git status` está limpio en `app.js`, `index.html`, `styles.css` antes de
  empezar, y guardar `git diff --stat motor.js` (debe estar vacío) como línea base para verificar
  luego que `motor.js` sigue sin cambios (SC-004/FR-009)

**Checkpoint**: Línea base capturada.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Capa de datos y funciones compartidas que las tres user stories necesitan: la clave
de `localStorage` nueva, la normalización de nombres única (research.md §2), la actualización
automática del registro al confirmar un torneo (research.md §7), y la extracción de la función
auxiliar de fila con su wiring de validación en vivo (research.md §6a) — sin esto, ninguna user
story puede probarse de forma realista sin duplicar lógica o romper validación existente.

**⚠️ CRITICAL**: No iniciar Phase 3+ hasta completar esta fase.

- [X] T002 En `app.js`, junto a `CLAVE_LS` (app.js:13), agregar la constante
  `CLAVE_LS_JUGADORES = 'jugadores_conocidos'` — per data-model.md
- [X] T003 [P] En `app.js`, implementar `normalizarNombreJugador(nombre)`: trim + colapso de
  espacios internos múltiples + minúsculas — única fuente de verdad para comparar nombres, per
  research.md §2 y data-model.md (tabla de funciones nuevas)
- [X] T004 [P] En `app.js`, implementar `cargarJugadoresConocidos()`: lee `CLAVE_LS_JUGADORES` con
  `try/catch` simétrico a `cargar()` (app.js:79-91), devuelve `[]` si la clave no existe, el JSON
  es inválido, o no es un array — nunca lanza (contracts/registro-jugadores-schema.md, garantía
  2). Depende de T002
- [X] T005 En `app.js`, implementar `guardarJugadoresConocidos(lista)`: `try/catch` simétrico a
  `guardar()` (app.js:71-77), reporta fallo con `mostrarToast(..., 'error')` sin romper el flujo
  de confirmación (contracts/registro-jugadores-schema.md, garantía 3). Depende de T002
- [X] T006 En `app.js`, extraer la construcción de una fila de `#lista-jugadores` a una función
  auxiliar (ej. `crearFilaJugador(index, nombreInicial)`) que devuelva/inserte el `<input>` **y**
  le adjunte `addEventListener('input', validarJugadores)` más el `keydown` de navegación por
  Enter (hoy en el `forEach` de app.js:326-336) — per research.md §6a, contrato implícito de
  "misma función auxiliar de fila, mismo wiring". Actualizar `renderizarListaJugadores()`
  (app.js:298-339) para usar esta función sin cambiar su comportamiento observable
- [X] T007 En `app.js`, actualizar `validarJugadores()` (app.js:341-361) para comparar nombres con
  `normalizarNombreJugador()` en vez de `val.toLowerCase()` suelto — endurece la detección de
  duplicados con espacios internos múltiples, sin cambiar el contrato de la función (sigue
  deshabilitando `#btn-confirmar-jugadores` si hay vacíos/duplicados). Depende de T003
- [X] T008 En `app.js`, implementar `actualizarRegistroJugadores(jugadoresDelRoster)`: por cada
  jugador, calcula `normalizarNombreJugador(jugador.nombre)`; si ya existe una entrada con ese
  `nombreNormalizado` en `jugadores_conocidos`, actualiza su `nombre` y `ultimoUso`; si no, agrega
  una entrada nueva `{ nombreNormalizado, nombre, ultimoUso: new Date().toISOString() }` — per
  data-model.md "Ciclo de vida". Depende de T003, T004, T005
- [X] T009 En `app.js`, en `confirmarJugadores()` (app.js:385-416), agregar la llamada
  `actualizarRegistroJugadores(estado.jugadores)` al final, después de `guardar()` — automática y
  silenciosa, sin toast propio (research.md §7, spec.md "Decisiones de diseño"). Depende de T008

**Checkpoint**: La clave `jugadores_conocidos` se crea y actualiza correctamente al confirmar
cualquier torneo, la normalización es consistente en un solo lugar, y la función auxiliar de fila
está lista para reutilizarse desde el import. Las tres user stories pueden construirse sobre esta
base.

---

## Phase 3: User Story 1 - Reutilizar jugadores de torneos anteriores (Priority: P1) 🎯 MVP

**Goal**: Desde `screen-setup`, un usuario con jugadores conocidos puede importarlos al roster del
torneo en curso en vez de re-tipear cada nombre, combinándolos libremente con alta manual.

**Independent Test**: Con `jugadores_conocidos` ya poblado, iniciar un torneo nuevo, importar
jugadores del registro, combinarlos con alta manual, y confirmar el torneo sin error ni duplicado
(quickstart.md Escenario 2).

### Implementation for User Story 1

- [X] T010 [US1] En `index.html`, junto al label "Jugadores" (index.html:170-173), agregar el
  botón "Importar del registro" (`#btn-importar-jugadores`), oculto por defecto (`class="hidden"`)
  — la visibilidad se controla desde `app.js`, no desde el HTML estático (contracts/setup-import-
  contract.md, garantía 1)
- [X] T011 [US1] En `index.html`, agregar el modal `#modal-importar-jugadores` siguiendo el mismo
  esqueleto que los modales existentes (`modal-overlay`/`modal-box`, `role="dialog" aria-
  modal="true"`, botón `.modal-close-btn`, ver index.html:497-576): contenedor de checkboxes
  (`#lista-importar-jugadores`) + botón "Agregar seleccionados" (`#btn-confirmar-import-
  jugadores`)
- [X] T012 [US1] En `app.js`, implementar `abrirModalImportarJugadores()` /
  `cerrarModalImportarJugadores()`: al abrir, renderiza un checkbox por cada entrada de
  `cargarJugadoresConocidos()` cuyo `nombreNormalizado` NO coincida con ningún `<input class="
  jugador-input">` ya no vacío del roster en edición (contracts/setup-import-contract.md, garantía
  4). Depende de T003, T004
- [X] T013 [US1] En `app.js`, implementar `importarJugadoresSeleccionados()` per research.md §6:
  1) escribe cada nombre seleccionado en el primer `<input class="jugador-input">` vacío
  existente; 2) si no alcanzan los vacíos y `_numJugadores < 32`, incrementa `_numJugadores` y
  agrega solo las filas nuevas necesarias con la función auxiliar de T006 (HTML + wiring incluido,
  research.md §6a); 3) si aun así no alcanzan los 32 cupos, importa los que entren y avisa por
  `mostrarToast` cuáles quedaron fuera (contracts/setup-import-contract.md, garantía 5); 4) llama
  `validarJugadores()` al final. Depende de T006
- [X] T014 [US1] En `app.js`, conectar los event listeners del botón/modal nuevos junto al resto
  de listeners de `screen-setup` (junto a app.js:1820), y en `inicializarSetup()` (app.js:275)
  agregar la evaluación `document.getElementById('btn-importar-jugadores').classList.toggle
  ('hidden', cargarJugadoresConocidos().length === 0)` (research.md §8). Depende de T004, T010,
  T011, T012, T013
- [X] T015 [P] [US1] En `styles.css`, agregar los estilos puntuales para las filas de checkbox del
  modal de importación (touch target ≥44px, reutilizando clases ya existentes de `modal-box`/
  `form-group` donde alcance) — contracts/setup-import-contract.md, garantía 6. No depende de las
  tareas de `app.js`/`index.html` de esta fase (archivo distinto), pero debe cerrarse junto con
  T014 para que el modal se vea terminado
- [X] T016 [US1] Ejecutar quickstart.md Escenario 2 (reutilizar jugadores), Escenario 4 (no perder
  texto tipeado al importar) y Escenario 4b (validación en vivo en una fila creada por el import,
  research.md §6a) contra la app real, en mobile y desktop, y corregir cualquier desvío
  encontrado. Depende de T014, T015.
  **Verificado con Playwright (Chromium) en mobile 390×844 y desktop 1280×900, contra `index.html`
  vía `file://`** (ver hallazgo y resolución en el Checkpoint de Phase 6). Todas las aserciones de
  Escenario 2, 4 y 4b pasaron en ambos viewports — sin desvíos que corregir en código.

**Checkpoint**: User Story 1 funcional y probable de forma independiente (quickstart Escenarios 2,
4, 4b).

---

## Phase 4: User Story 2 - Primer uso sin fricción, sin registro previo (Priority: P1)

**Goal**: Un usuario sin `jugadores_conocidos` completa el flujo de creación de un torneo
exactamente igual que antes de esta spec, sin pasos ni pantallas nuevas obligatorias, y el
registro se crea solo al confirmar su primer torneo.

**Independent Test**: Con `localStorage` sin la clave `jugadores_conocidos`, completar un torneo
de punta a punta sin ver ningún elemento roto o adicional obligatorio, y verificar que la clave se
crea recién al confirmar (quickstart.md Escenario 1).

### Implementation for User Story 2

- [X] T017 [US2] Ejecutar quickstart.md Escenario 1 (primer uso sin registro previo) contra la app
  real: confirmar que el botón "Importar del registro" no aparece con `jugadores_conocidos`
  ausente (no solo deshabilitado — oculto, contracts/setup-import-contract.md garantía 1), que el
  flujo de alta manual funciona sin cambios, y que `jugadores_conocidos` se crea por primera vez
  recién al confirmar el torneo. Depende de T009 (creación automática), T014 (lógica de
  visibilidad).
  **Verificado con Playwright en mobile y desktop**: con `localStorage` vacío, `screen-competicion`
  se muestra primero, el botón de importar tiene la clase `hidden` (no solo `disabled`), el alta
  manual de 4 jugadores confirma sin fricción, y `jugadores_conocidos` aparece en `localStorage`
  con las 4 entradas recién al confirmar. Sin desvíos.
- [X] T018 [US2] Corregir cualquier desvío encontrado en T017 — en particular, si el botón llega a
  renderizarse visible o deshabilitado en vez de oculto cuando no hay registro previo, el fix es
  en la condición de `inicializarSetup()` (T014), no un caso especial nuevo.
  **Sin desvíos encontrados en T017** — no se requirió ningún cambio de código.

**Checkpoint**: User Story 2 funcional y probable de forma independiente (quickstart Escenario 1).

---

## Phase 5: User Story 3 - El registro crece automáticamente con cada torneo (Priority: P2)

**Goal**: Confirmar un torneo con jugadores repetidos y nuevos actualiza `jugadores_conocidos` sin
duplicados, dejando los nombres nuevos disponibles para el próximo torneo.

**Independent Test**: Confirmar dos torneos consecutivos con jugadores parcialmente repetidos (con
variaciones de mayúsculas/espacios) y verificar que el registro no acumula duplicados por nombre
normalizado (quickstart.md Escenario 3).

### Implementation for User Story 3

- [X] T019 [US3] Ejecutar quickstart.md Escenario 3 (deduplicación por nombre normalizado) contra
  la app real: nombres con variaciones de mayúsculas/espacios se bloquean como duplicado en el
  roster en edición (T007), un jugador ya presente no aparece seleccionable en el modal de import
  (T012), y dos torneos consecutivos con jugadores repetidos no generan entradas duplicadas en
  `jugadores_conocidos` (T008/T009). Depende de T007, T008, T009, T012.
  **Verificado con Playwright en mobile y desktop** — ver hallazgo documentado abajo (marcado visual
  de duplicados) y el resto de aserciones (dedup de registro tras 2 torneos, exclusión en el modal
  de import) sin desvíos.
  **Hallazgo documentado (no es un defecto de esta spec)**: `validarJugadores()` solo agrega la
  clase `.error` desde la *segunda* aparición de un nombre repetido en adelante, nunca a la
  primera — comportamiento heredado de antes de spec 003 (la comparación anterior con
  `val.toLowerCase()` suelto tenía exactamente el mismo patrón de "solo marca desde la segunda
  vez"). `normalizarNombreJugador()` no cambió ese comportamiento, solo endureció qué cuenta como
  "igual" (espacios internos incluidos). El requisito real de FR-005 — que el duplicado bloquee la
  confirmación — se cumple igual: `#btn-confirmar-jugadores` queda deshabilitado apenas existe el
  duplicado, sin importar cuál de las dos filas se resalta visualmente. **Resolución**: no se
  corrige en esta spec — es una limitación de UX preexistente y fuera del alcance de spec 003 (no
  está entre los FR de esta feature); queda como posible mejora de UX a considerar en una spec
  futura de `screen-setup`, no como bug de este registro de jugadores.
- [X] T020 [US3] Corregir cualquier desvío encontrado en T019 — cualquier caso de duplicado real
  debe resolverse ajustando `normalizarNombreJugador()` (T003) como única fuente de verdad, nunca
  agregando una segunda regla de comparación en un lugar distinto.
  **Sin desvíos que requieran cambio de código** — el único hallazgo de T019 (marcado visual
  parcial del duplicado) es comportamiento heredado, no introducido por esta spec; no aplica un fix
  aquí (ver nota en T019).

**Checkpoint**: Las tres user stories funcionan de forma independiente y en conjunto.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Cierre de la feature — verificaciones finales que cruzan las tres user stories.

- [X] T021 [P] Verificar por `git diff --stat motor.js` que el archivo no cambió una sola línea
  respecto a la línea base de T001 (SC-004/FR-009).
  **Verificado**: `git diff --stat motor.js` vacío.
- [X] T022 [P] Correr `grep -inE "jugadores_conocidos|registro" motor.js` y confirmar 0 resultados
  — reafirma Principio II (research.md §4).
  **Verificado**: 0 resultados.
- [X] T023 Ejecutar los 5 escenarios completos de `quickstart.md` de punta a punta (1-5, incluido
  4b) con navegador real en mobile y desktop, como pase de regresión final antes de cerrar la
  feature. Documentar cualquier hallazgo y su resolución. Depende de T016, T017, T018, T019, T020.
  Incluye explícitamente un ítem de checklist para FR-011: confirmar que ningún texto nuevo
  introducido por esta spec (botón "Importar del registro", modal de importación, cualquier toast
  de import) usa emojis — solo Font Awesome o texto plano.
  **Ejecutado con Playwright (Chromium) contra `index.html` real vía `file://`, en mobile (390×844)
  y desktop (1280×900)**: 42/42 aserciones pasaron en ambos viewports, cubriendo los 5 escenarios
  (incluido 4b) más la verificación explícita de FR-011 (texto del botón y del modal de import
  inspeccionado con un regex de rango Unicode de emojis — sin coincidencias). Único hallazgo:
  el de T019 (marcado visual parcial de duplicados, comportamiento heredado, sin fix requerido).
- [X] T024 Correr `/speckit-analyze` contra la constitución antes de dar la tarea por terminada,
  per CLAUDE.md.
  **Corrido dos veces**: primera pasada con E1/E2 (brechas de cobertura FR-008/FR-011) y
  verificación de navegador pendiente; segunda pasada (tras T025 y la corrida de Playwright)
  sin CRITICAL/HIGH, 0 ambigüedades, 0 ítems "verification pending" — ver reporte final.
- [X] T025 [P] Correr `git diff --stat competiciones.js` y confirmar vacío — verifica FR-008 (el
  registro de jugadores es transversal, no vive en `COMPETICIONES`). Mismo patrón que T021 para
  `motor.js`.
  **Verificado**: `git diff --stat competiciones.js` vacío.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: sin dependencias — inicia de inmediato
- **Foundational (Phase 2)**: depende de Setup — bloquea las 3 user stories. Dentro de esta fase:
  T004 y T005 dependen de T002; T007 depende de T003; T008 depende de T003, T004, T005; T009
  depende de T008
- **User Stories (Phase 3-5)**: todas dependen de Foundational completo
  - US1 (P1) es el MVP — entrega el valor central (importar jugadores)
  - US2 (P1) puede avanzar en paralelo con US1 una vez completada Phase 2, pero su verificación
    (T017) depende de que el botón/lógica de visibilidad de US1 (T014) ya exista, para poder
    confirmar que se comporta bien en su ausencia
  - US3 (P2) depende de Foundational y reutiliza la verificación del modal de US1 (T012) para su
    propio escenario de dedup
- **Polish (Phase 6)**: depende de que las 3 user stories estén completas (T023 depende
  explícitamente de T016, T017, T018, T019, T020). T025 es independiente del resto de Polish
  (verificación de solo lectura sobre `competiciones.js`, sin relación con T021-T024)

### User Story Dependencies

- **US1 (P1)**: depende solo de Foundational — sin dependencia de US2/US3
- **US2 (P1)**: depende de Foundational y de la lógica de visibilidad construida en US1 (T014) —
  es una verificación de no-regresión sobre esa lógica, no código nuevo propio
- **US3 (P2)**: depende de Foundational (T007/T008/T009) y de la exclusión del modal construida en
  US1 (T012) para su propio escenario de dedup

### Parallel Opportunities

- T003, T004 en paralelo dentro de Foundational (T003 no depende de T002; T004 sí, pero es archivo
  y función distintos de T003)
- T015 (`styles.css`) puede avanzar en paralelo con T010-T014 (`index.html`/`app.js`) dentro de
  US1, pero debe cerrarse junto con T014 antes de T016
- T021, T022 y T025 en paralelo en Polish (verificaciones de solo lectura sobre `motor.js` y
  `competiciones.js` respectivamente, sin dependencias entre sí)

---

## Parallel Example: Foundational

```bash
# En paralelo, apenas se define CLAVE_LS_JUGADORES (T002):
Task: "Implementar normalizarNombreJugador(nombre)"        # T003
Task: "Implementar cargarJugadoresConocidos()"              # T004 (depende de T002)
```

---

## Implementation Strategy

### MVP First (User Story 1)

1. Completar Phase 1: Setup
2. Completar Phase 2: Foundational (CRÍTICO — incluye la normalización compartida y el wiring de
   validación en vivo de la fila auxiliar, sin lo cual el import de US1 queda con bugs de
   validación silenciosos)
3. Completar Phase 3 (US1)
4. **DETENER y VALIDAR**: correr quickstart.md Escenarios 2, 4 y 4b
5. Este es el MVP funcional — un usuario con historial puede reutilizar jugadores sin re-tipear

### Incremental Delivery

1. Setup + Foundational → base lista, con dedup consistente y actualización automática del
   registro
2. US1 → validar independientemente (quickstart Escenarios 2, 4, 4b) → demo de import funcionando
3. US2 → validar independientemente (quickstart Escenario 1) → demo de no-disrupción para usuario
   nuevo
4. US3 → validar independientemente (quickstart Escenario 3) → demo de crecimiento sin duplicados
5. Polish → regresión final de los 5 escenarios + `/speckit-analyze`

---

## Notes

- [P] = archivos distintos o funciones independientes sin dependencias entre sí
- [Story] mapea cada tarea a su user story para trazabilidad
- La secuencia T002 → T003/T004/T005 → T006/T007/T008 → T009 es obligatoria dentro de
  Foundational — ninguna user story se da por lista para empezar sin que T009 esté cerrada
- T016 (Escenario 4b en navegador real) es la verificación que demuestra en vivo el fix de
  research.md §6a — no basta con inspección de código, tal como se pidió explícitamente
- Confirmar después de cada tarea o grupo lógico de tareas
- Detenerse en cada checkpoint para validar la user story de forma independiente
