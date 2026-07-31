import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService, Kitchen } from '../core/api.service';

@Component({
  standalone: true,
  imports: [RouterLink, FormsModule],
  template: `
    <div class="min-h-screen flex flex-col pb-20">
      <header class="px-5 pt-6 pb-3">
        <div class="flex justify-between items-start mb-3">
          <div>
            <div class="text-xs font-semibold uppercase tracking-wider text-ink-subtle">Madrid</div>
            <h1 class="font-display font-bold text-3xl">Explorar</h1>
          </div>
          <a routerLink="/perfil" class="w-10 h-10 rounded-full bg-ink text-white flex items-center justify-center text-sm font-semibold">
            {{ (api.user?.name || 'U').charAt(0) }}
          </a>
        </div>
        <input class="input" placeholder="Barrio, cocina o equipo…" [(ngModel)]="q" (keyup.enter)="load()" />
      </header>

      <div class="flex gap-2 px-5 pb-3 overflow-x-auto">
        @for (chip of chips; track chip.code) {
          <button type="button" class="shrink-0 rounded-full px-3.5 py-2 text-[13px] font-medium border"
            [class.bg-ink]="selected.has(chip.code)" [class.text-white]="selected.has(chip.code)"
            [class.border-ink]="selected.has(chip.code)"
            [class.bg-surface]="!selected.has(chip.code)" [class.border-border]="!selected.has(chip.code)"
            (click)="toggle(chip.code)">{{ chip.label }}</button>
        }
      </div>

      <p class="px-5 text-[13px] text-ink-muted mb-3">{{ kitchens().length }} cocinas</p>

      @if (loading()) {
        <p class="px-5 text-ink-muted">Cargando cocinas…</p>
      } @else if (kitchens().length === 0) {
        <div class="px-5 py-16 text-center">
          <h2 class="font-display font-bold text-2xl mb-2">Sin cocinas con esos filtros</h2>
          <p class="text-ink-muted mb-4">Prueba a quitar equipos o ampliar la búsqueda.</p>
          <button class="btn-primary" type="button" (click)="clear()">Quitar filtros</button>
        </div>
      } @else {
        <div class="px-5 flex flex-col gap-3">
          @for (k of kitchens(); track k.id) {
            <a [routerLink]="['/cocinas', k.slug]" class="card overflow-hidden block">
              <div class="h-28 bg-ink flex items-end p-3">
                @if (k.verified) {
                  <span class="bg-primary text-white text-[11px] font-semibold px-2 py-1 rounded">VERIFICADA</span>
                }
              </div>
              <div class="p-3.5 flex flex-col gap-2">
                <div class="flex justify-between gap-2">
                  <div>
                    <div class="font-display font-bold text-lg">{{ k.name }}</div>
                    <div class="text-[13px] text-ink-muted">{{ k.city }} · {{ k.addressLine }}</div>
                  </div>
                  <div class="text-right shrink-0">
                    <div class="font-display font-bold text-xl">{{ k.basePriceEur }}€</div>
                    <div class="text-[11px] text-ink-subtle">/hora</div>
                  </div>
                </div>
                <div class="flex flex-wrap gap-1.5">
                  @for (e of k.equipment.slice(0, 3); track e.code) {
                    <span class="bg-secondary-soft text-secondary text-[11px] font-medium px-2 py-1 rounded">{{ e.labelEs }}</span>
                  }
                  <span class="text-[12px] text-ink-muted">★ {{ k.ratingAvg }} · {{ k.reviewCount }}</span>
                </div>
              </div>
            </a>
          }
        </div>
      }

      <nav class="fixed bottom-0 inset-x-0 bg-surface border-t border-border flex justify-around pt-2.5 pb-7">
        <a routerLink="/explorar" class="text-center w-[72px] text-primary text-[11px] font-semibold">Explorar</a>
        <a routerLink="/reservas" class="text-center w-[72px] text-ink-subtle text-[11px] font-medium">Reservas</a>
        <a routerLink="/perfil" class="text-center w-[72px] text-ink-subtle text-[11px] font-medium">Perfil</a>
      </nav>
    </div>
  `,
})
export class ExploreComponent implements OnInit {
  api = inject(ApiService);
  kitchens = signal<Kitchen[]>([]);
  loading = signal(true);
  q = '';
  selected = new Set<string>();
  chips = [
    { code: '', label: 'Todos' },
    { code: 'FREIDORA', label: 'Freidora' },
    { code: 'HORNO', label: 'Horno' },
    { code: 'ABATIDOR', label: 'Abatidor' },
  ];

  ngOnInit() {
    this.load();
  }

  toggle(code: string) {
    if (!code) {
      this.selected.clear();
    } else if (this.selected.has(code)) {
      this.selected.delete(code);
    } else {
      this.selected.add(code);
    }
    this.load();
  }

  clear() {
    this.selected.clear();
    this.q = '';
    this.load();
  }

  load() {
    this.loading.set(true);
    const equipment = [...this.selected].join(',');
    this.api.listKitchens({ city: 'Madrid', equipment: equipment || undefined, q: this.q || undefined }).subscribe({
      next: (k) => {
        this.kitchens.set(k);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
