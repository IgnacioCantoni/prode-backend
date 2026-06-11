import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { fadeSlideIn, staggerList, todayPulse, statBounceIn } from './home.animations';
import { ProdeApiService } from '../../services/prode.api.service';
import { AuthService } from '../../services/auth.service';
import { Match, Prediction } from '../../models/prode.model';

export interface UserStats {
  username: string;
  avatar: string;
  totalPoints: number;
  rankPosition: number;
  totalPredictions: number;
  correctResults: number;
  exactScores: number;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './home.html',
  styleUrls: ['./home.scss'],
  animations: [fadeSlideIn, staggerList, todayPulse, statBounceIn],
})
export class Home implements OnInit {
  private api  = inject(ProdeApiService);
  private auth = inject(AuthService);

  // ─── Estado ───────────────────────────────────────────────────
  upcomingMatches: Match[]      = [];
  recentPredictions: Prediction[] = [];
  rankingPosition = 0;
  loading = true;

  // ─── Stats derivadas del user + predicciones ──────────────────
  userStats: UserStats = {
    username: '',
    avatar: '',
    totalPoints: 0,
    rankPosition: 0,
    totalPredictions: 0,
    correctResults: 0,
    exactScores: 0,
  };

  animatedPoints   = 0;
  animatedRank     = 0;
  animatedAccuracy = 0;
  animatedExact    = 0;

  ngOnInit(): void {
    const user = this.auth.user();
    if (user) {
      this.userStats.username = user.username;
      this.userStats.avatar   = user.username.slice(0, 2).toUpperCase();
    }

    // Cargamos partidos y predicciones en paralelo
    this.api.getMatches().subscribe({
      next: (matches) => {
        this.upcomingMatches = matches
          .filter(m => m.status === 'SCHEDULED' || m.status === 'upcoming')
          .slice(0, 4);
      }
    });

    this.api.getMyPredictions().subscribe({
      next: (preds) => {
        this.recentPredictions = preds.slice(0, 3);

        const withPoints = preds.filter(p => p.points_earned !== null);
        this.userStats.totalPredictions = preds.length;
        this.userStats.totalPoints      = withPoints.reduce((acc, p) => acc + (p.points_earned ?? 0), 0);
        this.userStats.exactScores      = withPoints.filter(p => p.points_earned === 3).length;
        this.userStats.correctResults   = withPoints.filter(p => (p.points_earned ?? 0) > 0).length;

        this.loading = false;
        setTimeout(() => {
          this.animateCounter('animatedPoints',   this.userStats.totalPoints, 1200);
          this.animateCounter('animatedAccuracy', this.accuracy, 900);
          this.animateCounter('animatedExact',    this.userStats.exactScores, 700);
        }, 300);
      }
    });

    this.api.getRanking().subscribe({
      next: (ranking) => {
        const user = this.auth.user();
        if (user) {
          const idx = ranking.findIndex(r => r.id === user.id);
          this.userStats.rankPosition = idx >= 0 ? idx + 1 : 0;
          setTimeout(() => this.animateCounter('animatedRank', this.userStats.rankPosition, 600), 300);
        }
      }
    });
  }

  get accuracy(): number {
    if (this.userStats.totalPredictions === 0) return 0;
    return Math.round((this.userStats.correctResults / this.userStats.totalPredictions) * 100);
  }

  // Helpers para predicciones
  getMatchTeam(pred: Prediction, side: 'home' | 'away'): string {
    return `Partido #${pred.match_id}`;
  }

  getPointsClass(points: number | null): string {
    if (points === null) return '';
    if (points === 3) return 'exact';
    if (points === 1) return 'correct';
    return 'miss';
  }

  getPointsLabel(points: number | null): string {
    if (points === null) return '-';
    if (points === 3) return '+3 Exacto';
    if (points === 1) return '+1 Resultado';
    return '0 pts';
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const today = new Date();
    const diff  = Math.floor((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diff === 0)  return 'Hoy';
    if (diff === 1)  return 'Mañana';
    if (diff === -1) return 'Ayer';
    return date.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });
  }

  formatTime(dateStr: string): string {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
  }

  private animateCounter(
    key: 'animatedPoints' | 'animatedRank' | 'animatedAccuracy' | 'animatedExact',
    target: number,
    duration: number
  ): void {
    const steps    = 40;
    const interval = duration / steps;
    const step     = target / steps;
    let   current  = 0;
    let   count    = 0;

    const timer = setInterval(() => {
      count++;
      current = Math.round(step * count);
      if (current >= target || count >= steps) {
        this[key] = target;
        clearInterval(timer);
      } else {
        this[key] = current;
      }
    }, interval);
  }
}