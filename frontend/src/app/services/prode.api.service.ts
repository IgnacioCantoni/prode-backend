import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Match, Prediction, RankingEntry, SavePredictionPayload } from '../models/prode.model';

@Injectable({ providedIn: 'root' })
export class ProdeApiService {
  private http = inject(HttpClient);

  // ─── Opciones compartidas ────────────────────────────────────
  // withCredentials: true → el browser envía la cookie httpOnly automáticamente
  private opts = { withCredentials: true };

  // ─── Partidos ────────────────────────────────────────────────
  getMatches(): Observable<Match[]> {
    return this.http.get<Match[]>(`${environment.apiUrl}/matches`, this.opts);
  }

  // ─── Predicciones ────────────────────────────────────────────
  savePrediction(payload: SavePredictionPayload): Observable<{ message: string; prediction: Prediction }> {
    return this.http.post<{ message: string; prediction: Prediction }>(
      `${environment.apiUrl}/predict`, payload, this.opts
    );
  }

  getMyPredictions(): Observable<Prediction[]> {
    return this.http.get<Prediction[]>(`${environment.apiUrl}/predictions/me`, this.opts);
  }

  getMatchPredictions(matchId: number): Observable<any[]> {
    return this.http.get<any[]>(`${environment.apiUrl}/predictions/match/${matchId}`, this.opts);
  }

  // ─── Ranking ─────────────────────────────────────────────────
  getRanking(): Observable<RankingEntry[]> {
    return this.http.get<RankingEntry[]>(`${environment.apiUrl}/ranking`, this.opts);
  }
}