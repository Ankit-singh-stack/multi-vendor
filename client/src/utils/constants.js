export const ORDER_STATUSES = [
  'Pending',
  'Confirmed',
  'Processing',
  'Ready for Pickup',
  'Assigned',
  'Picked Up',
  'Out for Delivery',
  'Delivered',
  'Cancelled',
  'Returned',
  'Refunded',
];

export const STATUS_STYLES = {
  Pending: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
  Confirmed: 'bg-sky-50 text-sky-700 ring-1 ring-sky-200',
  Processing: 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200',
  'Ready for Pickup': 'bg-violet-50 text-violet-700 ring-1 ring-violet-200',
  Assigned: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200',
  'Picked Up': 'bg-cyan-50 text-cyan-700 ring-1 ring-cyan-200',
  'Out for Delivery': 'bg-teal-50 text-teal-700 ring-1 ring-teal-200',
  Delivered: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  Cancelled: 'bg-rose-50 text-rose-700 ring-1 ring-rose-200',
  Returned: 'bg-orange-50 text-orange-700 ring-1 ring-orange-200',
  Refunded: 'bg-slate-100 text-slate-700 ring-1 ring-slate-300',
};

export const PAYMENT_STATUS_STYLES = {
  paid: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  pending: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
  failed: 'bg-rose-50 text-rose-700 ring-1 ring-rose-200',
  refunded: 'bg-slate-100 text-slate-700 ring-1 ring-slate-300',
  created: 'bg-sky-50 text-sky-700 ring-1 ring-sky-200',
  approved: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  rejected: 'bg-rose-50 text-rose-700 ring-1 ring-rose-200',
  processed: 'bg-brand-50 text-brand-700 ring-1 ring-brand-200',
  settled: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  active: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  inactive: 'bg-slate-100 text-slate-600 ring-1 ring-slate-300',
  draft: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
  blocked: 'bg-rose-50 text-rose-700 ring-1 ring-rose-200',
};

export const ROLE_LABELS = {
  customer: 'Customer',
  seller: 'Seller',
  admin: 'Administrator',
  delivery: 'Delivery Partner',
};

export const ROLE_DASHBOARD = {
  customer: '/dashboard',
  seller: '/seller',
  admin: '/admin',
  delivery: '/delivery',
};

export const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest arrivals' },
  { value: 'price-asc', label: 'Price: low to high' },
  { value: 'price-desc', label: 'Price: high to low' },
  { value: 'rating', label: 'Highest rated' },
  { value: 'popular', label: 'Best selling' },
];

export const SELLER_ORDER_ACTIONS = {
  Pending: [{ status: 'Confirmed', label: 'Accept order', tone: 'primary' }, { status: 'Cancelled', label: 'Reject', tone: 'danger' }],
  Confirmed: [{ status: 'Processing', label: 'Start processing', tone: 'primary' }, { status: 'Cancelled', label: 'Cancel', tone: 'danger' }],
  Processing: [{ status: 'Ready for Pickup', label: 'Ready for pickup', tone: 'primary' }],
};

export const DELIVERY_ORDER_ACTIONS = {
  Assigned: [{ status: 'Picked Up', label: 'Mark picked up' }],
  'Picked Up': [{ status: 'Out for Delivery', label: 'Out for delivery' }],
  'Out for Delivery': [{ status: 'Delivered', label: 'Mark delivered' }],
};
