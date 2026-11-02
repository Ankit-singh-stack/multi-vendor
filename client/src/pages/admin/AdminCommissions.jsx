import { useCallback, useEffect, useState } from 'react';
import { FiCheckCircle, FiDollarSign, FiPercent, FiTruck } from 'react-icons/fi';
import { toast } from 'react-toastify';
import Button from '../../components/common/Button';
import EmptyState from '../../components/common/EmptyState';
import Loader from '../../components/common/Loader';
import StatsCard from '../../components/dashboard/StatsCard';
import adminService from '../../services/adminService';
import { getErrorMessage } from '../../services/api';
import { formatDate, formatPrice } from '../../utils/formatPrice';
import { PAYMENT_STATUS_STYLES } from '../../utils/constants';
import { cn } from '../../utils/classNames';

const AdminCommissions = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sellerPayoutStatus, setSellerPayoutStatus] = useState('all');
  const [deliveryPayoutStatus, setDeliveryPayoutStatus] = useState('all');
  const [busy, setBusy] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data: response } = await adminService.getCommissions({ sellerPayoutStatus, deliveryPayoutStatus });
      setData(response);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [sellerPayoutStatus, deliveryPayoutStatus]);

  useEffect(() => {
    load();
  }, [load]);

  const settle = async (commission, type) => {
    setBusy(`${commission._id}-${type}`);
    try {
      const { data: response } = await adminService.settleCommission(commission._id, type);
      toast.success(response.message);
      await load();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setBusy('');
    }
  };

  const totals = data?.totals || {};
  const commissions = data?.commissions || [];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Commissions & payouts</h1>
        <p className="mt-1 text-sm text-slate-500">The platform records each commission. Mark records settled only after completing the manual transfer.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatsCard icon={FiPercent} label="Commission earned" value={formatPrice(totals.commission)} tone="brand" />
        <StatsCard icon={FiDollarSign} label="Seller pending" value={formatPrice(totals.sellerPending)} hint={`${formatPrice(totals.sellerPayable)} total payable`} tone="amber" />
        <StatsCard icon={FiTruck} label="Delivery pending" value={formatPrice(totals.deliveryPending)} hint={`${formatPrice(totals.deliveryPayable)} total payable`} tone="sky" />
        <StatsCard icon={FiCheckCircle} label="Records" value={commissions.length} hint="Filtered commission rows" tone="emerald" />
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-card sm:flex-row">
        <label className="flex flex-1 items-center gap-2 text-xs font-medium text-slate-600">Seller payout
          <select value={sellerPayoutStatus} onChange={(e) => setSellerPayoutStatus(e.target.value)} className="input flex-1">
            {['all', 'pending', 'settled'].map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>
        <label className="flex flex-1 items-center gap-2 text-xs font-medium text-slate-600">Delivery payout
          <select value={deliveryPayoutStatus} onChange={(e) => setDeliveryPayoutStatus(e.target.value)} className="input flex-1">
            {['all', 'pending', 'settled'].map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>
      </div>

      {loading ? <Loader label="Loading commissions..." /> : commissions.length ? (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px]">
              <thead><tr className="table-head"><th className="px-4 py-3">Order</th><th className="px-4 py-3">Seller</th><th className="px-4 py-3">Item value</th><th className="px-4 py-3">Commission</th><th className="px-4 py-3">Seller earning</th><th className="px-4 py-3">Seller payout</th><th className="px-4 py-3">Delivery</th><th className="px-4 py-3">Delivery payout</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {commissions.map((item) => (
                  <tr key={item._id} className="hover:bg-slate-50/60">
                    <td className="table-cell"><p className="font-semibold">{item.order?.orderNumber || '—'}</p><p className="text-[11px] text-slate-500">{formatDate(item.createdAt)}</p></td>
                    <td className="table-cell"><p className="text-xs">{item.seller?.name || 'Seller'}</p><p className="text-[11px] text-slate-500">{item.seller?.email}</p></td>
                    <td className="table-cell">{formatPrice(item.itemsTotal)}</td>
                    <td className="table-cell"><p className="font-semibold text-brand-700">{formatPrice(item.commissionAmount)}</p><p className="text-[11px] text-slate-500">@ {item.commissionRate}%</p></td>
                    <td className="table-cell font-semibold text-emerald-600">{formatPrice(item.sellerAmount)}</td>
                    <td className="table-cell">
                      <div className="flex flex-col items-start gap-1">
                        <span className={cn('badge', PAYMENT_STATUS_STYLES[item.sellerPayoutStatus])}>{item.sellerPayoutStatus}</span>
                        {item.sellerPayoutStatus === 'pending' && <Button size="xs" variant="outline" loading={busy === `${item._id}-seller`} onClick={() => settle(item, 'seller')}>Settle</Button>}
                      </div>
                    </td>
                    <td className="table-cell"><p className="text-xs">{item.deliveryPartner?.name || 'Unassigned'}</p><p className="text-[11px] text-slate-500">{formatPrice(item.deliveryPartnerAmount)}</p></td>
                    <td className="table-cell">
                      {item.deliveryPartner ? (
                        <div className="flex flex-col items-start gap-1">
                          <span className={cn('badge', PAYMENT_STATUS_STYLES[item.deliveryPayoutStatus])}>{item.deliveryPayoutStatus}</span>
                          {item.deliveryPayoutStatus === 'pending' && <Button size="xs" variant="outline" loading={busy === `${item._id}-delivery`} onClick={() => settle(item, 'delivery')}>Settle</Button>}
                        </div>
                      ) : <span className="text-xs text-slate-400">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : <EmptyState icon={FiPercent} title="No commission records" description="Commission rows are created as orders are processed." />}
    </div>
  );
};

export default AdminCommissions;
