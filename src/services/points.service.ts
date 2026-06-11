import pool from '../config/database';
import { calculateMatchPoints } from '../utils/scoring.utils'; // Importamos tu lógica
import { MatchScore } from '../models/prode.model';

export const calculatePointsForMatch = async (matchId: string) => { 
  // 1. Traer el resultado real del partido
  const matchRes = await pool.query(
    'SELECT home_score, away_score, stage FROM matches WHERE id = $1 AND status = $2', 
    [matchId, 'FINISHED']
  );
  
  
  if (matchRes.rows.length === 0) return;
  const realResult = matchRes.rows[0];

  // 2. Traer todas las predicciones de los usuarios para este partido
  const predsRes = await pool.query(
  'SELECT id, home_score, away_score, qualifier_pick FROM match_predictions WHERE match_id = $1',
  [matchId]
);

  // 3. Procesar cada predicción usando tu función de utilidad
  for (const pred of predsRes.rows) {
    
    // Armamos el formato que espera tu función
    const prediction: MatchScore = { home: pred.home_score, away: pred.away_score };
    const result: MatchScore = { home: realResult.home_score, away: realResult.away_score };

    // Determinamos si es fase de eliminatoria (Knockout)
    const isKnockout = realResult.stage !== 'GROUP';
    const points = calculateMatchPoints(prediction, result, { 
    isKnockout,
    actualQualifier: realResult.qualifier, 
    predictedQualifier: pred.qualifier_pick 
    });
    

    // 4. Guardar los puntos calculados en la DB
    await pool.query(
      'UPDATE match_predictions SET points_earned = $1 WHERE id = $2',
      [points, pred.id]
    );
  }
  
  console.log(`✅ Puntos calculados para el partido ${matchId}`);
};