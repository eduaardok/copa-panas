---

description: "Task list for Historial de equipos y administración del registro de jugadores"
---

# Tasks: Historial de equipos y administración del registro de jugadores

**Input**: Design documents from `/specs/005-administracion-registro-jugadores/`

**Prerequisites**: plan.md, spec.md, research.md (incluye §2, hallazgo crítico: el historial se
engancha en `confirmarEquipos()`, no en `confirmarJugadores()`), data-model.md, contracts/,
quickstart.md

**Tests**: No se generan tareas de test automatizado — el proyecto no usa framework de tests
(Principio I / Technical Context en plan.md). La validación es manual vía `quickstart.md`,
referenciada explícitamente en las tareas correspondientes.

**Organization**: Tareas agrupadas por user story (spec.md: US1 corregir nombre, US2 eliminar
entrada, US3 ver historial de equipos, US4 el historial se acumula automáticamente) para permitir
implementación y prueba independiente de cada una.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Puede ejecutarse en paralelo (archivos distintos, sin dependencias)
- **[Story]**: A qué user story pertenece (US1, US2, US3, US4) — ausente en Setup/Foundational/Polish
- Cada tarea incluye ruta de archivo exacta

## Path Conventions

Mismo proyecto de archivo único que specs 001-004 (sin `src/`/`tests/`): `index.html`, `motor.js`,
`competiciones.js`, `app.js`, `styles.css`, en la raíz del repo. Esta spec no agrega archivos
nuevos (plan.md § Project Structure). `motor.js` no se toca en ninguna tarea; `competiciones.js`
solo se lee (nunca se edita) desde `app.js` para resolver `COMPETICIONES[id].nombre`.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirmar el estado base antes de tocar código — no hay archivos nuevos que crear.

- [X] T001 Confirmar que `git status` está limpio en `app.js`, `index.html`, `styles.css` antes de
  empezar, y guardar `git diff --stat motor.js` y `git diff --stat competiciones.js` (ambos deben
  estar vacíos) como línea base para verificar luego que ninguno de los dos cambió (SC-004/FR-012)
  **Verificado**: `git status` limpio antes de empezar; `git diff --stat motor.js` y
  `git diff --stat competiciones.js` vacíos como línea base.

**Checkpoint**: Línea base capturada.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: El punto de entrada y el esqueleto de la pantalla de administración (botón en Config +
modal + renderizado de la lista de entradas) que las tres user stories de UI (US1, US2, US3)
necesitan para existir antes de poder agregarles acciones. US4 (acumulación de historial) no
depende de esta fase — es pura capa de datos, ver su propia fase.

**⚠️ CRITICAL**: No iniciar Phase 3 (US1), Phase 4 (US2) ni Phase 6 (US3) hasta completar esta
fase. Phase 5 (US4) puede avanzar en paralelo sin esperarla.

- [X] T002 En `index.html`, en `screen-config` junto a la sección "Datos del torneo"
  (index.html:454-467), agregar el botón `#btn-admin-registro` ("Administrar registro de
  jugadores"), siempre visible — sin condición de `jugadores_conocidos` no vacío (contracts/
  admin-registro-contract.md, Garantía 1; a diferencia del botón de importar de spec 003, este no
  se oculta)
  **Hecho**: card nueva "Registro de jugadores" agregada entre "Datos del torneo" y "Zona de
  peligro", con `#btn-admin-registro` siempre visible.
- [X] T003 En `index.html`, agregar el modal `#modal-admin-registro` siguiendo el mismo esqueleto
  que los modales existentes (`modal-overlay`/`modal-box`, `role="dialog" aria-modal="true"`, botón
  `.modal-close-btn`, ver index.html:600-610 `modal-importar-jugadores` como referencia más
  cercana): contenedor de filas (`#lista-admin-registro`) + título + botón de cierre
  **Hecho**: `#modal-admin-registro` agregado después de `#modal-importar-jugadores`, mismo
  esqueleto (overlay/box, título, botón X, contenedor `#lista-admin-registro`).
