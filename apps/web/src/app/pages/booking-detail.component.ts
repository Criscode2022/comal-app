import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { ApiService, Booking } from '../core/api.service';

@Component({
  standalone: true,
  imports: [RouterLink, DatePipe],
  template: `
    @if (booking(); as b) {
      <div class="min-h-screen px-5 pt-8 pb-10 max-w-lg mx-auto flex flex-col gap-4">
        <a routerLink="/reservas" class="text-sm text-ink-muted">← Mis reservas</a>
        <div class="flex justify-between items-center">
          <span class="font-mono text-sm text-ink-muted">{{ b.publicCode }}</span>
          <span class="text-xs font-semibold px-2.5 py-1 rounded-full bg-primary-soft text-primary-strong">{{ b.status }}</span>
        </div>
        <div class="card p-4 flex flex-col gap-2">
          <h1 class="font-display font-bold text-xl">{{ b.kitchenName }}</h1>
          <p class="text-sm text-ink-muted">{{ b.address }} · {{ b.stationName }}</p>
          <p class="font-mono text-sm">{{ b.startsAt | date: 'd MMM yyyy · HH:mm' }} – {{ b.endsAt | date: 'HH:mm' }}</p>
          <p class="text-sm">Total: <strong>{{ b.totalEur }}€</strong></p>
        </div>

        @if (b.status === 'CONFIRMED' || b.status === 'CHECKED_IN') {
          <div class="bg-ink text-white rounded-2xl p-6 flex flex-col items-center gap-3">
            <div class="text-xs uppercase tracking-wider text-ink-subtle">PIN de acceso</div>
            <div class="font-mono text-4xl font-semibold tracking-[0.2em]">{{ b.accessPin }}</div>
            <p class="text-sm text-ink-subtle text-center">Muéstralo en recepción o introdúcelo en el teclado.</p>
            @if (b.status === 'CONFIRMED') {
              <button class="btn-primary w-full mt-2" type="button" (click)="checkIn()" [disabled]="busy()">
                Registrar check-in
              </button>
            }
          </div>
        }

        @if (msg()) {
          <p class="text-sm text-secondary font-medium">{{ msg() }}</p>
        }
        @if (error()) {
          <p class="text-sm text-danger">{{ error() }}</p>
        }

        @if (b.status === 'CONFIRMED') {
          <button class="btn-secondary border-danger text-danger" type="button" (click)="cancel()" [disabled]="busy()">
            Cancelar reserva
          </button>
        }

        @if (b.refundCents != null) {
          <p class="text-sm text-ink-muted">Reembolso estimado: {{ (b.refundCents || 0) / 100 }}€ ({{ (b.refundPct || 0) * 100 }}%)</p>
        }
      </div>
    } @else {
      <p class="p-8 text-ink-muted">Cargando…</p>
    }
  `,
})
export class BookingDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private api = inject(ApiService);
  booking = signal<Booking | null>(null);
  busy = signal(false);
  msg = signal('');
  error = signal('');

  ngOnInit() {
    this.reload();
  }

  reload() {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.api.getBooking(id).subscribe((b) => this.booking.set(b));
  }

  checkIn() {
    const id = this.booking()?.id;
    if (!id) return;
    this.busy.set(true);
    this.error.set('');
    this.api.checkIn(id).subscribe({
      next: (b) => {
        this.booking.set(b);
        this.msg.set('Check-in registrado');
        this.busy.set(false);
      },
      error: (e) => {
        this.error.set(e.error?.message || 'No se pudo hacer check-in');
        this.busy.set(false);
      },
    });
  }

  cancel() {
    const id = this.booking()?.id;
    if (!id) return;
    if (!confirm('¿Cancelar esta reserva?')) return;
    this.busy.set(true);
    this.api.cancelBooking(id).subscribe({
      next: (b) => {
        this.booking.set(b);
        this.msg.set('Reserva cancelada');
        this.busy.set(false);
      },
      error: (e) => {
        this.error.set(e.error?.message || 'No se pudo cancelar');
        this.busy.set(false);
      },
    });
  }
}
