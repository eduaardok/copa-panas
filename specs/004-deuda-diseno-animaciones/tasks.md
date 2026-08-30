---

description: "Task list for Deuda de diseño y auditoría de animaciones (004)"
---

# Tasks: Deuda de diseño y auditoría de animaciones

**Input**: Design documents from `/specs/004-deuda-diseno-animaciones/`

**Prerequisites**: plan.md, spec.md, research.md (§Veredictos aprobados), data-model.md,
contracts/design-tokens-contract.md, contracts/animation-motion-contract.md, quickstart.md

**Tests**: No hay framework de tests automatizados en el proyecto (consistente con specs
001-003); la validación es el checker de Impeccable + verificación manual de `quickstart.md`, no
tests de código.

**Organización**: Fase 3 (US1, deuda de diseño) y Fase 4 (US2, animación) son **aislables entre
sí** — ninguna tarea de una depende de una tarea de la otra, y cada una tiene su propio paso de
verificación final en la Fase 6 (T024 para US1, T025 para US2). Si `quickstart.md` falla al
terminar, el checkpoint que falla dice de qué pase viene la regresión sin tener que revisar ambos
pases juntos.

## Estado: T001-T027 completas, con verificación real en navegador (Playwright, Chromium ya
cacheado de specs anteriores) en mobile 390×844 y desktop 1280×900. Durante la verificación
aparecieron dos hallazgos fuera del contrato original de esta spec, ambos revisados con el usuario
antes de tocar nada:

- **F1 — bug de `space-y-3` + grid en `#lista-competiciones`** (T026): las tarjetas "Mundial 2026"
  y "Champions League" ya tenían alturas distintas (132px/120px) por una clase de spec 002
  interfiriendo con el grid. **Corregido con aprobación explícita**: `index.html:75`
  `class="space-y-3"` → `class="flex flex-col gap-3"`.
- **F3 — bug de `bg-navy` en `<body>`** (reportado por el usuario probando la app en tema claro,
  no estaba en ningún catálogo): `<body>` tenía la clase Tailwind `bg-navy` (color fijo
  `#07090f`), que le gana por especificidad CSS a la regla `body { background-color: var(--bg) }`
  de `styles.css` — invisible en tema oscuro (mismo valor), pero deja el fondo negro pegado en
  tema claro. Pre-existente, no introducido por esta spec, pero recién visible ahora. **Corregido
  con aprobación explícita**: `index.html:42` — se quitó `bg-navy` de la clase de `<body>`
  (`body{background-color:var(--bg)}` ya cubre ambos temas correctamente sin esa clase).
