import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom'; // Importamos useNavigate
import './ingresoUsuario.css';

import Pasos from './sensorPasos';
import Fuerza from './sensorFuerza';
import Temperatura from './sensorTemperatura';
import Perfil from './perfilUsuario';
import Admin from './Admin';

const Welcome = () => {
  const [activeComponent, setActiveComponent] = useState(null);
  const location = useLocation();
  const { state } = location;
  const userName = state?.name || 'Usuario'; 

  const navigate = useNavigate(); // Usamos useNavigate para redirigir

  const renderContent = () => {
    switch (activeComponent) {
      case 'pasos':
        return <Pasos />;
      default:
        return <div>Selecciona una opción del menú. {userName}</div>;
    }
  };

  // Función para cerrar sesión y redirigir a la página principal
  const handleLogout = () => {
    // Aquí podrías limpiar el estado si estás guardando algún token de sesión
    // Redirige al usuario a la página principal
    navigate('/'); // Asumiendo que '/' es la ruta principal
  };

  return (
    <div id='ingreso-contenedor'>
      <div className="menu-lateral">
        <div className='my-3' id='logo-contenedor'></div>
        <button className="menu-btn" onClick={() => setActiveComponent('pasos')}>Pasos</button>
        <button className="menu-btn" onClick={handleLogout}>Cerrar sesión</button> {/* Botón de cerrar sesión */}
      </div>
      <div className="ingreso-contenido">
        {renderContent()}
      </div>
    </div>
  );
};

export default Welcome;
