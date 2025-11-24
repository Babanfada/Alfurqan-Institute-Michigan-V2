import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateProgrammeRegDto, UpdateProgrammeRegDto } from './dto';

@Injectable()
export class RegisterationsService {
  constructor(private prisma: PrismaService) {}
  async createRegistration(userId: number, dto: CreateProgrammeRegDto) {
    // Check if programme exists
    const programmeData = await this.prisma.programmes.findFirst({
      where: { title: dto.programme },
      select: { programme_id: true },
    });
    if (!programmeData)
      throw new BadRequestException('Invalid programme selected');
    // Extract programme_id
    const { programme_id } = programmeData;
    // Check if user already registered
    const existing = await this.prisma.programme_reg.findFirst({
      where: {
        programme_id: programme_id,
        user_id: userId,
      },
    });
    if (existing)
      throw new BadRequestException(
        'You have already registered for this programme',
      );

    return this.prisma.programme_reg.create({
      data: {
        ...dto,
        programme_id,
        user_id: userId,
      },
    });
  }

  //update reg
  async updateRegistration(
    regId: number,
    userId: number,
    dto: UpdateProgrammeRegDto,
  ) {
    const { programme, discovery_method, category } = dto;

    // Find the registration
    const registration = await this.prisma.programme_reg.findUnique({
      where: { reg_id: regId },
    });

    if (!registration)
      throw new NotFoundException(`Registration ${regId} not found`);

    // Ensure current user owns the registration
    if (registration.user_id !== userId)
      throw new ForbiddenException(
        'Not authorized to update this registration',
      );

    // 1. Get programme_id from the programme title
    const programmeData = await this.prisma.programmes.findFirst({
      where: { title: programme },
      select: { programme_id: true },
    });

    if (!programmeData)
      throw new BadRequestException('Invalid programme selected');

    const { programme_id } = programmeData;

    // 2. Check if user already registered for this programme (prevent duplicates)
    if (programme_id !== registration.programme_id) {
      const duplicate = await this.prisma.programme_reg.findFirst({
        where: {
          user_id: userId,
          programme_id,
        },
      });

      if (duplicate) {
        throw new BadRequestException(
          'You have already registered for this programme',
        );
      }
    }

    // 3. Update registration safely
    return this.prisma.programme_reg.update({
      where: { reg_id: regId },
      data: {
        programme_id,
        programme, // programme name string
        discovery_method,
        category,
      },
    });
  }
  // get user registerations
  async getUserRegistrations(userId: number, page = 1, limit = 5) {
    const skip = (page - 1) * limit;
    const total = await this.prisma.programme_reg.count({
      where: { user_id: userId },
    });
    const registrations = await this.prisma.programme_reg.findMany({
      where: { user_id: userId },
      include: { programmes: { select: { title: true } } },
      skip,
      take: limit,
    });

    return {
      registrations,
      total,
      currentCount: registrations.length,
      numOfPages: Math.ceil(total / limit),
    };
  }
  //get all registerations
  async getAllRegistrations(page = 1, limit = 5, query?: any) {
    const skip = (page - 1) * limit;
    const filters: any = {};

    const fieldsToCheck = {
      user_id: (value: any) => Number(value),
      programme_id: (value: any) => Number(value),
      programme: (value: string) => ({
        contains: value.toLowerCase(),
      }),
      category: (value: string) => {
        if (value === '---') return { in: ['Adult', 'Youth'] };
        if (value) return value;
        return undefined;
      },
    };
    Object.keys(query).forEach((key) => {
      if (fieldsToCheck[key]) {
        const f = fieldsToCheck[key](query[key]);
        if (f !== undefined) filters[key] = f;
      }
    });
    const total = await this.prisma.programme_reg.count({ where: filters });

    const registrations = await this.prisma.programme_reg.findMany({
      where: filters,
      include: {
        programmes: { select: { title: true } },
        users: {
          select: {
            user_id: true,
            first_name: true,
            last_name: true,
            email: true,
            phone: true,
          },
        },
      },
      skip,
      take: limit,
    });

    return {
      registrations,
      total,
      currentCount: registrations.length,
      numOfPages: Math.ceil(total / limit),
    };
  }
  //delete registeration
  async deleteRegistration(regId: number, userId: number, role: string) {
    const registration = await this.prisma.programme_reg.findUnique({
      where: { reg_id: regId },
    });
    if (!registration)
      throw new NotFoundException(`Registration ${regId} not found`);

    const isOwner = registration.user_id === userId;
    const isAdmin = role === 'admin';

    if (!isOwner && !isAdmin) {
      throw new ForbiddenException(
        'Not authorized to delete this registration',
      );
    }
    return { msg: `Registeration with id ${regId} deleted successfully` };
  }
}
