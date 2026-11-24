import { useEcoRuta } from '../context/EcoRutaContext';
import TarjetaEstado from '../components/TarjetaEstado';
import MapaBarrio from '../components/MapaBarrio';
import Icono from '../components/Icono';
import { navegar } from '../hooks/useHashRoute';
import { useRecorrido } from '../hooks/useRecorrido';

const DIAS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const HOY = DIAS[(new Date().getDay() + 6) % 7];

const MODOS = [
  { valor: 'temprano', texto: 'Muy temprano' },
  { valor: '45_antes', texto: '45 min antes de la recolección' },
  { valor: 'en_ruta', texto: 'Camión en la cuadra' },
  { valor: 'ya_paso', texto: 'Ya pasó' },
];

const dia = (hoy, barrio) => (barrio.dias.includes(hoy) ? `hoy pasa de ${barrio.franja}` : 'hoy no hay recolección');

function Calendario({ barrio }) {
  return (
    <section className="tarjeta">
      <div className="tarjeta-titulo">
        <h3>Tu semana de recolección</h3>
        <span className="chip">{barrio.franja}</span>
      </div>
      <ol className="calendario">
        {DIAS.map((dia) => {
          const ordinaria = barrio.dias.includes(dia);
          return (
            <li key={dia} className={`dia ${ordinaria ? 'activo' : ''} ${dia === HOY ? 'hoy' : ''}`}>
              <span>{dia}</span>
              <span className="dia-bolsas">{ordinaria && <i className="punto punto--negra" title="Día de recolección" />}</span>
            </li>
          );
        })}
      </ol>
      <p className="leyenda">
        <i className="punto punto--negra" /> Día de recolección · {dia(HOY, barrio)} · {barrio.empresa}
      </p>
    </section>
  );
}

export default function Inicio() {
  const { barrioActual, modoHora, setModoHora, simulando, iniciarSimulacionRecorrido, simularCambioDeHorario, estadoRecoleccion } = useEcoRuta();
  const { porcentajeRuta } = useRecorrido();
  const cambioHorario = estadoRecoleccion.codigo === 'CAMBIO';

  return (
    <div className="pagina">
      <TarjetaEstado />

      <section className="tarjeta tarjeta-mapa-mini" onClick={() => navegar('mapa')} role="link" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && navegar('mapa')}>
        <MapaBarrio compacto />
        <div className="progreso" aria-label={`Avance del camión ${porcentajeRuta}%`}>
          <span style={{ width: `${porcentajeRuta}%` }} />
        </div>
        <div className="tarjeta-titulo">
          <span><Icono nombre="camion" tam={16} /> Ruta {porcentajeRuta}% completada</span>
          <span className="enlace">Ver mapa →</span>
        </div>
      </section>

      <section className="tarjeta panel-demo">
        <div className="tarjeta-titulo">
          <h3>Panel de demostración</h3>
          <span className="chip chip--demo">MVP</span>
        </div>
        <button className="boton boton--primario boton--ancho" onClick={iniciarSimulacionRecorrido} disabled={simulando}>
          <Icono nombre={simulando ? 'camion' : 'play'} tam={18} />
          {simulando ? 'Simulando recorrido…' : 'Simular recorrido (30 s)'}
        </button>
        <p className="leyenda">Simular la hora del día:</p>
        <div className="segmentos" role="radiogroup" aria-label="Hora simulada">
          {MODOS.map((m) => (
            <button key={m.valor} role="radio" disabled={simulando} aria-checked={!simulando && modoHora === m.valor} className={!simulando && modoHora === m.valor ? 'activo' : ''} onClick={() => setModoHora(m.valor)}>
              {m.texto}
            </button>
          ))}
        </div>
        <button className={`boton boton--secundario boton--ancho ${cambioHorario ? 'activo' : ''}`} onClick={simularCambioDeHorario}>
          <Icono nombre="alerta" tam={18} />
          {cambioHorario ? 'Quitar cambio de horario' : 'Simular cambio de horario'}
        </button>
      </section>

      <Calendario barrio={barrioActual} />
    </div>
  );
}
