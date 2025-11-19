// src/utils/cookie.ts
import { Response } from 'express';

const ACCESS_COOKIE_NAME = 'accessToken';
const REFRESH_COOKIE_NAME = 'refreshToken';

export const cookieOptions = {
  httpOnly: true,
  signed: true, // uses cookie-parser secret
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/', // cookie path
};

export function attachResponseToCookie({
  res,
  accessToken,
  refreshToken,
  accessMaxAgeMs,
  refreshMaxAgeMs,
}: {
  res: Response;
  accessToken?: string;
  refreshToken?: string;
  accessMaxAgeMs?: number;
  refreshMaxAgeMs?: number;
}) {
  if (accessToken) {
    res.cookie(ACCESS_COOKIE_NAME, accessToken, {
      ...cookieOptions,
      maxAge: accessMaxAgeMs ?? 1000 * 60 * 15, // default 15m
    });
  }
  if (refreshToken) {
    res.cookie(REFRESH_COOKIE_NAME, refreshToken, {
      ...cookieOptions,
      maxAge: refreshMaxAgeMs ?? 1000 * 60 * 60 * 24 * 7, // default 7d
    });
  }
}

export function clearAuthCookies(res: Response) {
  res.clearCookie(ACCESS_COOKIE_NAME, { path: '/' });
  res.clearCookie(REFRESH_COOKIE_NAME, { path: '/' });
}

export { ACCESS_COOKIE_NAME, REFRESH_COOKIE_NAME };
