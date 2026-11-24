import { useEffect, useState } from 'react';
import { useEcoRuta } from '../context/EcoRutaContext';
import Icono from '../components/Icono';

const OPCIONES = [
  { clave: 'aviso15Min', titulo: '15 minutos antes', detalle: 'Para que prepares las bolsas dentro de casa.' },
  { clave: 'avisoSacarAhora', titulo: 'Momento exacto de salida', detalle: 'Cuando el camión está a menos de 100 m.' },
  { clave: 'avisoCambioHorario', titulo: 'Cambios de horario', detalle: 'Retrasos o contingencias de la ruta.' },
];

const ICONO_TIPO = { success: 'check', danger: 'alerta', warning: 'reloj', info: 'camion' };

function Interruptor({ activo, onCambio, etiqueta }) {
  return (
    <button role="switch" aria-checked={activo} aria-label={etiqueta} className={`interruptor ${activo ? 'activo' : ''}`} onClick={() => onCambio(!activo)}>
      <span />
    </button>
  );
}

export default function Alertas({ marcarVistas, sistemaActivo, setSistemaActivo }) {
  const { preferenciasAlertas: prefs, setPreferenciasAlertas, notificaciones } = useEcoRuta();
  const soportaSistema = 'Notification' in window;
  const [permiso, setPermiso] = useState(soportaSistema ? Notification.permission : 'no-soportado');

  // Al abrir la pestaña (y con cada alerta nueva mientras está abierta) se marcan como leídas.
  useEffect(() => {
    marcarVistas();
  }, [marcarVistas]);

  const cambiar = (clave, valor) => setPreferenciasAlertas((p) => ({ ...p, [clave]: valor }));

  const activarSistema = async () => {
    const resultado = await Notification.requestPermission();
    setPermiso(resultado);
    if (resultado === 'granted') setSistemaActivo(true);
  };

  return (
    <div className="pagina">
      <section className="tarjeta">
        <div className="tarjeta-titulo">
          <h3>¿Cuándo quieres que te avisemos?</h3>
        </div>
        <ul className="lista-opciones">
          {OPCIONES.map((o) => (
            <li key={o.clave}>
              <div>
                <strong>{o.titulo}</strong>
                <small>{o.detalle}</small>
              </div>
              <Interruptor etiqueta={o.titulo} activo={prefs[o.clave]} onCambio={(v) => cambiar(o.clave, v)} />
            </li>
          ))}
          {soportaSistema && (
            <li>
              <div>
                <strong>Notificaciones del dispositivo</strong>
                <small>{permiso === 'denied' ? 'Bloqueadas en el navegador.' : 'Avisos aunque estés en otra app.'}</small>
              </div>
              {permiso === 'granted' ? (
                <Interruptor etiqueta="Notificaciones del dispositivo" activo={sistemaActivo} onCambio={setSistemaActivo} />
              ) : (
                <button className="boton boton--pequeno" onClick={activarSistema} disabled={permiso === 'denied'}>
                  Activar
                </button>
              )}
            </li>
          )}
        </ul>
      </section>

      <section className="tarjeta">
        <div className="tarjeta-titulo">
          <h3>Historial</h3>
          <span className="chip">{notificaciones.length}</span>
        </div>
        {notificaciones.length === 0 ? (
          <p className="vacio">Aún no hay alertas. Pulsa «Simular recorrido» en Inicio o en Mapa para verlas llegar.</p>
        ) : (
          <ol className="historial">
            {notificaciones.map((n) => (
              <li key={n.id} className={`alerta alerta--${n.tipo}`}>
                <span className="alerta-icono"><Icono nombre={ICONO_TIPO[n.tipo] || 'campana'} tam={18} /></span>
                <div>
                  <strong>{n.titulo}</strong>
                  <p>{n.mensaje}</p>
                </div>
                <time>{n.hora}</time>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
