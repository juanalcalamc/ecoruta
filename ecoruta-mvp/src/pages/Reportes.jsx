import { useState } from 'react';
import { useEcoRuta } from '../context/EcoRutaContext';
import Icono from '../components/Icono';
import { navegar } from '../hooks/useHashRoute';

const ESTADOS = ['Recibido', 'En revisión', 'Atendido'];
const FILTROS = ['Todos', ...ESTADOS];

const tiempoRelativo = (fecha) => {
  const seg = Math.round((Date.now() - new Date(fecha).getTime()) / 1000);
  const rtf = new Intl.RelativeTimeFormat('es', { numeric: 'auto' });
  if (seg < 60) return 'hace un momento';
  if (seg < 3600) return rtf.format(-Math.round(seg / 60), 'minute');
  if (seg < 86400) return rtf.format(-Math.round(seg / 3600), 'hour');
  return rtf.format(-Math.round(seg / 86400), 'day');
};

function LineaEstado({ estado }) {
  const actual = ESTADOS.indexOf(estado);
  return (
    <ol className="linea-estado" aria-label={`Estado: ${estado}`}>
      {ESTADOS.map((e, i) => (
        <li key={e} className={i <= actual ? 'hecho' : ''}>
          <span className="linea-punto">{i < actual || estado === 'Atendido' ? <Icono nombre="check" tam={12} /> : null}</span>
          {e}
        </li>
      ))}
    </ol>
  );
}

export default function Reportes() {
  const { reportes } = useEcoRuta();
  const [filtro, setFiltro] = useState('Todos');
  const visibles = filtro === 'Todos' ? reportes : reportes.filter((r) => r.estado === filtro);

  return (
    <div className="pagina">
      <div className="chips chips--filtro">
        {FILTROS.map((f) => (
          <button key={f} className={`chip-opcion ${filtro === f ? 'activo' : ''}`} onClick={() => setFiltro(f)}>
            {f} <small>{f === 'Todos' ? reportes.length : reportes.filter((r) => r.estado === f).length}</small>
          </button>
        ))}
      </div>

      {visibles.length === 0 ? (
        <section className="tarjeta vacio">
          <p>No hay reportes {filtro !== 'Todos' && `en estado «${filtro}»`}.</p>
          <button className="boton boton--primario" onClick={() => navegar('reportar')}>Hacer un reporte</button>
        </section>
      ) : (
        visibles.map((r) => (
          <article key={r.id} className="tarjeta reporte">
            <div className="reporte-cabecera">
              {r.fotoUrl ? <img src={r.fotoUrl} alt="" className="reporte-foto" /> : <span className="reporte-foto reporte-foto--vacia"><Icono nombre="pin" /></span>}
              <div>
                <strong>{r.tipo}</strong>
                <small>
                  {tiempoRelativo(r.fecha)} · {r.usuario}
                  {r.duracionSeg ? ` · enviado en ${r.duracionSeg} s` : ''}
                </small>
              </div>
            </div>
            {r.descripcion && <p>{r.descripcion}</p>}
            <LineaEstado estado={r.estado} />
          </article>
        ))
      )}
    </div>
  );
}
