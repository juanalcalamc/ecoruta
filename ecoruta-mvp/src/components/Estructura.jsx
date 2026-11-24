import { useEffect, useRef, useState } from 'react';
import { useEcoRuta } from '../context/EcoRutaContext';
import Icono, { Logo } from './Icono';

const PESTANAS = [
  { ruta: 'inicio', texto: 'Inicio', icono: 'inicio' },
  { ruta: 'mapa', texto: 'Mapa', icono: 'mapa' },
  { ruta: 'reportar', texto: 'Reportar', icono: 'reportar' },
  { ruta: 'reportes', texto: 'Reportes', icono: 'lista' },
  { ruta: 'alertas', texto: 'Alertas', icono: 'campana' },
];

export function Encabezado() {
  const { usuario, barrioActual, barrios, cambiarBarrio, salir } = useEcoRuta();
  return (
    <header className="encabezado">
      <Logo tam={34} />
      <div className="encabezado-texto">
        <span className="encabezado-saludo">Hola, {usuario.nombre}</span>
        <label className="encabezado-barrio">
          <Icono nombre="pin" tam={14} />
          <select value={barrioActual.id} onChange={(e) => cambiarBarrio(e.target.value)} aria-label="Cambiar barrio">
            {barrios.map((b) => (
              <option key={b.id} value={b.id}>{b.nombre}</option>
            ))}
          </select>
        </label>
      </div>
      <button className="boton-icono" onClick={salir} aria-label="Cerrar sesión" title="Cerrar sesión">
        <Icono nombre="salir" tam={20} />
      </button>
    </header>
  );
}

export function BarraPestanas({ ruta, noLeidas }) {
  return (
    <nav className="pestanas" aria-label="Navegación principal">
      {PESTANAS.map((p) => (
        <a key={p.ruta} href={`#/${p.ruta}`} className={`pestana ${ruta === p.ruta ? 'activa' : ''}`} aria-current={ruta === p.ruta ? 'page' : undefined}>
          <span className="pestana-icono">
            <Icono nombre={p.icono} />
            {p.ruta === 'alertas' && noLeidas > 0 && <span className="insignia">{noLeidas}</span>}
          </span>
          {p.texto}
        </a>
      ))}
    </nav>
  );
}

/** Muestra cada notificación nueva como aviso flotante durante 4,5 s, en cualquier pestaña. */
export function Avisos() {
  const { notificaciones } = useEcoRuta();
  const [ocultos, setOcultos] = useState(() => new Set());
  const timers = useRef(new Map());
  const visibles = notificaciones.slice(0, 2).filter((n) => !ocultos.has(n.id));

  useEffect(() => {
    visibles.forEach((n) => {
      if (timers.current.has(n.id)) return;
      timers.current.set(
        n.id,
        setTimeout(() => setOcultos((s) => new Set(s).add(n.id)), 4500),
      );
    });
  });

  useEffect(() => {
    const pendientes = timers.current;
    return () => pendientes.forEach(clearTimeout);
  }, []);

  return (
    <div className="avisos" role="status" aria-live="polite">
      {visibles.map((n) => (
        <div key={n.id} className={`aviso aviso--${n.tipo}`}>
          <Icono nombre={n.tipo === 'success' ? 'check' : n.tipo === 'danger' ? 'alerta' : 'campana'} tam={18} />
          <div>
            <strong>{n.titulo}</strong>
            <p>{n.mensaje}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
