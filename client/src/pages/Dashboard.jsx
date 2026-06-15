import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { Thermometer, Droplets, Activity, Wind } from 'lucide-react';

const Dashboard = () => {
  const [lecturas, setLecturas] = useState([]);
  const [stats, setStats] = useState({
    avgTemp: 0,
    avgHumAire: 0,
    avgHumSuelo: 0,
    alertasActivas: 0
  });

  useEffect(() => {
    // Connect to Socket.IO backend
    const socket = io('http://localhost:3000');

    socket.on('connect', () => {
      console.log('Connected to backend via socket');
    });

    socket.on('new-lectura', (data) => {
      setLecturas(prev => [data, ...prev].slice(0, 10)); // Keep last 10 readings
    });

    // You can also add 'new-alerta' listener if needed

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <h1>Dashboard en Tiempo Real</h1>
      
      <div className="grid-cards">
        <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '50%', color: 'var(--danger)' }}>
            <Thermometer size={32} />
          </div>
          <div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Temperatura Promedio</p>
            <h2 style={{ margin: 0, fontSize: '1.75rem' }}>24.5°C</h2>
          </div>
        </div>

        <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '1rem', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '50%', color: 'var(--accent-primary)' }}>
            <Wind size={32} />
          </div>
          <div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Humedad Aire</p>
            <h2 style={{ margin: 0, fontSize: '1.75rem' }}>60%</h2>
          </div>
        </div>

        <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '1rem', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '50%', color: 'var(--success)' }}>
            <Droplets size={32} />
          </div>
          <div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Humedad Suelo</p>
            <h2 style={{ margin: 0, fontSize: '1.75rem' }}>45%</h2>
          </div>
        </div>

        <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '1rem', background: 'rgba(245, 158, 11, 0.1)', borderRadius: '50%', color: 'var(--warning)' }}>
            <Activity size={32} />
          </div>
          <div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Nodos Activos</p>
            <h2 style={{ margin: 0, fontSize: '1.75rem' }}>12</h2>
          </div>
        </div>
      </div>

      <div className="grid-cards" style={{ gridTemplateColumns: '2fr 1fr' }}>
        <div className="glass-panel" style={{ minHeight: '400px' }}>
          <h3>Gráfico de Monitoreo</h3>
          <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
            [Área del Gráfico - Integrar Recharts aquí]
          </div>
        </div>
        
        <div className="glass-panel">
          <h3>Últimas Lecturas (Socket.io)</h3>
          <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {lecturas.length > 0 ? lecturas.map((lect, idx) => (
              <div key={idx} style={{ padding: '0.75rem', background: 'var(--bg-primary)', borderRadius: '8px', fontSize: '0.875rem' }}>
                <div className="flex-between" style={{ marginBottom: '0.25rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Sensor #{lect.id_sensor}</span>
                  <span style={{ color: 'var(--accent-primary)' }}>{new Date(lect.fecha_hora || Date.now()).toLocaleTimeString()}</span>
                </div>
                <div>Valor: <strong>{lect.valor}</strong></div>
              </div>
            )) : (
              <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem 0' }}>Esperando datos en tiempo real...</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
