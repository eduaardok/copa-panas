# Research: Deuda de diseño y auditoría de animaciones

**Feature**: [spec.md](./spec.md)
**Fecha**: 2026-08-29
**Estado**: Catálogo de diseño (FR-001/FR-002) completo. Catálogo de oportunidades de animación
(FR-005/FR-007) completo. Auditoría de violaciones de animación contra Principio VI (FR-006)
completa — corrida por el usuario vía `/review-animations`, ver sección 2b. **Revisión conjunta
completada (FR-008/SC-005) — ver "Veredictos aprobados" al final. research.md cerrado; avanzando
a `plan.md`.**

> Este documento es intencionalmente un catálogo de hallazgos crudos, no un plan de corrección.
> Ninguna decisión de diseño/plan.md ni contrato/data-model se redacta hasta que ambos catálogos
> (diseño + animación) estén completos y revisados con el usuario (FR-008, SC-005).

---

## Parte 1 — Deuda de diseño (Impeccable)

### Método

Se corrió el detector real del bundle de Impeccable instalado en el proyecto
(`.agents/skills/impeccable/scripts/detect.mjs`), no el resumen agregado de auditorías previas.
El detector requiere `htmlparser2`, `css-select`, `css-tree` y `domutils` para el motor de
parseo estático completo (HTML+CSS real, no solo regex); esas dependencias no estaban presentes
en el proyecto (esperado — el proyecto es intencionalmente "sin Node, sin build tools" para la
app en sí). Se instalaron temporalmente con `npm install --no-save --no-package-lock` dentro de
`.agents/skills/impeccable/` (fuera del código de la app) únicamente para correr el checker, y se
eliminó `node_modules` inmediatamente después de generar este catálogo — no queda ningún rastro
en el repo ni en `package.json` (el proyecto no tiene ninguno).

Comando ejecutado (equivalente a `npx impeccable detect`, aplicando automáticamente
`.impeccable/config.json` — tokens del sistema vía DESIGN.md/design.json + las `ignoreValues` ya
aceptadas):

```
node .agents/skills/impeccable/scripts/detect.mjs --json index.html styles.css app.js competiciones.js motor.js
```

Se confirmó que el motor de parseo estático completo corrió (sin el aviso de modo degradado por
regex que aparece cuando faltan esas dependencias), por lo que el conteo no es un undercount.

Se corrió también con `--no-config` como control: da **menos** hallazgos (36 vs. 116), no más —
confirma que `--no-config` también desactiva la carga del sistema de diseño (DESIGN.md/design.json)
usado como referencia, no solo las excepciones aceptadas. La corrida con config (116) es la
correcta para este catálogo: ya tiene aplicadas las excepciones de `.impeccable/config.json`
listadas más abajo, y compara contra el sistema de diseño real del proyecto.

### Resultado: 116 hallazgos vigentes (tras aplicar excepciones ya aceptadas)

Los números de auditorías previas (~95 tras spec 001, ~69 adicionales tras spec 002) **no son
comparables directamente** — no se sabe con qué configuración/alcance se generaron esos números
históricos, y esta corrida ya incluye el efecto de las excepciones agregadas en specs 001/002 a
`.impeccable/config.json`. El número vigente y verificado es **116**, distribuidos así:

| Regla | Cantidad | Archivo(s) |
|---|---|---|
| `design-system-color` | 72 | 71 en `styles.css`, 1 en `index.html` |
| `design-system-font-size` | 19 | `styles.css` |
| `design-system-radius` | 6 | `styles.css` |
| `cramped-padding` | 6 | `index.html` |
| `dark-glow` | 8 (revisado a 12, ver nota abajo) | `index.html` |
| `low-contrast` | 3 | `index.html` |
| `flat-type-hierarchy` | 1 | `index.html` |
| `side-tab` | 1 (descartado, ver abajo) | `index.html` |

Ninguno de los 116 vino marcado `advisory` (los advisory no cuentan como deuda ni bloquean). El
único `side-tab` es un falso positivo de atribución de archivo del detector (ver sección de
contraste con `config.json` más abajo) — la deuda real vigente es **115**, no 116.

`dark-glow` en esta tabla y en la sección de detalle de abajo queda con el conteo original (8) del
catálogo — ver la nota de reconciliación en la sección `dark-glow` de abajo: la cifra correcta y
verificada tras la implementación es **12**, no 8. No se corrige el 115 de esta sección hacia
arriba porque ese número describe el catálogo tal como se generó en esta fase (research), no el
estado final — el detalle de la corrección de conteo vive en la nota de abajo y en
`.impeccable/config.json`/`KNOWN_ISSUES.md`, que sí llevan la cifra final correcta.

