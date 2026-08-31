# Feature Specification: Cierre de pendientes v2

**Feature Branch**: `007-cierre-pendientes-v2`

**Created**: 2026-08-30

**Status**: Draft

**Input**: User description: "Cierre de pendientes v2 (Copa Panas): cuatro áreas independientes de deuda técnica conocida — nombres de ronda del bracket, asimetría de duplicados en validación de jugadores, higiene de configuración de Impeccable, y service worker para funcionamiento offline real."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Nombres de ronda correctos durante todo el torneo (Priority: P1)

Un organizador lleva un torneo de eliminación directa desde el primer cruce hasta la final. En
cada etapa, la app debe mostrar el nombre correcto de la ronda (Cuartos de final, Semifinales,
Final, etc.) tanto en la vista de bracket como en el dashboard — desde el momento en que esa ronda
se genera, sin que el nombre cambie después al generarse rondas siguientes.

**Why this priority**: Es un bug visible en vivo durante el momento de mayor tensión del torneo
(la eliminación directa). Un nombre de ronda incorrecto o que cambia genera confusión inmediata
entre jugadores y organizador sobre en qué instancia están parados.

**Independent Test**: Se puede probar generando un bracket de 8 clasificados y verificando que
cada ronda muestra su nombre final (Cuartos, Semifinales, Final) desde que se genera esa ronda,
sin necesidad de tocar ninguna otra parte de la app.

**Acceptance Scenarios**:

1. **Given** un torneo con 8 clasificados a eliminación directa, **When** se genera la primera
   ronda de cruces, **Then** esa ronda se muestra como "Cuartos de final" (no como "Final" ni
   ningún otro nombre) tanto en la vista de bracket como en el dashboard.
2. **Given** una ronda de cuartos ya jugada y mostrada correctamente, **When** se generan las
   semifinales, **Then** el nombre ya mostrado para cuartos no cambia.
3. **Given** una cantidad de clasificados que no es potencia de 2, **When** se generan las rondas
   sucesivas, **Then** cada ronda muestra el nombre correspondiente a la profundidad real del
   bracket calculada a partir de la cantidad de clasificados, sin nombres erróneos ni saltos.

---

### User Story 2 - Ambos duplicados de nombre quedan señalados (Priority: P2)

Un organizador está cargando la lista de jugadores antes de armar el torneo y escribe el mismo
nombre dos veces (por error de tipeo o porque no recuerda haberlo cargado ya). La app debe marcar
visualmente ambas instancias del nombre duplicado, no solo la segunda, para que el organizador
pueda ver de un vistazo cuál es el par en conflicto y corregir cualquiera de los dos campos.

**Why this priority**: Es un defecto de usabilidad que genera confusión al momento de corregir
datos de entrada — el organizador ve un error pero no identifica con claridad dónde está el
duplicado si solo una de las dos instancias está marcada.

**Independent Test**: Se puede probar escribiendo el mismo nombre (con variaciones de
mayúsculas/espacios) en dos campos de la lista de jugadores y verificando que ambos quedan
marcados como error, sin depender de ninguna otra funcionalidad.

**Acceptance Scenarios**:

1. **Given** una lista de jugadores vacía, **When** se escribe el mismo nombre en dos campos
   distintos, **Then** ambos campos quedan marcados visualmente como error.
2. **Given** dos campos con el mismo nombre marcados como error, **When** se corrige uno de los
   dos para que ya no sea un duplicado, **Then** la marca de error se retira de ambos campos.
3. **Given** un nombre escrito con diferencias de espacios o mayúsculas/minúsculas respecto de
   otro campo, **When** se evalúa la lista, **Then** ambos se consideran el mismo nombre (según
   la normalización ya existente) y ambos quedan marcados.

---

### User Story 3 - Configuración de excepciones de diseño honesta y documentada (Priority: P3)

