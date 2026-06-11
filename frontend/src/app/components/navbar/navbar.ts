import {
  Component, OnInit, OnDestroy, AfterViewInit,
  ElementRef, QueryList, ViewChildren, HostListener,
  Inject, PLATFORM_ID, inject,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { filter, Subscription } from 'rxjs';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.html',
  styleUrls: ['./navbar.scss'],
})
export class Navbar implements OnInit, AfterViewInit, OnDestroy {
  private auth = inject(AuthService);

  @ViewChildren('navItem')  navItems!:  QueryList<ElementRef<HTMLElement>>;
  @ViewChildren('authItem') authItems!: QueryList<ElementRef<HTMLElement>>;

  navLinks = [
    { label: 'Home',             path: '/',                icon: '', exact: true  },
    { label: 'Partidos',         path: '/partidos',        icon: '', exact: false },
    { label: 'Mis predicciones', path: '/mispredicciones', icon: '', exact: false },
    { label: 'Ranking',          path: '/ranking',         icon: '', exact: false },
    { label: 'Reglas',           path: '/reglas',          icon: '', exact: false },
  ];

  // Estado reactivo del usuario
  get isLoggedIn(): boolean { return this.auth.isLoggedIn(); }
  get currentUser()         { return this.auth.user(); }
  get userInitials(): string {
    const u = this.auth.user();
    return u ? u.username.slice(0, 2).toUpperCase() : '';
  }

  // Nav pill state
  navPillLeft  = 0;
  navPillWidth = 0;
  navPillReady = false;
  activeNav    = 0;

  // Auth pill state
  authPillLeft  = 0;
  authPillWidth = 0;
  authPillReady = false;
  activeAuth    = -1;

  mobileOpen = false;
  private sub!: Subscription;
  private isBrowser: boolean;

  constructor(private router: Router, @Inject(PLATFORM_ID) pid: object) {
    this.isBrowser = isPlatformBrowser(pid);
  }

  ngOnInit(): void {
    this.syncNav(this.router.url);
    this.sub = this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe((e: any) => {
        this.syncNav(e.urlAfterRedirects);
        this.mobileOpen = false;
        if (this.isBrowser) setTimeout(() => { this.moveNavPill(); }, 60);
      });
  }

  ngAfterViewInit(): void {
    if (this.isBrowser) setTimeout(() => { this.moveNavPill(); }, 120);
  }

  ngOnDestroy(): void { this.sub?.unsubscribe(); }

  private syncNav(url: string): void {
    const ex = this.navLinks.findIndex(l => l.exact && url === l.path);
    if (ex !== -1) { this.activeNav = ex; return; }
    const pr = this.navLinks.findIndex(l => !l.exact && url.startsWith(l.path));
    this.activeNav = pr !== -1 ? pr : 0;
  }

  onLogout(): void {
    this.auth.logout();
    this.mobileOpen = false;
  }

  // ── Nav pill ──────────────────────────────────────────────
  moveNavPill(index?: number): void {
    if (!this.isBrowser) return;
    const idx   = index ?? this.activeNav;
    const items = this.navItems?.toArray();
    if (!items?.length) return;
    const el     = items[idx]?.nativeElement;
    if (!el) return;
    const parent = el.closest('.nb-pill') as HTMLElement;
    if (!parent || typeof parent.getBoundingClientRect !== 'function') return;
    const pr = parent.getBoundingClientRect();
    const er = el.getBoundingClientRect();
    this.navPillLeft  = er.left - pr.left;
    this.navPillWidth = er.width;
    this.navPillReady = true;
  }

  onNavEnter(i: number): void { this.moveNavPill(i); }
  onNavLeave(): void           { this.moveNavPill(this.activeNav); }
  onNavClick(i: number): void  {
    this.activeNav = i;
    if (this.isBrowser) setTimeout(() => this.moveNavPill(), 60);
  }

  // ── Auth pill ─────────────────────────────────────────────
  moveAuthPill(index?: number): void {
    if (!this.isBrowser) return;
    const idx   = index ?? this.activeAuth;
    if (idx < 0) return;
    const items = this.authItems?.toArray();
    if (!items?.length) return;
    const el     = items[idx]?.nativeElement;
    if (!el) return;
    const parent = el.closest('.nb-pill') as HTMLElement;
    if (!parent || typeof parent.getBoundingClientRect !== 'function') return;
    const pr = parent.getBoundingClientRect();
    const er = el.getBoundingClientRect();
    this.authPillLeft  = er.left - pr.left;
    this.authPillWidth = er.width;
    this.authPillReady = true;
  }

  onAuthEnter(i: number): void { this.moveAuthPill(i); }
  onAuthLeave(): void           {
    this.authPillReady = false;
    this.activeAuth    = -1;
  }
  onAuthClick(i: number): void  { this.activeAuth = i; }

  // ── Mobile ────────────────────────────────────────────────
  toggleMobile(): void { this.mobileOpen = !this.mobileOpen; }

  @HostListener('document:click', ['$event'])
  docClick(e: MouseEvent): void {
    if (!(e.target as HTMLElement).closest('app-navbar')) this.mobileOpen = false;
  }

  @HostListener('window:resize')
  onResize(): void {
    if (this.isBrowser) setTimeout(() => this.moveNavPill(), 80);
  }
}