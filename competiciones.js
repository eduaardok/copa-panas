/* ============================================================
   CONFIGURACIÓN DE COMPETICIONES — competiciones.js
   Único punto de configuración por competición (pool de equipos,
   paleta, textos, formato sugerido). No contiene lógica de
   cálculo — motor.js nunca debe importar ni referenciar este
   archivo (Principio II).

   Agregar una competición nueva implica SOLO sumar una entrada
   acá y listarla en la pantalla de selección — nunca tocar
   motor.js ni agregar ramas `if competicion === '...'` fuera del
   único punto donde se lee COMPETICIONES[estado.competicion].
============================================================ */

'use strict';

const COMPETICIONES = {
  mundial: {
    id: 'mundial',
    nombre: 'Mundial 2026',

    // Pool de selecciones asignables a jugadores (idéntico a EQUIPOS_POOL de v1).
    poolEquipos: [
      'Argentina', 'Francia', 'Brasil', 'Inglaterra', 'Portugal',
      'España', 'Alemania', 'Países Bajos', 'Bélgica', 'Italia',
      'Uruguay', 'Colombia', 'Croacia', 'Marruecos', 'Estados Unidos'
    ],

    // Variables CSS a aplicar sobre :root al elegir/cargar esta competición.
    // Valores idénticos a los que hoy están hardcodeados en :root de styles.css.
    paletaCSS: {
      '--red': '#e0182d',
      '--blue': '#0052c8',
      '--green': '#00a64e',
      '--gold': '#c9a84c'
    },

    // Strings de UI específicos de esta competición. Inventario resultado de
    // auditar app.js/index.html con grep (ver contracts/competition-config-schema.md
    // para el detalle del mapeo string-actual → campo). Textos genéricos que NO
    // mencionan la competición (ej. "SORTEO COMPLETADO", "Sortear equipos",
    // "Asignando jugadores a grupos...") se dejaron tal cual en app.js/index.html
    // por ser agnósticos de competición.
    textos: {
      // Header (app.js actualizarHeader) y pantalla de setup: nombre a mostrar
      // cuando el torneo activo todavía no tiene estado.meta.nombre propio.
      tituloTorneoDefault: 'TORNEO FC 26',

      // Subtítulo de "ASIGNAR EQUIPOS" (index.html:160). {NOMBRE} → nombre de la competición.
      textoAsignarEquipos: 'Elige cómo asignar los equipos de {NOMBRE}',

      // Modal de sorteo de equipos (mostrarAnimacionSorteoEquipos).
      tituloSorteoEquipos: 'SORTEANDO EQUIPOS',
      subtituloSorteoEquipos: 'Asignando equipos de {NOMBRE}...',

      // Nombre por defecto (slug) usado al exportar el torneo a JSON cuando
      // el torneo no tiene nombre propio (exportarJSON, app.js:1611).
      nombreExportDefault: 'fc26',

      // Nombre por defecto usado en el resumen de texto (copiarResumen, app.js:1638).
      nombreResumenDefault: 'Torneo FC 26'
    },

    // Formato sugerido por defecto — el usuario siempre puede editarlo (D3/FR-004).
    // Reproduce el comportamiento actual: partido único + penales activos.
    formatoDefault: { grupos: 'unico', eliminacion: 'unico', penales: true }
  }
};

/** Aplica la paleta de una competición como variables CSS sobre :root. */
function aplicarPaletaCompeticion(competicionId) {
  const comp = COMPETICIONES[competicionId];
  if (!comp) return;
  Object.entries(comp.paletaCSS).forEach(([variable, valor]) => {
    document.documentElement.style.setProperty(variable, valor);
  });
}

/** Resuelve un texto de competición reemplazando el placeholder {NOMBRE}. */
function textoCompeticion(competicionId, clave) {
  const comp = COMPETICIONES[competicionId];
  if (!comp) return '';
  const plantilla = comp.textos[clave] || '';
  return plantilla.replace('{NOMBRE}', comp.nombre);
}
