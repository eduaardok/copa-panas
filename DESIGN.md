---
name: Copa Panas
description: App de torneo de fútbol entre amigos con estética de marcador de cancha bajo el Mundial 2026.
colors:
  fondo-cancha: "#07090f"
  fondo-cancha-medio: "#0d1118"
  fondo-tarjeta: "#121826"
  texto-principal: "#f0f3f8"
  texto-secundario: "#6b7a8d"
  azul-setup: "#0052c8"
  dorado-trofeo: "#c9a84c"
  dorado-trofeo-claro: "#e8c96d"
  verde-grupos: "#00a64e"
  rojo-eliminacion: "#e0182d"
  blanco-puro: "#ffffff"
  fondo-superficie-claro: "#f8faff"
  verde-grupos-claro: "#4dcc88"
  borde-claro-marcado: "rgba(0,0,0,0.12)"
  borde-claro-sutil: "rgba(0,0,0,0.07)"
  borde-claro-medio: "rgba(0,0,0,0.08)"
  azul-setup-claro: "#5ba0ff"
  gris-300-claro: "#4a5568"
  azul-setup-oscuro: "#003d99"
  verde-grupos-oscuro: "#007a38"
  rojo-eliminacion-oscuro: "#990010"
  gris-400-claro: "#5a6577"
  gris-500-claro: "#718096"
  gris-600-claro: "#4b5563"
  dorado-superficie-claro: "#f8f4e8"
  verde-grupos-accesible: "#038242"
typography:
  display:
    fontFamily: "'Bebas Neue', cursive"
    fontSize: "52px"
    fontWeight: 400
    lineHeight: 1
    letterSpacing: "normal"
  headline:
    fontFamily: "'Bebas Neue', cursive"
    fontSize: "24px"
    fontWeight: 400
    lineHeight: 1
    letterSpacing: "0.02em"
  body:
    fontFamily: "Inter, sans-serif"
    fontSize: "15px"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "normal"
  label:
    fontFamily: "Inter, sans-serif"
    fontSize: "11px"
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: "0.1em"
  title:
    fontFamily: "'Bebas Neue', cursive"
    fontSize: "22px"
    fontWeight: 700
    lineHeight: 1
  scale:
    icon-sm: "18px"
    icon-lg: "40px"
rounded:
  sm: "8px"
  md: "12px"
  lg: "14px"
  xl: "16px"
  pill: "20px"
  full: "50%"
  sheet: "24px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
components:
  button-primary:
    backgroundColor: "{colors.azul-setup}"
    textColor: "#ffffff"
    rounded: "{rounded.lg}"
    padding: "12px 20px"
  button-primary-hover:
    backgroundColor: "#003d99"
    textColor: "#ffffff"
    rounded: "{rounded.lg}"
    padding: "12px 20px"
  button-secondary:
    backgroundColor: "rgba(255,255,255,0.07)"
    textColor: "{colors.texto-principal}"
    rounded: "{rounded.lg}"
    padding: "12px 20px"
  button-danger:
    backgroundColor: "rgba(224,24,45,0.12)"
    textColor: "{colors.rojo-eliminacion}"
    rounded: "{rounded.lg}"
    padding: "12px 20px"
  button-success:
    backgroundColor: "{colors.verde-grupos}"
    textColor: "#ffffff"
    rounded: "{rounded.lg}"
    padding: "12px 20px"
  score-badge:
    backgroundColor: "rgba(201,168,76,0.12)"
    textColor: "{colors.dorado-trofeo}"
    typography: "{typography.display}"
    rounded: "{rounded.sm}"
    padding: "3px 9px"
  form-input:
    backgroundColor: "rgba(255,255,255,0.05)"
    textColor: "{colors.texto-principal}"
    rounded: "{rounded.md}"
    padding: "12px 14px"
---

# Design System: Copa Panas

## Overview

**Creative North Star: "El Marcador de Cancha"**

Copa Panas se ve y se siente como el scoreboard físico de un estadio, no
como una app de productividad con tema oscuro. El fondo casi negro
(`#07090f`) es el cielo nocturno sobre la cancha; el stripe tricolor
rojo/azul/verde bajo el header es la iluminación del estadio; el dorado
es el trofeo brillando al centro de todo. Los números de marcador en
Bebas Neue —grandes, condensados, sin adornos— son el elemento que más
comunica personalidad: cada partido, cada bracket, cada tabla de
posiciones vuelve al mismo lenguaje de "esto es un resultado deportivo
real", no una tarjeta de datos genérica.

