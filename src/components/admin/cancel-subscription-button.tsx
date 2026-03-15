'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { XCircle } from 'lucide-react';
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
import { buttonVariants } from '@/components/ui/button';
import { useT } from '@/lib/i18n/use-t';

interface CancelSubscriptionButtonProps {
  userId: string;
  subscriptionId: string;
}

export function CancelSubscriptionButton({ userId, subscriptionId }: CancelSubscriptionButtonProps) {
  const router = useRouter();
  const t = useT();
  const [isCanceling, setIsCanceling] = useState(false);

  async function handleCancel() {
    setIsCanceling(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}/actions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel-subscription', subscriptionId }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(t.admin.cancelSubBtn.success);
        router.refresh();
      } else {
        toast.error(json.error?.message ?? t.admin.cancelSubBtn.error);
      }
    } catch {
      toast.error(t.admin.cancelSubBtn.networkError);
    } finally {
      setIsCanceling(false);
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger
        className={buttonVariants({ variant: 'ghost', size: 'sm' })}
        disabled={isCanceling}
        aria-label={t.admin.cancelSubBtn.ariaLabel}
      >
        <XCircle className="h-4 w-4 text-destructive" />
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t.admin.cancelSubBtn.title}</AlertDialogTitle>
          <AlertDialogDescription>
            {t.admin.cancelSubBtn.desc}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t.admin.cancelSubBtn.back}</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleCancel}
            className={buttonVariants({ variant: 'destructive' })}
          >
            {t.admin.cancelSubBtn.confirm}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
