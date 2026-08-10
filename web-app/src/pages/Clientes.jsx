import React, { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Trash2, Edit2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Clientes() {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    id: null,
    nombre_razon_social: '',
    rif_ci: '',
    direccion: '',
    telefono: '',
    email: ''
  });

  const fetchClientes = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('clientes').select('*').order('nombre_razon_social');
    if (data) setClientes(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchClientes();
  }, []);

  const openAdd = () => {
    setEditMode(false);
    setFormData({ id: null, nombre_razon_social: '', rif_ci: '', direccion: '', telefono: '', email: '' });
    setShowModal(true);
  };

  const openEdit = (cliente) => {
    setEditMode(true);
    setFormData(cliente);
    setShowModal(true);
  };

  const handleDelete = async (id, nombre) => {
    if (window.confirm(`¿Estás seguro de que deseas eliminar al cliente "${nombre}"?`)) {
      toast.loading('Eliminando...', { id: 'delete' });
      try {
        const { error } = await supabase.from('clientes').delete().eq('id', id);
        if (error) throw error;
        toast.success('Cliente eliminado', { id: 'delete' });
        fetchClientes();
      } catch (error) {
        toast.error('Error al eliminar: (¿Tiene pedidos asociados?)', { id: 'delete' });
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    toast.loading(editMode ? 'Actualizando...' : 'Guardando...', { id: 'save' });

    try {
      if (editMode) {
        const { error } = await supabase.from('clientes').update({
          nombre_razon_social: formData.nombre_razon_social,
          rif_ci: formData.rif_ci,
          direccion: formData.direccion,
          telefono: formData.telefono,
          email: formData.email
        }).eq('id', formData.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('clientes').insert([{
          nombre_razon_social: formData.nombre_razon_social,
          rif_ci: formData.rif_ci,
          direccion: formData.direccion,
          telefono: formData.telefono,
          email: formData.email
        }]);
        if (error) throw error;
      }

      toast.success(editMode ? 'Cliente actualizado' : 'Cliente registrado', { id: 'save' });
      setShowModal(false);
      fetchClientes();
    } catch (error) {
      toast.error('Error: ' + error.message, { id: 'save' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ color: 'white' }}>Directorio de Clientes</h2>
        <button className="btn-primary" onClick={openAdd} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Plus size={18} /> Agregar Cliente
        </button>
      </div>

      <div className="glass-panel" style={{ overflowX: 'auto' }}>
        {loading ? (
          <p style={{ padding: '2rem', color: 'white', textAlign: 'center' }}>Cargando clientes...</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', color: 'white', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'rgba(0,0,0,0.2)' }}>
                <th style={{ padding: '1rem' }}>Razón Social / Nombre</th>
                <th style={{ padding: '1rem' }}>RIF/CI</th>
                <th style={{ padding: '1rem' }}>Teléfono</th>
                <th style={{ padding: '1rem' }}>Correo</th>
                <th style={{ padding: '1rem' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {clientes.map((c) => (
                <tr key={c.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '1rem' }}>{c.nombre_razon_social}</td>
                  <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>{c.rif_ci}</td>
                  <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>{c.telefono || '-'}</td>
                  <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>{c.email || '-'}</td>
                  <td style={{ padding: '1rem', display: 'flex', gap: '8px' }}>
                    <button onClick={() => openEdit(c)} style={{ background: 'transparent', border: 'none', color: '#60a5fa', cursor: 'pointer', padding: '4px' }}>
                      <Edit2 size={18} />
                    </button>
                    <button onClick={() => handleDelete(c.id, c.nombre_razon_social)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}>
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {clientes.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No hay clientes registrados.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal Agregar/Editar */}
      <AnimatePresence>
        {showModal && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="glass-panel" 
              style={{ width: '90%', maxWidth: '500px', padding: '2rem', background: 'var(--bg-card)' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ color: 'white', margin: 0 }}>{editMode ? 'Editar Cliente' : 'Nuevo Cliente'}</h3>
                <button onClick={() => setShowModal(false)} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}><X size={24} /></button>
              </div>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Razón Social / Nombre Completo</label>
                  <input type="text" required value={formData.nombre_razon_social} onChange={(e) => setFormData({...formData, nombre_razon_social: e.target.value})} style={{ width: '100%', padding: '0.5rem', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', color: 'white', borderRadius: '4px' }} />
                </div>
                <div>
                  <label style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>RIF o Cédula (Ej: J-123456789 o V-12345678)</label>
                  <input type="text" required value={formData.rif_ci} onChange={(e) => setFormData({...formData, rif_ci: e.target.value})} style={{ width: '100%', padding: '0.5rem', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', color: 'white', borderRadius: '4px' }} />
                </div>
                <div>
                  <label style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Dirección Fiscal (Opcional)</label>
                  <input type="text" value={formData.direccion} onChange={(e) => setFormData({...formData, direccion: e.target.value})} style={{ width: '100%', padding: '0.5rem', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', color: 'white', borderRadius: '4px' }} />
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Teléfono (Opcional)</label>
                    <input type="text" value={formData.telefono} onChange={(e) => setFormData({...formData, telefono: e.target.value})} style={{ width: '100%', padding: '0.5rem', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', color: 'white', borderRadius: '4px' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Correo (Opcional)</label>
                    <input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} style={{ width: '100%', padding: '0.5rem', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', color: 'white', borderRadius: '4px' }} />
                  </div>
                </div>
                
                <button type="submit" className="btn-primary" style={{ marginTop: '1rem' }} disabled={saving}>
                  {saving ? 'Guardando...' : (editMode ? 'Guardar Cambios' : 'Registrar Cliente')}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
