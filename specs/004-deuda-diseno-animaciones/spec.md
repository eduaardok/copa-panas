# Feature Specification: Deuda de diseño y auditoría de animaciones

**Feature Branch**: `004-deuda-diseno-animaciones`

**Created**: 2026-08-29

**Status**: Draft

**Input**: User description: "Resolver la deuda de diseño preexistente de v1 identificada por Impeccable durante specs 001-003, y sumar un pase de revisión de animaciones usando las skills de Emil Kowalski (animate, animate-expo, animation-vocabulary, find-animation-opportunities, improve-animations, review-animations) ya instaladas en .claude/skills. Catalogar el estado real actual de violaciones de tokens de diseño en styles.css y corregirlas salvo excepciones ya aceptadas en .impeccable/config.json. Auditar animaciones existentes contra el Principio VI de la constitución e identificar oportunidades de animación coherentes con el North Star, sin cambiar comportamiento funcional."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Catalogar y corregir la deuda de diseño de tokens (Priority: P1)

Como responsable del proyecto, quiero un catálogo actualizado (no los números de specs
anteriores) de las violaciones de tokens de diseño en `styles.css` — colores fuera de paleta,
tipografía no estándar, tamaños de fuente fuera de rango, espaciados inconsistentes — para poder
revisarlo y luego corregir el código y dejarlo alineado con `.impeccable/design.json` y
`DESIGN.md`, respetando las excepciones ya documentadas explícitamente en
`.impeccable/config.json`.

**Why this priority**: Es deuda señalada dos veces en specs anteriores y deliberadamente diferida;
es el objetivo primario explícito de esta spec y no depende de la auditoría de animaciones para
tener valor por sí sola.

**Independent Test**: Se puede probar corriendo el checker de Impeccable contra el estado actual
del código antes de tocar nada (genera el catálogo base), y de nuevo después de aplicar las
correcciones (confirma que las violaciones no exceptuadas desaparecieron), sin depender de ningún
otro trabajo de esta spec.

**Acceptance Scenarios**:

1. **Given** el estado actual de `styles.css` tras spec 003, **When** se corre el checker de
   Impeccable, **Then** se obtiene una lista categorizada (color, tipografía, tamaño de fuente,
   espaciado, otros) de violaciones vigentes, sin asumir los conteos de auditorías previas.
2. **Given** el catálogo de violaciones generado, **When** se contrasta cada hallazgo contra
   `.impeccable/config.json`, **Then** cada hallazgo queda marcado como "deuda a corregir" o
   "excepción aceptada", con su justificación si aplica.
3. **Given** un hallazgo marcado como "deuda a corregir" que es puramente visual (color,
   tipografía, tamaño, espaciado), **When** se aplica la corrección, **Then** el elemento pasa a
   cumplir el token correspondiente de `.impeccable/design.json`/`DESIGN.md` sin alterar
   comportamiento ni estructura funcional.
4. **Given** un hallazgo cuya corrección implicaría cambiar comportamiento (no solo estilo),
   **When** se documenta, **Then** queda registrado explícitamente como fuera de alcance y
   candidato a spec futura, sin ser corregido en esta feature.

---

### User Story 2 - Auditar animaciones contra el Principio VI y detectar oportunidades (Priority: P2)

Como responsable del proyecto, quiero una auditoría de las animaciones existentes de la app
(usando `review-animations` y `find-animation-opportunities`) que identifique tanto violaciones al
Principio VI de la constitución como oportunidades concretas de animación coherentes con el North
Star "El Marcador de Cancha", para poder revisarla junto con el catálogo de diseño antes de
implementar ningún cambio de movimiento.

**Why this priority**: Depende de tener clara la superficie visual ya corregida por la Historia 1
(mismo archivo, `styles.css`, y potencialmente `app.js` para disparar/quitar clases), pero es un
objetivo igualmente explícito de la spec; se ordena después porque construir sobre estilos
desactualizados sería revisar animaciones sobre una base que va a cambiar.

**Independent Test**: Se puede probar corriendo las skills de auditoría de animación contra el
estado actual de la app (o el estado post Historia 1) y verificando que el resultado es una lista
categorizada de violaciones y oportunidades — el análisis en sí no depende de que las
correcciones de diseño ya estén aplicadas, aunque la implementación de las correcciones de
animación sí se beneficia de partir de una base de estilos ya corregida.

**Acceptance Scenarios**:

