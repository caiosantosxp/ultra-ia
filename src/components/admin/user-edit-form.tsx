'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { updateUser, updateUserRole, softDeleteUser } from '@/actions/admin-user-actions';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Role = 'USER' | 'EXPERT' | 'ADMIN';

interface UserEditFormProps {
  userId: string;
  initialName: string | null;
  initialEmail: string | null;
  initialRole: Role;
  hasOAuthAccount: boolean;
  hasOwnedSpecialist: boolean;
  isSelf: boolean;
}

export function UserEditForm({
  userId,
  initialName,
  initialEmail,
  initialRole,
  hasOAuthAccount,
  hasOwnedSpecialist,
  isSelf,
}: UserEditFormProps) {
  const router = useRouter();
  const t = useT();
  const [isPending, startTransition] = useTransition();

  const [name, setName] = useState(initialName ?? '');
  const [email, setEmail] = useState(initialEmail ?? '');
  const [role, setRole] = useState<Role>(initialRole);

  function handleSave() {
    startTransition(async () => {
      const updates: Promise<{ success: boolean; error?: { message: string } }>[] = [];

      if (name !== (initialName ?? '') || email !== (initialEmail ?? '')) {
        updates.push(
          updateUser(userId, {
            name: name !== (initialName ?? '') ? name : undefined,
            email: email !== (initialEmail ?? '') ? email : undefined,
          })
        );
      }

      if (role !== initialRole) {
        updates.push(updateUserRole(userId, role));
      }

      if (updates.length === 0) {
        toast.info(t.admin.userEditPage.noChanges);
        return;
      }

      const results = await Promise.all(updates);
      const failed = results.find((r) => !r.success);

      if (failed) {
        toast.error(failed.error?.message ?? t.admin.userEditPage.saveError);
      } else {
        toast.success(t.admin.userEditPage.saveSuccess);
        router.refresh();
      }
    });
  }

  function handleDelete() {
    startTransition(async () => {
      const result = await softDeleteUser(userId);
      if (result.success) {
        toast.success(t.admin.userEditPage.deactivateSuccess);
        router.push('/admin/users');
      } else {
        toast.error(result.error?.message ?? t.admin.userEditPage.deactivateError);
      }
    });
  }

  const roleDowngradeBlocked = initialRole === 'EXPERT' && role !== 'EXPERT' && hasOwnedSpecialist;

  return (
    <div className="space-y-6">
      {/* Edit Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t.admin.userEditPage.formTitle}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Name */}
          <div className="space-y-1.5">
            <Label htmlFor="name">{t.admin.userEditPage.fullName}</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t.admin.userEditPage.namePlaceholder}
              disabled={isPending}
            />
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@example.com"
              disabled={isPending || hasOAuthAccount}
            />
            {hasOAuthAccount && (
              <p className="text-xs text-muted-foreground">
                {t.admin.userEditPage.emailOAuthNote}
              </p>
            )}
          </div>

          {/* Role */}
          <div className="space-y-1.5">
            <Label htmlFor="role">Role</Label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value as Role)}
              disabled={isPending || isSelf}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="USER">USER</option>
              <option value="EXPERT">EXPERT</option>
              <option value="ADMIN">ADMIN</option>
            </select>
            {isSelf && (
              <p className="text-xs text-muted-foreground">
                {t.admin.userEditPage.roleCannotChange}
              </p>
            )}
            {role === 'EXPERT' && initialRole !== 'EXPERT' && (
              <p className="text-xs text-amber-600">
                {t.admin.userEditPage.roleExpertNote}
              </p>
            )}
            {roleDowngradeBlocked && (
              <p className="text-xs text-destructive">
                {t.admin.userEditPage.roleDowngradeNote}
              </p>
            )}
          </div>

          <Button
            onClick={handleSave}
            disabled={isPending || roleDowngradeBlocked}
            className="w-full sm:w-auto"
          >
            {isPending ? t.admin.userEditPage.saving : t.admin.userEditPage.saveChanges}
          </Button>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-base text-destructive">{t.admin.userEditPage.dangerZone}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium">{t.admin.userEditPage.deactivateTitle}</p>
              <p className="text-xs text-muted-foreground">
                {t.admin.userEditPage.deactivateDesc}
              </p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger
                className={buttonVariants({ variant: 'destructive', size: 'sm' })}
                disabled={isPending || isSelf || hasOwnedSpecialist}
              >
                {t.admin.userEditPage.deactivateBtn}
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t.admin.userEditPage.confirmDeactivationTitle}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {t.admin.userEditPage.confirmDeactivationDesc}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t.settings.cancel}</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    className={buttonVariants({ variant: 'destructive' })}
                  >
                    {t.admin.userEditPage.confirmDeactivationBtn}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
          {hasOwnedSpecialist && (
            <p className="text-xs text-amber-600 flex items-center gap-1">
              <Badge variant="outline" className="text-amber-600 border-amber-400 text-[10px]">{t.admin.userEditPage.blocked}</Badge>
              {t.admin.userEditPage.transferNote}
            </p>
          )}
          {isSelf && (
            <p className="text-xs text-muted-foreground">{t.admin.userEditPage.cannotDeactivateSelf}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
