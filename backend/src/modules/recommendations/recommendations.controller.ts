import type { RequestHandler } from 'express';
import { getRecommendations } from './recommendations.service';

export const createRecommendations: RequestHandler = async (req, res, next) => {
  try {
    const data = await getRecommendations(req.body);
    res.json({ success: true, data });
  } catch (error) {
    if (error && typeof error === 'object' && 'status' in error && error.status === 400 && 'message' in error && typeof error.message === 'string') {
      res.status(400).json({ success: false, message: error.message });
      return;
    }
    next(error);
  }
};
