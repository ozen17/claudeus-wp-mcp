import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../middleware/errorHandler.js';
import { authenticate, requireSubscription } from '../middleware/auth.js';
import { McpToolsService } from '../services/mcpTools.service.js';

const router = Router();
const mcpToolsService = new McpToolsService();

// All routes require authentication
router.use(authenticate);

const toggleToolSchema = z.object({
  isEnabled: z.boolean(),
});

const toggleCategorySchema = z.object({
  category: z.string(),
  isEnabled: z.boolean(),
});

/**
 * GET /api/v1/mcp-tools
 * Get all tools with user's settings
 */
router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const tools = await mcpToolsService.getUserTools(req.user!.id);

    res.json({
      data: tools,
    });
  })
);

/**
 * GET /api/v1/mcp-tools/by-category
 * Get tools grouped by category
 */
router.get(
  '/by-category',
  asyncHandler(async (req: Request, res: Response) => {
    const tools = await mcpToolsService.getUserToolsByCategory(req.user!.id);

    res.json({
      data: tools,
    });
  })
);

/**
 * GET /api/v1/mcp-tools/stats
 * Get tool statistics
 */
router.get(
  '/stats',
  asyncHandler(async (req: Request, res: Response) => {
    const stats = await mcpToolsService.getToolStats(req.user!.id);

    res.json({
      data: stats,
    });
  })
);

/**
 * PUT /api/v1/mcp-tools/:id/toggle
 * Enable/disable a specific tool
 */
router.put(
  '/:id/toggle',
  asyncHandler(async (req: Request, res: Response) => {
    const { isEnabled } = toggleToolSchema.parse(req.body);

    const result = await mcpToolsService.toggleTool(
      req.user!.id,
      req.params.id,
      isEnabled
    );

    res.json({
      message: `Tool ${isEnabled ? 'enabled' : 'disabled'} successfully`,
      data: result,
    });
  })
);

/**
 * PUT /api/v1/mcp-tools/category/toggle
 * Enable/disable all tools in a category
 */
router.put(
  '/category/toggle',
  asyncHandler(async (req: Request, res: Response) => {
    const { category, isEnabled } = toggleCategorySchema.parse(req.body);

    const results = await mcpToolsService.toggleCategory(
      req.user!.id,
      category,
      isEnabled
    );

    res.json({
      message: `Category ${isEnabled ? 'enabled' : 'disabled'} successfully`,
      data: { count: results.length },
    });
  })
);

/**
 * POST /api/v1/mcp-tools/seed
 * Seed MCP tools catalog (admin only)
 */
router.post(
  '/seed',
  requireSubscription('ENTERPRISE'),
  asyncHandler(async (req: Request, res: Response) => {
    await mcpToolsService.seedTools();

    res.json({
      message: 'MCP tools catalog seeded successfully',
    });
  })
);

export default router;
