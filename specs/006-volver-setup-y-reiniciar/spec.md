# Feature Specification: Navegación de vuelta y reinicio consciente

**Feature Branch**: `006-volver-setup-y-reiniciar`

**Created**: 2026-08-30

**Status**: Draft

**Input**: User description: "Cerrar el gap de navegación entre la selección de competición y el arranque de un torneo, en dos partes: (1) botón de volver sin fricción en la pantalla de configuración inicial (setup) hacia la selección de competición, descartando competición y formato elegidos; (2) actualizar el flujo de 'Reiniciar torneo' en Config para que el modal de confirmación deje explícito que lleva a elegir otra competición, y ofrecer exportar el torneo actual a JSON antes de borrar, como paso opcional."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Volver desde el setup sin perder tiempo (Priority: P1)

Un organizador elige una competición por error (o simplemente quiere ver
las otras opciones antes de decidirse) y ya está parado en la pantalla de
configuración inicial (setup), donde aún no cargó ningún equipo ni
jugador. Necesita poder volver a la pantalla de selección de competición
de inmediato, sin que la app le pregunte nada ni le ofrezca guardar algo
que todavía no existe.

**Why this priority**: Es el gap más filoso hoy: una vez elegida una
competición, no hay ninguna forma de volver atrás salvo recargar la URL
manualmente (lo cual además no cambia nada, porque el setup abandonado
se recupera solo). Bloquea la exploración natural de "elegí mal, quiero
ver las otras opciones".

**Independent Test**: Puede probarse por completo entrando a
screen-setup desde screen-competicion, tocando "volver", y verificando
que aparece screen-competicion. Recargar la página en ese punto debe
volver a mostrar screen-competicion (no reanudar el setup).

**Acceptance Scenarios**:

1. **Given** el usuario está en screen-competicion, **When** elige una
   competición, **Then** ve screen-setup con un control de "volver"
   visible cerca del inicio de la pantalla.
2. **Given** el usuario está en screen-setup (aún sin avanzar más allá
   de la configuración inicial), **When** toca "volver", **Then** la
   app lo regresa a screen-competicion inmediatamente, sin modal de
   confirmación ni oferta de exportar.
3. **Given** el usuario tocó "volver" desde screen-setup, **When**
   recarga la página, **Then** la app arranca en screen-competicion (no
   reanuda un setup abandonado con la competición o el formato que
   había elegido antes).
4. **Given** el usuario tocó "volver" desde screen-setup, **When**
   vuelve a elegir la misma competición u otra distinta, **Then** ve
   screen-setup con el formato por defecto de esa competición (no
   arrastra configuración de formato de un intento anterior).

---

### User Story 2 - Reiniciar con la posibilidad de no perder nada (Priority: P2)

Un organizador con un torneo ya en marcha (con equipos, resultados,
etc.) quiere empezar de cero con otra competición usando "Reiniciar
torneo" desde Config. Hoy el modal no dice a dónde lo va a llevar la
acción, y no hay ninguna oportunidad de exportar el torneo actual antes
de perderlo para siempre.

**Why this priority**: Menor urgencia que P1 porque la función ya
existe y ya lleva al destino correcto — lo que falta es reducir el
riesgo de pérdida de datos y la ambigüedad del copy, no habilitar un
flujo nuevo.

**Independent Test**: Puede probarse por completo abriendo Config con
un torneo que tenga datos, tocando "Reiniciar torneo", confirmando que
el modal ofrece exportar y que el texto es explícito sobre el destino,
y verificando ambos caminos (exportar y luego borrar vs. saltar y
borrar directamente) terminan en screen-competicion.

**Acceptance Scenarios**:

1. **Given** el usuario está en Config con un torneo en curso, **When**
   toca "Reiniciar torneo", **Then** ve un modal cuyo texto deja
   explícito que la acción borra el torneo actual y lo lleva a elegir
   una competición distinta (no a repetir la actual).
2. **Given** el modal de reinicio está abierto, **When** el usuario
   toca la opción de exportar, **Then** se dispara la exportación a
   JSON del torneo actual, el modal permanece abierto, y el usuario
   debe todavía confirmar el borrado con un toque aparte antes de que
   se borren los datos y se llegue a screen-competicion.
2b. **Given** el usuario ya exportó el torneo desde el modal de
    reinicio, **When** decide cancelar en vez de confirmar el borrado,
    **Then** el modal se cierra sin borrar ningún dato — el archivo
    exportado no obliga a continuar con el reinicio.
3. **Given** el modal de reinicio está abierto, **When** el usuario
   decide saltar la exportación y confirmar el borrado directamente,
   **Then** los datos se borran igual y llega a screen-competicion, sin
   que se le haya forzado a exportar.
4. **Given** el modal de reinicio está abierto, **When** el usuario lo
   cancela o lo cierra sin elegir ninguna acción de borrado, **Then**
   no se pierde ningún dato y permanece en Config tal como estaba.

---

### Edge Cases

- ¿Qué pasa si el usuario toca "volver" en setup y no había elegido
  ningún formato distinto al de por defecto? El resultado es el mismo:
  vuelve a screen-competicion sin rastro de competición ni formato
  elegidos previamente.
