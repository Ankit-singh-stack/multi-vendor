import { cn } from '../../utils/classNames';

const tones = {
  brand: 'bg-brand-50 text-brand-600',
  emerald: 'bg-emerald-50 text-emerald-600',
  amber: 'bg-amber-50 text-amber-600',
  rose: 'bg-rose-50 text-rose-600',
  sky: 'bg-sky-50 text-sky-600',
  violet: 'bg-violet-50 text-violet-600',
  slate: 'bg-slate-100 text-slate-600',
};

const StatsCard = ({ icon: Icon, label, value, hint, tone = 'brand', trend, className = '' }) => (
  <div className={cn('rounded-2xl border border-slate-200 bg-white p-5 shadow-card', className)}>
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
        <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
        {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
      </div>
      {Icon && (
        <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', tones[tone] || tones.brand)}>
          <Icon className="h-5 w-5" />
        </span>
      )}
    </div>
    {trend && <p className="mt-3 text-xs font-medium text-emerald-600">{trend}</p>}
  </div>
);

export default StatsCard;
