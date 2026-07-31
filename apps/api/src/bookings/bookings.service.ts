import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BookingStatus, MembershipPlan } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBookingDto } from './dto/create-booking.dto';

@Injectable()
export class BookingsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateBookingDto) {
    const station = await this.prisma.station.findUnique({
      where: { id: dto.stationId },
      include: { kitchen: true },
    });
    if (!station || !station.isActive) {
      throw new NotFoundException('Estación no disponible');
    }

    const startsAt = new Date(dto.startsAt);
    if (Number.isNaN(startsAt.getTime())) {
      throw new BadRequestException('Fecha inválida');
    }
    if (startsAt.getTime() < Date.now() - 60_000) {
      throw new BadRequestException('No se puede reservar en el pasado');
    }

    const minHours = station.kitchen.minHours || 2;
    if (dto.hours < minHours) {
      throw new BadRequestException(`Mínimo ${minHours} horas`);
    }

    const endsAt = new Date(startsAt.getTime() + dto.hours * 60 * 60 * 1000);

    const block = await this.prisma.stationBlock.findFirst({
      where: {
        stationId: station.id,
        startsAt: { lt: endsAt },
        endsAt: { gt: startsAt },
      },
    });
    if (block) {
      throw new ConflictException('Franja bloqueada por mantenimiento');
    }

    const overlap = await this.prisma.booking.findFirst({
      where: {
        stationId: station.id,
        status: {
          in: [
            BookingStatus.PENDING_PAYMENT,
            BookingStatus.CONFIRMED,
            BookingStatus.CHECKED_IN,
            BookingStatus.COMPLETED,
          ],
        },
        startsAt: { lt: endsAt },
        endsAt: { gt: startsAt },
      },
    });
    if (overlap) {
      throw new ConflictException('Esa franja ya no está disponible');
    }

    const membership = await this.prisma.membership.findUnique({ where: { userId } });
    const plan = membership?.plan ?? MembershipPlan.NONE;
    const discountPct =
      plan === MembershipPlan.PRO ? 0.15 : plan === MembershipPlan.BASE ? 0.1 : 0;

    const unit = station.priceCents ?? station.kitchen.basePriceCents;
    const base = unit * dto.hours;
    const discount = Math.round(base * discountPct);
    const total = base - discount;

