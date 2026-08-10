import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Sphere, MeshDistortMaterial } from '@react-three/drei';
import { Shield, ArrowRight, Lock, Eye, Activity } from 'lucide-react';

const AnimatedSphere = () => {
  const meshRef = useRef();
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.elapsedTime * 0.2;
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.3;
    }
  });

  return (
    <Sphere args={[1, 64, 64]} ref={meshRef} scale={2}>
      <MeshDistortMaterial
        color="#3b82f6"
        attach="material"
        distort={0.4}
        speed={1.5}
        roughness={0.2}
        metalness={0.8}
      />
    </Sphere>
  );
};

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-color)', overflow: 'hidden', position: 'relative' }}>
      {/* Background 3D Canvas */}
      <div style={{ position: 'absolute', top: 0, right: '-10%', width: '60%', height: '100vh', opacity: 0.8, zIndex: 0 }}>
        <Canvas>
          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 10, 5]} intensity={1} />
          <AnimatedSphere />
          <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={0.5} />
        </Canvas>
      </div>

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 1, padding: '2rem 5%', maxWidth: '1400px', margin: '0 auto' }}>
        <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10vh' }}>
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            style={{ display: 'flex', alignItems: 'center', gap: '12px' }}
          >
            <Shield size={32} color="var(--primary)" />
            <h1 style={{ fontSize: '1.8rem', color: 'white', margin: 0 }}>TecnoInnova</h1>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <button className="btn-outline" onClick={() => navigate('/login')} style={{ marginRight: '1rem' }}>Ingresar</button>
            <button className="btn-primary" onClick={() => navigate('/register')}>Registrarse</button>
          </motion.div>
        </nav>

        <main style={{ maxWidth: '600px' }}>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
          >
            <h2 style={{ fontSize: '4.5rem', lineHeight: 1.1, marginBottom: '1.5rem', color: 'white' }}>
              Seguridad <span style={{ color: 'var(--primary)' }}>Inteligente</span> para tu Empresa.
            </h2>
            <p style={{ fontSize: '1.2rem', color: 'var(--text-muted)', marginBottom: '3rem', lineHeight: 1.6 }}>
              Sistema integral de videovigilancia, alarmas y control de acceso.
              Cumple con la normativa del SENIAT y gestiona tus pedidos, facturación y técnicos en una sola plataforma.
            </p>
            
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button className="btn-primary" onClick={() => navigate('/login')} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.1rem', padding: '1rem 2rem' }}>
                Ingresar al Sistema <ArrowRight size={20} />
              </button>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 1 }}
            style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2rem', marginTop: '5rem' }}
          >
            <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'center' }}>
              <Eye size={32} color="var(--primary)" style={{ marginBottom: '1rem' }} />
              <h3 style={{ color: 'white', marginBottom: '0.5rem' }}>Vigilancia 24/7</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Monitoreo continuo de alta definición.</p>
            </div>
            <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'center' }}>
              <Lock size={32} color="var(--secondary)" style={{ marginBottom: '1rem' }} />
              <h3 style={{ color: 'white', marginBottom: '0.5rem' }}>Acceso Seguro</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Control total de instalaciones.</p>
            </div>
            <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'center' }}>
              <Activity size={32} color="var(--accent)" style={{ marginBottom: '1rem' }} />
              <h3 style={{ color: 'white', marginBottom: '0.5rem' }}>Respuesta Rápida</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Alarmas conectadas en tiempo real.</p>
            </div>
          </motion.div>
        </main>
      </div>
    </div>
  );
}
