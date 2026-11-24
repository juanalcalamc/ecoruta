// Utilidades geométricas puras (sin DOM) para mover el camión sobre la ruta.

/** Suaviza las esquinas de una polilínea con curvas cuadráticas. */
export function redondearEsquinas(puntos, radio = 14, pasos = 8) {
  const salida = [puntos[0]];
  for (let i = 1; i < puntos.length - 1; i++) {
    const a = puntos[i - 1];
    const b = puntos[i];
    const c = puntos[i + 1];
    const dab = Math.hypot(a.x - b.x, a.y - b.y);
    const dcb = Math.hypot(c.x - b.x, c.y - b.y);
    const r = Math.min(radio, dab / 2, dcb / 2);
    const p1 = { x: b.x + ((a.x - b.x) / dab) * r, y: b.y + ((a.y - b.y) / dab) * r };
    const p2 = { x: b.x + ((c.x - b.x) / dcb) * r, y: b.y + ((c.y - b.y) / dcb) * r };
    for (let s = 0; s <= pasos; s++) {
      const t = s / pasos;
      const u = 1 - t;
      salida.push({
        x: u * u * p1.x + 2 * u * t * b.x + t * t * p2.x,
        y: u * u * p1.y + 2 * u * t * b.y + t * t * p2.y,
      });
    }
  }
  salida.push(puntos[puntos.length - 1]);
  return salida;
}

/** Precalcula longitudes acumuladas para consultar posiciones en O(log n). */
export function crearRuta(puntos) {
  const acumulado = [0];
  for (let i = 1; i < puntos.length; i++) {
    const d = Math.hypot(puntos[i].x - puntos[i - 1].x, puntos[i].y - puntos[i - 1].y);
    acumulado.push(acumulado[i - 1] + d);
  }
  return { puntos, acumulado, largo: acumulado[acumulado.length - 1] };
}

/** Punto de la ruta a una distancia dada desde el inicio. */
export function puntoEn(ruta, distancia) {
  const { puntos, acumulado, largo } = ruta;
  const d = Math.max(0, Math.min(largo, distancia));
  let lo = 0;
  let hi = acumulado.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (acumulado[mid] <= d) lo = mid;
    else hi = mid;
  }
  const tramo = acumulado[hi] - acumulado[lo] || 1;
  const t = (d - acumulado[lo]) / tramo;
  return {
    x: puntos[lo].x + (puntos[hi].x - puntos[lo].x) * t,
    y: puntos[lo].y + (puntos[hi].y - puntos[lo].y) * t,
  };
}

/** Rumbo (grados) en una distancia, mirando un poco adelante y atrás para suavizar. */
export function anguloEn(ruta, distancia, ventana = 6) {
  const a = puntoEn(ruta, distancia - ventana);
  const b = puntoEn(ruta, distancia + ventana);
  return (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;
}

/** Distancia sobre la ruta del punto más cercano a `p`. */
export function proyectar(ruta, p) {
  const { puntos, acumulado } = ruta;
  let mejor = { dist: Infinity, distancia: 0 };
  for (let i = 0; i < puntos.length - 1; i++) {
    const a = puntos[i];
    const b = puntos[i + 1];
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len2 = dx * dx + dy * dy || 1;
    const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / len2));
    const q = { x: a.x + dx * t, y: a.y + dy * t };
    const dist = Math.hypot(p.x - q.x, p.y - q.y);
    if (dist < mejor.dist) mejor = { dist, distancia: acumulado[i] + Math.sqrt(len2) * t };
  }
  return mejor.distancia;
}

/** Convierte puntos a atributo `d` de SVG. */
export function aPathSvg(puntos) {
  return 'M' + puntos.map((p) => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' L');
}

/** Interpola ángulos por el arco más corto. */
export function interpolarAngulo(actual, destino, factor) {
  const diff = ((destino - actual + 540) % 360) - 180;
  return actual + diff * factor;
}
