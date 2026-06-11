
import { Request, Response } from 'express';
import { calculateMatchPoints } from '../utils/scoring.utils';
import { MatchScore, UserPrediction } from '../models/prode.model';

export const processMatchResult = async (req: Request, res: Response): Promise<void> => {
  try {
    const { matchId, realResult } = req.body as { matchId: string, realResult: MatchScore };

    if (!matchId || !realResult) {
      res.status(400).json({ error: 'Faltan datos del partido o el resultado real.' });
      return;
    }

    // Ir a la base de datos y traer todas las predicciones para este matchId
    const mockPredictions: UserPrediction[] = [
      { userId: 'user_1', matchId, score: { home: 2, away: 1 } },
      { userId: 'user_2', matchId, score: { home: 1, away: 1 } }
    ];
    
    const processedResults = mockPredictions.map(prediction => {
      const points = calculateMatchPoints(prediction.score, realResult);
      
      // Guardar `points` en el perfil del usuario en la Base de Datos
      
      return {
        userId: prediction.userId,
        prediction: prediction.score,
        pointsObtained: points
      };
    });

    res.status(200).json({ 
      message: 'Resultados procesados exitosamente',
      matchId,
      realResult,
      updates: processedResults
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error interno al procesar el partido' });
  }
};