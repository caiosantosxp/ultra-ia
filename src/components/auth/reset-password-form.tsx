'use client';

import { useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { resetPasswordSchema } from '@/lib/validations/auth';
import { resetPassword } from '@/actions/auth-actions';
import { useT } from '@/lib/i18n/use-t';

interface ResetPasswordFormProps {
  token: string;
}

interface FormValues {
  password: string;
}

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const t = useT();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<FormValues>({
    resolver: zodResolver(resetPasswordSchema.pick({ password: true })),
    mode: 'onBlur',
  });

  const onSubmit = (data: FormValues) => {
    startTransition(async () => {
      const result = await resetPassword({ token, password: data.password });

      if (!result.success) {
        setError('root', { message: result.error.message });
        return;
      }

      toast.success(t.resetPasswordForm.successToast);
      router.push('/login');
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      {errors.root && (
        <div
          role="alert"
          className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
        >
          <p>{errors.root.message}</p>
          <Link
            href="/forgot-password"
            className="mt-1 inline-block font-medium underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {t.resetPasswordForm.requestNewLink}
          </Link>
        </div>
      )}

      <div className="space-y-1.5">
        <label
          htmlFor="password"
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          {t.resetPasswordForm.passwordLabel}
        </label>
        <Input
          id="password"
          type="password"
          autoComplete="new-password"
          placeholder="••••••••"
          aria-required="true"
          aria-invalid={!!errors.password}
          aria-describedby={errors.password ? 'password-error' : undefined}
          {...register('password')}
        />
        {errors.password && (
          <p id="password-error" className="text-xs text-destructive" role="alert">
            {errors.password.message}
          </p>
        )}
      </div>

      <Button
        type="submit"
        variant="default"
        className="min-h-11 w-full"
        disabled={isPending}
      >
        {isPending ? t.resetPasswordForm.updating : t.resetPasswordForm.update}
      </Button>
    </form>
  );
}
