import React, { useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Float, RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { ArrowRight, Eye, Lock, Wifi, ShieldCheck } from 'lucide-react';

/* ───────────────────────────────────────────
   3D PADLOCK (CANDADO)
   ─────────────────────────────────────────── */

// Shackle — the U-shaped metal arc on top
function Shackle() {
  const shackleRef = useRef();

  // Create the U-shape path for a tube
  const shacklePath = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.45, 0.05, 0),
      new THREE.Vector3(-0.45, 0.65, 0),
      new THREE.Vector3(-0.35, 1.0, 0),
      new THREE.Vector3(0, 1.15, 0),
      new THREE.Vector3(0.35, 1.0, 0),
      new THREE.Vector3(0.45, 0.65, 0),
      new THREE.Vector3(0.45, 0.05, 0),
    ]);
    return curve;
  }, []);

  useFrame((state) => {
    if (shackleRef.current) {
      // Subtle breathing glow
      shackleRef.current.material.emissiveIntensity = 0.3 + Math.sin(state.clock.elapsedTime * 2) * 0.1;
    }
  });

  return (
    <mesh ref={shackleRef} position={[0, 0.55, 0]}>
      <tubeGeometry args={[shacklePath, 40, 0.08, 16, false]} />
      <meshStandardMaterial
        color="#a8c8f0"
        emissive="#3b82f6"
        emissiveIntensity={0.3}
        metalness={0.95}
        roughness={0.08}
      />
    </mesh>
  );
}

// Padlock body
function PadlockBody() {
  return (
    <group>
      {/* Main body */}
      <RoundedBox args={[1.2, 1.0, 0.5]} radius={0.08} smoothness={4} position={[0, 0, 0]}>
        <meshStandardMaterial
          color="#1e3a8a"
          emissive="#2563eb"
          emissiveIntensity={0.25}
          metalness={0.85}
          roughness={0.15}
        />
      </RoundedBox>

      {/* Subtle front face panel (inset look) */}
      <RoundedBox args={[1.0, 0.8, 0.02]} radius={0.04} smoothness={4} position={[0, 0, 0.26]}>
        <meshStandardMaterial
          color="#1e40af"
          emissive="#3b82f6"
          emissiveIntensity={0.15}
          metalness={0.9}
          roughness={0.1}
        />
      </RoundedBox>
    </group>
  );
}

// Keyhole — circle + slot
function Keyhole() {
  const glowRef = useRef();

  useFrame((state) => {
    if (glowRef.current) {
      glowRef.current.material.emissiveIntensity = 0.6 + Math.sin(state.clock.elapsedTime * 1.5) * 0.3;
    }
  });

  return (
    <group position={[0, 0.08, 0.28]}>
      {/* Keyhole circle */}
      <mesh>
        <circleGeometry args={[0.12, 32]} />
        <meshStandardMaterial color="#0a0a14" metalness={0.5} roughness={0.3} />
      </mesh>
      {/* Keyhole slot below circle */}
      <mesh position={[0, -0.15, 0]}>
        <planeGeometry args={[0.08, 0.18]} />
        <meshStandardMaterial color="#0a0a14" metalness={0.5} roughness={0.3} />
      </mesh>
      {/* Blue glow ring around keyhole */}
      <mesh ref={glowRef}>
        <ringGeometry args={[0.12, 0.17, 32]} />
        <meshStandardMaterial
          color="#60a5fa"
          emissive="#3b82f6"
          emissiveIntensity={0.6}
          transparent
          opacity={0.8}
        />
      </mesh>
    </group>
  );
}

// Orbital rings
function OrbitalRings() {
  const ring1Ref = useRef();
  const ring2Ref = useRef();
  const ring3Ref = useRef();

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (ring1Ref.current) ring1Ref.current.rotation.z = t * 0.3;
    if (ring2Ref.current) ring2Ref.current.rotation.z = -t * 0.2;
    if (ring3Ref.current) ring3Ref.current.rotation.y = t * 0.15;
  });

  return (
    <>
      <mesh ref={ring1Ref} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.8, 0.012, 16, 100]} />
        <meshBasicMaterial color="#3b82f6" transparent opacity={0.4} />
      </mesh>
      <mesh ref={ring2Ref} rotation={[Math.PI / 2.5, 0.4, 0]}>
        <torusGeometry args={[2.1, 0.008, 16, 100]} />
        <meshBasicMaterial color="#60a5fa" transparent opacity={0.25} />
      </mesh>
      <mesh ref={ring3Ref} rotation={[Math.PI / 3, -0.3, 0]}>
        <torusGeometry args={[2.4, 0.006, 16, 100]} />
        <meshBasicMaterial color="#93c5fd" transparent opacity={0.15} />
      </mesh>
    </>
  );
}