Quien mantiene el proyecto revisa la configuración de excepciones del checker de estilo
(Impeccable) y necesita que cada excepción registrada realmente tenga efecto y esté acompañada de
una razón verificable, en vez de entradas que aparentan acotar un caso pero que en la práctica no
hacen nada.

**Why this priority**: No afecta a los usuarios finales del torneo ni cambia comportamiento
visible de la app — es deuda de mantenimiento interna. Se prioriza último porque su ausencia no
genera bugs para el organizador ni los jugadores, solo confusión futura para quien mantenga el
proyecto.

**Independent Test**: Se puede probar corriendo el checker de Impeccable antes y después del
cambio de configuración y comparando que el conteo total de hallazgos no varía, y revisando que el
archivo de configuración y la documentación de issues conocidos reflejan solo excepciones que
realmente tienen efecto.

**Acceptance Scenarios**:

1. **Given** la configuración actual con dos excepciones inertes y una excepción comodín que
   cubre los mismos casos, **When** se eliminan las excepciones inertes, **Then** el checker
   reporta exactamente el mismo conjunto de hallazgos que antes del cambio.
2. **Given** la documentación de issues conocidos que describe estas excepciones inertes como
   pendientes de decisión, **When** se resuelve la limpieza, **Then** esa documentación deja de
   listar el problema como abierto y refleja el estado final.
3. **Given** la excepción comodín restante que cubre múltiples casos de manera amplia, **When** se
   documenta su razón, **Then** la razón describe explícitamente qué casos conocidos cubre y qué
   se debe verificar manualmente ante un caso nuevo no cubierto por esa lista.

---

### User Story 4 - La app sigue funcionando sin conexión durante un torneo en cancha (Priority: P1)

Un organizador está registrando resultados de partidos en la cancha, donde la conexión a internet
es intermitente o inexistente. Después de haber cargado la app al menos una vez con conexión, debe
poder seguir usándola sin conexión: ver la interfaz completa con sus estilos e íconos, y registrar
resultados de partidos, sin que el corte de red interrumpa el uso del torneo.

**Why this priority**: Es el caso de uso real que motiva esta área — el torneo se juega en un
lugar físico donde la señal no es confiable, y perder acceso a la app en ese momento bloquea por
completo el registro de resultados en vivo.

**Independent Test**: Se puede probar cargando la app una vez con conexión activa, cortando la
red, y verificando que la app sigue disponible con su apariencia completa y permite registrar un
resultado que persiste — sin necesidad de que ninguna otra área de esta spec esté implementada.

**Acceptance Scenarios**:

1. **Given** la app servida por HTTP y cargada una vez con conexión, **When** se corta la
   conexión a internet y se vuelve a abrir la app, **Then** la interfaz carga completa, con
   estilos, tipografía e íconos, y permite registrar un resultado que persiste.
2. **Given** la app publicada bajo una ruta con subdirectorio (como ocurre en el hosting real),
   **When** se repite el mismo escenario sin conexión, **Then** el comportamiento es idéntico al
   de la raíz del dominio.
3. **Given** la app abierta directamente desde un archivo local (sin servidor), **When** se usa
   normalmente, **Then** el comportamiento es idéntico al que tenía antes de esta funcionalidad y
   no aparece ningún error de consola relacionado a funcionamiento offline.
4. **Given** una nueva versión de la app publicada mientras un organizador tiene el torneo abierto
   en una pestaña, **When** esa pestaña sigue abierta, **Then** la sesión en curso no se
   interrumpe ni se recarga sola con la versión nueva.

---

### Edge Cases

- ¿Qué pasa si la cantidad de clasificados a eliminación directa no es potencia de 2 (por ejemplo,
  6 o 10 equipos)? El nombre de ronda debe derivarse igualmente de forma consistente y sin
  saltos incorrectos.
- ¿Qué pasa si un organizador escribe tres o más campos con el mismo nombre (no solo dos)? Todas
  las instancias duplicadas deben quedar marcadas, no solo un par.
