---

description: "Task list for Navegación de vuelta y reinicio consciente"
---

# Tasks: Navegación de vuelta y reinicio consciente

**Input**: Design documents from `/specs/006-volver-setup-y-reiniciar/`

**Prerequisites**: plan.md, spec.md, research.md (§2 es la más sensible: por qué "volver" necesita
`location.reload()` en vez de un reset en memoria), data-model.md, contracts/, quickstart.md

**Tests**: No se generan tareas de test automatizado — el proyecto no usa framework de tests
(Principio I / Technical Context en plan.md). La validación es manual vía `quickstart.md`,
referenciada explícitamente en las tareas correspondientes.

**Organization**: Tareas agrupadas por user story (spec.md: US1 volver desde setup, US2 reiniciar
con posibilidad de exportar) para permitir implementación y prueba independiente de cada una. US1 y
US2 son completamente independientes entre sí — no comparten pantalla, modal ni función nueva.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Puede ejecutarse en paralelo (archivos distintos o funciones independientes, sin
  dependencias)
- **[Story]**: A qué user story pertenece (US1, US2) — ausente en Setup/Polish
- Cada tarea incluye ruta de archivo exacta

## Path Conventions

Mismo proyecto de archivo único que specs 001-005 (sin `src/`/`tests/`): `index.html`, `motor.js`,
`competiciones.js`, `app.js`, `styles.css`, en la raíz del repo. Esta spec no agrega archivos nuevos
(plan.md § Project Structure). `motor.js` y `competiciones.js` no se tocan en ninguna tarea (fuera
de alcance explícito de spec.md).

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirmar el estado base antes de tocar código — no hay archivos nuevos que crear.

- [X] T001 Confirmar que `git status` está limpio y guardar `git diff --stat motor.js` y
  `git diff --stat competiciones.js` (ambos deben estar vacíos) como línea base para verificar luego
  que ninguno de los dos cambió (Constitución Principio II)

**Checkpoint**: Línea base capturada.

---

## Phase 2: Foundational (Blocking Prerequisites)

**N/A** — US1 y US2 no comparten ninguna infraestructura nueva: US1 vive enteramente en
`screen-setup` con una función propia (`volverASeleccionCompeticion()`); US2 vive enteramente en el
nuevo `#modal-reiniciar` con sus propias funciones (`abrirModalReiniciar()`/
`cerrarModalReiniciar()`). Ambas reutilizan funciones ya existentes (`limpiarStorage()`,
`exportarJSON()`, `cerrarModalConAnimacion()`) sin necesidad de un esqueleto compartido nuevo. Se
puede pasar directo a Phase 3.

---

## Phase 3: User Story 1 - Volver desde el setup sin perder tiempo (Priority: P1) 🎯 MVP

**Goal**: Desde `screen-setup`, un usuario puede volver a `screen-competicion` con un solo toque,
sin modal ni oferta de exportar, descartando por completo la competición y el formato elegidos —
una recarga posterior no reanuda el setup abandonado.

**Independent Test**: Elegir una competición, cambiar el formato sugerido, tocar "volver", y
verificar que aparece `screen-competicion` sin paleta "pegada"; recargar la página y confirmar que
sigue en `screen-competicion` (quickstart.md Escenarios 1-3).

### Implementation for User Story 1

- [X] T002 [US1] En `index.html`, en `screen-setup` (línea ~95-102, hero "CREA TU TORNEO"), agregar
  el ícono-botón `#btn-volver-competicion` (`fa-arrow-left`, `aria-label="Volver a selección de
  competición"`) en la esquina superior del hero — visualmente distinto del patrón `.btn-secondary`
  ancho de "Atrás" usado entre pasos del wizard (`#btn-back-setup` en `screen-equipos`,
  `#btn-back-equipos` en `screen-grupos-config`), para no sugerir que es un paso más del flujo hacia
  adelante (contracts/volver-y-reiniciar-contract.md Garantía 8)
- [X] T003 [P] [US1] En `styles.css`, agregar el estilo del ícono-botón `#btn-volver-competicion`:
  touch target ≥44px, sin depender de `:hover` como único estado, consistente con otros
  botones-ícono ya existentes (`#btn-theme-toggle`)
- [X] T004 [US1] En `app.js`, implementar `volverASeleccionCompeticion()`: llama `limpiarStorage()`
  seguido de `location.reload()` — sin mostrar ningún modal ni llamar a `exportarJSON()`
  (contracts/volver-y-reiniciar-contract.md Garantía 1; research.md §2 explica por qué el reload es
  necesario y no solo un cambio de pantalla en memoria)
- [X] T005 [US1] En `app.js`, conectar el listener de click de `#btn-volver-competicion` →
  `volverASeleccionCompeticion()`, junto al resto de listeners de `screen-setup` (cerca de
  `inicializarSetup()`, app.js:554). Depende de T002, T004
