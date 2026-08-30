# Quickstart: Navegación de vuelta y reinicio consciente

Guía de validación manual — no hay framework de tests automatizados (Principio I). Requiere abrir
`index.html` (directo con `file://` o servido) con `localStorage` vacío para empezar limpio.

## Prerrequisitos

- Navegador moderno (Chrome/Safari/Firefox/Edge) o Chrome Android / Safari iOS 15+.
- DevTools abiertas en la pestaña Application/Storage para poder limpiar `localStorage` entre
  escenarios (`localStorage.clear()` en la consola sirve).

## Escenario 1 — Volver desde setup, sin fricción (FR-001, FR-002; Garantía 1)

1. Con `localStorage` vacío, cargar la app → aparece `screen-competicion`.
2. Elegir cualquier competición → aparece `screen-setup`.
3. Verificar que hay un ícono de "volver" visible cerca del inicio de la pantalla.
4. Tocarlo.

**Esperado**: vuelve a `screen-competicion` de inmediato. Ningún modal apareció en el camino.

## Escenario 2 — Volver no deja rastro tras recargar (FR-003; Garantía 2)

1. Repetir pasos 1-4 del Escenario 1, pero antes de tocar "volver", cambiar el formato de grupos a
   "Ida y vuelta" (para tener algo que sí debería descartarse).
2. Tocar "volver".
3. Recargar la página manualmente (F5 / pull-to-refresh).

**Esperado**: la app muestra `screen-competicion`, no reanuda `screen-setup`. Elegir la misma
competición de nuevo debe mostrar el formato por defecto de esa competición, no "Ida y vuelta".

## Escenario 3 — Paleta no queda "pegada" tras volver (research.md §2; Garantía 2)

1. Con `localStorage` vacío, elegir una competición con paleta claramente distinta de la otra (ej.
   Mundial, con acento rojo) → `screen-setup`.
2. Tocar "volver" → `screen-competicion`.

**Esperado**: `screen-competicion` se ve con la paleta neutra de siempre, no con el acento rojo de
Mundial. (Si se ve teñida, ver research.md §2 — el reload debería evitar esto.)

## Escenario 4 — Reiniciar torneo: copy explícito (FR-005; Garantía 3)

1. Armar un torneo con al menos un jugador confirmado, para llegar a cualquier pantalla con acceso a
   Config (dashboard, fase de grupos, etc.).
2. Ir a Config → tocar "Reiniciar torneo".

**Esperado**: el modal que aparece menciona explícitamente que la acción lleva a elegir una
competición distinta (no solo "esta acción no se puede deshacer").

## Escenario 5 — Exportar sin comprometerse al borrado (FR-006, FR-007; Garantía 4)

1. Desde el modal de reinicio (Escenario 4), tocar "Exportar".

**Esperado**: se dispara la descarga del JSON del torneo actual. El modal sigue abierto — Cancelar y
Confirmar siguen visibles y operables.

2. Tocar "Cancelar" (en vez de confirmar el borrado).

**Esperado** (Garantía 5 / FR-008): el modal se cierra, el torneo sigue intacto (mismos jugadores,
misma fase) — la exportación no disparó ningún borrado.

## Escenario 6 — Confirmar sin exportar (FR-007; Garantía 4)

1. Abrir el modal de reinicio de nuevo.
2. Sin tocar "Exportar", tocar directamente "Confirmar".

**Esperado**: los datos se borran y la app llega a `screen-competicion`, igual que el flujo ya
existente hoy.

## Escenario 7 — Exportar y luego confirmar (FR-006; Garantía 4)

1. Abrir el modal de reinicio.
2. Tocar "Exportar" (se descarga el JSON).
3. Tocar "Confirmar".

**Esperado**: los datos se borran y la app llega a `screen-competicion` — el archivo ya descargado
sigue disponible en el dispositivo, independientemente del borrado.

## Escenario 8 — Alcance: sin botón de volver fuera de setup (FR-009; Garantía 7)

1. Avanzar un torneo hasta dashboard, fase de grupos, o eliminación.

**Esperado**: ninguna de esas pantallas tiene un control de "volver a selección de competición" — la
única puerta hacia `screen-competicion` sigue siendo "Reiniciar torneo" en Config.

## Escenario 9 — Fallo de exportación no bloquea el modal (FR-011; Garantía 6)

Difícil de forzar manualmente sin alterar el navegador; validar por lectura de código
(`exportarJSON()`, app.js:2125-2139) que el `catch` nunca relanza la excepción y que el botón
"Exportar" del modal no envuelve la llamada en lógica adicional que pueda dejar el modal en un
estado no interactivo.
