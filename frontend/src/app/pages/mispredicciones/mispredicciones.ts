import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProdeApiService } from '../../services/prode.api.service';
import { AuthService } from '../../services/auth.service';
import { Match, Prediction } from '../../models/prode.model';

export type PredictionStatus = 'pending' | 'exact' | 'correct' | 'miss';
export type ActiveTab = 'pendientes' | 'historial' | 'amigos';

export interface PredictionView {
  id: number;
  matchId: number;
  homeTeam: string;
  awayTeam: string;
  homeFlag: string;
  awayFlag: string;
  matchDate: string;
  predictedHome: number;
  predictedAway: number;
  actualHome: number | null;
  actualAway: number | null;
  points: number | null;
  status: PredictionStatus;
  group: string;
}

export interface PendingMatchView {
  id: number;
  homeTeam: string;
  awayTeam: string;
  homeFlag: string;
  awayFlag: string;
  matchDate: string;
  matchTime: string;
  group: string;
  deadline: string;
  canEdit: boolean;
  predictedHome: number | null;
  predictedAway: number | null;
}

@Component({
  selector: 'app-mispredicciones',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './mispredicciones.html',
  styleUrls: ['./mispredicciones.scss']
})
export class MisPredicciones implements OnInit {
  private api  = inject(ProdeApiService);
  private auth = inject(AuthService);

  activeTab: ActiveTab = 'pendientes';
  loading = true;
  error   = '';

  allMatches:    Match[]      = [];
  myPredictions: Prediction[] = [];

  modalOpen   = false;
  modalMatch: PendingMatchView | null = null;
  modalHome   = 0;
  modalAway   = 0;
  saving      = false;
  saveError   = '';

  userStats = {
    totalPoints:      0,
    totalPredictions: 0,
    exactScores:      0,
    correctResults:   0,
    misses:           0,
  };

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    this.loading = true;
    Promise.all([
      this.api.getMatches().toPromise(),
      this.api.getMyPredictions().toPromise(),
    ]).then(([matches, preds]) => {
      this.allMatches    = matches ?? [];
      this.myPredictions = preds   ?? [];
      this.calcStats();
      this.loading = false;
    }).catch(() => {
      this.error   = 'No se pudieron cargar tus predicciones.';
      this.loading = false;
    });
  }

  private calcStats(): void {
    const finishedIds = new Set(
      this.allMatches
        .filter(m => m.status === 'FINISHED' || m.status === 'finished')
        .map(m => String(m.id))
    );
    const done = this.myPredictions.filter(
      p => finishedIds.has(String(p.match_id)) && p.points_earned !== null
    );
    this.userStats.totalPredictions = this.myPredictions.length;
    this.userStats.totalPoints      = done.reduce((acc, p) => acc + (p.points_earned ?? 0), 0);
    this.userStats.exactScores      = done.filter(p => p.points_earned === 3).length;
    this.userStats.correctResults   = done.filter(p => p.points_earned === 1).length;
    this.userStats.misses           = done.filter(p => p.points_earned === 0).length;
  }

  get accuracy(): number {
    const finishedIds = new Set(
      this.allMatches
        .filter(m => m.status === 'FINISHED' || m.status === 'finished')
        .map(m => String(m.id))
    );
    const done = this.myPredictions.filter(
      p => finishedIds.has(String(p.match_id)) && p.points_earned !== null
    );
    if (done.length === 0) return 0;
    return Math.round(
      ((this.userStats.exactScores + this.userStats.correctResults) / done.length) * 100
    );
  }

  get pendingMatches(): PendingMatchView[] {
    return this.allMatches
      .filter(m => m.status === 'SCHEDULED' || m.status === 'upcoming')
      .map(m => {
        const pred    = this.myPredictions.find(p => String(p.match_id) === String(m.id));
        const msLeft  = new Date(m.date).getTime() - Date.now();
        const canEdit = msLeft > 60 * 60 * 1000;
        return {
          id:            m.id as number,
          homeTeam:      m.home_team,
          awayTeam:      m.away_team,
          homeFlag:      m.home_flag  ?? '🏳️',
          awayFlag:      m.away_flag  ?? '🏳️',
          matchDate:     this.formatDate(m.date),
          matchTime:     this.formatTime(m.date),
          group:         m.group_name ?? m.group ?? '',
          deadline:      this.formatDeadline(m.date),
          canEdit,
          predictedHome: pred?.home_score ?? null,
          predictedAway: pred?.away_score ?? null,
        };
      });
  }

  get historial(): PredictionView[] {
    return this.allMatches
      .filter(m => m.status === 'FINISHED' || m.status === 'finished')
      .map(m => {
        const pred = this.myPredictions.find(p => String(p.match_id) === String(m.id));
        return {
          id:            pred?.id ?? 0,
          matchId:       m.id as number,
          homeTeam:      m.home_team,
          awayTeam:      m.away_team,
          homeFlag:      m.home_flag ?? '🏳️',
          awayFlag:      m.away_flag ?? '🏳️',
          matchDate:     this.formatDate(m.date),
          predictedHome: pred?.home_score ?? null as any,
          predictedAway: pred?.away_score ?? null as any,
          actualHome:    m.home_score,
          actualAway:    m.away_score,
          points:        pred?.points_earned ?? null,
          status:        this.calcStatus(pred?.points_earned ?? null),
          group:         m.group_name ?? m.group ?? '',
        };
      });
  }

  get friendsComparison(): any[] { return []; }

  openModal(match: PendingMatchView): void {
    this.modalMatch = match;
    this.modalHome  = match.predictedHome ?? 0;
    this.modalAway  = match.predictedAway ?? 0;
    this.saveError  = '';
    this.modalOpen  = true;
  }

  closeModal(): void {
    this.modalOpen  = false;
    this.modalMatch = null;
  }

  confirmPrediction(): void {
    if (!this.modalMatch) return;
    this.saving    = true;
    this.saveError = '';
    this.api.savePrediction({
      matchId:   this.modalMatch.id,
      homeScore: this.modalHome,
      awayScore: this.modalAway,
    }).subscribe({
      next: () => {
        this.saving = false;
        this.closeModal();
        this.loadData();
      },
      error: (err) => {
        this.saving    = false;
        this.saveError = err?.error?.error ?? 'No se pudo guardar. Intentá de nuevo.';
      }
    });
  }

  private calcStatus(points: number | null): PredictionStatus {
    if (points === null) return 'pending';
    if (points === 3)    return 'exact';
    if (points === 1)    return 'correct';
    return 'miss';
  }

  private formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const date  = new Date(dateStr);
    const today = new Date();
    const diff  = Math.floor((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diff === 0)  return 'Hoy';
    if (diff === 1)  return 'Mañana';
    if (diff === -1) return 'Ayer';
    return date.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });
  }

  private formatTime(dateStr: string): string {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
  }

  private formatDeadline(dateStr: string): string {
    if (!dateStr) return '';
    const diff = new Date(dateStr).getTime() - Date.now();
    const h    = Math.floor(diff / (1000 * 60 * 60));
    if (h < 1)    return 'Cierra pronto';
    if (h < 24)   return `Cierra en ${h}h`;
    const d = Math.floor(h / 24);
    return `Cierra en ${d}d`;
  }

  setTab(tab: ActiveTab) { this.activeTab = tab; }

  getStatusLabel(status: PredictionStatus): string {
    if (status === 'exact')   return '+3 Exacto';
    if (status === 'correct') return '+1 Resultado';
    if (status === 'miss')    return '0 pts';
    return 'Pendiente';
  }
}