- [X] T006 [US1] Ejecutar quickstart.md Escenarios 1, 2 y 3 (volver sin fricción, no reanuda el
  setup tras recargar, paleta no queda "pegada") contra la app real, en mobile y desktop, y corregir
  cualquier desvío encontrado. Depende de T003, T005

**Checkpoint**: User Story 1 funcional y probable de forma independiente (quickstart Escenarios
1-3). Este es el MVP de la spec.

---

## Phase 4: User Story 2 - Reiniciar con la posibilidad de no perder nada (Priority: P2)

**Goal**: Desde Config, "Reiniciar torneo" abre un modal que deja explícito que la acción lleva a
elegir otra competición, con una opción independiente para exportar el torneo actual a JSON antes
de decidir si confirmar el borrado o cancelar.

**Independent Test**: Con un torneo en curso, abrir el modal de reinicio, exportar, y luego cancelar
sin que se pierda ningún dato; en un segundo intento, confirmar el borrado (con o sin haber
exportado antes) y verificar que llega a `screen-competicion` (quickstart.md Escenarios 4-7).

### Implementation for User Story 2

- [X] T007 [US2] En `index.html`, agregar el modal `#modal-reiniciar` después de `#modal-confirm`
  (línea ~597), mismo esqueleto `.modal-overlay`/`.modal-box` (`role="dialog" aria-modal="true"`):
  título y cuerpo con texto explícito de que la acción borra el torneo actual y lleva a elegir una
  competición distinta (contracts/volver-y-reiniciar-contract.md Garantía 3), botón
  `#btn-reiniciar-exportar` ("Exportar antes de borrar", mismo ícono/copy que `#btn-exportar`), y
  los botones `#btn-reiniciar-cancelar` / `#btn-reiniciar-confirmar` (mismas clases `.btn-secondary`/
  `.btn-danger` que `#modal-confirm`)
- [X] T008 [P] [US2] En `app.js`, implementar `abrirModalReiniciar()`: muestra `#modal-reiniciar`
  (`classList.remove('hidden')`). Depende de T007
- [X] T009 [P] [US2] En `app.js`, implementar `cerrarModalReiniciar()`: oculta el modal vía
  `cerrarModalConAnimacion('modal-reiniciar')` — no toca `estado` ni `localStorage` en ningún punto
  de esta ruta (contracts/volver-y-reiniciar-contract.md Garantía 5). Depende de T007
- [X] T010 [US2] En `app.js`, reemplazar el listener actual de `#btn-reiniciar` (app.js:2501-2509,
  que hoy llama a `mostrarConfirm(...)`) por una llamada a `abrirModalReiniciar()`; conectar
  `#btn-reiniciar-exportar` → `exportarJSON()` directo, sin cerrar el modal ni tocar
  `limpiarStorage()`/`location.reload()` (contracts/volver-y-reiniciar-contract.md Garantía 4);
  conectar `#btn-reiniciar-cancelar` (y clic fuera del `modal-box`) → `cerrarModalReiniciar()`;
  conectar `#btn-reiniciar-confirmar` → `limpiarStorage()` + `location.reload()` (mismo efecto que
  el callback que se reemplaza). Depende de T008, T009
- [X] T011 [US2] Ejecutar quickstart.md Escenarios 4, 5, 6 y 7 (copy explícito del modal, exportar
  sin comprometerse al borrado, cancelar tras exportar sin perder datos, confirmar con y sin haber
  exportado) contra la app real, en mobile y desktop, y corregir cualquier desvío encontrado.
  Depende de T010

**Checkpoint**: User Story 1 y User Story 2 funcionan de forma independiente y en conjunto —
funcionalidad completa de esta spec operativa.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Cierre de la feature — verificaciones finales que cruzan ambas user stories.

- [X] T012 [P] Verificar por `git diff --stat motor.js` que el archivo no cambió una sola línea
  respecto a la línea base de T001 (Constitución Principio II)
- [X] T013 [P] Verificar por `git diff --stat competiciones.js` que el archivo no cambió una sola
  línea respecto a la línea base de T001 (fuera de alcance explícito de spec.md)
- [X] T014 Ejecutar quickstart.md Escenario 8 (ningún control de "volver a selección" en dashboard,
  fase de grupos, clasificados o eliminación) contra la app real — confirmar que la única puerta
  hacia `screen-competicion` desde esas pantallas sigue siendo "Reiniciar torneo" en Config
  (contracts/volver-y-reiniciar-contract.md Garantía 7)
