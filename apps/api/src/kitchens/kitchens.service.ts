import { Injectable, NotFoundException } from '@nestjs/common';
import { KitchenStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class KitchensService {
  constructor(private prisma: PrismaService) {}

  async list(query: {
    city?: string;
    equipment?: string;
    maxPriceCents?: number;
    q?: string;
  }) {
    const equipmentCodes = query.equipment
      ? query.equipment.split(',').map((s) => s.trim().toUpperCase()).filter(Boolean)
      : [];

    const kitchens = await this.prisma.kitchen.findMany({
      where: {
        status: KitchenStatus.PUBLISHED,
        ...(query.city ? { city: { contains: query.city, mode: 'insensitive' } } : {}),
        ...(query.maxPriceCents
          ? { basePriceCents: { lte: query.maxPriceCents } }
          : {}),
        ...(query.q
          ? {
              OR: [
                { name: { contains: query.q, mode: 'insensitive' } },
                { description: { contains: query.q, mode: 'insensitive' } },
                { addressLine: { contains: query.q, mode: 'insensitive' } },
              ],
            }
          : {}),
        ...(equipmentCodes.length
          ? {
              equipment: {
                some: { equipment: { code: { in: equipmentCodes } } },
              },
            }
          : {}),
      },
      include: {
        equipment: { include: { equipment: true } },
        stations: { where: { isActive: true } },
      },
      orderBy: { ratingAvg: 'desc' },
    });

    return kitchens.map((k) => this.serializeKitchen(k));
  }

  async getBySlug(slug: string) {
    const kitchen = await this.prisma.kitchen.findUnique({
      where: { slug },
      include: {
        equipment: { include: { equipment: true } },
        stations: true,
      },
    });
    if (!kitchen || kitchen.status !== KitchenStatus.PUBLISHED) {
      throw new NotFoundException('Cocina no encontrada');
    }
    return this.serializeKitchen(kitchen);
  }

  async listEquipment() {
    return this.prisma.equipment.findMany({ orderBy: { labelEs: 'asc' } });
  }

  private serializeKitchen(k: {
    id: string;
    slug: string;
    name: string;
    description: string;
    addressLine: string;
    city: string;
    postal: string;
    basePriceCents: number;
    minHours: number;
    cancellationPolicy: unknown;
    verified: boolean;
    ratingAvg: { toNumber?: () => number } | number | string;
    reviewCount: number;
    lat: { toNumber?: () => number } | number | string | null;
    lng: { toNumber?: () => number } | number | string | null;
    equipment: { equipment: { code: string; labelEs: string } }[];
    stations: {
      id: string;
      name: string;
      capacityNotes: string | null;
      isActive: boolean;
      priceCents: number | null;
    }[];
  }) {
    const num = (v: { toNumber?: () => number } | number | string | null | undefined) => {
      if (v == null) return null;
      if (typeof v === 'number') return v;
      if (typeof v === 'string') return Number(v);
      if (typeof v.toNumber === 'function') return v.toNumber();
      return Number(v);
    };

    return {
      id: k.id,
      slug: k.slug,
      name: k.name,
      description: k.description,
      addressLine: k.addressLine,
      city: k.city,
      postal: k.postal,
      basePriceCents: k.basePriceCents,
      basePriceEur: k.basePriceCents / 100,
      minHours: k.minHours,
      cancellationPolicy: k.cancellationPolicy,
      verified: k.verified,
      ratingAvg: num(k.ratingAvg) ?? 0,
      reviewCount: k.reviewCount,
      lat: num(k.lat),
      lng: num(k.lng),
      equipment: k.equipment.map((e) => ({
        code: e.equipment.code,
        labelEs: e.equipment.labelEs,
      })),
      stations: k.stations.map((s) => ({
        id: s.id,
        name: s.name,
        capacityNotes: s.capacityNotes,
        isActive: s.isActive,
        priceCents: s.priceCents ?? k.basePriceCents,
        priceEur: (s.priceCents ?? k.basePriceCents) / 100,
      })),
    };
  }
}
