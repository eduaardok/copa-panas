# Contrato: Tokens de diseño

**Feature**: [../spec.md](../spec.md) · Fuente de valores: [../data-model.md](../data-model.md)

Este contrato es la lista cerrada de cambios permitidos en `styles.css`, `DESIGN.md` y
`.impeccable/design.json` para esta spec. `tasks.md` se genera a partir de esta lista, no al
revés — ningún cambio de token fuera de esta lista pertenece a esta feature (FR-004: si algo más
apareciera, se documenta fuera de alcance).

## Archivos que se tocan

- `styles.css` — valores de color/radio/font-size corregidos (ver tablas en `data-model.md` §2-4)
- `DESIGN.md` — frontmatter (`colors:`, `rounded:`, `typography:`) + prosa, para los tokens
  nuevos y el radio `sheet: 24px`
- `.impeccable/design.json` — `extensions.colorMeta` (y `typographyMeta`/`roundedMeta` si
  corresponde) sincronizado con lo agregado a `DESIGN.md`
- `.impeccable/config.json` — **actualizado en la práctica** (corrige la previsión original de
  este contrato, que decía "sin cambios" — contradecía la propia "Regla de aceptación" de abajo,
  que ya preveía este caso). 4 cambios, los 4 aprobados explícitamente durante la verificación de
  T010 (no agregados sin supervisión): se amplía el `files` de la excepción `side-tab` ya
  existente para cubrir la misma regla mal atribuida a `index.html` (motor de cascada, ver
  `research.md`), y se agregan 3 excepciones nuevas — `flat-type-hierarchy`, `cramped-padding` y
  `dark-glow`, las 3 con `files: ["index.html"]` y su razón completa documentada inline. Ver
  `research.md` §Parte 1 y `tasks.md` (T010) para el detalle de cada una.

  **Actualización tras revisión de cierre** (ver `tasks.md` "Revisión de cierre #2"): 5 de los 6
  hallazgos de `cramped-padding` se corrigieron en código (no quedaron como excepción) —
  `.card-glass.p-3`/`.p-4`, `.modal-box.py-6`/`.py-8`, `.campeon-card` (+ compensación de
  `#confetti-canvas`), todo en `styles.css`. Las excepciones de `cramped-padding` y
  `flat-type-hierarchy` fueron re-escritas con su causa técnica real y verificada (la razón
  original de `flat-type-hierarchy` era incorrecta). `dark-glow` se mantiene sin cambios de fondo.

## Regla de aceptación (SC-001)

Al terminar la implementación, correr:

```
node .agents/skills/impeccable/scripts/detect.mjs --json index.html styles.css app.js competiciones.js motor.js
```

debe dar **0** hallazgos de `design-system-color`, `design-system-font-size` y
`design-system-radius` sin justificar. Los únicos hallazgos aceptables tras la implementación son
los ya existentes en `.impeccable/config.json` (sin cambios) más cualquier decisión de esta spec
que termine en "se documenta la excepción" en vez de "se corrige el código" — y esas deben quedar
reflejadas como una entrada nueva en `.impeccable/config.json` con su razón, igual que las
existentes.

## Tabla de colores — nuevos tokens (agregar a `DESIGN.md`/`design.json`)

| Nombre | Valor | Rol |
|---|---|---|
| `blanco-puro` | `#ffffff` | on-color |
| `fondo-superficie-claro` | `#f8faff` | neutral (light) |
| `verde-grupos-claro` | `#4dcc88` | tertiary (light-on-dark) |
| `borde-claro-marcado` | `rgba(0,0,0,0.12)` | neutral (light) |
| `borde-claro-sutil` | `rgba(0,0,0,0.07)` | neutral (light) |
| `borde-claro-medio` | `rgba(0,0,0,0.08)` | neutral (light) |
| `azul-setup-claro` | `#5ba0ff` | primary (light-on-dark) |
| `gris-300-claro` | `#4a5568` | neutral (light) — `.text-gray-300` |
| `azul-setup-oscuro` | `#003d99` | primary (parada de gradiente) |
| `verde-grupos-oscuro` | `#007a38` | tertiary (parada de gradiente) |
| `rojo-eliminacion-oscuro` | `#990010` | tertiary (parada de gradiente) |
| `gris-400-claro` | `#5a6577` | neutral (light) — `.text-gray-400` |
| `gris-500-claro` | `#718096` | neutral (light) — `.text-gray-500` |
| `gris-600-claro` | `#4b5563` | neutral (light) — `.text-gray-600` |

