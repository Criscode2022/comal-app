import { Body, Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import { OpsService } from './ops.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('ops')
@UseGuards(JwtAuthGuard)
export class OpsController {
  constructor(private ops: OpsService) {}

  @Get('dashboard')
  dashboard(
    @Req() req: { user: { userId: string } },
    @Query('kitchen') kitchen?: string,
  ) {
    return this.ops.dashboard(req.user.userId, kitchen);
  }

  @Post('blocks')
  block(
    @Req() req: { user: { userId: string } },
    @Body()
    body: { stationId: string; startsAt: string; endsAt: string; reason?: string },
  ) {
    return this.ops.createBlock(req.user.userId, body);
  }

  @Post('check-in')
  checkIn(
    @Req() req: { user: { userId: string } },
    @Body() body: { pin: string; kitchen?: string },
  ) {
    return this.ops.validatePin(req.user.userId, body.pin, body.kitchen);
  }
}
