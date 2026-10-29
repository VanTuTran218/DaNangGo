import { Router } from 'express';
import { createRecommendations } from './recommendations.controller';

const router = Router();
router.post('/', createRecommendations);

export default router;
