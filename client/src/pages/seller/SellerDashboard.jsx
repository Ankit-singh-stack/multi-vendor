import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FiAlertTriangle,
  FiArrowRight,
  FiBox,
  FiDollarSign,
  FiPackage,
  FiPercent,
  FiPlus,
  FiShoppingBag,
  FiStar,
} from 'react-icons/fi';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { toast } from 'react-toastify';
import StatsCard from '../../components/dashboard/StatsCard';
import Loader from '../../components/common/Loader';
import EmptyState from '../../components/common/EmptyState';
import Button from '../../components/common/Button';
import OrderStatus from '../../components/orders/OrderStatus';
import useAuth from '../../hooks/useAuth';
import sellerService from '../../services/sellerService';
import { getErrorMessage } from '../../services/api';
import { formatDate, formatPrice, resolveImage } from '../../utils/formatPrice';

const SellerDashboard = () => {
  const { sellerProfile } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    sellerService
      .getDashboard()
      .then(({ data: response }) => setData(response))
      .catch((error) => toast.error(getErrorMessage(error)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader label="Loading seller dashboard..." />;
  if (!data) return <EmptyState title="Dashboard unavailable" description="Please refresh or log in again." />;

  const { stats, recentOrders = [], topProducts = [], profile, store } = data;
  const status = profile?.status || sellerProfile?.status;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{store?.name || profile?.businessName || 'Seller dashboard'}</h1>
          <p className="mt-1 text-sm text-slate-500">Track sales, orders and payouts from your marketplace store.</p>
        </div>
        <div className="flex gap-2">
          <Button to="/seller/products/add" size="sm" icon={FiPlus}>Add product</Button>
          <Button to="/seller/orders" size="sm" variant="outline">View orders</Button>
        </div>
      </div>

      {status !== 'approved' && (
        <div className={`flex items-start gap-3 rounded-2xl border p-4 ${status === 'rejected' ? 'border-rose-200 bg-rose-50 text-rose-800' : 'border-amber-200 bg-amber-50 text-amber-800'}`}>
          <FiAlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="text-sm font-semibold">Seller account is {status || 'pending'} approval</p>
            <p className="mt-1 text-xs leading-relaxed">
              {status === 'rejected'
                ? profile?.rejectionReason || 'Your application was rejected. Update your profile and contact support.'
                : 'You can prepare your store, but products can only go live after an administrator approves your seller profile.'}
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatsCard icon={FiDollarSign} label="Net earnings" value={formatPrice(stats.netEarnings)} hint="From delivered orders" tone="emerald" />
        <StatsCard icon={FiShoppingBag} label="Gross sales" value={formatPrice(stats.grossSales)} hint={`${stats.deliveredOrders} delivered`} tone="brand" />
        <StatsCard icon={FiPackage} label="Total orders" value={stats.totalOrders} hint={`${stats.pendingOrders} in progress`} tone="amber" />
        <StatsCard icon={FiPercent} label="Commission paid" value={formatPrice(stats.commission)} hint="Marketplace fee" tone="violet" />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatsCard icon={FiBox} label="Products" value={stats.totalProducts} hint={`${stats.activeProducts} active`} tone="sky" />
        <StatsCard icon={FiAlertTriangle} label="Low stock" value={stats.lowStock} hint="5 units or fewer" tone="rose" />
        <StatsCard icon={FiStar} label="Top product sold" value={topProducts[0]?.sold || 0} hint={topProducts[0]?.name || 'No sales yet'} tone="amber" />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.4fr_1fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold">Monthly sales</h2>
              <p className="text-xs text-slate-500">Last six months of delivered orders</p>
            </div>
            <Link to="/seller/analytics" className="inline-flex items-center gap-1 text-xs font-semibold text-brand-700">Analytics <FiArrowRight /></Link>
          </div>
          {stats.monthly?.length ? (
            <div className="mt-4 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.monthly}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} width={50} />
                  <Tooltip formatter={(value, name) => [formatPrice(value), name === 'sales' ? 'Sales' : 'Earnings']} />
                  <Bar dataKey="sales" fill="#4f46e5" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="earnings" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="mt-6 rounded-xl bg-slate-50 p-5 text-sm text-slate-500">Sales will appear here after your first delivered order.</p>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
          <h2 className="text-base font-semibold">Best sellers</h2>
          <div className="mt-3 space-y-3">
            {topProducts.length ? topProducts.map((product) => (
              <div key={product._id} className="flex items-center gap-3">
                <img src={resolveImage(product.images?.[0]?.url)} alt={product.name} className="h-11 w-11 rounded-lg border border-slate-200 object-cover" onError={(e) => { e.currentTarget.src = '/images/product-placeholder.svg'; }} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-800">{product.name}</p>
                  <p className="text-xs text-slate-500">{product.sold || 0} sold · {formatPrice(product.price)}</p>
                </div>
              </div>
            )) : <p className="text-sm text-slate-500">No products added yet.</p>}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">Recent orders</h2>
          <Link to="/seller/orders" className="inline-flex items-center gap-1 text-xs font-semibold text-brand-700">All orders <FiArrowRight /></Link>
        </div>
        {recentOrders.length ? (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[640px] text-left">
              <thead><tr className="table-head"><th className="px-3 py-2">Order</th><th className="px-3 py-2">Customer</th><th className="px-3 py-2">Items</th><th className="px-3 py-2">Value</th><th className="px-3 py-2">Status</th><th className="px-3 py-2">Date</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {recentOrders.map((order) => {
                  const total = order.subOrders.reduce((s, sub) => s + sub.itemsTotal, 0);
                  const statuses = [...new Set(order.subOrders.map((s) => s.status))];
                  return (
                    <tr key={order._id}>
                      <td className="table-cell font-semibold text-slate-800">{order.orderNumber}</td>
                      <td className="table-cell">{order.customer?.name || 'Customer'}</td>
                      <td className="table-cell">{order.subOrders.reduce((s, sub) => s + sub.items.length, 0)}</td>
                      <td className="table-cell font-semibold">{formatPrice(total)}</td>
                      <td className="table-cell"><div className="flex flex-wrap gap-1">{statuses.map((s) => <OrderStatus key={s} status={s} />)}</div></td>
                      <td className="table-cell text-xs text-slate-500">{formatDate(order.createdAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState icon={FiShoppingBag} title="No orders yet" description="New orders from customers will appear here." className="mt-4" />
        )}
      </div>
    </div>
  );
};

export default SellerDashboard;
