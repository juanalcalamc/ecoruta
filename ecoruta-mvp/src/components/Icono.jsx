// Íconos SVG propios (sin dependencias externas). Trazo de 2 px, heredan el color del texto.
const TRAZOS = {
  inicio: ['M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z'],
  mapa: ['M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2z', 'M9 4v14', 'M15 6v14'],
  campana: ['M6 8a6 6 0 1 1 12 0c0 7 3 8 3 8H3s3-1 3-8', 'M10.3 20a2 2 0 0 0 3.4 0'],
  reportar: ['M12 8v8', 'M8 12h8', 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z'],
  lista: ['M9 6h12', 'M9 12h12', 'M9 18h12', 'M4 6h.01', 'M4 12h.01', 'M4 18h.01'],
  camion: ['M2 7h12v9H2z', 'M14 10h4l3 3v3h-7', 'M6 18.5a1.5 1.5 0 1 0 0-.01', 'M17 18.5a1.5 1.5 0 1 0 0-.01'],
  pin: ['M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z', 'M12 7.5a2 2 0 1 0 0 4 2 2 0 0 0 0-4z'],
  foto: ['M4 7h3l1.5-2h7L17 7h3a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1z', 'M12 10a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7z'],
  play: ['M7 5v14l12-7z'],
  stop: ['M7 7h10v10H7z'],
  check: ['m5 12 5 5L20 7'],
  x: ['M6 6l12 12', 'M18 6 6 18'],
  salir: ['M15 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4', 'M10 16l4-4-4-4', 'M14 12H4'],
  compartir: ['M4 13v6a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-6', 'M12 3v12', 'm7 8 5-5 5 5'],
  reloj: ['M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z', 'M12 7v5l3 2'],
  escudo: ['M12 3 5 6v6c0 4.5 3 7.5 7 9 4-1.5 7-4.5 7-9V6z'],
  alerta: ['M12 4 2.5 20h19z', 'M12 10v4', 'M12 17h.01'],
};

export default function Icono({ nombre, tam = 22, className = '' }) {
  return (
    <svg
      width={tam}
      height={tam}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {TRAZOS[nombre].map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}

export function Logo({ tam = 36 }) {
  return (
    <svg width={tam} height={tam} viewBox="0 0 40 40" aria-hidden="true">
      <rect width="40" height="40" rx="12" fill="var(--verde-600)" />
      <path d="M9 29c7 0 6-10 12-10s5-8 10-8" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeDasharray="0.1 5.5" />
      <circle cx="9" cy="29" r="3" fill="#fff" />
      <circle cx="31" cy="11" r="4" fill="var(--lima)" />
    </svg>
  );
}
