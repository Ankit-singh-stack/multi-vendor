import { Link } from 'react-router-dom';
import { FiHeart, FiShoppingCart, FiTrash2 } from 'react-icons/fi';
import { useState } from 'react';
import { toast } from 'react-toastify';
import EmptyState from '../../components/common/EmptyState';
import Button from '../../components/common/Button';
import Loader from '../../components/common/Loader';
import { useWishlist } from '../../context/WishlistContext';
import { useCart } from '../../context/CartContext';
import { formatPrice, resolveImage } from '../../utils/formatPrice';
import { getErrorMessage } from '../../services/api';

const Wishlist = () => {
  const { products, loading, removeFromWishlist } = useWishlist();
  const { addToCart } = useCart();
  const [busyId, setBusyId] = useState('');

  const handleRemove = async (productId) => {
    setBusyId(productId);
    try {
      await removeFromWishlist(productId);
      toast.success('Removed from wishlist.');
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setBusyId('');
    }
  };

  const handleAdd = async (product) => {
    setBusyId(product._id);
    try {
      await addToCart(product._id, 1);
      toast.success(`${product.name} added to cart.`);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setBusyId('');
    }
  };

  if (loading) return <div className="container-page py-10"><Loader label="Loading wishlist..." /></div>;

  return (
    <div className="container-page py-8">
      <div>
        <h1 className="text-2xl font-bold">My wishlist</h1>
        <p className="mt-1 text-sm text-slate-500">{products.length} saved product(s)</p>
      </div>

      {!products.length ? (
        <div className="mt-6">
          <EmptyState
            icon={FiHeart}
            title="Your wishlist is empty"
            description="Tap the heart icon on any product to save it here."
            action={<Button to="/products">Discover products</Button>}
          />
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => {
            const price = product.effectivePrice ?? (product.discountPrice > 0 ? product.discountPrice : product.price);
            return (
              <div key={product._id} className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
                <Link to={`/products/${product._id}`} className="block aspect-[4/3] overflow-hidden bg-slate-100">
                  <img
                    src={resolveImage(product.images?.[0]?.url)}
                    alt={product.name}
                    className="h-full w-full object-cover transition group-hover:scale-105"
                    onError={(e) => {
                      e.currentTarget.src = '/images/product-placeholder.svg';
                    }}
                  />
                </Link>
                <div className="p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-600">{product.category?.name || 'MarketSphere'}</p>
                  <Link to={`/products/${product._id}`} className="mt-1 line-clamp-2 text-sm font-semibold text-slate-900 hover:text-brand-700">
                    {product.name}
                  </Link>
                  <p className="mt-2 text-lg font-bold text-slate-900">{formatPrice(price)}</p>
                  <div className="mt-3 flex gap-2">
                    <Button size="sm" className="flex-1" icon={FiShoppingCart} loading={busyId === product._id} disabled={product.stock < 1} onClick={() => handleAdd(product)}>
                      {product.stock < 1 ? 'Out of stock' : 'Add to cart'}
                    </Button>
                    <button
                      type="button"
                      onClick={() => handleRemove(product._id)}
                      disabled={busyId === product._id}
                      className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-400 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-40"
                      aria-label="Remove from wishlist"
                    >
                      <FiTrash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Wishlist;
