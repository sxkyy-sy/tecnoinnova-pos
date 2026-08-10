import React, { useEffect, useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../supabase';
import { LayoutDashboard, ShoppingCart, Package, Wrench, FileText, LogOut, Shield, Users, User, BarChart3 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData?.user) {
        navigate('/login');
        return;
      }

      if (authData?.user) {
        const { data: userData } = await supabase
          .from('usuarios')
          .select('nombre, rol')
          .eq('email', authData.user.email)
          .single();
        if (userData) {
          setCurrentUser(userData);
        }
      }
    };
    fetchUser();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success('Sesión cerrada exitosamente');
    navigate('/login');
  };

  const navItems = [
    { name: 'Estadísticas', path: '/dashboard', icon: <BarChart3 size={20} />, adminOnly: true },
    { name: 'Clientes', path: '/clientes', icon: <Users size={20} /> },
    { name: 'Pedidos', path: '/pedidos', icon: <ShoppingCart size={20} /> },
    { name: 'Inventario', path: '/inventario', icon: <Package size={20} /> },
    { name: 'Instalaciones', path: '/instalaciones', icon: <Wrench size={20} /> },
    { name: 'Empleados', path: '/empleados', icon: <User size={20} /> },
    { name: 'Reportes Fiscales', path: '/reportes', icon: <FileText size={20} /> },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-color)' }}>
      {/* Sidebar */}
      <aside className="glass-panel" style={{ width: '260px', margin: '16px', display: 'flex', flexDirection: 'column', padding: '24px 0' }}>
        <div style={{ padding: '0 24px', marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ background: 'var(--primary)', padding: '8px', borderRadius: '12px' }}>
            <Shield size={24} color="white" />
          </div>
          <h2 style={{ fontSize: '1.25rem', color: 'var(--text-main)', margin: 0 }}>TecnoInnova</h2>
        </div>

        <nav style={{ flex: 1, padding: '0 12px' }}>
          {navItems.map((item) => {
            if (item.adminOnly && (!currentUser || currentUser.rol !== 'admin')) return null;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 16px',
                  color: isActive ? 'white' : 'var(--text-muted)',
                  background: isActive ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                  borderLeft: isActive ? '3px solid var(--primary)' : '3px solid transparent',
                  borderRadius: '0 8px 8px 0',
                  textDecoration: 'none',
                  fontWeight: 500,
                  marginBottom: '8px',
                  transition: 'all 0.2s ease'
                }}
              >
                {item.icon}
                {item.name}
              </Link>
            )
          })}
        </nav>

        <div style={{ padding: '0 24px' }}>
          <button 
            onClick={handleLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              width: '100%',
              background: 'rgba(239, 68, 68, 0.1)',
              color: 'var(--danger)',
              padding: '12px',
              borderRadius: '8px',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              justifyContent: 'center'
            }}
          >
            <LogOut size={20} />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main style={{ flex: 1, padding: '16px 32px 16px 16px', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', padding: '16px 0', borderBottom: '1px solid var(--border-color)' }}>
          <h1 style={{ fontSize: '1.5rem', color: 'var(--text-main)' }}>Sistema de Gestión</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Conectado a SENIAT-ready DB</span>
            {currentUser && (
              <div style={{ textAlign: 'right', marginLeft: '1rem', borderLeft: '1px solid var(--border-color)', paddingLeft: '1rem' }}>
                <p style={{ margin: 0, color: 'white', fontWeight: 600, fontSize: '0.9rem' }}>{currentUser.nombre}</p>
                <p style={{ margin: 0, color: 'var(--primary)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>{currentUser.rol}</p>
              </div>
            )}
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary), var(--secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <User size={20} color="white" />
            </div>
          </div>
        </header>

        <div style={{ flex: 1 }}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
