# Contract: API interna de `motor.js`

No hay API HTTP en este proyecto (app estática sin backend). El "contrato" relevante para
Principio II es la firma de las funciones que `app.js` puede llamar en `motor.js`, y la garantía
de que ninguna de ellas acepta ni referencia nada específico de competición (nombres, colores,
strings de UI, pools de equipos).

**Regla de contrato**: ninguna función de esta lista puede importar, leer ni referenciar
`COMPETICIONES` ni ningún literal de competición ("mundial", "Champions", nombres de equipos
concretos, valores de color). Toda variación de comportamiento entra exclusivamente por
parámetros. Verificable con `grep -i "mundial\|champions\|EQUIPOS_POOL\|competicion" motor.js`
(debe devolver 0 resultados) — es la operacionalización de SC-006.

## Funciones

### `generarCalendarioGrupos(grupos, formatoGrupos)`
- **Input**: `grupos: {id, jugadoresIds:string[]}[]`, `formatoGrupos: 'unico' | 'ida_vuelta'`.
- **Output**: `partido[]` — `{ id, grupoId, localId, visitanteId, golesLocal: null, golesVisitante: null, jugado: false, vuelta: boolean }`.
- Si `formatoGrupos === 'ida_vuelta'`, genera un segundo set de partidos con local/visitante
  invertidos y `vuelta: true`. Sin cambios en `'unico'` (comportamiento actual preservado).

### `calcularPosiciones(partidosGrupo, jugadoresIds)`
- **Input**: partidos (jugados o no) de UN grupo + ids de sus jugadores.
- **Output**: tabla ordenada `{ id, pj, pg, pe, pp, gf, gc, dg, pts }[]`.
- Sin cambios de comportamiento — ya es agnóstico de competición y de número de partidos por par
  (funciona igual con 1 o 2 partidos entre el mismo par, dado que solo agrega estadísticas).

### `calcularClasificadosGeneral(gruposConPosiciones)`
- **Input**: `{grupoId, grupoNombre, posiciones: object[]}[]` — salida ya calculada de
  `calcularPosiciones()` por cada grupo.
- **Output**: lista general ordenada por rank dentro de grupo → pts → dg → gf.

### `generarPartidosEliminacion(cruces, ronda, formatoEliminacion)`
- **Input**: `cruces: {id, localId, visitanteId}[]`, `ronda: number`, `formatoEliminacion: 'unico' | 'ida_vuelta'`.
- **Output**: `partido[]` — 1 partido por cruce si `'unico'` (`leg: 1`), 2 si `'ida_vuelta'`
  (`leg: 1` y `leg: 2`, con local/visitante invertidos en el leg 2).
- Soporte de doble partido — no existía antes de esta feature.

### `resolverCruce(legsDelCruce, configFormato)`
- **Input**: los 1 o 2 partidos (`leg`) de un mismo `cruceId`, `configFormato: { penales }`.
- **Output**: `{ resuelto: boolean, ganadorId?: string, pendiente?: 'penales'|'manual' }`.
- Se invoca inmediatamente después de guardar CUALQUIER resultado de eliminación (no espera a que
  el resto de la ronda esté jugada — mismo momento de resolución que v1 con partido único).
  Calcula el ganador por marcador agregado; si hay empate agregado y el último leg ya trae
  `desempateGanadorId` cargado (por penales o por selección manual — cualquiera de los dos, sin
  importar `configFormato.penales`, per FR-004a), lo usa. Si no, devuelve `resuelto:false` con
  `pendiente` indicando el mecanismo **sugerido por defecto** — `'penales'` si
  `configFormato.penales`, `'manual'` si no — pero esto es solo una sugerencia de la UI: la
  definición manual está **siempre disponible como alternativa**, incluso con `pendiente:'penales'`
  (FR-004a, Clarification "extensión del selector manual"). El motor no distingue ni le importa
  cuál de los dos caminos se usó al recibir el `desempateGanadorId` ya cargado — solo consume el
  resultado.

### `avanzarEliminacion(partidosRonda)`
- **Input**: todos los partidos de la ronda actual (`app.js` los agrupa por `cruceId` con 1 o 2
  legs cada uno; se asume que cada `ganadorId` de último-leg ya fue completado vía
  `resolverCruce`).
- **Output**: `{ completo: boolean, ganadoresIds?: string[] }` — `completo:true` solo cuando
  **todos** los cruces de la ronda tienen `ganadorId` resuelto en su último leg; en ese caso
  `ganadoresIds` viene en orden de cruce para que `app.js` arme la ronda siguiente.

### `nombreDeRonda(totalEquipos)`
- **Input**: `totalEquipos: number` (potencia de 2).
- **Output**: `string | undefined` — nombre canónico
  (`{2:'Final', 4:'Semifinales', 8:'Cuartos de final', 16:'Octavos de final', 32:'Dieciseisavos'}`),
  o `undefined` si `totalEquipos` no está en la tabla — el llamador decide el fallback (ej.
  `Ronda ${ronda + 1}`). No es específico de competición (research.md §7), por eso vive en el
  motor y no en `competiciones.js`.
