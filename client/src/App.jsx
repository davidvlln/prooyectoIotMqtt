import React from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Settings, Map, Activity, Thermometer, AlertTriangle, Droplets, Users, ListFilter, History } from 'lucide-react';
import './index.css';

// Placeholder Pages
import Dashboard from './pages/Dashboard';
import MantenedorBase from './pages/MantenedorBase';
import HistoricoLecturas from './pages/HistoricoLecturas';

const Sidebar = () => {
  const location = useLocation();
  
  const navItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/historico', label: 'Historial Lecturas', icon: History },
    { path: '/zonas', label: 'Zonas', icon: Map },
    { path: '/nodos', label: 'Nodos', icon: Activity },
    { path: '/sensores', label: 'Sensores', icon: Thermometer },
    { path: '/tipos_sensores', label: 'Tipos de Sensores', icon: ListFilter },
    { path: '/alertas', label: 'Alertas', icon: AlertTriangle },
    { path: '/tipos_alertas', label: 'Tipos de Alertas', icon: Settings },
    { path: '/riegos', label: 'Riegos', icon: Droplets },
    { path: '/usuarios', label: 'Usuarios', icon: Users },
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
            <Route path="/historico" element={<HistoricoLecturas />} />
            <Route path="/zonas" element={<MantenedorBase title="Zonas" endpoint="zonas" pk="id_zona" fields={['id_zona', 'nombre_zona', 'descripcion']} />} />
            <Route path="/nodos" element={<MantenedorBase title="Nodos" endpoint="nodos" pk="id_nodo" fields={['id_nodo', 'nombre_nodo', 'id_zona', 'tipo_nodo', 'estado_nodo', 'nivel_bateria', 'voltaje']} relations={{ id_zona: { endpoint: 'zonas', pk: 'id_zona', labelField: 'nombre_zona' } }} />} />
            <Route path="/sensores" element={<MantenedorBase title="Sensores" endpoint="sensores" pk="id_sensor" fields={['id_sensor', 'id_nodo', 'id_tipo_sensor', 'estado_sensor']} relations={{ id_nodo: { endpoint: 'nodos', pk: 'id_nodo', labelField: 'nombre_nodo' }, id_tipo_sensor: { endpoint: 'tipos_sensores', pk: 'id_tipo_sensor', labelField: 'nombre' } }} />} />
            <Route path="/tipos_sensores" element={<MantenedorBase title="Tipos de Sensores" endpoint="tipos_sensores" pk="id_tipo_sensor" fields={['id_tipo_sensor', 'nombre', 'unidad_medida', 'descripcion']} />} />
            <Route path="/alertas" element={<MantenedorBase title="Historial Alertas" endpoint="alertas" pk="id_alerta" fields={['id_alerta', 'id_tipo_alerta', 'dato_capturado', 'fecha_hora_alerta', 'estado_alerta']} relations={{ id_tipo_alerta: { endpoint: 'tipos_alertas', pk: 'id_tipo_alerta', labelField: 'nombre' } }} />} />
            <Route path="/tipos_alertas" element={<MantenedorBase title="Tipos de Alertas" endpoint="tipos_alertas" pk="id_tipo_alerta" fields={['id_tipo_alerta', 'nombre', 'descripcion']} />} />
            <Route path="/riegos" element={<MantenedorBase title="Historial Riegos" endpoint="riegos" pk="id_riego" fields={['id_riego', 'estado_riego', 'fecha_hora_inicio', 'fecha_hora_fin', 'id_zona']} relations={{ id_zona: { endpoint: 'zonas', pk: 'id_zona', labelField: 'nombre_zona' } }} />} />
            <Route path="/usuarios" element={<MantenedorBase title="Usuarios" endpoint="usuarios" pk="id_usuario" fields={['id_usuario', 'correo', 'fecha_creacion']} />} />
            <Route path="/config" element={<div className="glass-panel"><h2>Configuración del Sistema</h2><p>Página de configuración general</p></div>} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;
