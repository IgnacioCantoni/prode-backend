import pool from '../config/database';

export const savePrediction = async (
  userId: string, 
  matchId: string, 
  homeScore: number, 
  awayScore: number, 
  qualifierPick?: string
) => {
  // 1. Validar que el partido exista y no haya empezado
  const matchRes = await pool.query('SELECT date, status FROM matches WHERE id = $1', [matchId]);
  
  if (matchRes.rows.length === 0) {
    throw new Error('El partido no existe');
  }

  const match = matchRes.rows[0];
  const now = new Date();
  const matchDate = new Date(match.date);

  // Verificamos si ya es la hora del partido o si ya empezó
  if (now >= matchDate || !['SCHEDULED', 'TIMED'].includes(match.status)) {
    throw new Error('Ya no puedes predecir este partido porque ha comenzado o finalizado');
  }

  // 2. Guardar o actualizar la predicción
  const query = `
    INSERT INTO match_predictions (user_id, match_id, home_score, away_score, qualifier_pick)
    VALUES ($1, $2, $3, $4, $5)
    ON CONFLICT (user_id, match_id) 
    DO UPDATE SET 
      home_score = EXCLUDED.home_score,
      away_score = EXCLUDED.away_score,
      qualifier_pick = EXCLUDED.qualifier_pick
    RETURNING *;
  `;

  const result = await pool.query(query, [
    userId, 
    matchId, 
    homeScore, 
    awayScore, 
    qualifierPick || null
  ]);

  return result.rows[0];
};