- [X] T004 [P] En `app.js`, implementar `abrirModalAdminRegistro()` y su función auxiliar
  `crearFilaAdminRegistro(entrada)`: lee `cargarJugadoresConocidos()`, renderiza una fila por
  entrada en `#lista-admin-registro` con el nombre de presentación (`entrada.nombre`) y los tres
  botones de acción por fila ya completos — Editar (US1), Borrar (US2), Expandir historial (US3) —
  como elementos hermanos e independientes dentro del mismo contenedor de acciones, cada uno con su
  propio listener; si el registro está vacío, muestra el mismo patrón de estado vacío ya usado por
  `abrirModalImportarJugadores()` (app.js:517, "No hay jugadores nuevos para importar") adaptado al
  contexto de administración (contracts/admin-registro-contract.md, Garantía 2). Depende de T003.
  T008/T014/T020 no son un paso posterior de construcción sobre esta fila — documentan la garantía
  y el listener de cada botón que T004 ya deja instalado (ver Notes).
  **Hecho**: `abrirModalAdminRegistro()` + `crearFilaAdminRegistro()` implementadas juntas, con los
  tres botones completos desde el primer pase. Estado vacío verificado.
- [X] T005 [P] En `app.js`, implementar `cerrarModalAdminRegistro()`: mismo mecanismo que
  `cerrarModalImportarJugadores()` (`cerrarModalConAnimacion('modal-admin-registro')`). Depende de
  T003
  **Hecho**: implementada, reutiliza `cerrarModalConAnimacion`.
- [X] T006 En `app.js`, conectar los event listeners del botón/modal nuevos junto al resto de
  listeners de `screen-config` (junto a app.js:2285, mismo bloque donde ya se conecta
  `btn-reiniciar`): click en `#btn-admin-registro` → `abrirModalAdminRegistro()`; click en el botón
  de cierre y clic fuera del `modal-box` → `cerrarModalAdminRegistro()` (contracts/admin-registro-
  contract.md, Garantía 7). Depende de T002, T003, T004, T005
  **Hecho**: listeners agregados en `vincularEventos()`, junto al bloque de Config.
- [X] T007 [P] En `styles.css`, agregar los estilos base para las filas de `#lista-admin-registro`
  (contenedor de fila, nombre, fila de botones de acción con touch target ≥44px, reutilizando
  clases ya existentes de `modal-box`/`clasificado-row` donde alcance) — contracts/admin-registro-
  contract.md, Garantía 7. No depende de las tareas de `app.js`/`index.html` de esta fase (archivo
  distinto), pero debe cerrarse junto con T006 para que el modal se vea terminado
  **Hecho**: bloque `.admin-registro-*` agregado a styles.css. Radios y font-sizes ajustados a la
  escala ya existente en el archivo (8px/13px/11px) tras hallazgos del hook de diseño de Impeccable
  — ver Notes.

**Checkpoint**: El modal de administración abre desde Config, lista los nombres de
`jugadores_conocidos` (o el estado vacío correspondiente), y cierra correctamente. US1, US2 y US3
pueden construirse agregando acciones sobre esta base sin tocar de nuevo el esqueleto del modal.

---

## Phase 3: User Story 1 - Corregir un nombre mal escrito en el registro (Priority: P1) 🎯 MVP

**Goal**: Desde la pantalla de administración, un usuario puede corregir el nombre de presentación
de cualquier entrada del registro, con rechazo explícito si el nombre editado colisiona con otra
entrada, sin afectar retroactivamente ningún torneo ya confirmado.

**Independent Test**: Con `jugadores_conocidos` conteniendo una entrada con un nombre mal escrito,
editarla desde la pantalla de administración, guardar, y verificar que el registro refleja el
nombre nuevo mientras un torneo ya confirmado que usó el nombre viejo no cambia (quickstart.md
Escenario 1).

### Implementation for User Story 1

- [X] T008 [US1] Garantía: el botón "Editar" por fila (ya construido en `crearFilaAdminRegistro()`,
  T004, con `data-nombre-normalizado` en la fila y listener propio) debe disparar
  `iniciarEdicionNombreRegistro(nombreNormalizado)`. No es un paso de implementación separado de
  T004 — documenta qué garantiza ese botón específico y a qué user story corresponde (US1).
  **Hecho**: botón "Editar" en `crearFilaAdminRegistro()`, con listener a
  `iniciarEdicionNombreRegistro`.
