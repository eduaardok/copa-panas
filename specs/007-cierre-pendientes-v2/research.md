# Research: Cierre de pendientes v2

**Feature**: `007-cierre-pendientes-v2` | **Fecha**: 2026-08-30

Todo lo de este documento fue verificado ejecutando código o leyendo el fuente real del repo, no
inferido. Cada sección indica cómo se verificó.

---

## R0 — HALLAZGO NUEVO (bloqueante para Área 3): el checker de Impeccable corría en modo DEGRADED

**Esto no estaba en el input del usuario y cambia cómo se ejecuta el Área 3.**

**Qué se encontró**: al correr el checker por primera vez en esta sesión:

```text
impeccable detect: DEGRADED - HTML parser modules unavailable
(htmlparser2, css-select, css-tree, domutils).
Falling back to regex matching. (...) findings are an undercount, not a clean bill of health.
[]
```

`detect-html.mjs` (línea ~120) importa dinámicamente `htmlparser2`, `css-select`, `css-tree` y
`domutils`; si el import falla cae a `detectText()` (regex) y avisa una sola vez por stderr. Los
cuatro módulos no estaban instalados en ningún lado del sistema (verificado: no hay `node_modules`
ni `package.json` bajo `.agents/skills/impeccable/`, y `require.resolve('htmlparser2')` falla).

**Por qué importa**: en modo degradado el checker devolvía `[]` — cero hallazgos. Si se capturaba
ese `[]` como baseline de SC-004, el criterio "el conteo no cambió" se cumpliría trivialmente
comparando cero contra cero, sin probar absolutamente nada sobre las excepciones de configuración.
Peor: en modo degradado tampoco se puede confirmar empíricamente cuál entrada suprime qué,
que es la premisa entera del Área 3.

**Decisión**: instalar los cuatro módulos **fuera del repositorio**, en el directorio padre
(`Desktop/EDUARDO/WebPractice/node_modules/`), con
`npm install --no-save --no-package-lock htmlparser2 css-select css-tree domutils`.

**Rationale**: el resolvedor ESM de Node no usa `NODE_PATH`; resuelve especificadores desnudos
subiendo por `node_modules` desde el directorio del archivo importador. Instalar en el directorio
padre del repo resuelve el import por ancestro **sin agregar un solo archivo al repositorio**:
cero `package.json`, cero `node_modules`, cero entradas de `.gitignore`, `git status` sigue limpio.
Esto respeta el Principio I — el checker es herramienta de desarrollo, no runtime de la app; la app
sigue sin Node, sin build tools y servible como estáticos.

**Alternativas consideradas**:

| Alternativa | Rechazada porque |
|---|---|
| Aceptar el modo degradado y usar `[]` como baseline | SC-004 quedaría vacío de contenido — cero contra cero no prueba nada. El Área 3 entera perdería su verificación. |
| `npm install` dentro del repo | Agrega `node_modules/` y `package.json` al proyecto; roza el Principio I y ensucia el repo justo antes de un rename. |
| Instalar globalmente (`npm i -g`) | El resolvedor ESM no consulta el root global para especificadores desnudos; no habría resuelto el import. |

**Consecuencia operativa para `tasks.md`**: la tarea de baseline debe **verificar que stderr no
contiene la advertencia DEGRADED** antes de aceptar cualquier conteo. Un baseline capturado en modo
degradado es inválido y debe descartarse.

---

## R1 — Baseline real de hallazgos (Área 3, SC-004)

Verificado ejecutando el checker en modo completo (sin advertencia DEGRADED en stderr):

```bash
node .agents/skills/impeccable/scripts/detect.mjs --json \
  index.html styles.css app.js competiciones.js motor.js
```

| Configuración | Total de hallazgos |
|---|---|
| `.impeccable/config.json` actual (estado del repo) | **0** |
| `ignoreValues` vaciado (sin ninguna supresión) | **62** |

Desglose por antipatrón con `ignoreValues` vacío:

| Antipatrón | Hallazgos |
|---|---|
| `design-system-font-size` | 24 |
| `overused-font` | 13 |
| `dark-glow` | 12 |
| `design-system-color` | 4 |
| `side-tab` | 4 |
| `broken-image` | 2 |
| `cramped-padding` | 2 |
| `flat-type-hierarchy` | 1 |

