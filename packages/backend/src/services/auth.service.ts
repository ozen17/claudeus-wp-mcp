import { prisma } from '../utils/database.js';
import { hashPassword, comparePassword } from '../utils/encryption.js';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from '../utils/jwt.js';
import { AppError } from '../middleware/errorHandler.js';
import { logger } from '../utils/logger.js';

interface RegisterData {
  email: string;
  password: string;
  name?: string;
}

interface LoginData {
  email: string;
  password: string;
}

interface SessionContext {
  ipAddress?: string;
  userAgent?: string;
}

export class AuthService {
  /**
   * Register a new user
   */
  async register(data: RegisterData) {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new AppError('User with this email already exists', 409);
    }

    // Hash password
    const passwordHash = await hashPassword(data.password);

    // Create user with default FREE subscription
    const subscription = await prisma.subscription.create({
      data: {
        tier: 'FREE',
        status: 'ACTIVE',
        maxSites: 1,
        maxRequests: 50,
      },
    });

    const user = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        name: data.name,
        subscriptionId: subscription.id,
      },
      select: {
        id: true,
        email: true,
        name: true,
        subscription: {
          select: {
            tier: true,
            maxSites: true,
            maxRequests: true,
          },
        },
        createdAt: true,
      },
    });

    logger.info('New user registered:', { userId: user.id, email: user.email });

    // Generate tokens
    const tokens = this.generateTokenPair(user);

    return {
      user,
      ...tokens,
    };
  }

  /**
   * Login user
   */
  async login(data: LoginData, context: SessionContext) {
    // Find user
    const user = await prisma.user.findUnique({
      where: { email: data.email },
      include: {
        subscription: {
          select: {
            tier: true,
            status: true,
            maxSites: true,
            maxRequests: true,
          },
        },
      },
    });

    if (!user) {
      throw new AppError('Invalid email or password', 401);
    }

    // Verify password
    const isPasswordValid = await comparePassword(
      data.password,
      user.passwordHash
    );

    if (!isPasswordValid) {
      throw new AppError('Invalid email or password', 401);
    }

    // Check subscription status
    if (user.subscription?.status !== 'ACTIVE') {
      throw new AppError('Your subscription is not active', 403);
    }

    // Generate tokens
    const tokens = this.generateTokenPair(user);

    // Create session
    await prisma.session.create({
      data: {
        userId: user.id,
        refreshToken: tokens.refreshToken,
        accessToken: tokens.accessToken,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    logger.info('User logged in:', {
      userId: user.id,
      email: user.email,
      ip: context.ipAddress,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        subscription: user.subscription,
      },
      ...tokens,
    };
  }

  /**
   * Refresh tokens
   */
  async refreshTokens(refreshToken: string) {
    // Verify refresh token
    const payload = verifyRefreshToken(refreshToken);

    // Check if session exists
    const session = await prisma.session.findUnique({
      where: { refreshToken },
      include: {
        user: {
          include: {
            subscription: true,
          },
        },
      },
    });

    if (!session) {
      throw new AppError('Invalid refresh token', 401);
    }

    // Check if session expired
    if (session.expiresAt < new Date()) {
      await prisma.session.delete({ where: { id: session.id } });
      throw new AppError('Session expired, please login again', 401);
    }

    // Generate new tokens
    const tokens = this.generateTokenPair(session.user);

    // Update session
    await prisma.session.update({
      where: { id: session.id },
      data: {
        refreshToken: tokens.refreshToken,
        accessToken: tokens.accessToken,
      },
    });

    logger.info('Tokens refreshed:', { userId: session.user.id });

    return tokens;
  }

  /**
   * Logout user
   */
  async logout(accessToken: string) {
    // Find and delete session
    const session = await prisma.session.findUnique({
      where: { accessToken },
    });

    if (session) {
      await prisma.session.delete({ where: { id: session.id } });
      logger.info('User logged out:', { userId: session.userId });
    }
  }

  /**
   * Get current user
   */
  async getCurrentUser(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        emailVerified: true,
        twoFactorEnabled: true,
        subscription: {
          select: {
            tier: true,
            status: true,
            maxSites: true,
            maxRequests: true,
            currentPeriodEnd: true,
          },
        },
        createdAt: true,
        lastLoginAt: true,
      },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    return user;
  }

  /**
   * Generate access and refresh tokens
   */
  private generateTokenPair(user: { id: string; email: string; subscription?: { tier: string } | null }) {
    const payload = {
      userId: user.id,
      email: user.email,
      subscriptionTier: user.subscription?.tier || 'FREE',
    };

    return {
      accessToken: generateAccessToken(payload),
      refreshToken: generateRefreshToken(payload),
    };
  }
}
