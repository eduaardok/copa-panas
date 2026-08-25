# Research: Desacople de motor y rediseño visual (Copa Panas v2)

Todas las decisiones de esta sección parten de la lectura directa del código actual
(`app.js`, `index.html`, `styles.css`) hecha para este plan — no de suposiciones. El resumen
de esa lectura vive en el historial de la sesión de planeación; aquí solo quedan las decisiones
resultantes.

## 1. Cómo dividir `app.js` sin build tools

**Decision**: Tres archivos cargados como `<script>` en orden en `index.html`:
`motor.js` → `competiciones.js` → `app.js`. Variables/funciones globales (como hoy), sin
`type="module"` ni bundler.

**Rationale**: Es la única forma de lograr separación física real (auditable con `grep`, ver
SC-006) sin violar el Principio I (sin Node, sin build tools). `type="module"` introduciría
CORS/`file://` issues (los módulos ES no cargan vía `file://` en Chrome sin servidor) y rompería
el requisito de "debe funcionar tanto con `file://` como desde GitHub Pages" (CLAUDE.md, sección
Deploy) — se descarta.

**Alternatives considered**:
- Mantener todo en `app.js` con comentarios de sección "=== MOTOR ===": rechazado, no es
  auditable de forma confiable (Principio II exige que ninguna función del motor referencie
  competición — un solo archivo hace más fácil que una referencia se cuele sin notarse).
- ES Modules (`type="module"` + `import`): rechazado por romper `file://` sin servidor local.
- IIFE con namespace (`window.Motor = {...}`): evaluado, funciona, pero agrega una capa de
  indirección (`Motor.calcularPosiciones(...)`) sin beneficio real dado que no hay riesgo de
  colisión de nombres en un proyecto de este tamaño; se prefiere la opción más simple (funciones
  globales en archivos separados), consistente con el estilo actual del código.

## 2. Cómo representar la configuración de competición

**Decision**: Objeto plano en `competiciones.js`:

```js
const COMPETICIONES = {
  mundial: {
    id: 'mundial',
    nombre: 'Mundial 2026',
    poolEquipos: [ /* las 15 strings ya existentes en EQUIPOS_POOL */ ],
    paletaCSS: { '--comp-red': '#e0182d', '--comp-blue': '#0052c8', '--comp-green': '#00a64e', '--comp-gold': '#c9a84c' },
    textos: {
      tituloSorteoEquipos: 'SORTEANDO EQUIPOS',
      subtituloSorteoEquipos: 'Asignando equipos de {NOMBRE}...',
      nombreExportDefault: 'mundial',
    },
    formatoDefault: { grupos: 'unico', eliminacion: 'unico', penales: true },
  },
};
```

