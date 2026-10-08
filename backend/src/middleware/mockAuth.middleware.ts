import type { RequestHandler } from 'express';
import { getPool, sql } from '../config/db';

// Only an explicitly enabled local/test fixture may supply identity this way.
export const mockAuth: RequestHandler = async (req, res, next) => {
  if (!['development', 'test'].includes(process.env.NODE_ENV || '') || process.env.ENABLE_MOCK_AUTH !== 'true') {
    res.status(401).json({ message: 'Authentication required' });
    return;
  }
  const raw = req.header('X-Test-User-Id');
  const userId = raw && /^\d+$/.test(raw) ? Number(raw) : 0;
  if (!Number.isSafeInteger(userId) || userId <= 0) {
    res.status(401).json({ message: 'Authentication required' });
    return;
  }
  try {
    const found = await getPool().request().input('userId', sql.Int, userId)
      .query("SELECT user_id FROM dbo.users WHERE user_id = @userId AND status = 'ACTIVE'");
    if (!found.recordset.length) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }
    res.locals.userId = userId;
    next();
  } catch (error) { next(error); }
};
