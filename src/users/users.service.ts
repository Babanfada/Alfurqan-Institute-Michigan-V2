import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import cloudinary from 'src/utils/cloudinary.config';
import { UpdateUserDto } from './dto';
import * as fs from 'fs';
@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  // ---------------------------------------------------
  //  GET ALL USERS (filters + sorting + pagination)
  // ---------------------------------------------------
  async getAllUsers(query: any) {
    const {
      page = 1,
      limit = 5,
      fields,
      sort,
      last_name,
      email,
      phone,
      gender,
      isVerified,
      blacklisted,
      notification,
    } = query;

    // ---------------- FILTERS ----------------
    const filters: any = {};

    if (last_name) filters.last_name = { contains: last_name };

    if (email) filters.email = { contains: email };

    if (phone) filters.phone = { contains: phone };

    if (gender && gender !== '---') filters.gender = gender;

    if (isVerified && isVerified !== '---')
      filters.isVerified = isVerified === 'true';

    if (blacklisted && blacklisted !== '---')
      filters.blacklisted = blacklisted === 'true';

    if (notification && notification !== '---')
      filters.notification = notification === 'true';

    // ---------------- PAGINATION ----------------
    const take = Number(limit);
    const skip = (Number(page) - 1) * take;

    const totalUsers = await this.prisma.users.count();

    // ---------------- SORTING ----------------
    let orderBy: any = {};

    switch (sort) {
      case 'female':
        orderBy = { gender: 'desc' };
        break;
      case 'male':
        orderBy = { gender: 'asc' };
        break;
      case 'A-Z':
        orderBy = { last_name: 'asc' };
        break;
      case 'Z-A':
        orderBy = { last_name: 'desc' };
        break;
      case 'admin':
        orderBy = { role: 'asc' };
        break;
      default:
        orderBy = { createdAt: 'asc' };
    }

    // ---------------- SELECT FIELDS ----------------
    let select: any = undefined;

    if (fields) {
      const split = fields.split(',');
      select = { user_id: true };
      split.forEach((f) => (select[f] = true));
    } else {
      select = {
        user_id: true,
        first_name: true,
        last_name: true,
        user_name: true,
        email: true,
        role: true,
        phone: true,
        image: true,
        gender: true,
        address: true,
        city: true,
        state: true,
        country: true,
        notification: true,
        blacklisted: true,
        verificationString: true,
        isVerified: true,
        verified: true,
      };
    }

    // ---------------- MAIN QUERY ----------------
    const users = await this.prisma.users.findMany({
      where: filters,
      take,
      skip,
      orderBy,
      select,
    });

    // -------- COUNTS --------
    const genderCount = await this.prisma.users.groupBy({
      by: ['gender'],
      _count: { user_id: true },
    });

    const verificationCount = await this.prisma.users.groupBy({
      by: ['isVerified'],
      _count: { user_id: true },
    });

    return {
      users,
      totalUsers,
      count: users.length,
      numOfPages: Math.ceil(totalUsers / take),
      genderCount,
      verificationCount,
    };
  }

  // ---------------------------------------------------
  //  GET SINGLE USER
  // ---------------------------------------------------
  async getSingleUser(user_id: number, reqUser: any) {
    const user = await this.prisma.users.findUnique({
      where: { user_id },
      select: {
        password: false,
        blacklisted: false,
        verificationString: false,
        isVerified: false,
        verified: false,
        passwordToken: false,
        passwordExpirationDate: false,
        createdAt: false,
        updatedAt: false,
        first_name: true,
        last_name: true,
        email: true,
        phone: true,
        address: true,
        city: true,
        state: true,
        country: true,
        gender: true,
        image: true,
        user_id: true,
      },
    });

    if (!user) throw new NotFoundException(`User ${user_id} not found`);

    if (reqUser.role !== 'admin' && reqUser.user_id !== Number(user_id)) {
      throw new ForbiddenException('Not allowed');
    }

    return { user };
  }

  // ---------------------------------------------------
  //  UPDATE USER
  // ---------------------------------------------------
  async updateUser(user_id: number, dto: UpdateUserDto, reqUser: any) {
    const user = await this.prisma.users.findUnique({
      where: { user_id },
    });

    if (!user) throw new NotFoundException('User not found');

    if (reqUser.role !== 'admin' && reqUser.user_id !== Number(user_id)) {
      throw new ForbiddenException('Not allowed');
    }

    await this.prisma.users.update({
      where: { user_id },
      data: dto,
    });

    return {
      msg: `user records with  ${user_id} has been updated successfully`,
    };
  }

  // ---------------------------------------------------
  //  UPLOAD AVATAR
  // ---------------------------------------------------
  async uploadAvatar(reqUser: any, file: Express.Multer.File, user_id) {
    if (!file) throw new BadRequestException('No image uploaded');

    const user = await this.prisma.users.findUnique({
      where: { user_id: reqUser.user_id },
    });

    if (!user)
      throw new NotFoundException(
        `User ${reqUser.user_id} does not exist. Complete registration first`,
      );

    if (reqUser.role !== 'admin' && reqUser.user_id !== Number(user_id)) {
      throw new ForbiddenException('Not allowed');
    }
    // Delete old image if exists
    if (user.img_public_id) {
      await cloudinary.uploader.destroy(user.img_public_id);
    }

    const uploaded = await cloudinary.uploader.upload(file.path, {
      use_filename: true,
      folder: 'AIM users Images',
    });

    await this.prisma.users.update({
      where: { user_id: reqUser.user_id },
      data: {
        image: uploaded.secure_url,
        img_public_id: uploaded.public_id,
      },
    });
    // 3. Delete temp file
    fs.unlinkSync(file.path);

    return {
      image: { src: uploaded.secure_url },
    };
  }

  // ---------------------------------------------------
  //  SUBSCRIBE TO EMAIL
  // ---------------------------------------------------
  async subscribeToEmail(user_id: number, reqUser: any, subscribe: boolean) {
    if (subscribe !== true)
      throw new BadRequestException('Click on the mail icon first');

    const user = await this.prisma.users.findUnique({ where: { user_id } });

    if (!user) throw new NotFoundException('User not found');

    if (reqUser.role !== 'admin' && reqUser.user_id !== Number(user_id)) {
      throw new ForbiddenException('Not allowed');
    }

    await this.prisma.users.update({
      where: { user_id },
      data: { notification: true },
    });

    return { msg: `${user.last_name} subscribed to notifications` };
  }

  // ---------------------------------------------------
  //  UNSUBSCRIBE FROM EMAIL
  // ---------------------------------------------------
  async unSubscribeToEmail(
    user_id: number,
    reqUser: any,
    unSubscribe: boolean,
  ) {
    if (unSubscribe !== true)
      throw new BadRequestException('subscription status is not true');

    const user = await this.prisma.users.findUnique({ where: { user_id } });

    if (!user) throw new NotFoundException('User not found');

    if (reqUser.role !== 'admin' && reqUser.user_id !== Number(user_id)) {
      throw new ForbiddenException('Not allowed');
    }

    await this.prisma.users.update({
      where: { user_id },
      data: { notification: false },
    });

    return { msg: `${user.last_name} removed from notifications` };
  }
}
