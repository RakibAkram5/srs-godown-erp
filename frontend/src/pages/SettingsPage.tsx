import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Building2, Save, SlidersHorizontal } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { LoadingScreen } from '@/components/common/LoadingScreen';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { settingsService } from '@/services/settings.service';
import { useTheme } from '@/contexts/ThemeContext';
import { toast } from '@/utils/toast';
import type { Settings, Theme } from '@/types';

const currencies = ['PKR', 'USD', 'EUR', 'GBP', 'INR', 'AED'];
const languages = [
  { value: 'en', label: 'English' },
  { value: 'ur', label: 'Urdu' },
];
const themes: { value: Theme; label: string }[] = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System Default' },
];

const schema = z.object({
  companyName: z.string().min(1, 'Company name is required'),
  companyLogo: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  currency: z.string().min(1),
  language: z.string().min(1),
  theme: z.enum(['light', 'dark', 'system']),
});

type FormValues = z.infer<typeof schema>;

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const { setTheme } = useTheme();

  const { data, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: settingsService.get,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      companyName: '',
      companyLogo: '',
      phone: '',
      address: '',
      currency: 'PKR',
      language: 'en',
      theme: 'system',
    },
  });

  // Populate the form once settings load.
  useEffect(() => {
    if (data) {
      reset({
        companyName: data.companyName,
        companyLogo: data.companyLogo ?? '',
        phone: data.phone ?? '',
        address: data.address ?? '',
        currency: data.currency,
        language: data.language,
        theme: data.theme,
      });
    }
  }, [data, reset]);

  const mutation = useMutation({
    mutationFn: (values: FormValues) => settingsService.update(values as Partial<Settings>),
    onSuccess: (updated) => {
      queryClient.setQueryData(['settings'], updated);
      setTheme(updated.theme);
      reset({
        companyName: updated.companyName,
        companyLogo: updated.companyLogo ?? '',
        phone: updated.phone ?? '',
        address: updated.address ?? '',
        currency: updated.currency,
        language: updated.language,
        theme: updated.theme,
      });
      toast.success('Settings saved', 'Your changes have been applied.');
    },
    onError: (err: Error) => toast.error('Could not save settings', err.message),
  });

  if (isLoading) return <LoadingScreen label="Loading settings…" />;

  const onSubmit = handleSubmit((values) => mutation.mutate(values));

  return (
    <div>
      <PageHeader
        title="Settings"
        description="Manage your company profile and workspace preferences."
        icon={<SlidersHorizontal className="h-5 w-5" />}
      />

      <form onSubmit={onSubmit} className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Company profile */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              <CardTitle>Company Profile</CardTitle>
            </div>
            <CardDescription>These details appear on invoices and reports.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name</Label>
              <Input id="companyName" placeholder="e.g. SRS Traders (shown on invoices)" {...register('companyName')} />
              {errors.companyName && (
                <p className="text-sm text-destructive">{errors.companyName.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="companyLogo">Company Logo URL</Label>
              <Input id="companyLogo" placeholder="https://example.com/logo.png" {...register('companyLogo')} />
              {errors.companyLogo && (
                <p className="text-sm text-destructive">{errors.companyLogo.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" placeholder="+92 300 0000000" {...register('phone')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Select id="currency" {...register('currency')}>
                  {currencies.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Textarea id="address" rows={3} placeholder="Warehouse address" {...register('address')} />
            </div>
          </CardContent>
        </Card>

        {/* Preferences */}
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Preferences</CardTitle>
            <CardDescription>Language and appearance.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="language">Language</Label>
              <Select id="language" {...register('language')}>
                {languages.map((l) => (
                  <option key={l.value} value={l.value}>
                    {l.label}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="theme">Theme</Label>
              <Select id="theme" {...register('theme')}>
                {themes.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </Select>
              <p className="text-xs text-muted-foreground">Applied instantly when you save.</p>
            </div>

            <Separator />

            <Button type="submit" className="w-full" loading={mutation.isPending} disabled={!isDirty}>
              <Save className="h-4 w-4" />
              Save Changes
            </Button>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
