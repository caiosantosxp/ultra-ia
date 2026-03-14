import { notFound, redirect } from 'next/navigation';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

type Props = { params: Promise<{ id: string }> };

export default async function InstrucoesPage({ params }: Props) {
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
