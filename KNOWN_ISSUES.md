# Known Issues

Bugs identificados pero deliberadamente no corregidos en el momento en que se encontraron, junto
con la razón. No es un backlog de features — solo defectos conocidos.

## Nombres de ronda intermedios pueden mostrarse mal durante la expansión del bracket

**Dónde**: `renderizarEliminacion()` en `app.js` (y su equivalente en `renderizarDashboard()`),
que calculan `n = Math.pow(2, rondas.length - ronda)` y buscan `nombreDeRonda(n)` (`motor.js`) para
titular cada ronda del bracket de eliminación ("Cuartos de final", "Semifinales", "Final", etc.).

**Síntoma**: mientras el bracket todavía se está expandiendo (no se generó todavía la ronda final),
esta fórmula estima "cuántos equipos arrancan la ronda" a partir de `rondas.length` — la cantidad
de rondas *que existen hasta ahora* — en vez de la profundidad final real del bracket. El resultado
es que una ronda puede mostrarse con el nombre equivocado (ej. una semifinal etiquetada "Final")
mientras falta que se generen las rondas siguientes, y el nombre de una ronda ya jugada puede
*cambiar* (para peor) cuando se generan rondas nuevas después. Una vez que el bracket queda
completo (se generó la ronda final), los nombres se autocorrigen.

**Origen**: heredado de v1 (`Torneo Amigos FC 26`) — la fórmula existía sin cambios antes del
refactor de la spec `001-desacople-motor-rediseno`. Confirmado con Playwright contra un torneo real
de 8 jugadores durante la verificación en navegador de esa spec (ver
`specs/001-desacople-motor-rediseno/tasks.md`, nota en el checkpoint de la Fase 4).

**Por qué no se corrige ahora**: FR-006 de la spec 001 exige preservar sin cambios de
comportamiento el flujo funcional de v1 durante ese refactor — corregirlo ahí hubiera sido una
mejora fuera del alcance declarado de esa spec (era un refactor de desacople de datos, no una
sesión de corrección de bugs). Queda documentado acá para una spec futura dedicada a arreglos de
UI del bracket.

**Fix sugerido (no implementado)**: derivar el nombre de ronda de la profundidad total del
bracket (`Math.ceil(Math.log2(estado.clasificados.length))`, fija desde que se arman los cruces)
en vez de `rondas.length` (que crece con cada ronda jugada).

## Dos excepciones `side-tab` de spec 001 en `.impeccable/config.json` nunca tuvieron efecto

**Dónde**: `.impeccable/config.json`, las dos entradas de `ignoreValues` creadas en la spec
`001-desacople-motor-rediseno` con `"rule": "side-tab"` y valor específico
(`"border-left: 3px solid var(--gold)"` y `"border-left: 3px solid var(--green)"`).

**Síntoma**: estas dos excepciones están escritas como si acotaran el filtro a un valor exacto de
`border-left`, pero nunca suprimieron ningún hallazgo — son inertes desde que se crearon. El
checker (`.agents/skills/impeccable/scripts/lib/impeccable-config.mjs`) solo sabe extraer un
"valor de hallazgo" comparable para un subconjunto fijo de reglas (`directValueRules`:
`overused-font`, `bounce-easing`, `design-system-font`, `design-system-color`,
`design-system-radius`, `design-system-font-size`). `side-tab` no está en esa lista, así que
`extractFindingIgnoreValue()` devuelve `''` para cualquier hallazgo de `side-tab`, y la comparación
contra el valor específico de la excepción nunca es verdadera — la excepción no aplica a nada.

**Por qué el checker igual da 0 hallazgos de `side-tab` hoy**: existe una tercera entrada, separada,
creada en la misma spec (`"rule": "side-tab", "value": "*", "files": ["styles.css", "index.html"]`),
que usa el camino de wildcard (no necesita extraer un valor por hallazgo, aplica a cualquier
hallazgo de esa regla en esos archivos). Esa entrada wildcard es la que efectivamente suprime los 4
hallazgos reales (el stripe tricolor del header, atribuido tanto a `styles.css:74` como a
`index.html:0` por el motor de cascada estática, más los dos bordes de `.side-tab`/`.match-card`
en `var(--gold)`/`var(--green)`). Verificado empíricamente en la spec
`004-deuda-diseno-animaciones`: quitando solo la entrada wildcard (dejando las 2 específicas
intactas) y corriendo el checker, reaparecen los 4 hallazgos de `side-tab`, incluidas las líneas
`var(--gold)`/`var(--green)` que las 2 excepciones específicas supuestamente cubrían.

