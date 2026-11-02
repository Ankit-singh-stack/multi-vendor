import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiExternalLink, FiSearch, FiTrash2 } from 'react-icons/fi';
import { toast } from 'react-toastify';
import Button from '../../components/common/Button';
import EmptyState from '../../components/common/EmptyState';
import Loader from '../../components/common/Loader';
import Modal from '../../components/common/Modal';
import Pagination from '../../components/common/Pagination';
import adminService from '../../services/adminService';
import categoryService from '../../services/categoryService';
import productService from '../../services/productService';
import { getErrorMessage } from '../../services/api';
import { formatPrice, resolveImage } from '../../utils/formatPrice';
import { PAYMENT_STATUS_STYLES } from '../../utils/constants';
import { cn } from '../../utils/classNames';

const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('all');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await adminService.getProducts({ q, status, category, page, limit: 15 });
      setProducts(data.products || []);
      setPagination(data.pagination || { page: 1, pages: 1, total: 0 });
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [q, status, category, page]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    categoryService.getCategories({ all: true }).then(({ data }) => setCategories(data.categories || [])).catch(() => {});
  }, []);

  const remove = async () => {
    setBusy(true);
    try {
      await productService.deleteProduct(deleting._id);
      toast.success('Product deleted.');
      setDeleting(null);
      await load();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setBusy(false);
    }
  };

  const statuses = ['all', 'active', 'draft', 'inactive', 'blocked'];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Products</h1>
        <p className="mt-1 text-sm text-slate-500">{pagination.total} product(s) listed across all sellers.</p>
      </div>

      <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-card sm:grid-cols-[1fr_auto_auto]">
        <form onSubmit={(e) => { e.preventDefault(); setPage(1); load(); }} className="relative">
          <FiSearch className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search product name..." className="input pl-10" />
        </form>
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="input sm:w-40">
          {statuses.map((s) => <option key={s} value={s}>{s === 'all' ? 'All statuses' : s}</option>)}
        </select>
        <select value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }} className="input sm:w-48">
          <option value="">All categories</option>
          {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
        </select>
      </div>

      {loading ? <Loader label="Loading products..." /> : products.length ? (
        <>
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px]">
                <thead><tr className="table-head"><th className="px-4 py-3">Product</th><th className="px-4 py-3">Seller</th><th className="px-4 py-3">Category</th><th className="px-4 py-3">Price</th><th className="px-4 py-3">Stock</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Actions</th></tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {products.map((product) => (
                    <tr key={product._id} className="hover:bg-slate-50/60">
                      <td className="table-cell">
                        <div className="flex items-center gap-3">
                          <img src={resolveImage(product.images?.[0]?.url)} alt={product.name} className="h-10 w-10 rounded-lg border border-slate-200 object-cover" onError={(e) => { e.currentTarget.src = '/images/product-placeholder.svg'; }} />
                          <div><p className="max-w-[220px] truncate font-semibold text-slate-800">{product.name}</p><p className="text-[11px] text-slate-500">{product.brand || 'No brand'}</p></div>
                        </div>
                      </td>
                      <td className="table-cell"><p className="text-xs font-medium">{product.seller?.name || '—'}</p><p className="text-[11px] text-slate-500">{product.seller?.email}</p></td>
                      <td className="table-cell">{product.category?.name || '—'}</td>
                      <td className="table-cell"><p className="font-semibold">{formatPrice(product.discountPrice || product.price)}</p>{product.discountPrice > 0 && <p className="text-[11px] text-slate-400 line-through">{formatPrice(product.price)}</p>}</td>
                      <td className="table-cell"><span className={cn('font-semibold', product.stock > 0 ? 'text-slate-700' : 'text-rose-600')}>{product.stock}</span></td>
                      <td className="table-cell"><span className={cn('badge', PAYMENT_STATUS_STYLES[product.status] || 'bg-slate-100 text-slate-600')}>{product.status}</span></td>
                      <td className="table-cell">
                        <div className="flex justify-end gap-1">
                          <Link to={`/products/${product._id}`} className="rounded-lg p-2 text-slate-400 hover:bg-brand-50 hover:text-brand-700" aria-label="View product"><FiExternalLink className="h-4 w-4" /></Link>
                          <button type="button" onClick={() => setDeleting(product)} className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600" aria-label="Delete product"><FiTrash2 className="h-4 w-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <Pagination page={pagination.page} pages={pagination.pages} onPageChange={setPage} />
        </>
      ) : <EmptyState icon={FiSearch} title="No products found" description="Try another filter or search term." />}

      <Modal open={Boolean(deleting)} onClose={() => setDeleting(null)} title="Delete product?" description="This action permanently removes the product. Existing order records are preserved." footer={<><Button size="sm" variant="outline" onClick={() => setDeleting(null)}>Cancel</Button><Button size="sm" variant="danger" loading={busy} onClick={remove}>Delete product</Button></>}>
        <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3">
          <img src={resolveImage(deleting?.images?.[0]?.url)} alt="" className="h-12 w-12 rounded-lg object-cover" onError={(e) => { e.currentTarget.src = '/images/product-placeholder.svg'; }} />
          <div><p className="text-sm font-semibold">{deleting?.name}</p><p className="text-xs text-slate-500">{deleting?.seller?.name} · {formatPrice(deleting?.discountPrice || deleting?.price)}</p></div>
        </div>
      </Modal>
    </div>
  );
};

export default AdminProducts;
