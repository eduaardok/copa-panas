# Research: Registro persistente de jugadores (Copa Panas v2)

Basado en lectura directa de `app.js` (2097 líneas), `index.html` (601 líneas), `motor.js` (270
líneas) y `competiciones.js` (144 líneas) — no en suposiciones. Las tres decisiones abiertas de D4
ya quedaron cerradas en `spec.md` ("Decisiones de diseño"); este documento resuelve cómo se
implementan sin comportamiento implícito.

## §1 — Dónde vive hoy el flujo de alta de jugadores

`app.js:271-416` (sección "PANTALLA 0 — SETUP") es el único lugar donde se registran nombres de
jugadores para un torneo nuevo:

- `renderizarListaJugadores()` (app.js:298) reconstruye por completo el `innerHTML` de
  `#lista-jugadores` (index.html:172) según `_numJugadores`, prellenando cada `<input>` solo desde
  `estado.jugadores[i]` (es decir, solo si ya existía un torneo previo cargado — nunca desde
  texto tipeado y no confirmado en la sesión actual).
- `validarJugadores()` (app.js:341) valida vacío/duplicado comparando `val.toLowerCase()` —
  recorta espacios con `.trim()` al leer el value pero **no** colapsa espacios internos múltiples.
  No coincide 1:1 con la regla de normalización que spec.md FR-005 exige para el registro.
- `confirmarJugadores()` (app.js:385) es el punto donde el roster se congela: lee los `<input>`,
  arma `estado.jugadores`, fija `estado.configFormato`, cambia `estado.fase = 'equipos'`, llama
  `guardar()` y navega a la pantalla de asignación de equipos.

**Decisión**: `confirmarJugadores()` es el único punto de integración correcto tanto para "cuándo
se considera confirmado el roster" (FR-006) como para el import (los nombres importados deben
pasar por el mismo `<input>` + misma validación que un alta manual, no un camino paralelo).

## §2 — Normalización de nombres: una sola función, dos usos

Hoy `validarJugadores()` normaliza de forma ad-hoc (`trim()` + `toLowerCase()`, sin colapsar
espacios internos). La regla de dedup de FR-005/Decisiones de diseño (trim + colapso de espacios
internos + case-insensitive) debe vivir en **una función nueva compartida**,
`normalizarNombreJugador(nombre)`, usada en:

1. `validarJugadores()` (dedup dentro del roster del torneo en curso — reemplaza la comparación
   ad-hoc actual, endureciéndola para cubrir espacios internos múltiples que hoy no se detectan
   como duplicado).
2. El nuevo módulo de registro (dedup contra `jugadores_conocidos` al importar y al guardar tras
   confirmar).

Sin esto, "Juan  Pérez" (dos espacios) podría pasar la validación del roster como distinto de
"Juan Pérez" pero luego colisionar al guardarse en el registro — comportamiento inconsistente que
la spec no permite.

**Decisión**: `normalizarNombreJugador` vive en `app.js` (no en `motor.js` — es una regla de UI/
persistencia de setup, no de cálculo de torneo, Principio II) y se reutiliza en ambos lugares.

## §3 — Esquema y clave de `localStorage`

Patrón idéntico al ya usado por `torneo_data` (app.js:71-91: `guardar()`/`cargar()` con
`try/catch` alrededor de `JSON.stringify`/`JSON.parse`, tolerante a error de storage lleno o JSON
corrupto). Se replica el mismo patrón para una clave nueva e independiente, sin tocar
`CLAVE_LS`/`guardar()`/`cargar()` existentes (que siguen siendo exclusivos de `torneo_data`).

**Decisión**: nueva constante `CLAVE_LS_JUGADORES = 'jugadores_conocidos'`, con sus propias
`cargarJugadoresConocidos()` / `guardarJugadoresConocidos(lista)`, simétricas a `cargar()`/
`guardar()` pero independientes — un fallo leyendo/escribiendo el registro nunca debe afectar la
persistencia del torneo activo (son dos claves, dos try/catch separados).

## §4 — Verificación: `motor.js` no necesita cambios

Grep de `jugador` y `localStorage` en `motor.js` confirma que el archivo no referencia
`estado.jugadores` directamente ni conoce ninguna clave de `localStorage` — opera sobre arrays y
IDs que le pasa `app.js` (calendario, posiciones, bracket). El registro de jugadores conocidos es
persistencia + UI de setup pura; ninguna función de `motor.js` necesita conocer su existencia
(spec.md FR-009, Principio II). Confirmado sin excepciones — cero líneas de `motor.js` en el plan
de esta spec.

## §5 — Punto de entrada de UI: reutilizar el patrón de modal ya existente

`index.html` ya tiene 4 modales con el mismo esqueleto (`modal-overlay` + `modal-box`, `role="
dialog" aria-modal="true"`, botón `.modal-close-btn`, cierre por click fuera — ver
`modal-sorteo`, `modal-resultado`, `modal-confirm`, `modal-sorteo-equipos`). No hace falta
inventar un patrón de modal nuevo.

**Decisión**: un modal nuevo, `modal-importar-jugadores`, con el mismo esqueleto — lista de
checkboxes (uno por jugador de `jugadores_conocidos`, excluyendo los que ya normalizan igual a un
nombre ya presente en el roster en edición) + botón "Agregar seleccionados". Se dispara desde un
botón nuevo junto al label "Jugadores" en `screen-setup` (index.html:170-173), visible solo
cuando `jugadores_conocidos` tiene al menos una entrada (FR-003) — no aparece nunca para un
usuario sin registro previo (User Story 2).

