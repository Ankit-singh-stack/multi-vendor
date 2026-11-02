import { Link } from 'react-router-dom';
import { FiArrowRight, FiShoppingCart, FiTrash2 } from 'react-icons/fi';
import { toast } from 'react-toastify';
import CartItem from '../../components/cart/CartItem';
import CartSummary from '../../components/cart/CartSummary';
import EmptyState from '../../components/common/EmptyState';
import Button from '../../components/common/Button';
import Loader from '../../components/common/Loader';
import { useCart } from '../../context/CartContext';
import { getErrorMessage } from '../../services/api';

const Cart = () => {
  const { items, summary, loading, mutating, updateItem, removeItem, clearCart } = useCart();

  const handleUpdate = async (item, quantity) => {
    try {
      await updateItem(item._id, quantity);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const handleRemove = async (item) => {
    try {
      await removeItem(item._id);
      toast.success('Item removed.');
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const handleClear = async () => {
    try {
      await clearCart();
      toast.success('Cart cleared.');
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  if (loading) return <div className="container-page py-10"><Loader label="Loading cart..." /></div>;

  return (
    <div className="container-page py-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Shopping cart</h1>
          <p className="mt-1 text-sm text-slate-500">{summary.itemCount || 0} item(s) from {new Set(items.map((i) => i.product?.seller?._id || i.product?.seller)).size || 0} store(s)</p>
        </div>
        {items.length > 0 && (
          <button type="button" onClick={handleClear} className="inline-flex items-center gap-1.5 text-sm font-semibold text-rose-600 hover:text-rose-700">
            <FiTrash2 className="h-4 w-4" /> Clear cart
          </button>
        )}
      </div>

      {!items.length ? (
        <div className="mt-6">
          <EmptyState
            icon={FiShoppingCart}
            title="Your cart is empty"
            description="Browse the marketplace and add products from your favourite sellers."
            action={<Button to="/products" icon={FiArrowRight}>Start shopping</Button>}
          />
        </div>
      ) : (
        <div className="mt-6 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white px-5 py-2 shadow-card">
              {items.map((item) => (
                <CartItem key={item._id} item={item} onUpdate={handleUpdate} onRemove={handleRemove} busy={mutating} />
              ))}
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-sm">
              <Link to="/products" className="inline-flex items-center gap-1.5 font-semibold text-brand-700">
                <FiArrowRight className="rotate-180" /> Continue shopping
              </Link>
              <p className="text-xs text-slate-500">Delivery is charged per store. Free above ₹{summary.freeDeliveryAbove || 999}.</p>
            </div>
          </div>

          <div>
            <CartSummary summary={summary} showCheckout checkoutDisabled={!items.some((i) => i.available)} />
            {items.some((i) => !i.available) && (
              <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-700">
                Remove unavailable items before checkout.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;
