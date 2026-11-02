import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiArrowLeft, FiMail, FiSend } from 'react-icons/fi';
import { toast } from 'react-toastify';
import Button from '../../components/common/Button';
import Logo from '../../components/common/Logo';
import authService from '../../services/authService';
import { getErrorMessage } from '../../services/api';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { data } = await authService.forgotPassword(email);
      setResult(data);
      toast.success(data.message);
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
          <FiMail className="h-6 w-6" />
        </div>
        <h1 className="mt-4 text-2xl font-bold">Forgot your password?</h1>
        <p className="mt-1.5 text-sm text-slate-500">
          Enter the email linked to your account. If it exists, we will send a secure reset link valid for 30 minutes.
        </p>

        {result ? (
          <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
            <p className="font-semibold">Check your inbox</p>
            <p className="mt-1 text-xs leading-relaxed">{result.message}</p>
            {result.devResetUrl && (
              <div className="mt-3 rounded-xl border border-emerald-200 bg-white p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-600">Development mode</p>
                <p className="mt-1 text-xs text-slate-500">SMTP is not configured, so the reset link is shown here:</p>
                <Link to={result.devResetUrl.replace(window.location.origin, '')} className="mt-2 block break-all text-xs font-semibold text-brand-700 underline">
                  {result.devResetUrl}
                </Link>
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="email" className="label">Email address</label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
                placeholder="you@example.com"
              />
            </div>
            <Button type="submit" loading={submitting} className="w-full" size="lg" icon={FiSend}>
              Send reset link
            </Button>
          </form>
        )}

        <Link to="/login" className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-brand-700">
          <FiArrowLeft /> Back to login
        </Link>
      </div>
    </div>
  );
};

export default ForgotPassword;