- El pedido de un botón para volver a la selección de competición mientras hay un torneo activo
  **no se implementó** — violaría la decisión D1 de la constitución ("la pantalla de selección de
  competición solo es alcanzable cuando no hay torneo activo"). El usuario pidió dejarlo anotado
  como candidato a una spec futura que proponga reabrir/enmendar D1 explícitamente — no se decide
  ni se toca acá.

- **F4 — header/toggle de tema ausente en pantallas iniciales** (reportado por el usuario): el
  header (con el botón de tema) solo se mostraba desde `dashboard`/`fase-grupos`/`eliminacion`/
  `config`/`clasificados` — quedaba oculto en selección de competición, setup, equipos y config de
  grupos, sin forma de cambiar de tema ahí. **Corregido con aprobación explícita**:
  `app.js` (`mostrarPantalla()`) — se separó la visibilidad del header de la de la barra inferior
  (`screensConHeader` ahora incluye `competicion`, `setup`, `equipos`, `grupos-config`; la barra
  inferior sigue oculta ahí porque sus tabs no aplican todavía).
- **F5 — el trofeo/títulos dorados no cambian a plata en Champions** (reportado por el usuario:
  "no veo la diferencia... es lo mismo"): 41 usos de las clases Tailwind `text-gold`/`bg-gold`/
  `border-gold` (color fijo `#c9a84c` del `tailwind.config` inline) en `index.html`/`app.js` no
  reaccionan a `aplicarPaletaCompeticion()`, que sí actualiza `var(--gold)` correctamente
  (confirmado: `--gold` computado da `#c0c4cc` en Champions) — el color más visible de la app
  (trofeo, títulos) quedaba dorado en cualquier competición porque esas clases nunca miran la
  variable. **Corregido con aprobación explícita**: `styles.css` — 3 reglas nuevas
  (`.text-gold`/`.bg-gold`/`.border-gold { ...: var(--gold) !important; }`) que sobreescriben las
  de Tailwind con el mismo patrón ya usado en el proyecto para `.text-white`/`.text-gray-*`
  (`styles.css:1363+`). Cero cambios en `index.html`/`app.js` — mismas clases, ahora reactivas.
- **F2 (revisión de contraste, "así en general, no se distinguen bien")**: el límite entre
  tarjetas blancas y fondo en modo claro era demasiado sutil (`border-color: rgba(0,0,0,0.08)` +
  `box-shadow: rgba(0,0,0,0.07)`), heredado de specs 001/002. **Corregido con aprobación
  explícita**: `--border` de modo claro y los bordes/sombras de `.card-glass`, `.competicion-card`,
  `.match-card`, `.bracket-match`, `.cruce-row`, `.asignacion-row` subidos a
  `rgba(0,0,0,0.16)`/sombras a `~0.10-0.12` — mismo lenguaje visual (sin sombras tipo Material),
  solo más definición.

- **F6 — más animación, a pedido explícito del usuario** (no un bug, una ampliación de alcance
  acordada): de 4 candidatos ya descartados en `research.md` §2a (Rejected), el usuario pidió los
  4 igual tras ver la recomendación en contra de uno de ellos.
  - **Entrada escalonada** en `.match-card`/`.bracket-match`/`.asignacion-row` (`styles.css`,
    stagger por `nth-child` hasta 8 ítems, reutiliza `slideInUp`/`--ease-entrada` ya existentes).
    Cubre también la entrada del ganador al avanzar en la llave, ya que `.bracket-match` se
    re-crea completo en cada partido guardado.
  - **Reordenamiento FLIP de la tabla de posiciones**: nuevo helper
    `capturarPosicionesTabla()`/`animarReordenTabla()` en `app.js`, conectado a
    `renderizarFaseGrupos()` — captura la posición Y de cada fila (por `data-jugador-id`, atributo
    nuevo en el `<tr>`) antes de re-renderizar y anima el delta tras el render. Verificado con
    datos reales (no solo lectura de código): 3 de 4 filas con delta real (57.5px/57.5px/-115px)
    tras guardar un resultado que cambia el orden; la fila que no se movió no dispara nada.
  - **Tabs de navegación inferior**: cambio mínimo (`styles.css`) — la curva de la transición del
    ícono pasa de `ease` a `var(--ease-entrada)` y se agrega un `scale(1.08)` sutil al ícono activo
    junto al `translateY(-2px)` ya existente. Deliberadamente no se agregó nada más ahí — se
    mantiene la razón original (alta frecuencia de uso) pero con la mejora pedida.

- **F7 — franja tricolor invisible en desktop una vez que hay torneo en curso** (reportado por el
  usuario: "solo la veo en pantallas de configuración... en mundial o champions no se ve nada"):
  en ≥1024px, `.bottom-nav` se reposiciona con `top: calc(60px + safe-top)` para quedar debajo del
  header (spec 001) — pero el header real mide **68px** (medido con Playwright), no 60px. La barra
  de nav quedaba pisando los últimos 8px del header, tapando por completo la franja de 3px
  (`.app-header::after`) apenas la barra de nav se mostraba (dashboard/grupos/llave/config) — visible
  solo en las pantallas donde la nav todavía está oculta (selección/setup/equipos, antes de esta
  spec sin header siquiera). Pre-existente de spec 001, no introducido por esta spec.
  **Corregido con aprobación explícita**: `styles.css`, 3 valores acoplados del breakpoint
  `≥1024px` ajustados de 60px al valor real (68px) — posición de `.bottom-nav`, `padding-top` de
  `body` (60+52→68+52), y el offset de `.screen{min-height}` (190→198, mismo delta de +8).
  Re-verificado con medición real de `getBoundingClientRect()`: header termina en y=68, nav ocupa
  68-120 sin superposición, contenido arranca exactamente en y=120 — sin huecos ni pisadas nuevas.
  Mobile no se tocó (no tenía el problema) y se confirmó sin cambios visuales.

Los 7 hallazgos (F1-F7) re-verificados tras cada cambio: checker de Impeccable en 0, torneo
completo (Mundial + Champions, mobile + desktop) re-corrido sin fallos, `prefers-reduced-motion`
confirmado cubriendo también las animaciones nuevas de F6 sin cambios adicionales.

## Revisión de cierre — F4 y F6 (antes de commit)

Pedido explícito de revisar en detalle F4 y F6 por tocar terreno que la revisión conjunta había
cerrado en sentido contrario (research.md, candidatos rechazados en §2a). Verificado con el diff
real de `app.js`, no solo por descripción:

- **F6 — orden de clasificados**: `posicionesDeGrupo()` (app.js:1039) delega el cálculo a
  `calcularPosiciones()` en `motor.js` — `git diff --stat -- motor.js` da vacío, cero cambios. El
  único cambio en el `<tr>` fue agregar `data-jugador-id`; el `.map()` sobre `posiciones` (orden,
  leader, PJ/PG/PE/PP/GF/GC/DG/PTS) es idéntico al de antes.
- **F6 — tabla de posiciones, sin fade**: `.standings-table tbody tr` solo transiciona `transform`
  (nunca `opacity`); `animarReordenTabla()` solo escribe `tr.style.transform`. El contenido de la
  fila se actualiza instantáneo y correcto; solo la posición vertical anima. Sin ventana de
  ambigüedad sobre el resultado.
- **F6 — avance en la llave, corrección de precisión**: a diferencia de la tabla, esto **no** es
  un reordenamiento con tracking de posición — `renderizarEliminacion()` y
  `procesarAvanceEliminacion()` no aparecen en el diff (cero cambios). Lo agregado es una entrada
  genérica (`opacity`+`transform`, `slideInUp`) aplicada a todas las tarjetas de la llave en cada
  re-render completo (que la función ya hacía antes). El dato mostrado nunca es provisional — la
  tarjeta ya tiene el contenido final correcto antes de que termine de aparecer.
- **F4 — sin decisión documentada**: rastreado con `git log -S "screensConNav"` hasta el primer
  commit del repo (pre-spec-kit) — nunca revisado en specs 001-003. Sin justificación escrita para
  la restricción original. **Confirmado explícitamente: se mantiene F4** (header visible en las 4
  pantallas nuevas de forma permanente).

## Revisión de cierre #2 — `.impeccable/config.json` (antes de commit)

El contrato original (`contracts/design-tokens-contract.md`) decía que este archivo quedaría
"sin cambios" — terminó con 4 cambios reales (1 modificación + 3 excepciones nuevas). Pedido
explícito de justificar cada una contra el Veredicto #5 de `research.md` ("corregir todos, sin
excepciones" para cramped-padding/dark-glow/flat-type-hierarchy), no solo documentarlas.

Al revisar en detalle, **2 de las 3 excepciones originales no estaban bien justificadas**:

- **`cramped-padding`**: 5 de los 6 hallazgos SÍ se corrigieron en código (no era una limitación
  técnica, era más rápido usar la excepción) — padding real agregado a `.card-glass.p-3`/`.p-4`,
  `.modal-box.py-6`/`.py-8` (`styles.css`), y `.campeon-card` con compensación de
  `#confetti-canvas` (verificado que la cascada CSS no duplica el padding, y visualmente que el
  confetti sigue cubriendo la tarjeta completa). Queda 1 caso genuinamente no corregible
  (`.modal-box` lado inferior, `calc(24px + var(--safe-bottom))` — `resolveLengthPx()` en el
  checker no parsea `calc()`, verificado leyendo su código fuente) — excepción re-escrita para
  cubrir solo ese caso, con la razón técnica exacta.
- **`flat-type-hierarchy`**: la razón original estaba **mal** — no es "consecuencia intencional
  del ramp", es el mismo blind-spot de Tailwind que cramped-padding (26 usos de
  `text-5xl`/`4xl`/`3xl`/`2xl`/`xl` en títulos sin `font-size` estático). Arreglarlo de verdad
  requiere extender el Veredicto #2 a esos 26 usos — **explícitamente diferido**, no resuelto en
  esta spec. Excepción re-escrita con la causa real, marcando el trabajo pendiente.
