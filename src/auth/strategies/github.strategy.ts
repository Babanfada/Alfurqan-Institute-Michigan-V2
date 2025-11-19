// src/auth/strategies/github.strategy.ts
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import {
  Strategy,
  Profile,
  StrategyOptionsWithRequest,
} from 'passport-github2';
import type { Request } from 'express';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GithubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor(config: ConfigService) {
    const clientID = config.get<string>('GITHUB_CLIENT_ID') ?? '';
    const clientSecret = config.get<string>('GITHUB_CLIENT_SECRET') ?? '';
    const callbackURL = config.get<string>('GITHUB_CALLBACK_URL') ?? '';
    super({
      clientID,
      clientSecret,
      callbackURL,
      scope: ['user:email'],
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
    const name = profile.displayName ?? profile.username ?? '';
    const [firstName, ...rest] = name.split(' ');
    const lastName = rest.join(' ');
    return {
      provider: 'github',
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
