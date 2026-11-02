import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FiArrowRight, FiCheckCircle, FiEye, FiEyeOff, FiLock, FiMail, FiShield, FiShoppingBag } from 'react-icons/fi';
import { toast } from 'react-toastify';
import Button from '../../components/common/Button';
import Logo from '../../components/common/Logo';
import useAuth from '../../hooks/useAuth';
import { getErrorMessage } from '../../services/api';
import { ROLE_DASHBOARD } from '../../utils/constants';

const demoAccounts = [
  { label: 'Customer', email: 'customer@marketsphere.test', password: 'Customer@123' },
  { label: 'Seller', email: 'seller@marketsphere.test', password: 'Seller@123' },
  { label: 'Admin', email: 'admin@marketsphere.test', password: 'Admin@123' },
  { label: 'Delivery', email: 'delivery@marketsphere.test', password: 'Delivery@123' },
];

const Login = () => {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const redirectAfterLogin = (loggedInUser) => {
    const from = location.state?.from;
    navigate(from && !from.startsWith('/login') ? from : ROLE_DASHBOARD[loggedInUser.role] || '/', { replace: true });
  };

  useEffect(() => {
    if (user) navigate(ROLE_DASHBOARD[user.role] || '/', { replace: true });
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const data = await login(form);
      toast.success(`Welcome back, ${data.user.name.split(' ')[0]}!`);
      redirectAfterLogin(data.user);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  const fillDemo = (account) => {
    setForm({ email: account.email, password: account.password });
    toast.info(`${account.label} demo credentials filled. Click Log in.`);
  };

  return (
    <div className="grid min-h-[calc(100vh-100px)] lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-brand-950 via-brand-900 to-brand-700 p-10 lg:flex lg:flex-col lg:justify-between">
        <div className="absolute -left-20 top-20 h-72 w-72 rounded-full bg-brand-500/20 blur-3xl" />
        <div className="absolute -right-10 bottom-0 h-80 w-80 rounded-full bg-accent-500/20 blur-3xl" />
        <Logo light />
        <div className="relative max-w-lg">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold text-brand-100">
            <FiShield className="h-3.5 w-3.5 text-accent-300" /> Secure role-based access
          </span>
          <h1 className="mt-5 text-4xl font-extrabold leading-tight text-white">
            One account.
            <br />
            Your own marketplace workspace.
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-brand-100/75">
            Customers, sellers, administrators and delivery partners each get a dedicated dashboard with the right
            permissions — protected by JWT authentication.
          </p>
          <div className="mt-8 grid grid-cols-2 gap-3">
            {[
              'Customer storefront',
              'Seller order management',
              'Admin marketplace control',
              'Delivery fulfilment',
            ].map((item) => (
              <div key={item} className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-xs text-brand-100">
                <FiCheckCircle className="h-4 w-4 shrink-0 text-emerald-400" /> {item}
              </div>
            ))}
          </div>
        </div>
        <p className="relative text-xs text-brand-200/60">© {new Date().getFullYear()} MarketSphere · Intermediate MERN project</p>
      </div>

      <div className="flex items-center justify-center px-4 py-12 sm:px-8">
        <div className="w-full max-w-md">
          <div className="lg:hidden"><Logo /></div>
          <h2 className="mt-8 text-2xl font-bold text-slate-900 lg:mt-0">Welcome back</h2>
          <p className="mt-1.5 text-sm text-slate-500">Log in to manage your orders, store or deliveries.</p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="email" className="label">Email address</label>
              <div className="relative">
                <FiMail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  className="input pl-10"
                  placeholder="you@example.com"
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="label">Password</label>
                <Link to="/forgot-password" className="mb-1.5 text-xs font-semibold text-brand-700 hover:text-brand-800">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <FiLock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  className="input pl-10 pr-10"
                  placeholder="Your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <FiEyeOff className="h-4 w-4" /> : <FiEye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <Button type="submit" loading={submitting} size="lg" className="w-full" icon={FiArrowRight}>
              Log in
            </Button>
          </form>

          <p className="mt-5 text-center text-sm text-slate-500">
            New to MarketSphere?{' '}
            <Link to="/register" className="font-semibold text-brand-700 hover:text-brand-800">Create an account</Link>
          </p>

          <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <FiShoppingBag className="h-3.5 w-3.5" /> Demo accounts
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {demoAccounts.map((account) => (
                <button
                  key={account.label}
                  type="button"
                  onClick={() => fillDemo(account)}
                  className="rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-left text-xs transition hover:border-brand-300 hover:bg-brand-50"
                >
                  <span className="block font-semibold text-slate-800">{account.label}</span>
                  <span className="block truncate text-[10px] text-slate-500">{account.email}</span>
                </button>
              ))}
            </div>
            <p className="mt-2 text-[10px] text-slate-400">All demo passwords follow the pattern Role@123.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
