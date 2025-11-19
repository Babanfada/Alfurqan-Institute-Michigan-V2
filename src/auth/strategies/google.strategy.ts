// src/auth/strategies/google.strategy.ts
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import {
  Strategy,
  Profile,
  StrategyOptionsWithRequest,
} from 'passport-google-oauth20';
//import { Strategy, StrategyOptionsWithRequest } from 'passport-google-oauth20';
import type { Request } from 'express';
import { ConfigService } from '@nestjs/config';
@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(config: ConfigService) {
    const clientID = config.get<string>('GOOGLE_CLIENT_ID') ?? '';
    const clientSecret = config.get<string>('GOOGLE_CLIENT_SECRET') ?? '';
    const callbackURL = config.get<string>('GOOGLE_CALLBACK_URL') ?? '';
    super({
      clientID,
      clientSecret,
      callbackURL,
      scope: ['email', 'profile'],
      passReqToCallback: true,
    } as StrategyOptionsWithRequest);
  }

  // called by passport after Google authenticates the user
  async validate(
    req: Request,
    accessToken: string,
    refreshToken: string,
    profile: Profile,
  ) {
    const email = profile.emails?.[0]?.value;
    const firstName = profile.name?.givenName ?? profile.displayName ?? '';
    const lastName = profile.name?.familyName ?? '';

    // return a minimal object that will be available in the controller via req.user
    return {
      provider: 'google',
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
// always generate your own JWT for your application, regardless of the login method. 
//The tokens returned from validate() are just profile info from the provider;
// your app’s session is still managed with your own JWT.
