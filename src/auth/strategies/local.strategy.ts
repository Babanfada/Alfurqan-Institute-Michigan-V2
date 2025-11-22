// src/auth/strategies/local.strategy.ts
import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthService } from '../auth.service';
import { LoginDto } from '../dto';
import { validate } from 'class-validator';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy, 'local') {
  constructor(private authService: AuthService) {
    super({
      usernameField: 'email', // defaults to 'username'; we use email
      passwordField: 'password',
      passReqToCallback: false, // no need for req object here
    });
  }

  async validate(email: string, password: string) {
    const dto = new LoginDto();
    dto.email = email;
    dto.password = password;

    const errors = await validate(dto);

    if (errors.length) {
      // Extract all constraint messages
      const messages = errors
        .map((err) => Object.values(err.constraints || {}))
        .flat();

      throw new BadRequestException(messages);
    }

    // AuthService handles user lookup and password verification
    const user = await this.authService.validateUser(email, password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    // Return minimal user info, this will be assigned to req.user
    return user;
  }
}
