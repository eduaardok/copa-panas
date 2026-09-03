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

// Lista canónica de variables CSS que cualquier competición puede definir en
// paletaCSS. No vive dentro de cada entrada de COMPETICIONES — es compartida
// (spec 002, data-model.md "Fallback de paleta").
//
// --red NO está acá a propósito: es un color semántico fijo de toda la app
// (DESIGN.md "rojo-eliminación" — errores de validación, btn-danger, tab
// activo de ronda eliminatoria), no una decisión de marca por competición.
// Antes se sobreescribía junto con el resto de la paleta y eso mezclaba dos
// roles distintos bajo la misma variable. --accent es el único rol de marca
// que usa ese hueco visual (hoy solo la franja del header).
const VARIABLES_PALETA = ['--accent', '--blue', '--green', '--gold'];

// Valor a usar cuando una competición no define una de las variables de
// VARIABLES_PALETA (spec 002 FR-004a). Hoy solo --green tiene fallback: es
// el verde funcional ya usado en toda la app para "fase de grupos / éxito"
// (DESIGN.md, "Verde Fase de Grupos" — rol semántico compartido, no una
// decisión de marca por competición).
const FALLBACK_PALETA = {
  '--green': '#00a64e'
};

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
      '--accent': '#e0182d',
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
      tituloTorneoDefault: 'MUNDIAL',

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
    formatoDefault: { grupos: 'unico', eliminacion: 'unico', final: 'heredar', penales: true }
  },

  champions: {
    id: 'champions',
    nombre: 'Champions League',

    // Lista fija de 20 clubes reconocibles y habituales de Champions —
    // mismo patrón que las 15 selecciones fijas de Mundial (spec 002 FR-003).
    poolEquipos: [
      'Real Madrid', 'Barcelona', 'Bayern Múnich', 'Manchester City',
      'Manchester United', 'Liverpool', 'Chelsea', 'Arsenal', 'Tottenham',
      'Paris Saint-Germain', 'Juventus', 'AC Milan', 'Inter de Milán',
      'Napoli', 'Atlético de Madrid', 'Borussia Dortmund', 'Ajax',
      'Porto', 'Benfica', 'Sevilla'
    ],

    // Base negro/plata/azul UEFA (spec 002 FR-004). Sin --green (sin rol de
    // marca en Champions — usa el fallback compartido, FALLBACK_PALETA) y
    // sin variable de fondo (el fondo es global por tema, no por
    // competición — ver data-model.md "Decisión: el fondo no es parte de
    // paletaCSS"). --accent reutiliza el mismo plata que --gold (#c0c4cc) en
    // vez del rojo original: Champions nunca tuvo un rojo real en su
    // identidad (spec 002 la definió negro/plata/azul), y el rojo que
    // llevaba antes venía de reusar por error el rol semántico --red
    // (rojo-eliminación/errores de toda la app, no un color de marca).
    paletaCSS: {
      '--accent': '#c0c4cc',
      '--blue': '#0e1e5b',
      '--gold': '#c0c4cc'
    },

    // Mismas 6 claves que Mundial, mismo patrón de textos (spec 002 research.md §3).
    textos: {
      tituloTorneoDefault: 'CHAMPIONS LEAGUE',
      textoAsignarEquipos: 'Elige cómo asignar los clubes de {NOMBRE}',
      tituloSorteoEquipos: 'SORTEANDO CLUBES',
      subtituloSorteoEquipos: 'Asignando clubes de {NOMBRE}...',
      nombreExportDefault: 'champions',
      nombreResumenDefault: 'Torneo Champions'
    },

    // D3: Champions sugiere ida/vuelta en grupos y eliminación.
    formatoDefault: { grupos: 'ida_vuelta', eliminacion: 'ida_vuelta', final: 'unico', penales: true }
  }
};

/**
 * Aplica la paleta de una competición como variables CSS sobre :root.
 * Resetea siempre las 4 variables de VARIABLES_PALETA (no solo las que la
 * competición define) usando FALLBACK_PALETA para las ausentes, de forma
 * determinística sin importar qué competición estaba cargada antes en la
 * misma sesión (spec 002 FR-004a, contracts/palette-application-contract.md).
 */
function aplicarPaletaCompeticion(competicionId) {
  const comp = COMPETICIONES[competicionId];
  if (!comp) return;
  VARIABLES_PALETA.forEach(variable => {
    const valor = comp.paletaCSS[variable] ?? FALLBACK_PALETA[variable];
    document.documentElement.style.setProperty(variable, valor);
  });

  // Franja del header: solo usa colores que la competición define como propios
  // (comp.paletaCSS), nunca el fallback compartido de --green — ese fallback
  // es un verde semántico ("fase de grupos/éxito"), no una decisión de marca,
  // y mezclarlo ahí le da a competiciones sin verde propio (ej. Champions) una
  // franja con un color que no pertenece a su paleta.
  const accent = comp.paletaCSS['--accent'];
  const blue = comp.paletaCSS['--blue'];
  const green = comp.paletaCSS['--green'];
  const franja = green
    ? `linear-gradient(90deg, ${accent} 0%, ${blue} 50%, ${green} 100%)`
    : `linear-gradient(90deg, ${accent} 0%, ${blue} 100%)`;
  document.documentElement.style.setProperty('--header-stripe', franja);
}

/** Resuelve un texto de competición reemplazando el placeholder {NOMBRE}. */
function textoCompeticion(competicionId, clave) {
  const comp = COMPETICIONES[competicionId];
  if (!comp) return '';
  const plantilla = comp.textos[clave] || '';
  return plantilla.replace('{NOMBRE}', comp.nombre);
}
