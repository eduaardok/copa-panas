# Data Model: Deuda de diseño y auditoría de animaciones

**Feature**: [spec.md](./spec.md) · Basado en: [research.md](./research.md) (§Veredictos aprobados)

Esta feature no toca el modelo de datos de torneo (FR-011): no hay entidades runtime nuevas. El
"modelo" que aplica acá es el **sistema de diseño** (`DESIGN.md`/`design.json`/`styles.css`) — qué
tokens existen, cuáles se agregan, y a qué valor exacto se normaliza cada hallazgo de deuda. Este
documento es el contrato de valores que `tasks.md` debe implementar sin ambigüedad.

> **Puntos abiertos — todos cerrados.** Las 14 filas marcadas [ABIERTO] en versiones anteriores de
> este documento (colores, radio de `.penal-btn`, íconos, rol Title, y los 2 últimos —
> `424`/`471`) ya fueron decididas y se reflejan directo en las tablas de abajo sin ninguna marca.

---

## 1. Tokens de color nuevos (`design-system-color`, bucket "repetidos")

Los 9 valores que aparecen 3+ veces se agregan a `.impeccable/design.json` → `extensions.colorMeta`
y a la prosa de `DESIGN.md`. Nombres propuestos — libres de ajustar sin reabrir la decisión de
"agregar como token" en sí:

| Valor | Ocurrencias | Nombre propuesto | Rol | Uso típico |
|---|---|---|---|---|
| `#ffffff` / `#fff` | 9× | `blanco-puro` | on-color | Texto sobre superficies de color sólido (botones, badges activos) |
| `#f8faff` | 5× | `fondo-superficie-claro` | neutral (light) | Fondo de inputs/filas/superficies elevadas en tema claro |
| `#4dcc88` | 4× | `verde-grupos-claro` | tertiary (light-on-dark) | Texto verde brillante sobre fondo oscuro (badges de grupo/completado) |
| `rgba(0,0,0,0.12)` | 4× | `borde-claro-marcado` | neutral (light) | Borde light-theme más visible (inputs, modal) |
| `rgba(0,0,0,0.07)` | 4× | `borde-claro-sutil` | neutral (light) | Borde light-theme sutil (dividers, texto secundario) |
| `rgba(0,0,0,0.08)` | 5× | `borde-claro-medio` | neutral (light) | Borde light-theme intermedio entre sutil y marcado |
| `#5ba0ff` | 3× | `azul-setup-claro` | primary (light-on-dark) | Texto azul brillante sobre fondo oscuro (badges/valores activos) |
| `#4a5568` | 3× | `gris-300-claro` | neutral (light) | `.text-gray-300` en tema claro — escala de 4 pasos, ver §2 |
| `rgba(255,255,255,0.07)` | 4× | *(ninguno — ver nota)* | — | — |
| `#003d99` | 1× (reclasificado) | `azul-setup-oscuro` | primary (parada de gradiente) | `.btn-primary`, gradiente 135deg — ver §2 |
| `#007a38` | 1× (reclasificado) | `verde-grupos-oscuro` | tertiary (parada de gradiente) | `.btn-success`, gradiente 135deg — ver §2 |
| `#990010` | 1× (reclasificado) | `rojo-eliminacion-oscuro` | tertiary (parada de gradiente) | `.btn-sortear-equipos`, gradiente 135deg — ver §2 |
| `#5a6577` | 1× (reclasificado) | `gris-400-claro` | neutral (light) | `.text-gray-400` en tema claro — escala de 4 pasos, ver §2 |
| `#718096` | 1× (reclasificado) | `gris-500-claro` | neutral (light) | `.text-gray-500` en tema claro — escala de 4 pasos, ver §2 |
| `#4b5563` | 1× (reclasificado) | `gris-600-claro` | neutral (light) | `.text-gray-600` en tema claro — escala de 4 pasos, ver §2 |

**Escala de grises light-theme — nombres alineados al sufijo de la clase Tailwind que cada uno
estiliza** (decisión de revisión, reemplaza los nombres `gris-100/200/300/400-claro` propuestos
originalmente): `gris-300-claro` = `#4a5568` (`.text-gray-300`), `gris-400-claro` = `#5a6577`
(`.text-gray-400`), `gris-500-claro` = `#718096` (`.text-gray-500`), `gris-600-claro` = `#4b5563`
(`.text-gray-600`). Los 4 se agregan como tokens nuevos — ninguno se corrige a `texto-secundario`.

