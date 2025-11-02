import { prisma } from '../utils/database.js';
import { AppError } from '../middleware/errorHandler.js';
import { MCP_TOOLS } from '../config/mcp-tools.js';
import { logger } from '../utils/logger.js';

export class McpToolsService {
  /**
   * Seed database with MCP tools catalog
   * Should be run once during deployment
   */
  async seedTools() {
    logger.info('Seeding MCP tools catalog...');

    for (const tool of MCP_TOOLS) {
      await prisma.mcpTool.upsert({
        where: { name: tool.name },
        update: {
          displayName: tool.displayName,
          description: tool.description,
          category: tool.category,
          dangerLevel: tool.dangerLevel,
          minTier: tool.minTier,
          isPremium: tool.isPremium,
        },
        create: {
          name: tool.name,
          displayName: tool.displayName,
          description: tool.description,
          category: tool.category,
          dangerLevel: tool.dangerLevel,
          minTier: tool.minTier,
          isPremium: tool.isPremium,
          isActive: true,
        },
      });
    }

    logger.info(`Seeded ${MCP_TOOLS.length} MCP tools`);
  }

  /**
   * Get all available tools with user's enabled status
   */
  async getUserTools(userId: string) {
    // Get user's subscription tier
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { subscription: true },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    const userTier = user.subscription?.tier || 'FREE';

    // Get all tools
    const tools = await prisma.mcpTool.findMany({
      where: { isActive: true },
      orderBy: [{ category: 'asc' }, { displayName: 'asc' }],
    });

    // Get user's tool settings
    const userTools = await prisma.userMcpTool.findMany({
      where: { userId },
    });

    const userToolsMap = new Map(
      userTools.map((ut) => [ut.toolId, ut])
    );

    // Combine tool info with user settings
    return tools.map((tool) => {
      const userTool = userToolsMap.get(tool.id);
      const hasAccess = this.checkToolAccess(tool.minTier, userTier);

      return {
        id: tool.id,
        name: tool.name,
        displayName: tool.displayName,
        category: tool.category,
        description: tool.description,
        dangerLevel: tool.dangerLevel,
        minTier: tool.minTier,
        isPremium: tool.isPremium,
        hasAccess,
        isEnabled: userTool?.isEnabled ?? true, // Default enabled
        usageCount: userTool?.usageCount ?? 0,
        lastUsed: userTool?.lastUsed,
      };
    });
  }

  /**
   * Get tools grouped by category
   */
  async getUserToolsByCategory(userId: string) {
    const tools = await this.getUserTools(userId);

    const grouped = tools.reduce((acc, tool) => {
      if (!acc[tool.category]) {
        acc[tool.category] = [];
      }
      acc[tool.category].push(tool);
      return acc;
    }, {} as Record<string, typeof tools>);

    return grouped;
  }

  /**
   * Enable/disable a specific tool for user
   */
  async toggleTool(userId: string, toolId: string, isEnabled: boolean) {
    // Check if tool exists
    const tool = await prisma.mcpTool.findUnique({
      where: { id: toolId },
    });

    if (!tool) {
      throw new AppError('Tool not found', 404);
    }

    // Check user has access to this tool
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { subscription: true },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    const userTier = user.subscription?.tier || 'FREE';
    const hasAccess = this.checkToolAccess(tool.minTier, userTier);

    if (!hasAccess) {
      throw new AppError(
        `This tool requires ${tool.minTier} tier or higher`,
        403
      );
    }

    // Update or create user tool setting
    const userTool = await prisma.userMcpTool.upsert({
      where: {
        userId_toolId: {
          userId,
          toolId,
        },
      },
      update: {
        isEnabled,
      },
      create: {
        userId,
        toolId,
        isEnabled,
      },
    });

    return userTool;
  }

  /**
   * Bulk enable/disable tools by category
   */
  async toggleCategory(
    userId: string,
    category: string,
    isEnabled: boolean
  ) {
    const tools = await prisma.mcpTool.findMany({
      where: { category, isActive: true },
    });

    const results = await Promise.all(
      tools.map((tool) =>
        this.toggleTool(userId, tool.id, isEnabled).catch(() => null)
      )
    );

    return results.filter((r) => r !== null);
  }

  /**
   * Get enabled tools for user (for use in chat)
   */
  async getEnabledTools(userId: string): Promise<string[]> {
    const tools = await this.getUserTools(userId);

    return tools
      .filter((tool) => tool.isEnabled && tool.hasAccess)
      .map((tool) => tool.name);
  }

  /**
   * Record tool usage
   */
  async recordToolUsage(userId: string, toolName: string) {
    const tool = await prisma.mcpTool.findUnique({
      where: { name: toolName },
    });

    if (!tool) return;

    await prisma.userMcpTool.upsert({
      where: {
        userId_toolId: {
          userId,
          toolId: tool.id,
        },
      },
      update: {
        usageCount: { increment: 1 },
        lastUsed: new Date(),
      },
      create: {
        userId,
        toolId: tool.id,
        isEnabled: true,
        usageCount: 1,
        lastUsed: new Date(),
      },
    });
  }

  /**
   * Check if user tier has access to tool
   */
  private checkToolAccess(
    toolMinTier: string,
    userTier: string
  ): boolean {
    const tierOrder = ['FREE', 'PRO', 'ENTERPRISE'];
    const toolTierIndex = tierOrder.indexOf(toolMinTier);
    const userTierIndex = tierOrder.indexOf(userTier);

    return userTierIndex >= toolTierIndex;
  }

  /**
   * Get tool statistics for user
   */
  async getToolStats(userId: string) {
    const tools = await this.getUserTools(userId);

    return {
      total: tools.length,
      enabled: tools.filter((t) => t.isEnabled).length,
      accessible: tools.filter((t) => t.hasAccess).length,
      premium: tools.filter((t) => t.isPremium).length,
      byDangerLevel: {
        safe: tools.filter((t) => t.dangerLevel === 0).length,
        moderate: tools.filter((t) => t.dangerLevel === 1).length,
        high: tools.filter((t) => t.dangerLevel === 2).length,
      },
      byCategory: Object.entries(
        tools.reduce((acc, tool) => {
          acc[tool.category] = (acc[tool.category] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      ).map(([category, count]) => ({ category, count })),
    };
  }
}
