import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../middleware/errorHandler.js';
import { authenticate } from '../middleware/auth.js';
import { ChatService } from '../services/chat.service.js';

const router = Router();
const chatService = new ChatService();

// All routes require authentication
router.use(authenticate);

const createChatSchema = z.object({
  message: z.string().min(1),
  siteId: z.string(), // Now required - chat is always associated with a site
  conversationId: z.string().optional(),
});

/**
 * POST /api/v1/chat
 * Send a message to the AI assistant
 */
router.post(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const data = createChatSchema.parse(req.body);

    // Set headers for SSE (Server-Sent Events)
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    await chatService.streamChat(req.user!.id, data, res);
  })
);

/**
 * GET /api/v1/chat/conversations
 * Get user's conversation history
 */
router.get(
  '/conversations',
  asyncHandler(async (req: Request, res: Response) => {
    const conversations = await chatService.getConversations(req.user!.id);

    res.json({
      data: conversations,
    });
  })
);

/**
 * GET /api/v1/chat/conversations/:id
 * Get a specific conversation with messages
 */
router.get(
  '/conversations/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const conversation = await chatService.getConversation(
      req.params.id,
      req.user!.id
    );

    res.json({
      data: conversation,
    });
  })
);

/**
 * DELETE /api/v1/chat/conversations/:id
 * Delete a conversation
 */
router.delete(
  '/conversations/:id',
  asyncHandler(async (req: Request, res: Response) => {
    await chatService.deleteConversation(req.params.id, req.user!.id);

    res.json({
      message: 'Conversation deleted successfully',
    });
  })
);

export default router;
