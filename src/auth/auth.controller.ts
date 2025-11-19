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

@Controller('api/v1/authentication')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * User login route
   * Accepts email and password from the request body
   * Collects user-agent and IP for session management
   */
  @Post('login')
  login(
    @Body() body: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const userAgent = req.headers['user-agent'] || '';
    const ip =
      (req.headers['x-forwarded-for'] as string) ||
      req.ip ||
      req.socket.remoteAddress;
    return this.authService.login(body, userAgent, ip, req, res);
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
