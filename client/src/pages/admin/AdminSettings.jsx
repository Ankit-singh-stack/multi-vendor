import { useEffect, useState } from 'react';
import { FiSave, FiSettings } from 'react-icons/fi';
import { toast } from 'react-toastify';
import Button from '../../components/common/Button';
import Loader from '../../components/common/Loader';
import adminService from '../../services/adminService';
import { getErrorMessage } from '../../services/api';
import { formatPrice } from '../../utils/formatPrice';

const fields = [
  { key: 'platformName', label: 'Platform name', hint: 'Shown across the storefront and transactional emails.', type: 'text' },
  { key: 'commissionRate', label: 'Default commission rate (%)', hint: 'Fallback rate used when creating seller commissions.', type: 'number', suffix: '%' },
  { key: 'taxRate', label: 'Tax rate (%)', hint: 'Applied to item totals at checkout.', type: 'number', suffix: '%' },
  { key: 'deliveryCharge', label: 'Delivery charge (₹)', hint: 'Standard delivery fee for orders below the free threshold.', type: 'number', prefix: '₹' },
  { key: 'freeDeliveryAbove', label: 'Free delivery above (₹)', hint: 'Orders at or above this item value receive free delivery.', type: 'number', prefix: '₹' },
];

const AdminSettings = () => {
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    adminService.getSettings()
      .then(({ data }) => setForm(data.settings || {}))
      .catch((error) => toast.error(getErrorMessage(error)))
      .finally(() => setLoading(false));
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {};
      fields.forEach((field) => {
        payload[field.key] = field.type === 'number' ? Number(form[field.key]) : form[field.key];
      });
      const { data } = await adminService.updateSettings(payload);
      setForm(data.settings);
      toast.success(data.message);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loader label="Loading marketplace settings..." />;
  if (!form) return null;

  const previewTotal = Math.max(1, Number(form.deliveryCharge) || 0);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Marketplace settings</h1>
        <p className="mt-1 text-sm text-slate-500">Control commissions, taxes, delivery pricing and the platform identity.</p>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.4fr_1fr]">
        <form onSubmit={submit} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card sm:p-6">
          <div className="mb-5 flex items-center gap-2 border-b border-slate-100 pb-4">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-600"><FiSettings className="h-4 w-4" /></span>
            <div><h2 className="text-sm font-semibold">Commercial configuration</h2><p className="text-xs text-slate-500">Changes apply to new orders only.</p></div>
          </div>

          <div className="space-y-4">
            {fields.map((field) => (
              <div key={field.key}>
                <label className="label" htmlFor={field.key}>{field.label}</label>
                <div className="relative">
                  {field.prefix && <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-slate-400">{field.prefix}</span>}
                  <input
                    id={field.key}
                    type={field.type}
                    min={field.type === 'number' ? 0 : undefined}
                    step={field.type === 'number' ? '0.01' : undefined}
                    value={form[field.key] ?? ''}
                    onChange={(e) => setForm((f) => ({ ...f, [field.key]: e.target.value }))}
                    className={`input ${field.prefix ? 'pl-8' : ''} ${field.suffix ? 'pr-8' : ''}`}
                  />
                  {field.suffix && <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-sm text-slate-400">{field.suffix}</span>}
                </div>
                <p className="mt-1 text-[11px] text-slate-500">{field.hint}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 flex justify-end"><Button type="submit" icon={FiSave} loading={saving}>Save settings</Button></div>
        </form>

        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
            <h2 className="text-sm font-semibold">Checkout preview</h2>
            <div className="mt-3 space-y-2 rounded-xl bg-slate-50 p-4 text-sm">
              <div className="flex justify-between"><span className="text-slate-500">Item subtotal</span><span>{formatPrice(1000)}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Tax ({form.taxRate}%)</span><span>{formatPrice(1000 * (Number(form.taxRate) || 0) / 100)}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Delivery</span><span>{1000 >= Number(form.freeDeliveryAbove) ? 'FREE' : formatPrice(previewTotal)}</span></div>
              <div className="flex justify-between border-t border-slate-200 pt-2 font-bold"><span>Example total</span><span>{formatPrice(1000 + (1000 * (Number(form.taxRate) || 0)) / 100 + (1000 >= Number(form.freeDeliveryAbove) ? 0 : previewTotal))}</span></div>
            </div>
            <p className="mt-3 text-[11px] text-slate-500">Free delivery applies at or above {formatPrice(form.freeDeliveryAbove)}. Seller-specific commission rates override the default.</p>
          </div>

          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-xs text-amber-800">
            <p className="font-semibold">Operational reminders</p>
            <ul className="mt-2 list-disc space-y-1 pl-4">
              <li>Marketplace settings affect new orders; existing orders keep their recorded pricing.</li>
              <li>Commission settlement is manual and must match actual bank transfers.</li>
              <li>Keep seller commission rates aligned with your commercial agreements.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
