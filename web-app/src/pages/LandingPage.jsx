import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Eye, Lock, Wifi, ShieldCheck } from 'lucide-react';

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

        {/* HERO */}
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
