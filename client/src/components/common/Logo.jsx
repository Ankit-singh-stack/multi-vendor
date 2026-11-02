import { Link } from 'react-router-dom';
import { FiGlobe } from 'react-icons/fi';
import { cn } from '../../utils/classNames';

const Logo = ({ to = '/', light = false, className = '' }) => (
  <Link to={to} className={cn('group inline-flex items-center gap-2.5', className)}>
    <span className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-800 text-white shadow-soft">
      <FiGlobe className="h-5 w-5" />
      <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-accent-400" />
    </span>
    <span className="flex flex-col leading-none">
      <span className={cn('font-display text-lg font-extrabold tracking-tight', light ? 'text-white' : 'text-slate-900')}>
        Market<span className="text-brand-600">Sphere</span>
      </span>
      <span className={cn('mt-0.5 text-[9px] font-semibold uppercase tracking-[0.18em]', light ? 'text-slate-400' : 'text-slate-400')}>
        Multi-vendor market
      </span>
    </span>
  </Link>
);

export default Logo;
