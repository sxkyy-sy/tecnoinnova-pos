import React, { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { TrendingUp, ShoppingBag, Users, Wallet } from 'lucide-react';
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import toast from 'react-hot-toast';

export default function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // KPIs
  const [ingresos, setIngresos] = useState(0);
  const [pedidosCount, setPedidosCount] = useState(0);
  const [clientesCount, setClientesCount] = useState(0);
  const [valorInventario, setValorInventario] = useState(0);

  // Chart Data
  const [tendenciaVentas, setTendenciaVentas] = useState([]);
  const [stockProductos, setStockProductos] = useState([]);

  useEffect(() => {
    const checkRoleAndFetchData = async () => {
      // 1. Verificar Seguridad (RBAC)
      const { data: authData } = await supabase.auth.getUser();
      if (!authData?.user) return navigate('/login');

      const { data: userData } = await supabase.from('usuarios').select('rol').eq('email', authData.user.email).single();
      
      if (!userData || userData.rol !== 'admin') {
        toast.error('Acceso denegado. Área exclusiva de administración.');
        navigate('/clientes');
        return;
      }
      
      setIsAdmin(true);
      await fetchEstadisticas();
    };

    checkRoleAndFetchData();
  }, [navigate]);

  const fetchEstadisticas = async () => {
    try {
      // Pedidos
      const { data: todosPedidos } = await supabase.from('pedidos').select('monto_total_bs, fecha_pedido, estado');
      const aprobados = todosPedidos?.filter(p => p.estado === 'aprobado') || [];
      
      const totalBs = aprobados.reduce((acc, curr) => acc + curr.monto_total_bs, 0);
      setIngresos(totalBs);
      setPedidosCount(aprobados.length);

      // Gráfico 1: Estado de Pedidos (BarChart)
      const estadosCount = { aprobado: 0, pendiente: 0, completado: 0, rechazado: 0 };
      todosPedidos?.forEach(p => {
        const state = p.estado?.toLowerCase() || 'pendiente';
        if (estadosCount[state] !== undefined) {
          estadosCount[state]++;
        } else {
          estadosCount[state] = 1;
        }
      });

      const chartEstados = [
        { name: 'Aprobado', Cantidad: estadosCount.aprobado, fill: '#10b981' },
        { name: 'Pendiente', Cantidad: estadosCount.pendiente, fill: '#f59e0b' },
        { name: 'Completado', Cantidad: estadosCount.completado, fill: '#3b82f6' },
        { name: 'Rechazado', Cantidad: estadosCount.rechazado, fill: '#ef4444' }
      ];
      setTendenciaVentas(chartEstados);

      // Clientes
      const { count: cCount } = await supabase.from('clientes').select('*', { count: 'exact', head: true });
      setClientesCount(cCount || 0);

      // Inventario
      const { data: productos } = await supabase.from('productos').select('nombre, stock_actual, precio_unitario_bs');
      const valInv = productos?.reduce((acc, curr) => acc + (curr.stock_actual * curr.precio_unitario_bs), 0) || 0;
      setValorInventario(valInv);

      // Gráfico de Barras (Top 5 Menor Stock)
      if (productos) {
        const lowestStock = [...productos].sort((a, b) => a.stock_actual - b.stock_actual).slice(0, 5).map(p => ({
          nombre: p.nombre.length > 15 ? p.nombre.substring(0, 15) + '...' : p.nombre,
          Stock: p.stock_actual
        }));
        setStockProductos(lowestStock);
      }

    } catch (error) {
      console.error(error);
      toast.error('Error cargando estadísticas');
    } finally {
      setLoading(false);
    }
  };

  if (loading || !isAdmin) {
    return <div style={{ color: 'white', padding: '2rem', textAlign: 'center' }}>Cargando Inteligencia de Negocios...</div>;
  }

  const kpiCards = [
    { title: 'Ingresos Totales (Bs)', value: `Bs. ${ingresos.toLocaleString('es-VE')}`, icon: <TrendingUp size={24} color="#10b981" />, bg: 'rgba(16, 185, 129, 0.1)' },
    { title: 'Pedidos Exitosos', value: pedidosCount, icon: <ShoppingBag size={24} color="#3b82f6" />, bg: 'rgba(59, 130, 246, 0.1)' },
    { title: 'Clientes Registrados', value: clientesCount, icon: <Users size={24} color="#8b5cf6" />, bg: 'rgba(139, 92, 246, 0.1)' },
    { title: 'Capital en Inventario', value: `Bs. ${valorInventario.toLocaleString('es-VE')}`, icon: <Wallet size={24} color="#f59e0b" />, bg: 'rgba(245, 158, 11, 0.1)' }
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ color: 'white', fontSize: '1.8rem', margin: 0 }}>Panel de Control Estratégico</h2>
        <p style={{ color: 'var(--text-muted)', margin: '4px 0 0 0' }}>Estadísticas financieras en tiempo real y KPIs del sistema.</p>
      </div>

      {/* KPI Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
        {kpiCards.map((kpi, idx) => (
          <motion.div 
            key={idx} 
            className="glass-panel" 
            style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.2rem', borderLeft: `4px solid ${kpi.icon.props.color}` }}
            whileHover={{ y: -5, boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}
          >
            <div style={{ background: kpi.bg, padding: '1rem', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {kpi.icon}
            </div>
            <div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '0 0 4px 0', textTransform: 'uppercase', letterSpacing: '1px' }}>{kpi.title}</p>
              <h3 style={{ color: 'white', margin: 0, fontSize: '1.4rem' }}>{kpi.value}</h3>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
        
        {/* Bar Chart 1: Estados de Pedidos */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h3 style={{ color: 'white', margin: '0 0 1.5rem 0', fontSize: '1.1rem' }}>Estado de Pedidos en el Sistema</h3>
          <div style={{ height: '300px', width: '100%' }}>
            {tendenciaVentas.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={tendenciaVentas} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                  <XAxis dataKey="name" stroke="var(--text-muted)" tick={{fill: 'var(--text-muted)'}} />
                  <YAxis stroke="var(--text-muted)" tick={{fill: 'var(--text-muted)'}} allowDecimals={false} />
                  <Tooltip 
                    cursor={{fill: 'rgba(255,255,255,0.05)'}}
                    contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white' }}
                  />
                  <Bar dataKey="Cantidad" radius={[4, 4, 0, 0]} barSize={40}>
                    {tendenciaVentas.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                No hay pedidos para mostrar.
              </div>
            )}
          </div>
        </div>

        {/* Bar Chart: Inventario Menor Stock */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h3 style={{ color: 'white', margin: '0 0 1.5rem 0', fontSize: '1.1rem' }}>Top 5 Productos con Menor Stock</h3>
          <div style={{ height: '300px', width: '100%' }}>
            {stockProductos.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stockProductos} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                  <XAxis dataKey="nombre" stroke="var(--text-muted)" tick={{fill: 'var(--text-muted)', fontSize: 10}} interval={0} angle={-45} textAnchor="end" height={60} />
                  <YAxis stroke="var(--text-muted)" tick={{fill: 'var(--text-muted)'}} allowDecimals={false} />
                  <Tooltip 
                    cursor={{fill: 'rgba(255,255,255,0.05)'}}
                    contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white' }}
                  />
                  <Legend wrapperStyle={{ paddingTop: '20px' }} />
                  <Bar dataKey="Stock" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={30} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                No hay productos registrados.
              </div>
            )}
          </div>
        </div>

      </div>
    </motion.div>
  );
}
