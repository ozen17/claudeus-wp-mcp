import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';
import { authRateLimiter } from '../middleware/rateLimiter.js';
import { authenticate } from '../middleware/auth.js';
import { AuthService } from '../services/auth.service.js';

const router = Router();
const authService = new AuthService();

// Validation schemas
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(100),
  name: z.string().min(1).max(100).optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

const refreshSchema = z.object({
  refreshToken: z.string(),
});

/**
 * POST /api/v1/auth/register
 * Register a new user
 */
router.post(
  '/register',
  authRateLimiter,
  asyncHandler(async (req: Request, res: Response) => {
    const data = registerSchema.parse(req.body);

    const result = await authService.register(data);

    res.status(201).json({
      message: 'User registered successfully',
      data: result,
    });
  })
);

/**
 * POST /api/v1/auth/login
 * Login user and get tokens
 */
router.post(
  '/login',
  authRateLimiter,
  asyncHandler(async (req: Request, res: Response) => {
    const data = loginSchema.parse(req.body);

    const result = await authService.login(data, {
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.json({
      message: 'Login successful',
      data: result,
    });
  })
);

/**
 * POST /api/v1/auth/refresh
 * Refresh access token using refresh token
 */
router.post(
  '/refresh',
  asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = refreshSchema.parse(req.body);

    const result = await authService.refreshTokens(refreshToken);

    res.json({
      message: 'Token refreshed successfully',
      data: result,
    });
  })
);

/**
 * POST /api/v1/auth/logout
 * Logout user and invalidate tokens
 */
router.post(
  '/logout',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;
    const token = authHeader?.substring(7) || '';

    await authService.logout(token);

    res.json({
      message: 'Logout successful',
    });
  })
);

/**
 * GET /api/v1/auth/me
 * Get current user info
 */
router.get(
  '/me',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AppError('User not found', 401);
    }

    const user = await authService.getCurrentUser(req.user.id);

    res.json({
      data: user,
    });
  })
);

export default router;
