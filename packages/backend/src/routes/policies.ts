import { Router, Request, Response } from 'express';
import { PolicyService } from '../services/policy.service.js';
import { authenticate } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { AppError } from '../middleware/errorHandler.js';

const router = Router();
const policyService = new PolicyService();

/**
 * Get all categories info (for UI)
 * GET /api/v1/policies/categories
 */
router.get(
  '/categories',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const categories = policyService.getCategoryInfo();
    res.json({ categories });
  })
);

/**
 * Get site policy
 * GET /api/v1/policies/sites/:siteId
 */
router.get(
  '/sites/:siteId',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const { siteId } = req.params;
    const userId = req.user!.userId;

    // Verify user owns the site
    const { prisma } = await import('../utils/database.js');
    const site = await prisma.site.findFirst({
      where: { id: siteId, userId },
    });

    if (!site) {
      throw new AppError('Site not found', 404);
    }

    const policy = await policyService.getSitePolicy(siteId);
    res.json({ policy });
  })
);

/**
 * Update a policy rule
 * PUT /api/v1/policies/sites/:siteId/rules/:category
 */
router.put(
  '/sites/:siteId/rules/:category',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const { siteId, category } = req.params;
    const userId = req.user!.userId;
    const ruleData = req.body;

    // Verify user owns the site
    const { prisma } = await import('../utils/database.js');
    const site = await prisma.site.findFirst({
      where: { id: siteId, userId },
    });

    if (!site) {
      throw new AppError('Site not found', 404);
    }

    const updatedRule = await policyService.updatePolicyRule(
      siteId,
      category as any,
      ruleData
    );

    res.json({ rule: updatedRule, message: 'Policy rule updated' });
  })
);

/**
 * Check permission for an action
 * POST /api/v1/policies/sites/:siteId/check
 */
router.post(
  '/sites/:siteId/check',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const { siteId } = req.params;
    const { category, action } = req.body;
    const userId = req.user!.userId;

    // Verify user owns the site
    const { prisma } = await import('../utils/database.js');
    const site = await prisma.site.findFirst({
      where: { id: siteId, userId },
    });

    if (!site) {
      throw new AppError('Site not found', 404);
    }

    const permission = await policyService.checkPermission(
      siteId,
      category,
      action
    );

    res.json({ permission });
  })
);

/**
 * Get enabled tools for a site
 * GET /api/v1/policies/sites/:siteId/enabled-tools
 */
router.get(
  '/sites/:siteId/enabled-tools',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const { siteId } = req.params;
    const userId = req.user!.userId;

    // Verify user owns the site
    const { prisma } = await import('../utils/database.js');
    const site = await prisma.site.findFirst({
      where: { id: siteId, userId },
    });

    if (!site) {
      throw new AppError('Site not found', 404);
    }

    const tools = await policyService.getEnabledTools(siteId);
    res.json({ tools, count: tools.length });
  })
);

export default router;
