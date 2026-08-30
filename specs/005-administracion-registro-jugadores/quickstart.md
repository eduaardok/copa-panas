# Quickstart: Validación del historial de equipos y administración del registro

Guía de validación manual (el proyecto no tiene framework de tests — Technical Context en
`plan.md`). Cada escenario referencia los Acceptance Scenarios de `spec.md`.

## Prerrequisitos

- Ningún build: abrir `index.html` directamente (`file://`) o vía servidor estático simple.
- Probar en al menos mobile (~390px) y desktop (≥1024px) para el modal de administración.
- Tener a mano DevTools → Application → Local Storage para inspeccionar `jugadores_conocidos`.
- Tener al menos un jugador que participe en dos torneos de competiciones distintas (Mundial y
  Champions) para los escenarios de historial.

## Escenario 1 — Corregir un nombre mal escrito (US1 / FR-005, FR-006)

1. Completar un torneo hasta tener al menos una entrada en `jugadores_conocidos` (o editar
   `localStorage` a mano para simular el typo motivador: ej. `"Jaun Pérez"`).
2. Ir a Config → abrir la pantalla de administración del registro.
3. Editar esa entrada, corrigiendo el nombre (`"Juan Pérez"`), guardar.
4. Verificar en Local Storage que `nombre` y `nombreNormalizado` de esa entrada reflejan el nombre
   corregido.
5. Si el torneo del paso 1 sigue activo o hay uno pasado exportado, verificar que el nombre dentro
   de ese torneo NO cambió (Acceptance Scenario 3 de US1).
6. Repetir la edición intentando poner un nombre que normalizado coincida con otra entrada
   existente → debe rechazarse con mensaje claro, sin modificar ninguna de las dos entradas
   (Acceptance Scenario 4 de US1, contrato `admin-registro-contract.md` Garantía 3).

## Escenario 2 — Borrar una entrada sin afectar el torneo activo (US2 / FR-007, FR-008)

1. Con un torneo activo en curso que incluya un jugador X, ir a Config → administración del
   registro.
2. Borrar la entrada de X (o de cualquier otro jugador del registro no relacionado) → confirmar
   cuando el sistema pida confirmación (contrato Garantía 5).
3. Verificar que la entrada desaparece de la lista y de `jugadores_conocidos`.
4. Volver a la pantalla del torneo activo (dashboard/grupos/bracket) → verificar que X sigue en el
   roster con su equipo y estadísticas intactas, sin ningún cambio visible (Acceptance Scenario 3
   de US2).
5. Ir al flujo de creación de un torneo nuevo, abrir "Importar del registro" → verificar que X ya
   no aparece como opción disponible (Acceptance Scenario 2 de US2).

## Escenario 3 — Historial se acumula automáticamente al confirmar equipos (US4 / FR-002, FR-003)

1. Crear un torneo (cualquier competición) con al menos un jugador ya existente en el registro y
   uno nuevo.
2. Avanzar hasta `confirmarJugadores()` (pantalla de setup → equipos) → en este punto, inspeccionar
   `jugadores_conocidos`: el jugador nuevo ya debe existir (spec 003, sin cambios), pero **ningún**
   jugador debe tener todavía una entrada de historial para este torneo (contrato
   `historial-equipos-contract.md` Garantía 1).
3. Completar la asignación de equipos (aleatorio o manual) y confirmar.
4. Inspeccionar `jugadores_conocidos` de nuevo: cada jugador del roster (incluido el nuevo) debe
   tener una `EntradaHistorial` nueva con el equipo asignado, el nombre de la competición, y una
   fecha reciente (Acceptance Scenarios 1 y 2 de US4).
5. Repetir el torneo completo con el mismo jugador y el mismo equipo que ya tenía en su historial →
   verificar que se agrega una segunda entrada de historial, no se deduplica (Acceptance Scenario 3
   de US4).

## Escenario 4 — Ver historial desde la pantalla de administración (US3 / FR-009, FR-010)

1. Con un jugador que ya acumuló historial de al menos dos torneos de competiciones distintas (ver
   Escenario 3, repetido con otra competición), ir a Config → administración del registro.
2. Expandir el detalle de ese jugador → verificar que se listan ambas entradas de historial, con
   equipo, competición y fecha correctos, ordenadas de más reciente a más antigua (Acceptance
   Scenario 1 de US3).
3. Expandir el detalle de un jugador sin historial (recién agregado al registro, sin haber pasado
   por `confirmarEquipos()` todavía) → verificar estado vacío claro, sin errores (Acceptance
   Scenario 2 de US3).
4. Ir al flujo de importación de jugadores de un torneo nuevo (spec 003) → verificar que el
   historial de equipos NO aparece en ningún lado de ese flujo (FR-010, contrato
   `admin-registro-contract.md` — el historial es de solo lectura y exclusivo del modal de
   administración).

## Escenario 5 — Entradas preexistentes sin historial no rompen nada (Edge Cases)

1. Si es posible, usar una copia de `jugadores_conocidos` guardada antes de esta spec (sin campo
   `historial` en ninguna entrada) — o simular editando `localStorage` a mano quitando ese campo de
   una entrada.
2. Abrir la pantalla de administración → verificar que esa entrada se lista igual que las demás,
   sin error en consola.
3. Expandir su detalle → debe mostrar el estado vacío de historial (research.md §9), no un error ni
   un espacio en blanco roto.
4. Editar y borrar esa entrada → ambas operaciones deben funcionar exactamente igual que en una
   entrada con historial (FR-015).

## Escenario 6 — Motor y configuración de competición sin cambios (FR-012/SC-004)

1. Completar cualquiera de los escenarios anteriores de punta a punta.
2. Correr `git diff --stat motor.js competiciones.js` (o revisar el diff del branch) → debe estar
   vacío.

## Fuera de alcance de esta guía

- Edición o borrado de una entrada de historial individual — no existe esa UI (spec.md,
  Assumptions); no hay escenario que la ejercite.
- Reconstrucción retroactiva de historial para torneos confirmados antes de esta spec — no hay
  comportamiento que probar más allá del Escenario 5 (tolerancia de ausencia).