1. **Given** el estado actual de las animaciones de la app, **When** se corre
   `review-animations`, **Then** se obtiene una lista de animaciones existentes que no respetan el
   Principio VI (uso de propiedades de layout en vez de `transform`/`opacity`, ausencia de
   `prefers-reduced-motion`, animación sin propósito claro/decorativa).
2. **Given** el estado actual de la app y el North Star "El Marcador de Cancha", **When** se corre
   `find-animation-opportunities`, **Then** se obtiene una lista de oportunidades concretas
   (transiciones de fase, estados de carga, celebraciones de gol/campeón) limitada a casos donde
   la animación aporta feedback o jerarquía real, sin animaciones agregadas "porque sí".
3. **Given** las dos listas (violaciones + oportunidades), **When** se presentan para revisión
   conjunta, **Then** el usuario las aprueba, las recorta o las ajusta antes de que se implemente
   ninguna corrección o adición de animación.
4. **Given** una violación o corrección de animación aprobada, **When** se implementa, **Then** la
   animación resultante usa `transform`/`opacity` sobre cambios de layout donde sea posible y
   respeta `prefers-reduced-motion` sin excepción.

---

### User Story 3 - Verificar que no hay regresión funcional (Priority: P3)

Como usuario de la app, quiero que las correcciones de diseño y animación de esta spec no
cambien el comportamiento de ningún flujo de torneo existente (selección de competición, sorteo,
registro de partidas, tabla de posiciones, bracket, pantalla de campeón), para poder seguir
usando la app exactamente igual que antes, solo que visualmente más pulida.

**Why this priority**: Es una salvaguarda transversal a las Historias 1 y 2, no una entrega de
valor independiente — se prioriza último porque solo puede verificarse plenamente una vez que las
correcciones de diseño y animación ya están implementadas.

**Independent Test**: Se puede probar recorriendo manualmente los flujos principales de un torneo
completo (Mundial y Champions) antes y después de los cambios de esta spec, y confirmando que el
comportamiento, los datos y las transiciones de pantalla siguen siendo idénticos salvo por el
pulido visual esperado.

**Acceptance Scenarios**:

1. **Given** un torneo activo con datos de ejemplo, **When** se recorren sus pantallas y acciones
   principales tras aplicar las correcciones de esta spec, **Then** ningún flujo requiere pasos
   distintos ni produce resultados distintos a los de antes de la spec.
2. **Given** el bug ya documentado en `KNOWN_ISSUES.md` sobre nombres de ronda del bracket,
   **When** se revisa el alcance de esta spec, **Then** ese bug permanece sin tocar y sin
   mencionarse como corregido.

### Edge Cases

- ¿Qué pasa si el checker de Impeccable reporta un hallazgo que ya está en
  `.impeccable/config.json` pero con una justificación desactualizada o ambigua? Se documenta el
  hallazgo y su estado tal como está registrado en `config.json`; no se reinterpreta la excepción
  por fuera de esta spec.
- ¿Qué pasa si una violación de diseño y una oportunidad de animación caen sobre el mismo
  elemento (por ejemplo, un botón con color fuera de paleta que además carece de estado hover)?
  Ambos hallazgos se catalogan y corrigen de forma independiente, documentando la relación entre
  ellos si aplica.
- ¿Qué pasa si una animación existente ya cumple el Principio VI pero podría pulirse (no es una
  violación, es una mejora opcional)? Se cataloga como oportunidad, no como violación, y se
  prioriza igual que el resto de oportunidades nuevas.
- ¿Qué pasa si corregir un hallazgo de diseño requeriría tocar `motor.js` o `competiciones.js`?
  Se documenta como fuera de alcance de esta spec, ya que esos archivos no deben modificarse aquí.
- ¿Qué pasa con los efectos ya exceptuados por la limitación de `color-mix()` en Safari/iOS < 16.2
  (spec 002, FR-010)? Se tratan como excepción aceptada, no como deuda pendiente.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El proceso de esta feature MUST correr el checker real de Impeccable contra el
  estado actual del código (post spec 003) como primer paso, y generar un catálogo categorizado
  (color, tipografía, tamaño de fuente, espaciado, otros) de violaciones vigentes en `styles.css`,
  sin asumir válidos los conteos de auditorías de specs 001/002.
- **FR-002**: Cada hallazgo del catálogo de diseño MUST contrastarse contra las excepciones
  documentadas en `.impeccable/config.json` y quedar marcado como "deuda a corregir" o "excepción
  aceptada".
