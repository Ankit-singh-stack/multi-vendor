import { FiInbox } from 'react-icons/fi';

const EmptyState = ({ icon: Icon = FiInbox, title = 'Nothing here yet', description = '', action = null, className = '' }) => (
  <div className={`flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white/70 px-6 py-14 text-center ${className}`}>
    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
      <Icon className="h-7 w-7" />
    </div>
    <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
    {description && <p className="mt-1.5 max-w-md text-sm text-slate-500">{description}</p>}
    {action && <div className="mt-5">{action}</div>}
  </div>
);

export default EmptyState;
