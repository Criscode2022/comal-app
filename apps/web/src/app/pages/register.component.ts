import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../core/api.service';

@Component({
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <div class="min-h-screen flex flex-col px-6 py-8 max-w-md mx-auto">
      <a routerLink="/entrar" class="text-sm text-ink-muted mb-6">← Volver</a>
      <h1 class="font-display font-bold text-3xl mb-6">Crear cuenta</h1>

      <div class="grid grid-cols-2 gap-2 mb-6">
        <button type="button" class="rounded-[10px] px-3 py-3 text-sm font-semibold border"
          [class.bg-primary-soft]="role==='COOK'" [class.border-primary]="role==='COOK'"
          [class.border-border]="role!=='COOK'" (click)="role='COOK'">Soy cocinero</button>
        <button type="button" class="rounded-[10px] px-3 py-3 text-sm font-semibold border"
          [class.bg-primary-soft]="role==='OPERATOR'" [class.border-primary]="role==='OPERATOR'"
          [class.border-border]="role!=='OPERATOR'" (click)="role='OPERATOR'">Soy operador</button>
      </div>

      <form class="flex flex-col gap-3" (ngSubmit)="submit()">
        <input class="input" placeholder="Nombre" [(ngModel)]="name" name="name" required />
        <input class="input" type="email" placeholder="Email" [(ngModel)]="email" name="email" required />
        <input class="input" placeholder="Teléfono" [(ngModel)]="phone" name="phone" />
        <input class="input" type="password" placeholder="Contraseña (mín. 10)" [(ngModel)]="password" name="password" required minlength="10" />
        @if (error()) { <p class="text-sm text-danger">{{ error() }}</p> }
        <button class="btn-primary mt-2" type="submit" [disabled]="loading()">Crear cuenta</button>
      </form>
    </div>
  `,
})
export class RegisterComponent {
  private api = inject(ApiService);
  private router = inject(Router);
  role: 'COOK' | 'OPERATOR' = 'COOK';
  name = '';
  email = '';
  phone = '';
  password = '';
  loading = signal(false);
  error = signal('');

  submit() {
    this.loading.set(true);
    this.api
      .register({
        name: this.name,
        email: this.email,
        phone: this.phone || undefined,
        password: this.password,
        role: this.role,
      })
      .subscribe({
        next: (r) => {
          this.loading.set(false);
          const role = r?.user?.role;
          this.router.navigateByUrl(role === 'OPERATOR' ? '/ops' : '/explorar');
        },
        error: (e) => {
          this.loading.set(false);
          this.error.set(e.error?.message || 'Error al registrar');
        },
      });
  }
}
