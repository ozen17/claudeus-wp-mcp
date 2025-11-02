import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../middleware/errorHandler.js';
import { authenticate } from '../middleware/auth.js';
import { UserService } from '../services/user.service.js';

const router = Router();
const userService = new UserService();

// All routes require authentication
router.use(authenticate);

const updateProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  avatarUrl: z.string().url().optional(),
});

const changePasswordSchema = z.object({
  currentPassword: z.string(),
  newPassword: z.string().min(8).max(100),
});

/**
 * GET /api/v1/user/profile
 * Get user profile
 */
router.get(
  '/profile',
  asyncHandler(async (req: Request, res: Response) => {
    const profile = await userService.getProfile(req.user!.id);

    res.json({
      data: profile,
    });
  })
);

/**
 * PUT /api/v1/user/profile
 * Update user profile
 */
router.put(
  '/profile',
  asyncHandler(async (req: Request, res: Response) => {
    const data = updateProfileSchema.parse(req.body);

    const profile = await userService.updateProfile(req.user!.id, data);

    res.json({
      message: 'Profile updated successfully',
      data: profile,
    });
  })
);

/**
 * POST /api/v1/user/change-password
 * Change user password
 */
router.post(
  '/change-password',
  asyncHandler(async (req: Request, res: Response) => {
    const data = changePasswordSchema.parse(req.body);

    await userService.changePassword(req.user!.id, data);

    res.json({
      message: 'Password changed successfully',
    });
  })
);

export default router;
