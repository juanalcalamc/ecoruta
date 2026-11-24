import { supabase, isCloudEnabled } from '../config/supabaseClient';

const STORAGE_KEYS = {
  REPORTES: 'ecoruta_reportes',
  PREFS: 'ecoruta_alert_prefs',
};

// Reportes precargados para demostración (Figura 10)[cite: 46]
const REPORTES_INICIALES = [
  {
    id: 'rep-1',
    barrioId: 'villa-esperanza',
    usuario: 'Ejemplo',
    tipo: 'Basura acumulada en la calle',
    descripcion: 'Bolsas rotas junto al parque (ejemplo).',
    coordX: 48,
    coordY: 52,
    fotoUrl: null,
    estado: 'Atendido',
    fecha: '2026-11-08T18:30:00.000Z',
  },
  {
    id: 'rep-2',
    barrioId: 'villa-esperanza',
    usuario: 'Ejemplo',
    tipo: 'El camión no pasó',
    descripcion: 'Hoy no pasó por la carrera 12 (ejemplo).',
    coordX: 25,
    coordY: 70,
    fotoUrl: null,
    estado: 'En revisión',
    fecha: '2026-11-09T20:15:00.000Z',
  },
];

function validarSupabase() {
  if (!supabase) {
    throw new Error('Supabase no está configurado. Revisa las variables de entorno.');
  }
}

export async function listarCiudades() {
  validarSupabase();
  const { data, error } = await supabase
    .from('ciudades')
    .select('id,nombre')
    .order('nombre');

  if (error) throw error;
  return data;
}

export async function listarBarrios() {
  validarSupabase();
  const { data, error } = await supabase
    .from('barrios')
    .select('id,nombre,ciudad_id,empresa_aseo,dias_recoleccion,hora_inicio,hora_fin')
    .not('ciudad_id', 'is', null)
    .order('nombre');

  if (error) throw error;
  return data;
}

export async function obtenerPerfilUsuario(usuarioAuth) {
  validarSupabase();
  const { data: perfil, error: errorPerfil } = await supabase
    .from('perfiles')
    .select('id,nombre,barrio_id')
    .eq('id', usuarioAuth.id)
    .single();

  if (errorPerfil) throw errorPerfil;

  const { data: barrio, error: errorBarrio } = await supabase
    .from('barrios')
    .select('id,nombre,ciudad_id,empresa_aseo,dias_recoleccion,hora_inicio,hora_fin')
    .eq('id', perfil.barrio_id)
    .single();

  if (errorBarrio) throw errorBarrio;

  const { data: ciudad, error: errorCiudad } = await supabase
    .from('ciudades')
    .select('id,nombre')
    .eq('id', barrio.ciudad_id)
    .single();

  if (errorCiudad) throw errorCiudad;

  return {
    ...perfil,
    email: usuarioAuth.email,
    barrio,
    ciudad,
  };
}

export async function actualizarPerfilUsuario({ usuarioId, nombre, barrioId, ciudadId }) {
  validarSupabase();
  const { data: barrio, error: errorBarrio } = await supabase
    .from('barrios')
    .select('id,ciudad_id')
    .eq('id', barrioId)
    .single();

  if (errorBarrio) throw errorBarrio;
  if (barrio.ciudad_id !== ciudadId) {
    throw new Error('El barrio seleccionado no pertenece a la ciudad elegida.');
  }

  const { data: actualizado, error } = await supabase
    .from('perfiles')
    .update({ nombre: nombre.trim(), barrio_id: barrioId, actualizado_en: new Date().toISOString() })
    .eq('id', usuarioId)
    .select('id')
    .single();

  if (error) throw error;
  if (!actualizado) throw new Error('No se encontró el perfil para actualizar.');

  const { data: usuarioAuth, error: errorSesion } = await supabase.auth.getUser();
  if (errorSesion) throw errorSesion;
  if (!usuarioAuth.user) throw new Error('La sesión expiró. Inicia sesión de nuevo.');

  return obtenerPerfilUsuario(usuarioAuth.user);
}