El tono es deportivo serio con un guiño gamer: contraste alto,
tipografía de impacto para números y estados de victoria, glow dorado
en momentos que lo ameritan (campeón, líder de grupo, foco de input) —
pero nunca decorativo por defecto. Explícitamente evita dos extremos: la
plantilla SaaS genérica (tarjetas planas sin personalidad, azul
corporativo sin urgencia) y la estética infantil o excesivamente lúdica.
Es una app para amigos, no para una oficina ni para un torneo de niños.

El sistema es **dual-theme real**: modo oscuro (marcador bajo las luces
de noche) y modo claro (marcador de día, mismo estadio) son ambos
ciudadanos de primera clase con el mismo lenguaje de componentes — el
modo claro no es una variante de compromiso, es la misma metáfora
reinterpretada con luz de día.

**Key Characteristics:**
- Fondo casi negro con superficies planas (glass sutil, sin sombras
  reales) — la profundidad se comunica con glow de color, no con
  elevación.
- Bebas Neue reservado exclusivamente para números y marcadores; Inter
  para todo lo demás.
- Cuatro colores con significado futbolero fijo (azul=acción/setup,
  dorado=logro/trofeo, verde=fase de grupos, rojo=eliminación) — el
  color codifica rol, no solo estética.
- Cero emojis; únicamente Font Awesome o SVG inline.
- Modo oscuro y modo claro son ambos completos y deliberados, no un
  fallback del otro.

## Colors

La paleta tiene un rol funcional fijo por color: cada tono aparece
siempre en el mismo tipo de contexto en toda la app, nunca de forma
intercambiable.

### Primary
- **Azul Setup** (`#0052c8`): color de acción principal — botón
  primario, foco de inputs, fase de configuración/asignación de equipos.
  El gradiente de botón usa `#003d99 → #0052c8` (135deg) para dar
  volumen sin sombra real.

### Secondary
- **Dorado Trofeo** (`#c9a84c`, variante clara `#e8c96d`): el color de
  logro — líder de tabla, campeón, marcadores de puntaje, badges de
  ranking. Es el único color con `text-shadow`/glow animado (pantalla
  de campeón), reservado para el momento de mayor peso emocional de la
  app.

### Tertiary
- **Verde Fase de Grupos** (`#00a64e`): fase de grupos, partidos
  completados, éxito general (toasts de éxito).
- **Rojo Eliminación** (`#e0182d`): fase de eliminación directa, danger
  (botones destructivos, errores de validación, toasts de error).

### Neutral
- **Cancha Negra** (`#07090f` fondo / `#0d1118` fondo medio / `#121826`
  fondo de tarjeta): las tres capas de fondo en modo oscuro.
- **Blanco Marcador** (`#f0f3f8`): texto principal en modo oscuro.
- **Gris Silbato** (`#6b7a8d`): texto secundario, labels, metadata —
  igual en ambos temas.
- **Borde Vidrio** (`rgba(255,255,255,0.07)` oscuro / `rgba(0,0,0,0.09)`
  claro): borde por defecto de tarjetas, inputs y divisores.

En modo claro, fondo pasa a `#f0f4fa`/`#e2e8f4`/`#ffffff` y el texto
principal a `#0f1420` — mismo rol, mismo peso visual relativo, luz
invertida.

### Tokens derivados

- **Paradas oscuras de gradiente** (`azul-setup-oscuro` `#003d99`,
  `verde-grupos-oscuro` `#007a38`, `rojo-eliminacion-oscuro` `#990010`):
  parada inicial del gradiente 135deg de cada botón de acción por rol
  (`.btn-primary`, `.btn-success`, `.btn-sortear-equipos`) — dan volumen
  sin sombra real, nunca se usan solas fuera de un gradiente.
- **Variantes brillantes sobre fondo oscuro** (`azul-setup-claro`
  `#5ba0ff`, `verde-grupos-claro` `#4dcc88`): texto de badge/valor
  activo cuando el color base (`azul-setup`/`verde-grupos`) no tiene
  suficiente contraste sobre un fondo ya coloreado tenue (badges de
  sorteo, contador de clasificados).
