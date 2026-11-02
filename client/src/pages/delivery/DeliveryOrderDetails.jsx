import { useCallback, useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { FiArrowLeft, FiCheckCircle, FiMapPin, FiPhone, FiTruck } from 'react-icons/fi';
import { toast } from 'react-toastify';
import Button from '../../components/common/Button';
import EmptyState from '../../components/common/EmptyState';
import Loader from '../../components/common/Loader';
import OrderStatus from '../../components/orders/OrderStatus';
import deliveryService from '../../services/deliveryService';
import { getErrorMessage } from '../../services/api';
import { formatDateTime, formatPrice } from '../../utils/formatPrice';
import { DELIVERY_ORDER_ACTIONS, PAYMENT_STATUS_STYLES } from '../../utils/constants';
import { cn } from '../../utils/classNames';

const DeliveryOrderDetails = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const subOrderId = searchParams.get('subOrderId');
  const [delivery, setDelivery] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');
  const [note, setNote] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await deliveryService.getOrder(id, subOrderId ? { subOrderId } : undefined);
      setDelivery(data.delivery);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [id, subOrderId]);

  useEffect(() => {
    load();
  }, [load]);

  const accept = async () => {
    setBusy('accept');
    try {
      const { data } = await deliveryService.acceptAssignment(delivery.orderId, delivery.subOrderId);
      toast.success(data.message);
      await load();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setBusy('');
    }
  };

  const update = async (status) => {
    setBusy(status);
    try {
      const { data } = await deliveryService.updateStatus(delivery.orderId, { subOrderId: delivery.subOrderId, status, note });
      toast.success(data.message);
      setNote('');
      await load();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setBusy('');
    }
  };

  if (loading) return <Loader label="Loading delivery..." />;
  if (!delivery) return <EmptyState icon={FiTruck} title="Delivery unavailable" description="This delivery may no longer be assigned to you." action={<Button to="/delivery/orders" variant="outline">Back to deliveries</Button>} />;

  const actions = DELIVERY_ORDER_ACTIONS[delivery.status] || [];
  const accepted = delivery.status !== 'Assigned' || delivery.tracking?.some((entry) => entry.note?.includes('accepted'));

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link to="/delivery/orders" className="inline-flex items-center gap-1 text-xs font-semibold text-brand-700"><FiArrowLeft className="h-3.5 w-3.5" /> Back to assigned orders</Link>
          <h1 className="mt-2 text-2xl font-bold">{delivery.orderNumber}</h1>
          <p className="text-sm text-slate-500">{delivery.storeName || 'Seller store'} · Assigned {formatDateTime(delivery.createdAt)}</p>
        </div>
        <OrderStatus status={delivery.status} />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.4fr_1fr]">
        <div className="space-y-5">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
            <h2 className="text-sm font-semibold">Customer & address</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-sm font-semibold text-slate-800">{delivery.shippingAddress?.fullName}</p>
                <p className="mt-1 text-xs text-slate-600">{delivery.shippingAddress?.line1}</p>
                {delivery.shippingAddress?.line2 && <p className="text-xs text-slate-600">{delivery.shippingAddress.line2}</p>}
                <p className="text-xs text-slate-600">{delivery.shippingAddress?.city}, {delivery.shippingAddress?.state} {delivery.shippingAddress?.pincode}</p>
                <p className="text-xs text-slate-500">{delivery.shippingAddress?.country || 'India'}</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
                <p className="flex items-center gap-1.5"><FiPhone className="h-3.5 w-3.5 text-brand-600" /> {delivery.shippingAddress?.phone || delivery.customer?.phone || 'No phone'}</p>
                <p className="mt-2 flex items-center gap-1.5"><FiMapPin className="h-3.5 w-3.5 text-brand-600" /> Delivery distance as assigned</p>
                <p className="mt-2">Payment: <span className={cn('badge', PAYMENT_STATUS_STYLES[delivery.paymentStatus] || 'bg-slate-100 text-slate-600')}>{delivery.paymentStatus}</span></p>
                <p className="mt-2 font-semibold text-brand-700">Your earning: {formatPrice(delivery.deliveryPartnerAmount)}</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
            <h2 className="text-sm font-semibold">Pickup items</h2>
            <div className="mt-3 divide-y divide-slate-100 rounded-xl bg-slate-50/70 px-3">
              {delivery.items?.map((item) => (
                <div key={item._id || item.product} className="flex items-center justify-between py-2 text-xs">
                  <div><p className="font-medium text-slate-700">{item.name}</p><p className="text-[11px] text-slate-500">Qty {item.quantity} · {formatPrice(item.price)}</p></div>
                  <span className="font-semibold">{formatPrice(item.subtotal)}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 flex justify-between rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold"><span>Items total</span><span>{formatPrice(delivery.itemsTotal)}</span></div>
            <p className="mt-2 text-[11px] text-slate-500">Delivery charge {formatPrice(delivery.deliveryCharge)} · {delivery.items?.length || 0} item line(s)</p>
          </div>
        </div>

        <div className="space-y-5">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
            <h2 className="text-sm font-semibold">Delivery action</h2>
            {!accepted && (
              <Button className="mt-3 w-full" icon={FiCheckCircle} loading={busy === 'accept'} onClick={accept}>Accept assignment</Button>
            )}

            {actions.length ? (
              <div className="mt-4 space-y-3">
                <div><label className="label" htmlFor="note">Optional note</label><textarea id="note" rows={2} value={note} onChange={(e) => setNote(e.target.value)} className="input" placeholder="e.g. Customer not answering, rescheduled..." /></div>
                {actions.map((action) => (
                  <Button key={action.status} className="w-full" variant={action.status === 'Delivered' ? 'success' : 'primary'} icon={action.status === 'Delivered' ? FiCheckCircle : FiTruck} loading={busy === action.status} onClick={() => update(action.status)}>{action.label}</Button>
                ))}
              </div>
            ) : (
              <p className="mt-3 rounded-xl bg-emerald-50 px-3 py-2 text-xs text-emerald-700">No further delivery actions are available for this order group.</p>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
            <h2 className="text-sm font-semibold">Tracking timeline</h2>
            <div className="mt-3 space-y-3">
              {[...(delivery.tracking || [])].reverse().map((entry, index) => (
                <div key={`${entry.createdAt || index}-${entry.status}`} className="flex gap-3">
                  <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-brand-500" />
                  <div><p className="text-xs font-semibold text-slate-800">{entry.status}</p>{entry.note && <p className="text-[11px] text-slate-500">{entry.note}</p>}<p className="text-[10px] text-slate-400">{formatDateTime(entry.createdAt)}</p></div>
                </div>
              ))}
              {!delivery.tracking?.length && <p className="text-xs text-slate-500">No tracking updates yet.</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeliveryOrderDetails;
