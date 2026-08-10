import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import { motion } from 'framer-motion';
import { Shield, Mail, Lock } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Bienvenido a TecnoInnova');
      const { data: userData } = await supabase.from('usuarios').select('rol').eq('email', email.trim()).single();
      if (userData?.rol === 'admin') {
        navigate('/dashboard');
      } else {
        navigate('/clientes');
      }
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-color)', position: 'relative', overflow: 'hidden' }}>
      {/* Decorative BG elements */}
      <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '40vw', height: '40vw', background: 'var(--primary-glow)', filter: 'blur(100px)', borderRadius: '50%', opacity: 0.5 }}></div>
      <div style={{ position: 'absolute', bottom: '-10%', right: '-10%', width: '40vw', height: '40vw', background: 'rgba(139, 92, 246, 0.3)', filter: 'blur(100px)', borderRadius: '50%', opacity: 0.5 }}></div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="glass-panel"
        style={{ padding: '3rem', width: '100%', maxWidth: '400px', zIndex: 1 }}
      >
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'inline-flex', background: 'var(--primary)', padding: '12px', borderRadius: '16px', marginBottom: '1rem' }}>
            <Shield size={32} color="white" />
          </div>
          <h2 style={{ color: 'white', fontSize: '1.8rem', marginBottom: '0.5rem' }}>Iniciar Sesión</h2>
          <p style={{ color: 'var(--text-muted)' }}>Panel de Gestión de TecnoInnova</p>
        </div>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <label style={{ display: 'block', color: 'var(--text-muted)', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Correo Electrónico</label>
            <div style={{ position: 'relative' }}>
              <Mail size={20} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ width: '100%', paddingLeft: '40px' }} 
                placeholder="ejemplo@tecnoinnova.com.ve" 
              />
            </div>
          </div>
          <div>
            <label style={{ display: 'block', color: 'var(--text-muted)', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Contraseña</label>
            <div style={{ position: 'relative' }}>
              <Lock size={20} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ width: '100%', paddingLeft: '40px' }} 
                placeholder="••••••••" 
              />
            </div>
          </div>
          <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: '1rem' }}>
            {loading ? 'Iniciando...' : 'Entrar al Sistema'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '2rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          ¿No tienes cuenta? <span style={{ color: 'var(--primary)', cursor: 'pointer' }} onClick={() => navigate('/register')}>Regístrate</span>
        </p>
      </motion.div>
    </div>
  );
}
