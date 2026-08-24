# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Usuario primario: el organizador de un torneo de fútbol entre amigos —
la única persona que interactúa con la app durante el torneo en vivo:
registra resultados, avanza el bracket, gestiona el estado del torneo
desde el celular (a veces en cancha, entre partidos) o desde una
computadora al planear.

Copa Panas es un producto genérico: no asume un grupo de amigos
específico ni conocimiento previo del organizador. Cualquier grupo debe
poder abrir la app y armar su torneo sin fricción.

Los demás jugadores no abren la app por su cuenta durante el torneo —
se enteran de resultados por fuera de la app (en persona, WhatsApp) o,
si el organizador decide compartir el JSON exportado, alguien más puede
cargarlo y ver el estado, pero esto no es el flujo primario de uso en
vivo.

## Product Purpose

Gestionar un torneo de fútbol entre amigos de principio a fin —desde
registrar jugadores hasta coronar un campeón— sin backend, sin cuentas,
sin instalación. Éxito significa que el organizador puede armar,
correr y cerrar un torneo completo (grupos + eliminación directa) desde
un solo dispositivo, en cualquier momento, sin depender de conexión a
un servidor.

## Positioning

Es una app 100% estática (HTML/CSS/JS, sin build, sin servidor) que
resuelve todo el ciclo de un torneo amateur —sorteo de equipos,
calendario round-robin, tabla de posiciones con desempate completo,
bracket de eliminación directa, penales, campeón— y cuyo único
mecanismo de "compartir" es exportar/importar un JSON (ej. por
WhatsApp). Ningún competidor liviano ofrece el ciclo completo del
torneo (grupos + eliminación + desempates + bracket visual) sin pedir
cuenta ni servidor.

En evolución de v1 (Mundial 2026 fijo) a v2 "Copa Panas": multi-
competición (Mundial + Champions League, extensible a más), elegible
desde una pantalla de selección inicial, con el motor de torneo
desacoplado de la capa de tema/formato de cada competición (ver
`.specify/memory/constitution.md`, Principio II).

## Operating Context

- Se usa principalmente desde el celular, en vivo, durante el torneo
  (registrando resultados partido a partido), y también desde
  computadora al planear/configurar antes de arrancar.
- Un solo torneo activo a la vez en todo el sistema (constitución D1) —
  no hay multi-torneo en paralelo.
- Compartir el estado del torneo es manual: exportar JSON y enviarlo
  (ej. WhatsApp); no hay sincronización en tiempo real entre
  dispositivos.
- Debe funcionar abriendo `index.html` directo (`file://`) o desplegado
  en GitHub Pages, sin conexión a servidor propio.

## Capabilities and Constraints

- Sin backend, sin build tools mientras sea viable: HTML/CSS/JS puro +
  Tailwind CDN + localStorage (constitución Principio I).
- El motor de torneo (calendario, posiciones/desempates, bracket) no
  debe referenciar nombres de competición, paletas ni pools de equipos
  hardcodeados (constitución Principio II) — es una restricción dura,
  no de estilo.
- Formato de torneo (grupos partido único/ida-vuelta, eliminación
  partido único/ida-vuelta, penales) es configuración editable por el
  usuario en cada torneo, con default sugerido por competición
  (constitución D3).
- Asignación de equipo a jugador: mismo mecanismo en todas las
  competiciones (aleatorio animado o manual); varía el pool de equipos
  y textos por competición (constitución D2).
- Pool de jugadores reutilizable entre torneos vía registro acumulado,
  separado del torneo activo (constitución D4).
- Terminología en español en toda la interfaz y el código (comentarios,
  nombres de función).
- Debe funcionar en Chrome/Android, Safari/iOS 15+, y navegadores de
  escritorio modernos (Chrome, Safari, Firefox, Edge).

## Brand Commitments

- Nombre del proyecto en transición: "Torneo Amigos FC 26" (v1) →
  "Copa Panas" (v2, multi-competición).
- Cero emojis en toda la interfaz — únicamente Font Awesome o SVG
  inline.
- Tipografía: Bebas Neue (títulos/marcadores) + Inter (texto), vía
  Google Fonts.
- Paleta Mundial 2026 (se mantiene, no se rediseña): negro `#07090f`,
  rojo `#e0182d`, azul `#0052c8`, verde `#00a64e`, dorado `#c9a84c`.
  Champions define su propia paleta a partir de negro/plata/azul UEFA
  (pendiente de spec específico).

## Evidence on Hand

No hay testimonios, datos de uso real, ni assets de marca más allá de
lo ya presente en el código (paleta, logo de setup personalizable por
el usuario). No se debe inventar evidencia, benchmarks ni citas de
usuarios en trabajo futuro de diseño.

## Product Principles

- El motor de torneo nunca conoce el nombre de una competición — toda
  diferencia de tema/formato es configuración, no rama de código
  (constitución Principio II y IV).
- Un torneo activo, global, sin excepciones — simplicidad de datos por
  encima de soportar concurrencia (constitución Principio V).
- Mobile es la prioridad de diseño porque el uso real ocurre en vivo
  desde el celular del organizador; desktop debe aprovechar el espacio
  sin degradar mobile (ver CLAUDE.md, sección Responsive).
- Nada se implementa sin spec previa en `specs/` (constitución
  Principio III) — Copa Panas es spec-driven, no vibe coding.
- La app debe seguir sirviéndose como archivos estáticos sin backend;
  cualquier dependencia nueva se justifica caso por caso, nunca por
  default (constitución Principio I).

## Accessibility & Inclusion

Sin requisito de accesibilidad específico más allá de buena práctica
general (contraste, touch targets ≥44px, sin dependencia exclusiva de
`hover`, tamaños de fuente que evitan zoom automático en Safari — ver
CLAUDE.md, sección de estándares de código).
