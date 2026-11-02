import { Link } from 'react-router-dom';
import { FiMinus, FiPlus, FiTrash2 } from 'react-icons/fi';
import { formatPrice, resolveImage } from '../../utils/formatPrice';

const CartItem = ({ item, onUpdate, onRemove, busy = false }) => {
  const { product, quantity, price, subtotal, available, maxQuantity } = item;
  if (!product) return null;

  return (
    <div className="flex gap-4 border-b border-slate-100 py-4 last:border-0">
      <Link to={`/products/${product._id}`} className="shrink-0">
        <img
          src={resolveImage(product.images?.[0]?.url)}
          alt={product.name}
          className="h-24 w-24 rounded-xl border border-slate-200 object-cover sm:h-28 sm:w-28"
          onError={(e) => {
            e.currentTarget.src = '/images/product-placeholder.svg';
          }}
        />
      </Link>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <Link to={`/products/${product._id}`} className="line-clamp-2 text-sm font-semibold text-slate-900 hover:text-brand-700">
              {product.name}
            </Link>
            <p className="mt-1 text-xs text-slate-500">
              {product.store?.name || product.seller?.name || 'MarketSphere Seller'}
            </p>
            {!available && <p className="mt-1 text-xs font-semibold text-rose-600">Currently unavailable</p>}
          </div>
          <button
            type="button"
            onClick={() => onRemove(item)}
            disabled={busy}
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 disabled:opacity-40"
            aria-label="Remove item"
          >
            <FiTrash2 className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-auto flex flex-wrap items-end justify-between gap-3 pt-3">
          <div className="flex items-center rounded-lg border border-slate-300 bg-white">
            <button
              type="button"
              onClick={() => onUpdate(item, quantity - 1)}
              disabled={quantity <= 1 || busy}
              className="flex h-8 w-8 items-center justify-center text-slate-500 hover:text-slate-900 disabled:opacity-40"
            >
              <FiMinus className="h-3.5 w-3.5" />
            </button>
            <span className="w-8 text-center text-sm font-semibold">{quantity}</span>
            <button
              type="button"
              onClick={() => onUpdate(item, quantity + 1)}
              disabled={quantity >= (maxQuantity || product.stock) || busy}
              className="flex h-8 w-8 items-center justify-center text-slate-500 hover:text-slate-900 disabled:opacity-40"
            >
              <FiPlus className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="text-right">
            <p className="text-sm font-bold text-slate-900">{formatPrice(subtotal)}</p>
            <p className="text-xs text-slate-500">{formatPrice(price)} each</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartItem;
