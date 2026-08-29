# Feature Specification: Registro persistente de jugadores (Copa Panas v2)

**Feature Branch**: `003-registro-jugadores`

**Created**: 2026-08-29

**Status**: Draft

**Input**: User description: "Agregar registro persistente de jugadores reutilizable entre torneos (D4 de constitution.md). Introducir una entidad jugador conceptualmente separada de jugador_en_torneo, persistida en una clave de localStorage distinta a la del torneo activo (ej. jugadores_conocidos). Ofrecer, en el flujo de registro de jugadores del setup de un torneo nuevo, la opción de importar jugadores desde ese registro acumulado (no limitado al último torneo jugado). Resolver explícitamente los tres puntos que D4 deja abiertos: deduplicación de nombres, historial de equipos por jugador, y si el registro se actualiza automáticamente o requiere acción explícita. Transversal a ambas competiciones. No debe tocar motor.js. Debe ser opcional/no disruptivo."

## Decisiones de diseño (resuelven los puntos abiertos de D4)

Estas tres decisiones resuelven explícitamente los puntos que la constitución (D4) dejó
pendientes de spec. Se documentan aquí como decisiones de diseño — no como preguntas abiertas —
porque el pedido de esta spec es cerrarlas, no reabrirlas en `/speckit.clarify`.

- **Deduplicación de nombres**: por nombre normalizado — recorte de espacios al inicio/fin,
  colapso de espacios internos múltiples, comparación case-insensitive (`"Juan Pérez"` ==
  `"juan   pérez"` == `"JUAN PÉREZ"`). Dos nombres que normalizan igual se tratan como el mismo
  jugador: no se crean entradas duplicadas en el registro. Si el usuario efectivamente quiere
  registrar a dos personas distintas con el mismo nombre, debe diferenciarlas manualmente en el
  texto (ej. agregando inicial de apellido) — el sistema no ofrece un mecanismo de desambiguación
  adicional (ver Edge Cases).
- **Historial de equipos por jugador**: fuera de alcance de esta spec. El registro guarda
  únicamente la identidad del jugador (nombre) y su fecha de último uso; no acumula qué equipos
  usó en torneos pasados. Es la opción "nice-to-have a futuro" que D4 explícitamente permite
  diferir, y mantenerlo fuera reduce el primer incremento a lo estrictamente necesario para
  reutilización de nombres (ver Assumptions).
- **Momento de actualización del registro**: automática y silenciosa al confirmar la creación de
  un torneo. Cuando el usuario confirma el roster final de jugadores de un torneo nuevo (con
  nombres escritos a mano, importados del registro, o ambos), todos los nombres de ese roster que
  no estén ya en el registro se agregan automáticamente — sin un botón adicional ni un paso extra
  en el flujo. Se prefiere esto sobre una acción explícita porque un paso opcional adicional tiende
  a no usarse (fricción real) y el registro solo acumula nombres, un dato de bajo riesgo que no
  necesita confirmación por torneo.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Reutilizar jugadores de torneos anteriores al crear uno nuevo (Priority: P1)

Un usuario que ya jugó torneos antes (Mundial, Champions, o ambos) empieza a crear un torneo
nuevo. En la pantalla de registro de jugadores del setup, en vez de tener que volver a tipear cada
nombre desde cero, ve la opción de elegir jugadores desde su registro acumulado de partidas
anteriores y agregarlos al roster del torneo actual con un toque/clic, en lugar de un formulario
de texto libre por cada uno.

**Why this priority**: Es el valor central de la spec — sin esto, el registro existe pero nadie
lo nota ni lo usa; la fricción de re-tipear nombres cada torneo es exactamente el problema que D4
identificó.

**Independent Test**: Con `jugadores_conocidos` ya poblado por un torneo anterior (de cualquier
competición), iniciar la creación de un torneo nuevo y verificar que la pantalla de registro de
jugadores ofrece importar desde ese registro, que los jugadores importados aparecen en el roster
del torneo nuevo, y que el usuario puede seguir agregando jugadores nuevos a mano en el mismo
flujo.

