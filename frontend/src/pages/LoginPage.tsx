import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Boxes, Eye, EyeOff, LogIn } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/utils/toast';
import { email as emailField } from '@/utils/validation';

const schema = z.object({
  email: emailField,
  password: z.string().min(1, 'Password is required'),
});

type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);

  const from = (location.state as { from?: string } | null)?.from ?? '/';

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: 'admin@srsgodown.com', password: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await login(values.email, values.password);
      toast.success('Welcome back!', 'You are now signed in.');
      navigate(from, { replace: true });
    } catch (err) {
      toast.error('Sign in failed', err instanceof Error ? err.message : 'Please try again.');
    }
  });

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden overflow-hidden bg-sidebar lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="flex items-center gap-3 text-white">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sidebar-accent">
            <Boxes className="h-6 w-6" />
          </div>
          <span className="text-lg font-bold">SRS Godown ERP</span>
        </div>

        <div className="relative z-10 max-w-md">
          <h1 className="text-3xl font-bold leading-tight text-white">
            Run your spare parts warehouse with ease.
          </h1>
          <p className="mt-4 text-sidebar-foreground/70">
            Fast, modern and simple enough for anyone on your team. Manage stock, sales and dealers
            from one clean dashboard.
          </p>
        </div>

        <p className="text-sm text-sidebar-foreground/60">© {new Date().getFullYear()} SRS Godown ERP</p>

        {/* Decorative glow */}
        <div className="pointer-events-none absolute -right-24 top-1/3 h-72 w-72 rounded-full bg-sidebar-accent/30 blur-3xl" />
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center bg-muted/30 px-4 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex flex-col items-center text-center lg:hidden">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Boxes className="h-6 w-6" />
            </div>
            <h1 className="mt-3 text-xl font-bold">SRS Godown ERP</h1>
          </div>

          <div className="mb-6">
            <h2 className="text-2xl font-bold tracking-tight">Sign in</h2>
            <p className="mt-1 text-sm text-muted-foreground">Enter your credentials to continue.</p>
          </div>

          <Card>
            <CardContent className="pt-6">
              <form onSubmit={onSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="you@company.com" {...register('email')} />
                  {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      className="pr-10"
                      {...register('password')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-sm text-destructive">{errors.password.message}</p>
                  )}
                </div>

                <Button type="submit" className="w-full" loading={isSubmitting}>
                  <LogIn className="h-4 w-4" />
                  Sign in
                </Button>
              </form>

              <div className="mt-5 rounded-md border border-dashed border-border bg-muted/40 p-3 text-center text-xs text-muted-foreground">
                <p className="font-semibold text-foreground">Demo credentials</p>
                <p className="mt-0.5">admin@srsgodown.com · Admin@123</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
