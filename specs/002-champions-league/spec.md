# Feature Specification: Champions League (Copa Panas v2)

**Feature Branch**: `002-champions-league`

**Created**: 2026-08-27

**Status**: Draft

**Input**: User description: "Agregar Champions League como segunda competición seleccionable en Copa Panas v2. Sobre la base de spec 001 ya completa (motor.js desacoplado de tema/competición, competiciones.js con COMPETICIONES.mundial como único ejemplo hoy): sumar una nueva entrada a COMPETICIONES para Champions League sin tocar motor.js, y pulir la pantalla de selección de competición (screen-competicion) para el caso de 2+ opciones disponibles. Debe respetar constitution.md (D1-D4, Principios I-VI): el motor de torneo no referencia constantes de competición específica, paleta visual propia para Champions con punto de partida negro/plata/azul UEFA, cero emojis, mobile-first pero también desktop."

## Clarifications

### Session 2026-08-27

- Q: ¿Qué lista fija de clubes debe tener el pool de Champions League? → A: Lista fija de 20 clubes reconocibles y habituales de Champions (mismo patrón que las 15 selecciones fijas de Mundial): Real Madrid, Barcelona, Bayern Múnich, Manchester City, Manchester United, Liverpool, Chelsea, Arsenal, Tottenham, Paris Saint-Germain, Juventus, AC Milan, Inter de Milán, Napoli, Atlético de Madrid, Borussia Dortmund, Ajax, Porto, Benfica, Sevilla.
- Q: ¿El pool de jugadores reutilizable entre torneos (D4) se resuelve dentro de spec 002, o se difiere a una spec futura dedicada? → A: Se difiere a una spec futura dedicada — D4 es transversal a todas las competiciones y no bloquea sumar Champions League.
- Q: ¿Qué valores hex concretos debe usar la paleta de Champions League (base negro/plata/azul UEFA)? → A: Negro `#0a0e14`, Azul UEFA `#0e1e5b` (rol `--blue`), Plata `#c0c4cc` (rol `--gold`), Rojo de acento `#e63946` (rol `--red`); el rol `--green` se omite del esquema de Champions por no tener asociación cromática ni uso funcional requerido por D2/D3.
- Q: ¿El pulido visual de `screen-competicion` para 2+ opciones entra en el alcance de spec 002? → A: Sí, dentro de spec 002 — ya está explícito en el objetivo original y en User Story 3; separarlo dejaría la pantalla sin dueño claro.

### Session 2026-08-27 (revisión técnica pre-plan)

Gap técnico detectado al revisar `aplicarPaletaCompeticion()` en `competiciones.js` contra las
decisiones ya cerradas arriba — no reabre esas decisiones (pool de clubes, D4, hex de paleta,
alcance de `screen-competicion`), resuelve cómo se implementan sin comportamiento implícito.

