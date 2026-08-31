# Contrato: nombre de ronda del bracket

**Área**: 1 | **Consumidor**: `renderizarEliminacion()` y `renderizarDashboard()` en `app.js`
**Proveedor**: `nombreDeRonda()` en `motor.js` — **sin cambios**

## Contrato con `motor.js` (inmutable)

```js
// motor.js — NO SE MODIFICA
function nombreDeRonda(totalEquipos) { return NOMBRES_RONDAS[totalEquipos]; }
```

- **Entrada**: `totalEquipos` — cantidad de equipos que arrancan esa ronda. Debe ser una potencia
  de 2 dentro de `{2, 4, 8, 16, 32}` para obtener un nombre; cualquier otro valor devuelve
  `undefined`.
- **Salida**: `string` (nombre canónico) o `undefined`.
- Este contrato no cambia. `app.js` sigue siendo el único responsable de calcular un
  `totalEquipos` correcto antes de llamarlo.

## Contrato del lado de `app.js` (lo que cambia esta spec)

**Antes** (los tres sitios listados en `plan.md`):

```js
const n = Math.pow(2, rondas.length - ronda);
```

**Después**:

```js
const profundidadBracket = Math.ceil(Math.log2(estado.clasificados.length || 2));
const n = Math.pow(2, profundidadBracket - ronda);
```

### Precondiciones

- `estado.clasificados` existe y tiene longitud ≥ 1 en cualquier punto donde se llama a este
  cálculo (el bracket ya se generó). Con longitud 0, el fallback `|| 2` evita `Math.log2(0)`.
- `ronda` es un índice 0-based de las rondas ya generadas (`rondas` es el resultado de
  `[...new Set(estado.partidos_eliminacion.map(p => p.ronda))].sort(...)`).

### Postcondiciones

- `profundidadBracket` es constante para todo el ciclo de vida del bracket activo — no depende de
  cuántas rondas se generaron hasta el momento, así que el nombre de una ronda ya mostrada nunca
  cambia al generarse rondas siguientes (FR-002).
- `n` (equipos que arrancan esa ronda) es siempre una potencia de 2, preservando el contrato de
  entrada de `nombreDeRonda()`.
- Si `nombreDeRonda(n)` devuelve `undefined` (caso no esperado en brackets válidos), se conserva el
  fallback existente `` `Ronda ${ronda + 1}` `` — sin cambios en ese comportamiento.

### Casos de referencia (verificados en `research.md`, R3)

| `clasificados.length` | `profundidadBracket` | Ronda 0 (`n`, nombre) | Ronda 1 | Ronda 2 |
|---|---|---|---|---|
| 8 | 3 | 8 → "Cuartos de final" | 4 → "Semifinales" | 2 → "Final" |
| 6 | 3 | 8 → "Cuartos de final" | 4 → "Semifinales" | 2 → "Final" |
| 5 | 3 | 8 → "Cuartos de final" | 4 → "Semifinales" | 2 → "Final" |
| 4 | 2 | 4 → "Semifinales" | 2 → "Final" | — |

### Nota de paridad entre sitios

Los tres sitios (`renderizarEliminacion()` ×2, `renderizarDashboard()` ×1) deben producir el mismo
nombre para la misma ronda del mismo torneo en todo momento — es la base de la verificación V4 (ver
`quickstart.md`), que compara explícitamente bracket vs. dashboard.

`renderizarEliminacion()` ya calcula `totalJugadores` con la guarda `|| 2` (línea ~1890) — se
reutiliza como `profundidadBracket` en vez de declarar una variable nueva. `renderizarDashboard()`
no tiene guarda equivalente hoy: debe agregarse al introducir el cálculo (hallazgo R3).
