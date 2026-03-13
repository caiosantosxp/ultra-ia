import { NextRequest, NextResponse } from 'next/server';

import { adminErrorResponse, requireAdmin } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { createSpecialistSchema } from '@/lib/validations/admin';

export async function GET(request: NextRequest) {
  const auth = await requireAdmin();
  if ('error' in auth) return adminErrorResponse(auth.error!);

  const { searchParams } = request.nextUrl;
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '20')));
  const sortBy = searchParams.get('sortBy') ?? 'createdAt';
  const sortOrder = (searchParams.get('sortOrder') ?? 'desc') as 'asc' | 'desc';
  const search = searchParams.get('search') ?? '';

  const allowedSortFields = ['name', 'domain', 'price', 'createdAt', 'isActive'];
  const orderByField = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';

  const where = search
    ? {
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { domain: { contains: search, mode: 'insensitive' as const } },
        ],
      }
    : {};

  const [specialists, total] = await Promise.all([
    prisma.specialist.findMany({
      where,
      orderBy: { [orderByField]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        _count: { select: { subscriptions: true, conversations: true } },
      },
    }),
    prisma.specialist.count({ where }),
  ]);

  return NextResponse.json({
    success: true,
    data: specialists,
    pagination: { page, limit, total, hasMore: page * limit < total },
  });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if ('error' in auth) return adminErrorResponse(auth.error!);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'VALIDATION_ERROR', message: 'JSON invalide' } },
      { status: 400 }
    );
  }

  const parsed = createSpecialistSchema.safeParse(body);
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
    const specialist = await prisma.specialist.create({
      data: { ...parsed.data, isActive: false },
    });
    return NextResponse.json({ success: true, data: specialist }, { status: 201 });
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Échec de la création' } },
      { status: 500 }
    );
  }
}
