import { useEffect, useState } from 'react';
import { FiEdit2, FiPlus, FiTag, FiTrash2 } from 'react-icons/fi';
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

const empty = {
  code: '',
  description: '',
  discountType: 'percentage',
  discountValue: '',
  minOrderValue: 0,
  maxDiscount: 0,
  expiresAt: '',
  usageLimit: 0,
  isActive: true,
};

const AdminCoupons = () => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const load = async () => {
    try {
      const { data } = await adminService.getCoupons();
      setCoupons(data.coupons || []);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ ...empty, expiresAt: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10) });
    setOpen(true);
  };

  const openEdit = (coupon) => {
    setEditing(coupon);
    setForm({
      code: coupon.code || '',
      description: coupon.description || '',
      discountType: coupon.discountType || 'percentage',
      discountValue: coupon.discountValue ?? '',
      minOrderValue: coupon.minOrderValue ?? 0,
      maxDiscount: coupon.maxDiscount ?? 0,
      expiresAt: coupon.expiresAt ? new Date(coupon.expiresAt).toISOString().slice(0, 10) : '',
      usageLimit: coupon.usageLimit ?? 0,
      isActive: coupon.isActive ?? true,
    });
    setOpen(true);
  };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        code: form.code.trim().toUpperCase(),
        discountValue: Number(form.discountValue),
        minOrderValue: Number(form.minOrderValue),
        maxDiscount: Number(form.maxDiscount),
        usageLimit: Number(form.usageLimit),
      };
      const { data } = editing
        ? await adminService.updateCoupon(editing._id, payload)
        : await adminService.createCoupon(payload);
      toast.success(data.message);
      setOpen(false);
      await load();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    setDeleteBusy(true);
    try {
      const { data } = await adminService.deleteCoupon(deleting._id);
      toast.success(data.message);
      setDeleting(null);
      await load();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setDeleteBusy(false);
    }
  };

  const toggleActive = async (coupon) => {
    try {
      const { data } = await adminService.updateCoupon(coupon._id, { isActive: !coupon.isActive });
      setCoupons((prev) => prev.map((c) => (c._id === coupon._id ? data.coupon : c)));
      toast.success(`Coupon ${data.coupon.isActive ? 'activated' : 'deactivated'}.`);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  if (loading) return <Loader label="Loading coupons..." />;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Coupons</h1>
          <p className="mt-1 text-sm text-slate-500">{coupons.length} discount code(s) configured for checkout.</p>
        </div>
        <Button size="sm" icon={FiPlus} onClick={openCreate}>Create coupon</Button>
      </div>

      {coupons.length ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {coupons.map((coupon) => {
            const expired = new Date(coupon.expiresAt) < new Date();
            const exhausted = coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit;
            return (
              <div key={coupon._id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600"><FiTag className="h-5 w-5" /></span>
                    <div><p className="font-mono text-base font-bold tracking-wide text-slate-900">{coupon.code}</p><p className="text-[11px] text-slate-500">{coupon.discountType === 'percentage' ? `${coupon.discountValue}% off` : `${formatPrice(coupon.discountValue)} off`}</p></div>
                  </div>
                  <button type="button" onClick={() => toggleActive(coupon)} className={cn('badge', coupon.isActive && !expired && !exhausted ? PAYMENT_STATUS_STYLES.active : 'bg-slate-100 text-slate-600')}>{coupon.isActive ? (expired ? 'expired' : exhausted ? 'exhausted' : 'active') : 'inactive'}</button>
                </div>

                <p className="mt-3 min-h-[32px] text-xs text-slate-500">{coupon.description || 'No description.'}</p>
                <div className="mt-2 space-y-1 rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
                  <p>Minimum order: <span className="font-semibold">{formatPrice(coupon.minOrderValue)}</span></p>
                  <p>Max discount: <span className="font-semibold">{coupon.maxDiscount ? formatPrice(coupon.maxDiscount) : 'No cap'}</span></p>
                  <p>Used: <span className="font-semibold">{coupon.usedCount}{coupon.usageLimit ? ` / ${coupon.usageLimit}` : ''}</span> · Expires {formatDate(coupon.expiresAt)}</p>
                </div>

                <div className="mt-3 flex justify-end gap-1">
                  <button type="button" onClick={() => openEdit(coupon)} className="rounded-lg p-2 text-slate-400 hover:bg-brand-50 hover:text-brand-700" aria-label="Edit"><FiEdit2 className="h-4 w-4" /></button>
                  <button type="button" onClick={() => setDeleting(coupon)} className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600" aria-label="Delete"><FiTrash2 className="h-4 w-4" /></button>
                </div>
              </div>
            );
          })}
        </div>
      ) : <EmptyState icon={FiTag} title="No coupons yet" description="Create a coupon code to offer discounts at checkout." action={<Button icon={FiPlus} onClick={openCreate}>Create coupon</Button>} />}

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? `Edit ${editing.code}` : 'Create coupon'} size="lg">
        <form onSubmit={submit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div><label className="label" htmlFor="code">Code</label><input id="code" required value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))} className="input font-mono uppercase" placeholder="WELCOME10" disabled={Boolean(editing)} /></div>
            <div><label className="label" htmlFor="discountType">Discount type</label><select id="discountType" value={form.discountType} onChange={(e) => setForm((f) => ({ ...f, discountType: e.target.value }))} className="input"><option value="percentage">Percentage</option><option value="fixed">Fixed amount</option></select></div>
          </div>
          <div><label className="label" htmlFor="description">Description</label><input id="description" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} className="input" placeholder="Displayed to admins and customers" /></div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div><label className="label" htmlFor="discountValue">Discount value {form.discountType === 'percentage' ? '(%)' : '(₹)'}</label><input id="discountValue" type="number" min="0" step="0.01" required value={form.discountValue} onChange={(e) => setForm((f) => ({ ...f, discountValue: e.target.value }))} className="input" /></div>
            <div><label className="label" htmlFor="minOrderValue">Minimum order (₹)</label><input id="minOrderValue" type="number" min="0" value={form.minOrderValue} onChange={(e) => setForm((f) => ({ ...f, minOrderValue: e.target.value }))} className="input" /></div>
            <div><label className="label" htmlFor="maxDiscount">Maximum discount (₹)</label><input id="maxDiscount" type="number" min="0" value={form.maxDiscount} onChange={(e) => setForm((f) => ({ ...f, maxDiscount: e.target.value }))} className="input" /><p className="mt-1 text-[10px] text-slate-500">0 means no cap.</p></div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><label className="label" htmlFor="expiresAt">Expiry date</label><input id="expiresAt" type="date" required value={form.expiresAt} onChange={(e) => setForm((f) => ({ ...f, expiresAt: e.target.value }))} className="input" /></div>
            <div><label className="label" htmlFor="usageLimit">Usage limit</label><input id="usageLimit" type="number" min="0" value={form.usageLimit} onChange={(e) => setForm((f) => ({ ...f, usageLimit: e.target.value }))} className="input" /><p className="mt-1 text-[10px] text-slate-500">0 means unlimited.</p></div>
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-600"><input type="checkbox" checked={Boolean(form.isActive)} onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))} className="h-4 w-4 rounded border-slate-300 text-brand-600" /> Active for checkout</label>
          <div className="flex justify-end gap-2 pt-2"><Button type="button" size="sm" variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit" size="sm" loading={saving}>{editing ? 'Save changes' : 'Create coupon'}</Button></div>
        </form>
      </Modal>

      <Modal open={Boolean(deleting)} onClose={() => setDeleting(null)} title="Delete coupon?" description="This code will stop working immediately." footer={<><Button size="sm" variant="outline" onClick={() => setDeleting(null)}>Cancel</Button><Button size="sm" variant="danger" loading={deleteBusy} onClick={remove}>Delete</Button></>}>
        <p className="font-mono text-lg font-bold text-slate-800">{deleting?.code}</p>
      </Modal>
    </div>
  );
};

export default AdminCoupons;
