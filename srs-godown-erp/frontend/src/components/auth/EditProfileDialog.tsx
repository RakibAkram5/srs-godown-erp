import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Camera, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UserAvatar } from '@/components/common/UserAvatar';
import { authService } from '@/services/auth.service';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/utils/toast';
import type { User } from '@/types';

const schema = z.object({
  name: z.string().min(2, 'Name is too short'),
  email: z.string().email('Enter a valid email address'),
  phone: z.string().max(20, 'Phone number is too long').optional().or(z.literal('')),
});

type FormValues = z.infer<typeof schema>;

const MAX_IMAGE_BYTES = 2 * 1024 * 1024; // 2 MB

interface EditProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditProfileDialog({ open, onOpenChange }: EditProfileDialogProps) {
  const { user, setUser } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [image, setImage] = useState<string | null>(user?.profileImage ?? null);
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: user?.name ?? '',
      email: user?.email ?? '',
      phone: user?.phone ?? '',
    },
  });

  // Re-sync when the dialog opens or the user changes.
  useEffect(() => {
    if (open && user) {
      reset({ name: user.name, email: user.email, phone: user.phone ?? '' });
      setImage(user.profileImage ?? null);
    }
  }, [open, user, reset]);

  const pickImage = (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Invalid file', 'Please choose an image file.');
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      toast.error('Image too large', 'Please choose an image under 2 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  const onSubmit = handleSubmit(async (values) => {
    setSaving(true);
    try {
      const updated: User = await authService.updateProfile({
        name: values.name,
        email: values.email,
        phone: values.phone || undefined,
        profileImage: image,
      });
      setUser(updated);
      toast.success('Profile updated', 'Your changes have been saved.');
      onOpenChange(false);
    } catch (err) {
      toast.error('Update failed', err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setSaving(false);
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit profile</DialogTitle>
          <DialogDescription>Update your name, contact details and photo.</DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          {/* Avatar + image controls */}
          <div className="flex items-center gap-4">
            <UserAvatar user={{ name: user?.name ?? '', profileImage: image }} className="h-16 w-16" />
            <div className="flex gap-2">
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => pickImage(e.target.files?.[0])}
              />
              <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
                <Camera className="h-4 w-4" />
                Change photo
              </Button>
              {image && (
                <Button type="button" variant="ghost" size="sm" onClick={() => setImage(null)}>
                  <Trash2 className="h-4 w-4" />
                  Remove
                </Button>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Full name</Label>
            <Input id="name" {...register('name')} />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" {...register('email')} />
            {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" placeholder="+92 300 0000000" {...register('phone')} />
            {errors.phone && <p className="text-sm text-destructive">{errors.phone.message}</p>}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              Save changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
