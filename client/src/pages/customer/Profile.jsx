import { useState } from 'react';
import { FiCamera, FiLock, FiMail, FiPhone, FiSave, FiShield, FiUser } from 'react-icons/fi';
import { toast } from 'react-toastify';
import Button from '../../components/common/Button';
import useAuth from '../../hooks/useAuth';
import userService from '../../services/userService';
import { getErrorMessage } from '../../services/api';
import { formatDate, initials, resolveImage } from '../../utils/formatPrice';
import { ROLE_LABELS } from '../../utils/constants';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({ name: user?.name || '', phone: user?.phone || '' });
  const [avatar, setAvatar] = useState(null);
  const [preview, setPreview] = useState(resolveImage(user?.avatar?.url));
  const [savingProfile, setSavingProfile] = useState(false);
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [savingPassword, setSavingPassword] = useState(false);

  const handleAvatar = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatar(file);
    setPreview(URL.createObjectURL(file));
  };

  const saveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const data = new FormData();
      data.append('name', form.name);
      data.append('phone', form.phone);
      if (avatar) data.append('avatar', avatar);
      const response = await userService.updateProfile(data);
      updateUser(response.data.user);
      setAvatar(null);
      toast.success(response.data.message);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSavingProfile(false);
    }
  };

  const savePassword = async (e) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) return toast.error('New passwords do not match.');
    setSavingPassword(true);
    try {
      const { data } = await userService.changePassword({
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
      });
      toast.success(data.message);
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Profile settings</h1>
        <p className="mt-1 text-sm text-slate-500">Manage your personal details and account security.</p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_1.3fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
          <div className="flex items-center gap-4">
            <div className="relative">
              {preview ? (
                <img src={preview} alt={user?.name} className="h-16 w-16 rounded-2xl object-cover" onError={() => setPreview('')} />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-100 text-lg font-bold text-brand-700">{initials(user?.name)}</div>
              )}
              <label className="absolute -bottom-1.5 -right-1.5 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-brand-600 text-white shadow-sm">
                <FiCamera className="h-3.5 w-3.5" />
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatar} />
              </label>
            </div>
            <div>
              <p className="text-base font-bold text-slate-900">{user?.name}</p>
              <p className="text-xs text-slate-500">{user?.email}</p>
              <span className="badge mt-1.5 bg-brand-50 text-brand-700">{ROLE_LABELS[user?.role]}</span>
            </div>
          </div>

          <dl className="mt-5 space-y-3 border-t border-slate-100 pt-4 text-sm">
            <div className="flex items-center justify-between gap-3">
              <dt className="flex items-center gap-2 text-slate-500"><FiMail className="h-4 w-4" /> Email</dt>
              <dd className="truncate font-medium text-slate-800">{user?.email}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="flex items-center gap-2 text-slate-500"><FiPhone className="h-4 w-4" /> Phone</dt>
              <dd className="font-medium text-slate-800">{user?.phone || 'Not added'}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="flex items-center gap-2 text-slate-500"><FiShield className="h-4 w-4" /> Member since</dt>
              <dd className="font-medium text-slate-800">{formatDate(user?.createdAt)}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="flex items-center gap-2 text-slate-500"><FiUser className="h-4 w-4" /> Account</dt>
              <dd className="font-medium text-emerald-600">{user?.isActive ? 'Active' : 'Disabled'}</dd>
            </div>
          </dl>
        </div>

        <div className="space-y-5">
          <form onSubmit={saveProfile} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
            <h2 className="text-base font-semibold">Personal information</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label" htmlFor="name">Full name</label>
                <input id="name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required className="input" />
              </div>
              <div>
                <label className="label" htmlFor="phone">Phone</label>
                <input id="phone" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} className="input" placeholder="10-digit number" />
              </div>
            </div>
            <div className="mt-4">
              <label className="label" htmlFor="email">Email address</label>
              <input id="email" value={user?.email || ''} disabled className="input bg-slate-50" />
              <p className="mt-1 text-[11px] text-slate-400">Email addresses cannot be changed from this page.</p>
            </div>
            <Button type="submit" className="mt-4" loading={savingProfile} icon={FiSave}>Save changes</Button>
          </form>

          <form onSubmit={savePassword} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
            <h2 className="flex items-center gap-2 text-base font-semibold"><FiLock className="h-4 w-4 text-brand-600" /> Change password</h2>
            <div className="mt-4 space-y-3">
              <div>
                <label className="label" htmlFor="currentPassword">Current password</label>
                <input id="currentPassword" type="password" required value={passwords.currentPassword} onChange={(e) => setPasswords((p) => ({ ...p, currentPassword: e.target.value }))} className="input" />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="label" htmlFor="newPassword">New password</label>
                  <input id="newPassword" type="password" required minLength={6} value={passwords.newPassword} onChange={(e) => setPasswords((p) => ({ ...p, newPassword: e.target.value }))} className="input" />
                </div>
                <div>
                  <label className="label" htmlFor="confirmPassword">Confirm password</label>
                  <input id="confirmPassword" type="password" required value={passwords.confirmPassword} onChange={(e) => setPasswords((p) => ({ ...p, confirmPassword: e.target.value }))} className="input" />
                </div>
              </div>
            </div>
            <Button type="submit" variant="outline" className="mt-4" loading={savingPassword}>Update password</Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;
