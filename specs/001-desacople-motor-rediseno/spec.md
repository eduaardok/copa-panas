# Feature Specification: Desacople de motor y rediseño visual (Copa Panas v2)

**Feature Branch**: `001-desacople-motor-rediseno`

**Created**: 2026-08-24

**Status**: Draft

**Input**: User description: "Refactor de la app existente (Torneo Amigos FC 26) para desacoplar el motor de torneo de la capa de tema/competición, y aplicar en el mismo paso el rediseño visual profundo definido para v2 — sin romper el flujo funcional actual del Mundial. Debe resultar en: un modelo de datos donde jugador.equipo, formato de torneo (partido único / ida-vuelta) y pool de equipos dejen de estar hardcodeados y pasen a ser configuración cargada según la competición elegida; una nueva pantalla de selección de competición, alcanzable solo cuando no hay torneo activo (D1); rediseño visual de toda la app con objetivo estético futbolero/gamer, respetando el Principio VI (Impeccable/Kowalski: restricción, propósito claro, transform/opacity, prefers-reduced-motion); paleta de Mundial se mantiene (negro/rojo/azul/verde/dorado) pero puede reestilizarse dentro de ese esquema; paleta de Champions fuera de alcance; el flujo funcional actual completo debe seguir funcionando igual para Mundial 2026 tras el refactor — cambia el look y la estructura interna, no el comportamiento ni los pasos del usuario; aplicar el mapa motor/tema de la constitución como punto de partida, re-verificando contra el código real. Fuera de alcance: implementar Champions League en sí (competición, pool de equipos, paleta propia)."

## Clarifications

### Session 2026-08-25

- Q: ¿La reutilización de pool de jugadores entre torneos (decisión D4 de la constitución: entidad `jugador` separada de `jugador_en_torneo`, clave `jugadores_conocidos`) está dentro del alcance de esta spec, o se deja para una spec posterior? → A: Fuera de alcance — se deja para una spec futura dedicada a D4.
- Q: ¿Los penales en empate de eliminación directa deben quedar como parámetro configurable dentro de esta spec (Configuración de formato), o siguen hardcodeados como hoy? → A: Configurable en esta spec — se agrega el toggle de penales sí/no a la Configuración de formato.
- Q: ¿Cómo debe el sistema distinguir un torneo guardado en formato previo al refactor (para FR-008) de uno en formato nuevo? → A: Campo de versión/esquema explícito (ej. `version`) en el estado guardado, en vez de inferir por ausencia del campo `competicion`.
- Q: ¿El requisito de que el rediseño visual soporte desktop (no solo mobile) debe fijarse en esta spec, dejando los breakpoints concretos para el plan técnico? → A: Sí — la spec exige comportamiento responsive con desktop no degradado; los breakpoints exactos se definen en `/speckit.plan`.

### Session 2026-08-25 (implementación, extensión del selector manual)

- Q: El selector manual de desempate ("Definir manualmente quién avanza") se implementó primero
  como fallback de última instancia solo para `configFormato.penales === false`. ¿Debe quedar
  disponible SIEMPRE en cualquier partido de eliminación con resultado empatado, sin importar el
  valor de `penales`? → A: Sí — disponible siempre. Caso de uso real: el cruce queda empatado (o
  no se completa) y uno de los jugadores cede el lugar por acuerdo, lesión, o cualquier motivo
  externo al sistema, incluso con `penales:true` activado. El sistema solo necesita registrar
  quién avanza, no imponer que la única vía de desempate con `penales:true` sea jugar penales.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Elegir competición antes de crear un torneo (Priority: P1)

Un usuario que abre la app sin ningún torneo activo ve primero una pantalla de selección de
competición. Hoy solo existe Mundial 2026 como opción funcional, pero la pantalla ya está
preparada para listar más competiciones en el futuro. Al elegir Mundial, continúa exactamente al
flujo de setup que ya conoce (nombre del torneo, logo, jugadores, equipos, formato).

