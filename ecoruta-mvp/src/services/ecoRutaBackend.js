import { supabase, isCloudEnabled } from '../config/supabaseClient';

const STORAGE_KEYS = {
  USER: 'ecoruta_user',
  REPORTES: 'ecoruta_reportes',
  PREFS: 'ecoruta_alert_prefs',
};

// Catálogo base de barrios y horarios de demostración (Capítulo 6.5)[cite: 41, 45]
export const BARRIOS_DATA = [
  {
    id: 'villa-esperanza',
    nombre: 'Villa Esperanza',
    empresa: 'ASEO DEMO S.A. E.S.P.',
    dias: ['Lun', 'Mié', 'Vie'],
    franja: '6:00 p. m. - 9:00 p. m.',
    horaInicio: 18,
    horaFin: 21,
  },
  {
    id: 'ciudad-hayuelos',
    nombre: 'Ciudad Hayuelos',
    empresa: 'Ciudad Limpia Bogotá S.A. E.S.P.',
    dias: ['Mar', 'Jue', 'Sáb'],
    franja: '7:00 p. m. - 10:00 p. m.',
    horaInicio: 19,
    horaFin: 22,
  },
  {
    id: 'el-recreo',
    nombre: 'El Recreo',
    empresa: 'Promoambiental Distrito',
    dias: ['Lun', 'Mié', 'Vie'],
    franja: '6:00 a. m. - 9:00 a. m.',
    horaInicio: 6,
    horaFin: 9,
  },
];

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

// 1. Gestión de usuario local (cumple Ley 1581 de 2012: solo nombre y barrio)[cite: 27, 29]
export function guardarPerfilLocal(nombre, barrioId) {
  const perfil = { nombre: nombre.trim(), barrioId };
  localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(perfil));
  return perfil;
}

export function obtenerPerfilLocal() {
  const raw = localStorage.getItem(STORAGE_KEYS.USER);
  return raw ? JSON.parse(raw) : null;
}

export function cerrarPerfilLocal() {
  localStorage.removeItem(STORAGE_KEYS.USER);
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

// 3. Gestión de reportes (Nube Supabase con fallback automático a localStorage)[cite: 42]
export async function listarReportes(barrioId) {
  if (isCloudEnabled) {
    const { data, error } = await supabase
      .from('reportes')
      .select('*')
      .eq('barrio_id', barrioId)
      .order('creado_en', { ascending: false });

    if (!error && data) return data;
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

    if (!error && data) return data;
  }

  const raw = localStorage.getItem(STORAGE_KEYS.REPORTES);
  const actuales = raw ? JSON.parse(raw) : REPORTES_INICIALES;
  const actualizados = [nuevo, ...actuales];
  localStorage.setItem(STORAGE_KEYS.REPORTES, JSON.stringify(actualizados));
  return nuevo;
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