- ¿Qué pasa si `exportarJSON()` falla (por ejemplo, el navegador
  bloquea la descarga)? El flujo de reinicio no debe quedar bloqueado:
  el usuario debe poder continuar hacia el borrado o cancelar, sin que
  un fallo silencioso de exportación le impida reiniciar.
- ¿Qué pasa si el usuario ya avanzó más allá de setup (por ejemplo a
  fase de grupos) y luego, por algún medio externo a esta funcionalidad,
  llega de nuevo a screen-setup? Fuera de alcance: el botón de volver
  vive únicamente en el flujo normal de setup inicial; no se diseña
  para ese caso.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema DEBE mostrar, en screen-setup, un control de
  "volver" visible y accesible que regrese al usuario a
  screen-competicion.
- **FR-002**: Al activar el control de "volver" desde screen-setup, el
  sistema DEBE ejecutar la acción de inmediato, sin modal de
  confirmación ni oferta de exportación.
- **FR-003**: Al activar el control de "volver" desde screen-setup, el
  sistema DEBE descartar por completo la competición y la configuración
  de formato elegidas (equivalente a limpiar el estado persistido),
  de modo que una recarga posterior de la página muestre
  screen-competicion y no reanude el setup abandonado.
- **FR-004**: El sistema DEBE preservar el comportamiento existente del
  botón "Reiniciar torneo" en Config: sigue disponible en el mismo
  lugar y sigue terminando en screen-competicion tras el borrado.
- **FR-005**: El sistema DEBE actualizar el texto del modal de
  confirmación de "Reiniciar torneo" para indicar explícitamente que la
  acción borra el torneo actual y lleva a elegir una competición
  distinta.
- **FR-006**: El sistema DEBE ofrecer, dentro del modal de "Reiniciar
  torneo", un control para exportar el torneo actual a JSON
  (reutilizando la función de exportación existente), separado del
  control de confirmar el borrado.
- **FR-007**: Tocar el control de exportar DEBE disparar la
  exportación sin cerrar el modal ni ejecutar el borrado; el borrado
  solo ocurre cuando el usuario toca el control de confirmación por
  separado.
- **FR-008**: Si el usuario cancela el modal de "Reiniciar torneo" en
  cualquier punto antes de confirmar el borrado, el sistema NO DEBE
  alterar los datos del torneo actual.
- **FR-009**: El sistema NO DEBE agregar ningún control de "volver a
  selección de competición" accesible desde pantallas posteriores al
  setup inicial (dashboard, fase de grupos, eliminación); ese caso
  permanece cubierto únicamente por "Reiniciar torneo" en Config.
- **FR-010**: El control de "volver" de screen-setup y el botón
  "Reiniciar torneo" de Config DEBEN mantenerse como dos entradas
  visualmente distintas al mismo destino, reflejando su distinto nivel
  de fricción.
- **FR-011**: Si la exportación falla (por ejemplo, el navegador
  bloquea la descarga), el sistema DEBE permitir que el usuario igual
  confirme el borrado o cancele el modal — un fallo de exportación no
  debe bloquear ni forzar ninguna de las dos rutas.

### Key Entities

- **Estado del torneo en progreso**: incluye, entre otros campos, la
  competición elegida y la configuración de formato; es lo que se
  descarta por completo al usar "volver" desde setup o al confirmar
  "Reiniciar torneo".

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un usuario que eligió la competición equivocada puede
  volver a la pantalla de selección y elegir la correcta en menos de 2
  toques/clics, sin pasar por ningún diálogo intermedio.
- **SC-002**: El 100% de las recargas de página inmediatamente después
  de usar "volver" desde setup muestran la pantalla de selección de
  competición, nunca un setup con datos de un intento anterior.
- **SC-003**: El 100% de los flujos de "Reiniciar torneo" completados
  (con o sin exportar) terminan en la pantalla de selección de
  competición.
- **SC-004**: El 100% de los usuarios que exportan desde el modal de
  reinicio conservan la posibilidad de cancelar el borrado después de
  haber exportado, sin que exportar dispare el borrado por sí solo.

## Assumptions

- En la etapa de setup inicial (antes de generar equipos/grupos) solo
  existen dos valores con estado real: la competición elegida y la
  configuración de formato (con sus valores por defecto). No hay
  jugadores, resultados ni otro dato sustancial que el usuario pudiera
  querer conservar en ese punto — de ahí que "volver" no ofrezca
  exportar.
- Descartar competición y formato en el flujo de "volver" es
  equivalente, en términos de estado persistido, a limpiar por completo
  el torneo activo guardado (ambos valores viven en el mismo registro
  de estado que se persiste como una unidad).
- El registro de jugadores conocidos (pool reutilizable entre torneos)
  es independiente del torneo activo y no se ve afectado ni por
  "volver" desde setup ni por "Reiniciar torneo".
- La función de exportación a JSON ya existente cubre adecuadamente la
  necesidad de "no perder nada" antes de reiniciar; no se requiere un
  formato de exportación nuevo ni distinto para este flujo.
