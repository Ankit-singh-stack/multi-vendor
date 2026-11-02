import { FiCheckCircle } from 'react-icons/fi';
import { STATUS_STYLES } from '../../utils/constants';
import { formatDateTime } from '../../utils/formatPrice';
import { cn } from '../../utils/classNames';

export const OrderStatus = ({ status, className = '' }) => (
  <span className={cn('badge', STATUS_STYLES[status] || 'bg-slate-100 text-slate-600', className)}>
    <span className="h-1.5 w-1.5 rounded-full bg-current" />
    {status || 'Unknown'}
  </span>
);

export const OrderTimeline = ({ tracking = [] }) => {
  if (!tracking.length) return <p className="text-sm text-slate-500">No tracking updates yet.</p>;
  return (
    <ol className="relative ml-2 border-l border-slate-200 pl-6">
      {tracking.map((entry, index) => (
        <li key={`${entry.status}-${index}`} className="relative pb-5 last:pb-0">
          <span
            className={cn(
              'absolute -left-[31px] flex h-3 w-3 items-center justify-center rounded-full border-2 border-white',
              index === tracking.length - 1 ? 'bg-brand-600 ring-2 ring-brand-100' : 'bg-slate-300'
            )}
          />
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-slate-800">{entry.status}</p>
            <span className="text-[11px] text-slate-400">{formatDateTime(entry.at)}</span>
          </div>
          {entry.note && <p className="mt-0.5 text-xs text-slate-500">{entry.note}</p>}
        </li>
      ))}
    </ol>
  );
};

export const DeliveryProgress = ({ status }) => {
  const steps = ['Confirmed', 'Processing', 'Ready for Pickup', 'Assigned', 'Picked Up', 'Out for Delivery', 'Delivered'];
  const idx = steps.indexOf(status);
  return (
    <div className="flex items-center gap-1">
      {steps.map((step, i) => (
        <div key={step} className="flex flex-1 items-center gap-1">
          <div className={cn('flex h-6 w-6 items-center justify-center rounded-full text-[10px]', i <= idx ? 'bg-brand-600 text-white' : 'bg-slate-200 text-slate-500')}>
            {i < idx ? <FiCheckCircle className="h-3.5 w-3.5" /> : i + 1}
          </div>
          {i < steps.length - 1 && <div className={cn('h-0.5 flex-1', i < idx ? 'bg-brand-500' : 'bg-slate-200')} />}
        </div>
      ))}
    </div>
  );
};

export default OrderStatus;