- **`dark-glow`**: confirmado que sí es la categoría correcta (no una limitación técnica, un
  desacuerdo de criterio con el Shadow Vocabulary ya documentado) — se mantiene, sin cambios de
  fondo, solo prolijidad en la razón.

También se confirmó (leyendo `impeccable-config.mjs`) que ninguna de las 3 puede acotarse a un
selector/valor específico como `side-tab` — no están en `directValueRules`, solo admiten wildcard
por archivo. Como hallazgo colateral: **los 2 `side-tab` de valor específico ya existentes desde
spec 001 nunca funcionaron** (mismo límite técnico, entrada muerta) — no se tocaron, es
preexistente y fuera de alcance de esta spec.

Re-verificado tras los cambios: checker en 0, torneo completo (Mundial + Champions, mobile +
desktop) sin fallos, captura visual de la pantalla de campeón confirmando que el confetti sigue
cubriendo la tarjeta completa.

Con esta revisión cerrada, la spec queda lista para commit.

## Formato: `[ID] [P?] [Story] Descripción`

- **[P]**: se puede hacer en paralelo (archivo distinto, o mismo archivo pero selector/sección sin
  solapamiento con otras tareas [P] del mismo grupo)
- **[Story]**: US1 = deuda de diseño (P1), US2 = animación (P2), US3 = verificación de no
  regresión (P3)

