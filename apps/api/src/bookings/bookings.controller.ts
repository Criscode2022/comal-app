import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateBookingDto } from './dto/create-booking.dto';

@Controller('bookings')
export class BookingsController {
  constructor(private bookings: BookingsService) {}

  @Get('availability')
  availability(
    @Query('stationId') stationId: string,
    @Query('date') date: string,
  ) {
    return this.bookings.availability(stationId, date);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  listMine(@Req() req: { user: { userId: string } }) {
    return this.bookings.listMine(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  getOne(@Req() req: { user: { userId: string } }, @Param('id') id: string) {
    return this.bookings.getOne(req.user.userId, id);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Req() req: { user: { userId: string } }, @Body() dto: CreateBookingDto) {
    return this.bookings.create(req.user.userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/cancel')
  cancel(@Req() req: { user: { userId: string } }, @Param('id') id: string) {
    return this.bookings.cancel(req.user.userId, id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/check-in')
  checkIn(@Req() req: { user: { userId: string } }, @Param('id') id: string) {
    return this.bookings.checkIn(req.user.userId, id);
  }
}