**Why this priority**: Es el punto de entrada de toda la re-arquitectura. Sin esta pantalla no
hay forma de demostrar que el motor quedó desacoplado de la competición — es el primer lugar
donde el usuario percibe el cambio de v1 a v2.

**Independent Test**: Con localStorage vacío, abrir la app y verificar que aparece la pantalla de
selección de competición (no el setup directo de Mundial); elegir Mundial y verificar que el
flujo de setup arranca con los mismos pasos que en v1.

**Acceptance Scenarios**:

1. **Given** no hay torneo activo guardado, **When** el usuario abre la app, **Then** ve la
   pantalla de selección de competición con Mundial 2026 como opción disponible.
2. **Given** el usuario está en la pantalla de selección de competición, **When** elige Mundial
   2026, **Then** la app carga el pool de equipos, la paleta y los textos de Mundial, y avanza a
   la pantalla de setup inicial (nombre del torneo, logo, jugadores).
3. **Given** hay un torneo activo guardado (de cualquier fase), **When** el usuario abre la app,
   **Then** la pantalla de selección de competición NO es alcanzable — la app va directo al
   dashboard/pantalla correspondiente a la fase del torneo activo, igual que en v1.

---

### User Story 2 - Completar un torneo Mundial de punta a punta tras el refactor (Priority: P1)

Un usuario que ya usaba la app para organizar su Mundialito entre amigos completa el flujo
completo (setup, asignación de equipos, configuración de grupos, sorteo, fase de grupos,
clasificados, eliminación directa, campeón) después del refactor, sin notar cambios de
comportamiento — solo un aspecto visual distinto.

**Why this priority**: Es la garantía de no-regresión explícita del pedido: el refuerzo visual y
el desacople de datos no pueden romper ni un paso del flujo que ya funciona hoy en producción.

**Independent Test**: Ejecutar el flujo completo de un torneo de 8 jugadores (setup → asignación
→ grupos → sorteo → fase de grupos con resultados → clasificados → llave de eliminación →
campeón) y verificar que cada pantalla y cada regla de negocio (desempates, avance de bracket,
penales) produce el mismo resultado que en la versión previa al refactor.

**Acceptance Scenarios**:

1. **Given** un torneo Mundial recién confirmado con jugadores y equipos asignados, **When** el
   usuario configura grupos y realiza el sorteo, **Then** los grupos se arman según las mismas
   reglas de hoy (cabezas de grupo fijos, resto aleatorio).
2. **Given** partidos de fase de grupos con resultados cargados, **When** dos o más jugadores
   empatan en puntos, **Then** la tabla se ordena con los mismos criterios de desempate vigentes
   hoy (diferencia de gol, goles a favor, resultado directo).
3. **Given** una llave de eliminación directa en curso, **When** se completa un partido (incluido
   uno resuelto por penales), **Then** el ganador avanza a la siguiente ronda exactamente como en
   v1, y al completarse la final se muestra el campeón.
4. **Given** el usuario exporta el torneo a JSON e importa ese mismo archivo, **Then** el torneo
   se restaura completo, incluyendo la competición elegida y su configuración de formato.

---

### User Story 3 - Percibir una identidad visual distinta y coherente (Priority: P2)

Un usuario recorre toda la app (no solo pantallas nuevas) y percibe un diseño con identidad
propia — orientado a futboleros y gamers — en vez de una plantilla genérica de dashboard, dentro
de la paleta ya establecida de Mundial (negro/rojo/azul/verde/dorado). Las animaciones se sienten
intencionadas, nunca decorativas porque sí, y respetan su preferencia de movimiento reducido si la
tiene activada en su dispositivo.

**Why this priority**: Es el segundo objetivo explícito del pedido, pero depende de que el
desacople (US1, US2) esté resuelto primero — sin eso no hay una base de datos/configuración limpia
sobre la cual aplicar el nuevo estilo de forma consistente.

