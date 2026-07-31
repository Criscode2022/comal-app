# COMAL App

Cocinas compartidas por horas — implementación full-stack del case [COMAL](https://github.com/Criscode2022) (UX/UI en monorepo ux-projects).

## Stack

- **Angular 19** + **Tailwind CSS** (`apps/web`)
- **NestJS 11** + **Prisma 6** (`apps/api`)
- **Neon** PostgreSQL

## Setup

```bash
npm install
cp .env.example apps/api/.env   # rellenar DATABASE_URL y JWT_SECRET
npm run db:generate -w @comal/api
cd apps/api && npx prisma migrate deploy && npx tsx prisma/seed.ts
```

## Run

```bash
# terminal 1 — API
npm run start:dev -w @comal/api

# terminal 2 — Web
npm run start -w @comal/web
```

- Web: http://localhost:4200  
- API: http://localhost:3000/api  

## Cuentas demo (seed)

| Rol | Email | Password |
|-----|-------|----------|
| Cocinero | lucia@tacosmovil.es | password123 |
| Operador | elena@kitchenhub.es | password123 |

## Flujos

1. Explorar cocinas → ficha → reservar franjas (≥2 h) → detalle + PIN  
2. Cancelar reserva (reembolso según política)  
3. Ops: panel del día + validar PIN en recepción  

## Neon

Project: `super-cell-05525663` (comal-app)  
No commitear `.env`.
