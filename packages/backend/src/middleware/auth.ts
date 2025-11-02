import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, JWTPayload } from '../utils/jwt.js';
import { AppError } from './errorHandler.js';
import { prisma } from '../utils/database.js';

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        subscriptionTier?: string;
      };
    }
  }
}

/**
 * Middleware to verify JWT and attach user to request
 */
export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Authentication required', 401);
    }

    const token = authHeader.substring(7);

    // Verify token
    const payload: JWTPayload = verifyAccessToken(token);

    // Check if user still exists
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        subscription: {
          select: {
            tier: true,
            status: true,
          },
        },
      },
    });

    if (!user) {
      throw new AppError('User not found', 401);
    }

    // Attach user to request
    req.user = {
      id: user.id,
      email: user.email,
      subscriptionTier: user.subscription?.tier,
    };

    next();
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
    } else {
      next(new AppError('Invalid authentication token', 401));
    }
  }
}

/**
 * Middleware to check subscription tier
 */
export function requireSubscription(
  ...allowedTiers: string[]
) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401));
    }

    const userTier = req.user.subscriptionTier || 'FREE';

    if (!allowedTiers.includes(userTier)) {
      return next(
        new AppError(
          `This feature requires ${allowedTiers.join(' or ')} subscription`,
          403
        )
      );
    }

    next();
  };
}
