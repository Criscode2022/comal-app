import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../core/api.service';

@Component({
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <div class="min-h-screen flex flex-col px-6 py-10 max-w-md mx-auto">
      <a routerLink="/" class="flex items-center gap-2.5 mb-8">
        <div class="w-7 h-7 rounded bg-primary"></div>
        <span class="font-display font-bold text-xl">COMAL</span>
      </a>
      <h1 class="font-display font-bold text-3xl mb-2">Entrar</h1>
      <p class="text-ink-muted mb-8">Accede para reservar y ver tus check-ins.</p>

      <form class="flex flex-col gap-4" (ngSubmit)="submit()">
        <label class="flex flex-col gap-1.5">
          <span class="text-sm font-semibold">Email</span>
          <input class="input" type="email" [(ngModel)]="email" name="email" required />
        </label>
        <label class="flex flex-col gap-1.5">
          <span class="text-sm font-semibold">Contraseña</span>
          <input class="input" type="password" [(ngModel)]="password" name="password" required />
        </label>
        @if (error()) {
          <p class="text-sm text-danger">{{ error() }}</p>
        }
        <button class="btn-primary mt-2" type="submit" [disabled]="loading()">
          {{ loading() ? 'Entrando…' : 'Entrar' }}
        </button>
      </form>

      <p class="text-sm text-ink-muted text-center mt-8">
        Demo cook: <span class="font-mono text-ink">lucia&#64;tacosmovil.es</span> / password123
      </p>
      <p class="text-sm text-center mt-4">
        ¿No tienes cuenta?
        <a routerLink="/registro" class="font-semibold text-primary">Crear cuenta</a>
      </p>
    </div>
  `,
})
export class LoginComponent {
  private api = inject(ApiService);
  private router = inject(Router);
  email = 'lucia@tacosmovil.es';
  password = 'password123';
  loading = signal(false);
  error = signal('');

  submit() {
    this.loading.set(true);
    this.error.set('');
    this.api.login(this.email, this.password).subscribe({
      next: (r) => {
        this.loading.set(false);
        const role = r?.user?.role;
        this.router.navigateByUrl(role === 'OPERATOR' ? '/ops' : '/explorar');
      },
      error: (e) => {
        this.loading.set(false);
        this.error.set(e.error?.message || 'No se pudo iniciar sesión');
      },
    });
  }
}
