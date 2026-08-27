# Contract: Esquema de `COMPETICIONES[id]` (`competiciones.js`) — actualizado

Extiende `specs/001-desacople-motor-rediseno/contracts/competition-config-schema.md`, que sigue
siendo la fuente del esquema base (sin cambios de forma). Este archivo documenta lo que agrega
spec 002: la segunda instancia (`champions`) y el mecanismo de fallback de `paletaCSS` (FR-004a).

```js
{
  id: string,
  nombre: string,
  poolEquipos: string[],
  paletaCSS: {              // ahora puede omitir cualquiera de las 4 — ver "Reglas de contrato" #5
    '--red'?: string,
    '--blue'?: string,
    '--green'?: string,
    '--gold'?: string,
  },
  textos: { /* sin cambios de forma respecto a spec 001 */ },
  formatoDefault: { grupos: 'unico' | 'ida_vuelta', eliminacion: 'unico' | 'ida_vuelta', penales: boolean },
}
```

## Reglas de contrato (heredadas de spec 001, sin cambios: #1-#4)

Ver `specs/001-desacople-motor-rediseno/contracts/competition-config-schema.md` reglas 1-4 —
siguen vigentes sin modificación (dato puro, `poolEquipos` mínimo, `formatoDefault` solo como
default inicial, agregar competición no toca `motor.js`).

## Regla de contrato nueva (#5 — FR-004a)

5. `paletaCSS` **puede omitir** cualquiera de las 4 claves de `VARIABLES_PALETA`
   (`competiciones.js`, ver `data-model.md`). Omitir una clave es una decisión válida de diseño
   (ej. Champions no define `--green` por no tener rol de marca en esa competición), **no** un
   error de configuración. `aplicarPaletaCompeticion()` es responsable de resolver la variable
   omitida contra `FALLBACK_PALETA` — ninguna entidad de `COMPETICIONES` necesita definir las 4
   claves para ser válida.

## Instancia para esta spec (Champions League)

`poolEquipos` es la lista fija de 20 clubes acordada en el clarify (spec.md FR-003, `data-model.md`
de esta spec). `paletaCSS` usa los hex acordados (spec.md FR-004): `--red: '#e63946'`,
`--blue: '#0e1e5b'`, `--gold: '#c0c4cc'` — sin `--green`. **Sin variable de negro/fondo**: el
`#0a0e14` mencionado en el primer clarify de paleta no tiene mecanismo de aplicación en este
esquema (`VARIABLES_PALETA` no cubre fondo, ni para Mundial ni para Champions) y se descartó
explícitamente — el fondo sigue siendo `--bg`/`--bg-mid`/`--bg-card` global, por tema, no por
competición (data-model.md, "Decisión: el fondo no es parte de paletaCSS"). El campo `textos` se completó siguiendo
el mismo patrón de Mundial (research.md §3, sin campos nuevos):

| Campo en `textos` | Valor para Champions |
|---|---|
| `tituloTorneoDefault` | `'TORNEO CHAMPIONS'` |
| `textoAsignarEquipos` | `'Elige cómo asignar los clubes de {NOMBRE}'` |
| `tituloSorteoEquipos` | `'SORTEANDO CLUBES'` |
| `subtituloSorteoEquipos` | `'Asignando clubes de {NOMBRE}...'` |
| `nombreExportDefault` | `'champions'` |
| `nombreResumenDefault` | `'Torneo Champions'` |

`formatoDefault`: `{ grupos: 'ida_vuelta', eliminacion: 'ida_vuelta', penales: true }` (D3).
