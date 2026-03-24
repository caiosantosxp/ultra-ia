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
import { register } from '@/actions/auth-actions';
import { registerSchema, type RegisterInput } from '@/lib/validations/auth';
import { useT } from '@/lib/i18n/use-t';

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

  return (
    <div className="w-full rounded-2xl bg-white p-8 shadow-2xl sm:p-10">
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-[#161616]">
          {t.auth.register}
        </h1>
        <p className="mt-2 text-sm text-[#787878]">{t.auth.joinUs}</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
        {/* Name */}
        <div className="flex flex-col gap-2">
          <label htmlFor="name" className="text-sm font-medium text-[#161616]">
            {t.auth.name} <span className="text-[#EF4444]">*</span>
          </label>
          <Input
            id="name"
            type="text"
            placeholder={t.auth.yourName}
            autoComplete="name"
            aria-required="true"
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? 'name-error' : undefined}
            {...rhfRegister('name')}
          />
          {errors.name && (
            <p id="name-error" role="alert" className="text-xs text-[#EF4444]">
              {errors.name.message}
            </p>
          )}
        </div>

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
            {...rhfRegister('email')}
          />
          {errors.email && (
            <p id="email-error" role="alert" className="text-xs text-[#EF4444]">
              {errors.email.message}
            </p>
          )}
        </div>

        {/* Password */}
        <div className="flex flex-col gap-2">
          <label htmlFor="password" className="text-sm font-medium text-[#161616]">
            {t.auth.password} <span className="text-[#EF4444]">*</span>
          </label>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            autoComplete="new-password"
            aria-required="true"
            aria-invalid={!!errors.password}
            aria-describedby={errors.password ? 'password-error' : undefined}
            {...rhfRegister('password')}
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
          {isPending ? t.auth.creating : t.auth.createMyAccount}
        </Button>
      </form>

      {/* Login link */}
      <p className="mt-6 text-center text-sm text-[#787878]">
        {t.auth.alreadyAccount}{' '}
        <Link
          href="/login"
          className="font-medium text-[#0367fb] transition-colors hover:text-[#0550c8]"
        >
          {t.auth.signIn}
        </Link>
      </p>
    </div>
  );
}
