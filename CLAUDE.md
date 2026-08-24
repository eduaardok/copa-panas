# Copa Panas — CLAUDE.md

## Qué es esto ahora

Este proyecto nació como "Torneo Amigos FC 26": una app de torneo de
fútbol entre amigos con tema fijo Mundial 2026. Está evolucionando a
**Copa Panas v2**, una app multi-competición (Mundial + Champions
League, con más por venir) que arranca desde una pantalla de selección
de competición y desacopla el motor de torneo de la capa de tema/
formato de cada una.

Este archivo es el punto de entrada que Claude Code lee al inicio de
cada sesión. Para las reglas de arquitectura no negociables y las
decisiones de diseño ya cerradas, la fuente de verdad es
**`.specify/memory/constitution.md`** — este documento no la repite
en detalle, la referencia.

---

## Metodología de trabajo: Spec-Driven Development (Spec Kit)

Este proyecto usa GitHub Spec Kit. El flujo de trabajo es:

```
/speckit.constitution   → ya corrido. Ver .specify/memory/constitution.md
/speckit.specify        → define QUÉ se construye (objetivo, criterios de aceptación)
/speckit.clarify         → resuelve ambigüedades antes de planear
/speckit.plan            → arquitectura técnica de la feature
/speckit.tasks           → desglosa el plan en tareas ejecutables
/speckit.analyze         → verifica consistencia contra la constitución (solo lectura)
/speckit.implement       → ejecuta las tareas
```

Reglas para Claude Code en este proyecto:
- **No se implementa nada sin spec previa.** Si se te pide una feature
  sin que exista un spec en `specs/`, el primer paso es generarlo, no
  escribir código directamente.
- **La constitución tiene precedencia.** Si un spec o plan entra en
  conflicto con `.specify/memory/constitution.md`, se señala el
  conflicto explícitamente — no se resuelve en silencio ni a favor de
  lo más fácil de implementar.
- Los specs viven en `specs/NNN-nombre-feature/` (spec.md, plan.md,
  tasks.md), numerados secuencialmente.
- Antes de dar una tarea por terminada, se corre `/speckit.analyze`
  contra la constitución.

---

## Stack técnico (se mantiene desde v1)

- **HTML5** (`index.html`)
- **CSS3** (`styles.css`) + **Tailwind CSS vía CDN**
- **JavaScript ES6+** (`app.js`)
- **Font Awesome** vía CDN (iconos — cero emojis en toda la interfaz)
- **Google Fonts** — Bebas Neue (títulos/marcadores) e Inter (texto)
- Sin build tools, sin Node, sin bundlers. Todo debe funcionar abriendo
  `index.html` directamente o vía GitHub Pages.
- Persistencia: `localStorage`. El esquema de claves puede crecer más
  allá de `torneo_data` según lo que definan los specs de v2 (torneo
  activo global + pool de jugadores reutilizable — ver constitución,
  decisiones D1 y D4).

---

## Responsive: mobile-first, pero PC también importa

**Esto es un requisito nuevo de v2, no estaba en el spec original.**
La v1 fue diseñada exclusivamente para mobile (bottom nav fijo estilo
app nativa, modales tipo bottom-sheet, sin ningún breakpoint de
escritorio). La v2 debe verse igual de cuidada en pantallas grandes,
sin dejar de ser excelente en el celular.

Reglas concretas:
- **Mobile sigue siendo la prioridad de diseño** — la mayoría de las
  partidas se van a registrar desde el celular, en vivo, durante el
  torneo. Ningún ajuste de desktop puede degradar la experiencia
  mobile actual (touch targets ≥44px, `dvh` en vez de `vh`, sin zoom
  automático de Safari, etc. — ver sección de estándares de código).
- **Desktop no es "mobile estirado".** No basta con centrar el layout
  mobile en una columna angosta dentro de una pantalla grande. Los
  componentes que tienen sentido reflow en desktop deben aprovechar el
  espacio (ej. tabla de posiciones y bracket pueden mostrarse con más
  contexto simultáneo, la navegación inferior fija de mobile no tiene
  por qué mantenerse igual en pantallas anchas).
