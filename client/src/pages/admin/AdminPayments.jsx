import { useCallback, useEffect, useState } from 'react';
import { FiCreditCard, FiSearch } from 'react-icons/fi';
import { toast } from 'react-toastify';
import EmptyState from '../../components/common/EmptyState';
import Loader from '../../components/common/Loader';
import Pagination from '../../components/common/Pagination';
import adminService from '../../services/adminService';
import { getErrorMessage } from '../../services/api';
import { formatDateTime, formatPrice } from '../../utils/formatPrice';
import { PAYMENT_STATUS_STYLES } from '../../utils/constants';
import { cn } from '../../utils/classNames';

const AdminPayments = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('all');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await adminService.getPayments({ status, q, page, limit: 15 });
      setPayments(data.payments || []);
      setPagination(data.pagination || { page: 1, pages: 1, total: 0 });
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [status, q, page]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Payments</h1>
        <p className="mt-1 text-sm text-slate-500">{pagination.total} payment record(s) from Razorpay and demo checkout.</p>
      </div>

      <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-card sm:grid-cols-[1fr_auto]">
        <form onSubmit={(e) => { e.preventDefault(); setPage(1); load(); }} className="relative">
          <FiSearch className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search provider payment ID..." className="input pl-10" />
        </form>
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="input sm:w-44">
          {['all', 'created', 'paid', 'failed', 'refunded'].map((s) => <option key={s} value={s}>{s === 'all' ? 'All statuses' : s}</option>)}
        </select>
      </div>

      {loading ? <Loader label="Loading payments..." /> : payments.length ? (
        <>
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px]">
                <thead><tr className="table-head"><th className="px-4 py-3">Payment / Order</th><th className="px-4 py-3">Customer</th><th className="px-4 py-3">Provider</th><th className="px-4 py-3">Amount</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Date</th></tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {payments.map((payment) => (
                    <tr key={payment._id} className="hover:bg-slate-50/60">
                      <td className="table-cell">
                        <p className="font-mono text-xs font-semibold text-slate-800">{payment.providerPaymentId || payment._id}</p>
                        <p className="text-[11px] text-slate-500">{payment.order?.orderNumber || 'Order removed'} · {formatPrice(payment.order?.pricing?.grandTotal || payment.amount)}</p>
                      </td>
                      <td className="table-cell"><p className="text-sm">{payment.user?.name || 'Customer'}</p><p className="text-[11px] text-slate-500">{payment.user?.email}</p></td>
                      <td className="table-cell text-xs uppercase text-slate-600">{payment.provider || 'razorpay'}</td>
                      <td className="table-cell font-semibold">{formatPrice(payment.amount)}</td>
                      <td className="table-cell"><span className={cn('badge', PAYMENT_STATUS_STYLES[payment.status] || 'bg-slate-100 text-slate-600')}>{payment.status}</span></td>
                      <td className="table-cell text-xs text-slate-500">{formatDateTime(payment.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <Pagination page={pagination.page} pages={pagination.pages} onPageChange={setPage} />
        </>
      ) : <EmptyState icon={FiCreditCard} title="No payments found" description="Payments appear here when customers check out." />}
    </div>
  );
};

export default AdminPayments;
