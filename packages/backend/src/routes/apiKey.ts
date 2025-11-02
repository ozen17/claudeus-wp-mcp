import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../middleware/errorHandler.js';
import { authenticate } from '../middleware/auth.js';
import { ApiKeyService } from '../services/apiKey.service.js';

const router = Router();
const apiKeyService = new ApiKeyService();

// All routes require authentication
router.use(authenticate);

const createApiKeySchema = z.object({
  provider: z.enum(['OPENAI', 'ANTHROPIC']),
  key: z.string().min(1),
  name: z.string().min(1).max(100).optional(),
});

/**
 * GET /api/v1/api-keys
 * Get all user's API keys (encrypted keys not returned)
 */
router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const apiKeys = await apiKeyService.getUserApiKeys(req.user!.id);

    res.json({
      data: apiKeys,
    });
  })
);

/**
 * POST /api/v1/api-keys
 * Add a new API key
 */
router.post(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const data = createApiKeySchema.parse(req.body);

    const apiKey = await apiKeyService.createApiKey(req.user!.id, data);

    res.status(201).json({
      message: 'API key added successfully',
      data: apiKey,
    });
  })
);

/**
 * DELETE /api/v1/api-keys/:id
 * Delete an API key
 */
router.delete(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    await apiKeyService.deleteApiKey(req.params.id, req.user!.id);

    res.json({
      message: 'API key deleted successfully',
    });
  })
);

/**
 * POST /api/v1/api-keys/:id/test
 * Test an API key
 */
router.post(
  '/:id/test',
  asyncHandler(async (req: Request, res: Response) => {
    const result = await apiKeyService.testApiKey(req.params.id, req.user!.id);

    res.json({
      data: result,
    });
  })
);

export default router;