- **Superficies y bordes de modo claro** (`blanco-puro` `#ffffff`,
  `fondo-superficie-claro` `#f8faff`, `borde-claro-sutil`
  `rgba(0,0,0,0.07)`, `borde-claro-medio` `rgba(0,0,0,0.08)`,
  `borde-claro-marcado` `rgba(0,0,0,0.12)`): variantes de fondo/borde
  del modo claro para inputs, filas y tarjetas — misma jerarquía que
  `--bg-card`/`--border`, expresada en la luz invertida del tema claro.
- **Escala de grises de modo claro** (`gris-300-claro` `#4a5568`,
  `gris-400-claro` `#5a6577`, `gris-500-claro` `#718096`,
  `gris-600-claro` `#4b5563`): mapea 1:1 a la escala `gray-300/400/500
  /600` de Tailwind cuando se sobreescribe en modo claro — cuatro pasos
  de contraste de texto secundario, no intercambiables entre sí.
- **Dorado Superficie Claro** (`dorado-superficie-claro` `#f8f4e8`):
  parada final del gradiente de `.campeon-card` en modo claro (blanco →
  crema dorado) — variante tenue del rol dorado/logro para la única
  tarjeta que lo usa como fondo en vez de como acento.

### Named Rules
**La Regla del Color con Rol.** Ningún color se usa "porque queda
bien" — azul es siempre acción, dorado es siempre logro, verde es
siempre grupos, rojo es siempre eliminación/peligro. Si una pantalla
nueva necesita destacar algo, primero se pregunta qué rol futbolero le
corresponde antes de elegir el tono.

## Typography

**Display Font:** Bebas Neue (fallback `cursive`)
**Body Font:** Inter (fallback `sans-serif`)

**Character:** Bebas Neue es la voz del marcador — condensada, en
mayúsculas visuales, sin calidez; aparece solo donde hay un número o un
título de pantalla que debe leerse como resultado deportivo. Inter
carga todo el trabajo funcional (labels, botones, tablas, formularios)
con pesos medios-altos (600-700) que sostienen el contraste alto sin
depender de tamaño.

### Hierarchy
- **Display** (400, 52px, line-height 1): input de marcador en el modal
  de resultado — el número más grande de la app.
- **Headline** (400, 18-24px, line-height 1, tracking 0.02-0.12em):
  título de header, `bracket-phase-label`, nombre de ronda.
- **Title** (700, 20-24px): puntaje inline (`score-badge`,
  `bracket-team-score`, `cl-pts`).
- **Body** (600-700, 13-16px, line-height 1.4): nombres de jugador,
  botones, texto de tarjetas.
- **Label** (700, 10-11px, letter-spacing 0.06-0.1em, uppercase):
  headers de tabla, `form-label`, badges de estado.

Título (`Title`, 700, `22px`, Bebas Neue): valor canónico único para
puntaje inline (`score-badge`, `bracket-team-score`, `cl-pts`,
`clasificados-counter-num`) — `score-badge` es el componente de
referencia del rol.

### Escala de íconos

Los glyphs de Font Awesome (`<i>`) no son tipografía y no siguen los 5
roles de arriba — tienen su propia escala nombrada (`typography.scale`
en el frontmatter): `icon-sm` (`18px`, íconos de navegación como
`.nav-tab i`) e `icon-lg` (`40px`, íconos grandes de estado vacío como
`.empty-state i`).

### Named Rules
**La Regla del Marcador.** Bebas Neue nunca se usa para texto de
lectura continua ni para labels — solo para números y títulos de
pantalla cortos. Si el texto tiene más de ~3 palabras, es Inter.

## Layout

Mobile-first con `100dvh`/`safe-area-inset` para evitar el salto de
barra de Safari/Android; header fijo (`min-height: 56px` + stripe de
3px) y bottom nav fija (`min-height: 56px` por tab) definen el marco de
mobile. El contenido central usa `screen { min-height: calc(100dvh -
130px) }` para llenar el espacio entre header y nav.

Densidad: paddings de tarjeta en el rango 10-14px, gap entre elementos
de fila en 8-10px; listas (match cards, bracket, clasificados) usan
`flex column` con `gap: 8-12px` en vez de márgenes acumulados.

