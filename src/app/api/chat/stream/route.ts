import * as Sentry from '@sentry/nextjs';

import { auth } from '@/lib/auth';
import { callN8NStream, N8NCircuitOpenError } from '@/lib/n8n';
import { prisma } from '@/lib/prisma';
import { checkAndIncrementDailyUsage } from '@/lib/rate-limit';
import { chatStreamSchema } from '@/lib/validations/chat';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const STREAM_ERROR_MESSAGE = 'Le spécialiste est temporairement indisponible. Veuillez réessayer.';

function encodeSSE(data: Record<string, unknown>): Uint8Array {
  return new TextEncoder().encode(`data: ${JSON.stringify(data)}\n\n`);
}

export async function POST(req: Request) {
  // AC8 — Auth check
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json(
      { success: false, error: { code: 'AUTH_REQUIRED', message: 'Authentication required' } },
      { status: 401 }
    );
  }
  const userId = session.user.id;

  // AC10 — Zod validation
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json(
      { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid JSON body' } },
      { status: 400 }
    );
  }

  const parsed = chatStreamSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      {
        success: false,
        error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0]?.message ?? 'Validation error' },
      },
      { status: 400 }
    );
  }
  const { conversationId, content } = parsed.data;

  // AC9 — Subscription check (ACTIVE required)
  const subscription = await prisma.subscription.findFirst({
    where: { userId, status: 'ACTIVE' },
    orderBy: { createdAt: 'desc' },
  });
  if (!subscription) {
    return Response.json(
      { success: false, error: { code: 'FORBIDDEN', message: 'Active subscription required' } },
      { status: 403 }
    );
  }

  // AC8 — Daily rate limit check
  const rateLimit = await checkAndIncrementDailyUsage(userId);
  if (!rateLimit.allowed) {
    return Response.json(
      { success: false, error: { code: 'RATE_LIMIT', message: 'Daily message limit reached' } },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': String(rateLimit.limit),
          'X-RateLimit-Remaining': '0',
        },
      }
    );
  }

  // AC11 — Conversation ownership check
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: { specialist: { select: { slug: true } } },
  });
  if (!conversation || conversation.userId !== userId) {
    return Response.json(
      { success: false, error: { code: 'FORBIDDEN', message: 'Access denied' } },
      { status: 403 }
    );
  }

  // Load conversation history for N8N context (before persisting current user message)
  const recentMessages = await prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: 'desc' },
    take: 10,
    select: { role: true, content: true },
  });
  const history = recentMessages.reverse().map((m) => ({
    role: m.role === 'USER' ? ('user' as const) : ('assistant' as const),
    content: m.content,
  }));

  // Persist user message (AC4)
  await prisma.message.create({
    data: { conversationId, userId, content, role: 'USER' },
  });

  // Auto-update title from first message (AC11 - Story 4.3)
  if (!conversation.title || conversation.title === 'Nouvelle conversation') {
    const newTitle = content.slice(0, 50);
    if (newTitle) {
      await prisma.conversation.update({
        where: { id: conversationId },
        data: { title: newTitle },
      });
    }
  }

  const specialistSlug = conversation.specialist.slug;

  // Create SSE ReadableStream (AC1)
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let fullContent = '';

      try {
        const n8nStream = await callN8NStream({
          message: content,
          conversationId,
          userId,
          specialistSlug,
          history,
        });

        const reader = n8nStream.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let isN8NStreaming = false;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          buffer += chunk;

          // Detect if N8N is using SSE format (Opção A) or plain text (Opção B)
          if (!isN8NStreaming && buffer.includes('data:')) {
            isN8NStreaming = true;
          }

          if (isN8NStreaming) {
            // Opção A: N8N sends SSE — proxy the tokens
            const lines = buffer.split('\n');
            buffer = lines.pop() ?? '';

            for (const line of lines) {
              if (!line.startsWith('data: ')) continue;
              const jsonStr = line.slice(6).trim();
              if (!jsonStr) continue;
              try {
                const data = JSON.parse(jsonStr) as { token?: string; done?: boolean };
                if (data.token !== undefined && !data.done) {
                  fullContent += data.token;
                  controller.enqueue(encodeSSE({ token: data.token, done: false }));
                }
              } catch {
                // ignore malformed SSE lines
              }
            }
          }
          // If not SSE format, accumulate in buffer for Opção B handling after loop
        }

        if (!isN8NStreaming && buffer.trim()) {
          // Opção B: N8N returned plain text — simulate streaming word by word
          const words = buffer.trim().split(' ');
          for (const word of words) {
            const token = word + ' ';
            fullContent += token;
            controller.enqueue(encodeSSE({ token, done: false }));
            await new Promise<void>((r) => setTimeout(r, 20));
          }
        }

        // Persist assistant message (AC4)
        if (fullContent.trim()) {
          await prisma.message.create({
            data: { conversationId, userId, content: fullContent.trim(), role: 'ASSISTANT' },
          });
        }

        // Send done event
        controller.enqueue(encodeSSE({ token: '', done: true }));
      } catch (error) {
        // AC6 — Sentry logging (skip for circuit open — known degradation)
        if (!(error instanceof N8NCircuitOpenError)) {
          Sentry.captureException(error, { extra: { conversationId, userId } });
        }

        // AC5 / AC7 — Friendly error message for all N8N failures
        controller.enqueue(encodeSSE({ error: STREAM_ERROR_MESSAGE }));
      } finally {
        controller.close();
      }
    },
  });

  // AC1 — SSE response headers
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
      'X-RateLimit-Limit': String(rateLimit.limit),
      'X-RateLimit-Remaining': String(rateLimit.limit - rateLimit.current),
    },
  });
}
