import { FiArrowRight, FiShield, FiTruck } from 'react-icons/fi';
import Button from '../common/Button';
import { formatPrice } from '../../utils/formatPrice';

const Row = ({ label, value, muted = false, strong = false }) => (
  <div className={`flex items-center justify-between ${muted ? 'text-slate-500' : 'text-slate-700'}`}>
    <span className={strong ? 'font-semibold text-slate-900' : 'text-sm'}>{label}</span>
    <span className={strong ? 'text-lg font-bold text-slate-900' : 'text-sm font-medium'}>{value}</span>
  </div>
);

const CartSummary = ({
  summary = {},
  title = 'Order summary',
  children,
  footer,
  showCheckout = false,
  checkoutTo = '/checkout',
  checkoutDisabled = false,
  checkoutLabel = 'Proceed to checkout',
}) => {
  const delivery = summary.deliveryTotal ?? 0;
  const itemsTotal = summary.itemsTotal ?? 0;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
      <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      <div className="mt-4 space-y-3">
        <Row label={`Subtotal (${summary.itemCount || 0} items)`} value={formatPrice(itemsTotal)} />
        <Row label="Estimated delivery" value={delivery === 0 ? 'Free' : formatPrice(delivery)} muted />
        {summary.freeDeliveryAbove && itemsTotal < summary.freeDeliveryAbove && (
          <p className="rounded-lg bg-brand-50 px-3 py-2 text-xs text-brand-700">
            Add {formatPrice(summary.freeDeliveryAbove - itemsTotal)} more to unlock free delivery per store.
          </p>
        )}
        {children}
        <div className="border-t border-dashed border-slate-200 pt-3">
          <Row label="Estimated total" value={formatPrice(itemsTotal + delivery)} strong />
          <p className="mt-1 text-[11px] text-slate-400">Taxes and discounts are calculated at checkout.</p>
        </div>
      </div>

      {showCheckout && (
        <Button
          to={checkoutDisabled ? undefined : checkoutTo}
          disabled={checkoutDisabled}
          className="mt-5 w-full"
          size="lg"
          icon={FiArrowRight}
        >
          {checkoutLabel}
        </Button>
      )}
      {footer}
      <div className="mt-4 space-y-2 border-t border-slate-100 pt-4 text-xs text-slate-500">
        <p className="flex items-center gap-2"><FiShield className="h-4 w-4 text-emerald-500" /> Secure encrypted checkout</p>
        <p className="flex items-center gap-2"><FiTruck className="h-4 w-4 text-brand-500" /> Tracked delivery by verified partners</p>
      </div>
    </div>
  );
};

export default CartSummary;
