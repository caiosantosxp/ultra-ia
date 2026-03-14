'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Copy, ExternalLink, Clock } from 'lucide-react';
import type { SubscriptionStatus } from '@prisma/client';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Specialist {
  name: string;
  domain: string;
  accentColor: string;
}

interface Subscription {
  id: string;
  status: SubscriptionStatus;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  specialist: Specialist;
}

interface UserDetailCardProps {
  userId: string;
  subscriptions: Subscription[];
}

function SubscriptionStatusBadge({ status }: { status: SubscriptionStatus }) {
  switch (status) {
    case 'ACTIVE':
      return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">ATIVO</Badge>;
    case 'PAST_DUE':
      return (
        <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">PAGAMENTO FALHOU</Badge>
      );
    case 'CANCELED':
      return <Badge variant="secondary">CANCELADO</Badge>;
    case 'EXPIRED':
      return <Badge variant="secondary">EXPIRADO</Badge>;
    case 'PENDING':
      return <Badge variant="outline">PENDENTE</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

function SubscriptionActions({
  userId,
  subscription,
}: {
  userId: string;
  subscription: Subscription;
}) {
  const router = useRouter();
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const [isExtending, setIsExtending] = useState(false);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);

  const canTakeActions =
    subscription.status === 'ACTIVE' || subscription.status === 'PAST_DUE';

  async function handleGeneratePortalLink() {
    setIsGeneratingLink(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}/actions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate-portal-link' }),
      });
      const json = await res.json();
      if (json.success) {
        setGeneratedLink(json.data.url);
        toast.success('Link de pagamento gerado com sucesso!');
      } else {
        toast.error(json.error?.message ?? 'Erro ao gerar link');
      }
    } catch {
      toast.error('Erro de rede ao gerar link de pagamento');
    } finally {
      setIsGeneratingLink(false);
    }
  }

  async function handleExtendGracePeriod() {
    setIsExtending(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}/actions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'extend-grace-period' }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success('Período de graça estendido em +7 dias!');
        router.refresh();
      } else {
        toast.error(json.error?.message ?? 'Erro ao estender período');
      }
    } catch {
      toast.error('Erro de rede ao estender período de graça');
    } finally {
      setIsExtending(false);
    }
  }

  async function handleCopyLink() {
    if (!generatedLink) return;
    try {
      await navigator.clipboard.writeText(generatedLink);
      toast.success('Link copiado para a área de transferência!');
    } catch {
      toast.error('Não foi possível copiar o link');
    }
  }

  return (
    <div className="space-y-3">
      {canTakeActions && (
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleGeneratePortalLink}
            disabled={isGeneratingLink}
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            {isGeneratingLink ? 'Gerando...' : 'Gerar link de pagamento'}
          </Button>

          <AlertDialog>
            <AlertDialogTrigger
              className={buttonVariants({ variant: 'outline', size: 'sm' })}
              disabled={isExtending}
            >
              <Clock className="mr-2 h-4 w-4" />
              {isExtending ? 'Estendendo...' : 'Estender +7 dias'}
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirmar extensão de acesso</AlertDialogTitle>
                <AlertDialogDescription>
                  Isso irá estender o período de acesso desta assinatura em +7 dias no banco de
                  dados local. A alteração não será sincronizada com o Stripe imediatamente.
                  Confirma?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleExtendGracePeriod}>
                  Confirmar extensão
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}

      {generatedLink && (
        <div className="rounded-md border bg-muted p-3">
          <p className="mb-2 text-xs font-medium text-muted-foreground">
            Link gerado (compartilhe com o usuário):
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 truncate rounded text-xs">{generatedLink}</code>
            <Button size="sm" variant="outline" onClick={handleCopyLink}>
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export function UserDetailCard({ userId, subscriptions }: UserDetailCardProps) {
  if (subscriptions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Assinaturas</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Este usuário não possui assinaturas registradas.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Assinaturas</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {subscriptions.map((sub) => (
          <div key={sub.id} className="rounded-md border p-4 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium">{sub.specialist.name}</p>
                <p className="text-sm text-muted-foreground">{sub.specialist.domain}</p>
              </div>
              <SubscriptionStatusBadge status={sub.status} />
            </div>

            {(sub.currentPeriodStart || sub.currentPeriodEnd) && (
              <div className="text-xs text-muted-foreground">
                {sub.currentPeriodStart && (
                  <span>
                    Início: {new Date(sub.currentPeriodStart).toLocaleDateString('pt-BR')}
                  </span>
                )}
                {sub.currentPeriodStart && sub.currentPeriodEnd && ' → '}
                {sub.currentPeriodEnd && (
                  <span>
                    Fim: {new Date(sub.currentPeriodEnd).toLocaleDateString('pt-BR')}
                  </span>
                )}
                {sub.cancelAtPeriodEnd && (
                  <span className="ml-2 text-orange-600">(Cancelamento agendado)</span>
                )}
              </div>
            )}

            <SubscriptionActions userId={userId} subscription={sub} />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
