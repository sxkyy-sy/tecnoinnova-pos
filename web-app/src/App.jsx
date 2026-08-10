import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Layout
import MainLayout from './layouts/MainLayout';

// Pages
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import Pedidos from './pages/Pedidos';
import Inventario from './pages/Inventario';
import Instalaciones from './pages/Instalaciones';
import Reportes from './pages/Reportes';
import Empleados from './pages/Empleados';
import Clientes from './pages/Clientes';

function App() {
  return (
    <Router>
      <Toaster position="top-right" toastOptions={{ className: 'glass-panel', style: { background: '#151b2b', color: '#f1f5f9' } }} />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Rutas con Layout Principal */}
        <Route element={<MainLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/clientes" element={<Clientes />} />
          <Route path="/pedidos" element={<Pedidos />} />
          <Route path="/inventario" element={<Inventario />} />
          <Route path="/instalaciones" element={<Instalaciones />} />
          <Route path="/reportes" element={<Reportes />} />
          <Route path="/empleados" element={<Empleados />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
