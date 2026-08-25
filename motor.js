/* ============================================================
   MOTOR DE TORNEO — motor.js
   Cálculo puro: calendario, posiciones/desempates, generación y
   avance de bracket de eliminación.

   REGLA DURA (Principio II de la constitución): este archivo NO
   debe referenciar nombres de competición, textos de interfaz,
   colores ni pools de equipos. Toda variación de comportamiento
   entra exclusivamente por parámetros. Verificable con:
   grep -inE "mundial|champions|fc ?26|EQUIPOS_POOL|COMPETICIONES" motor.js
   (debe devolver 0 resultados).
============================================================ */

'use strict';

// ── IDs únicos (utilidad compartida, sin datos de competición) ─

let _idCounter = Date.now();
function nuevoId() { return `id_${_idCounter++}`; }

// ── Generación de calendario de fase de grupos ──────────────────

/**
 * @param {{id:string, jugadoresIds:string[]}[]} grupos
 * @param {'unico'|'ida_vuelta'} formatoGrupos
 * @returns partido[]
 */
function generarCalendarioGrupos(grupos, formatoGrupos) {
  const partidos = [];
  grupos.forEach(grupo => {
    const jugs = grupo.jugadoresIds;
    for (let i = 0; i < jugs.length; i++) {
      for (let j = i + 1; j < jugs.length; j++) {
        partidos.push({
          id: nuevoId(),
          grupoId: grupo.id,
          localId: jugs[i],
          visitanteId: jugs[j],
          golesLocal: null,
          golesVisitante: null,
          jugado: false,
          vuelta: false
        });
        if (formatoGrupos === 'ida_vuelta') {
          partidos.push({
            id: nuevoId(),
            grupoId: grupo.id,
            localId: jugs[j],
            visitanteId: jugs[i],
            golesLocal: null,
            golesVisitante: null,
            jugado: false,
            vuelta: true
          });
        }
      }
    }
  });
  return partidos;
}

// ── Cálculo de posiciones y desempates ──────────────────────────

/**
 * @param {partido[]} partidosGrupo Partidos (jugados o no) de UN grupo.
 * @param {string[]} jugadoresIds IDs de los jugadores de ese grupo.
 * @returns tabla ordenada [{ id, pj, pg, pe, pp, gf, gc, dg, pts }]
 */
function calcularPosiciones(partidosGrupo, jugadoresIds) {
  const stats = {};
  jugadoresIds.forEach(jid => {
    stats[jid] = { id: jid, pj: 0, pg: 0, pe: 0, pp: 0, gf: 0, gc: 0, dg: 0, pts: 0 };
  });

  const partidos = partidosGrupo.filter(p => p.jugado);
  partidos.forEach(p => {
    const gl = p.golesLocal;
    const gv = p.golesVisitante;
    stats[p.localId].pj++;
    stats[p.visitanteId].pj++;
    stats[p.localId].gf += gl;
    stats[p.localId].gc += gv;
    stats[p.visitanteId].gf += gv;
    stats[p.visitanteId].gc += gl;
    if (gl > gv) {
      stats[p.localId].pg++;
      stats[p.localId].pts += 3;
      stats[p.visitanteId].pp++;
    } else if (gl < gv) {
      stats[p.visitanteId].pg++;
      stats[p.visitanteId].pts += 3;
      stats[p.localId].pp++;
    } else {
      stats[p.localId].pe++;
      stats[p.localId].pts++;
      stats[p.visitanteId].pe++;
      stats[p.visitanteId].pts++;
    }
  });

  Object.values(stats).forEach(s => { s.dg = s.gf - s.gc; });

  const lista = Object.values(stats);
  lista.sort((a, b) => {
    if (b.pts !== a.pts) return b.pts - a.pts;
    if (b.dg !== a.dg) return b.dg - a.dg;
    if (b.gf !== a.gf) return b.gf - a.gf;
    // Resultado directo
    const directos = partidos.filter(p =>
      (p.localId === a.id && p.visitanteId === b.id) ||
      (p.localId === b.id && p.visitanteId === a.id)
    );
    if (directos.length > 0) {
      const d = directos[0];
      const ptsa = d.localId === a.id ? (d.golesLocal > d.golesVisitante ? 3 : d.golesLocal === d.golesVisitante ? 1 : 0) : (d.golesVisitante > d.golesLocal ? 3 : d.golesVisitante === d.golesLocal ? 1 : 0);
      const ptsb = 3 - ptsa === 3 ? 0 : 3 - ptsa;
      if (ptsa !== ptsb) return ptsb - ptsa;
    }
    return 0;
  });
  return lista;
}

/**
 * @param {{grupoId:string, grupoNombre:string, posiciones:object[]}[]} gruposConPosiciones
 *   Salida ya calculada de calcularPosiciones() por cada grupo.
 * @returns lista general ordenada por rank dentro de grupo → pts → dg → gf
 */
function calcularClasificadosGeneral(gruposConPosiciones) {
  const todas = [];
  gruposConPosiciones.forEach(g => {
    g.posiciones.forEach((s, rank) => {
      todas.push({ ...s, grupoId: g.grupoId, grupoNombre: g.grupoNombre, rank });
    });
  });
  todas.sort((a, b) => {
    if (a.rank !== b.rank) return a.rank - b.rank;
    if (b.pts !== a.pts) return b.pts - a.pts;
    if (b.dg !== a.dg) return b.dg - a.dg;
    return b.gf - a.gf;
  });
  return todas;
}

