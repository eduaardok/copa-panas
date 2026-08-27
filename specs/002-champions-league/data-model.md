# Data Model: Champions League (Copa Panas v2)

Delta sobre el esquema ya cerrado en `specs/001-desacople-motor-rediseno/data-model.md` (que sigue
siendo la fuente de verdad para `estado`, `configFormato` y la forma de `COMPETICIONES[id]`). Esta
spec no cambia esquema — solo agrega una segunda instancia de `COMPETICIONES[id]` y una constante
nueva de fallback. Campos marcados **NUEVO** no existen en el código actual.

## `COMPETICIONES.champions` (en `competiciones.js`)

Misma forma que `COMPETICIONES.mundial` (sin cambios de esquema respecto a spec 001):

| Campo | Valor |
|---|---|
| `id` | `'champions'` |
| `nombre` | `'Champions League'` |
| `poolEquipos` | Real Madrid, Barcelona, Bayern Múnich, Manchester City, Manchester United, Liverpool, Chelsea, Arsenal, Tottenham, Paris Saint-Germain, Juventus, AC Milan, Inter de Milán, Napoli, Atlético de Madrid, Borussia Dortmund, Ajax, Porto, Benfica, Sevilla (20 — spec.md FR-003) |
| `paletaCSS` | `{ '--red': '#e63946', '--blue': '#0e1e5b', '--gold': '#c0c4cc' }` — sin `--green` (spec.md FR-004; ver "Fallback de paleta" abajo). **Sin variable de fondo/negro** — decisión explícita, ver nota abajo. |
| `textos` | `{ tituloTorneoDefault: 'TORNEO CHAMPIONS', textoAsignarEquipos: 'Elige cómo asignar los clubes de {NOMBRE}', tituloSorteoEquipos: 'SORTEANDO CLUBES', subtituloSorteoEquipos: 'Asignando clubes de {NOMBRE}...', nombreExportDefault: 'champions', nombreResumenDefault: 'Torneo Champions' }` — mismas 6 claves que Mundial, sin campos nuevos (research.md §3) |
| `formatoDefault` | `{ grupos: 'ida_vuelta', eliminacion: 'ida_vuelta', penales: true }` (D3) |

## Decisión: el fondo (negro) no es parte de `paletaCSS`

El clarify original de paleta (spec.md, primera sesión) mencionó un "negro `#0a0e14`" para
Champions, pero `VARIABLES_PALETA` (abajo) solo cubre `--red`/`--blue`/`--green`/`--gold` — no hay,
ni había en spec 001, una variable de fondo por competición. El fondo (`--bg`/`--bg-mid`/`--bg-card`
en `styles.css`) es compartido por todas las competiciones y solo varía con el tema claro/oscuro
(Mundial tampoco define su propio `#07090f` en `paletaCSS`). Resuelto en la sesión de clarify
"revisión de gaps de plan.md" (spec.md): se descarta `#0a0e14` como variable nueva — no se agrega
una 5ª entrada a `VARIABLES_PALETA` ni un `FALLBACK_PALETA` para fondo. La identidad de Champions
queda dada por sus 3 colores de acento (`--red`/`--blue`/`--gold`) sobre el mismo fondo neutro que
usa toda la app.

## Fallback de paleta — **NUEVO**

| Campo | Tipo | Notas |
|---|---|---|
| `VARIABLES_PALETA` | string[] | **NUEVO**, constante en `competiciones.js`: `['--red', '--blue', '--green', '--gold']`. Lista canónica y fija de las variables que toda competición puede definir — no vive dentro de cada entrada de `COMPETICIONES`, es compartida. |
| `FALLBACK_PALETA` | `{ [varCSS]: colorHex }` | **NUEVO**, constante en `competiciones.js`: `{ '--green': '#00a64e' }` hoy (research.md §2) — solo necesita una entrada porque es el único caso real de variable omitida por una competición existente. Si una competición futura omite otra variable, se agrega su fallback acá, no en el objeto de esa competición. |

