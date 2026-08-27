# Quickstart: Validación de Champions League (Copa Panas v2)

Guía de validación manual (el proyecto no tiene framework de tests — Technical Context en
plan.md). Cada escenario referencia los Acceptance Scenarios de `spec.md`.

## Prerrequisitos

- Ningún build: abrir `index.html` directamente (`file://`) o vía servidor estático simple.
- Limpiar estado previo antes de empezar: DevTools → Application → Local Storage → borrar
  `torneo_data`.
- Probar en al menos: mobile (~390px), tablet (~768px) y desktop (≥1024px) — mismos tres anchos de
  referencia que spec 001.
- Usar un navegador con soporte de `color-mix()` (Chrome/Edge/Firefox recientes, Safari ≥16.2) para
  validar el comportamiento esperado de FR-010/SC-004. Si se prueba en Safari/iOS < 16.2, la
  pérdida de efectos translúcidos/glow puntuales (ej. `.glow-gold` sin brillo) es la degradación
  aceptada documentada en research.md §7 — no reportar como bug.

## Escenario 1 — Elegir Champions League al crear un torneo (US1 / FR-001 a FR-003, FR-006)

1. Con `torneo_data` vacío, abrir la app → `screen-competicion` debe mostrar **dos** tarjetas:
   "Mundial 2026" y "Champions League".
2. Elegir "Champions League" → debe avanzar a `screen-setup` igual que con Mundial.
3. Llegar a la pantalla de asignación de equipos, modo sorteo aleatorio → verificar que el pool
   ofrecido son los 20 clubes de `data-model.md` (FR-003), no las 15 selecciones de Mundial.
4. Repetir con asignación manual (dropdown) → mismo pool de 20 clubes disponible.
5. Recorrer tabla de posiciones, calendario, bracket y (al completar el torneo) la pantalla de
   campeón → verificar en cada una que la paleta visible es la de Champions (`#0e1e5b` azul,
   `#c0c4cc` plata en vez de dorado, `#e63946` rojo), no la de Mundial (SC-004). El fondo oscuro
   debe seguir siendo el mismo de siempre (`--bg`/`--bg-mid`/`--bg-card`) — no cambia por
   competición, solo por tema claro/oscuro (data-model.md, "Decisión: el fondo no es parte de
   paletaCSS").
6. En la pantalla de campeón, verificar específicamente el glow detrás de "CAMPEÓN"
   (`.glow-gold`) → debe verse en plata de Champions, no en dorado de Mundial (FR-010; antes de la
   remediación de research.md §7 este glow quedaba dorado sin importar la competición). Revisar
   también al menos un fondo translúcido (ej. `.info-card`) y una sombra de botón primario → deben
   verse tonalizados a la paleta de Champions, no a la de Mundial.
7. Abrir DevTools y correr `git diff --stat motor.js` (o revisar el diff del branch) → debe estar
   vacío (SC-002, FR-006).

## Escenario 2 — Formato de Champions editable (US2 / FR-007, D3)

1. Elegir Champions League → en la pantalla de configuración de formato debe verse preseleccionado
   ida/vuelta en grupos y en eliminación (D3), editable.
2. Cambiar el formato sugerido a partido único antes de confirmar → verificar que el torneo se
   genera con partido único (mismo motor genérico que spec 001, sin ninguna rama por nombre de
   competición).

## Escenario 3 — `screen-competicion` con 2+ opciones (US3 / FR-005, SC-003)

1. Con las dos competiciones registradas, abrir `screen-competicion` en mobile (~390px) → ambas
   tarjetas apiladas, mismo tamaño, cada una con su propio color de acento (dorado para Mundial,
   plata para Champions) — no ambas en dorado.
2. Repetir en desktop (≥1024px) → las tarjetas deben usar el ancho disponible en grid (2 columnas),
   no una columna angosta centrada.
3. Verificar hover/focus de cada tarjeta con teclado (Tab) → el color de foco debe corresponder a
   la paleta de esa tarjeta puntual, no siempre a `--gold`.

## Escenario 4 — Determinismo de paleta sin recargar página (FR-004a, edge case de spec.md)

Ejercita el contrato `contracts/palette-application-contract.md`, fila 3 (el caso que fallaba
antes del fix).

1. Crear y completar (o simplemente dejar activo) un torneo de Mundial 2026.
2. Sin recargar la página, exportar ese torneo a JSON — o simplemente tomar un JSON de Champions ya
   exportado de antes.
3. Desde Config, usar "Importar JSON" con un archivo de un torneo **Champions** mientras el torneo
   Mundial sigue siendo el activo en pantalla (mismo DOM, sin `location.reload()`).
4. Verificar que **todas** las variables de paleta (`--red`, `--blue`, `--green`, `--gold`) quedan
   en el valor de Champions o su fallback documentado — en particular, `--green` NO debe quedar en
   el `#00a64e` "heredado" de Mundial sin que sea la regla de fallback la que lo puso ahí (ambos
   valores pueden coincidir numéricamente — lo que se verifica es que el resultado es el mismo sin
   importar qué competición estaba activa antes, no un accidente de qué se cargó primero).
5. Repetir el import en el otro sentido (Champions activo → importar JSON de Mundial) → Mundial
   debe quedar con sus 4 variables propias, sin cambios respecto al comportamiento actual.

## Fuera de alcance de esta guía

- D4 (pool de jugadores reutilizable) — diferido, sin escenario de validación en esta spec.
- Renombrado de variables CSS por rol — deuda técnica documentada, no hay comportamiento que
  validar porque no cambia en esta spec.
