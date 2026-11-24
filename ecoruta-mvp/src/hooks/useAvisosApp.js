import { useCallback, useEffect, useRef, useState } from 'react';
import { useEcoRuta } from '../context/EcoRutaContext';

const CLAVE_SISTEMA = 'ecoruta_front_notif_sistema';

const leerPreferencia = () => {
  try {
    return localStorage.getItem(CLAVE_SISTEMA) === '1';
  } catch {
    return false;
  }
};

/**
 * Estado de interfaz alrededor de las notificaciones del contexto:
 * - cuáles ya vio el usuario (para la insignia de la pestaña Alertas)
 * - reenvío opcional como notificación del sistema operativo + vibración
 */
export function useAvisosApp() {
  const { notificaciones } = useEcoRuta();
  const [vistas, setVistas] = useState(() => new Set());
  const [sistemaActivo, setSistemaActivoState] = useState(leerPreferencia);
  const enviadas = useRef(new Set());

  const noLeidas = notificaciones.filter((n) => !vistas.has(n.id)).length;
  const marcarVistas = useCallback(() => setVistas(new Set(notificaciones.map((n) => n.id))), [notificaciones]);

  const setSistemaActivo = (valor) => {
    setSistemaActivoState(valor);
    try {
      localStorage.setItem(CLAVE_SISTEMA, valor ? '1' : '0');
    } catch {
      /* sin almacenamiento */
    }
  };

  const ultima = notificaciones[0];
  useEffect(() => {
    if (!ultima || enviadas.current.has(ultima.id)) return;
    enviadas.current.add(ultima.id);
    navigator.vibrate?.(ultima.tipo === 'success' ? [160, 80, 160] : 120);
    if (sistemaActivo && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(`EcoRuta · ${ultima.titulo}`, { body: ultima.mensaje, tag: 'ecoruta' });
      } catch {
        /* Android Chrome exige service worker: queda solo el aviso dentro de la app */
      }
    }
  }, [ultima, sistemaActivo]);

  return { noLeidas, marcarVistas, sistemaActivo, setSistemaActivo };
}
