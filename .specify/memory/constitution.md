<!--
Sync Impact Report
- Version change: (template, unratified) → 1.0.0
- Modified principles: n/a (initial ratification)
- Added sections:
  - Core Principles: I. Sin backend, sin build tools mientras sea viable
  - Core Principles: II. Motor de torneo desacoplado de tema y competición
  - Core Principles: III. Spec-driven, no vibe coding
  - Core Principles: IV. Formato de competición como configuración, no como hardcode
  - Core Principles: V. Un torneo activo, global, sin excepciones
  - Core Principles: VI. Compatibilidad con Impeccable y las skills de Emil Kowalski
  - Restricciones de arquitectura (decisiones cerradas): D1-D4
  - Mapa de partida — motor vs. tema/competición
  - Fuera de alcance de esta constitución
  - Governance (amendment procedure, versioning policy)
- Removed sections: n/a (initial ratification from template scaffold)
- Templates requiring follow-up: none — dependent templates/commands read this file at runtime
  and are not modified by this command.
- Deferred items: none (RATIFICATION_DATE and LAST_AMENDED_DATE both set to the date this
  constitution was authored, since there is no prior ratified version to preserve)
-->

# Copa Panas Constitution

Copa Panas es la evolución de "Torneo Amigos FC 26" (repo `eduaardok/mundialito-web`) hacia una
app multi-competición. Hoy gestiona un único torneo con temática fija de Mundial 2026; la v2 debe
soportar varias competiciones (arrancando con Mundial y Champions League) elegibles desde una
pantalla inicial, desacoplando el motor de torneo de la capa de tema/formato de cada competición.
Sin backend, sin build tools: HTML/CSS/JS puro + Tailwind CDN + localStorage. No hay presión de
fecha — se prioriza un refactor correcto antes que velocidad de lanzamiento.

## Core Principles

### I. Sin backend, sin build tools mientras sea viable
La app debe seguir siendo servible como archivos estáticos (GitHub Pages, `file://`), sin Node,
sin bundlers, sin servidor. Persistencia vía localStorage. Sumar una librería vía CDN sin costo de
build se evalúa caso por caso, no se descarta de plano, pero no es el default ni se introduce sin
justificación explícita en el spec correspondiente.
*Razón: es la propuesta de valor central del proyecto — cualquiera lo abre y lo usa sin instalar
nada.*

### II. Motor de torneo desacoplado de tema y competición
El core de cálculo (generación de calendario, tabla de posiciones y desempates, generación y
avance de bracket de eliminación) no debe contener nombres de competición, paletas de color,
strings de UI, ni pools de equipos hardcodeados. Debe operar exclusivamente sobre estructuras de
datos y un objeto de configuración de formato (ver Principio IV). Ninguna función del motor puede
importar o referenciar directamente una constante específica de competición.
*Razón: es la premisa completa del refactor — si el motor conoce "Mundial" o "FC 26", el desacople
fracasó.*

### III. Spec-driven, no vibe coding
Ninguna funcionalidad se implementa sin spec previa (objetivo, restricciones, criterios de
aceptación). Este documento y los artefactos que de él se deriven (`spec.md`, `plan.md`,
`tasks.md`) son la fuente de verdad del proyecto. El código se ajusta a la spec, nunca al revés;
si el código necesita divergir, primero se actualiza la spec con su razón.
*Razón: es el método de trabajo elegido explícitamente para este proyecto, no una preferencia
opcional.*

### IV. Formato de competición como configuración, no como hardcode
Los parámetros de formato (fase de grupos a partido único o ida/vuelta; eliminación directa a
partido único o ida/vuelta; uso o no de penales en empate) son datos de configuración de cada
instancia de torneo, nunca una propiedad fija de la competición ni una rama de código condicional
por nombre de competición ("si es Champions, hacer X"). Cada competición puede sugerir un formato
por defecto, pero el usuario siempre puede editarlo antes de confirmar la creación del torneo.
*Razón: sin esto, cada competición nueva obliga a tocar el motor en vez de solo declarar
configuración.*

### V. Un torneo activo, global, sin excepciones
Solo existe un torneo activo en todo el sistema a la vez, independientemente de la competición. No
hay múltiples torneos corriendo en paralelo ni mecanismos de archivado automático paralelo. La
pantalla de selección de competición solo es alcanzable cuando no hay torneo activo.
*Razón: decisión explícita para mantener el modelo de datos simple — un torneo activo por sesión,
tal como funciona hoy la app, extendido a multi-competición sin agregar complejidad de
concurrencia.*

### VI. Compatibilidad con Impeccable y las skills de Emil Kowalski
Toda decisión de UI y animación debe poder ejecutarse limpiamente con esas skills en Claude Code:
restricción visual, propósito claro en cada animación (nunca decorativa sin función),
`transform`/`opacity` antes que cambios de layout, respeto a `prefers-reduced-motion`, coherencia
visual entre pantallas y entre competiciones. No se proponen ni aceptan patrones de UI que entren
en fricción con estos principios.
*Razón: evitar que el trabajo de diseño hecho en este espacio de planeación choque con las
herramientas que van a pulirlo en Claude Code.*

## Restricciones de arquitectura (decisiones cerradas)

Estas cuatro decisiones fueron cerradas explícitamente durante la fase de planeación y son
vinculantes para cualquier spec o plan posterior. No se reabren sin una razón nueva documentada.

