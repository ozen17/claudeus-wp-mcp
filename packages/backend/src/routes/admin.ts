import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { AppError } from '../middleware/errorHandler.js';
import { SystemConfigService } from '../services/systemConfig.service.js';
import { prisma } from '../utils/database.js';

const router = Router();
const systemConfigService = new SystemConfigService();

/**
 * Middleware to check if user is admin
 */
const requireAdmin = async (req: Request, res: Response, next: Function) => {
  const userId = req.user!.userId;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isAdmin: true },
  });

  if (!user?.isAdmin) {
    throw new AppError('Admin access required', 403);
  }

  next();
};

/**
 * GET /api/v1/admin/config
 * Get all system configurations (admin only)
 */
router.get(
  '/config',
  authenticate,
  requireAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const configs = await systemConfigService.getAllConfigs();
    res.json({ configs });
  })
);

/**
 * PUT /api/v1/admin/config/openai-key
 * Set OpenAI API key (admin only)
 */
router.put(
  '/config/openai-key',
  authenticate,
  requireAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const { apiKey } = req.body;

    if (!apiKey || typeof apiKey !== 'string') {
      throw new AppError('API key is required', 400);
    }

    await systemConfigService.setOpenAIKey(apiKey);

    res.json({
      message: 'OpenAI API key configured successfully',
      masked: await systemConfigService.getMaskedOpenAIKey(),
    });
  })
);

/**
 * GET /api/v1/admin/config/openai-key/status
 * Check if OpenAI key is configured (admin only)
 */
router.get(
  '/config/openai-key/status',
  authenticate,
  requireAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const isConfigured = await systemConfigService.isOpenAIKeyConfigured();
    const maskedKey = await systemConfigService.getMaskedOpenAIKey();

    res.json({
      configured: isConfigured,
      maskedKey,
    });
  })
);

/**
 * GET /api/v1/admin/stats
 * Get system statistics (admin only)
 */
router.get(
  '/stats',
  authenticate,
  requireAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const [
      totalUsers,
      totalSites,
      totalConversations,
      totalAuditLogs,
      recentUsers,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.site.count(),
      prisma.conversation.count(),
      prisma.auditLog.count(),
      prisma.user.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          name: true,
          createdAt: true,
          subscription: {
            select: { tier: true },
          },
        },
      }),
    ]);

    res.json({
      totalUsers,
      totalSites,
      totalConversations,
      totalAuditLogs,
      recentUsers,
    });
  })
);

/**
 * POST /api/v1/admin/users/:userId/make-admin
 * Make a user admin (admin only)
 */
router.post(
  '/users/:userId/make-admin',
  authenticate,
  requireAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;

    const user = await prisma.user.update({
      where: { id: userId },
      data: { isAdmin: true },
      select: {
        id: true,
        email: true,
        name: true,
        isAdmin: true,
      },
    });

    res.json({
      message: 'User is now an admin',
      user,
    });
  })
);

/**
 * DELETE /api/v1/admin/users/:userId/remove-admin
 * Remove admin privileges (admin only)
 */
router.delete(
  '/users/:userId/remove-admin',
  authenticate,
  requireAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;

    // Prevent removing admin from self
    if (userId === req.user!.userId) {
      throw new AppError('Cannot remove admin privileges from yourself', 400);
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: { isAdmin: false },
      select: {
        id: true,
        email: true,
        name: true,
        isAdmin: true,
      },
    });

    res.json({
      message: 'Admin privileges removed',
      user,
    });
  })
);

export default router;
