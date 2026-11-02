import { Link } from 'react-router-dom';
import { FiBell, FiExternalLink, FiMenu } from 'react-icons/fi';
import useAuth from '../../hooks/useAuth';
import { ROLE_LABELS } from '../../utils/constants';
import { initials } from '../../utils/formatPrice';

const DashboardHeader = ({ title, subtitle, onMenu, actions }) => {
  const { user } = useAuth();
  const settingsPath =
    user?.role === 'customer'
      ? '/profile'
      : user?.role === 'seller'
        ? '/seller/settings'
        : user?.role === 'delivery'
          ? '/delivery/profile'
          : '/admin';

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={onMenu}
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
          aria-label="Open sidebar"
        >
          <FiMenu className="h-5 w-5" />
        </button>
        <div className="min-w-0">
          <h1 className="truncate text-lg font-bold text-slate-900">{title}</h1>
          {subtitle && <p className="hidden truncate text-xs text-slate-500 sm:block">{subtitle}</p>}
        </div>

        <div className="ml-auto flex items-center gap-2">
          {actions}
          <Link
            to="/"
            className="hidden items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 sm:flex"
          >
            <FiExternalLink className="h-3.5 w-3.5" /> Storefront
          </Link>
          <span className="hidden h-8 w-px bg-slate-200 sm:block" />
          <Link to={settingsPath} className="flex items-center gap-2 rounded-xl p-1 transition hover:bg-slate-50">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-100 text-[11px] font-bold text-brand-700">
              {initials(user?.name)}
            </span>
            <span className="hidden text-left xl:block">
              <span className="block max-w-[120px] truncate text-xs font-semibold text-slate-800">{user?.name}</span>
              <span className="block text-[10px] text-slate-500">{ROLE_LABELS[user?.role]}</span>
            </span>
          </Link>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
