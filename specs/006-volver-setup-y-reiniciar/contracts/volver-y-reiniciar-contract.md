# Contrato: Volver desde setup y Reiniciar torneo desde Config

Cubre las dos entradas hacia `screen-competicion` descritas en `spec.md`. Referencia:
`research.md` §1-§4, `data-model.md`.

## Garantía 1 — "Volver" desde setup es inmediato

Al hacer click/tap en `#btn-volver-competicion`, el sistema ejecuta `limpiarStorage()` seguido de
`location.reload()` sin mostrar ningún modal ni disparar `exportarJSON()`. No existe ninguna ruta de
código entre el click y esas dos llamadas que muestre un `#modal-*` o pida confirmación.

*Verifica*: FR-001, FR-002, spec.md User Story 1 Acceptance Scenario 2.

## Garantía 2 — "Volver" deja un estado neutro tras recargar

Después de que `volverASeleccionCompeticion()` corre, la siguiente carga de `inicializar()` toma la
rama `!hayDatos` (no hay `torneo_data` en `localStorage`), muestra `screen-competicion`, y nunca
llama a `aplicarPaletaCompeticion(...)` en ese camino — las variables inline de paleta que la
competición abandonada haya aplicado no vuelven a establecerse, y `:root` de `styles.css` queda
vigente. Elegir una competición de nuevo (la misma u otra) siempre arranca desde
`comp.formatoDefault`, nunca desde un `configFormato` de un intento anterior.

*Verifica*: FR-003, spec.md User Story 1 Acceptance Scenarios 3-4.

## Garantía 3 — El modal de reinicio dice a dónde lleva

El texto de `#modal-reiniciar` (título y cuerpo) menciona explícitamente que la acción borra el
torneo actual y lleva a elegir una competición distinta — no reutiliza el copy genérico
"¿ESTÁS SEGURO? / Esta acción no se puede deshacer" de `#modal-confirm` sin esa aclaración.

*Verifica*: FR-005, spec.md User Story 2 Acceptance Scenario 1.

## Garantía 4 — Exportar y confirmar son acciones independientes

Tocar el botón "Exportar" dentro de `#modal-reiniciar`:
- Dispara `exportarJSON()`.
- **No** cierra el modal.
- **No** ejecuta `limpiarStorage()` ni `location.reload()`.

El borrado solo ocurre cuando el usuario toca, en un paso aparte, el botón de confirmación del
mismo modal. Un usuario puede exportar y luego cancelar sin que se pierda ningún dato — el archivo
ya descargado no obliga a continuar con el reinicio.

*Verifica*: FR-006, FR-007, spec.md User Story 2 Acceptance Scenarios 2, 2b, 3.

## Garantía 5 — Cancelar no toca nada

Cerrar `#modal-reiniciar` por cualquier vía (botón Cancelar, click fuera, X) invoca
`cerrarModalReiniciar()`, que solo oculta el modal (`cerrarModalConAnimacion('modal-reiniciar')`) y
no llama a `limpiarStorage()` en ningún punto de esa ruta — con o sin haber exportado antes.

*Verifica*: FR-008, spec.md User Story 2 Acceptance Scenario 4.

## Garantía 6 — Un fallo de exportación no bloquea nada

`exportarJSON()` ya envuelve su lógica en `try/catch` y muestra `mostrarToast('Error al exportar',
'error')` si falla, sin relanzar la excepción. El botón "Exportar" de `#modal-reiniciar` no agrega
ninguna lógica adicional de manejo de errores — el modal permanece exactamente igual de operable
(Cancelar/Confirmar siguen disponibles) tanto si la exportación tuvo éxito como si falló.

*Verifica*: FR-011, spec.md Edge Cases (fallo de `exportarJSON()`).

## Garantía 7 — Alcance: sin nuevas puertas de salida

Ningún control de "volver a selección de competición" se agrega a `screen-dashboard`,
`screen-fase-grupos`, `screen-clasificados` ni `screen-eliminacion`. La única forma de llegar a
`screen-competicion` desde esas pantallas sigue siendo `#btn-reiniciar` en `screen-config`.

*Verifica*: FR-009, spec.md sección "Fuera de alcance".

## Garantía 8 — Dos entradas, visualmente distintas

`#btn-volver-competicion` (setup) y `#btn-reiniciar` (Config) no comparten clase visual principal ni
aparecen en el mismo contenedor — el primero es un ícono-botón discreto en `screen-setup`, el
segundo sigue siendo el botón ancho `.btn-danger` dentro de la tarjeta "Zona de peligro" en Config.

*Verifica*: FR-010, spec.md sección "Fuera de alcance" (no fusión visual).
