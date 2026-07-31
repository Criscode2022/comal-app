import { Module } from '@nestjs/common';
import { OpsService } from './ops.service';
import { OpsController } from './ops.controller';

@Module({
  controllers: [OpsController],
  providers: [OpsService],
})
export class OpsModule {}
