import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  FiChevronDown,
  FiGrid,
  FiHeart,
  FiLogOut,
  FiMenu,
  FiPackage,
  FiSearch,
  FiShoppingCart,
  FiUser,
  FiX,
} from 'react-icons/fi';
import Logo from './Logo';
import useAuth from '../../hooks/useAuth';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { ROLE_DASHBOARD, ROLE_LABELS } from '../../utils/constants';
import { initials } from '../../utils/formatPrice';
import { cn } from '../../utils/classNames';

const navLinks = [
  { to: '/products', label: 'Shop all' },
  { to: '/categories', label: 'Categories' },
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' },
];

const Navbar = () => {
  const { user, logout } = useAuth();
  const { itemCount } = useCart();
  const { count: wishlistCount } = useWishlist();
  const navigate = useNavigate();
  const location = useLocation();
  const [query, setQuery] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

  useEffect(() => {
    setMenuOpen(false);
    setUserMenuOpen(false);
    const params = new URLSearchParams(location.search);
    setQuery(params.get('q') || '');
  }, [location.pathname, location.search]);

  useEffect(() => {
    const onClick = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setUserMenuOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    const trimmed = query.trim();
    navigate(trimmed ? `/products?q=${encodeURIComponent(trimmed)}` : '/products');
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const dashboard = ROLE_DASHBOARD[user?.role] || '/';

  return (
    <header className="sticky top-0 z-40">
      <div className="bg-gradient-to-r from-brand-900 via-brand-800 to-brand-700 px-4 py-1.5 text-center text-[11px] font-medium text-brand-100 sm:text-xs">
        Free delivery on orders above ₹999 · Secure Razorpay payments · Easy returns
      </div>
      <div className="border-b border-slate-200/80 bg-white/95 backdrop-blur">
        <div className="container-page flex h-16 items-center gap-3 lg:h-[72px]">
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
            aria-label="Open menu"
          >
            <FiMenu className="h-5 w-5" />
          </button>

          <Logo />

          <form onSubmit={handleSearch} className="relative ml-4 hidden flex-1 md:block lg:ml-8">
            <FiSearch className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search products, brands and categories..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-11 pr-24 text-sm outline-none transition focus:border-brand-400 focus:bg-white focus:ring-4 focus:ring-brand-500/10"
            />
            <button
              type="submit"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-700"
            >
              Search
            </button>
          </form>

          <nav className="ml-auto hidden items-center gap-1 xl:flex">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  cn(
                    'rounded-lg px-3 py-2 text-sm font-medium transition',
                    isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  )
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-1.5 xl:ml-3">
            <Link
              to="/wishlist"
              className="relative rounded-xl p-2.5 text-slate-600 transition hover:bg-slate-100 hover:text-rose-600"
              aria-label="Wishlist"
            >
              <FiHeart className="h-5 w-5" />
              {wishlistCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
                  {wishlistCount}
                </span>
              )}
            </Link>
            <Link
              to="/cart"
              className="relative rounded-xl p-2.5 text-slate-600 transition hover:bg-slate-100 hover:text-brand-700"
              aria-label="Cart"
            >
              <FiShoppingCart className="h-5 w-5" />
              {itemCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-600 px-1 text-[10px] font-bold text-white">
                  {itemCount > 9 ? '9+' : itemCount}
                </span>
              )}
            </Link>

            {user ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  type="button"
                  onClick={() => setUserMenuOpen((v) => !v)}
                  className="flex items-center gap-2 rounded-xl border border-slate-200 py-1.5 pl-1.5 pr-2.5 transition hover:border-slate-300 hover:bg-slate-50"
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-100 text-xs font-bold text-brand-700">
                    {initials(user.name)}
                  </span>
                  <span className="hidden text-sm font-semibold text-slate-700 sm:block">{user.name.split(' ')[0]}</span>
                  <FiChevronDown className="h-3.5 w-3.5 text-slate-400" />
                </button>
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-60 overflow-hidden rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl animate-fade-in">
                    <div className="border-b border-slate-100 px-3 py-2.5">
                      <p className="truncate text-sm font-semibold text-slate-900">{user.name}</p>
                      <p className="truncate text-xs text-slate-500">{user.email}</p>
                      <span className="badge mt-2 bg-brand-50 text-brand-700">{ROLE_LABELS[user.role]}</span>
                    </div>
                    <Link to={dashboard} className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
                      <FiGrid className="h-4 w-4 text-slate-400" /> Dashboard
                    </Link>
                    {user.role === 'customer' && (
                      <>
                        <Link to="/orders" className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
                          <FiPackage className="h-4 w-4 text-slate-400" /> My orders
                        </Link>
                        <Link to="/profile" className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
                          <FiUser className="h-4 w-4 text-slate-400" /> Profile
                        </Link>
                      </>
                    )}
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-rose-600 hover:bg-rose-50"
                    >
                      <FiLogOut className="h-4 w-4" /> Log out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="hidden items-center gap-2 sm:flex">
                <Link to="/login" className="rounded-xl px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100">
                  Log in
                </Link>
                <Link
                  to="/register"
                  className="rounded-xl bg-brand-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700"
                >
                  Sign up
                </Link>
              </div>
            )}
          </div>
        </div>

        <form onSubmit={handleSearch} className="container-page pb-3 md:hidden">
          <div className="relative">
            <FiSearch className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search products..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-brand-400 focus:bg-white"
            />
          </div>
        </form>
      </div>

      {menuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/40" onClick={() => setMenuOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-[82%] max-w-sm overflow-y-auto bg-white p-5 shadow-2xl animate-slide-in">
            <div className="flex items-center justify-between">
              <Logo />
              <button type="button" onClick={() => setMenuOpen(false)} className="rounded-lg p-2 hover:bg-slate-100">
                <FiX className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-6 space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="block rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  {link.label}
                </Link>
              ))}
              <Link to="/wishlist" className="block rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                Wishlist ({wishlistCount})
              </Link>
              <Link to="/cart" className="block rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                Cart ({itemCount})
              </Link>
            </div>
            <div className="mt-6 border-t border-slate-100 pt-5">
              {user ? (
                <div className="space-y-2">
                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-sm font-semibold text-slate-900">{user.name}</p>
                    <p className="text-xs text-slate-500">{ROLE_LABELS[user.role]}</p>
                  </div>
                  <Link to={dashboard} className="block rounded-xl bg-brand-600 px-3 py-2.5 text-center text-sm font-semibold text-white">
                    Go to dashboard
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full rounded-xl border border-rose-200 px-3 py-2.5 text-sm font-semibold text-rose-600"
                  >
                    Log out
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <Link to="/login" className="rounded-xl border border-slate-300 px-3 py-2.5 text-center text-sm font-semibold text-slate-700">
                    Log in
                  </Link>
                  <Link to="/register" className="rounded-xl bg-brand-600 px-3 py-2.5 text-center text-sm font-semibold text-white">
                    Sign up
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
