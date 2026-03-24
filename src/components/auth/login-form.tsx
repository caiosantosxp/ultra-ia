'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { login } from '@/actions/auth-actions';
import { loginSchema, type LoginInput } from '@/lib/validations/auth';
import { useT } from '@/lib/i18n/use-t';

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

  const displayError = authError ?? (callbackError ? t.auth.error : null);

  return (
    <div className="w-full rounded-2xl bg-white p-8 shadow-2xl sm:p-10">
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-[#161616]">
          {t.auth.signIn}
        </h1>
        <p className="mt-2 text-sm text-[#787878]">{t.auth.welcome}</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
        {displayError && (
          <p
            role="alert"
            className="rounded-lg border border-[#EF4444]/30 bg-[#EF4444]/10 px-4 py-3 text-sm text-[#EF4444]"
          >
            {displayError}
          </p>
        )}

        {/* Email */}
        <div className="flex flex-col gap-2">
          <label htmlFor="email" className="text-sm font-medium text-[#161616]">
            Email <span className="text-[#EF4444]">*</span>
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
            <p id="email-error" role="alert" className="text-xs text-[#EF4444]">
              {errors.email.message}
            </p>
          )}
        </div>

        {/* Password */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="text-sm font-medium text-[#161616]">
              {t.auth.password} <span className="text-[#EF4444]">*</span>
            </label>
            <Link
              href="/forgot-password"
              className="text-sm text-[#787878] transition-colors hover:text-[#0367fb]"
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
            <p id="password-error" role="alert" className="text-xs text-[#EF4444]">
              {errors.password.message}
            </p>
          )}
        </div>

        {/* Submit */}
        <Button
          type="submit"
          size="lg"
          className="mt-2 w-full"
          disabled={isPending}
        >
          {isPending ? t.auth.signingIn : t.auth.signIn}
        </Button>
      </form>

      {/* Register link */}
      <p className="mt-6 text-center text-sm text-[#787878]">
        {t.auth.noAccount}{' '}
        <Link
          href="/register"
          className="font-medium text-[#0367fb] transition-colors hover:text-[#0550c8]"
        >
          {t.auth.createAccountLink}
        </Link>
      </p>
    </div>
  );
}