**Independent Test**: Recorrer cada pantalla del flujo (selección de competición, setup,
asignación de equipos, grupos, eliminación, dashboard, config) y verificar que todas comparten el
mismo lenguaje visual renovado, que ninguna pantalla quedó con el estilo anterior, y que con
`prefers-reduced-motion` activado las animaciones no esenciales se desactivan o reducen.

**Acceptance Scenarios**:

1. **Given** el usuario navega por cualquier pantalla del flujo de Mundial, **When** compara la
   apariencia entre pantallas, **Then** todas comparten la misma paleta, tipografía y lenguaje de
   componentes (cards, botones, tablas) del rediseño — ninguna quedó con el estilo previo.
2. **Given** el usuario tiene activada la preferencia de movimiento reducido en su sistema,
   **When** navega por la app, **Then** las animaciones no esenciales (efectos decorativos,
   transiciones grandes) se reducen o eliminan, mientras que el feedback funcional imprescindible
   (p. ej. confirmación de una acción) se sigue percibiendo.
3. **Given** una animación con propósito (p. ej. el sorteo de grupos o la confirmación de un
   resultado), **When** ocurre, **Then** se anima mediante transformación y opacidad, no mediante
   propiedades que fuerzan recálculo de layout.

---

### Edge Cases

- ¿Qué pasa si el usuario tenía un torneo Mundial guardado en localStorage con el formato de datos
  de v1 (sin campo de competición) y abre la app tras el refactor? La app debe reconocerlo como un
  torneo Mundial válido y seguir funcionando sin pedirle que reinicie ni perder su progreso.
- ¿Qué pasa si el usuario intenta llegar a la pantalla de selección de competición mientras hay un
  torneo activo (por ejemplo, editando la URL o navegando hacia atrás)? Debe ser redirigido a la
  pantalla correspondiente a la fase del torneo activo, nunca ver la selección de competición.
- ¿Qué pasa si el usuario reinicia el torneo desde Config? Debe llegar a la pantalla de selección
  de competición (no directo al setup de Mundial), según D1 de la constitución.
- ¿Qué pasa si el usuario exporta un torneo Mundial y lo importa en un dispositivo donde nunca
  usó la app? Debe reconstruirse el torneo completo, incluida la competición y su configuración
  de formato, sin requerir que el usuario vuelva a elegir la competición manualmente.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema MUST mostrar una pantalla de selección de competición cuando no exista
  un torneo activo, listando al menos Mundial 2026 como opción elegible.
- **FR-002**: El sistema MUST impedir el acceso a la pantalla de selección de competición mientras
  exista un torneo activo, redirigiendo a la pantalla correspondiente a la fase actual del torneo.
- **FR-003**: El sistema MUST derivar el pool de equipos disponibles para asignar a jugadores a
  partir de la configuración de la competición elegida, no de una constante fija del motor.
- **FR-004**: El sistema MUST derivar el formato del torneo (partido único o ida/vuelta tanto en
  fase de grupos como en eliminación directa, y si la eliminación directa usa penales en caso de
  empate) a partir de la configuración de la competición elegida, permitiendo que el usuario edite
  los tres parámetros antes de confirmar la creación del torneo.
- **FR-004a**: El sistema MUST ofrecer, en cualquier partido de eliminación directa con resultado
  empatado (partido único o marcador agregado en ida/vuelta), la opción de definir manualmente
  quién avanza — disponible siempre, independientemente del valor de `configFormato.penales`. Con
  `penales:false` es la única vía de desempate; con `penales:true` es una alternativa a jugar
  penales, para cubrir casos externos al sistema (acuerdo entre jugadores, lesión, etc.). El
  sistema únicamente registra la decisión, no impone cómo se llegó a ella.
- **FR-005**: El motor de cálculo (generación de calendario, tabla de posiciones y desempates,
  generación y avance de bracket de eliminación) MUST operar exclusivamente sobre estructuras de
  datos y el objeto de configuración de formato, sin referenciar nombres de competición, textos de
  interfaz, colores ni pools de equipos específicos.
