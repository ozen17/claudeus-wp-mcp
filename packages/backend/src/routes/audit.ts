import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { AppError } from '../middleware/errorHandler.js';
import { prisma } from '../utils/database.js';

const router = Router();

/**
 * Get audit logs for user
 * GET /api/v1/audit
 */
router.get(
  '/',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const { siteId, category, action, limit = 50, offset = 0 } = req.query;

    const where: any = { userId };

    if (siteId) {
      where.siteId = siteId as string;
    }

    if (category) {
      where.category = category as string;
    }

    if (action) {
      where.action = action as string;
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          site: {
            select: {
              id: true,
              name: true,
              url: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: parseInt(limit as string),
        skip: parseInt(offset as string),
      }),
      prisma.auditLog.count({ where }),
    ]);

    res.json({
      logs,
      pagination: {
        total,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
      },
    });
  })
);

/**
 * Get audit logs for a specific site
 * GET /api/v1/audit/sites/:siteId
 */
router.get(
  '/sites/:siteId',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const { siteId } = req.params;
    const userId = req.user!.userId;
    const { limit = 50, offset = 0 } = req.query;

    // Verify user owns the site
    const site = await prisma.site.findFirst({
      where: { id: siteId, userId },
    });

    if (!site) {
      throw new AppError('Site not found', 404);
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where: { siteId },
        orderBy: { createdAt: 'desc' },
        take: parseInt(limit as string),
        skip: parseInt(offset as string),
      }),
      prisma.auditLog.count({ where: { siteId } }),
    ]);

    res.json({
      logs,
      pagination: {
        total,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
      },
    });
  })
);

/**
 * Get audit log statistics
 * GET /api/v1/audit/stats
 */
router.get(
  '/stats',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const { siteId, days = 7 } = req.query;

    const where: any = { userId };

    if (siteId) {
      where.siteId = siteId as string;
    }

    // Date range
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days as string));
    where.createdAt = { gte: startDate };

    // Get stats
    const [
      totalActions,
      successfulActions,
      failedActions,
      actionsByCategory,
      actionsByType,
    ] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.count({ where: { ...where, success: true } }),
      prisma.auditLog.count({ where: { ...where, success: false } }),
      prisma.auditLog.groupBy({
        by: ['category'],
        where,
        _count: true,
      }),
      prisma.auditLog.groupBy({
        by: ['action'],
        where,
        _count: true,
      }),
    ]);

    res.json({
      totalActions,
      successfulActions,
      failedActions,
      successRate:
        totalActions > 0
          ? ((successfulActions / totalActions) * 100).toFixed(2)
          : 0,
      byCategory: actionsByCategory.map((item) => ({
        category: item.category,
        count: item._count,
      })),
      byAction: actionsByType.map((item) => ({
        action: item.action,
        count: item._count,
      })),
    });
  })
);

/**
 * Get single audit log detail
 * GET /api/v1/audit/:logId
 */
router.get(
  '/:logId',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const { logId } = req.params;
    const userId = req.user!.userId;

    const log = await prisma.auditLog.findFirst({
      where: { id: logId, userId },
      include: {
        site: {
          select: {
            id: true,
            name: true,
            url: true,
          },
        },
      },
    });

    if (!log) {
      throw new AppError('Audit log not found', 404);
    }

    res.json({ log });
  })
);

export default router;