`aplicarPaletaCompeticion(competicionId)` (contrato actualizado en
`contracts/competition-config-schema.md`) pasa a iterar `VARIABLES_PALETA` en vez de
`Object.entries(comp.paletaCSS)`, aplicando `comp.paletaCSS[variable] ?? FALLBACK_PALETA[variable]`
para cada una — determinístico sin importar qué competición estaba cargada antes en la misma
sesión (spec.md FR-004a).

## Variables derivadas (`-dim`/`-light`/glow) — **NUEVO**, CSS puro sin equivalente en JS

| Antes | Después |
|---|---|
| `--red-dim: rgba(224,24,45,0.12);` (hex fijo en `:root`, `styles.css:13`) | `--red-dim: color-mix(in srgb, var(--red) 12%, transparent);` (fórmula) |
| `--blue-dim`, `--green-dim`, `--gold-dim` | Mismo patrón — cada uno pasa a `color-mix(in srgb, var(--rol) X%, transparent)` con el % de alpha que ya tenía |
| `--gold-light` | **Excepción**: es un tono sólido y opaco (no translúcido, usado como `color` de texto plano) — pasa a `color-mix(in srgb, var(--gold) 65%, white)` (mezcla con blanco, no con transparente). Encontrado durante `/speckit-implement`, ver `contracts/derived-tones-contract.md`. |
| 66 literales `rgba(201,168,76|224,24,45|0,82,200|0,166,78, alpha)` sueltos en reglas de `styles.css` (bordes, sombras, glows — ver research.md §7) | Cada uno reemplazado en el lugar por `color-mix(in srgb, var(--rol) <alpha%>, transparent)` |

Estas variables/valores **no** pasan por `aplicarPaletaCompeticion()` ni por `VARIABLES_PALETA` —
son fórmulas CSS evaluadas por el navegador contra el valor *actual* de `--red/--blue/--green/--gold`,
así que se actualizan automáticamente en cuanto esas 4 variables cambian, sin lógica JS adicional.
Es la razón por la que no se agregó una quinta o sexta variable a `VARIABLES_PALETA`: el problema no
era de datos de competición, era de que el CSS existente no leía la variable en absoluto.

**Compatibilidad**: `color-mix()` no tiene soporte en Safari/iOS < 16.2. Degradación aceptada
explícitamente (spec.md FR-010/SC-004, research.md §7): la propiedad puntual pierde su efecto
translúcido/glow en esas versiones — nunca un color incorrecto ni una falla de layout/funcionalidad.

## Relaciones y ciclo de vida (sin cambios de fondo respecto a spec 001)

```
COMPETICIONES['champions']  ──(mismo flujo que 'mundial')──▶  estado.competicion = 'champions'
       │
       └──(poolEquipos, paletaCSS + FALLBACK_PALETA, textos)──▶  usados durante todo el torneo activo
```

- `estado.jugadores[].equipo` se puebla desde `COMPETICIONES.champions.poolEquipos` cuando
  `estado.competicion === 'champions'` — mismo mecanismo D2, sin cambio de forma.
- **Sin cambios de migración**: el campo `version` (2, desde spec 001) no cambia; agregar una
  segunda entrada a `COMPETICIONES` no afecta el esquema de `estado` ni requiere una nueva versión.
- **Export/Import**: sin cambios de mecanismo — un torneo Champions exportado/importado viaja con
  `competicion: 'champions'` igual que hoy viaja `'mundial'`; es justamente el camino de importar
  JSON (app.js:1704) el que ejercita el fix de determinismo de paleta (research.md §1).

## Fuera de alcance (sin cambios de esquema)

- `jugador` reutilizable entre torneos (D4) — sigue diferido, no se toca `estado.jugadores` como
  lista por-torneo (spec.md Assumptions).
- Renombrado de `--red/--blue/--green/--gold` por rol funcional — deuda técnica documentada,
  ninguna entidad de este data model cambia de nombre en esta spec (research.md §6).
