# Contrato: Acumulación de historial de equipos

Garantías del mecanismo que llena `EntradaHistorial` (`data-model.md`) al confirmar un torneo.

## Garantía 1 — Se agrega en `confirmarEquipos()`, no en `confirmarJugadores()`

La entrada de historial se crea recién cuando `estado.jugadores[i].equipo` está definitivamente
asignado para todos los jugadores del roster (research.md §2) — al final de `confirmarEquipos()`,
nunca antes. Un torneo que llega hasta `confirmarJugadores()` pero se abandona antes de confirmar
equipos (usuario cierra la app, recarga sin completar) NO produce ninguna entrada de historial
parcial ni con equipo vacío.

## Garantía 2 — Automático y silencioso, sin paso nuevo para el usuario

`agregarHistorialEquipos` se invoca sin ningún botón, modal de confirmación, o paso adicional
visible — mismo estándar ya cerrado por spec 003 para la actualización de nombre/`ultimoUso`. El
usuario que confirma la asignación de equipos como ya lo hace hoy no percibe ningún cambio de flujo.

## Garantía 3 — Un torneo, una entrada por jugador, sin deduplicar por equipo

Cada vez que se confirma la asignación de equipos de un torneo, cada jugador del roster recibe
exactamente una `EntradaHistorial` nueva, incluso si el equipo asignado coincide con uno que ya
tiene en su historial de un torneo anterior (spec.md FR-003). No hay lógica de "si ya jugó con este
equipo, no agregar de nuevo".

## Garantía 4 — Jugadores nuevos en el registro también reciben su primera entrada

Un jugador que no existía en `jugadores_conocidos` antes de este torneo (fue agregado recién por
`actualizarRegistroJugadores` en `confirmarJugadores()`, spec 003) también recibe su
`EntradaHistorial` correspondiente al confirmar equipos — no queda con historial vacío a pesar de
haber jugado ese torneo (spec.md, User Story 4, escenario 2).

## Garantía 5 — Independiente de la competición

`agregarHistorialEquipos` funciona igual sea `estado.competicion === 'mundial'` o
`'champions'` (o cualquier competición futura) — el nombre de competición se lee de
`COMPETICIONES[estado.competicion].nombre` sin ninguna rama condicional por id de competición
dentro de la función (spec.md FR-011, Principio II/IV de la constitución).

## Garantía 6 — No participa `motor.js`

`agregarHistorialEquipos` y todo el subsistema de historial viven exclusivamente en `app.js`. Ni
`motor.js` ni `competiciones.js` exponen ni consumen ninguna función o dato relacionado con
`historial` (spec.md FR-012/SC-004).