**Baseline de SC-004 = 0 hallazgos**, en modo completo, con esa lista exacta de archivos y ese
comando exacto. La comparación posterior al cambio debe usar comando y lista de archivos
idénticos, o no es comparable. `sw.js` **no** se agrega a la lista de archivos del checker: no es
código de UI y agregarlo rompería la comparabilidad con el baseline.

**Nota sobre el formato de salida**: la clave del antipatrón en el JSON es `antipattern` (no
`rule`). Las claves de cada hallazgo son: `antipattern`, `name`, `description`, `severity`,
`category`, `file`, `line`, `snippet`. Un script de conteo que agrupe por `rule` devuelve
`{"undefined": 62}` — error fácil de cometer al escribir la tarea de verificación.

**Confirmación cruzada con DESIGN.md**: los 12 hallazgos de `dark-glow` coinciden exactamente con
los 12 glows del Shadow Vocabulary citados en la razón actual de esa excepción. El número que el
usuario indicó es correcto y quedó verificado, no asumido.

---

## R2 — Las cuatro atribuciones de `side-tab` (Área 3)

Verificado corriendo el checker con `ignoreValues` vacío y filtrando por `antipattern === 'side-tab'`:

| Archivo:línea | Snippet |
|---|---|
| `index.html:0` | `.app-header::after — absolute 3px pseudo-element stripe (bottom: 0)` |
| `styles.css:89` | `.app-header::after — absolute 3px pseudo-element stripe (bottom: 0)` |
| `styles.css:574` | `border-left: 3px solid var(--gold)` |
| `styles.css:602` | `border-left: 3px solid var(--green)` |

Son **4 hallazgos** en **3 casos conceptuales**, exactamente como describió el usuario:

1. El stripe tricolor del header, contado dos veces porque el motor de cascada estática lo atribuye
   tanto al archivo de origen (`styles.css:89`) como a la página renderizada (`index.html:0`).
2. El borde `var(--gold)` de `.side-tab`/`.match-card`.
3. El borde `var(--green)` de la fase de grupos.

**Confirmación de que las dos entradas específicas son inertes**: `impeccable-config.mjs:487`
define `directValueRules` como un `Set` cerrado; la línea 495 hace
`if (!directValueRules.has(rule)) return '';`. `side-tab` no pertenece a ese conjunto, así que
`extractFindingIgnoreValue()` devuelve `''` para todo hallazgo de `side-tab` y jamás coincide con
`"border-left: 3px solid var(--gold)"` ni con `var(--green)`. Las dos entradas no pueden suprimir
nada por construcción. Los 4 hallazgos los suprime únicamente la entrada wildcard, cuyo `files`
ya cubre `styles.css` e `index.html` — las dos atribuciones del stripe y los dos bordes.

**Implicancia para SC-004**: eliminar las dos entradas inertes debe dejar el conteo en 0. Si
subiera a 4, significa que el análisis es incorrecto y hay que detenerse, no "ajustar la wildcard
hasta que dé cero".

---

## R3 — Profundidad del bracket y `nombreDeRonda()` (Área 1)

Verificado leyendo `motor.js:255-270`:

```js
const NOMBRES_RONDAS = { 2:'Final', 4:'Semifinales', 8:'Cuartos de final',
                         16:'Octavos de final', 32:'Dieciseisavos' };
function nombreDeRonda(totalEquipos) { return NOMBRES_RONDAS[totalEquipos]; }
```

Recibe **cantidad de equipos que arrancan la ronda**, siempre potencia de 2. La fórmula nueva
`Math.pow(2, profundidad - ronda)` con `profundidad = Math.ceil(Math.log2(clasificados))` produce
siempre una potencia de 2, así que el tipo de argumento no cambia y `motor.js` queda intacto
(Principio II y restricción dura del usuario respetados).

**Efecto colateral positivo**: como el resultado siempre es potencia de 2 y siempre ≤ 32 para
tamaños de torneo realistas, el fallback `|| \`Ronda ${ronda + 1}\`` deja de ser alcanzable en
brackets válidos. Se **conserva igual** de todos modos — es una defensa barata y quitarlo sería
alcance extra no pedido.

**Comportamiento con cantidades que no son potencia de 2** (calculado, a confirmar en navegador):

