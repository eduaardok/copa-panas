# Quickstart: Validación de Desacople de motor y rediseño visual

Guía de validación manual (el proyecto no tiene framework de tests — Technical Context en
plan.md). Cada escenario referencia los Acceptance Scenarios de `spec.md`.

## Prerrequisitos

- Ningún build: abrir `index.html` directamente en el navegador (`file://`), o servirlo con
  cualquier servidor estático simple (ej. `npx serve .` solo para conveniencia de desarrollo, no
  es un requisito del proyecto).
- Limpiar estado previo antes de empezar: DevTools → Application → Local Storage → borrar
  `torneo_data`.
- Probar en al menos: Chrome desktop (≥1024px), Chrome DevTools en modo mobile (~390px de ancho),
  y un ancho intermedio (~768px) para cubrir los tres anchos de FR-010a/SC-007.

## Escenario 1 — Selección de competición (US1 / FR-001, FR-002)

1. Con `torneo_data` vacío, abrir la app → debe verse la pantalla de selección de competición
   (no el setup de Mundial directo).
2. Elegir "Mundial 2026" → debe avanzar a `screen-setup` con los mismos campos que en v1.
3. Completar el setup y llegar a cualquier fase con torneo activo guardado → recargar la app →
   la pantalla de selección de competición **no** debe volver a aparecer; debe ir directo a la
   pantalla de la fase actual.
4. Desde Config → "Reiniciar torneo" → debe volver a la pantalla de selección de competición
   (no directo a `screen-setup`), confirmando D1.

## Escenario 2 — Flujo Mundial completo, sin regresión (US2 / FR-003 a FR-008)

1. Crear un torneo de 8 jugadores, formato por defecto (partido único, penales activos — el
   default de Mundial no cambia respecto a v1).
2. Asignar equipos por sorteo aleatorio → verificar que los equipos vienen del pool de Mundial
   (mismos 15 nombres que existían en `EQUIPOS_POOL`).
3. Repetir con asignación manual (dropdown) → mismo pool disponible.
4. Configurar grupos (cabezas fijos + sorteo del resto) → jugar toda la fase de grupos, forzar al
   menos un empate de puntos entre 2+ jugadores → verificar que la tabla desempata igual que en
   v1 (diferencia de gol → goles a favor → resultado directo).
5. Definir clasificados, armar cruces, jugar la eliminación directa incluyendo al menos un
   partido resuelto por penales → verificar que el ganador avanza como en v1.
6. Completar la final → debe mostrarse la pantalla de campeón.
7. Exportar el torneo a JSON, borrar `torneo_data`, importar el archivo exportado → el torneo
   debe reconstruirse completo, incluida la competición (`competicion: 'mundial'`) y
   `configFormato`.

## Escenario 3 — Formato ida/vuelta y penales configurables (FR-004, nuevo)

1. Crear un torneo nuevo, en el paso de confirmación editar `configFormato` a
   `{ grupos: 'ida_vuelta', eliminacion: 'ida_vuelta', penales: false }`.
2. Verificar que la fase de grupos genera el doble de partidos por grupo (ida + vuelta) y que la
   tabla de posiciones sigue calculando correctamente sobre el total.
3. Verificar que cada cruce de eliminación tiene 2 partidos (`leg 1`, `leg 2`) y que el ganador se
   decide por marcador agregado.
4. Con `penales: false`, forzar un empate agregado y verificar que se aplica el fallback de
   desempate descrito en `research.md` §5 (no debe quedar un cruce sin ganador).

## Escenario 3b — Selector manual de desempate disponible con penales:true (FR-004a, nuevo)

1. Crear un torneo con `configFormato.penales: true` (el default de Mundial, sin editar el
   formato).
2. Llegar a un partido de eliminación y forzar un empate (partido único o agregado ida/vuelta).
3. En la sección de desempate del modal de resultado deben verse **ambas** opciones: los botones
   de penales (modo por defecto) y un enlace "¿No van a jugar penales? Definir manualmente quién
   avanza".
4. Tocar el enlace → la sección debe cambiar a modo manual ("Avanza X"/"Avanza Y") sin perder el
   empate cargado, con un enlace "Volver a definir por penales" para alternar de nuevo.
5. Elegir un ganador en modo manual y guardar → el partido debe registrar
   `desempateTipo: 'manual'` (no `'penales'`) pese a que `configFormato.penales` sigue en `true`
   para el resto del torneo.
6. El bracket debe avanzar con normalidad a partir de ahí (generar la ronda siguiente o declarar
   campeón si era la final) — mismo mecanismo que con `penales:false`.

## Escenario 4 — Migración de datos v1 (FR-008, SC-003)

1. Guardar manualmente en DevTools un objeto `torneo_data` con la forma v1 (sin `version`, sin
   `competicion`, sin `configFormato` — el shape original de `crearEstadoVacio()` previo a esta
   feature).
2. Abrir la app → debe cargar el torneo sin pedir reinicio, tratarlo como Mundial, y agregarle
   `version: 2`, `competicion: 'mundial'`, `configFormato: {grupos:'unico', eliminacion:'unico', penales:true}`
   automáticamente (verificable inspeccionando `torneo_data` de nuevo tras guardar cualquier
   acción).

## Escenario 5 — Rediseño visual responsive (US3 / FR-009 a FR-012, FR-010a)

1. Recorrer las 9 pantallas del flujo en ~390px (mobile): touch targets ≥44px, bottom-nav fijo
   presente, sin scroll horizontal.
2. Recorrer las mismas pantallas en ~1024px+ (desktop): bottom-nav fijo reemplazado por
   navegación persistente no flotante; tabla de posiciones y bracket aprovechan el ancho (no es
   el layout mobile centrado en una columna angosta).
3. Activar `prefers-reduced-motion: reduce` en el SO/DevTools → recorrer sorteo de equipos, sorteo
   de grupos, confirmación de resultado → animaciones decorativas deben reducirse/desactivarse,
   pero el feedback de confirmación debe seguir siendo perceptible.
4. Inspeccionar con DevTools Performance/Rendering que las animaciones de sorteo y transiciones
   usan `transform`/`opacity` (no propiedades de layout como `width`/`top`/`left` sin `transform`).

## Escenario 6 — Verificación de desacople del motor (SC-006)

```sh
grep -inE "mundial|champions|fc ?26|EQUIPOS_POOL" motor.js
```

Debe devolver 0 resultados. Repetir para confirmar que `motor.js` no importa ni referencia
`competiciones.js` en ningún punto (`grep -n "COMPETICIONES" motor.js` → 0 resultados).
