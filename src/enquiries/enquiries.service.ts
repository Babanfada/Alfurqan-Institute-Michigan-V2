import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateEnquiriesDto, UpdateEnquiriesDto } from './dto';

@Injectable()
export class EnquiriesService {
  constructor(private prisma: PrismaService) {}
  //Get all Enq

  async getAllEnquiries(query: any) {
    const { name, email, sort } = query;

    // --- FILTERS ---
    const filters: any = {};

    if (name) {
      filters.name = {
        contains: name,
      };
    }

    if (email) {
      filters.email = {
        contains: email,
      };
    }

    // --- PAGINATION ---
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 5;
    const skip = (page - 1) * limit;

    const totalEnq = await this.prisma.enquiries.count({
      where: filters,
    });

    const numOfPages = Math.ceil(totalEnq / limit);

    // --- SORTING ---
    let orderBy: any = {};

    switch (sort) {
      case 'A-Z':
        orderBy = { name: 'asc' };
        break;
      case 'Z-A':
        orderBy = { name: 'desc' };
        break;
      default:
        orderBy = { createdAt: 'desc' }; // latest first
        break;
    }

    // --- FETCH DATA ---
    const enquiries = await this.prisma.enquiries.findMany({
      where: filters,
      orderBy,
      skip,
      take: limit,
    });

    return {
      enquiries,
      totalEnq,
      currentCount: enquiries.length,
      numOfPages,
    };
  }

  // create enquiries
  async createEnq(data: CreateEnquiriesDto) {
    await this.prisma.enquiries.create({
      data,
    });
    return { msg: 'Enq created successfully' };
  }
  // update enquiries
  async updateEnq(enqId: number, data: UpdateEnquiriesDto) {
    const enq = await this.prisma.enquiries.findUnique({
      where: { enq_id: enqId },
    });

    if (!enq) {
      throw new NotFoundException(`No enq found with id ${enqId}`);
    }

    await this.prisma.enquiries.update({
      where: { enq_id: enqId },
      data,
    });

    return { msg: 'enq updated successfully' };
  }

  async removeenq(enqId: number) {
    const Enq = await this.prisma.enquiries.findUnique({
      where: { enq_id: enqId },
    });

    if (!Enq) {
      throw new NotFoundException(`No Enq found with id ${enqId}`);
    }

    await this.prisma.enquiries.delete({
      where: { enq_id: enqId },
    });

    return {
      msg: `Enq with id ${enqId} has been deleted successfully`,
    };
  }
}