- ¿Qué pasa si el checker de Impeccable encuentra un hallazgo nuevo de una regla ya cubierta por
  la excepción comodín restante, que no corresponde a ninguno de los casos ya documentados? Debe
  quedar claro en la documentación que ese caso requiere revisión manual y no se asume cubierto
  automáticamente.
- ¿Qué pasa si el service worker no logra completar el precache de algún recurso externo (por
  ejemplo, por un corte de red durante la primera carga)? La app debe seguir funcionando online
  con normalidad; el modo offline puede quedar incompleto hasta la próxima carga exitosa, pero no
  debe romper el uso online.
- ¿Qué pasa si la app se abre por primera vez ya sin conexión (nunca se cargó antes con red)? No
  hay nada que fallback pueda ofrecer offline sin una primera carga previa exitosa; esto queda
  fuera del alcance de esta funcionalidad.

## Requirements *(mandatory)*

### Functional Requirements

**Área 1 — Nombres de ronda**

- **FR-001**: El sistema DEBE calcular el nombre de cada ronda de eliminación directa (tanto en
  la vista de bracket como en el dashboard) a partir de la profundidad total del bracket, derivada
  de la cantidad de equipos clasificados, y no a partir de la cantidad de rondas generadas hasta
  el momento.
- **FR-002**: El nombre asignado a una ronda ya generada NO DEBE cambiar cuando se generan rondas
  posteriores del mismo bracket.
- **FR-003**: El cálculo de nombre de ronda DEBE comportarse correctamente también cuando la
  cantidad de clasificados no es una potencia exacta de 2.

**Área 2 — Duplicados de jugadores**

- **FR-004**: El sistema DEBE marcar visualmente como error a TODAS las instancias de un nombre
  de jugador duplicado en la lista, no solo a la segunda o posteriores apariciones.
- **FR-005**: La detección de duplicados DEBE seguir usando la normalización de nombres ya
  existente (espacios y mayúsculas/minúsculas no distinguen nombres como diferentes).
- **FR-006**: Al corregir un nombre duplicado de forma que deje de coincidir con otro, el sistema
  DEBE retirar la marca de error de las instancias que ya no están en conflicto.

**Área 3 — Configuración de excepciones de estilo**

- **FR-007**: La configuración de excepciones del checker de estilo DEBE contener únicamente
  entradas que tengan efecto real sobre los hallazgos que reporta el checker.
- **FR-008**: Cada excepción amplia (que cubra más de un caso puntual) DEBE tener documentada la
  razón de su alcance, incluyendo qué casos conocidos cubre.
- **FR-009**: Tras el cambio de configuración, el conteo total de hallazgos que reporta el checker
  DEBE ser idéntico al que reportaba antes del cambio.
- **FR-010**: La documentación de defectos conocidos del proyecto DEBE reflejar el estado final
  de esta limpieza (issues resueltos removidos de la lista de pendientes, issues que quedan como
  decisión deliberada documentados como tales).

**Área 4 — Funcionamiento offline**

- **FR-011**: El sistema DEBE quedar disponible para uso completo sin conexión a internet después
  de al menos una carga previa exitosa con conexión, cuando se accede vía HTTP o HTTPS.
- **FR-012**: El comportamiento de la app abierta directamente desde el sistema de archivos (sin
  servidor) DEBE permanecer idéntico al actual — sin intentos de habilitar funcionamiento offline
  en ese modo y sin errores nuevos visibles.
- **FR-013**: El funcionamiento offline DEBE incluir la interfaz completa (estructura, estilos,
  tipografía e iconografía) y la capacidad de registrar resultados de partidos, que deben persistir
  igual que en modo conectado.
- **FR-014**: El funcionamiento offline DEBE funcionar igual cuando la app se sirve desde una ruta
  con subdirectorio que cuando se sirve desde la raíz del dominio.
