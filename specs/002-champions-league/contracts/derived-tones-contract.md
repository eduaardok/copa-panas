# Contract: Tonos derivados de paleta (`-dim`/`-light`/glow) — FR-010

Contrato nuevo — formaliza la remediación de los 66 `rgba()` hardcodeados y las 5 variables
`-dim`/`-light` de `:root` descrita en `research.md` §7 y `data-model.md`.

## Regla de contrato

Ningún tono derivado de `--red`/`--blue`/`--green`/`--gold` (fondo translúcido, sombra, glow,
borde con transparencia) puede escribirse como un valor de color fijo (`rgba(R,G,B,a)` literal,
hex con alpha, etc.) en `styles.css`. Todo tono derivado se expresa como:

```css
color-mix(in srgb, var(--rol) <alpha%>, transparent)
```

donde `--rol` es una de las 4 variables base y `<alpha%>` reproduce el mismo porcentaje de
opacidad que tenía el literal reemplazado (ej. `rgba(201,168,76,0.12)` → `color-mix(in srgb, var(--gold) 12%, transparent)`).

**Verificable con**: `grep -cE "rgba\((201,168,76|224,24,45|0,82,200|0,166,78)" styles.css` debe
devolver `0` al cerrar esta spec (hoy: 66, ver research.md §7).

## Alcance

- Las 5 variables de `:root` (`--red-dim`, `--blue-dim`, `--green-dim`, `--gold-dim`,
  `--gold-light`) pasan de hex/rgba fijo a fórmula `color-mix()`.
- **Excepción — `--gold-light`**: a diferencia de las otras 4 (todas `rgba(...,alpha<1)`,
  genuinamente translúcidas), `--gold-light` (`#e8c96d`) es un tono sólido y opaco, usado como
  color de texto plano (`color: var(--gold-light)`, ej. `.info-card`, `styles.css:462`) — no una
  translucencia. Aplicarle la fórmula `color-mix(..., transparent)` lo transparentaría por error.
  Se deriva en cambio con `color-mix(in srgb, var(--gold) 65%, white)` (mezcla con blanco, no con
  transparente), reproduciendo el mismo efecto de "tono más claro y sólido" que tenía el hex fijo
  original, ahora derivado de `--gold` en vez de constante. Encontrado durante `/speckit-implement`
  (T006) — no estaba distinguido en la primera versión de este contrato ni de `data-model.md`.
- Los 66 literales sueltos en reglas de componentes (botones, standings, bracket, toasts,
  info-cards, modales, pantalla de campeón — inventario completo por línea en el grep de arriba)
  se reemplazan en el lugar por la fórmula equivalente, o por la variable `-dim`/`-light`
  correspondiente si el alpha coincide exactamente (evita duplicar la misma fórmula).
- **Fuera de alcance**: `--bg`/`--bg-mid`/`--bg-card` y sus derivados de tema (claro/oscuro) — no
  son parte de la paleta por competición (ver data-model.md, "Decisión: el fondo no es parte de
  paletaCSS"), no se tocan.

## Compatibilidad (degradación aceptada, spec.md FR-010/SC-004)

`color-mix()` no tiene soporte en Safari/iOS < 16.2. En esas versiones, la propiedad CSS que usa
`color-mix()` como valor se descarta por completo (cae a su valor inicial o heredado) — el
elemento pierde el efecto translúcido/glow puntual, pero:
- No se rompe el layout (la propiedad afectada es siempre decorativa: `box-shadow`, `background`
  translúcido, `text-shadow`, `border-color` con alpha).
- No se muestra un color incorrecto — simplemente no se muestra ese efecto puntual.
- Los colores sólidos (`var(--red)` etc. sin `color-mix()`) no se ven afectados en absoluto — solo
  dependen del soporte de CSS custom properties, universal desde hace años.

Esta degradación es una decisión explícita, no un olvido — no se re-testea contra iOS real como
parte de esta spec (research.md §7).