### D1 — Torneo activo: global (no por competición)
- Un solo torneo activo en todo el sistema.
- Si hay un torneo activo, la pantalla de selección de competición no debe ser alcanzable. El
  usuario debe finalizar o reiniciar el torneo activo primero.
- "Reiniciar torneo" (en Config) pasa de llevar directo a la pantalla `setup` a llevar a la nueva
  pantalla de selección de competición.
- No se requiere archivado en slots paralelos — se mantiene una sola clave de estado de torneo
  activo en localStorage.

### D2 — Asignación de equipos: mismo mecanismo en todas las competiciones
- Champions League usa el mismo concepto que Mundial: asignación de equipo/club a cada jugador,
  con las dos modalidades ya existentes (aleatorio con animación de sorteo, o manual vía
  dropdown).
- El campo `jugador.equipo` permanece en el modelo de datos core; no se vuelve exclusivo de una
  competición.
- Lo que varía por competición es el **pool de equipos** disponibles (selecciones nacionales para
  Mundial, clubes para Champions) y los textos del flujo de asignación — ambos deben ser datos de
  configuración de competición, no constantes globales del motor.

### D3 — Formato de torneo: personalizable, con default sugerido por competición
- El formato (grupos a partido único o ida/vuelta; eliminación a partido único o ida/vuelta) es
  siempre editable por el usuario en el flujo de creación del torneo, sin importar la competición
  elegida.
- Cada competición aporta un default sugerido:
  - Mundial → sugerido: partido único (grupos y eliminación).
  - Champions → sugerido: ida/vuelta (grupos y eliminación).
- El motor debe aceptar cualquier combinación válida de estos parámetros sin conocer qué
  competición los originó (ver Principio II y IV).

### D4 — Pool de jugadores reutilizable entre torneos
- Cada torneo nuevo arranca con lista de jugadores vacía por defecto.
- Se ofrece la opción de importar jugadores desde un registro acumulado de jugadores de torneos
  anteriores (no limitado al último torneo).
- Esto requiere una entidad `jugador` conceptualmente separada de `jugador_en_torneo`, persistida
  en una clave de localStorage distinta a la del torneo activo (ej. `jugadores_conocidos`).
- Pendiente de spec (no bloqueante para esta constitución): mecanismo de deduplicación de nombres,
  si se guarda historial de equipos usados por jugador, y si el registro se actualiza
  automáticamente al confirmar jugadores en un torneo o requiere acción explícita.

## Mapa de partida — motor vs. tema/competición

Basado en lectura directa del código actual del repo (`app.js`, `index.html`, `styles.css`), no en
suposiciones. Sirve como punto de partida para las specs de refactor, no reemplaza el análisis
detallado que se haga en `/speckit.plan`.

**Ya genérico, reutilizable sin cambios de fondo:** Cálculo de posiciones y desempates;
generación de calendario round-robin (parametrizable a ida/vuelta); motor de eliminación directa y
penales (hoy asume partido único, aislado en dos funciones puntuales); export/import JSON;
mecanismo de persistencia (`guardar`/`cargar`); sistema de tema dark/light vía `data-theme` + CSS
variables (patrón a extender para paleta por competición); router basado en `estado.fase`;
componentes UI base (match-card, standings-table, bracket-match, modales, toast).

**Hardcodeado a Mundial 2026, requiere desacople:** `EQUIPOS_POOL` como constante global; paleta
fija en `:root` de `styles.css` y stripe tricolor del header; colores Tailwind con prefijo `wc-`;
strings específicos ("FC 26", "Mundial", nombre de archivo exportado, textos del modal de sorteo);
formato de torneo cableado directo en el motor (asume siempre partido único); `NOMBRES_RONDAS`
como constante global en vez de derivarse dinámicamente.

## Fuera de alcance de esta constitución

No se asume ni se decide aquí — se resuelve en specs posteriores:
- Detalles de implementación de deduplicación y actualización del pool de jugadores (D4).
- Paleta exacta de Champions más allá del punto de partida (negro/plata/azul UEFA).
- Si D1 + D4 combinados requieren más de una clave de localStorage o un esquema de datos distinto
  al actual.
- Alcance de mejoras adicionales (mecánicas de sorteo, penales, etc.) más allá de lo ya descrito —
  no hay áreas protegidas de antemano, se afina durante el refactor.

## Governance

Esta constitución tiene precedencia sobre cualquier spec, plan o tarea individual. Si una spec
entra en conflicto con un principio o con una decisión D1–D4, la spec se ajusta o esta
constitución se enmienda explícitamente con su razón documentada — nunca se ignora el conflicto en
silencio. Toda spec y todo plan deben verificarse contra estos principios antes de pasar a
implementación.

**Procedimiento de enmienda**: cualquier cambio a este documento requiere justificación explícita
(qué cambia y por qué) registrada en el Sync Impact Report al inicio del archivo, y un incremento
de versión según semver: MAJOR para remociones o redefiniciones incompatibles de principios o
decisiones D1–D4; MINOR para principios o secciones nuevas o expansión material de guías
existentes; PATCH para aclaraciones, redacción o correcciones no semánticas.

**Revisión de cumplimiento**: toda spec (`spec.md`), plan (`plan.md`) y lista de tareas
(`tasks.md`) debe verificarse contra los Principios I–VI y las decisiones D1–D4 antes de pasar a
implementación. Un conflicto no resuelto bloquea el avance a la siguiente fase del flujo Spec Kit.

**Version**: 1.0.0 | **Ratified**: 2026-08-23 | **Last Amended**: 2026-08-23
