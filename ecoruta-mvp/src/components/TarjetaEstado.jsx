import { useEcoRuta } from '../context/EcoRutaContext';
import { useRecorrido } from '../hooks/useRecorrido';

// Qué luz del semáforo se enciende para cada estado del servicio
const LUZ = { ESPERA: 'roja', YA_PASO: 'roja', PREPARA: 'amarilla', CAMBIO: 'amarilla', SACA_AHORA: 'verde' };

export function Semaforo({ codigo }) {
  const activa = LUZ[codigo];
  return (
    <div className="semaforo" aria-hidden="true">
      {['roja', 'amarilla', 'verde'].map((luz) => (
        <span key={luz} className={`luz luz--${luz} ${activa === luz ? 'encendida' : ''}`} />
      ))}
    </div>
  );
}

export default function TarjetaEstado() {
  const { estadoRecoleccion: estado, simulando } = useEcoRuta();
  const { yaPaso, distanciaTexto } = useRecorrido();

  return (
    <section className={`tarjeta tarjeta-estado estado--${estado.codigo.toLowerCase()}`} aria-live="polite">
      <Semaforo codigo={estado.codigo} />
      <div className="tarjeta-estado-texto">
        <span className="etiqueta">{simulando ? 'En vivo · simulación' : 'Estado de tu cuadra'}</span>
        <h2>{estado.titulo}</h2>
        <p>{estado.subtitulo}</p>
        <div className="tarjeta-estado-datos">
          <span className="dato">
            <small>Llega en</small>
            <strong>{estado.tiempoEstimado}</strong>
          </span>
          {estado.codigo !== 'ESPERA' && !yaPaso && (
            <span className="dato">
              <small>Distancia</small>
              <strong>{distanciaTexto}</strong>
            </span>
          )}
        </div>
      </div>
    </section>
  );
}
