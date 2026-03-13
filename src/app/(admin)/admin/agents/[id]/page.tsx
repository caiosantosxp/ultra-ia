import { notFound, redirect } from 'next/navigation';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { AgentForm } from '@/components/admin/agent-form';
import { KnowledgeUpload } from '@/components/admin/knowledge-upload';

type Props = { params: Promise<{ id: string }> };

export default async function AgentEditPage({ params }: Props) {
  const session = await auth();
  if (!session?.user || session.user.role !== 'ADMIN') redirect('/chat');

  const { id } = await params;
  const specialist = await prisma.specialist.findUnique({
    where: { id },
    include: { knowledgeDocs: { orderBy: { createdAt: 'desc' } } },
  });

  if (!specialist) notFound();

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold font-heading">{specialist.name}</h1>
        <p className="text-sm text-muted-foreground mt-1">Modifier les informations de l&apos;agent</p>
      </div>

      <section className="rounded-lg border p-6 space-y-4">
        <h2 className="text-base font-semibold">Informations générales</h2>
        <AgentForm
          specialistId={specialist.id}
          defaultValues={{
            name: specialist.name,
            slug: specialist.slug,
            domain: specialist.domain,
            description: specialist.description,
            price: specialist.price,
            accentColor: specialist.accentColor,
            avatarUrl: specialist.avatarUrl,
            tags: specialist.tags,
            quickPrompts: specialist.quickPrompts,
            systemPrompt: specialist.systemPrompt ?? '',
            scopeLimits: specialist.scopeLimits ?? '',
          }}
        />
      </section>

      <section className="rounded-lg border p-6 space-y-4">
        <h2 className="text-base font-semibold">Base de connaissances</h2>
        <KnowledgeUpload
          specialistId={specialist.id}
          initialDocuments={specialist.knowledgeDocs}
        />
      </section>
    </div>
  );
}
