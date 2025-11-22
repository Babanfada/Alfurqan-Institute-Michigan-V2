import { Module } from '@nestjs/common';
import { BannersController } from './banners.controller';
import { BannerService } from './banners.service';

@Module({
  controllers: [BannersController],
  providers: [BannerService]
})
export class BannersModule {}
