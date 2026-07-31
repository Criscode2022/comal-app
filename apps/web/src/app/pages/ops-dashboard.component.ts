import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../core/api.service';

@Component({
  standalone: true,
  imports: [RouterLink, DatePipe, FormsModule],
  template: `
    <div class="min-h-screen bg-background">
      <div class="flex min-h-screen">
        <aside class="hidden md:flex w-60 bg-ink text-white flex-col p-6 gap-2 shrink-0">
          <div class="flex items-center gap-2.5 mb-8">
            <div class="w-5 h-5 rounded bg-primary"></div>
            <span class="font-display font-bold">COMAL Ops</span>
          </div>
          <div class="bg-[#2A2A2A] rounded-lg px-3 py-3 text-sm font-semibold">Dashboard</div>
          <a routerLink="/explorar" class="px-3 py-3 text-sm text-ink-subtle">Vista cocinero</a>
          <a routerLink="/" class="px-3 py-3 text-sm text-ink-subtle mt-auto">Salir al inicio</a>
        </aside>

        <main class="flex-1 p-6 md:p-10">
          @if (!api.isLoggedIn) {
            <p class="text-ink-muted mb-4">Entra como operador (elena&#64;kitchenhub.es / password123)</p>
            <a routerLink="/entrar" class="btn-primary">Entrar</a>
          } @else if (error()) {
            <p class="text-danger">{{ error() }}</p>
            <a routerLink="/entrar" class="btn-secondary mt-4 inline-flex">Cambiar cuenta</a>
          } @else if (data()) {
            <div class="flex flex-wrap justify-between gap-4 mb-8">
              <div>
                <div class="text-xs font-semibold uppercase tracking-wider text-ink-subtle">{{ data()!.kitchen.name }} · Hoy</div>
                <h1 class="font-display font-bold text-3xl">Panel operador</h1>
              </div>
            </div>

            <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <div class="card p-5">
                <div class="text-sm text-ink-muted">Reservas hoy</div>
                <div class="font-display font-bold text-4xl mt-1">{{ data()!.stats.bookingsToday }}</div>
              </div>
              <div class="card p-5">
                <div class="text-sm text-ink-muted">Ingresos</div>
                <div class="font-display font-bold text-4xl mt-1">{{ data()!.stats.revenueEur }}€</div>
              </div>
              <div class="card p-5">
                <div class="text-sm text-ink-muted">Check-ins pendientes</div>
                <div class="font-display font-bold text-4xl mt-1 text-primary">{{ data()!.stats.pendingCheckIns }}</div>
              </div>
              <div class="card p-5">
                <div class="text-sm text-ink-muted">Estaciones activas</div>
                <div class="font-display font-bold text-4xl mt-1">{{ data()!.stats.stationsActive }}</div>
              </div>
            </div>

            <div class="card overflow-hidden mb-8">
              <div class="px-5 py-3 bg-[#FAFAF8] border-b border-border text-xs font-semibold text-ink-subtle grid grid-cols-4 gap-2">
                <span>HORA</span><span>ESTACIÓN</span><span>COCINERO</span><span>ESTADO</span>
              </div>
              @for (b of data()!.bookings; track b.id) {
                <div class="px-5 py-4 border-b border-border last:border-0 grid grid-cols-4 gap-2 text-sm items-center">
                  <span class="font-mono text-[13px]">{{ b.startsAt | date: 'HH:mm' }}–{{ b.endsAt | date: 'HH:mm' }}</span>
                  <span>{{ b.stationName }}</span>
                  <span>{{ b.cookName }}</span>
                  <span class="text-xs font-semibold px-2.5 py-1 rounded-full w-fit bg-secondary-soft text-secondary">{{ b.status }}</span>
                </div>
              } @empty {
                <p class="p-5 text-ink-muted text-sm">Sin reservas hoy.</p>
              }
            </div>

            <div class="card p-5 max-w-md">
              <h2 class="font-display font-bold text-xl mb-3">Check-in recepción</h2>
              <form class="flex gap-2" (ngSubmit)="validatePin()">
                <input class="input font-mono tracking-widest" maxlength="6" placeholder="PIN 6 dígitos" [(ngModel)]="pin" name="pin" />
                <button class="btn-primary shrink-0" type="submit">Validar</button>
              </form>
              @if (pinMsg()) { <p class="text-sm text-secondary mt-2">{{ pinMsg() }}</p> }
              @if (pinErr()) { <p class="text-sm text-danger mt-2">{{ pinErr() }}</p> }
            </div>
          } @else {
            <p class="text-ink-muted">Cargando panel…</p>
          }
        </main>
      </div>
    </div>
  `,
})
export class OpsDashboardComponent implements OnInit {
  api = inject(ApiService);
  data = signal<any>(null);
  error = signal('');
  pin = '';
  pinMsg = signal('');
  pinErr = signal('');

  ngOnInit() {
    if (!this.api.isLoggedIn) return;
    this.api.opsDashboard().subscribe({
      next: (d) => this.data.set(d),
      error: (e) => this.error.set(e.error?.message || 'No tienes acceso de operador'),
    });
  }

  validatePin() {
    this.pinMsg.set('');
    this.pinErr.set('');
    this.api.opsValidatePin(this.pin).subscribe({
      next: (r: any) => {
        this.pinMsg.set(`OK · ${r.cookName} · ${r.stationName} · ${r.publicCode}`);
        this.pin = '';
        this.ngOnInit();
      },
      error: (e) => this.pinErr.set(e.error?.message || 'PIN inválido'),
    });
  }
}