- **FR-015**: Una nueva versión publicada de la app NO DEBE interrumpir ni recargar una sesión de
  torneo que ya está abierta en una pestaña activa; la actualización toma efecto recién en una
  carga posterior.
- **FR-016**: El mecanismo de funcionamiento offline NO DEBE alterar el comportamiento de
  persistencia de datos del torneo (guardado y exportación/importación) respecto del que existe
  hoy.

### Key Entities

- **Ronda de bracket**: etapa de la eliminación directa (ej. cuartos de final, semifinales,
  final); su nombre visible se deriva de su posición respecto de la profundidad total del bracket,
  no de cuántas rondas existen en un momento dado.
- **Jugador (entrada de lista)**: nombre ingresado por el organizador antes de armar el torneo;
  puede estar en conflicto de duplicado con otra entrada según el nombre normalizado.
- **Excepción de estilo**: regla de supresión configurada para el checker de diseño, que puede
  aplicar a un valor puntual o a un conjunto amplio de casos (comodín), y debe tener una razón
  documentada proporcional a su alcance.
- **Estado offline de la app**: disponibilidad de la interfaz y sus recursos (estilos, tipografía,
  iconografía, lógica) sin conexión a internet, condicionada a una carga previa exitosa con
  conexión.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: En un torneo de eliminación directa con 8 clasificados, el 100% de las rondas
  muestran el nombre correcto desde el momento en que se generan, sin ningún cambio posterior de
  nombre para una ronda ya mostrada.
- **SC-002**: En un torneo de eliminación directa con una cantidad de clasificados que no es
  potencia de 2, los nombres de ronda mostrados son correctos en el 100% de los casos probados.
- **SC-003**: Al ingresar el mismo nombre de jugador en dos o más campos, el 100% de las
  instancias duplicadas quedan marcadas visualmente como error, no solo una de ellas.
- **SC-004**: El checker de estilo reporta exactamente el mismo número de hallazgos antes y
  después de la limpieza de configuración de excepciones.
- **SC-005**: Un organizador puede cargar la app una vez con conexión, perder la conexión por
  completo, y seguir registrando resultados de partidos durante el resto del torneo sin
  interrupciones atribuibles a la falta de red.
- **SC-006**: El comportamiento de la app abierta por archivo local es indistinguible del actual
  (sin regresiones) y no muestra errores nuevos en consola.
- **SC-007**: Una sesión de torneo abierta en una pestaña continúa funcionando sin interrupción
  aunque se publique una versión nueva de la app mientras esa pestaña sigue abierta.

## Assumptions

- El organizador y los jugadores usan navegadores modernos (Chrome/Safari/Firefox/Edge en
  desktop, Chrome para Android y Safari para iPhone iOS 15+), según el baseline ya establecido
  para el proyecto.
- El sitio sigue publicándose en GitHub Pages bajo un subpath del dominio, por lo que cualquier
  ruta o alcance de funcionamiento offline debe resolverse de forma relativa y no asumir que la
  app vive en la raíz del dominio.
- El rename futuro del repositorio es un evento conocido pero fuera del alcance temporal de esta
  spec; cualquier identificador nuevo que se introduzca (por ejemplo, el nombre de una caché) se
  basa en el nombre del producto y no en el del repositorio actual, para no requerir cambios de
  código cuando ese rename ocurra.
- Las cuatro áreas de esta spec son independientes entre sí y pueden implementarse, probarse y
  entregarse en cualquier orden sin que una dependa de que otra esté terminada.
- No se agregan mecanismos de aviso al usuario sobre nuevas versiones disponibles, ni
  sincronización en segundo plano — quedan fuera del alcance de la funcionalidad offline definida
  acá.
- El motor de torneo y la capa de configuración de competiciones existentes no requieren cambios
  de comportamiento para soportar ninguna de las cuatro áreas; los ajustes se resuelven en la capa
  de presentación/aplicación y en configuración de proyecto.
