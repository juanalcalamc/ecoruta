// Perfil de movimiento del camión (solo presentación).
// El contexto de EcoRuta entrega el avance de la simulación (0–100 %, lineal en 30 s).
// Aquí se traduce ese avance en una posición realista: acelera, frena y se detiene en cada parada.
import { DIST_CASA, METROS_POR_UNIDAD, PARADAS, RUTA } from '../data/mapaBarrio';

export const DURACION_MS = 30000;
export const PAUSA_MS = 650;
export const GEOCERCA_M = 100;

const suavizar = (t) => -(Math.cos(Math.PI * t) - 1) / 2;

const TRAMOS = (() => {
  const metas = [...PARADAS.map((p) => p.distancia), RUTA.largo];
  const tiempoMovimiento = DURACION_MS - PARADAS.length * PAUSA_MS;
  const tramos = [];
  let t = 0;
  let previa = 0;
  metas.forEach((d, i) => {
    const dur = (tiempoMovimiento * (d - previa)) / RUTA.largo;
    tramos.push({ tipo: 'mov', t0: t, t1: t + dur, d0: previa, d1: d });
    t += dur;
    if (i < PARADAS.length) {
      tramos.push({ tipo: 'pausa', t0: t, t1: t + PAUSA_MS, d0: d, d1: d });
      t += PAUSA_MS;
    }
    previa = d;
  });
  return tramos;
})();

/** Posición del camión para un avance de simulación (0–100). */
export function posicionPorAvance(avance) {
  const ms = (Math.max(0, Math.min(100, avance)) / 100) * DURACION_MS;
  if (ms <= 0) return { distancia: 0, detenido: true };
  if (ms >= DURACION_MS) return { distancia: RUTA.largo, detenido: true };
  const tramo = TRAMOS.find((tr) => ms < tr.t1) ?? TRAMOS[TRAMOS.length - 1];
  if (tramo.tipo === 'pausa') return { distancia: tramo.d0, detenido: true };
  const p = (ms - tramo.t0) / (tramo.t1 - tramo.t0);
  return { distancia: tramo.d0 + (tramo.d1 - tramo.d0) * suavizar(p), detenido: false };
}

export const metrosACasa = (distancia) => (DIST_CASA - distancia) * METROS_POR_UNIDAD;

/** Dónde dibujar el camión cuando no hay simulación, según la hora elegida en el panel demo. */
export const AVANCE_POR_MODO = { temprano: 0, '45_antes': 50, en_ruta: 90, ya_paso: 100 };

export const formatoDistancia = (m) => (m >= 1000 ? `${(m / 1000).toFixed(1).replace('.', ',')} km` : `${Math.max(0, Math.round(m))} m`);
