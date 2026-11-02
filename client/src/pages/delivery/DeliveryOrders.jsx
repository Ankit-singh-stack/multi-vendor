import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiArrowRight, FiMapPin, FiPackage } from 'react-icons/fi';
import { toast } from 'react-toastify';
import EmptyState from '../../components/common/EmptyState';
import Loader from '../../components/common/Loader';
import OrderStatus from '../../components/orders/OrderStatus';
import deliveryService from '../../services/deliveryService';
import { getErrorMessage } from '../../services/api';
import { formatDate, formatPrice } from '../../utils/formatPrice';
import { PAYMENT_STATUS_STYLES } from '../../utils/constants';
import { cn } from '../../utils/classNames';

const DeliveryOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    deliveryService
      .getOrders()
      .then(({ data }) => setOrders(data.orders || []))
      .catch((error) => toast.error(getErrorMessage(error)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader label="Loading assigned orders..." />;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Assigned orders</h1>
        <p className="mt-1 text-sm text-slate-500">{orders.length} active assignment(s). Update status as you move through each delivery.</p>
      </div>

      {orders.length ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {orders.map((order) => (
            <div key={`${order.orderId}-${order.subOrderId}`} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-900">{order.orderNumber}</p>
                  <p className="text-xs text-slate-500">{order.storeName || 'Seller store'} · Assigned {formatDate(order.createdAt)}</p>
                </div>
                <OrderStatus status={order.status} />
              </div>

              <div className="mt-3 rounded-xl bg-slate-50 p-3">
                <p className="flex items-start gap-1.5 text-xs text-slate-600"><FiMapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-600" /> {order.shippingAddress?.fullName}<br />{order.shippingAddress?.line1}, {order.shippingAddress?.line2 ? `${order.shippingAddress.line2}, ` : ''}{order.shippingAddress?.city}, {order.shippingAddress?.state} {order.shippingAddress?.pincode}</p>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                <span className={cn('badge', PAYMENT_STATUS_STYLES[order.paymentStatus] || 'bg-slate-100 text-slate-600')}>{order.paymentStatus}</span>
                <span className="badge bg-slate-100 text-slate-600">{order.items?.length || 0} item(s)</span>
                <span className="badge bg-brand-50 text-brand-700">Earn {formatPrice(order.deliveryPartnerAmount)}</span>
                <span className="ml-auto font-semibold">{formatPrice(order.itemsTotal)}</span>
              </div>

              <Link to={`/delivery/orders/${order.orderId}?subOrderId=${order.subOrderId}`} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700">Manage delivery <FiArrowRight className="h-4 w-4" /></Link>
            </div>
          ))}
        </div>
      ) : <EmptyState icon={FiPackage} title="No active deliveries" description="Assignments from the admin will appear here." />}
    </div>
  );
};

export default DeliveryOrders;