**Rationale**: Un objeto de datos plano es exactamente lo que el Principio IV pide ("formato
como configuración, no como hardcode") y lo que Key Entities de la spec describe para
"Competición". `poolEquipos` reutiliza el array ya existente (`EQUIPOS_POOL`, app.js:13-17) tal
cual, según la Assumption de la spec de no agregar/quitar equipos. `paletaCSS` mapea a variables
CSS (ver Decisión 4) en vez de a clases Tailwind hardcodeadas (`wc-red` etc., que se eliminan de
`tailwind.config`).

**Alternatives considered**: JSON externo (`competiciones.json`) cargado por `fetch`: rechazado,
`fetch` sobre `file://` falla en Chrome por CORS — mismo problema que ES modules.

## 3. Migración de esquema de localStorage (versión explícita)

**Decision**: `crearEstadoVacio()` agrega `version: 2`. `cargar()` llama a
`migrarEstado(datos)` antes del merge: si `datos.version` es `undefined` (dato v1), inyecta
`competicion: 'mundial'` y `configFormato: { grupos: 'unico', eliminacion: 'unico', penales: true }`
(reproduce exactamente el comportamiento actual, que siempre fue partido único + penales
activos en eliminación) y fija `version: 2`. Si `datos.version === 2`, no se toca. La misma
función se reutiliza en `importarJSON()` (que hoy no pasa por `cargar()` y por eso no migra —
bug existente a corregir de paso, ver Nota).

**Rationale**: Resuelve la Clarification ya cerrada en `spec.md` (campo de versión explícito, no
inferencia por ausencia de `competicion`) y cubre FR-008/SC-003 de forma verificable: cualquier
dato sin `version` es tratable como v1 sin ambigüedad, incluso si en el futuro se agregan más
campos opcionales al esquema v2.

**Alternatives considered**: Inferir por ausencia de `competicion` — descartado explícitamente en
Clarifications de `spec.md` por ser frágil ante futuros cambios de esquema.

**Nota (bug preexistente detectado)**: `importarJSON()` (app.js:1620-1635) hace
`Object.assign(crearEstadoVacio(), datos)` sin el merge anidado de `meta` que sí hace `cargar()`
(app.js:83) — un JSON importado con `meta` parcial perdería sub-campos. Se corrige como parte de
unificar ambos flujos por la misma función de migración/merge, no como una nueva feature.

## 4. Paleta por competición: variables CSS, no clases Tailwind

**Decision**: Reemplazar las clases Tailwind `wc-red`/`wc-blue`/`wc-green` (definidas en
`tailwind.config` dentro de `index.html`) por el uso directo de las variables CSS ya existentes
en `:root` (`--red`, `--blue`, `--green`, `--gold`), y aplicar la competición seteando esas
variables desde `competiciones.js` vía `document.documentElement.style.setProperty(...)` al
elegir competición (o al cargar un torneo activo). `:root` conserva los valores de Mundial como
default (para que la pantalla de selección de competición, que no tiene torneo activo todavía,
ya se vea con la paleta correcta antes de elegir).

**Rationale**: Las clases `wc-*` (definidas en `index.html:29-31`) ya son, por nombre, específicas
de "World Cup" — su sola existencia viola el espíritu del Principio II aunque estén en CSS y no en
el motor JS. Cambiarlas por variables inyectadas por competición dentro del esquema
negro/rojo/azul/verde/dorado ya establecido (FR-010) prepara el terreno para Champions sin tocar
`styles.css` de nuevo, sin introducir la paleta de Champions en esta spec (fuera de alcance).

**Alternatives considered**: Mantener `wc-*` y agregar `champions-*` cuando llegue Champions:
rechazado, perpetúa exactamente el acoplamiento que la constitución pide eliminar (Mapa de
partida: "colores Tailwind con prefijo `wc-`" listado explícitamente como hardcodeado).

## 5. Formato ida/vuelta y penales configurables — extensión real del motor

**Decision**:
- **Fase de grupos**: `generarCalendarioGrupos(jugadoresIds, formatoGrupos)` gana un segundo
  parámetro. Si `formatoGrupos === 'ida_vuelta'`, tras el round-robin de ida se genera un segundo
  set de partidos con local/visitante invertidos (`vuelta: true` en cada partido nuevo, campo
  cosmético para agrupar por jornada en el render). Los puntos se acumulan igual que hoy (motor
  ya es agnóstico de esto).
- **Eliminación**: `generarPartidosEliminacion(cruces, ronda, formatoEliminacion)` crea 1 partido
  por cruce si `'unico'`, o 2 (`leg: 1`, `leg: 2`, local/visitante invertidos en el leg 2) si
  `'ida_vuelta'`. El ganador de un cruce a dos partidos se calcula por marcador agregado
  (suma de goles de ambos legs).
- **Penales**: `configFormato.penales` (booleano) sustituye el hardcode implícito
  "eliminación siempre pide penales en empate" (hoy derivado solo del string `tipo==='eliminacion'`
  en `guardarResultado`/`abrirModalResultado`). Si `penales === false` y hay empate en eliminación
  (partido único o agregado de ida/vuelta), se aplican los criterios de desempate reales ya
  existentes en el motor (diferencia de gol → goles a favor → resultado directo, los mismos de
  `calcularPosiciones`). Si tras aplicarlos persiste el empate exacto, el sistema NO fuerza
  penales automáticamente: la UI presenta un selector manual ("Empate sin definir — elegí quién
  avanza") con los dos jugadores del cruce como opciones, y el organizador decide por cualquier
  motivo externo al sistema (acuerdo entre amigos, sorteo físico, etc.). Esa elección se registra
  como resultado del cruce igual que un resultado por penales, distinguido por el campo
  `desempateTipo` (`'penales'` o `'manual'`) — ver data-model.md y contracts/motor-api.md.

**Rationale**: Es la consecuencia directa de la Clarification que hizo penales configurables y de
que D3/FR-004 exigen que ida/vuelta se pueda elegir en grupos **y** en eliminación para cualquier
competición (Champions, cuyo default sugerido es ida/vuelta, depende de que esto exista). Mantener
el motor parametrizado por `configFormato` (no por nombre de competición) preserva el Principio II.
El fallback de selección manual (en vez de forzar penales) respeta la elección explícita del
organizador de no usar penales, y refleja que en un torneo entre amigos el desempate final puede
resolverse por cualquier motivo externo al sistema — el software solo necesita registrar quién
avanza, no decidirlo.

**Alternatives considered**:
- Limitar ida/vuelta solo a fase de grupos y dejar eliminación siempre a partido único en esta
  spec: rechazado — FR-004 (ya clarificado) exige los tres parámetros editables sin importar la
  competición, y D3 dice explícitamente que Champions sugiere ida/vuelta también en eliminación;
  posponerlo solo trasladaría el trabajo a la spec de Champions y volvería a tocar el motor
  entonces, violando la premisa de "declarar configuración, no tocar el motor" para la competición
  nueva.
- Forzar penales igualmente si persiste el empate con `penales: false`: rechazado — contradice el
  valor explícito que el usuario configuró; el organizador ya tiene autoridad total sobre el
  torneo (es la única sesión activa), tiene sentido que decida el caso límite también.
- Usar la regla de "gol de visitante" como criterio de desempate adicional: descartado, ese
  criterio no existe en el motor actual ni está previsto en ningún FR — habría sido una regla
  nueva no solicitada.

## 5a. Selector manual de desempate: disponible siempre, no solo fallback de `penales:false`

**Decision**: El selector manual ("Definir manualmente quién avanza") deja de ser exclusivo del
camino `penales:false` tras agotar los criterios de desempate del motor. Pasa a estar disponible
en **cualquier** partido de eliminación con resultado empatado, sin importar `configFormato.penales`
— con `penales:true`, la UI ofrece penales como camino sugerido pero deja la opción manual visible
como alternativa explícita, no oculta. `resolverCruce()` no cambia su lógica interna: sigue
resolviendo apenas encuentra `desempateGanadorId` cargado en el último leg, sin que le importe si
ese valor llegó por penales o por elección manual (research.md §5, sin cambios). Lo único que
cambia es la **superficie de UI** (`app.js`), que ahora muestra ambas opciones siempre en vez de
condicionar la visibilidad del selector manual a `penales === false`.

**Rationale**: Un torneo entre amigos tiene casos reales que ninguna regla de negoción resuelve
bien — un jugador se lesiona, tiene que irse, o los dos acuerdan quién sigue sin jugar penales —
incluso cuando el organizador configuró `penales:true` para el resto del torneo. Obligar a jugar
penales en esos casos, o a reconfigurar `configFormato.penales` a mitad de torneo (que ni siquiera
es una operación soportada — `configFormato` se fija al confirmar el torneo, FR-004), sería forzar
al usuario a un camino que el sistema no necesita imponer: el propósito de `desempateGanadorId` es
registrar quién avanza, no controlar cómo se decide. Se decide agregarlo ahora, dentro de esta
spec, y no diferirlo, porque:
1. Es una extensión mínima de una función ya escrita en esta misma spec (`resolverCruce`) — no
   toca el motor en su lógica de resolución, solo la condición de visibilidad en la UI.
2. Diferirlo obligaría a re-abrir `abrirModalResultado`/`guardarResultado` en una spec futura para
   una decisión que ya está tomada y que el usuario prefiere cerrar ahora, evitando dos pasadas
   sobre el mismo código.

**`desempateTipo` — ¿un tercer valor?**: Se evaluó agregar un tercer valor (ej.
`'manual_override'` vs `'manual_fallback'`) para distinguir "se usó manual porque `penales:false`"
de "se usó manual como alternativa con `penales:true` activo". Se descarta: esa distinción es
100% derivable sin duplicar dato — `estado.configFormato.penales` es una configuración única por
torneo (no cambia partido a partido), así que cualquier consulta futura ("¿este `'manual'` fue
elegido con penales activo o no?") se responde cruzando el `desempateTipo:'manual'` del partido con
el `configFormato.penales` del torneo, sin necesidad de un campo nuevo. Agregar el tercer valor
sería duplicar información ya disponible — se mantiene `desempateTipo: 'penales' | 'manual'` sin
cambios de esquema (ver data-model.md).

**Alternatives considered**:
- Requerir una confirmación extra ("¿Seguro que querés definir manualmente en vez de penales?")
  cuando `penales:true`: rechazado — no está pedido por ningún FR, y el propio FR-004a dice que el
  sistema "únicamente registra la decisión, no impone cómo se llegó a ella"; agregar fricción
  contradice esa premisa.
- Ocultar el botón de penales cuando el usuario elige manual (y viceversa) para forzar una sola
  vía por partido: rechazado — ambas deben quedar visibles simultáneamente como opciones
  igualmente válidas, no una sucesión de pasos.

## 6. Breakpoints para el rediseño responsive

**Decision**: Tres breakpoints con convención Tailwind estándar (ya cargado vía CDN, sin config
adicional): `sm` (≥640px, transición mobile→tablet), `lg` (≥1024px, tablet→desktop). Mobile es el
rango por defecto (<640px, sin prefijo). El bottom-nav fijo (`#bottom-nav`) se oculta desde `lg:`
y se reemplaza por navegación lateral/superior persistente; desde `lg:` la tabla de posiciones y
el bracket usan layouts de múltiples columnas en vez de scroll vertical apilado.

**Rationale**: Usar los breakpoints por defecto de Tailwind evita reinventar un sistema de grillas
nuevo y es coherente con que el proyecto ya carga Tailwind vía CDN (Principio I: no sumar
dependencias). `lg` (1024px) es el punto natural donde bottom-nav-fijo-estilo-app dejó de tener
sentido semántico (ya no es "un dispositivo en la mano"). El detalle pantalla-por-pantalla del
rediseño (qué cambia en cada uno de los 9 flujos) se ejecuta con las skills `impeccable`/
`emil-design-eng` como indica CLAUDE.md, no se prediseña aquí campo por campo.

**Alternatives considered**: Breakpoints custom (ej. 480/768/1200): rechazado sin justificación —
no hay ningún requisito de diseño ya cerrado que exija desviarse de los defaults de Tailwind.

## 7. `NOMBRES_RONDAS` — ¿motor o competición?

**Decision**: Se mueve a `motor.js` como está (constante o función `nombreDeRonda(totalEquipos)`),
**no** a `competiciones.js`.

**Rationale**: A diferencia de `EQUIPOS_POOL`, los nombres "Final/Semifinales/Cuartos de
final/Octavos de final" no son específicos de Mundial ni de ninguna competición — son
terminología futbolística genérica de cualquier bracket de eliminación (Champions usa los mismos
nombres). El Mapa de partida de la constitución la lista como "requiere desacople" en el sentido
de "no debe ser una constante de módulo suelta sin relación clara con el motor", no en el sentido
de que dependa de la competición — confirmado por lectura del código: no hay ninguna variante de
nombres de ronda entre competiciones prevista en ningún lado de la spec o la constitución.

**Alternatives considered**: Dejarla en `competiciones.js` "por si acaso" una competición futura
quisiera nombres distintos: rechazado, no hay ningún requisito que lo pida (evitar
sobre-ingeniería) y moverla ahí violaría la separación real (el motor volvería a depender de un
archivo de competición para nombrar sus propias rondas).