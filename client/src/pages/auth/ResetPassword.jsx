import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { FiCheckCircle, FiLock } from 'react-icons/fi';
import { toast } from 'react-toastify';
import Button from '../../components/common/Button';
import Logo from '../../components/common/Logo';
import useAuth from '../../hooks/useAuth';
import authService from '../../services/authService';
import { getErrorMessage } from '../../services/api';
import { ROLE_DASHBOARD } from '../../utils/constants';

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { refresh } = useAuth();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirm) return toast.error('Passwords do not match.');
    if (password.length < 6) return toast.error('Password must be at least 6 characters.');
    setSubmitting(true);
    try {
      const { data } = await authService.resetPassword(token, password);
      if (data.token) localStorage.setItem('marketsphere_token', data.token);
      await refresh();
      toast.success('Password reset successfully.');
      navigate(ROLE_DASHBOARD[data.user?.role] || '/', { replace: true });
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-100px)] items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-7 shadow-card sm:p-9">
        <Logo />
        <div className="mt-7 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
          <FiLock className="h-6 w-6" />
        </div>
        <h1 className="mt-4 text-2xl font-bold">Set a new password</h1>
        <p className="mt-1.5 text-sm text-slate-500">Choose a strong password you have not used before.</p>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="password" className="label">New password</label>
            <input id="password" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className="input" placeholder="At least 6 characters" />
          </div>
          <div>
            <label htmlFor="confirm" className="label">Confirm new password</label>
            <input id="confirm" type="password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} className="input" placeholder="Repeat the password" />
          </div>
          <Button type="submit" loading={submitting} className="w-full" size="lg" icon={FiCheckCircle}>
            Reset password
          </Button>
        </form>
        <Link to="/login" className="mt-6 block text-center text-sm font-semibold text-brand-700 hover:text-brand-800">
          Return to login
        </Link>
      </div>
    </div>
  );
};

export default ResetPassword;
