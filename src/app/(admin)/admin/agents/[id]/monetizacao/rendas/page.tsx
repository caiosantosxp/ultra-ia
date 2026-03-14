import { notFound, redirect } from 'next/navigation';
import { DollarSign, TrendingUp, Users } from 'lucide-react';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

function formatCurrency(cents: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(cents / 100);
}

type Props = { params: Promise<{ id: string }> };

export default async function RendasPage({ params }: Props) {
  const session = await auth();
  if (!session?.user || session.user.role !== 'ADMIN') redirect('/chat');

  const { id } = await params;

  const [specialist, activeSubscriptions, totalSubscriptions] = await Promise.all([
    prisma.specialist.findUnique({
      where: { id },
      select: { name: true, price: true },
    }),
    prisma.subscription.count({ where: { specialistId: id, status: 'ACTIVE' } }),
    prisma.subscription.count({ where: { specialistId: id } }),
  ]);

  if (!specialist) notFound();

  const mrr = activeSubscriptions * specialist.price;

  return (
    <div className="space-y-4 max-w-3xl">
      <div>
        <h2 className="text-lg font-semibold">Revenus</h2>
        <p className="text-sm text-muted-foreground">Revenus et abonnements actifs</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">MRR</p>
          </div>
          <p className="text-2xl font-bold">{formatCurrency(mrr)}</p>
          <p className="text-xs text-muted-foreground mt-1">Receita mensal recorrente</p>
        </div>

        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <Users className="h-4 w-4 text-muted-foreground" />
            <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">Ativos</p>
          </div>
          <p className="text-2xl font-bold">{activeSubscriptions}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {formatCurrency(specialist.price)} / mês cada
          </p>
        </div>

        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">Total</p>
          </div>
          <p className="text-2xl font-bold">{totalSubscriptions}</p>
          <p className="text-xs text-muted-foreground mt-1">Histórico de assinaturas</p>
        </div>
      </div>

      <div className="flex h-48 items-center justify-center rounded-xl border border-dashed bg-card">
        <p className="text-sm text-muted-foreground">
          Histórico de receita — disponível em breve
        </p>
      </div>
    </div>
  );
}
