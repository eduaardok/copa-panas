# Feature Specification: Historial de equipos y administración del registro de jugadores

**Feature Branch**: `005-administracion-registro-jugadores`

**Created**: 2026-08-30

**Status**: Draft

**Input**: User description: "Agregar historial de equipos por jugador y una pantalla de administración del registro persistente de jugadores (jugadores_conocidos, introducido en spec 003). Resuelve dos puntos de deuda conocida dejados explícitamente fuera de alcance por spec 003 (D4): historial de equipos por jugador, y una pantalla para ver/editar/borrar entradas del registro — motivada por el caso concreto de un typo confirmado sin forma de corregirse."

## Decisiones de diseño (resuelven los puntos que esta spec fue pedida para cerrar)

Estas decisiones resuelven explícitamente las preguntas planteadas en el pedido de esta spec. Se
documentan aquí como decisiones — no como preguntas abiertas — porque cerrarlas es el propósito de
esta spec, no algo para reabrir en `/speckit-clarify`.

- **Qué guarda el historial de equipos**: por cada torneo confirmado en el que participó, el
  jugador acumula una entrada de historial con equipo usado, competición, y fecha de confirmación
  del torneo. No se guarda una sola entrada "equipo actual" — se guarda una lista que crece con
  cada torneo, para poder responder tanto "qué equipo usó la última vez" como "qué equipos usó en
  total y en qué competiciones".
- **Dónde se ve el historial**: se muestra en la pantalla de administración del registro (objetivo
  2 de esta spec), como detalle expandible de cada entrada de jugador — no en una pantalla aparte.
  Comparten subsistema y modelo de datos, y ya que la pantalla de administración se construye en
  esta misma spec, no tiene sentido dejar el historial como dato enterrado sin forma de verlo; eso
  repetiría el mismo problema de opacidad que motivó la deuda del punto 2. No se muestra en ningún
  otro lugar de la app (no aparece durante el flujo de importar jugadores a un torneo nuevo) — esta
  spec no reabre el flujo de importación ya cerrado por spec 003.
- **Mecanismo de actualización del historial**: mismo patrón ya cerrado por spec 003 — automático y
  silencioso, en el mismo momento en que se actualiza `jugadores_conocidos` al confirmar la
  creación de un torneo (misma función, sin un paso ni botón adicional). No se introduce un
  mecanismo de actualización distinto.
- **Borrar un jugador que está en el roster de un torneo activo**: se permite borrar la entrada del
  registro sin restricción ni advertencia especial. El torneo activo no se ve afectado — el
  `jugador_en_torneo` es una entidad independiente del registro desde spec 003 (FR-002 de esa spec),
  así que borrar la entrada de `jugadores_conocidos` solo significa que ese nombre deja de estar
  disponible para importar en futuros torneos; no borra ni desvincula nada dentro del torneo en
  curso.
- **Editar el nombre de una entrada no es retroactivo**: editar el nombre de presentación en el
  registro solo afecta cómo se ve esa entrada de ahí en adelante (futuras importaciones). No
  modifica el nombre ya usado en torneos pasados o en el torneo activo — mismo principio de
  independencia entre `jugador` (registro) y `jugador_en_torneo` ya cerrado por spec 003.
- **Colisión de nombres al editar**: si editar el nombre de presentación de una entrada produce un
  nombre normalizado (misma regla de spec 003: recorte de espacios, colapso de espacios internos,
  case-insensitive) que ya pertenece a otra entrada distinta del registro, la edición se rechaza
  con un mensaje claro en vez de fusionar ambas entradas en silencio. Fusionar historiales de dos
  jugadores distintos es una operación con implicancias que esta spec no resuelve (¿qué pasa con el
  historial de equipos de ambos?); rechazar la colisión evita ese problema sin cerrar la puerta a
  una spec futura de fusión explícita si se vuelve necesaria.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Corregir un nombre mal escrito en el registro (Priority: P1)

Un usuario nota que un nombre quedó mal escrito en el registro de jugadores (typo confirmado en un
torneo pasado, el caso concreto que motivó esta spec). Entra a la pantalla de administración del
registro desde Config, encuentra la entrada, corrige el nombre de presentación, y a partir de ese
momento ese nombre correcto es el que se ofrece al importar jugadores en cualquier torneo nuevo.

**Why this priority**: Es el caso motivador explícito y la deuda más señalada de spec 003 — sin
esto, un error de tipeo queda para siempre sin forma de corregirse dentro de la app.

**Independent Test**: Con `jugadores_conocidos` conteniendo una entrada con un nombre mal escrito,
entrar a la pantalla de administración, editar esa entrada con el nombre correcto, guardar, y
verificar que el registro refleja el nombre nuevo y que un torneo ya confirmado que usó el nombre
viejo no cambia.

