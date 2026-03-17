import { promises as fs } from 'fs';
import path from 'path';

import { NextRequest, NextResponse } from 'next/server';

import { adminErrorResponse, requireAdmin } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';

const ALLOWED_DIR = path.join(process.cwd(), 'public', 'uploads', 'knowledge');

type Params = { params: Promise<{ documentId: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const auth = await requireAdmin();
  if ('error' in auth) return adminErrorResponse(auth.error!);

  const { documentId } = await params;
  const doc = await prisma.knowledgeDocument.findUnique({ where: { id: documentId } });

  if (!doc) {
    return NextResponse.json(
      { success: false, error: { code: 'NOT_FOUND', message: 'Document introuvable' } },
      { status: 404 }
    );
  }

  // Validate fileUrl stays within uploads directory (prevent path traversal)
  if (!doc.fileUrl.startsWith('/uploads/knowledge/')) {
    return NextResponse.json(
      { success: false, error: { code: 'NOT_FOUND', message: 'Fichier introuvable' } },
      { status: 404 }
    );
  }
  const fileName = path.basename(doc.fileUrl);
  const filePath = path.join(ALLOWED_DIR, fileName);
  if (!filePath.startsWith(ALLOWED_DIR)) {
    return NextResponse.json(
      { success: false, error: { code: 'NOT_FOUND', message: 'Fichier introuvable' } },
      { status: 404 }
    );
  }

  try {
    await fs.access(filePath);
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'NOT_FOUND', message: 'Fichier introuvable' } },
      { status: 404 }
    );
  }

  const fileBuffer = await fs.readFile(filePath);
  return new NextResponse(fileBuffer, {
    headers: {
      'Content-Type': doc.mimeType,
      'Content-Disposition': `attachment; filename="${doc.fileName}"`,
    },
  });
}
