import { useMemo, useState } from 'react';
import { useEcoRuta } from '../context/useEcoRuta';
import Icono from '../components/Icono';

export default function Configuracion() {
  const { usuario, ciudades, barrios, actualizarPerfil, cargandoCatalogo, errorCatalogo } = useEcoRuta();
  const [nombre, setNombre] = useState(usuario.nombre);
  const [ciudadId, setCiudadId] = useState(usuario.ciudad.id);
  const [barrioId, setBarrioId] = useState(usuario.barrio.id);
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState('');
  const [guardando, setGuardando] = useState(false);

  const barriosCiudad = useMemo(
    () => barrios.filter((barrio) => barrio.ciudad_id === ciudadId),
    [barrios, ciudadId],
  );

  const guardar = async (evento) => {
    evento.preventDefault();
    setError('');
    setAviso('');

    if (nombre.trim().length < 2) {
      setError('El nombre debe tener al menos 2 caracteres.');
      return;
    }
    if (!ciudadId || !barrioId) {
      setError('Selecciona una ciudad y un barrio.');
      return;
    }

    setGuardando(true);
    try {
      await actualizarPerfil({ nombre, ciudadId, barrioId });
      setAviso('Tus datos se actualizaron.');
    } catch (errorGuardado) {
      setError(errorGuardado.message);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <form className="pagina" onSubmit={guardar}>
      <section className="tarjeta">
        <h3><Icono nombre="configuracion" tam={19} /> Datos de la cuenta</h3>
        <label className="campo">
          <span>Nombre</span>
          <input value={nombre} onChange={(evento) => setNombre(evento.target.value)} maxLength={60} required />
        </label>
        <label className="campo">
          <span>Correo electrónico</span>
          <input type="email" value={usuario.email || ''} readOnly aria-readonly="true" />
          <small className="texto-secundario">El correo se administra desde tu cuenta de autenticación.</small>
        </label>
      </section>

      <section className="tarjeta">
        <h3><Icono nombre="pin" tam={19} /> Ciudad y barrio</h3>
        {errorCatalogo && <p className="error" role="alert">No se pudo cargar el catálogo: {errorCatalogo}</p>}
        <label className="campo">
          <span>Ciudad</span>
          <select
            value={ciudadId}
            onChange={(evento) => {
              setCiudadId(evento.target.value);
              setBarrioId('');
            }}
            disabled={cargandoCatalogo}
            required
          >
            {ciudades.map((ciudad) => <option key={ciudad.id} value={ciudad.id}>{ciudad.nombre}</option>)}
          </select>
        </label>
        <label className="campo">
          <span>Barrio</span>
          <select
            value={barrioId}
            onChange={(evento) => setBarrioId(evento.target.value)}
            disabled={cargandoCatalogo || !barriosCiudad.length}
            required
          >
            <option value="">{barriosCiudad.length ? 'Selecciona un barrio' : 'No hay barrios para esta ciudad'}</option>
            {barriosCiudad.map((barrio) => <option key={barrio.id} value={barrio.id}>{barrio.nombre}</option>)}
          </select>
        </label>
        <p className="texto-secundario">El catálogo actual es inicial y puede ampliarse desde la base de datos.</p>
      </section>

      {error && <p className="error" role="alert">{error}</p>}
      {aviso && <p className="aviso-formulario" role="status">{aviso}</p>}
      <button className="boton boton--primario boton--ancho" type="submit" disabled={guardando || cargandoCatalogo || Boolean(errorCatalogo)}>
        {guardando ? 'Guardando…' : 'Guardar cambios'}
      </button>
    </form>
  );
}