// 2. Cálculo del estado "Saca / Espera / Ya pasó" según modo simulación[cite: 27, 42, 45]
export function calcularEstadoRecoleccion(modoHoraSimulada, cambioHorarioActivo) {
  if (cambioHorarioActivo) {
    return {
      codigo: 'CAMBIO',
      titulo: 'Cambio de horario reportado',
      subtitulo: 'La ruta de hoy se retrasó 45 minutos por contingencia vial.',
      tiempoEstimado: '≈ 2 h 15 min',
      color: 'warning',
    };
  }

  switch (modoHoraSimulada) {
    case '45_antes':
      return {
        codigo: 'PREPARA',
        titulo: 'Prepara tus bolsas',
        subtitulo: 'El camión está por llegar a tu sector.',
        tiempoEstimado: '≈ 45 min',
        color: 'warning',
      };
    case 'en_ruta':
      return {
        codigo: 'SACA_AHORA',
        titulo: 'Saca tus residuos ahora',
        subtitulo: 'El camión está a menos de 5 minutos de tu casa.',
        tiempoEstimado: '≈ 4 min',
        color: 'success',
      };
    case 'ya_paso':
      return {
        codigo: 'YA_PASO',
        titulo: 'El camión ya pasó',
        subtitulo: 'No saques bolsas; guárdalas hasta el próximo día de recolección.',
        tiempoEstimado: 'Finalizado',
        color: 'danger',
      };
    default:
      return {
        codigo: 'ESPERA',
        titulo: 'Aún es muy temprano',
        subtitulo: 'Mantén tus bolsas dentro de casa para evitar acumulación.',
        tiempoEstimado: '≈ 3 h 20 min',
        color: 'neutral',
      };
  }
}

// Gestión de reportes (Supabase con almacenamiento local para modo de demostración).
export async function listarReportes(barrioId) {
  if (isCloudEnabled) {
    const { data, error } = await supabase
      .from('reportes')
      .select('*')
      .eq('barrio_id', barrioId)
      .order('creado_en', { ascending: false });

    if (error) throw error;
    return data.map(adaptarReporte);
  }

  const raw = localStorage.getItem(STORAGE_KEYS.REPORTES);
  const todos = raw ? JSON.parse(raw) : REPORTES_INICIALES;
  if (!raw) localStorage.setItem(STORAGE_KEYS.REPORTES, JSON.stringify(REPORTES_INICIALES));
  return todos.filter((r) => r.barrioId === barrioId);
}

export async function crearNuevoReporte({ barrioId, usuario, tipo, descripcion, coordX, coordY, fotoBase64 }) {
  const nuevo = {
    id: `rep-${Date.now()}`,
    barrioId,
    usuario: usuario || 'Habitante',
    tipo,
    descripcion,
    coordX: coordX ?? 50,
    coordY: coordY ?? 50,
    fotoUrl: fotoBase64 || null,
    estado: 'Recibido',
    fecha: new Date().toISOString(),
  };

  if (isCloudEnabled) {
    const { data, error } = await supabase
      .from('reportes')
      .insert([
        {
          barrio_id: nuevo.barrioId,
          usuario_nombre: nuevo.usuario,
          tipo_problema: nuevo.tipo,
          descripcion: nuevo.descripcion,
          coord_x: nuevo.coordX,
          coord_y: nuevo.coordY,
          foto_url: nuevo.fotoUrl,
          estado: nuevo.estado,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    if (data) return adaptarReporte(data);
  }

  const raw = localStorage.getItem(STORAGE_KEYS.REPORTES);
  const actuales = raw ? JSON.parse(raw) : REPORTES_INICIALES;
  const actualizados = [nuevo, ...actuales];
  localStorage.setItem(STORAGE_KEYS.REPORTES, JSON.stringify(actualizados));
  return nuevo;
}

function adaptarReporte(reporte) {
  return {
    id: reporte.id,
    barrioId: reporte.barrio_id,
    usuario: reporte.usuario_nombre,
    tipo: reporte.tipo_problema,
    descripcion: reporte.descripcion,
    coordX: Number(reporte.coord_x),
    coordY: Number(reporte.coord_y),
    fotoUrl: reporte.foto_url,
    estado: reporte.estado,
    fecha: reporte.creado_en,
  };
}

// Utilidad para convertir archivo <input type="file"> a Base64 para vista previa/almacenamiento[cite: 29, 46]
export function archivoABase64(file) {
  return new Promise((resolve, reject) => {
    if (!file) return resolve(null);
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}