# Quickstart: validación de Deuda de diseño y auditoría de animaciones

**Feature**: [spec.md](./spec.md)

No hay build ni servidor — se valida abriendo `index.html` directo en el navegador (`file://`) o
sirviendo la carpeta con cualquier static server, igual que el resto de la app.

## 1. Deuda de diseño (SC-001)

Prerrequisito: Node disponible (solo para el checker, no para la app).

```
cd .agents/skills/impeccable
npm install --no-save --no-package-lock htmlparser2 css-select css-tree domutils
cd ../../..
node .agents/skills/impeccable/scripts/detect.mjs --json index.html styles.css app.js competiciones.js motor.js
```

Resultado esperado: `0` hallazgos `design-system-color`/`design-system-font-size`/
`design-system-radius` sin justificar (ver [contracts/design-tokens-contract.md](./contracts/design-tokens-contract.md)
para el criterio exacto). Eliminar `node_modules` de `.agents/skills/impeccable/` al terminar —no
es una dependencia de la app.

## 2. Contraste WCAG (parte de SC-001)

Los 3 hallazgos `low-contrast` (texto blanco sobre verde, gris sobre fondo oscuro) se verifican
con el mismo `detect.mjs` — si el checker no los reporta más, están resueltos. Confirmar
visualmente en el navegador que el texto sigue siendo legible en ambos temas.

## 3. Animación (SC-002, SC-004)

Abrir la app en Chrome/Safari desktop y en un viewport mobile (DevTools, ≤414px):

1. **Transiciones de pantalla**: navegar selección de competición → setup → equipos → grupos →
   fase de grupos → clasificados → eliminación → dashboard. Cada cambio de pantalla debe hacer un
   fade corto, no un salto instantáneo.
2. **Modal**: abrir el modal de resultado de un partido y cerrarlo con el botón X. Debe desvanecer
   y bajar, no desaparecer de golpe. Repetir con el modal de importar jugadores y el modal de
   sorteo.
3. **Toast**: disparar cualquier acción que muestre un toast (ej. guardar un resultado inválido).
   Debe entrar y, a los ~3s, salir con el mismo tipo de movimiento (no desaparecer de golpe).
4. **Campeón**: completar un torneo de prueba hasta la pantalla de campeón. La tarjeta debe
   aparecer con una entrada breve (scale+fade), no de golpe; el glow dorado sigue pulsando después.
5. **Hover desktop**: con mouse (no touch), pasar sobre una `.match-card` y sobre un
   `.bracket-match`. Debe haber un cambio sutil de borde/fondo. Repetir en un dispositivo/emulador
   touch — no debe quedar ningún estado "pegado" tras un tap.
6. **`prefers-reduced-motion`**: activar la preferencia del sistema (macOS: Accesibilidad >
   Pantalla > Reducir movimiento; Windows: Configuración > Accesibilidad > Efectos visuales;
   DevTools: `Rendering > Emulate CSS media feature prefers-reduced-motion: reduce`) y repetir los
   5 puntos anteriores — todo debe seguir cambiando de estado correctamente, solo sin el
   movimiento intermedio.

## 4. Regresión funcional (SC-003)

Con un torneo de prueba en cada competición (Mundial y Champions):

- Sorteo/asignación de equipos (aleatorio y manual)
- Registro de resultados de fase de grupos, avance a clasificados
- Fase eliminatoria completa hasta campeón
- Exportar/importar JSON del torneo
- Cambiar tema claro/oscuro en cada pantalla

Ningún paso debe requerir una acción distinta a la que requería antes de esta spec, y ningún dato
debe verse distinto más allá del pulido visual esperado.

## 5. `#lista-competiciones` (hallazgo manual)

Con la pantalla de selección de competición abierta, achicar el viewport hasta pasar el
breakpoint de 640px (donde `#lista-competiciones` pasa a grid de 2 columnas) y comparar la altura
de la tarjeta "Mundial 2026" contra "Champions League" — deben quedar a la misma altura en esa
fila, sin que ninguna se vea recortada o desbalanceada.