| Clasificados | Profundidad | Ronda 0 | Ronda 1 | Ronda 2 |
|---|---|---|---|---|
| 8 | 3 | 8 → Cuartos de final | 4 → Semifinales | 2 → Final |
| 6 | 3 | 8 → Cuartos de final | 4 → Semifinales | 2 → Final |
| 5 | 3 | 8 → Cuartos de final | 4 → Semifinales | 2 → Final |
| 4 | 2 | 4 → Semifinales | 2 → Final | — |

Con 6 o 5 clasificados la primera ronda se llama "Cuartos de final" aunque no haya 8 equipos: es
la convención estándar de bracket con byes (el bracket *tiene* profundidad de cuartos, algunos
cruces son pases directos). Es correcto y es el comportamiento deseado — no un caso a "arreglar".

**Hallazgo de la verificación con Playwright (post-implementación) — comportamiento preexistente
de avance, fuera de alcance**: al ejecutar V4/V5 contra el código real se confirmó que
`procesarAvanceEliminacion()` en `app.js` (líneas ~1866-1873, sin cambios en esta spec) empareja
ganadores consecutivos con `for (i += 2) { if (ganadores[i+1]) ... }` sin implementar byes. Con una
cantidad de clasificados donde una ronda produce un número impar de ganadores (ej. 6 clasificados →
3 ganadores tras cuartos), el último ganador queda descartado de la ronda siguiente en vez de
recibir un pase directo. Es un comportamiento preexistente del emparejamiento/avance del bracket,
no de los **nombres** de ronda (que es lo único que toca el Área 1), y no está entre las cuatro
áreas de esta spec ni en su fuera-de-alcance explícito de "sorteo de equipos o penales" — pero
tampoco es parte del alcance declarado. Se documenta acá como hallazgo, no se corrige.
**Consecuencia para la verificación**: V5 no puede validar el nombre de una tercera ronda
generándola mediante el flujo real de avance con 6 clasificados (el campeón se declararía antes
de que exista una ronda "Final"); en su lugar, V5 construye esa ronda directamente con la misma
función real (`generarPartidosEliminacion()`) para aislar la fórmula de nombre de ronda de esta
mecánica de avance no relacionada.

**Guarda contra `log2` degenerado**: `Math.log2(0)` es `-Infinity` y `Math.log2(1)` es `0`
(profundidad 0 → `2^0 = 1` → `nombreDeRonda(1)` es `undefined`). `renderizarEliminacion()` ya
tiene la guarda `estado.clasificados.length || 2` en la línea 1890; **`renderizarDashboard()` no
tiene ninguna guarda equivalente** y hay que agregarla al calcular la profundidad ahí. Detalle no
presente en el input del usuario, detectado leyendo ambos sitios.

---

## R4 — Estado real de `validarJugadores()` (Área 2)

Verificado leyendo `app.js:644-664`. El código actual:

```js
inputs.forEach(inp => {
  const val = inp.value.trim();
  const normalizado = normalizarNombreJugador(inp.value);
  inp.classList.remove('error');
  if (!val) { inp.classList.add('error'); valido = false; }
  else if (nombres.includes(normalizado)) { inp.classList.add('error'); valido = false; }
  nombres.push(normalizado);   // ← el push va DESPUÉS de la comparación
});
```

Confirmado: la primera aparición nunca ve su propio duplicado porque todavía no está en `nombres`.

**FR-006 no requiere trabajo nuevo**, confirmado: `crearFilaJugador()` engancha
`inp.addEventListener('input', validarJugadores)` por fila, y `validarJugadores()` hace
`classList.remove('error')` sobre **todos** los inputs antes de decidir. Cada tecleo recalcula la
marca desde cero para toda la lista, así que corregir un duplicado limpia automáticamente a los
que dejan de estar en conflicto. Solo hay que verificarlo en navegador, no construir nada.

**Detalle a cuidar en la reescritura**: el código actual hace `nombres.push(normalizado)` también
para inputs vacíos. Si el conteo de la primera pasada incluyera los vacíos, todos los vacíos se
contarían como duplicados entre sí — inofensivo (ya se marcan por vacíos) pero conceptualmente
sucio. La primera pasada debe contar **solo nombres no vacíos**.