- [X] T009 [US1] En `app.js`, implementar `iniciarEdicionNombreRegistro(nombreNormalizado)`:
  reemplaza el `<span>` de nombre de esa fila por un `<input>` con el valor actual y botones
  "Guardar"/"Cancelar" en lugar de "Editar"/"Borrar" — mismo patrón de edición inline que
  research.md §6 describe. Depende de T008
  **Hecho**: implementada, incluye manejo de Enter/Escape en el input.
- [X] T010 [US1] En `app.js`, implementar `guardarEdicionNombreRegistro(nombreNormalizado, inputEl)`:
  valida que el valor no esté vacío (mismo estándar que el alta manual existente); calcula
  `normalizarNombreJugador(nuevoValor)`; si coincide con el `nombreNormalizado` de OTRA entrada
  distinta del registro, muestra un mensaje de error inline en la fila y mantiene el modo edición
  abierto sin tocar `localStorage` (contracts/admin-registro-contract.md, Garantía 3); si no hay
  colisión, actualiza `entrada.nombre` y recalcula `entrada.nombreNormalizado`, llama
  `guardarJugadoresConocidos(registro)`, y vuelve a renderizar esa fila en modo lectura con el
  nombre nuevo. Depende de T009
  **Hecho e implementado exactamente como se describe. Verificado con Playwright** (ver T013):
  rechazo de colisión sin tocar `localStorage`, guardado exitoso recalcula `nombreNormalizado`.
- [X] T011 [US1] En `app.js`, implementar el botón "Cancelar" del modo edición: revierte la fila a
  modo lectura sin persistir ningún cambio (`re-render` de esa fila con el nombre original, sin
  llamar a `guardarJugadoresConocidos`). Depende de T009
  **Hecho**: `cancelarEdicionNombreRegistro()` implementada.
- [X] T012 [P] [US1] En `styles.css`, agregar el estilo del estado "fila en edición" (input inline,
  texto de error) — reutilizando clases de formulario ya existentes donde alcance
  **Hecho**: `.admin-registro-edit-wrap`, `.admin-registro-input`, `.admin-registro-edit-error`.
- [X] T013 [US1] Ejecutar quickstart.md Escenario 1 (corregir nombre, rechazo por colisión, no
  retroactividad) contra la app real, en mobile y desktop, y corregir cualquier desvío encontrado.
  Depende de T010, T011, T012
  **Verificado con Playwright (Chromium) en mobile 390×844 y desktop 1280×900**, contra `index.html`
  real vía `file://`: edición exitosa de nombre, rechazo de colisión con mensaje inline sin tocar
  `localStorage`, y no retroactividad (el roster del torneo activo no cambia al editar el
  registro). 8/8 aserciones pasaron en ambos viewports. Sin desvíos de código — un hallazgo de
  interacción (modal-confirm tapado por modal-admin-registro) apareció en T016, no en esta tarea.

**Checkpoint**: User Story 1 funcional y probable de forma independiente (quickstart Escenario 1).

---

## Phase 4: User Story 2 - Eliminar una entrada del registro (Priority: P1)

**Goal**: Desde la pantalla de administración, un usuario puede borrar por completo cualquier
entrada del registro, con confirmación explícita previa, sin que eso afecte a un torneo activo que
incluya a ese jugador.

**Independent Test**: Con `jugadores_conocidos` conteniendo al menos dos entradas, borrar una desde
la pantalla de administración y verificar que desaparece del registro y de la opción de importar en
un torneo nuevo, mientras el resto del registro y cualquier torneo activo permanecen intactos
(quickstart.md Escenario 2).

### Implementation for User Story 2

