import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { KeyRound, Pencil, Plus, Shield, Trash2, Users as UsersIcon } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { SearchBar } from '@/components/common/SearchBar';
import { EmptyState } from '@/components/common/EmptyState';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { usersApi, type CreateUserPayload } from '@/services/users.service';
import { GRANTABLE_MODULES } from '@/lib/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/utils/toast';
import type { User } from '@/types';

type Role = 'ADMIN' | 'MANAGER' | 'EMPLOYEE';
const roleLabel: Record<string, string> = { ADMIN: 'Admin', MANAGER: 'Manager', EMPLOYEE: 'Employee', STAFF: 'Employee' };
const roleVariant: Record<string, 'success' | 'info' | 'secondary'> = { ADMIN: 'success', MANAGER: 'info', EMPLOYEE: 'secondary', STAFF: 'secondary' };

function UserFormDialog({ open, onOpenChange, editing }: { open: boolean; onOpenChange: (v: boolean) => void; editing: User | null }) {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('EMPLOYEE');
  const [permissions, setPermissions] = useState<string[]>([]);
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (open) {
      if (editing) {
        setName(editing.name); setUsername(editing.username); setEmail(editing.email);
        setPhone(editing.phone ?? ''); setPassword('');
        setRole((['ADMIN', 'MANAGER', 'EMPLOYEE'].includes(editing.role) ? editing.role : 'EMPLOYEE') as Role);
        setPermissions(editing.permissions ?? []); setIsActive(editing.isActive);
      } else {
        setName(''); setUsername(''); setEmail(''); setPhone(''); setPassword('');
        setRole('EMPLOYEE'); setPermissions([]); setIsActive(true);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editing]);

  const mutation = useMutation({
    mutationFn: () => {
      if (editing) {
        return usersApi.update(editing.id, { name, email, phone: phone || null, role, permissions, isActive });
      }
      const payload: CreateUserPayload = { name, username, email, phone: phone || null, password, role, permissions };
      return usersApi.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success(editing ? 'User updated' : 'User created');
      onOpenChange(false);
    },
    onError: (err: Error) => toast.error('Could not save user', err.message),
  });

  function toggle(mod: string) {
    setPermissions((prev) => (prev.includes(mod) ? prev.filter((m) => m !== mod) : [...prev, mod]));
  }

  function submit() {
    if (!name.trim()) return toast.error('Name required');
    if (!editing && username.trim().length < 3) return toast.error('Username too short', 'At least 3 characters.');
    if (!email.trim()) return toast.error('Email required');
    if (!editing && password.length < 6) return toast.error('Weak password', 'At least 6 characters.');
    mutation.mutate();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{editing ? 'Edit user' : 'Add user'}</DialogTitle>
          <DialogDescription>Set the login details, role and module access.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="uname">Full name</Label>
              <Input id="uname" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="uusername">Username</Label>
              <Input id="uusername" value={username} onChange={(e) => setUsername(e.target.value)} disabled={!!editing} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="uemail">Email</Label>
              <Input id="uemail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="uphone">Phone</Label>
              <Input id="uphone" placeholder="Optional" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            {!editing && (
              <div className="space-y-2">
                <Label htmlFor="upass">Password</Label>
                <Input id="upass" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="urole">Role</Label>
              <Select id="urole" value={role} onChange={(e) => setRole(e.target.value as Role)}>
                <option value="ADMIN">Admin (full access)</option>
                <option value="MANAGER">Manager</option>
                <option value="EMPLOYEE">Employee</option>
              </Select>
            </div>
          </div>

          {role !== 'ADMIN' ? (
            <div className="space-y-2 rounded-lg border border-border p-3">
              <p className="text-sm font-medium">Module access</p>
              <p className="text-xs text-muted-foreground">Financial reports, ledgers, pending, settings and user management stay admin-only.</p>
              <div className="grid grid-cols-2 gap-2 pt-1 sm:grid-cols-3">
                {GRANTABLE_MODULES.map((m) => (
                  <label key={m.key} className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={permissions.includes(m.key)} onChange={() => toggle(m.key)} className="h-4 w-4 rounded border-border" />
                    {m.label}
                  </label>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 rounded-lg border border-success/30 bg-success/5 p-3 text-sm text-success">
              <Shield className="h-4 w-4" /> Admin has full access to every module.
            </div>
          )}

          {editing && (
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div>
                <p className="text-sm font-medium">Active</p>
                <p className="text-xs text-muted-foreground">Inactive users can't log in.</p>
              </div>
              <Switch checked={isActive} onCheckedChange={setIsActive} />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button loading={mutation.isPending} onClick={submit}>{editing ? 'Save changes' : 'Create user'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ResetPasswordDialog({ user, onClose }: { user: User | null; onClose: () => void }) {
  const [password, setPassword] = useState('');
  const mutation = useMutation({
    mutationFn: () => usersApi.resetPassword(user!.id, password),
    onSuccess: () => { toast.success('Password reset'); setPassword(''); onClose(); },
    onError: (err: Error) => toast.error('Could not reset', err.message),
  });
  return (
    <Dialog open={!!user} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reset password</DialogTitle>
          <DialogDescription>Set a new password for {user?.name}.</DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="newpass">New password</Label>
          <Input id="newpass" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button loading={mutation.isPending} disabled={password.length < 6} onClick={() => mutation.mutate()}>Reset</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function UsersPage() {
  const queryClient = useQueryClient();
  const { user: current } = useAuth();
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [resetting, setResetting] = useState<User | null>(null);
  const [deleting, setDeleting] = useState<User | null>(null);

  const { data, isLoading } = useQuery({ queryKey: ['users'], queryFn: usersApi.list });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => usersApi.remove(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['users'] }); toast.success('User deleted'); setDeleting(null); },
    onError: (err: Error) => toast.error('Could not delete', err.message),
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (data ?? []).filter((u) => !q || u.name.toLowerCase().includes(q) || u.username.toLowerCase().includes(q));
  }, [data, search]);

  return (
    <div>
      <PageHeader
        title="User Management"
        description="Create staff logins and control which modules each can access."
        icon={<UsersIcon className="h-5 w-5" />}
        actions={<Button onClick={() => { setEditing(null); setFormOpen(true); }}><Plus className="h-4 w-4" />Add User</Button>}
      />

      <div className="mb-4">
        <SearchBar value={search} onChange={setSearch} placeholder="Search name or username…" className="sm:max-w-sm" />
      </div>

      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={UsersIcon} title="No users found" description="Add a manager or employee to get started." />
      ) : (
        <div className="rounded-lg border border-border">
          <div className="overflow-x-auto scrollbar-thin">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Access</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.name}{u.id === current?.id && <span className="ml-1 text-xs text-muted-foreground">(you)</span>}</TableCell>
                    <TableCell className="text-muted-foreground">{u.username}</TableCell>
                    <TableCell><Badge variant={roleVariant[u.role] ?? 'secondary'}>{roleLabel[u.role] ?? u.role}</Badge></TableCell>
                    <TableCell className="max-w-[220px] text-sm text-muted-foreground">
                      {u.role === 'ADMIN' ? 'All modules' : (u.permissions ?? []).length ? (u.permissions ?? []).join(', ') : '—'}
                    </TableCell>
                    <TableCell><Badge variant={u.isActive ? 'success' : 'secondary'}>{u.isActive ? 'Active' : 'Inactive'}</Badge></TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setResetting(u)} aria-label="Reset password"><KeyRound className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => { setEditing(u); setFormOpen(true); }} aria-label="Edit"><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive hover:bg-destructive/10 hover:text-destructive" disabled={u.id === current?.id} onClick={() => setDeleting(u)} aria-label="Delete"><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      <UserFormDialog open={formOpen} onOpenChange={setFormOpen} editing={editing} />
      <ResetPasswordDialog user={resetting} onClose={() => setResetting(null)} />
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(v) => !v && setDeleting(null)}
        title="Delete user?"
        description={deleting ? `${deleting.name}'s login will be permanently removed.` : ''}
        confirmLabel="Delete"
        destructive
        loading={deleteMutation.isPending}
        onConfirm={() => deleting && deleteMutation.mutate(deleting.id)}
      />
    </div>
  );
}
