# Data Model: Cierre de pendientes v2

No hay entidades de dominio nuevas ni cambios de esquema de `localStorage` en esta feature (ver
FR-016). Lo que sigue son las estructuras derivadas y de configuración que las cuatro áreas
introducen o modifican.

## 1. Profundidad de bracket (derivada, Área 1)

No es una entidad persistida — es un valor calculado en cada render, reemplazando el cálculo
existente.

| Campo | Tipo | Derivación | Notas |
|---|---|---|---|
| `profundidadBracket` | `number` (entero) | `Math.ceil(Math.log2(estado.clasificados.length \|\| 2))` | Fija desde que se arman los cruces (no cambia con `rondas.length`). Reemplaza a `rondas.length` en las tres fórmulas de `Math.pow(2, ... - ronda)`. |
| `equiposEnRonda` | `number` (potencia de 2) | `Math.pow(2, profundidadBracket - ronda)` | Mismo tipo de valor que antes — argumento de `nombreDeRonda()` sin cambios en `motor.js`. |

**Invariante**: `equiposEnRonda` es siempre una potencia de 2 entre 2 y la potencia de 2 igual o
superior a `clasificados.length`. `nombreDeRonda()` en `motor.js` no cambia su contrato.

## 2. Estado de validación de jugadores (Área 2)

No persiste — vive en el DOM mientras se completa la lista de jugadores antes de confirmar el
torneo.

| Campo | Tipo | Descripción |
|---|---|---|
| `conteoNombres` | `Map<string, number>` | Conteo de ocurrencias por nombre normalizado, construido en la primera pasada de `validarJugadores()`. Solo cuenta normalizados no vacíos. |
| `inp.classList` (`error`) | Estado DOM por input | Se aplica en la segunda pasada a: inputs vacíos (igual que hoy), e inputs cuyo normalizado tiene `conteoNombres.get(normalizado) > 1`. |

`normalizarNombreJugador()` no cambia — sigue siendo trim + colapso de espacios + minúsculas.

## 3. Excepción de checker de estilo (Área 3)

Estructura ya existente en `.impeccable/config.json` (`ignoreValues[]`), sin cambio de esquema —
solo cambia el contenido de las entradas.

| Campo | Tipo | Descripción |
|---|---|---|
| `rule` | `string` | Antipatrón que la excepción suprime (ej. `side-tab`, `dark-glow`). |
| `value` | `string` | Valor puntual a suprimir, o `"*"` (wildcard — suprime todo hallazgo de esa regla en los archivos listados). |
| `files` | `string[]` (opcional) | Archivos a los que aplica. Requerido de hecho para que una wildcard tenga efecto. |
| `reason` | `string` | Justificación legible; para una wildcard debe enumerar los casos conocidos que cubre. |
| `createdAt` | `string` (ISO 8601) | Fecha de creación de la entrada — se conserva la de la wildcard existente, no se regenera. |

**Regla de negocio verificada (R2)**: `value` puntual solo tiene efecto si `rule` pertenece al
`Set` `directValueRules` del checker (`impeccable-config.mjs:487`). `side-tab` no pertenece a ese
conjunto — cualquier entrada de `side-tab` con `value` puntual (no `"*"`) es inerte por
construcción, independientemente de cuán preciso sea el valor.

## 4. Recurso de precache (Área 4)

No persiste como dato de la app — vive en la `Cache Storage` del navegador, con dos categorías.

| Categoría | Campo | Descripción |
|---|---|---|
| Precache local | ruta relativa | 15 rutas fijas conocidas en build-time (`./index.html`, `./styles.css`, `./motor.js`, `./competiciones.js`, `./app.js`, `./manifest.json`, 9 archivos de `./assets/branding/`). Sin `'./'` — la petición de directorio la resuelve el manejo de navegaciones sirviendo `./index.html` cacheado. Todas resueltas contra `self.registration.scope`. |
| Precache externo | URL absoluta | 3 URLs fijas: hoja de Google Fonts, CSS de FontAwesome 6.5.0, script de Tailwind CDN. Cacheadas con fallback `no-cors` si el fetch normal falla. |
| Runtime cache | URL absoluta, dinámica | Fuentes de `fonts.gstatic.com` y webfonts de cdnjs, referenciadas por los CSS externos pero no conocidas de antemano. Se agregan a la caché la primera vez que se piden (cache-first). |

| Campo de control | Tipo | Descripción |
|---|---|---|
| `CACHE_NAME` | `string` | Constante versionada explícita, nombre de producto (`copa-panas-v1`), nunca el nombre del repositorio. |

## Relaciones y restricciones cruzadas

- `profundidadBracket` y `equiposEnRonda` no tienen relación con `localStorage` — se recalculan en
  cada render a partir de `estado.clasificados` y `estado.partidos_eliminacion`, ya persistidos sin
  cambios de esquema.
- `conteoNombres` no persiste; se reconstruye en cada llamada a `validarJugadores()`.
- Las entradas de `ignoreValues` no tienen relación con el modelo de datos del torneo — son
  configuración de una herramienta de desarrollo, ajena al runtime de la app.
- El precache no interactúa con `localStorage`: guardar/cargar el torneo y exportar/importar JSON
  siguen su camino actual sin pasar por el service worker (FR-016).
