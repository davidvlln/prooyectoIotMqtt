const { Pool } = require('pg');

const connectionString = "postgresql://postgres.gkutwphomyxksxhvphmw:proyecto_iot@aws-1-us-east-1.pooler.supabase.com:5432/postgres";

const pool = new Pool({
  connectionString,
});

const sql = `
-- =========================
-- USUARIOS
-- =========================
CREATE TABLE IF NOT EXISTS usuarios (
    id_usuario SERIAL PRIMARY KEY,
    correo VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    fecha_creacion TIMESTAMP DEFAULT NOW()
);

-- =========================
-- ZONAS
-- =========================
CREATE TABLE IF NOT EXISTS zonas (
    id_zona SERIAL PRIMARY KEY,
    nombre_zona VARCHAR(50) NOT NULL,
    descripcion VARCHAR(255)
);

-- =========================
-- TIPOS DE SENSORES
-- =========================
CREATE TABLE IF NOT EXISTS tipos_sensores (
    id_tipo_sensor SERIAL PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL,
    unidad_medida VARCHAR(20),
    descripcion VARCHAR(255)
);

-- =========================
-- TIPOS DE ALERTAS
-- =========================
CREATE TABLE IF NOT EXISTS tipos_alertas (
    id_tipo_alerta SERIAL PRIMARY KEY,
    nombre VARCHAR(50),
    mensaje VARCHAR(255),
    prioridad VARCHAR(20)
);

-- =========================
-- NODOS
-- =========================
CREATE TABLE IF NOT EXISTS nodos (
    id_nodo SERIAL PRIMARY KEY,
    nombre_nodo VARCHAR(50),
    id_zona INT REFERENCES zonas(id_zona),
    tipo_nodo VARCHAR(50),
    estado_nodo VARCHAR(20),
    nivel_bateria DECIMAL(5,2),
    voltaje DECIMAL(5,2)
);

-- =========================
-- SENSORES
-- =========================
CREATE TABLE IF NOT EXISTS sensores (
    id_sensor SERIAL PRIMARY KEY,
    id_nodo INT REFERENCES nodos(id_nodo),
    id_tipo_sensor INT REFERENCES tipos_sensores(id_tipo_sensor),
    estado_sensor VARCHAR(20)
);

-- =========================
-- PARÁMETROS ZONAS
-- =========================
CREATE TABLE IF NOT EXISTS parametros_zonas (
    id_parametros_zonas SERIAL PRIMARY KEY,
    id_zona INT REFERENCES zonas(id_zona),
    humedad_suelo_min DECIMAL(5,2),
    humedad_suelo_max DECIMAL(5,2),
    humedad_aire_min DECIMAL(5,2),
    humedad_aire_max DECIMAL(5,2),
    temp_max DECIMAL(5,2),
    temp_min DECIMAL(5,2)
);

-- =========================
-- LECTURAS
-- =========================
CREATE TABLE IF NOT EXISTS lecturas (
    id_lectura BIGSERIAL PRIMARY KEY,
    id_sensor INT REFERENCES sensores(id_sensor),
    valor DECIMAL(10,2),
    fecha_hora TIMESTAMP DEFAULT NOW()
);

-- =========================
-- ALERTAS
-- =========================
CREATE TABLE IF NOT EXISTS alertas (
    id_alerta SERIAL PRIMARY KEY,
    dato_capturado DECIMAL(10,2),
    fecha_hora_alerta TIMESTAMP DEFAULT NOW(),
    fecha_hora_atencion TIMESTAMP,
    id_tipo_alerta INT REFERENCES tipos_alertas(id_tipo_alerta),
    id_zona INT REFERENCES zonas(id_zona),
    estado_alerta VARCHAR(20)
);

-- =========================
-- RIEGOS
-- =========================
CREATE TABLE IF NOT EXISTS riegos (
    id_riego SERIAL PRIMARY KEY,
    estado_riego VARCHAR(20),
    fecha_hora_inicio TIMESTAMP DEFAULT NOW(),
    fecha_hora_fin TIMESTAMP,
    id_zona INT REFERENCES zonas(id_zona)
);
`;

async function initDB() {
  try {
    console.log("Connecting to the database...");
    await pool.query(sql);
    console.log("Tables created successfully!");
  } catch (err) {
    console.error("Error creating tables", err);
  } finally {
    await pool.end();
  }
}

initDB();
