import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiAlertTriangle, FiCheck, FiLayers, FiMinus, FiPlus } from 'react-icons/fi';
import { toast } from 'react-toastify';
import Button from '../../components/common/Button';
import EmptyState from '../../components/common/EmptyState';
import Loader from '../../components/common/Loader';
import sellerService from '../../services/sellerService';
import productService from '../../services/productService';
import { getErrorMessage } from '../../services/api';
import { formatPrice, resolveImage } from '../../utils/formatPrice';
import { cn } from '../../utils/classNames';

const SellerInventory = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stocks, setStocks] = useState({});
  const [savingId, setSavingId] = useState('');
  const [onlyLow, setOnlyLow] = useState(false);

  const load = async () => {
    try {
      const { data } = await sellerService.getProducts({ limit: 60 });
      const list = data.products || [];
      setProducts(list);
      setStocks(Object.fromEntries(list.map((p) => [p._id, p.stock])));
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const changeStock = (id, delta) => {
    setStocks((prev) => ({ ...prev, [id]: Math.max(0, Number(prev[id] || 0) + delta) }));
  };

  const saveStock = async (product) => {
    const stock = Number(stocks[product._id]);
    if (Number.isNaN(stock) || stock < 0) return toast.error('Enter a valid stock quantity.');
    setSavingId(product._id);
    try {
      const payload = new FormData();
      payload.append('stock', String(stock));
      await productService.updateProduct(product._id, payload);
      setProducts((prev) => prev.map((p) => (p._id === product._id ? { ...p, stock } : p)));
      toast.success(`Stock updated for ${product.name}.`);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSavingId('');
    }
  };

  if (loading) return <Loader label="Loading inventory..." />;

  const visible = onlyLow ? products.filter((p) => p.stock <= 5) : products;
  const lowCount = products.filter((p) => p.stock <= 5).length;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Inventory</h1>
          <p className="mt-1 text-sm text-slate-500">Update stock levels. Orders reserve stock at checkout.</p>
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input type="checkbox" checked={onlyLow} onChange={(e) => setOnlyLow(e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-brand-600" />
          Only low stock ({lowCount})
        </label>
      </div>

      <div className={cn('flex items-center gap-2 rounded-xl border p-3 text-sm', lowCount ? 'border-amber-200 bg-amber-50 text-amber-800' : 'border-emerald-200 bg-emerald-50 text-emerald-800')}>
        {lowCount ? <FiAlertTriangle className="h-4 w-4" /> : <FiCheck className="h-4 w-4" />}
        {lowCount ? `${lowCount} product(s) have 5 or fewer units remaining.` : 'All products have healthy stock levels.'}
      </div>

      {visible.length ? (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px]">
              <thead><tr className="table-head"><th className="px-4 py-3">Product</th><th className="px-4 py-3">Price</th><th className="px-4 py-3">Stock</th><th className="px-4 py-3">Adjust</th><th className="px-4 py-3 text-right">Save</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {visible.map((product) => (
                  <tr key={product._id} className="hover:bg-slate-50/60">
                    <td className="table-cell">
                      <div className="flex items-center gap-3">
                        <img src={resolveImage(product.images?.[0]?.url)} alt={product.name} className="h-10 w-10 rounded-lg border border-slate-200 object-cover" onError={(e) => { e.currentTarget.src = '/images/product-placeholder.svg'; }} />
                        <div className="max-w-[260px]">
                          <Link to={`/products/${product._id}`} className="line-clamp-1 font-semibold text-slate-800 hover:text-brand-700">{product.name}</Link>
                          <p className="text-xs text-slate-400">{product.category?.name || 'Uncategorised'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="table-cell font-semibold">{formatPrice(product.discountPrice > 0 ? product.discountPrice : product.price)}</td>
                    <td className="table-cell"><span className={cn('badge', product.stock <= 5 ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700')}>{product.stock} units</span></td>
                    <td className="table-cell">
                      <div className="flex items-center rounded-lg border border-slate-300">
                        <button type="button" onClick={() => changeStock(product._id, -1)} className="flex h-8 w-8 items-center justify-center text-slate-500 hover:text-slate-900"><FiMinus className="h-3.5 w-3.5" /></button>
                        <input
                          type="number"
                          min="0"
                          value={stocks[product._id] ?? 0}
                          onChange={(e) => setStocks((prev) => ({ ...prev, [product._id]: e.target.value }))}
                          className="h-8 w-16 border-x border-slate-200 text-center text-sm outline-none"
                        />
                        <button type="button" onClick={() => changeStock(product._id, 1)} className="flex h-8 w-8 items-center justify-center text-slate-500 hover:text-slate-900"><FiPlus className="h-3.5 w-3.5" /></button>
                      </div>
                    </td>
                    <td className="table-cell text-right">
                      <Button size="xs" loading={savingId === product._id} onClick={() => saveStock(product)} disabled={Number(stocks[product._id]) === product.stock}>Save</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <EmptyState icon={FiLayers} title="No products to show" description={onlyLow ? 'No products are low on stock.' : 'Add products to manage inventory.'} />
      )}
    </div>
  );
};

export default SellerInventory;
