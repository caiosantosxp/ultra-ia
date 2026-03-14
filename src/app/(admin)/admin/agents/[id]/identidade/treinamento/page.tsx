import { notFound, redirect } from 'next/navigation';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { KnowledgeUpload } from '@/components/admin/knowledge-upload';

type Props = { params: Promise<{ id: string }> };

export default async function TreinamentoPage({ params }: Props) {
  const session = await auth();
  if (!session?.user || session.user.role !== 'ADMIN') redirect('/chat');

  const { id } = await params;
  const specialist = await prisma.specialist.findUnique({
    where: { id },
    include: { knowledgeDocs: { orderBy: { createdAt: 'desc' } } },
  });

  if (!specialist) notFound();

  return (
    <div className="space-y-4 max-w-3xl">
      <div>
        <h2 className="text-lg font-semibold">Entrainement</h2>
        <p className="text-sm text-muted-foreground">
          Documents utilisés pour entraîner et fonder les réponses de l&apos;expert
        </p>
      </div>
      <div className="rounded-xl border bg-card p-6">
        <KnowledgeUpload
          specialistId={specialist.id}
          initialDocuments={specialist.knowledgeDocs}
        />
      </div>
    </div>
  );
}
