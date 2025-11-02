import { prisma } from '../utils/database.js';
import { encrypt, decrypt } from '../utils/encryption.js';
import { AppError } from '../middleware/errorHandler.js';
import { ApiProvider } from '@prisma/client';
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';

interface CreateApiKeyData {
  provider: ApiProvider;
  key: string;
  name?: string;
}

export class ApiKeyService {
  /**
   * Get all API keys for a user (without exposing actual keys)
   */
  async getUserApiKeys(userId: string) {
    return prisma.apiKey.findMany({
      where: { userId },
      select: {
        id: true,
        provider: true,
        name: true,
        isActive: true,
        lastUsed: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Create a new API key
   */
  async createApiKey(userId: string, data: CreateApiKeyData) {
    // Encrypt the API key
    const { encrypted, iv } = encrypt(data.key);

    // Test the API key before saving
    await this.validateApiKey(data.provider, data.key);

    const apiKey = await prisma.apiKey.create({
      data: {
        userId,
        provider: data.provider,
        keyEncrypted: encrypted,
        keyIv: iv,
        name: data.name || `${data.provider} Key`,
      },
      select: {
        id: true,
        provider: true,
        name: true,
        isActive: true,
        createdAt: true,
      },
    });

    return apiKey;
  }

  /**
   * Delete an API key
   */
  async deleteApiKey(keyId: string, userId: string) {
    const apiKey = await prisma.apiKey.findFirst({
      where: { id: keyId, userId },
    });

    if (!apiKey) {
      throw new AppError('API key not found', 404);
    }

    await prisma.apiKey.delete({
      where: { id: keyId },
    });
  }

  /**
   * Test an API key
   */
  async testApiKey(keyId: string, userId: string) {
    const apiKey = await prisma.apiKey.findFirst({
      where: { id: keyId, userId },
    });

    if (!apiKey) {
      throw new AppError('API key not found', 404);
    }

    const key = decrypt(apiKey.keyEncrypted, apiKey.keyIv);

    try {
      await this.validateApiKey(apiKey.provider, key);

      return {
        status: 'success',
        message: 'API key is valid',
      };
    } catch (error: any) {
      throw new AppError(`API key validation failed: ${error.message}`, 400);
    }
  }

  /**
   * Get decrypted API key for use
   */
  async getDecryptedApiKey(userId: string, provider: ApiProvider): Promise<string> {
    const apiKey = await prisma.apiKey.findFirst({
      where: {
        userId,
        provider,
        isActive: true,
      },
      orderBy: { lastUsed: 'desc' },
    });

    if (!apiKey) {
      throw new AppError(`No active ${provider} API key found`, 404);
    }

    // Update last used
    await prisma.apiKey.update({
      where: { id: apiKey.id },
      data: { lastUsed: new Date() },
    });

    return decrypt(apiKey.keyEncrypted, apiKey.keyIv);
  }

  /**
   * Validate API key by making a test request
   */
  private async validateApiKey(provider: ApiProvider, key: string) {
    if (provider === 'ANTHROPIC') {
      const client = new Anthropic({ apiKey: key });
      await client.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 10,
        messages: [{ role: 'user', content: 'test' }],
      });
    } else if (provider === 'OPENAI') {
      const client = new OpenAI({ apiKey: key });
      await client.chat.completions.create({
        model: 'gpt-3.5-turbo',
        max_tokens: 10,
        messages: [{ role: 'user', content: 'test' }],
      });
    }
  }
}
