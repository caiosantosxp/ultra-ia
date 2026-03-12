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
        toast.success(result.data?.message ?? 'Profil mis à jour avec succès');
      } else {
        toast.error(result.error?.message ?? 'Une erreur est survenue');
      }
    });
  };

  const providerLabel = oauthProvider === 'google' ? 'Google' : (oauthProvider ?? 'OAuth');

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle className="text-xl">Mon Profil</CardTitle>
        <CardDescription>Gérez vos informations personnelles</CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <CardContent className="space-y-6">
          {/* Méthode de connexion */}
          <div className="space-y-2">
            <p className="text-sm font-medium">Méthode de connexion</p>
            {isOAuthUser ? (
              <Badge variant="secondary" className="gap-1.5">
                <span>🔗</span>
                <span>Connecté via {providerLabel}</span>
              </Badge>
            ) : (
              <Badge variant="secondary">Email / Mot de passe</Badge>
            )}
          </div>

          <Separator />

          {/* Nom */}
          <div className="space-y-1.5">
            <label htmlFor="name" className="text-sm font-medium">
              Nom <span aria-hidden="true">*</span>
            </label>
            <Input
              id="name"
              type="text"
              placeholder="Votre nom"
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
                  aria-label={`Email géré par ${providerLabel}`}
                />
                <p className="text-muted-foreground text-xs">
                  Email géré par {providerLabel} — non modifiable
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
            {isPending ? 'Enregistrement...' : 'Enregistrer les modifications'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
