import { PrismaClient, UserRole, KitchenStatus, MembershipPlan } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('password123', 10);

  const cook = await prisma.user.upsert({
    where: { email: 'lucia@tacosmovil.es' },
    update: {},
    create: {
      email: 'lucia@tacosmovil.es',
      passwordHash,
      name: 'Lucía Romero',
      phone: '+34612345678',
      role: UserRole.COOK,
      membership: { create: { plan: MembershipPlan.NONE } },
    },
  });

  const operator = await prisma.user.upsert({
    where: { email: 'elena@kitchenhub.es' },
    update: {},
    create: {
      email: 'elena@kitchenhub.es',
      passwordHash,
      name: 'Elena Ruiz',
      phone: '+34698765432',
      role: UserRole.OPERATOR,
      membership: { create: { plan: MembershipPlan.NONE } },
    },
  });

  const equipCodes = [
    { code: 'FREIDORA', labelEs: 'Freidora industrial' },
    { code: 'HORNO', labelEs: 'Horno convección' },
    { code: 'ABATIDOR', labelEs: 'Abatidor' },
    { code: 'CAMARA', labelEs: 'Cámara fría' },
    { code: 'PLANCHA', labelEs: 'Plancha' },
    { code: 'OBRADOR', labelEs: 'Obrador' },
  ];

  for (const e of equipCodes) {
    await prisma.equipment.upsert({
      where: { code: e.code },
      update: {},
      create: e,
    });
  }

  const freidora = await prisma.equipment.findUniqueOrThrow({ where: { code: 'FREIDORA' } });
  const horno = await prisma.equipment.findUniqueOrThrow({ where: { code: 'HORNO' } });
  const abatidor = await prisma.equipment.findUniqueOrThrow({ where: { code: 'ABATIDOR' } });
  const camara = await prisma.equipment.findUniqueOrThrow({ where: { code: 'CAMARA' } });
  const plancha = await prisma.equipment.findUniqueOrThrow({ where: { code: 'PLANCHA' } });
  const obrador = await prisma.equipment.findUniqueOrThrow({ where: { code: 'OBRADOR' } });

  const policy = {
    fullRefundHours: 24,
    halfRefundHours: 6,
    description:
      '100% reembolso hasta 24 h antes. 50% entre 24 h y 6 h. Sin reembolso con menos de 6 h.',
  };

  const vallecas = await prisma.kitchen.upsert({
    where: { slug: 'kitchen-hub-vallecas' },
    update: {},
    create: {
      slug: 'kitchen-hub-vallecas',
      name: 'Kitchen Hub Vallecas',
      description:
        '4 estaciones certificadas con freidora, horno de convección, abatidor y cámara fría. Parking y zona de carga.',
      addressLine: 'C. de Sierra Carbonera 12',
      city: 'Madrid',
      postal: '28053',
      lat: 40.388,
      lng: -3.663,
      basePriceCents: 1800,
      minHours: 2,
      cancellationPolicy: policy,
      status: KitchenStatus.PUBLISHED,
      verified: true,
      ratingAvg: 4.9,
      reviewCount: 86,
      ownerUserId: operator.id,
      equipment: {
        create: [
          { equipmentId: freidora.id },
          { equipmentId: horno.id },
          { equipmentId: abatidor.id },
          { equipmentId: camara.id },
          { equipmentId: plancha.id },
        ],
      },
      stations: {
        create: [
          { name: 'Est. 01', capacityNotes: 'Horno completo', priceCents: 1800 },
          { name: 'Est. 02', capacityNotes: 'Horno + plancha', priceCents: 2000, isActive: false },
          { name: 'Est. 03', capacityNotes: 'Freidora + plancha', priceCents: 1800 },
        ],
      },
      staff: { create: [{ userId: operator.id, role: 'manager' }] },
    },
  });

  await prisma.kitchen.upsert({
    where: { slug: 'obrador-sur-legazpi' },
    update: {},
    create: {
      slug: 'obrador-sur-legazpi',
      name: 'Obrador Sur Legazpi',
      description: 'Obrador 24h para pastelería y emplatado. Horno de convección y cámara fría.',
      addressLine: 'Paseo de la Chopera 14',
      city: 'Madrid',
      postal: '28045',
      lat: 40.391,
      lng: -3.695,
      basePriceCents: 2200,
      minHours: 2,
      cancellationPolicy: policy,
      status: KitchenStatus.PUBLISHED,
      verified: true,
      ratingAvg: 4.7,
      reviewCount: 42,
      ownerUserId: operator.id,
      equipment: {
        create: [
          { equipmentId: horno.id },
          { equipmentId: obrador.id },
          { equipmentId: camara.id },
        ],
      },
      stations: {
        create: [{ name: 'Est. 01', capacityNotes: 'Obrador completo', priceCents: 2200 }],
      },
    },
  });

  await prisma.kitchen.upsert({
    where: { slug: 'fogon-centro' },
    update: {},
    create: {
      slug: 'fogon-centro',
      name: 'Fogón Centro',
      description: 'Cocina completa en el centro. Ideal para catering y delivery.',
      addressLine: 'C. de Embajadores 88',
      city: 'Madrid',
      postal: '28012',
      lat: 40.406,
      lng: -3.702,
      basePriceCents: 2800,
      minHours: 2,
      cancellationPolicy: policy,
      status: KitchenStatus.PUBLISHED,
      verified: true,
      ratingAvg: 4.8,
      reviewCount: 61,
      ownerUserId: operator.id,
      equipment: {
        create: [
          { equipmentId: freidora.id },
          { equipmentId: horno.id },
          { equipmentId: plancha.id },
          { equipmentId: abatidor.id },
        ],
      },
      stations: {
        create: [{ name: 'Est. 01', capacityNotes: 'Cocina completa', priceCents: 2800 }],
      },
    },
  });

  console.log('Seed OK', {
    cook: cook.email,
    operator: operator.email,
    kitchen: vallecas.slug,
    password: 'password123',
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
