import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { LucideIcon } from 'lucide-react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
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
import { SearchBar } from '@/components/common/SearchBar';
import { Pagination } from '@/components/common/Pagination';
import { EmptyState } from '@/components/common/EmptyState';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { formatDate } from '@/utils/formatters';
import { toast } from '@/utils/toast';
import type { MasterApi, MasterPayload } from '@/services/masters.service';
import type { MasterRecord } from '@/types';

export interface MasterConfig {
  queryKey: string;
  api: MasterApi;
  singular: string;
  plural: string;
  icon: LucideIcon;
  secondaryField: {
    key: 'description' | 'shortName';
    label: string;
    placeholder: string;
    type: 'text' | 'textarea';
  };
}

const PAGE_SIZE = 8;

const formSchema = z.object({
  name: z.string().min(1, 'Name is required').max(80, 'Name is too long'),
  secondary: z.string().max(300).optional(),
  isActive: z.boolean(),
});
type FormValues = z.infer<typeof formSchema>;

export function MasterSection({ config }: { config: MasterConfig }) {
  const queryClient = useQueryClient();
  const key = ['masters', config.queryKey];

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [page, setPage] = useState(1);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<MasterRecord | null>(null);
  const [deleting, setDeleting] = useState<MasterRecord | null>(null);

  const { data, isLoading } = useQuery({ queryKey: key, queryFn: config.api.list });

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: '', secondary: '', isActive: true },
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: key });

  const saveMutation = useMutation({
    mutationFn: (values: FormValues) => {
      const payload: MasterPayload = {
        name: values.name.trim(),
        isActive: values.isActive,
        [config.secondaryField.key]: values.secondary?.trim() || undefined,
      };
      return editing ? config.api.update(editing.id, payload) : config.api.create(payload);
    },
    onSuccess: () => {
      invalidate();
      toast.success(editing ? `${config.singular} updated` : `${config.singular} added`);
      closeDialog();
    },
    onError: (err: Error) => toast.error('Could not save', err.message),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      config.api.setStatus(id, isActive),
    onSuccess: () => invalidate(),
    onError: (err: Error) => toast.error('Could not update status', err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => config.api.remove(id),
    onSuccess: () => {
      invalidate();
      toast.success(`${config.singular} deleted`);
      setDeleting(null);
    },
    onError: (err: Error) => toast.error('Could not delete', err.message),
  });

  function openAdd() {
    setEditing(null);
    reset({ name: '', secondary: '', isActive: true });
    setDialogOpen(true);
  }

  function openEdit(record: MasterRecord) {
    setEditing(record);
    reset({
      name: record.name,
      secondary: (record[config.secondaryField.key] as string | null) ?? '',
      isActive: record.isActive,
    });
    setDialogOpen(true);
  }

  function closeDialog() {
    setDialogOpen(false);
    setEditing(null);
  }

  // Client-side search + status filter + pagination (masters are small lists).
  const filtered = useMemo(() => {
    const items = data ?? [];
    const q = search.trim().toLowerCase();
    return items.filter((item) => {
      const secondary = (item[config.secondaryField.key] as string | null) ?? '';
      const matchesSearch =
        !q || item.name.toLowerCase().includes(q) || secondary.toLowerCase().includes(q);
      const matchesStatus =
        status === 'all' || (status === 'active' ? item.isActive : !item.isActive);
      return matchesSearch && matchesStatus;
    });
  }, [data, search, status, config.secondaryField.key]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, pageCount);
  const pageItems = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  const isActiveValue = watch('isActive');

  return (
    <div>
      {/* Toolbar */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          <SearchBar
            value={search}
            onChange={(v) => {
              setSearch(v);
              setPage(1);
            }}
            placeholder={`Search ${config.plural.toLowerCase()}…`}
            className="sm:max-w-xs"
          />
          <Select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as typeof status);
              setPage(1);
            }}
            className="sm:w-40"
          >
            <option value="all">All status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </Select>
        </div>
        <Button onClick={openAdd}>
          <Plus className="h-4 w-4" />
          Add {config.singular}
        </Button>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : pageItems.length === 0 ? (
        <EmptyState
          icon={config.icon}
          title={search || status !== 'all' ? 'No matches found' : `No ${config.plural.toLowerCase()} yet`}
          description={
            search || status !== 'all'
              ? 'Try a different search or filter.'
              : `Add your first ${config.singular.toLowerCase()} to get started.`
          }
          action={
            !search && status === 'all' ? (
              <Button onClick={openAdd}>
                <Plus className="h-4 w-4" />
                Add {config.singular}
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="rounded-lg border border-border">
          <div className="overflow-x-auto scrollbar-thin">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>{config.secondaryField.label}</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageItems.map((item) => {
                  const secondary = (item[config.secondaryField.key] as string | null) ?? '';
                  return (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell className="max-w-xs truncate text-muted-foreground">
                        {secondary || '—'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={item.isActive}
                            onCheckedChange={(checked) =>
                              statusMutation.mutate({ id: item.id, isActive: checked })
                            }
                            aria-label="Toggle status"
                          />
                          <Badge variant={item.isActive ? 'success' : 'secondary'}>
                            {item.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-muted-foreground">
                        {formatDate(item.createdAt)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => openEdit(item)} aria-label="Edit">
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 text-destructive hover:bg-destructive/10 hover:text-destructive"
                            onClick={() => setDeleting(item)}
                            aria-label="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {pageCount > 1 && (
        <Pagination page={current} pageCount={pageCount} onPageChange={setPage} className="mt-5" />
      )}

      {/* Add / Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={(v) => (v ? setDialogOpen(true) : closeDialog())}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing ? `Edit ${config.singular}` : `Add ${config.singular}`}
            </DialogTitle>
            <DialogDescription>
              {editing
                ? `Update this ${config.singular.toLowerCase()}'s details.`
                : `Create a new ${config.singular.toLowerCase()}.`}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit((values) => saveMutation.mutate(values))} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" placeholder={`e.g. ${config.singular} name`} {...register('name')} />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="secondary">{config.secondaryField.label}</Label>
              {config.secondaryField.type === 'textarea' ? (
                <Textarea id="secondary" rows={3} placeholder={config.secondaryField.placeholder} {...register('secondary')} />
              ) : (
                <Input id="secondary" placeholder={config.secondaryField.placeholder} {...register('secondary')} />
              )}
            </div>

            <div className="flex items-center justify-between rounded-md border border-border p-3">
              <div>
                <p className="text-sm font-medium">Active</p>
                <p className="text-xs text-muted-foreground">Inactive items stay saved but are hidden from selection later.</p>
              </div>
              <Switch checked={isActiveValue} onCheckedChange={(c) => setValue('isActive', c)} />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog}>
                Cancel
              </Button>
              <Button type="submit" loading={saveMutation.isPending}>
                {editing ? 'Save changes' : `Add ${config.singular}`}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(v) => !v && setDeleting(null)}
        title={`Delete ${config.singular.toLowerCase()}?`}
        description={
          deleting
            ? `“${deleting.name}” will be permanently removed. This cannot be undone.`
            : ''
        }
        confirmLabel="Delete"
        destructive
        loading={deleteMutation.isPending}
        onConfirm={() => deleting && deleteMutation.mutate(deleting.id)}
      />
    </div>
  );
}
