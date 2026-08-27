# Contract: `aplicarPaletaCompeticion()` — determinismo (FR-004a)

Contrato nuevo de esta spec — formaliza el comportamiento corregido descrito en `research.md` §1-2
para que quede verificable independientemente de `tasks.md`.

## Firma (sin cambios de firma pública)

`aplicarPaletaCompeticion(competicionId: string): void`

## Garantías

1. **Idempotencia por competición**: llamar `aplicarPaletaCompeticion('champions')` dos veces
   seguidas, o llamarlo después de `aplicarPaletaCompeticion('mundial')`, produce exactamente el
   mismo resultado en `document.documentElement.style` — las 4 variables de `VARIABLES_PALETA`
   quedan siempre en el valor de la competición actual (propio o fallback), nunca en un valor
   heredado de una llamada anterior.
2. **Cobertura total**: itera `VARIABLES_PALETA` (no `Object.keys(comp.paletaCSS)`) — una
   competición que define solo 3 de las 4 variables igual deja las 4 en un estado explícito
   (propio + fallback), nunca una variable "sin tocar".
3. **Fallback documentado, no implícito**: el valor usado para una variable omitida viene de
   `FALLBACK_PALETA` (`competiciones.js`, ver `data-model.md`) — nunca de dejar que el navegador
   caiga al valor hardcodeado de `:root` en `styles.css` por omisión de `setProperty()`.
4. **Sin efecto sobre `motor.js`**: esta función vive en `competiciones.js`; su corrección no
   introduce ninguna referencia nueva desde `motor.js` (Principio II intacto — ver research.md §4).
5. **Alcance limitado a las 4 variables base**: esta función NO es responsable de los tonos
   derivados (fondos translúcidos, sombras, glows — `--red-dim`/`--blue-dim`/`--green-dim`/
   `--gold-dim`/`--gold-light` y los 66 literales `rgba()` de `styles.css`, research.md §7). Esos
   se resuelven con fórmulas `color-mix()` puramente en CSS, evaluadas contra el valor *actual* de
   `--red/--blue/--green/--gold` — se actualizan solos cuando esta función cambia esas 4 variables,
   sin necesitar código adicional acá ni una quinta entrada en `VARIABLES_PALETA`.

## Casos de verificación (para `quickstart.md` / `tasks.md`)

| Escenario | Antes del fix | Después del fix |
|---|---|---|
| Elegir Champions en `screen-competicion` (primera competición de la sesión) | `--green` queda en el valor hardcodeado de `:root`/`styles.css` (Mundial) — accidental, no explícito | `--green` queda en `FALLBACK_PALETA['--green']` — mismo valor final, pero por una regla documentada, no por omisión |
| Importar JSON de Champions **después** de tener un torneo Mundial activo en la misma sesión (sin recargar) | `--green` queda con el valor inline que dejó Mundial — bug real, paleta mixta | `--green` se resetea al fallback documentado — paleta 100% de Champions, sin mezcla |
| Importar JSON de Mundial después de un torneo Champions activo en la misma sesión | Ya funcionaba (Mundial define las 4 variables) | Sin cambio de comportamiento — sigue aplicando las 4 propias de Mundial |
| Boot (`inicializar()`) con un torneo Champions ya guardado | DOM fresco, `--green` cae al hardcodeado de `:root` (mismo valor que el fallback, por coincidencia) | `--green` cae al fallback documentado — mismo valor, ahora por regla explícita en vez de coincidencia de que `:root` tenía ese mismo verde |

La tercera fila es la que demuestra que el fix es necesario: sin el reset determinístico, hay una
secuencia real (import JSON) donde el resultado visible cambia según el historial de la sesión, no
solo según `estado.competicion` actual.
