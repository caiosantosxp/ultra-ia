import { NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (session.user.role !== 'EXPERT') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const specialist = await prisma.specialist.findFirst({
    where: { ownerId: session.user.id },
    select: { id: true },
  });

  if (!specialist) {
    return NextResponse.json({ error: 'No specialist linked' }, { status: 404 });
  }

  return NextResponse.json({ specialistId: specialist.id });
}
