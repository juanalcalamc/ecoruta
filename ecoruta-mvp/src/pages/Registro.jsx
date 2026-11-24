import { useMemo, useState } from 'react';
import { useEcoRuta } from '../context/useEcoRuta';
import { isCloudEnabled } from '../config/supabaseClient';
import Icono, { Logo } from '../components/Icono';

export default function Registro() {
  const {
    ciudades,
    barrios,
    registrarUsuario,
    iniciarSesion,
    verificarCodigo,
    reenviarCodigo,
    salir,
    sesionActiva,
    cargandoCatalogo,
    errorCatalogo,
    errorAuth,
  } = useEcoRuta();
  const [modo, setModo] = useState('iniciar');
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [emailPendiente, setEmailPendiente] = useState('');
  const [password, setPassword] = useState('');
  const [confirmacion, setConfirmacion] = useState('');
  const [codigo, setCodigo] = useState('');
  const [ciudadId, setCiudadId] = useState('');
  const [barrioId, setBarrioId] = useState('');
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState('');
  const [enviando, setEnviando] = useState(false);

  const ciudadIdElegida = ciudadId || ciudades[0]?.id || '';
  const barriosCiudad = useMemo(
    () => barrios.filter((barrio) => barrio.ciudad_id === ciudadIdElegida),
    [barrios, ciudadIdElegida],
  );
  const barrioIdElegido = barriosCiudad.some((barrio) => barrio.id === barrioId)
    ? barrioId
    : barriosCiudad[0]?.id || '';

  const cambiarModo = (nuevoModo) => {
    setModo(nuevoModo);
    setError('');
    setAviso('');
    setPassword('');
    setConfirmacion('');
  };

  const enviarRegistro = async (evento) => {
    evento.preventDefault();
    setError('');
    setAviso('');

    if (nombre.trim().length < 2) {
      setError('Escribe tu nombre (mínimo 2 caracteres).');
      return;
    }
    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }
    if (password !== confirmacion) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    if (!ciudadIdElegida || !barrioIdElegido) {
      setError('Selecciona una ciudad y un barrio.');
      return;
    }

    setEnviando(true);
    try {
      const resultado = await registrarUsuario({ nombre, email: email.trim(), password, barrioId: barrioIdElegido });
      if (!resultado.session) {
        setEmailPendiente(email.trim());
        setModo('verificar');
        setPassword('');
        setConfirmacion('');
        setAviso('Te enviamos un código de confirmación. Revisa también la carpeta de correo no deseado.');
      }
    } catch (errorRegistro) {
      setError(errorRegistro.message);
    } finally {
      setEnviando(false);
    }
  };

  const enviarInicioSesion = async (evento) => {
    evento.preventDefault();
    setError('');
    setAviso('');
    setEnviando(true);
    try {
      await iniciarSesion(email.trim(), password);
    } catch (errorInicio) {
      setError(errorInicio.message);
    } finally {
      setEnviando(false);
    }
  };

  const enviarCodigo = async (evento) => {
    evento.preventDefault();
    setError('');
    setAviso('');
    if (!/^\d{6,8}$/.test(codigo)) {
      setError('Escribe el código numérico que recibiste por correo.');
      return;
    }
    setEnviando(true);
    try {
      await verificarCodigo(emailPendiente, codigo);
    } catch (errorCodigo) {
      setError(errorCodigo.message);
    } finally {
      setEnviando(false);
    }
  };

  const reenviar = async () => {
    setError('');
    setAviso('');
    setEnviando(true);
    try {
      await reenviarCodigo(emailPendiente);
      setAviso('Enviamos otro código. Revisa tu correo.');
    } catch (errorReenvio) {
      setError(errorReenvio.message);
    } finally {
      setEnviando(false);
    }
  };

  const catalogoNoDisponible = isCloudEnabled && !cargandoCatalogo && !errorCatalogo && ciudades.length === 0;
  const registroBloqueado = modo === 'registro' && (
    cargandoCatalogo || Boolean(errorCatalogo) || catalogoNoDisponible
  );

  return (
    <main className="registro">
      <div className="registro-hero">
        <Logo tam={56} />
        <h1>EcoRuta</h1>
        <p>Saca la basura cuando el camión <em>realmente</em> pasa.</p>
      </div>

      <form
        className="tarjeta registro-form"
        onSubmit={modo === 'registro' ? enviarRegistro : modo === 'verificar' ? enviarCodigo : enviarInicioSesion}
        noValidate
      >
        <div>
          <h2 className="titulo-formulario">
            {modo === 'registro' ? 'Crear cuenta' : modo === 'verificar' ? 'Confirma tu correo' : 'Iniciar sesión'}
          </h2>
          {modo === 'verificar' && (
            <p className="texto-formulario">Ingresa el código que enviamos a {emailPendiente}.</p>
          )}
        </div>

        {!isCloudEnabled && (
          <p className="mensaje-formulario error" role="alert">
            La autenticación no está configurada. Define VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en el entorno de despliegue.
          </p>
        )}
        {errorCatalogo && (
          <p className="mensaje-formulario error" role="alert">
            No se pudo cargar el catálogo de ciudades y barrios: {errorCatalogo}
          </p>
        )}
        {catalogoNoDisponible && (
          <p className="mensaje-formulario error" role="alert">
            No hay ciudades disponibles. Ejecuta la migración de EcoRuta en Supabase.
          </p>
        )}
        {errorAuth && <p className="mensaje-formulario error" role="alert">{errorAuth}</p>}
        {errorAuth && sesionActiva && (
          <button type="button" className="boton boton--texto" onClick={() => salir().catch((errorSalida) => setError(errorSalida.message))}>
            Cerrar sesión y volver a intentar
          </button>
        )}
        {error && <p className="mensaje-formulario error" role="alert">{error}</p>}
        {aviso && <p className="mensaje-formulario aviso-formulario" role="status">{aviso}</p>}

        {modo === 'registro' && (
          <>
            <label className="campo">
              <span>Nombre</span>
              <input
                value={nombre}
                onChange={(evento) => setNombre(evento.target.value)}
                placeholder="Ej.: Laura"
                autoComplete="name"
                maxLength={60}
                required
              />
            </label>
            <label className="campo">
              <span>Ciudad</span>
              <select
                value={ciudadIdElegida}
                onChange={(evento) => {
                  setCiudadId(evento.target.value);
                  setBarrioId('');
                }}
                required
                disabled={cargandoCatalogo}
              >
                <option value="">{cargandoCatalogo ? 'Cargando ciudades…' : 'Selecciona una ciudad'}</option>
                {ciudades.map((ciudad) => <option key={ciudad.id} value={ciudad.id}>{ciudad.nombre}</option>)}
              </select>
            </label>
            <label className="campo">
              <span>Barrio</span>
              <select value={barrioIdElegido} onChange={(evento) => setBarrioId(evento.target.value)} required disabled={!ciudadIdElegida || cargandoCatalogo}>
                <option value="">{barriosCiudad.length ? 'Selecciona un barrio' : 'No hay barrios para esta ciudad'}</option>
                {barriosCiudad.map((barrio) => <option key={barrio.id} value={barrio.id}>{barrio.nombre}</option>)}
              </select>
            </label>
          </>
        )}

        {modo !== 'verificar' && (
          <>
            <label className="campo">
              <span>Correo electrónico</span>
              <input
                type="email"
                value={email}
                onChange={(evento) => setEmail(evento.target.value)}
                placeholder="tu@correo.com"
                autoComplete="email"
                required
              />
            </label>
            <label className="campo">
              <span>Contraseña</span>
              <input
                type="password"
                value={password}
                onChange={(evento) => setPassword(evento.target.value)}
                autoComplete={modo === 'registro' ? 'new-password' : 'current-password'}
                minLength={8}
                required
              />
            </label>
          </>
        )}

        {modo === 'registro' && (
          <label className="campo">
            <span>Confirmar contraseña</span>
            <input
              type="password"
              value={confirmacion}
              onChange={(evento) => setConfirmacion(evento.target.value)}
              autoComplete="new-password"
              minLength={8}
              required
            />
          </label>
        )}

        {modo === 'verificar' && (
          <label className="campo">
            <span>Código de verificación</span>
            <input
              inputMode="numeric"
              autoComplete="one-time-code"
              value={codigo}
              onChange={(evento) => setCodigo(evento.target.value.replace(/\s/g, '').slice(0, 8))}
              placeholder="Código del correo"
              required
            />
          </label>
        )}

        <button
          className="boton boton--primario boton--ancho"
          type="submit"
          disabled={enviando || !isCloudEnabled || registroBloqueado}
        >
          {enviando ? 'Un momento…' : modo === 'registro' ? 'Crear cuenta' : modo === 'verificar' ? 'Verificar correo' : 'Iniciar sesión'}
        </button>

        {modo === 'verificar' ? (
          <div className="acciones-formulario">
            <button type="button" className="boton boton--texto" onClick={reenviar} disabled={enviando || !isCloudEnabled}>
              Reenviar código
            </button>
            <button type="button" className="boton boton--texto" onClick={() => cambiarModo('iniciar')}>
              Volver al inicio de sesión
            </button>
          </div>
        ) : (
          <button
            type="button"
            className="boton boton--texto"
            onClick={() => cambiarModo(modo === 'registro' ? 'iniciar' : 'registro')}
          >
            {modo === 'registro' ? 'Ya tengo una cuenta' : 'Crear una cuenta nueva'}
          </button>
        )}

        <p className="nota-privacidad">
          <Icono nombre="escudo" tam={14} /> Tu contraseña la gestiona Supabase Auth; EcoRuta no la guarda en su perfil.
        </p>
      </form>
    </main>
  );
}
