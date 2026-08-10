import React, { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Pedidos() {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Auditoría Modal
  const [selectedPedido, setSelectedPedido] = useState(null);
  const [detalles, setDetalles] = useState([]);
  const [factura, setFactura] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // POS (Punto de Venta) Modal
  const [showPOS, setShowPOS] = useState(false);
  const [clientesList, setClientesList] = useState([]);
  const [productosList, setProductosList] = useState([]);
  const [ventaCliente, setVentaCliente] = useState('');
  const [ventaItems, setVentaItems] = useState([]);
  const [savingVenta, setSavingVenta] = useState(false);

  const fetchPedidos = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('pedidos')
      .select(`
        *,
        clientes (nombre_razon_social, rif_ci)
      `)
      .order('fecha_pedido', { ascending: false });
    if (data) setPedidos(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchPedidos();
  }, []);

  const openAuditoria = async (pedido) => {
    setSelectedPedido(pedido);
    setLoadingDetails(true);
    setDetalles([]);
    setFactura(null);

    try {
      const { data: detData } = await supabase
        .from('detalle_pedidos')
        .select(`
          cantidad, precio_unitario_bs, subtotal_bs, alicuota_iva,
          productos (nombre, codigo_producto)
        `)
        .eq('pedido_id', pedido.id);
      if (detData) setDetalles(detData);

      const { data: facData } = await supabase
        .from('facturas')
        .select('*')
        .eq('pedido_id', pedido.id)
        .single();
      if (facData) setFactura(facData);
      
    } catch (error) {
      console.error(error);
      toast.error('Error cargando auditoría');
    } finally {
      setLoadingDetails(false);
    }
  };

  // ==========================================
  // LÓGICA DE PUNTO DE VENTA (POS)
  // ==========================================

  const fetchPosData = async () => {
    const { data: c } = await supabase.from('clientes').select('id, nombre_razon_social, rif_ci').order('nombre_razon_social');
    if (c) setClientesList(c);
    
    const { data: p } = await supabase.from('productos').select('*').order('nombre');
    if (p) setProductosList(p);
  };

  const handleOpenPOS = () => {
    fetchPosData();
    setShowPOS(true);
    setVentaCliente('');
    setVentaItems([{ producto_id: '', cantidad: 1 }]);
  };

  const addVentaItem = () => {
    setVentaItems([...ventaItems, { producto_id: '', cantidad: 1 }]);
  };

  const removeVentaItem = (index) => {
    setVentaItems(ventaItems.filter((_, i) => i !== index));
  };

  const updateVentaItem = (index, field, value) => {
    const newItems = [...ventaItems];
    newItems[index][field] = value;
    setVentaItems(newItems);
  };

  const getProductPrice = (id) => {
    const p = productosList.find(x => x.id === id);
    return p ? p.precio_unitario_bs : 0;
  };

  const getProductStock = (id) => {
    const p = productosList.find(x => x.id === id);
    return p ? p.stock_actual : 0;
  };

  const montoBase = ventaItems.reduce((acc, item) => {
    if(!item.producto_id) return acc;
    return acc + (getProductPrice(item.producto_id) * item.cantidad);
  }, 0);
  
  const montoIva = montoBase * 0.16;
  const montoTotal = montoBase + montoIva;

  const handleSubmitPOS = async (e) => {
    e.preventDefault();
    if (!ventaCliente) return toast.error('Selecciona un cliente');
    if (ventaItems.length === 0) return toast.error('Añade al menos un producto');
    
    // Validar productos y stock
    for (let item of ventaItems) {
      if (!item.producto_id) return toast.error('Hay líneas de producto vacías');
      if (item.cantidad <= 0) return toast.error('La cantidad debe ser mayor a 0');
      
      const stockDisp = getProductStock(item.producto_id);
      if (item.cantidad > stockDisp) {
        const pInfo = productosList.find(x => x.id === item.producto_id);
        return toast.error(`Stock insuficiente para ${pInfo.nombre}. Disp: ${stockDisp}`);
      }
    }

    setSavingVenta(true);
    toast.loading('Procesando venta y descontando stock...', { id: 'pos' });
    
    try {
      // 1. Obtener vendedor (current user)
      const { data: authData } = await supabase.auth.getUser();
      let usuarioId = null;
      if (authData?.user) {
        const { data: userData } = await supabase.from('usuarios').select('id').eq('email', authData.user.email).single();
        if (userData) usuarioId = userData.id;
      }
      
      if (!usuarioId) {
        const { data: fallbackUser } = await supabase.from('usuarios').select('id').in('rol', ['admin', 'ventas']).limit(1).single();
        if(fallbackUser) usuarioId = fallbackUser.id;
      }

      // 2. Crear Pedido
      const { data: nuevoPedido, error: pedidoError } = await supabase.from('pedidos').insert([{
        cliente_id: ventaCliente,
        usuario_ventas_id: usuarioId,
        estado: 'aprobado',
        monto_total_bs: montoTotal,
        observaciones: 'Venta ingresada manualmente por POS'
      }]).select().single();
      
      if (pedidoError) throw pedidoError;

      // 3. Crear Detalles y Restar Stock
      for (let item of ventaItems) {
        const precioUnitario = getProductPrice(item.producto_id);
        
        await supabase.from('detalle_pedidos').insert([{
          pedido_id: nuevoPedido.id,
          producto_id: item.producto_id,
          cantidad: item.cantidad,
          precio_unitario_bs: precioUnitario
        }]);

        const currentStock = getProductStock(item.producto_id);
        await supabase.from('productos').update({ stock_actual: currentStock - item.cantidad }).eq('id', item.producto_id);
      }

      // 4. Crear Factura
      await supabase.from('facturas').insert([{
        pedido_id: nuevoPedido.id,
        numero_factura: String(Math.floor(Math.random() * 999999)).padStart(8, '0'),
        numero_control: '00-' + String(Math.floor(Math.random() * 99999999)).padStart(8, '0'),
        tasa_bcv: 750.00,
        base_imponible: montoBase,
        monto_iva: montoIva,
        total_operacion: montoTotal,
        estado_pago: 'pagado'
      }]);

      toast.success('Venta registrada exitosamente', { id: 'pos' });
      setShowPOS(false);
      fetchPedidos();
    } catch (error) {
      console.error(error);
      toast.error('Error procesando venta: ' + error.message, { id: 'pos' });
    } finally {
      setSavingVenta(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ color: 'white' }}>Gestión de Pedidos</h2>
        <button className="btn-primary" onClick={handleOpenPOS} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Plus size={18} /> Nueva Venta
        </button>
      </div>

      <div className="glass-panel" style={{ overflowX: 'auto' }}>
        {loading ? (
          <p style={{ padding: '2rem', color: 'white', textAlign: 'center' }}>Cargando pedidos...</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', color: 'white', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'rgba(0,0,0,0.2)' }}>
                <th style={{ padding: '1rem' }}>ID Orden</th>
                <th style={{ padding: '1rem' }}>Cliente</th>
                <th style={{ padding: '1rem' }}>RIF/CI</th>
                <th style={{ padding: '1rem' }}>Fecha</th>
                <th style={{ padding: '1rem' }}>Estado</th>
                <th style={{ padding: '1rem' }}>Total (Bs)</th>
                <th style={{ padding: '1rem' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {pedidos.map((pedido) => (
                <tr key={pedido.id} style={{ borderBottom: '1px solid var(--border-color)', cursor: 'pointer', transition: 'background 0.2s' }} onClick={() => openAuditoria(pedido)}>
                  <td style={{ padding: '1rem' }}>#{pedido.numero_orden || pedido.id.slice(0,8)}</td>
                  <td style={{ padding: '1rem' }}>{pedido.clientes?.nombre_razon_social}</td>
                  <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>{pedido.clientes?.rif_ci}</td>
                  <td style={{ padding: '1rem' }}>{new Date(pedido.fecha_pedido).toLocaleDateString()}</td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{ 
                      padding: '4px 8px', 
                      borderRadius: '4px', 
                      fontSize: '0.8rem',
                      background: pedido.estado === 'aprobado' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                      color: pedido.estado === 'aprobado' ? '#34d399' : '#fbbf24'
                    }}>
                      {pedido.estado.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ padding: '1rem' }}>Bs. {Number(pedido.monto_total_bs).toLocaleString('es-VE')}</td>
                  <td style={{ padding: '1rem' }}>
                    <button className="btn-outline" style={{ padding: '6px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Search size={14} /> Auditar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal de Punto de Venta (POS) */}
      <AnimatePresence>
        {showPOS && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="glass-panel" 
              style={{ width: '90%', maxWidth: '800px', padding: '2rem', maxHeight: '90vh', overflowY: 'auto', background: 'var(--bg-card)' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
                <h3 style={{ color: 'white', margin: 0, fontSize: '1.5rem' }}>Nueva Orden</h3>
                <button onClick={() => setShowPOS(false)} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}><X size={24} /></button>
              </div>

              <form onSubmit={handleSubmitPOS}>
                {/* Selección de Cliente */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ color: 'var(--text-muted)', fontSize: '0.85rem', display: 'block', marginBottom: '0.5rem' }}>Seleccionar Cliente</label>
                  <select 
                    required 
                    value={ventaCliente} 
                    onChange={(e) => setVentaCliente(e.target.value)} 
                    style={{ width: '100%', padding: '0.75rem', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', color: 'white', borderRadius: '4px' }}
                  >
                    <option value="" style={{ color: 'black' }}>-- Seleccione un cliente --</option>
                    {clientesList.map(c => (
                      <option key={c.id} value={c.id} style={{ color: 'black' }}>{c.nombre_razon_social} (RIF: {c.rif_ci})</option>
                    ))}
                  </select>
                </div>

                {/* Lista de Productos */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <label style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Productos a Vender</label>
                    <button type="button" onClick={addVentaItem} style={{ background: 'transparent', border: 'none', color: '#3b82f6', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem' }}>
                      <Plus size={16} /> Añadir Línea
                    </button>
                  </div>
                  
                  {ventaItems.map((item, index) => (
                    <div key={index} style={{ display: 'flex', gap: '1rem', marginBottom: '0.5rem', alignItems: 'center' }}>
                      <select 
                        required 
                        value={item.producto_id} 
                        onChange={(e) => updateVentaItem(index, 'producto_id', e.target.value)} 
                        style={{ flex: 1, padding: '0.5rem', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', color: 'white', borderRadius: '4px' }}
                      >
                        <option value="" style={{ color: 'black' }}>-- Seleccione producto --</option>
                        {productosList.map(p => (
                          <option key={p.id} value={p.id} disabled={p.stock_actual <= 0} style={{ color: 'black' }}>
                            {p.nombre} (Stock Disp: {p.stock_actual}) - Bs. {Number(p.precio_unitario_bs).toLocaleString('es-VE')}
                          </option>
                        ))}
                      </select>
                      
                      <input 
                        type="number" required min="1" 
                        value={item.cantidad} 
                        onChange={(e) => updateVentaItem(index, 'cantidad', parseInt(e.target.value) || 1)} 
                        style={{ width: '80px', padding: '0.5rem', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', color: 'white', borderRadius: '4px', textAlign: 'center' }} 
                      />
                      
                      <button type="button" onClick={() => removeVentaItem(index)} style={{ background: 'rgba(239, 68, 68, 0.1)', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.5rem', borderRadius: '4px' }}>
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
                  {ventaItems.length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontStyle: 'italic' }}>No has añadido productos.</p>}
                </div>

                {/* Totalización */}
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '8px', border: '1px solid var(--border-color)', marginBottom: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>
                    <span>Base Imponible:</span>
                    <span>Bs. {montoBase.toLocaleString('es-VE')}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', color: 'var(--text-muted)' }}>
                    <span>IVA (16%):</span>
                    <span>Bs. {montoIva.toLocaleString('es-VE')}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-color)', paddingTop: '1rem', color: 'white', fontSize: '1.2rem', fontWeight: 'bold' }}>
                    <span>Total Operación:</span>
                    <span style={{ color: 'var(--accent)' }}>Bs. {montoTotal.toLocaleString('es-VE')}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                  <button type="button" className="btn-outline" onClick={() => setShowPOS(false)} disabled={savingVenta}>Cancelar</button>
                  <button type="submit" className="btn-primary" disabled={savingVenta || ventaItems.length === 0 || !ventaCliente}>
                    {savingVenta ? 'Procesando...' : 'Confirmar Venta'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de Auditoría */}
      <AnimatePresence>
        {selectedPedido && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="glass-panel" 
              style={{ width: '90%', maxWidth: '800px', padding: '2rem', maxHeight: '90vh', overflowY: 'auto', background: 'var(--bg-card)' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
                <h3 style={{ color: 'white', margin: 0, fontSize: '1.5rem' }}>
                  Auditoría de Pedido #{selectedPedido.numero_orden || selectedPedido.id.slice(0,8)}
                </h3>
                <button onClick={() => setSelectedPedido(null)} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}><X size={24} /></button>
              </div>

              {loadingDetails ? (
                <p style={{ color: 'white' }}>Cargando información de auditoría...</p>
              ) : (
                <div style={{ display: 'grid', gap: '2rem' }}>
                  
                  {/* Detalles de Productos */}
                  <div>
                    <h4 style={{ color: 'var(--primary)', marginBottom: '1rem' }}>Productos Facturados</h4>
                    <table style={{ width: '100%', borderCollapse: 'collapse', color: 'white', fontSize: '0.9rem' }}>
                      <thead>
                        <tr style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>
                          <th style={{ padding: '8px', textAlign: 'left' }}>Cod.</th>
                          <th style={{ padding: '8px', textAlign: 'left' }}>Producto</th>
                          <th style={{ padding: '8px', textAlign: 'center' }}>Cant.</th>
                          <th style={{ padding: '8px', textAlign: 'right' }}>Precio Unit.</th>
                          <th style={{ padding: '8px', textAlign: 'right' }}>Subtotal</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detalles.map((d, i) => (
                          <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                            <td style={{ padding: '8px', color: 'var(--text-muted)' }}>{d.productos?.codigo_producto}</td>
                            <td style={{ padding: '8px' }}>{d.productos?.nombre}</td>
                            <td style={{ padding: '8px', textAlign: 'center' }}>{d.cantidad}</td>
                            <td style={{ padding: '8px', textAlign: 'right' }}>Bs. {Number(d.precio_unitario_bs).toLocaleString('es-VE')}</td>
                            <td style={{ padding: '8px', textAlign: 'right' }}>Bs. {Number(d.subtotal_bs).toLocaleString('es-VE')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {detalles.length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No hay detalles (pedido manual o vacío).</p>}
                  </div>

                  {/* Factura SENIAT */}
                  <div>
                    <h4 style={{ color: 'var(--accent)', marginBottom: '1rem' }}>Auditoría Fiscal SENIAT</h4>
                    {factura ? (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                        <div>
                          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: 0 }}>Nro. Factura</p>
                          <p style={{ color: 'white', fontSize: '1.1rem', fontWeight: 600 }}>{factura.numero_factura}</p>
                        </div>
                        <div>
                          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: 0 }}>Nro. Control</p>
                          <p style={{ color: 'white', fontSize: '1.1rem', fontWeight: 600 }}>{factura.numero_control}</p>
                        </div>
                        <div>
                          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: 0 }}>Base Imponible</p>
                          <p style={{ color: 'white' }}>Bs. {Number(factura.base_imponible).toLocaleString('es-VE')}</p>
                        </div>
                        <div>
                          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: 0 }}>IVA (16%)</p>
                          <p style={{ color: 'white' }}>Bs. {Number(factura.monto_iva).toLocaleString('es-VE')}</p>
                        </div>
                        <div>
                          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: 0 }}>Tasa BCV Referencial</p>
                          <p style={{ color: 'white' }}>Bs. {Number(factura.tasa_bcv).toFixed(2)} / USD</p>
                        </div>
                        <div>
                          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: 0 }}>Total Operación</p>
                          <p style={{ color: 'var(--accent)', fontSize: '1.2rem', fontWeight: 'bold' }}>Bs. {Number(factura.total_operacion).toLocaleString('es-VE')}</p>
                        </div>
                      </div>
                    ) : (
                      <p style={{ color: 'var(--text-muted)' }}>La factura aún no ha sido emitida para este pedido.</p>
                    )}
                  </div>

                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
