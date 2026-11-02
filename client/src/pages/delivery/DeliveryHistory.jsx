import { useEffect, useState } from 'react';
import { FiClock, FiPackage } from 'react-icons/fi';
import { toast } from 'react-toastify';
import EmptyState from '../../components/common/EmptyState';
import Loader from '../../components/common/Loader';
import OrderStatus from '../../components/orders/OrderStatus';
import deliveryService from '../../services/deliveryService';
import { getErrorMessage } from '../../services/api';
import { formatDate, formatPrice } from '../../utils/formatPrice';

const DeliveryHistory = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    deliveryService
      .getOrders({ history: true })
      .then(({ data }) => setOrders(data.orders || []))
      .catch((error) => toast.error(getErrorMessage(error)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader label="Loading delivery history..." />;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Delivery history</h1>
        <p className="mt-1 text-sm text-slate-500">{orders.length} completed or closed delivery group(s).</p>
      </div>

      {orders.length ? (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px]">
              <thead><tr className="table-head"><th className="px-4 py-3">Order</th><th className="px-4 py-3">Store</th><th className="px-4 py-3">Customer</th><th className="px-4 py-3">Earning</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Date</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((order) => (
                  <tr key={`${order.orderId}-${order.subOrderId}`} className="hover:bg-slate-50/60">
                    <td className="table-cell font-semibold text-slate-800">{order.orderNumber}</td>
                    <td className="table-cell">{order.storeName || '—'}</td>
                    <td className="table-cell"><p className="text-sm">{order.customer?.name || order.shippingAddress?.fullName}</p><p className="text-[11px] text-slate-500">{order.shippingAddress?.city}</p></td>
                    <td className="table-cell font-semibold text-emerald-600">{formatPrice(order.deliveryPartnerAmount)}</td>
                    <td className="table-cell"><OrderStatus status={order.status} /></td>
                    <td className="table-cell text-xs text-slate-500">{formatDate(order.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : <EmptyState icon={FiClock} title="No delivery history" description="Completed deliveries will be archived here." />}
    </div>
  );
};

export default DeliveryHistory;
