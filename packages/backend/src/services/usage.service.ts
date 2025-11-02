import { prisma } from '../utils/database.js';
import { AppError } from '../middleware/errorHandler.js';

export class UsageService {
  /**
   * Get usage statistics
   */
  async getUsage(userId: string, period: string = 'month') {
    const startDate = this.getStartDate(period);

    const usage = await prisma.usageLog.groupBy({
      by: ['type'],
      where: {
        userId,
        createdAt: {
          gte: startDate,
        },
      },
      _count: {
        id: true,
      },
      _sum: {
        totalTokens: true,
      },
    });

    return {
      period,
      startDate,
      endDate: new Date(),
      usage,
    };
  }

  /**
   * Get remaining quota
   */
  async getQuota(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        subscription: true,
      },
    });

    if (!user || !user.subscription) {
      throw new AppError('User or subscription not found', 404);
    }

    // Get usage for current period
    const startDate =
      user.subscription.currentPeriodStart || this.getStartDate('month');

    const usageCount = await prisma.usageLog.count({
      where: {
        userId,
        type: 'AI_REQUEST',
        createdAt: {
          gte: startDate,
        },
      },
    });

    const maxRequests = user.subscription.maxRequests;

    return {
      used: usageCount,
      limit: maxRequests,
      remaining: Math.max(0, maxRequests - usageCount),
      percentage: (usageCount / maxRequests) * 100,
      periodStart: startDate,
      periodEnd: user.subscription.currentPeriodEnd || this.getEndDate('month'),
    };
  }

  /**
   * Log usage
   */
  async logUsage(
    userId: string,
    type: 'AI_REQUEST' | 'MCP_TOOL_CALL' | 'API_CALL',
    data: any
  ) {
    await prisma.usageLog.create({
      data: {
        userId,
        type,
        provider: data.provider,
        model: data.model,
        promptTokens: data.promptTokens,
        completionTokens: data.completionTokens,
        totalTokens: data.totalTokens,
        endpoint: data.endpoint,
        method: data.method,
        statusCode: data.statusCode,
        responseTime: data.responseTime,
        metadata: data.metadata,
      },
    });
  }

  /**
   * Get start date for period
   */
  private getStartDate(period: string): Date {
    const now = new Date();

    switch (period) {
      case 'day':
        return new Date(now.getFullYear(), now.getMonth(), now.getDate());
      case 'week':
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        return weekStart;
      case 'month':
        return new Date(now.getFullYear(), now.getMonth(), 1);
      case 'year':
        return new Date(now.getFullYear(), 0, 1);
      default:
        return new Date(now.getFullYear(), now.getMonth(), 1);
    }
  }

  /**
   * Get end date for period
   */
  private getEndDate(period: string): Date {
    const now = new Date();

    switch (period) {
      case 'month':
        return new Date(now.getFullYear(), now.getMonth() + 1, 0);
      default:
        return now;
    }
  }
}
