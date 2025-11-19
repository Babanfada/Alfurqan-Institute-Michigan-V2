import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { MailModule } from 'src/mail/mail.module';
import { FacebookStrategy } from './strategies/facebook.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { GithubStrategy } from './strategies/github.strategy';
import { PassportModule } from '@nestjs/passport';

@Module({
  imports: [MailModule, PassportModule.register({ session: false })], // Import MailModule if not global, // no passport sessions
  controllers: [AuthController],
  providers: [AuthService, FacebookStrategy, GoogleStrategy, GithubStrategy],
})
export class AuthModule {}
