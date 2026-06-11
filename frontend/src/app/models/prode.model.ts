// ─── Auth ─────────────────────────────────────────────────────
export interface User {
  id: string;
  username: string;
  email: string;
}

// ─── Matches ──────────────────────────────────────────────────
export type MatchStatus = 'upcoming' | 'live' | 'finished' | 'SCHEDULED' | 'IN_PLAY' | 'FINISHED';

export interface Match {
  id: string | number;
  home_team: string;
  away_team: string;
  home_flag?: string;
  away_flag?: string;
  home_score: number | null;
  away_score: number | null;
  date: string;
  time?: string;
  stadium?: string;
  city?: string;
  status: MatchStatus;
  group?: string;
  group_name?: string;  // ← agregá esta línea
  phase?: string;
}

// ─── Predictions ──────────────────────────────────────────────
export type PredictionStatus = 'pending' | 'exact' | 'correct' | 'miss';

export interface Prediction {
  id: number;
  user_id: string;
  match_id: number;
  home_score: number;
  away_score: number;
  qualifier_pick?: 'home' | 'away';
  points_earned: number | null;
}

export interface SavePredictionPayload {
  matchId: number;
  homeScore: number;
  awayScore: number;
  qualifierPick?: 'home' | 'away';
}

// ─── Ranking ──────────────────────────────────────────────────
export interface RankingEntry {
  id: string;
  username: string;
  total_points: number;
}

// ─── Legacy interfaces (usadas en los componentes existentes) ─
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