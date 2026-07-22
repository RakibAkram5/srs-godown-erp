import { useEffect, useRef, type ChangeEvent } from 'react';
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: settingsService.get,
  });

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
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

  const logoPreview = watch('companyLogo');

  function onLogoFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Invalid file', 'Please choose an image file.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('File too large', 'Please choose a logo under 2MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setValue('companyLogo', reader.result as string, { shouldDirty: true });
    reader.readAsDataURL(file);
  }

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
              <Label htmlFor="companyLogo">Company Logo</Label>
              <div className="flex items-center gap-3">
                {logoPreview ? (
                  <img src={logoPreview} alt="Logo preview" className="h-16 w-16 rounded border border-border object-contain" />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded border border-dashed border-border text-xs text-muted-foreground">
                    No logo
                  </div>
                )}
                <div className="space-y-1">
                  <input
                    ref={fileInputRef}
                    id="companyLogo"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={onLogoFileChange}
                  />
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                      Upload logo
                    </Button>
                    {logoPreview && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setValue('companyLogo', '', { shouldDirty: true })}
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">PNG or JPG, under 2MB. Shown on invoices and the login screen.</p>
                </div>
              </div>
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
