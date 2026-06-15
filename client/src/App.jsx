import React from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Settings, Map, Activity, Thermometer, AlertTriangle, Droplets, Users } from 'lucide-react';
import './index.css';

// Placeholder Pages
import Dashboard from './pages/Dashboard';
import MantenedorBase from './pages/MantenedorBase';

const Sidebar = () => {
  const location = useLocation();
  
  const navItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/zonas', label: 'Zonas', icon: Map },
    { path: '/nodos', label: 'Nodos', icon: Activity },
    { path: '/sensores', label: 'Sensores', icon: Thermometer },
    { path: '/alertas', label: 'Alertas', icon: AlertTriangle },
    { path: '/riegos', label: 'Riegos', icon: Droplets },
    { path: '/usuarios', label: 'Usuarios', icon: Users },
    { path: '/config', label: 'Configuración', icon: Settings },
  ];

  return (
    <div className="sidebar" style={{ padding: '1.5rem 1rem' }}>
      <div style={{ marginBottom: '2rem', padding: '0 1rem' }}>
        <h2 style={{ color: 'var(--accent-primary)', fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Droplets size={24} /> MeshFlow
        </h2>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Microclimate Control</p>
      </div>
      
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
          
          return (
            <Link 
              key={item.path} 
              to={item.path}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                textDecoration: 'none',
                color: isActive ? 'white' : 'var(--text-secondary)',
                background: isActive ? 'var(--accent-primary)' : 'transparent',
                transition: 'all 0.2s',
                fontWeight: isActive ? '500' : '400',
              }}
            >
              <Icon size={20} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
};

function App() {
  return (
    <BrowserRouter>
      <div className="app-container">
        <Sidebar />
        <div className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/zonas" element={<MantenedorBase title="Zonas" endpoint="zonas" pk="id_zona" fields={['id_zona', 'nombre_zona', 'descripcion']} />} />
            <Route path="/nodos" element={<MantenedorBase title="Nodos" endpoint="nodos" pk="id_nodo" fields={['id_nodo', 'nombre_nodo', 'id_zona', 'tipo_nodo', 'estado_nodo', 'nivel_bateria', 'voltaje']} />} />
            <Route path="/sensores" element={<MantenedorBase title="Sensores" endpoint="sensores" pk="id_sensor" fields={['id_sensor', 'id_nodo', 'id_tipo_sensor', 'estado_sensor']} />} />
            <Route path="/alertas" element={<MantenedorBase title="Historial Alertas" endpoint="alertas" pk="id_alerta" fields={['id_alerta', 'dato_capturado', 'fecha_hora_alerta', 'estado_alerta']} />} />
            <Route path="/riegos" element={<MantenedorBase title="Historial Riegos" endpoint="riegos" pk="id_riego" fields={['id_riego', 'estado_riego', 'fecha_hora_inicio', 'fecha_hora_fin', 'id_zona']} />} />
            <Route path="/usuarios" element={<MantenedorBase title="Usuarios" endpoint="usuarios" pk="id_usuario" fields={['id_usuario', 'correo', 'fecha_creacion']} />} />
            <Route path="/config" element={<div className="glass-panel"><h2>Configuración del Sistema</h2><p>Parámetros y Tipos de alertas</p></div>} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;
