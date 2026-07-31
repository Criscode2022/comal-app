import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService } from '../core/api.service';

@Component({
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="min-h-screen flex flex-col">
      <header class="flex items-center justify-between px-6 md:px-16 py-5 bg-surface border-b border-border">
        <div class="flex items-center gap-2.5">
          <div class="w-7 h-7 rounded bg-primary"></div>
          <span class="font-display font-bold text-xl tracking-tight">COMAL</span>
        </div>
        <div class="flex items-center gap-3">
          <a routerLink="/ops" class="text-sm font-medium text-ink-muted hidden sm:inline">Operadores</a>
          @if (api.isLoggedIn) {
            <a routerLink="/explorar" class="text-sm font-medium">Explorar</a>
            <a routerLink="/reservas" class="text-sm font-medium">Reservas</a>
            <a routerLink="/perfil" class="text-sm font-semibold">{{ api.user?.name }}</a>
          } @else {
            <a routerLink="/entrar" class="text-sm font-medium px-3 py-2">Entrar</a>
            <a routerLink="/registro" class="btn-primary !py-2.5 !px-4">Crear cuenta</a>
          }
        </div>
      </header>

      <section class="flex-1 grid md:grid-cols-2 gap-8 px-6 md:px-16 py-12 md:py-16 items-center">
        <div class="flex flex-col gap-7 max-w-xl">
          <div class="inline-flex w-fit items-center gap-2 rounded-full bg-primary-soft px-3 py-1.5">
            <span class="w-2 h-2 rounded-full bg-primary"></span>
            <span class="text-xs font-semibold uppercase tracking-wider text-primary-strong">Madrid · Barcelona · Valencia</span>
          </div>
          <h1 class="font-display font-bold text-4xl md:text-5xl leading-tight tracking-tight">
            Tu cocina profesional, cuando la necesitas.
          </h1>
          <p class="text-lg text-ink-muted leading-relaxed">
            Reserva cocinas certificadas por horas. Equipo real, precios claros y acceso digital. Sin WhatsApp. Sin sorpresas.
          </p>
          <div class="flex flex-wrap gap-3">
            <a routerLink="/explorar" class="btn-primary">Explorar cocinas</a>
            <a routerLink="/ops" class="btn-secondary">Soy operador</a>
          </div>
          <div class="flex gap-6 pt-2">
            <div><div class="font-display font-bold text-2xl">48</div><div class="text-xs text-ink-subtle">Cocinas activas*</div></div>
            <div class="w-px bg-border"></div>
            <div><div class="font-display font-bold text-2xl">1.2k</div><div class="text-xs text-ink-subtle">Horas/mes*</div></div>
            <div class="w-px bg-border"></div>
            <div><div class="font-display font-bold text-2xl">4.8</div><div class="text-xs text-ink-subtle">Valoración*</div></div>
          </div>
          <p class="text-[11px] text-ink-subtle">*Cifras ilustrativas de diseño del case COMAL.</p>
        </div>

        <div class="bg-ink rounded-2xl p-6 md:p-7 text-white flex flex-col gap-5 min-h-[360px]">
          <div class="flex justify-between text-xs uppercase tracking-wider text-ink-subtle">
            <span>Estación 03 · Disponible hoy</span>
            <span class="font-mono text-primary">06:00–14:00</span>
          </div>
          <h2 class="font-display font-bold text-3xl">Kitchen Hub Vallecas</h2>
          <p class="text-sm text-[#B0ACA6] leading-relaxed">
            4 estaciones · Freidora · Horno convección · Abatidor · Registro sanitario verificado
          </p>
          <div class="flex flex-wrap gap-2">
            @for (t of tags; track t) {
              <span class="bg-[#2A2A2A] px-3 py-2 rounded-md text-xs text-[#E0DCD6]">{{ t }}</span>
            }
          </div>
          <div class="mt-auto flex items-end justify-between pt-4">
            <div>
              <div class="text-xs text-ink-subtle">Desde</div>
              <div class="font-display font-bold text-4xl">18€ <span class="text-sm font-sans font-normal text-ink-subtle">/hora</span></div>
            </div>
            <a routerLink="/cocinas/kitchen-hub-vallecas" class="btn-primary">Reservar franja</a>
          </div>
        </div>
      </section>
    </div>
  `,
})
export class LandingComponent {
  api = inject(ApiService);
  tags = ['Freidora', 'Horno', 'Abatidor', 'Parking'];
}
