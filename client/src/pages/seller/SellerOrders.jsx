import { useCallback, useEffect, useState } from 'react';
import { FiChevronDown, FiMapPin, FiPackage } from 'react-icons/fi';
import { toast } from 'react-toastify';
import Button from '../../components/common/Button';
import EmptyState from '../../components/common/EmptyState';
import Loader from '../../components/common/Loader';
import OrderStatus from '../../components/orders/OrderStatus';
import sellerService from '../../services/sellerService';
import orderService from '../../services/orderService';
import { getErrorMessage } from '../../services/api';
import { formatDateTime, formatPrice, resolveImage } from '../../utils/formatPrice';
import { SELLER_ORDER_ACTIONS, STATUS_STYLES } from '../../utils/constants';
import { cn } from '../../utils/classNames';

const statusFilters = ['all', 'Pending', 'Confirmed', 'Processing', 'Ready for Pickup', 'Assigned', 'Out for Delivery', 'Delivered', 'Cancelled'];

const SellerOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('all');
  const [expanded, setExpanded] = useState({});
  const [updatingId, setUpdatingId] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await sellerService.getOrders(status && status !== 'all' ? { status } : {});
      setOrders(data.orders || []);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    load();
  }, [load]);

  const changeStatus = async (order, sub, nextStatus) => {
    setUpdatingId(sub._id);
    try {
      const { data } = await orderService.updateStatus(order._id, { subOrderId: sub._id, status: nextStatus });
      toast.success(data.message);
      await load();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setUpdatingId('');
    }
  };

  const toggle = (id) => setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Seller orders</h1>
        <p className="mt-1 text-sm text-slate-500">Accept orders, update fulfilment status and prepare shipments.</p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {statusFilters.map((item) => (
          <button key={item} type="button" onClick={() => setStatus(item)} className={cn('whitespace-nowrap rounded-full px-3.5 py-2 text-xs font-semibold transition', status === item ? 'bg-brand-600 text-white' : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50')}>
            {item === 'all' ? 'All orders' : item}
          </button>
        ))}
      </div>

      {loading ? <Loader label="Loading orders..." /> : orders.length ? (
        <div className="space-y-4">
          {orders.map((order) => {
            const total = order.subOrders.reduce((s, sub) => s + sub.itemsTotal, 0);
            const isOpen = expanded[order._id];
            return (
              <div key={order._id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
                <button type="button" onClick={() => toggle(order._id)} className="flex w-full flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/60 px-5 py-3.5 text-left">
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-1">
                    <div><p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Order</p><p className="text-sm font-bold text-slate-800">{order.orderNumber}</p></div>
                    <div><p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Customer</p><p className="text-sm text-slate-600">{order.customer?.name || 'Customer'}</p></div>
                    <div><p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Value</p><p className="text-sm font-semibold">{formatPrice(total)}</p></div>
                    <div><p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Placed</p><p className="text-xs text-slate-500">{formatDateTime(order.createdAt)}</p></div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex flex-wrap gap-1">{order.subOrders.map((sub) => <OrderStatus key={sub._id} status={sub.status} />)}</div>
                    <FiChevronDown className={cn('h-4 w-4 text-slate-400 transition', isOpen && 'rotate-180')} />
                  </div>
                </button>

                {isOpen && (
                  <div className="p-5">
                    <div className="mb-4 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
                        <p className="flex items-center gap-1.5 font-semibold text-slate-800"><FiMapPin className="h-3.5 w-3.5" /> Ship to</p>
                        <p className="mt-1 leading-relaxed">{order.shippingAddress?.fullName}, {order.shippingAddress?.line1}, {order.shippingAddress?.city}, {order.shippingAddress?.state} {order.shippingAddress?.pincode}</p>
                        <p className="mt-1">Phone: {order.shippingAddress?.phone}</p>
                      </div>
                      <div className="rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
                        <p className="font-semibold text-slate-800">Payment</p>
                        <p className="mt-1 capitalize">Status: {order.paymentStatus}</p>
                        <p className="mt-1">Customer contact: {order.customer?.email || '—'}</p>
                      </div>
                    </div>

                    {order.subOrders.map((sub) => (
                      <div key={sub._id} className="rounded-xl border border-slate-200 p-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <p className="text-sm font-semibold text-slate-800">{sub.storeName}</p>
                            <p className="text-xs text-slate-500">{sub.items.length} item(s) · {formatPrice(sub.itemsTotal)}</p>
                          </div>
                          <OrderStatus status={sub.status} />
                        </div>
                        <div className="mt-3 divide-y divide-slate-100">
                          {sub.items.map((item) => (
                            <div key={item._id || item.product} className="flex items-center gap-3 py-2.5">
                              <img src={resolveImage(item.image)} alt={item.name} className="h-10 w-10 rounded-lg border border-slate-200 object-cover" onError={(e) => { e.currentTarget.src = '/images/product-placeholder.svg'; }} />
                              <div className="min-w-0 flex-1"><p className="truncate text-sm text-slate-700">{item.name}</p><p className="text-xs text-slate-400">{formatPrice(item.price)} × {item.quantity}</p></div>
                              <p className="text-sm font-semibold">{formatPrice(item.subtotal)}</p>
                            </div>
                          ))}
                        </div>
                        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
                          <p className="text-xs text-slate-500">Commission {sub.commissionRate}% · You earn {formatPrice(sub.sellerAmount)}</p>
                          <div className="flex flex-wrap gap-2">
                            {(SELLER_ORDER_ACTIONS[sub.status] || []).map((action) => (
                              <Button
                                key={action.status}
                                size="xs"
                                variant={action.tone === 'danger' ? 'danger' : 'primary'}
                                loading={updatingId === sub._id}
                                onClick={() => changeStatus(order, sub, action.status)}
                              >
                                {action.label}
                              </Button>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState icon={FiPackage} title="No orders found" description={status === 'all' ? 'Orders containing your products will appear here.' : `No orders with status "${status}".`} />
      )}
    </div>
  );
};

export default SellerOrders;