**Acceptance Scenarios**:

1. **Given** `jugadores_conocidos` tiene al menos un nombre guardado, **When** el usuario llega a
   la pantalla de registro de jugadores de un torneo nuevo, **Then** ve una opción para importar
   jugadores desde el registro, distinta del campo de alta manual de nombre nuevo.
2. **Given** el usuario está en esa opción de importar, **When** selecciona uno o más jugadores del
   registro, **Then** esos jugadores se agregan al roster del torneo en curso con su nombre tal
   como está guardado, listos para continuar el flujo de asignación de equipo.
3. **Given** el usuario importó algunos jugadores del registro, **When** también escribe nombres
   nuevos a mano en el mismo flujo, **Then** el roster final del torneo combina ambos orígenes sin
   conflicto ni duplicados.

---

### User Story 2 - Primer uso sin fricción, sin registro previo (Priority: P1)

Un usuario nuevo, o cuyo `localStorage` no tiene la clave `jugadores_conocidos` (nunca usó el
registro), crea un torneo por primera vez. El flujo de registro de jugadores se ve y se comporta
exactamente igual que hoy: un formulario para tipear nombres uno por uno, sin ninguna pantalla,
paso o decisión adicional obligatoria relacionada con el registro.

**Why this priority**: Es la restricción de "opcional/no disruptivo" explícita del pedido — si
esto se rompe, la feature degrada la experiencia de cualquier usuario nuevo o que no le interesa
la reutilización, lo cual la constitución no permite (Principio I, simplicidad para quien recién
abre la app).

**Independent Test**: Con `localStorage` completamente vacío (o sin la clave
`jugadores_conocidos`), completar el flujo de creación de un torneo de punta a punta y verificar
que no aparece ningún elemento de UI roto, vacío, o que bloquee el avance por ausencia de
registro previo.

**Acceptance Scenarios**:

1. **Given** no existe la clave `jugadores_conocidos` en `localStorage`, **When** el usuario abre
   la pantalla de registro de jugadores, **Then** puede completar el alta de jugadores a mano sin
   ver errores, estados vacíos rotos, ni un paso extra obligatorio.
2. **Given** ese mismo usuario confirma la creación del torneo, **When** se guarda el torneo activo,
   **Then** el sistema crea `jugadores_conocidos` por primera vez con los nombres de ese roster,
   sin haber requerido ninguna acción explícita adicional del usuario para que eso ocurra.

---

### User Story 3 - El registro crece automáticamente con cada torneo (Priority: P2)

Un usuario que ya usa el registro completa un torneo nuevo con una combinación de jugadores
repetidos y jugadores nuevos. Al confirmar el torneo, el registro se actualiza solo: los nombres
nuevos quedan disponibles para importar en el próximo torneo, sin que el usuario tenga que abrir
una pantalla de administración de jugadores ni presionar un botón de guardado aparte.

**Why this priority**: Es la decisión de diseño de "actualización automática" puesta en práctica;
sin esta historia el registro se queda estático después de su primera carga y deja de cumplir el
propósito de D4 ("reutilizable entre torneos", plural, continuo).

**Independent Test**: Crear un torneo con al menos un jugador que ya estaba en el registro y al
menos un jugador con nombre nuevo, confirmar la creación del torneo, y verificar que
`jugadores_conocidos` después de la confirmación contiene ambos (el repetido sin duplicarse, el
nuevo agregado).

**Acceptance Scenarios**:

1. **Given** un jugador del roster del torneo nuevo ya existe en el registro (mismo nombre
   normalizado), **When** se confirma la creación del torneo, **Then** el registro no crea una
   entrada duplicada para ese jugador.
2. **Given** un jugador del roster del torneo nuevo no existe en el registro, **When** se confirma
   la creación del torneo, **Then** el registro incorpora esa nueva entrada, disponible para
   importar en el próximo torneo (de cualquier competición).

---

### Edge Cases

