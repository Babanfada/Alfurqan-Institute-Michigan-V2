import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-twitter-oauth2';
//import { AuthService } from '../auth.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class TwitterStrategy extends PassportStrategy(Strategy, 'twitter') {
  constructor(
    // private authService: AuthService,
    config: ConfigService,
  ) {
    const clientID = config.get<string>('TWITTER_CLIENT_ID') ?? '';
    const clientSecret = config.get<string>('TWITTER_CLIENT_SECRET') ?? '';
    const callbackURL = config.get<string>('TWITTER_CALLBACK_URL') ?? '';
    super({
      clientID,
      clientSecret,
      callbackURL,
      //scope: ['tweet.read', 'users.read', 'offline.access', 'email'],
      // request user's email
      //includeEmail: true,
      authorizationURL: 'https://twitter.com/i/oauth2/authorize',
      tokenURL: 'https://api.twitter.com/2/oauth2/token',
      scope: ['tweet.read', 'users.read', 'offline.access'],
      //state: true,
    });
  }

  //   async validate(
  //     accessToken: string,
  //     refreshToken: string,
  //     profile: any,
  //     done: Function,
  //   ) {
  //     const { id, username, emails, photos } = profile;

  //     const userData = {
  //       provider: 'twitter',
  //       providerId: id,
  //       email: emails?.[0]?.value,
  //       username,
  //       avatar: photos?.[0]?.value,
  //       accessToken,
  //       refreshToken
  //     };

  //     // Your logic: find or create user + return app tokens
  //     //const user = await this.authService.handleSocialLogin(userData);

  //     return done(null, userData);
  //   }
  //   async validate(accessToken: string, refreshToken: string, profile: any) {
  //     return { accessToken, refreshToken, profile };
  //   }
  async validate(accessToken: string, refreshToken: string, profile:any) {
    // console.log(accessToken);
    // const profile = await fetch('https://api.twitter.com/2/users/me', {
    //   headers: {
    //     Authorization: `Bearer ${accessToken}`,
    //   },
    // }).then((r) => r.json());

    return { accessToken, refreshToken, profile };
  }
}
