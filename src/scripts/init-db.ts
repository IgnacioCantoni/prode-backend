import pool from '../config/database';

const createTablesQuery = `
  -- 1. Tabla de Usuarios
  CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  );

  -- 6. Tabla de Torneos (con la regla UNIQUE adentro)
  CREATE TABLE IF NOT EXISTS tournaments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    year INT NOT NULL,
    CONSTRAINT unique_tournament UNIQUE (name, year)
  );

  -- 3. Tabla de Equipos
  CREATE TABLE IF NOT EXISTS teams (
    id VARCHAR(10) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    logo_url TEXT
  );

  -- 4. Tabla de Partidos (IDs VARCHAR para aceptar los de la API)
  CREATE TABLE IF NOT EXISTS matches (
    id VARCHAR(50) PRIMARY KEY,
    tournament_id INT REFERENCES tournaments(id),
    home_team_id VARCHAR(10) REFERENCES teams(id),
    away_team_id VARCHAR(10) REFERENCES teams(id),
    date TIMESTAMP WITH TIME ZONE NOT NULL,
    stage VARCHAR(50) DEFAULT 'GROUP',
    status VARCHAR(50) DEFAULT 'SCHEDULED',
    home_score INTEGER,
    away_score INTEGER,
    qualifier VARCHAR(10)
  );

  -- 5. Tabla de Predicciones
  CREATE TABLE IF NOT EXISTS match_predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    match_id VARCHAR(50) REFERENCES matches(id) ON DELETE CASCADE,
    home_score INTEGER NOT NULL,
    away_score INTEGER NOT NULL,
    qualifier_pick VARCHAR(10),
    points_earned INTEGER DEFAULT 0,
    UNIQUE(user_id, match_id)
  );



  -- 7. Tabla de Grupos (con la regla UNIQUE adentro)
  CREATE TABLE IF NOT EXISTS groups (
    id SERIAL PRIMARY KEY,
    name VARCHAR(10) NOT NULL,
    tournament_id INT REFERENCES tournaments(id) ON DELETE CASCADE,
    CONSTRAINT unique_group_tournament UNIQUE (name, tournament_id)
  );

  -- 8. Tabla Pivote: Equipos por Grupo
  CREATE TABLE IF NOT EXISTS group_teams (
    group_id INT REFERENCES groups(id) ON DELETE CASCADE,
    team_id VARCHAR(10) REFERENCES teams(id) ON DELETE CASCADE,
    PRIMARY KEY (group_id, team_id)
 );
`;

const initDb = async () => {
  try {
    console.log('⏳ Creando tablas en la base de datos...');
    await pool.query(createTablesQuery);
    
    // Aseguramos que el torneo base exista
    await pool.query(`
      INSERT INTO tournaments (id, name, year) 
      VALUES (1, 'Mundial 2026', 2026) 
      ON CONFLICT (id) DO NOTHING;
    `);
    
    console.log('✅ Tablas y configuración inicial exitosa.');
  } catch (error) {
    console.error('❌ Error al crear las tablas:', error);
  } finally {
    await pool.end();
  }
};

initDb();