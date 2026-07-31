import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../core/api.service';

@Component({
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="min-h-screen px-5 pt-10 pb-24 max-w-lg mx-auto">
      @if (api.isLoggedIn) {
        <div class="flex items-center gap-3.5 mb-6">
          <div class="w-14 h-14 rounded-full bg-ink text-white flex items-center justify-center font-semibold text-lg">
            {{ api.user!.name.charAt(0) }}
          </div>
          <div>
            <div class="font-display font-bold text-xl">{{ api.user!.name }}</div>
            <div class="text-sm text-ink-muted">{{ api.user!.email }}</div>
            <div class="text-xs text-ink-subtle mt-0.5">Rol: {{ api.user!.role }}</div>
          </div>
        </div>

        <div class="card bg-primary-soft border-primary/20 p-4 mb-4">
          <div class="text-sm font-semibold text-primary-strong">Plan actual</div>
          <div class="font-display font-bold text-xl mt-1">Pay as you go</div>
          <p class="text-[13px] text-ink-muted mt-1">Pasa a Base (29€/mes) y ahorra 10% en cada reserva.</p>
        </div>

        <div class="card divide-y divide-border mb-6">
          <a routerLink="/reservas" class="block px-4 py-4 text-[15px]">Mis reservas</a>
          @if (api.user?.role === 'OPERATOR') {
            <a routerLink="/ops" class="block px-4 py-4 text-[15px]">Panel operador</a>
          }
          <a routerLink="/explorar" class="block px-4 py-4 text-[15px]">Explorar cocinas</a>
        </div>

        <button type="button" class="text-danger font-semibold text-sm w-full text-center" (click)="logout()">
          Cerrar sesión
        </button>
      } @else {
        <h1 class="font-display font-bold text-3xl mb-4">Perfil</h1>
        <p class="text-ink-muted mb-4">Inicia sesión para gestionar tu cuenta.</p>
        <a routerLink="/entrar" class="btn-primary">Entrar</a>
      }

      <nav class="fixed bottom-0 inset-x-0 bg-surface border-t border-border flex justify-around pt-2.5 pb-7">
        <a routerLink="/explorar" class="text-center w-[72px] text-ink-subtle text-[11px] font-medium">Explorar</a>
        <a routerLink="/reservas" class="text-center w-[72px] text-ink-subtle text-[11px] font-medium">Reservas</a>
        <a routerLink="/perfil" class="text-center w-[72px] text-primary text-[11px] font-semibold">Perfil</a>
      </nav>
    </div>
  `,
})
export class ProfileComponent {
  api = inject(ApiService);
  private router = inject(Router);

  logout() {
    this.api.logout();
    this.router.navigateByUrl('/');
  }
}
