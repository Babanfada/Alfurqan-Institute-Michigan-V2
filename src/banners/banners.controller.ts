import { Controller, Get } from '@nestjs/common';
import { BannersService } from './banners.service';


@Controller('ap1/v1/banners')
export class BannersController {
  constructor(private bannersService: BannersService) {}
  @Get()
  getAllBanners(){
    return this.bannersService.getAllBanners();
  }

}
