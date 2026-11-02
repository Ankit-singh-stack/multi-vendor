import { useEffect, useState } from 'react';
import { FiDollarSign, FiPackage, FiRotateCcw, FiShoppingBag } from 'react-icons/fi';
import { toast } from 'react-toastify';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import StatsCard from '../../components/dashboard/StatsCard';
import EmptyState from '../../components/common/EmptyState';
import Loader from '../../components/common/Loader';
import adminService from '../../services/adminService';
import { getErrorMessage } from '../../services/api';
import { formatPrice } from '../../utils/formatPrice';

const COLORS = ['#4f46e5', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#64748b', '#ec4899'];

const AdminAnalytics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminService
      .getAnalytics()
      .then(({ data: response }) => setData(response))
      .catch((error) => toast.error(getErrorMessage(error)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader label="Loading marketplace analytics..." />;
  if (!data) return <EmptyState title="Analytics unavailable" />;

  const { summary, monthly = [], topProducts = [], topSellers = [], categorySales = [] } = data;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Marketplace analytics</h1>
        <p className="mt-1 text-sm text-slate-500">Revenue, refunds and catalog performance across all sellers.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatsCard icon={FiDollarSign} label="Gross revenue" value={formatPrice(summary.revenue)} hint="Paid orders" tone="brand" />
        <StatsCard icon={FiRotateCcw} label="Refunds processed" value={formatPrice(summary.refundTotal)} hint={`${summary.totalRefunds} refund(s)`} tone="rose" />
        <StatsCard icon={FiPackage} label="Net revenue" value={formatPrice(summary.netRevenue)} hint="Gross minus refunds" tone="emerald" />
        <StatsCard icon={FiShoppingBag} label="Catalog & users" value={`${summary.totalProducts} products`} hint={`${summary.totalCustomers} customers · ${summary.totalSellers} sellers`} tone="sky" />
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
          <h2 className="text-base font-semibold">Revenue & orders</h2>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthly}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="left" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} width={55} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} width={35} />
                <Tooltip formatter={(value, name) => name === 'revenue' ? formatPrice(value) : value} />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="revenue" name="Revenue" stroke="#4f46e5" strokeWidth={2.5} dot={{ r: 3 }} />
                <Line yAxisId="right" type="monotone" dataKey="orders" name="Orders" stroke="#0ea5e9" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
          <h2 className="text-base font-semibold">Revenue by category</h2>
          {categorySales.length ? (
            <>
              <div className="mt-2 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={categorySales} dataKey="revenue" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={2}>
                      {categorySales.map((entry, index) => <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(value) => formatPrice(value)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap justify-center gap-1.5">
                {categorySales.slice(0, 6).map((entry, index) => (
                  <span key={entry.name} className="badge bg-slate-50 text-slate-600"><span className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} /> {entry.name}</span>
                ))}
              </div>
            </>
          ) : <p className="mt-6 rounded-xl bg-slate-50 p-5 text-sm text-slate-500">No paid sales by category yet.</p>}
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
          <h2 className="text-base font-semibold">Top products by revenue</h2>
          {topProducts.length ? (
            <div className="mt-4 h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topProducts} layout="vertical" margin={{ left: 10, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                  <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 10, fill: '#475569' }} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(value) => formatPrice(value)} />
                  <Bar dataKey="revenue" fill="#4f46e5" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : <p className="mt-6 rounded-xl bg-slate-50 p-5 text-sm text-slate-500">No product sales yet.</p>}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
          <h2 className="text-base font-semibold">Seller leaderboard</h2>
          <div className="mt-3 space-y-3">
            {topSellers.length ? topSellers.map((seller, index) => (
              <div key={seller._id} className="flex items-center gap-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">{index + 1}</span>
                <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-slate-800">{seller.name}</p><p className="truncate text-xs text-slate-500">{seller.email}</p></div>
                <div className="text-right"><p className="text-sm font-bold">{formatPrice(seller.revenue)}</p><p className="text-[11px] text-slate-500">{seller.orders} group(s)</p></div>
              </div>
            )) : <p className="text-sm text-slate-500">No seller revenue yet.</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalytics;
