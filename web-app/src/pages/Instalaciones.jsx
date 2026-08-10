import React, { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

export default function Instalaciones() {
  const [instalaciones, setInstalaciones] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchInstalaciones = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('instalaciones')
      .select(`
        *,
        pedidos ( clientes(nombre_razon_social) ),
        usuarios (nombre)
      `)
      .order('fecha_programada', { ascending: false });
    if (data) setInstalaciones(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchInstalaciones();
  }, []);

  const handleEstadoChange = async (id, nuevoEstado) => {
    toast.loading('Actualizando estado...', { id: 'update_estado' });
    try {
      const { error } = await supabase
        .from('instalaciones')
        .update({ estado: nuevoEstado })
        .eq('id', id);
      
      if (error) throw error;
      
      toast.success('Estado actualizado', { id: 'update_estado' });
      // Actualizamos solo localmente para no hacer recarga completa si lo preferimos, o re-hacemos fetch
      setInstalaciones(instalaciones.map(inst => inst.id === id ? { ...inst, estado: nuevoEstado } : inst));
    } catch (error) {
      toast.error('Error al actualizar: ' + error.message, { id: 'update_estado' });
    }
  };

  const getStatusColor = (estado) => {
    switch(estado) {
      case 'programada': return { bg: 'rgba(59, 130, 246, 0.2)', text: '#60a5fa' }; // Blue
      case 'en curso': return { bg: 'rgba(245, 158, 11, 0.2)', text: '#fbbf24' }; // Yellow
      case 'finalizada': return { bg: 'rgba(16, 185, 129, 0.2)', text: '#34d399' }; // Green
      case 'cancelada': return { bg: 'rgba(239, 68, 68, 0.2)', text: '#f87171' }; // Red
      default: return { bg: 'rgba(255,255,255,0.1)', text: 'white' };
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <h2 style={{ color: 'white', marginBottom: '1.5rem' }}>Cronograma de Instalaciones</h2>
      
      <div className="glass-panel" style={{ overflowX: 'auto' }}>
        {loading ? (
          <p style={{ padding: '2rem', color: 'white', textAlign: 'center' }}>Cargando instalaciones...</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', color: 'white', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'rgba(0,0,0,0.2)' }}>
                <th style={{ padding: '1rem' }}>Fecha</th>
                <th style={{ padding: '1rem' }}>Cliente</th>
                <th style={{ padding: '1rem' }}>Dirección</th>
                <th style={{ padding: '1rem' }}>Técnico Asignado</th>
                <th style={{ padding: '1rem' }}>Estado Operativo</th>
              </tr>
            </thead>
            <tbody>
              {instalaciones.map((inst) => {
                const colors = getStatusColor(inst.estado);
                return (
                  <tr key={inst.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '1rem', whiteSpace: 'nowrap' }}>{new Date(inst.fecha_programada).toLocaleDateString()}</td>
                    <td style={{ padding: '1rem' }}>{inst.pedidos?.clientes?.nombre_razon_social}</td>
                    <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>{inst.direccion_instalacion}</td>
                    <td style={{ padding: '1rem' }}>{inst.usuarios?.nombre || 'Sin asignar'}</td>
                    <td style={{ padding: '1rem' }}>
                      <select 
                        value={inst.estado} 
                        onChange={(e) => handleEstadoChange(inst.id, e.target.value)}
                        style={{
                          backgroundColor: colors.bg,
                          color: colors.text,
                          border: `1px solid ${colors.text}`,
                          padding: '4px 8px',
                          borderRadius: '4px',
                          outline: 'none',
                          cursor: 'pointer',
                          fontWeight: 'bold'
                        }}
                      >
                        <option value="programada" style={{ color: 'black' }}>PROGRAMADA</option>
                        <option value="en curso" style={{ color: 'black' }}>EN CURSO</option>
                        <option value="finalizada" style={{ color: 'black' }}>FINALIZADA</option>
                        <option value="cancelada" style={{ color: 'black' }}>CANCELADA</option>
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </motion.div>
  );
}
