import { Module } from '@nestjs/common';
import { RegisterationsService } from './registerations.service';
import { RegisterationsController } from './registerations.controller';

@Module({
  providers: [RegisterationsService],
  controllers: [RegisterationsController]
})
export class RegisterationsModule {}
