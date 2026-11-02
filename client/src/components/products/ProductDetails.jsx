import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FiCheckCircle,
  FiChevronRight,
  FiHeart,
  FiMinus,
  FiPlus,
  FiRefreshCw,
  FiShield,
  FiShoppingCart,
  FiStar,
  FiTruck,
} from 'react-icons/fi';
import Button from '../common/Button';
import { formatPrice, resolveImage } from '../../utils/formatPrice';
import { cn } from '../../utils/classNames';

const Stars = ({ rating = 0, size = 'h-4 w-4' }) => (
  <div className="flex items-center gap-0.5 text-amber-400">
    {[1, 2, 3, 4, 5].map((i) => (
      <FiStar key={i} className={cn(size, i <= Math.round(rating) ? 'fill-current' : 'text-slate-300')} />
    ))}
  </div>
);

const ProductDetails = ({
  product,
  quantity,
  setQuantity,
  onAddToCart,
  onBuyNow,
  adding,
  wishlisted,
  onToggleWishlist,
}) => {
  const [activeImage, setActiveImage] = useState(0);
  const images = product.images?.length ? product.images : [{ url: '/images/product-placeholder.svg' }];
  const price = product.effectivePrice ?? (product.discountPrice > 0 ? product.discountPrice : product.price);
  const discountPercent =
    product.discountPrice > 0 && product.discountPrice < product.price
      ? Math.round(((product.price - product.discountPrice) / product.price) * 100)
      : 0;

  return (
    <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
      <div>
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-card">
          <img
            src={resolveImage(images[activeImage]?.url)}
            alt={product.name}
            className="aspect-square w-full object-cover"
            onError={(e) => {
              e.currentTarget.src = '/images/product-placeholder.svg';
            }}
          />
        </div>
        {images.length > 1 && (
          <div className="mt-4 grid grid-cols-5 gap-3">
            {images.map((image, index) => (
              <button
                key={index}
                type="button"
                onClick={() => setActiveImage(index)}
                className={cn(
                  'overflow-hidden rounded-xl border-2 bg-white transition',
                  activeImage === index ? 'border-brand-600' : 'border-transparent hover:border-slate-300'
                )}
              >
                <img src={resolveImage(image.url)} alt={`${product.name} ${index + 1}`} className="aspect-square w-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col">
        <nav className="flex items-center gap-1.5 text-xs text-slate-500">
          <Link to="/" className="hover:text-brand-700">Home</Link>
          <FiChevronRight className="h-3 w-3" />
          <Link to="/products" className="hover:text-brand-700">Products</Link>
          <FiChevronRight className="h-3 w-3" />
          <span className="truncate text-slate-700">{product.category?.name || 'Category'}</span>
        </nav>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          {product.isFeatured && <span className="badge bg-accent-100 text-accent-700">Featured</span>}
          {product.brand && <span className="badge bg-slate-100 text-slate-600">{product.brand}</span>}
          <span className={cn('badge', product.stock > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700')}>
            {product.stock > 0 ? 'In stock' : 'Out of stock'}
          </span>
        </div>

        <h1 className="mt-3 text-2xl font-bold leading-tight text-slate-900 sm:text-3xl">{product.name}</h1>

        <div className="mt-3 flex items-center gap-2">
          <Stars rating={product.rating} />
          <span className="text-sm font-semibold text-slate-700">{Number(product.rating || 0).toFixed(1)}</span>
          <span className="text-sm text-slate-400">({product.numReviews || 0} reviews)</span>
          <span className="text-slate-300">·</span>
          <span className="text-sm text-slate-500">{product.sold || 0} sold</span>
        </div>

        <div className="mt-5 flex flex-wrap items-end gap-3">
          <span className="text-3xl font-extrabold text-slate-900">{formatPrice(price)}</span>
          {discountPercent > 0 && (
            <>
              <span className="text-lg text-slate-400 line-through">{formatPrice(product.price)}</span>
              <span className="badge bg-rose-50 text-rose-600">{discountPercent}% off</span>
            </>
          )}
        </div>
        <p className="mt-1 text-xs text-slate-500">Inclusive of all taxes</p>

        <p className="mt-5 text-sm leading-relaxed text-slate-600">{product.description}</p>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Sold by</p>
              <Link
                to={`/products?seller=${product.seller?._id || ''}`}
                className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-slate-900 hover:text-brand-700"
              >
                <FiCheckCircle className="h-4 w-4 text-emerald-500" />
                {product.store?.name || product.seller?.name || 'MarketSphere Seller'}
              </Link>
            </div>
            <span className="badge bg-white text-slate-600 ring-1 ring-slate-200">Verified seller</span>
          </div>
        </div>

        <div className="mt-6">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center rounded-xl border border-slate-300 bg-white">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={quantity <= 1}
                className="flex h-11 w-10 items-center justify-center text-slate-500 hover:text-slate-900 disabled:opacity-40"
              >
                <FiMinus className="h-4 w-4" />
              </button>
              <span className="w-10 text-center text-sm font-semibold">{quantity}</span>
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.min(product.stock, 10, q + 1))}
                disabled={quantity >= Math.min(product.stock, 10)}
                className="flex h-11 w-10 items-center justify-center text-slate-500 hover:text-slate-900 disabled:opacity-40"
              >
                <FiPlus className="h-4 w-4" />
              </button>
            </div>
            <Button
              size="lg"
              icon={FiShoppingCart}
              loading={adding}
              disabled={product.stock < 1}
              onClick={onAddToCart}
              className="flex-1 sm:flex-none"
            >
              Add to cart
            </Button>
            <Button
              size="lg"
              variant="dark"
              disabled={product.stock < 1}
              onClick={onBuyNow}
              className="flex-1 sm:flex-none"
            >
              Buy now
            </Button>
            <button
              type="button"
              onClick={onToggleWishlist}
              className={cn(
                'flex h-11 w-11 items-center justify-center rounded-xl border transition',
                wishlisted
                  ? 'border-rose-200 bg-rose-50 text-rose-500'
                  : 'border-slate-300 bg-white text-slate-500 hover:border-rose-200 hover:text-rose-500'
              )}
              aria-label="Toggle wishlist"
            >
              <FiHeart className={cn('h-5 w-5', wishlisted && 'fill-current')} />
            </button>
          </div>
          {product.stock > 0 && product.stock <= 5 && (
            <p className="mt-2 text-xs font-medium text-amber-600">Hurry! Only {product.stock} left in stock.</p>
          )}
          {product.stock < 1 && <p className="mt-2 text-xs font-medium text-rose-600">Currently unavailable.</p>}
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-3">
            <FiTruck className="h-5 w-5 text-brand-600" />
            <div>
              <p className="text-xs font-semibold text-slate-800">Fast delivery</p>
              <p className="text-[10px] text-slate-500">2–5 business days</p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-3">
            <FiRefreshCw className="h-5 w-5 text-brand-600" />
            <div>
              <p className="text-xs font-semibold text-slate-800">7-day returns</p>
              <p className="text-[10px] text-slate-500">Easy refund request</p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-3">
            <FiShield className="h-5 w-5 text-brand-600" />
            <div>
              <p className="text-xs font-semibold text-slate-800">Secure payment</p>
              <p className="text-[10px] text-slate-500">Razorpay protected</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export { Stars };
export default ProductDetails;