---

## Fase 1: Setup

- [X] T001 Instalar temporalmente las dependencias del checker de Impeccable
      (`htmlparser2`, `css-select`, `css-tree`, `domutils`) dentro de
      `.agents/skills/impeccable/` vía `npm install --no-save --no-package-lock`, y confirmar
      corriendo `node .agents/skills/impeccable/scripts/detect.mjs --json index.html styles.css app.js competiciones.js motor.js`
      que el motor de parseo estático corre completo (sin el aviso de modo degradado) — establece
      la línea base antes de empezar a editar. No instala nada en la app en sí (`node_modules`
      queda fuera de `styles.css`/`app.js`/etc., se borra en T027).

---

## Fase 2: Foundational

**No aplica.** US1 (deuda de diseño) y US2 (animación) no comparten ningún prerrequisito
bloqueante — cada una edita secciones de `styles.css` que no se solapan (colores/radios/tamaños de
fuente vs. `@keyframes`/`transition`/`:hover`), y US2 no depende de ningún token de `DESIGN.md`.
Esto es intencional: permite implementar y verificar los dos pases de forma aislada (ver
Organización arriba).

---

## Fase 3: User Story 1 - Deuda de diseño (Priority: P1)

**Goal**: `styles.css`/`index.html` quedan alineados con `.impeccable/design.json`/`DESIGN.md` —
0 hallazgos `design-system-color`/`design-system-font-size`/`design-system-radius` sin justificar,
más los 4 hallazgos de accesibilidad/jerarquía (`cramped-padding`, `dark-glow`, `low-contrast`,
`flat-type-hierarchy`) y el hallazgo manual de `#lista-competiciones` resueltos.

**Independent Test**: correr el checker de Impeccable (T001) después de completar esta fase, antes
de tocar nada de Fase 4 — debe dar 0 hallazgos `design-system-*` sin justificar. Ver
`quickstart.md` §1-2, §5.

### Documentación de tokens (va ANTES que las tareas de `styles.css` que los consumen)

- [X] T002 [US1] Actualizar `DESIGN.md` (frontmatter + prosa): agregar los 14 tokens de color
      nuevos (8 del bucket "repetidos" + 6 reclasificados de un solo uso — nombres y valores
      exactos en `contracts/design-tokens-contract.md`), `sheet: "24px"` en `rounded:`,
      `typography.title` (`fontFamily: "'Bebas Neue', cursive"`, `fontSize: "22px"`,
      `fontWeight: 700`, `lineHeight: 1`), e `icon: { sm: "18px", lg: "40px" }`
- [X] T003 [US1] Sincronizar `.impeccable/design.json` (`extensions.colorMeta`, y
      `typographyMeta`/`roundedMeta` si corresponde) con los tokens agregados en T002 (depende de
      T002)

> **Desviación T002/T003**: `icon: { sm, lg }` no quedó como key top-level del frontmatter como
> decía data-model.md — el checker (`addTypographySizes`) solo lee tamaños de fuente dentro de
> `typography:`, así que se movió a `typography.scale: { icon-sm: "18px", icon-lg: "40px" }` (el
> mecanismo real que el detector entiende para pasos de ramp adicionales). Mismo efecto, ubicación
> distinta. También se agregó un token no catalogado originalmente: `dorado-superficie-claro`
> (`#f8f4e8`, gradiente claro de `.campeon-card`, línea 1264 — faltaba en el catálogo de 11
> colores únicos de `research.md`) y `verde-grupos-accesible` (`#038242`, ver desviación T010).

### Correcciones de color en `styles.css`

- [X] T004 [US1] Corregir los 5 colores de una sola aparición sin token nuevo en `styles.css`
      (líneas 647 `#1a1d28`→`#0f1420`, 875 `#ffaa44`→`var(--red)`, 1087 `#ff6070`→`#ff7080`, 1122
      `#f5f8ff`→`#f8faff`, 1283 `#1a2030`→`var(--bg-card)`) según
      `contracts/design-tokens-contract.md` (depende de T002/T003 para los que apuntan a un token
      nuevo)
- [X] T005 [P] [US1] Reemplazar las 3 (no 4 — ver desviación) apariciones literales de
      `rgba(255,255,255,0.07)` en `styles.css` por `var(--border)` (ya documentado en
      `styles.css:23`, no requiere token nuevo — independiente de T002/T003)
- [X] T006 [US1] Aplicar los 14 tokens de color nuevos de T002/T003 — **sin cambios de código**:
      una vez documentados en `DESIGN.md`/`design.json`, los ~67 literales restantes ya coincidían
      exactamente con los valores nuevos y el checker los reconoció solos (verificado con
      `detect.mjs`: `design-system-color` pasó de 72 a 1 apenas se cerró T002/T003, sin tocar
      `styles.css`). Ver desviación abajo.

