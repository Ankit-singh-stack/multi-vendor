import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiHeart, FiShoppingCart, FiStar } from 'react-icons/fi';
import { toast } from 'react-toastify';
import useAuth from '../../hooks/useAuth';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { formatPrice, resolveImage } from '../../utils/formatPrice';
import { cn } from '../../utils/classNames';
import { getErrorMessage } from '../../services/api';

const ProductCard = ({ product }) => {
  const { user } = useAuth();
  const { addToCart, mutating } = useCart();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const navigate = useNavigate();
  const [adding, setAdding] = useState(false);
  const [wishBusy, setWishBusy] = useState(false);
  const [imageError, setImageError] = useState(false);

  if (!product) return null;
  const price = product.effectivePrice ?? (product.discountPrice > 0 ? product.discountPrice : product.price);
  const discountPercent =
    product.discountPrice > 0 && product.discountPrice < product.price
      ? Math.round(((product.price - product.discountPrice) / product.price) * 100)
      : 0;
  const wishlisted = isWishlisted(product._id);

  const requireLogin = () => {
    if (!user) {
      toast.info('Please log in to continue.');
      navigate('/login', { state: { from: `/products/${product._id}` } });
      return false;
    }
    return true;
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!requireLogin()) return;
    if (product.stock < 1) return toast.error('This product is out of stock.');
    setAdding(true);
    try {
      await addToCart(product._id, 1);
      toast.success(`${product.name} added to cart`);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setAdding(false);
    }
  };

  const handleWishlist = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!requireLogin()) return;
    setWishBusy(true);
    try {
      const data = await toggleWishlist(product._id);
      toast.success(data.message);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setWishBusy(false);
    }
  };

  return (
    <Link
      to={`/products/${product._id}`}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-card transition duration-300 hover:-translate-y-1 hover:border-brand-200 hover:shadow-soft"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
        <img
          src={imageError ? '/images/product-placeholder.svg' : resolveImage(product.images?.[0]?.url)}
          alt={product.name}
          loading="lazy"
          onError={() => setImageError(true)}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />
        <div className="absolute left-3 top-3 flex flex-col gap-1.5">
          {discountPercent > 0 && (
            <span className="rounded-full bg-rose-500 px-2.5 py-1 text-[11px] font-bold text-white shadow-sm">
              -{discountPercent}%
            </span>
          )}
          {product.isFeatured && (
            <span className="rounded-full bg-accent-400 px-2.5 py-1 text-[11px] font-bold text-slate-900 shadow-sm">
              Featured
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={handleWishlist}
          disabled={wishBusy}
          aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          className={cn(
            'absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/95 shadow-sm backdrop-blur transition hover:scale-105',
            wishlisted ? 'text-rose-500' : 'text-slate-500 hover:text-rose-500'
          )}
        >
          <FiHeart className={cn('h-4.5 w-4.5', wishlisted && 'fill-current')} />
        </button>
        {product.stock < 1 && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/70 backdrop-blur-[1px]">
            <span className="rounded-full bg-slate-900 px-4 py-1.5 text-xs font-semibold text-white">Out of stock</span>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-600">
          {product.category?.name || product.brand || 'MarketSphere'}
        </p>
        <h3 className="mt-1.5 line-clamp-2 min-h-[44px] text-sm font-semibold leading-snug text-slate-900 transition group-hover:text-brand-700">
          {product.name}
        </h3>

        <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
          <span className={cn('flex items-center gap-1 rounded-md bg-emerald-50 px-1.5 py-0.5 font-semibold text-emerald-700')}>
            <FiStar className="h-3 w-3 fill-current" /> {(product.rating || 0).toFixed(1)}
          </span>
          <span>({product.numReviews || 0})</span>
          {product.store?.name && <span className="truncate">· {product.store.name}</span>}
        </div>

        <div className="mt-auto flex items-end justify-between gap-2 pt-4">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg font-bold text-slate-900">{formatPrice(price)}</span>
              {discountPercent > 0 && (
                <span className="text-xs text-slate-400 line-through">{formatPrice(product.price)}</span>
              )}
            </div>
            {product.stock > 0 && product.stock <= 5 && (
              <p className="mt-0.5 text-[11px] font-medium text-amber-600">Only {product.stock} left</p>
            )}
          </div>
          <button
            type="button"
            onClick={handleAdd}
            disabled={adding || product.stock < 1}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white shadow-sm transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            aria-label="Add to cart"
          >
            {adding ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <FiShoppingCart className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