// Particles
function Particles() {
  const particlesRef = useRef();
  const count = 50;

  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 1.5 + Math.random() * 1.8;
      pos[i * 3] = Math.cos(angle) * radius;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 2.5;
      pos[i * 3 + 2] = Math.sin(angle) * radius;
    }
    return pos;
  }, []);

  useFrame((state) => {
    if (particlesRef.current) {
      particlesRef.current.rotation.y = state.clock.elapsedTime * 0.04;
    }
  });

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.035} color="#60a5fa" transparent opacity={0.6} sizeAttenuation />
    </points>
  );
}

// Complete 3D Padlock Scene
function PadlockScene() {
  const groupRef = useRef();

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.25) * 0.08;
    }
  });

  return (
    <Float speed={1.2} rotationIntensity={0.08} floatIntensity={0.4}>
      <group ref={groupRef} scale={1.6}>
        <PadlockBody />
        <Shackle />
        <Keyhole />
        <OrbitalRings />
        <Particles />
      </group>
    </Float>
  );
}

/* ───────────────────────────────────────────
   FEATURE CARD
   ─────────────────────────────────────────── */
const FeatureCard = ({ icon: Icon, iconColor, title, description, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 25 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
    whileHover={{ y: -4, transition: { duration: 0.25 } }}
    style={{
      padding: '1.6rem 1.5rem',
      background: 'rgba(8, 12, 24, 0.7)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      border: '1px solid rgba(59, 130, 246, 0.12)',
      borderRadius: '16px',
      position: 'relative',
      overflow: 'hidden',
      cursor: 'default',
      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04), 0 4px 24px rgba(0,0,0,0.4)',
    }}
  >
    <div style={{
      position: 'absolute', top: '-20px', right: '-20px',
      width: '90px', height: '90px',
      background: `radial-gradient(circle, ${iconColor}18 0%, transparent 70%)`,
      pointerEvents: 'none',
    }} />
    <div style={{
      width: '40px', height: '40px', borderRadius: '10px',
      background: `${iconColor}12`,
      border: `1px solid ${iconColor}25`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      marginBottom: '1rem',
    }}>
      <Icon size={20} color={iconColor} strokeWidth={1.5} />
    </div>
    <h3 style={{ color: 'white', fontSize: '1.05rem', marginBottom: '0.4rem', fontWeight: 600 }}>{title}</h3>
    <p style={{ color: '#7a8599', fontSize: '0.88rem', lineHeight: 1.6, margin: 0 }}>{description}</p>
  </motion.div>
);

/* ───────────────────────────────────────────
   LANDING PAGE
   ─────────────────────────────────────────── */