- **FR-006**: El sistema MUST mantener sin cambios de comportamiento el flujo funcional completo
  de Mundial 2026 existente: setup, asignación de equipos, configuración de grupos, sorteo, fase
  de grupos, clasificados, armado de cruces, eliminación directa (incluyendo penales) y
  dashboard.
- **FR-007**: El sistema MUST seguir soportando exportar el estado completo del torneo a JSON e
  importarlo, incluyendo la competición elegida y su configuración de formato, de modo que el
  torneo se reconstruya de forma idéntica.
- **FR-008**: El sistema MUST reconocer y migrar sin pérdida de datos un torneo guardado con la
  estructura de localStorage previa al refactor, interpretándolo como un torneo de la competición
  Mundial. La detección MUST basarse en un campo explícito de versión/esquema en el estado
  guardado (los datos previos al refactor, al no tener ese campo, se tratan como versión anterior),
  no en inferir el formato por la presencia o ausencia de otros campos como `competicion`.
- **FR-009**: El sistema MUST aplicar el rediseño visual a la totalidad de las pantallas del flujo
  (selección de competición, setup, asignación de equipos, configuración de grupos, fase de
  grupos, clasificados, eliminación, dashboard, config), no solo a las pantallas nuevas.
- **FR-010a**: El rediseño visual MUST comportarse de forma responsive en al menos tres anchos de
  pantalla (mobile, tablet, desktop): mobile mantiene prioridad de diseño (touch targets ≥44px,
  `dvh`, sin zoom automático de Safari) y ningún ajuste de desktop MUST degradar la experiencia
  mobile actual; en desktop, componentes como la tabla de posiciones y el bracket MUST aprovechar
  el espacio disponible en vez de limitarse a centrar el layout mobile en una columna angosta. Los
  breakpoints exactos se definen en el plan técnico de esta feature.
- **FR-010**: El sistema MUST mantener el torneo Mundial dentro del esquema de color establecido
  (negro, rojo, azul, verde, dorado) aunque se reestilicen los componentes visuales sobre ese
  esquema.
- **FR-011**: El sistema MUST respetar la preferencia `prefers-reduced-motion` del usuario,
  reduciendo o eliminando animaciones no esenciales sin perder el feedback funcional
  imprescindible de cada acción.
- **FR-012**: Toda animación nueva introducida por el rediseño MUST tener un propósito identificable
  (feedback de una acción, orientación espacial, jerarquía de atención) y MUST animarse mediante
  `transform`/`opacity` en lugar de propiedades que disparan recálculo de layout.
- **FR-013**: El sistema MUST seguir usando exclusivamente Font Awesome o SVG para iconografía,
  sin introducir emojis en ninguna pantalla nueva o rediseñada.
- **FR-014**: El sistema MUST seguir funcionando como archivos estáticos sin backend ni build
  tools, sirviéndose igual desde `file://` y desde GitHub Pages tras el refactor.

### Key Entities *(include if feature involves data)*

- **Competición**: Definición de una competición seleccionable (por ahora, solo Mundial 2026).
  Incluye el pool de equipos disponibles, la paleta/tema visual asociado, los textos del flujo de
  asignación de equipos, y el formato de torneo sugerido por defecto (partido único o ida/vuelta
  en grupos y en eliminación). No contiene lógica de cálculo — es configuración que el motor
  consume.
- **Torneo activo**: La instancia única de torneo en curso en todo el sistema (según D1). Referencia
  qué competición eligió el usuario y guarda la configuración de formato específica de esa
  instancia (que puede diferir del default sugerido por la competición, si el usuario la editó).
- **Jugador**: Participante del torneo activo, con su equipo asignado (`jugador.equipo`) tomado
  del pool de la competición elegida. La estructura del jugador no cambia entre competiciones.
