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
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { Roles } from 'src/common/decorators/roles.decorators';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadConfig } from 'src/utils/cloudinary.config';
import { EventsService } from './events.service';
import { CreateEventDto, UpdateEventDto } from './dto';
@Controller('api/v2/events')
export class EventsController {
  constructor(private eventsService: EventsService) {}
  //create Event
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Post()
  createEvent(@Body() data: CreateEventDto) {
    return this.eventsService.createEvent(data);
  }
  //update Event
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Patch(':event_id')
  updateEvent(
    @Param('event_id', ParseIntPipe) eventId: number,
    @Body() data: UpdateEventDto,
  ) {
    return this.eventsService.updateEvent(eventId, data);
  }

  //Remove event
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Delete(':event_id')
  removeevent(@Param('event_id', ParseIntPipe) eventId: number) {
    return this.eventsService.removeEvent(eventId);
  }
  //Get all Event
  @Get()
  getAll(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.eventsService.getAllEvent(
      Number(page) || 1,
      Number(limit) || 5,
    );
  }
  // upload event image
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Patch(':event_id/upload')
  @UseInterceptors(FileInterceptor('image', UploadConfig))
  uploadImage(
    @Param('event_id', ParseIntPipe) eventId: number,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.eventsService.uploadEventImg(eventId, file);
  }
}
