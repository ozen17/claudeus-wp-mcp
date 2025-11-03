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

// ============================================
// SYSTEM CONFIGURATION
// ============================================

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

// ============================================
// STATISTICS & ANALYTICS
// ============================================

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
      activeUsers,
      totalSites,
      totalConversations,
      totalAuditLogs,
      subscriptionStats,
      recentUsers,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({
        where: {
          sites: {
            some: {},
          },
        },
      }),
      prisma.site.count(),
      prisma.conversation.count(),
      prisma.auditLog.count(),
      // Count users by subscription tier
      prisma.subscription.groupBy({
        by: ['tier'],
        _count: true,
      }),
      prisma.user.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          name: true,
          isAdmin: true,
          createdAt: true,
          subscription: {
            select: { tier: true, status: true },
          },
          _count: {
            select: {
              sites: true,
              conversations: true,
            },
          },
        },
      }),
    ]);

    res.json({
      totalUsers,
      activeUsers,
      totalSites,
      totalConversations,
      totalAuditLogs,
      subscriptionStats: subscriptionStats.map((stat) => ({
        tier: stat.tier,
        count: stat._count,
      })),
      recentUsers,
    });
  })
);

/**
 * GET /api/v1/admin/analytics
 * Get detailed analytics (admin only)
 */
router.get(
  '/analytics',
  authenticate,
  requireAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const { period = '30d' } = req.query;

    // Calculate date range
    const now = new Date();
    const daysAgo = period === '7d' ? 7 : period === '30d' ? 30 : 90;
    const startDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);

    // Get analytics data
    const [
      newUsersCount,
      newSitesCount,
      conversationsCount,
      topUsers,
    ] = await Promise.all([
      prisma.user.count({
        where: { createdAt: { gte: startDate } },
      }),
      prisma.site.count({
        where: { createdAt: { gte: startDate } },
      }),
      prisma.conversation.count({
        where: { createdAt: { gte: startDate } },
      }),
      // Top 10 most active users
      prisma.user.findMany({
        take: 10,
        select: {
          id: true,
          email: true,
          name: true,
          _count: {
            select: {
              conversations: true,
              sites: true,
            },
          },
          subscription: {
            select: { tier: true },
          },
        },
        orderBy: {
          conversations: {
            _count: 'desc',
          },
        },
      }),
    ]);

    res.json({
      period,
      startDate,
      endDate: now,
      newUsers: newUsersCount,
      newSites: newSitesCount,
      conversations: conversationsCount,
      topUsers,
    });
  })
);

// ============================================
// USER MANAGEMENT
// ============================================

/**
 * GET /api/v1/admin/users
 * Get all users with filters (admin only)
 */
router.get(
  '/users',
  authenticate,
  requireAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const {
      page = '1',
      limit = '20',
      search = '',
      tier,
      isAdmin,
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Build where clause
    const where: any = {};

    if (search) {
      where.OR = [
        { email: { contains: search as string, mode: 'insensitive' } },
        { name: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    if (tier) {
      where.subscription = {
        tier: tier as string,
      };
    }

    if (isAdmin !== undefined) {
      where.isAdmin = isAdmin === 'true';
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          name: true,
          isAdmin: true,
          createdAt: true,
          updatedAt: true,
          subscription: {
            select: {
              tier: true,
              status: true,
              currentPeriodEnd: true,
            },
          },
          _count: {
            select: {
              sites: true,
              conversations: true,
              apiKeys: true,
            },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    res.json({
      users,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  })
);

/**
 * GET /api/v1/admin/users/:userId
 * Get user details (admin only)
 */
router.get(
  '/users/:userId',
  authenticate,
  requireAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        subscription: true,
        sites: {
          select: {
            id: true,
            name: true,
            url: true,
            isActive: true,
            createdAt: true,
          },
        },
        conversations: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            createdAt: true,
            site: {
              select: { name: true },
            },
            _count: {
              select: { messages: true },
            },
          },
        },
        _count: {
          select: {
            sites: true,
            conversations: true,
            apiKeys: true,
            auditLogs: true,
          },
        },
      },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    res.json({ user });
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

/**
 * PATCH /api/v1/admin/users/:userId/suspend
 * Suspend a user account (admin only)
 */
router.patch(
  '/users/:userId/suspend',
  authenticate,
  requireAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;
    const { reason } = req.body;

    if (userId === req.user!.userId) {
      throw new AppError('Cannot suspend yourself', 400);
    }

    // Update subscription to suspended
    await prisma.subscription.update({
      where: { userId },
      data: { status: 'SUSPENDED' },
    });

    // Log audit event
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'USER_SUSPENDED',
        resource: 'USER',
        resourceId: userId,
        metadata: { reason, suspendedBy: req.user!.userId },
      },
    });

    res.json({
      message: 'User suspended successfully',
    });
  })
);

/**
 * PATCH /api/v1/admin/users/:userId/unsuspend
 * Unsuspend a user account (admin only)
 */
router.patch(
  '/users/:userId/unsuspend',
  authenticate,
  requireAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;

    // Reactivate subscription
    await prisma.subscription.update({
      where: { userId },
      data: { status: 'ACTIVE' },
    });

    // Log audit event
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'USER_UNSUSPENDED',
        resource: 'USER',
        resourceId: userId,
        metadata: { unsuspendedBy: req.user!.userId },
      },
    });

    res.json({
      message: 'User unsuspended successfully',
    });
  })
);

/**
 * DELETE /api/v1/admin/users/:userId
 * Delete a user account (admin only) - DANGEROUS
 */
router.delete(
  '/users/:userId',
  authenticate,
  requireAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;
    const { confirm } = req.body;

    if (userId === req.user!.userId) {
      throw new AppError('Cannot delete yourself', 400);
    }

    if (confirm !== 'DELETE') {
      throw new AppError('Must confirm deletion with "DELETE"', 400);
    }

    // Delete user and all related data (cascade)
    await prisma.user.delete({
      where: { id: userId },
    });

    res.json({
      message: 'User deleted successfully',
    });
  })
);

// ============================================
// SYSTEM LOGS
// ============================================

/**
 * GET /api/v1/admin/logs
 * Get system audit logs (admin only)
 */
router.get(
  '/logs',
  authenticate,
  requireAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const {
      page = '1',
      limit = '50',
      action,
      resource,
      userId,
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (action) where.action = action;
    if (resource) where.resource = resource;
    if (userId) where.userId = userId;

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              email: true,
              name: true,
            },
          },
        },
      }),
      prisma.auditLog.count({ where }),
    ]);

    res.json({
      logs,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  })
);

export default router;
