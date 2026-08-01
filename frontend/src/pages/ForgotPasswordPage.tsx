import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Eye, EyeOff, KeyRound, MailCheck, ShieldCheck } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { authService } from '@/services/auth.service';
import { password as strongPassword, PASSWORD_POLICY_HINT } from '@/utils/validation';
import { toast } from '@/utils/toast';

const requestSchema = z.object({
  username: z.string().trim().min(1, 'Username is required'),
});
type RequestValues = z.infer<typeof requestSchema>;

const resetSchema = z
  .object({
    otp: z.string().trim().length(6, 'Enter the 6-digit code'),
    newPassword: strongPassword,
    confirmPassword: z.string().min(1, 'Please confirm your new password'),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });
type ResetValues = z.infer<typeof resetSchema>;

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<'request' | 'reset' | 'done'>('request');
  const [username, setUsername] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const requestForm = useForm<RequestValues>({
    resolver: zodResolver(requestSchema),
    defaultValues: { username: '' },
  });

  const resetForm = useForm<ResetValues>({
    resolver: zodResolver(resetSchema),
    defaultValues: { otp: '', newPassword: '', confirmPassword: '' },
  });

  const onRequestSubmit = requestForm.handleSubmit(async (values) => {
    try {
      await authService.forgotPassword(values.username);
      setUsername(values.username);
      setStep('reset');
      toast.success('Code sent', 'If that account exists, a 6-digit code was emailed to it.');
    } catch (err) {
      toast.error('Could not send code', err instanceof Error ? err.message : 'Please try again.');
    }
  });

  const onResetSubmit = resetForm.handleSubmit(async (values) => {
    try {
      await authService.resetPasswordWithOtp(username, values.otp, values.newPassword);
      setStep('done');
    } catch (err) {
      toast.error('Could not reset password', err instanceof Error ? err.message : 'Please try again.');
    }
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <KeyRound className="h-7 w-7" />
          </div>
          <h1 className="mt-4 text-2xl font-bold tracking-tight">Forgot password?</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {step === 'request' && "Enter your username and we'll email you a reset code."}
            {step === 'reset' && `Enter the code sent to the email on file for "${username}".`}
            {step === 'done' && 'Your password has been reset.'}
          </p>
        </div>

        <Card>
          <CardContent className="pt-6">
            {step === 'request' && (
              <form onSubmit={onRequestSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input id="username" placeholder="admin" {...requestForm.register('username')} />
                  {requestForm.formState.errors.username && (
                    <p className="text-sm text-destructive">{requestForm.formState.errors.username.message}</p>
                  )}
                </div>
                <Button type="submit" className="w-full" loading={requestForm.formState.isSubmitting}>
                  Send reset code
                </Button>
              </form>
            )}

            {step === 'reset' && (
              <form onSubmit={onResetSubmit} className="space-y-4">
                <div className="flex items-start gap-2 rounded-md border border-dashed border-border bg-muted/40 p-3 text-xs text-muted-foreground">
                  <MailCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>Code expires in 10 minutes. Check your inbox (and spam folder).</span>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="otp">6-digit code</Label>
                  <Input
                    id="otp"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="123456"
                    className="text-center text-lg tracking-[0.5em]"
                    {...resetForm.register('otp')}
                  />
                  {resetForm.formState.errors.otp && (
                    <p className="text-sm text-destructive">{resetForm.formState.errors.otp.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New password</Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showPassword ? 'text' : 'password'}
                      className="pr-10"
                      {...resetForm.register('newPassword')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">{PASSWORD_POLICY_HINT}</p>
                  {resetForm.formState.errors.newPassword && (
                    <p className="text-sm text-destructive">{resetForm.formState.errors.newPassword.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm new password</Label>
                  <Input id="confirmPassword" type={showPassword ? 'text' : 'password'} {...resetForm.register('confirmPassword')} />
                  {resetForm.formState.errors.confirmPassword && (
                    <p className="text-sm text-destructive">{resetForm.formState.errors.confirmPassword.message}</p>
                  )}
                </div>
                <Button type="submit" className="w-full" loading={resetForm.formState.isSubmitting}>
                  Reset password
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => setStep('request')}
                >
                  Use a different username
                </Button>
              </form>
            )}

            {step === 'done' && (
              <div className="flex flex-col items-center py-4 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success/12 text-success">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <p className="mt-4 text-sm font-semibold">Password reset</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  You can now sign in with your new password.
                </p>
                <Button className="mt-4 w-full" onClick={() => navigate('/login')}>
                  Back to sign in
                </Button>
              </div>
            )}

            {step !== 'done' && (
              <Link
                to="/login"
                className="mt-5 flex items-center justify-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to sign in
              </Link>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
