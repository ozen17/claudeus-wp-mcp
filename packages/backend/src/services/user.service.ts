import { prisma } from '../utils/database.js';
import { comparePassword, hashPassword } from '../utils/encryption.js';
import { AppError } from '../middleware/errorHandler.js';

interface UpdateProfileData {
  name?: string;
  avatarUrl?: string;
}

interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

export class UserService {
  /**
   * Get user profile
   */
  async getProfile(userId: string) {
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
        _count: {
          select: {
            sites: true,
            conversations: true,
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
   * Update user profile
   */
  async updateProfile(userId: string, data: UpdateProfileData) {
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        name: data.name,
        avatarUrl: data.avatarUrl,
      },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        updatedAt: true,
      },
    });

    return user;
  }

  /**
   * Change user password
   */
  async changePassword(userId: string, data: ChangePasswordData) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Verify current password
    const isPasswordValid = await comparePassword(
      data.currentPassword,
      user.passwordHash
    );

    if (!isPasswordValid) {
      throw new AppError('Current password is incorrect', 401);
    }

    // Hash new password
    const newPasswordHash = await hashPassword(data.newPassword);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newPasswordHash },
    });
  }
}
