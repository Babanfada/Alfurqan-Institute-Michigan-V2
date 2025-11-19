import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  /**
   * Blacklist / Activate user and invalidate / validate their login token
   */
  async setBlacklistStatus(
    userId: number,
    blacklist: boolean,
    isValid: boolean,
  ) {
    // Find user
    const user = await this.prisma.users.findUnique({
      where: { user_id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Find token row
    const userToken = await this.prisma.token.findFirst({
      where: { user: userId },
    });

    if (!userToken) {
      throw new NotFoundException('User does not have an active login session');
    }

    // Update user
    const updatedUser = await this.prisma.users.update({
      where: { user_id: userId },
      data: {
        blacklisted: blacklist,
      },
    });

    // Update token validity
    await this.prisma.token.update({
      where: { token_id: userToken.token_id },
      data: {
        isValid,
      },
    });

    // Return appropriate response message
    if (blacklist && !isValid) {
      return {
        msg: `${updatedUser.first_name} ${updatedUser.last_name} has been blacklisted`,
      };
    }

    return {
      msg: `${updatedUser.first_name} ${updatedUser.last_name} has been activated`,
    };
  }
}