**Acceptance Scenarios**:

1. **Given** el usuario está en Config, **When** busca la opción de administración del registro de
   jugadores, **Then** la encuentra siguiendo el mismo patrón de navegación que el resto de las
   opciones de Config.
2. **Given** el usuario está en la pantalla de administración, **When** edita el nombre de
   presentación de una entrada a un nombre válido y distinto de todas las demás entradas, **Then**
   el cambio se guarda y esa entrada aparece con el nombre nuevo en cualquier importación futura.
3. **Given** un torneo pasado ya confirmado usó el nombre viejo de esa entrada, **When** se corrige
   el nombre en el registro, **Then** el nombre dentro de ese torneo pasado no cambia.
4. **Given** el usuario intenta editar una entrada a un nombre que, normalizado, coincide con el de
   otra entrada distinta ya existente, **When** intenta guardar, **Then** el sistema rechaza el
   cambio con un mensaje que explica el conflicto, sin modificar ninguna de las dos entradas.

---

### User Story 2 - Eliminar una entrada del registro (Priority: P1)

Un usuario quiere quitar del registro a alguien que ya no participa (registrado por error, nombre
duplicado que escapó a la deduplicación automática por diferir en la escritura, o cualquier otra
razón). Desde la pantalla de administración, borra esa entrada y deja de aparecer como opción de
importación en torneos futuros.

**Why this priority**: Es la otra mitad de la deuda conocida de spec 003 (ver/editar/borrar) — sin
poder borrar, el registro solo puede crecer, incluso con entradas que el usuario ya identificó como
no deseadas.

**Independent Test**: Con `jugadores_conocidos` conteniendo al menos dos entradas, borrar una desde
la pantalla de administración y verificar que ya no aparece en el registro ni como opción al
importar jugadores en un torneo nuevo, mientras la otra entrada permanece intacta.

**Acceptance Scenarios**:

1. **Given** el usuario está en la pantalla de administración, **When** borra una entrada del
   registro, **Then** el sistema pide confirmación antes de eliminarla de forma permanente (acción
   irreversible).
2. **Given** el usuario confirma el borrado, **When** vuelve a la pantalla de importación de
   jugadores de un torneo nuevo, **Then** esa entrada ya no aparece como opción disponible.
3. **Given** el jugador borrado del registro está actualmente en el roster de un torneo activo,
   **When** se completa el borrado, **Then** el torneo activo no sufre ningún cambio — el jugador
   sigue en el roster con su equipo y estadísticas intactas, porque el registro y el torneo activo
   son entidades independientes.

---

### User Story 3 - Ver el historial de equipos de un jugador (Priority: P2)

Un usuario que administra el registro quiere recordar qué equipos usó un jugador en torneos
pasados, de cualquier competición, antes de decidir si editarlo, borrarlo, o simplemente por
curiosidad al armar un torneo nuevo (por ejemplo, para no repetirle el mismo equipo). Desde la
pantalla de administración, expande el detalle de una entrada y ve la lista de equipos usados, con
la competición y fecha de cada uno.

**Why this priority**: Es el segundo objetivo explícito de esta spec, pero depende de que el
historial ya se esté acumulando (User Story 4) y de que exista la pantalla de administración (User
Stories 1-2) — es de menor prioridad porque no bloquea la corrección de datos, que es el valor más
urgente.

**Independent Test**: Con un jugador del registro que participó en al menos dos torneos de
competiciones distintas con equipos distintos, abrir su detalle en la pantalla de administración y
verificar que se listan ambas entradas de historial con equipo, competición y fecha correctos.

**Acceptance Scenarios**:

1. **Given** un jugador del registro tiene historial acumulado de más de un torneo, **When** el
   usuario expande su detalle en la pantalla de administración, **Then** ve cada entrada de
   historial con equipo usado, nombre de la competición, y fecha, ordenadas de más reciente a más
   antigua.
2. **Given** un jugador del registro nunca completó un torneo confirmado (entrada recién creada),
   **When** el usuario expande su detalle, **Then** ve un estado vacío claro en la sección de
   historial, sin errores ni espacios en blanco confusos.

---

### User Story 4 - El historial de equipos se acumula automáticamente (Priority: P2)

Un usuario confirma la creación de un torneo nuevo con un roster que incluye jugadores ya conocidos
por el registro. Al confirmarse, cada jugador de ese roster acumula en su historial el equipo que
le tocó en este torneo, junto con la competición y la fecha — sin ningún paso ni confirmación
adicional, igual que ya ocurre hoy con la actualización de nombres nuevos al registro.

**Why this priority**: Es el mecanismo que alimenta User Story 3; sin esta historia el historial
nunca se llena y la pantalla de administración no tiene nada que mostrar. Misma prioridad que User
Story 3 porque ambas dependen una de la otra para entregar valor completo.

