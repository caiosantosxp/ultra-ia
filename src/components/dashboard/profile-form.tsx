'use client';

import { useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { updateProfile } from '@/actions/profile-actions';
import { updateProfileSchema, type UpdateProfileInput } from '@/lib/validations/profile';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useT } from '@/lib/i18n/use-t';

interface ProfileFormProps {
  user: {
    id: string;
    name: string | null;
    email: string | null;
  };
  isOAuthUser: boolean;
  oauthProvider?: string;
}

export function ProfileForm({ user, isOAuthUser, oauthProvider }: ProfileFormProps) {
  const t = useT();
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
    mode: 'onBlur',
    defaultValues: {
      name: user.name ?? '',
      email: user.email ?? '',
    },
  });

  const onSubmit = (data: UpdateProfileInput) => {
    startTransition(async () => {
      const result = await updateProfile(data);
      if (result.success) {
        toast.success(result.data?.message ?? t.settings.savedSuccess);
      } else {
        toast.error(result.error?.message ?? t.settings.error);
      }
    });
  };

  const providerLabel = oauthProvider === 'google' ? 'Google' : (oauthProvider ?? 'OAuth');

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle className="text-xl">{t.settings.profileTitle}</CardTitle>
        <CardDescription>{t.settings.profileDesc}</CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <CardContent className="space-y-6">
          {/* Login method */}
          <div className="space-y-2">
            <p className="text-sm font-medium">{t.settings.loginMethod}</p>
            {isOAuthUser ? (
              <Badge variant="secondary" className="gap-1.5">
                <span>🔗</span>
                <span>{t.settings.connectedVia} {providerLabel}</span>
              </Badge>
            ) : (
              <Badge variant="secondary">{t.settings.emailPassword}</Badge>
            )}
          </div>

          <Separator />

          {/* Name */}
          <div className="space-y-1.5">
            <label htmlFor="name" className="text-sm font-medium">
              {t.auth.name} <span aria-hidden="true">*</span>
            </label>
            <Input
              id="name"
              type="text"
              placeholder={t.auth.yourName}
              className={`h-11 ${errors.name ? 'border-destructive' : ''}`}
              aria-required="true"
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? 'name-error' : undefined}
              {...register('name')}
            />
            {errors.name && (
              <p id="name-error" className="text-destructive text-sm" role="alert">
                {errors.name.message}
              </p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <label htmlFor="email" className="text-sm font-medium">
              Email {!isOAuthUser && <span aria-hidden="true">*</span>}
            </label>
            {isOAuthUser ? (
              <div className="space-y-1">
                <Input
                  id="email"
                  type="email"
                  value={user.email ?? ''}
                  readOnly
                  className="h-11 cursor-not-allowed opacity-60"
                  aria-label={`${t.settings.emailManagedBy} ${providerLabel}`}
                />
                <p className="text-muted-foreground text-xs">
                  {t.settings.emailManagedBy} {providerLabel} — {t.settings.emailNotEditable}
                </p>
              </div>
            ) : (
              <>
                <Input
                  id="email"
                  type="email"
                  placeholder="votre@email.com"
                  className={`h-11 ${errors.email ? 'border-destructive' : ''}`}
                  aria-required="true"
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? 'email-error' : undefined}
                  {...register('email')}
                />
                {errors.email && (
                  <p id="email-error" className="text-destructive text-sm" role="alert">
                    {errors.email.message}
                  </p>
                )}
              </>
            )}
          </div>
        </CardContent>

        <CardFooter className="pt-0">
          <Button
            type="submit"
            disabled={isPending || isOAuthUser}
            className="w-full sm:w-auto"
            aria-busy={isPending}
          >
            {isPending ? t.settings.saving : t.settings.saveChanges}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
