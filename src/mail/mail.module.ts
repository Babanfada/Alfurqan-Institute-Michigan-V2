import { Module } from '@nestjs/common';
import { MailService } from './mail.service';

@Module({
  providers: [MailService],
  exports: [MailService], // So other modules (Auth) can use it
})
export class MailModule {}
