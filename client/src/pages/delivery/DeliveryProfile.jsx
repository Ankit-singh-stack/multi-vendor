import { useEffect, useState } from 'react';
import { FiSave, FiTruck } from 'react-icons/fi';
import { toast } from 'react-toastify';
import Button from '../../components/common/Button';
import EmptyState from '../../components/common/EmptyState';
import Loader from '../../components/common/Loader';
import deliveryService from '../../services/deliveryService';
import { getErrorMessage } from '../../services/api';
import { formatDate } from '../../utils/formatPrice';
import { PAYMENT_STATUS_STYLES } from '../../utils/constants';
import { cn } from '../../utils/classNames';

const empty = { vehicleType: 'bike', vehicleNumber: '', licenseNumber: '', serviceArea: '', isAvailable: true };

const DeliveryProfile = () => {
  const [profile, setProfile] = useState(null);
  const [user, setUser] = useState(null);
  const [form, setForm] = useState(empty);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    deliveryService.getProfile()
      .then(({ data }) => {
        setProfile(data.profile);
        setUser(data.user);
        if (data.profile) {
          setForm({
            vehicleType: data.profile.vehicleType || 'bike',
            vehicleNumber: data.profile.vehicleNumber || '',
            licenseNumber: data.profile.licenseNumber || '',
            serviceArea: data.profile.serviceArea || '',
            isAvailable: data.profile.isAvailable ?? true,
          });
        }
      })
      .catch((error) => toast.error(getErrorMessage(error)))
      .finally(() => setLoading(false));
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await deliveryService.updateProfile(form);
      setProfile(data.profile);
      toast.success(data.message);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const toggleAvailability = async () => {
    try {
      const { data } = await deliveryService.updateProfile({ isAvailable: !form.isAvailable });
      setProfile(data.profile);
      setForm((f) => ({ ...f, isAvailable: data.profile.isAvailable }));
      toast.success(data.profile.isAvailable ? 'You are now available for deliveries.' : 'You are now offline.');
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  if (loading) return <Loader label="Loading delivery profile..." />;
  if (!profile) return <EmptyState icon={FiTruck} title="Delivery profile missing" description="Contact the marketplace admin for help with your partner account." />;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Delivery profile</h1>
          <p className="mt-1 text-sm text-slate-500">Keep your vehicle details current so orders can be assigned accurately.</p>
        </div>
        <button type="button" onClick={toggleAvailability} className={cn('inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition', form.isAvailable ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' : 'bg-slate-100 text-slate-600 hover:bg-slate-200')}>
          <span className={cn('h-2.5 w-2.5 rounded-full', form.isAvailable ? 'bg-emerald-500' : 'bg-slate-400')} /> {form.isAvailable ? 'Available' : 'Offline'}
        </button>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.4fr_1fr]">
        <form onSubmit={submit} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card sm:p-6">
          <div className="mb-5 flex items-center gap-2 border-b border-slate-100 pb-4">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-50 text-sky-600"><FiTruck className="h-4 w-4" /></span>
            <div><h2 className="text-sm font-semibold">Vehicle & service area</h2><p className="text-xs text-slate-500">Approval status: {profile.status}</p></div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="vehicleType">Vehicle type</label>
              <select id="vehicleType" value={form.vehicleType} onChange={(e) => setForm((f) => ({ ...f, vehicleType: e.target.value }))} className="input">
                {['bike', 'scooter', 'cycle', 'car', 'other'].map((type) => <option key={type} value={type}>{type}</option>)}
              </select>
            </div>
            <div><label className="label" htmlFor="vehicleNumber">Vehicle number</label><input id="vehicleNumber" value={form.vehicleNumber} onChange={(e) => setForm((f) => ({ ...f, vehicleNumber: e.target.value.toUpperCase() }))} className="input uppercase" placeholder="KA 01 AB 1234" /></div>
            <div><label className="label" htmlFor="licenseNumber">License number</label><input id="licenseNumber" value={form.licenseNumber} onChange={(e) => setForm((f) => ({ ...f, licenseNumber: e.target.value.toUpperCase() }))} className="input uppercase" /></div>
            <div><label className="label" htmlFor="serviceArea">Service area</label><input id="serviceArea" value={form.serviceArea} onChange={(e) => setForm((f) => ({ ...f, serviceArea: e.target.value }))} className="input" placeholder="e.g. North Bengaluru" /></div>
          </div>

          <label className="mt-4 flex items-center gap-2 text-sm text-slate-600"><input type="checkbox" checked={Boolean(form.isAvailable)} onChange={(e) => setForm((f) => ({ ...f, isAvailable: e.target.checked }))} className="h-4 w-4 rounded border-slate-300 text-brand-600" /> Available to accept new assignments</label>

          <div className="mt-6 flex justify-end"><Button type="submit" icon={FiSave} loading={saving}>Save changes</Button></div>
        </form>

        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
            <h2 className="text-sm font-semibold">Partner account</h2>
            <div className="mt-3 space-y-2 text-sm">
              <p className="flex justify-between"><span className="text-slate-500">Name</span><span className="font-medium">{user?.name}</span></p>
              <p className="flex justify-between"><span className="text-slate-500">Email</span><span className="max-w-[60%] truncate font-medium">{user?.email}</span></p>
              <p className="flex justify-between"><span className="text-slate-500">Phone</span><span className="font-medium">{user?.phone || '—'}</span></p>
              <p className="flex justify-between"><span className="text-slate-500">Joined</span><span className="font-medium">{formatDate(profile.createdAt)}</span></p>
              <p className="flex justify-between"><span className="text-slate-500">Status</span><span className={cn('badge', PAYMENT_STATUS_STYLES[profile.status] || 'bg-slate-100 text-slate-600')}>{profile.status}</span></p>
            </div>
            {profile.rejectionReason && <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">Reason: {profile.rejectionReason}</p>}
          </div>

          <div className="rounded-2xl border border-sky-200 bg-sky-50 p-5 text-xs text-sky-800">
            <p className="font-semibold">Delivery guidelines</p>
            <ul className="mt-2 list-disc space-y-1 pl-4">
              <li>Update status when you pick up and deliver every order group.</li>
              <li>Contact the customer only using the phone number in the delivery details.</li>
              <li>Collect cash only for COD orders; online orders are prepaid.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeliveryProfile;
