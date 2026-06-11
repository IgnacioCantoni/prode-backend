
import { MatchScore, KnockoutContext, GroupOrderPrediction } from '../models/prode.model';

export function calculateMatchPoints(prediction: MatchScore, result: MatchScore, knockoutCtx?: KnockoutContext): number {
  let basePoints = 0;
  
  const predictedDiff = prediction.home - prediction.away;
  const actualDiff = result.home - result.away;
  
  const predictedResult = predictedDiff > 0 ? 'home' : predictedDiff < 0 ? 'away' : 'tie';
  const actualResult = actualDiff > 0 ? 'home' : actualDiff < 0 ? 'away' : 'tie';

  // 1. Marcador exacto (8 pts)
  if (prediction.home === result.home && prediction.away === result.away) {
    basePoints = 8;
  }
  // 2. Empate correcto sin importar goles (5 pts)
  else if (predictedResult === 'tie' && actualResult === 'tie') {
    basePoints = 5;
  }
  // 3. Ganador correcto + misma diferencia (5 pts)
  else if (predictedResult === actualResult && predictedDiff === actualDiff) {
    basePoints = 5;
  }
  // 4. Ganador correcto (3 pts)
  else if (predictedResult === actualResult) {
    basePoints = 3;
  }
  // 5. Goles exactos de un equipo (1 pt)
  else if (prediction.home === result.home || prediction.away === result.away) {
    basePoints = 1;
  }

  // Fase 2 (+3 pts)
  if (knockoutCtx?.isKnockout && knockoutCtx.actualQualifier && knockoutCtx.predictedQualifier) {
    if (knockoutCtx.predictedQualifier === knockoutCtx.actualQualifier) {
      basePoints += 3;
    }
  }

  return basePoints;
}

export function calculateGroupOrderPoints(prediction: GroupOrderPrediction, actual: GroupOrderPrediction): number {
  let points = 0;
  if (prediction.firstPlaceTeamId === actual.firstPlaceTeamId) points += 1;
  if (prediction.secondPlaceTeamId === actual.secondPlaceTeamId) points += 1;
  if (prediction.thirdPlaceTeamId === actual.thirdPlaceTeamId) points += 1;
  if (prediction.fourthPlaceTeamId === actual.fourthPlaceTeamId) points += 1;
  return points;
}