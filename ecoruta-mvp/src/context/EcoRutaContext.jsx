import { useState, useEffect, useRef } from 'react';
import { EcoRutaContext } from './ecoRutaContext';
import {
  actualizarPerfilUsuario,
  calcularEstadoRecoleccion,
  listarBarrios,
  listarCiudades,
  listarReportes,
  crearNuevoReporte,
  archivoABase64,
  obtenerPerfilUsuario,
} from '../services/ecoRutaBackend';
import {
  cerrarSesionAuth,
  iniciarSesion as iniciarSesionAuth,
  registrarCuenta,
} from '../services/authService';
import { isCloudEnabled, supabase } from '../config/supabaseClient';

export function EcoRutaProvider({ children }) {
  const [sesion, setSesion] = useState(null);
  const [perfilEstado, setPerfilEstado] = useState({ usuarioId: null, datos: null, error: '' });
  const [ciudades, setCiudades] = useState([]);
  const [barrios, setBarrios] = useState([]);
  const [errorAuth, setErrorAuth] = useState('');
  const [errorCatalogo, setErrorCatalogo] = useState('');
  const [cargandoSesion, setCargandoSesion] = useState(isCloudEnabled);
  const [cargandoCatalogo, setCargandoCatalogo] = useState(isCloudEnabled);
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
  const [reportesEstado, setReportesEstado] = useState({ barrioId: null, datos: [], error: '' });

  const usuarioId = sesion?.user?.id || null;
  const usuario = perfilEstado.usuarioId === usuarioId ? perfilEstado.datos : null;
  const errorPerfil = perfilEstado.usuarioId === usuarioId ? perfilEstado.error : '';
  const cargandoPerfil = Boolean(usuarioId && perfilEstado.usuarioId !== usuarioId);
  const barrioActual = usuario?.barrio || null;
  const ciudadActual = usuario?.ciudad || null;
  const reportes = reportesEstado.barrioId === barrioActual?.id ? reportesEstado.datos : [];
  const errorReportes = reportesEstado.barrioId === barrioActual?.id ? reportesEstado.error : '';
  const estadoRecoleccion = calcularEstadoRecoleccion(modoHora, cambioHorario);

  useEffect(() => {
    if (!isCloudEnabled) return undefined;

    let activo = true;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_evento, nuevaSesion) => {
      setSesion(nuevaSesion);
      setErrorAuth('');
    });

    supabase.auth.getSession().then(({ data, error }) => {
      if (!activo) return;
      if (error) setErrorAuth(error.message);
      setSesion(data.session);
      setCargandoSesion(false);
    }).catch((error) => {
      if (!activo) return;
      setErrorAuth(error.message);
      setCargandoSesion(false);
    });

    return () => {
      activo = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!isCloudEnabled) return undefined;

    let activo = true;
    Promise.all([listarCiudades(), listarBarrios()])
      .then(([ciudadesData, barriosData]) => {
        if (!activo) return;
        setCiudades(ciudadesData);
        setBarrios(barriosData);
        setErrorCatalogo('');
      })
      .catch((error) => {
        if (activo) setErrorCatalogo(error.message);
      })
      .finally(() => {
        if (activo) setCargandoCatalogo(false);
      });

    return () => { activo = false; };
  }, []);

  useEffect(() => {
    if (!sesion?.user) return undefined;

    let activo = true;
    obtenerPerfilUsuario(sesion.user)
      .then((perfil) => {
        if (!activo) return;
        setPerfilEstado({ usuarioId: sesion.user.id, datos: perfil, error: '' });
      })
      .catch((error) => {
        if (activo) {
          setPerfilEstado({
            usuarioId: sesion.user.id,
            datos: null,
            error: `No se pudo cargar tu perfil: ${error.message}`,
          });
        }
      });

    return () => { activo = false; };
  }, [sesion]);

  useEffect(() => {
    if (!barrioActual?.id) return undefined;

    let activo = true;
    listarReportes(barrioActual.id)
      .then((datos) => {
        if (activo) setReportesEstado({ barrioId: barrioActual.id, datos, error: '' });
      })
      .catch((error) => {
        if (activo) setReportesEstado({ barrioId: barrioActual.id, datos: [], error: error.message });
      });

    return () => { activo = false; };
  }, [barrioActual?.id]);

  const registrarUsuario = async (datos) => {
    setErrorAuth('');
    const resultado = await registrarCuenta(datos);
    if (!resultado.session) {
      throw new Error('Supabase aún solicita confirmar el correo. Desactiva “Confirm email” en Authentication → Providers → Email.');
    }
    setSesion(resultado.session);
    return resultado;
  };

  const iniciarSesion = async (email, password) => {
    setErrorAuth('');
    return iniciarSesionAuth(email, password);
  };

  const salir = async () => {
    setErrorAuth('');
    await cerrarSesionAuth();
  };

  const actualizarPerfil = async (datos) => {
    if (!sesion?.user) throw new Error('Tu sesión expiró. Inicia sesión de nuevo.');
    const actualizado = await actualizarPerfilUsuario({ ...datos, usuarioId: sesion.user.id });
    setPerfilEstado({ usuarioId: sesion.user.id, datos: actualizado, error: '' });
    return actualizado;
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
      dispararNotificacion('Aviso de cambio de horario', `La ruta en ${barrioActual?.nombre || 'tu barrio'} tendrá un retraso de 45 minutos hoy.`, 'warning');
    }
  };

  const enviarReporte = async ({ tipo, descripcion, coordX, coordY, archivoFoto }) => {
    if (!barrioActual?.id) throw new Error('Tu perfil no tiene un barrio configurado.');
    const fotoBase64 = await archivoABase64(archivoFoto);
    const creado = await crearNuevoReporte({
      barrioId: barrioActual.id,
      usuario: usuario?.nombre || 'Habitante',
      tipo,
      descripcion,
      coordX,
      coordY,
      fotoBase64,
    });
    setReportesEstado((prev) => ({
      barrioId: barrioActual.id,
      datos: [creado, ...(prev.barrioId === barrioActual.id ? prev.datos : [])],
      error: '',
    }));

    // Avance automático de estado para demostración (Tabla 8)[cite: 28]
    setTimeout(() => {
      setReportesEstado((prev) => (
        prev.barrioId === barrioActual.id
          ? { ...prev, datos: prev.datos.map((r) => (r.id === creado.id ? { ...r, estado: 'En revisión' } : r)) }
          : prev
      ));
    }, 8000);

    return creado;
  };

  return (
    <EcoRutaContext.Provider
      value={{
        ciudades,
        barrios,
        usuario,
        barrioActual,
        ciudadActual,
        estadoRecoleccion,
        modoHora,
        setModoHora,
        progresoCamion,
        simulando,
        preferenciasAlertas,
        setPreferenciasAlertas,
        notificaciones,
        reportes,
        errorReportes,
        cargandoUsuario: cargandoSesion || cargandoPerfil,
        sesionActiva: Boolean(sesion?.user),
        cargandoCatalogo,
        errorAuth: errorAuth || errorPerfil,
        errorCatalogo,
        registrarUsuario,
        iniciarSesion,
        actualizarPerfil,
        salir,
        iniciarSimulacionRecorrido,
        simularCambioDeHorario,
        enviarReporte,
      }}
    >
      {children}
    </EcoRutaContext.Provider>
  );
}