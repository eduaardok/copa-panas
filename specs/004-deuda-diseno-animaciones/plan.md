# Implementation Plan: Deuda de diseño y auditoría de animaciones

**Branch**: `004-deuda-diseno-animaciones` | **Date**: 2026-08-29 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/004-deuda-diseno-animaciones/spec.md`

## Summary

Pulido visual puro (sin cambios de comportamiento ni de modelo de datos): corregir la deuda de
tokens de diseño vigente en `styles.css`/`index.html` detectada por el checker real de Impeccable
(115 hallazgos netos tras descartar 1 falso positivo de atribución de archivo, más 1 hallazgo
manual de balance de layout no cubierto por el checker), y aplicar las 5 oportunidades de
animación + 3 fast-follows de motion aprobados por `find-animation-opportunities` y
`review-animations`. Todas las decisiones de valor están cerradas en
[research.md](./research.md) §Veredictos aprobados y detalladas en [data-model.md](./data-model.md)
y `contracts/`; unas pocas quedan marcadas **[ABIERTO]** para confirmación rápida antes de
`tasks.md` (ver sección "Complexity Tracking" / notas abiertas más abajo).

## Technical Context

**Language/Version**: HTML5, CSS3, JavaScript ES6+ (sin transpilar, sin build step)

**Primary Dependencies**: Tailwind CSS (CDN), Font Awesome (CDN), Google Fonts (Bebas Neue, Inter)
— ninguna dependencia nueva; esta spec no agrega ninguna librería

**Storage**: N/A — sin cambios al esquema de `localStorage` (FR-011)

**Testing**: Sin framework de tests automatizados en el proyecto (consistente con v1/specs
001-003); validación manual en navegador según [quickstart.md](./quickstart.md), más el checker
de Impeccable (`.agents/skills/impeccable/scripts/detect.mjs`) como verificación determinística de
SC-001

**Target Platform**: Chrome/Safari Android+iOS (15+) y navegadores de escritorio modernos (Chrome,
Safari, Firefox, Edge) — sin cambios de alcance de plataforma respecto a specs anteriores

**Project Type**: Single-page static web app (sin frontend/backend separados, sin mobile nativo)

**Performance Goals**: N/A explícito — la única guía de motion es el presupuesto de duración ya
usado en el proyecto (150-280ms para press/entradas, ver `contracts/animation-motion-contract.md`);
no se introduce ninguna animación de larga duración

**Constraints**: No modificar `motor.js` ni `competiciones.js` (FR-010); no modificar modelo de
datos ni flujo funcional (FR-011); toda animación nueva/corregida respeta
`prefers-reduced-motion` sin excepción (FR-009); no reabre el bug de `KNOWN_ISSUES.md` (FR-012)

**Scale/Scope**: 1 archivo CSS (~1500 líneas), 2 archivos de documentación de sistema de diseño
(`DESIGN.md`, `.impeccable/design.json`), cambios puntuales en `app.js` limitados a disparar/quitar
clases de animación (ninguna lógica de negocio) — sin archivos nuevos de aplicación

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio/Decisión | Aplica | Verificación |
|---|---|---|
| I. Sin backend, sin build tools | Sí | Ningún cambio de esta spec introduce Node/bundler/servidor en la app; la instalación temporal de dependencias del checker de Impeccable es tooling externo a la app (se usa y se borra, ver `quickstart.md` §1), no una dependencia del proyecto |
| II. Motor desacoplado de tema/competición | No aplica | Esta spec no toca `motor.js` (FR-010) |
| III. Spec-driven | Sí | Esta spec sigue el flujo completo `specify → clarify(n/a) → plan` con research.md revisado conjuntamente antes de este documento |
| IV. Formato como configuración | No aplica | Sin cambios de formato de torneo |
| V. Un torneo activo global | No aplica | Sin cambios de flujo/estado de torneo |
| VI. Compatibilidad con Impeccable/Emil Kowalski | Sí — **es el principio central de esta spec** | Cumplido por diseño: el catálogo de diseño viene del checker real de Impeccable, las animaciones del veredicto real de `find-animation-opportunities`/`review-animations`; toda animación nueva usa `transform`/`opacity`, respeta `prefers-reduced-motion` (verificado, bloque global ya cubre todo lo nuevo), y no se acepta ningún patrón que entre en fricción con esas skills (0 sugerencias descartadas por esta razón) |
| D1-D4 (decisiones de arquitectura) | No aplica | Ninguna toca torneo activo, asignación de equipos, formato o pool de jugadores — esta spec es visual/motion pura |

**Resultado: PASS.** Sin violaciones que requieran `Complexity Tracking`.

## Project Structure

### Documentation (this feature)

```text
specs/004-deuda-diseno-animaciones/
├── spec.md                                  # Qué se construye y por qué
├── research.md                              # Fase 0 — catálogos + Veredictos aprobados
├── data-model.md                            # Fase 1 — tokens de diseño (el "modelo" de esta feature)
├── contracts/
│   ├── design-tokens-contract.md            # Mapeo cerrado color/radio/font-size
│   └── animation-motion-contract.md         # Mapeo cerrado de animación/motion
├── quickstart.md                            # Fase 1 — validación manual + checker
├── checklists/requirements.md               # Checklist de calidad de spec.md
└── tasks.md                                 # Fase 2 (/speckit-tasks, no este comando)
```

### Source Code (repository root)

Repo de archivos estáticos, sin `src/`/`tests/` — estructura real del proyecto:

```text
mundialito-web/
├── index.html            # Se toca: 1 finding design-system-color, cramped-padding, dark-glow, low-contrast, flat-type-hierarchy
├── styles.css             # Se toca: 114 de los 115 findings de diseño + todo el contrato de animación
├── app.js                 # Se toca SOLO para disparar/quitar clases de animación (modal/toast/campeón) y el clamp() de #lista-competiciones — ninguna lógica de negocio
├── competiciones.js        # Sin cambios (FR-010)
├── motor.js                # Sin cambios (FR-010)
├── DESIGN.md                # Se toca: tokens nuevos (colores, rounded.sheet, posible typography.title)
└── .impeccable/
    ├── design.json          # Se toca: extensions.colorMeta (+ typographyMeta/roundedMeta si aplica)
    └── config.json           # Sin cambios previstos (ver contrato de tokens, "regla de aceptación")
```

**Structure Decision**: no hay decisión de estructura que tomar — el proyecto es intencionalmente
plano (Principio I) y esta spec no agrega ni reorganiza archivos, solo edita el contenido de los
ya existentes listados arriba.

## Complexity Tracking

*No aplica — Constitution Check no tiene violaciones.* Las únicas decisiones pendientes de cierre
rápido antes de generar `tasks.md` son las marcadas **[ABIERTO]** en `data-model.md` (6 tokens de
color reclasificados, radio de `.penal-btn`, 2 glyphs de ícono, y el valor canónico de "Title") —
no son violaciones de la constitución, son detalles de valor exacto que la revisión conjunta dejó
explícitamente para esta fase.