**Independent Test**: Confirmar la creación de un torneo con un jugador ya existente en el registro
y un equipo asignado, y verificar que la entrada de ese jugador en `jugadores_conocidos` incorpora
una nueva entrada de historial con ese equipo, la competición del torneo, y la fecha de
confirmación — sin ninguna acción del usuario más allá de confirmar el torneo como ya lo hace hoy.

**Acceptance Scenarios**:

1. **Given** un jugador del roster de un torneo nuevo ya existe en el registro, **When** se confirma
   la creación del torneo, **Then** su entrada de registro incorpora una nueva entrada de historial
   con el equipo asignado en ese torneo, la competición, y la fecha de confirmación.
2. **Given** un jugador del roster no existía antes en el registro, **When** se confirma la creación
   del torneo, **Then** su entrada nueva en el registro se crea ya con la primera entrada de
   historial correspondiente a este torneo (no queda vacía a pesar de haber jugado).
3. **Given** un jugador repite el mismo equipo en dos torneos distintos, **When** se confirma el
   segundo torneo, **Then** el historial guarda ambas entradas por separado (no se deduplica por
   equipo repetido — cada torneo jugado es una entrada propia, independientemente de si el equipo
   coincide con uno anterior).

---

### Edge Cases

- ¿Qué pasa si el usuario borra la única entrada del registro, dejándolo vacío? La pantalla de
  administración muestra el mismo estado vacío que ya maneja hoy la opción de importar jugadores
  cuando `jugadores_conocidos` no tiene entradas (comportamiento ya cerrado por spec 003, User Story
  2) — no es un caso nuevo a diseñar.
- ¿Qué pasa si el usuario edita el nombre de una entrada dejándolo vacío o solo con espacios? Se
  rechaza igual que el alta manual de un nombre vacío en el flujo de registro existente — mismo
  estándar de validación ya usado en la app, no uno nuevo.
- ¿Qué pasa con las entradas del registro creadas antes de esta spec, que no tienen historial de
  equipos todavía? Se muestran con historial vacío (mismo estado que User Story 3, escenario 2) —
  no se intenta reconstruir retroactivamente historial de torneos ya confirmados antes de esta
  funcionalidad, porque esos torneos no guardaron la relación jugador-equipo-competición-fecha que
  el historial necesita.
- ¿Qué pasa si dos torneos se confirman el mismo día para el mismo jugador? Ambos generan una
  entrada de historial separada (la fecha no es la clave de deduplicación del historial, a
  diferencia del nombre del jugador) — es un caso legítimo, no un error.
- ¿Qué pasa si el usuario intenta borrar una entrada y cancela la confirmación? No pasa nada — la
  entrada permanece exactamente como estaba, sin cambios parciales.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema DEBE extender la entidad `jugador` del registro (`jugadores_conocidos`,
  spec 003) para acumular un historial de equipos usados: por cada torneo confirmado en el que
  participó, una entrada con equipo asignado, nombre de la competición, y fecha de confirmación del
  torneo.
- **FR-002**: Al confirmar la creación de un torneo nuevo, el sistema DEBE agregar automáticamente
  una entrada de historial a cada jugador del roster confirmado (existente o nuevo en el registro),
  en el mismo momento y con el mismo mecanismo silencioso ya usado para actualizar
  `jugadores_conocidos` (spec 003, FR-006) — sin un paso, botón o confirmación adicional.
- **FR-003**: El historial de equipos de un jugador NO DEBE deduplicar por equipo repetido — cada
  torneo confirmado en el que participó produce su propia entrada de historial, incluso si el
  equipo coincide con uno usado antes.
- **FR-004**: El sistema DEBE ofrecer, accesible desde Config con el mismo patrón de navegación que
  el resto de sus opciones, una pantalla de administración del registro de jugadores que liste todas
  las entradas de `jugadores_conocidos`.
- **FR-005**: La pantalla de administración DEBE permitir editar el nombre de presentación de
  cualquier entrada del registro, aplicando la misma regla de normalización y deduplicación por
  nombre ya cerrada en spec 003 (recorte de espacios, colapso de espacios internos, comparación
  case-insensitive); si el nombre editado normaliza igual al de otra entrada distinta ya existente,
  el sistema DEBE rechazar el cambio con un mensaje explicando el conflicto, sin modificar ninguna
  de las dos entradas.
- **FR-006**: Editar el nombre de presentación de una entrada del registro NO DEBE modificar
  retroactivamente el nombre ya usado en el roster de ningún torneo pasado o activo — el cambio
  solo aplica a futuras importaciones desde el registro.
- **FR-007**: La pantalla de administración DEBE permitir borrar por completo cualquier entrada del
  registro, con un paso de confirmación explícita antes de ejecutar el borrado (acción
  irreversible).
