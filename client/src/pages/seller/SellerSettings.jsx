import { useEffect, useState } from 'react';
import { FiImage, FiSave, FiBriefcase } from 'react-icons/fi';
import { toast } from 'react-toastify';
import Button from '../../components/common/Button';
import Loader from '../../components/common/Loader';
import sellerService from '../../services/sellerService';
import { getErrorMessage } from '../../services/api';
import { formatDate, resolveImage } from '../../utils/formatPrice';
import { PAYMENT_STATUS_STYLES } from '../../utils/constants';
import { cn } from '../../utils/classNames';

const SellerSettings = () => {
  const [profile, setProfile] = useState(null);
  const [store, setStore] = useState(null);
  const [form, setForm] = useState(null);
  const [logo, setLogo] = useState(null);
  const [logoPreview, setLogoPreview] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    sellerService
      .getProfile()
      .then(({ data }) => {
        setProfile(data.sellerProfile);
        setStore(data.store);
        setForm({
          businessName: data.sellerProfile?.businessName || '',
          ownerName: data.sellerProfile?.ownerName || '',
          phone: data.sellerProfile?.phone || '',
          gstNumber: data.sellerProfile?.gstNumber || '',
          description: data.sellerProfile?.description || '',
          storeAddress: data.store?.address || '',
          address: data.sellerProfile?.address || {},
          isActive: data.store?.isActive ?? false,
        });
        setLogoPreview(data.sellerProfile?.logo?.url || data.store?.logo?.url || '');
      })
      .catch((error) => toast.error(getErrorMessage(error)))
      .finally(() => setLoading(false));
  }, []);

  const change = (e) => {
    const { name, value, type, checked } = e.target;
    if (name.startsWith('address.')) {
      const key = name.split('.')[1];
      setForm((prev) => ({ ...prev, address: { ...prev.address, [key]: value } }));
      return;
    }
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const selectLogo = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogo(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = new FormData();
      payload.append('businessName', form.businessName);
      payload.append('ownerName', form.ownerName);
      payload.append('phone', form.phone);
      payload.append('gstNumber', form.gstNumber);
      payload.append('description', form.description);
      payload.append('storeAddress', form.storeAddress);
      payload.append('isActive', String(form.isActive));
      payload.append('address', JSON.stringify(form.address));
      if (logo) payload.append('logo', logo);
      const { data } = await sellerService.updateProfile(payload);
      setProfile(data.sellerProfile);
      setStore(data.store);
      setLogo(null);
      toast.success(data.message);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  if (loading || !form) return <Loader label="Loading store settings..." />;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Store settings</h1>
        <p className="mt-1 text-sm text-slate-500">Your storefront details are visible to customers on every product page.</p>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-card">
        <span className={cn('badge', PAYMENT_STATUS_STYLES[profile?.status] || 'bg-slate-100 text-slate-600')}>Seller: {profile?.status}</span>
        <span className="text-xs text-slate-500">Commission rate: <strong>{profile?.commissionRate}%</strong></span>
        <span className="text-xs text-slate-500">Approved: {formatDate(profile?.approvedAt)}</span>
      </div>

      <form onSubmit={submit} className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-5">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
            <h2 className="flex items-center gap-2 text-base font-semibold"><FiBriefcase className="h-4 w-4 text-brand-600" /> Business details</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div><label className="label" htmlFor="businessName">Business name</label><input id="businessName" name="businessName" required value={form.businessName} onChange={change} className="input" /></div>
              <div><label className="label" htmlFor="ownerName">Owner name</label><input id="ownerName" name="ownerName" value={form.ownerName} onChange={change} className="input" /></div>
              <div><label className="label" htmlFor="phone">Contact phone</label><input id="phone" name="phone" value={form.phone} onChange={change} className="input" /></div>
              <div><label className="label" htmlFor="gstNumber">GST number</label><input id="gstNumber" name="gstNumber" value={form.gstNumber} onChange={change} className="input" /></div>
            </div>
            <div className="mt-4"><label className="label" htmlFor="description">Store description</label><textarea id="description" name="description" rows={4} value={form.description} onChange={change} className="input" /></div>
            <div className="mt-4"><label className="label" htmlFor="storeAddress">Store address</label><input id="storeAddress" name="storeAddress" value={form.storeAddress} onChange={change} className="input" /></div>
            <label className="mt-4 flex items-center gap-2 text-sm text-slate-600">
              <input type="checkbox" name="isActive" checked={Boolean(form.isActive)} onChange={change} className="h-4 w-4 rounded border-slate-300 text-brand-600" />
              Store is active and visible to customers
            </label>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
            <h2 className="text-base font-semibold">Business address</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2"><label className="label" htmlFor="address.line1">Address line 1</label><input id="address.line1" name="address.line1" value={form.address?.line1 || ''} onChange={change} className="input" /></div>
              <div><label className="label" htmlFor="address.city">City</label><input id="address.city" name="address.city" value={form.address?.city || ''} onChange={change} className="input" /></div>
              <div><label className="label" htmlFor="address.state">State</label><input id="address.state" name="address.state" value={form.address?.state || ''} onChange={change} className="input" /></div>
              <div><label className="label" htmlFor="address.pincode">Pincode</label><input id="address.pincode" name="address.pincode" value={form.address?.pincode || ''} onChange={change} className="input" /></div>
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
            <h2 className="flex items-center gap-2 text-base font-semibold"><FiImage className="h-4 w-4 text-brand-600" /> Store logo</h2>
            <div className="mt-4 flex flex-col items-center">
              {logoPreview ? (
                <img src={resolveImage(logoPreview)} alt="Store logo" className="h-28 w-28 rounded-2xl border border-slate-200 object-cover" onError={() => setLogoPreview('')} />
              ) : (
                <div className="flex h-28 w-28 items-center justify-center rounded-2xl bg-brand-50 text-brand-600"><FiBriefcase className="h-10 w-10" /></div>
              )}
              <label className="mt-3 cursor-pointer rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50">
                Upload logo
                <input type="file" accept="image/*" className="hidden" onChange={selectLogo} />
              </label>
            </div>
          </div>

          <Button type="submit" className="w-full" size="lg" loading={saving} icon={FiSave}>Save store settings</Button>

          <div className="rounded-2xl bg-slate-100 p-4 text-xs leading-relaxed text-slate-600">
            <p className="font-semibold text-slate-800">Store: {store?.name}</p>
            <p className="mt-1">Slug: {store?.slug || 'â€”'}</p>
            <p className="mt-1">Products: {store?.totalProducts || 0}</p>
            <p className="mt-1">Changing your business name updates your public storefront name.</p>
          </div>
        </div>
      </form>
    </div>
  );
};

export default SellerSettings;

