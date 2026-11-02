import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiArrowRight, FiCheckCircle, FiDollarSign, FiMapPin, FiPackage, FiTruck } from 'react-icons/fi';
import { toast } from 'react-toastify';
import StatsCard from '../../components/dashboard/StatsCard';
import Loader from '../../components/common/Loader';
import EmptyState from '../../components/common/EmptyState';
import OrderStatus from '../../components/orders/OrderStatus';
import deliveryService from '../../services/deliveryService';
import { getErrorMessage } from '../../services/api';
import { formatPrice } from '../../utils/formatPrice';
import { PAYMENT_STATUS_STYLES } from '../../utils/constants';
import { cn } from '../../utils/classNames';

const DeliveryDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    deliveryService
      .getDashboard()
      .then(({ data: response }) => setData(response))
      .catch((error) => toast.error(getErrorMessage(error)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader label="Loading delivery dashboard..." />;
  if (!data) return <EmptyState title="Dashboard unavailable" description="Unable to load your delivery overview." />;

  const { profile, stats, activeOrders = [] } = data;

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-sky-900 to-sky-700 p-6 text-white sm:p-8">
        <div className="absolute -right-8 -top-10 h-48 w-48 rounded-full bg-sky-400/20 blur-2xl" />
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-200">Delivery partner</p>
        <h1 className="mt-2 text-2xl font-bold text-white sm:text-3xl">Ready for the next run?</h1>
        <p className="mt-2 max-w-xl text-sm text-sky-100">Keep your availability current and update each delivery as soon as it changes.</p>
        <div className="relative mt-4 flex flex-wrap items-center gap-3 text-sm">
          <span className={cn('badge bg-white/15 text-white ring-0', profile?.status === 'approved' && 'bg-emerald-500/25')}>{profile?.status || 'pending'}</span>
          <span className={cn('badge bg-white/15 text-white ring-0', profile?.isAvailable && 'bg-emerald-500/25')}>{profile?.isAvailable ? 'Available' : 'Offline'}</span>
          <span>{profile?.vehicleType} {profile?.vehicleNumber || ''}</span>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatsCard icon={FiTruck} label="Active deliveries" value={stats.activeDeliveries} hint="Currently assigned to you" tone="sky" />
        <StatsCard icon={FiCheckCircle} label="Completed" value={stats.completedDeliveries} hint="Lifetime deliveries" tone="emerald" />
        <StatsCard icon={FiDollarSign} label="Total earnings" value={formatPrice(stats.totalEarnings)} hint={`${formatPrice(stats.pendingEarnings)} pending`} tone="brand" />
        <StatsCard icon={FiMapPin} label="Service area" value={profile?.serviceArea || 'Not set'} hint={`Joined ${profile?.createdAt ? new Date(profile.createdAt).getFullYear() : '—'}`} tone="amber" />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
        <div className="flex items-center justify-between">
          <div><h2 className="text-base font-semibold">Active assignments</h2><p className="text-xs text-slate-500">Pickups waiting to be completed.</p></div>
          <Link to="/delivery/orders" className="inline-flex items-center gap-1 text-xs font-semibold text-brand-700">All orders <FiArrowRight className="h-3.5 w-3.5" /></Link>
        </div>

        {activeOrders.length ? (
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {activeOrders.map((order) => (
              <Link key={`${order.orderId}-${order.subOrderId}`} to={`/delivery/orders/${order.orderId}?subOrderId=${order.subOrderId}`} className="group rounded-xl border border-slate-200 p-4 transition hover:border-brand-300 hover:shadow-soft">
                <div className="flex items-start justify-between gap-2">
                  <div><p className="font-semibold text-slate-900">{order.orderNumber}</p><p className="text-xs text-slate-500">{order.storeName || 'Seller store'}</p></div>
                  <OrderStatus status={order.status} />
                </div>
                <p className="mt-3 flex items-start gap-1.5 text-xs text-slate-500"><FiMapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {order.shippingAddress?.line1}, {order.shippingAddress?.city} {order.shippingAddress?.pincode}</p>
                <div className="mt-3 flex items-center justify-between text-xs"><span className={cn('badge', PAYMENT_STATUS_STYLES[order.paymentStatus] || 'bg-slate-100 text-slate-600')}>{order.paymentStatus}</span><span className="font-semibold text-brand-700 group-hover:underline">Open delivery <FiArrowRight className="inline h-3 w-3" /></span></div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="mt-4 rounded-xl bg-slate-50 p-8 text-center">
            <FiPackage className="mx-auto h-8 w-8 text-slate-300" />
            <p className="mt-2 text-sm font-semibold text-slate-700">No active deliveries</p>
            <p className="text-xs text-slate-500">New assignments from the admin will appear here.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DeliveryDashboard;
