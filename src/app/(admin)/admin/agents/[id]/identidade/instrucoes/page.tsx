import { notFound, redirect } from 'next/navigation';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getT } from '@/lib/i18n/get-t';

type Props = { params: Promise<{ id: string }> };

export default async function InstrucoesPage({ params }: Props) {
  const t = await getT();
  const session = await auth();
  if (!session?.user || session.user.role !== 'ADMIN') redirect('/chat');

  const { id } = await params;
  const specialist = await prisma.specialist.findUnique({
    where: { id },
    select: { systemPrompt: true },
  });

  if (!specialist) notFound();

  return (
    <div className="space-y-4 max-w-3xl">
      <div>
        <h2 className="text-lg font-semibold">{t.instructionsPage.title}</h2>
        <p className="text-sm text-muted-foreground">{t.instructionsPage.description}</p>
      </div>
      <div className="rounded-xl border bg-card p-6 space-y-4">
        {specialist.systemPrompt ? (
          <pre className="rounded-lg bg-muted p-4 text-xs font-mono whitespace-pre-wrap overflow-x-auto max-h-[60vh] leading-relaxed">
            {specialist.systemPrompt}
          </pre>
        ) : (
          <p className="text-sm text-muted-foreground">{t.instructionsPage.noInstructions}</p>
        )}
        <p className="text-xs text-muted-foreground">{t.instructionsPage.editNote}</p>
      </div>
    </div>
  );
}
