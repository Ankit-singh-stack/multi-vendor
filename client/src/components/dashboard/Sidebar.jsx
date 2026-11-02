import { NavLink, useNavigate } from 'react-router-dom';
import {
  FiBarChart2,
  FiBox,
  FiCreditCard,
  FiDollarSign,
  FiGrid,
  FiHeart,
  FiHome,
  FiLayers,
  FiList,
  FiLogOut,
  FiMapPin,
  FiPackage,
  FiPercent,
  FiSettings,
  FiShoppingBag,
  FiShoppingCart,
  FiStar,
  FiTag,
  FiTruck,
  FiUser,
  FiUsers,
  FiX,
} from 'react-icons/fi';
import Logo from '../common/Logo';
import useAuth from '../../hooks/useAuth';
import { ROLE_LABELS } from '../../utils/constants';
import { initials } from '../../utils/formatPrice';
import { cn } from '../../utils/classNames';

export const roleMenus = {
  customer: [
    { to: '/dashboard', label: 'Overview', icon: FiGrid, end: true },
    { to: '/dashboard/orders', label: 'My orders', icon: FiPackage },
    { to: '/wishlist', label: 'Wishlist', icon: FiHeart },
    { to: '/cart', label: 'Cart', icon: FiShoppingCart },
    { to: '/dashboard/addresses', label: 'Addresses', icon: FiMapPin },
    { to: '/dashboard/profile', label: 'Profile', icon: FiUser },
  ],
  seller: [
    { to: '/seller', label: 'Overview', icon: FiGrid, end: true },
    { to: '/seller/products/add', label: 'Add product', icon: FiBox },
    { to: '/seller/products', label: 'Manage products', icon: FiShoppingBag },
    { to: '/seller/inventory', label: 'Inventory', icon: FiLayers },
    { to: '/seller/orders', label: 'Orders', icon: FiPackage },
    { to: '/seller/analytics', label: 'Sales analytics', icon: FiBarChart2 },
    { to: '/seller/commissions', label: 'Commissions', icon: FiPercent },
    { to: '/seller/payouts', label: 'Payouts', icon: FiDollarSign },
    { to: '/seller/reviews', label: 'Reviews', icon: FiStar },
    { to: '/seller/settings', label: 'Store settings', icon: FiSettings },
  ],
  admin: [
    { to: '/admin', label: 'Overview', icon: FiGrid, end: true },
    { to: '/admin/users', label: 'Users', icon: FiUsers },
    { to: '/admin/sellers', label: 'Sellers', icon: FiShoppingBag },
    { to: '/admin/products', label: 'Products', icon: FiBox },
    { to: '/admin/orders', label: 'Orders', icon: FiPackage },
    { to: '/admin/categories', label: 'Categories', icon: FiList },
    { to: '/admin/payments', label: 'Payments', icon: FiCreditCard },
    { to: '/admin/refunds', label: 'Refunds', icon: FiDollarSign },
    { to: '/admin/delivery-partners', label: 'Delivery partners', icon: FiTruck },
    { to: '/admin/commissions', label: 'Commissions', icon: FiPercent },
    { to: '/admin/analytics', label: 'Analytics', icon: FiBarChart2 },
    { to: '/admin/coupons', label: 'Coupons', icon: FiTag },
    { to: '/admin/settings', label: 'Settings', icon: FiSettings },
  ],
  delivery: [
    { to: '/delivery', label: 'Overview', icon: FiGrid, end: true },
    { to: '/delivery/orders', label: 'Assigned orders', icon: FiPackage },
    { to: '/delivery/history', label: 'Delivery history', icon: FiList },
    { to: '/delivery/earnings', label: 'Earnings', icon: FiDollarSign },
    { to: '/delivery/profile', label: 'Profile', icon: FiUser },
  ],
};

const Sidebar = ({ open, onClose }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const menu = roleMenus[user?.role] || [];
  const settingsPath =
    user?.role === 'customer' ? '/profile' : user?.role === 'seller' ? '/seller/settings' : user?.role === 'delivery' ? '/delivery/profile' : '/admin';

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <>
      {open && <div className="fixed inset-0 z-40 bg-slate-900/40 lg:hidden" onClick={onClose} />}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform duration-300 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <Logo />
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 lg:hidden">
            <FiX className="h-5 w-5" />
          </button>
        </div>

        <div className="border-b border-slate-100 px-4 py-4">
          <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-100 text-xs font-bold text-brand-700">
              {initials(user?.name)}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-900">{user?.name}</p>
              <p className="text-[11px] font-medium text-brand-600">{ROLE_LABELS[user?.role]}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {menu.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={onClose}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition',
                    isActive
                      ? 'bg-brand-600 text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  )
                }
              >
                <Icon className="h-4 w-4 shrink-0" />
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        <div className="border-t border-slate-100 p-3">
          <NavLink to="/" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50">
            <FiHome className="h-4 w-4" /> Back to store
          </NavLink>
          <NavLink to={settingsPath} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50">
            <FiSettings className="h-4 w-4" /> Account settings
          </NavLink>
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-rose-600 hover:bg-rose-50"
          >
            <FiLogOut className="h-4 w-4" /> Log out
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
