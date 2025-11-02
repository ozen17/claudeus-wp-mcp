import { Router, Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { authenticate } from '../middleware/auth.js';
import { UsageService } from '../services/usage.service.js';

const router = Router();
const usageService = new UsageService();

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/v1/usage
 * Get usage statistics
 */
router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const period = req.query.period as string || 'month';

    const usage = await usageService.getUsage(req.user!.id, period);

    res.json({
      data: usage,
    });
  })
);

/**
 * GET /api/v1/usage/quota
 * Get remaining quota
 */
router.get(
  '/quota',
  asyncHandler(async (req: Request, res: Response) => {
    const quota = await usageService.getQuota(req.user!.id);

    res.json({
      data: quota,
    });
  })
);

export default router;
