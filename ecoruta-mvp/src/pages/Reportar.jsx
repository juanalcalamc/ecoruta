import { useEffect, useRef, useState } from 'react';
import { useEcoRuta } from '../context/EcoRutaContext';
import MapaBarrio from '../components/MapaBarrio';
import Icono from '../components/Icono';
import { navegar } from '../hooks/useHashRoute';

const TIPOS = ['Basura acumulada en la calle', 'Bolsas rotas por animales', 'El camión no pasó', 'Contenedor lleno o dañado', 'Otro'];
const MAX_DESC = 280;

// Reduce la foto antes de enviarla: localStorage solo admite ≈ 5 MB y una foto de celular pesa 3–6 MB.
async function comprimirFoto(archivo, ladoMax = 960, calidad = 0.72) {
  try {
    const bitmap = await createImageBitmap(archivo);
    const escala = Math.min(1, ladoMax / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * escala);
    canvas.height = Math.round(bitmap.height * escala);
    canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    return await new Promise((resolve) => canvas.toBlob((blob) => resolve(blob || archivo), 'image/jpeg', calidad));
  } catch {
    return archivo;
  }
}

const formatoDuracion = (s) => (s >= 60 ? `${Math.floor(s / 60)} min ${s % 60} s` : `${s} s`);

export default function Reportar() {
  const { enviarReporte, reportes } = useEcoRuta();
  const [punto, setPunto] = useState(null);
  const [tipo, setTipo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [foto, setFoto] = useState(null);
  const [vistaPrevia, setVistaPrevia] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(null);
  const [error, setError] = useState('');
  const inicioRef = useRef(0);

  // Cronómetro de la tarea (Hipótesis H4: reporte en menos de 2 minutos)
  useEffect(() => {
    inicioRef.current = performance.now();
  }, []);

  useEffect(() => () => vistaPrevia && URL.revokeObjectURL(vistaPrevia), [vistaPrevia]);

  const elegirFoto = (e) => {
    const archivo = e.target.files?.[0];
    if (!archivo) return;
    setFoto(archivo);
    setVistaPrevia(URL.createObjectURL(archivo));
  };

  const valido = punto && tipo && descripcion.trim().length >= 5;

  const enviar = async (e) => {
    e.preventDefault();
    if (!valido || enviando) return;
    setEnviando(true);
    setError('');
    const duracionSeg = Math.round((performance.now() - inicioRef.current) / 1000);
    try {
      const archivoFoto = foto ? await comprimirFoto(foto) : null;
      const creado = await enviarReporte({ tipo, descripcion: descripcion.trim(), ...punto, archivoFoto });
      setEnviado({ ...creado, duracionSeg });
    } catch {
      setError('No se pudo guardar el reporte. Intenta con una foto más liviana o sin foto.');
    } finally {
      setEnviando(false);
    }
  };

  const reiniciar = () => {
    setPunto(null);
    setTipo('');
    setDescripcion('');
    setFoto(null);
    setVistaPrevia(null);
    setEnviado(null);
    inicioRef.current = performance.now();
  };

  if (enviado) {
    const folio = `ER-${String(enviado.id).slice(-5).toUpperCase()}`;
    const texto = `Reporté un punto crítico en EcoRuta (${enviado.tipo}). Folio ${folio}.`;
    return (
      <div className="pagina">
        <section className="tarjeta exito">
          <span className="exito-icono"><Icono nombre="check" tam={36} /></span>
          <h2>¡Reporte enviado!</h2>
          <p>
            Folio <strong>{folio}</strong> · estado <strong>Recibido</strong>
          </p>
          <p className="chip">Completado en {formatoDuracion(enviado.duracionSeg)}</p>
          <div className="acciones">
            <button className="boton boton--primario boton--ancho" onClick={() => navegar('reportes')}>
              Ver el seguimiento
            </button>
            <a className="boton boton--secundario boton--ancho" href={`https://wa.me/?text=${encodeURIComponent(texto)}`} target="_blank" rel="noreferrer">
              <Icono nombre="compartir" tam={18} /> Compartir por WhatsApp
            </a>
            <button className="boton boton--texto" onClick={reiniciar}>Hacer otro reporte</button>
          </div>
        </section>
      </div>
    );
  }

  return (
    <form className="pagina" onSubmit={enviar}>
      <section className="tarjeta">
        <div className="tarjeta-titulo">
          <h3><span className="paso">1</span> Toca el mapa donde está el problema</h3>
          {punto && <span className="chip chip--ok"><Icono nombre="check" tam={14} /> Marcado</span>}
        </div>
        <MapaBarrio seleccion={punto} onSeleccionar={setPunto} reportes={reportes} />
      </section>

      <section className="tarjeta">
        <h3><span className="paso">2</span> ¿Qué está pasando?</h3>
        <div className="chips" role="radiogroup" aria-label="Tipo de incidencia">
          {TIPOS.map((t) => (
            <button type="button" key={t} role="radio" aria-checked={tipo === t} className={`chip-opcion ${tipo === t ? 'activo' : ''}`} onClick={() => setTipo(t)}>
              {t}
            </button>
          ))}
        </div>
        <label className="campo">
          <span>Descripción</span>
          <textarea
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value.slice(0, MAX_DESC))}
            rows={3}
            placeholder="Ej: Bolsas rotas en la esquina del parque desde ayer."
          />
          <small className="contador">{descripcion.length}/{MAX_DESC}</small>
        </label>
      </section>

      <section className="tarjeta">
        <h3><span className="paso">3</span> Agrega una foto <small>(opcional)</small></h3>
        {vistaPrevia ? (
          <div className="foto-previa">
            <img src={vistaPrevia} alt="Vista previa de la evidencia" />
            <button type="button" className="boton-icono" onClick={() => { setFoto(null); setVistaPrevia(null); }} aria-label="Quitar foto">
              <Icono nombre="x" tam={18} />
            </button>
          </div>
        ) : (
          <label className="subir-foto">
            <Icono nombre="foto" tam={28} />
            <span>Tomar o elegir foto</span>
            <input type="file" accept="image/*" capture="environment" onChange={elegirFoto} />
          </label>
        )}
      </section>

      {error && <p className="error" role="alert">{error}</p>}
      <button className="boton boton--primario boton--ancho boton--fijo" type="submit" disabled={!valido || enviando}>
        {enviando ? 'Enviando…' : valido ? 'Enviar reporte' : 'Completa los pasos 1 y 2'}
      </button>
    </form>
  );
}
