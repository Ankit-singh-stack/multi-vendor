import { useEffect, useState } from 'react';
import { FiCheckCircle, FiClock, FiDollarSign, FiTrendingUp } from 'react-icons/fi';
import { toast } from 'react-toastify';
import StatsCard from '../../components/dashboard/StatsCard';
import EmptyState from '../../components/common/EmptyState';
import Loader from '../../components/common/Loader';
import deliveryService from '../../services/deliveryService';
import { getErrorMessage } from '../../services/api';
import { formatDate, formatPrice } from '../../utils/formatPrice';
import { PAYMENT_STATUS_STYLES } from '../../utils/constants';
import { cn } from '../../utils/classNames';

const DeliveryEarnings = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    deliveryService
      .getEarnings()
      .then(({ data: response }) => setData(response))
      .catch((error) => toast.error(getErrorMessage(error)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader label="Loading earnings..." />;
  if (!data) return <EmptyState title="Earnings unavailable" />;

  const { stats = {}, commissions = [] } = data;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Earnings</h1>
        <p className="mt-1 text-sm text-slate-500">Delivery earnings are recorded per order group and settled manually by the admin.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatsCard icon={FiTrendingUp} label="Total earnings" value={formatPrice(stats.total)} tone="brand" />
        <StatsCard icon={FiClock} label="Pending" value={formatPrice(stats.pending)} hint="Awaiting admin settlement" tone="amber" />
        <StatsCard icon={FiCheckCircle} label="Settled" value={formatPrice(stats.settled)} hint="Already transferred" tone="emerald" />
        <StatsCard icon={FiDollarSign} label="Deliveries" value={stats.totalDeliveries} hint={`${stats.completedFromCommissions} earning record(s)`} tone="sky" />
      </div>

      {commissions.length ? (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px]">
              <thead><tr className="table-head"><th className="px-4 py-3">Order</th><th className="px-4 py-3">Date</th><th className="px-4 py-3">Delivery charge</th><th className="px-4 py-3">Your earning</th><th className="px-4 py-3">Payout</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {commissions.map((commission) => (
                  <tr key={commission._id} className="hover:bg-slate-50/60">
                    <td className="table-cell font-semibold text-slate-800">{commission.order?.orderNumber || '—'}</td>
                    <td className="table-cell text-xs text-slate-500">{formatDate(commission.createdAt)}</td>
                    <td className="table-cell">{formatPrice(commission.deliveryCharge)}</td>
                    <td className="table-cell font-semibold text-emerald-600">{formatPrice(commission.deliveryPartnerAmount)}</td>
                    <td className="table-cell"><span className={cn('badge', PAYMENT_STATUS_STYLES[commission.deliveryPayoutStatus])}>{commission.deliveryPayoutStatus}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : <EmptyState icon={FiDollarSign} title="No earnings yet" description="Complete deliveries to start earning." />}
    </div>
  );
};

export default DeliveryEarnings;
