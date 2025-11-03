import { prisma } from '../utils/database.js';
import { encrypt, decrypt } from '../utils/encryption.js';
import { AppError } from '../middleware/errorHandler.js';
import axios from 'axios';

interface CreateSiteData {
  name: string;
  url: string;
  username: string;
  password: string;
  authType?: string;
}

interface UpdateSiteData {
  name?: string;
  url?: string;
  username?: string;
  password?: string;
  isActive?: boolean;
}

export class SiteService {
  /**
   * Get all sites for a user
   */
  async getUserSites(userId: string) {
    return prisma.site.findMany({
      where: { userId },
      select: {
        id: true,
        name: true,
        url: true,
        username: true,
        authType: true,
        isActive: true,
        isHealthy: true,
        lastChecked: true,
        enabledMcpTools: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get a specific site
   */
  async getSite(siteId: string, userId: string) {
    const site = await prisma.site.findFirst({
      where: { id: siteId, userId },
      select: {
        id: true,
        name: true,
        url: true,
        username: true,
        authType: true,
        isActive: true,
        isHealthy: true,
        lastChecked: true,
        enabledMcpTools: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!site) {
      throw new AppError('Site not found', 404);
    }

    return site;
  }

  /**
   * Create a new site
   */
  async createSite(userId: string, data: CreateSiteData) {
    // Check subscription limits
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        subscription: true,
        sites: true,
      },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    const siteCount = user.sites.length;
    const maxSites = user.subscription?.maxSites || 1;

    if (siteCount >= maxSites) {
      throw new AppError(
        `You have reached the maximum number of sites (${maxSites}) for your plan`,
        403
      );
    }

    // Encrypt password
    const { encrypted, iv } = encrypt(data.password);

    // Create site
    const site = await prisma.site.create({
      data: {
        userId,
        name: data.name,
        url: data.url,
        username: data.username,
        passwordEncrypted: encrypted,
        passwordIv: iv,
        authType: data.authType || 'basic',
      },
      select: {
        id: true,
        name: true,
        url: true,
        username: true,
        authType: true,
        isActive: true,
        createdAt: true,
      },
    });

    // Test connection
    await this.testSiteConnection(site.id, userId);

    return site;
  }

  /**
   * Update a site
   */
  async updateSite(siteId: string, userId: string, data: UpdateSiteData) {
    const site = await prisma.site.findFirst({
      where: { id: siteId, userId },
    });

    if (!site) {
      throw new AppError('Site not found', 404);
    }

    const updateData: any = {
      name: data.name,
      url: data.url,
      username: data.username,
      isActive: data.isActive,
    };

    if (data.password) {
      const { encrypted, iv } = encrypt(data.password);
      updateData.passwordEncrypted = encrypted;
      updateData.passwordIv = iv;
    }

    return prisma.site.update({
      where: { id: siteId },
      data: updateData,
      select: {
        id: true,
        name: true,
        url: true,
        username: true,
        authType: true,
        isActive: true,
        updatedAt: true,
      },
    });
  }

  /**
   * Delete a site
   */
  async deleteSite(siteId: string, userId: string) {
    const site = await prisma.site.findFirst({
      where: { id: siteId, userId },
    });

    if (!site) {
      throw new AppError('Site not found', 404);
    }

    await prisma.site.delete({
      where: { id: siteId },
    });
  }

  /**
   * Test site connection
   */
  async testSiteConnection(siteId: string, userId: string) {
    const site = await prisma.site.findFirst({
      where: { id: siteId, userId },
    });

    if (!site) {
      throw new AppError('Site not found', 404);
    }

    try {
      const password = decrypt(site.passwordEncrypted, site.passwordIv);

      const auth = Buffer.from(`${site.username}:${password}`).toString('base64');

      const response = await axios.get(`${site.url}/wp-json/wp/v2/users/me`, {
        headers: {
          Authorization: `Basic ${auth}`,
        },
        timeout: 10000,
      });

      const isHealthy = response.status === 200;

      await prisma.site.update({
        where: { id: siteId },
        data: {
          isHealthy,
          lastChecked: new Date(),
        },
      });

      return {
        status: isHealthy ? 'success' : 'error',
        message: isHealthy ? 'Connection successful' : 'Connection failed',
        data: response.data,
      };
    } catch (error: any) {
      await prisma.site.update({
        where: { id: siteId },
        data: {
          isHealthy: false,
          lastChecked: new Date(),
        },
      });

      throw new AppError(
        `Failed to connect to WordPress site: ${error.message}`,
        400
      );
    }
  }

  /**
   * Update enabled MCP tools for a site
   */
  async updateMcpTools(siteId: string, userId: string, enabledTools: string[]) {
    const site = await prisma.site.findFirst({
      where: { id: siteId, userId },
    });

    if (!site) {
      throw new AppError('Site not found', 404);
    }

    return prisma.site.update({
      where: { id: siteId },
      data: {
        enabledMcpTools: enabledTools,
      },
      select: {
        id: true,
        name: true,
        url: true,
        enabledMcpTools: true,
        updatedAt: true,
      },
    });
  }
}