### Contraste contra `.impeccable/config.json` (excepciones ya aceptadas)

El detector ya filtró automáticamente, antes de producir los 116, las excepciones documentadas en
`detector.ignoreValues`:

- `broken-image` en `index.html` (imágenes de logo con `src` vacío a propósito)
- `design-system-color` `#ff7080` (color de error preexistente en `cruces-validation`)
- `overused-font` `inter` (mandato explícito de CLAUDE.md)
- `side-tab` `border-left: 3px solid var(--gold)` y `border-left: 3px solid var(--green)`
  (Regla documentada en DESIGN.md: borde izquierdo = estado líder/completado)
- `side-tab` `*` en `styles.css` (stripe tricolor del header, identidad visual central)
- `design-system-color` `rgba(0,0,0,0.35)` y `rgba(0,0,0,0.1)` (variantes de opacidad de
  sombra/borde ya documentados)
- `design-system-font-size` `13px` y `16px` (dentro del rango body ya documentado)

**Falso positivo de atribución de archivo, no deuda nueva**: el único `side-tab` que aparece en
los 116 vigentes viene marcado `file: index.html, line: 0`, snippet `.app-header::after —
absolute 3px pseudo-element stripe (bottom: 0)`. Se verificó por lectura directa que
`.app-header::after` está declarado en `styles.css:73` (`/* Triple-color stripe FIFA WC 2026 */`)
— no existe ningún `border-left`, `border-top` ni bloque `<style>` propio en `index.html`. Es la
misma regla que ya cubre la excepción `side-tab: * en files: ["styles.css"]` de
`.impeccable/config.json`; el motor de cascada estática del detector evalúa la página renderizada
completa (`index.html` + `styles.css` enlazado) y atribuye este hallazgo puntual al archivo
escaneado en vez de a la hoja de estilos de origen, sin resolver línea (`line: 0` — a diferencia
de los demás hallazgos de `styles.css`, que sí traen línea real). **Conclusión: no es deuda nueva
ni requiere ampliar la excepción — se descarta del catálogo como falso positivo de atribución de
archivo del checker**, y el conteo de deuda real de `side-tab` queda en 0.

### Catálogo completo (crudo, no filtrado por veredicto todavía)

El archivo completo con las 116 entradas (regla, archivo, línea, snippet, descripción) generado
por el detector queda disponible para consulta puntual durante la revisión; a continuación el
detalle agrupado por categoría, con línea exacta para cada uno.

#### `design-system-color` (72) — colores literales fuera de la paleta de DESIGN.md

`styles.css`: líneas 86, 87, 96, 125, 142, 143, 144, 172, 185, 186, 190, 222, 223, 237, 247, 261,
262, 273, 335, 341, 386, 387, 388, 445, 459, 463, 549, 558, 559, 647, 671, 672, 673, 717, 739,
816, 870, 875, 888, 889, 924, 948, 983, 1076, 1087, 1097, 1111, 1122, 1130, 1141, 1143, 1184,
1187 (×2), 1189, 1264 (×2), 1283, 1284, 1293, 1298, 1302, 1303, 1305, 1328, 1329, 1330, 1331,
1332, 1349, 1350.

`index.html`: `border-top rgba(255,255,255,0.07)` en el nav inferior ("Inicio Grupos Llave
Config").

Valores repetidos que aparecen varias veces (candidatos naturales a "agregar como token" en vez de
"corregir uno por uno" si la revisión conjunta decide que son intencionales): `#ffffff`/`#fff`
(9×), `rgba(0,0,0,0.08)` (5×), `#f8faff` (5×), `#4dcc88` (4×), `rgba(0,0,0,0.12)` (4×), `#5ba0ff`
(3×), `#4a5568` (3×), `rgba(255,255,255,0.07)` (4×), `rgba(0,0,0,0.07)` (4×).

Valores que aparecen una sola vez y podrían ser drift real más que un token faltante: `#003d99`,
`#007a38`, `#ffaa44`, `#990010`, `#1a1d28`, `#1a2030`, `#f5f8ff`, `#718096`, `#4b5563`,
`#5a6577`, `#ff6070`.

#### `design-system-font-size` (19) — tamaños fuera del ramp documentado (Display 52px, Headline
18-24px, Title 20-24px, Body 13-16px, Label 10-11px)