// ── Generación de bracket de eliminación ────────────────────────

/**
 * @param {{id:string, localId:string, visitanteId:string}[]} cruces
 * @param {number} ronda
 * @param {'unico'|'ida_vuelta'} formatoEliminacion
 * @returns partido[] — 1 partido por cruce (leg 1) si 'unico', 2 (leg 1 y leg 2,
 *   local/visitante invertidos) si 'ida_vuelta'
 */
function generarPartidosEliminacion(cruces, ronda, formatoEliminacion) {
  const partidos = [];
  cruces.forEach(c => {
    partidos.push({
      id: nuevoId(),
      cruceId: c.id,
      ronda,
      leg: 1,
      localId: c.localId,
      visitanteId: c.visitanteId,
      golesLocal: null,
      golesVisitante: null,
      ganadorId: null,
      desempateGanadorId: null,
      desempateTipo: null,
      jugado: false
    });
    if (formatoEliminacion === 'ida_vuelta') {
      partidos.push({
        id: nuevoId(),
        cruceId: c.id,
        ronda,
        leg: 2,
        localId: c.visitanteId,
        visitanteId: c.localId,
        golesLocal: null,
        golesVisitante: null,
        ganadorId: null,
        desempateGanadorId: null,
        desempateTipo: null,
        jugado: false
      });
    }
  });
  return partidos;
}

// ── Avance de bracket de eliminación ────────────────────────────

/**
 * Resuelve UN cruce (1 o 2 legs) por marcador agregado, tan pronto como
 * todos sus legs estén jugados — independiente de los demás cruces de la
 * ronda (mismo momento de resolución que v1 con partido único).
 *
 * @param {partido[]} legsDelCruce Los 1 o 2 partidos de un mismo cruceId.
 * @param {{penales:boolean}} configFormato
 * @returns {{resuelto:boolean, ganadorId?:string, pendiente?:'penales'|'manual'}}
 *   `pendiente` indica qué debe pedir la UI cuando hay empate agregado sin
 *   `desempateGanadorId` todavía cargado en el último leg.
 */
function resolverCruce(legsDelCruce, configFormato) {
  const legs = [...legsDelCruce].sort((a, b) => (a.leg || 1) - (b.leg || 1));
  if (!legs.every(p => p.jugado)) return { resuelto: false };

  const primero = legs[0];
  let golesA = 0;
  let golesB = 0; // A = primero.localId, B = primero.visitanteId
  legs.forEach(leg => {
    if (leg.localId === primero.localId) {
      golesA += leg.golesLocal;
      golesB += leg.golesVisitante;
    } else {
      golesA += leg.golesVisitante;
      golesB += leg.golesLocal;
    }
  });

  const ultimoLeg = legs[legs.length - 1];
  if (golesA > golesB) return { resuelto: true, ganadorId: primero.localId };
  if (golesB > golesA) return { resuelto: true, ganadorId: primero.visitanteId };
  if (ultimoLeg.desempateGanadorId) return { resuelto: true, ganadorId: ultimoLeg.desempateGanadorId };
  return { resuelto: false, pendiente: configFormato.penales ? 'penales' : 'manual' };
}

/**
 * Chequea si una ronda completa de eliminación ya tiene ganador definido en
 * todos sus cruces (vía `resolverCruce`, cuyo resultado queda grabado como
 * `ganadorId` en el último leg de cada cruce) y, de ser así, devuelve los
 * ganadores en orden de cruce para que el llamador arme la siguiente ronda.
 *
 * @param {partido[]} partidosRonda Todos los partidos de la ronda actual.
 * @returns {{completo:boolean, ganadoresIds?:string[]}}
 */
function avanzarEliminacion(partidosRonda) {
  const porCruce = {};
  partidosRonda.forEach(p => {
    (porCruce[p.cruceId] = porCruce[p.cruceId] || []).push(p);
  });

  const ganadoresIds = [];
  for (const cruceId of Object.keys(porCruce)) {
    const legs = porCruce[cruceId].sort((a, b) => (a.leg || 1) - (b.leg || 1));
    const ultimoLeg = legs[legs.length - 1];
    if (!ultimoLeg.jugado || !ultimoLeg.ganadorId) return { completo: false };
    ganadoresIds.push(ultimoLeg.ganadorId);
  }
  return { completo: true, ganadoresIds };
}

// ── Nombres de ronda (terminología genérica de bracket, no de competición) ─

const NOMBRES_RONDAS = {
  2: 'Final',
  4: 'Semifinales',
  8: 'Cuartos de final',
  16: 'Octavos de final',
  32: 'Dieciseisavos'
};

/**
 * @param {number} totalEquipos Cantidad de equipos que arrancan la ronda (potencia de 2).
 * @returns {string|undefined} Nombre canónico, o undefined si `totalEquipos` no es
 *   una potencia de 2 conocida — el llamador decide el fallback (ver app.js).
 */
function nombreDeRonda(totalEquipos) {
  return NOMBRES_RONDAS[totalEquipos];
}
