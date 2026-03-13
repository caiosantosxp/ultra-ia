import { z } from 'zod';

export const createConversationSchema = z.object({
  specialistId: z.string().min(1, 'Specialist ID is required'),
});

export const sendMessageSchema = z.object({
  conversationId: z.string().min(1, 'Conversation ID is required'),
  content: z.string().min(1, 'Le message ne peut pas être vide').max(4000, 'Message trop long'),
});

export const chatStreamSchema = z.object({
  conversationId: z.string().cuid('Invalid conversation ID'),
  content: z.string().min(1, 'Le message ne peut pas être vide').max(4000, 'Message trop long'),
});

export type CreateConversationInput = z.infer<typeof createConversationSchema>;
export type SendMessageInput = z.infer<typeof sendMessageSchema>;
export type ChatStreamInput = z.infer<typeof chatStreamSchema>;
