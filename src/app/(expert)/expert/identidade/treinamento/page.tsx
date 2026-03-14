import { KnowledgeUpload } from '@/components/admin/knowledge-upload';
import { requireExpert } from '@/lib/expert-helpers';
import { prisma } from '@/lib/prisma';

export default async function ExpertTreinamentoPage() {
  const { specialist: base } = await requireExpert();

  const specialist = await prisma.specialist.findUnique({
    where: { id: base.id },
    include: { knowledgeDocs: { orderBy: { createdAt: 'desc' } } },
  });

  if (!specialist) return null;

  return (
    <div className="space-y-4 max-w-3xl">
      <div>
        <h2 className="text-lg font-semibold">Entrainement</h2>
        <p className="text-sm text-muted-foreground">
          Documents utilisés pour entraîner et fonder les réponses de l&apos;expert
        </p>
      </div>
      <div className="rounded-xl border bg-card p-6">
        <KnowledgeUpload specialistId={specialist.id} initialDocuments={specialist.knowledgeDocs} />
      </div>
    </div>
  );
}
