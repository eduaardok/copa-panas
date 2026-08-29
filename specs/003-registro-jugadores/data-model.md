# Data Model: Registro persistente de jugadores (Copa Panas v2)

No modifica el esquema de `estado` (`torneo_data`, `version: 2`, cerrado en spec 001/002). Toda
la data nueva vive en una clave de `localStorage` independiente, tal como exige D4. Campos
marcados **NUEVO** no existen en el código actual.

## `jugadores_conocidos` (clave nueva de `localStorage`) — **NUEVO**

Array JSON de entradas `JugadorConocido`:

| Campo | Tipo | Notas |
|---|---|---|
| `nombreNormalizado` | string | Clave de deduplicación (research.md §2): resultado de `normalizarNombreJugador(nombre)` — trim, colapso de espacios internos, minúsculas. No se muestra en UI. |
| `nombre` | string | Nombre de presentación, tal como quedó escrito la última vez que se confirmó un torneo con este jugador (se sobreescribe en cada actualización — ver "Ciclo de vida"). |
| `ultimoUso` | string (ISO 8601) | Fecha de la última vez que este jugador formó parte de un roster confirmado. No se usa para ordenar ni filtrar en esta spec (ver Assumptions de spec.md) — se persiste para uso futuro sin comportamiento asociado hoy. |

Ejemplo:

```json
[
  { "nombreNormalizado": "juan pérez", "nombre": "Juan Pérez", "ultimoUso": "2026-08-29T20:15:00.000Z" },
  { "nombreNormalizado": "ana gómez", "nombre": "Ana Gómez", "ultimoUso": "2026-08-20T18:40:00.000Z" }
]
```

No incluye: equipo asignado, estadísticas, ni historial de equipos por torneo (spec.md,
Decisiones de diseño — historial de equipos explícitamente fuera de alcance) ni un `id` — el
`nombreNormalizado` ya es único por construcción (§2 de research.md) y cumple ese rol.

## Relación con `estado.jugadores` (sin cambios de esquema)

`estado.jugadores[]` (`{ id, nombre, equipo }`, ya cerrado desde spec 001) sigue siendo
exclusivamente "jugador dentro de este torneo". No gana ningún campo nuevo — ni una referencia al
registro, ni un flag de "importado". Una vez que un nombre entra al roster (a mano o importado),
es indistinguible de cualquier otro `jugador_en_torneo` para el resto de la app (asignación de
equipo, tabla de posiciones, bracket) — la separación conceptual que pide D4 vive enteramente en
que son dos claves de `localStorage` distintas, no en un campo compartido.

## Ciclo de vida de una entrada de `jugadores_conocidos`

```
alta manual o import  ──▶  <input> en #lista-jugadores (sin persistir aún)
                                    │
                          confirmarJugadores()
                                    │
                    estado.jugadores = [...] (roster del torneo, ya persistido en torneo_data)
                                    │
                    actualizarRegistroJugadores(estado.jugadores)   (research.md §7)
                                    │
        ¿nombreNormalizado ya existe en jugadores_conocidos?
              │ sí                                   │ no
    actualiza `nombre` + `ultimoUso`         agrega entrada nueva
        de la entrada existente                 { nombreNormalizado, nombre, ultimoUso }
```

No hay transición de baja: ninguna acción de esta spec elimina una entrada de
`jugadores_conocidos` (ver spec.md, Edge Cases — "deuda conocida" de no tener pantalla de
administración).

## Nuevas funciones en `app.js` (sin archivos nuevos)

| Función | Rol |
|---|---|
| `normalizarNombreJugador(nombre)` | **NUEVO** — trim + colapso de espacios internos + minúsculas. Única fuente de verdad para comparar nombres (research.md §2), reemplaza la normalización ad-hoc de `validarJugadores()`. |
| `cargarJugadoresConocidos()` | **NUEVO** — lee `jugadores_conocidos`, `try/catch` simétrico a `cargar()`; devuelve `[]` si no existe la clave o si el JSON es inválido (nunca lanza). |
| `guardarJugadoresConocidos(lista)` | **NUEVO** — `try/catch` simétrico a `guardar()`; mismo manejo de "localStorage lleno" vía `mostrarToast` si falla. |
| `actualizarRegistroJugadores(jugadoresDelRoster)` | **NUEVO** — llamada desde `confirmarJugadores()` (research.md §7): agrega/actualiza entradas sin duplicar. |
| `abrirModalImportarJugadores()` / `cerrarModalImportarJugadores()` | **NUEVO** — muestran/ocultan `#modal-importar-jugadores`, renderizan checkboxes filtrando jugadores ya presentes en el roster en edición (por nombre normalizado). |
| `importarJugadoresSeleccionados()` | **NUEVO** — mecánica de escritura directa en `<input>` existentes/nuevos descrita en research.md §6, sin pasar por `renderizarListaJugadores()` completo. |

Funciones existentes con edición puntual (sin cambio de firma ni de responsabilidad):

| Función | Cambio |
|---|---|
| `validarJugadores()` (app.js:341) | La comparación de duplicados pasa a usar `normalizarNombreJugador()` en vez de `val.toLowerCase()` suelto — endurece la detección de duplicados con espacios internos múltiples, sin cambiar su contrato (sigue deshabilitando `#btn-confirmar-jugadores` si hay vacíos/duplicados). |
| `confirmarJugadores()` (app.js:385) | Una línea nueva al final: `actualizarRegistroJugadores(estado.jugadores)`, después de `guardar()`. |
| `inicializarSetup()` (app.js:275) | Agrega la evaluación de visibilidad del botón "Importar del registro" según `cargarJugadoresConocidos().length > 0` (research.md §8). |

## Fuera de alcance (sin esquema nuevo)

- Historial de equipos por jugador — explícitamente diferido (spec.md, Decisiones de diseño).
- Cualquier UI de administración (editar/borrar entradas de `jugadores_conocidos`) — no hay
  esquema de "edición" ni de "borrado" en este data model (spec.md, Assumptions — deuda conocida).