Touch targets mínimos de 44px (`counter-btn`, `mode-btn`, `penal-btn`,
tabs) — regla dura heredada de compatibilidad mobile, no solo
convención visual.

Desktop (≥1024px, implementado en `specs/001-desacople-motor-rediseno`):
la nav inferior fija se reposiciona como barra horizontal secundaria
debajo del header (`.bottom-nav` pasa a `position:fixed; top:` en vez de
`bottom:`, tabs en fila en vez de columna) — mismo componente, mismos
roles de color, sin duplicar markup ni lógica de JS. El contenido
central se centra con `max-width:1040px; margin:0 auto`. La tabla de
posiciones (`#grupos-content`) pasa a grilla de 2 columnas (posiciones +
partidos lado a lado) y el bracket (`.bracket-round`) pasa de columna a
fila con wrap, para aprovechar el espacio horizontal en vez de quedar en
una columna angosta centrada. Mobile (`<1024px`) no cambia.

## Elevation & Depth

El sistema es **plano por defecto**: no hay sombras estructurales reales
(`box-shadow` se usa casi exclusivamente para glow de color, no para
levantar superficies). La profundidad se comunica con capas de fondo
(`--bg` → `--bg-mid` → `--bg-card`) y bordes translúcidos sutiles
(`rgba(255,255,255,0.07)`), no con elevación tipo Material.

El único vocabulario de "sombra" real son los glow de estado — siempre
ligados a un evento o rol, nunca decorativos en reposo.

### Shadow Vocabulary
- **Glow Dorado** (`text-shadow: 0 0 24px rgba(201,168,76,0.9), 0 0
  48px rgba(201,168,76,0.45)`, animado en pulso 2.2s): pantalla de
  campeón — el momento de mayor peso emocional de la app.
- **Glow de Botón Primario** (`box-shadow: 0 4px 20px
  rgba(0,82,200,0.35)`): elevación sutil solo en botones de acción
  (primary/danger/success), nunca en tarjetas de contenido.
- **Sombra de Header/Nav** (`box-shadow: 0 2px 20px rgba(0,0,0,0.6)` /
  `0 -4px 24px rgba(0,0,0,0.5)`): separa el marco fijo (header, bottom
  nav) del contenido que se desplaza debajo.
- **Halo de Foco de Input** (`box-shadow: 0 0 0 3px
  rgba(0,82,200,0.18)`): anillo de foco, no sombra de profundidad.

### Named Rules
**La Regla Plano-por-Defecto.** Las superficies de contenido (tarjetas,
filas, tablas) están planas en reposo. Una sombra o glow solo aparece
como respuesta a un estado real: victoria, foco, error, campeón — nunca
como decoración de reposo.

## Shapes

Radios generosos y consistentes por escala de componente: `8px` en
elementos pequeños (número de jugador, badge de puntaje), `12-14px` en
tarjetas de contenido y botones, `16px` en tarjetas contenedoras
(`card-glass`), `20px` en tabs tipo píldora (grupo/ronda/clasificados),
círculo completo (`50%`) en botones circulares (counter, close, sorteo
bombo) y avatares/logo.

Modales usan esquinas superiores redondeadas únicamente (`sheet`,
`24px 24px 0 0`) — patrón bottom-sheet, reforzando que suben desde el
borde inferior de la pantalla en vez de aparecer centrados.

Bordes son casi siempre `1-2px` y translúcidos; no hay bordes gruesos ni
sólidos de alto contraste salvo en estados de error/foco (donde el
borde adopta el color semántico completo).

## Components

### Buttons
- **Shape:** `14px` de radio (`16px` en `.btn-sortear-equipos`, el
  botón hero de sorteo).
- **Primary:** gradiente azul `#003d99 → #0052c8` (135deg), texto
  blanco, `box-shadow: 0 4px 20px rgba(0,82,200,0.35)`.
- **Secondary:** glass — `rgba(255,255,255,0.07)` + borde translúcido,
  sin sombra.
- **Danger:** fondo tenue rojo (`rgba(224,24,45,0.12)`) + borde rojo
  translúcido — nunca sólido, para no competir visualmente con estados
  de error de formulario.
