import React, { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, UserMinus, Download } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Empleados() {
  const [empleados, setEmpleados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUserRole, setCurrentUserRole] = useState(null);
  
  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [nuevoEmpleado, setNuevoEmpleado] = useState({
    nombre: '',
    email: '',
    rol: 'ventas',
    estado: 'activo'
  });
  const [saving, setSaving] = useState(false);

  const fetchEmpleados = async () => {
    setLoading(true);
    
    // 1. Obtener el usuario actual logueado
    const { data: authData } = await supabase.auth.getUser();
    if (authData?.user) {
      const { data: myUser } = await supabase
        .from('usuarios')
        .select('rol')
        .eq('email', authData.user.email)
        .single();
      if (myUser) setCurrentUserRole(myUser.rol);
    }

    // 2. Obtener la lista de todos los empleados
    const { data } = await supabase.from('usuarios').select('*').order('nombre');
    if (data) setEmpleados(data);
    setLoading(false);
  };

  const handleRolChange = async (id, nuevoRol) => {
    toast.loading('Actualizando rol...', { id: 'update_rol' });
    try {
      const { error } = await supabase.from('usuarios').update({ rol: nuevoRol }).eq('id', id);
      if (error) throw error;
      toast.success('Rol actualizado', { id: 'update_rol' });
      setEmpleados(empleados.map(emp => emp.id === id ? { ...emp, rol: nuevoRol } : emp));
    } catch (error) {
      toast.error('Error al actualizar rol: ' + error.message, { id: 'update_rol' });
    }
  };

  useEffect(() => {
    fetchEmpleados();
  }, []);

  const generarCSVTecnicos = async () => {
    toast.loading('Generando CSV...', { id: 'csv' });
    try {
      const tecnicos = empleados.filter(emp => emp.rol === 'tecnico');
      if (tecnicos && tecnicos.length > 0) {
        const csvRows = [];
        const headers = ['id', 'nombre', 'email', 'rol', 'estado']; // Select specific headers
        csvRows.push(headers.join(','));
        for (const row of tecnicos) {
          const values = headers.map(header => `"${row[header]}"`);
          csvRows.push(values.join(','));
        }
        const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.setAttribute('hidden', '');
        a.setAttribute('href', url);
        a.setAttribute('download', 'tecnicos_disponibles.csv');
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        toast.success('CSV descargado', { id: 'csv' });
      } else {
        toast.error('No hay técnicos registrados', { id: 'csv' });
      }
    } catch (error) {
      toast.error('Error al generar CSV', { id: 'csv' });
    }
  };

  const handleDesactivar = async (id, nombre) => {
    if (window.confirm(`¿Estás seguro de que deseas desactivar a "${nombre}"? No podrá acceder al sistema.`)) {
      toast.loading('Desactivando empleado...', { id: 'deactivate' });
      try {
        const { error } = await supabase.from('usuarios').update({ estado: 'inactivo' }).eq('id', id);
        if (error) throw error;
        toast.success('Empleado desactivado', { id: 'deactivate' });
        fetchEmpleados();
      } catch (error) {
        toast.error('Error al desactivar: ' + error.message, { id: 'deactivate' });
      }
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    toast.loading('Registrando empleado...', { id: 'create' });
    
    try {
      // Validar si el email ya existe
      const { data: existe } = await supabase.from('usuarios').select('id').eq('email', nuevoEmpleado.email.trim());
      if (existe && existe.length > 0) {
        toast.error('Este correo ya está registrado en el sistema.', { id: 'create' });
        setSaving(false);
        return;
      }

      // 1. Opcional: Podrías crearlo en Auth también, pero por ahora solo lo registramos en nuestra tabla operativa
      const { error } = await supabase.from('usuarios').insert([{
        nombre: nuevoEmpleado.nombre.trim(),
        email: nuevoEmpleado.email.trim(),
        rol: nuevoEmpleado.rol,
        estado: 'activo'
      }]);
      
      if (error) throw error;
      
      toast.success('Empleado registrado', { id: 'create' });
      setShowModal(false);
      setNuevoEmpleado({ nombre: '', email: '', rol: 'ventas', estado: 'activo' });
      fetchEmpleados();
    } catch (error) {
      toast.error('Error al registrar: ' + error.message, { id: 'create' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ color: 'white' }}>Gestión de Empleados</h2>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="btn-outline" onClick={generarCSVTecnicos} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <Download size={18} /> Exportar Técnicos (CSV)
          </button>
          <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }} onClick={() => setShowModal(true)}>
            <Plus size={18} /> Nuevo Empleado
          </button>
        </div>
      </div>

      <div className="glass-panel" style={{ overflowX: 'auto' }}>
        {loading ? (
          <p style={{ padding: '2rem', color: 'white', textAlign: 'center' }}>Cargando empleados...</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', color: 'white', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'rgba(0,0,0,0.2)' }}>
                <th style={{ padding: '1rem' }}>Nombre</th>
                <th style={{ padding: '1rem' }}>Correo Electrónico</th>
                <th style={{ padding: '1rem' }}>Rol</th>
                <th style={{ padding: '1rem' }}>Estado</th>
                <th style={{ padding: '1rem' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {empleados.map((emp) => (
                <tr key={emp.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '1rem', fontWeight: 'bold' }}>{emp.nombre}</td>
                  <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>{emp.email}</td>
                  <td style={{ padding: '1rem' }}>
                    {currentUserRole === 'admin' && emp.rol !== 'admin' ? (
                      <select 
                        value={emp.rol} 
                        onChange={(e) => handleRolChange(emp.id, e.target.value)}
                        style={{
                          backgroundColor: 'rgba(59, 130, 246, 0.2)',
                          color: '#60a5fa',
                          border: '1px solid #60a5fa',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          outline: 'none',
                          cursor: 'pointer',
                          fontWeight: 'bold',
                          fontSize: '0.8rem',
                          textTransform: 'uppercase'
                        }}
                      >
                        <option value="admin" style={{ color: 'black' }}>ADMIN</option>
                        <option value="ventas" style={{ color: 'black' }}>VENTAS</option>
                        <option value="tecnico" style={{ color: 'black' }}>TECNICO</option>
                        <option value="logistica" style={{ color: 'black' }}>LOGISTICA</option>
                        <option value="operaciones" style={{ color: 'black' }}>OPERACIONES</option>
                        <option value="facturacion" style={{ color: 'black' }}>FACTURACION</option>
                      </select>
                    ) : (
                      <span style={{ 
                        padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem',
                        background: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa'
                      }}>
                        {emp.rol.toUpperCase()}
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{ 
                      padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem',
                      background: emp.estado === 'activo' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                      color: emp.estado === 'activo' ? '#34d399' : '#f87171'
                    }}>
                      {emp.estado.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    {emp.estado === 'activo' && currentUserRole === 'admin' && (
                      <button 
                        onClick={() => handleDesactivar(emp.id, emp.nombre)} 
                        style={{ background: 'transparent', border: 'none', color: '#f87171', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                        title="Desactivar Empleado"
                      >
                        <UserMinus size={16} /> Desactivar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal Nuevo Empleado */}
      <AnimatePresence>
        {showModal && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="glass-panel" 
              style={{ width: '90%', maxWidth: '400px', padding: '2rem', background: 'var(--bg-card)' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ color: 'white', margin: 0 }}>Registrar Empleado</h3>
                <button onClick={() => setShowModal(false)} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}><X size={24} /></button>
              </div>

              <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Nombre Completo</label>
                  <input type="text" required value={nuevoEmpleado.nombre} onChange={(e) => setNuevoEmpleado({...nuevoEmpleado, nombre: e.target.value})} style={{ width: '100%', padding: '0.5rem', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', color: 'white', borderRadius: '4px' }} />
                </div>
                <div>
                  <label style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Correo Electrónico</label>
                  <input type="email" required value={nuevoEmpleado.email} onChange={(e) => setNuevoEmpleado({...nuevoEmpleado, email: e.target.value})} style={{ width: '100%', padding: '0.5rem', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', color: 'white', borderRadius: '4px' }} />
                </div>
                <div>
                  <label style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Rol en el Sistema</label>
                  <select required value={nuevoEmpleado.rol} onChange={(e) => setNuevoEmpleado({...nuevoEmpleado, rol: e.target.value})} style={{ width: '100%', padding: '0.5rem', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', color: 'white', borderRadius: '4px' }}>
                    <option value="admin">Administrador</option>
                    <option value="ventas">Ventas</option>
                    <option value="tecnico">Técnico Instalador</option>
                    <option value="logistica">Logística</option>
                    <option value="facturacion">Facturación</option>
                  </select>
                </div>
                
                <button type="submit" className="btn-primary" style={{ marginTop: '1rem' }} disabled={saving}>
                  {saving ? 'Registrando...' : 'Confirmar Registro'}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
