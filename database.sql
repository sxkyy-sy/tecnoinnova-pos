-- ==============================================================================
-- Base de Datos: TecnoInnova S.A.
-- RDBMS: PostgreSQL (Para Supabase)
-- NOTA: Estructura adaptada a las leyes venezolanas (Providencia Administrativa SNAT/2011/0071 - SENIAT)
-- ==============================================================================

-- 1. Crear tabla de Usuarios (Empleados)
CREATE TABLE IF NOT EXISTS usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    rol VARCHAR(50) NOT NULL CHECK (rol IN ('admin', 'ventas', 'tecnico', 'logistica', 'operaciones', 'facturacion')),
    estado VARCHAR(20) DEFAULT 'activo',
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Crear tabla de Clientes (Adaptado para RIF/Cédula en Venezuela)
CREATE TABLE IF NOT EXISTS clientes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre_razon_social VARCHAR(150) NOT NULL,
    rif_ci VARCHAR(20) UNIQUE NOT NULL, -- Formato: J-12345678-9, V-12345678, E-12345678
    telefono VARCHAR(20),
    email VARCHAR(100) UNIQUE,
    direccion_fiscal TEXT NOT NULL,
    contribuyente_especial BOOLEAN DEFAULT FALSE, -- Retenciones de IVA (Providencia 0049)
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Crear tabla de Productos (Inventario)
CREATE TABLE IF NOT EXISTS productos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo_producto VARCHAR(50) UNIQUE NOT NULL,
    nombre VARCHAR(150) NOT NULL,
    descripcion TEXT,
    exento_iva BOOLEAN DEFAULT FALSE, -- Para artículos exonerados según la ley de IVA
    precio_unitario_bs DECIMAL(15, 2) NOT NULL, -- Precio base en Bolívares
    precio_unitario_usd DECIMAL(15, 2) NOT NULL, -- Referencia en Divisas
    stock_actual INT NOT NULL DEFAULT 0,
    stock_minimo INT NOT NULL DEFAULT 5,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Crear tabla de Pedidos (Cotizaciones/Órdenes)
CREATE TABLE IF NOT EXISTS pedidos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numero_orden SERIAL UNIQUE,
    cliente_id UUID REFERENCES clientes(id) ON DELETE CASCADE,
    usuario_ventas_id UUID REFERENCES usuarios(id),
    fecha_pedido TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    estado VARCHAR(50) DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'aprobado', 'rechazado', 'completado')),
    monto_total_bs DECIMAL(15, 2) DEFAULT 0,
    observaciones TEXT
);

-- 5. Crear tabla de Detalle de Pedidos
CREATE TABLE IF NOT EXISTS detalle_pedidos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pedido_id UUID REFERENCES pedidos(id) ON DELETE CASCADE,
    producto_id UUID REFERENCES productos(id),
    cantidad INT NOT NULL CHECK (cantidad > 0),
    precio_unitario_bs DECIMAL(15, 2) NOT NULL,
    alicuota_iva DECIMAL(5,2) DEFAULT 16.00, -- 16% IVA General
    subtotal_bs DECIMAL(15, 2) GENERATED ALWAYS AS (cantidad * precio_unitario_bs) STORED
);

-- 6. Crear tabla de Instalaciones
CREATE TABLE IF NOT EXISTS instalaciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pedido_id UUID REFERENCES pedidos(id) ON DELETE CASCADE,
    tecnico_id UUID REFERENCES usuarios(id),
    fecha_programada TIMESTAMP NOT NULL,
    direccion_instalacion TEXT NOT NULL,
    estado VARCHAR(50) DEFAULT 'programada' CHECK (estado IN ('programada', 'en curso', 'finalizada', 'cancelada')),
    reporte_tecnico TEXT,
    firma_cliente BOOLEAN DEFAULT FALSE
);