- **Success:** gradiente verde `#007a38 → #038242` (`verde-grupos-
  accesible`, no el `#00a64e` puro — el verde base no llega a 4.5:1 de
  contraste con el texto blanco del botón; este extremo sí, ~4.9:1),
  mismo patrón que primary.
- **Active/Press:** `transform: scale(0.97)` + un overlay ripple
  (`::after` blanco 10% que aparece en `:active`) en todas las
  variantes — el único feedback táctil consistente de la app.

### Tabs (grupo / ronda / clasificados-num)
- **Style:** píldora (`20px` radio), fondo glass tenue, borde
  translúcido; el color del estado activo cambia según el contexto
  (verde para grupos, rojo para rondas, azul para conteo de
  clasificados) — el mismo componente reutiliza el sistema de rol de
  color.

### Cards / Containers
- **Corner Style:** `12-16px` según jerarquía (`match-card`/`bracket-
  match` en 12-14px, `card-glass` contenedor en 16px).
- **Background:** `rgba(255,255,255,0.03-0.04)` sobre el fondo base —
  nunca un color sólido distinto salvo estados de completado/éxito.
- **Shadow Strategy:** ninguna en reposo (ver Elevation & Depth); borde
  de color sólido a la izquierda (`border-left: 3px`) marca estado
  completado/líder.
- **Border:** `1px` translúcido por defecto.
- **Internal Padding:** `10-14px`.

### Inputs / Fields
- **Style:** fondo `rgba(255,255,255,0.05)`, borde `1.5px` translúcido,
  radio `12px` (`10px` en filas de jugador), `font-size: 16px` mínimo
  (evita zoom automático de Safari).
- **Focus:** borde pasa a azul + halo `box-shadow` de 3px del mismo
  color (ver Elevation).
- **Error:** borde pasa a rojo + halo rojo del mismo patrón; el mensaje
  de error aparece debajo, oculto por defecto (`display: none` hasta
  `.error`).

### Score Input / Score Badge (componente insignia)
El componente que más define la identidad del sistema: número en Bebas
Neue de 52px (input de resultado) o 22-24px (badge inline), color
dorado, fondo `rgba(201,168,76,0.1-0.12)`, borde dorado translúcido.
Es la aplicación más pura del North Star — literalmente el marcador.

### Navigation
Bottom nav fija de 5 tabs (mobile): ícono + label de 10px, color gris
por defecto, dorado + `translateY(-2px)` del ícono en estado activo.
Header fijo con logo circular opcional, título Bebas Neue y toggle de
tema (sol/luna) a la derecha. En desktop (≥1024px), este mismo
componente se repositiona como barra horizontal debajo del header en
vez de nav inferior fija (ver Layout) — implementado, no estirado tal
cual.

## Do's and Don'ts

### Do:
- **Do** usar Bebas Neue únicamente para números de marcador y títulos
  cortos de pantalla — nunca para texto de lectura continua.
- **Do** mantener el color ligado a su rol futbolero fijo (azul=acción,
  dorado=logro, verde=grupos, rojo=eliminación/peligro) al introducir
  nuevas pantallas o competiciones (Champions, etc.).
- **Do** reservar sombra/glow real para respuestas a estado (victoria,
  foco, error, campeón) — superficies en reposo se quedan planas.
- **Do** construir modo claro y modo oscuro como dos expresiones
  completas de la misma metáfora ("El Marcador de Cancha" de día y de
  noche), nunca uno como fallback apurado del otro.
- **Do** mantener touch targets ≥44px y `font-size: 16px` en inputs,
  incluso en componentes nuevos de desktop.

### Don't:
- **Don't** introducir sombras decorativas de reposo (drop shadows tipo
  Material en tarjetas) — rompe la Regla Plano-por-Defecto.
- **Don't** usar un color fuera de su rol asignado (ej. verde para un
  botón de acción que no es de fase de grupos).
- **Don't** dejar que el modo claro sea una inversión mecánica de
  colores sin ajustar el peso relativo — cada superficie del modo claro
  ya tiene un valor definido en el CSS incumbente, no se re-deriva por
  fórmula.
- **Don't** usar emojis en ningún lugar de la interfaz — solo Font
  Awesome o SVG inline.
- **Don't** estirar el patrón de bottom-nav fija de mobile directamente
  a desktop sin repensarlo (ver Layout).
