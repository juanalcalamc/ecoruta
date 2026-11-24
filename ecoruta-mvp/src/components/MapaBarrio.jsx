import { memo, useEffect, useRef } from 'react';
import { useEcoRuta } from '../context/EcoRutaContext';
import {
  ANCHO_CALLE,
  CALLES,
  CARRERAS,
  CASA,
  LIENZO,
  MANZANAS,
  METROS_POR_UNIDAD,
  PARADAS,
  RUTA,
  RUTA_PATH,
} from '../data/mapaBarrio';
import { anguloEn, interpolarAngulo, puntoEn } from '../lib/geometria';
import { AVANCE_POR_MODO, GEOCERCA_M, formatoDistancia, metrosACasa, posicionPorAvance } from '../lib/simulacion';
import './MapaBarrio.css';

const COLOR_ESTADO = { Recibido: '#3E7BFA', 'En revisión': '#F5A524', Atendido: '#1FAF6B' };

/** Capa estática: manzanas, parque, calles y nombres. Se memoriza porque nunca cambia. */
const PlanoBase = memo(function PlanoBase({ conNombres }) {
  return (
    <g>
      <rect width={LIENZO} height={LIENZO} className="mapa-calles" />
      {MANZANAS.map((m) => (
        <rect key={m.id} x={m.x} y={m.y} width={m.w} height={m.h} rx="7" className={m.parque ? 'mapa-parque' : 'mapa-manzana'} />
      ))}
      {MANZANAS.filter((m) => m.parque).map((m) =>
        [0.25, 0.7, 0.45, 0.2, 0.78].map((f, i) => (
          <circle key={`${m.id}-${i}`} cx={m.x + m.w * f} cy={m.y + m.h * [0.3, 0.25, 0.6, 0.75, 0.72][i]} r="7" className="mapa-arbol" />
        )),
      )}
      {conNombres && (
        <g className="mapa-nombres">
          {CALLES.map((c) => (
            <text key={c.nombre} x="392" y={c.y + 3.5} textAnchor="end">{c.nombre}</text>
          ))}
          {CARRERAS.map((c) => (
            <text key={c.nombre} x={c.x} y="392" textAnchor="middle" transform={`rotate(-90 ${c.x} 392)`} dx="22" dy="3.5">{c.nombre}</text>
          ))}
          <text x="202" y="240" textAnchor="middle" className="mapa-nombre-parque">Parque</text>
        </g>
      )}
    </g>
  );
});

function Camion() {
  return (
    <g className="camion-cuerpo">
      <ellipse cx="1" cy="2.5" rx="15" ry="8" className="camion-sombra" />
      <rect x="-14" y="-7" width="20" height="14" rx="3" className="camion-caja" />
      <path d="M-11 -4.5h14M-11 0h14M-11 4.5h14" className="camion-rayas" />
      <rect x="6.5" y="-6.5" width="8" height="13" rx="3" className="camion-cabina" />
      <rect x="10.5" y="-5" width="2.6" height="10" rx="1.2" className="camion-vidrio" />
      <circle cx="8.5" cy="0" r="1.8" className="camion-baliza" />
    </g>
  );
}

