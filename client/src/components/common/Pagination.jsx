import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { cn } from '../../utils/classNames';

const Pagination = ({ page = 1, pages = 1, onPageChange, className = '' }) => {
  if (!pages || pages <= 1) return null;
  const start = Math.max(1, Math.min(page - 2, pages - 4));
  const visible = Array.from({ length: Math.min(5, pages) }, (_, i) => start + i).filter((p) => p <= pages);

  return (
    <div className={cn('flex items-center justify-center gap-2', className)}>
      <button
        type="button"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
        aria-label="Previous page"
      >
        <FiChevronLeft />
      </button>
      {visible.map((p) => (
        <button
          key={p}
          type="button"
          onClick={() => onPageChange(p)}
          className={cn(
            'h-9 min-w-9 rounded-lg px-2 text-sm font-semibold transition',
            p === page
              ? 'bg-brand-600 text-white shadow-sm'
              : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
          )}
        >
          {p}
        </button>
      ))}
      <button
        type="button"
        disabled={page >= pages}
        onClick={() => onPageChange(page + 1)}
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
        aria-label="Next page"
      >
        <FiChevronRight />
      </button>
    </div>
  );
};

export default Pagination;
