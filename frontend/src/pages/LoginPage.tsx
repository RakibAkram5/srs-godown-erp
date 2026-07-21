import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import { Boxes, Eye, EyeOff, LogIn, User as UserIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { settingsService } from '@/services/settings.service';
import { toast } from '@/utils/toast';

const schema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);

  const { data: branding } = useQuery({
    queryKey: ['branding'],
    queryFn: settingsService.getBranding,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  const companyName = branding?.companyName ?? 'SRS Godown ERP';
  const from = (location.state as { from?: string } | null)?.from ?? '/';

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { username: '', password: '', rememberMe: true },
  });

  const rememberMe = watch('rememberMe');

  const onSubmit = handleSubmit(async (values) => {
    try {
      await login(values.username, values.password, values.rememberMe);
      toast.success('Welcome back!', 'You are now signed in.');
      navigate(from, { replace: true });
    } catch (err) {
      toast.error('Sign in failed', err instanceof Error ? err.message : 'Please check your credentials.');
    }
  });

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden overflow-hidden bg-sidebar lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="flex items-center gap-3 text-white">
          <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl bg-sidebar-accent">
            {branding?.companyLogo ? (
              <img src={branding.companyLogo} alt="Logo" className="h-full w-full object-cover" />
            ) : (
              <Boxes className="h-6 w-6" />
            )}
          </div>
          <span className="text-lg font-bold">{companyName}</span>
        </div>

        <div className="relative z-10 max-w-md">
          <h1 className="text-3xl font-bold leading-tight text-white">
            Run your spare parts warehouse with ease.
          </h1>
          <p className="mt-4 text-sidebar-foreground/70">
            Fast, secure and simple enough for anyone on your team. Sign in to manage your
            inventory, sales and dealers from one clean dashboard.
          </p>
        </div>

        <p className="text-sm text-sidebar-foreground/60">
          © {new Date().getFullYear()} {companyName}
        </p>

        <div className="pointer-events-none absolute -right-24 top-1/3 h-72 w-72 rounded-full bg-sidebar-accent/30 blur-3xl" />
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center bg-muted/30 px-4 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex flex-col items-center text-center">
            <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl bg-primary text-primary-foreground shadow-soft">
              {branding?.companyLogo ? (
                <img src={branding.companyLogo} alt="Logo" className="h-full w-full object-cover" />
              ) : (
                <Boxes className="h-7 w-7" />
              )}
            </div>
            <h1 className="mt-4 text-2xl font-bold tracking-tight">{companyName}</h1>
            <p className="mt-1 text-sm text-muted-foreground">Welcome back — please sign in to continue.</p>
          </div>

          <Card>
            <CardContent className="pt-6">
              <form onSubmit={onSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <div className="relative">
                    <UserIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="username"
                      autoComplete="username"
                      placeholder="admin"
                      className="pl-10"
                      {...register('username')}
                    />
                  </div>
                  {errors.username && <p className="text-sm text-destructive">{errors.username.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
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
                  {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
                </div>

                <div className="flex items-center justify-between">
                  <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setValue('rememberMe', e.target.checked)}
                      className="h-4 w-4 rounded border-input text-primary focus-visible:ring-2 focus-visible:ring-ring"
                    />
                    Remember me
                  </label>
                  <Link to="/forgot-password" className="text-sm font-medium text-primary hover:underline">
                    Forgot password?
                  </Link>
                </div>

                <Button type="submit" className="w-full" loading={isSubmitting}>
                  <LogIn className="h-4 w-4" />
                  Sign in
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
