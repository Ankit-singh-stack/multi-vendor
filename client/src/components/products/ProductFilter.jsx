import { useEffect, useState } from 'react';
import { FiFilter, FiRotateCcw, FiX } from 'react-icons/fi';
import Button from '../common/Button';
import { SORT_OPTIONS } from '../../utils/constants';

const ProductFilter = ({ categories = [], filters, onChange, onReset, resultCount = 0 }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [minPrice, setMinPrice] = useState(filters.minPrice || '');
  const [maxPrice, setMaxPrice] = useState(filters.maxPrice || '');
  const [rating, setRating] = useState(filters.rating || '');

  useEffect(() => {
    setMinPrice(filters.minPrice || '');
    setMaxPrice(filters.maxPrice || '');
    setRating(filters.rating || '');
  }, [filters.minPrice, filters.maxPrice, filters.rating]);

  const applyPrice = () => onChange({ minPrice, maxPrice, rating });
  const reset = () => {
    setMinPrice('');
    setMaxPrice('');
    setRating('');
    onReset();
  };

  const panel = (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-slate-900">Category</h3>
        <div className="mt-3 space-y-1.5">
          <button
            type="button"
            onClick={() => onChange({ category: '' })}
            className={`block w-full rounded-lg px-3 py-2 text-left text-sm transition ${
              !filters.category ? 'bg-brand-50 font-semibold text-brand-700' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            All categories
          </button>
          {categories.map((cat) => (
            <button
              key={cat._id}
              type="button"
              onClick={() => onChange({ category: cat.slug })}
              className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition ${
                filters.category === cat.slug ? 'bg-brand-50 font-semibold text-brand-700' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span>{cat.name}</span>
              <span className="text-xs text-slate-400">{cat.productCount ?? ''}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="border-t border-slate-100 pt-5">
        <h3 className="text-sm font-semibold text-slate-900">Price range</h3>
        <div className="mt-3 flex items-center gap-2">
          <input
            type="number"
            min="0"
            placeholder="Min"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            className="input py-2 text-xs"
          />
          <span className="text-slate-400">–</span>
          <input
            type="number"
            min="0"
            placeholder="Max"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            className="input py-2 text-xs"
          />
        </div>
        <Button size="sm" variant="secondary" className="mt-3 w-full" onClick={applyPrice}>
          Apply price
        </Button>
      </div>

      <div className="border-t border-slate-100 pt-5">
        <h3 className="text-sm font-semibold text-slate-900">Customer rating</h3>
        <div className="mt-3 space-y-1.5">
          {[4, 3, 2].map((r) => (
            <label key={r} className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-slate-600 hover:bg-slate-50">
              <input
                type="radio"
                name="rating"
                checked={String(rating) === String(r)}
                onChange={() => {
                  setRating(String(r));
                  onChange({ rating: String(r) });
                }}
                className="h-3.5 w-3.5 text-brand-600"
              />
              {r}★ & above
            </label>
          ))}
        </div>
      </div>

      <div className="border-t border-slate-100 pt-5">
        <h3 className="text-sm font-semibold text-slate-900">Sort by</h3>
        <select
          value={filters.sort || 'newest'}
          onChange={(e) => onChange({ sort: e.target.value })}
          className="input mt-3 py-2 text-sm"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <Button variant="outline" icon={FiRotateCcw} className="w-full" onClick={reset}>
        Reset filters
      </Button>
    </div>
  );

  return (
    <>
      <div className="mb-5 flex items-center justify-between lg:hidden">
        <Button variant="outline" size="sm" icon={FiFilter} onClick={() => setMobileOpen(true)}>
          Filters
        </Button>
        <p className="text-sm text-slate-500">{resultCount} products</p>
      </div>

      <aside className="hidden w-64 shrink-0 lg:block">
        <div className="sticky top-32 rounded-2xl border border-slate-200 bg-white p-5 shadow-card">{panel}</div>
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/40" onClick={() => setMobileOpen(false)} />
          <div className="absolute bottom-0 left-0 right-0 max-h-[85vh] overflow-y-auto rounded-t-3xl bg-white p-5 animate-fade-in">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Filters</h3>
              <button type="button" onClick={() => setMobileOpen(false)} className="rounded-lg p-2 hover:bg-slate-100">
                <FiX className="h-5 w-5" />
              </button>
            </div>
            {panel}
            <Button className="mt-5 w-full" onClick={() => setMobileOpen(false)}>
              Show {resultCount} products
            </Button>
          </div>
        </div>
      )}
    </>
  );
};

export default ProductFilter;
