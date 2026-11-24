import { useContext } from 'react';
import { EcoRutaContext } from './ecoRutaContext';

export function useEcoRuta() {
  return useContext(EcoRutaContext);
}