- **FR-003**: Todo hallazgo marcado como "deuda a corregir" que sea puramente visual MUST
  corregirse para cumplir `.impeccable/design.json` y `DESIGN.md`.
- **FR-004**: Todo hallazgo (de diseño o de animación) cuya corrección requeriría un cambio de
  comportamiento funcional (no solo de estilo/movimiento) MUST documentarse como fuera de alcance
  y no corregirse en esta feature.
- **FR-005**: El proceso MUST producir una auditoría de animaciones usando
  `find-animation-opportunities` y `review-animations` contra el estado actual de la app.
- **FR-006**: La auditoría de animaciones MUST identificar animaciones existentes que violan el
  Principio VI de la constitución (uso de propiedades de layout en vez de `transform`/`opacity`,
  ausencia de `prefers-reduced-motion`, falta de propósito claro).
- **FR-007**: La auditoría de animaciones MUST identificar oportunidades concretas de animación
  coherentes con el North Star "El Marcador de Cancha", limitadas a casos que aportan feedback o
  jerarquía real (no decorativas).
- **FR-008**: Los catálogos de diseño y de animación MUST presentarse para revisión conjunta con
  el usuario antes de que se implemente ninguna corrección.
- **FR-009**: Toda animación corregida o agregada como parte de esta feature MUST respetar
  `prefers-reduced-motion` sin excepción.
- **FR-010**: Esta feature MUST NOT modificar `motor.js` ni `competiciones.js`.
- **FR-011**: Esta feature MUST NOT modificar el modelo de datos de torneo ni el flujo funcional
  de ningún torneo existente.
- **FR-012**: Esta feature MUST NOT resolver ni modificar el bug ya documentado en
  `KNOWN_ISSUES.md` sobre nombres de ronda del bracket.
- **FR-013**: Tras implementar las correcciones, MUST volver a correrse el checker de Impeccable
  para confirmar que no quedan violaciones sin excepción documentada (o que las remanentes están
  explícitamente justificadas como fuera de alcance).

### Key Entities

- **Catálogo de hallazgos de diseño**: Lista de violaciones de tokens detectadas en `styles.css`,
  cada una con categoría (color/tipografía/tamaño/espaciado/otro), ubicación, y estado (deuda a
  corregir / excepción aceptada).
- **Catálogo de auditoría de animación**: Lista de violaciones del Principio VI y de oportunidades
  de animación, cada una con ubicación, tipo (violación/oportunidad) y justificación de su
  propósito (feedback, jerarquía, celebración, etc.).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: El checker de Impeccable no reporta violaciones de tokens de diseño sin justificar
  en `styles.css` al finalizar la feature.
- **SC-002**: El 100% de las violaciones de animación identificadas contra el Principio VI quedan
  corregidas o documentadas explícitamente como fuera de alcance.
- **SC-003**: Recorriendo manualmente los flujos principales de un torneo (selección de
  competición, sorteo, registro de partidas, tabla de posiciones, bracket, pantalla de campeón)
  en Mundial y Champions, el comportamiento y los datos son idénticos a los previos a esta spec.
- **SC-004**: Con `prefers-reduced-motion` activado a nivel de sistema, ninguna animación nueva o
  corregida por esta spec produce movimiento no esencial.
- **SC-005**: El catálogo de hallazgos de diseño y el de animación quedan revisados y aprobados
  por el usuario antes de que arranque cualquier corrección de código.

## Assumptions

- El checker de Impeccable (`.impeccable/`) sigue instalado y ejecutable en el estado actual del
  proyecto tal como se usó en specs 001 y 002.
- Las skills de Emil Kowalski (`animate`, `animate-expo`, `animation-vocabulary`,
  `find-animation-opportunities`, `improve-animations`, `review-animations`) están disponibles en
  `.claude/skills` y se pueden invocar durante esta feature.
- Las excepciones ya documentadas en `.impeccable/config.json` (incluida la de `color-mix()` en
  Safari/iOS < 16.2 de spec 002) se aceptan tal como están escritas; esta spec no las reabre.
- El trabajo de esta spec se limita a `styles.css` y, cuando una animación lo requiera, a
  disparar/quitar clases desde `app.js` — nunca desde `motor.js` ni `competiciones.js`.
- No se agregan pantallas, campos de datos ni dependencias externas nuevas como parte de esta
  feature.
