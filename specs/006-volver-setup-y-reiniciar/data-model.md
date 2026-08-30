# Data Model: Navegación de vuelta y reinicio consciente

Esta spec no agrega ni modifica ningún campo persistido. No hay entidades ni esquema de datos
nuevo — solo funciones de UI que operan sobre el `estado`/`localStorage` ya existentes.

## Estado afectado (sin cambios de esquema)

| Campo | Dónde vive | Qué le pasa en "volver" (setup) | Qué le pasa en "Reiniciar torneo" (Config) |
|---|---|---|---|
| `estado.competicion` | `estado` (`torneo_data`) | Descartado — `limpiarStorage()` resetea `estado` completo a `crearEstadoVacio()` | Igual |
| `estado.configFormato` | `estado` (`torneo_data`) | Descartado — idem | Igual |
| Resto de `estado` (jugadores, grupos, partidos, meta, fase) | `estado` (`torneo_data`) | En este punto del flujo (setup inicial) estos campos ya están en su valor vacío por defecto; se descartan junto con el resto | Descartados — pueden tener datos reales (equipos, resultados) |
| `jugadores_conocidos` | `localStorage` (`CLAVE_LS_JUGADORES`) | Sin cambios (research.md §4) | Sin cambios |
| Variables CSS de paleta (`--accent`, `--blue`, `--green`, `--gold`, `--header-stripe`) | Inline styles en `document.documentElement` | Vuelven a los valores de `:root` de `styles.css` como efecto del `location.reload()` (research.md §2) — no se tocan directamente | Igual, ya era el comportamiento existente |

No hay entidad "torneo exportado" ni registro de que una exportación ocurrió — exportar desde el
modal de reinicio es un efecto lateral de un solo disparo (descarga de archivo vía `exportarJSON()`)
que no deja rastro en `estado` ni en `localStorage`.

## Funciones nuevas (app.js)

| Función | Responsabilidad | Dispara |
|---|---|---|
| `volverASeleccionCompeticion()` | Handler del click en `#btn-volver-competicion` | `limpiarStorage()` + `location.reload()` — sin modal, sin llamar a `exportarJSON()` (FR-002/FR-003) |
| `abrirModalReiniciar()` | Handler del click en `#btn-reiniciar` (reemplaza la llamada actual a `mostrarConfirm(...)`) | Muestra `#modal-reiniciar` (`classList.remove('hidden')`) |
| `cerrarModalReiniciar()` | Handler de Cancelar / click fuera / X de `#modal-reiniciar` | Oculta el modal vía `cerrarModalConAnimacion('modal-reiniciar')` (app.js:500-511) — no toca `estado` (FR-008) |

## Funciones existentes reutilizadas sin cambios

| Función | Uso en esta spec |
|---|---|
| `limpiarStorage()` (app.js:94-99) | Llamada por ambos flujos al confirmar el borrado |
| `exportarJSON()` (app.js:2125-2139) | Llamada por el botón "Exportar" de `#modal-reiniciar`; ya maneja su propio `try/catch` y `mostrarToast(...)` de error — cubre FR-011 sin cambios |
| `cerrarModalConAnimacion(overlayId)` (app.js:500-511) | Reutilizada para el cierre animado de `#modal-reiniciar`, igual que el resto de modales de la app |

## Wiring de eventos editado

| Ubicación actual | Cambio |
|---|---|
| `app.js:2501-2509`, listener de `#btn-reiniciar` | La llamada a `mostrarConfirm('¿REINICIAR TORNEO?', ...)` se reemplaza por `abrirModalReiniciar()`; el callback que hoy hace `limpiarStorage(); location.reload();` pasa a ser el handler del botón "Confirmar" dentro de `#modal-reiniciar` |
