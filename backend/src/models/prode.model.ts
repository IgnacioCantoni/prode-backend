
export interface MatchScore {
  home: number;
  away: number;
}

export interface KnockoutContext {
  isKnockout: boolean;
  actualQualifier?: 'home' | 'away'; 
  predictedQualifier?: 'home' | 'away';
}

export interface GroupOrderPrediction {
  groupId: string;
  firstPlaceTeamId: string;
  secondPlaceTeamId: string;
  thirdPlaceTeamId: string;
  fourthPlaceTeamId: string;
}

// Interfaz temporal para representar la predicción de un usuario en la BD
export interface UserPrediction {
  userId: string;
  matchId: string;
  score: MatchScore;
  knockoutCtx?: KnockoutContext;
}

export interface Tournament {
  id: number;
  name: string;
  year: number;
}

export interface Group {
  id: number;
  name: string;
  tournament_id: number;
}

export interface GroupTeam {
  group_id: number;
  team_id: string; 
}