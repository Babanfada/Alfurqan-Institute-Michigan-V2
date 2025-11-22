import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { BannerService } from './banners.service';
import { CreateBannerDto, UpdateBannerDto } from './dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorators';
import { FileInterceptor } from '@nestjs/platform-express';
@Controller('api/v1/banners')
export class BannersController {
  constructor(private bannerService: BannerService) {}
  //create banners
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Post()
  createBanner(@Body() data: CreateBannerDto) {
    console.log;
    return this.bannerService.createBanner(data);
  }
  //update banners
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Patch(':banner_id')
  updateBanner(
    @Param('banner_id', ParseIntPipe) bannerId: number,
    @Body() data: UpdateBannerDto,
  ) {
    return this.bannerService.updateBanner(bannerId, data);
  }

  //Remove Banner
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Delete(':banner_id')
  removeBanner(@Param('banner_id', ParseIntPipe) bannerId: number) {
    return this.bannerService.removeBanner(bannerId);
  }
  //Get all Banners
  @Get()
  getAll(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.bannerService.getAllBanners(
      Number(page) || 1,
      Number(limit) || 5,
    );
  }
  // upload banner image
  @Post(':banner_id/upload')
  @UseInterceptors(FileInterceptor('image'))
  uploadImage(
    @Param('banner_id', ParseIntPipe) bannerId: number,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.bannerService.uploadBannerImg(bannerId, file);
  }
}