export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '100vh', background: '#050510', overflow: 'hidden', position: 'relative' }}>

      {/* ── Background Video ── */}
      <video
        autoPlay loop muted playsInline
        style={{
          position: 'fixed', top: 0, left: 0,
          width: '100vw', height: '100vh',
          objectFit: 'cover', zIndex: 0,
          filter: 'brightness(0.9)',
          pointerEvents: 'none',
        }}
      >
        <source src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260212_043536_e0d3c69f-5c0c-4533-8395-fbe962587446.mp4" type="video/mp4" />
      </video>

      {/* Dark overlay */}
      <div style={{
        position: 'fixed', top: 0, left: 0,
        width: '100vw', height: '100vh',
        background: 'linear-gradient(180deg, rgba(5,5,16,0.55) 0%, rgba(5,5,16,0.75) 100%)',
        zIndex: 1, pointerEvents: 'none',
      }} />

      {/* 3D Canvas */}
      <div style={{
        position: 'absolute', top: '0', right: '-5%',
        width: '55%', height: '100vh',
        zIndex: 5,
      }}>
        <Canvas camera={{ position: [0, 0.3, 4.5], fov: 45 }} dpr={[1, 2]}>
          <ambientLight intensity={0.3} color="#dbeafe" />
          <directionalLight position={[5, 5, 5]} intensity={2} color="#dbeafe" />
          <pointLight position={[-3, -2, 3]} intensity={0.8} color="#3b82f6" />
          <pointLight position={[2, 3, -2]} intensity={0.4} color="#60a5fa" />
          <PadlockScene />
          <OrbitControls
            enableZoom={false}
            enablePan={false}
            autoRotate
            autoRotateSpeed={0.5}
            rotateSpeed={0.8}
          />
        </Canvas>
      </div>

      {/* ── Content ── */}
      <div style={{ position: 'relative', zIndex: 10, minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '2rem 5%', maxWidth: '1440px', margin: '0 auto' }}>

        {/* NAV */}
        <motion.nav
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '1rem 1.5rem',
            background: 'rgba(8, 12, 24, 0.5)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '16px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ShieldCheck size={26} color="#3b82f6" strokeWidth={1.8} />
            <span style={{ fontSize: '1.3rem', fontWeight: 700, color: '#ffffff', letterSpacing: '-0.5px' }}>
              TecnoInnova
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <button
              onClick={() => navigate('/login')}
              style={{
                background: 'none', border: 'none', color: '#94a3b8',
                fontSize: '0.9rem', cursor: 'pointer', padding: '0.5rem 1rem',
                fontFamily: 'var(--font-body)', fontWeight: 500,
                transition: 'color 0.3s',
              }}
              onMouseEnter={e => e.target.style.color = '#ffffff'}
              onMouseLeave={e => e.target.style.color = '#94a3b8'}
            >
              Iniciar Sesión
            </button>
            <button
              onClick={() => navigate('/register')}
              style={{
                background: 'linear-gradient(135deg, #2563eb, #3b82f6)',
                border: '1px solid rgba(255,255,255,0.12)',
                color: '#ffffff', fontSize: '0.9rem', fontWeight: 600,
                padding: '0.6rem 1.6rem', borderRadius: '100px',
                cursor: 'pointer', fontFamily: 'var(--font-heading)',
                boxShadow: '0 4px 16px rgba(37,99,235,0.3)',
                transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
              onMouseEnter={e => { e.target.style.transform = 'translateY(-2px)'; e.target.style.boxShadow = '0 6px 24px rgba(37,99,235,0.5)'; }}
              onMouseLeave={e => { e.target.style.transform = 'translateY(0)'; e.target.style.boxShadow = '0 4px 16px rgba(37,99,235,0.3)'; }}
            >
              Crear Cuenta
            </button>
          </div>
        </motion.nav>

        {/* HERO — left side only */}
        <motion.div
          initial={{ opacity: 0, y: 35 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          style={{ maxWidth: '520px', marginTop: '-4rem' }}
        >
          {/* Pill */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            padding: '5px 14px', marginBottom: '1.5rem',
            background: 'rgba(59,130,246,0.1)',
            border: '1px solid rgba(59,130,246,0.2)',
            borderRadius: '100px',
          }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#3b82f6', boxShadow: '0 0 8px #3b82f6' }} />
            <span style={{ color: '#60a5fa', fontSize: '0.78rem', fontWeight: 600, letterSpacing: '0.8px', textTransform: 'uppercase' }}>
              Plataforma Activa
            </span>
          </div>

          <h2 style={{
            fontSize: 'clamp(2.4rem, 4.5vw, 3.8rem)',
            lineHeight: 1.1, marginBottom: '1.5rem',
            color: '#ffffff', fontWeight: 700,
            letterSpacing: '-1px',
          }}>
            Seguridad{' '}
            <span style={{
              background: 'linear-gradient(135deg, #3b82f6, #93c5fd)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              Inteligente
            </span>
            <br />para tu Empresa.
          </h2>

          <p style={{
            fontSize: '1.05rem', color: '#8b96a5',
            marginBottom: '2rem', lineHeight: 1.7,
            maxWidth: '420px',
          }}>
            Videovigilancia HD, control de acceso biométrico y facturación SENIAT.
            Todo en una sola plataforma de gestión.
          </p>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', flexWrap: 'wrap' }}>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate('/login')}
              style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                background: 'linear-gradient(135deg, #2563eb, #3b82f6)',
                border: '1px solid rgba(255,255,255,0.15)',
                color: '#fff', fontSize: '1rem', fontWeight: 600,
                padding: '0.9rem 2rem', borderRadius: '100px',
                cursor: 'pointer', fontFamily: 'var(--font-heading)',
                boxShadow: '0 4px 20px rgba(37,99,235,0.4), inset 0 1px 0 rgba(255,255,255,0.12)',
              }}
            >
              Ingresar al Sistema
              <div style={{
                width: '26px', height: '26px', borderRadius: '50%',
                background: 'rgba(255,255,255,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <ArrowRight size={14} />
              </div>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate('/register')}
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#e2e8f0', fontSize: '1rem', fontWeight: 500,
                padding: '0.9rem 1.8rem', borderRadius: '100px',
                cursor: 'pointer', fontFamily: 'var(--font-heading)',
              }}
            >
              Registrarse
            </motion.button>
          </div>
        </motion.div>

        {/* FEATURE CARDS — bottom bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '1rem',
            paddingBottom: '1.5rem',
          }}
        >
          <FeatureCard
            icon={Eye}
            iconColor="#3b82f6"
            title="Vigilancia 24/7"
            description="Monitoreo HD con detección inteligente de amenazas en tiempo real."
            delay={0.5}
          />
          <FeatureCard
            icon={Lock}
            iconColor="#60a5fa"
            title="Control de Acceso"
            description="Sistemas biométricos y restricción de áreas corporativas sensibles."
            delay={0.65}
          />
          <FeatureCard
            icon={Wifi}
            iconColor="#93c5fd"
            title="Respuesta Inmediata"
            description="Alarmas interconectadas con despliegue automático en milisegundos."
            delay={0.8}
          />
        </motion.div>
      </div>
    </div>
  );
}
