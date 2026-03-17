'use client';

import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { CheckCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { forgotPasswordSchema, type ForgotPasswordInput } from '@/lib/validations/auth';
import { requestPasswordReset } from '@/actions/auth-actions';
import { useT } from '@/lib/i18n/use-t';

export function ForgotPasswordForm() {
  const t = useT();
  const [isPending, startTransition] = useTransition();
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    mode: 'onBlur',
  });

  const onSubmit = (data: ForgotPasswordInput) => {
    startTransition(async () => {
      await requestPasswordReset(data);
      setSubmitted(true);
    });
  };

  if (submitted) {
    return (
      <div className="rounded-lg border border-border bg-card p-6 text-center">
        <CheckCircle className="mx-auto mb-3 size-10 text-blue-500" aria-hidden="true" />
        <p className="text-sm text-foreground">
          {t.forgotPasswordForm.successMessage}
        </p>
        <Link
          href="/login"
          className="mt-4 inline-block text-sm text-muted-foreground underline-offset-4 hover:text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {t.forgotPasswordForm.successBackToLogin}
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <div className="space-y-1.5">
        <label
          htmlFor="email"
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          Email *
        </label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder={t.forgotPasswordForm.emailPlaceholder}
          aria-required="true"
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? 'email-error' : undefined}
          {...register('email')}
        />
        {errors.email && (
          <p id="email-error" className="text-xs text-destructive" role="alert">
            {errors.email.message}
          </p>
        )}
      </div>

      <Button
        type="submit"
        variant="default"
        className="min-h-11 w-full"
        disabled={isPending}
      >
        {isPending ? t.forgotPasswordForm.sending : t.forgotPasswordForm.send}
      </Button>

      <div className="text-center">
        <Link
          href="/login"
          className="text-sm text-muted-foreground underline-offset-4 hover:text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {t.forgotPasswordForm.backToLogin}
        </Link>
      </div>
    </form>
  );
}
