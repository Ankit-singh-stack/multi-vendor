import { Link } from 'react-router-dom';
import { FiLoader } from 'react-icons/fi';
import { cn } from '../../utils/classNames';

const variants = {
  primary:
    'bg-brand-600 text-white hover:bg-brand-700 focus-visible:ring-brand-500/40 shadow-sm disabled:bg-brand-300',
  secondary:
    'bg-brand-50 text-brand-700 hover:bg-brand-100 focus-visible:ring-brand-500/30 disabled:text-brand-300',
  outline:
    'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-400 focus-visible:ring-slate-400/30',
  ghost: 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus-visible:ring-slate-400/30',
  danger: 'bg-rose-600 text-white hover:bg-rose-700 focus-visible:ring-rose-500/40 disabled:bg-rose-300',
  success: 'bg-emerald-600 text-white hover:bg-emerald-700 focus-visible:ring-emerald-500/40',
  amber: 'bg-accent-500 text-slate-900 hover:bg-accent-400 focus-visible:ring-accent-500/40',
  dark: 'bg-slate-900 text-white hover:bg-slate-800 focus-visible:ring-slate-500/40',
};

const sizes = {
  xs: 'px-2.5 py-1.5 text-xs gap-1.5',
  sm: 'px-3.5 py-2 text-sm gap-2',
  md: 'px-4 py-2.5 text-sm gap-2',
  lg: 'px-6 py-3 text-base gap-2.5',
};

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  className = '',
  to,
  href,
  icon: Icon,
  type = 'button',
  ...props
}) => {
  const classes = cn(
    'inline-flex items-center justify-center rounded-xl font-semibold transition focus:outline-none focus-visible:ring-4 disabled:cursor-not-allowed',
    variants[variant] || variants.primary,
    sizes[size] || sizes.md,
    className
  );

  const content = (
    <>
      {loading ? <FiLoader className="animate-spin" /> : Icon ? <Icon /> : null}
      {children}
    </>
  );

  if (to) {
    return (
      <Link to={to} className={classes} {...props}>
        {content}
      </Link>
    );
  }
  if (href) {
    return (
      <a href={href} className={classes} {...props}>
        {content}
      </a>
    );
  }
  return (
    <button type={type} disabled={disabled || loading} className={classes} {...props}>
      {content}
    </button>
  );
};

export default Button;
