import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FiArrowRight,
  FiCheckCircle,
  FiClock,
  FiDollarSign,
  FiHeart,
  FiMapPin,
  FiPackage,
  FiShoppingCart,
  FiTruck,
  FiUser,
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import StatsCard from '../../components/dashboard/StatsCard';
import OrderStatus from '../../components/orders/OrderStatus';
import Loader from '../../components/common/Loader';
import EmptyState from '../../components/common/EmptyState';
import useAuth from '../../hooks/useAuth';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import orderService from '../../services/orderService';
import userService from '../../services/userService';
import { getErrorMessage } from '../../services/api';
import { formatDate, formatPrice, resolveImage } from '../../utils/formatPrice';

const CustomerDashboard = () => {
  const { user } = useAuth();
  const { itemCount } = useCart();
  const { count: wishlistCount } = useWishlist();
  const [orders, setOrders] = useState([]);
  const [refunds, setRefunds] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    Promise.all([
      orderService.getMyOrders({ limit: 5 }),
      orderService.getMyRefunds(),
      userService.getAddresses(),
    ])
      .then(([ordersRes, refundsRes, addressRes]) => {
        if (!active) return;
        setOrders(ordersRes.data.orders || []);
        setRefunds(refundsRes.data.refunds || []);
        setAddresses(addressRes.data.addresses || []);
      })
      .catch((error) => toast.error(getErrorMessage(error)))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  if (loading) return <Loader label="Loading your dashboard..." />;

  const paid = orders.filter((o) => o.paymentStatus === 'paid');
  const activeOrders = orders.filter((o) => !['Delivered', 'Cancelled', 'Returned', 'Refunded'].includes(o.status));
  const totalSpent = paid.reduce((sum, o) => sum + (o.pricing?.grandTotal || 0), 0);
  const pendingRefunds = refunds.filter((r) => ['pending', 'approved'].includes(r.status)).length;
  const defaultAddress = addresses.find((a) => a.isDefault) || addresses[0];

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-brand-800 to-brand-600 p-6 text-white sm:p-8">
        <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10" />
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-200">Customer workspace</p>
        <h2 className="mt-2 text-2xl font-bold text-white sm:text-3xl">Welcome back, {user?.name?.split(' ')[0]}</h2>
        <p className="mt-2 max-w-xl text-sm text-brand-100">
          Track your shipments, manage returns and keep your delivery details up to date.
        </p>
        <div className="relative mt-5 flex flex-wrap gap-2">
          <Link to="/products" className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-brand-700 hover:bg-brand-50">
            Continue shopping
          </Link>
          <Link to="/orders" className="rounded-xl border border-white/30 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10">
            View all orders
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatsCard icon={FiPackage} label="Total orders" value={orders.length} hint={`${activeOrders.length} active`} tone="brand" />
        <StatsCard icon={FiDollarSign} label="Total spent" value={formatPrice(totalSpent)} hint="Paid orders" tone="emerald" />
        <StatsCard icon={FiShoppingCart} label="Cart items" value={itemCount} hint="Ready for checkout" tone="amber" />
        <StatsCard icon={FiHeart} label="Wishlist" value={wishlistCount} hint="Saved products" tone="rose" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">Recent orders</h2>
            <Link to="/orders" className="inline-flex items-center gap-1 text-xs font-semibold text-brand-700">
              View all <FiArrowRight />
            </Link>
          </div>
          <div className="mt-4 space-y-3">
            {orders.length ? (
              orders.map((order) => {
                const items = order.subOrders?.flatMap((s) => s.items) || [];
                const first = items[0];
                return (
                  <Link
                    key={order._id}
                    to={`/orders/${order._id}`}
                    className="flex items-center gap-3 rounded-xl border border-slate-100 p-3 transition hover:border-brand-200 hover:bg-brand-50/40"
                  >
                    <img
                      src={resolveImage(first?.image)}
                      alt={first?.name || order.orderNumber}
                      className="h-12 w-12 rounded-lg border border-slate-200 object-cover"
                      onError={(e) => {
                        e.currentTarget.src = '/images/product-placeholder.svg';
                      }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-800">{first?.name || 'Order items'}</p>
                      <p className="text-xs text-slate-500">{order.orderNumber} · {formatDate(order.createdAt)}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-sm font-bold">{formatPrice(order.pricing?.grandTotal)}</p>
                      <OrderStatus status={order.status} className="mt-1" />
                    </div>
                  </Link>
                );
              })
            ) : (
              <EmptyState icon={FiPackage} title="No orders yet" description="Your first order will appear here." />
            )}
          </div>
        </section>

        <div className="space-y-4">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold">Default address</h2>
              <Link to="/addresses" className="text-xs font-semibold text-brand-700">Manage</Link>
            </div>
            {defaultAddress ? (
              <div className="mt-3 flex gap-3 text-sm text-slate-600">
                <FiMapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
                <div>
                  <p className="font-semibold text-slate-800">{defaultAddress.fullName}</p>
                  <p className="mt-1 text-xs leading-relaxed">
                    {defaultAddress.line1}
                    {defaultAddress.line2 ? `, ${defaultAddress.line2}` : ''}, {defaultAddress.city}, {defaultAddress.state} {defaultAddress.pincode}
                  </p>
                  <p className="mt-1 text-xs">{defaultAddress.phone}</p>
                </div>
              </div>
            ) : (
              <p className="mt-3 text-sm text-slate-500">No address saved yet.</p>
            )}
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
            <h2 className="text-base font-semibold">Quick links</h2>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {[
                { to: '/orders', label: 'My orders', icon: FiPackage },
                { to: '/track-order', label: 'Track order', icon: FiTruck },
                { to: '/addresses', label: 'Addresses', icon: FiMapPin },
                { to: '/profile', label: 'Profile', icon: FiUser },
              ].map((item) => (
                <Link key={item.label} to={item.to} className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-semibold text-slate-700 hover:border-brand-300 hover:bg-brand-50">
                  <item.icon className="h-4 w-4 text-brand-600" /> {item.label}
                </Link>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <FiClock className="h-4 w-4 text-amber-500" /> Refund requests
            </div>
            <p className="mt-2 text-xs text-slate-500">
              {pendingRefunds ? `${pendingRefunds} request(s) awaiting review.` : 'No open refund requests.'}
            </p>
            {refunds.length > 0 && (
              <Link to="/orders" className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-brand-700">
                View refunded orders <FiArrowRight />
              </Link>
            )}
          </section>
        </div>
      </div>

      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
        <p className="flex items-center gap-2 font-semibold"><FiCheckCircle className="h-4 w-4" /> Buyer protection</p>
        <p className="mt-1 text-xs">Payments are verified on the server. Report a problem within 7 days of delivery to request a refund.</p>
      </div>
    </div>
  );
};

export default CustomerDashboard;