-- 7. Crear tabla de Facturas (Cumplimiento SENIAT)
CREATE TABLE IF NOT EXISTS facturas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pedido_id UUID REFERENCES pedidos(id) ON DELETE CASCADE,
    instalacion_id UUID REFERENCES instalaciones(id),
    numero_factura VARCHAR(20) UNIQUE NOT NULL, -- Asignado por el sistema (Facturación Libre o Máquina Fiscal)
    numero_control VARCHAR(20) UNIQUE NOT NULL, -- Nro de Control Pre-impreso SENIAT
    fecha_emision TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    tasa_bcv DECIMAL(15, 4) NOT NULL, -- Tasa del BCV al momento de emitir la factura (Art. 91 Ley BCV)
    base_imponible DECIMAL(15, 2) NOT NULL,
    monto_iva DECIMAL(15, 2) NOT NULL, -- Normalmente 16%
    monto_igtf DECIMAL(15, 2) DEFAULT 0, -- 3% si paga en divisas (Ley de IGTF)
    total_operacion DECIMAL(15, 2) NOT NULL,
    retencion_iva DECIMAL(15, 2) DEFAULT 0, -- Si el cliente es contribuyente especial (75% o 100%)
    estado_pago VARCHAR(50) DEFAULT 'pendiente' CHECK (estado_pago IN ('pendiente', 'pagado', 'anulada'))
);

-- 8. Crear tabla de Seguimiento Postventa
CREATE TABLE IF NOT EXISTS seguimiento_postventa (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cliente_id UUID REFERENCES clientes(id) ON DELETE CASCADE,
    instalacion_id UUID REFERENCES instalaciones(id),
    fecha_contacto TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    nivel_satisfaccion INT CHECK (nivel_satisfaccion BETWEEN 1 AND 5),
    comentarios TEXT,
    estado_resolucion VARCHAR(50) DEFAULT 'cerrado'
);

-- ==============================================================================
-- INSERTAR DATOS DE PRUEBA (15 registros por tabla) - Adaptado a Venezuela
-- ==============================================================================

-- Insertar 15 Usuarios
INSERT INTO usuarios (nombre, email, rol, estado) VALUES
('Juan Pérez', 'juan.admin@tecnoinnova.com.ve', 'admin', 'activo'),
('María López', 'maria.ventas@tecnoinnova.com.ve', 'ventas', 'activo'),
('Carlos Ruiz', 'carlos.ventas@tecnoinnova.com.ve', 'ventas', 'activo'),
('Ana Torres', 'ana.logistica@tecnoinnova.com.ve', 'logistica', 'activo'),
('Luis Gómez', 'luis.operaciones@tecnoinnova.com.ve', 'operaciones', 'activo'),
('Laura Díaz', 'laura.facturacion@tecnoinnova.com.ve', 'facturacion', 'activo'),
('Pedro Sánchez', 'pedro.tecnico1@tecnoinnova.com.ve', 'tecnico', 'activo'),
('Jorge Marín', 'jorge.tecnico2@tecnoinnova.com.ve', 'tecnico', 'activo'),
('Miguel Rojas', 'miguel.tecnico3@tecnoinnova.com.ve', 'tecnico', 'activo'),
('Sofía Castro', 'sofia.tecnico4@tecnoinnova.com.ve', 'tecnico', 'activo'),
('Diego Vega', 'diego.tecnico5@tecnoinnova.com.ve', 'tecnico', 'activo'),
('Elena Gil', 'elena.tecnico6@tecnoinnova.com.ve', 'tecnico', 'activo'),
('Raúl Blanco', 'raul.tecnico7@tecnoinnova.com.ve', 'tecnico', 'activo'),
('Carmen Ortiz', 'carmen.tecnico8@tecnoinnova.com.ve', 'tecnico', 'inactivo'),
('Roberto Cruz', 'roberto.tecnico9@tecnoinnova.com.ve', 'tecnico', 'activo');

