import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiArrowRight, FiFacebook, FiInstagram, FiLinkedin, FiTwitter } from 'react-icons/fi';
import { toast } from 'react-toastify';
import Logo from './Logo';

const Footer = () => {
  const [email, setEmail] = useState('');

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    toast.success('You are subscribed to MarketSphere updates.');
    setEmail('');
  };

  return (
    <footer className="mt-16 bg-slate-950 text-slate-300">
      <div className="container-page py-14">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <Logo light />
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-slate-400">
              A modern multi-vendor marketplace connecting customers with trusted sellers and fast delivery
              partners across India.
            </p>
            <form onSubmit={handleSubscribe} className="mt-6 flex max-w-sm overflow-hidden rounded-xl border border-slate-800 bg-slate-900 p-1">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email for offers & updates"
                className="min-w-0 flex-1 bg-transparent px-3 py-2 text-sm text-white outline-none placeholder:text-slate-500"
              />
              <button type="submit" className="flex items-center gap-1.5 rounded-lg bg-brand-600 px-3.5 py-2 text-sm font-semibold text-white hover:bg-brand-500">
                Join <FiArrowRight />
              </button>
            </form>
            <div className="mt-6 flex gap-2">
              {[FiInstagram, FiTwitter, FiFacebook, FiLinkedin].map((Icon, i) => (
                <span key={i} className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-slate-800 text-slate-400 transition hover:border-brand-500 hover:text-white">
                  <Icon className="h-4 w-4" />
                </span>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-white">Shop</h4>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li><Link to="/products" className="text-slate-400 hover:text-white">All products</Link></li>
              <li><Link to="/categories" className="text-slate-400 hover:text-white">Categories</Link></li>
              <li><Link to="/products?featured=true" className="text-slate-400 hover:text-white">Featured deals</Link></li>
              <li><Link to="/products?sort=popular" className="text-slate-400 hover:text-white">Best sellers</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-white">Account</h4>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li><Link to="/login" className="text-slate-400 hover:text-white">Log in</Link></li>
              <li><Link to="/register" className="text-slate-400 hover:text-white">Create account</Link></li>
              <li><Link to="/orders" className="text-slate-400 hover:text-white">My orders</Link></li>
              <li><Link to="/track-order" className="text-slate-400 hover:text-white">Track order</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-white">MarketSphere</h4>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li><Link to="/about" className="text-slate-400 hover:text-white">About us</Link></li>
              <li><Link to="/contact" className="text-slate-400 hover:text-white">Contact</Link></li>
              <li><Link to="/register?role=seller" className="text-slate-400 hover:text-white">Sell on MarketSphere</Link></li>
              <li><Link to="/register?role=delivery" className="text-slate-400 hover:text-white">Become a delivery partner</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-slate-800 pt-6 text-xs text-slate-500 sm:flex-row">
          <p>© {new Date().getFullYear()} MarketSphere. Built for demonstration purposes.</p>
          <div className="flex gap-5">
            <span>Privacy policy</span>
            <span>Terms of service</span>
            <span>Refund policy</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
