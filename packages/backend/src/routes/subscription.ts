import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../middleware/errorHandler.js';
import { authenticate } from '../middleware/auth.js';
import { SubscriptionService } from '../services/subscription.service.js';

const router = Router();
const subscriptionService = new SubscriptionService();

// All routes require authentication
router.use(authenticate);

const upgradePlanSchema = z.object({
  tier: z.enum(['PRO', 'ENTERPRISE']),
  paymentMethodId: z.string().optional(),
});

/**
 * GET /api/v1/subscription
 * Get current subscription
 */
router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const subscription = await subscriptionService.getSubscription(
      req.user!.id
    );

    res.json({
      data: subscription,
    });
  })
);

/**
 * POST /api/v1/subscription/upgrade
 * Upgrade subscription tier
 */
router.post(
  '/upgrade',
  asyncHandler(async (req: Request, res: Response) => {
    const data = upgradePlanSchema.parse(req.body);

    const result = await subscriptionService.upgradePlan(
      req.user!.id,
      data.tier,
      data.paymentMethodId
    );

    res.json({
      message: 'Subscription upgraded successfully',
      data: result,
    });
  })
);

/**
 * POST /api/v1/subscription/cancel
 * Cancel subscription
 */
router.post(
  '/cancel',
  asyncHandler(async (req: Request, res: Response) => {
    await subscriptionService.cancelSubscription(req.user!.id);

    res.json({
      message: 'Subscription cancelled successfully',
    });
  })
);

export default router;
