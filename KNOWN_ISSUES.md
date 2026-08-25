# Known Issues

Bugs identificados pero deliberadamente no corregidos en el momento en que se encontraron, junto
con la razón. No es un backlog de features — solo defectos conocidos.

## Nombres de ronda intermedios pueden mostrarse mal durante la expansión del bracket

**Dónde**: `renderizarEliminacion()` en `app.js` (y su equivalente en `renderizarDashboard()`),
que calculan `n = Math.pow(2, rondas.length - ronda)` y buscan `nombreDeRonda(n)` (`motor.js`) para
titular cada ronda del bracket de eliminación ("Cuartos de final", "Semifinales", "Final", etc.).

**Síntoma**: mientras el bracket todavía se está expandiendo (no se generó todavía la ronda final),
esta fórmula estima "cuántos equipos arrancan la ronda" a partir de `rondas.length` — la cantidad
de rondas *que existen hasta ahora* — en vez de la profundidad final real del bracket. El resultado
es que una ronda puede mostrarse con el nombre equivocado (ej. una semifinal etiquetada "Final")
mientras falta que se generen las rondas siguientes, y el nombre de una ronda ya jugada puede
*cambiar* (para peor) cuando se generan rondas nuevas después. Una vez que el bracket queda
completo (se generó la ronda final), los nombres se autocorrigen.

**Origen**: heredado de v1 (`Torneo Amigos FC 26`) — la fórmula existía sin cambios antes del
refactor de la spec `001-desacople-motor-rediseno`. Confirmado con Playwright contra un torneo real
de 8 jugadores durante la verificación en navegador de esa spec (ver
`specs/001-desacople-motor-rediseno/tasks.md`, nota en el checkpoint de la Fase 4).

**Por qué no se corrige ahora**: FR-006 de la spec 001 exige preservar sin cambios de
comportamiento el flujo funcional de v1 durante ese refactor — corregirlo ahí hubiera sido una
mejora fuera del alcance declarado de esa spec (era un refactor de desacople de datos, no una
sesión de corrección de bugs). Queda documentado acá para una spec futura dedicada a arreglos de
UI del bracket.

**Fix sugerido (no implementado)**: derivar el nombre de ronda de la profundidad total del
bracket (`Math.ceil(Math.log2(estado.clasificados.length))`, fija desde que se arman los cruces)
en vez de `rondas.length` (que crece con cada ronda jugada).
