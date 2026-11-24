// Plano simulado del barrio piloto "Villa Esperanza" (coordenadas en un lienzo de 400 × 400).
import { aPathSvg, crearRuta, proyectar, redondearEsquinas } from '../lib/geometria';

export const LIENZO = 400;
export const ANCHO_CALLE = 18;
export const METROS_POR_UNIDAD = 1.5; // la ruta completa mide ≈ 2,5 km

export const CALLES = [
  { y: 55, nombre: 'Calle 45' },
  { y: 155, nombre: 'Calle 44' },
  { y: 255, nombre: 'Calle 43' },
  { y: 355, nombre: 'Calle 42' },
];

export const CARRERAS = [
  { x: 45, nombre: 'Cra 10' },
  { x: 150, nombre: 'Cra 12' },
  { x: 255, nombre: 'Cra 14' },
  { x: 360, nombre: 'Cra 16' },
];

/** Manzanas generadas a partir de la cuadrícula de calles. */
export const MANZANAS = (() => {
  const xs = [-20, ...CARRERAS.map((c) => c.x), LIENZO + 20];
  const ys = [-20, ...CALLES.map((c) => c.y), LIENZO + 20];
  const m = ANCHO_CALLE / 2 + 3;
  const lista = [];
  for (let i = 0; i < xs.length - 1; i++) {
    for (let j = 0; j < ys.length - 1; j++) {
      lista.push({
        id: `${i}-${j}`,
        x: xs[i] + m,
        y: ys[j] + m,
        w: xs[i + 1] - xs[i] - 2 * m,
        h: ys[j + 1] - ys[j] - 2 * m,
        parque: i === 2 && j === 2,
      });
    }
  }
  return lista;
})();

// Microrruta en zigzag: recorre las cuatro calles del barrio y termina en la Calle 42.
const VERTICES = [
  { x: -12, y: 55 },
  { x: 360, y: 55 },
  { x: 360, y: 155 },
  { x: 45, y: 155 },
  { x: 45, y: 255 },
  { x: 360, y: 255 },
  { x: 360, y: 355 },
  { x: -12, y: 355 },
];

export const RUTA = crearRuta(redondearEsquinas(VERTICES, 16));
export const RUTA_PATH = aPathSvg(RUTA.puntos);

export const CASA = { x: 92, y: 376, rutaX: 92, rutaY: 355 };
export const DIST_CASA = proyectar(RUTA, { x: CASA.rutaX, y: CASA.rutaY });

// Puntos donde el camión se detiene a recoger bolsas.
export const PARADAS = [
  { x: 110, y: 55, lado: 1 },
  { x: 290, y: 55, lado: -1 },
  { x: 250, y: 155, lado: 1 },
  { x: 100, y: 155, lado: -1 },
  { x: 200, y: 255, lado: 1 },
  { x: 305, y: 255, lado: -1 },
  { x: 230, y: 355, lado: -1 },
  { x: CASA.rutaX, y: CASA.rutaY, lado: 1, esCasa: true },
]
  .map((p, i) => ({ ...p, id: i, distancia: proyectar(RUTA, p) }))
  .sort((a, b) => a.distancia - b.distancia);
