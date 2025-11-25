// src/auth/guards/jwt-auth.guard.ts
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  canActivate(ctx: ExecutionContext) {
    const req = ctx.switchToHttp().getRequest();
    const authHeader = req.headers['authorization'];
    let token: string | undefined;

    if (
      authHeader &&
      typeof authHeader === 'string' &&
      authHeader.startsWith('Bearer ')
    ) {
      token = authHeader.split(' ')[1];
    } else {
      const cookies = req.signedCookies ?? req.cookies;
      token = cookies?.accessToken;
    }

    if (!token)
      throw new UnauthorizedException(
        'No access token or expired, pls refresh or re-login entirely ',
      );

    try {
      const payload = this.jwtService.verify(token, {
        secret: process.env.JWT_ACCESS_TOKEN_SECRET,
      });
      req.user = payload.tokenUser ?? payload;
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired access token');
    }
  }
}
