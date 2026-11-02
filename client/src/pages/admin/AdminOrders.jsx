import { useCallback, useEffect, useState } from 'react';
import { FiChevronDown, FiChevronUp, FiSearch, FiTruck } from 'react-icons/fi';
import { toast } from 'react-toastify';
import Button from '../../components/common/Button';
import EmptyState from '../../components/common/EmptyState';
import Loader from '../../components/common/Loader';
import Pagination from '../../components/common/Pagination';
import OrderStatus from '../../components/orders/OrderStatus';
import adminService from '../../services/adminService';
import { getErrorMessage } from '../../services/api';
import { formatDate, formatDateTime, formatPrice } from '../../utils/formatPrice';
import { ORDER_STATUSES, STATUS_STYLES } from '../../utils/constants';
import { cn } from '../../utils/classNames';

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('all');
  const [paymentStatus, setPaymentStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [expanded, setExpanded] = useState('');
  const [selection, setSelection] = useState({});
  const [busy, setBusy] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await adminService.getOrders({ q, status, paymentStatus, page, limit: 12 });
      setOrders(data.orders || []);
      setPagination(data.pagination || { page: 1, pages: 1, total: 0 });
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [q, status, paymentStatus, page]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    adminService.getDeliveryPartners({ status: 'approved' })
      .then(({ data }) => setPartners(data.partners || []))
      .catch(() => {});
  }, []);

  const assign = async (order, subOrder) => {
    const deliveryPartnerId = selection[subOrder._id];
    if (!deliveryPartnerId) {
      toast.info('Select an approved delivery partner first.');
      return;
    }
    setBusy(subOrder._id);
    try {
      const { data } = await adminService.assignDelivery(order._id, { subOrderId: subOrder._id, deliveryPartnerId });
      toast.success(data.message);
      await load();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setBusy('');
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Orders</h1>
        <p className="mt-1 text-sm text-slate-500">{pagination.total} order(s). Assign approved delivery partners to each seller group.</p>
      </div>

      <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-card sm:grid-cols-[1fr_auto_auto]">
        <form onSubmit={(e) => { e.preventDefault(); setPage(1); load(); }} className="relative">
          <FiSearch className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search order number..." className="input pl-10" />
        </form>
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="input sm:w-44">
          <option value="all">All statuses</option>
          {ORDER_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={paymentStatus} onChange={(e) => { setPaymentStatus(e.target.value); setPage(1); }} className="input sm:w-40">
          <option value="all">All payments</option>
          {['pending', 'paid', 'failed', 'refunded'].map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {loading ? <Loader label="Loading orders..." /> : orders.length ? (
        <>
          <div className="space-y-3">
            {orders.map((order) => {
              const isOpen = expanded === order._id;
              return (
                <div key={order._id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
                  <button type="button" onClick={() => setExpanded(isOpen ? '' : order._id)} className="flex w-full flex-wrap items-center gap-3 px-4 py-4 text-left hover:bg-slate-50/60 sm:px-5">
                    <div className="min-w-[170px] flex-1">
                      <p className="font-semibold text-slate-900">{order.orderNumber}</p>
                      <p className="text-xs text-slate-500">{order.customer?.name} · {order.customer?.email}</p>
                    </div>
                    <div className="hidden text-xs text-slate-500 sm:block">{formatDate(order.createdAt)}</div>
                    <div className="text-sm font-semibold">{formatPrice(order.pricing?.grandTotal)}</div>
                    <span className={cn('badge', order.paymentStatus === 'paid' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700')}>{order.paymentStatus}</span>
                    <OrderStatus status={order.status} />
                    {isOpen ? <FiChevronUp className="text-slate-400" /> : <FiChevronDown className="text-slate-400" />}
                  </button>

                  {isOpen && (
                    <div className="border-t border-slate-100 bg-slate-50/50 px-4 py-4 sm:px-5">
                      <div className="mb-4 grid gap-2 text-xs text-slate-600 sm:grid-cols-3">
                        <p><span className="font-semibold">Ship to:</span> {order.shippingAddress?.fullName}, {order.shippingAddress?.line1}, {order.shippingAddress?.city} {order.shippingAddress?.pincode}</p>
                        <p><span className="font-semibold">Payment:</span> {order.paymentMethod?.toUpperCase()} · {order.paymentStatus}</p>
                        <p><span className="font-semibold">Items:</span> {formatPrice(order.pricing?.itemsTotal)} · Delivery {formatPrice(order.pricing?.deliveryCharge)} · Tax {formatPrice(order.pricing?.taxAmount)}</p>
                      </div>

                      <div className="space-y-3">
                        {order.subOrders?.map((sub) => (
                          <div key={sub._id} className="rounded-xl border border-slate-200 bg-white p-3">
                            <div className="flex flex-wrap items-center gap-2">
                              <div className="min-w-[150px] flex-1">
                                <p className="text-sm font-semibold text-slate-800">{sub.seller?.name || 'Seller'}</p>
                                <p className="text-[11px] text-slate-500">{sub.items?.length || 0} item(s) · {formatPrice(sub.itemsTotal)}</p>
                              </div>
                              <span className={cn('badge', STATUS_STYLES[sub.status] || 'bg-slate-100 text-slate-600')}>{sub.status}</span>
                              <span className="text-xs text-slate-500">{sub.deliveryPartner?.name ? `Partner: ${sub.deliveryPartner.name}` : 'No delivery partner'}</span>
                            </div>

                            <div className="mt-2 divide-y divide-slate-100 rounded-lg bg-slate-50/70 px-3">
                              {sub.items?.map((item) => (
                                <div key={item._id || item.product} className="flex justify-between py-1.5 text-xs">
                                  <span className="text-slate-600">{item.name} × {item.quantity}</span>
                                  <span className="font-medium">{formatPrice(item.subtotal)}</span>
                                </div>
                              ))}
                            </div>

                            {!['Delivered', 'Cancelled', 'Refunded', 'Returned'].includes(sub.status) && (
                              <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
                                <select value={selection[sub._id] || ''} onChange={(e) => setSelection((s) => ({ ...s, [sub._id]: e.target.value }))} className="input text-xs sm:flex-1">
                                  <option value="">Select approved delivery partner</option>
                                  {partners.map((partner) => (
                                    <option key={partner._id} value={partner.user?._id}>{partner.user?.name} · {partner.vehicleType} {partner.vehicleNumber ? `(${partner.vehicleNumber})` : ''}</option>
                                  ))}
                                </select>
                                <Button size="xs" icon={FiTruck} loading={busy === sub._id} onClick={() => assign(order, sub)}>{sub.deliveryPartner ? 'Reassign' : 'Assign'}</Button>
                              </div>
                            )}

                            <p className="mt-2 text-[10px] text-slate-400">Last update: {formatDateTime(sub.updatedAt || order.updatedAt)}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <Pagination page={pagination.page} pages={pagination.pages} onPageChange={setPage} />
        </>
      ) : <EmptyState icon={FiSearch} title="No orders found" description="Try a different order number or filter." />}
    </div>
  );
};

export default AdminOrders;
