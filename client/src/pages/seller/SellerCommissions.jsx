import { useEffect, useState } from 'react';
import { FiDollarSign, FiPercent, FiTrendingUp } from 'react-icons/fi';
import { toast } from 'react-toastify';
import StatsCard from '../../components/dashboard/StatsCard';
import Loader from '../../components/common/Loader';
import EmptyState from '../../components/common/EmptyState';
import sellerService from '../../services/sellerService';
import { getErrorMessage } from '../../services/api';
import { formatDate, formatPrice } from '../../utils/formatPrice';
import { PAYMENT_STATUS_STYLES } from '../../utils/constants';
import { cn } from '../../utils/classNames';

const SellerCommissions = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    sellerService
      .getCommissions()
      .then(({ data: response }) => setData(response))
      .catch((error) => toast.error(getErrorMessage(error)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader label="Loading commissions..." />;
  if (!data) return <EmptyState title="Commissions unavailable" />;

  const { commissions = [], totals = {} } = data;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Commission history</h1>
        <p className="mt-1 text-sm text-slate-500">Each delivered order records the marketplace fee and your payable amount.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatsCard icon={FiTrendingUp} label="Gross item value" value={formatPrice(totals.gross)} tone="brand" />
        <StatsCard icon={FiPercent} label="Marketplace commission" value={formatPrice(totals.commission)} tone="violet" />
        <StatsCard icon={FiDollarSign} label="Your payable" value={formatPrice(totals.payable)} tone="amber" />
        <StatsCard icon={FiDollarSign} label="Settled" value={formatPrice(totals.settled)} tone="emerald" />
      </div>

      {commissions.length ? (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px]">
              <thead><tr className="table-head"><th className="px-4 py-3">Order</th><th className="px-4 py-3">Date</th><th className="px-4 py-3">Item value</th><th className="px-4 py-3">Rate</th><th className="px-4 py-3">Commission</th><th className="px-4 py-3">Your earning</th><th className="px-4 py-3">Payout</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {commissions.map((item) => (
                  <tr key={item._id} className="hover:bg-slate-50/60">
                    <td className="table-cell font-semibold text-slate-800">{item.order?.orderNumber || '—'}</td>
                    <td className="table-cell text-xs text-slate-500">{formatDate(item.createdAt)}</td>
                    <td className="table-cell">{formatPrice(item.itemsTotal)}</td>
                    <td className="table-cell">{item.commissionRate}%</td>
                    <td className="table-cell text-rose-600">-{formatPrice(item.commissionAmount)}</td>
                    <td className="table-cell font-semibold text-emerald-600">{formatPrice(item.sellerAmount)}</td>
                    <td className="table-cell"><span className={cn('badge', PAYMENT_STATUS_STYLES[item.sellerPayoutStatus])}>{item.sellerPayoutStatus}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <EmptyState icon={FiPercent} title="No commissions yet" description="Commission records are created after a paid order is placed." />
      )}
    </div>
  );
};

export default SellerCommissions;
