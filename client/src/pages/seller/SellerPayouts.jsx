import { useEffect, useState } from 'react';
import { FiCheckCircle, FiDollarSign } from 'react-icons/fi';
import { toast } from 'react-toastify';
import StatsCard from '../../components/dashboard/StatsCard';
import Loader from '../../components/common/Loader';
import EmptyState from '../../components/common/EmptyState';
import sellerService from '../../services/sellerService';
import { getErrorMessage } from '../../services/api';
import { formatDate, formatPrice } from '../../utils/formatPrice';

const SellerPayouts = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    sellerService
      .getPayouts()
      .then(({ data: response }) => setData(response))
      .catch((error) => toast.error(getErrorMessage(error)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader label="Loading payouts..." />;
  if (!data) return <EmptyState title="Payouts unavailable" />;

  const { payouts = [], totalPaid = 0 } = data;
  const pending = payouts.length;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Payouts</h1>
        <p className="mt-1 text-sm text-slate-500">Settlements are processed manually by the marketplace administrator.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatsCard icon={FiDollarSign} label="Total settled" value={formatPrice(totalPaid)} tone="emerald" />
        <StatsCard icon={FiCheckCircle} label="Settlements" value={payouts.length} hint="Completed payouts" tone="brand" />
        <StatsCard icon={FiDollarSign} label="Awaiting settlement" value={pending ? 'See commissions' : 'None'} tone="amber" />
      </div>

      {payouts.length ? (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead><tr className="table-head"><th className="px-4 py-3">Order</th><th className="px-4 py-3">Settled on</th><th className="px-4 py-3">Item value</th><th className="px-4 py-3">Commission</th><th className="px-4 py-3">Paid to you</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {payouts.map((payout) => (
                  <tr key={payout._id} className="hover:bg-slate-50/60">
                    <td className="table-cell font-semibold text-slate-800">{payout.order?.orderNumber || '—'}</td>
                    <td className="table-cell text-xs text-slate-500">{formatDate(payout.settledAt)}</td>
                    <td className="table-cell">{formatPrice(payout.itemsTotal)}</td>
                    <td className="table-cell text-rose-600">-{formatPrice(payout.commissionAmount)}</td>
                    <td className="table-cell font-semibold text-emerald-600">{formatPrice(payout.sellerAmount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <EmptyState icon={FiDollarSign} title="No payouts settled yet" description="Once the administrator marks a commission payout as settled, it appears here." />
      )}
    </div>
  );
};

export default SellerPayouts;
