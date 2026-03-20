'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, RefreshCw, Search, User, UserMinus, UserPlus } from 'lucide-react';
import { toast } from 'sonner';

import { assignSpecialistOwner } from '@/actions/admin-actions';
import { resendExpertInvite, sendExpertInvite } from '@/actions/admin-invite-actions';
import { useT } from '@/lib/i18n/use-t';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

interface Owner {
  id: string;
  name: string | null;
  email: string | null;
}

interface ExpertUser {
  id: string;
  name: string | null;
  email: string | null;
}

interface PendingInvite {
  email: string;
  expiresAt: Date;
  isExpired: boolean;
}

interface SpecialistOwnerCardProps {
  specialistId: string;
  owner: Owner | null;
  availableExperts: ExpertUser[];
  pendingInvite?: PendingInvite | null;
}

export function SpecialistOwnerCard({
  specialistId,
  owner,
  availableExperts,
  pendingInvite,
}: SpecialistOwnerCardProps) {
  const router = useRouter();
  const t = useT();
  const [isPending, startTransition] = useTransition();
  const [isInvitePending, startInviteTransition] = useTransition();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState('');

  const filteredExperts = availableExperts.filter((u) => {
    const q = search.toLowerCase();
    return (
      u.name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q)
    );
  });

  function handleUnlink() {
    startTransition(async () => {
      const result = await assignSpecialistOwner(specialistId, null);
      if (result.success) {
        toast.success(t.admin.ownerCard.unlinkSuccess);
        router.refresh();
      } else {
        toast.error(result.error?.message ?? t.admin.ownerCard.unlinkError);
      }
    });
  }

  function handleAssign() {
    if (!selectedUserId) return;
    startTransition(async () => {
      const result = await assignSpecialistOwner(specialistId, selectedUserId);
      if (result.success) {
        toast.success(t.admin.ownerCard.linkSuccess);
        setDialogOpen(false);
        router.refresh();
      } else {
        toast.error(result.error?.message ?? t.admin.ownerCard.linkError);
      }
    });
  }

  function handleSendInvite() {
    if (!inviteEmail.trim()) return;
    startInviteTransition(async () => {
      const result = await sendExpertInvite(specialistId, inviteEmail.trim());
      if (result.success) {
        toast.success(t.admin.inviteExpert.inviteSuccess);
        setInviteEmail('');
        router.refresh();
      } else {
        toast.error(result.error?.message ?? t.admin.inviteExpert.inviteError);
      }
    });
  }

  function handleResendInvite() {
    startInviteTransition(async () => {
      const result = await resendExpertInvite(specialistId);
      if (result.success) {
        toast.success(t.admin.inviteExpert.resendSuccess);
        router.refresh();
      } else {
        toast.error(result.error?.message ?? t.admin.inviteExpert.inviteError);
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t.admin.ownerCard.title}</CardTitle>
      </CardHeader>
      <CardContent>
        {owner ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                  <User className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium">{owner.name ?? t.admin.ownerCard.noName}</p>
                  <p className="text-xs text-muted-foreground">{owner.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href={`/admin/users/${owner.id}`}
                  className={buttonVariants({ variant: 'outline', size: 'sm' })}
                >
                  {t.admin.ownerCard.viewUser}
                </Link>
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              {/* Transfer to another expert */}
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger
                  className={buttonVariants({ variant: 'outline', size: 'sm' })}
                  disabled={isPending}
                >
                  <UserPlus className="mr-1.5 h-3.5 w-3.5" />
                  {t.admin.ownerCard.transfer}
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{t.admin.ownerCard.transferTitle}</DialogTitle>
                  </DialogHeader>
                  <p className="text-sm text-muted-foreground">
                    {t.admin.ownerCard.transferDesc.replace('{name}', owner.name ?? owner.email ?? '')}
                  </p>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder={t.admin.ownerCard.searchPlaceholder}
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <div className="max-h-52 overflow-y-auto space-y-1 border rounded-md p-1">
                    {filteredExperts.length === 0 ? (
                      <p className="p-3 text-sm text-muted-foreground text-center">
                        {t.admin.ownerCard.noExpertsAvailable}
                      </p>
                    ) : (
                      filteredExperts.map((u) => (
                        <button
                          key={u.id}
                          onClick={() => setSelectedUserId(u.id)}
                          className={`w-full flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors text-left ${
                            selectedUserId === u.id
                              ? 'bg-primary text-primary-foreground'
                              : 'hover:bg-muted'
                          }`}
                        >
                          <User className="h-3.5 w-3.5 shrink-0" />
                          <span className="flex-1 truncate">{u.name ?? u.email}</span>
                          <span className="text-xs opacity-60 truncate">{u.email}</span>
                        </button>
                      ))
                    )}
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setDialogOpen(false)}>
                      {t.settings.cancel}
                    </Button>
                    <Button
                      onClick={handleAssign}
                      disabled={!selectedUserId || isPending}
                    >
                      {isPending ? t.admin.ownerCard.transferring : t.admin.ownerCard.confirmTransfer}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              {/* Unlink owner */}
              <AlertDialog>
                <AlertDialogTrigger
                  className={buttonVariants({ variant: 'outline', size: 'sm' })}
                  disabled={isPending}
                >
                  <UserMinus className="mr-1.5 h-3.5 w-3.5" />
                  {t.admin.ownerCard.unlink}
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{t.admin.ownerCard.unlinkTitle}</AlertDialogTitle>
                    <AlertDialogDescription>
                      {t.admin.ownerCard.unlinkDesc.replace('{name}', owner.name ?? owner.email ?? '')}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t.settings.cancel}</AlertDialogCancel>
                    <AlertDialogAction onClick={handleUnlink}>
                      {t.admin.ownerCard.confirmUnlink}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-muted-foreground">{t.admin.ownerCard.noOwner}</Badge>
              <p className="text-xs text-muted-foreground">{t.admin.ownerCard.noOwnerDesc}</p>
            </div>

            {/* ── Invite section ── */}
            <div className="space-y-2 border rounded-lg p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {t.admin.inviteExpert.sectionTitle}
              </p>

              {pendingInvite ? (
                <div className="space-y-2">
                  <Badge
                    variant="outline"
                    className={pendingInvite.isExpired ? 'text-destructive border-destructive' : 'text-emerald-600 border-emerald-500'}
                  >
                    <Mail className="mr-1.5 h-3 w-3" />
                    {pendingInvite.isExpired
                      ? t.admin.inviteExpert.inviteExpired.replace('{email}', pendingInvite.email)
                      : t.admin.inviteExpert.invitePending.replace('{email}', pendingInvite.email)
                    }
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleResendInvite}
                    disabled={isInvitePending}
                    className="w-full"
                  >
                    <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                    {isInvitePending ? t.admin.inviteExpert.resending : t.admin.inviteExpert.resendInvite}
                  </Button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Input
                    type="email"
                    placeholder={t.admin.inviteExpert.emailPlaceholder}
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    disabled={isInvitePending}
                    aria-label={t.admin.inviteExpert.emailLabel}
                  />
                  <Button
                    size="sm"
                    onClick={handleSendInvite}
                    disabled={!inviteEmail.trim() || isInvitePending}
                  >
                    <Mail className="mr-1.5 h-3.5 w-3.5" />
                    {isInvitePending ? t.admin.inviteExpert.sending : t.admin.inviteExpert.sendInvite}
                  </Button>
                </div>
              )}
            </div>

            {/* ── Link existing expert ── */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger
                className={buttonVariants({ variant: 'outline', size: 'sm' })}
                disabled={isPending}
              >
                <UserPlus className="mr-1.5 h-3.5 w-3.5" />
                {t.admin.ownerCard.linkExpert}
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t.admin.ownerCard.linkTitle}</DialogTitle>
                </DialogHeader>
                <p className="text-sm text-muted-foreground">
                  {t.admin.ownerCard.linkDesc}
                </p>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder={t.admin.ownerCard.searchPlaceholder}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <div className="max-h-52 overflow-y-auto space-y-1 border rounded-md p-1">
                  {filteredExperts.length === 0 ? (
                    <p className="p-3 text-sm text-muted-foreground text-center">
                      {t.admin.ownerCard.noExpertsAvailable}
                    </p>
                  ) : (
                    filteredExperts.map((u) => (
                      <button
                        key={u.id}
                        onClick={() => setSelectedUserId(u.id)}
                        className={`w-full flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors text-left ${
                          selectedUserId === u.id
                            ? 'bg-primary text-primary-foreground'
                            : 'hover:bg-muted'
                        }`}
                      >
                        <User className="h-3.5 w-3.5 shrink-0" />
                        <span className="flex-1 truncate">{u.name ?? u.email}</span>
                        <span className="text-xs opacity-60 truncate">{u.email}</span>
                      </button>
                    ))
                  )}
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>
                    {t.settings.cancel}
                  </Button>
                  <Button
                    onClick={handleAssign}
                    disabled={!selectedUserId || isPending}
                  >
                    {isPending ? t.admin.ownerCard.linking : t.admin.ownerCard.confirmLink}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
