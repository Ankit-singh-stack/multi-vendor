import { useEffect, useState } from 'react';
import { FiBarChart2, FiDollarSign, FiPackage, FiPercent, FiShoppingBag } from 'react-icons/fi';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { toast } from 'react-toastify';
import StatsCard from '../../components/dashboard/StatsCard';
import Loader from '../../components/common/Loader';
import EmptyState from '../../components/common/EmptyState';
import sellerService from '../../services/sellerService';
import { getErrorMessage } from '../../services/api';
import { formatPrice, resolveImage } from '../../utils/formatPrice';

const COLORS = ['#4f46e5', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#64748b'];

const SellerAnalytics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    sellerService
      .getAnalytics()
      .then(({ data: response }) => setData(response))
      .catch((error) => toast.error(getErrorMessage(error)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader label="Loading analytics..." />;
  if (!data) return <EmptyState title="Analytics unavailable" description="Unable to load your sales analytics." />;

  const { stats, topProducts = [], statusCounts = [] } = data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Sales analytics</h1>
        <p className="mt-1 text-sm text-slate-500">Delivered-order revenue, earnings and product performance.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatsCard icon={FiShoppingBag} label="Gross sales" value={formatPrice(stats.grossSales)} hint={`${stats.deliveredOrders} delivered orders`} tone="brand" />
        <StatsCard icon={FiDollarSign} label="Net earnings" value={formatPrice(stats.netEarnings)} hint="After commission" tone="emerald" />
        <StatsCard icon={FiPercent} label="Commission" value={formatPrice(stats.commission)} hint="Marketplace fee" tone="violet" />
        <StatsCard icon={FiPackage} label="Orders" value={stats.totalOrders} hint={`${stats.cancelledOrders} cancelled`} tone="amber" />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.4fr_1fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
          <h2 className="flex items-center gap-2 text-base font-semibold"><FiBarChart2 className="h-4 w-4 text-brand-600" /> Monthly performance</h2>
          {stats.monthly?.length ? (
            <div className="mt-4 h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.monthly}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} width={55} />
                  <Tooltip formatter={(value) => formatPrice(value)} />
                  <Bar dataKey="sales" name="Sales" fill="#4f46e5" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="earnings" name="Earnings" fill="#10b981" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : <p className="mt-6 rounded-xl bg-slate-50 p-5 text-sm text-slate-500">No delivered orders yet.</p>}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
          <h2 className="text-base font-semibold">Order status mix</h2>
          {statusCounts.length ? (
            <div className="mt-2 h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusCounts} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={3}>
                    {statusCounts.map((entry, index) => <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : <p className="mt-6 rounded-xl bg-slate-50 p-5 text-sm text-slate-500">No status data yet.</p>}
          <div className="mt-2 flex flex-wrap gap-2">
            {statusCounts.map((entry, index) => (
              <span key={entry.name} className="badge bg-slate-50 text-slate-600">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} /> {entry.name}: {entry.value}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
        <h2 className="text-base font-semibold">Top products by units sold</h2>
        <div className="mt-4 space-y-3">
          {topProducts.length ? topProducts.map((product, index) => (
            <div key={product._id} className="flex items-center gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">{index + 1}</span>
              <img src={resolveImage(product.images?.[0]?.url)} alt={product.name} className="h-10 w-10 rounded-lg border border-slate-200 object-cover" onError={(e) => { e.currentTarget.src = '/images/product-placeholder.svg'; }} />
              <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-slate-800">{product.name}</p><p className="text-xs text-slate-500">{formatPrice(product.price)}</p></div>
              <span className="badge bg-brand-50 text-brand-700">{product.sold || 0} sold</span>
            </div>
          )) : <p className="text-sm text-slate-500">No products yet.</p>}
        </div>
      </div>
    </div>
  );
};

export default SellerAnalytics;
