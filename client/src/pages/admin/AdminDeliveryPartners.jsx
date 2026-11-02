import { useCallback, useEffect, useState } from 'react';
import { FiCheckCircle, FiSearch, FiSlash, FiTruck, FiXCircle } from 'react-icons/fi';
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

const AdminDeliveryPartners = () => {
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('all');
  const [q, setQ] = useState('');
  const [active, setActive] = useState(null);
  const [decision, setDecision] = useState('approved');
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await adminService.getDeliveryPartners({ status, q });
      setPartners(data.partners || []);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [status, q]);

  useEffect(() => {
    load();
  }, [load]);

  const open = (partner, nextStatus) => {
    setActive(partner);
    setDecision(nextStatus);
    setReason(partner.rejectionReason || '');
  };

  const submit = async () => {
    setSaving(true);
    try {
      const { data } = await adminService.reviewDeliveryPartner(active._id, { status: decision, reason });
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
        <h1 className="text-2xl font-bold">Delivery partners</h1>
        <p className="mt-1 text-sm text-slate-500">{partners.length} partner(s). Only approved partners can be assigned to orders.</p>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-card sm:flex-row">
        <form onSubmit={(e) => { e.preventDefault(); load(); }} className="relative flex-1">
          <FiSearch className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, email or phone..." className="input pl-10" />
        </form>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="input sm:w-44">
          {['all', 'pending', 'approved', 'rejected', 'suspended'].map((s) => <option key={s} value={s}>{s === 'all' ? 'All statuses' : s}</option>)}
        </select>
      </div>

      {loading ? <Loader label="Loading delivery partners..." /> : partners.length ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {partners.map((partner) => (
            <div key={partner._id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-50 text-sky-600"><FiTruck className="h-5 w-5" /></span>
                  <div><p className="font-semibold text-slate-900">{partner.user?.name || 'Partner'}</p><p className="text-xs text-slate-500">{partner.user?.email}</p></div>
                </div>
                <span className={cn('badge', PAYMENT_STATUS_STYLES[partner.status] || 'bg-slate-100 text-slate-600')}>{partner.status}</span>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2 rounded-xl bg-slate-50 p-3 text-center">
                <div><p className="text-sm font-bold">{partner.totalDeliveries || 0}</p><p className="text-[10px] text-slate-500">Deliveries</p></div>
                <div><p className="text-sm font-bold">{formatPrice(partner.totalEarnings)}</p><p className="text-[10px] text-slate-500">Earnings</p></div>
                <div><p className="text-sm font-bold">{partner.isAvailable ? 'Yes' : 'No'}</p><p className="text-[10px] text-slate-500">Available</p></div>
              </div>

              <div className="mt-3 space-y-1 text-xs text-slate-500">
                <p>Vehicle: <span className="font-medium text-slate-700">{partner.vehicleType} {partner.vehicleNumber || ''}</span></p>
                <p>Service area: {partner.serviceArea || '—'}</p>
                <p>Phone: {partner.user?.phone || '—'} · Joined {formatDate(partner.createdAt)}</p>
              </div>
              {partner.rejectionReason && <p className="mt-2 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">Reason: {partner.rejectionReason}</p>}

              <div className="mt-4 flex flex-wrap gap-2">
                {partner.status !== 'approved' && <Button size="xs" icon={FiCheckCircle} onClick={() => open(partner, 'approved')}>Approve</Button>}
                {partner.status === 'pending' && <Button size="xs" variant="danger" icon={FiXCircle} onClick={() => open(partner, 'rejected')}>Reject</Button>}
                {partner.status === 'approved' && <Button size="xs" variant="outline" icon={FiSlash} onClick={() => open(partner, 'suspended')}>Suspend</Button>}
              </div>
            </div>
          ))}
        </div>
      ) : <EmptyState icon={FiTruck} title="No delivery partners found" description="Try another filter or search term." />}

      <Modal open={Boolean(active)} onClose={() => setActive(null)} title={`${decision} delivery partner`} description={active?.user?.name} footer={<><Button size="sm" variant="outline" onClick={() => setActive(null)}>Cancel</Button><Button size="sm" loading={saving} onClick={submit}>Confirm</Button></>}>
        <div className="space-y-4">
          <p className="rounded-xl bg-slate-50 p-3 text-sm text-slate-600">{active?.user?.name} · {active?.vehicleType} {active?.vehicleNumber || ''} · {active?.serviceArea || 'No service area set'}</p>
          {(decision === 'rejected' || decision === 'suspended') && (
            <div><label className="label" htmlFor="reason">Reason</label><textarea id="reason" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} className="input" placeholder="Explain the decision..." /></div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default AdminDeliveryPartners;
