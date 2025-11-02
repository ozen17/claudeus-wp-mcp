import { Response } from 'express';
import { prisma } from '../utils/database.js';
import { AppError } from '../middleware/errorHandler.js';
import { ApiKeyService } from './apiKey.service.js';
import { ApiProvider } from '@prisma/client';
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';

interface ChatData {
  message: string;
  siteId?: string;
  provider: ApiProvider;
  model?: string;
  conversationId?: string;
}

export class ChatService {
  private apiKeyService = new ApiKeyService();

  /**
   * Stream chat response
   */
  async streamChat(userId: string, data: ChatData, res: Response) {
    // Get user's API key
    const apiKey = await this.apiKeyService.getDecryptedApiKey(
      userId,
      data.provider
    );

    // Get or create conversation
    let conversation;
    if (data.conversationId) {
      conversation = await prisma.conversation.findFirst({
        where: { id: data.conversationId, userId },
        include: { messages: { orderBy: { createdAt: 'asc' } } },
      });

      if (!conversation) {
        throw new AppError('Conversation not found', 404);
      }
    } else {
      conversation = await prisma.conversation.create({
        data: {
          userId,
          siteId: data.siteId,
          title: data.message.substring(0, 50),
          provider: data.provider,
          model: data.model || this.getDefaultModel(data.provider),
        },
        include: { messages: true },
      });
    }

    // Save user message
    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: 'user',
        content: data.message,
      },
    });

    // Stream AI response
    if (data.provider === 'ANTHROPIC') {
      await this.streamAnthropicResponse(
        apiKey,
        conversation,
        data.message,
        res
      );
    } else {
      await this.streamOpenAIResponse(apiKey, conversation, data.message, res);
    }
  }

  /**
   * Stream Anthropic response
   */
  private async streamAnthropicResponse(
    apiKey: string,
    conversation: any,
    message: string,
    res: Response
  ) {
    const client = new Anthropic({ apiKey });

    const messages = conversation.messages.map((m: any) => ({
      role: m.role === 'user' ? 'user' : 'assistant',
      content: m.content,
    }));

    messages.push({ role: 'user', content: message });

    const stream = await client.messages.stream({
      model: conversation.model,
      max_tokens: 4096,
      messages,
    });

    let fullResponse = '';
    let promptTokens = 0;
    let completionTokens = 0;

    for await (const event of stream) {
      if (event.type === 'content_block_delta') {
        if (event.delta.type === 'text_delta') {
          fullResponse += event.delta.text;
          res.write(`data: ${JSON.stringify({ text: event.delta.text })}\n\n`);
        }
      } else if (event.type === 'message_start') {
        promptTokens = event.message.usage.input_tokens;
      } else if (event.type === 'message_delta') {
        completionTokens = event.usage.output_tokens;
      }
    }

    // Save assistant message
    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: 'assistant',
        content: fullResponse,
        promptTokens,
        completionTokens,
        totalTokens: promptTokens + completionTokens,
      },
    });

    // Update conversation
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { lastMessageAt: new Date() },
    });

    res.write('data: [DONE]\n\n');
    res.end();
  }

  /**
   * Stream OpenAI response
   */
  private async streamOpenAIResponse(
    apiKey: string,
    conversation: any,
    message: string,
    res: Response
  ) {
    const client = new OpenAI({ apiKey });

    const messages = conversation.messages.map((m: any) => ({
      role: m.role,
      content: m.content,
    }));

    messages.push({ role: 'user', content: message });

    const stream = await client.chat.completions.create({
      model: conversation.model,
      messages,
      stream: true,
    });

    let fullResponse = '';

    for await (const chunk of stream) {
      const text = chunk.choices[0]?.delta?.content || '';
      if (text) {
        fullResponse += text;
        res.write(`data: ${JSON.stringify({ text })}\n\n`);
      }
    }

    // Save assistant message
    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: 'assistant',
        content: fullResponse,
      },
    });

    // Update conversation
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { lastMessageAt: new Date() },
    });

    res.write('data: [DONE]\n\n');
    res.end();
  }

  /**
   * Get conversations
   */
  async getConversations(userId: string) {
    return prisma.conversation.findMany({
      where: { userId },
      include: {
        site: {
          select: {
            id: true,
            name: true,
            url: true,
          },
        },
        _count: {
          select: { messages: true },
        },
      },
      orderBy: { lastMessageAt: 'desc' },
    });
  }

  /**
   * Get conversation with messages
   */
  async getConversation(conversationId: string, userId: string) {
    const conversation = await prisma.conversation.findFirst({
      where: { id: conversationId, userId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
        site: {
          select: {
            id: true,
            name: true,
            url: true,
          },
        },
      },
    });

    if (!conversation) {
      throw new AppError('Conversation not found', 404);
    }

    return conversation;
  }

  /**
   * Delete conversation
   */
  async deleteConversation(conversationId: string, userId: string) {
    const conversation = await prisma.conversation.findFirst({
      where: { id: conversationId, userId },
    });

    if (!conversation) {
      throw new AppError('Conversation not found', 404);
    }

    await prisma.conversation.delete({
      where: { id: conversationId },
    });
  }

  /**
   * Get default model for provider
   */
  private getDefaultModel(provider: ApiProvider): string {
    return provider === 'ANTHROPIC'
      ? 'claude-3-5-sonnet-20241022'
      : 'gpt-4';
  }
}
