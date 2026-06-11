import { Component, inject, signal } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [RouterModule, FormsModule, CommonModule],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  private auth   = inject(AuthService);
  private router = inject(Router);

  email        = '';
  username     = '';
  password     = '';   // ← campo de UI, el backend no lo usa aún (auth por username+email)
  showPassword = false;

  loading = signal(false);
  error   = signal('');

  onSubmit() {
    if (!this.email || !this.username) {
      this.error.set('Completá tu nombre de usuario y email.');
      return;
    }

    this.loading.set(true);
    this.error.set('');

    this.auth.login(this.username, this.email).subscribe({
      next: () => this.router.navigate(['/']),
      error: (err) => {
        this.error.set(err?.error?.error || 'Error al iniciar sesión. Intentá de nuevo.');
        this.loading.set(false);
      }
    });
  }

  onGoogleLogin() {
    // Google auth: implementar cuando esté listo en el backend
    console.log('Google login — próximamente');
  }
}