**Nota sobre `rgba(255,255,255,0.07)` (4×)**: este valor es **idéntico** al `--border` ya
documentado en `styles.css:23` (`--border: rgba(255,255,255,0.07);`). No necesita un token nuevo:
es una duplicación literal de una variable CSS que ya existe. La corrección es reemplazar las 4
apariciones literales por `var(--border)`, no agregar nada a `design.json`.

## 2. Colores de una sola aparición (11) — corrección o excepción justificada

| Valor | Línea | Contexto | Resolución | Razón |
|---|---|---|---|---|
| `#ffaa44` | 875 | `.clasificados-counter-warning` (texto de advertencia de cupo) | → `var(--red)` (`#e0182d`) | Sin rol "warning" en la paleta de 4 colores fijos; "peligro/límite excedido" mapea a rojo=eliminación/peligro por La Regla del Color con Rol |
| `#1a1d28` | 647 | `[data-theme="light"] .score-input` | → `#0f1420` (valor ya documentado como `--white` en tema claro, `styles.css:33`) | Casi idéntico al token ya existente; unificar evita un segundo "casi negro" de tema claro |
| `#1a2030` | 1283 | `.toast` (fondo, tema oscuro) | → `var(--bg-card)` (`#121826`) | Superficie elevada — mismo rol que `fondo-tarjeta` |
| `#f5f8ff` | 1122 | `[data-theme="light"] .modal-box` (parada de gradiente) | → `#f8faff` (token nuevo del §1) | Prácticamente idéntico al nuevo `fondo-superficie-claro`; evita un décimo blanco casi-igual |
| `#ff6070` | 1087 | `.sorteo-equipo-badge` (texto rojo del badge "equipo") | → `#ff7080` (ya aceptado en `.impeccable/config.json` como excepción de v1) | A un dígito de diferencia del rojo de error ya excepcionado; conformar en vez de agregar un tercer rojo casi-igual |
| `#003d99` | 222 | `.btn-primary` (parada oscura del gradiente) | **Cerrado** → token nuevo `azul-setup-oscuro`, sin cambios respecto a la propuesta | Ya es el valor documentado de `button-primary-hover.backgroundColor` en el frontmatter de `DESIGN.md` — "corregirlo" a `var(--blue)` aplanaría un gradiente ya intencional y contradiría esa entrada existente |
| `#007a38` | 261 | `.btn-success` (parada oscura del gradiente) | **Cerrado** → token nuevo `verde-grupos-oscuro`, sin cambios | Mismo patrón estructural que `#003d99`: parada oscura de gradiente por color de rol, en un botón de acción principal |
| `#990010` | 1349 | `.btn-sortear-equipos` (parada oscura del gradiente) | **Cerrado** → token nuevo `rojo-eliminacion-oscuro`, sin cambios | Mismo patrón — los 3 botones de gradiente (`btn-primary`/`btn-success`/`btn-sortear-equipos`) comparten la técnica "parada oscura + color de rol"; es un patrón de diseño consistente, no drift aislado |
| `#5a6577` | 1328 | `[data-theme="light"] .text-gray-400` | **Cerrado** → token nuevo `gris-400-claro` (renombrado, ver §1) | Parte de una escala de 4 grises coordinada con `.text-gray-300/500/600`; tratarlo aislado rompería la escala |
| `#718096` | 1330 | `[data-theme="light"] .text-gray-500` | **Cerrado** → token nuevo `gris-500-claro` (renombrado, ver §1) | Mismo motivo que `#5a6577` — escala de 4 grises |
| `#4b5563` | 1331 | `[data-theme="light"] .text-gray-600` | **Cerrado** → token nuevo `gris-600-claro` (renombrado, ver §1) | Mismo motivo — cierra la escala de 4 grises junto a `#4a5568`(`gris-300-claro`, §1) |