**Por qué no se corrige ahora**: las 2 entradas específicas no causan ningún hallazgo sin
suprimir hoy — la wildcard ya cubre todo lo que existe. No hay riesgo funcional inmediato, solo
una entrada de configuración que documenta una intención (acotar la excepción a un valor puntual)
que el checker no es capaz de cumplir para esta regla. Corregirlo implicaría decidir si se
eliminan las 2 entradas muertas (dejando solo la wildcard, más honesto sobre lo que realmente
pasa) o si se deja constancia de la limitación — decisión de una spec futura que toque
`.impeccable/config.json`, no de `004-deuda-diseno-animaciones` (que solo las heredó y las
diagnosticó).

**Fix sugerido (no implementado)**: eliminar las 2 entradas específicas de `side-tab` (no hacen
nada) y dejar solo la entrada wildcard con una razón que explique que cubre las 3 atribuciones
conocidas del hallazgo. Alternativa más profunda: agregar `side-tab` a `directValueRules` en el
checker si en el futuro se necesita acotar esta regla a un valor puntual en vez de por archivo.

## La excepción wildcard `dark-glow: *` en `index.html` no distingue glows aprobados de drift futuro

**Dónde**: `.impeccable/config.json`, la entrada `{"rule": "dark-glow", "value": "*", "files":
["index.html"]}` agregada en la spec `004-deuda-diseno-animaciones`.

**Síntoma**: igual que `side-tab` (ver sección anterior), `dark-glow` tampoco está en
`directValueRules` del checker (`impeccable-config.mjs`), así que no admite un valor de color
puntual — solo puede excepcionarse por archivo completo, con wildcard. Hoy esa excepción es
correcta en intención: cubre los 12 glows de color documentados como "Shadow Vocabulary" en
`DESIGN.md` (glow dorado del campeón, azul de foco/botón primario, verde de botón success, rojo de
sortear-equipos — ver `specs/004-deuda-diseno-animaciones/research.md`, nota de reconciliación de
conteo). Pero el wildcard no sabe *cuáles* 12 son los aprobados — suprime cualquier hallazgo de
`dark-glow` en `index.html`, sin importar el color o el selector.

**Riesgo residual**: si en el futuro se agrega a `index.html` un glow de color nuevo que **no**
sea parte del Shadow Vocabulary documentado — ya sea una adición legítima que debería sumarse a
`DESIGN.md` primero, o drift real no intencional (por ejemplo, un color inventado en una sesión
futura que "se ve bien" pero no está en la paleta) — el checker no lo va a reportar. Quedará
invisible bajo la misma excepción, indistinguible de los 12 ya aprobados.

**Por qué no se corrige ahora**: es el mismo límite técnico que hace inertes las 2 excepciones
`side-tab` de spec 001 (ver sección anterior) — `dark-glow` no admite valor puntual en el checker
actual, así que no hay forma de acotar la excepción a los 12 colores específicos sin cambiar el
checker mismo. Acotarla manualmente por selector CSS (en vez de por valor de color, que el checker
no soporta) tampoco es confiable porque los glows viven en varias reglas con distintos selectores
(`.btn-primary`, `.btn-primary:focus`, `.btn-primary:active`, `.btn-success:hover`, `.campeon-card`,
etc.) y algunos ya son `color-mix()` con variables, no literales.

**Fix sugerido (no implementado)**: si el checker de Impeccable en algún momento agrega
`dark-glow` a `directValueRules` (soporte para valor puntual, igual que ya existe para
`design-system-color`), acotar esta excepción a los ~12 valores de color específicos del Shadow
Vocabulary documentados en `DESIGN.md`, en vez de mantener el wildcard de archivo completo.
Mientras tanto, cualquier glow de color nuevo en `index.html` debe revisarse manualmente contra
`DESIGN.md` antes de asumir que está cubierto por esta excepción.
