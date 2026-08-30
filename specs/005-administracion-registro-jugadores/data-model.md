# Data Model: Historial de equipos y administración del registro de jugadores

No modifica el esquema de `estado` (`torneo_data`) ni el de `COMPETICIONES` (`competiciones.js`).
Extiende exclusivamente el esquema ya existente de `jugadores_conocidos` (spec 003). Campos
marcados **NUEVO** no existen en el código actual.

## `jugadores_conocidos` (clave existente de `localStorage`) — extendida

Cada entrada `JugadorConocido` gana un campo nuevo:

| Campo | Tipo | Notas |
|---|---|---|
| `nombreNormalizado` | string | Sin cambios (spec 003) — clave de deduplicación. |
| `nombre` | string | Sin cambios (spec 003) — nombre de presentación, ahora editable desde la pantalla de administración (FR-005). |
| `ultimoUso` | string (ISO 8601) | Sin cambios (spec 003). |
| `historial` | array de `EntradaHistorial` | **NUEVO**. Lista de participaciones en torneos confirmados, más reciente primero al leerse para UI (el orden de inserción ya es cronológico — no requiere campo de orden separado). Ausente en entradas creadas antes de esta spec; se trata como `[]` al leer (research.md §9), nunca como error. |

### `EntradaHistorial` — **NUEVO**, anidada dentro de `historial`

| Campo | Tipo | Notas |
|---|---|---|
| `equipo` | string | Equipo asignado a este jugador en ese torneo (`estado.jugadores[i].equipo` al momento de `confirmarEquipos()`, research.md §2). |
| `competicion` | string | Nombre legible de la competición (`COMPETICIONES[estado.competicion].nombre`, research.md §3) — no el id interno, para que sea directamente mostrable sin resolver de nuevo. |
| `fecha` | string (ISO 8601) | Momento de `confirmarEquipos()` para ese torneo — no la fecha de `confirmarJugadores()` (research.md §2). |

Inmutable una vez creada: no se edita ni se borra individualmente (spec.md, Assumptions) — solo se
lee dentro del detalle expandible de la entrada de jugador en la pantalla de administración.

Ejemplo de una entrada completa tras esta spec:

```json
{
  "nombreNormalizado": "juan pérez",
  "nombre": "Juan Pérez",
  "ultimoUso": "2026-08-29T20:15:00.000Z",
  "historial": [
    { "equipo": "Real Madrid", "competicion": "Champions League", "fecha": "2026-08-30T14:02:00.000Z" },
    { "equipo": "Brasil", "competicion": "Mundial 2026", "fecha": "2026-08-29T20:15:30.000Z" }
  ]
}
```

Entrada preexistente sin tocar por esta spec (creada por spec 003, aún no jugó un torneo desde que
se implementó el historial):

```json
{ "nombreNormalizado": "ana gómez", "nombre": "Ana Gómez", "ultimoUso": "2026-08-20T18:40:00.000Z" }
```

— sin campo `historial`; se lee como `[]` (research.md §9), se muestra como estado vacío (spec.md,
User Story 3, escenario 2).

## Ciclo de vida de `historial` dentro de una entrada

```
confirmarJugadores()                    (fase: setup → equipos, sin cambios de spec 003)
        │
   actualizarRegistroJugadores(estado.jugadores)   → agrega/actualiza nombre + ultimoUso (sin equipo aún)
        │
        ▼
   [pantalla de asignación de equipos — modo aleatorio o manual]
        │
confirmarEquipos()                      (fase: equipos → grupos_config)   ← NUEVO punto de enganche
        │
   estado.jugadores[i].equipo ya definido para todos
        │
   agregarHistorialEquipos(estado.jugadores, COMPETICIONES[estado.competicion].nombre)   (NUEVO)
        │
        ▼
   por cada jugador del roster: push a su entrada de jugadores_conocidos
   { equipo, competicion, fecha: ahora }   — no deduplica por equipo repetido (spec.md FR-003)
```

No hay transición de baja individual de una entrada de `historial` — solo se pierde completa si se
borra el jugador entero del registro (User Story 2).

