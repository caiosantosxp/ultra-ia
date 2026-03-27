import { requireExpert } from '@/lib/expert-helpers';
import { prisma } from '@/lib/prisma';
import { getT } from '@/lib/i18n/get-t';
import { InstructionsForm } from '@/components/admin/instructions-form';

export default async function ExpertInstrucoesPage() {
  const t = await getT();
  const { specialist: base } = await requireExpert();

  const specialist = await prisma.specialist.findUnique({
    where: { id: base.id },
    select: { id: true, systemPrompt: true },
  });

  if (!specialist) return null;

  return (
    <div className="space-y-4 max-w-3xl">
      <div>
        <h2 className="text-lg font-semibold">{t.instructionsPage.title}</h2>
        <p className="text-sm text-muted-foreground">{t.instructionsPage.description}</p>
      </div>
      <div className="rounded-xl border bg-card p-6">
        <InstructionsForm specialistId={specialist.id} initialPrompt={specialist.systemPrompt} />
      </div>
    </div>
  );
}