`styles.css` líneas: 109 (10px), 119 (18px), 321 (14px), 424 (12px), 471 (12px), 506 (10px), 520
(12px), 599 (22px), 610 (14px), 710 (18px), 752 (12px), 851 (20px), 869 (20px), 907 (14px), 1064
(14px), 1164 (14px), 1239 (12px), 1287 (14px), 1324 (40px).

Nota: varios de estos (10px, 14px, 18px, 20px) caen cerca de los rangos documentados de Label/Body
/Headline pero no coinciden con un valor ya usado en los componentes de referencia de
`design.json` — a clasificar en la revisión conjunta si son "variante razonable dentro del rango"
o "drift a corregir al valor exacto documentado". El `40px` de la línea 1324 no tiene ningún paso
del ramp cerca (el salto documentado es Title 20-24px → Display 52px) — candidato más claro a
corrección o a documentarse como paso nuevo intencional.

#### `design-system-radius` (6) — radios fuera de la escala documentada

`styles.css` líneas: 436 (10px), 801 (6px), 959 (10px), 1059 (10px), 1112 (24px, ver nota abajo —
**no es falso positivo**), 1233 (10px).

**Verificado: 1112 (24px, `.modal-box`) no es un falso positivo del detector.** Se revisó el
código del checker (`design-system.mjs`, `extractRadiusTokens`/`checkRadiusValue`): separa el
shorthand `border-radius: 24px 24px 0 0` en sus 4 tokens y valida cada uno contra la escala
machine-readable de `DESIGN.md`; los `0` pasan sin problema, y el finding es específicamente sobre
el token `24px`. La escala real que el detector carga es el frontmatter YAML de `DESIGN.md`
(`rounded: { sm: 8px, md: 12px, lg: 14px, xl: 16px, pill: 20px, full: 50% }`, líneas 40-46 de
`DESIGN.md`) — **ese objeto no incluye `24px`**. El `24px` para esquinas de modal solo está
documentado en la prosa de `DESIGN.md` ("Modales usan esquinas superiores redondeadas únicamente
(`24px 24px 0 0`)", línea ~275), no en el frontmatter que el checker realmente consulta. Es un
desfase real entre la prosa y la escala formal del design system — deuda de documentación /
sincronización, no un bug del detector — y debe resolverse ahí (agregar `24px` como paso
documentado en el frontmatter `rounded:`, o revisar si el valor debería normalizarse a `xl: 16px`)
en la revisión conjunta, no descartarse. La deuda real vigente sigue en **115**, no baja a 114.

Ninguno de los otros radios (10px ×4, 6px ×1) tiene mención en la prosa de `DESIGN.md` — son
drift sin respaldo documental en ningún lado, a diferencia del caso de 24px.

#### `cramped-padding` (6) — `index.html`, contenedores con texto pegado al borde

Todas en `<div class="card-glass">` (5 instancias) y una en `<div class="campeon-card">` /
`modal-box` — hijos sin padding interno perceptible contra un borde visible.

#### `dark-glow` (8 en este catálogo inicial, 12 verificado en la excepción final) — `index.html`, glows de color en fondo oscuro

Box-shadow/text-shadow de color cero-offset: `#e0182d` (1), `#0052c8` (3), `#00a64e` (1), `#c9a84c`
(2, uno box uno text-shadow), y una más `#0052c8` en fondo de página oscuro.

**Nota de reconciliación (Revisión de cierre, ver `tasks.md`)**: este conteo de 8 fue un resumen
manual al armar el catálogo, no una corrida exhaustiva del checker regla por regla. Al escribir la
excepción final en `.impeccable/config.json` se volvió a correr el checker con `dark-glow`
temporalmente sin excepción y dio **12** hallazgos reales, no 8 — verificado empíricamente
(`node .agents/skills/impeccable/scripts/detect.mjs`, filtrado a `antipattern === 'dark-glow'`).
La diferencia (+4) son declaraciones de `box-shadow` en `color-mix(in srgb, var(--blue)/var(--green)
...)` que existen varias veces para el mismo componente por estado (`.btn-primary` base/`:focus`/
`:active`, `.btn-success` base/hover) — el resumen inicial contó un representante por componente en
vez de cada declaración CSS por separado. **12 es la cifra correcta y vigente** (coincide con la
excepción final de `.impeccable/config.json` y con `KNOWN_ISSUES.md`); los 4 hallazgos adicionales
son la misma familia de glow de marca (azul de foco/active de botón primario, verde de botón
success) ya cubierta por el mismo Shadow Vocabulary de DESIGN.md — no son glows nuevos ni fuera de
esta categoría.

#### `low-contrast` (3) — `index.html`, contraste WCAG AA insuficiente

`#ffffff` sobre `#00a64e` → 3.2:1 (necesita 4.5:1), repetido dos veces; `#6b7a8d` sobre `#0e1420`
→ 4.2:1 (necesita 4.5:1, muy cerca del umbral).

#### `flat-type-hierarchy` (1) — `index.html`

Seis tamaños de fuente (11/12/13/14/15/16px) usados con muy poco contraste entre sí (ratio 1.5:1
sobre todo el rango) — jerarquía tipográfica plana.

#### `side-tab` (1, descartado) — falso positivo de atribución de archivo

`.app-header::after` (declarado en `styles.css:73`, mal atribuido a `index.html` por el motor de
cascada) — ver nota de "Falso positivo de atribución de archivo" más arriba. No cuenta como deuda
real; deuda efectiva de `side-tab`: **0**.

#### Otros hallazgos (inspección manual, sin ID de regla del detector)

El checker automático de Impeccable no cubre balance/proporción visual entre elementos hermanos
del mismo componente — lo siguiente se agrega por inspección humana directa del layout, no por
`detect.mjs`, y por eso no tiene un `antipattern` id ni entra en el conteo de 115:

- **Desbalance de tarjetas en `#lista-competiciones`** (`index.html:75`, render en
  `app.js:247-264`, estilos en `styles.css:362-378`). `.competicion-card` es `flex-column`
  centrado con `min-height: 96px` (altura mínima, no fija) y el título va en una sola línea de
  `font-bebas text-2xl` sin `white-space: nowrap` ni `line-clamp`. En el grid de 2 columnas que se
  activa a partir de 640px (`styles.css:397-402`, `grid-template-columns: repeat(2, 1fr)`), el
  título "Champions League" (`competiciones.js:84`, 16 caracteres) es notablemente más largo que
  "Mundial 2026" (`competiciones.js:33`, 12 caracteres); en anchos de columna angostos (justo
  encima de 640px, antes de que la columna tenga espacio de sobra) el título más largo puede
  quebrar a dos líneas mientras el más corto queda en una, haciendo que las dos tarjetas de la
  misma fila crezcan a alturas distintas por `min-height` sin piso común — asimetría visual dentro
  del mismo grid. Candidato a resolver con alguna combinación de: tamaño de fuente responsivo
  (`clamp()`) para el título, `line-clamp` + altura de línea fija, o una altura mínima mayor que
  cubra el caso de 2 líneas para cualquier nombre de competición futuro (el proyecto ya anticipa
  "más por venir" en CLAUDE.md, así que esto no es exclusivo del par Mundial/Champions actual).

---

## Parte 2 — Auditoría de animaciones

### 2a. Oportunidades de animación (`find-animation-opportunities`) — completo

Ejecutado directamente contra el estado actual de `styles.css`, `app.js` e `index.html`. Cinco
oportunidades sobrevivieron el gate de 4 preguntas (frecuencia/propósito/velocidad/función); cinco
candidatos adicionales fueron evaluados y rechazados explícitamente.

#### Tabla de oportunidades

| # | Ubicación | Hoy | Propósito | Frecuencia | Movimiento sugerido |
|---|---|---|---|---|---|
| 1 | `styles.css:130-131` (`.screen`/`.screen.active`), disparado por `mostrarPantalla()` en `app.js:175-181` | Swap instantáneo `display:none`→`block` entre las 9 pantallas de fase | Preventing a jarring change | Occasional (pocas veces por torneo) | `.screen.active { animation: fadeIn 220ms ease; }` reutilizando `@keyframes fadeIn` ya definido en `styles.css:1383` |
| 2 | `styles.css:1094-1119` (`.modal-overlay`/`.modal-box`); cierre en `app.js` (`cerrarModalResultado:1347`, `cerrarModalImportarJugadores:517`, `modal-sorteo:668`) | Entra con `fadeIn 200ms` + `slideUp 250ms`; sale instantáneo vía `.hidden{display:none}` | Preventing a jarring change (camino simétrico) | Occasional | Clase `.closing` con `fadeOut`/`slideDown` (reverso de los keyframes existentes), 180ms ease; en `app.js` mover el `classList.add('hidden')` a después de `animationend` o un `setTimeout` de 180ms |
| 3 | `styles.css:1278-1297` (`.toast`), disparado por `mostrarToast()` en `app.js:147-152` | Entra con `toastIn 200ms`; sale instantáneo vía `el.className='toast hidden'` tras 3s | Preventing a jarring change | Occasional | `@keyframes toastOut` (reverso de `toastIn`), 180ms ease; agregar clase `.leaving` 180ms antes del swap final a `hidden` |
| 4 | `index.html:409-416` (`#dashboard-campeon`/`.campeon-card`), revelado en `app.js` (~línea 1690) | Aparece de golpe con `classList.remove('hidden')`; único movimiento existente es el `pulse-glow` continuo (`styles.css:1267-1275`) | Delight (momento de mayor peso emocional del North Star) | Rare (una vez por torneo) | `.campeon-card { animation: campeonReveal 380ms ease-out; }` con `@keyframes campeonReveal { from{opacity:0;transform:scale(0.94)} to{opacity:1;transform:scale(1)} }` |
| 5 | `styles.css:546` (`.match-card`) y `styles.css:664` (`.bracket-match`) | `transition` ya declara `background/border-color/transform 200ms ease` pero no existe regla `:hover` — sin feedback en desktop (solo `.competicion-card` tiene `:hover`, línea 378) | Feedback | Tens/day en desktop, acotado por `pointer:fine` | `@media (hover:hover) and (pointer:fine) { .match-card:hover, .bracket-match:hover { border-color: var(--blue); background: rgba(255,255,255,0.05); } }` |

#### Candidatos rechazados

- `.nav-tab` (cambio de tab inferior, `app.js:176-179`) — **Rechazado: alta frecuencia (decenas
  de veces por sesión), ya tiene un `color` transition de 200ms.**
- `.sorteo-jugador-item` (`styles.css:1056-1065`) — **Rechazado: ya tiene `slideInUp 280ms` por
  ítem, ya escalonado por el propio `setInterval` en `app.js:657`/`862`; no hay hueco real.**
- Reordenamiento de `.clasificado-row` al cambiar un resultado — **Rechazado: dato funcional que
  el usuario está leyendo; una animación de reordenamiento (FLIP) arriesga ambigüedad sobre el
  resultado real y requeriría tocar lógica de render, no solo estilo.**
- Avance de ganador al siguiente cruce del bracket — **Rechazado para este pase: requeriría
  cambios en el flujo de render de `app.js` más allá de un toggle de clase; candidato a spec
  futura, no a este pulido visual.**
- `.counter-btn` (botones +/- de marcador) — **Rechazado: ya tiene feedback de press
  (`scale(0.9)`, `styles.css:297`); sin hueco.**

#### Veredicto

La app ya tiene una base de motion contenida y correcta (press-feedback consistente, un solo
`prefers-reduced-motion` global, sorteo ya escalonado por su propio mecanismo). La brecha real es
**asimetría entrada/salida** en modal y toast, y **un vacío en el momento de mayor peso emocional
del North Star** (revelación de campeón, hoy un simple `display:block`). La oportunidad #4 es la
de mayor leverage.

### 2b. Violaciones de animación contra Principio VI (`review-animations`) — completo

`review-animations` no puede invocarse desde este agente (`disable-model-invocation`); lo corrió
el usuario directamente en su sesión contra `styles.css`/`app.js` tal como quedaron tras spec 003.
Resultado íntegro a continuación.

#### Hallazgos (tabla original de la skill)

| Antes | Después | Por qué |
|---|---|---|
| `@keyframes fadeIn/slideUp/slideInUp/toastIn` usan `ease` (`styles.css:1104,1118,1065,1294`) | `cubic-bezier(0.16, 1, 0.3, 1)` (o similar ease-out fuerte) | Son entradas (modal, toast, ítems de sorteo) — el momento que más mira el usuario. `ease` es una curva débil, más cercana a ease-in-out que a un ease-out responsivo real |
| `.mode-btn { transition: all 200ms ease; }` (`styles.css:325`) | `transition: background 200ms ease, border-color 200ms ease, color 200ms ease;` | `transition: all` es un disparador de escalación — anima cualquier cambio futuro de propiedad sin querer |
| `.grupo-tab { transition: all 200ms ease; }` (`styles.css:730`) | mismo fix (propiedades explícitas) | misma razón |
| `.ronda-tab { transition: all 200ms ease; }` (`styles.css:760`) | mismo fix | misma razón |
| `.cl-check { transition: all 200ms ease; }` (`styles.css:808`) | mismo fix | misma razón |
| `.btn-clasificados-num { transition: all 200ms ease; }` (`styles.css:938`) | mismo fix | misma razón |
| `.penal-btn { transition: all 200ms ease; }` (`styles.css:967`) | mismo fix | misma razón |
| `.competicion-card:hover, :focus-visible { transform: translateY(-2px); }` (`styles.css:378-383`) | envolver el selector `:hover` en `@media (hover: hover) and (pointer: fine)`, dejar `:focus-visible` fuera de ese media query | Un `:hover` sin gatear en una app touch-first puede dejar el lift "pegado" tras un tap en Android/iOS hasta que el usuario toque otra parte |

Nota de la skill: las siete instancias de `transition: all` hoy solo animan propiedades
paint-safe (`background`/`border-color`/`color`), así que no hay un bug de performance activo —
es un fix de robustez/precisión, no de frame-drop.

#### Veredicto de la skill

**Decisión: Approve**, con las dos limpiezas señaladas (curva en los keyframes de entrada,
`transition: all` → propiedades explícitas, gating de hover) marcadas como *fast follow-ups* para
esta spec de deuda de diseño — no son bloqueantes; nada de esto es una regresión de sensación ni
un problema real de GPU/performance en el código actual.

**Missed simplifications / precision**: las siete declaraciones `transition: all` deberían
ajustarse a propiedades explícitas. Riesgo bajo hoy, pero es el patrón que más se repite en el
codebase (7 veces) y es el principal disparador de escalación del estándar — vale la pena
corregirlo en este mismo pase porque toca las mismas reglas que ya se van a editar.

**Origin, physicality & cohesion**:
- Los keyframes de entrada (`fadeIn`, `slideUp`, `slideInUp`, `toastIn`) usan la curva `ease` por
  defecto — cambiarlos a un `cubic-bezier` ease-out real es un cambio de una línea en cuatro
  bloques `@keyframes` que hace sentir más "snappy" cada entrada de modal, toast e ítem de sorteo,
  sin costo.
- El modal (`styles.css:1109-1119`) es un bottom sheet, correctamente exceptuado de la regla "no
  `scale(0)`, no origen centrado" de popovers.
- La única regla `:hover` (tarjeta de competición) necesita gating de hover/pointer según el
  Standard 8.

**Lo que ya está bien y no debe tocarse**:
- Toda propiedad animada en el archivo es `transform`/`opacity`/`background`/`border-color`/
  `color`/`box-shadow` — nada anima propiedades de layout (`width`/`height`/`top`/`left`). Limpio.
- Ningún `scale(0)` en ningún lado; todos los estados de press usan `scale(0.9–0.99)`, correcto
  según el Standard 5.
- El bloque de reduced-motion (`styles.css:1490-1497`) es un único override global que colapsa
  `animation-duration`/`transition-duration` a casi cero y detiene los conteos de iteración —
  frena correctamente los loops infinitos de `spin-bombo` y `pulse-glow` sin borrar los cambios de
  estado funcionales. Es la forma correcta y de bajo mantenimiento para esa regla.
- Las entradas de `sorteo-jugador-item` (`app.js:658-680, 875-878`) se agregan una por una vía
  `setInterval`, así que cada una recibe su propio `slideInUp` — un reveal naturalmente
  secuenciado sin necesidad de stagger manual.
- `mostrarToast` (`app.js:147-153`) limpia su propio timer en cada llamada — sin timeouts
  filtrados ni carreras de doble-hide.
- El pulso `.glow-gold` en la pantalla de campeón y el spinner del bombo de sorteo son ambos
  momentos rare/una-vez-por-torneo — el movimiento decorativo ahí está ganado, no es una
  violación del Standard 2.

#### Cruce con la Parte 2a (oportunidades)

Los hallazgos de `review-animations` son consistentes con y complementan (no contradicen) las
oportunidades ya catalogadas en 2a: la corrección de curva en `fadeIn`/`slideUp`/`slideInUp`/
`toastIn` (aquí, fast-follow) es la misma base sobre la que se apoyarían las oportunidades #1, #2
y #3 de 2a (transiciones de pantalla, salida simétrica de modal y toast) — conviene resolverlas
en conjunto en la fase de implementación, no una antes que la otra por separado.

---

## Veredictos aprobados

Revisión conjunta de este research.md completada (FR-008/SC-005). Las siguientes decisiones están
**cerradas** — son la base directa de `plan.md` y no se reabren durante el diseño ni la
implementación de esta spec. Cualquier hallazgo no cubierto explícitamente abajo se trata según la
regla general ya establecida en cada subsección de más arriba.

### Diseño

1. **`design-system-color` (72 hallazgos)**: se corrigen todos al token documentado más cercano,
   **excepto** los 9 valores que aparecen repetidos de forma consistente — `#ffffff`/`#fff` (9×),
   `rgba(0,0,0,0.08)` (5×), `#f8faff` (5×), `#4dcc88` (4×), `rgba(0,0,0,0.12)` (4×), `#5ba0ff`
   (3×), `#4a5568` (3×), `rgba(255,255,255,0.07)` (4×), `rgba(0,0,0,0.07)` (4×) — que se agregan
   como tokens nuevos documentados en `DESIGN.md`/`design.json` (con nombre y rol), no se
   "corrigen" a otro valor. Los 11 valores de una sola aparición (`#003d99`, `#007a38`, `#ffaa44`,
   `#990010`, `#1a1d28`, `#1a2030`, `#f5f8ff`, `#718096`, `#4b5563`, `#5a6577`, `#ff6070`) sí se
   corrigen al token existente más cercano — el mapeo exacto valor→token para cada uno de los 11
   se resuelve en `plan.md`/`data-model.md`, no en este documento.
2. **`design-system-font-size` (19 hallazgos)**: se normalizan todos al valor exacto documentado
   más cercano del ramp (Display 52px / Headline 18-24px / Title 20-24px / Body 13-16px / Label
   10-11px) — ninguno queda sin normalizar como "variante razonable". Excepción de proceso: el
   `40px` de `styles.css:1324` no se decide acá. Contexto ya identificado para que `plan.md` lo
   resuelva: `.empty-state i { font-size: 40px; opacity: 0.35; ... }` — es el tamaño del glyph de
   un ícono de Font Awesome en un estado vacío (p. ej. "no hay jugadores"), no tamaño de texto de
   lectura; `plan.md` debe reportar explícitamente esta identificación y decidir ahí si se
   documenta como paso nuevo del ramp o se corrige al valor más cercano (Title 24px o Display
   52px) antes de aplicar el cambio.
3. **Radio `24px` de `.modal-box` (`styles.css:1112`)**: se sincroniza documentación, **no se
   toca código**. Se agrega `24px` al frontmatter `rounded:` de `DESIGN.md` como paso válido (ej.
   `sheet: 24px`) — el modal-box no se normaliza a otro radio.
4. **Los otros 5 radios** (10px ×4 en líneas 436/959/1059/1233, 6px ×1 en línea 801): se corrigen
   al valor documentado más cercano de la escala existente (8/12-14/16/20/24px, ya con el
   `sheet: 24px` del punto 3 agregado).
5. **`cramped-padding` (6), `dark-glow` (8), `low-contrast` (3) y `flat-type-hierarchy` (1)**: se
   corrigen todos, sin excepciones.
6. **Hallazgo manual de `#lista-competiciones`**: se corrige con altura mínima mayor + tamaño de
   fuente responsivo (`clamp()`) en el título de la tarjeta, diseñado para nombres de competición
   futuros más largos que "Champions League" (CLAUDE.md ya anticipa "más por venir"), no acotado
   solo al par Mundial/Champions actual.

### Animación

7. **Las 5 oportunidades de la sección 2a** se implementan completas: transición de pantalla
   (`.screen`/`.screen.active`), salida simétrica de modal, salida simétrica de toast, revelación
   de campeón (`.campeon-card`), y hover en `.match-card`/`.bracket-match` para desktop.
8. **Los 3 fast-follows de la sección 2b** se aplican: curva `cubic-bezier` ease-out en los 4
   `@keyframes` de entrada (`fadeIn`/`slideUp`/`slideInUp`/`toastIn`), las 7 declaraciones
   `transition: all` → propiedades explícitas, y el gating
   `@media (hover: hover) and (pointer: fine)` en `.competicion-card:hover`.