- ¿Qué pasa si dos jugadores reales distintos comparten exactamente el mismo nombre normalizado
  (ej. dos amigos llamados "Juan Pérez")? El sistema los trata como una sola entrada de registro
  — no hay mecanismo de desambiguación en esta spec. Si el usuario los necesita como personas
  separadas, debe escribir el nombre de forma distinguible (ej. "Juan Pérez R.") al darlos de alta
  la primera vez.
- ¿Qué pasa si el usuario importa un jugador del registro y luego edita su nombre dentro del
  roster del torneo en curso (antes de confirmar)? Esa edición afecta solo al `jugador_en_torneo`
  de ese torneo; no modifica retroactivamente la entrada del registro que se importó. El registro
  solo se actualiza al confirmar la creación del torneo, con el nombre final que quedó en el
  roster (ver Decisiones de diseño).
- ¿Qué pasa si un nombre con typo llega a confirmarse y queda guardado en `jugadores_conocidos`?
  No hay corrección posible: esta spec no incluye ninguna vía (ni en UI ni documentada como
  workaround manual) para editar o borrar una entrada ya confirmada del registro. El typo queda
  disponible para importar en todos los torneos futuros hasta que se implemente una spec de
  administración del registro. Se documenta explícitamente como deuda conocida, no como
  limitación aceptable indefinidamente (ver Assumptions).
- ¿Qué pasa si el usuario borra manualmente `jugadores_conocidos` de `localStorage` (fuera de la
  app) o hace un import/export JSON del torneo? El registro es una clave independiente de la del
  torneo activo; su ausencia o vaciado no afecta la capacidad de crear o continuar un torneo — solo
  implica que no hay nombres para importar hasta que se registre un torneo nuevo (ver User Story 2).
- ¿Qué pasa si el registro acumula una cantidad grande de nombres a lo largo de muchos torneos?
  Esta spec no define un límite máximo de entradas ni una política de purga — queda fuera de
  alcance (ver Assumptions).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema DEBE persistir una entidad `jugador` (registro de identidad reutilizable:
  nombre normalizado, nombre de presentación, fecha de último uso) en una clave de `localStorage`
  distinta (`jugadores_conocidos`) de la clave del torneo activo, sin mezclar ambos esquemas de
  datos.
- **FR-002**: La entidad `jugador` del registro DEBE mantenerse conceptualmente separada de
  `jugador_en_torneo` (el jugador dentro de un torneo específico, con su equipo asignado y sus
  estadísticas) — el registro no almacena equipo asignado ni estadísticas de torneo (ver
  Decisiones de diseño, historial de equipos fuera de alcance).
- **FR-003**: El flujo de registro de jugadores del setup de un torneo nuevo DEBE ofrecer una
  opción para importar jugadores desde `jugadores_conocidos`, visible y accesible cuando esa clave
  tiene al menos una entrada, sin reemplazar el alta manual de nombres nuevos (ambas opciones
  conviven en el mismo flujo).
- **FR-004**: La opción de importar DEBE permitir seleccionar cualquier jugador del registro
  acumulado, no solo los que participaron en el torneo o la competición jugada más recientemente.
- **FR-005**: El sistema DEBE deduplicar por nombre normalizado (recorte de espacios, colapso de
  espacios internos, comparación case-insensitive) tanto al importar del registro como al agregar
  jugadores nuevos al roster del torneo en curso: dos nombres que normalizan igual nunca deben
  coexistir como dos jugadores distintos dentro del mismo roster de torneo.
- **FR-006**: Al confirmar la creación de un torneo nuevo, el sistema DEBE actualizar
  automáticamente `jugadores_conocidos`, agregando sin duplicar (según la regla de FR-005) cada
  nombre del roster confirmado que no exista todavía en el registro, sin requerir una acción
  explícita adicional del usuario para que ese guardado ocurra.
- **FR-007**: Un `localStorage` sin la clave `jugadores_conocidos` (usuario que nunca usó el
  registro) DEBE permitir completar el flujo completo de creación de un torneo exactamente como
  hoy, sin pantallas, pasos o mensajes de error adicionales obligatorios; la clave se crea recién
  al confirmar el primer torneo (ver FR-006).
