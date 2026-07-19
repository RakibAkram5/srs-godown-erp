import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import type { User } from '@/types';

export function userInitials(name?: string): string {
  if (!name) return 'U';
  return name
    .split(' ')
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

interface UserAvatarProps {
  user: Pick<User, 'name' | 'profileImage'> | null;
  className?: string;
}

export function UserAvatar({ user, className }: UserAvatarProps) {
  return (
    <Avatar className={cn('h-9 w-9', className)}>
      {user?.profileImage && <AvatarImage src={user.profileImage} alt={user.name} />}
      <AvatarFallback>{userInitials(user?.name)}</AvatarFallback>
    </Avatar>
  );
}
