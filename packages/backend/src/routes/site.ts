import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../middleware/errorHandler.js';
import { authenticate } from '../middleware/auth.js';
import { SiteService } from '../services/site.service.js';

const router = Router();
const siteService = new SiteService();

// All routes require authentication
router.use(authenticate);

const createSiteSchema = z.object({
  name: z.string().min(1).max(100),
  url: z.string().url(),
  username: z.string().min(1),
  password: z.string().min(1),
  authType: z.enum(['basic', 'jwt']).default('basic'),
});

const updateSiteSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  url: z.string().url().optional(),
  username: z.string().min(1).optional(),
  password: z.string().min(1).optional(),
  isActive: z.boolean().optional(),
});

/**
 * GET /api/v1/sites
 * Get all user's WordPress sites
 */
router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const sites = await siteService.getUserSites(req.user!.id);

    res.json({
      data: sites,
    });
  })
);

/**
 * GET /api/v1/sites/:id
 * Get a specific site
 */
router.get(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const site = await siteService.getSite(req.params.id, req.user!.id);

    res.json({
      data: site,
    });
  })
);

/**
 * POST /api/v1/sites
 * Add a new WordPress site
 */
router.post(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const data = createSiteSchema.parse(req.body);

    const site = await siteService.createSite(req.user!.id, data);

    res.status(201).json({
      message: 'Site added successfully',
      data: site,
    });
  })
);

/**
 * PUT /api/v1/sites/:id
 * Update a site
 */
router.put(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const data = updateSiteSchema.parse(req.body);

    const site = await siteService.updateSite(
      req.params.id,
      req.user!.id,
      data
    );

    res.json({
      message: 'Site updated successfully',
      data: site,
    });
  })
);

/**
 * DELETE /api/v1/sites/:id
 * Delete a site
 */
router.delete(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    await siteService.deleteSite(req.params.id, req.user!.id);

    res.json({
      message: 'Site deleted successfully',
    });
  })
);

/**
 * POST /api/v1/sites/:id/test
 * Test site connection
 */
router.post(
  '/:id/test',
  asyncHandler(async (req: Request, res: Response) => {
    const result = await siteService.testSiteConnection(
      req.params.id,
      req.user!.id
    );

    res.json({
      data: result,
    });
  })
);

export default router;
