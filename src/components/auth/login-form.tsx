'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { login } from '@/actions/auth-actions';
import { loginSchema, type LoginInput } from '@/lib/validations/auth';
import { useT } from '@/lib/i18n/use-t';

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

interface LoginFormProps {
  callbackError?: string;
}

export function LoginForm({ callbackError }: LoginFormProps) {
  const router = useRouter();
  const t = useT();
  const [isPending, startTransition] = useTransition();
  const [authError, setAuthError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    mode: 'onBlur',
  });

  const onSubmit = (data: LoginInput) => {
    setAuthError(null);
    startTransition(async () => {
      const result = await login(data);
      if (result.success) {
        router.push(result.data.redirectTo);
      } else if (result.error.code === 'INVALID_CREDENTIALS') {
        setAuthError(result.error.message);
      } else {
        setAuthError(t.auth.error);
      }
    });
  };

  const handleGoogleSignIn = () => {
    startTransition(async () => {
      await signIn('google', { callbackUrl: '/chat' }); // Google OAuth redireciona para /chat; middleware encaminha admins para /admin/dashboard
    });
  };

  const displayError = authError ?? (callbackError ? t.auth.error : null);

  return (
    <div className="w-full rounded-2xl border border-border/60 bg-card p-6 shadow-xl ring-1 ring-foreground/5 sm:p-8">
      {/* Header */}
      <div className="mb-6 text-center">
        <h1 className="font-heading text-2xl font-bold tracking-tight">{t.auth.signIn}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t.auth.welcome}</p>
      </div>

      {/* Google OAuth */}
      <Button
        type="button"
        variant="outline"
        size="pill"
        className="w-full"
        onClick={handleGoogleSignIn}
        disabled={isPending}
      >
        <GoogleIcon />
        <span>{t.auth.continueWithGoogle}</span>
      </Button>

      {/* Separator */}
      <div className="my-5 flex items-center gap-3">
        <Separator className="flex-1" />
        <span className="text-xs text-muted-foreground">{t.auth.or}</span>
        <Separator className="flex-1" />
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
        {displayError && (
          <p role="alert" className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {displayError}
          </p>
        )}

        {/* Email */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="text-sm font-medium">
            Email <span aria-hidden="true" className="text-destructive">*</span>
          </label>
          <Input
            id="email"
            type="email"
            placeholder="votre@email.com"
            autoComplete="email"
            aria-required="true"
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? 'email-error' : undefined}
            {...register('email')}
          />
          {errors.email && (
            <p id="email-error" role="alert" className="text-xs text-destructive">
              {errors.email.message}
            </p>
          )}
        </div>

        {/* Password */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="text-sm font-medium">
              {t.auth.password} <span aria-hidden="true" className="text-destructive">*</span>
            </label>
            <Link
              href="/forgot-password"
              className="text-xs text-muted-foreground transition-colors hover:text-primary"
            >
              {t.auth.forgotPassword}
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            autoComplete="current-password"
            aria-required="true"
            aria-invalid={!!errors.password}
            aria-describedby={errors.password ? 'password-error' : undefined}
            {...register('password')}
          />
          {errors.password && (
            <p id="password-error" role="alert" className="text-xs text-destructive">
              {errors.password.message}
            </p>
          )}
        </div>

        {/* Submit */}
        <Button type="submit" size="pill" className="mt-1 w-full" disabled={isPending}>
          {isPending ? t.auth.signingIn : t.auth.signIn}
        </Button>
      </form>

      {/* Register link */}
      <p className="mt-5 text-center text-sm text-muted-foreground">
        {t.auth.noAccount}{' '}
        <Link href="/register" className="font-medium text-primary underline-offset-4 hover:underline">
          {t.auth.createAccountLink}
        </Link>
      </p>
    </div>
  );
}
