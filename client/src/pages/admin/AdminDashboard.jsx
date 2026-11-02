import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FiAlertCircle,
  FiArrowRight,
  FiBox,
  FiDollarSign,
  FiPackage,
  FiPercent,
  FiShoppingBag,
  FiTruck,
  FiUsers,
} from 'react-icons/fi';
import {
  Area,
  AreaChart,
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
import OrderStatus from '../../components/orders/OrderStatus';
import adminService from '../../services/adminService';
import { getErrorMessage } from '../../services/api';
import { formatDate, formatPrice } from '../../utils/formatPrice';

const COLORS = ['#4f46e5', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#64748b', '#ec4899'];

const AdminDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminService
      .getDashboard()
      .then(({ data: response }) => setData(response))
      .catch((error) => toast.error(getErrorMessage(error)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader label="Loading admin dashboard..." />;
  if (!data) return <EmptyState title="Dashboard unavailable" description="Unable to load marketplace metrics." />;

  const { stats, monthlyRevenue = [], statusCounts = [], recentOrders = [], topSellers = [] } = data;

  const quickActions = [
    { to: '/admin/sellers', label: 'Review sellers', detail: `${stats.pendingSellers} pending`, icon: FiShoppingBag },
    { to: '/admin/delivery-partners', label: 'Approve partners', detail: `${stats.pendingDelivery} pending`, icon: FiTruck },
    { to: '/admin/refunds', label: 'Process refunds', detail: `${stats.pendingRefunds} pending`, icon: FiDollarSign },
    { to: '/admin/orders', label: 'Manage orders', detail: `${stats.totalOrders} total`, icon: FiPackage },
  ];

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-brand-900 to-brand-700 p-6 text-white sm:p-8">
        <div className="absolute -right-10 -top-10 h-52 w-52 rounded-full bg-accent-500/20 blur-2xl" />
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-200">Marketplace control centre</p>
        <h1 className="mt-2 text-2xl font-bold text-white sm:text-3xl">Everything happening on MarketSphere</h1>
        <p className="mt-2 max-w-2xl text-sm text-brand-100">
          Monitor revenue, approve sellers and delivery partners, assign shipments and settle commissions from one place.
        </p>
        <div className="relative mt-5 flex flex-wrap gap-4 text-sm">
          <span><strong className="text-lg">{stats.totalUsers}</strong> marketplace users</span>
          <span><strong className="text-lg">{stats.totalProducts}</strong> products</span>
          <span><strong className="text-lg">{formatPrice(stats.totalRevenue)}</strong> paid revenue</span>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatsCard icon={FiDollarSign} label="Paid revenue" value={formatPrice(stats.totalRevenue)} hint="All paid orders" tone="emerald" />
        <StatsCard icon={FiPercent} label="Commission earned" value={formatPrice(stats.commissionRevenue)} hint="Marketplace fee" tone="brand" />
        <StatsCard icon={FiUsers} label="Customers" value={stats.totalCustomers} hint={`${stats.totalSellers} sellers`} tone="sky" />
        <StatsCard icon={FiPackage} label="Orders" value={stats.totalOrders} hint={`${stats.pendingRefunds} refunds pending`} tone="amber" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {quickActions.map((action) => (
          <Link key={action.to} to={action.to} className="group flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-card transition hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-soft">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600"><action.icon className="h-5 w-5" /></span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-slate-800">{action.label}</p>
              <p className="text-xs text-slate-500">{action.detail}</p>
            </div>
            <FiArrowRight className="text-slate-300 transition group-hover:translate-x-1 group-hover:text-brand-600" />
          </Link>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.5fr_1fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold">Revenue trend</h2>
              <p className="text-xs text-slate-500">Paid orders over the last six months</p>
            </div>
            <Link to="/admin/analytics" className="text-xs font-semibold text-brand-700">Full analytics</Link>
          </div>
          {monthlyRevenue.length ? (
            <div className="mt-4 h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyRevenue}>
                  <defs>
                    <linearGradient id="revenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} width={55} />
                  <Tooltip formatter={(value) => formatPrice(value)} />
                  <Area type="monotone" dataKey="revenue" stroke="#4f46e5" strokeWidth={2} fill="url(#revenue)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : <p className="mt-6 rounded-xl bg-slate-50 p-5 text-sm text-slate-500">No paid orders yet.</p>}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
          <h2 className="text-base font-semibold">Order status distribution</h2>
          {statusCounts.length ? (
            <div className="mt-2 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusCounts} dataKey="value" nameKey="name" innerRadius={50} outerRadius={85} paddingAngle={3}>
                    {statusCounts.map((entry, index) => <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : <p className="mt-6 rounded-xl bg-slate-50 p-5 text-sm text-slate-500">No orders yet.</p>}
          <div className="mt-1 flex flex-wrap gap-1.5">
            {statusCounts.slice(0, 6).map((entry, index) => (
              <span key={entry.name} className="badge bg-slate-50 text-slate-600">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} /> {entry.name} {entry.value}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.5fr_1fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">Recent orders</h2>
            <Link to="/admin/orders" className="text-xs font-semibold text-brand-700">View all</Link>
          </div>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[580px]">
              <thead><tr className="table-head"><th className="px-3 py-2">Order</th><th className="px-3 py-2">Customer</th><th className="px-3 py-2">Total</th><th className="px-3 py-2">Status</th><th className="px-3 py-2">Date</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {recentOrders.map((order) => (
                  <tr key={order._id}>
                    <td className="table-cell font-semibold text-slate-800">{order.orderNumber}</td>
                    <td className="table-cell">{order.customer?.name || 'Customer'}</td>
                    <td className="table-cell">{formatPrice(order.pricing?.grandTotal)}</td>
                    <td className="table-cell"><OrderStatus status={order.status} /></td>
                    <td className="table-cell text-xs text-slate-500">{formatDate(order.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!recentOrders.length && <p className="py-5 text-sm text-slate-500">No orders yet.</p>}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
          <h2 className="text-base font-semibold">Top sellers</h2>
          <div className="mt-3 space-y-3">
            {topSellers.length ? topSellers.map((seller, index) => (
              <div key={seller._id} className="flex items-center gap-3">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">{index + 1}</span>
                <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-slate-800">{seller.seller?.name}</p><p className="text-xs text-slate-500">{seller.seller?.email}</p></div>
                <div className="text-right"><p className="text-sm font-bold">{formatPrice(seller.sales)}</p><p className="text-[11px] text-slate-500">{seller.orders} orders</p></div>
              </div>
            )) : <p className="text-sm text-slate-500">No delivered sales yet.</p>}
          </div>
          <div className="mt-4 rounded-xl bg-brand-50 p-3 text-xs text-brand-800">
            <p className="flex items-center gap-1.5 font-semibold"><FiBox className="h-3.5 w-3.5" /> Seller payable</p>
            <p className="mt-1">{formatPrice(stats.sellerPayable)} currently recorded across commissions.</p>
          </div>
          <div className="mt-2 rounded-xl bg-amber-50 p-3 text-xs text-amber-800">
            <p className="flex items-center gap-1.5 font-semibold"><FiAlertCircle className="h-3.5 w-3.5" /> Manual settlement</p>
            <p className="mt-1">Payouts are marked settled only after the admin completes the real transfer.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
