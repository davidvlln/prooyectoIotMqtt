import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Edit2, Trash2, X } from 'lucide-react';

const API_URL = 'http://localhost:3001/api/v1';

const MantenedorBase = ({ title, endpoint, pk, fields, relations = {} }) => {
  const [data, setData] = useState([]);
  const [relationsData, setRelationsData] = useState({});
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({});
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchData();
  }, [endpoint]);

  const fetchData = async () => {
    try {
      const res = await axios.get(`${API_URL}/${endpoint}`);
      setData(res.data.data);

      const relData = {};
      for (const [field, config] of Object.entries(relations)) {
        try {
          const relRes = await axios.get(`${API_URL}/${config.endpoint}`);
          relData[field] = relRes.data.data;
        } catch (e) {
          console.error(`Error fetching relation for ${field}`, e);
          relData[field] = [];
        }
      }
      setRelationsData(relData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (item = null) => {
    if (item) {
      setFormData(item);
      setEditingId(item[pk]);
    } else {
      setFormData({});
      setEditingId(null);
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setFormData({});
    setEditingId(null);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await axios.put(`${API_URL}/${endpoint}/${editingId}`, formData);
      } else {
        await axios.post(`${API_URL}/${endpoint}`, formData);
      }
      fetchData();
      handleCloseModal();
    } catch (error) {
      console.error('Error saving data:', error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Está seguro de eliminar este registro?')) {
      try {
        await axios.delete(`${API_URL}/${endpoint}/${id}`);
        fetchData();
      } catch (error) {
        console.error('Error deleting data:', error);
      }
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', height: '100%' }}>
      <div className="flex-between">
        <h1>{title}</h1>
        <button className="btn btn-primary" onClick={() => handleOpenModal()}>
          <Plus size={18} /> Nuevo Registro
        </button>
      </div>

      <div className="glass-panel" style={{ flex: 1, overflowY: 'auto' }}>
        {loading ? (
          <p>Cargando...</p>
        ) : (
          <table>
            <thead>
              <tr>
                {fields.map((field) => (
                  <th key={field}>{field.replace(/_/g, ' ')}</th>
                ))}
                <th style={{ width: '100px', textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item) => (
                <tr key={item[pk]}>
                  {fields.map((field) => {
                    let displayValue = item[field];
                    if (relations[field] && relationsData[field]) {
                      const relConfig = relations[field];
                      const relatedItem = relationsData[field].find(r => String(r[relConfig.pk]) === String(item[field]));
                      if (relatedItem) {
                        displayValue = relatedItem[relConfig.labelField];
                      }
                    }
                    return <td key={`${item[pk]}-${field}`}>{displayValue}</td>;
                  })}
                  <td style={{ textAlign: 'right' }}>
                    <button 
                      style={{ background: 'none', border: 'none', color: 'var(--accent-secondary)', cursor: 'pointer', marginRight: '0.5rem' }}
                      onClick={() => handleOpenModal(item)}
                    >
                      <Edit2 size={18} />
                    </button>
                    <button 
                      style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}
                      onClick={() => handleDelete(item[pk])}
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {data.length === 0 && (
                <tr>
                  <td colSpan={fields.length + 1} style={{ textAlign: 'center', padding: '2rem' }}>
                    No hay registros
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {isModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000
        }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '500px', background: 'var(--bg-secondary)' }}>
            <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
              <h2>{editingId ? 'Editar' : 'Nuevo'} {title}</h2>
              <button onClick={handleCloseModal} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit}>
              {fields.filter(f => f !== pk).map((field) => (
                <div key={field} style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.875rem', textTransform: 'capitalize' }}>
                    {field.replace(/_/g, ' ')}
                  </label>
                  {relations[field] && relationsData[field] ? (
                    <select
                      name={field}
                      value={formData[field] || ''}
                      onChange={handleChange}
                      required
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        borderRadius: '8px',
                        border: '1px solid var(--glass-border)',
                        background: 'rgba(255, 255, 255, 0.05)',
                        color: 'var(--text-primary)',
                        outline: 'none',
                        fontFamily: 'inherit'
                      }}
                    >
                      <option value="">Seleccione una opción</option>
                      {relationsData[field].map(opt => (
                        <option key={opt[relations[field].pk]} value={opt[relations[field].pk]}>
                          {opt[relations[field].labelField]}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      name={field}
                      value={formData[field] || ''}
                      onChange={handleChange}
                      required
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        borderRadius: '8px',
                        border: '1px solid var(--glass-border)',
                        background: 'rgba(255, 255, 255, 0.05)',
                        color: 'var(--text-primary)',
                        outline: 'none',
                        fontFamily: 'inherit'
                      }}
                    />
                  )}
                </div>
              ))}
              
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
                <button type="button" className="btn" onClick={handleCloseModal} style={{ background: 'transparent', border: '1px solid var(--glass-border)', color: 'var(--text-primary)' }}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MantenedorBase;