-- Insertar 15 Clientes
INSERT INTO clientes (nombre_razon_social, rif_ci, telefono, email, direccion_fiscal, contribuyente_especial) VALUES
('Inversiones Alpha C.A.', 'J-12345678-0', '+58 414-1111111', 'contacto@alpha.com.ve', 'Av. Francisco de Miranda, Torre Alpha, Chacao, Caracas', true),
('Constructora Beta C.A.', 'J-23456789-1', '+58 412-2222222', 'gerencia@beta.com.ve', 'Zona Industrial Carabobo, Valencia, Edo. Carabobo', false),
('Comercializadora Gamma S.A.', 'J-34567890-2', '+58 424-3333333', 'ventas@gamma.com.ve', 'CC Sambil, Local 5, Barquisimeto, Edo. Lara', true),
('Clínica Metropolitana', 'J-45678901-3', '+58 416-4444444', 'admin@clinicam.com.ve', 'Urb. Caurimare, Caracas', true),
('Hotel Los Pinos C.A.', 'J-56789012-4', '+58 414-5555555', 'reservas@hotelpinos.com.ve', 'Calle El Sol, Zona Turística, Margarita', false),
('Colegio San Ignacio', 'J-67890123-5', '+58 412-6666666', 'direccion@sanignacio.edu.ve', 'La Castellana, Caracas', false),
('Supermercado Excelsior', 'J-78901234-6', '+58 424-7777777', 'compras@excelsior.com.ve', 'Los Palos Grandes, Caracas', true),
('Farmatodo C.A.', 'J-89012345-7', '+58 416-8888888', 'info@farmatodo.com.ve', 'Boleita Norte, Caracas', true),
('Restaurante El Alazán', 'J-90123456-8', '+58 414-9999999', 'admin@alazan.com.ve', 'Altamira, Caracas', false),
('Seguros Mercantil C.A.', 'J-01234567-9', '+58 412-0000000', 'atencion@seguros.com.ve', 'Av. Andrés Bello, Edif. Mercantil, Caracas', true),
('Roberto Gómez', 'V-10222333', '+58 424-1010101', 'rgomez@email.com', 'Urb. Los Pinos, Casa 4, Maracay', false),
('María Rodríguez', 'V-11444555', '+58 416-2020202', 'mrodriguez@email.com', 'Residencias El Ávila, Apto 5B, Caracas', false),
('Carlos Fernández', 'V-12666777', '+58 414-3030303', 'cfernandez@email.com', 'Calle Las Flores, Nro 8, Valencia', false),
('Ana Silva', 'V-13888999', '+58 412-4040404', 'asilva@email.com', 'Av. Los Próceres, Edif. Girasol, Mérida', false),
('Luis Martínez', 'V-14000111', '+58 424-5050505', 'lmartinez@email.com', 'Conjunto Residencial La Roca, Casa 12, Puerto Ordaz', false);

-- Insertar 15 Productos (Precios referenciales a 750 Bs/USD)
INSERT INTO productos (codigo_producto, nombre, descripcion, exento_iva, precio_unitario_usd, precio_unitario_bs, stock_actual, stock_minimo) VALUES
('CAM-001', 'Cámara IP Domo 2MP', 'Cámara interior 1080p', false, 45.00, 33750.00, 50, 10),
('CAM-002', 'Cámara Bala Exterior 4MP', 'Cámara IP67', false, 75.00, 56250.00, 30, 5),
('CAM-003', 'Cámara PTZ 360', 'Cámara rotativa zoom 10x', false, 250.00, 187500.00, 15, 3),
('DVR-001', 'DVR 8 Canales HD', 'Grabador digital 8ch', false, 120.00, 90000.00, 20, 4),
('NVR-001', 'NVR 16 Canales PoE', 'Grabador red PoE', false, 280.00, 210000.00, 10, 2),
('HDD-1TB', 'Disco Duro 1TB', 'Disco optimizado videovigilancia', false, 65.00, 48750.00, 40, 10),
('HDD-4TB', 'Disco Duro 4TB', 'Alta capacidad', false, 140.00, 105000.00, 25, 5),
('SEN-001', 'Sensor Movimiento PIR', 'Detector infrarrojo', false, 22.00, 16500.00, 80, 20),
('MAG-001', 'Contacto Magnético', 'Puertas y ventanas', false, 8.50, 6375.00, 150, 30),
('SIR-001', 'Sirena Exterior 120dB', 'Con luz estroboscópica', false, 35.00, 26250.00, 25, 5),
('ALA-001', 'Panel Alarma GSM', 'Central conexión celular', false, 150.00, 112500.00, 18, 4),
('CAB-UTP', 'Bobina UTP Cat6 305m', 'Cable de red', false, 110.00, 82500.00, 12, 3),
('FUE-12V', 'Fuente de Poder 12V 10A', 'Caja de alimentación', false, 45.00, 33750.00, 30, 5),
('UPS-1KV', 'UPS 1000VA', 'Respaldo batería', false, 95.00, 71250.00, 20, 5),
('MON-24', 'Monitor LED 24"', 'Visualización de cámaras', false, 130.00, 97500.00, 15, 3);

