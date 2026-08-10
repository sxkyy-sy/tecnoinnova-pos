import React, { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Plus, X, Edit2, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';

export default function Inventario() {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [nuevoProducto, setNuevoProducto] = useState({
    nombre: '',
    codigo_producto: '',
    stock_actual: 0,
    stock_minimo: 5,
    precio_unitario_bs: 0,
    precio_unitario_usd: 0
  });
  
  const [editModal, setEditModal] = useState(false);
  const [editProducto, setEditProducto] = useState(null);
  
  const [saving, setSaving] = useState(false);

  const fetchInventario = async () => {
    setLoading(true);
    const { data } = await supabase.from('productos').select('*').order('nombre');
    if (data) setProductos(data);
    setLoading(false);
  };

  const generarXLSInventario = async () => {
    toast.loading('Generando hoja de cálculo...', { id: 'xls' });
    try {
      if (!productos || productos.length === 0) {
        toast.error('El inventario está vacío, no hay nada que exportar.', { id: 'xls' });
        return;
      }
      const mappedData = productos.map(item => ({
        "Código": item.codigo_producto,
        "Producto": item.nombre,
        "Stock Actual": item.stock_actual,
        "Stock Mínimo": item.stock_minimo,
        "Precio (Bs.)": item.precio_unitario_bs,
        "Precio ($USD)": item.precio_unitario_usd
      }));
      const worksheet = XLSX.utils.json_to_sheet(mappedData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Inventario');
      XLSX.writeFile(workbook, 'Inventario_TecnoInnova.xlsx');
      toast.success('Excel generado exitosamente', { id: 'xls' });
    } catch (error) {
      toast.error('Error al generar el Excel: ' + error.message, { id: 'xls' });
    }
  };

  useEffect(() => {
    fetchInventario();
  }, []);

  const handleDelete = async (id, nombre) => {
    if (window.confirm(`¿Estás seguro de que deseas eliminar el producto "${nombre}"?`)) {
      toast.loading('Eliminando producto...', { id: 'delete' });
      try {
        const { error } = await supabase.from('productos').delete().eq('id', id);
        if (error) throw error;
        toast.success('Producto eliminado', { id: 'delete' });
        fetchInventario();
      } catch (error) {
        toast.error('Error al eliminar: ' + error.message, { id: 'delete' });
      }
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    toast.loading('Guardando producto...', { id: 'create' });
    try {
      const { error } = await supabase.from('productos').insert([nuevoProducto]);
      if (error) throw error;
      toast.success('Producto creado', { id: 'create' });
      setShowModal(false);
      setNuevoProducto({ nombre: '', codigo_producto: '', stock_actual: 0, stock_minimo: 5, precio_unitario_bs: 0, precio_unitario_usd: 0 });
      fetchInventario();
    } catch (error) {
      toast.error('Error al guardar: ' + error.message, { id: 'create' });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    toast.loading('Actualizando producto...', { id: 'update' });
    try {
      const { error } = await supabase.from('productos').update({
        nombre: editProducto.nombre,
        codigo_producto: editProducto.codigo_producto,
        stock_actual: editProducto.stock_actual,
        stock_minimo: editProducto.stock_minimo,
        precio_unitario_bs: editProducto.precio_unitario_bs,
        precio_unitario_usd: editProducto.precio_unitario_usd
      }).eq('id', editProducto.id);
      
      if (error) throw error;
      toast.success('Producto actualizado', { id: 'update' });
      setEditModal(false);
      setEditProducto(null);
      fetchInventario();
    } catch (error) {
      toast.error('Error al actualizar: ' + error.message, { id: 'update' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ color: 'white' }}>Control de Inventario (Almacén)</h2>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="btn-outline" onClick={generarXLSInventario} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <Download size={18} /> Exportar Excel
          </button>
          <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }} onClick={() => setShowModal(true)}>
            <Plus size={18} /> Agregar Producto
          </button>
        </div>
      </div>

      <div className="glass-panel" style={{ overflowX: 'auto' }}>
        {loading ? (
          <p style={{ padding: '2rem', color: 'white', textAlign: 'center' }}>Cargando inventario...</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', color: 'white', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'rgba(0,0,0,0.2)' }}>
                <th style={{ padding: '1rem' }}>Código</th>
                <th style={{ padding: '1rem' }}>Producto</th>
                <th style={{ padding: '1rem' }}>Stock</th>
                <th style={{ padding: '1rem' }}>Mínimo</th>
                <th style={{ padding: '1rem' }}>Precio (Bs)</th>
                <th style={{ padding: '1rem' }}>Ref (USD)</th>
                <th style={{ padding: '1rem' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {productos.map((prod) => (
                <tr key={prod.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>{prod.codigo_producto}</td>
                  <td style={{ padding: '1rem' }}>{prod.nombre}</td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{ color: prod.stock_actual <= prod.stock_minimo ? '#ef4444' : 'white', fontWeight: prod.stock_actual <= prod.stock_minimo ? 'bold' : 'normal' }}>
                      {prod.stock_actual}
                    </span>
                  </td>
                  <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>{prod.stock_minimo}</td>
                  <td style={{ padding: '1rem' }}>Bs. {Number(prod.precio_unitario_bs).toLocaleString('es-VE')}</td>
                  <td style={{ padding: '1rem', color: '#10b981', fontWeight: 'bold' }}>$ {Number(prod.precio_unitario_usd).toFixed(2)}</td>
                  <td style={{ padding: '1rem', display: 'flex', gap: '8px' }}>
                    <button 
                      onClick={() => {
                        setEditProducto(prod);
                        setEditModal(true);
                      }} 
                      style={{ background: 'transparent', border: 'none', color: '#60a5fa', cursor: 'pointer', padding: '4px' }}
                      title="Editar producto"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button 
                      onClick={() => handleDelete(prod.id, prod.nombre)} 
                      style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}
                      title="Eliminar producto"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal Agregar Producto */}
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
                <h3 style={{ color: 'white', margin: 0 }}>Nuevo Producto</h3>
                <button onClick={() => setShowModal(false)} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}><X size={24} /></button>
              </div>

              <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Nombre del Producto</label>
                  <input type="text" required value={nuevoProducto.nombre} onChange={(e) => setNuevoProducto({...nuevoProducto, nombre: e.target.value})} style={{ width: '100%', padding: '0.5rem', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', color: 'white', borderRadius: '4px' }} />
                </div>
                <div>
                  <label style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Código (SKU)</label>
                  <input type="text" required value={nuevoProducto.codigo_producto} onChange={(e) => setNuevoProducto({...nuevoProducto, codigo_producto: e.target.value})} style={{ width: '100%', padding: '0.5rem', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', color: 'white', borderRadius: '4px' }} />
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Stock Inicial</label>
                    <input type="number" required min="0" value={nuevoProducto.stock_actual} onChange={(e) => setNuevoProducto({...nuevoProducto, stock_actual: parseInt(e.target.value)})} style={{ width: '100%', padding: '0.5rem', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', color: 'white', borderRadius: '4px' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Stock Mínimo</label>
                    <input type="number" required min="0" value={nuevoProducto.stock_minimo} onChange={(e) => setNuevoProducto({...nuevoProducto, stock_minimo: parseInt(e.target.value)})} style={{ width: '100%', padding: '0.5rem', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', color: 'white', borderRadius: '4px' }} />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Precio (USD)</label>
                    <input 
                      type="number" step="0.01" required min="0" 
                      value={nuevoProducto.precio_unitario_usd} 
                      onChange={(e) => {
                        const usd = parseFloat(e.target.value) || 0;
                        setNuevoProducto({
                          ...nuevoProducto, 
                          precio_unitario_usd: usd,
                          precio_unitario_bs: usd * 750 // Tasa BCV 750
                        });
                      }} 
                      style={{ width: '100%', padding: '0.5rem', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', color: 'white', borderRadius: '4px' }} 
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Precio Legal (Bs)</label>
                    <input type="number" step="0.01" required min="0" value={nuevoProducto.precio_unitario_bs} readOnly style={{ width: '100%', padding: '0.5rem', background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-color)', color: 'var(--text-muted)', borderRadius: '4px', cursor: 'not-allowed' }} />
                  </div>
                </div>
                
                <button type="submit" className="btn-primary" style={{ marginTop: '1rem' }} disabled={saving}>
                  {saving ? 'Guardando...' : 'Guardar Producto'}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Editar Producto */}
      <AnimatePresence>
        {editModal && editProducto && (
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
                <h3 style={{ color: 'white', margin: 0 }}>Editar Producto</h3>
                <button onClick={() => {setEditModal(false); setEditProducto(null);}} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}><X size={24} /></button>
              </div>

              <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Nombre del Producto</label>
                  <input type="text" required value={editProducto.nombre} onChange={(e) => setEditProducto({...editProducto, nombre: e.target.value})} style={{ width: '100%', padding: '0.5rem', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', color: 'white', borderRadius: '4px' }} />
                </div>
                <div>
                  <label style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Código (SKU)</label>
                  <input type="text" required value={editProducto.codigo_producto} onChange={(e) => setEditProducto({...editProducto, codigo_producto: e.target.value})} style={{ width: '100%', padding: '0.5rem', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', color: 'white', borderRadius: '4px' }} />
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Stock Actual</label>
                    <input type="number" required min="0" value={editProducto.stock_actual} onChange={(e) => setEditProducto({...editProducto, stock_actual: parseInt(e.target.value)})} style={{ width: '100%', padding: '0.5rem', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', color: 'white', borderRadius: '4px' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Stock Mínimo</label>
                    <input type="number" required min="0" value={editProducto.stock_minimo} onChange={(e) => setEditProducto({...editProducto, stock_minimo: parseInt(e.target.value)})} style={{ width: '100%', padding: '0.5rem', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', color: 'white', borderRadius: '4px' }} />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Precio (USD)</label>
                    <input 
                      type="number" step="0.01" required min="0" 
                      value={editProducto.precio_unitario_usd} 
                      onChange={(e) => {
                        const usd = parseFloat(e.target.value) || 0;
                        setEditProducto({
                          ...editProducto, 
                          precio_unitario_usd: usd,
                          precio_unitario_bs: usd * 750 // Tasa BCV 750
                        });
                      }} 
                      style={{ width: '100%', padding: '0.5rem', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', color: 'white', borderRadius: '4px' }} 
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Precio Legal (Bs)</label>
                    <input type="number" step="0.01" required min="0" value={editProducto.precio_unitario_bs} readOnly style={{ width: '100%', padding: '0.5rem', background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-color)', color: 'var(--text-muted)', borderRadius: '4px', cursor: 'not-allowed' }} />
                  </div>
                </div>
                
                <button type="submit" className="btn-primary" style={{ marginTop: '1rem' }} disabled={saving}>
                  {saving ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
