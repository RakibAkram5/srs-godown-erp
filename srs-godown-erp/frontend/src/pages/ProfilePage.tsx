import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Activity,
  KeyRound,
  Mail,
  Phone,
  ShieldCheck,
  SquarePen,
  UserCog,
} from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { UserAvatar } from '@/components/common/UserAvatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/common/EmptyState';
import { EditProfileDialog } from '@/components/auth/EditProfileDialog';
import { ChangePasswordDialog } from '@/components/auth/ChangePasswordDialog';
import { useAuth } from '@/contexts/AuthContext';
import { authService } from '@/services/auth.service';
import { formatDateTime } from '@/utils/formatters';
import type { AuditAction } from '@/types';

const actionLabels: Record<AuditAction, string> = {
  LOGIN: 'Signed in',
  LOGOUT: 'Signed out',
  PASSWORD_CHANGE: 'Changed password',
  PROFILE_UPDATE: 'Updated profile',
};

function InfoRow({ icon: Icon, label, value }: { icon: typeof Mail; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="truncate text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const { user } = useAuth();
  const [editOpen, setEditOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);

  const historyQuery = useQuery({
    queryKey: ['login-history'],
    queryFn: authService.getLoginHistory,
  });

  const auditQuery = useQuery({
    queryKey: ['audit-log'],
    queryFn: authService.getAuditLog,
  });

  if (!user) return null;

  return (
    <div>
      <PageHeader
        title="My Account"
        description="Manage your profile, security and recent activity."
        icon={<UserCog className="h-5 w-5" />}
        actions={
          <>
            <Button variant="outline" onClick={() => setPasswordOpen(true)}>
              <KeyRound className="h-4 w-4" />
              Change password
            </Button>
            <Button onClick={() => setEditOpen(true)}>
              <SquarePen className="h-4 w-4" />
              Edit profile
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Profile card */}
        <Card className="lg:col-span-1">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <UserAvatar user={user} className="h-24 w-24" />
              <h2 className="mt-4 text-lg font-bold">{user.name}</h2>
              <p className="text-sm text-muted-foreground">@{user.username}</p>
              <Badge variant="info" className="mt-2 gap-1">
                <ShieldCheck className="h-3.5 w-3.5" />
                {user.role}
              </Badge>
            </div>

            <Separator className="my-5" />

            <div className="space-y-4">
              <InfoRow icon={Mail} label="Email" value={user.email} />
              <InfoRow icon={Phone} label="Phone" value={user.phone || 'Not set'} />
              <InfoRow
                icon={Activity}
                label="Last login"
                value={user.lastLogin ? formatDateTime(user.lastLogin) : 'First session'}
              />
            </div>
          </CardContent>
        </Card>

        {/* Right column */}
        <div className="space-y-6 lg:col-span-2">
          {/* Login history */}
          <Card>
            <CardHeader>
              <CardTitle>Login History</CardTitle>
            </CardHeader>
            <CardContent>
              {historyQuery.isLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : historyQuery.data && historyQuery.data.length > 0 ? (
                <div className="overflow-x-auto scrollbar-thin">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date &amp; time</TableHead>
                        <TableHead>Device</TableHead>
                        <TableHead>Browser</TableHead>
                        <TableHead>IP</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {historyQuery.data.map((h) => (
                        <TableRow key={h.id}>
                          <TableCell className="whitespace-nowrap font-medium">
                            {formatDateTime(h.loginAt)}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            {[h.device, h.os].filter(Boolean).join(' · ') || '—'}
                          </TableCell>
                          <TableCell>{h.browser || '—'}</TableCell>
                          <TableCell className="whitespace-nowrap">{h.ipAddress || '—'}</TableCell>
                          <TableCell>
                            <Badge variant={h.status === 'SUCCESS' ? 'success' : 'danger'}>
                              {h.status === 'SUCCESS' ? 'Success' : 'Failed'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <EmptyState icon={Activity} title="No login history yet" />
              )}
            </CardContent>
          </Card>

          {/* Audit log */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              {auditQuery.isLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : auditQuery.data && auditQuery.data.length > 0 ? (
                <div className="space-y-1">
                  {auditQuery.data.map((log) => (
                    <div
                      key={log.id}
                      className="flex items-center gap-3 rounded-md px-2 py-2.5 transition-colors hover:bg-muted/50"
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <Activity className="h-4 w-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">{actionLabels[log.action]}</p>
                        {log.detail && (
                          <p className="truncate text-xs text-muted-foreground">{log.detail}</p>
                        )}
                      </div>
                      <span className="whitespace-nowrap text-xs text-muted-foreground">
                        {formatDateTime(log.createdAt)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState icon={Activity} title="No activity recorded yet" />
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <EditProfileDialog open={editOpen} onOpenChange={setEditOpen} />
      <ChangePasswordDialog open={passwordOpen} onOpenChange={setPasswordOpen} />
    </div>
  );
}
