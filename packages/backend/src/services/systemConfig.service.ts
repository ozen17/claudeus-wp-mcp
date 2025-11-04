import { prisma } from '../utils/database.js';
import { encrypt, decrypt } from '../utils/encryption.js';
import { AppError } from '../middleware/errorHandler.js';
import { logger } from '../utils/logger.js';

interface SystemConfigData {
  openaiApiKey?: string;
  stripeSecretKey?: string;
  smtpSettings?: {
    host: string;
    port: number;
    user: string;
    password: string;
    from: string;
  };
}

/**
 * System Configuration Service
 * Manages system-wide settings that can be configured by admin users
 */
export class SystemConfigService {
  /**
   * Get OpenAI API key (from DB or fallback to env)
   */
  async getOpenAIKey(): Promise<string> {
    try {
      const config = await prisma.systemConfig.findUnique({
        where: { key: 'openai_api_key' },
      });

      if (config && config.value) {
        const encrypted = config.value as any;
        if (encrypted.encrypted && encrypted.iv) {
          return decrypt(encrypted.encrypted, encrypted.iv);
        }
      }

      // Fallback to environment variable
      const envKey = process.env.OPENAI_API_KEY;
      if (envKey) {
        logger.info('Using OpenAI API key from environment variable');
        return envKey;
      }

      throw new AppError(
        'OpenAI API key not configured. Please configure it in Admin Settings.',
        500
      );
    } catch (error: any) {
      if (error instanceof AppError) throw error;

      logger.error('Failed to get OpenAI key', { error });
      throw new AppError('Failed to retrieve OpenAI configuration', 500);
    }
  }

  /**
   * Set OpenAI API key (admin only)
   */
  async setOpenAIKey(apiKey: string): Promise<void> {
    try {
      // Validate key format
      if (!apiKey.startsWith('sk-')) {
        throw new AppError('Invalid OpenAI API key format', 400);
      }

      // Encrypt the key
      const { encrypted, iv } = encrypt(apiKey);

      // Store in database
      await prisma.systemConfig.upsert({
        where: { key: 'openai_api_key' },
        create: {
          key: 'openai_api_key',
          value: { encrypted, iv },
          description: 'OpenAI API key for the Agent',
        },
        update: {
          value: { encrypted, iv },
          updatedAt: new Date(),
        },
      });

      logger.info('OpenAI API key updated successfully');
    } catch (error: any) {
      if (error instanceof AppError) throw error;

      logger.error('Failed to set OpenAI key', { error });
      throw new AppError('Failed to update OpenAI configuration', 500);
    }
  }

  /**
   * Check if OpenAI key is configured
   */
  async isOpenAIKeyConfigured(): Promise<boolean> {
    try {
      const config = await prisma.systemConfig.findUnique({
        where: { key: 'openai_api_key' },
      });

      if (config && config.value) {
        return true;
      }

      // Check environment variable
      return !!process.env.OPENAI_API_KEY;
    } catch (error) {
      return !!process.env.OPENAI_API_KEY;
    }
  }

  /**
   * Get masked OpenAI key (for display in UI)
   */
  async getMaskedOpenAIKey(): Promise<string | null> {
    try {
      const config = await prisma.systemConfig.findUnique({
        where: { key: 'openai_api_key' },
      });

      if (config && config.value) {
        return 'sk-proj-••••••••••••••••••••';
      }

      if (process.env.OPENAI_API_KEY) {
        return 'sk-proj-•••••••••• (from .env)';
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Get OpenAI Assistant ID (from DB or fallback to env)
   */
  async getAssistantId(): Promise<string> {
    try {
      const config = await prisma.systemConfig.findUnique({
        where: { key: 'openai_assistant_id' },
      });

      if (config && config.value) {
        return config.value as string;
      }

      // Fallback to environment variable
      const envAssistantId = process.env.OPENAI_ASSISTANT_ID;
      if (envAssistantId) {
        logger.info('Using OpenAI Assistant ID from environment variable');
        return envAssistantId;
      }

      throw new AppError(
        'OpenAI Assistant ID not configured. Please configure it in Admin Settings.',
        500
      );
    } catch (error: any) {
      if (error instanceof AppError) throw error;

      logger.error('Failed to get Assistant ID', { error });
      throw new AppError('Failed to retrieve Assistant ID configuration', 500);
    }
  }

  /**
   * Set OpenAI Assistant ID (admin only)
   */
  async setAssistantId(assistantId: string): Promise<void> {
    try {
      // Validate Assistant ID format
      if (!assistantId.startsWith('asst_')) {
        throw new AppError('Invalid Assistant ID format (must start with "asst_")', 400);
      }

      // Store in database (not encrypted, it's not sensitive)
      await prisma.systemConfig.upsert({
        where: { key: 'openai_assistant_id' },
        create: {
          key: 'openai_assistant_id',
          value: assistantId,
          description: 'OpenAI Assistant ID for the Agent',
        },
        update: {
          value: assistantId,
          updatedAt: new Date(),
        },
      });

      logger.info('OpenAI Assistant ID updated successfully', { assistantId });
    } catch (error: any) {
      if (error instanceof AppError) throw error;

      logger.error('Failed to set Assistant ID', { error });
      throw new AppError('Failed to update Assistant ID configuration', 500);
    }
  }

  /**
   * Check if Assistant ID is configured
   */
  async isAssistantIdConfigured(): Promise<boolean> {
    try {
      const config = await prisma.systemConfig.findUnique({
        where: { key: 'openai_assistant_id' },
      });

      if (config && config.value) {
        return true;
      }

      // Check environment variable
      return !!process.env.OPENAI_ASSISTANT_ID;
    } catch (error) {
      return !!process.env.OPENAI_ASSISTANT_ID;
    }
  }

  /**
   * Get all system configurations (admin only)
   */
  async getAllConfigs(): Promise<Record<string, any>> {
    const configs = await prisma.systemConfig.findMany();

    const result: Record<string, any> = {};

    for (const config of configs) {
      // Don't expose encrypted values, just indicate if they're set
      if (config.key === 'openai_api_key') {
        result.openaiConfigured = !!config.value;
        result.openaiKey = await this.getMaskedOpenAIKey();
      } else {
        result[config.key] = config.value;
      }
    }

    return result;
  }

  /**
   * Set system configuration (generic)
   */
  async setConfig(key: string, value: any, description?: string): Promise<void> {
    await prisma.systemConfig.upsert({
      where: { key },
      create: {
        key,
        value,
        description,
      },
      update: {
        value,
        updatedAt: new Date(),
      },
    });

    logger.info('System configuration updated', { key });
  }

  /**
   * Get system configuration (generic)
   */
  async getConfig(key: string): Promise<any> {
    const config = await prisma.systemConfig.findUnique({
      where: { key },
    });

    return config?.value || null;
  }

  /**
   * Delete configuration
   */
  async deleteConfig(key: string): Promise<void> {
    await prisma.systemConfig.delete({
      where: { key },
    });

    logger.info('System configuration deleted', { key });
  }
}