- **FR-008**: Borrar una entrada del registro NO DEBE afectar de ninguna forma a un torneo activo
  que incluya a ese jugador — `jugador_en_torneo` permanece independiente del registro (spec 003,
  FR-002); el borrado solo remueve la entrada de `jugadores_conocidos` y su disponibilidad para
  futuras importaciones.
- **FR-009**: La pantalla de administración DEBE permitir ver, por cada entrada, su historial de
  equipos acumulado (equipo, competición, fecha), ordenado de más reciente a más antigua, incluyendo
  el caso de historial vacío para entradas que aún no completaron ningún torneo con historial
  registrado.
- **FR-010**: El historial de equipos NO DEBE mostrarse en el flujo de importación de jugadores al
  crear un torneo nuevo (spec 003) — su única superficie de visualización es la pantalla de
  administración de esta spec.
- **FR-011**: La funcionalidad de esta spec DEBE funcionar igual para entradas del registro
  vinculadas a cualquier competición (Mundial, Champions League, y futuras) — no debe vivir en
  `COMPETICIONES` ni en configuración específica de una competición.
- **FR-012**: `motor.js` y `competiciones.js` NO DEBEN requerir cambios para soportar esta
  funcionalidad (Principio II de la constitución) — es persistencia y UI de administración, no
  cálculo del motor de torneo.
- **FR-013**: La pantalla de administración DEBE ser usable en mobile y en desktop, respetando los
  mismos estándares de accesibilidad táctil y de teclado/mouse que el resto de la app (touch targets
  ≥44px, modales que cierran con botón X y con clic/toque fuera, `prefers-reduced-motion` si se
  agrega alguna transición).
- **FR-014**: Cero emojis en cualquier texto o elemento de interfaz introducido por esta
  funcionalidad — solo Font Awesome o SVG inline, igual que el resto de la app.
- **FR-015**: Entradas del registro que existían antes de esta funcionalidad DEBEN seguir siendo
  válidas y editables/borrables normalmente, mostrando historial vacío en vez de errores o datos
  faltantes.

### Key Entities *(include if feature involves data)*

- **Jugador (registro)** (ya existente desde spec 003, extendida): además de nombre normalizado,
  nombre de presentación y fecha de último uso, ahora incluye una lista de entradas de historial de
  equipos. Sigue sin almacenar estadísticas de torneo — esas permanecen exclusivas de
  `jugador_en_torneo`.
- **Entrada de historial de equipo**: nueva, anidada dentro de un jugador del registro. Representa
  la participación de ese jugador en un torneo confirmado: equipo asignado, competición de ese
  torneo, y fecha de confirmación. Inmutable una vez creada (no se edita ni se borra individualmente
  desde esta spec — solo se ve).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un usuario puede corregir un nombre mal escrito en el registro desde que lo detecta
  hasta que el nombre corregido está disponible para importar, sin salir de la pantalla de
  administración ni editar `localStorage` manualmente.
- **SC-002**: Un usuario puede eliminar cualquier entrada no deseada del registro sin que eso
  produzca ningún cambio visible en un torneo activo que incluya a ese jugador.
- **SC-003**: Después de confirmar un torneo con jugadores ya conocidos por el registro, el 100% de
  esos jugadores muestra en su historial una entrada nueva correspondiente a ese torneo, verificable
  desde la pantalla de administración sin herramientas externas.
- **SC-004**: `motor.js` y `competiciones.js` no cambian una sola línea como parte de esta spec —
  verificable por diff de git antes/después de la implementación.

## Assumptions

- El historial de equipos no incluye estadísticas del torneo (goles, resultado, posición final) —
  solo equipo, competición y fecha, suficiente para responder "qué equipo(s) usó este jugador y
  cuándo". Estadísticas completas por torneo quedan fuera de alcance; son candidatas a una spec
  futura si se vuelve un pedido concreto.
- No se reconstruye historial retroactivo para torneos confirmados antes de esta funcionalidad — el
  historial arranca vacío para entradas existentes y empieza a acumularse desde el primer torneo
  confirmado después de implementar esta spec (ver Edge Cases).
- La colisión de nombres al editar se resuelve rechazando el cambio, no fusionando entradas — fusión
  de historiales de dos jugadores es una operación distinta que esta spec no cubre; queda como
  candidata a una spec futura si se vuelve necesaria.
- Borrar una entrada de historial de equipo individual (sin borrar el jugador completo) no está
  cubierto por esta spec — el historial se ve pero no se edita entrada por entrada; solo la entrada
  completa del jugador se puede borrar (ver Key Entities).
- No se define límite máximo de entradas de historial por jugador ni política de purga — mismo
  criterio ya asumido para el registro completo en spec 003 (volumen de uso entre amigos, no a
  escala).