- **FR-008**: La funcionalidad de registro de jugadores DEBE funcionar igual para cualquier
  competición (Mundial, Champions League, y las que se agreguen a futuro) — no debe vivir en
  `COMPETICIONES` ni en ninguna configuración específica de una competición.
- **FR-009**: `motor.js` NO DEBE requerir cambios para soportar esta funcionalidad (Principio II)
  — el registro y su flujo de importación son persistencia y UI de setup, no cálculo del motor de
  torneo.
- **FR-010**: La opción de importar jugadores del registro DEBE ser usable en mobile y en desktop,
  respetando los mismos estándares de accesibilidad táctil y de teclado/mouse que el resto del
  flujo de setup (touch targets ≥44px, cierre de cualquier modal asociado con botón X y con
  clic/toque fuera).
- **FR-011**: Cero emojis en cualquier texto o elemento de interfaz introducido por esta
  funcionalidad — solo Font Awesome o SVG inline, igual que el resto de la app.

### Key Entities *(include if feature involves data)*

- **Jugador (registro)**: entidad nueva, persistida en `jugadores_conocidos`. Representa la
  identidad reutilizable de una persona a través de torneos: nombre normalizado (clave de
  deduplicación), nombre de presentación (como se muestra en la UI), y fecha de último uso. No
  incluye equipo asignado, estadísticas, ni historial de equipos (fuera de alcance, ver Decisiones
  de diseño).
- **Jugador en torneo** (ya existente, sin cambios de esquema): jugador dentro de un torneo
  activo específico, con su equipo asignado y estadísticas de ese torneo. Puede originarse a
  partir de una importación del registro o de alta manual — ambos orígenes producen la misma
  forma de dato una vez dentro del roster del torneo.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un usuario con historial de al menos un torneo previo puede armar el roster completo
  de jugadores de un torneo nuevo reutilizando nombres ya conocidos, sin re-tipear ningún nombre
  que ya haya usado antes.
- **SC-002**: Un usuario sin historial previo (localStorage vacío o sin `jugadores_conocidos`)
  completa el flujo de creación de un torneo en la misma cantidad de pasos que antes de esta
  funcionalidad — cero pasos nuevos obligatorios.
- **SC-003**: Después de confirmar dos torneos consecutivos con jugadores parcialmente repetidos,
  el registro acumulado no contiene ninguna entrada duplicada por nombre normalizado.
- **SC-004**: `motor.js` no cambia una sola línea como parte de esta spec — verificable por diff de
  git antes/después de la implementación.

## Assumptions

- El historial de equipos usados por jugador (uno de los tres puntos abiertos de D4) queda
  explícitamente fuera de alcance de esta spec — ver Decisiones de diseño. Es candidato a una spec
  futura si se vuelve un pedido concreto (ej. "evitar que un jugador repita equipo").
- No se define límite máximo de entradas en `jugadores_conocidos` ni política de purga de
  jugadores inactivos — se asume un volumen de uso (torneos entre amigos, no a escala) donde esto
  no es un problema práctico en el horizonte de esta spec.
- La deduplicación por nombre normalizado no intenta resolver homónimos reales (dos personas
  distintas con el mismo nombre) — se documenta como limitación conocida (ver Edge Cases), no como
  requerimiento pendiente.
- Esta spec no introduce una pantalla de administración del registro (ver, editar o borrar
  jugadores de `jugadores_conocidos`). **Deuda conocida, no solo alcance diferido**: sin esta
  pantalla, un nombre mal escrito que se confirma en un torneo no tiene forma de corregirse ni
  eliminarse del registro por ningún medio dentro de la app, y persiste indefinidamente ofreciéndose
  como opción de import. Se prioriza así en esta spec porque el registro es aditivo por diseño
  (Decisiones de diseño, actualización automática) y una pantalla de administración es una
  superficie de UI completa por sí misma que no bloquea el valor central de US1/US2/US3. Queda
  registrado aquí, y no solo como nota genérica de alcance, para que una spec futura de
  "administración del registro de jugadores" se priorice con este caso concreto como motivador,
  en vez de perderse entre otros posibles pendientes.
