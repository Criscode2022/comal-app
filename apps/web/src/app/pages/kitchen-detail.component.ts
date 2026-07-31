import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService, Kitchen } from '../core/api.service';

@Component({
  standalone: true,
  imports: [RouterLink],
  template: `
    @if (kitchen(); as k) {
      <div class="min-h-screen flex flex-col pb-28">
        <div class="h-48 bg-ink relative flex flex-col justify-between p-4">
          <a routerLink="/explorar" class="w-9 h-9 rounded-full bg-black/40 text-white flex items-center justify-center">←</a>
          @if (k.verified) {
            <span class="self-start bg-primary text-white text-[11px] font-semibold px-2 py-1 rounded">VERIFICADA</span>
          }
        </div>
        <div class="px-5 py-5 flex flex-col gap-4">
          <div class="flex justify-between gap-3">
            <div>
              <h1 class="font-display font-bold text-[26px] leading-tight">{{ k.name }}</h1>
              <p class="text-sm text-ink-muted mt-1">{{ k.addressLine }} · {{ k.city }}</p>
            </div>
            <div class="text-right shrink-0">
              <div class="font-display font-bold text-2xl">{{ k.basePriceEur }}€</div>
              <div class="text-xs text-ink-subtle">/hora · IVA incl.</div>
            </div>
          </div>
          <p class="text-sm text-ink-muted">★ {{ k.ratingAvg }} · {{ k.reviewCount }} reseñas · {{ activeStationCount(k) }} estaciones</p>
          <p class="text-[15px] leading-relaxed text-ink-muted">{{ k.description }}</p>

          <div>
            <div class="text-xs font-semibold uppercase tracking-wider text-ink-subtle mb-2">Equipo incluido</div>
            <div class="flex flex-wrap gap-2">
              @for (e of k.equipment; track e.code) {
                <span class="border border-border bg-surface px-3 py-2 rounded-lg text-[13px]">{{ e.labelEs }}</span>
              }
            </div>
          </div>

          <div class="card p-3.5">
            <div class="font-semibold text-sm mb-1">Política de cancelación</div>
            <p class="text-[13px] text-ink-muted leading-relaxed">
              {{ k.cancellationPolicy?.description || 'Consulta condiciones en la reserva.' }}
            </p>
          </div>
        </div>

        <div class="fixed bottom-0 inset-x-0 bg-surface border-t border-border px-5 py-3.5 pb-7 flex items-center justify-between gap-3">
          <div>
            <div class="text-xs text-ink-subtle">Desde</div>
            <div class="font-display font-bold text-xl">{{ k.basePriceEur }}€/h</div>
          </div>
          <a [routerLink]="['/reservar', k.slug]" class="btn-primary">Reservar franja</a>
        </div>
      </div>
    } @else {
      <p class="p-8 text-ink-muted">Cargando…</p>
    }
  `,
})
export class KitchenDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private api = inject(ApiService);
  kitchen = signal<Kitchen | null>(null);

  ngOnInit() {
    const slug = this.route.snapshot.paramMap.get('slug')!;
    this.api.getKitchen(slug).subscribe((k) => this.kitchen.set(k));
  }

  activeStationCount(k: Kitchen): number {
    return k.stations.filter((s) => s.isActive).length;
  }
}
