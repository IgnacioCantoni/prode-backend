import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProdeApiService } from '../../services/prode.api.service';
import { AuthService } from '../../services/auth.service';
import { RankingEntry } from '../../models/prode.model';

export interface Player {
  position: number;
  name: string;
  initials: string;
  color: string;
  points: number;
  exactScores: number;
  correctResults: number;
  totalPredictions: number;
  isMe: boolean;
}

// Paleta de colores para avatares
const AVATAR_COLORS = [
  '#F6B40E', '#74ACDF', '#3DDC84', '#FF6B6B', '#A78BFA',
  '#FB923C', '#34D399', '#F472B6', '#60A5FA', '#FBBF24',
];

@Component({
  selector: 'app-ranking',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ranking.html',
  styleUrls: ['./ranking.scss']
})
export class Ranking implements OnInit {
  private api  = inject(ProdeApiService);
  private auth = inject(AuthService);

  searchQuery = '';
  players: Player[] = [];
  loading = true;
  error   = '';

  ngOnInit(): void {
    const currentUser = this.auth.user();

    this.api.getRanking().subscribe({
      next: (ranking) => {
        this.players = ranking.map((entry, idx) => {
          const initials = entry.username.slice(0, 2).toUpperCase();
          const color    = AVATAR_COLORS[idx % AVATAR_COLORS.length];
          const isMe     = currentUser ? entry.id === currentUser.id : false;

          return {
            position:         idx + 1,
            name:             entry.username,
            initials,
            color,
            points:           Number(entry.total_points),
            exactScores:      0,   // el endpoint /ranking no devuelve breakdown
            correctResults:   0,   // si querés mostrarlo, extendé la query SQL
            totalPredictions: 0,
            isMe,
          };
        });
        this.loading = false;
      },
      error: () => {
        this.error   = 'No se pudo cargar el ranking.';
        this.loading = false;
      }
    });
  }

  get top3(): Player[] { return this.players.slice(0, 3); }

  get filteredPlayers(): Player[] {
    if (!this.searchQuery.trim()) return this.players;
    return this.players.filter(p =>
      p.name.toLowerCase().includes(this.searchQuery.toLowerCase())
    );
  }

  get myPlayer(): Player | undefined {
    return this.players.find(p => p.isMe);
  }

  getAccuracy(player: Player): number {
    if (player.totalPredictions === 0) return 0;
    return Math.round(((player.exactScores + player.correctResults) / player.totalPredictions) * 100);
  }

  onSearch(event: Event) {
    this.searchQuery = (event.target as HTMLInputElement).value;
  }

  getMedalIcon(position: number): string {
    if (position === 1) return '🥇';
    if (position === 2) return '🥈';
    if (position === 3) return '🥉';
    return '';
  }
}