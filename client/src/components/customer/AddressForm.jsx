import { useState } from 'react';
import Button from '../common/Button';

const empty = {
  fullName: '',
  phone: '',
  line1: '',
  line2: '',
  city: '',
  state: '',
  pincode: '',
  label: 'Home',
  isDefault: false,
};

const AddressForm = ({ initial = {}, onSubmit, onCancel, submitting = false }) => {
  const [form, setForm] = useState({ ...empty, ...initial });

  const change = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(form);
      }}
      className="space-y-4"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="fullName">Full name</label>
          <input id="fullName" name="fullName" required value={form.fullName} onChange={change} className="input" />
        </div>
        <div>
          <label className="label" htmlFor="phone">Phone number</label>
          <input id="phone" name="phone" required value={form.phone} onChange={change} className="input" placeholder="10-digit number" />
        </div>
      </div>
      <div>
        <label className="label" htmlFor="line1">Address line 1</label>
        <input id="line1" name="line1" required value={form.line1} onChange={change} className="input" placeholder="House / flat / building" />
      </div>
      <div>
        <label className="label" htmlFor="line2">Address line 2 <span className="text-slate-400">(optional)</span></label>
        <input id="line2" name="line2" value={form.line2} onChange={change} className="input" placeholder="Street, area, landmark" />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="label" htmlFor="city">City</label>
          <input id="city" name="city" required value={form.city} onChange={change} className="input" />
        </div>
        <div>
          <label className="label" htmlFor="state">State</label>
          <input id="state" name="state" required value={form.state} onChange={change} className="input" />
        </div>
        <div>
          <label className="label" htmlFor="pincode">Pincode</label>
          <input id="pincode" name="pincode" required value={form.pincode} onChange={change} className="input" />
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <label className="label" htmlFor="label">Label</label>
          <select id="label" name="label" value={form.label} onChange={change} className="input">
            <option value="Home">Home</option>
            <option value="Work">Work</option>
            <option value="Other">Other</option>
          </select>
        </div>
        <label className="flex items-center gap-2 pt-5 text-sm text-slate-600">
          <input type="checkbox" name="isDefault" checked={Boolean(form.isDefault)} onChange={change} className="h-4 w-4 rounded border-slate-300 text-brand-600" />
          Set as default address
        </label>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        {onCancel && <Button type="button" variant="outline" size="sm" onClick={onCancel}>Cancel</Button>}
        <Button type="submit" size="sm" loading={submitting}>Save address</Button>
      </div>
    </form>
  );
};

export default AddressForm;
