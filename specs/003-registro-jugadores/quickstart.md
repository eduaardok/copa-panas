# Quickstart: Validación del registro persistente de jugadores (Copa Panas v2)

Guía de validación manual (el proyecto no tiene framework de tests — Technical Context en
`plan.md`). Cada escenario referencia los Acceptance Scenarios de `spec.md`.

## Prerrequisitos

- Ningún build: abrir `index.html` directamente (`file://`) o vía servidor estático simple.
- Probar en al menos mobile (~390px) y desktop (≥1024px) para el modal de importación.
- Tener a mano DevTools → Application → Local Storage para inspeccionar `torneo_data` y
  `jugadores_conocidos` por separado.

## Escenario 1 — Primer uso, sin registro previo (US2 / FR-007, SC-002)

1. Borrar ambas claves de Local Storage (`torneo_data` y `jugadores_conocidos`) si existen.
2. Abrir la app, elegir cualquier competición, llegar a `screen-setup`.
3. Verificar que **no** aparece ningún botón ni sección de "Importar del registro" junto al label
   "Jugadores" (contrato setup-import-contract.md, garantía 1).
4. Completar el alta manual de jugadores y el resto del flujo hasta confirmar el torneo, igual que
   antes de esta spec — cero pasos nuevos obligatorios.
5. Tras confirmar, inspeccionar Local Storage: `jugadores_conocidos` debe existir ahora, con una
   entrada por cada nombre del roster recién confirmado (FR-006/FR-007).

## Escenario 2 — Reutilizar jugadores de un torneo anterior (US1 / FR-003, FR-004)

Requiere haber completado el Escenario 1 primero (o tener `jugadores_conocidos` ya poblado).

1. Reiniciar el torneo (Config → Reiniciar torneo) para volver a `screen-competicion`, elegir una
   competición (puede ser distinta a la del Escenario 1 — D4 es transversal) y llegar de nuevo a
   `screen-setup`.
2. Verificar que ahora sí aparece el botón "Importar del registro".
3. Abrirlo → debe listarse cada jugador de `jugadores_conocidos`, no solo los del torneo más
   reciente si hubiera más de uno acumulado (FR-004).
4. Seleccionar uno o más jugadores y confirmar → deben aparecer cargados en los `<input>` de
   `#lista-jugadores`, indistinguibles de un alta manual.
5. Escribir además un nombre nuevo a mano en otro `<input>` vacío → confirmar el torneo debe
   funcionar con la combinación de ambos orígenes, sin error ni duplicado (Acceptance Scenario 3
   de US1).

## Escenario 3 — Deduplicación por nombre normalizado (FR-005, SC-003)

1. En `#lista-jugadores`, escribir el mismo jugador dos veces con variaciones de mayúsculas y
   espacios (ej. `"Juan Pérez"` y `"juan   pérez"` en dos `<input>` distintos) → el botón
   "Confirmar jugadores" debe quedar deshabilitado y ambos inputs marcados como error (mismo
   comportamiento ya existente, ahora cubriendo espacios internos múltiples — research.md §2).
2. Abrir el modal de importación con un jugador del registro cuyo nombre normalizado ya coincide
   con uno tipeado en el roster actual → ese jugador NO debe aparecer como opción seleccionable
   (contrato setup-import-contract.md, garantía 4).
3. Confirmar dos torneos consecutivos reutilizando parcialmente el mismo jugador (uno importado,
   otro tipeado a mano con variación de mayúsculas) → inspeccionar `jugadores_conocidos` y
   verificar que sigue habiendo una sola entrada para ese jugador, no dos.

## Escenario 4 — No se pierde texto tipeado al importar (research.md §6)

1. En `#lista-jugadores`, escribir un nombre a mano en la fila #1 (sin confirmar el torneo
   todavía).
2. Abrir "Importar del registro", seleccionar un jugador, confirmar la importación.
3. Verificar que la fila #1 conserva el nombre tipeado a mano sin cambios, y que el jugador
   importado ocupa una fila distinta (vacía o nueva, según cupo disponible) — no se perdió ni se
   sobreescribió el valor de la fila #1.

## Escenario 4b — Validación en vivo en una fila creada por el import (research.md §6a)

Requiere que el import haya tenido que crear una fila nueva (no reutilizar un `<input>` vacío
existente) — por ejemplo, dejando `_numJugadores` sin filas vacías sobrantes antes de importar.

1. Importar un jugador del registro en un momento en que no queden `<input>` vacíos disponibles,
   de forma que el import agregue una fila nueva al final del contenedor.
2. Sin recargar la página, editar a mano el nombre de esa fila recién creada (por ejemplo, dejarlo
   vacío o duplicarlo con el nombre de otra fila).
3. Verificar que la validación en vivo reacciona igual que en cualquier otra fila: el input se
   marca en error (vacío o duplicado) y el botón "Confirmar jugadores" se deshabilita sin
   necesidad de ningún otro clic o evento adicional — la fila nueva no debe comportarse distinto a
   una fila creada por `renderizarListaJugadores()` (contrato implícito de research.md §6a: misma
   función auxiliar de fila, mismo wiring de `input`/`keydown`).

## Escenario 5 — Motor sin cambios (FR-009, SC-004)

1. Completar cualquiera de los escenarios anteriores de punta a punta hasta tener un torneo activo
   funcionando (calendario, tabla de posiciones).
2. Correr `git diff --stat motor.js` (o revisar el diff del branch) → debe estar vacío.

## Fuera de alcance de esta guía

- Historial de equipos por jugador — diferido, sin escenario de validación en esta spec.
- Edición o borrado de entradas de `jugadores_conocidos` — no existe UI para esto (deuda conocida,
  ver spec.md Edge Cases/Assumptions); no hay escenario que lo ejercite porque no hay
  comportamiento que probar.
