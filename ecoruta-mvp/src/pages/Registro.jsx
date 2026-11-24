import { useState } from 'react';
import { useEcoRuta } from '../context/EcoRutaContext';
import Icono, { Logo } from '../components/Icono';

export default function Registro() {
  const { barrios, registrarUsuario } = useEcoRuta();
  const [nombre, setNombre] = useState('');
  const [barrioId, setBarrioId] = useState(barrios[0].id);
  const [error, setError] = useState('');

  const enviar = (e) => {
    e.preventDefault();
    if (nombre.trim().length < 2) {
      setError('Escribe tu nombre o un alias (mínimo 2 letras).');
      return;
    }
    registrarUsuario(nombre, barrioId);
  };

  return (
    <main className="registro">
      <div className="registro-hero">
        <Logo tam={56} />
        <h1>EcoRuta</h1>
        <p>Saca la basura cuando el camión <em>realmente</em> pasa.</p>
      </div>

      <form className="tarjeta registro-form" onSubmit={enviar} noValidate>
        <label className="campo">
          <span>¿Cómo te llamas?</span>
          <input
            value={nombre}
            onChange={(e) => {
              setNombre(e.target.value);
              setError('');
            }}
            placeholder="Ej: Laura"
            autoComplete="given-name"
            maxLength={30}
            aria-invalid={Boolean(error)}
            aria-describedby="error-nombre"
          />
          {error && <small id="error-nombre" className="error">{error}</small>}
        </label>

        <fieldset className="campo">
          <legend>Elige tu barrio</legend>
          <div className="opciones-barrio">
            {barrios.map((b) => (
              <label key={b.id} className={`opcion-barrio ${barrioId === b.id ? 'activa' : ''}`}>
                <input type="radio" name="barrio" value={b.id} checked={barrioId === b.id} onChange={() => setBarrioId(b.id)} />
                <strong>{b.nombre}</strong>
                <small>{b.dias.join(', ')} · {b.franja}</small>
              </label>
            ))}
          </div>
        </fieldset>

        <button className="boton boton--primario boton--ancho" type="submit">
          Entrar a EcoRuta
        </button>
        <p className="nota-privacidad">
          <Icono nombre="escudo" tam={14} /> Solo guardamos tu nombre y barrio en este dispositivo (Ley 1581 de 2012).
        </p>
      </form>
    </main>
  );
}
