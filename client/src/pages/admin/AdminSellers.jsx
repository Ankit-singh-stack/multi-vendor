import { useCallback, useEffect, useState } from 'react';
import { FiCheckCircle, FiSearch, FiSlash, FiXCircle } from 'react-icons/fi';
import { toast } from 'react-toastify';
import Button from '../../components/common/Button';
import Loader from '../../components/common/Loader';
import EmptyState from '../../components/common/EmptyState';
import Modal from '../../components/common/Modal';
import Pagination from '../../components/common/Pagination';
import adminService from '../../services/adminService';
import { getErrorMessage } from '../../services/api';
import { formatDate, formatPrice, resolveImage } from '../../utils/formatPrice';
import { PAYMENT_STATUS_STYLES } from '../../utils/constants';
import { cn } from '../../utils/classNames';

const statuses = ['all', 'pending', 'approved', 'rejected', 'suspended'];

const AdminSellers = () => {
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('all');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [active, setActive] = useState(null);
  const [decision, setDecision] = useState('approved');
  const [rate, setRate] = useState(10);
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await adminService.getSellers({ status, q, page, limit: 12 });
      setSellers(data.sellers || []);
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

  const openReview = (seller, nextStatus = 'approved') => {
    setActive(seller);
    setDecision(nextStatus);
    setRate(seller.commissionRate ?? 10);
    setReason(seller.rejectionReason || '');
  };

  const submit = async () => {
    setSaving(true);
    try {
      const { data } = await adminService.reviewSeller(active._id, {
        status: decision,
        reason,
        commissionRate: Number(rate),
      });
      toast.success(data.message);
      setActive(null);
      await load();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Seller management</h1>
        <p className="mt-1 text-sm text-slate-500">{pagination.total} seller application(s). Approving a seller activates their store.</p>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-card sm:flex-row sm:items-center">
        <form onSubmit={(e) => { e.preventDefault(); setPage(1); load(); }} className="relative flex-1">
          <FiSearch className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search business, owner or email..." className="input pl-10" />
        </form>
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="input sm:w-44">
          {statuses.map((s) => <option key={s} value={s}>{s === 'all' ? 'All statuses' : s}</option>)}
        </select>
      </div>

      {loading ? <Loader label="Loading sellers..." /> : sellers.length ? (
        <>
          <div className="grid gap-4 xl:grid-cols-2">
            {sellers.map((seller) => (
              <div key={seller._id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {seller.logo?.url ? (
                      <img src={resolveImage(seller.logo.url)} alt={seller.businessName} className="h-12 w-12 rounded-xl border border-slate-200 object-cover" onError={(e) => { e.currentTarget.src = '/images/product-placeholder.svg'; }} />
                    ) : (
                      <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-sm font-bold text-brand-700">{seller.businessName?.[0]?.toUpperCase()}</span>
                    )}
                    <div>
                      <p className="font-semibold text-slate-900">{seller.businessName}</p>
                      <p className="text-xs text-slate-500">{seller.user?.name} · {seller.user?.email}</p>
                    </div>
                  </div>
                  <span className={cn('badge', PAYMENT_STATUS_STYLES[seller.status] || 'bg-slate-100 text-slate-600')}>{seller.status}</span>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2 rounded-xl bg-slate-50 p-3 text-center">
                  <div><p className="text-sm font-bold text-slate-800">{seller.productCount}</p><p className="text-[10px] text-slate-500">Products</p></div>
                  <div><p className="text-sm font-bold text-slate-800">{formatPrice(seller.totalSales)}</p><p className="text-[10px] text-slate-500">Delivered sales</p></div>
                  <div><p className="text-sm font-bold text-slate-800">{seller.commissionRate}%</p><p className="text-[10px] text-slate-500">Commission</p></div>
                </div>

                <p className="mt-3 text-xs text-slate-500">Applied {formatDate(seller.createdAt)} · Phone {seller.phone || seller.user?.phone || '—'}</p>
                {seller.rejectionReason && <p className="mt-2 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">Reason: {seller.rejectionReason}</p>}

                <div className="mt-4 flex flex-wrap gap-2">
                  {seller.status !== 'approved' && <Button size="xs" icon={FiCheckCircle} onClick={() => openReview(seller, 'approved')}>Approve</Button>}
                  {seller.status === 'pending' && <Button size="xs" variant="danger" icon={FiXCircle} onClick={() => openReview(seller, 'rejected')}>Reject</Button>}
                  {seller.status === 'approved' && <Button size="xs" variant="outline" icon={FiSlash} onClick={() => openReview(seller, 'suspended')}>Suspend</Button>}
                  <Button size="xs" variant="ghost" onClick={() => openReview(seller, seller.status === 'approved' ? 'approved' : 'pending')}>Adjust commission</Button>
                </div>
              </div>
            ))}
          </div>
          <Pagination page={pagination.page} pages={pagination.pages} onPageChange={setPage} />
        </>
      ) : <EmptyState icon={FiSearch} title="No sellers found" description="Try another filter or search term." />}

      <Modal
        open={Boolean(active)}
        onClose={() => setActive(null)}
        title={`${decision === 'approved' ? 'Approve' : decision === 'rejected' ? 'Reject' : decision === 'suspended' ? 'Suspend' : 'Update'} seller`}
        description={active?.businessName}
        footer={<><Button size="sm" variant="outline" onClick={() => setActive(null)}>Cancel</Button><Button size="sm" loading={saving} onClick={submit}>Confirm</Button></>}
      >
        <div className="space-y-4">
          <div>
            <label className="label" htmlFor="commission">Commission rate (%)</label>
            <input id="commission" type="number" min="0" max="100" step="0.5" value={rate} onChange={(e) => setRate(e.target.value)} className="input" />
            <p className="mt-1 text-[11px] text-slate-500">Applied to future orders. Default marketplace rate is 10%.</p>
          </div>
          {(decision === 'rejected' || decision === 'suspended') && (
            <div>
              <label className="label" htmlFor="reason">Reason</label>
              <textarea id="reason" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} className="input" placeholder="Explain the decision for the seller..." />
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default AdminSellers;
