import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowDownUp,
  ArrowDown,
  ArrowUp,
  Copy,
  Download,
  Eye,
  FileSpreadsheet,
  MoreHorizontal,
  Package,
  Pencil,
  Plus,
  Printer,
  Trash2,
  Upload,
} from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { SearchBar } from '@/components/common/SearchBar';
import { Pagination } from '@/components/common/Pagination';
import { EmptyState } from '@/components/common/EmptyState';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ProductFormDialog } from '@/components/products/ProductFormDialog';
import { ProductViewDialog } from '@/components/products/ProductViewDialog';
import { productsApi, type ProductQuery } from '@/services/products.service';
import { categoriesApi, brandsApi } from '@/services/masters.service';
import { settingsService } from '@/services/settings.service';
import { exportProducts, parseProductsFile, downloadImportTemplate } from '@/utils/productExcel';
import { formatCurrency } from '@/utils/formatters';
import { toast } from '@/utils/toast';
import { BIKES, type Product } from '@/types';

const PAGE_SIZE = 10;
type SortKey = 'name' | 'salePrice' | 'currentStock' | 'createdAt';

export default function ProductsPage() {
  const queryClient = useQueryClient();
  const importRef = useRef<HTMLInputElement>(null);
  const tableRef = useRef<HTMLDivElement>(null);

  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [brandId, setBrandId] = useState('');
  const [bike, setBike] = useState('');
  const [status, setStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [sortBy, setSortBy] = useState<SortKey>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [viewing, setViewing] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState<Product | null>(null);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebounced(search);
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [search]);

  const { data: categories } = useQuery({ queryKey: ['masters', 'categories'], queryFn: categoriesApi.list });
  const { data: brands } = useQuery({ queryKey: ['masters', 'brands'], queryFn: brandsApi.list });
  const { data: settings } = useQuery({ queryKey: ['settings'], queryFn: settingsService.get, retry: false });
  const currency = settings?.currency ?? 'PKR';

  const query: ProductQuery = useMemo(
    () => ({
      search: debounced || undefined,
      categoryId: categoryId || undefined,
      brandId: brandId || undefined,
      bike: bike || undefined,
      status,
      sortBy,
      sortOrder,
      page,
      limit: PAGE_SIZE,
    }),
    [debounced, categoryId, brandId, bike, status, sortBy, sortOrder, page],
  );

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['products', query],
    queryFn: () => productsApi.list(query),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['products'] });

  const duplicateMutation = useMutation({
    mutationFn: (id: string) => productsApi.duplicate(id),
    onSuccess: () => {
      invalidate();
      toast.success('Product duplicated');
    },
    onError: (err: Error) => toast.error('Could not duplicate', err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => productsApi.remove(id),
    onSuccess: () => {
      invalidate();
      toast.success('Product deleted');
      setDeleting(null);
    },
    onError: (err: Error) => toast.error('Could not delete', err.message),
  });

  function toggleSort(key: SortKey) {
    if (sortBy === key) {
      setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(key);
      setSortOrder('asc');
    }
    setPage(1);
  }

  function SortIcon({ column }: { column: SortKey }) {
    if (sortBy !== column) return <ArrowDownUp className="h-3.5 w-3.5 text-muted-foreground/60" />;
    return sortOrder === 'asc' ? <ArrowUp className="h-3.5 w-3.5" /> : <ArrowDown className="h-3.5 w-3.5" />;
  }

  async function handleExport() {
    try {
      const all = await productsApi.list({ ...query, page: 1, limit: 100000 });
      if (all.items.length === 0) return toast.error('Nothing to export', 'No products match the current filters.');
      exportProducts(all.items);
      toast.success('Exported', `${all.items.length} products exported to Excel.`);
    } catch (err) {
      toast.error('Export failed', err instanceof Error ? err.message : 'Please try again.');
    }
  }

  async function handleImportFile(file?: File) {
    if (!file) return;
    setImporting(true);
    try {
      const rows = await parseProductsFile(file, {
        categories: categories ?? [],
        brands: brands ?? [],
        units: [],
      });
      if (rows.length === 0) {
        toast.error('Nothing to import', 'No valid rows found in the file.');
        return;
      }
      const summary = await productsApi.import(rows);
      invalidate();
      if (summary.failed > 0) {
        toast.warning('Import finished', `${summary.created} added, ${summary.failed} failed.`);
      } else {
        toast.success('Import finished', `${summary.created} products added.`);
      }
    } catch (err) {
      toast.error('Import failed', err instanceof Error ? err.message : 'Check the file format.');
    } finally {
      setImporting(false);
      if (importRef.current) importRef.current.value = '';
    }
  }

  function handlePrintList() {
    tableRef.current?.classList.add('print-target');
    window.print();
    setTimeout(() => tableRef.current?.classList.remove('print-target'), 500);
  }

  function openAdd() {
    setEditing(null);
    setFormOpen(true);
  }
  function openEdit(product: Product) {
    setEditing(product);
    setFormOpen(true);
  }

  const items = data?.items ?? [];
  const hasFilters = !!(debounced || categoryId || brandId || bike || status !== 'all');

  return (
    <div>
      <PageHeader
        title="Products"
        description="Your full catalogue of bike spare parts."
        icon={<Package className="h-5 w-5" />}
        actions={
          <div className="flex flex-wrap gap-2 no-print">
            <input
              ref={importRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={(e) => handleImportFile(e.target.files?.[0])}
            />
            <Button variant="outline" onClick={() => importRef.current?.click()} loading={importing}>
              <Upload className="h-4 w-4" />
              Import
            </Button>
            <Button variant="outline" onClick={handleExport}>
              <Download className="h-4 w-4" />
              Export
            </Button>
            <Button variant="outline" onClick={handlePrintList}>
              <Printer className="h-4 w-4" />
              Print
            </Button>
            <Button onClick={openAdd}>
              <Plus className="h-4 w-4" />
              Add Product
            </Button>
          </div>
        }
      />

      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center no-print">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search name, code, SKU, barcode…"
          className="lg:max-w-xs"
        />
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:flex">
          <Select value={categoryId} onChange={(e) => { setCategoryId(e.target.value); setPage(1); }}>
            <option value="">All categories</option>
            {(categories ?? []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
          <Select value={brandId} onChange={(e) => { setBrandId(e.target.value); setPage(1); }}>
            <option value="">All brands</option>
            {(brands ?? []).map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </Select>
          <Select value={bike} onChange={(e) => { setBike(e.target.value); setPage(1); }}>
            <option value="">All bikes</option>
            {BIKES.map((b) => <option key={b} value={b}>{b}</option>)}
          </Select>
          <Select value={status} onChange={(e) => { setStatus(e.target.value as typeof status); setPage(1); }}>
            <option value="all">All status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </Select>
        </div>
        <button
          type="button"
          onClick={() => downloadImportTemplate()}
          className="text-left text-sm font-medium text-primary hover:underline lg:ml-auto"
        >
          <FileSpreadsheet className="mr-1 inline h-4 w-4" />
          Import template
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={Package}
          title={hasFilters ? 'No matching products' : 'No products yet'}
          description={hasFilters ? 'Try adjusting your search or filters.' : 'Add your first product to get started.'}
          action={!hasFilters ? <Button onClick={openAdd}><Plus className="h-4 w-4" />Add Product</Button> : undefined}
        />
      ) : (
        <div ref={tableRef} className="rounded-lg border border-border">
          <div className="overflow-x-auto scrollbar-thin">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>
                    <button className="inline-flex items-center gap-1" onClick={() => toggleSort('name')}>
                      Product <SortIcon column="name" />
                    </button>
                  </TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Brand</TableHead>
                  <TableHead className="text-right">
                    <button className="inline-flex items-center gap-1" onClick={() => toggleSort('salePrice')}>
                      Price <SortIcon column="salePrice" />
                    </button>
                  </TableHead>
                  <TableHead className="text-center">
                    <button className="inline-flex items-center gap-1" onClick={() => toggleSort('currentStock')}>
                      Stock <SortIcon column="currentStock" />
                    </button>
                  </TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right no-print">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <div className="h-10 w-10 overflow-hidden rounded-md border border-border bg-muted/30">
                        {p.image ? (
                          <img src={p.image} alt={p.name} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                            <Package className="h-4 w-4" />
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <button className="text-left" onClick={() => setViewing(p)}>
                        <p className="font-medium hover:text-primary">{p.name}</p>
                        <p className="text-xs text-muted-foreground">{p.productCode} · {p.sku}</p>
                      </button>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{p.categoryName ?? '—'}</TableCell>
                    <TableCell className="text-muted-foreground">{p.brandName ?? '—'}</TableCell>
                    <TableCell className="whitespace-nowrap text-right font-medium">
                      {formatCurrency(p.salePrice, currency)}
                    </TableCell>
                    <TableCell className="text-center">
                      <span className={p.isLowStock ? 'font-semibold text-destructive' : ''}>{p.currentStock}</span>
                      {p.isLowStock && <Badge variant="warning" className="ml-2">Low</Badge>}
                    </TableCell>
                    <TableCell>
                      <Badge variant={p.isActive ? 'success' : 'secondary'}>
                        {p.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right no-print">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-9 w-9" aria-label="Actions">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          <DropdownMenuItem onClick={() => setViewing(p)}>
                            <Eye /> View
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openEdit(p)}>
                            <Pencil /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => duplicateMutation.mutate(p.id)}>
                            <Copy /> Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => setDeleting(p)}
                            className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                          >
                            <Trash2 /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {data && data.total > 0 && (
        <div className="mt-4 flex flex-col items-center justify-between gap-3 sm:flex-row no-print">
          <p className="text-sm text-muted-foreground">
            {data.total} product{data.total !== 1 ? 's' : ''}
            {isFetching && ' · updating…'}
          </p>
          <Pagination page={data.page} pageCount={data.pageCount} onPageChange={setPage} />
        </div>
      )}

      <ProductFormDialog open={formOpen} onOpenChange={setFormOpen} product={editing} />
      <ProductViewDialog
        open={!!viewing}
        onOpenChange={(v) => !v && setViewing(null)}
        product={viewing}
        currency={currency}
        onEdit={openEdit}
      />
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(v) => !v && setDeleting(null)}
        title="Delete product?"
        description={deleting ? `“${deleting.name}” will be moved to deleted. This can be restored from the database if needed.` : ''}
        confirmLabel="Delete"
        destructive
        loading={deleteMutation.isPending}
        onConfirm={() => deleting && deleteMutation.mutate(deleting.id)}
      />
    </div>
  );
}