- [X] T014 [US2] Garantía: el botón "Borrar" por fila (ya construido en `crearFilaAdminRegistro()`,
  T004, como slot hermano independiente del botón "Editar" de US1) debe disparar
  `borrarEntradaRegistro(nombreNormalizado)`. No es un paso de implementación separado de T004 —
  documenta qué garantiza ese botón específico y a qué user story corresponde (US2).
  **Hecho**: botón "Borrar" en `crearFilaAdminRegistro()`, con listener a `borrarEntradaRegistro`.
- [X] T015 [US2] En `app.js`, implementar `borrarEntradaRegistro(nombreNormalizado)`: llama a
  `mostrarConfirm(titulo, msg, callback)` (genérico ya existente, app.js:308) con un mensaje
  específico para esta entrada; en el callback, filtra esa entrada de `cargarJugadoresConocidos()`,
  llama `guardarJugadoresConocidos(registro)`, y vuelve a renderizar la lista completa del modal
  (`abrirModalAdminRegistro()` o un refresco equivalente) — nunca borra sin pasar por la
  confirmación (contracts/admin-registro-contract.md, Garantía 5). Depende de T004 (botón ya
  instalado) y de la garantía documentada en T014.
  **Hecho** según lo descrito.
- [X] T016 [US2] Ejecutar quickstart.md Escenario 2 (borrar sin afectar torneo activo, desaparece
  de la opción de importar) contra la app real, en mobile y desktop, y corregir cualquier desvío
  encontrado. Depende de T015
  **Verificado con Playwright en mobile y desktop**: 6/6 aserciones pasaron — borrado tras
  confirmación, resto del registro intacto, torneo activo (roster X1-X4) sin cambios, modal cierra
  con botón X.
  **Hallazgo real y corregido**: al invocar `mostrarConfirm()` desde dentro de
  `#modal-admin-registro` ya abierto, el modal de confirmación quedaba tapado y con los clics
  interceptados por el modal de administración — ambos comparten `z-index: 60` y
  `modal-admin-registro` es posterior en el DOM. Es la primera vez que `mostrarConfirm()` se invoca
  desde dentro de otro modal ya abierto (spec 003/004 solo lo usaban desde pantallas de screen).
  **Fix aplicado**: `#modal-confirm { z-index: 70; }` en styles.css, para que el confirm genérico
  siempre se apile sobre cualquier otro modal. Re-verificado con Playwright y capturas de pantalla
  — el diálogo de confirmación ahora se ve y funciona correctamente sobre el modal de
  administración.

**Checkpoint**: User Story 1 y User Story 2 funcionan de forma independiente y en conjunto —
ambas P1, MVP completo de administración del registro.

---

## Phase 5: User Story 4 - El historial de equipos se acumula automáticamente (Priority: P2)

**Goal**: Al confirmar la asignación de equipos de un torneo nuevo, cada jugador del roster acumula
en su entrada del registro una entrada de historial con el equipo asignado, la competición, y la
fecha — sin ningún paso adicional del usuario.

**Independent Test**: Confirmar la creación de un torneo con un jugador ya existente en el registro
y uno nuevo, y verificar en `localStorage` que ambos incorporan una entrada de historial correcta
al confirmar la asignación de equipos — no antes (quickstart.md Escenario 3).

**Nota de orden**: aunque spec.md lista User Story 3 antes que User Story 4, esta fase se
implementa primero porque User Story 3 (ver historial) no tiene nada que mostrar sin los datos que
esta fase produce — la dependencia funcional real va en este sentido, ya señalada en spec.md
("Why this priority" de ambas historias) y en plan.md. No depende de la Fase 2 (Foundational de
UI) — es pura capa de datos, puede implementarse y probarse en paralelo.

### Implementation for User Story 4

- [X] T017 [US4] En `app.js`, implementar `agregarHistorialEquipos(jugadoresDelRoster,
  nombreCompeticion)`: por cada jugador del roster, busca su entrada en `jugadores_conocidos` por
  `nombreNormalizado`; si existe, hace `push` de `{ equipo: jugador.equipo, competicion:
  nombreCompeticion, fecha: new Date().toISOString() }` a `entrada.historial` (inicializándolo como
  `[]` si no existe todavía, research.md §9); si la entrada no existe en el registro, la ignora sin
  lanzar error (defensivo — no debería pasar, ver data-model.md); al final llama
  `guardarJugadoresConocidos(registro)` — sin deduplicar por equipo repetido (contracts/historial-
  equipos-contract.md, Garantías 3, 4, 6)
  **Hecho** exactamente como se describe.
