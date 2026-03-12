import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return Response.json(
      { success: false, error: { code: 'AUTH_REQUIRED', message: 'Authentication required' } },
      { status: 401 }
    );
  }

  try {
    const userData = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        conversations: {
          where: { isDeleted: false },
          include: {
            messages: { orderBy: { createdAt: 'asc' } },
            specialist: { select: { name: true, domain: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
        subscriptions: {
          include: { specialist: { select: { name: true, domain: true } } },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!userData) {
      return Response.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'User not found' } },
        { status: 404 }
      );
    }

    const exportData = {
      exportDate: new Date().toISOString(),
      profile: {
        id: userData.id,
        name: userData.name,
        email: userData.email,
        createdAt: userData.createdAt,
      },
      subscriptions: userData.subscriptions.map((s) => ({
        specialist: s.specialist.name,
        domain: s.specialist.domain,
        status: s.status,
        createdAt: s.createdAt,
      })),
      conversations: userData.conversations.map((c) => ({
        id: c.id,
        specialist: c.specialist.name,
        createdAt: c.createdAt,
        messageCount: c.messages.length,
        messages: c.messages.map((m) => ({
          role: m.role,
          createdAt: m.createdAt,
          content: m.content,
        })),
      })),
    };

    const jsonString = JSON.stringify(exportData, null, 2);

    return new Response(jsonString, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': 'attachment; filename="ultra-ia-data-export.json"',
      },
    });
  } catch (error) {
    console.error('[data-export] Error:', error);
    return Response.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Export failed' } },
      { status: 500 }
    );
  }
}