**Resumen — cerrado en la revisión del plan**: de los 11 valores únicos, 6 (3 paradas de
gradiente + 3 grises de escala) se agregan como tokens nuevos en vez de "corregirse a un token
existente" — confirmado sin cambios para los 3 gradientes, y con renombre a sufijo-Tailwind
(`gris-300/400/500/600-claro`) para los 4 grises (incluido el ya aprobado `#4a5568` de §1, que
pasa de `gris-200-claro` a `gris-300-claro` para que el nombre coincida con `.text-gray-300`). Los
otros 5 (`#ffaa44`, `#1a1d28`, `#1a2030`, `#f5f8ff`, `#ff6070`) siguen la regla literal — se
corrigen a un token/valor ya existente, sin token nuevo.

## 3. Radios (`design-system-radius`)

| Línea | Selector | Valor actual | Resolución | Razón |
|---|---|---|---|---|
| 436 | `.jugador-input` | 10px | → 12px (`rounded.md`) | Es un form-input; `DESIGN.md` documenta `form-input.rounded = {rounded.md}` = 12px |
| 801 | `.cl-check` | 6px | → 8px (`rounded.sm`) | Elemento pequeño (checkbox 22×22px) — bucket "8px en elementos pequeños" de `DESIGN.md` |
| 959 | `.penal-btn` | 10px | **Cerrado** → 14px (`rounded.lg`), confirmado sin cambios | Es un botón; los 4 botones documentados (`button-primary/secondary/danger/success`) usan `rounded.lg`=14px de forma consistente. Numéricamente 12px está más cerca (Δ2 vs Δ4), pero 14px mantiene la coherencia de "todo botón = 14px" |
| 1059 | `.sorteo-jugador-item` | 10px | → 12px (`rounded.md`) | Fila de lista, mismo bucket que `match-card`/filas de contenido (12-14px) |
| 1233 | `.cabeza-select-row` | 10px | → 12px (`rounded.md`) | Mismo bucket que 1059 — fila/contenedor de fila |
| 1112 | `.modal-box` (esquinas superiores) | `24px 24px 0 0` | **Sin cambio de código** — se documenta | Ver Veredicto #3: se agrega `sheet: 24px` al frontmatter `rounded:` de `DESIGN.md` |

## 4. Tamaños de fuente (`design-system-font-size`)

Ramp de referencia (rangos según el mensaje de revisión conjunta): Display 52 · Headline 18-24 ·
Title 20-24 · Body 13-16 · Label 10-11. Valor canónico exacto usado para normalizar: Display 52,
Headline 24, Body 15, Label 11 (frontmatter de `DESIGN.md`); Title **no tiene valor canónico en el
frontmatter** — ver fila 599 más abajo.

