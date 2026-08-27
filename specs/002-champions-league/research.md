# Phase 0 Research: Champions League (Copa Panas v2)

Basado en lectura directa del código actual (`app.js`, `competiciones.js`, `motor.js`,
`styles.css`, `index.html`), no en suposiciones. Resuelve los puntos técnicos señalados en la
revisión pre-plan del clarify (FR-004a y el edge case de cambio de competición sin recargar) más
lo necesario para completar el Technical Context.

## 1. Call sites reales de `aplicarPaletaCompeticion()`

Verificado por grep — hay exactamente **tres** call sites en `app.js`, no cuatro:

| # | Call site | Línea | Cuándo dispara |
|---|---|---|---|
| 1 | `elegirCompeticion(competicionId)` | app.js:226 | Al confirmar competición en `screen-competicion` (único punto de entrada a esta función; solo alcanzable sin torneo activo, D1). |
| 2 | Importar torneo desde JSON | app.js:1704 | Al leer un archivo `.json` de torneo exportado y reemplazar `estado` completo — **sin recarga de página**. |
| 3 | `inicializar()` (boot) | app.js:1778 | Al cargar la app y `cargar()` devuelve un torneo activo existente — ocurre en cada page load, DOM fresco. |

**Corrección respecto al pedido inicial**: "Reiniciar torneo" (`btn-reiniciar`, app.js:2062-2072)
**no** es un cuarto call site relevante para el riesgo de estado heredado — su handler llama
`limpiarStorage()` seguido de `location.reload()` (app.js:2069), es decir, siempre fuerza un DOM
completamente nuevo. Tras el reload, el único call site que se ejecuta es el #3 (`inicializar()`)
o, si no queda torneo activo, el usuario vuelve a `screen-competicion` y eventualmente dispara el
#1. Como no hay estado de JS ni `documentElement.style` sobreviviendo al reload, este flujo no
puede dejar variables CSS heredadas — se señala explícitamente en vez de asumirlo en silencio,
tal como pidió la revisión.

**Riesgo real de variables heredadas**: el único call site que puede ejecutarse dos veces **en el
mismo DOM, sin reload, con competiciones distintas** es el #2 (importar JSON). Ejemplo: el usuario
tiene un torneo Champions activo (paleta Champions ya aplicada inline sobre `:root`), sin torneo
activo global no es alcanzable mientras haya uno cargado, pero si importa un archivo `.json` de un
torneo de Mundial exportado previamente, `estado.competicion` cambia a `'mundial'` y se llama
`aplicarPaletaCompeticion('mundial')` sobre el mismo DOM — hoy esto solo hace `setProperty()` de
`--red/--blue/--green/--gold` de Mundial, pero como Mundial sí define las 4, este caso puntual ya
queda bien cubierto. El caso que sí falla hoy es el inverso: importar un JSON de Champions
mientras el `:root` trae inline el `--green` de un torneo Mundial previo — `--green` de Mundial
queda inline y nunca se limpia, porque Champions no lo define en `paletaCSS` y `aplicarPaletaCompeticion` no toca lo que no está en el objeto.

**Decisión**: `aplicarPaletaCompeticion()` pasa a iterar sobre una lista canónica y fija de
variables (`['--red', '--blue', '--green', '--gold']`, definida una sola vez en `competiciones.js`,
no en cada competición) y, para cada una, aplica `comp.paletaCSS[variable]` si existe o un valor de
fallback documentado si no. Esto cubre los tres call sites con el mismo código (no hace falta
tocarlos individualmente — el fix vive dentro de la función, no en sus llamadores) y dejaría
determinístico incluso el caso hipotético de una tercera competición futura que omita otra
variable.

**Rationale**: un único punto de cambio (la función), consistente con Principio II/IV (la lógica de
"qué pasa si falta una variable" es de la capa de competición, no del motor, y no depende de cuál
llamador la disparó). No requiere tocar `motor.js` ni ningún call site.

**Alternativas consideradas**:
- *Opción (a) del clarify* (que Champions defina su propio `--green` explícito): rechazada por el
  clarify — contradice la decisión ya cerrada de que `--green` no tiene rol de marca en Champions.