- **Configuración de formato**: Objeto de datos que indica si la fase de grupos y la eliminación
  directa se juegan a partido único o ida/vuelta, y si la eliminación directa resuelve empates por
  penales. Vive en el torneo activo, se inicializa con el default de la competición elegida y es
  editable por el usuario antes de confirmar la creación del torneo. El valor de `penales` decide
  si el sistema pide penales por defecto ante un empate en eliminación, pero no es la única vía de
  desempate posible: la definición manual de quién avanza (FR-004a) está siempre disponible como
  alternativa, sin importar este valor.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un usuario que abre la app sin torneo activo llega a la pantalla de selección de
  competición y confirma Mundial 2026 en menos de 10 segundos, sin diferencia de pasos percibida
  respecto al setup directo de v1.
- **SC-002**: El 100% de los pasos del flujo funcional de Mundial 2026 (setup, asignación,
  grupos, sorteo, fase de grupos, clasificados, eliminación, campeón) producen el mismo resultado
  de negocio que antes del refactor, verificado con al menos un torneo completo de extremo a
  extremo.
- **SC-003**: Un torneo Mundial guardado antes del refactor se abre correctamente después del
  refactor sin que el usuario pierda datos ni deba reiniciar el torneo.
- **SC-004**: Ninguna pantalla del flujo (0 de las pantallas listadas en FR-009) conserva el
  estilo visual anterior al rediseño tras completarse esta spec.
- **SC-005**: Con la preferencia de movimiento reducido activada, un usuario puede completar el
  flujo completo del torneo sin que ninguna animación decorativa bloquee o retrase una acción.
- **SC-006**: Una inspección del código del motor (calendario, posiciones, desempates, bracket)
  no encuentra ninguna referencia directa a "Mundial", "FC 26", nombres de equipos concretos ni
  valores de color — todo llega como parámetro o configuración.
- **SC-007**: Al recorrer el flujo completo en tres anchos de pantalla representativos (mobile,
  tablet, desktop), ninguna pantalla presenta touch targets menores a 44px en mobile ni un layout
  desktop que sea simplemente el layout mobile centrado en una columna angosta.

## Assumptions

- El pool de equipos y los textos de Mundial 2026 se migran tal como existen hoy en `EQUIPOS_POOL`
  y los strings actuales de la UI, simplemente reubicados como datos de configuración de la
  competición Mundial — no se agregan ni quitan equipos como parte de esta spec.
- El formato por defecto sugerido para Mundial es partido único (grupos y eliminación), igual al
  comportamiento actual, y queda editable por el usuario en el flujo de creación según D3 de la
  constitución.
- "Rediseño visual profundo" se interpreta como un nuevo lenguaje de componentes y estilo dentro
  de la paleta ya definida (negro/rojo/azul/verde/dorado) — no se introduce una paleta nueva para
  Mundial en esta spec.
- La migración de torneos guardados en el formato de localStorage previo al refactor se resuelve
  con una migración automática y silenciosa (sin pedir confirmación al usuario), asumiendo que
  todo dato existente pertenece a la competición Mundial.
- Esta spec no incluye la competición Champions League en sí (ni su pool de equipos ni su paleta);
  solo deja la pantalla de selección de competición y el modelo de datos preparados para que una
  spec posterior agregue Champions sin volver a tocar el motor.
- La reutilización de pool de jugadores entre torneos (D4 de la constitución: entidad `jugador`
  separada de `jugador_en_torneo`, clave `jugadores_conocidos`) queda fuera de alcance de esta
  spec. Cada torneo nuevo sigue arrancando con lista de jugadores vacía, sin ofrecer importación
  desde un registro acumulado; D4 se implementa en una spec posterior dedicada.
- El "objetivo estético futbolero/gamer" se valida cualitativamente por revisión del equipo (no
  hay métrica de mercado disponible para esta v2), apoyándose en el Principio VI de la
  constitución como criterio de aceptación de las decisiones de animación.
