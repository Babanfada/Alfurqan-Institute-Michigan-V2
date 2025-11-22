import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  ForgotPasswordDto,
  LoginDto,
  RegisterDto,
  ResetPasswordDto,
  UpdatePasswordDto,
  VerifyEmailDto,
} from './dto';
import type { Request, Response } from 'express';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { GetUser } from './decorators/get-user.decorator';
import { AuthGuard } from '@nestjs/passport';

@Controller('api/v1/authentication')
export class AuthController {
  constructor(private readonly authService: AuthService) {}
  // Redirect to Google
  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth() {
    // initiates the OAuth2 flow
  }

  // Google callback
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    // req.user contains the object returned from GoogleStrategy.validate
    const profile = req.user as any;
    return this.authService.socialLogin(profile, req, res);
  }

  // Twitter
  // STEP 1: Redirect user to Twitter OAuth page
  @Get('twitter')
  @UseGuards(AuthGuard('twitter'))
  async twitterLogin() {
    // Passport handles redirect
  }

  // STEP 2: Twitter sends user back to callback URL
  @Get('twitter/callback')
  @UseGuards(AuthGuard('twitter'))
  async twitterCallback(@Req() req, @Res() res: Response) {
    console.log(req.user);
    const { profile } = req.user;
    return this.authService.socialLogin(profile, req, res);
  }

  // GitHub
  @Get('github')
  @UseGuards(AuthGuard('github'))
  githubAuth() {}

  @Get('github/callback')
  @UseGuards(AuthGuard('github'))
  async githubAuthRedirect(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    //console.log(req.user);
    const profile = req.user as any;
    return this.authService.socialLogin(profile, req, res);
  }

  // Facebook
  @Get('facebook')
  @UseGuards(AuthGuard('facebook'))
  facebookAuth() {}

  @Get('facebook/callback')
  @UseGuards(AuthGuard('facebook'))
  async facebookAuthRedirect(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const profile = req.user as any;
    return this.authService.socialLogin(profile, req, res);
  }
  /**
   * User login route
   * Accepts email and password from the request body
   * Collects user-agent and IP for session management
   */
  @UseGuards(AuthGuard('local'))
  @Post('login')
  async login(@Req() req, @Res({ passthrough: true }) res: Response) {
    // req.user comes from validate() in LocalStrategy
    const userAgent = req.headers['user-agent'] || '';
    const ip =
      (req.headers['x-forwarded-for'] as string) ||
      req.ip ||
      req.socket.remoteAddress;
    const { tokenUser, user } = req.user;
    return this.authService.setTokensAndCookies({
      user,
      res,
      ip,
      userAgent,
      tokenUser,
    });
  }
  /**
   * Refresh access and refresh tokens using the refresh token cookie
   * This allows maintaining user session without requiring login again
   */
  @Post('refresh')
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.authService.refreshTokens(req, res);
  }

  /**
   * Protected route to get the currently authenticated user
   * Requires a valid access token
   */
  @UseGuards(JwtAuthGuard)
  @Get('showme')
  async showMe(@GetUser() user: any) {
    return user;
  }

  /**
   * User logout route
   * Invalidates tokens and clears cookies
   */
  @Delete('logout')
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    return this.authService.logout(req, res);
  }

  /**
   * User registration route
   * Typically triggers email verification flow
   */
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() body: RegisterDto) {
    return this.authService.register(body);
  }
  /**
   * User verify-email route
   */
  @Post('verify-email')
  verifyEmail(@Body() body: VerifyEmailDto) {
    return this.authService.verifyEmail(body);
  }
  /**
   * forgot password route
   */
  @Post('forgotpassword')
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }
  /**
   * reset password route
   */
  @Patch('resetpassword')
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }
  /**
   * reset password route
   */
  @UseGuards(JwtAuthGuard)
  @Patch('updatepassword')
  updatePassword(@Req() req: any, @Body() dto: UpdatePasswordDto) {
    return this.authService.updatePassword(req.user.user_id, dto);
  }
}
