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
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { Roles } from 'src/common/decorators/roles.decorators';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import {
  CreateProgrammeDto,
  UpdateProgrammeDto,
  UpdateProgrammeOutcomesDto,
} from './dto';
import { ProgrammesService } from './programmes.service';
import { FilesInterceptor } from '@nestjs/platform-express';
import { UploadConfig } from 'src/utils/cloudinary.config';

@Controller('api/v2/programmes')
export class ProgrammesController {
  constructor(private programmesService: ProgrammesService) {}
  //create Programme
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Post()
  createProgramme(@Body() data: CreateProgrammeDto) {
    return this.programmesService.createProgramme(data);
  }

  //update Programme
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Patch(':programme_id')
  updateEvent(
    @Param('programme_id', ParseIntPipe) programmeId: number,
    @Body() data: UpdateProgrammeDto,
  ) {
    return this.programmesService.updateProgramme(programmeId, data);
  }

  //update Programme Outcomes
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Patch(':programme_id/outcome')
  updateProgrammeOut(
    @Param('programme_id', ParseIntPipe) programmeId: number,
    @Body() data: UpdateProgrammeOutcomesDto,
  ) {
    return this.programmesService.updateProgrammeOut(programmeId, data);
  }

  // upload programmes images
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Patch(':programme_id/upload')
  @UseInterceptors(FilesInterceptor('images', 3, UploadConfig)) // 'images' = field name in the form, 3 = max files
  uploadImages(
    @Param('programme_id', ParseIntPipe) programmeId: number,
    @UploadedFiles() files: Express.Multer.File[], // notice the array
  ) {
    return this.programmesService.uploadProgrammeImages(programmeId, files);
  }

  //remove programme
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Delete(':programme_id')
  async deleteProgramme(
    @Param('programme_id', ParseIntPipe) programmeId: number,
  ) {
    return this.programmesService.removeProgramme(programmeId);
  }
  // get all programmes
  @Get()
  getAllProgrammes(@Query() query: any) {
    return this.programmesService.getAllProgrammes(query);
  }
  // get all programmes Title
  @Get('title')
  getAllProgrammesTitle() {
    return this.programmesService.getAllProgrammesTitle();
  }
  // get single programme
  @Get(':programme_id')
  getSingleProgramme(@Param('programme_id', ParseIntPipe) programmeId: number) {
    return this.programmesService.getSingleProgramme(programmeId);
  }
}
