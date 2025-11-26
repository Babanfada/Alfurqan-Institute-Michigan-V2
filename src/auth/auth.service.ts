import {
  BadRequestException,
  Get,
  Injectable,
  NotFoundException,
  UseGuards,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import * as argon2 from 'argon2';
import * as bcrypt from 'bcrypt';
import { UnauthorizedException } from '@nestjs/common';
import * as crypto from 'crypto';
import {
  attachResponseToCookie,
  clearAuthCookies,
  ACCESS_COOKIE_NAME,
  REFRESH_COOKIE_NAME,
} from 'src/utils/cookie';
import type { Request, Response } from 'express';
import {
  ForgotPasswordDto,
  LoginDto,
  RegisterDto,
  ResetPasswordDto,
  UpdatePasswordDto,
  VerifyEmailDto,
} from './dto';
import { JwtService } from '@nestjs/jwt';
import { MailService } from 'src/mail/mail.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private mailservice: MailService,
    private config: ConfigService,
  ) {}
  private createAccessToken(tokenUser: any) {
    return this.jwtService.sign(
      { tokenUser },
      {
        secret: this.config.get<string>('JWT_ACCESS_TOKEN_SECRET'),
        expiresIn: this.config.get<number>('ACCESS_TOKEN_EXPIRES_IN'),
      },
    );
  }
  private createRefreshToken(tokenUser: any) {
    // We will store a random opaque refresh token in DB, not a JWT (you may also use signed JWT)
    return crypto.randomBytes(40).toString('hex');
  }

  // Called on successful login
  async setTokensAndCookies({
    user,
    tokenUser,
    res,
    ip,
    userAgent,
  }: {
    user: any;
    tokenUser: any;
    res: Response;
    ip: string;
    userAgent: any;
  }) {
    // create short lived access token (JWT)
    const accessToken = this.createAccessToken(tokenUser);
    // create or reuse refresh token stored in DB (opaque token)
    let refreshToken = '';
    const existing = await this.prisma.token.findFirst({
      where: { user: user.user_id },
    });

    if (existing && existing.isValid) {
      refreshToken = existing.refreshToken;
    } else {
      refreshToken = this.createRefreshToken(tokenUser);
      await this.prisma.token.create({
        data: {
          refreshToken,
          isValid: true,
          userAgent,
          ip,
          user: user.user_id,
        },
      });
    }
    // Attach as secure HttpOnly signed cookies
    attachResponseToCookie({
      res,
      accessToken,
      refreshToken,
      accessMaxAgeMs: 1000 * 60 * 15, // 15 minutes
      refreshMaxAgeMs: 1000 * 60 * 60 * 24 * 7, // 7 days
    });
    // return tokens and user
    return { msg: 'Login successful', user: tokenUser, accessToken };
  }

  // Login (use argon2 verify before calling setTokensAndCookies)

  async validateUser(email: string, password: string) {
    const user = await this.prisma.users.findUnique({
      where: { email },
      include: { socialaccount: true },
    });
    if (!user) throw new UnauthorizedException('Invalid credentials');
    // ⛔ BLOCK local login for pure-social users
    if (user.socialaccount.length > 0) {
      // They have a social account linked
      // But did they ever set their own password?
      // If not, reject local login
      async function verifyAnyHash(
        hashed: string,
        password: string,
      ): Promise<boolean> {
        // Try Argon2 first
        try {
          const ok = await argon2.verify(hashed, password);
          if (ok) return true;
        } catch (_) {}

        // Fallback to bcrypt
        try {
          const ok = await bcrypt.compare(password, hashed);
          if (ok) return true;
        } catch (_) {}

        return false;
      }
      const isPasswordValid = await verifyAnyHash(user.password, password);

      // Or simply: do not allow local login at all unless they manually reset password
      if (!isPasswordValid) {
        throw new UnauthorizedException(
          'This account was created with social login. Please sign in with Google or reset your password.',
        );
      }
    }
    let isPasswordCorrect = false;
    // Check the type of hash stored in DB
    if (user.password.startsWith('$2')) {
      // 👉 bcrypt hash
      isPasswordCorrect = await bcrypt.compare(password, user.password);
    } else {
      // 👉 argon2 hash
      isPasswordCorrect = await argon2.verify(user.password, password);
    }

    if (!isPasswordCorrect) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isVerified) throw new UnauthorizedException('Email not verified');
    if (user.blacklisted) throw new UnauthorizedException('User banned');

    // 4️⃣ Prepare JWT payload
    const tokenUser = {
      user_id: user.user_id,
      firsttName: user.first_name,
      email: user.email,
      role: user.role,
      address: user.address,
      image: user.image,
      phone: user.phone,
      gender: user.gender,
      emailNotification: user.notification,
    };
    return {
      user,
      tokenUser,
    };
  }

  // Refresh endpoint logic
  async refreshTokens(req: Request, res: Response) {
    const cookies = req.signedCookies ?? req.cookies;
    const refreshToken = cookies?.[REFRESH_COOKIE_NAME];
    if (!refreshToken) throw new UnauthorizedException('No refresh token');

    // find DB record
    const tokenRec = await this.prisma.token.findFirst({
      where: { refreshToken },
      include: { users: true },
    });

    if (!tokenRec || !tokenRec.isValid) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const user = tokenRec.users;
    const tokenUser = {
      user_id: user?.user_id,
      firsttName: user?.first_name,
      email: user?.email,
      role: user?.role,
      address: user?.address,
      image: user?.image,
      phone: user?.phone,
      gender: user?.gender,
      emailNotification: user?.notification,
    };
    // Optionally rotate refresh token: create a new opaque token and invalidate old one
    const newRefreshToken = this.createRefreshToken(tokenUser);
    await this.prisma.token.update({
      where: { token_id: tokenRec.token_id },
      data: { refreshToken: newRefreshToken, updatedAt: new Date() },
    });

    // create new access token
    const accessToken = this.createAccessToken(tokenUser);

    // attach refreshed cookies (overwrite)
    attachResponseToCookie({
      res,
      accessToken,
      refreshToken: newRefreshToken,
      accessMaxAgeMs: 1000 * 60 * 15,
      refreshMaxAgeMs: 1000 * 60 * 60 * 24 * 7,
    });

    return { msg: 'new access token created', accessToken, tokenUser };
    // return { msg: tokenRec.users?.user_id };
  }
  // src/auth/auth.service.ts (add method)
  async socialLogin(profile: any, req: Request, res: Response) {
    const { provider, providerId, email, firstName, lastName } = profile;

    // 1. Try find by providerId OR email
    let user = await this.prisma.users.findFirst({
      where: {
        OR: [{ socialaccount: { some: { provider, providerId } } }, { email }],
      },
      include: { socialaccount: true },
    });

    // 2. If user exists but provider not linked -> link it
    if (user && !user.socialaccount.some((sa) => sa.provider === provider)) {
      await this.prisma.socialaccount.create({
        data: {
          provider,
          providerId,
          users: { connect: { user_id: user.user_id } }, // <-- FIXED
        },
      });
    }

    // 3. If no user -> create one + attach socialaccount
    async function generateUniquePhone(prisma) {
      while (true) {
        const phone = '070' + Math.floor(10000000 + Math.random() * 90000000);

        const exists = await prisma.users.findUnique({
          where: { phone },
        });

        if (!exists) return phone;
      }
    }

    if (!user) {
      const phone = await generateUniquePhone(this.prisma);
      const hashedPassword = await argon2.hash(
        crypto.randomBytes(16).toString('hex'),
      );
      user = await this.prisma.users.create({
        data: {
          first_name: firstName ?? '',
          last_name: lastName ?? '',
          email,
          isVerified: true,
          verified: new Date(),
          role: 'user',
          password: hashedPassword,
          phone,
          socialaccount: {
            // <-- FIXED
            create: [
              {
                provider,
                providerId,
              },
            ],
          },
        },
        include: { socialaccount: true },
      });
    }

    // SAFETY GUARD
    if (!user) throw new Error('User creation failed');

    // 4. Build token payload
    const tokenUser = {
      user_id: user.user_id,
      firsttName: user.first_name,
      email: user.email,
      role: user.role,
      address: user.address,
      image: user.image,
      phone: user.phone,
      gender: user.gender,
      emailNotification: user.notification,
    };
    // 5. Issue tokens
    return this.setTokensAndCookies({
      user,
      tokenUser,
      res,
      ip: req.ip ?? '', // <-- FIXED
      userAgent: req.headers['user-agent'] ?? '',
    });
  }

  async register(body: RegisterDto) {
    const {
      first_name,
      last_name,
      email,
      password,
      phone,
      gender,
      address,
      city,
      state,
      country,
    } = body;

    // 2️⃣ Check if email is already registered
    const existingUser = await this.prisma.users.findUnique({
      where: { email },
    });
    if (existingUser) {
      throw new BadRequestException('This email has already been registered');
    }

    // 3️⃣ Determine role (first user is admin)
    const userCount = await this.prisma.users.count();
    const role = userCount === 0 ? 'admin' : 'user';

    // 4️⃣ Hash password with argon2
    const hashedPassword = await argon2.hash(password);

    // 5️⃣ Generate verification string
    const verificationString = crypto.randomBytes(40).toString('hex');

    // 6️⃣ Create user in DB
    const user = await this.prisma.users.create({
      data: {
        first_name,
        last_name,
        email,
        password: hashedPassword,
        phone,
        gender,
        address,
        city,
        state,
        country,
        role,
        verificationString,
      },
    });

    // 7️⃣ Send verification email
    // const origin =
    //   process.env.FRONTEND_URL ||
    //   'https://alfurqaninstitute.onrender.com/api/v1';
    const origin = 'http://localhost:3001';
    // await this.mailservice.sendVerificationEmail({
    //   email: user.email,
    //   token: user.verificationString,
    //   firstName: user.first_name,
    //   lastName: user.last_name,
    //   origin,
    //   // origin: this.configService.get('APP_ORIGIN'),
    // });

    return {
      msg: 'Please check your email to complete your registration',
      verificationString, // optional to return for dev/testing
    };
  }

  async verifyEmail(body: VerifyEmailDto) {
    const { verificationString, email } = body;
    // Look up user
    const user = await this.prisma.users.findUnique({ where: { email } });
    if (!user) {
      throw new BadRequestException(
        'Verification failed — this email is not registered.',
      );
    }

    // Compare verification token
    if (user.verificationString !== verificationString) {
      throw new BadRequestException('Verification failed — invalid token.');
    }

    // Update user
    await this.prisma.users.update({
      where: { email },
      data: {
        verificationString: null,
        isVerified: true,
        verified: new Date(),
      },
    });
    return {
      message: 'Congratulations! Your email has been verified.',
    };
  }

  // Logout: invalidate refresh token and clear cookies
  async logout(req: Request, res: Response) {
    const cookies = req.signedCookies ?? req.cookies;
    const refreshToken = cookies?.[REFRESH_COOKIE_NAME];
    if (refreshToken) {
      await this.prisma.token.updateMany({
        where: { refreshToken },
        data: { isValid: false },
      });
    }
    clearAuthCookies(res);
    return { msg: 'Logged out' };
  }
  // ============================
  // FORGOT PASSWORD
  // ============================
  async forgotPassword(dto: ForgotPasswordDto) {
    const { email } = dto;

    const user = await this.prisma.users.findUnique({ where: { email } });
    if (!user) throw new UnauthorizedException('User not found');

    const token = crypto.randomBytes(40).toString('hex');
    const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await this.prisma.users.update({
      where: { email },
      data: {
        passwordToken: token,
        passwordExpirationDate: expires,
      },
    });
    // const origin =
    //   process.env.FRONTEND_URL ||
    //   'https://alfurqaninstitute.onrender.com/api/v1';
    const origin = 'http://localhost:3001';
    // await this.mailservice.sendPasswordResetEmail({
    //   email,
    //   token,
    //   firstName: user.first_name,
    //   lastName: user.last_name,
    //   origin,
    // });

    return { msg: 'Password reset link sent to email', token };
  }

  // ============================
  // RESET PASSWORD
  // ============================
  async resetPassword(dto: ResetPasswordDto) {
    const { email, token, password } = dto;

    const user = await this.prisma.users.findUnique({ where: { email } });
    if (!user) throw new UnauthorizedException('User not found');

    if (!user.passwordToken || user.passwordToken !== token) {
      throw new UnauthorizedException('Invalid reset token');
    }

    if (
      !user.passwordExpirationDate ||
      new Date() > user.passwordExpirationDate
    ) {
      throw new UnauthorizedException('Reset token expired');
    }

    const hashed = await argon2.hash(password);

    await this.prisma.users.update({
      where: { email },
      data: {
        password: hashed,
        passwordToken: null,
        passwordExpirationDate: null,
      },
    });

    return { msg: 'Password reset successful' };
  }

  // ============================
  // UPDATE USER PASSWORD (LOGGED IN USER)
  // ============================
  async updatePassword(userId: number, dto: UpdatePasswordDto) {
    const { oldPassword, newPassword, confirmPassword } = dto;

    if (newPassword !== confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    const user = await this.prisma.users.findUnique({
      where: { user_id: userId },
    });

    if (!user) throw new NotFoundException('User not found');

    let hashed: string;
    // Check the type of hash stored in DB
    if (user.password.startsWith('$2')) {
      // 👉 bcrypt hash
      const validOld = await bcrypt.compare(oldPassword, user.password);
      if (!validOld) throw new UnauthorizedException('Old password incorrect');
      hashed = await bcrypt.hash(newPassword, 10);
    } else {
      // 👉 argon2 hash
      const validOld = await argon2.verify(user.password, oldPassword);
      if (!validOld) throw new UnauthorizedException('Old password incorrect');
      hashed = await argon2.hash(newPassword);
    }

    await this.prisma.users.update({
      where: { user_id: userId },
      data: { password: hashed },
    });

    return { msg: 'Password updated successfully' };
  }
}
