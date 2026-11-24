import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { EcoRutaProvider } from './context/EcoRutaContext.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <EcoRutaProvider>
      <App />
    </EcoRutaProvider>
  </React.StrictMode>
);