# Quickstart: validación de Cierre de pendientes v2

Esta guía es ejecutable, no descriptiva. Cada escenario de `plan.md` § Verificación tiene su
comando y su resultado esperado acá. Ningún escenario se marca cumplido sin corrida real.

## Prerrequisitos

- Node.js disponible en PATH (para el servidor estático local y el checker de Impeccable).
- Playwright instalado (o disponible vía MCP/skill del proyecto) para los escenarios V1–V6.
- Los cuatro paquetes del checker (`htmlparser2`, `css-select`, `css-tree`, `domutils`) instalados
  **fuera del repositorio**, en el directorio padre (`WebPractice/`), no dentro de
  `mundialito-web/`:

  ```bash
  cd .. && npm install --no-save --no-package-lock htmlparser2 css-select css-tree domutils
  cd mundialito-web
  ```

  Verificar que `git status` en `mundialito-web` sigue limpio después de esto — nada de este
  paquete debe aparecer como archivo nuevo del repo.

## V1 — HTTP local, offline tras primera carga

```bash
npx http-server . -p 8080 -c-1
```

1. Abrir `http://localhost:8080/index.html` en un navegador con Playwright.
2. Esperar a que `navigator.serviceWorker.ready` resuelva (confirma registro).
3. Cortar la red (Playwright: `context.setOffline(true)`).
4. Recargar la página.
5. **Esperado**: la interfaz carga completa — header, navegación, estilos, tipografía Bebas
   Neue/Inter, íconos de Font Awesome visibles (no glifos rotos).
6. Registrar el resultado de un partido pendiente.
7. Recargar de nuevo (todavía offline).
8. **Esperado**: el resultado registrado sigue presente (persistencia vía `localStorage`, ajena al
   service worker, pero debe seguir funcionando con la app servida desde caché).

## V2 — Subpath (simula GitHub Pages)

```bash
mkdir -p /tmp/pages-sim/mundialito-web
cp -r . /tmp/pages-sim/mundialito-web/
npx http-server /tmp/pages-sim -p 8081 -c-1
```

1. Abrir `http://localhost:8081/mundialito-web/` (con barra final, **sin** `index.html` explícito
   — reproduce cómo Pages sirve la raíz de un repo).
2. Esperar registro del service worker.
3. Cortar la red.
4. Navegar de nuevo a `http://localhost:8081/mundialito-web/`.
5. **Esperado**: mismo resultado que V1 — la navegación de directorio debe resolver al shell
   cacheado (ver contrato § 5.1). Si esto falla mientras V1 pasa, el problema está en el manejo de
   `request.mode === 'navigate'` o en rutas de precache no relativas.

## V3 — `file://`

1. Abrir el `index.html` del repo directamente desde el sistema de archivos
   (`file:///.../mundialito-web/index.html`).
2. Capturar todos los mensajes de consola durante la carga y durante 5 segundos de uso normal
   (crear jugadores, iniciar un torneo).
3. **Esperado**: cero mensajes relacionados a `serviceWorker` o `sw.js` (ni de éxito ni de error) —
   la condición de registro nunca debe evaluarse como verdadera bajo este protocolo. El resto del
   comportamiento de la app debe ser indistinguible del estado previo a esta spec.

## V4 — Nombres de ronda, torneo de 8 clasificados

1. Cargar la app (online, cualquier servidor), crear un torneo con 8 jugadores, avanzar hasta tener
   8 clasificados a eliminación directa.
2. Generar la primera ronda (cuartos).
3. **Esperado**: tanto en la vista de bracket (`renderizarEliminacion()`) como en el dashboard
   (`renderizarDashboard()`), la ronda se etiqueta "Cuartos de final" — nunca "Final" ni "Ronda 1".
4. Jugar los 4 partidos de cuartos, generar semifinales.
5. **Esperado**: cuartos sigue diciendo "Cuartos de final" (no cambió), semifinales dice
   "Semifinales" en ambas vistas.
6. Jugar semifinales, generar la final.
7. **Esperado**: los tres nombres (cuartos, semifinales, final) son correctos y ninguno cambió
   respecto de lo mostrado en pasos anteriores.

## V5 — Nombres de ronda, cantidad no potencia de 2

Repetir V4 con 6 clasificados (o 5). Ver tabla de referencia en
`contracts/round-naming-contract.md`.

**Esperado**: la primera ronda se etiqueta "Cuartos de final" (el bracket tiene profundidad de
cuartos aunque algunos cruces sean byes), y las rondas siguientes son "Semifinales" y "Final" sin
saltos ni nombres erróneos.

## V6 — Duplicados de jugadores

1. En la pantalla de carga de jugadores, escribir el mismo nombre en dos campos distintos (probar
   también con variación de mayúsculas/espacios, ej. `" Juan Pérez"` y `"juan perez"`).
2. **Esperado**: ambos inputs quedan con la clase `.error` — no solo el segundo.
3. Agregar un tercer campo con el mismo nombre.
4. **Esperado**: los tres quedan marcados.
5. Corregir uno de los tres para que ya no coincida.
6. **Esperado**: la marca de error se retira de los dos que dejaron de estar en conflicto; el
   corregido, si no genera un duplicado nuevo, tampoco queda marcado.

## V7 — Checker de Impeccable, conteo estable

```bash
node .agents/skills/impeccable/scripts/detect.mjs --json \
  index.html styles.css app.js competiciones.js motor.js
```

1. Correr **antes** de tocar `.impeccable/config.json`. Capturar stderr — debe estar vacío (sin
   advertencia `DEGRADED`; si aparece, instalar los parsers per Prerrequisitos y repetir). Contar
   hallazgos en el JSON (agrupando por la clave `antipattern`, no `rule`).
2. Aplicar los cambios del Área 3 a `.impeccable/config.json`.
3. Correr el mismo comando exacto de nuevo.
4. **Esperado**: el conteo total es idéntico al del paso 1 (baseline verificado en `research.md`
   R1: **0** en el estado actual del repo).

## V8 — Diff cero en motor.js y competiciones.js

```bash
git diff --stat motor.js competiciones.js
```

**Esperado**: salida vacía. Si hay cualquier línea de diff, detener y flaguear — no forma parte del
alcance de esta spec resolverlo sobre la marcha.