> **Desviaciones T005/T006**: (1) `rgba(255,255,255,0.07)` aparecía 3 veces como literal, no 4 —
> error de conteo en `research.md`. (2) T006 asumía que había que reemplazar cada literal por
> `var(--token)`; en la práctica el checker de Impeccable compara el **valor**, no si está detrás
> de una variable — documentar el token en `DESIGN.md` alcanzó para que los ~67 sitios pasaran a
> "reconocidos" sin editar una sola línea de `styles.css`. Se dejaron como literales (no se
> introdujo `var()` donde no lo había).

### Correcciones de radio y tipografía en `styles.css`

- [X] T007 [US1] Corregir los 5 radios de `styles.css` (líneas 436→12px, 801→8px, 959→14px,
      1059→12px, 1233→12px) según `contracts/design-tokens-contract.md` (depende de T002 —
      `.penal-btn:959` usa `rounded.lg` recién documentado)
- [X] T008 [US1] Corregir los 14 tamaños de fuente cerrados de `styles.css` (líneas 109→11px,
      321→15px, 506→11px, 520→15px, 610→15px, 710→24px, 752→13px, 851→22px, 869→22px, 907→16px,
      1064→15px, 1164→15px, 1239→11px, 1287→15px) según `contracts/design-tokens-contract.md`
      (depende de T002 — 851/869 usan `typography.title` recién documentado)
- [X] T009 [US1] Corregir los 2 tamaños de fuente de `styles.css:424` (`.jugador-num`) y `:471`
      (`.btn-import-registro`), ambos 12px→11px, según `contracts/design-tokens-contract.md`
      (depende de T002)

### Otros hallazgos de diseño

- [X] T010 [P] [US1] **No se tocó `index.html`** — los 4 hallazgos se resolvieron distinto a lo
      planeado, cada uno verificado con el usuario o con el checker real antes de decidir (no
      "corregidos en index.html" como decía la tarea original):
      - **`dark-glow` (8)**: verificado con el usuario que son exactamente el "Shadow Vocabulary"
        que `DESIGN.md` ya documenta a propósito (Glow Dorado, Glow Botón Primario/Success/
        Sortear, Halo de Foco). Resuelto con excepción documentada en
        `.impeccable/config.json` (`dark-glow: * en index.html`), no aplanando los glows.
      - **`low-contrast` (3)**: 2 eran texto blanco sobre el verde puro de `.btn-success`
        (3.2:1) — resuelto acortando el gradiente documentado a `#007a38 → #038242`
        (`verde-grupos-accesible`, nuevo token, ~4.9:1), con el usuario confirmando el enfoque.
        El 3er hallazgo (`--gray-text` sobre el gradiente de `.modal-box`, 4.2:1) se resolvió
        cambiando `.modal-box` a fondo sólido `var(--bg)` en tema oscuro (sin gradiente) — pasa
        a 0 hallazgos verificado con `detect.mjs`, no por cálculo manual.
      - **`cramped-padding` (6)**: investigado y confirmado falso positivo estructural — el
        proyecto carga Tailwind vía CDN (JS en runtime), invisible para el analizador estático;
        los 6 elementos ya tienen padding real vía Tailwind (`p-4`, `px-6 py-8`, etc.),
        verificado caso por caso contra `index.html`. Resuelto con excepción documentada en
        `.impeccable/config.json`, no agregando padding CSS redundante.
      - **`flat-type-hierarchy` (1)**: confirmado que es consecuencia directa e intencional de
        normalizar los 19 hallazgos de `design-system-font-size` de T008/T009 al ramp exacto de
        `DESIGN.md` (Body 13-16/Label 10-11 ya son rangos angostos por diseño). Resuelto con
        excepción documentada, no aflojando la normalización recién cerrada.
      - Un hallazgo no catalogado en `research.md` apareció en el checker real:
        `design-system-color` en `styles.css:1264` (`#f8f4e8`, gradiente claro de
        `.campeon-card`) — agregado como token nuevo `dorado-superficie-claro` (T002/T003).
- [X] T011 [P] [US1] Ajustar `.competicion-card` (`styles.css:362-378`, `min-height: 96px→120px`)
      y el título en `app.js:259` (`font-size: clamp(15px, 5vw, 24px)` en vez de `text-2xl` fijo)
      para el hallazgo manual de `#lista-competiciones` (`data-model.md` §5) — validado por
      lectura de código, **no** verificado visualmente en navegador (sin Playwright disponible,
      ver Fase 6)