- [X] T015 Ejecutar quickstart.md Escenario 9 (un fallo de `exportarJSON()` no bloquea el modal de
  reinicio) por revisión de código: confirmar que `exportarJSON()` (app.js:2125-2139) sigue
  envolviendo su lógica en `try/catch` sin relanzar, y que el botón "Exportar" del nuevo modal
  (T010) no agrega manejo de errores adicional que pueda dejar el modal no interactivo (contracts/
  volver-y-reiniciar-contract.md Garantía 6)
- [X] T016 Ejecutar los 9 escenarios completos de `quickstart.md` de punta a punta con navegador
  real en mobile y desktop, como pase de regresión final antes de cerrar la feature. Documentar
  cualquier hallazgo y su resolución. Depende de T006, T011, T014, T015
- [X] T017 Correr `/speckit-analyze` contra la constitución antes de dar la tarea por terminada, per
  CLAUDE.md. Depende de T012, T013, T016
  **Corrido**: 0 CRITICAL, 0 HIGH, cobertura 100% (15/15 FR+SC con al menos una tarea asociada). 2
  hallazgos LOW: F1 (FR-010 sin escenario de quickstart dedicado — se satisface por construcción,
  no bloqueante) y F2 (referencias a línea de `exportarJSON()` desactualizadas en quickstart.md/
  data-model.md/plan.md/tasks.md — corregido en esta misma sesión, antes de cerrar la tarea).
  Ninguno bloquea el cierre de la feature.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: sin dependencias — inicia de inmediato
- **Foundational (Phase 2)**: N/A — no bloquea nada, se pasa directo a Phase 3
- **US1 (Phase 3, P1)**: depende solo de Setup (T001) — MVP de esta spec
- **US2 (Phase 4, P2)**: depende solo de Setup (T001), no de US1 — pantalla y modal completamente
  distintos
- **Polish (Phase 5)**: depende de que ambas user stories estén completas (T016 depende
  explícitamente de T006, T011, T014, T015)

### User Story Dependencies

- **US1 (P1)**: sin dependencia de US2 — puede implementarse y probarse en solitario
- **US2 (P2)**: sin dependencia de US1 — puede implementarse y probarse en solitario

### Parallel Opportunities

- T002 (`index.html`) y T003 (`styles.css`) de US1 pueden avanzar en paralelo (archivos distintos),
  pero T005 depende de que T002 exista
- T008 y T009 en paralelo dentro de US2 (funciones distintas sobre el mismo modal, sin dependencia
  entre sí), ambas dependen solo de T007
- Phase 3 (US1) y Phase 4 (US2) pueden ejecutarse en paralelo completo entre sí una vez cerrado
  Setup — no comparten pantalla, modal, ni función nueva
- T012 y T013 en paralelo en Polish (verificaciones de solo lectura, sin dependencias entre sí)

---

## Parallel Example: US1 junto a US2

```bash
# Tras cerrar Setup (T001), ambas historias pueden avanzar en paralelo completo:
Task: "Agregar #btn-volver-competicion en screen-setup"      # T002 (US1)
Task: "Agregar #modal-reiniciar en index.html"                # T007 (US2)
```

## Parallel Example: Foundational de US2

```bash
# En paralelo, apenas existe el modal #modal-reiniciar (T007):
Task: "Implementar abrirModalReiniciar()"   # T008
Task: "Implementar cerrarModalReiniciar()"  # T009
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Completar Phase 1: Setup
2. Completar Phase 3: User Story 1
3. **DETENER y VALIDAR**: correr quickstart.md Escenarios 1-3
4. Esto ya cierra el gap más filoso de la spec (no había forma de volver desde setup)

### Incremental Delivery

1. Setup → línea base capturada
2. US1 → validar independientemente (quickstart Escenarios 1-3) → demo del botón de volver
3. US2 → validar independientemente (quickstart Escenarios 4-7) → demo del modal de reinicio con
   exportar opcional
4. Polish → regresión final de los 9 escenarios + `/speckit-analyze`

### Parallel Team Strategy

Con más de un desarrollador: tras cerrar Setup, una persona puede tomar US1 (T002-T006) y otra US2
(T007-T011) en paralelo — no comparten ningún archivo de markup ni función nueva (`index.html` sí es
el mismo archivo físico para ambas, pero en secciones no adyacentes: `screen-setup` para US1,
modales al final del `<body>` para US2).

---

## Notes

- [P] = archivos distintos o funciones independientes sin dependencias entre sí
- [Story] mapea cada tarea a su user story para trazabilidad
- Confirmar después de cada tarea o grupo lógico de tareas
- Detenerse en cada checkpoint para validar la user story de forma independiente
- El hallazgo más importante a no pasar por alto durante la implementación es research.md §2: sin
  `location.reload()`, "volver" desde setup deja la pantalla de selección de competición teñida con
  la paleta de la competición abandonada — no es opcional, es lo que hace correcta la Garantía 2 del
  contrato
