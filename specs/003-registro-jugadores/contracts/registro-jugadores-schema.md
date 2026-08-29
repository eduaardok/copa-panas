# Contrato: esquema y persistencia de `jugadores_conocidos`

Garantías que cualquier código de `app.js` puede asumir sobre la clave `jugadores_conocidos` de
`localStorage`, independientes de la UI que las dispara. Ver `data-model.md` para la forma exacta
de cada entrada.

## Garantías

1. **Independencia de clave**: `jugadores_conocidos` y `torneo_data` son claves separadas de
   `localStorage`. Ninguna operación sobre una debe leer, escribir, ni fallar en función de la
   otra. Borrar `torneo_data` (reiniciar torneo, D1) nunca borra `jugadores_conocidos`, y
   viceversa.
2. **Lectura tolerante a ausencia y corrupción**: `cargarJugadoresConocidos()` devuelve `[]` en
   los tres casos siguientes, sin lanzar ni bloquear el flujo de setup: la clave no existe, el
   valor no es JSON válido, o el JSON es válido pero no es un array. Nunca hay un estado en el que
   la ausencia de esta clave impida crear un torneo (spec.md FR-007, US2).
3. **Escritura tolerante a fallo**: `guardarJugadoresConocidos(lista)` captura cualquier excepción
   de `localStorage.setItem` (ej. cuota excedida) y lo reporta con el mismo mecanismo ya usado
   para `torneo_data` (`mostrarToast(..., 'error')`, app.js:75) — nunca deja el flujo de
   confirmación de un torneo en un estado roto: `estado.jugadores` y `torneo_data` ya se
   guardaron antes de este paso (research.md §7), así que un fallo aquí solo significa que el
   registro no se actualizó, no que el torneo se pierda.
4. **Sin duplicados por construcción**: en cualquier momento, no existen dos entradas de
   `jugadores_conocidos` con el mismo `nombreNormalizado`. `actualizarRegistroJugadores()` es la
   única función que escribe en esta clave con nombres nuevos, y siempre revisa por
   `nombreNormalizado` antes de agregar (data-model.md, "Ciclo de vida").
5. **Nunca se borra una entrada**: ninguna función de esta spec elimina entradas de
   `jugadores_conocidos`. El único crecimiento posible es agregar o actualizar `nombre`/
   `ultimoUso` de una entrada existente.
6. **`motor.js` no la conoce**: ninguna función de `motor.js` lee ni escribe
   `jugadores_conocidos`, ni recibe esa clave como parámetro (research.md §4, spec.md FR-009).
