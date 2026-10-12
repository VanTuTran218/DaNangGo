import { createHmac, timingSafeEqual } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';

export interface AuthenticatedUser {
  id: number;
}

declare module 'express-serve-static-core' {
  interface Request {
    authenticatedUser?: AuthenticatedUser;
  }
}

function decodeBase64UrlJson(value: string): unknown {
  return JSON.parse(Buffer.from(value, 'base64url').toString('utf8')) as unknown;
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const authorization = req.header('authorization');
  const token = authorization?.match(/^Bearer\s+([^\s]+)$/i)?.[1];
  if (!token) {
    res.status(401).json({ success: false, message: 'Cần đăng nhập để thực hiện thao tác này.' });
    return;
  }

  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    console.error('JWT_SECRET phải được cấu hình và có tối thiểu 32 ký tự.');
    res.status(500).json({ success: false, message: 'Máy chủ chưa được cấu hình xác thực.' });
    return;
  }

  const parts = token.split('.');
  if (parts.length !== 3) {
    res.status(401).json({ success: false, message: 'Token không hợp lệ hoặc đã hết hạn.' });
    return;
  }

  try {
    const [encodedHeader, encodedPayload, encodedSignature] = parts;
    if (!encodedHeader || !encodedPayload || !encodedSignature) {
      res.status(401).json({ success: false, message: 'Token không hợp lệ hoặc đã hết hạn.' });
      return;
    }

    const header = decodeBase64UrlJson(encodedHeader);
    const claims = decodeBase64UrlJson(encodedPayload);
    if (typeof header !== 'object' || header === null || !('alg' in header) || header.alg !== 'HS256') {
      res.status(401).json({ success: false, message: 'Token không hợp lệ hoặc đã hết hạn.' });
      return;
    }

    const expectedSignature = createHmac('sha256', secret)
      .update(`${encodedHeader}.${encodedPayload}`)
      .digest();
    const actualSignature = Buffer.from(encodedSignature, 'base64url');
    if (actualSignature.length !== expectedSignature.length
      || !timingSafeEqual(actualSignature, expectedSignature)) {
      res.status(401).json({ success: false, message: 'Token không hợp lệ hoặc đã hết hạn.' });
      return;
    }

    if (typeof claims !== 'object' || claims === null || !('sub' in claims)) {
      res.status(401).json({ success: false, message: 'Token không hợp lệ hoặc đã hết hạn.' });
      return;
    }

    const tokenClaims = claims as { sub: unknown; exp?: unknown; nbf?: unknown };
    const userId = typeof tokenClaims.sub === 'number'
      ? tokenClaims.sub
      : typeof tokenClaims.sub === 'string' && /^\d+$/.test(tokenClaims.sub)
        ? Number(tokenClaims.sub)
        : NaN;
    const now = Math.floor(Date.now() / 1000);
    if (!Number.isSafeInteger(userId) || userId <= 0
      || userId > 2_147_483_647
      || typeof tokenClaims.exp !== 'number' || tokenClaims.exp <= now
      || (tokenClaims.nbf !== undefined
        && (typeof tokenClaims.nbf !== 'number' || tokenClaims.nbf > now))) {
      res.status(401).json({ success: false, message: 'Token không hợp lệ hoặc đã hết hạn.' });
      return;
    }

    req.authenticatedUser = { id: userId };
    next();
  } catch {
    res.status(401).json({ success: false, message: 'Token không hợp lệ hoặc đã hết hạn.' });
  }
}