| Línea | Selector | Valor | Categoría | Resolución | Nota |
|---|---|---|---|---|---|
| 109 | `.nav-tab` | 10px | Label | → 11px | |
| 119 | `.nav-tab i` | 18px | *(glyph de ícono Font Awesome, no tipografía)* | **Cerrado** — sin cambio de CSS | Ver nota "Íconos" abajo (opción b) |
| 321 | `.mode-btn` | 14px | Body | → 15px | Empate numérico 13/15 (Δ1 ambos); se prioriza 15px por ser el valor canónico del frontmatter |
| 424 | `.jugador-num` (badge numérico #N del jugador) | 12px | Label | **Cerrado** → 11px | Badge compacto de peso 700, no texto de lectura — coincide con el bucket Label |
| 471 | `.btn-import-registro` | 12px | Label | **Cerrado** → 11px | Se ubica junto a `<label class="form-label">` (`index.html:171-175`), ya documentado en 11px — empareja visualmente con ese label vecino en la misma fila |
| 506 | `.standings-table th` | 10px | Label | → 11px | Header de tabla, uppercase — encaja directo con Label |
| 520 | `.standings-table td` | 12px | Body (dato, no header) | → 15px | **Confirmado sin cambios** en la revisión. Override semántico: es el dato que el usuario lee, no un header/label |
| 599 | `.score-badge` | 22px | Title | **Cerrado** — sin cambio de CSS | Frontmatter gana `title: 22px`; ver nota "Gap de Title" |
| 610 | `.score-badge.pending` | 14px | Body | → 15px | Variante muted del badge; no es el Title principal |
| 710 | `.bracket-phase-label` | 18px | Headline (nombrado explícito en `design.json` typographyMeta) | → 24px | Cambio visible de 6px — es el hallazgo de tipografía con mayor impacto visual del catálogo |
| 752 | `.ronda-tab` | 12px | Coincide con el componente "Pill Tab" ya documentado (`design.json`, `font-size: 13px`) | → 13px | No es Label — es literalmente el mismo componente ya documentado, con un valor apenas distinto |
| 851 | `.cl-pts` | 20px | Title | **Cerrado** → 22px | Frontmatter documenta `title: 22px`; este valor pasa de 20 a 22 para coincidir |
| 869 | `.clasificados-counter-num` | 20px | Title | **Cerrado** → 22px | Mismo motivo que 851 |
| 907 | selects de equipo (`.cruce-row select`, etc.) | 14px | Body + requisito funcional | → **16px** | Prioridad sobre el ramp genérico: CLAUDE.md exige `font-size: 16px` mínimo en todo control de formulario para evitar el zoom automático de Safari/iOS — un `<select>` cuenta como control de formulario |
| 1064 | `.sorteo-jugador-item` | 14px | Body | → 15px | |
| 1164 | `.asignacion-row .jugador-label` | 14px | Body | → 15px | |
| 1239 | `.cabeza-select-row label` | 12px | Label (label de formulario, mismo patrón que `.form-label`) | → 11px | `.form-label` ya documentado en 11px — este es el mismo rol |
| 1287 | `.toast` | 14px | Body | → 15px | |
| 1324 | `.empty-state i` | 40px | *(glyph de ícono Font Awesome, no tipografía)* | **Cerrado** — sin cambio de CSS | Ver nota "Íconos" abajo (opción b) |

**Nota — Íconos (`.nav-tab i` línea 119, `.empty-state i` línea 1324) — CERRADO, opción (b)**:
ambos son el tamaño de glyph de un ícono Font Awesome vía `font-size` en un `<i>`, no texto de
lectura. Se declara una escala de tamaños de ícono separada en el frontmatter de `DESIGN.md`:

```yaml
icon:
  sm: "18px"   # .nav-tab i
  lg: "40px"   # .empty-state i
```

Sin `impeccable-disable-line` y sin tocar ningún selector — el checker valida contra esta escala
nueva en vez de contra el ramp tipográfico. Ninguno de los dos íconos cambia de tamaño visual.

**Nota — Gap de "Title" (líneas 599, 851, 869) — CERRADO, opción (a)**: el frontmatter de
`DESIGN.md` define `typography:` para `display`/`headline`/`body`/`label` con un `fontSize`
numérico cada uno, pero no definía `title` pese a que `design.json`
(`extensions.typographyMeta.title`) y la prosa de `DESIGN.md` sí nombran el rol "Title" (puntaje
inline: `score-badge`, `bracket-team-score`, `cl-pts`) con rango 20-24px. Se agrega:

```yaml
typography:
  title:
    fontFamily: "'Bebas Neue', cursive"
    fontSize: "22px"
    fontWeight: 700
    lineHeight: 1
```

alineado con `.score-badge` (el "componente insignia del sistema" según `design.json`). Como
consecuencia, `.cl-pts` (851) y `.clasificados-counter-num` (869) pasan de 20px a 22px — son los 2
cambios de código reales que trae esta opción (frente a la alternativa de documentar 20px y
corregir solo `.score-badge`, que se descartó).

## 5. Hallazgo manual — `#lista-competiciones` (asimetría de tarjetas)

No es un finding de `design-system-*`, es un ajuste de layout responsivo. Contrato de la
corrección (Veredicto #6): `.competicion-card` (`styles.css:362-378`) gana una altura mínima mayor
que cubra un título de 2 líneas para cualquier nombre de competición futuro, y el título
(`.font-bebas.text-2xl`, `app.js:259`) pasa a un tamaño responsivo vía `clamp()` en vez de un
`text-2xl` fijo, para que nombres más largos que "Champions League" sigan cabiendo sin romper el
balance entre tarjetas de la misma fila del grid de 2 columnas.

## 6. Contrato de animación

Ver [contracts/animation-motion-contract.md](./contracts/animation-motion-contract.md) para los
valores exactos (curvas, duraciones, clases, comportamiento simétrico entrada/salida) de los
Veredictos #7 y #8.