- Resetear a `removeProperty()` en vez de un fallback explícito: dejaría `--green` cayendo al valor
  hardcodeado de Mundial en `:root` de `styles.css` (que sigue siendo el fallback real del
  navegador) — mismo resultado que el fallback explícito propuesto, pero implícito e indocumentado.
  Se prefiere el fallback explícito en `competiciones.js` porque queda auditable en el mismo lugar
  que el resto de la configuración de paleta, sin depender de que nadie recuerde que `:root` en
  `styles.css` funciona como "fallback secreto".

## 2. Fallback de `--green`

**Decisión**: el fallback canónico de `--green` es `#00a64e` (el valor funcional ya usado en toda
la app para "fase de grupos / éxito", ver DESIGN.md — "Verde Fase de Grupos"). Se define una sola
vez, no por competición, en una constante `FALLBACK_PALETA` (o similar) dentro de
`competiciones.js`, y `aplicarPaletaCompeticion()` la usa para cualquier variable que una
competición no defina explícitamente en su `paletaCSS`.

**Rationale**: evita duplicar el mismo valor si en el futuro una tercera competición tampoco define
`--green` — un solo punto de verdad para el fallback, igual que Mundial y Champions son un solo
punto de verdad para sus propios colores.

## 3. Estructura de `COMPETICIONES.champions`

Mismo shape que `COMPETICIONES.mundial` (`data-model.md` de spec 001, sin cambios de esquema):

- `poolEquipos`: los 20 clubes ya acordados en el clarify (spec.md FR-003).
- `paletaCSS`: `{ '--red': '#e63946', '--blue': '#0e1e5b', '--gold': '#c0c4cc' }` — sin `--green`
  (por diseño, ver punto 2) y **sin variable de negro/fondo** (decisión cerrada explícitamente en
  la sesión de clarify "revisión de gaps de plan.md", spec.md — ver también data-model.md,
  "Decisión: el fondo no es parte de paletaCSS"). El negro `#0a0e14` mencionado en el primer
  clarify de paleta quedó descartado: `VARIABLES_PALETA` no incluye fondo, ni para Mundial
  (`#07090f`) ni para Champions — es un fondo fijo de `:root` en `styles.css`, compartido por todas
  las competiciones y controlado solo por el tema claro/oscuro. No se agrega una 5ª variable de
  paleta ni se aplica `#0a0e14` en ningún punto del código.
- `textos`: auditado contra las claves ya usadas por Mundial (`tituloTorneoDefault`,
  `textoAsignarEquipos`, `tituloSorteoEquipos`, `subtituloSorteoEquipos`, `nombreExportDefault`,
  `nombreResumenDefault`) — las 6 claves son genéricas de flujo (asignar equipos, sorteo, export,
  resumen), ninguna es específica de un formato de competición distinto; **no hacen falta campos
  nuevos**. Se completan con textos análogos ("TORNEO CHAMPIONS", "Elige cómo asignar los clubes de
  {NOMBRE}", "SORTEANDO CLUBES", "Asignando clubes de {NOMBRE}...", `champions`, `Torneo
  Champions`).
- `formatoDefault`: `{ grupos: 'ida_vuelta', eliminacion: 'ida_vuelta', penales: true }` (D3 ya
  cerrado en la constitución; `penales: true` reproduce el mismo default que Mundial, no hay
  decisión pendiente sobre penales en Champions).

## 4. Verificación contra `motor.js` (Principio II)

Verificado por lectura completa de `motor.js` (270 líneas) y por grep:
`grep -inE "mundial|champions|fc ?26|EQUIPOS_POOL|COMPETICIONES" motor.js` → 0 resultados fuera del
comentario que documenta la propia regla.

Las cuatro funciones del motor (`generarCalendarioGrupos`, `calcularPosiciones`,
`generarPartidosEliminacion`, `avanzarEliminacion`) y el helper `nombreDeRonda` operan
exclusivamente sobre `jugadoresIds`, `grupos`, `partidos` y los parámetros de formato
(`formatoGrupos`, `formatoEliminacion`, `configFormato.penales`) ya genéricos desde spec 001.
Ninguno asume una cantidad de equipos ni un pool específico — `generarCalendarioGrupos` funciona
igual con 15 selecciones o con 20 clubes, y `NOMBRES_RONDAS` ya es una tabla por potencia de 2
(2/4/8/16/32), no por competición.

**Conclusión**: `motor.js` no requiere ningún cambio para soportar Champions League. No se
encontró ningún caso donde hiciera falta tocarlo — se señala explícitamente esta conclusión
(en vez de asumirla) porque fue un punto de verificación pedido, no derivado de spec 001.

## 5. Pulido de `screen-competicion` para 2+ opciones

`inicializarSeleccionCompeticion()` (app.js:203-218) **ya itera sobre `Object.values(COMPETICIONES)`**
— no asume una sola entrada, no requiere cambio de estructura de datos para soportar N
competiciones. El gap es puramente visual, en dos frentes concretos detectados por lectura de
`styles.css`/`index.html`:

1. **Layout de una sola columna sin importar el ancho** (`index.html:75`,
   `#lista-competiciones.space-y-3`; `styles.css:362-394`, sin ninguna regla `@media` para
   `.competicion-card`): con 2+ competiciones, en desktop (≥1024px, breakpoint ya establecido por
   spec 001, `styles.css:1390`) esto se ve como una columna angosta apilada en vez de aprovechar el
   ancho — exactamente lo que CLAUDE.md prohíbe ("desktop no es mobile estirado"). **Cambio**:
   agregar grid de 2 columnas desde el breakpoint tablet (`min-width: 640px`) para
   `#lista-competiciones` cuando hay 2+ tarjetas.
