import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { FiArrowLeft, FiArrowRight, FiMapPin, FiPackage, FiTruck } from 'react-icons/fi';
import { toast } from 'react-toastify';
import Loader from '../../components/common/Loader';
import EmptyState from '../../components/common/EmptyState';
import Button from '../../components/common/Button';
import { DeliveryProgress, OrderStatus, OrderTimeline } from '../../components/orders/OrderStatus';
import orderService from '../../services/orderService';
import { getErrorMessage } from '../../services/api';
import { formatDateTime } from '../../utils/formatPrice';

const TrackOrder = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');

    if (!id) {
      orderService
        .getMyOrders({ limit: 10 })
        .then(({ data }) => active && setRecentOrders(data.orders || []))
        .catch((err) => {
          if (!active) return;
          setError(getErrorMessage(err));
          toast.error(getErrorMessage(err));
        })
        .finally(() => active && setLoading(false));
      return () => {
        active = false;
      };
    }

    orderService
      .trackOrder(id)
      .then(({ data }) => active && setOrder(data))
      .catch((err) => {
        if (!active) return;
        setError(getErrorMessage(err));
        toast.error(getErrorMessage(err));
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [id]);

  if (loading) return <Loader fullPage label="Loading tracking details..." />;

  if (!id) {
    return (
      <div className="container-page py-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">Track an order</p>
          <h1 className="mt-1 text-2xl font-bold">Where is my order?</h1>
          <p className="mt-1 text-sm text-slate-500">Choose an order to see its live delivery timeline.</p>
        </div>

        {error ? (
          <div className="mt-6">
            <EmptyState icon={FiTruck} title="Tracking unavailable" description={error} />
          </div>
        ) : recentOrders.length ? (
          <div className="mt-6 space-y-3">
            {recentOrders.map((item) => (
              <Link
                key={item._id}
                to={`/track-order/${item._id}`}
                className="group flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-card transition hover:border-brand-300 hover:shadow-soft"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600"><FiPackage className="h-5 w-5" /></span>
                <div className="min-w-[160px] flex-1">
                  <p className="font-semibold text-slate-900">{item.orderNumber}</p>
                  <p className="text-xs text-slate-500">Placed {formatDateTime(item.createdAt)} · {item.items?.length || item.subOrders?.length || 0} item group(s)</p>
                </div>
                <OrderStatus status={item.status} />
                <FiArrowRight className="text-slate-300 transition group-hover:translate-x-1 group-hover:text-brand-600" />
              </Link>
            ))}
          </div>
        ) : (
          <div className="mt-6">
            <EmptyState
              icon={FiTruck}
              title="No orders to track"
              description="Once you place an order, its live tracking link will appear here."
              action={<Button to="/products">Start shopping</Button>}
            />
          </div>
        )}
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="container-page py-16">
        <EmptyState
          icon={FiTruck}
          title="Tracking unavailable"
          description={error || 'This order could not be found.'}
          action={<Button to="/orders">Back to orders</Button>}
        />
      </div>
    );
  }

  return (
    <div className="container-page py-8">
      <Link to={`/orders/${id}`} className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-brand-700">
        <FiArrowLeft /> Back to order details
      </Link>

      <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Tracking order</p>
            <h1 className="mt-1 text-2xl font-bold">{order.orderNumber}</h1>
            <p className="mt-1 text-sm text-slate-500">Placed {formatDateTime(order.createdAt)}</p>
          </div>
          <div className="text-right">
            <OrderStatus status={order.status} />
            <p className="mt-2 text-xs text-slate-500">Payment: {order.paymentStatus}</p>
          </div>
        </div>

        <div className="mt-5 rounded-xl bg-slate-50 p-4">
          <DeliveryProgress status={order.status} />
        </div>

        <div className="mt-5 flex items-start gap-2 rounded-xl border border-slate-200 p-4 text-sm text-slate-600">
          <FiMapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
          <div>
            <p className="font-semibold text-slate-800">Delivery address</p>
            <p className="mt-0.5 text-xs leading-relaxed">
              {order.shippingAddress?.fullName}, {order.shippingAddress?.line1}
              {order.shippingAddress?.line2 ? `, ${order.shippingAddress.line2}` : ''}, {order.shippingAddress?.city},{' '}
              {order.shippingAddress?.state} {order.shippingAddress?.pincode}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-5 space-y-4">
        {order.subOrders?.map((sub) => (
          <div key={sub._id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-sm font-bold text-slate-900">{sub.storeName}</p>
                <p className="text-xs text-slate-500">{sub.items?.length || 0} item(s)</p>
              </div>
              <OrderStatus status={sub.status} />
            </div>

            {sub.deliveryPartner?.name && (
              <p className="mt-3 flex items-center gap-2 rounded-lg bg-brand-50 px-3 py-2 text-xs text-brand-800">
                <FiTruck className="h-4 w-4" /> Delivery partner: <strong>{sub.deliveryPartner.name}</strong>
                {sub.deliveryPartner.phone ? ` · ${sub.deliveryPartner.phone}` : ''}
              </p>
            )}

            <div className="mt-4">
              <OrderTimeline tracking={sub.tracking || []} />
            </div>

            <div className="mt-3 divide-y divide-slate-100 border-t border-slate-100 pt-3">
              {sub.items?.map((item) => (
                <div key={item._id || item.product} className="flex items-center justify-between gap-3 py-2 text-sm">
                  <span className="min-w-0 truncate text-slate-600">{item.name} × {item.quantity}</span>
                  <span className="shrink-0 font-medium text-slate-800">₹{item.subtotal}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TrackOrder;