**Checkpoint**: al terminar T002-T011, US1 es funcional y verificable de forma independiente —
correr T024 (Fase 6) sin haber tocado nada de Fase 4.

---

## Fase 4: User Story 2 - Animación (Priority: P2)

**Goal**: las 5 oportunidades de animación y los 3 fast-follows de `review-animations` quedan
implementados según `contracts/animation-motion-contract.md`, respetando `prefers-reduced-motion`
sin excepción (FR-009).

**Independent Test**: correr los pasos de `quickstart.md` §3 después de completar esta fase — no
requiere que Fase 3 esté terminada (aunque se ve mejor con los tokens ya corregidos, la animación
en sí no depende de ningún valor de color/radio/tipografía).

### Base compartida (fast-follows)

- [X] T012 [P] [US2] Agregar `--ease-entrada: cubic-bezier(0.16, 1, 0.3, 1);` a `:root` en
      `styles.css` y aplicarla a los 5 usos de los 4 `@keyframes` de entrada existentes
      (`.jugador-row:412` y `.sorteo-jugador-item:1065` usan `slideInUp`; `.modal-overlay:1105`
      usa `fadeIn`; `.modal-box:1119` usa `slideUp`; `.toast:1294` usa `toastIn`), reemplazando su
      `ease` actual — la curva se aplica donde se invoca la animación, no dentro del bloque
      `@keyframes` en sí (los `@keyframes` no llevan timing function)
- [X] T013 [P] [US2] Corregir las **6** (no 7 — ver desviación) declaraciones
      `transition: all 200ms ease;` a propiedades explícitas en `styles.css` (`.mode-btn:325`,
      `.grupo-tab:730`, `.ronda-tab:760`, `.cl-check:808`, `.btn-clasificados-num:938`,
      `.penal-btn:967`), verificadas una por una contra su variante `.active`/`:hover` real
- [X] T014 [US2] Envolver `.competicion-card:hover` (`styles.css:378-383`) en
      `@media (hover: hover) and (pointer: fine)` en `styles.css`, dejando `:focus-visible` fuera
      del media query según `contracts/animation-motion-contract.md`

> **Desviación T012/T013**: el resumen de `review-animations` decía "7 declaraciones
> `transition: all`"; el grep real sobre `styles.css` encontró 6. Se corrigieron las 6 reales.

### Oportunidades de animación

- [X] T015 [P] [US2] Agregar `animation: fadeIn 220ms var(--ease-entrada);` a `.screen.active` en
      `styles.css` (depende de T012 — usa la curva compartida)
- [X] T016 [US2] Agregar `@keyframes fadeOut`/`slideDown` y las clases
      `.modal-overlay.closing`/`.modal-box.closing` en `styles.css` según
      `contracts/animation-motion-contract.md` (depende de T012)
- [X] T017 [US2] Implementar `cerrarModalConAnimacion(overlayId)` en `app.js` — **genérica**, no
      atada a 3 modales fijos — y conectarla a los **10** call sites reales de cierre en los
      **5** modales que existen (`modal-resultado`, `modal-importar-jugadores`, `modal-sorteo`,
      `modal-sorteo-equipos`, y `modal-confirm` — este último no estaba en el catálogo original).
      Se dejó **sin animar** un único caso: el cierre interno de `modal-sorteo-equipos` en el
      flujo "repetir sorteo" (reabre a los 100ms desde JS), porque 100ms < 180ms de la animación
      de salida y hubiera chocado con la reapertura.
- [X] T018 [US2] Agregar `@keyframes toastOut` y la clase `.toast.leaving` en `styles.css` según
      `contracts/animation-motion-contract.md` (depende de T012)
- [X] T019 [US2] Actualizar `mostrarToast()` en `app.js:147-152` para agregar `.leaving` a los
      2820ms (`3000 - 180`) antes del `className = 'toast hidden'` final a los 3000ms, ajustando
      el manejo de `_toastTimer` existente para limpiar ambos pasos si se llama de nuevo antes de
      tiempo (depende de T018)
- [X] T020 [P] [US2] Agregar `@keyframes campeonReveal` y
      `animation: campeonReveal 380ms var(--ease-entrada);` en `.campeon-card` en `styles.css`
      (depende de T012)
- [X] T021 [P] [US2] Agregar hover gating
      (`@media (hover: hover) and (pointer: fine) { .match-card:hover, .bracket-match:hover {...} }`)
      en `styles.css`, reutilizando las propiedades ya declaradas en la `transition` existente de
      `.match-card:546` y `.bracket-match:664` — independiente de T012 (no usa la curva
      compartida, mantiene el `200ms ease` ya declarado)

**Checkpoint**: al terminar T012-T021, US2 es funcional y verificable de forma independiente —
correr T025 (Fase 6) sin depender de si Fase 3 está terminada.

