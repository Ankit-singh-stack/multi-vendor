import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  FiArrowLeft,
  FiCreditCard,
  FiMapPin,
  FiPackage,
  FiRefreshCw,
  FiTruck,
  FiXCircle,
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import Loader from '../../components/common/Loader';
import EmptyState from '../../components/common/EmptyState';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import { OrderStatus, OrderTimeline } from '../../components/orders/OrderStatus';
import orderService from '../../services/orderService';
import { getErrorMessage } from '../../services/api';
import { formatDateTime, formatPrice, resolveImage } from '../../utils/formatPrice';
import { PAYMENT_STATUS_STYLES } from '../../utils/constants';
import { cn } from '../../utils/classNames';

const OrderDetails = () => {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [refundOpen, setRefundOpen] = useState(false);
  const [refundSubOrder, setRefundSubOrder] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await orderService.getOrder(id);
      setData(response.data);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <Loader fullPage label="Loading order..." />;
  if (!data?.order) {
    return (
      <div className="container-page py-16">
        <EmptyState icon={FiPackage} title="Order not found" description="This order is unavailable." action={<Button to="/orders">Back to orders</Button>} />
      </div>
    );
  }

  const { order, payment, refunds = [] } = data;
  const canCancel = order.subOrders.every((s) => ['Pending', 'Confirmed'].includes(s.status));
  const deliveredSubs = order.subOrders.filter((s) => ['Delivered', 'Returned'].includes(s.status));
  const openRefund = refunds.some((r) => ['pending', 'approved'].includes(r.status));

  const handleCancel = async () => {
    if (!reason.trim()) return toast.error('Please provide a cancellation reason.');
    setSubmitting(true);
    try {
      await orderService.cancelOrder(order._id, reason.trim());
      toast.success('Order cancelled. Stock has been released.');
      setCancelOpen(false);
      setReason('');
      await load();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  const handleRefund = async () => {
    if (!reason.trim()) return toast.error('Please describe the issue.');
    setSubmitting(true);
    try {
      await orderService.requestRefund(order._id, { reason: reason.trim(), subOrderId: refundSubOrder || undefined });
      toast.success('Refund request submitted for admin review.');
      setRefundOpen(false);
      setReason('');
      await load();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link to="/orders" className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-brand-700">
            <FiArrowLeft /> Back to orders
          </Link>
          <h1 className="mt-2 text-2xl font-bold">{order.orderNumber}</h1>
          <p className="mt-1 text-sm text-slate-500">Placed on {formatDateTime(order.createdAt)}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <OrderStatus status={order.status} />
          <span className={cn('badge', PAYMENT_STATUS_STYLES[order.paymentStatus])}>Payment: {order.paymentStatus}</span>
          <Button to={`/track-order/${order._id}`} size="sm" variant="outline" icon={FiTruck}>Track</Button>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.6fr_1fr]">
        <div className="space-y-5">
          {order.subOrders.map((sub) => (
            <div key={sub._id} className="rounded-2xl border border-slate-200 bg-white shadow-card">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-5 py-3.5">
                <div>
                  <p className="text-sm font-bold text-slate-900">{sub.storeName}</p>
                  <p className="text-xs text-slate-500">Seller: {sub.seller?.name || 'MarketSphere seller'}</p>
                </div>
                <OrderStatus status={sub.status} />
              </div>

              <div className="divide-y divide-slate-100 px-5">
                {sub.items.map((item) => (
                  <div key={item._id || item.product} className="flex gap-3 py-4">
                    <img
                      src={resolveImage(item.image)}
                      alt={item.name}
                      className="h-16 w-16 rounded-xl border border-slate-200 object-cover"
                      onError={(e) => {
                        e.currentTarget.src = '/images/product-placeholder.svg';
                      }}
                    />
                    <div className="min-w-0 flex-1">
                      <Link to={`/products/${item.product}`} className="line-clamp-2 text-sm font-semibold text-slate-800 hover:text-brand-700">
                        {item.name}
                      </Link>
                      <p className="mt-1 text-xs text-slate-500">{formatPrice(item.price)} × {item.quantity}</p>
                    </div>
                    <p className="text-sm font-bold text-slate-900">{formatPrice(item.subtotal)}</p>
                  </div>
                ))}
              </div>

              <div className="border-t border-slate-100 px-5 py-3">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Shipment tracking</p>
                <OrderTimeline tracking={sub.tracking || []} />
                {sub.deliveryPartner?.name && (
                  <p className="mt-2 text-xs text-slate-500">
                    Delivery partner: <strong className="text-slate-700">{sub.deliveryPartner.name}</strong>
                    {sub.deliveryPartner.phone ? ` · ${sub.deliveryPartner.phone}` : ''}
                  </p>
                )}
              </div>
            </div>
          ))}

          {refunds.length > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
              <h2 className="flex items-center gap-2 text-base font-semibold"><FiRefreshCw className="h-4 w-4 text-brand-600" /> Refund requests</h2>
              <div className="mt-3 space-y-2">
                {refunds.map((refund) => (
                  <div key={refund._id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-slate-50 px-3 py-2.5 text-sm">
                    <div>
                      <p className="font-semibold text-slate-800">{formatPrice(refund.amount)}</p>
                      <p className="text-xs text-slate-500">{refund.reason}</p>
                    </div>
                    <span className={cn('badge', PAYMENT_STATUS_STYLES[refund.status])}>{refund.status}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
            <h2 className="text-base font-semibold">Payment summary</h2>
            <div className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between text-slate-600"><span>Items total</span><span>{formatPrice(order.pricing.itemsTotal)}</span></div>
              <div className="flex justify-between text-slate-600"><span>Delivery</span><span>{order.pricing.deliveryTotal ? formatPrice(order.pricing.deliveryTotal) : 'Free'}</span></div>
              <div className="flex justify-between text-slate-600"><span>Tax</span><span>{formatPrice(order.pricing.tax)}</span></div>
              {order.pricing.discount > 0 && (
                <div className="flex justify-between text-emerald-600"><span>Discount {order.pricing.couponCode ? `(${order.pricing.couponCode})` : ''}</span><span>-{formatPrice(order.pricing.discount)}</span></div>
              )}
              <div className="flex justify-between border-t border-dashed border-slate-200 pt-2 text-base font-bold text-slate-900">
                <span>Grand total</span><span>{formatPrice(order.pricing.grandTotal)}</span>
              </div>
            </div>
            <div className="mt-4 rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
              <p className="flex items-center gap-1.5"><FiCreditCard className="h-3.5 w-3.5" /> Method: <strong className="uppercase">{order.paymentMethod}</strong></p>
              <p className="mt-1.5">Status: <strong className="capitalize">{order.paymentStatus}</strong></p>
              {payment?.providerPaymentId && <p className="mt-1.5 break-all">Transaction: {payment.providerPaymentId}</p>}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
            <h2 className="flex items-center gap-2 text-base font-semibold"><FiMapPin className="h-4 w-4 text-brand-600" /> Delivery address</h2>
            <div className="mt-3 text-sm text-slate-600">
              <p className="font-semibold text-slate-800">{order.shippingAddress?.fullName}</p>
              <p className="mt-1 text-xs leading-relaxed">
                {order.shippingAddress?.line1}
                {order.shippingAddress?.line2 ? `, ${order.shippingAddress.line2}` : ''}<br />
                {order.shippingAddress?.city}, {order.shippingAddress?.state} {order.shippingAddress?.pincode}<br />
                {order.shippingAddress?.phone}
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
            <h2 className="text-base font-semibold">Need help?</h2>
            <div className="mt-3 space-y-2">
              {canCancel && (
                <Button variant="danger" size="sm" className="w-full" icon={FiXCircle} onClick={() => setCancelOpen(true)}>
                  Cancel order
                </Button>
              )}
              {deliveredSubs.length > 0 && !openRefund && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  icon={FiRefreshCw}
                  onClick={() => {
                    setRefundSubOrder(deliveredSubs.length === 1 ? deliveredSubs[0]._id : '');
                    setRefundOpen(true);
                  }}
                >
                  Request refund
                </Button>
              )}
              {openRefund && <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">A refund request is already open for this order.</p>}
              {!canCancel && !deliveredSubs.length && (
                <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
                  Cancellation is closed once the seller starts processing. Contact support if you need help.
                </p>
              )}
              <Button to="/contact" size="sm" variant="ghost" className="w-full">Contact support</Button>
            </div>
          </div>
        </div>
      </div>

      <Modal
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        title="Cancel this order?"
        description="Stock will be released and any paid amount will be submitted for refund."
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setCancelOpen(false)}>Keep order</Button>
            <Button variant="danger" size="sm" loading={submitting} onClick={handleCancel}>Cancel order</Button>
          </>
        }
      >
        <label className="label" htmlFor="cancel-reason">Reason</label>
        <textarea id="cancel-reason" rows={4} value={reason} onChange={(e) => setReason(e.target.value)} className="input" placeholder="Tell us why you are cancelling..." />
      </Modal>

      <Modal
        open={refundOpen}
        onClose={() => setRefundOpen(false)}
        title="Request a refund"
        description="Refunds are reviewed by the marketplace administrator."
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setRefundOpen(false)}>Close</Button>
            <Button size="sm" loading={submitting} onClick={handleRefund}>Submit request</Button>
          </>
        }
      >
        {deliveredSubs.length > 1 && (
          <div className="mb-4">
            <label className="label" htmlFor="refund-suborder">Shipment</label>
            <select id="refund-suborder" value={refundSubOrder} onChange={(e) => setRefundSubOrder(e.target.value)} className="input">
              <option value="">Entire order</option>
              {deliveredSubs.map((sub) => (
                <option key={sub._id} value={sub._id}>{sub.storeName} · {formatPrice(sub.itemsTotal + sub.deliveryCharge)}</option>
              ))}
            </select>
          </div>
        )}
        <label className="label" htmlFor="refund-reason">What went wrong?</label>
        <textarea id="refund-reason" rows={4} value={reason} onChange={(e) => setReason(e.target.value)} className="input" placeholder="Describe the issue with the delivered item..." />
      </Modal>
    </div>
  );
};

export default OrderDetails;
