import { NextRequest, NextResponse } from 'next/server';

import { adminErrorResponse, requireAdmin } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { updateSpecialistSchema } from '@/lib/validations/admin';

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const auth = await requireAdmin();
  if ('error' in auth) return adminErrorResponse(auth.error!);

  const { id } = await params;
  const specialist = await prisma.specialist.findUnique({
    where: { id },
    include: {
      knowledgeDocs: { orderBy: { createdAt: 'desc' } },
      _count: { select: { subscriptions: true, conversations: true } },
    },
  });

  if (!specialist) {
    return NextResponse.json(
      { success: false, error: { code: 'NOT_FOUND', message: 'Agent introuvable' } },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true, data: specialist });
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const auth = await requireAdmin();
  if ('error' in auth) return adminErrorResponse(auth.error!);

  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'VALIDATION_ERROR', message: 'JSON invalide' } },
      { status: 400 }
    );
  }

  const parsed = updateSpecialistSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0].message },
      },
      { status: 400 }
    );
  }

  try {
    const specialist = await prisma.specialist.update({ where: { id }, data: parsed.data });
    return NextResponse.json({ success: true, data: specialist });
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Échec de la mise à jour' } },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const auth = await requireAdmin();
  if ('error' in auth) return adminErrorResponse(auth.error!);

  const { id } = await params;

  const activeSubscriptions = await prisma.subscription.count({
    where: { specialistId: id, status: 'ACTIVE' },
  });
  if (activeSubscriptions > 0) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'CONFLICT',
          message: `Impossible de supprimer: ${activeSubscriptions} abonnement(s) actif(s)`,
        },
      },
      { status: 409 }
    );
  }

  try {
    await prisma.specialist.delete({ where: { id } });
    return NextResponse.json({ success: true, data: { id } });
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Échec de la suppression' } },
      { status: 500 }
    );
  }
}
