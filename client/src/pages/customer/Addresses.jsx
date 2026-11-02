import { useEffect, useState } from 'react';
import { FiEdit2, FiMapPin, FiPlus, FiTrash2 } from 'react-icons/fi';
import { toast } from 'react-toastify';
import Button from '../../components/common/Button';
import EmptyState from '../../components/common/EmptyState';
import Loader from '../../components/common/Loader';
import Modal from '../../components/common/Modal';
import AddressForm from '../../components/customer/AddressForm';
import userService from '../../services/userService';
import { getErrorMessage } from '../../services/api';

const Addresses = () => {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState('');

  const load = async () => {
    try {
      const { data } = await userService.getAddresses();
      setAddresses(data.addresses || []);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const save = async (form) => {
    setSubmitting(true);
    try {
      if (editing) {
        const { data } = await userService.updateAddress(editing._id, form);
        setAddresses((prev) => prev.map((a) => (a._id === editing._id ? data.address : a)));
        toast.success('Address updated.');
      } else {
        const { data } = await userService.addAddress(form);
        setAddresses((prev) => (form.isDefault ? [data.address, ...prev.map((a) => ({ ...a, isDefault: false }))] : [data.address, ...prev]));
        toast.success('Address added.');
      }
      setOpen(false);
      setEditing(null);
      await load();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  const remove = async (address) => {
    if (!window.confirm('Remove this address?')) return;
    setDeletingId(address._id);
    try {
      await userService.deleteAddress(address._id);
      setAddresses((prev) => prev.filter((a) => a._id !== address._id));
      toast.success('Address removed.');
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setDeletingId('');
    }
  };

  if (loading) return <Loader label="Loading addresses..." />;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Saved addresses</h1>
          <p className="mt-1 text-sm text-slate-500">{addresses.length} address(es) available at checkout</p>
        </div>
        <Button size="sm" icon={FiPlus} onClick={() => { setEditing(null); setOpen(true); }}>Add address</Button>
      </div>

      {addresses.length ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {addresses.map((address) => (
            <div key={address._id} className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-600"><FiMapPin className="h-4 w-4" /></span>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{address.label || 'Home'}</p>
                    {address.isDefault && <span className="badge bg-brand-50 text-brand-700">Default</span>}
                  </div>
                </div>
                <div className="flex gap-1">
                  <button type="button" onClick={() => { setEditing(address); setOpen(true); }} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-brand-700" aria-label="Edit address">
                    <FiEdit2 className="h-4 w-4" />
                  </button>
                  <button type="button" onClick={() => remove(address)} disabled={deletingId === address._id} className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-40" aria-label="Delete address">
                    <FiTrash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="mt-4 text-sm text-slate-600">
                <p className="font-semibold text-slate-800">{address.fullName}</p>
                <p className="mt-1 text-xs leading-relaxed">
                  {address.line1}{address.line2 ? `, ${address.line2}` : ''}<br />
                  {address.city}, {address.state} {address.pincode}<br />
                  {address.country}
                </p>
                <p className="mt-2 text-xs font-medium text-slate-500">{address.phone}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={FiMapPin}
          title="No addresses saved"
          description="Add a delivery address to make checkout faster."
          action={<Button icon={FiPlus} onClick={() => setOpen(true)}>Add address</Button>}
        />
      )}

      <Modal
        open={open}
        onClose={() => { setOpen(false); setEditing(null); }}
        title={editing ? 'Edit address' : 'Add address'}
        size="lg"
      >
        <AddressForm initial={editing || {}} onSubmit={save} onCancel={() => { setOpen(false); setEditing(null); }} submitting={submitting} />
      </Modal>
    </div>
  );
};

export default Addresses;
