# Contrato: Pantalla (modal) de administración del registro de jugadores

Garantías que debe cumplir `#modal-admin-registro` y las funciones que lo alimentan
(`data-model.md`, tabla de funciones nuevas). Sirve como criterio de aceptación verificable
independiente de la implementación exacta del DOM.

## Garantía 1 — Acceso desde Config, sin depender de un torneo activo

El botón que abre `#modal-admin-registro` vive en `screen-config` y está siempre habilitado,
independientemente de si hay un torneo activo, de su fase, o de si `jugadores_conocidos` está
vacío. A diferencia del botón "Importar del registro" de spec 003 (condicional a que el registro
tenga entradas), este botón siempre es visible — su propio contenido maneja el caso vacío (Garantía
2).

## Garantía 2 — Estado vacío sin errores

Si `jugadores_conocidos` no existe o es `[]`, abrir el modal muestra un mensaje de estado vacío
(mismo patrón visual que "No hay jugadores nuevos para importar" de spec 003,
`app.js:517`) — nunca una lista rota, un error en consola, ni un modal que no abre.

## Garantía 3 — Edición de nombre: rechazo explícito de colisión, sin fusión silenciosa

`guardarEdicionNombreRegistro` NUNCA persiste un nombre editado cuyo `nombreNormalizado` coincida
con el de otra entrada distinta del registro. En ese caso: (a) no se modifica ninguna de las dos
entradas, (b) se muestra un mensaje de error inline en la fila en edición, (c) el modo edición de
esa fila permanece abierto para que el usuario pueda corregir o cancelar — no se cierra
automáticamente tras un rechazo.

## Garantía 4 — Edición de nombre no es retroactiva

Ninguna función de esta spec escribe en `estado.jugadores`, `torneo_data`, ni en ningún dato de un
torneo ya confirmado. `guardarEdicionNombreRegistro` solo escribe en `jugadores_conocidos`.
Verificable: tras editar una entrada, un torneo activo o pasado que haya usado el nombre viejo de
ese jugador sigue mostrando el nombre viejo en cualquier pantalla de ese torneo.

## Garantía 5 — Borrado requiere confirmación explícita y es aislado

`borrarEntradaRegistro` siempre pasa por `mostrarConfirm(...)` (el modal genérico ya existente,
`app.js:308`) antes de modificar `localStorage` — nunca borra directo al clic. Tras confirmar el
borrado: (a) la entrada desaparece de `jugadores_conocidos` y de la lista visible del modal, (b)
ninguna otra entrada del registro cambia, (c) si el jugador borrado está en el roster de un torneo
activo, ese roster no cambia — ni el nombre, ni el equipo, ni las estadísticas del jugador dentro
del torneo se ven afectados.

## Garantía 6 — Historial visible es de solo lectura

El bloque de historial expandido por `toggleHistorialAdminRegistro` no contiene ningún control de
edición o borrado por entrada individual — únicamente lista equipo, competición y fecha de cada
`EntradaHistorial`, ordenadas de más reciente a más antigua. Un jugador sin historial (`historial`
ausente o `[]`) muestra un estado vacío específico para esa sección (spec.md, User Story 3,
escenario 2) — distinto del estado vacío de "sin entradas en el registro" (Garantía 2).

## Garantía 7 — Accesibilidad y patrón visual

`#modal-admin-registro` sigue el mismo esqueleto de modal ya usado por el resto de la app
(`modal-overlay`/`modal-box`, cierre por botón X y por clic fuera, `role="dialog"`,
`aria-modal="true"`) — sin animación nueva más allá de la ya existente de apertura/cierre de
modales (respeta `prefers-reduced-motion` porque reutiliza el mecanismo compartido, no introduce
uno propio). Todos los botones de fila (editar, borrar, expandir) cumplen touch target ≥44px.
