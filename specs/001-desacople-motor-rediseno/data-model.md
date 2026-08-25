# Data Model: Desacople de motor y rediseño visual (Copa Panas v2)

Basado en el esquema real de `estado` (`crearEstadoVacio()`, app.js:52-64) y las decisiones de
`research.md`. Los campos marcados **NUEVO** no existen en el código actual.

## Torneo activo (`estado`, persistido en `localStorage['torneo_data']`)

| Campo | Tipo | Notas |
|---|---|---|
| `version` | number | **NUEVO**. `2` para el esquema de esta feature. Ausente = dato v1, se migra (research.md §3). |
| `competicion` | string | **NUEVO**. Id de una entrada de `COMPETICIONES` (hoy solo `'mundial'`). Se fija al elegir competición y no cambia durante el torneo. |
| `configFormato` | object | **NUEVO**. Ver entidad "Configuración de formato" abajo. Se inicializa con `COMPETICIONES[competicion].formatoDefault` y queda editable hasta confirmar la creación del torneo (FR-004). |
| `meta` | `{ nombre, logo, tema }` | Sin cambios. |
| `jugadores` | `[{ id, nombre, equipo }]` | Sin cambios de forma; `equipo` ahora se puebla desde `COMPETICIONES[competicion].poolEquipos` en vez de `EQUIPOS_POOL` global (D2). |
| `grupos` | `[{ id, nombre, jugadoresIds }]` | Sin cambios. |
| `partidos_grupos` | `[{ id, grupoId, localId, visitanteId, golesLocal, golesVisitante, jugado, vuelta }]` | `vuelta` **NUEVO** (boolean, default `false`) — marca si el partido es la revancha cuando `configFormato.grupos === 'ida_vuelta'`. No afecta el cálculo de posiciones (ya agnóstico del número de partidos por par). |
| `clasificados` | `[jugadorId]` | Sin cambios. |
| `cruces` | `[{ id, ronda, posicion, localId, visitanteId }]` | Sin cambios de forma. |
| `partidos_eliminacion` | `[{ id, cruceId, ronda, localId, visitanteId, golesLocal, golesVisitante, ganadorId, desempateGanadorId, desempateTipo, jugado, leg }]` | `leg` **NUEVO** (`1` o `2`, default `1`) — permite que un mismo `cruceId` tenga hasta 2 partidos cuando `configFormato.eliminacion === 'ida_vuelta'`. `desempateGanadorId` **NUEVO** (renombra lo que iba a llamarse `penalGanadorId`) — ganador del cruce cuando el resultado (partido único o agregado ida/vuelta) quedó empatado; se completa por penales o por selección manual del organizador, **ambas vías siempre disponibles sin importar `configFormato.penales`** (FR-004a — Clarification "extensión del selector manual", ver research.md §5). `desempateTipo` **NUEVO** (`'penales'` \| `'manual'`, opcional) indica cuál de los dos mecanismos se usó para ESE partido puntual — no se agrega un tercer valor porque si hace falta saber si la elección manual ocurrió con `penales:true` u `penales:false` activo en el torneo, ese dato ya vive en `estado.configFormato.penales` (configuración única por torneo, no cambia partido a partido) y no hace falta duplicarlo por partido. Ambos campos se registran sobre el partido del `leg 2` (o el único partido, en formato `'unico'`). |
| `campeon` | jugadorId \| null | Sin cambios. |
| `fase` | string enum | Sin cambios de valores (`setup`, `equipos`, `grupos_config`, `fase_grupos`, `clasificados`, `eliminacion`, `finalizado`). La pantalla de selección de competición **no** es un valor de `fase` — es un estado previo a que exista `estado` persistido (ver "Torneo activo ausente" abajo). |

### Torneo activo ausente

No hay campo para "sin torneo": la ausencia se determina igual que hoy — `cargar()` devuelve
`false` cuando no hay dato en `localStorage['torneo_data']` o falla el parseo (app.js:76-88, sin
cambios de contrato). En ese caso, `inicializar()` debe mostrar la nueva pantalla de selección de
competición en vez de ir directo a `screen-setup` (cambio de comportamiento en `inicializar()`,
no de esquema — D1/FR-001).