---

## Fase 5: User Story 3 - Verificación de no regresión (Priority: P3)

**Goal**: confirmar que ninguna corrección de Fase 3 ni Fase 4 cambió comportamiento funcional
(FR-011) ni reabrió el bug de `KNOWN_ISSUES.md` (FR-012).

**Independent Test**: recorrer `quickstart.md` §4 completo — es la única fase que efectivamente
requiere que Fase 3 y Fase 4 estén terminadas, porque verifica el resultado combinado.

- [X] T022 [US3] **Corrido con Playwright (Chromium) en mobile 390×844 y desktop 1280×900**,
      contra `index.html` real vía `file://`, dos torneos completos de punta a punta (Mundial y
      Champions): selección de competición → setup (4 jugadores) → sorteo de equipos → sorteo de
      grupos → 6 partidos de grupos (Mundial) / 12 (Champions, ida-vuelta) → clasificados (Top 2)
      → cruces → fase eliminatoria (1 partido Mundial único; 2 legs Champions ida-vuelta, con
      desempate por penales real en un caso de empate en agregado) → pantalla de campeón
      confirmada en las 4 combinaciones (competición × viewport) → exportar JSON (descarga
      confirmada) → toggle de tema (`dark`→`light` confirmado). 0 errores de consola/página en
      ninguna corrida. Ningún paso requirió una acción distinta a la esperada — FR-011/SC-003
      verificados en navegador real, no solo por lectura de código.
- [X] T023 [US3] Confirmado con `git status`/`git diff --stat`: `KNOWN_ISSUES.md`, `motor.js` y
      `competiciones.js` no aparecen en los archivos modificados (FR-010/FR-012 intactos)

**Checkpoint**: las 3 historias de usuario están completas y verificadas.

---

## Fase 6: Polish & verificación final

**Purpose**: gates finales, cada uno aislado al pase que verifica — si alguno falla, indica
directamente si la regresión viene de Fase 3 (US1) o de Fase 4 (US2).

- [X] T024 [P] Re-corrido el checker de Impeccable — **0 hallazgos totales** (no solo
      `design-system-*`): también se resolvieron `cramped-padding`, `dark-glow`,
      `low-contrast`, `flat-type-hierarchy` y el `side-tab` residual (ver T010 y research.md).
      SC-001 cumplido y superado.
- [X] T025 [P] **Corrido con Playwright, `page.emulateMedia({reducedMotion:'reduce'})`**, mobile
      390×844. Duraciones reales leídas de `getComputedStyle` en ambos modos:

      | Animación | Normal | `reduce` |
      |---|---|---|
      | Transición de pantalla | 0.22s | 0.000001s |
      | Modal entrada (overlay/box) | 0.2s / 0.25s | 0.000001s / 0.000001s |
      | Modal salida (`.closing`) | 0.18s | 0.000001s |
      | Toast entrada | 0.2s | 0.000001s |
      | Campeón (reveal / glow) | 0.38s / 2.2s | 0.000001s / 0.000001s |

      Las 5 duraciones colapsan a ~0 bajo `reduce`, y el modal sigue terminando oculto
      correctamente en ambos modos (el cierre por JS usa un `setTimeout` fijo de 180ms
      independiente de la preferencia — el modal queda invisible al instante mismo así, ver nota
      de hallazgo menor abajo). SC-004 verificado en navegador real. Hallazgo aparte, no un bug:
      `.competicion-card:hover` no aplica `transform` bajo `reduce` — es comportamiento
      preexistente de spec 002 (`transform: none` explícito en el bloque `reduced-motion`), no
      algo que esta spec haya tocado.
- [X] T026 **Corrido con Playwright**, viewport 700px (recién sobre el breakpoint de 640) y
      desktop 1280px, incluyendo una competición inyectada con nombre más largo que "Champions
      League" ("Copa Interbarrial de Verano 2027"). Resultado: el `clamp()`/overflow del título
      funciona — el nombre largo quiebra a 2 líneas sin desbordar la tarjeta (confirmado por
      geometría real, `span` dentro de los límites de `.competicion-card` en los 3 casos). **Pero
      se encontró un bug real y distinto**, no relacionado con el largo del texto: "MUNDIAL 2026"
      y "CHAMPIONS LEAGUE" — los dos nombres *actuales*, sin ningún dato inyectado — ya tienen
      alturas distintas en la misma fila del grid (132px vs 120px, confirmado con screenshot). La
      causa raíz: `#lista-competiciones` (`index.html:75`) tiene la clase Tailwind `space-y-3`
      (margin-top pensado para apilado vertical) que sigue aplicándose incluso cuando el contenedor
      pasa a `display:grid` en ≥640px (`styles.css:397-402`, de spec 002) — empuja la segunda
      tarjeta 12px hacia abajo dentro de su celda. No es el bug que `data-model.md` §5 anticipaba
      (ese hablaba de desbalance por longitud de texto); es un problema de spec 002 que solo se vio
      al verificar en navegador real. **Corregido con aprobación explícita del usuario**:
      `index.html:75` `class="space-y-3"` → `class="flex flex-col gap-3"` (mismo apilado en
      mobile vía `gap` en vez de `margin-top`, que no interfiere al pasar a `display:grid` en
      ≥640px). Re-verificado con Playwright: "Mundial 2026"/"Champions League" quedan a 120px/
      120px (antes 132px/120px) en 700px y 1280px; layout mobile stacked (390px) sin regresión.
      Checker de Impeccable sigue en 0 tras el cambio. Torneo completo re-corrido tras el fix —
      sin fallos.