---

## R5 — Recursos reales a precachear (Área 4)

Verificado leyendo `index.html` y listando `assets/branding/`.

**Locales (6 + 9 assets = 15 rutas)**: `./index.html`, `./styles.css`, `./motor.js`,
`./competiciones.js`, `./app.js`, `./manifest.json`, y los 9 archivos de `assets/branding/`
(`apple-touch-icon.png`, `favicon-16x16.png`, `favicon-32x32.png`, `icon-192.png`, `icon-512.png`,
`wordmark-dark.png`, `wordmark-light.png`, `wordmark-mono-black.png`, `wordmark-mono-white.png`).

**Externos (3, exactamente los que carga `index.html` hoy)**:

| Recurso | URL (líneas de `index.html`) |
|---|---|
| Google Fonts (Bebas Neue + Inter) | `https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@300;400;500;600;700&display=swap` (línea 19) |
| FontAwesome 6.5.0 | `https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css` (línea 22) |
| Tailwind CDN | `https://cdn.tailwindcss.com` (línea 25) |

**`manifest.json` ya es 100% relativo** (`"start_url": "./index.html"`, iconos
`assets/branding/...`) — no hardcodea el nombre del repo ni la URL de Pages, y no requiere cambios.

**No existe hoy ninguna referencia a `serviceWorker` ni a `sw.js`** en `index.html` ni en `app.js`
(verificado con grep). Es una adición limpia.

---

## R6 — Decisiones de diseño del service worker (Área 4)

### D-SW-1: `cache.addAll` atómico para lo local, tolerante para lo externo

**Decisión**: precachear los 16 recursos locales con `cache.addAll()` (atómico — si falla uno,
falla el install, que es lo correcto: un shell incompleto no sirve), y los 3 externos
**individualmente** con `Promise.allSettled`, tolerando fallos.

**Rationale**: `cache.addAll()` rechaza entero si cualquier request falla. Si los 3 externos
fueran parte del mismo `addAll`, un CDN lento o caído en la primera visita abortaría **todo** el
precache, incluido el shell local, dejando la app sin offline sin ninguna señal. Separarlos hace
que el peor caso sea "offline sin tipografía" en vez de "sin offline". Cubre directamente el edge
case de `spec.md` sobre precache incompleto.

### D-SW-2: `no-cors` como fallback para los externos

**Decisión**: pedir cada externo normalmente y, si falla, reintentar con
`new Request(url, { mode: 'no-cors' })`.

**Rationale**: `fonts.googleapis.com` y `cdnjs.cloudflare.com` responden con CORS abierto, pero
`cdn.tailwindcss.com` no está garantizado. Una respuesta opaca (`no-cors`) es cacheable y se
sirve correctamente a un `<script>`/`<link>`, que es exactamente el uso acá. Sin este fallback un
externo sin CORS quedaría permanentemente fuera de la caché.

**Ajuste (revisión de plan)**: una respuesta obtenida vía `no-cors` es opaca — `status` es siempre
`0` y `.ok` es siempre `false`, aun cuando la petición funcionó. El fallback debe cachear esa
respuesta si el `fetch` no lanzó excepción, **sin condicionar por `.ok`** — ese chequeo es válido
solo en el camino normal (con CORS) y en el runtime cache de la sección 5.2 del contrato, donde sí
hay una respuesta no opaca con la que comparar. Condicionar por `.ok` en el camino `no-cors` haría
que nunca se cacheara nada por ahí.

### D-SW-3: navegaciones responden con `./index.html` de la caché

**Decisión**: en `fetch`, si `request.mode === 'navigate'`, responder con la entrada cacheada de
`./index.html`.

**Rationale**: **este es el punto que hace pasar o fallar el escenario de subpath.** Al abrir
`https://usuario.github.io/<repo>/`, la URL solicitada es el directorio, no `.../index.html`, así
que un `caches.match(request)` directo no encuentra nada y offline devuelve error de red aunque el
precache haya funcionado perfecto. No estaba en el input del usuario; sin esto la verificación de
subpath falla. Se resuelve sin conocer el nombre del subpath, resolviendo `./index.html` contra
`self.registration.scope`.

### D-SW-4: rutas relativas resueltas contra el scope

