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
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { CreateProgrammeRegDto, UpdateProgrammeRegDto } from './dto';
import { RegisterationsService } from './registerations.service';
import { Roles } from 'src/common/decorators/roles.decorators';
import { RolesGuard } from 'src/common/guards/roles.guard';
import {
  programme_reg_category,
  programme_reg_discovery_method,
} from '@prisma/client';
@Controller('api/v2/registerations')
export class RegisterationsController {
  constructor(private registerationsService: RegisterationsService) {}
  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Req() req, @Body() dto: CreateProgrammeRegDto) {
    return this.registerationsService.createRegistration(req.user.user_id, dto);
  }
  //update reg
  @UseGuards(JwtAuthGuard)
  @Patch(':reg_id')
  async update(
    @Req() req,
    @Param('reg_id', ParseIntPipe) regId: number,
    @Body() dto: UpdateProgrammeRegDto,
  ) {
    return this.registerationsService.updateRegistration(
      regId,
      req.user.user_id,
      dto,
    );
  }
  // get user registeration
  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMyRegistrations(
    @Req() req,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.registerationsService.getUserRegistrations(
      req.user.user_id,
      page,
      limit,
    );
  }
  //delete registeration
  @UseGuards(JwtAuthGuard)
  @Delete(':reg_id')
  async delete(@Req() req, @Param('reg_id', ParseIntPipe) regId: number) {
    return this.registerationsService.deleteRegistration(
      regId,
      req.user.user_id,
      req.user.role,
    );
  }
  //get all registeration
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async getAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query() query?: any,
  ) {
    return this.registerationsService.getAllRegistrations(page, limit, query);
  }
}