**Cerrado** en la revisión del plan: los 3 tokens de gradiente se agregan sin cambios; los 4
grises light-theme (incluido `#4a5568`) quedan nombrados `gris-300/400/500/600-claro`, alineados
al sufijo numérico de la clase Tailwind que cada uno estiliza (`.text-gray-300/400/500/600`) —
reemplaza los nombres `gris-100/200/300/400-claro` de una versión anterior de este contrato.

## Tabla de colores — corregidos en `styles.css` (sin token nuevo)

| Línea | De | A |
|---|---|---|
| 647 | `#1a1d28` | `#0f1420` |
| 875 | `#ffaa44` | `var(--red)` |
| 1087 | `#ff6070` | `#ff7080` |
| 1122 | `#f5f8ff` | `#f8faff` (token nuevo) |
| 1283 | `#1a2030` | `var(--bg-card)` |
| 4 líneas con `rgba(255,255,255,0.07)` literal | literal | `var(--border)` |

72 hallazgos de `design-system-color` = 14 tokens nuevos (cubren 9+6=15 valores... 1 colapsa a
`var(--border)` sin token) + 5 correcciones directas + N usos de cada token nuevo en su lugar
original. Ninguna corrección cambia dónde se usa un color, solo qué literal/variable lo expresa.

## Tabla de radios — `DESIGN.md` `rounded:` frontmatter

Agregar:

```yaml
rounded:
  sm: "8px"
  md: "12px"
  lg: "14px"
  xl: "16px"
  pill: "20px"
  full: "50%"
  sheet: "24px"   # nuevo — esquinas superiores de modal/bottom-sheet
```

Correcciones en `styles.css`:

| Línea | Selector | De | A |
|---|---|---|---|
| 436 | `.jugador-input` | 10px | 12px |
| 801 | `.cl-check` | 6px | 8px |
| 959 | `.penal-btn` | 10px | 14px |
| 1059 | `.sorteo-jugador-item` | 10px | 12px |
| 1233 | `.cabeza-select-row` | 10px | 12px |
| 1112 | `.modal-box` | `24px 24px 0 0` | **sin cambio** (ya cubierto por `sheet: 24px`) |

## Tabla de tamaños de fuente — `styles.css`

| Línea | Selector | De | A |
|---|---|---|---|
| 109 | `.nav-tab` | 10px | 11px |
| 321 | `.mode-btn` | 14px | 15px |
| 424 | `.jugador-num` | 12px | 11px |
| 471 | `.btn-import-registro` | 12px | 11px |
| 506 | `.standings-table th` | 10px | 11px |
| 520 | `.standings-table td` | 12px | 15px |
| 610 | `.score-badge.pending` | 14px | 15px |
| 710 | `.bracket-phase-label` | 18px | 24px |
| 752 | `.ronda-tab` | 12px | 13px |
| 851 | `.cl-pts` | 20px | 22px |
| 869 | `.clasificados-counter-num` | 20px | 22px |
| 907 | selects de equipo | 14px | 16px |
| 1064 | `.sorteo-jugador-item` | 14px | 15px |
| 1164 | `.asignacion-row .jugador-label` | 14px | 15px |
| 1239 | `.cabeza-select-row label` | 12px | 11px |
| 1287 | `.toast` | 14px | 15px |

`.score-badge` (599, 22px) **no cambia de valor** — es la referencia que fija el nuevo
`typography.title.fontSize: 22px` del frontmatter (ver abajo), por eso 851/869 se corrigen a 22px
y 599 queda igual.

## Tabla de tamaños de ícono — `DESIGN.md` frontmatter (nuevo, sin tocar CSS)

```yaml
icon:
  sm: "18px"   # .nav-tab i (línea 119)
  lg: "40px"   # .empty-state i (línea 1324)
```

## `typography.title` — `DESIGN.md` frontmatter (nuevo)

```yaml
typography:
  title:
    fontFamily: "'Bebas Neue', cursive"
    fontSize: "22px"
    fontWeight: 700
    lineHeight: 1
```

## `#lista-competiciones` (hallazgo manual, sin ID de regla)

`.competicion-card` (`styles.css:362-378`): agregar `min-height` mayor (a definir en
implementación, cubriendo 2 líneas de título) + `font-size: clamp(...)` en el título
(`app.js:259`, `.font-bebas.text-2xl`) en vez de tamaño fijo. No es parte del contrato de
`design-system-*` — se valida por inspección visual (ver `quickstart.md`), no por el checker.