- [X] T018 [US4] En `app.js`, en `confirmarEquipos()` (app.js:719-748), agregar la llamada
  `agregarHistorialEquipos(estado.jugadores, COMPETICIONES[estado.competicion].nombre)` justo antes
  de `mostrarPantalla('grupos-config')`, después de que `estado.jugadores[i].equipo` ya está
  definitivamente asignado para todos (research.md §2, contracts/historial-equipos-contract.md,
  Garantías 1, 2, 5). Depende de T017
  **Hecho**: línea agregada entre `agregarHistorialEquipos(...)` e `inicializarGruposConfig()`.
- [X] T019 [US4] Ejecutar quickstart.md Escenario 3 (historial se acumula recién en
  `confirmarEquipos()`, no en `confirmarJugadores()`; no se deduplica por equipo repetido) contra la
  app real, inspeccionando `localStorage` en cada paso, y corregir cualquier desvío encontrado.
  Depende de T018
  **Verificado con Playwright en mobile y desktop**: 8/8 aserciones pasaron — tras
  `confirmarJugadores()` ningún jugador tiene historial todavía; tras `confirmarEquipos()` cada
  jugador (existente y nuevo) recibe su primera entrada con equipo/competición/fecha correctos; un
  segundo torneo con el mismo jugador agrega una segunda entrada sin deduplicar por equipo
  repetido. Sin desvíos de código.

**Checkpoint**: User Story 4 funcional y probable de forma independiente por inspección directa de
`localStorage` (quickstart Escenario 3), sin necesidad de que exista todavía la UI de la pantalla
de administración.

---

## Phase 6: User Story 3 - Ver el historial de equipos de un jugador (Priority: P2)

**Goal**: Desde la pantalla de administración, un usuario puede expandir el detalle de cualquier
entrada del registro y ver su historial de equipos (equipo, competición, fecha), ordenado de más
reciente a más antigua, con un estado vacío claro para jugadores sin historial.

**Independent Test**: Con un jugador del registro que participó en al menos dos torneos de
competiciones distintas (requiere Phase 5/US4 ya completada para tener datos reales), abrir su
detalle en la pantalla de administración y verificar que se listan ambas entradas de historial
correctamente (quickstart.md Escenario 4).

### Implementation for User Story 3

- [X] T020 [US3] Garantía: el botón/ícono "Expandir historial" por fila (ya construido en
  `crearFilaAdminRegistro()`, T004, como slot hermano independiente de "Editar"/"Borrar") debe
  disparar `toggleHistorialAdminRegistro(nombreNormalizado)`. No es un paso de implementación
  separado de T004 — documenta qué garantiza ese botón específico y a qué user story corresponde
  (US3).
  **Hecho**: botón "Expandir historial" (chevron) en `crearFilaAdminRegistro()`.
- [X] T021 [US3] En `app.js`, implementar `toggleHistorialAdminRegistro(nombreNormalizado)`:
  expande/colapsa un bloque de detalle debajo de la fila (mismo mecanismo `classList.toggle
  ('hidden', …)` ya usado en el resto de la app, research.md §6) que lista `(entrada.historial ||
  [])` ordenado de más reciente a más antigua, cada ítem con equipo, competición y fecha
  formateada; si la lista está vacía (ausente o `[]`), muestra un estado vacío específico distinto
  del estado vacío de "registro sin entradas" (contracts/admin-registro-contract.md, Garantía 6).
  Depende de T020
  **Hecho**, incluye `formatearFechaHistorial()` auxiliar.
- [X] T022 [P] [US3] En `styles.css`, agregar los estilos del bloque de historial expandible (lista
  de ítems, estado vacío, transición de expandir/colapsar respetando `prefers-reduced-motion` si se
  agrega alguna, reutilizando el mecanismo ya existente de apertura/cierre de bloques de la app)
  **Hecho**: `.admin-registro-historial*`. La transición respeta `prefers-reduced-motion` a través
  de la regla global ya existente en el archivo (no necesitó una excepción propia).