- Q: `aplicarPaletaCompeticion()` solo aplica `setProperty()` sobre las variables presentes en
  `paletaCSS` y nunca resetea las ausentes — como Champions omite `--green`, un torneo Champions
  creado después de un torneo Mundial en la misma sesión heredaría el `--green` inline que dejó
  Mundial, y una carga fresca de página caería en el `--green` hardcodeado de `:root` en
  `styles.css` (que es el de Mundial). ¿Cómo debe resolverse para que el resultado sea
  determinístico y no dependa de qué competición estaba cargada antes? → A: Opción (b) —
  `aplicarPaletaCompeticion()` pasa a resetear siempre el conjunto completo de variables conocidas
  (`--red`, `--blue`, `--green`, `--gold`), usando el valor de la competición cuando lo define, y un
  fallback documentado cuando no. Para `--green` puntualmente, el fallback es el verde funcional ya
  usado en toda la app para "fase de grupos / éxito" (`#00a64e`, ver DESIGN.md — "Verde Fase de
  Grupos" es un rol semántico compartido entre pantallas, no una decisión de marca por competición),
  así que Champions no necesita definir su propio `--green`: simplemente no lo sobreescribe y el
  fallback documentado lo resuelve de forma explícita, no por herencia accidental de estado previo.
- Q: Las variables CSS reales (`--red`, `--blue`, `--green`, `--gold`) están nombradas por color
  literal, pero el proyecto documenta "La Regla del Color con Rol" (DESIGN.md: Azul Setup, Dorado
  Trofeo, Verde Grupos, Rojo Eliminación) — y la paleta de Champions le asigna a `--gold` un valor de
  plata, por lo que el nombre de la variable deja de describir su contenido. ¿Conviene aprovechar
  spec 002 para renombrar las variables por rol (ej. `--color-setup`, `--color-trofeo`,
  `--color-grupos`, `--color-eliminacion`)? → A: No, no en esta spec. El renombrado tocaría más de 80
  referencias en `styles.css`/`index.html`/`app.js` sin cambiar comportamiento ni ser requisito para
  sumar Champions League — es un refactor de naming, no parte del objetivo de esta spec (agregar una
  competición). Se documenta explícitamente como deuda técnica para una spec futura (ver Assumptions)
  en vez de dejarse en silencio.

### Session 2026-08-27 (revisión de gaps de plan.md — negro de Champions)

- Q: El clarify original (Session 2026-08-27, primera entrada de paleta) fijó un "negro `#0a0e14`"
  para Champions, pero `VARIABLES_PALETA`/`paletaCSS` solo cubren `--red`/`--blue`/`--green`/`--gold`
  — no existe una variable de fondo en ese esquema (`competiciones.js` de Mundial tampoco define su
  propio negro ahí; el fondo vive en `--bg`/`--bg-mid`/`--bg-card` de `:root`, controlados por el
  toggle de tema claro/oscuro, no por competición — ver DESIGN.md, "Cancha Negra" está clasificada
  como color Neutral, no como identidad de marca por competición). ¿El negro de Champions se agrega
  como una 5ª variable a `VARIABLES_PALETA` con su propio fallback, o se descarta como parte de
  `paletaCSS` y el fondo queda global? → A: Se descarta como parte de `paletaCSS` (opción b). El
  fondo oscuro (`--bg`/`--bg-mid`/`--bg-card`) sigue siendo compartido por todas las competiciones,
  controlado únicamente por el tema claro/oscuro (Principio VI ya establecido en spec 001), igual
  que ya ocurre con el negro `#07090f` de Mundial — que tampoco es parte de su `paletaCSS` hoy.
  Champions no necesita un fondo propio para diferenciarse: su identidad visual queda dada por
  `--red`/`--blue`/`--gold` (los tres roles de acento — acción, acento, logro/plata) sobre el mismo
  fondo neutro que usa toda la app. El valor `#0a0e14` mencionado en el clarify original queda
  descartado — no se implementa como variable nueva ni se aplica en ningún lugar.

### Session 2026-08-27 (revisión de gaps de tasks.md — 66 rgba() hardcodeados)

- Q: `styles.css` tiene 66 literales `rgba(R,G,B,alpha)` con los valores RGB exactos de Mundial
  (glows, sombras, fondos translúcidos, bordes con transparencia — incluido `.glow-gold` de la
  pantalla de campeón) que nunca referencian `var(--red)`/`var(--blue)`/`var(--green)`/`var(--gold)`
  — `aplicarPaletaCompeticion()` no puede corregirlos aunque ya sea determinístico (FR-004a), porque
  no son la variable, son un color fijo aparte. Sin corregirlos, SC-004 ("100% de las pantallas...
  reflejan la paleta de Champions") no se cumple literalmente: el glow de la pantalla de campeón,
  por ejemplo, se vería dorado de Mundial aunque el texto ya esté en plata de Champions.
  ¿Se remedian los 66 casos, se acota SC-004 a los usos sólidos de las variables, o se remedia solo
  un subconjunto de alto impacto visual? → A: Remediación completa. Los 66 literales se reemplazan
  por `color-mix(in srgb, var(--rol) X%, transparent)` (mismo porcentaje de alpha que el rgba
  original), definido como fórmula en `styles.css` — no como valor fijo. Esto también resuelve de
  paso las variables `--red-dim`/`--blue-dim`/`--green-dim`/`--gold-dim`/`--gold-light` de `:root`
  (hoy hex hardcodeado, pasan a ser fórmulas `color-mix()` sobre las variables base), por lo que se
  actualizan automáticamente al cambiar de competición sin que `aplicarPaletaCompeticion()` necesite
  tocarlas — son CSS puro, no JS.
- Q: `color-mix()` no tiene soporte en Safari/iOS anteriores a 16.2 (dic. 2022), y CLAUDE.md fija el
  mínimo soportado del proyecto en iOS 15+. En esas versiones, una declaración con `color-mix()`
  como valor se descarta por completo (la propiedad cae a su valor inicial/heredado — sin sombra o
  sin fondo translúcido en ese elemento puntual, no un color incorrecto ni un layout roto). ¿Se
  acepta esa degradación, se reemplaza `color-mix()` por un cálculo hex→rgba hecho en JS dentro de
  `aplicarPaletaCompeticion()`, o se vuelve a acotar SC-004 para evitar el problema? → A: Se acepta
  la degradación en iOS 15/16.0/16.1 — pierden el efecto translúcido/glow puntual (no el color
  sólido, no la funcionalidad, no el layout) en esas versiones específicas, documentado
  explícitamente como limitación conocida en vez de re-testearse contra iOS real o reemplazar el
  mecanismo por JS. El resto de la paleta (colores sólidos vía `var(--red/--blue/--green/--gold)`,
  ya establecidos desde spec 001) no depende de `color-mix()` y funciona igual en todas las
  versiones soportadas.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Elegir Champions League al crear un torneo (Priority: P1)

Un usuario sin torneo activo abre la app, llega a la pantalla de selección de competición y ahora
ve dos opciones (Mundial y Champions League) en vez de una. Elige Champions League y continúa el
flujo de creación de torneo (asignación de jugadores, formato, sorteo) igual que ya funciona para
Mundial, pero con el pool de clubes, la paleta y los textos propios de Champions.

**Why this priority**: Es el objetivo central de la spec — sin esto no hay segunda competición
real, solo una entrada de datos sin efecto visible para el usuario.

**Independent Test**: Con localStorage vacío (sin torneo activo), abrir la app, ver la pantalla de
selección de competición con Champions League como opción, seleccionarla, completar el flujo de
creación hasta llegar a un torneo activo, y verificar que el pool de equipos ofrecido y la paleta
visual corresponden a Champions, no a Mundial.

**Acceptance Scenarios**:

1. **Given** no hay torneo activo, **When** el usuario abre la pantalla de selección de
   competición, **Then** ve Mundial y Champions League como opciones distinguibles entre sí.
2. **Given** el usuario está en la pantalla de selección de competición, **When** elige Champions
   League, **Then** el flujo de creación de torneo continúa usando el pool de clubes y el formato
   sugerido por defecto de Champions (ver D3: ida/vuelta en grupos y eliminación).
3. **Given** un torneo de Champions League activo, **When** el usuario navega por cualquier
   pantalla del torneo (tabla de posiciones, calendario, bracket, pantalla de campeón), **Then**
   toda la interfaz usa la paleta de Champions, no la paleta de Mundial.

---

### User Story 2 - Formato de Champions editable como cualquier competición (Priority: P2)

El usuario que crea un torneo de Champions League ve el formato sugerido por defecto (ida/vuelta en
grupos y eliminación, según D3) pero puede cambiarlo antes de confirmar, exactamente igual que ya
puede hacerlo con Mundial.

**Why this priority**: Ya es una capacidad genérica del motor (Principio IV); esta historia
verifica que agregar Champions no la rompe ni la condiciona por nombre de competición.

**Independent Test**: Crear un torneo eligiendo Champions League, cambiar el formato sugerido antes
de confirmar, y verificar que el torneo resultante respeta el formato elegido por el usuario, no el
sugerido.

**Acceptance Scenarios**:

1. **Given** el usuario eligió Champions League, **When** llega a la pantalla de configuración de
   formato, **Then** ve preseleccionado ida/vuelta en grupos y eliminación, editable.
2. **Given** el usuario cambia el formato sugerido de Champions a partido único, **When** confirma
   la creación del torneo, **Then** el torneo se genera con partido único, sin que el motor
   requiera conocer que la competición es Champions.

---

### User Story 3 - Pantalla de selección de competición con 2+ opciones (Priority: P2)

Con Champions League sumada, la pantalla de selección de competición deja de tener un único ítem y
pasa a tener que presentar y diferenciar visualmente dos o más competiciones de forma clara, sin
que ninguna se vea como la opción "por defecto" o la única soportada.

**Why this priority**: Spec 001 dejó esta pantalla en estado funcional-mínimo (un solo ítem
esperado); sin este ajuste, la pantalla puede verse incompleta o rota con dos opciones reales.

**Independent Test**: Con Mundial y Champions League ambas registradas en COMPETICIONES, abrir la
pantalla de selección y verificar que ambas tarjetas/opciones se presentan con igual jerarquía
visual, cada una con su propia identidad (nombre, paleta, ícono), en mobile y en desktop.

**Acceptance Scenarios**:

1. **Given** COMPETICIONES tiene dos entradas, **When** se renderiza la pantalla de selección,
   **Then** ambas opciones son igualmente accesibles y reconocibles, sin jerarquía de "principal
   vs. secundaria" no intencional.
2. **Given** la pantalla de selección en un viewport de escritorio ancho, **When** hay dos o más
   competiciones, **Then** el layout aprovecha el espacio disponible en vez de mostrar una columna
   angosta centrada (ver CLAUDE.md, sección responsive).

---

### Edge Cases

- ¿Qué pasa si el usuario intenta llegar a la pantalla de selección de competición con un torneo
  Champions ya activo? (Debe seguir bloqueado por D1, igual que con Mundial — sin excepción por
  competición.)
- ¿Cómo se comporta el sorteo aleatorio de clubes si el pool de Champions tiene menos jugadores que
  clubes disponibles, o más jugadores que clubes? (Mismo comportamiento ya definido para Mundial —
  D2 no introduce mecanismo nuevo por competición.)
- ¿Qué referencia visual usa la pantalla de campeón para Champions, dado que su modal actual referencia el trofeo/estética de Mundial? Debe adaptarse a la paleta e identidad de Champions sin depender de textos o assets fijos de Mundial.
- ¿Qué paleta se ve si, en la misma sesión de navegador, el usuario finaliza un torneo de Mundial y
  arranca uno de Champions (o viceversa) sin recargar la página? La paleta resultante DEBE
  corresponder siempre a la competición recién elegida, sin colores heredados del torneo anterior
  (ver FR-004a).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema DEBE agregar `COMPETICIONES.champions` como nueva entrada de
  configuración de competición, sin modificar `motor.js`.
- **FR-002**: La entrada de Champions DEBE incluir: nombre e identidad de la competición, pool de
  equipos/clubes disponibles para asignación, paleta de color propia, y formato sugerido por
  defecto (ida/vuelta en grupos y eliminación, según D3).
- **FR-003**: El pool de equipos de Champions League DEBE ser esta lista fija de 20 clubes: Real
  Madrid, Barcelona, Bayern Múnich, Manchester City, Manchester United, Liverpool, Chelsea,
  Arsenal, Tottenham, Paris Saint-Germain, Juventus, AC Milan, Inter de Milán, Napoli, Atlético de
  Madrid, Borussia Dortmund, Ajax, Porto, Benfica, Sevilla.
- **FR-004**: La paleta visual de Champions League DEBE usar: `--blue` `#0e1e5b` (azul UEFA),
  `--gold` `#c0c4cc` (plata, reemplaza el rol dorado), `--red` `#e63946` (acento). El rol `--green`
  se omite del esquema de Champions — no se define ni se reutiliza. El fondo oscuro de la app
  (`--bg`/`--bg-mid`/`--bg-card`) NO es parte de la paleta por competición — es compartido por
  todas las competiciones y varía solo con el tema claro/oscuro, igual que ya ocurre hoy con
  Mundial (ver Clarifications, sesión "revisión de gaps de plan.md").
- **FR-004a**: La aplicación de paleta al cambiar de competición (`aplicarPaletaCompeticion()`)
  DEBE ser determinística: resetea siempre el conjunto completo de variables conocidas
  (`--red`, `--blue`, `--green`, `--gold`) en cada cambio de competición, sin dejar valores
  heredados de una competición cargada previamente en la misma sesión. Para cualquier variable que
  una competición no defina (ej. `--green` en Champions), DEBE aplicarse el valor de fallback
  documentado en `competiciones.js` en vez de dejar la variable sin tocar.
- **FR-005**: La pantalla de selección de competición DEBE presentar Mundial y Champions League con
  igual jerarquía visual, cada una identificable por su propia paleta y nombre, en mobile y
  desktop.
- **FR-006**: El motor de torneo (`motor.js`) NO DEBE requerir cambios, referencias nuevas, ni
  ramas condicionales por nombre de competición para soportar Champions League (Principio II).
- **FR-007**: El sistema DEBE permitir editar el formato sugerido de Champions League antes de
  confirmar la creación del torneo, igual que para Mundial (Principio IV, D3).
- **FR-008**: El bloqueo de acceso a la pantalla de selección de competición mientras haya un
  torneo activo (D1) DEBE aplicar igual sin importar qué competición esté activa.
- **FR-009**: Cero emojis en cualquier texto o elemento de interfaz introducido para Champions
  League — solo Font Awesome o SVG inline, igual que el resto de la app.
- **FR-010**: Los tonos derivados de la paleta (fondos translúcidos, sombras, glows — hoy 66
  literales `rgba()` hardcodeados en `styles.css` con los valores exactos de Mundial) DEBEN
  derivarse de `--red`/`--blue`/`--green`/`--gold` mediante fórmula CSS (`color-mix()`), no quedar
  fijos, para que cambien junto con la paleta activa sin intervención de `aplicarPaletaCompeticion()`.
  En navegadores sin soporte de `color-mix()` (Safari/iOS < 16.2), la degradación aceptada es perder
  el efecto translúcido/glow puntual en ese elemento — nunca un color incorrecto ni una falla de
  layout o funcionalidad (ver Clarifications, sesión "revisión de gaps de tasks.md").

### Key Entities *(include if feature involves data)*

- **Competición (Champions)**: nueva instancia dentro de la estructura `COMPETICIONES` ya
  establecida por spec 001 — nombre, paleta, pool de equipos, textos del flujo de asignación,
  formato sugerido por defecto. No introduce una entidad nueva a nivel de esquema, reutiliza la
  forma ya definida por `COMPETICIONES.mundial`.
- **Torneo (activo)**: sin cambios de estructura — sigue siendo la única instancia activa
  (Principio V / D1), ahora simplemente puede originarse desde Champions en vez de solo Mundial.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un usuario puede crear un torneo completo de Champions League de punta a punta
  (selección de competición → asignación de jugadores → formato → torneo activo) sin encontrar
  ningún texto, color o comportamiento heredado de Mundial por error.
- **SC-002**: `motor.js` no cambia una sola línea como parte de esta spec — verificable por diff de
  git antes/después de la implementación.
- **SC-003**: La pantalla de selección de competición, con dos opciones activas, se percibe como
  completa y balanceada (no como "una opción principal y un placeholder") en una revisión visual en
  mobile y en desktop.
- **SC-004**: 100% de las pantallas visitables dentro de un torneo de Champions League activo
  (tabla, calendario, bracket, campeón, config) reflejan la paleta de Champions, no la de Mundial —
  incluidos acentos sólidos y derivados translúcidos/glow (FR-010), en navegadores con soporte de
  `color-mix()`. En Safari/iOS < 16.2, los acentos sólidos reflejan igual la paleta de Champions;
  los efectos translúcidos/glow puntuales pueden perderse (degradación aceptada, no color
  incorrecto) sin que cuente como incumplimiento de este criterio.

## Assumptions

- Champions League usa el mismo mecanismo D2 de asignación de equipo/jugador que Mundial (aleatorio
  con sorteo animado, o manual vía dropdown) — no se introduce un tercer mecanismo.
- El alcance de esta spec es exclusivamente sumar Champions League como segunda competición y pulir
  `screen-competicion` para 2+ opciones; no incluye una tercera competición.
- D4 (pool de jugadores reutilizable entre torneos) queda explícitamente fuera de alcance de esta
  spec — se resuelve en una spec futura dedicada, ya que es transversal a todas las competiciones
  y no bloquea sumar Champions League.
- La lista fija de 20 clubes (FR-003) usa nombres reconocibles y habituales de Champions, siguiendo
  el mismo patrón que las 15 selecciones fijas de Mundial — no representa la nómina real de una
  edición específica del torneo y puede requerir ajuste si algún club deja de ser reconocible con
  el tiempo (fuera de alcance mantenerlo actualizado automáticamente).
- **Deuda técnica documentada, fuera de alcance de esta spec**: las variables CSS de paleta
  (`--red`, `--blue`, `--green`, `--gold`) están nombradas por color literal, no por rol funcional
  ("La Regla del Color con Rol", DESIGN.md), y la paleta de Champions le asigna a `--gold` un valor
  de plata — el nombre de la variable deja de describir su contenido para esa competición. No se
  renombra en spec 002 por alcance/costo (>80 referencias en `styles.css`/`index.html`/`app.js` sin
  cambio de comportamiento). Queda pendiente para una spec futura de refactor de naming.