- Definir breakpoints concretos (mobile / tablet / desktop) es tarea
  del spec/plan de rediseño visual, no de este documento — pero
  cualquier plan de UI debe incluir explícitamente el comportamiento
  en al menos esos tres anchos, no solo mobile.
- Esto debe reflejarse en las respuestas de `/impeccable init`
  (plataforma: web, adaptive — no "mobile-only") y respetarse en
  cualquier pase de `/impeccable polish` o `/impeccable audit`.

---

## Diseño visual

- **Rediseño profundo en v2**, aplicado a toda la app (no solo
  pantallas nuevas de Champions) — ver constitución, Principio VI y
  spec de refactor+rediseño combinado.
- Paleta de Mundial se mantiene: negro `#07090f`, rojo `#e0182d`, azul
  `#0052c8`, verde `#00a64e`, dorado `#c9a84c`. Champions define su
  propia paleta (punto de partida: negro/plata/azul UEFA) como parte
  de su spec específica, no de esta.
- Toda animación e interacción debe respetar el Principio VI de la
  constitución: propósito claro, `transform`/`opacity` antes que
  layout, `prefers-reduced-motion`, coherencia entre pantallas y entre
  competiciones. Esto se ejecuta con las skills `impeccable` y
  `emil-design-eng` instaladas en el proyecto — no se reinventan
  reglas de motion por fuera de ellas.
- **Cero emojis** en cualquier parte de la interfaz — navegación,
  tablas, botones, mensajes, pantalla de campeón. Solo Font Awesome o
  SVG inline.

---

## Estándares de código (se mantienen desde v1)

- Comentarios en español, funciones pequeñas con nombres descriptivos
  en español (`calcularPosiciones`, `generarCalendario`, etc.) — este
  estándar se extiende también al código nuevo de v2, incluida
  cualquier capa de configuración de competición.
- Sin dependencias externas más allá de las ya listadas en el stack.
  Sumar una librería nueva vía CDN se evalúa caso por caso (ver
  Principio I de la constitución), no se agrega sin justificarlo en el
  spec correspondiente.
- No usar `eval()`, no usar `document.write()`.
- Manejar errores con `try/catch` donde haya riesgo real (parsing
  JSON, localStorage lleno, etc.).
- El motor de torneo (cálculo de posiciones, generación de calendario,
  avance de bracket) no debe importar ni referenciar constantes
  específicas de competición — ver Principio II de la constitución.
  Esto es una regla dura, no una preferencia de estilo.

### Compatibilidad mobile (se mantiene, ahora junto a desktop)
- Evitar `vh` en iOS (usar `dvh` o JS para altura real).
- No usar `hover` como única indicación de estado (iOS no tiene hover;
  además ahora hay que pensar en el estado hover real de desktop, que
  sí debe usarse ahí donde aporte).
- Touch events y scroll nativo sin bloqueos.
- Inputs con `font-size: 16px` mínimo para evitar zoom automático de
  Safari.
- Todos los modales/popups se cierran con botón X y tocando/clickeando
  fuera del área — en desktop esto debe funcionar igual con mouse.

---

## Deploy

- GitHub Pages. Rutas relativas siempre (`./styles.css`, `./app.js`).
- Debe funcionar tanto con `file://` como desde
  `https://usuario.github.io/repo/`.
- `index.html` en la raíz del repo.
- CDN links siempre HTTPS.

---

## Notas importantes

- La app no fuerza estructuras de grupos ni de eliminación — el
  usuario siempre tiene la última palabra, dentro de los límites que
  define el formato configurado (ver constitución, decisión D3).
- Si `localStorage` está vacío, se muestra la pantalla de selección de
  competición (en v1 era el setup directo — esto cambia en v2, ver
  constitución D1).
- Funcionar perfectamente en Chrome para Android y Safari para iPhone
  (iOS 15+), y ahora también en navegadores de escritorio modernos
  (Chrome, Safari, Firefox, Edge).