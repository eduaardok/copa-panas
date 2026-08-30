# Research: Navegación de vuelta y reinicio consciente

## §1. Dos entradas, dos niveles de fricción — mecanismo compartido, UI distinta

**Decisión**: Ambas entradas ("volver" en setup y "Reiniciar torneo" en Config) terminan ejecutando
exactamente el mismo par de llamadas — `limpiarStorage()` seguido de `location.reload()` — que es lo
que ya hace hoy `#btn-reiniciar` (app.js:2501-2509). Lo que cambia entre una y otra es únicamente
qué hay *antes* de esas dos llamadas: nada en setup (FR-002), un modal con oferta de exportar en
Config (FR-005/FR-006/FR-007).

**Rationale**: `spec.md` (FR-010) exige que ambas entradas se mantengan "visualmente distintas al
mismo destino, reflejando su distinto nivel de fricción" — no que sean mecanismos distintos. Ambas
ya necesitan volver a `screen-competicion` en un estado limpio; reusar el mecanismo ya probado evita
inventar una segunda forma de "vaciar el torneo activo" que D1 no contempla.

**Alternativas consideradas**: Un reset en memoria sin `reload()` para el caso de "volver" (más
"instantáneo" visualmente). Rechazada — ver §2, el reload no es una elección estética sino la única
forma barata de dejar las variables CSS de paleta en estado neutro.

## §2. Por qué "volver" necesita `location.reload()` y no un reset en memoria

**Hallazgo**: `aplicarPaletaCompeticion(competicionId)` (competiciones.js:140-160), invocada por
`elegirCompeticion()` al entrar a setup (app.js:483-493), aplica las 4 variables de
`VARIABLES_PALETA` y `--header-stripe` como **inline styles sobre `document.documentElement`** vía
`style.setProperty(...)`. La función no tiene ninguna rama que las remueva o las revierta a los
valores de `:root` de `styles.css` — solo sabe "aplicar la paleta de una competición válida"
(`if (!comp) return;` corta de inmediato si se le pasa `null`/`undefined`).

Esto significa que si "volver" solo reseteara `estado.competicion`/`estado.configFormato` en memoria
y cambiara de pantalla sin recargar, el usuario vería `screen-competicion` **todavía teñida** con los
colores de la competición que acaba de abandonar — un bug visual, no una decisión de diseño.

**Decisión**: "volver" ejecuta `limpiarStorage()` + `location.reload()`, igual que "Reiniciar
torneo". Un reload vuelve a ejecutar `inicializar()` desde cero, que en el camino `!hayDatos` (línea
2197-2200) nunca llama a `aplicarPaletaCompeticion()` — las variables inline simplemente no se
vuelven a establecer, y `:root` en `styles.css` manda de nuevo.

**Alternativas consideradas**:
- Agregar una función `resetearPaletaCompeticion()` que haga `style.removeProperty(...)` de las 4
  variables + `--header-stripe`. Rechazada por ahora: introduce una función nueva de un solo uso
  para evitar un reload que de todas formas ya es aceptado como patrón en este mismo flujo
  (`btn-reiniciar`); no hay ninguna razón funcional para que "volver" deba evitar el reload que
  "Reiniciar" sí usa, y "sin fricción" (D-NAV-1) se refiere a la ausencia de modal/confirmación, no a
  la ausencia de un reload de página.
- Dejar el bug visual documentado como "conocido". Rechazada — contradice el criterio de
  éxito implícito de que `screen-competicion` se vea igual sin importar por qué puerta se llegó a
  ella.

## §3. Por qué el modal de reinicio es nuevo (`#modal-reiniciar`) y no una extensión de `#modal-confirm`

**Hallazgo**: `mostrarConfirm(titulo, msg, callback)` (app.js:516-521) es un helper genérico de dos
botones (Cancelar/Confirmar) usado hoy por al menos dos llamadores con contratos simples de
"sí/no": borrar un jugador del registro (app.js:303-309) y "Reiniciar torneo" (app.js:2501-2509).
Ninguno de sus llamadores actuales necesita una tercera acción intermedia que no cierre el modal.

**Decisión**: Se crea un modal específico `#modal-reiniciar` con tres controles (Exportar / Cancelar
/ Confirmar), en vez de agregarle a `mostrarConfirm()` un parámetro opcional de "acción secundaria".

**Rationale**: Agregarle una acción secundaria opcional a `mostrarConfirm()` la convertiría en una
función con una rama de comportamiento que solo un llamador (Config) usa, mientras que el resto
(borrar jugador, y cualquier confirmación futura) seguiría ignorándola — una abstracción para un
caso de uso no es una abstracción, es indirección. Un modal separado, del mismo esqueleto
`.modal-overlay`/`.modal-box` ya usado en toda la app (`#modal-confirm`, `#modal-sorteo-equipos`,
etc.), mantiene `mostrarConfirm()` simple para sus dos llamadores actuales y aísla la lógica
específica de "exportar sin cerrar" donde realmente vive: el flujo de reinicio.

**Alternativas consideradas**: Extender `mostrarConfirm()` con un tercer botón opcional
condicionado por parámetro. Rechazada por la razón anterior. Reusar `#modal-confirm` tal cual y
resolver la exportación con un `confirm()` nativo del navegador antes de abrirlo. Rechazada — un
`confirm()` nativo no es reutilizable ni estilizable, y forzaría una secuencia de dos diálogos
apilados en vez de una sola superficie con tres acciones claras.

## §4. Independencia de `jugadores_conocidos` (D4)

**Hallazgo**: `limpiarStorage()` (app.js:94-99) solo hace `localStorage.removeItem(CLAVE_LS)`
(`torneo_data`) y resetea `estado` en memoria a `crearEstadoVacio()`. `jugadores_conocidos`
(`CLAVE_LS_JUGADORES`) es una clave de `localStorage` completamente separada, gestionada por
funciones distintas (`cargarJugadoresConocidos()`/`guardarJugadoresConocidos()`, app.js:108+) que
ninguno de los dos flujos de esta spec invoca.

**Decisión**: No se requiere ningún cambio ni verificación adicional — tanto "volver" desde setup
como "Reiniciar torneo" dejan `jugadores_conocidos` completamente intacto, consistente con D4 (el
registro de jugadores es reutilizable *entre* torneos, incluido el torneo que se acaba de
descartar).

**Alternativas consideradas**: Ninguna — este punto se verificó por lectura directa de
`limpiarStorage()`, no requería una decisión de diseño.
