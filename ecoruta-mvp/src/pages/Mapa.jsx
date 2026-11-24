import { useEcoRuta } from '../context/EcoRutaContext';
import MapaBarrio from '../components/MapaBarrio';
import Icono from '../components/Icono';
import { Semaforo } from '../components/TarjetaEstado';
import { DIST_CASA, RUTA } from '../data/mapaBarrio';
import { useRecorrido } from '../hooks/useRecorrido';

export default function Mapa() {
  const { simulando, iniciarSimulacionRecorrido, estadoRecoleccion, reportes } = useEcoRuta();
  const { porcentajeRuta, distanciaTexto, detenido } = useRecorrido();
  const posCasa = (DIST_CASA / RUTA.largo) * 100;

  return (
    <div className="pagina">
      <section className="tarjeta tarjeta-mapa">
        <div className="mapa-cabecera">
          <Semaforo codigo={estadoRecoleccion.codigo} />
          <div>
            <strong>{estadoRecoleccion.titulo}</strong>
            <small>{simulando ? (detenido ? 'Recogiendo bolsas…' : 'Camión en movimiento') : 'Microrruta Villa Esperanza · Cra 10 a Cra 16'}</small>
          </div>
        </div>
        <MapaBarrio reportes={reportes} />
        <div className="leyenda-mapa">
          <span><i className="linea linea--hecha" /> Recorrido</span>
          <span><i className="linea linea--pendiente" /> Pendiente</span>
          <span><i className="circulo circulo--geocerca" /> Aviso a 100 m</span>
          <span><i className="punto punto--negra" /> Bolsas</span>
        </div>
      </section>

      <section className="tarjeta">
        <div className="barra-ruta">
          <div className="progreso progreso--grande">
            <span style={{ width: `${porcentajeRuta}%` }} />
          </div>
          <span className="marca-casa" style={{ left: `${posCasa}%` }} title="Tu casa">
            <Icono nombre="inicio" tam={12} />
          </span>
        </div>
        <div className="estadisticas">
          <div>
            <small>Llega en</small>
            <strong>{estadoRecoleccion.tiempoEstimado}</strong>
          </div>
          <div>
            <small>Distancia a tu casa</small>
            <strong>{distanciaTexto}</strong>
          </div>
          <div>
            <small>Ruta</small>
            <strong>{porcentajeRuta}%</strong>
          </div>
        </div>
        <button className="boton boton--primario boton--ancho" onClick={iniciarSimulacionRecorrido} disabled={simulando}>
          <Icono nombre={simulando ? 'camion' : 'play'} tam={18} />
          {simulando ? 'Simulando recorrido…' : 'Simular recorrido (30 s)'}
        </button>
      </section>
    </div>
  );
}
