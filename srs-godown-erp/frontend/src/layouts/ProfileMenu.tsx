import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { KeyRound, LogOut, SquarePen, UserCircle } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { UserAvatar } from '@/components/common/UserAvatar';
import { Badge } from '@/components/ui/badge';
import { EditProfileDialog } from '@/components/auth/EditProfileDialog';
import { ChangePasswordDialog } from '@/components/auth/ChangePasswordDialog';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/utils/toast';

export function ProfileMenu() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [editOpen, setEditOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    toast.success('Signed out', 'You have been logged out successfully.');
    navigate('/login', { replace: true });
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="flex items-center gap-2 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            aria-label="Open profile menu"
          >
            <UserAvatar user={user} />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuLabel className="normal-case">
            <div className="flex items-center gap-3 py-1">
              <UserAvatar user={user} className="h-10 w-10" />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">{user?.name}</p>
                <p className="truncate text-xs font-normal text-muted-foreground">
                  @{user?.username}
                </p>
              </div>
            </div>
            <div className="mt-2 space-y-1 text-xs font-normal text-muted-foreground">
              <p className="truncate">{user?.email}</p>
              {user?.phone && <p className="truncate">{user.phone}</p>}
            </div>
            <Badge variant="info" className="mt-2">
              {user?.role}
            </Badge>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => navigate('/profile')}>
            <UserCircle />
            My account
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setEditOpen(true)}>
            <SquarePen />
            Edit profile
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setPasswordOpen(true)}>
            <KeyRound />
            Change password
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={handleLogout}
            className="text-destructive focus:bg-destructive/10 focus:text-destructive"
          >
            <LogOut />
            Logout
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <EditProfileDialog open={editOpen} onOpenChange={setEditOpen} />
      <ChangePasswordDialog open={passwordOpen} onOpenChange={setPasswordOpen} />
    </>
  );
}