- [X] T023 [US3] Ejecutar quickstart.md Escenario 4 (ver historial con datos reales, estado vacío
  para jugador sin historial, confirmar que el historial NO aparece en el flujo de importación de
  spec 003) contra la app real, en mobile y desktop, y corregir cualquier desvío encontrado. Depende
  de T021, T022, T018 (necesita datos reales de historial producidos por US4)
  **Verificado con Playwright en mobile y desktop**: 4/4 aserciones pasaron — historial expandido
  muestra ambas entradas ordenadas de más reciente a más antigua, jugador sin historial muestra
  estado vacío específico, y el historial no aparece en ningún lugar del modal de importación de
  spec 003. Sin desvíos.

**Checkpoint**: Las cuatro user stories funcionan de forma independiente y en conjunto — la
funcionalidad completa de esta spec queda operativa.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Cierre de la feature — verificaciones finales que cruzan las cuatro user stories.

- [X] T024 [P] Verificar por `git diff --stat motor.js` que el archivo no cambió una sola línea
  respecto a la línea base de T001 (SC-004/FR-012)
  **Verificado**: `git diff --stat motor.js` vacío.
- [X] T025 [P] Verificar por `git diff --stat competiciones.js` que el archivo no cambió una sola
  línea respecto a la línea base de T001 (FR-012) — `competiciones.js` solo se lee desde `app.js`
  (research.md §3), nunca se edita
  **Verificado**: `git diff --stat competiciones.js` vacío.
- [X] T026 [P] Correr `grep -inE "historial|jugadores_conocidos" motor.js competiciones.js` y
  confirmar 0 resultados — reafirma Principio II (research.md §4)
  **Verificado**: 0 resultados.
- [X] T027 Ejecutar quickstart.md Escenario 5 (entradas del registro previas a esta spec, sin campo
  `historial`, se editan/borran normalmente y muestran estado vacío en su detalle) contra la app
  real, simulando una entrada preexistente sin ese campo. Depende de T013, T016, T021
  **Verificado con Playwright en mobile y desktop**: 2/2 aserciones pasaron — una entrada sin campo
  `historial` (no solo `[]`, directamente ausente) se edita y se borra normalmente sin error, y su
  detalle de historial muestra el estado vacío correspondiente (ya cubierto en T023). Sin desvíos.
- [X] T028 Ejecutar los 6 escenarios completos de `quickstart.md` de punta a punta con navegador
  real en mobile y desktop, como pase de regresión final antes de cerrar la feature. Documentar
  cualquier hallazgo y su resolución. Depende de T013, T016, T019, T023, T027. Incluye
  explícitamente un ítem de checklist para FR-014: confirmar que ningún texto nuevo introducido por
  esta spec (botón "Administrar registro de jugadores", modal, mensajes de error de colisión,
  textos del bloque de historial) usa emojis — solo Font Awesome o texto plano
  **Ejecutado con Playwright (Chromium) contra `index.html` real vía `file://`, en mobile (390×844)
  y desktop (1280×900)**: 60/60 aserciones pasaron en ambos viewports, cubriendo los 5 escenarios
  con interacción de UI (1-5) más la verificación explícita de FR-014 (regex de rango Unicode de
  emojis sobre el botón de Config y el modal completo — sin coincidencias). Escenario 6 (diff de
  motor.js/competiciones.js) cubierto por T024/T025. Único hallazgo real: el bug de z-index de
  T016 (ya corregido y re-verificado). Capturas de pantalla tomadas para revisión visual (lista,
  historial expandido, modo edición, confirm sobre admin) — sin regresiones visuales.
