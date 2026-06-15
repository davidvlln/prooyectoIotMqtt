import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { History, Activity, Thermometer, Droplets, Map } from 'lucide-react';

const API_URL = 'http://localhost:3001/api/v1';

const HistoricoLecturas = () => {
  const [historico, setHistorico] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistorico();
  }, []);

  const fetchHistorico = async () => {
    try {
      const res = await axios.get(`${API_URL}/dashboard/historico?limite=500`);
      setHistorico(res.data.data);
    } catch (error) {
      console.error('Error fetching historico:', error);
    } finally {
      setLoading(false);
    }
  };

  const getIconForType = (tipo) => {
    const t = (tipo || '').toLowerCase();
    if (t.includes('temp')) return <Thermometer size={16} color="var(--accent-secondary)" />;
    if (t.includes('suelo') || t.includes('tierra')) return <Map size={16} color="#8B4513" />;
    if (t.includes('humed') || t.includes('aire')) return <Droplets size={16} color="#4A90E2" />;
    return <Activity size={16} color="var(--accent-primary)" />;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', height: '100%' }}>
      <div className="flex-between">
        <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <History size={28} color="var(--accent-primary)" />
          Historial de Lecturas
        </h1>
        <button className="btn" onClick={fetchHistorico} style={{ background: 'transparent', border: '1px solid var(--glass-border)', color: 'var(--text-primary)' }}>
          Actualizar Datos
        </button>
      </div>

      <div className="glass-panel" style={{ flex: 1, overflowY: 'auto' }}>
        {loading ? (
          <p>Cargando historial...</p>
        ) : historico.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <p style={{ color: 'var(--text-secondary)' }}>No hay lecturas registradas.</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Fecha y Hora</th>
                <th>Nodo</th>
                <th>Tipo de Sensor</th>
                <th style={{ textAlign: 'right' }}>Valor</th>
              </tr>
            </thead>
            <tbody>
              {historico.map((lectura) => (
                <tr key={lectura.id_lectura}>
                  <td style={{ color: 'var(--text-secondary)' }}>
                    {new Date(lectura.fecha_hora).toLocaleString()}
                  </td>
                  <td style={{ fontWeight: '500' }}>{lectura.nombre_nodo}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {getIconForType(lectura.tipo_sensor)}
                      <span style={{ textTransform: 'capitalize' }}>{lectura.tipo_sensor}</span>
                    </div>
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 'bold' }}>
                    {parseFloat(lectura.valor).toFixed(1)} <span style={{ fontWeight: 'normal', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{lectura.unidad_medida}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default HistoricoLecturas;