2. **Color de acento hardcodeado a `--gold` global, no a la paleta de cada competición**
   (`app.js:212`, ícono con clase fija `text-gold`; `styles.css:378-383`, hover/focus con
   `border-color: var(--gold)`): antes de elegir una competición no hay ninguna "activa", por lo
   que las variables CSS globales (`--red/--blue/--green/--gold`) reflejan la paleta de lo último
   cargado (o el default de Mundial en `:root`) — **no** la paleta propia de cada tarjeta. Con dos
   competiciones reales, esto hace que ambas tarjetas se vean con el mismo dorado de Mundial sin
   importar cuál sea Champions, violando FR-005 ("cada una identificable por su propia paleta").
   **Cambio**: cada tarjeta aplica su acento vía una custom property local (ej.
   `style="--card-accent: {comp.paletaCSS['--gold'] || fallback}"`, leída directamente de
   `comp.paletaCSS` al construir el botón en `inicializarSeleccionCompeticion()`) en vez de heredar
   `var(--gold)` global — así el color de cada tarjeta es fijo a su propia competición,
   independiente de qué paleta esté activa en `:root` en ese momento.

**Rationale**: ambos cambios son consecuencia directa de que hoy solo existía una competición — el
código nunca tuvo que distinguir tarjetas entre sí. No es un cambio de estructura de datos (ya era
genérico), es CSS/HTML nuevo más una lectura directa de `comp.paletaCSS` en el render de cada
tarjeta.

## 6. Deuda técnica de naming (color literal vs. rol) — fuera de alcance

Ya resuelto en el clarify (spec.md, Assumptions): las variables `--red/--blue/--green/--gold`
seguirán nombradas por color literal, no por rol funcional, en esta spec. Se referencia acá
únicamente para que quede trazado en la cadena spec → research → plan, sin reabrir la discusión:
`competiciones.js` para Champions asigna un valor de plata a la variable `--gold`, lo cual es
intencional y ya aceptado (FR-004), no un bug a resolver en spec 002.

## 7. Los 66 `rgba()` hardcodeados de `styles.css` (FR-010, SC-004)

Detectado al preparar `tasks.md`: `grep -cE "rgba\((201,168,76|224,24,45|0,82,200|0,166,78)" styles.css`
→ **66 resultados**. Son literales de color fijo (bordes translúcidos, fondos translúcidos,
box-shadows, glows) con los valores RGB exactos de Mundial (`201,168,76`=dorado,
`224,24,45`=rojo, `0,82,200`=azul, `0,166,78`=verde) que **no referencian**
`var(--red/--blue/--green/--gold)` en absoluto — están fuera del alcance de
`aplicarPaletaCompeticion()` (research.md §1) incluso después del fix de determinismo, porque no
son la variable, son un valor de color independiente escrito directamente en la regla CSS.

