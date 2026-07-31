import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ApiService, Kitchen } from '../core/api.service';

@Component({
  standalone: true,
  imports: [RouterLink],
  template: `
    @if (kitchen(); as k) {
      <div class="min-h-screen flex flex-col pb-36">
        <header class="px-5 pt-6 pb-4 flex items-center gap-3">
          <a [routerLink]="['/cocinas', k.slug]" class="w-9 h-9 rounded-full border border-border bg-surface flex items-center justify-center">←</a>
          <div>
            <div class="text-xs text-ink-subtle">Reservar</div>
            <div class="font-display font-bold text-lg">{{ k.name }}</div>
          </div>
        </header>

        <div class="px-5 mb-4">
          <div class="text-xs font-semibold uppercase tracking-wider text-ink-subtle mb-2">Fecha</div>
          <div class="flex gap-2 overflow-x-auto">
            @for (d of dates; track d.iso) {
              <button type="button" class="min-w-[52px] rounded-[10px] px-3 py-2.5 flex flex-col items-center gap-1 border"
                [class.bg-ink]="date()===d.iso" [class.text-white]="date()===d.iso"
                [class.border-border]="date()!==d.iso" [class.bg-surface]="date()!==d.iso"
                (click)="selectDate(d.iso)">
                <span class="text-[11px] font-semibold opacity-70">{{ d.label }}</span>
                <span class="font-display font-bold text-lg">{{ d.day }}</span>
              </button>
            }
          </div>
        </div>

        <div class="px-5 mb-4">
          <div class="text-xs font-semibold uppercase tracking-wider text-ink-subtle mb-2">Estación</div>
          <div class="flex gap-2">
            @for (s of activeStations(); track s.id) {
              <button type="button" class="flex-1 rounded-[10px] p-3 text-left border"
                [class.bg-primary-soft]="stationId()===s.id" [class.border-primary]="stationId()===s.id"
                [class.border-border]="stationId()!==s.id" [class.bg-surface]="stationId()!==s.id"
                (click)="selectStation(s.id)">
                <div class="font-semibold text-sm">{{ s.name }}</div>
                <div class="text-xs text-ink-muted">{{ s.capacityNotes }} · {{ s.priceEur }}€/h</div>
              </button>
            }
          </div>
        </div>

        <div class="px-5 flex-1">
          <div class="text-xs font-semibold uppercase tracking-wider text-ink-subtle mb-2">
            Franjas · Europe/Madrid
          </div>
          @if (loadingSlots()) {
            <p class="text-ink-muted text-sm">Cargando disponibilidad…</p>
          } @else {
            <div class="flex flex-wrap gap-2">
              @for (h of hours(); track h.hour) {
                <button type="button" class="w-[100px] py-3 rounded-lg font-mono text-sm font-medium border"
                  [disabled]="h.status!=='free'"
                  [class.bg-primary]="selectedHours().includes(h.hour)"
                  [class.text-white]="selectedHours().includes(h.hour)"
                  [class.border-primary]="selectedHours().includes(h.hour)"
                  [class.bg-border]="h.status!=='free'"
                  [class.text-ink-subtle]="h.status!=='free'"
                  [class.bg-surface]="h.status==='free' && !selectedHours().includes(h.hour)"
                  [class.border-border]="h.status==='free' && !selectedHours().includes(h.hour)"
                  (click)="toggleHour(h.hour)">
                  {{ pad(h.hour) }}:00
                </button>
              }
            </div>
            <div class="flex gap-3 mt-3 text-[11px] text-ink-muted">
              <span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-sm bg-primary"></span> Seleccionada</span>
              <span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-sm bg-border"></span> Ocupada/bloqueada</span>
            </div>
          }
        </div>

        <div class="fixed bottom-0 inset-x-0 bg-surface border-t border-border px-5 py-3.5 pb-7 flex flex-col gap-2.5">
          <div class="flex justify-between items-center text-sm">
            <span class="text-ink-muted">{{ summaryLabel() }}</span>
            <span class="font-display font-bold text-xl">{{ totalEur() }}€</span>
          </div>
          @if (error()) { <p class="text-sm text-danger">{{ error() }}</p> }
          <button class="btn-primary w-full" type="button" [disabled]="!canBook() || submitting()" (click)="book()">
            {{ submitting() ? 'Confirmando…' : (api.isLoggedIn ? 'Confirmar y pagar' : 'Entrar para reservar') }}
          </button>
        </div>
      </div>
    }
  `,
})
export class BookComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  api = inject(ApiService);

  kitchen = signal<Kitchen | null>(null);
  date = signal('');
  stationId = signal('');
  hours = signal<{ hour: number; status: 'free' | 'booked' | 'blocked' }[]>([]);
  selectedHours = signal<number[]>([]);
  loadingSlots = signal(false);
  submitting = signal(false);
  error = signal('');
  dates: { iso: string; label: string; day: number }[] = [];

  activeStations = computed(() => this.kitchen()?.stations.filter((s) => s.isActive) ?? []);

  totalEur = computed(() => {
    const k = this.kitchen();
    const sid = this.stationId();
    const n = this.selectedHours().length;
    if (!k || !sid || n < 2) return 0;
    const st = k.stations.find((s) => s.id === sid);
    return (st?.priceEur ?? k.basePriceEur) * n;
  });

  ngOnInit() {
    this.buildDates();
    const slug = this.route.snapshot.paramMap.get('slug')!;
    this.api.getKitchen(slug).subscribe((k) => {
      this.kitchen.set(k);
      const first = k.stations.find((s) => s.isActive);
      if (first) this.stationId.set(first.id);
      this.date.set(this.dates[0].iso);
      this.loadAvailability();
    });
  }

  buildDates() {
    const labels = ['DOM', 'LUN', 'MAR', 'MIE', 'JUE', 'VIE', 'SAB'];
    const out = [];
    const start = new Date();
    start.setDate(start.getDate() + 1);
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const iso = d.toISOString().slice(0, 10);
      out.push({ iso, label: labels[d.getDay()], day: d.getDate() });
    }
    this.dates = out;
  }

  selectDate(iso: string) {
    this.date.set(iso);
    this.selectedHours.set([]);
    this.loadAvailability();
  }

  selectStation(id: string) {
    this.stationId.set(id);
    this.selectedHours.set([]);
    this.loadAvailability();
  }

  loadAvailability() {
    if (!this.stationId() || !this.date()) return;
    this.loadingSlots.set(true);
    this.api.availability(this.stationId(), this.date()).subscribe({
      next: (r) => {
        this.hours.set(r.hours.filter((h) => h.hour >= 5 && h.hour <= 22));
        this.loadingSlots.set(false);
      },
      error: () => this.loadingSlots.set(false),
    });
  }

  toggleHour(hour: number) {
    const cur = [...this.selectedHours()].sort((a, b) => a - b);
    if (cur.includes(hour)) {
      this.selectedHours.set(cur.filter((h) => h !== hour));
      return;
    }
    if (cur.length === 0) {
      this.selectedHours.set([hour]);
      return;
    }
    const min = cur[0];
    const max = cur[cur.length - 1];
    if (hour === min - 1 || hour === max + 1) {
      this.selectedHours.set([...cur, hour].sort((a, b) => a - b));
    } else {
      this.selectedHours.set([hour]);
    }
  }

  pad(n: number) {
    return n.toString().padStart(2, '0');
  }

  summaryLabel() {
    const h = this.selectedHours();
    if (h.length < 2) return 'Selecciona al menos 2 h contiguas';
    const sorted = [...h].sort((a, b) => a - b);
    return `${h.length} h · ${this.pad(sorted[0])}:00–${this.pad(sorted[sorted.length - 1] + 1)}:00`;
  }

  canBook() {
    return this.selectedHours().length >= 2 && !!this.stationId();
  }

  book() {
    if (!this.api.isLoggedIn) {
      this.router.navigateByUrl('/entrar');
      return;
    }
    const sorted = [...this.selectedHours()].sort((a, b) => a - b);
    const startsAt = `${this.date()}T${this.pad(sorted[0])}:00:00.000Z`;
    this.submitting.set(true);
    this.error.set('');
    this.api.createBooking(this.stationId(), startsAt, sorted.length).subscribe({
      next: (b) => {
        this.submitting.set(false);
        this.router.navigate(['/reservas', b.id]);
      },
      error: (e) => {
        this.submitting.set(false);
        this.error.set(e.error?.message || 'No se pudo crear la reserva');
      },
    });
  }
}
