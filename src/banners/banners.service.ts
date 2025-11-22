import { PrismaService } from 'src/prisma/prisma.service';
import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
//import { v2 as cloudinary } from 'cloudinary';
import * as fs from 'fs';
import { CreateBannerDto, UpdateBannerDto } from './dto';
import cloudinary from 'src/utils/cloudinary.config';
import { Express } from 'express';
@Injectable()
export class BannerService {
  constructor(private prisma: PrismaService) {}
  //Get all Banners
  async getAllBanners(page = 1, limit = 5) {
    const totalBanners = await this.prisma.banner.count();
    const offset = (page - 1) * limit;

    const banners = await this.prisma.banner.findMany({
      skip: offset,
      take: limit,
    });

    return {
      banners,
      currentCount: banners.length,
      numOfPages: Math.ceil(totalBanners / limit),
      totalBanners,
    };
  }
  // create banners
  async createBanner(data: CreateBannerDto) {
    await this.prisma.banner.create({
      data,
    });
    return { msg: 'Banner created successfully' };
  }
  // update banners
  async updateBanner(bannerId: number, data: UpdateBannerDto) {
    const banner = await this.prisma.banner.findUnique({
      where: { banner_id: bannerId },
    });

    if (!banner) {
      throw new NotFoundException(`No banner found with id ${bannerId}`);
    }

    await this.prisma.banner.update({
      where: { banner_id: bannerId },
      data,
    });

    return { msg: 'Banner updated successfully' };
  }

  async removeBanner(bannerId: number) {
    const banner = await this.prisma.banner.findUnique({
      where: { banner_id: bannerId },
    });

    if (!banner) {
      throw new NotFoundException(`No banner found with id ${bannerId}`);
    }

    await this.prisma.banner.delete({
      where: { banner_id: bannerId },
    });

    return { msg: `Banner with id ${bannerId} has been deleted successfully` };
  }

  //upload banner image
  async uploadBannerImg(bannerId: number, file: Express.Multer.File) {
    if (!file) throw new BadRequestException('Please upload an image');

    if (!file.mimetype.startsWith('image')) {
      throw new BadRequestException('Only images are allowed');
    }

    const maxSize = 2000 * 3000;
    if (file.size > maxSize) {
      throw new BadRequestException('Image should not exceed 18MB');
    }

    const banner = await this.prisma.banner.findUnique({
      where: { banner_id: bannerId },
    });

    if (!banner) {
      throw new NotFoundException(
        `Banner with id ${bannerId} does not exist, create banner first!`,
      );
    }

    // Delete existing image from Cloudinary
    if (banner.image_public_id) {
      await cloudinary.uploader.destroy(banner.image_public_id);
    }

    // Upload new image
    const result = await cloudinary.uploader.upload(file.path, {
      use_filename: true,
      folder: 'AIM Banner Images',
    });

    // 2. Update DB
    const updatedBanner = await this.prisma.banner.update({
      where: { banner_id: bannerId },
      data: {
        image: result.secure_url,
        image_public_id: result.public_id,
      },
    });

    // 3. Delete temp file
    fs.unlinkSync(file.path);

    // 4. Return response exactly like your Express code
    return {
      image: {
        src: result.secure_url,
      },
      banner: updatedBanner,
    };
  }
}
