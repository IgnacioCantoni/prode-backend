import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProdeApiService } from '../../services/prode.api.service';
import { Match } from '../../models/prode.model';

export type MatchStatus = 'upcoming' | 'live' | 'finished' | 'SCHEDULED' | 'IN_PLAY' | 'FINISHED';
export type Phase = 'grupos' | 'octavos' | 'cuartos' | 'semis' | 'final';

export interface Group {
  name: string;
  letter: string;
  matches: Match[];
}

export interface KnockoutMatch {
  id: number;
  label: string;
  homeTeam: string;
  awayTeam: string;
  homeFlag: string;
  awayFlag: string;
  homeScore: number | null;
  awayScore: number | null;
  date: string;
  time: string;
  stadium: string;
  status: MatchStatus;
}

@Component({
  selector: 'app-partidos',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './partidos.html',
  styleUrls: ['./partidos.scss']
})
export class Partidos implements OnInit {
  private api = inject(ProdeApiService);

  activePhase: Phase = 'grupos';
  activeGroup = 'A';
  loading = true;
  error   = '';

  phases = [
    { key: 'grupos',  label: 'Fase de Grupos', icon: '⚽' },
    { key: 'octavos', label: 'Octavos',         icon: '🔵' },
    { key: 'cuartos', label: 'Cuartos',          icon: '🟡' },
    { key: 'semis',   label: 'Semifinales',      icon: '🔴' },
    { key: 'final',   label: 'Final',            icon: '🏆' },
  ];

  groups: Group[] = [];

  knockoutMatches: Record<string, KnockoutMatch[]> = {
    octavos: [], cuartos: [], semis: [], final: []
  };

  ngOnInit(): void {
    this.api.getMatches().subscribe({
      next: (matches) => {
        this.buildGroups(matches);
        this.loading = false;
      },
      error: () => {
        this.error   = 'No se pudieron cargar los partidos.';
        this.loading = false;
      }
    });
  }

  private buildGroups(matches: Match[]): void {
    const groupMap = new Map<string, Group>();

    for (const match of matches) {
      const phase = match.phase?.toLowerCase() ?? '';

      if (phase && phase !== 'group') {
        continue;
      }

      const letter = match.group_name ?? 'Sin grupo';

      if (!groupMap.has(letter)) {
        groupMap.set(letter, { name: `Grupo ${letter}`, letter, matches: [] });
      }
      groupMap.get(letter)!.matches.push(match);
    }

    this.groups = Array.from(groupMap.values()).sort((a, b) => a.letter.localeCompare(b.letter));

    if (this.groups.length > 0) {
      this.activeGroup = this.groups[0].letter;
    }
  }

  get activeGroupData(): Group | undefined {
    return this.groups.find(g => g.letter === this.activeGroup);
  }

  setPhase(phase: string) { this.activePhase = phase as Phase; }
  setGroup(letter: string) { this.activeGroup = letter; }

  getStatusLabel(status: string): string {
    if (status === 'IN_PLAY' || status === 'live')      return 'En vivo';
    if (status === 'FINISHED' || status === 'finished') return 'Finalizado';
    return 'Próximo';
  }

  getNormalizedStatus(status: string): string {
    if (status === 'IN_PLAY')  return 'live';
    if (status === 'FINISHED') return 'finished';
    return 'upcoming';
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });
  }

  formatTime(dateStr: string): string {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
  }
}