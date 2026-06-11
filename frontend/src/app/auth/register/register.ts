import { Component, inject, signal } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [RouterModule, FormsModule, CommonModule],
  templateUrl: './register.html',
  styleUrl: './register.scss',
})
export class Register {
  private auth   = inject(AuthService);
  private router = inject(Router);

  username        = '';
  email           = '';
  password        = '';       // validación de UI, el backend aún no requiere contraseña
  confirmPassword = '';
  showPassword    = false;
  showConfirm     = false;

  loading = signal(false);
  error   = signal('');

  get passwordsMatch(): boolean {
    return this.password === this.confirmPassword || this.confirmPassword === '';
  }

  onSubmit() {
    if (!this.passwordsMatch) return;
    if (!this.username || !this.email) {
      this.error.set('Completá todos los campos.');
      return;
    }

    this.loading.set(true);
    this.error.set('');

    // El backend usa findOrCreateUser: si el email ya existe, devuelve el user existente
    this.auth.login(this.username, this.email).subscribe({
      next: () => this.router.navigate(['/']),
      error: (err) => {
        this.error.set(err?.error?.error || 'Error al crear la cuenta. Intentá de nuevo.');
        this.loading.set(false);
      }
    });
  }

  onGoogleRegister() {
    console.log('Google register — próximamente');
  }
}