**Impacto concreto**: `.glow-gold` (`styles.css:1239-1241`, el brillo animado detrás de "CAMPEÓN"
en la pantalla de campeón) usa `text-shadow: ... rgba(201,168,76,0.9) ...` — con Champions activo,
el texto "CAMPEÓN" se ve en plata (`var(--gold)` correctamente aplicado por FR-004), pero el glow
detrás sigue siendo dorado de Mundial. Mismo patrón en botones, standings, bracket, toasts,
info-cards, focus rings — sin corregirlo, SC-004 ("100% de las pantallas... reflejan la paleta de
Champions") queda incumplido en la práctica aunque los colores sólidos ya estén correctos.

Las variables `--red-dim`/`--blue-dim`/`--green-dim`/`--gold-dim`/`--gold-light` de `:root`
(`styles.css:9-20`) tienen el mismo problema — hoy son hex hardcodeado, no fórmulas sobre las
variables base, así que tampoco cambian con la competición activa.

**Decisión** (spec.md, clarify "revisión de gaps de tasks.md"): remediación completa. Los 66
literales, y las 5 variables `-dim`/`-light` de `:root`, pasan a definirse con
`color-mix(in srgb, var(--rol) X%, transparent)` (mismo porcentaje de alpha que el valor
original) — una fórmula CSS, no un valor fijo, por lo que se actualizan solos al cambiar
`--red/--blue/--green/--gold` vía `aplicarPaletaCompeticion()`, sin lógica nueva en JS.

**Alternativas consideradas**:
- *Cálculo hex→rgba en JS* (que `aplicarPaletaCompeticion()` calcule y aplique cada variante
  `-dim`/`-light`/`-glow` como custom property adicional): compatible con navegadores más viejos,
  pero agrega una conversión hex→rgb + gestión de N variantes por color en `competiciones.js`,
  duplicando en JS una responsabilidad que hoy es puramente de CSS. Rechazada por complejidad
  innecesaria dado que `color-mix()` ya cubre el target platform declarado salvo una franja de
  versiones específica (ver compatibilidad abajo).
- *Acotar SC-004 a colores sólidos* (dejar los 66 `rgba()` como deuda técnica, sin tocar): evita el
  trabajo pero deja la pantalla de campeón (el momento de mayor peso emocional de la app, per
  DESIGN.md) con un glow visiblemente incorrecto para Champions. Rechazada — spec.md ya reescribió
  SC-004 para exigir cobertura completa (incluidos derivados translúcidos/glow) en vez de aceptar
  esta brecha en silencio.

**Compatibilidad de `color-mix()`**: sin soporte en Safari/iOS < 16.2 (dic. 2022) — CLAUDE.md fija
el mínimo del proyecto en iOS 15+, por lo que hay una franja real sin soporte. Una declaración CSS
con un valor `color-mix()` no reconocido se descarta por completo (no rompe el parseo del resto de
la hoja de estilos, ni el layout, ni la funcionalidad — la propiedad puntual cae a su valor
inicial/heredado, ej. sin `box-shadow` visible en ese elemento). **Decisión**: degradación aceptada
explícitamente para iOS 15/16.0/16.1 (spec.md FR-010/SC-004) — se pierde el efecto
translúcido/glow puntual en esas versiones, nunca un color incorrecto ni una falla funcional. No
se re-testea contra iOS real como parte de esta spec (fuera de los recursos de validación
disponibles); queda documentado como limitación conocida, no como bug pendiente.

## Technical Context (resumen para plan.md)

Sin incógnitas nuevas respecto a spec 001 en cuanto a stack/storage/plataforma. El elemento técnico
nuevo de mayor alcance es la reescritura de los 66 `rgba()` + 5 variables `-dim`/`-light` de
`styles.css` a fórmulas `color-mix()` (punto 7) — es CSS puro, sin dependencias nuevas ni build
step, pero es el cambio de mayor superficie de esta spec en términos de líneas tocadas. Junto con
el determinismo de `aplicarPaletaCompeticion()` (punto 1) y las adiciones de datos ya descritas,
no cambia lenguaje, dependencias, storage, plataforma objetivo ni metas de performance — sí
introduce una dependencia de feature CSS (`color-mix()`) con degradación aceptada explícitamente
documentada para el extremo inferior del rango de compatibilidad ya declarado (iOS 15+).
