import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { FiArrowRight, FiCheckCircle, FiEye, FiEyeOff, FiLock, FiMail, FiPhone, FiTruck, FiUser } from 'react-icons/fi';
import { toast } from 'react-toastify';
import Button from '../../components/common/Button';
import Logo from '../../components/common/Logo';
import useAuth from '../../hooks/useAuth';
import { getErrorMessage } from '../../services/api';
import { ROLE_DASHBOARD } from '../../utils/constants';
import { cn } from '../../utils/classNames';

const roles = [
  { value: 'customer', label: 'Customer', description: 'Shop from trusted sellers', icon: FiUser },
  { value: 'seller', label: 'Seller', description: 'Open your own storefront', icon: FiCheckCircle },
  { value: 'delivery', label: 'Delivery', description: 'Deliver marketplace orders', icon: FiTruck },
];

const Register = () => {
  const { user, register } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialRole = roles.some((r) => r.value === searchParams.get('role')) ? searchParams.get('role') : 'customer';

  const [role, setRole] = useState(initialRole);
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    businessName: '',
    vehicleType: 'bike',
    vehicleNumber: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    document.title = 'Create account · MarketSphere';
    return () => {
      document.title = 'MarketSphere — Shop from trusted sellers';
    };
  }, []);

  useEffect(() => {
    if (user) navigate(ROLE_DASHBOARD[user.role] || '/', { replace: true });
  }, [user, navigate]);

  const handleChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      return toast.error('Passwords do not match.');
    }
    if (form.password.length < 6) {
      return toast.error('Password must be at least 6 characters.');
    }
    setSubmitting(true);
    try {
      const payload = {
        name: form.name,
        email: form.email,
        phone: form.phone,
        password: form.password,
        role,
      };
      if (role === 'seller') payload.businessName = form.businessName;
      if (role === 'delivery') {
        payload.vehicleType = form.vehicleType;
        payload.vehicleNumber = form.vehicleNumber;
      }
      const data = await register(payload);
      if (role === 'seller' || role === 'delivery') {
        toast.success('Application submitted. An administrator will review your account.');
      } else {
        toast.success(`Welcome to MarketSphere, ${data.user.name.split(' ')[0]}!`);
      }
      navigate(ROLE_DASHBOARD[data.user.role] || '/', { replace: true });
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid min-h-[calc(100vh-100px)] lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-brand-950 via-brand-900 to-brand-700 p-10 lg:flex lg:flex-col lg:justify-between">
        <div className="absolute -right-20 top-24 h-72 w-72 rounded-full bg-accent-500/20 blur-3xl" />
        <div className="absolute -left-10 bottom-0 h-80 w-80 rounded-full bg-brand-500/20 blur-3xl" />
        <Logo light />
        <div className="relative max-w-lg">
          <h1 className="text-4xl font-extrabold leading-tight text-white">
            Join a marketplace
            <br />
            built for every role.
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-brand-100/75">
            Create a customer account to shop instantly, or apply as a seller or delivery partner. Applications are
            reviewed by a marketplace administrator before access is granted.
          </p>
          <div className="mt-8 space-y-3">
            {roles.map((item) => (
              <div key={item.value} className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10 text-accent-300">
                  <item.icon className="h-4.5 w-4.5" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-white">{item.label} account</p>
                  <p className="text-xs text-brand-200/70">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <p className="relative text-xs text-brand-200/60">Your password is hashed with bcrypt. Roles are enforced by the API.</p>
      </div>

      <div className="flex items-center justify-center px-4 py-12 sm:px-8">
        <div className="w-full max-w-md">
          <div className="lg:hidden"><Logo /></div>
          <h2 className="mt-8 text-2xl font-bold text-slate-900 lg:mt-0">Create your account</h2>
          <p className="mt-1.5 text-sm text-slate-500">Choose how you want to use MarketSphere.</p>

          <div className="mt-5 grid grid-cols-3 gap-2">
            {roles.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setRole(item.value)}
                  className={cn(
                    'flex flex-col items-center gap-1.5 rounded-xl border px-2 py-3 text-center transition',
                    role === item.value
                      ? 'border-brand-500 bg-brand-50 text-brand-700 ring-2 ring-brand-500/15'
                      : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-xs font-semibold">{item.label}</span>
                </button>
              );
            })}
          </div>

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <div>
              <label htmlFor="name" className="label">Full name</label>
              <input id="name" name="name" required value={form.name} onChange={handleChange} className="input" placeholder="Your full name" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="email" className="label">Email</label>
                <div className="relative">
                  <FiMail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input id="email" name="email" type="email" required value={form.email} onChange={handleChange} className="input pl-10" placeholder="you@example.com" />
                </div>
              </div>
              <div>
                <label htmlFor="phone" className="label">Phone</label>
                <div className="relative">
                  <FiPhone className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input id="phone" name="phone" value={form.phone} onChange={handleChange} className="input pl-10" placeholder="10-digit number" />
                </div>
              </div>
            </div>

            {role === 'seller' && (
              <div>
                <label htmlFor="businessName" className="label">Business / store name</label>
                <input id="businessName" name="businessName" required value={form.businessName} onChange={handleChange} className="input" placeholder="e.g. TechNova Store" />
              </div>
            )}

            {role === 'delivery' && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="vehicleType" className="label">Vehicle type</label>
                  <select id="vehicleType" name="vehicleType" value={form.vehicleType} onChange={handleChange} className="input">
                    <option value="bike">Bike</option>
                    <option value="scooter">Scooter</option>
                    <option value="cycle">Cycle</option>
                    <option value="car">Car</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="vehicleNumber" className="label">Vehicle number</label>
                  <input id="vehicleNumber" name="vehicleNumber" value={form.vehicleNumber} onChange={handleChange} className="input" placeholder="KA01AB1234" />
                </div>
              </div>
            )}

            <div>
              <label htmlFor="password" className="label">Password</label>
              <div className="relative">
                <FiLock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={form.password}
                  onChange={handleChange}
                  className="input pl-10 pr-10"
                  placeholder="At least 6 characters"
                />
                <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                  {showPassword ? <FiEyeOff className="h-4 w-4" /> : <FiEye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div>
              <label htmlFor="confirmPassword" className="label">Confirm password</label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                value={form.confirmPassword}
                onChange={handleChange}
                className="input"
                placeholder="Repeat your password"
              />
            </div>

            <Button type="submit" loading={submitting} size="lg" className="w-full" icon={FiArrowRight}>
              {role === 'customer' ? 'Create account' : 'Submit application'}
            </Button>
          </form>

          <p className="mt-4 text-center text-sm text-slate-500">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-brand-700 hover:text-brand-800">Log in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