- [X] T029 Correr `/speckit-analyze` contra la constitución antes de dar la tarea por terminada, per
  CLAUDE.md. Depende de T024, T025, T026, T028
  **Corrido una vez, sin iteración adicional necesaria**: 0 CRITICAL, 0 HIGH, 0 ambigüedades, 0
  duplicaciones, cobertura 100% (19/19 requirements con al menos una tarea asociada). 2 hallazgos
  LOW informativos (ver reporte completo en la conversación): F1 documenta que T004 se implementó
  como una sola función unificada en vez de contenedores incrementales por historia (equivalente
  funcionalmente, sin impacto); F2 documenta el fix de z-index de T016 como hallazgo no anticipado
  por los contracts, ya resuelto y verificado. Ninguno bloquea el cierre de la feature.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: sin dependencias — inicia de inmediato
- **Foundational (Phase 2)**: depende de Setup — bloquea US1, US2 y US3 (no bloquea US4). Dentro de
  esta fase: T004 y T005 dependen de T003; T006 depende de T002, T003, T004, T005
- **US1 (Phase 3, P1)**: depende de Foundational completo — MVP de administración (corrección de
  nombre)
- **US2 (Phase 4, P1)**: depende solo de Foundational completo, no de US1 — T014 agrega su botón
  "Borrar" al contenedor de acciones por fila que T004 ya deja armado como slot independiente
  (mismo contenedor donde T008 de US1 agrega "Editar", sin que uno edite código que el otro
  escribió). US1 y US2 pueden desarrollarse genuinamente en paralelo una vez cerrada Foundational;
  se documentan en fases secuenciales en este archivo solo por orden de lectura, no por dependencia
  real
- **US4 (Phase 5, P2)**: depende solo de Setup — es independiente de Foundational (Phase 2) porque
  no toca la UI del modal, solo `confirmarEquipos()` y el esquema de datos. Puede implementarse en
  paralelo a Foundational/US1/US2
- **US3 (Phase 6, P2)**: depende de Foundational completo (para la fila y el modal) Y de US4 (Phase
  5) para tener datos reales de historial que mostrar en su validación (T023 depende de T018)
- **Polish (Phase 7)**: depende de que las cuatro user stories estén completas (T028 depende
  explícitamente de T013, T016, T019, T023, T027)

### User Story Dependencies

- **US1 (P1)**: depende solo de Foundational — sin dependencia de US2/US3/US4
- **US2 (P1)**: depende solo de Foundational — el contenedor de acciones donde va su botón
  "Borrar" (T014) ya existe desde T004 como slot independiente del botón "Editar" de US1 (T008); a
  diferencia de spec 003 (donde US2 sí dependía de lógica construida en US1), aquí no hay
  dependencia funcional entre US1 y US2, pueden desarrollarse en paralelo
- **US4 (P2)**: depende solo de Setup — completamente independiente de la UI (US1/US2/US3)
- **US3 (P2)**: depende de Foundational (para el modal/fila) y de US4 (para tener datos de
  historial que mostrar) — es la única dependencia cruzada real entre user stories de esta spec

### Parallel Opportunities

- T004 y T005 en paralelo dentro de Foundational (funciones distintas sobre el mismo modal, sin
  dependencia entre sí)
- T007 (`styles.css`) puede avanzar en paralelo con T002-T006 (`index.html`/`app.js`) dentro de
  Foundational, pero debe cerrarse junto con T006
- Phase 5 (US4) puede ejecutarse en paralelo completo con Phase 2-4 (Foundational, US1, US2) — no
  comparte archivos de UI, solo `app.js` en general (coordinar si se trabaja simultáneamente sobre
  el mismo archivo)
- Phase 3 (US1) y Phase 4 (US2) pueden ejecutarse en paralelo entre sí una vez cerrada Foundational
  — T008/T014 agregan botones hermanos a un contenedor ya armado por T004, sin editar el código que
  el otro escribe (ver User Story Dependencies)
- T012 (`styles.css`, US1) y T022 (`styles.css`, US3) son independientes entre sí y del resto
- T024, T025 y T026 en paralelo en Polish (verificaciones de solo lectura sobre `motor.js` y
  `competiciones.js`, sin dependencias entre sí)

---

## Parallel Example: Foundational

```bash
# En paralelo, apenas existe el modal #modal-admin-registro (T003):
Task: "Implementar abrirModalAdminRegistro()"   # T004
Task: "Implementar cerrarModalAdminRegistro()"  # T005
```

