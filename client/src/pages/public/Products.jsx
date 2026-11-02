import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { FiChevronRight, FiSearch } from 'react-icons/fi';
import ProductFilter from '../../components/products/ProductFilter';
import ProductList from '../../components/products/ProductList';
import Pagination from '../../components/common/Pagination';
import productService from '../../services/productService';
import categoryService from '../../services/categoryService';
import { SORT_OPTIONS } from '../../utils/constants';

const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const queryString = searchParams.toString();
  const filters = useMemo(
    () => ({
      q: searchParams.get('q') || '',
      category: searchParams.get('category') || '',
      minPrice: searchParams.get('minPrice') || '',
      maxPrice: searchParams.get('maxPrice') || '',
      sort: searchParams.get('sort') || 'newest',
      rating: searchParams.get('rating') || '',
      page: Number(searchParams.get('page')) || 1,
      featured: searchParams.get('featured') || '',
      seller: searchParams.get('seller') || '',
    }),
    [queryString]
  );

  useEffect(() => {
    categoryService
      .getCategories()
      .then(({ data }) => setCategories(data.categories || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    const params = {
      q: filters.q || undefined,
      category: filters.category || undefined,
      minPrice: filters.minPrice || undefined,
      maxPrice: filters.maxPrice || undefined,
      sort: filters.sort || undefined,
      rating: filters.rating || undefined,
      page: filters.page,
      limit: 12,
      featured: filters.featured || undefined,
      seller: filters.seller || undefined,
    };
    productService
      .getProducts(params)
      .then(({ data }) => {
        if (!active) return;
        setProducts(data.products || []);
        setPagination(data.pagination || { page: 1, pages: 0, total: 0 });
      })
      .catch((err) => {
        if (active) setError(err?.response?.data?.message || 'Unable to load products.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [queryString]);

  const updateFilters = (patch) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(patch).forEach(([key, value]) => {
      if (value === '' || value === null || value === undefined) next.delete(key);
      else next.set(key, value);
    });
    if (!('page' in patch)) next.delete('page');
    setSearchParams(next);
  };

  const resetFilters = () => {
    const next = new URLSearchParams();
    if (filters.q) next.set('q', filters.q);
    setSearchParams(next);
  };

  const goToPage = (page) => {
    updateFilters({ page: String(page) });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const activeCategory = categories.find((c) => c.slug === filters.category);
  const heading = filters.q
    ? `Results for “${filters.q}”`
    : activeCategory
      ? activeCategory.name
      : filters.featured === 'true'
        ? 'Featured products'
        : 'All products';

  return (
    <div className="container-page py-8">
      <nav className="flex items-center gap-1.5 text-xs text-slate-500">
        <Link to="/" className="hover:text-brand-700">Home</Link>
        <FiChevronRight className="h-3 w-3" />
        <Link to="/products" className="hover:text-brand-700">Products</Link>
        {activeCategory && (
          <>
            <FiChevronRight className="h-3 w-3" />
            <span className="text-slate-700">{activeCategory.name}</span>
          </>
        )}
      </nav>

      <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">{heading}</h1>
          <p className="mt-1 text-sm text-slate-500">
            {loading ? 'Finding the best matches...' : `${pagination.total || 0} product${pagination.total === 1 ? '' : 's'} found`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="sort" className="text-xs font-medium text-slate-500">Sort</label>
          <select
            id="sort"
            value={filters.sort}
            onChange={(e) => updateFilters({ sort: e.target.value })}
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
      </div>

      {(filters.q || filters.category || filters.minPrice || filters.maxPrice || filters.rating) && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-slate-500">Active:</span>
          {filters.q && <Chip label={`Search: ${filters.q}`} onClear={() => updateFilters({ q: '' })} />}
          {activeCategory && <Chip label={activeCategory.name} onClear={() => updateFilters({ category: '' })} />}
          {(filters.minPrice || filters.maxPrice) && (
            <Chip
              label={`₹${filters.minPrice || 0} – ₹${filters.maxPrice || 'any'}`}
              onClear={() => updateFilters({ minPrice: '', maxPrice: '' })}
            />
          )}
          {filters.rating && <Chip label={`${filters.rating}★ & above`} onClear={() => updateFilters({ rating: '' })} />}
          <button type="button" onClick={resetFilters} className="text-xs font-semibold text-brand-700 hover:underline">
            Clear all
          </button>
        </div>
      )}

      <div className="mt-6 flex gap-8">
        <ProductFilter
          categories={categories}
          filters={filters}
          onChange={updateFilters}
          onReset={resetFilters}
          resultCount={pagination.total}
        />
        <div className="min-w-0 flex-1">
          {error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
              <FiSearch className="mb-2 h-5 w-5" />
              {error}
              <button type="button" onClick={() => window.location.reload()} className="ml-2 font-semibold underline">
                Retry
              </button>
            </div>
          ) : (
            <>
              <ProductList
                products={products}
                loading={loading}
                emptyTitle="No matching products"
                emptyDescription="Try a different search term, category or price range."
              />
              <Pagination
                page={pagination.page}
                pages={pagination.pages}
                onPageChange={goToPage}
                className="mt-8"
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const Chip = ({ label, onClear }) => (
  <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700">
    {label}
    <button type="button" onClick={onClear} className="text-brand-500 hover:text-brand-800" aria-label={`Remove ${label}`}>
      ×
    </button>
  </span>
);

export default Products;
