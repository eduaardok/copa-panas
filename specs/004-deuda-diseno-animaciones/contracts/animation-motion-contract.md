# Contrato: Animación y motion

**Feature**: [../spec.md](../spec.md) · Fuente: [../research.md](../research.md) §2a/§2b,
Veredictos #7/#8. Debe respetar Principio VI de la constitución en cada punto.

## Curva compartida (fast-follow de `review-animations`)

Reemplaza `ease` por un ease-out real en los 4 `@keyframes` de entrada existentes. Un solo valor,
reutilizado por todo lo nuevo de este contrato — no se inventan curvas paralelas:

```css
/* en :root, junto a las demás custom properties */
--ease-entrada: cubic-bezier(0.16, 1, 0.3, 1);
```

Aplicar a: `fadeIn` (`styles.css:1383`), `slideUp` (`:1388`), `slideInUp` (`:1393`), `toastIn`
(`:1398`), y a toda animación nueva de este contrato.

## `transition: all` → propiedades explícitas (fast-follow)

7 selectores, mismo fix en cada uno — sustituir `transition: all 200ms ease;` por las propiedades
que ese selector realmente cambia:

| Selector | Línea | Propiedades reales a declarar |
|---|---|---|
| `.mode-btn` | 325 | `background 200ms ease, border-color 200ms ease, color 200ms ease` |
| `.grupo-tab` | 730 | `background 200ms ease, border-color 200ms ease, color 200ms ease` |
| `.ronda-tab` | 760 | `background 200ms ease, border-color 200ms ease, color 200ms ease` |
| `.cl-check` | 808 | `background 200ms ease, border-color 200ms ease` |
| `.btn-clasificados-num` | 938 | `background 200ms ease, color 200ms ease` |
| `.penal-btn` | 967 | `background 200ms ease, border-color 200ms ease, color 200ms ease` |

Verificar cada selector contra su bloque `.active`/`:hover` real antes de aplicar — la lista de
propiedades de arriba es la mejor lectura del código actual, no una lista ciega.

## Hover gating (fast-follow)

```css
@media (hover: hover) and (pointer: fine) {
  .competicion-card:hover {
    border-color: var(--card-accent, var(--gold));
    background: color-mix(in srgb, var(--card-accent, var(--gold)) 8%, transparent);
    transform: translateY(-2px);
  }
}
.competicion-card:focus-visible {
  border-color: var(--card-accent, var(--gold));
  background: color-mix(in srgb, var(--card-accent, var(--gold)) 8%, transparent);
  transform: translateY(-2px);
}
```

`:focus-visible` queda **fuera** del media query (teclado no tiene "hover" que gatear). El bloque
`@media (prefers-reduced-motion: reduce)` ya existente sigue cubriendo ambos sin cambios.

## Oportunidad #1 — Transición de pantalla

```css
.screen.active { animation: fadeIn 220ms var(--ease-entrada); }
```

Sin cambios en `app.js` — `mostrarPantalla()` ya hace `classList.add('active')`, la animación se
dispara sola. Reutiliza `@keyframes fadeIn` existente.

## Oportunidad #2 — Salida simétrica de modal

```css
@keyframes fadeOut { from { opacity: 1; } to { opacity: 0; } }
@keyframes slideDown { from { transform: translateY(0); opacity: 1; } to { transform: translateY(100%); opacity: 0; } }

.modal-overlay.closing { animation: fadeOut 180ms var(--ease-entrada) forwards; }
.modal-box.closing { animation: slideDown 180ms var(--ease-entrada) forwards; }
```

En `app.js`, cada función de cierre de modal (`cerrarModalResultado:1347`,
`cerrarModalImportarJugadores:517`, cierre de `modal-sorteo:668`, y cualquier otra que haga
`modal.classList.add('hidden')` directo) pasa a:

```js
function cerrarModalConAnimacion(overlayEl, boxEl) {
  overlayEl.classList.add('closing');
  boxEl.classList.add('closing');
  setTimeout(() => {
    overlayEl.classList.remove('closing', 'active');
    overlayEl.classList.add('hidden');
    boxEl.classList.remove('closing');
  }, 180);
}
```

180ms coincide con la duración del keyframe — el `setTimeout` y el CSS deben moverse juntos si se
ajusta la duración. Alternativa equivalente: `overlayEl.addEventListener('animationend', ...,
{once:true})` en vez de `setTimeout`, igual de válida.

## Oportunidad #3 — Salida simétrica de toast

```css
@keyframes toastOut { from { opacity: 1; transform: translateX(-50%) translateY(0); } to { opacity: 0; transform: translateX(-50%) translateY(8px); } }
.toast.leaving { animation: toastOut 180ms var(--ease-entrada) forwards; }
```

En `app.js:147-152` (`mostrarToast`), antes del `el.className = 'toast hidden'` final del
`setTimeout` de 3000ms, insertar un paso intermedio: a los 2820ms (`3000 - 180`) agregar
`el.classList.add('leaving')`, y recién a los 3000ms aplicar `hidden`. Mantener el
`clearTimeout(_toastTimer)` existente — ahora debe limpiar ambos timers si se llama de nuevo antes
de que termine la salida.

## Oportunidad #4 — Revelación de campeón

```css
@keyframes campeonReveal { from { opacity: 0; transform: scale(0.94); } to { opacity: 1; transform: scale(1); } }
.campeon-card { animation: campeonReveal 380ms var(--ease-entrada); }
```

Sin cambios en `app.js` — se dispara solo cuando `dashboard-campeon` pierde `.hidden`. No
interfiere con `.glow-gold`/`pulse-glow`, que sigue su propio loop infinito una vez terminada la
entrada.

## Oportunidad #5 — Hover en match-card / bracket-match (desktop)

```css
@media (hover: hover) and (pointer: fine) {
  .match-card:hover { border-color: var(--blue); background: rgba(255,255,255,0.05); }
  .bracket-match:hover { border-color: var(--blue); background: rgba(255,255,255,0.05); }
}
```

Reutiliza las propiedades ya declaradas en `transition` de `.match-card:546` y
`.bracket-match:664` (`background`/`border-color`/`transform`, 200ms ease) — no se agrega ninguna
duración ni propiedad nueva de transición, solo el estado `:hover` que faltaba.

## Regla de aceptación (SC-002, SC-004)

- Las 5 oportunidades + los 3 fast-follows quedan implementados tal como está arriba (o con ajuste
  menor documentado si el código real difiere en el detalle).
- Con `prefers-reduced-motion: reduce` activo, el bloque global existente
  (`styles.css:1490-1497`) ya cubre toda animación/transición nueva de este contrato sin cambios —
  se verifica, no se re-implementa.
- Ninguna animación nueva anima propiedades de layout — todas usan `transform`/`opacity`/
  `background`/`border-color`, igual que el resto del archivo.