    const publicCode = `COM-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    const accessPin = String(Math.floor(100000 + Math.random() * 900000));

    const booking = await this.prisma.booking.create({
      data: {
        publicCode,
        cookUserId: userId,
        stationId: station.id,
        startsAt,
        endsAt,
        status: BookingStatus.CONFIRMED,
        totalCents: total,
        accessPin,
        priceBreakdown: {
          unitCents: unit,
          hours: dto.hours,
          baseCents: base,
          discountCents: discount,
          discountPct,
          plan,
          totalCents: total,
          currency: 'EUR',
        },
      },
      include: {
        station: { include: { kitchen: true } },
      },
    });

    return this.serialize(booking);
  }

  async listMine(userId: string) {
    const bookings = await this.prisma.booking.findMany({
      where: { cookUserId: userId },
      include: { station: { include: { kitchen: true } }, checkIn: true },
      orderBy: { startsAt: 'asc' },
    });
    return bookings.map((b) => this.serialize(b));
  }

  async getOne(userId: string, id: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: { station: { include: { kitchen: true } }, checkIn: true },
    });
    if (!booking) throw new NotFoundException();
    if (booking.cookUserId !== userId) throw new ForbiddenException();
    return this.serialize(booking);
  }

  async cancel(userId: string, id: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: { station: { include: { kitchen: true } } },
    });
    if (!booking) throw new NotFoundException();
    if (booking.cookUserId !== userId) throw new ForbiddenException();
    if (
      booking.status === BookingStatus.CANCELLED ||
      booking.status === BookingStatus.COMPLETED
    ) {
      throw new BadRequestException('La reserva no se puede cancelar');
    }

    const hoursUntil = (booking.startsAt.getTime() - Date.now()) / (1000 * 60 * 60);
    let refundPct = 0;
    if (hoursUntil >= 24) refundPct = 1;
    else if (hoursUntil >= 6) refundPct = 0.5;

    const refundCents = Math.round(booking.totalCents * refundPct);

    const updated = await this.prisma.booking.update({
      where: { id },
      data: {
        status: BookingStatus.CANCELLED,
        cancelledAt: new Date(),
        priceBreakdown: {
          ...(booking.priceBreakdown as object),
          refundPct,
          refundCents,
        },
      },
      include: { station: { include: { kitchen: true } }, checkIn: true },
    });

    return {
      ...this.serialize(updated),
      refundCents,
      refundPct,
    };
  }

  async checkIn(userId: string, id: string) {
    const booking = await this.prisma.booking.findUnique({ where: { id } });
    if (!booking) throw new NotFoundException();
    if (booking.cookUserId !== userId) throw new ForbiddenException();
    if (booking.status !== BookingStatus.CONFIRMED) {
      throw new BadRequestException('Estado de reserva no permite check-in');
    }

    const windowStart = new Date(booking.startsAt.getTime() - 15 * 60 * 1000);
    const now = new Date();
    if (now < windowStart || now > booking.endsAt) {
      throw new BadRequestException('Fuera de la ventana de check-in (15 min antes – fin de franja)');
    }

    await this.prisma.checkIn.create({
      data: { bookingId: id, method: 'pin', checkedInBy: userId },
    });
    const updated = await this.prisma.booking.update({
      where: { id },
      data: { status: BookingStatus.CHECKED_IN },
      include: { station: { include: { kitchen: true } }, checkIn: true },
    });
    return this.serialize(updated);
  }

  async availability(stationId: string, date: string) {
    const dayStart = new Date(`${date}T00:00:00.000Z`);
    const dayEnd = new Date(`${date}T23:59:59.999Z`);
    if (Number.isNaN(dayStart.getTime())) {
      throw new BadRequestException('Fecha inválida (YYYY-MM-DD)');
    }

    const station = await this.prisma.station.findUnique({ where: { id: stationId } });
    if (!station || !station.isActive) throw new NotFoundException('Estación no disponible');

    const bookings = await this.prisma.booking.findMany({
      where: {
        stationId,
        status: {
          in: [
            BookingStatus.PENDING_PAYMENT,
            BookingStatus.CONFIRMED,
            BookingStatus.CHECKED_IN,
            BookingStatus.COMPLETED,
          ],
        },
        startsAt: { lt: dayEnd },
        endsAt: { gt: dayStart },
      },
    });

    const blocks = await this.prisma.stationBlock.findMany({
      where: {
        stationId,
        startsAt: { lt: dayEnd },
        endsAt: { gt: dayStart },
      },
    });

    const hours: { hour: number; status: 'free' | 'booked' | 'blocked' }[] = [];
    for (let h = 0; h < 24; h++) {
      const slotStart = new Date(dayStart);
      slotStart.setUTCHours(h, 0, 0, 0);
      const slotEnd = new Date(slotStart.getTime() + 60 * 60 * 1000);

      const isBlocked = blocks.some(
        (b) => b.startsAt < slotEnd && b.endsAt > slotStart,
      );
      const isBooked = bookings.some(
        (b) => b.startsAt < slotEnd && b.endsAt > slotStart,
      );

      hours.push({
        hour: h,
        status: isBlocked ? 'blocked' : isBooked ? 'booked' : 'free',
      });
    }

    return { stationId, date, hours };
  }

  private serialize(b: {
    id: string;
    publicCode: string;
    cookUserId: string;
    stationId: string;
    startsAt: Date;
    endsAt: Date;
    status: BookingStatus;
    priceBreakdown: unknown;
    totalCents: number;
    currency: string;
    accessPin: string;
    cancelledAt: Date | null;
    station?: {
      name: string;
      kitchen: { name: string; slug: string; addressLine: string; city: string };
    };
    checkIn?: { checkedInAt: Date; method: string } | null;
  }) {
    return {
      id: b.id,
      publicCode: b.publicCode,
      cookUserId: b.cookUserId,
      stationId: b.stationId,
      startsAt: b.startsAt,
      endsAt: b.endsAt,
      status: b.status,
      priceBreakdown: b.priceBreakdown,
      totalCents: b.totalCents,
      totalEur: b.totalCents / 100,
      currency: b.currency,
      accessPin: b.accessPin,
      cancelledAt: b.cancelledAt,
      kitchenName: b.station?.kitchen.name,
      kitchenSlug: b.station?.kitchen.slug,
      stationName: b.station?.name,
      address: b.station
        ? `${b.station.kitchen.addressLine}, ${b.station.kitchen.city}`
        : undefined,
      checkIn: b.checkIn ?? null,
    };
  }
}
