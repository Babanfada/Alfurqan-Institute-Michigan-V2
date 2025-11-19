// src/auth/strategies/facebook.strategy.ts
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import {
  Strategy,
  Profile,
  StrategyOptionsWithRequest,
} from 'passport-facebook';
import type { Request } from 'express';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class FacebookStrategy extends PassportStrategy(Strategy, 'facebook') {
  constructor(config: ConfigService) {
    const clientID = config.get<string>('FACEBOOK_CLIENT_ID');
    const clientSecret = config.get<string>('FACEBOOK_CLIENT_SECRET');
    const callbackURL = config.get<string>('FACEBOOK_CALLBACK_URL');
    super({
      clientID,
      clientSecret,
      callbackURL,
      profileFields: ['id', 'emails', 'name', 'displayName', 'photos'],
      passReqToCallback: true,
    } as StrategyOptionsWithRequest);
  }

  async validate(
    req: Request,
    accessToken: string,
    refreshToken: string,
    profile: Profile,
  ) {
    const email = profile.emails?.[0]?.value;
    const firstName = profile.name?.givenName ?? profile.displayName ?? '';
    const lastName = profile.name?.familyName ?? '';
    return {
      provider: 'facebook',
      providerId: profile.id,
      email,
      firstName,
      lastName,
      accessToken,
      refreshToken,
      profile,
    };
  }
}
