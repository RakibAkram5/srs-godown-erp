import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PaginationProps {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  className?: string;
}

function range(start: number, end: number) {
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

export function Pagination({ page, pageCount, onPageChange, className }: PaginationProps) {
  if (pageCount <= 1) return null;

  const pages = (() => {
    if (pageCount <= 7) return range(1, pageCount);
    if (page <= 4) return [...range(1, 5), '…', pageCount];
    if (page >= pageCount - 3) return [1, '…', ...range(pageCount - 4, pageCount)];
    return [1, '…', page - 1, page, page + 1, '…', pageCount];
  })();

  return (
    <nav className={cn('flex items-center justify-center gap-1', className)} aria-label="Pagination">
      <Button
        variant="outline"
        size="icon"
        className="h-9 w-9"
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
        aria-label="Previous page"
      >
        <ChevronLeft />
      </Button>
      {pages.map((p, i) =>
        typeof p === 'number' ? (
          <Button
            key={i}
            variant={p === page ? 'default' : 'outline'}
            size="icon"
            className="h-9 w-9"
            onClick={() => onPageChange(p)}
            aria-current={p === page ? 'page' : undefined}
          >
            {p}
          </Button>
        ) : (
          <span key={i} className="px-2 text-sm text-muted-foreground">
            {p}
          </span>
        ),
      )}
      <Button
        variant="outline"
        size="icon"
        className="h-9 w-9"
        onClick={() => onPageChange(page + 1)}
        disabled={page === pageCount}
        aria-label="Next page"
      >
        <ChevronRight />
      </Button>
    </nav>
  );
}
