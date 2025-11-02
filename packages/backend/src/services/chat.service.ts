import { Response } from 'express';
import { prisma } from '../utils/database.js';
import { AppError } from '../middleware/errorHandler.js';
import { AgentService } from './agent.service.js';
import { PolicyService } from './policy.service.js';
import { McpClientService } from './mcp-client.service.js';
import { logger } from '../utils/logger.js';

interface ChatData {
  message: string;
  siteId: string; // Now required - always associated with a site
  conversationId?: string;
}

interface ToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

/**
 * Chat Service v2
 * Uses OpenAI Agent + MCP Client + Policy filtering
 */
export class ChatService {
  private agentService: AgentService;
  private policyService: PolicyService;
  private mcpClient: McpClientService;

  constructor() {
    this.agentService = new AgentService();
    this.policyService = new PolicyService();
    this.mcpClient = new McpClientService();
  }

  /**
   * Stream chat response using OpenAI Agent
   */
  async streamChat(userId: string, data: ChatData, res: Response) {
    try {
      // Validate site
      const site = await prisma.site.findFirst({
        where: { id: data.siteId, userId },
      });

      if (!site) {
        throw new AppError('Site not found', 404);
      }

      if (!site.isActive) {
        throw new AppError('Site is not active', 403);
      }

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
            model: 'gpt-4o',
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

      // Get policy context (allowed tools, constraints)
      const policyContext = await this.policyService.getPolicyContext(
        data.siteId,
        userId
      );

      // Setup SSE
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      let fullResponse = '';
      let toolCalls: any[] = [];
      let threadId = conversation.agentId || null;

      // Process with Agent
      const generator = this.agentService.processMessage(
        threadId,
        data.message,
        policyContext
      );

      for await (const chunk of generator) {
        if (typeof chunk === 'string') {
          // Text response from agent
          fullResponse += chunk;
          res.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
        } else if (Array.isArray(chunk)) {
          // Tool calls requested by agent
          toolCalls = chunk;

          // Process tool calls
          const toolResults = await this.processToolCalls(
            userId,
            data.siteId,
            toolCalls
          );

          // Send tool results back to agent
          if (threadId && toolResults.length > 0) {
            // Note: We would need to handle submitting tool outputs
            // and continue the conversation loop here
            // For now, we'll log and continue
            logger.info('Tool calls processed', {
              conversationId: conversation.id,
              toolCount: toolResults.length,
            });
          }
        }
      }

      // Save assistant message
      const assistantMessage = await prisma.message.create({
        data: {
          conversationId: conversation.id,
          role: 'assistant',
          content: fullResponse,
          toolCalls: toolCalls.length > 0 ? JSON.parse(JSON.stringify(toolCalls)) : null,
        },
      });

      // Update conversation
      await prisma.conversation.update({
        where: { id: conversation.id },
        data: {
          lastMessageAt: new Date(),
          agentId: threadId || undefined,
        },
      });

      // Send completion
      res.write('data: [DONE]\n\n');
      res.end();
    } catch (error: any) {
      logger.error('Chat streaming error', { error: error.message, userId });

      // Send error to client
      res.write(
        `data: ${JSON.stringify({ error: error.message || 'An error occurred' })}\n\n`
      );
      res.end();
    }
  }

  /**
   * Process tool calls from the Agent
   */
  private async processToolCalls(
    userId: string,
    siteId: string,
    toolCalls: ToolCall[]
  ): Promise<any[]> {
    const results = [];

    for (const toolCall of toolCalls) {
      try {
        if (toolCall.function.name === 'execute_wordpress_action') {
          const args = JSON.parse(toolCall.function.arguments);

          // Extract action details
          const { category, action, tool, params, requireConfirm } = args;

          logger.info('Processing tool call', {
            userId,
            siteId,
            category,
            action,
            tool,
          });

          // Check permissions
          const permission = await this.policyService.checkPermission(
            siteId,
            category,
            action
          );

          if (!permission.allowed) {
            results.push({
              tool_call_id: toolCall.id,
              output: JSON.stringify({
                success: false,
                error: permission.reason || 'Permission denied',
                needsPermission: true,
                category,
                action,
              }),
            });

            // Log denied action
            await this.logAuditTrail(
              userId,
              siteId,
              category,
              action,
              tool,
              'Permission denied: ' + permission.reason,
              { success: false },
              false
            );

            continue;
          }

          // Check if confirmation is required
          if (requireConfirm) {
            const needsConfirm = await this.policyService.requiresConfirmation(
              siteId,
              category,
              action
            );

            if (needsConfirm) {
              results.push({
                tool_call_id: toolCall.id,
                output: JSON.stringify({
                  success: false,
                  error: 'Confirmation required',
                  needsConfirmation: true,
                  action: {
                    category,
                    action,
                    tool,
                    params,
                  },
                }),
              });
              continue;
            }
          }

          // Apply constraints
          const constrainedParams = await this.policyService.applyConstraints(
            siteId,
            category,
            params
          );

          // Execute MCP tool
          const mcpResult = await this.mcpClient.callTool(siteId, {
            tool,
            params: constrainedParams,
          });

          // Log audit trail
          await this.logAuditTrail(
            userId,
            siteId,
            category,
            action,
            tool,
            JSON.stringify(params),
            mcpResult.data,
            mcpResult.success
          );

          // Return result
          results.push({
            tool_call_id: toolCall.id,
            output: JSON.stringify(mcpResult),
          });
        } else {
          // Unknown tool
          results.push({
            tool_call_id: toolCall.id,
            output: JSON.stringify({
              success: false,
              error: 'Unknown tool',
            }),
          });
        }
      } catch (error: any) {
        logger.error('Tool call processing error', {
          error: error.message,
          toolCall,
        });

        results.push({
          tool_call_id: toolCall.id,
          output: JSON.stringify({
            success: false,
            error: error.message || 'Tool execution failed',
          }),
        });
      }
    }

    return results;
  }

  /**
   * Log action to audit trail
   */
  private async logAuditTrail(
    userId: string,
    siteId: string,
    category: any,
    action: any,
    toolName: string,
    intent: string,
    result: any,
    success: boolean
  ) {
    try {
      await prisma.auditLog.create({
        data: {
          userId,
          siteId,
          category,
          action,
          toolName,
          intent,
          result: JSON.stringify(result),
          success,
          metadata: {
            timestamp: new Date().toISOString(),
          },
        },
      });
    } catch (error) {
      logger.error('Failed to log audit trail', { error });
      // Non-critical, don't throw
    }
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

    // Delete thread on OpenAI if exists
    if (conversation.agentId) {
      await this.agentService.deleteThread(conversation.agentId);
    }

    await prisma.conversation.delete({
      where: { id: conversationId },
    });
  }
}
