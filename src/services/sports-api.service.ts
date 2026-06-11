import axios from 'axios';
import pool from '../config/database';
import { teamMap } from '../utils/team-map';

const API_KEY = process.env.SPORTS_API_KEY;
const API_URL = 'https://api.football-data.org/v4';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: { 'X-Auth-Token': API_KEY }
});

const COMPETITION_ID = 'WC';

export const syncLiveScores = async () => {
  try {
    const response = await apiClient.get(`/competitions/${COMPETITION_ID}/matches`, {
      params: { status: 'IN_PLAY' }
    });
    
    for (const m of response.data.matches) {
      await pool.query(`
        UPDATE matches 
        SET home_score = $1, away_score = $2, status = $3
        WHERE id = $4;
      `, [m.score.fullTime.home, m.score.fullTime.away, 'IN_PLAY', m.id.toString()]);
    }
  } catch (error) {
    console.error('Error en syncLiveScores:', error);
  }
};
/**
 * Sincroniza los equipos usando SQL puro y el mapeo de IDs
 */
export const syncTeams = async () => {
  try {
    console.log('Sincronizando equipos desde football-data...');
    const response = await apiClient.get(`/competitions/${COMPETITION_ID}/teams`);
    
    for (const team of response.data.teams) {
      const internalId = teamMap[team.id] || team.id.toString();
      
      const query = `
        INSERT INTO teams (id, name, logo_url)
        VALUES ($1, $2, $3)
        ON CONFLICT (id) DO UPDATE 
        SET name = EXCLUDED.name, logo_url = EXCLUDED.logo_url;
      `;
      await pool.query(query, [internalId, team.name, team.crest]);
    }
    console.log('✅ Equipos sincronizados correctamente.');
  } catch (error) {
    console.error('Error al sincronizar equipos:', error);
  }
};

// Función auxiliar para procesar y vincular grupos
const processGroupInfo = async (matchData: any, homeTeamId: string, awayTeamId: string) => {
  // 1. Filtramos: Solo nos importan los partidos de fase de grupos
  // En la API de football-data suele venir como "GROUP_STAGE" y el grupo como "GROUP A"
  if (matchData.stage !== 'GROUP_STAGE' || !matchData.group) return;

  // Limpiamos el texto para que en la DB guarde "A" en lugar de "GROUP A"
  const groupName = matchData.group.replace('GROUP ', '').trim();

  // 2. Insertamos o recuperamos el Torneo (Asumimos Mundial 2026 para este ejemplo)
  let tournamentId;
  const tRes = await pool.query(
    "INSERT INTO tournaments (name, year) VALUES ($1, $2) ON CONFLICT (name, year) DO UPDATE SET name = EXCLUDED.name RETURNING id", 
    ['Mundial', 2026]
  );
  tournamentId = tRes.rows[0].id;

  // 3. Insertamos o recuperamos el Grupo
  let groupId;
  const gRes = await pool.query(
    "INSERT INTO groups (name, tournament_id) VALUES ($1, $2) ON CONFLICT (name, tournament_id) DO UPDATE SET name = EXCLUDED.name RETURNING id", 
    [groupName, tournamentId]
  );
  groupId = gRes.rows[0].id;

  // 4. Vinculamos los equipos al grupo
  // Usamos ON CONFLICT DO NOTHING porque la PRIMARY KEY de group_teams evita que un equipo se anote dos veces en el mismo grupo
  const insertGroupTeamQuery = 
    "INSERT INTO group_teams (group_id, team_id)VALUES ($1, $2)ON CONFLICT (group_id, team_id) DO NOTHING";
  ;

  await pool.query(insertGroupTeamQuery, [groupId, homeTeamId]);
  await pool.query(insertGroupTeamQuery, [groupId, awayTeamId]);
};

/**
 * Sincroniza los partidos usando SQL puro con validaciones de seguridad
 */
export const syncMatches = async () => {
  try {
    console.log('Sincronizando partidos desde football-data...');
    const response = await apiClient.get(`/competitions/${COMPETITION_ID}/matches`);
    
    for (const m of response.data.matches) {
      // ESCUDO: Validación de datos nulos para evitar errores
      if (!m.homeTeam || !m.awayTeam || m.homeTeam.id === null || m.awayTeam.id === null) {
        console.warn(`⚠️ Saltando partido ${m.id} por falta de datos de equipos.`);
        continue; 
      }

      let localStatus = 'SCHEDULED';
      if (['IN_PLAY', 'PAUSED'].includes(m.status)) localStatus = 'IN_PLAY';
      if (m.status === 'FINISHED') localStatus = 'FINISHED';

      // Usamos el ID mapeado con protección ante nulos
      const homeId = teamMap[m.homeTeam.id] || m.homeTeam.id.toString();
      const awayId = teamMap[m.awayTeam.id] || m.awayTeam.id.toString();
      await processGroupInfo(m, homeId, awayId);

      const query = `
        INSERT INTO matches (id, tournament_id, home_team_id, away_team_id, date, status, home_score, away_score)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (id) DO UPDATE 
        SET 
          date = EXCLUDED.date, 
          status = EXCLUDED.status, 
          home_score = EXCLUDED.home_score, 
          away_score = EXCLUDED.away_score;
      `;

      await pool.query(query, [
        m.id,
        m.tournamentId,
        homeId,
        awayId,
        m.utcDate,
        localStatus,
        m.score?.fullTime?.home ?? null,
        m.score?.fullTime?.away ?? null
      ]);
    }
    console.log('✅ Partidos sincronizados correctamente.');
  } catch (error) {
    console.error('Error al sincronizar partidos:', error);
  }
};