## §6 — Riesgo real: no destruir texto tipeado y no confirmado al importar

`renderizarListaJugadores()` reconstruye el DOM completo de `#lista-jugadores` leyendo
`estado.jugadores` (app.js:298-323). Si el import llamara a esa función para "agregar filas",
cualquier nombre que el usuario ya haya tipeado a mano en la sesión actual —pero que todavía no
está en `estado.jugadores`, porque eso solo se escribe en `confirmarJugadores()`— se perdería.

**Decisión**: la importación NO vuelve a invocar `renderizarListaJugadores()` sobre el estado
completo. En su lugar:
1. Escribe directamente el nombre importado en el primer `<input class="jugador-input">` vacío
   existente (lee el DOM actual, no `estado.jugadores`).
2. Si no hay `<input>` vacíos suficientes para todos los seleccionados y `_numJugadores < 32`
   (tope ya existente, app.js:1817), incrementa `_numJugadores` y agrega solo las filas nuevas
   necesarias al final del contenedor (mismo `innerHTML` de fila que usa hoy
   `renderizarListaJugadores()`, extraído a una función auxiliar reutilizada por ambos caminos)
   preservando las filas existentes intactas.
3. Si aun así no alcanzan los 32 cupos, se importan los que entren y se avisa por toast cuáles
   quedaron sin importar (mismo mecanismo `mostrarToast`, app.js:103).
4. Llama a `validarJugadores()` al final (ya cubre dedup contra lo tipeado a mano, §2).

## §6a — La función auxiliar de fila debe incluir también el wiring de validación en vivo

`renderizarListaJugadores()` no solo construye el `innerHTML` de cada fila (app.js:307-321) — justo
después, recorre `container.querySelectorAll('.jugador-input')` y les agrega
`addEventListener('input', validarJugadores)` más el `keydown` de navegación por Enter
(app.js:326-336). Ese wiring es lo que hace que la validación de vacío/duplicado se dispare en vivo
mientras el usuario edita, no solo al confirmar.

La función auxiliar de fila que extrae §6 (punto 2, "mismo `innerHTML` de fila... extraído a una
función auxiliar reutilizada por ambos caminos") NO puede limitarse a devolver el HTML de la fila:
si `importarJugadoresSeleccionados()` agrega una fila nueva al final del contenedor sin también
adjuntarle su propio `addEventListener('input', validarJugadores)` (y el `keydown` de Enter), esa
fila queda con validación en vivo rota — el jugador importado se ve bien al momento del import
(porque `validarJugadores()` se llama una vez al final, §6 punto 4), pero si el usuario edita ese
nombre a mano después (para corregir un typo, por ejemplo), el `<input>` no dispara nada hasta que
algún otro evento fuerce una revalidación manual, dejando el botón "Confirmar jugadores" habilitado
o deshabilitado con información desactualizada.

**Decisión**: la función auxiliar de fila (§6 punto 2) DEBE encapsular tanto la construcción del
HTML de la fila como el `addEventListener('input', validarJugadores)` + `keydown` de Enter sobre su
propio `<input>` recién creado — no solo el primero. Se usa exactamente en los dos únicos lugares
que crean filas: el loop de `renderizarListaJugadores()` (filas completas, wiring ya vía el
`forEach` posterior — puede seguir igual o delegar a la misma función auxiliar sin cambiar
comportamiento) y `importarJugadoresSeleccionados()` cuando agrega filas nuevas al final (§6 punto
2) — ahí el wiring no puede depender del `forEach` de `renderizarListaJugadores()` porque esa
función completa no se vuelve a invocar (§6, decisión principal).

## §7 — Cuándo se considera "confirmado" el roster para actualizar el registro (FR-006)

`confirmarJugadores()` es el único call site donde el roster pasa de "texto en inputs" a
`estado.jugadores` confirmado y el torneo avanza de fase. Es el momento exacto que Decisiones de
diseño (spec.md) define como disparador de la actualización automática del registro.

**Decisión**: al final de `confirmarJugadores()` (después de construir `estado.jugadores`, antes o
después de `guardar()` es indistinto porque son dos claves de `localStorage` independientes — se
coloca después de `guardar()` para no introducir una escritura extra si `guardar()` fallara antes),
se llama `actualizarRegistroJugadores(estado.jugadores)`, que:
1. Carga `jugadores_conocidos` (o `[]` si no existe — primera vez, FR-007).
2. Para cada jugador del roster confirmado, calcula su nombre normalizado (§2). Si ya existe una
   entrada con ese nombre normalizado, actualiza su `ultimoUso`; si no, agrega una entrada nueva.
3. Persiste con `guardarJugadoresConocidos()`.
Sin toast ni confirmación visible — es "automática y silenciosa" por decisión de diseño explícita
en spec.md, no un evento que requiera feedback propio.

## §8 — Verificación de no-disrupción para usuario sin registro previo (US2)

Con `localStorage.getItem('jugadores_conocidos') === null`, `cargarJugadoresConocidos()` debe
devolver `[]` sin lanzar, y el botón "Importar del registro" (§5) debe quedarse oculto (no
deshabilitado — oculto, para no generar una pregunta visual sin respuesta). Verificado por
inspección de la condición de visibilidad propuesta: `jugadoresConocidos.length > 0` evaluado en
`inicializarSetup()` (app.js:275), mismo lugar donde ya se inicializa el resto de la pantalla.
