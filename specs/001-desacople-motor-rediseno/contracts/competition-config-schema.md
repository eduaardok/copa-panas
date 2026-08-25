# Contract: Esquema de `COMPETICIONES[id]` (`competiciones.js`)

Contrato que cualquier competición futura (Champions incluida) debe cumplir para ser agregada
sin tocar `motor.js` ni la lógica de router en `app.js` — es la superficie que hace cumplible el
Principio II y D3 en el tiempo.

```js
{
  id: string,               // clave única, minúsculas, sin espacios (ej. 'mundial', 'champions')
  nombre: string,           // nombre mostrado en la pantalla de selección de competición
  poolEquipos: string[],    // nombres de equipos/selecciones asignables a jugadores
  paletaCSS: {              // variables CSS a aplicar sobre :root al elegir/cargar la competición
    '--red': string,        // hex color
    '--blue': string,
    '--green': string,
    '--gold': string,
  },
  textos: {
    tituloTorneoDefault: string,       // fallback del header/título cuando meta.nombre está vacío (ej. 'TORNEO FC 26')
    textoAsignarEquipos: string,       // subtítulo de la pantalla "Asignar equipos"; admite {NOMBRE}
    tituloSorteoEquipos: string,       // ej. 'SORTEANDO EQUIPOS'
    subtituloSorteoEquipos: string,    // admite placeholder {NOMBRE} -> nombre de la competición
    nombreExportDefault: string,       // slug usado en el nombre de archivo exportado si el torneo no tiene nombre propio
    nombreResumenDefault: string,      // nombre por defecto en el resumen de texto copiable (copiarResumen)
  },
  formatoDefault: {
    grupos: 'unico' | 'ida_vuelta',
    eliminacion: 'unico' | 'ida_vuelta',
    penales: boolean,
  },
}
```

## Reglas de contrato

1. Ningún campo puede contener JS ejecutable ni referenciar `motor.js` — es dato puro (JSON-safe).
2. `poolEquipos` debe tener al menos tantos elementos como el máximo de jugadores soportado por un
   torneo (hoy sin límite explícito duro, pero la UI ya advierte si faltan equipos — comportamiento
   preexistente de `_equiposExtra`, sin cambios).
3. `formatoDefault` es solo un valor inicial — nunca se lee de nuevo una vez que
   `estado.configFormato` fue creado; editar `COMPETICIONES[id].formatoDefault` después no afecta
   torneos ya creados (evita acoplar el motor a "recalcular default" en medio de un torneo).
4. Agregar una competición nueva (ej. Champions) implica **solo**: (a) agregar una entrada a
   `COMPETICIONES`, (b) agregarla a la lista renderizada en la pantalla de selección de
   competición. No debe requerir tocar `motor.js`, ni agregar un `if` por nombre de competición en
   ninguna parte de `app.js` fuera del punto único donde se lee `COMPETICIONES[estado.competicion]`.

## Instancia para esta spec (Mundial)

`poolEquipos`, `paletaCSS` se migran literalmente desde el código existente (`EQUIPOS_POOL` y los
valores actuales de `:root`). El campo `textos` se completó auditando `app.js`/`index.html` con
grep (`grep -inE "FC ?26|Mundial|Asignando equipos|Torneo FC"`), resultando en el mapeo
string-actual → campo:

| String hardcodeado hoy | Ubicación | Campo en `textos` |
|---|---|---|
| `'TORNEO FC 26'` (fallback de header/título) | app.js:171, index.html:55 | `tituloTorneoDefault` |
| `'Elige cómo asignar los equipos de FC 26'` | index.html:160 | `textoAsignarEquipos` (con `{NOMBRE}`) |
| `'SORTEANDO EQUIPOS'` | app.js:441 | `tituloSorteoEquipos` |
| `'Asignando equipos de FC 26...'` | app.js:442, index.html:539 | `subtituloSorteoEquipos` (con `{NOMBRE}`) |
| `'fc26'` (slug del nombre de archivo exportado) | app.js:1611 | `nombreExportDefault` |
| `'Torneo FC 26'` (nombre por defecto en resumen) | app.js:1638 | `nombreResumenDefault` |

**Strings descartados de la migración** (confirmados como agnósticos de competición por no
mencionar "Mundial"/"FC 26"/nombres de equipos concretos — quedan tal cual en `app.js`/
`index.html`, compartidos por cualquier competición futura): `'SORTEO COMPLETADO'`,
`'REALIZANDO SORTEO'`, `'Asignando jugadores a grupos...'`, el label del botón
`'Sortear equipos'`, y el `<title>` estático de `index.html` (invisible mientras no hay torneo
activo — la pantalla de selección de competición se muestra antes que cualquier header).