**Decisión**: todas las rutas del precache se escriben `./algo` y se resuelven con
`new URL(ruta, self.registration.scope)`. Registro con `navigator.serviceWorker.register('./sw.js')`.

**Rationale**: `sw.js` vive en la raíz del sitio publicado, que bajo Pages es
`/<repo>/`. Registrar con ruta relativa acota el scope a ese directorio y hace que todo `./`
resuelva bien tanto en la raíz de un server local como bajo el subpath de Pages. Una ruta absoluta
(`/index.html`) apuntaría a la raíz del dominio, fuera del scope: el precache fallaría en
producción y funcionaría en local — exactamente el fallo silencioso que el usuario quiere evitar. Y
cumple la restricción de rename: el nombre del repo nunca aparece en el código.

### D-SW-5: sin `skipWaiting()` ni `clients.claim()` — consecuencia aceptada

**Decisión**: no usarlos. Un service worker nuevo queda en `waiting` hasta que se cierren todas
las pestañas controladas.

**Rationale**: recargar la app en medio de un torneo en vivo es peor que servir una versión vieja.

**Consecuencia aceptada y a documentar en `KNOWN_ISSUES.md` al cerrar**: en una PWA instalada en
móvil la app casi nunca se cierra del todo, así que un service worker nuevo puede quedarse en
`waiting` mucho tiempo y el organizador seguir viendo una versión vieja después de un deploy. Se
acepta a cambio de no interrumpir un torneo. Si a futuro molesta, la solución es un aviso de
versión nueva con recarga voluntaria — fuera del alcance de esta spec.

### D-SW-6: dónde va el registro

**Decisión**: al final de `app.js`, en una función propia invocada junto al arranque existente.

**Rationale**: no toca el orden de los `<script>` de `index.html` (restricción del usuario), no
agrega un archivo más al shell, y `index.html` queda sin cambios en esta área.

---

## R7 — Hallazgo de la verificación T016: la primera carga nunca es cliente controlado

Al implementar la verificación de T016 (ausencia de `skipWaiting()`/`clients.claim()`), la primera
corrida dio `{ installing: false, waiting: false, active: true }` tras modificar `sw.js` y llamar
`registration.update()` — la v2 se activaba sola pese a no usar `skipWaiting()`. Investigado y
confirmado: es una regla del propio spec de Service Workers, no un defecto de `sw.js`. La página
cuya primera carga dispara el `register()` **nunca queda como cliente controlado** de ese primer
service worker (el navegador solo empieza a controlar navegaciones *posteriores* a que el SW quede
activo). Un SW en `waiting` solo permanece en espera mientras existan clientes controlados por la
versión anterior — si no hay ninguno (como en una pestaña recién registrada), no hay nada que
bloquee la activación y la v2 se activa de inmediato aunque el código sea idéntico al que tendría
`skipWaiting()`.

**Corrección aplicada a la verificación**: se agregó un `page.reload()` (y esperar
`navigator.serviceWorker.controller`) inmediatamente después de que el SW queda activo, para que la
pestaña de prueba pase a ser cliente controlado — reproduciendo el escenario real (un organizador
con el torneo ya abierto en una pestaña que lleva un rato de uso, no la primerísima carga). Con esa
corrección, la verificación mostró correctamente `{ installing: false, waiting: true, active: true }`
tras el `update()`, confirmando D-SW-5 tal como está implementado en `sw.js`.

Esto no cambia nada de `sw.js` ni del contrato — es exclusivamente una corrección al método de
verificación (research.md/tasks.md T016), documentada acá porque no era evidente antes de
ejecutar la prueba real.

## Resumen de desviaciones respecto del input del usuario

Tres cosas que el input no contemplaba y que el plan incorpora, todas verificadas contra el código:

1. **R0** — el checker estaba en modo degradado; el baseline de SC-004 habría sido falso. Resuelto
   instalando los parsers fuera del repo.
2. **R3** — `renderizarDashboard()` no tiene la guarda de `clasificados.length` que sí tiene
   `renderizarEliminacion()`; hay que agregarla al calcular la profundidad.
3. **D-SW-3** — sin fallback de navegación a `./index.html`, el escenario de subpath falla aunque
   el precache sea correcto.

Ninguna de las tres requiere tocar `motor.js` ni `competiciones.js`.
