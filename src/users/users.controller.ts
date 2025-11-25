import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  Body,
  UploadedFile,
  UseInterceptors,
  Req,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { UpdateUserDto } from './dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorators';
import { UploadConfig } from 'src/utils/cloudinary.config';

 @UseGuards(JwtAuthGuard)
 @Controller('api/v2/users')
 export class UsersController {
   constructor(private usersService: UsersService) {}

   @UseGuards(RolesGuard)
   @Roles('admin')
   @Get()
   getAllUsers(@Query() query: any) {
     return this.usersService.getAllUsers(query);
   }

   //    @UseGuards(RolesGuard)
   //    @Roles('admin')
   @Get(':user_id')
   getSingleUser(@Param('user_id') user_id: number, @Req() req: any) {
     return this.usersService.getSingleUser(user_id, req.user);
   }

   @Patch(':user_id')
   updateUser(
     @Param('user_id') user_id: number,
     @Body() dto: UpdateUserDto,
     @Req() req: any,
   ) {
     return this.usersService.updateUser(Number(user_id), dto, req.user);
   }

   @Patch(':user_id/upload')
   @UseInterceptors(FileInterceptor('image', UploadConfig))
   uploadAvatar(
     @Param('user_id') user_id: number,
     @UploadedFile() file: Express.Multer.File,
     @Req() req: any,
   ) {
     return this.usersService.uploadAvatar(req.user, file, user_id);
   }

   @Patch(':user_id/subscribe')
   subscribeToEmail(
     @Param('user_id') user_id: number,
     @Body('subscribe') subscribe: boolean,
     @Req() req: any,
   ) {
     return this.usersService.subscribeToEmail(
       Number(user_id),
       req.user,
       subscribe,
     );
   }

   @Patch(':user_id/unsubscribe')
   unSubscribeToEmail(
     @Param('user_id') user_id: number,
     @Body('unSubscribe') unSubscribe: boolean,
     @Req() req: any,
   ) {
     return this.usersService.unSubscribeToEmail(
       Number(user_id),
       req.user,
       unSubscribe,
     );
   }
 }
