import { createContext, useContext, useState, useEffect, useRef } from 'react';
import {
  BARRIOS_DATA,
  guardarPerfilLocal,
  obtenerPerfilLocal,
  cerrarPerfilLocal,
  calcularEstadoRecoleccion,
  listarReportes,
  crearNuevoReporte,
  archivoABase64,
} from '../services/ecoRutaBackend';

const EcoRutaContext = createContext(null);

export function EcoRutaProvider({ children }) {
  const [usuario, setUsuario] = useState(() => obtenerPerfilLocal());
  const [barrioId, setBarrioId] = useState(() => obtenerPerfilLocal()?.barrioId || BARRIOS_DATA[0].id);
  const [modoHora, setModoHora] = useState('45_antes');
  const [cambioHorario, setCambioHorario] = useState(false);

  // Estado de simulación GPS (30 segundos)[cite: 42, 45]
  const [progresoCamion, setProgresoCamion] = useState(30);
  const [simulando, setSimulando] = useState(false);
  const timerRef = useRef(null);

  // Alertas y preferencias[cite: 46]
  const [preferenciasAlertas, setPreferenciasAlertas] = useState({
    aviso15Min: true,
    avisoSacarAhora: true,
    avisoCambioHorario: true,
  });
  const [notificaciones, setNotificaciones] = useState([]);
  const [reportes, setReportes] = useState([]);

  const barrioActual = BARRIOS_DATA.find((b) => b.id === barrioId) || BARRIOS_DATA[0];
  const estadoRecoleccion = calcularEstadoRecoleccion(modoHora, cambioHorario);

  useEffect(() => {
    listarReportes(barrioId).then(setReportes);
  }, [barrioId]);

  const registrarUsuario = (nombre, selectedBarrioId) => {
    const perfil = guardarPerfilLocal(nombre, selectedBarrioId);
    setUsuario(perfil);
    setBarrioId(selectedBarrioId);
  };

  const salir = () => {
    cerrarPerfilLocal();
    setUsuario(null);
  };

  const cambiarBarrio = (nuevoBarrioId) => {
    setBarrioId(nuevoBarrioId);
    if (usuario) {
      const actualizado = guardarPerfilLocal(usuario.nombre, nuevoBarrioId);
      setUsuario(actualizado);
    }
  };

  const dispararNotificacion = (titulo, mensaje, tipo = 'info') => {
    setNotificaciones((prev) => [
      { id: Date.now() + Math.random(), titulo, mensaje, tipo, hora: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
      ...prev,
    ]);
  };

  // Simulador de recorrido de 30 segundos (Capítulo 6.5)[cite: 42]
  const iniciarSimulacionRecorrido = () => {
    if (simulando) return;
    setSimulando(true);
    setProgresoCamion(0);
    setNotificaciones([]);

    let paso = 0;
    timerRef.current = setInterval(() => {
      paso += 1;
      const porcentaje = Math.min(100, Math.round((paso / 30) * 100));
      setProgresoCamion(porcentaje);

      if (porcentaje === 50 && preferenciasAlertas.aviso15Min) {
        setModoHora('45_antes');
        dispararNotificacion('El camión está a unos 15 minutos', 'Ve preparando tus bolsas en un lugar fácil de sacar.', 'warning');
      }
      if (porcentaje === 85 && preferenciasAlertas.avisoSacarAhora) {
        setModoHora('en_ruta');
        dispararNotificacion('Saca tus residuos ahora', 'El camión está a menos de 5 minutos de tu casa.', 'success');
      }
      if (porcentaje >= 100) {
        clearInterval(timerRef.current);
        setSimulando(false);
        setModoHora('ya_paso');
        dispararNotificacion('El camión ya pasó por tu sector', 'Si no alcanzaste a sacar la basura, guárdala hasta la próxima ruta.', 'danger');
      }
    }, 1000);
  };

  const simularCambioDeHorario = () => {
    const nuevoEstado = !cambioHorario;
    setCambioHorario(nuevoEstado);
    if (nuevoEstado && preferenciasAlertas.avisoCambioHorario) {
      dispararNotificacion('Aviso de cambio de horario', `La ruta en ${barrioActual.nombre} tendrá un retraso de 45 minutos hoy.`, 'warning');
    }
  };

  const enviarReporte = async ({ tipo, descripcion, coordX, coordY, archivoFoto }) => {
    const fotoBase64 = await archivoABase64(archivoFoto);
    const creado = await crearNuevoReporte({
      barrioId,
      usuario: usuario?.nombre || 'Habitante',
      tipo,
      descripcion,
      coordX,
      coordY,
      fotoBase64,
    });
    setReportes((prev) => [creado, ...prev]);

    // Avance automático de estado para demostración (Tabla 8)[cite: 28]
    setTimeout(() => {
      setReportes((prev) => prev.map((r) => (r.id === creado.id ? { ...r, estado: 'En revisión' } : r)));
    }, 8000);

    return creado;
  };

  return (
    <EcoRutaContext.Provider
      value={{
        barrios: BARRIOS_DATA,
        usuario,
        barrioActual,
        estadoRecoleccion,
        modoHora,
        setModoHora,
        progresoCamion,
        simulando,
        preferenciasAlertas,
        setPreferenciasAlertas,
        notificaciones,
        reportes,
        registrarUsuario,
        salir,
        cambiarBarrio,
        iniciarSimulacionRecorrido,
        simularCambioDeHorario,
        enviarReporte,
      }}
    >
      {children}
    </EcoRutaContext.Provider>
  );
}

export const useEcoRuta = () => useContext(EcoRutaContext);