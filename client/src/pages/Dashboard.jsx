import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { Activity, Thermometer, Droplets, Clock, Map } from 'lucide-react';

const SOCKET_URL = 'http://localhost:3001';
const API_URL = 'http://localhost:3001/api/v1';

const Dashboard = () => {
  const [nodosData, setNodosData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Inicializar datos
  useEffect(() => {
    fetchUltimasLecturas();

    // Conectar a Socket.io
    const socket = io(SOCKET_URL);

    socket.on('connect', () => {
      console.log('Conectado a Socket.io:', socket.id);
    });

    socket.on('new-lectura', (nuevasLecturas) => {
      console.log('Nueva lectura recibida via WS:', nuevasLecturas);
      
      // Como pueden venir múltiples lecturas en un arreglo (bulk insert)
      // Lo más fácil para mantener consistencia visual perfecta es volver a llamar a la API
      // ya que la API nos devuelve todo agrupado por Nodo y Sensor con los nombres listos.
      fetchUltimasLecturas();
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const fetchUltimasLecturas = async () => {
    try {
      const res = await axios.get(`${API_URL}/dashboard/ultimas-lecturas`);
      setNodosData(res.data.data);
    } catch (error) {
      console.error('Error fetching ultimas lecturas:', error);
    } finally {
      setLoading(false);
    }
  };

  const getIconForType = (tipo) => {
    const t = (tipo || '').toLowerCase();
    if (t.includes('temp')) return <Thermometer size={20} color="var(--accent-secondary)" />;
    if (t.includes('suelo') || t.includes('tierra')) return <Map size={20} color="#8B4513" />; // Brownish
    if (t.includes('humed') || t.includes('aire')) return <Droplets size={20} color="#4A90E2" />;
    return <Activity size={20} color="var(--accent-primary)" />;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', height: '100%' }}>
      <h1>Dashboard - Monitoreo en Tiempo Real</h1>
      
      {loading ? (
        <p>Cargando nodos...</p>
      ) : nodosData.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '3rem' }}>
          <h3>No hay datos de telemetría</h3>
          <p style={{ color: 'var(--text-secondary)' }}>Asegúrate de registrar los nodos y sensores, y de que Node-RED esté enviando datos.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
          {nodosData.map((nodo) => (
            <div key={nodo.id_nodo} className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="flex-between" style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.75rem' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                  <Activity size={24} color="var(--accent-primary)" />
                  {nodo.nombre_nodo}
                </h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <Clock size={14} />
                  {new Date(nodo.ultima_actualizacion).toLocaleTimeString()}
                </span>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {nodo.lecturas.map((lectura, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      {getIconForType(lectura.tipo)}
                      <span style={{ color: 'var(--text-secondary)', textTransform: 'capitalize' }}>
                        {lectura.tipo}
                      </span>
                    </div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>
                      {parseFloat(lectura.valor).toFixed(1)} <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 'normal' }}>{lectura.unidad}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
