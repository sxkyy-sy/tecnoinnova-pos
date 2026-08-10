import React, { useState } from 'react';
import { supabase } from '../supabase';
import { motion } from 'framer-motion';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { FileText, Table, Users, Receipt } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Reportes() {
  const [loadingPDF, setLoadingPDF] = useState(false);
  const [loadingXLS, setLoadingXLS] = useState(false);
  const [loadingCSV, setLoadingCSV] = useState(false);
  const [loadingSeniat, setLoadingSeniat] = useState(false);
  
  // 1. CORRECCIÓN PDF (Evitar bloqueo del hilo principal)
  const generarPDFPedidos = async () => {
    setLoadingPDF(true);
    toast.loading('Obteniendo datos para el PDF...', { id: 'pdf' });
    
    try {
      const { data: pedidos, error } = await supabase
        .from('pedidos')
        .select('numero_orden, fecha_pedido, estado, monto_total_bs, clientes(nombre_razon_social)');
      
      if (error) throw error;
      
      if (!pedidos || pedidos.length === 0) {
        toast.error('No hay pedidos para generar el reporte.', { id: 'pdf' });
        return;
      }

      toast.loading('Renderizando PDF...', { id: 'pdf' });
      const doc = new jsPDF();
      doc.text('Reporte Semanal de Pedidos - TecnoInnova S.A.', 14, 15);
      
      const tableData = pedidos.map(p => [
        p.numero_orden || 'N/A', 
        p.fecha_pedido ? new Date(p.fecha_pedido).toLocaleDateString() : 'N/A', 
        p.clientes?.nombre_razon_social || 'Desconocido', 
        p.estado || 'N/A', 
        `Bs. ${p.monto_total_bs || 0}`
      ]);

      autoTable(doc, {
        head: [['Orden', 'Fecha', 'Cliente', 'Estado', 'Monto (Bs)']],
        body: tableData,
        startY: 25,
      });
      
      doc.save('reporte_pedidos.pdf');
      toast.success('PDF generado exitosamente', { id: 'pdf' });
    } catch (error) {
      console.error(error);
      toast.error('Error al generar el PDF: ' + error.message, { id: 'pdf' });
    } finally {
      setLoadingPDF(false);
    }
  };

  // 2. CORRECCIÓN EXCEL INVENTARIO (SheetJS / xlsx)
  const generarXLSInventario = async () => {
    setLoadingXLS(true);
    toast.loading('Obteniendo datos del inventario...', { id: 'xls' });
    
    try {
      const { data, error } = await supabase
        .from('productos')
        .select('codigo_producto, nombre, stock_actual, stock_minimo, precio_unitario_bs, precio_unitario_usd');
      
      if (error) throw error;
      
      if (!data || data.length === 0) {
        toast.error('El inventario está vacío, no hay nada que exportar.', { id: 'xls' });
        return;
      }
      
      toast.loading('Generando hoja de cálculo...', { id: 'xls' });
      
      const mappedData = data.map(item => ({
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
      console.error(error);
      toast.error('Error al generar el Excel: ' + error.message, { id: 'xls' });
    } finally {
      setLoadingXLS(false);
    }
  };

  // Listado de Técnicos (CSV)
  const generarCSVTecnicos = async () => {
    setLoadingCSV(true);
    toast.loading('Generando CSV...', { id: 'csv' });
    try {
      const { data: tecnicos, error } = await supabase.from('usuarios').select('nombre, email, estado').eq('rol', 'tecnico');
      
      if (error) throw error;
      
      if (tecnicos && tecnicos.length > 0) {
        const csvRows = [];
        const headers = Object.keys(tecnicos[0]);
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
      console.error(error);
      toast.error('Error al generar CSV', { id: 'csv' });
    } finally {
      setLoadingCSV(false);
    }
  };

  // 4. NUEVO: Reporte de Facturas SENIAT
  const generarPDFFacturasSENIAT = async () => {
    setLoadingSeniat(true);
    toast.loading('Generando Facturas SENIAT...', { id: 'pdf-seniat' });
    
    try {
      const { data: facturas, error } = await supabase
        .from('facturas')
        .select('numero_factura, numero_control, fecha_emision, tasa_bcv, base_imponible, monto_iva, total_operacion, estado_pago');
      
      if (error) throw error;
      
      if (!facturas || facturas.length === 0) {
        toast.error('No hay facturas para generar el reporte.', { id: 'pdf-seniat' });
        return;
      }

      const doc = new jsPDF('landscape'); // Horizontal para que quepan las columnas
      doc.text('Reporte de Facturación Legal SENIAT - TecnoInnova S.A.', 14, 15);
      
      const tableData = facturas.map(f => [
        f.numero_factura || 'N/A', 
        f.numero_control || 'N/A', 
        f.fecha_emision ? new Date(f.fecha_emision).toLocaleDateString() : 'N/A', 
        `Bs. ${Number(f.base_imponible || 0).toLocaleString('es-VE')}`,
        `Bs. ${Number(f.monto_iva || 0).toLocaleString('es-VE')}`,
        `Bs. ${Number(f.total_operacion || 0).toLocaleString('es-VE')}`,
        (f.estado_pago || 'N/A').toUpperCase()
      ]);

      autoTable(doc, {
        head: [['Nro. Factura', 'Nro. Control SENIAT', 'Fecha', 'Base Imponible (Bs)', 'IVA 16% (Bs)', 'Total Operación (Bs)', 'Estado']],
        body: tableData,
        startY: 25,
        styles: { fontSize: 9 },
        headStyles: { fillColor: [139, 92, 246] }
      });
      
      doc.save('facturas_seniat_tecnoinnova.pdf');
      toast.success('Reporte SENIAT generado', { id: 'pdf-seniat' });
    } catch (error) {
      console.error(error);
      toast.error('Error al generar el PDF: ' + error.message, { id: 'pdf-seniat' });
    } finally {
      setLoadingSeniat(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <h2 style={{ color: 'white', marginBottom: '1.5rem' }}>Generación de Reportes</h2>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
        
        <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center' }}>
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
            <FileText size={32} color="#ef4444" />
          </div>
          <h3 style={{ color: 'white', marginBottom: '0.5rem' }}>Reporte de Pedidos</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>Formato PDF. Ideal para revisión gerencial semanal.</p>
          <button className="btn-primary" disabled={loadingPDF} onClick={generarPDFPedidos}>
            {loadingPDF ? 'Generando...' : 'Descargar PDF'}
          </button>
        </div>

        <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center' }}>
          <div style={{ background: 'rgba(16, 185, 129, 0.1)', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
            <Table size={32} color="#10b981" />
          </div>
          <h3 style={{ color: 'white', marginBottom: '0.5rem' }}>Inventario Completo</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>Formato Excel (.xls). Para análisis de stock.</p>
          <button className="btn-primary" disabled={loadingXLS} onClick={generarXLSInventario}>
            {loadingXLS ? 'Generando...' : 'Descargar Excel'}
          </button>
        </div>

        <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center' }}>
          <div style={{ background: 'rgba(59, 130, 246, 0.1)', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
            <Users size={32} color="#3b82f6" />
          </div>
          <h3 style={{ color: 'white', marginBottom: '0.5rem' }}>Nómina de Técnicos</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>Formato CSV. Exportable a sistemas de RRHH.</p>
          <button className="btn-primary" disabled={loadingCSV} onClick={generarCSVTecnicos}>
            {loadingCSV ? 'Generando...' : 'Descargar CSV'}
          </button>
        </div>

        <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center' }}>
          <div style={{ background: 'rgba(139, 92, 246, 0.1)', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
            <Receipt size={32} color="#8b5cf6" />
          </div>
          <h3 style={{ color: 'white', marginBottom: '0.5rem' }}>Facturación Legal SENIAT</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>Formato PDF. Incluye Nro. de Control fiscal, Base Imponible e IVA 16%.</p>
          <button className="btn-primary" disabled={loadingSeniat} onClick={generarPDFFacturasSENIAT}>
            {loadingSeniat ? 'Generando...' : 'Descargar Facturas PDF'}
          </button>
        </div>

      </div>
    </motion.div>
  );
}
