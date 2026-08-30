# Research: Historial de equipos y administración del registro de jugadores

Investigación puntual sobre el código real (`app.js`, `index.html`, `competiciones.js`) antes de
diseñar. Cada hallazgo referencia línea/función verificada por lectura directa, no supuesta.

## §1 — Dónde vive hoy el registro de jugadores (spec 003, punto de partida)

`app.js:14` define `CLAVE_LS_JUGADORES = 'jugadores_conocidos'`. El bloque
`app.js:101-142` contiene todo el subsistema actual: `normalizarNombreJugador`,
`cargarJugadoresConocidos`, `guardarJugadoresConocidos`, `actualizarRegistroJugadores`. Cada
entrada hoy es `{ nombreNormalizado, nombre, ultimoUso }` (confirmado también en
`specs/003-registro-jugadores/data-model.md`). No hay `id` — `nombreNormalizado` ya cumple ese rol
por construcción.

## §2 — Hallazgo crítico: el momento real de "torneo confirmado" no es donde se actualiza el registro hoy

El pedido y spec.md asumen que el historial se agrega "al confirmar la creación de un torneo",
reusando el mismo mecanismo de spec 003. Pero `actualizarRegistroJugadores(estado.jugadores)` se
llama en `confirmarJugadores()` (`app.js:489`), que es la transición `fase: 'setup' → 'equipos'`
— **antes** de que exista asignación de equipo. En ese punto, `app.js:474-478` construye
`estado.jugadores` con `equipo: estado.jugadores[i]?.equipo || ''` — siempre vacío en un torneo
nuevo. El equipo recién queda fijo en `confirmarEquipos()` (`app.js:719-748`), que transiciona
`fase: 'equipos' → 'grupos_config'`: ahí es donde `j.equipo = sel.value` (modo manual) o el sorteo
ya escribió `estado.jugadores[i].equipo` (modo aleatorio, verificado por el chequeo
`estado.jugadores.every(j => j.equipo)` en la línea 724).