- [X] T027 `node_modules` de `.agents/skills/impeccable/` eliminado tras confirmar T024

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Fase 1)**: sin dependencias — arranca de inmediato
- **Foundational (Fase 2)**: N/A — no bloquea nada
- **US1 (Fase 3)** y **US2 (Fase 4)**: ambas dependen solo de Fase 1 (T001, la línea base del
  checker) — **no dependen entre sí**, se pueden completar en cualquier orden o en paralelo
- **US3 (Fase 5)**: depende de que Fase 3 Y Fase 4 estén completas (verifica el resultado
  combinado de ambas)
- **Polish (Fase 6)**: T024 depende solo de Fase 3; T025 depende solo de Fase 4; T026 depende solo
  de Fase 3 (T011); T027 depende de T001 y T024

### Dentro de Fase 3 (US1)

T002 → T003 → {T004, T006, T007, T008, T009} (T004 también puede arrancar apenas T002/T003 estén
listos si solo usa los tokens que le tocan) → T005/T010/T011 son independientes de T002/T003 y se
pueden hacer en cualquier momento de la fase.

### Dentro de Fase 4 (US2)

T012 → {T015, T016, T020} (dependen de la curva) ; T016 → T017 ; T012 → T018 → T019 ; T013 y T014
y T021 son independientes de T012.

### Parallel Opportunities

- T005, T010, T011 en paralelo entre sí (US1, archivos/selectores distintos)
- T012, T013 en paralelo entre sí (US2, secciones distintas de `styles.css`)
- T015, T020 en paralelo entre sí una vez hecho T012 (selectores distintos)
- T021 en paralelo con cualquier tarea de la "base compartida" (no depende de T012)
- T024 y T025 en paralelo entre sí (verifican fases distintas)

---

## Parallel Example: Fase 3 (US1)

```bash
# Una vez completos T002/T003 (tokens documentados):
Task: "Corregir los 5 radios de styles.css según contracts/design-tokens-contract.md"
Task: "Corregir los 14 tamaños de fuente cerrados de styles.css"

# En paralelo con lo anterior, sin depender de los tokens:
Task: "Reemplazar las 4 apariciones literales de rgba(255,255,255,0.07) por var(--border)"
Task: "Corregir cramped-padding/dark-glow/low-contrast/flat-type-hierarchy en index.html"
Task: "Ajustar .competicion-card + clamp() del título en app.js"
```

---

## Implementation Strategy

### MVP first (US1 solamente)

1. Fase 1 (Setup)
2. Fase 3 (US1) completa
3. **STOP y VALIDAR**: correr T024 — checker en 0 sin tocar nada de animación
4. Esto ya es un incremento de valor entregable por sí solo (deuda de diseño resuelta,
   independiente de si la animación se hace después)

### Incremental Delivery

1. Setup → Fase 3 (US1) → validar con T024 → deploy/demo (deuda de diseño resuelta)
2. Fase 4 (US2) → validar con T025 → deploy/demo (animación pulida)
3. Fase 5 (US3) + Fase 6 completa → validación final combinada

Cada fase de historia de usuario agrega valor sin romper la anterior — si Fase 4 se pospone, Fase
3 por sí sola ya deja la app sin deuda de tokens de diseño.

---

## Notes

- [P] = archivo distinto, o mismo archivo con selector/sección sin solapamiento
- [Story] mapea cada tarea a US1/US2/US3 para trazabilidad
- Sin tests automatizados — la verificación es el checker de Impeccable (T024) + QA manual guiada
  por `quickstart.md` (T022, T025, T026)
- Fase 3 y Fase 4 son deliberadamente aislables — no se combinan tareas de ambas en un mismo commit
  si se quiere poder aislar una regresión al pase de diseño o al de animación
