import { useState } from 'react';
import { useEcoRuta } from './context/EcoRutaContext';

export default function App() {
  const {
    barrios,
    usuario,
    barrioActual,
    estadoRecoleccion,
    progresoCamion,
    simulando,
    notificaciones,
    reportes,
    registrarUsuario,
    iniciarSimulacionRecorrido,
    simularCambioDeHorario,
    enviarReporte,
  } = useEcoRuta();

  const [nombre, setNombre] = useState('');
  const [barrioSel, setBarrioSel] = useState(barrios[0].id);

  // Pantalla 1: Registro[cite: 45]
  if (!usuario) {
    return (
      <div style={{ padding: 24, fontFamily: 'sans-serif' }}>
        <h2>EcoRuta — Backend Conectado</h2>
        <input placeholder="Tu nombre (Ej: Laura)" value={nombre} onChange={(e) => setNombre(e.target.value)} />
        <select value={barrioSel} onChange={(e) => setBarrioSel(e.target.value)}>
          {barrios.map((b) => (
            <option key={b.id} value={b.id}>{b.nombre}</option>
          ))}
        </select>
        <button onClick={() => registrarUsuario(nombre || 'Laura', barrioSel)}>Entrar a EcoRuta</button>
      </div>
    );
  }

  // Vista base conectada al contexto para que tus compañeros diseñen la UI[cite: 45, 46]
  return (
    <div style={{ padding: 24, fontFamily: 'sans-serif' }}>
      <h3>Hola, {usuario.nombre} | Barrio: {barrioActual.nombre}</h3>
      <p><strong>Estado:</strong> {estadoRecoleccion.titulo} ({estadoRecoleccion.tiempoEstimado})</p>
      <p><strong>Avance simulado del camión:</strong> {progresoCamion}%</p>

      <button onClick={iniciarSimulacionRecorrido} disabled={simulando}>
        {simulando ? 'Simulando recorrido...' : 'Simular recorrido (30 s)'}
      </button>
      <button onClick={simularCambioDeHorario} style={{ marginLeft: 8 }}>
        Simular cambio de horario
      </button>

      <h4>Notificaciones ({notificaciones.length})</h4>
      <ul>{notificaciones.map((n) => <li key={n.id}>[{n.hora}] {n.titulo}: {n.mensaje}</li>)}</ul>

      <h4>Reportes del barrio ({reportes.length})</h4>
      <button onClick={() => enviarReporte({ tipo: 'Basura acumulada', descripcion: 'Prueba desde UI', coordX: 40, coordY: 60 })}>
        Crear reporte de prueba
      </button>
      <ul>{reportes.map((r) => <li key={r.id}>{r.tipo} — <strong>{r.estado}</strong> ({r.descripcion})</li>)}</ul>
    </div>
  );
}