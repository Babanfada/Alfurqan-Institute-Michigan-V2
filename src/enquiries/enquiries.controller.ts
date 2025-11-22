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
  UseGuards,
} from '@nestjs/common';
import { EnquiriesService } from './enquiries.service';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorators';
import { CreateEnquiriesDto, UpdateEnquiriesDto } from './dto';

@Controller('api/v2/enquiries')
export class EnquiriesController {
  constructor(private readonly enquiriesService: EnquiriesService) {}
  // get all enq
  @Get()
  async getAllEnq(@Query() query: any) {
    return this.enquiriesService.getAllEnquiries(query);
  }

  //create ENQ
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Post()
  createEnq(@Body() data: CreateEnquiriesDto) {
    return this.enquiriesService.createEnq(data);
  }
  //update ENQ
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Patch(':enq_id')
  updateEnq(
    @Param('enq_id', ParseIntPipe) enqId: number,
    @Body() data: UpdateEnquiriesDto,
  ) {
    return this.enquiriesService.updateEnq(enqId, data);
  }

  //Remove ENQ
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Delete(':enq_id')
  removeEnq(@Param('enq_id', ParseIntPipe) enqId: number) {
    return this.enquiriesService.removeenq(enqId);
  }
}
