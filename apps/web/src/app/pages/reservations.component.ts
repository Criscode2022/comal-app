import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { ApiService, Booking } from '../core/api.service';

@Component({
  standalone: true,
  imports: [RouterLink, DatePipe],
  template: `
    <div class="min-h-screen flex flex-col pb-20 px-5 pt-8">
      <h1 class="font-display font-bold text-3xl mb-4">Mis reservas</h1>

      @if (!api.isLoggedIn) {
        <p class="text-ink-muted mb-4">Inicia sesión para ver tus reservas.</p>
        <a routerLink="/entrar" class="btn-primary w-fit">Entrar</a>
      } @else if (loading()) {
        <p class="text-ink-muted">Cargando…</p>
      } @else if (bookings().length === 0) {
        <div class="py-16 text-center">
          <h2 class="font-display font-bold text-2xl mb-2">Aún no tienes reservas</h2>
          <p class="text-ink-muted mb-4">Cuando reserves una franja, aparecerá aquí.</p>
          <a routerLink="/explorar" class="btn-primary">Explorar cocinas</a>
        </div>
      } @else {
        <div class="flex flex-col gap-3">
          @for (b of bookings(); track b.id) {
            <a [routerLink]="['/reservas', b.id]" class="card p-4 flex flex-col gap-2">
              <div class="flex justify-between gap-2">
                <div class="font-display font-bold text-lg">{{ b.kitchenName }}</div>
                <span class="text-[11px] font-semibold px-2.5 py-1 rounded-full h-fit"
                  [class.bg-primary-soft]="b.status==='CONFIRMED'"
                  [class.text-primary-strong]="b.status==='CONFIRMED'"
                  [class.bg-secondary-soft]="b.status==='CHECKED_IN'"
                  [class.text-secondary]="b.status==='CHECKED_IN'"
                  [class.bg-border]="b.status==='CANCELLED'"
                  [class.text-ink-muted]="b.status==='CANCELLED'">
                  {{ b.status }}
                </span>
              </div>
              <div class="font-mono text-[13px] text-ink-muted">
                {{ b.startsAt | date: 'd MMM · HH:mm' }} – {{ b.endsAt | date: 'HH:mm' }}
              </div>
              <div class="text-[13px] text-ink-muted">
                {{ b.stationName }} · {{ b.publicCode }} · {{ b.totalEur }}€
              </div>
            </a>
          }
        </div>
      }

      <nav class="fixed bottom-0 inset-x-0 bg-surface border-t border-border flex justify-around pt-2.5 pb-7">
        <a routerLink="/explorar" class="text-center w-[72px] text-ink-subtle text-[11px] font-medium">Explorar</a>
        <a routerLink="/reservas" class="text-center w-[72px] text-primary text-[11px] font-semibold">Reservas</a>
        <a routerLink="/perfil" class="text-center w-[72px] text-ink-subtle text-[11px] font-medium">Perfil</a>
      </nav>
    </div>
  `,
})
export class ReservationsComponent implements OnInit {
  api = inject(ApiService);
  bookings = signal<Booking[]>([]);
  loading = signal(false);

  ngOnInit() {
    if (!this.api.isLoggedIn) return;
    this.loading.set(true);
    this.api.myBookings().subscribe({
      next: (b) => {
        this.bookings.set(b);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
