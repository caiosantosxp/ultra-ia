import { KeywordsManager } from '@/components/admin/keywords-manager';
import { requireExpert } from '@/lib/expert-helpers';
import { prisma } from '@/lib/prisma';

export default async function ExpertLeadsConfiguracaoPage() {
  const { specialist } = await requireExpert();

  const keywords = await prisma.keyword.findMany({
    where: { specialistId: specialist.id },
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
          specialistId={specialist.id}
          initialKeywords={keywords}
          maxKeywords={50}
        />
      </div>
    </div>
  );
}
