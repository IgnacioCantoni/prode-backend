import {
  trigger,
  transition,
  style,
  animate,
  query,
  stagger,
  keyframes,
} from '@angular/animations';

// ── 1. FADE + SLIDE UP ────────────────────────────────────────────────────────
// Usado en: hero-section, stats-row, section-card
// Cada sección entra desde abajo con fade-in al cargarse la página
export const fadeSlideIn = trigger('fadeSlideIn', [
  transition(':enter', [
    style({ opacity: 0, transform: 'translateY(20px)' }),
    animate(
      '500ms cubic-bezier(0.4, 0, 0.2, 1)',
      style({ opacity: 1, transform: 'translateY(0)' })
    ),
  ]),
]);

// ── 2. STAGGER EN LISTA DE PARTIDOS / PREDICCIONES ────────────────────────────
// Usado en: .matches-list y .predictions-list
// Cada card aparece 80ms después de la anterior (efecto cascada)
export const staggerList = trigger('staggerList', [
  transition(':enter', [
    query(
      ':enter',
      [
        style({ opacity: 0, transform: 'translateY(12px)' }),
        stagger('80ms', [
          animate(
            '400ms cubic-bezier(0.4, 0, 0.2, 1)',
            style({ opacity: 1, transform: 'translateY(0)' })
          ),
        ]),
      ],
      { optional: true }
    ),
  ]),
]);

// ── 3. PULSE EN BADGE "HOY" ───────────────────────────────────────────────────
// Usado en: .today-badge — late glow dorado al aparecer
export const todayPulse = trigger('todayPulse', [
  transition(':enter', [
    animate(
      '600ms ease-out',
      keyframes([
        style({ opacity: 0, transform: 'scale(0.85)', offset: 0 }),
        style({ opacity: 1, transform: 'scale(1.08)', offset: 0.6 }),
        style({ opacity: 1, transform: 'scale(1)', offset: 1 }),
      ])
    ),
  ]),
]);

// ── 4. BOUNCE EN STAT CARD ACCENT ─────────────────────────────────────────────
// Usado en: .stat-card.accent (trofeo con puntos totales)
export const statBounceIn = trigger('statBounceIn', [
  transition(':enter', [
    animate(
      '700ms cubic-bezier(0.34, 1.56, 0.64, 1)',
      keyframes([
        style({ opacity: 0, transform: 'scale(0.7)', offset: 0 }),
        style({ opacity: 1, transform: 'scale(1.05)', offset: 0.7 }),
        style({ opacity: 1, transform: 'scale(1)', offset: 1 }),
      ])
    ),
  ]),
]);