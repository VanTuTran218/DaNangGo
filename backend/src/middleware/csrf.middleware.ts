import type { RequestHandler } from 'express';

function hasAuthCookie(request: Parameters<RequestHandler>[0]): boolean {
  const cookies = request.cookies as Record<string, string> | undefined;
  return Boolean(
    cookies?.access_token || cookies?.refresh_token || cookies?.admin_access || cookies?.admin_refresh,
  );
}

export const csrfProtection: RequestHandler = (req, res, next) => {
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method) || !hasAuthCookie(req)) {
    next();
    return;
  }

  const source = req.get('origin') || req.get('referer');
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  try {
    if (!source || new URL(source).origin !== new URL(frontendUrl).origin) {
      res.status(403).json({ success: false, message: 'Nguồn yêu cầu không hợp lệ.' });
      return;
    }
  } catch {
    res.status(403).json({ success: false, message: 'Nguồn yêu cầu không hợp lệ.' });
    return;
  }
  next();
};