export default function MapaBarrio({ compacto = false, seleccion = null, onSeleccionar, reportes = [] }) {
  const { progresoCamion, simulando, modoHora } = useEcoRuta();
  const svgRef = useRef(null);
  const camionRef = useRef(null);
  const burbujaRef = useRef(null);
  const textoBurbujaRef = useRef(null);
  const trazoRef = useRef(null);
  const geocercaRef = useRef(null);
  const bolsasRef = useRef([]);

  // El contexto avanza 1 vez por segundo en saltos redondeados (3 % o 4 %).
  // Para un movimiento continuo, durante la simulación el mapa sigue su propio reloj
  // (100 % en 30 s) y solo se resincroniza con el contexto si se desfasa.
  const avanceObjetivo = simulando ? progresoCamion : (AVANCE_POR_MODO[modoHora] ?? progresoCamion);
  const objetivoRef = useRef({ avance: avanceObjetivo, simulando, inicio: null });
  useEffect(() => {
    const previo = objetivoRef.current;
    const ahora = performance.now();
    let inicio = null;
    if (simulando) {
      const continua = previo.simulando && previo.inicio !== null;
      const desfase = continua ? Math.abs((ahora - previo.inicio) / 300 - avanceObjetivo) : Infinity;
      inicio = desfase > 6 ? ahora - avanceObjetivo * 300 : previo.inicio;
    }
    objetivoRef.current = { avance: avanceObjetivo, simulando, inicio };
  }, [avanceObjetivo, simulando]);

  useEffect(() => {
    let frame;
    let mostrado = null;
    let angulo = null;
    const animar = (ahora) => {
      const o = objetivoRef.current;
      if (o.simulando) {
        const meta = Math.min(100, (ahora - o.inicio) / 300);
        // Al reiniciar la simulación salta al inicio; si no, nunca retrocede.
        mostrado = mostrado === null || meta < mostrado - 5 ? meta : Math.max(mostrado, meta);
      } else {
        mostrado = mostrado === null ? o.avance : mostrado + (o.avance - mostrado) * 0.06;
      }

      const { distancia, detenido } = posicionPorAvance(mostrado);
      const p = puntoEn(RUTA, distancia);
      const destino = anguloEn(RUTA, distancia);
      angulo = angulo === null ? destino : interpolarAngulo(angulo, destino, 0.22);
      const vaiven = detenido ? 0 : Math.sin(ahora / 70) * 0.25;
      const metros = metrosACasa(distancia);

      camionRef.current?.setAttribute('transform', `translate(${p.x} ${p.y + vaiven}) rotate(${angulo})`);
      camionRef.current?.classList.toggle('detenido', detenido);
      burbujaRef.current?.setAttribute('transform', `translate(${p.x} ${p.y - 20})`);
      if (textoBurbujaRef.current) {
        textoBurbujaRef.current.textContent = metros < -15 ? 'Ya pasó' : metros < 15 ? '¡Aquí!' : formatoDistancia(metros);
      }
      if (trazoRef.current) trazoRef.current.style.strokeDashoffset = `${1000 * (1 - distancia / RUTA.largo)}`;
      geocercaRef.current?.classList.toggle('activa', metros <= GEOCERCA_M && metros > -30);
      PARADAS.forEach((parada, i) => bolsasRef.current[i]?.classList.toggle('recogida', mostrado > 0.5 && distancia >= parada.distancia - 0.01));

      frame = requestAnimationFrame(animar);
    };
    frame = requestAnimationFrame(animar);
    return () => cancelAnimationFrame(frame);
  }, []);

  const manejarClic = (e) => {
    if (!onSeleccionar) return;
    const svg = svgRef.current;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const { x, y } = pt.matrixTransform(svg.getScreenCTM().inverse());
    onSeleccionar({ coordX: +((x / LIENZO) * 100).toFixed(1), coordY: +((y / LIENZO) * 100).toFixed(1) });
  };

  const radioGeocerca = GEOCERCA_M / METROS_POR_UNIDAD;

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${LIENZO} ${LIENZO}`}
      className={`mapa ${compacto ? 'mapa--compacto' : ''} ${onSeleccionar ? 'mapa--seleccion' : ''}`}
      onClick={manejarClic}
      role="img"
      aria-label="Mapa del barrio con la ruta del camión recolector"
    >
      <PlanoBase conNombres={!compacto} />

      <path d={RUTA_PATH} className="ruta-pendiente" />
      <path ref={trazoRef} d={RUTA_PATH} pathLength="1000" className="ruta-recorrida" />

      <circle ref={geocercaRef} cx={CASA.rutaX} cy={CASA.rutaY} r={radioGeocerca} className="geocerca" />

      {PARADAS.map((p, i) => (
        <g
          key={p.id}
          ref={(el) => (bolsasRef.current[i] = el)}
          className="bolsas"
          transform={`translate(${p.esCasa ? CASA.x - 12 : p.x} ${p.esCasa ? CASA.y - 6 : p.y + p.lado * (ANCHO_CALLE / 2 + 5)})`}
        >
          <rect x="-4.5" y="-4" width="6" height="7" rx="2" className="bolsa bolsa--negra" />
          <rect x="1.5" y="-3" width="5.5" height="6" rx="2" className="bolsa bolsa--blanca" />
        </g>
      ))}

      <g className="casa" transform={`translate(${CASA.x} ${CASA.y})`}>
        <circle r="13" className="casa-pulso" />
        <circle r="9" className="casa-fondo" />
        <path d="M-4.5 0.5 0 -3.8 4.5 0.5V4h-9z" className="casa-icono" />
        {!compacto && <text y="24" textAnchor="middle" className="casa-texto">Mi casa</text>}
      </g>

      {!compacto &&
        reportes.map((r) => (
          <g key={r.id} transform={`translate(${(r.coordX / 100) * LIENZO} ${(r.coordY / 100) * LIENZO})`} className="pin-reporte">
            <circle r="6" fill={COLOR_ESTADO[r.estado] || '#8A948F'} />
            <text y="2.6" textAnchor="middle">!</text>
          </g>
        ))}

      {seleccion && (
        <g transform={`translate(${(seleccion.coordX / 100) * LIENZO} ${(seleccion.coordY / 100) * LIENZO})`}>
          <g key={`${seleccion.coordX}-${seleccion.coordY}`} className="pin-seleccion">
            <path d="M0 0c-5-7-10-11-10-17a10 10 0 0 1 20 0c0 6-5 10-10 17z" />
            <circle cy="-17" r="3.6" />
          </g>
        </g>
      )}

      <g ref={camionRef} className="camion">
        <Camion />
      </g>

      <g ref={burbujaRef} className="burbuja">
        <rect x="-23" y="-10" width="46" height="17" rx="8.5" />
        <text ref={textoBurbujaRef} y="2.6" textAnchor="middle" />
      </g>
    </svg>
  );
}
