import { Controller, Get, Param, Query } from '@nestjs/common';
import { KitchensService } from './kitchens.service';

@Controller('kitchens')
export class KitchensController {
  constructor(private kitchens: KitchensService) {}

  @Get()
  list(
    @Query('city') city?: string,
    @Query('equipment') equipment?: string,
    @Query('maxPrice') maxPrice?: string,
    @Query('q') q?: string,
  ) {
    return this.kitchens.list({
      city,
      equipment,
      maxPriceCents: maxPrice ? Math.round(Number(maxPrice) * 100) : undefined,
      q,
    });
  }

  @Get('meta/equipment')
  equipment() {
    return this.kitchens.listEquipment();
  }

  @Get(':slug')
  get(@Param('slug') slug: string) {
    return this.kitchens.getBySlug(slug);
  }
}
