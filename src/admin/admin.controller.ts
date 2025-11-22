import { Controller, Param, Patch, Body, ParseIntPipe, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { Roles } from 'src/common/decorators/roles.decorators';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';

@Controller('api/v2/admin')
export class AdminController {
  constructor(private adminService: AdminService) {}

  // PATCH /admin/blacklist/:id
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Patch('blacklist/:id')
  async blacklistUser(
    @Param('id', ParseIntPipe) userId: number,
    @Body()
    body: {
      blacklist: boolean;
      isValid: boolean;
    },
  ) {
    return this.adminService.setBlacklistStatus(
      userId,
      body.blacklist,
      body.isValid,
    );
  }
}
