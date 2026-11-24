import { useEffect } from 'react';
import { useEcoRuta } from './context/EcoRutaContext';
import { useHashRoute } from './hooks/useHashRoute';
import { useAvisosApp } from './hooks/useAvisosApp';
import { Avisos, BarraPestanas, Encabezado } from './components/Estructura';
import Registro from './pages/Registro';
import Inicio from './pages/Inicio';
import Mapa from './pages/Mapa';
import Alertas from './pages/Alertas';
import Reportar from './pages/Reportar';
import Reportes from './pages/Reportes';
import './index.css';

const PAGINAS = { inicio: Inicio, mapa: Mapa, alertas: Alertas, reportar: Reportar, reportes: Reportes };
const TITULOS = { inicio: 'Inicio', mapa: 'Mapa en ruta', alertas: 'Alertas', reportar: 'Reportar punto crítico', reportes: 'Mis reportes' };

/**
 * El contexto pasa a «Saca tus residuos ahora» al 85 % de la simulación; si ese paso
 * no llega a activarse, la interfaz lo sincroniza para que el semáforo se ponga en verde.
 */
function useSemaforoEnVivo() {
  const { simulando, progresoCamion, modoHora, setModoHora } = useEcoRuta();
  useEffect(() => {
    if (simulando && progresoCamion >= 85 && progresoCamion < 100 && modoHora !== 'en_ruta') setModoHora('en_ruta');
  }, [simulando, progresoCamion, modoHora, setModoHora]);
}

export default function App() {
  const { usuario } = useEcoRuta();
  const ruta = useHashRoute();
  const avisos = useAvisosApp();
  useSemaforoEnVivo();

  if (!usuario) {
    return (
      <div className="marco">
        <Registro />
      </div>
    );
  }

  const Pagina = PAGINAS[ruta];
  return (
    <div className="marco">
      <Encabezado />
      <main className="contenido">
        <h1 className="titulo-pagina">{TITULOS[ruta]}</h1>
        <div key={ruta} className="transicion">
          <Pagina {...(ruta === 'alertas' ? avisos : {})} />
        </div>
      </main>
      <Avisos />
      <BarraPestanas ruta={ruta} noLeidas={ruta === 'alertas' ? 0 : avisos.noLeidas} />
    </div>
  );
}
