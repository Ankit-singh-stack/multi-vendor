import { Link } from 'react-router-dom';
import { FiArrowUpRight, FiMapPin, FiPackage } from 'react-icons/fi';
import OrderStatus from './OrderStatus';
import { formatDate, formatPrice, resolveImage } from '../../utils/formatPrice';

const OrderCard = ({ order }) => {
  const items = order.subOrders?.flatMap((s) => s.items) || [];
  const totalQty = items.reduce((sum, i) => sum + i.quantity, 0);
  const first = items[0];

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card transition hover:border-brand-200">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/60 px-5 py-3">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-1">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Order</p>
            <p className="text-sm font-bold text-slate-800">{order.orderNumber}</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Placed</p>
            <p className="text-sm text-slate-600">{formatDate(order.createdAt)}</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Total</p>
            <p className="text-sm font-semibold text-slate-800">{formatPrice(order.pricing?.grandTotal)}</p>
          </div>
        </div>
        <OrderStatus status={order.status} />
      </div>

      <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
        <div className="flex min-w-0 flex-1 items-center gap-4">
          <div className="relative shrink-0">
            <img
              src={resolveImage(first?.image)}
              alt={first?.name || 'Order item'}
              className="h-16 w-16 rounded-xl border border-slate-200 object-cover"
              onError={(e) => {
                e.currentTarget.src = '/images/product-placeholder.svg';
              }}
            />
            {items.length > 1 && (
              <span className="absolute -right-1.5 -top-1.5 rounded-full bg-brand-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                +{items.length - 1}
              </span>
            )}
          </div>
          <div className="min-w-0">
            <p className="line-clamp-1 text-sm font-semibold text-slate-900">{first?.name || 'Order items'}</p>
            <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
              <FiPackage className="h-3.5 w-3.5" /> {totalQty} item{totalQty === 1 ? '' : 's'} ·{' '}
              {order.subOrders?.length || 1} shipment{order.subOrders?.length === 1 ? '' : 's'}
            </p>
            {order.shippingAddress && (
              <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                <FiMapPin className="h-3.5 w-3.5" /> {order.shippingAddress.city}, {order.shippingAddress.state}
              </p>
            )}
          </div>
        </div>
        <div className="flex shrink-0 gap-2">
          <Link
            to={`/orders/${order._id}`}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Details <FiArrowUpRight />
          </Link>
          <Link
            to={`/track-order/${order._id}`}
            className="inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-brand-700"
          >
            Track order
          </Link>
        </div>
      </div>
    </div>
  );
};

export default OrderCard;
