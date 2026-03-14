import { requireExpert } from '@/lib/expert-helpers';
import { prisma } from '@/lib/prisma';

export default async function ExpertInstrucoesPage() {
  const { specialist: base } = await requireExpert();

  const specialist = await prisma.specialist.findUnique({
    where: { id: base.id },
    select: { systemPrompt: true },
  });

  if (!specialist) return null;

  return (
    <div className="space-y-4 max-w-3xl">
      <div>
        <h2 className="text-lg font-semibold">Instructions</h2>
        <p className="text-sm text-muted-foreground">
          System prompt — instructions de base qui définissent le comportement de l&apos;expert
        </p>
      </div>
      <div className="rounded-xl border bg-card p-6 space-y-4">
        {specialist.systemPrompt ? (
          <pre className="rounded-lg bg-muted p-4 text-xs font-mono whitespace-pre-wrap overflow-x-auto max-h-[60vh] leading-relaxed">
            {specialist.systemPrompt}
          </pre>
        ) : (
          <p className="text-sm text-muted-foreground">Aucune instruction configurée.</p>
        )}
        <p className="text-xs text-muted-foreground">
          Pour modifier, accédez à Personnalisation &rarr; Expérience &rarr; Profil.
        </p>
      </div>
    </div>
  );
}
