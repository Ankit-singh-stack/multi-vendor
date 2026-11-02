import { useCallback, useEffect, useState } from 'react';
import { FiCheckCircle, FiClock, FiRotateCcw, FiXCircle } from 'react-icons/fi';
import { toast } from 'react-toastify';
import Button from '../../components/common/Button';
import EmptyState from '../../components/common/EmptyState';
import Loader from '../../components/common/Loader';
import Modal from '../../components/common/Modal';
import adminService from '../../services/adminService';
import { getErrorMessage } from '../../services/api';
import { formatDate, formatPrice } from '../../utils/formatPrice';
import { PAYMENT_STATUS_STYLES } from '../../utils/constants';
import { cn } from '../../utils/classNames';

const AdminRefunds = () => {
  const [refunds, setRefunds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('all');
  const [active, setActive] = useState(null);
  const [decision, setDecision] = useState('approved');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await adminService.getRefunds({ status });
      setRefunds(data.refunds || []);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    load();
  }, [load]);

  const open = (refund, nextStatus) => {
    setActive(refund);
    setDecision(nextStatus);
    setNote(refund.adminNote || '');
  };

  const submit = async () => {
    setSaving(true);
    try {
      const { data } = await adminService.updateRefund(active._id, { status: decision, adminNote: note });
      toast.success(data.message);
      setActive(null);
      await load();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const pending = refunds.filter((r) => r.status === 'pending').length;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Refunds</h1>
          <p className="mt-1 text-sm text-slate-500">Review customer refund requests. Processing marks the related order as refunded.</p>
        </div>
        <span className="badge bg-amber-50 text-amber-700"><FiClock /> {pending} pending</span>
      </div>

      <div className="flex flex-wrap gap-2">
        {['all', 'pending', 'approved', 'rejected', 'processed'].map((s) => (
          <button key={s} type="button" onClick={() => setStatus(s)} className={cn('rounded-full px-3.5 py-1.5 text-xs font-semibold capitalize transition', status === s ? 'bg-brand-600 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50')}>{s}</button>
        ))}
      </div>

      {loading ? <Loader label="Loading refunds..." /> : refunds.length ? (
        <div className="grid gap-4 xl:grid-cols-2">
          {refunds.map((refund) => (
            <div key={refund._id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-900">{refund.order?.orderNumber || 'Order removed'}</p>
                  <p className="text-xs text-slate-500">{refund.customer?.name} · {refund.customer?.email}</p>
                </div>
                <span className={cn('badge', PAYMENT_STATUS_STYLES[refund.status] || 'bg-slate-100 text-slate-600')}>{refund.status}</span>
              </div>

              <div className="mt-3 rounded-xl bg-slate-50 p-3">
                <p className="text-lg font-bold text-slate-900">{formatPrice(refund.amount)}</p>
                <p className="mt-1 text-xs text-slate-600">{refund.reason}</p>
              </div>

              <p className="mt-2 text-[11px] text-slate-500">Requested {formatDate(refund.createdAt)} · {refund.subOrderId ? 'Seller group refund' : 'Full order refund'}</p>
              {refund.adminNote && <p className="mt-2 rounded-lg bg-brand-50 px-3 py-2 text-xs text-brand-800">Admin note: {refund.adminNote}</p>}

              <div className="mt-4 flex flex-wrap gap-2">
                {refund.status === 'pending' && <Button size="xs" icon={FiCheckCircle} onClick={() => open(refund, 'approved')}>Approve</Button>}
                {refund.status === 'pending' && <Button size="xs" variant="danger" icon={FiXCircle} onClick={() => open(refund, 'rejected')}>Reject</Button>}
                {refund.status === 'approved' && <Button size="xs" variant="success" icon={FiRotateCcw} onClick={() => open(refund, 'processed')}>Mark processed</Button>}
              </div>
            </div>
          ))}
        </div>
      ) : <EmptyState icon={FiRotateCcw} title="No refund requests" description="Refund requests raised by customers will appear here." />}

      <Modal open={Boolean(active)} onClose={() => setActive(null)} title={`${decision === 'processed' ? 'Mark refund processed' : decision} refund`} description={active?.order?.orderNumber} footer={<><Button size="sm" variant="outline" onClick={() => setActive(null)}>Cancel</Button><Button size="sm" loading={saving} onClick={submit}>Confirm</Button></>}>
        <div className="space-y-4">
          <div className="rounded-xl bg-slate-50 p-3 text-sm">
            <p className="font-semibold">{formatPrice(active?.amount)}</p>
            <p className="mt-1 text-xs text-slate-500">{active?.reason}</p>
          </div>
          <div><label className="label" htmlFor="adminNote">Admin note</label><textarea id="adminNote" rows={3} value={note} onChange={(e) => setNote(e.target.value)} className="input" placeholder="Internal note or customer-facing reason..." /></div>
          {decision === 'processed' && <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">MarketSphere only records the refund. Complete the actual bank/Razorpay transfer separately.</p>}
        </div>
      </Modal>
    </div>
  );
};

export default AdminRefunds;