-- Insertar 15 Pedidos
INSERT INTO pedidos (cliente_id, usuario_ventas_id, estado, monto_total_bs)
SELECT 
    (SELECT id FROM clientes ORDER BY random() LIMIT 1),
    (SELECT id FROM usuarios WHERE rol = 'ventas' ORDER BY random() LIMIT 1),
    'aprobado', 
    floor(random() * (100000 - 10000 + 1) + 10000)
FROM generate_series(1, 15);

-- Insertar Detalles de Pedidos
INSERT INTO detalle_pedidos (pedido_id, producto_id, cantidad, precio_unitario_bs)
SELECT 
    (SELECT id FROM pedidos ORDER BY random() LIMIT 1),
    p.id,
    floor(random() * 5 + 1),
    p.precio_unitario_bs
FROM (SELECT id, precio_unitario_bs FROM productos ORDER BY random() LIMIT 15) p;

-- Insertar 15 Instalaciones
INSERT INTO instalaciones (pedido_id, tecnico_id, fecha_programada, direccion_instalacion, estado, reporte_tecnico, firma_cliente)
SELECT 
    p.id,
    (SELECT id FROM usuarios WHERE rol = 'tecnico' ORDER BY random() LIMIT 1),
    CURRENT_TIMESTAMP + (random() * (interval '30 days')),
    'Dirección de instalación estándar de prueba en Venezuela',
    CASE 
        WHEN random() < 0.25 THEN 'programada'
        WHEN random() < 0.50 THEN 'en curso'
        WHEN random() < 0.75 THEN 'finalizada'
        ELSE 'cancelada'
    END,
    'Reporte sin novedades, equipo operativo',
    TRUE
FROM (SELECT id FROM pedidos ORDER BY random() LIMIT 15) p;

-- Insertar 15 Facturas (Simulando Números de Control SENIAT)
INSERT INTO facturas (pedido_id, instalacion_id, numero_factura, numero_control, tasa_bcv, base_imponible, monto_iva, monto_igtf, total_operacion, retencion_iva, estado_pago)
SELECT 
    p.id,
    (SELECT id FROM instalaciones WHERE pedido_id = p.id LIMIT 1),
    lpad(cast(floor(random() * 999999) as text), 8, '0'), -- Ejemplo: 00123456
    '00-' || lpad(cast(floor(random() * 99999999) as text), 8, '0'), -- Ejemplo: 00-00123456
    750.0000, -- Tasa BCV 750 Bs/USD
    p.monto_total_bs / 1.16,
    (p.monto_total_bs / 1.16) * 0.16,
    0, -- Sin IGTF por defecto
    p.monto_total_bs,
    0, -- Sin retención por defecto
    CASE 
        WHEN random() < 0.33 THEN 'pendiente'
        WHEN random() < 0.66 THEN 'pagado'
        ELSE 'anulada'
    END
FROM (SELECT id, monto_total_bs FROM pedidos ORDER BY random() LIMIT 15) p;

-- Insertar 15 Seguimientos Postventa
INSERT INTO seguimiento_postventa (cliente_id, instalacion_id, nivel_satisfaccion, comentarios, estado_resolucion)
SELECT 
    (SELECT id FROM clientes ORDER BY random() LIMIT 1),
    i.id,
    floor(random() * 5 + 1),
    'El servicio cumplió con las expectativas, equipos funcionando.',
    'cerrado'
FROM (SELECT id FROM instalaciones WHERE estado = 'finalizada' ORDER BY random() LIMIT 15) i;

-- Rellenar faltantes de seguimiento
INSERT INTO seguimiento_postventa (cliente_id, instalacion_id, nivel_satisfaccion, comentarios, estado_resolucion)
SELECT 
    (SELECT id FROM clientes ORDER BY random() LIMIT 1),
    (SELECT id FROM instalaciones ORDER BY random() LIMIT 1),
    4,
    'Todo perfecto.',
    'cerrado'
FROM generate_series(1, 5) ON CONFLICT DO NOTHING;
