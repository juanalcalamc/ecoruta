import { useEcoRuta } from '../context/EcoRutaContext';
import { RUTA } from '../data/mapaBarrio';
import { AVANCE_POR_MODO, formatoDistancia, metrosACasa, posicionPorAvance } from '../lib/simulacion';

/** Datos derivados del avance del camión para mostrar en texto (distancia, % de ruta). */
export function useRecorrido() {
  const { progresoCamion, simulando, modoHora } = useEcoRuta();
  const avance = simulando ? progresoCamion : (AVANCE_POR_MODO[modoHora] ?? progresoCamion);
  const { distancia, detenido } = posicionPorAvance(avance);
  const metros = metrosACasa(distancia);
  return {
    porcentajeRuta: Math.round((distancia / RUTA.largo) * 100),
    metros,
    detenido,
    yaPaso: metros < -15,
    distanciaTexto: metros < -15 ? 'Ya pasó' : formatoDistancia(metros),
  };
}
