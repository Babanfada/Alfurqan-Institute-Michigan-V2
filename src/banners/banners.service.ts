import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class BannersService {
  constructor(private prismaService: PrismaService) {}
  getAllBanners() {
    return { msg: 'all banners' };
  }
}
