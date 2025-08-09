import { z } from "zod";

export const MessageRoleSchema = z.enum(["user", "assistant", "developer"]);

export const MessageSchema = z.object({
    role: MessageRoleSchema,
    content: z.string().min(1).max(10000),
});

export const MessagesArraySchema = z.array(MessageSchema).min(1).max(50);

export const StreamRequestSchema = z.object({
    messages: MessagesArraySchema,
    conversationId: z.string().uuid().optional(),
    model: z.string().min(1).max(50),
});

export type MessageRole = z.infer<typeof MessageRoleSchema>;
export type Message = z.infer<typeof MessageSchema>;
export type StreamRequest = z.infer<typeof StreamRequestSchema>;
