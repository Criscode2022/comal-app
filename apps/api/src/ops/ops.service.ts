import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { BookingStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class OpsService {
  constructor(private prisma: PrismaService) {}

  private async assertOperatorKitchen(userId: string, kitchenId: string) {
    const staff = await this.prisma.kitchenStaff.findUnique({
      where: { kitchenId_userId: { kitchenId, userId } },
    });
    const kitchen = await this.prisma.kitchen.findUnique({ where: { id: kitchenId } });
    if (!kitchen) throw new NotFoundException('Cocina no encontrada');
    if (kitchen.ownerUserId !== userId && !staff) {
      throw new ForbiddenException('No eres operador de esta cocina');
    }
    return kitchen;
  }

  async dashboard(userId: string, kitchenSlug?: string) {
    const kitchen = kitchenSlug
      ? await this.prisma.kitchen.findUnique({ where: { slug: kitchenSlug } })
      : await this.prisma.kitchen.findFirst({
          where: {
            OR: [
              { ownerUserId: userId },
              { staff: { some: { userId } } },
            ],
          },
        });
    if (!kitchen) throw new NotFoundException('No hay cocina asignada');
    await this.assertOperatorKitchen(userId, kitchen.id);

    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const stations = await this.prisma.station.findMany({
      where: { kitchenId: kitchen.id },
    });
    const bookings = await this.prisma.booking.findMany({
      where: {
        stationId: { in: stations.map((s) => s.id) },
        startsAt: { lte: end },
        endsAt: { gte: start },
        status: {
          in: [
            BookingStatus.CONFIRMED,
            BookingStatus.CHECKED_IN,
            BookingStatus.COMPLETED,
            BookingStatus.PENDING_PAYMENT,
          ],
        },
      },
      include: {
        station: true,
        cook: { select: { name: true, email: true } },
        checkIn: true,
      },
      orderBy: { startsAt: 'asc' },
    });

    const revenue = bookings.reduce((sum, b) => sum + b.totalCents, 0);
    const pendingCheckIns = bookings.filter(
      (b) => b.status === BookingStatus.CONFIRMED,
    ).length;

    return {
      kitchen: { id: kitchen.id, name: kitchen.name, slug: kitchen.slug },
      stats: {
        bookingsToday: bookings.length,
        revenueCents: revenue,
        revenueEur: revenue / 100,
        pendingCheckIns,
        stationsActive: stations.filter((s) => s.isActive).length,
      },
      bookings: bookings.map((b) => ({
        id: b.id,
        publicCode: b.publicCode,
        stationName: b.station.name,
        cookName: b.cook.name,
        startsAt: b.startsAt,
        endsAt: b.endsAt,
        status: b.status,
        totalEur: b.totalCents / 100,
        checkedIn: !!b.checkIn,
      })),
    };
  }

  async createBlock(
    userId: string,
    body: { stationId: string; startsAt: string; endsAt: string; reason?: string },
  ) {
    const station = await this.prisma.station.findUnique({
      where: { id: body.stationId },
    });
    if (!station) throw new NotFoundException('Estación no encontrada');
    await this.assertOperatorKitchen(userId, station.kitchenId);

    return this.prisma.stationBlock.create({
      data: {
        stationId: body.stationId,
        startsAt: new Date(body.startsAt),
        endsAt: new Date(body.endsAt),
        reason: body.reason,
      },
    });
  }

  async validatePin(userId: string, pin: string, kitchenSlug?: string) {
    const kitchen = kitchenSlug
      ? await this.prisma.kitchen.findUnique({ where: { slug: kitchenSlug } })
      : await this.prisma.kitchen.findFirst({
          where: {
            OR: [{ ownerUserId: userId }, { staff: { some: { userId } } }],
          },
        });
    if (!kitchen) throw new NotFoundException();
    await this.assertOperatorKitchen(userId, kitchen.id);

    const stations = await this.prisma.station.findMany({
      where: { kitchenId: kitchen.id },
      select: { id: true },
    });

    const booking = await this.prisma.booking.findFirst({
      where: {
        accessPin: pin,
        stationId: { in: stations.map((s) => s.id) },
        status: BookingStatus.CONFIRMED,
      },
      include: {
        station: true,
        cook: { select: { name: true } },
      },
    });
    if (!booking) throw new NotFoundException('PIN no válido o ya usado');

    await this.prisma.checkIn.create({
      data: { bookingId: booking.id, method: 'manual', checkedInBy: userId },
    });
    await this.prisma.booking.update({
      where: { id: booking.id },
      data: { status: BookingStatus.CHECKED_IN },
    });

    return {
      ok: true,
      publicCode: booking.publicCode,
      cookName: booking.cook.name,
      stationName: booking.station.name,
    };
  }
}
