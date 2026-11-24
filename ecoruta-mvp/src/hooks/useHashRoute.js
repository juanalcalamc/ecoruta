import { useEffect, useState } from 'react';

// Enrutador mínimo por hash (#/mapa). Funciona en GitHub Pages sin configurar el servidor.
export const RUTAS = ['inicio', 'mapa', 'alertas', 'reportar', 'reportes'];

const leerRuta = () => {
  const ruta = window.location.hash.replace(/^#\/?/, '');
  return RUTAS.includes(ruta) ? ruta : 'inicio';
};

export function useHashRoute() {
  const [ruta, setRuta] = useState(leerRuta);

  useEffect(() => {
    const alCambiar = () => {
      setRuta(leerRuta());
      document.querySelector('.contenido')?.scrollTo({ top: 0 });
    };
    window.addEventListener('hashchange', alCambiar);
    return () => window.removeEventListener('hashchange', alCambiar);
  }, []);

  return ruta;
}

export const navegar = (ruta) => {
  window.location.hash = `/${ruta}`;
};
