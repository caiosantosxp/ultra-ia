'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { signIn } from 'next-auth/react';
import { toast } from 'sonner';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { register } from '@/actions/auth-actions';
import { registerSchema, type RegisterInput } from '@/lib/validations/auth';
import { useT } from '@/lib/i18n/use-t';

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

export function RegisterForm() {
  const router = useRouter();
  const t = useT();
  const [isPending, startTransition] = useTransition();

  const {
    register: rhfRegister,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    mode: 'onBlur',
  });

  const onSubmit = (data: RegisterInput) => {
    startTransition(async () => {
      const result = await register(data);

      if (!result.success) {
        if (result.error.code === 'EMAIL_EXISTS') {
          setError('email', { message: result.error.message });
        } else if (result.error.code === 'VALIDATION_ERROR') {
          toast.error(result.error.message);
        } else {
          toast.error(t.auth.unexpectedError);
        }
        return;
      }

      const signInResult = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (signInResult?.error) {
        toast.error(t.auth.accountCreated);
        router.push('/login');
        return;
      }

      router.push('/chat');
    });
  };

  const handleGoogleSignIn = () => {
    startTransition(async () => {
      await signIn('google', { callbackUrl: '/chat' });
    });
  };

  return (
    <div className="flex w-full max-w-sm flex-col gap-6 p-6 sm:p-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="font-heading text-2xl font-bold">{t.auth.register}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t.auth.joinUs}</p>
      </div>

      {/* Google OAuth */}
      <Button
        type="button"
        variant="outline"
        className="h-11 w-full"
        onClick={handleGoogleSignIn}
        disabled={isPending}
      >
        <GoogleIcon />
        <span className="ml-2">{t.auth.continueWithGoogle}</span>
      </Button>

      {/* Separator */}
      <div className="flex items-center gap-3">
        <Separator className="flex-1" />
        <span className="text-xs text-muted-foreground">{t.auth.or}</span>
        <Separator className="flex-1" />
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
        {/* Name */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="name"
            className="text-sm font-medium leading-none"
          >
            {t.auth.name} <span aria-hidden="true">*</span>
          </label>
          <Input
            id="name"
            type="text"
            placeholder={t.auth.yourName}
            autoComplete="name"
            aria-required="true"
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? 'name-error' : undefined}
            className="h-11 rounded-xl px-4"
            {...rhfRegister('name')}
          />
          {errors.name && (
            <p id="name-error" role="alert" className="text-xs text-destructive">
              {errors.name.message}
            </p>
          )}
        </div>

        {/* Email */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="email"
            className="text-sm font-medium leading-none"
          >
            Email <span aria-hidden="true">*</span>
          </label>
          <Input
            id="email"
            type="email"
            placeholder="votre@email.com"
            autoComplete="email"
            aria-required="true"
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? 'email-error' : undefined}
            className="h-11 rounded-xl px-4"
            {...rhfRegister('email')}
          />
          {errors.email && (
            <p id="email-error" role="alert" className="text-xs text-destructive">
              {errors.email.message}
            </p>
          )}
        </div>

        {/* Password */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="password"
            className="text-sm font-medium leading-none"
          >
            {t.auth.password} <span aria-hidden="true">*</span>
          </label>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            autoComplete="new-password"
            aria-required="true"
            aria-invalid={!!errors.password}
            aria-describedby={errors.password ? 'password-error' : undefined}
            className="h-11 rounded-xl px-4"
            {...rhfRegister('password')}
          />
          {errors.password && (
            <p id="password-error" role="alert" className="text-xs text-destructive">
              {errors.password.message}
            </p>
          )}
        </div>

        {/* Submit */}
        <Button
          type="submit"
          className="mt-2 h-11 w-full"
          disabled={isPending}
        >
          {isPending ? t.auth.creating : t.auth.createMyAccount}
        </Button>
      </form>

      {/* Login link */}
      <p className="text-center text-sm text-muted-foreground">
        {t.auth.alreadyAccount}{' '}
        <Link href="/login" className="text-primary underline-offset-4 hover:underline">
          {t.auth.signIn}
        </Link>
      </p>
    </div>
  );
}
