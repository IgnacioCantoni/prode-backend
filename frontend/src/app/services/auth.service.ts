import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { User } from '../models/prode.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http   = inject(HttpClient);
  private router = inject(Router);

  private _user = signal<User | null>(null);

  readonly user       = this._user.asReadonly();
  readonly isLoggedIn = computed(() => this._user() !== null);

  login(username: string, email: string): Observable<{ user: User }> {
    return this.http
      .post<{ user: User }>(`${environment.apiUrl}/login`, { username, email }, { withCredentials: true })
      .pipe(tap(res => this._user.set(res.user)));
  }

  logout(): void {
    this.http
      .post(`${environment.apiUrl}/logout`, {}, { withCredentials: true })
      .subscribe({
        complete: () => {
          this._user.set(null);
          this.router.navigate(['/login']);
        }
      });
  }

  // Intenta recuperar el usuario desde la cookie httpOnly
  // Si no hay cookie válida, lanza error para que el guard redirija a /login
  loadCurrentUser(): Observable<{ user: User }> {
    return this.http
      .get<{ user: User }>(`${environment.apiUrl}/me`, { withCredentials: true })
      .pipe(
        tap(res => this._user.set(res.user)),
        catchError(err => {
          this._user.set(null);
          return throwError(() => err);
        })
      );
  }
}