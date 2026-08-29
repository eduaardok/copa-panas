# Contrato: importación de jugadores en `screen-setup`

Garantías de comportamiento de la UI de importación (botón + `#modal-importar-jugadores`)
introducida en la pantalla de registro de jugadores del setup. Ver research.md §5-§6 para el
razonamiento técnico detrás de cada garantía.

## Garantías

1. **Visibilidad condicional, no un estado deshabilitado**: el botón "Importar del registro" solo
   se renderiza en el DOM cuando `cargarJugadoresConocidos().length > 0`. Un usuario sin registro
   previo no ve un botón deshabilitado ni un estado vacío — no ve el botón (spec.md US2, FR-007).
2. **Nunca reemplaza el alta manual**: la opción de importar convive con los `<input>` de alta
   manual en la misma pantalla; en ningún momento el flujo obliga a elegir uno de los dos caminos
   en exclusión del otro (spec.md FR-003, Acceptance Scenario 3 de US1).
3. **No pierde texto tipeado y no confirmado**: abrir el modal de importación, seleccionar
   jugadores, y confirmarlos NUNCA reconstruye ni limpia el valor de un `<input class="jugador-
   input">` que ya tenía texto tipeado por el usuario en la sesión de setup en curso, esté o no
   ese texto ya validado (research.md §6). Solo escribe sobre inputs vacíos o agrega filas nuevas
   al final.
4. **Excluye del modal lo ya presente en el roster en edición**: al abrir el modal, un jugador del
   registro cuyo `nombreNormalizado` ya coincide con un nombre ya tipeado (a mano o importado
   antes) en algún `<input>` del roster actual no aparece como opción seleccionable — evita que el
   usuario dispare manualmente el caso de duplicado que `validarJugadores()` bloquearía igual, en
   vez de dejarlo fallar después de seleccionarlo.
5. **Respeta el tope existente de jugadores (32)**: si la cantidad de seleccionados para importar
   excede los cupos disponibles hasta el máximo ya vigente de `_numJugadores` (32, app.js:1817), se
   importan los que entren y se notifica por toast cuáles quedaron sin importar — nunca se supera
   el tope ni se corrompe el contador `_numJugadores`.
6. **Accesible en mobile y desktop**: el modal sigue el mismo patrón que los modales existentes
   (`modal-overlay`/`modal-box`, `role="dialog" aria-modal="true"`) — se cierra con botón X y con
   clic/toque fuera del `modal-box`, con checkboxes de altura táctil ≥44px (spec.md FR-010).
7. **Cero emojis**: el modal y sus textos usan únicamente Font Awesome o texto plano — sin emojis
   (spec.md FR-011).
