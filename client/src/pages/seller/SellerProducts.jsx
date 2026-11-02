import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiEdit2, FiPlus, FiSearch, FiTrash2 } from 'react-icons/fi';
import { toast } from 'react-toastify';
import Button from '../../components/common/Button';
import EmptyState from '../../components/common/EmptyState';
import Loader from '../../components/common/Loader';
import Pagination from '../../components/common/Pagination';
import Modal from '../../components/common/Modal';
import sellerService from '../../services/sellerService';
import productService from '../../services/productService';
import { getErrorMessage } from '../../services/api';
import { formatPrice, resolveImage } from '../../utils/formatPrice';
import { PAYMENT_STATUS_STYLES } from '../../utils/constants';
import { cn } from '../../utils/classNames';

const statusOptions = ['all', 'active', 'draft', 'inactive', 'blocked'];

const SellerProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [deleting, setDeleting] = useState(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await sellerService.getProducts({ q, status, page, limit: 12 });
      setProducts(data.products || []);
      setPagination(data.pagination || { page: 1, pages: 1, total: 0 });
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [q, status, page]);

  useEffect(() => {
    load();
  }, [load]);

  const remove = async () => {
    setDeleteBusy(true);
    try {
      const { data } = await productService.deleteProduct(deleting._id);
      toast.success(data.message);
      setDeleting(null);
      await load();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setDeleteBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Manage products</h1>
          <p className="mt-1 text-sm text-slate-500">{pagination.total} product(s) in your catalog</p>
        </div>
        <Button to="/seller/products/add" icon={FiPlus}>Add product</Button>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-card sm:flex-row sm:items-center">
        <form onSubmit={(e) => { e.preventDefault(); setPage(1); load(); }} className="relative flex-1">
          <FiSearch className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search your products..." className="input pl-10" />
        </form>
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="input sm:w-44">
          {statusOptions.map((s) => <option key={s} value={s}>{s === 'all' ? 'All statuses' : s}</option>)}
        </select>
      </div>

      {loading ? <Loader label="Loading products..." /> : products.length ? (
        <>
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px]">
                <thead><tr className="table-head"><th className="px-4 py-3">Product</th><th className="px-4 py-3">Category</th><th className="px-4 py-3">Price</th><th className="px-4 py-3">Stock</th><th className="px-4 py-3">Sold</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Actions</th></tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {products.map((product) => (
                    <tr key={product._id} className="hover:bg-slate-50/60">
                      <td className="table-cell">
                        <div className="flex items-center gap-3">
                          <img src={resolveImage(product.images?.[0]?.url)} alt={product.name} className="h-10 w-10 rounded-lg border border-slate-200 object-cover" onError={(e) => { e.currentTarget.src = '/images/product-placeholder.svg'; }} />
                          <div className="max-w-[240px]">
                            <Link to={`/products/${product._id}`} className="line-clamp-1 font-semibold text-slate-800 hover:text-brand-700">{product.name}</Link>
                            <p className="text-xs text-slate-400">{product.brand || 'No brand'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="table-cell">{product.category?.name || '—'}</td>
                      <td className="table-cell font-semibold">{formatPrice(product.discountPrice > 0 ? product.discountPrice : product.price)}</td>
                      <td className="table-cell"><span className={cn('font-semibold', product.stock <= 5 ? 'text-rose-600' : 'text-slate-700')}>{product.stock}</span></td>
                      <td className="table-cell">{product.sold || 0}</td>
                      <td className="table-cell"><span className={cn('badge', PAYMENT_STATUS_STYLES[product.status] || 'bg-slate-100 text-slate-600')}>{product.status}</span></td>
                      <td className="table-cell">
                        <div className="flex justify-end gap-1">
                          <Link to={`/seller/products/${product._id}/edit`} className="rounded-lg p-2 text-slate-400 hover:bg-brand-50 hover:text-brand-700" aria-label="Edit"><FiEdit2 className="h-4 w-4" /></Link>
                          <button type="button" onClick={() => setDeleting(product)} className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600" aria-label="Delete"><FiTrash2 className="h-4 w-4" /></button>
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
      ) : (
        <EmptyState icon={FiPlus} title="No products found" description={q || status !== 'all' ? 'Try clearing your search or filters.' : 'Add your first product to start selling.'} action={<Button to="/seller/products/add" icon={FiPlus}>Add product</Button>} />
      )}

      <Modal
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        title="Delete product?"
        description="This permanently removes the product from your catalog and storefront."
        footer={<><Button variant="outline" size="sm" onClick={() => setDeleting(null)}>Cancel</Button><Button variant="danger" size="sm" loading={deleteBusy} onClick={remove}>Delete</Button></>}
      >
        <p className="text-sm text-slate-600">{deleting?.name}</p>
      </Modal>
    </div>
  );
};

export default SellerProducts;