## Parallel Example: US4 junto a Foundational/US1/US2

```bash
# US4 no depende del modal — puede avanzar mientras se construye Foundational:
Task: "Implementar agregarHistorialEquipos(jugadoresDelRoster, nombreCompeticion)"  # T017
Task: "Enganchar la llamada en confirmarEquipos()"                                   # T018 (depende de T017)
```

---

## Implementation Strategy

### MVP First (User Story 1 + User Story 2)

1. Completar Phase 1: Setup
2. Completar Phase 2: Foundational (CRÍTICO para US1/US2/US3 — el modal y el renderizado de fila)
3. Completar Phase 3 (US1) y Phase 4 (US2)
4. **DETENER y VALIDAR**: correr quickstart.md Escenarios 1 y 2
5. Este es el MVP funcional — resuelve el caso motivador concreto de esta spec (typo sin forma de
   corregirse, spec 003 Assumptions) sin necesidad todavía del historial de equipos

### Incremental Delivery

1. Setup + Foundational → modal de administración listo, con lista de entradas visible
2. US1 → validar independientemente (quickstart Escenario 1) → demo de corrección de nombre
3. US2 → validar independientemente (quickstart Escenario 2) → demo de borrado seguro
4. US4 → validar independientemente (quickstart Escenario 3) → demo de acumulación automática de
   historial (puede haberse desarrollado en paralelo a los pasos 2-3)
5. US3 → validar independientemente (quickstart Escenario 4, requiere US4 ya completa) → demo de
   historial visible en la pantalla de administración
6. Polish → regresión final de los 6 escenarios + `/speckit-analyze`

### Parallel Team Strategy

Con más de un desarrollador: tras cerrar Foundational, una persona puede tomar US1 (T008-T013) y
otra US2 (T014-T016) en paralelo — ambas solo agregan un botón hermano al contenedor de acciones
que Foundational ya dejó armado, sin dependencia entre sí. En simultáneo, una tercera persona puede
tomar US4 (capa de datos, `confirmarEquipos()`), que ni siquiera depende de Foundational. US3 solo
puede empezar cuando el modal (Foundational) y los datos de historial (US4) ya existen.

---

## Notes

- [P] = archivos distintos o funciones independientes sin dependencias entre sí
- [Story] mapea cada tarea a su user story para trazabilidad
- El orden Foundational → US1 → US2 → US4 → US3 en este documento refleja dependencias reales, no
  el orden literal de aparición en spec.md (que lista US3 antes que US4) — ver la nota de orden en
  Phase 5 y la sección de Dependencies
- T018 es la tarea más sensible de toda la spec: el hallazgo de research.md §2 (enganchar en
  `confirmarEquipos()`, no en `confirmarJugadores()`) es fácil de pasar por alto si se sigue el
  patrón de spec 003 sin leer research.md primero — verificado explícitamente en T019 que ningún
  jugador tiene entrada de historial antes de confirmar equipos
- **F1 de `/speckit-analyze` (resuelto)**: la redacción original de T004/T008/T014/T020 describía
  contenedores vacíos poblados incrementalmente por cada user story. T004/T008/T014/T020 ya se
  reescribieron para reflejar lo implementado: T004 (`crearFilaAdminRegistro()`) construye los tres
  botones de acción (editar/borrar/expandir) completos en un solo pase, como elementos hermanos e
  independientes; T008/T014/T020 documentan la garantía y el listener de cada botón (a qué user
  story corresponde), no un paso de construcción posterior.
- **F2 de `/speckit-analyze` (resuelto)**: `mostrarConfirm()` nunca se había invocado antes desde
  dentro de otro modal ya abierto; `#modal-admin-registro` (posterior en el DOM, mismo
  `z-index: 60`) tapaba y bloqueaba clics sobre `#modal-confirm`. Fix aplicado en T016:
  `#modal-confirm { z-index: 70; }` — documentado como garantía explícita en
  `contracts/admin-registro-contract.md` (Garantía 5a).
- Confirmar después de cada tarea o grupo lógico de tareas
- Detenerse en cada checkpoint para validar la user story de forma independiente
