import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { FiEdit3, FiPackage, FiStar } from 'react-icons/fi';
import { toast } from 'react-toastify';
import ProductDetailsComponent, { Stars } from '../../components/products/ProductDetails';
import ProductList from '../../components/products/ProductList';
import Loader from '../../components/common/Loader';
import Button from '../../components/common/Button';
import EmptyState from '../../components/common/EmptyState';
import useAuth from '../../hooks/useAuth';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import productService from '../../services/productService';
import { getErrorMessage } from '../../services/api';
import { formatDate, resolveImage } from '../../utils/formatPrice';

const TABS = [
  { key: 'description', label: 'Description' },
  { key: 'reviews', label: 'Reviews' },
  { key: 'shipping', label: 'Shipping & returns' },
];

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const { isWishlisted, toggleWishlist } = useWishlist();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [tab, setTab] = useState('description');
  const [reviews, setReviews] = useState([]);
  const [reviewMeta, setReviewMeta] = useState({ distribution: {}, total: 0 });
  const [related, setRelated] = useState([]);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [submittingReview, setSubmittingReview] = useState(false);

  const loadReviews = async (productId) => {
    try {
      const { data } = await productService.getReviews(productId);
      setReviews(data.reviews || []);
      setReviewMeta({ distribution: data.distribution || {}, total: data.pagination?.total || 0 });
    } catch (error) {
      setReviews([]);
    }
  };

  useEffect(() => {
    let active = true;
    setLoading(true);
    setNotFound(false);
    setQuantity(1);
    productService
      .getProduct(id)
      .then(({ data }) => {
        if (!active) return;
        setProduct(data.product);
        loadReviews(data.product._id);
        return productService.getProducts({ category: data.product.category?._id, limit: 5 });
      })
      .then((res) => {
        if (res && active) setRelated((res.data.products || []).filter((p) => p._id !== id).slice(0, 4));
      })
      .catch((err) => {
        if (active) {
          if (err?.response?.status === 404) setNotFound(true);
          else toast.error(getErrorMessage(err));
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id]);

  const requireLogin = () => {
    if (!user) {
      toast.info('Please log in to continue.');
      navigate('/login', { state: { from: `/products/${id}` } });
      return false;
    }
    return true;
  };

  const handleAdd = async () => {
    if (!requireLogin()) return;
    setAdding(true);
    try {
      await addToCart(product._id, quantity);
      toast.success('Added to cart.');
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setAdding(false);
    }
  };

  const handleBuyNow = async () => {
    if (!requireLogin()) return;
    setAdding(true);
    try {
      await addToCart(product._id, quantity);
      navigate('/checkout');
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setAdding(false);
    }
  };

  const handleWishlist = async () => {
    if (!requireLogin()) return;
    try {
      const data = await toggleWishlist(product._id);
      toast.success(data.message);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const submitReview = async (e) => {
    e.preventDefault();
    if (!requireLogin()) return;
    setSubmittingReview(true);
    try {
      await productService.createReview({
        productId: product._id,
        rating: reviewForm.rating,
        comment: reviewForm.comment,
      });
      toast.success('Review submitted.');
      setReviewForm({ rating: 5, comment: '' });
      await loadReviews(product._id);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) return <Loader fullPage label="Loading product..." />;
  if (notFound || !product) {
    return (
      <div className="container-page py-16">
        <EmptyState
          icon={FiPackage}
          title="Product not found"
          description="This product may have been removed or is no longer available."
          action={<Button to="/products">Browse products</Button>}
        />
      </div>
    );
  }

  const wishlisted = isWishlisted(product._id);
  const totalReviews = reviewMeta.total || product.numReviews || 0;
  const distribution = reviewMeta.distribution || {};

  return (
    <div className="container-page py-8">
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-card sm:p-8">
        <ProductDetailsComponent
          product={product}
          quantity={quantity}
          setQuantity={setQuantity}
          onAddToCart={handleAdd}
          onBuyNow={handleBuyNow}
          adding={adding}
          wishlisted={wishlisted}
          onToggleWishlist={handleWishlist}
        />
      </div>

      <div className="mt-8 rounded-3xl border border-slate-200 bg-white shadow-card">
        <div className="flex overflow-x-auto border-b border-slate-100 px-4 sm:px-6">
          {TABS.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setTab(item.key)}
              className={`whitespace-nowrap border-b-2 px-4 py-4 text-sm font-semibold transition ${
                tab === item.key ? 'border-brand-600 text-brand-700' : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              {item.label}
              {item.key === 'reviews' && <span className="ml-1.5 text-xs text-slate-400">({totalReviews})</span>}
            </button>
          ))}
        </div>

        <div className="p-5 sm:p-6">
          {tab === 'description' && (
            <div className="max-w-3xl">
              <h2 className="text-lg font-semibold">About this product</h2>
              <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-slate-600">{product.description}</p>
              {product.tags?.length > 0 && (
                <div className="mt-5 flex flex-wrap gap-2">
                  {product.tags.map((tag) => (
                    <Link key={tag} to={`/products?q=${tag}`} className="badge bg-slate-100 text-slate-600 hover:bg-brand-50 hover:text-brand-700">
                      #{tag}
                    </Link>
                  ))}
                </div>
              )}
              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs text-slate-500">Brand</p>
                  <p className="mt-1 text-sm font-semibold">{product.brand || '—'}</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs text-slate-500">Category</p>
                  <p className="mt-1 text-sm font-semibold">{product.category?.name || '—'}</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs text-slate-500">Sold by</p>
                  <p className="mt-1 text-sm font-semibold">{product.store?.name || product.seller?.name || '—'}</p>
                </div>
              </div>
            </div>
          )}

          {tab === 'reviews' && (
            <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
              <div>
                <div className="rounded-2xl bg-slate-50 p-5 text-center">
                  <p className="text-4xl font-extrabold text-slate-900">{Number(product.rating || 0).toFixed(1)}</p>
                  <div className="mt-2 flex justify-center"><Stars rating={product.rating} /></div>
                  <p className="mt-1 text-xs text-slate-500">{totalReviews} verified reviews</p>
                </div>
                <div className="mt-4 space-y-2">
                  {[5, 4, 3, 2, 1].map((star) => {
                    const count = distribution[star] || 0;
                    const pct = totalReviews ? Math.round((count / totalReviews) * 100) : 0;
                    return (
                      <div key={star} className="flex items-center gap-2 text-xs">
                        <span className="w-6 text-slate-500">{star}★</span>
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                          <div className="h-full rounded-full bg-amber-400" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="w-6 text-right text-slate-400">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                {user ? (
                  <form onSubmit={submitReview} className="rounded-2xl border border-slate-200 bg-white p-5">
                    <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                      <FiEdit3 /> Write a review
                    </h3>
                    <p className="mt-1 text-xs text-slate-500">You can review products from delivered orders.</p>
                    <div className="mt-3 flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setReviewForm((f) => ({ ...f, rating: star }))}
                          className="p-0.5"
                        >
                          <FiStar className={`h-6 w-6 ${star <= reviewForm.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} />
                        </button>
                      ))}
                    </div>
                    <textarea
                      required
                      minLength={3}
                      rows={3}
                      value={reviewForm.comment}
                      onChange={(e) => setReviewForm((f) => ({ ...f, comment: e.target.value }))}
                      placeholder="Share your experience with this product..."
                      className="input mt-3"
                    />
                    <Button type="submit" size="sm" className="mt-3" loading={submittingReview}>
                      Submit review
                    </Button>
                  </form>
                ) : (
                  <div className="rounded-2xl bg-brand-50 p-5 text-sm text-brand-800">
                    <Link to="/login" className="font-semibold underline">Log in</Link> to leave a review after your order is delivered.
                  </div>
                )}

                <div className="mt-5 space-y-4">
                  {reviews.length ? (
                    reviews.map((review) => (
                      <div key={review._id} className="rounded-2xl border border-slate-100 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2.5">
                            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">
                              {review.user?.name?.[0]?.toUpperCase() || 'U'}
                            </span>
                            <div>
                              <p className="text-sm font-semibold text-slate-800">{review.user?.name || 'Customer'}</p>
                              <p className="text-[11px] text-slate-400">{formatDate(review.createdAt)}</p>
                            </div>
                          </div>
                          <Stars rating={review.rating} size="h-3.5 w-3.5" />
                        </div>
                        <p className="mt-2 text-sm text-slate-600">{review.comment}</p>
                        {review.sellerReply && (
                          <div className="mt-3 rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
                            <span className="font-semibold text-slate-800">Seller response:</span> {review.sellerReply}
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="rounded-2xl bg-slate-50 p-5 text-sm text-slate-500">
                      No reviews yet. Be the first to review this product after delivery.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {tab === 'shipping' && (
            <div className="max-w-3xl space-y-4 text-sm text-slate-600">
              <div>
                <h3 className="font-semibold text-slate-900">Delivery</h3>
                <p className="mt-1">
                  Orders are packed by the seller, assigned to a verified delivery partner and typically delivered in
                  2–5 business days. Delivery charges are calculated per store at checkout and free above ₹999.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">Returns</h3>
                <p className="mt-1">
                  Delivered products can be submitted for a return and refund request from the order details page.
                  Refund eligibility is reviewed by the marketplace administrator.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">Payment</h3>
                <p className="mt-1">
                  Payments are processed through Razorpay and verified on the backend. Cash on delivery is also
                  available. MarketSphere never stores card details.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-12">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-600">You may also like</p>
              <h2 className="mt-2 text-2xl font-bold">Similar products</h2>
            </div>
            <Link to={`/products?category=${product.category?.slug || ''}`} className="text-sm font-semibold text-brand-700">
              View category
            </Link>
          </div>
          <div className="mt-5">
            <ProductList products={related} />
          </div>
        </section>
      )}
    </div>
  );
};

export default ProductDetails;