## Ciclo de vida de una entrada completa (edición / borrado — nuevo con esta spec)

```
entrada existente en jugadores_conocidos
        │
   ┌────┴─────────────────────────────┐
   │ editar nombre (US1)              │ borrar (US2)
   ▼                                   ▼
normalizarNombreJugador(nuevoNombre)   mostrarConfirm(...) → ok
        │                                   │
¿coincide con OTRA entrada?            registro = registro.filter(j => j !== entrada)
   │ sí          │ no                       │
 rechazar    entrada.nombre = nuevoNombre   guardarJugadoresConocidos(registro)
 (sin tocar  guardarJugadoresConocidos(...)
  storage)   (nombreNormalizado también se recalcula —
              es la clave de dedup, debe seguir
              reflejando el nombre vigente)
```

Ninguna de las dos operaciones toca `estado.jugadores` ni ningún torneo ya confirmado —
`jugador_en_torneo` permanece independiente del registro (spec 003, confirmado en research.md §8).

## Nuevas funciones en `app.js` (sin archivos nuevos)

| Función | Rol |
|---|---|
| `agregarHistorialEquipos(jugadoresDelRoster, nombreCompeticion)` | **NUEVO** — llamada desde `confirmarEquipos()` (research.md §2): por cada jugador, busca su entrada en el registro por `nombreNormalizado` y le hace `push` de una `EntradaHistorial` nueva. Si el jugador no existe todavía en el registro (no debería pasar, porque `confirmarJugadores()` ya lo agregó antes — pero se tolera sin lanzar error, ver Edge Cases de research §9 aplicado defensivamente), se ignora esa entrada sin romper el flujo. |
| `abrirModalAdminRegistro()` | **NUEVO** — renderiza la lista completa de `jugadores_conocidos` en `#modal-admin-registro`, una fila por entrada con nombre, botón editar, botón borrar, botón expandir historial. |
| `cerrarModalAdminRegistro()` | **NUEVO** — oculta el modal (mismo mecanismo que `cerrarModalImportarJugadores`). |
| `toggleHistorialAdminRegistro(nombreNormalizado)` | **NUEVO** — expande/colapsa el bloque de historial de una fila (research.md §6). |
| `iniciarEdicionNombreRegistro(nombreNormalizado)` | **NUEVO** — reemplaza el `<span>` de nombre de esa fila por un `<input>` con el valor actual, listo para editar. |
| `guardarEdicionNombreRegistro(nombreNormalizado, inputEl)` | **NUEVO** — valida vacío, normaliza, chequea colisión contra otra entrada (research.md §7); si pasa, actualiza `nombre` y recalcula `nombreNormalizado`, persiste, re-renderiza la fila; si falla, muestra error inline sin cerrar el modo edición. |
| `borrarEntradaRegistro(nombreNormalizado)` | **NUEVO** — abre `mostrarConfirm(...)` (genérico, ya existente); en el callback, filtra la entrada del registro, persiste, re-renderiza la lista completa del modal. |

Funciones existentes con edición puntual (sin cambio de firma ni de responsabilidad):

| Función | Cambio |
|---|---|
| `confirmarEquipos()` (`app.js:719`) | Una línea nueva al final, antes de `mostrarPantalla('grupos-config')`: `agregarHistorialEquipos(estado.jugadores, COMPETICIONES[estado.competicion].nombre)`. |
| `cargarJugadoresConocidos()` (`app.js:108`) | Sin cambio de firma ni de cuerpo — ya tolera entradas sin `historial` por no validar forma (research.md §9); el resto del código nuevo trata `entrada.historial || []` al leer. |

## Fuera de alcance (sin esquema nuevo)

- Estadísticas de torneo (goles, resultado, posición final) dentro de `EntradaHistorial` —
  explícitamente fuera de alcance (spec.md, Assumptions).
- Edición o borrado de una `EntradaHistorial` individual — solo se lee; la única operación de
  borrado es sobre la entrada completa del jugador (spec.md, Assumptions).
- Reconstrucción retroactiva de `historial` para torneos confirmados antes de esta spec — no hay
  transformación de datos existentes, solo lectura tolerante de su ausencia (research.md §9).
