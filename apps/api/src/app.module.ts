import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { KitchensModule } from './kitchens/kitchens.module';
import { BookingsModule } from './bookings/bookings.module';
import { OpsModule } from './ops/ops.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    KitchensModule,
    BookingsModule,
    OpsModule,
  ],
})
export class AppModule {}
