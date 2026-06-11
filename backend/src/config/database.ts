import { Pool } from 'pg';
import dotenv from 'dotenv';

// Forzamos la carga de variables de entorno
dotenv.config();

// Creamos un Pool de conexiones. Esto maneja múltiples consultas en paralelo
// sin abrir y cerrar la conexión con Postgres a cada rato.
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Verificamos que la conexión funcione al arrancar
pool.on('connect', () => {
  console.log('✅ Conectado a la base de datos PostgreSQL');
});

pool.on('error', (err) => {
  console.error('❌ Error inesperado en el pool de PostgreSQL:', err);
  process.exit(-1);
});

export default pool;