## Configuración de formato (`estado.configFormato`) — **NUEVO**

| Campo | Tipo | Valores | Notas |
|---|---|---|---|
| `grupos` | string enum | `'unico'` \| `'ida_vuelta'` | Formato de la fase de grupos. |
| `eliminacion` | string enum | `'unico'` \| `'ida_vuelta'` | Formato de la eliminación directa. |
| `penales` | boolean | — | Determina el mecanismo **por defecto** ante un empate en eliminación (partido único o agregado ida/vuelta): `true` pide penales, `false` va directo a la definición manual. En ambos casos la definición manual de quién avanza está **siempre disponible como alternativa** en la UI (FR-004a) — con `penales:true` como opción explícita en vez de jugar penales (acuerdo entre jugadores, lesión, etc.), con `penales:false` como único camino. El sistema registra la decisión, no la impone (research.md §5). |

No contiene lógica ni referencias a competición — es leído por `motor.js` como parámetro puro
(Principio II).

## Competición (`COMPETICIONES[id]`, en `competiciones.js`) — **NUEVO**

| Campo | Tipo | Notas |
|---|---|---|
| `id` | string | Clave del registro (`'mundial'`). |
| `nombre` | string | Nombre mostrado en la pantalla de selección y en textos derivados. |
| `poolEquipos` | string[] | Reemplaza `EQUIPOS_POOL`. Mismo contenido que hoy (Assumption de spec.md: no se agregan/quitan equipos). |
| `paletaCSS` | `{ [varCSS]: colorHex }` | Variables CSS a setear en `document.documentElement` al elegir/cargar la competición (research.md §4). Para Mundial, reproduce los valores actuales de `:root`. |
| `textos` | `{ tituloTorneoDefault, textoAsignarEquipos, tituloSorteoEquipos, subtituloSorteoEquipos, nombreExportDefault, nombreResumenDefault }` | Strings hoy hardcodeados ("Asignando equipos de FC 26...", slug `'fc26'` del nombre de archivo exportado, etc.). Inventario final auditado y cerrado — ver `contracts/competition-config-schema.md` para el mapeo completo string-actual → campo. |
| `formatoDefault` | `{ grupos, eliminacion, penales }` | Mismo shape que `estado.configFormato`. Mundial: `{ grupos: 'unico', eliminacion: 'unico', penales: true }` (comportamiento actual preservado, D3). |

No contiene funciones ni lógica de cálculo — es puramente configuración que `app.js` lee para
poblar `estado` y que `motor.js` nunca importa directamente (Principio II).

## Jugador (`estado.jugadores[]`)

Sin cambios de forma: `{ id, nombre, equipo }`. `equipo` sigue siendo un string libre (nombre del
equipo elegido), ahora tomado de `COMPETICIONES[estado.competicion].poolEquipos` en vez de la
constante global `EQUIPOS_POOL`. Fuera de alcance de esta spec: entidad `jugador` reutilizable
entre torneos (D4) — ver spec.md Assumptions.

## Relaciones y ciclo de vida

```
COMPETICIONES[id]  ──(default)──▶  estado.configFormato  ──(editable por usuario)──▶  confirmado
       │                                                                                  │
       └──(poolEquipos, paletaCSS, textos)──▶  usados durante todo el torneo activo ◀─────┘

estado.competicion  — fijo una vez creado el torneo, hasta "Reiniciar torneo" (D1) que
                       borra estado.torneo_data y vuelve a la pantalla de selección de competición.
```

- **Migración**: dato v1 (sin `version`) → `migrarEstado()` → dato v2 con
  `competicion: 'mundial'` y `configFormato` igual al `formatoDefault` de Mundial (research.md §3).
- **Export/Import**: el JSON exportado es `estado` completo (sin cambios de mecanismo,
  `exportarJSON`/`importarJSON`), por lo que `version`, `competicion` y `configFormato` viajan
  automáticamente — cubre FR-007 sin trabajo adicional más allá de que ambos campos existan en
  `estado`. `importarJSON()` pasa a usar la misma función de migración/merge que `cargar()`
  (corrige el bug preexistente de merge superficial de `meta`, research.md §3).