**Decisión**: el historial de equipos (FR-001/FR-002 de spec.md) se agrega en un punto nuevo,
al final de `confirmarEquipos()`, no reutilizando la llamada existente de `confirmarJugadores()`.
La actualización de *nombre* del registro (spec 003, sin cambios) sigue ocurriendo donde ya
ocurre — esta spec no la mueve ni la duplica. Esto no reabre la decisión de spec 003 ("automática y
silenciosa al confirmar la creación de un torneo"): para el historial, el momento en que el torneo
queda con datos completos para una entrada de historial (jugador + equipo + competición) es
`confirmarEquipos()`, no `confirmarJugadores()` — es el mismo principio ("automático, sin paso
extra"), aplicado al punto donde el dato necesario existe.

## §3 — De dónde sale `competicion` para la entrada de historial

`estado.competicion` (ya existente, fijado en `screen-competicion`) guarda el id (`'mundial'` /
`'champions'`). `competiciones.js:30-84` define `COMPETICIONES[id].nombre` (ej. `'Mundial 2026'`,
`'Champions League'`) — es el nombre legible a persistir en la entrada de historial, resuelto en
`app.js` por lectura de `COMPETICIONES[estado.competicion].nombre` en el momento de
`confirmarEquipos()`, sin que `competiciones.js` necesite ningún cambio (solo lectura de una
constante ya expuesta).

## §4 — Verificación: `motor.js` y `competiciones.js` no requieren cambios

`grep` de `jugadores_conocidos`, `CLAVE_LS_JUGADORES`, `historial` contra `motor.js` y
`competiciones.js`: cero resultados antes de esta spec y ningún cambio de esos archivos es
necesario para lo que pide spec.md — `competiciones.js` solo se **lee** (§3) para resolver un
nombre de competición ya expuesto, no se modifica su estructura. `motor.js` no participa en ningún
punto del ciclo de vida del registro (confirmado también por spec 003, research §4). FR-012/SC-004
de spec.md quedan satisfechos por diseño.

## §5 — Patrón de UI a reutilizar para la pantalla de administración

La app no tiene un patrón de "pantalla completa nueva de router" liviano para utilidades de
configuración — `Config` (`index.html:431-477`, `screen-config`) es una screen del router
(`estado.fase`-independiente, siempre alcanzable), pero agregar un `estado.fase` nuevo para esto
sería alcance mayor al necesario y el registro es transversal, no parte del ciclo de un torneo. El
patrón ya usado para utilidades de este tipo es el modal (`modal-importar-jugadores`,
`index.html:600-610`, más `modal-confirm` genérico para acciones destructivas,
`index.html:562-574`, ya cableado a `mostrarConfirm(titulo, msg, callback)` en `app.js:308-313`).

**Decisión**: la pantalla de administración es un modal nuevo (`#modal-admin-registro`), abierto
desde un botón nuevo en `screen-config` (junto a la sección "Datos del torneo", mismo patrón visual
de `card-glass`), no una screen de router nueva. Evita: (a) un valor nuevo de `estado.fase` que la
constitución no pide y que complicaría `mostrarPantalla()`/nav tabs sin necesidad real, (b) que el
registro deje de ser accesible cuando no hay torneo activo — un modal desde Config es alcanzable
exactamente en las mismas condiciones en que ya lo es hoy `screen-config` misma.

El borrado usa el `mostrarConfirm()` genérico ya existente (mismo componente que "Reiniciar
torneo", `app.js:2285-2295`) — no se crea un segundo modal de confirmación.

## §6 — Edición inline vs. modo edición por fila

La lista de jugadores en el modal de importación (`app.js:503-533`) ya renderiza filas
`.clasificado-row` con click-to-toggle. Para administración se necesita algo distinto: cada fila
necesita mostrar nombre + acciones (editar, borrar) + detalle expandible de historial (US3). Se
sigue el patrón ya usado en `renderizarClasificados`/tablas expandibles de la app (misma clase
`clasificado-row` como base de fila, con un botón de expandir que revela un bloque
`.historial-detalle` — sin librería nueva, mismo mecanismo `classList.toggle('hidden', …)` usado en
el resto de la app para mostrar/ocultar bloques). La edición de nombre se hace reemplazando el
`<span>` de nombre por un `<input>` en la misma fila al hacer click en "Editar" (mismo patrón que
edición de campos ya usado en `#lista-jugadores`), sin abrir un modal anidado dentro del modal de
administración.

## §7 — Colisión de nombres al editar (spec.md, Decisiones de diseño)

Reutiliza `normalizarNombreJugador()` (`app.js:104-106`), ya la única fuente de verdad de
normalización (spec 003). Al guardar una edición: `normalizarNombreJugador(nuevoNombre)` se
compara contra todas las entradas de `jugadores_conocidos` **salvo la propia** (por
`nombreNormalizado` original antes de la edición). Si coincide con otra entrada, se rechaza sin
tocar `localStorage` — mismo patrón de validación ya usado en `validarJugadores()`
(`app.js:341-…`), aplicado ahora a una sola entrada en vez de a un roster completo.

## §8 — Borrado no afecta torneo activo (spec.md, Decisiones de diseño)

Confirmado por `data-model.md` de spec 003 (§"Relación con estado.jugadores"): `estado.jugadores[]`
no tiene ninguna referencia al registro (`jugadores_conocidos`) — ni un id compartido, ni un flag.
Borrar una entrada de `jugadores_conocidos` es una operación aislada sobre esa clave de
`localStorage`; no hay ningún código que lea `jugadores_conocidos` durante el ciclo de vida de un
torneo activo salvo el modal de importación en `screen-setup` (que ya filtra por nombre, no por
referencia). No se requiere ninguna limpieza cruzada al borrar.

## §9 — Entradas de registro previas a esta spec (sin `historial`)

`cargarJugadoresConocidos()` (`app.js:108-117`) ya tolera JSON parcialmente distinto vía
`Array.isArray(datos) ? datos : []` — no valida la forma de cada entrada. Una entrada sin campo
`historial` (creada antes de esta spec) simplemente no tiene esa propiedad; el código de lectura
debe tratar `entrada.historial` ausente como `[]` (`entrada.historial || []`), sin migración
explícita de esquema — mismo criterio ya usado por `cargar()`/`migrarEstado()` para tolerar datos
antiguos, pero aquí ni siquiera hace falta escritura de migración porque el campo faltante nunca se
lee como error, solo como lista vacía.
