import { useEffect, useState } from 'react';
import { FiMessageSquare, FiStar } from 'react-icons/fi';
import { toast } from 'react-toastify';
import Button from '../../components/common/Button';
import EmptyState from '../../components/common/EmptyState';
import Loader from '../../components/common/Loader';
import Modal from '../../components/common/Modal';
import sellerService from '../../services/sellerService';
import { getErrorMessage } from '../../services/api';
import { formatDate, formatPrice, resolveImage } from '../../utils/formatPrice';

const SellerReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState(null);
  const [reply, setReply] = useState('');
  const [busy, setBusy] = useState(false);

  const load = async () => {
    try {
      const { data } = await sellerService.getReviews();
      setReviews(data.reviews || []);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const submitReply = async () => {
    if (!reply.trim()) return toast.error('Please write a reply.');
    setBusy(true);
    try {
      const { data } = await sellerService.replyToReview(active._id, reply.trim());
      setReviews((prev) => prev.map((r) => (r._id === active._id ? data.review : r)));
      toast.success(data.message);
      setActive(null);
      setReply('');
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <Loader label="Loading reviews..." />;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Customer reviews</h1>
        <p className="mt-1 text-sm text-slate-500">{reviews.length} review(s) across your products. Reply publicly to build trust.</p>
      </div>

      {reviews.length ? (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review._id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <img src={resolveImage(review.product?.images?.[0]?.url)} alt={review.product?.name || 'Product'} className="h-12 w-12 rounded-xl border border-slate-200 object-cover" onError={(e) => { e.currentTarget.src = '/images/product-placeholder.svg'; }} />
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{review.product?.name || 'Product'}</p>
                    <p className="text-xs text-slate-500">by {review.user?.name || 'Customer'} · {formatDate(review.createdAt)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-amber-400">
                  {[1, 2, 3, 4, 5].map((star) => <FiStar key={star} className={`h-4 w-4 ${star <= review.rating ? 'fill-current' : 'text-slate-300'}`} />)}
                </div>
              </div>
              <p className="mt-3 text-sm text-slate-600">{review.comment}</p>
              {review.sellerReply && (
                <div className="mt-3 rounded-xl bg-brand-50 p-3 text-xs text-brand-800">
                  <span className="font-semibold">Your reply:</span> {review.sellerReply}
                </div>
              )}
              <div className="mt-3 flex items-center justify-between gap-2">
                <span className="text-xs text-slate-400">{review.product?.price ? formatPrice(review.product.price) : ''}</span>
                <Button size="xs" variant="outline" icon={FiMessageSquare} onClick={() => { setActive(review); setReply(review.sellerReply || ''); }}>
                  {review.sellerReply ? 'Edit reply' : 'Reply'}
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState icon={FiStar} title="No reviews yet" description="Reviews appear after customers receive and rate your products." />
      )}

      <Modal
        open={Boolean(active)}
        onClose={() => setActive(null)}
        title="Reply to review"
        description={active ? `${active.user?.name || 'Customer'} rated ${active.product?.name || 'your product'} ${active.rating}/5` : ''}
        footer={<><Button size="sm" variant="outline" onClick={() => setActive(null)}>Cancel</Button><Button size="sm" loading={busy} onClick={submitReply}>Post reply</Button></>}
      >
        <label className="label" htmlFor="reply">Public reply</label>
        <textarea id="reply" rows={5} value={reply} onChange={(e) => setReply(e.target.value)} className="input" placeholder="Thank the customer or address their concern..." maxLength={1000} />
      </Modal>
    </div>
  );
};

export default SellerReviews;
