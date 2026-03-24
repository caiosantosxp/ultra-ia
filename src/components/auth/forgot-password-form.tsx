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

/**
 * NexAgent Design System — Forgot Password Form
 */
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
      <div className="w-full rounded-[20px] bg-white p-8 shadow-[0_20px_60px_rgba(0,0,0,0.3)] text-center sm:p-12">
        <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-[#33e9bf]/15">
          <CheckCircle className="size-8 text-[#1a9e7a]" aria-hidden="true" />
        </div>
        <h2 className="mb-2 text-xl font-semibold text-[#161616]">Email envoyé</h2>
        <p className="text-sm text-[#787878]">
          {t.forgotPasswordForm.successMessage}
        </p>
        <Link
          href="/login"
          className="mt-6 inline-block text-sm font-medium text-[#0367fb] transition-colors hover:text-[#0061ff]"
        >
          {t.forgotPasswordForm.successBackToLogin}
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full rounded-[20px] bg-white p-8 shadow-[0_20px_60px_rgba(0,0,0,0.3)] sm:p-12">
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-[#161616]">
          Mot de passe oublié
        </h1>
        <p className="mt-2 text-sm text-[#787878]">
          Entrez votre email pour recevoir un lien de réinitialisation
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <label htmlFor="email" className="text-sm font-medium text-[#161616]">
            Email <span aria-hidden="true" className="text-[#EF4444]">*</span>
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
            <p id="email-error" className="text-xs text-[#EF4444]" role="alert">
              {errors.email.message}
            </p>
          )}
        </div>

        <Button
          type="submit"
          size="lg"
          className="mt-2 w-full"
          disabled={isPending}
        >
          {isPending ? t.forgotPasswordForm.sending : t.forgotPasswordForm.send}
        </Button>

        <div className="text-center">
          <Link
            href="/login"
            className="text-sm text-[#787878] transition-colors hover:text-[#0367fb]"
          >
            {t.forgotPasswordForm.backToLogin}
          </Link>
        </div>
      </form>
    </div>
  );
}
