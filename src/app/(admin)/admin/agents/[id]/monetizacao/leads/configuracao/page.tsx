import { notFound, redirect } from 'next/navigation';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { KeywordsManager } from '@/components/admin/keywords-manager';

type Props = { params: Promise<{ id: string }> };

export default async function LeadsConfiguracaoPage({ params }: Props) {
  const session = await auth();
  if (!session?.user || session.user.role !== 'ADMIN') redirect('/chat');

  const { id } = await params;

  const specialist = await prisma.specialist.findUnique({
    where: { id },
    select: { id: true, name: true },
  });

  if (!specialist) notFound();

  const keywords = await prisma.keyword.findMany({
    where: { specialistId: id },
    orderBy: { createdAt: 'asc' },
    select: { id: true, name: true, weight: true },
  });

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Configuração de leads</h2>
        <p className="text-sm text-muted-foreground">
          Palavras-chave para detecção e qualificação de leads
        </p>
      </div>
      <div className="flex-1 min-h-0">
        <KeywordsManager
          specialistId={id}
          initialKeywords={keywords}
          maxKeywords={50}
        />
      </div>
    </div>
  );
}
