import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiCheckCircle, FiCreditCard, FiMapPin, FiPlus, FiShield, FiTag, FiTruck } from 'react-icons/fi';
import { toast } from 'react-toastify';
import Button from '../../components/common/Button';
import Loader from '../../components/common/Loader';
import Modal from '../../components/common/Modal';
import AddressForm from '../../components/customer/AddressForm';
import { useCart } from '../../context/CartContext';
import orderService from '../../services/orderService';
import paymentService from '../../services/paymentService';
import userService from '../../services/userService';
import { getErrorMessage } from '../../services/api';
import { formatPrice } from '../../utils/formatPrice';
import { cn } from '../../utils/classNames';

const loadRazorpayScript = () =>
  new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

const Checkout = () => {
  const navigate = useNavigate();
  const { refreshCart } = useCart();
  const [addresses, setAddresses] = useState([]);
  const [addressId, setAddressId] = useState('');
  const [preview, setPreview] = useState(null);
  const [coupon, setCoupon] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('razorpay');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [couponBusy, setCouponBusy] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [addressOpen, setAddressOpen] = useState(false);
  const [addressBusy, setAddressBusy] = useState(false);

  const loadPreview = useCallback(async (code = '') => {
    const { data } = await orderService.preview(code ? { couponCode: code } : {});
    setPreview(data);
    setAppliedCoupon(data.couponApplied || '');
  }, []);

  useEffect(() => {
    let active = true;
    Promise.all([userService.getAddresses(), loadPreview()])
      .then(([addressRes]) => {
        if (!active) return;
        const list = addressRes.data.addresses || [];
        setAddresses(list);
        const preferred = list.find((a) => a.isDefault) || list[0];
        if (preferred) setAddressId(preferred._id);
      })
      .catch((error) => toast.error(getErrorMessage(error)))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [loadPreview]);

  const applyCoupon = async (e) => {
    e.preventDefault();
    if (!coupon.trim()) return;
    setCouponBusy(true);
    try {
      await loadPreview(coupon.trim());
      toast.success('Coupon applied.');
    } catch (error) {
      setAppliedCoupon('');
      toast.error(getErrorMessage(error));
    } finally {
      setCouponBusy(false);
    }
  };

  const removeCoupon = async () => {
    setCouponBusy(true);
    try {
      await loadPreview('');
      setCoupon('');
      toast.success('Coupon removed.');
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setCouponBusy(false);
    }
  };

  const addAddress = async (form) => {
    setAddressBusy(true);
    try {
      const { data } = await userService.addAddress(form);
      setAddresses((prev) => [data.address, ...prev]);
      setAddressId(data.address._id);
      setAddressOpen(false);
      toast.success('Address added.');
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setAddressBusy(false);
    }
  };

  const completePayment = async (order) => {
    const { data } = await paymentService.createPayment(order._id);
    const { razorpay, payment } = data;

    if (razorpay.demo || !razorpay.keyId) {
      await paymentService.verifyPayment({
        orderId: order._id,
        razorpay_order_id: razorpay.orderId,
        razorpay_payment_id: `pay_demo_${Date.now()}`,
        razorpay_signature: 'demo',
        method: 'demo',
      });
      return;
    }

    const loaded = await loadRazorpayScript();
    if (!loaded) throw new Error('Unable to load Razorpay. Check your internet connection and retry.');

    await new Promise((resolve, reject) => {
      const rzp = new window.Razorpay({
        key: razorpay.keyId,
        amount: razorpay.amount,
        currency: razorpay.currency,
        name: razorpay.name,
        description: razorpay.description,
        order_id: razorpay.orderId,
        handler: async (response) => {
          try {
            await paymentService.verifyPayment({
              orderId: order._id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            resolve();
          } catch (error) {
            reject(error);
          }
        },
        modal: {
          ondismiss: () => reject(new Error('Payment was cancelled. Your order is saved and can be paid later.')),
        },
        theme: { color: '#4f46e5' },
        prefill: {},
      });
      rzp.on('payment.failed', (response) => reject(new Error(response.error?.description || 'Payment failed.')));
      rzp.open();
      void payment;
    });
  };

  const placeOrder = async () => {
    if (!addressId) return toast.error('Please select a delivery address.');
    if (!preview?.subOrders?.length) return toast.error('Your cart is empty.');
    setPlacing(true);
    try {
      const { data } = await orderService.createOrder({
        addressId,
        couponCode: appliedCoupon,
        paymentMethod,
        customerNote: note,
      });
      const order = data.order;

      if (paymentMethod === 'razorpay') {
        await completePayment(order);
        toast.success('Payment verified and order confirmed.');
      } else {
        toast.success('Order placed. Please pay on delivery.');
      }

      await refreshCart();
      navigate(`/orders/${order._id}`, { replace: true });
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setPlacing(false);
    }
  };

  if (loading) return <div className="container-page py-10"><Loader label="Preparing checkout..." /></div>;
  if (!preview?.subOrders?.length) {
    return (
      <div className="container-page py-16 text-center">
        <h1 className="text-2xl font-bold">Your cart is empty</h1>
        <p className="mt-2 text-sm text-slate-500">Add products before proceeding to checkout.</p>
        <Button to="/products" className="mt-5">Browse products</Button>
      </div>
    );
  }

  const pricing = preview.pricing;
  const sellerCount = preview.subOrders.length;

  return (
    <div className="container-page py-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Checkout</h1>
          <p className="mt-1 text-sm text-slate-500">{sellerCount} shipment(s) · Secure server-verified pricing</p>
        </div>
        <p className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600"><FiShield /> Protected checkout</p>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-5">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-base font-semibold"><FiMapPin className="h-4 w-4 text-brand-600" /> Delivery address</h2>
              <Button size="xs" variant="outline" icon={FiPlus} onClick={() => setAddressOpen(true)}>Add new</Button>
            </div>
            {addresses.length ? (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {addresses.map((address) => (
                  <label
                    key={address._id}
                    className={cn(
                      'cursor-pointer rounded-xl border p-4 transition',
                      addressId === address._id ? 'border-brand-500 bg-brand-50/60 ring-2 ring-brand-500/10' : 'border-slate-200 hover:border-slate-300'
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="radio"
                        name="address"
                        checked={addressId === address._id}
                        onChange={() => setAddressId(address._id)}
                        className="mt-1 h-4 w-4 text-brand-600"
                      />
                      <div className="min-w-0 text-sm">
                        <p className="flex flex-wrap items-center gap-2 font-semibold text-slate-900">
                          {address.fullName}
                          <span className="badge bg-slate-100 text-slate-600">{address.label || 'Home'}</span>
                          {address.isDefault && <span className="badge bg-brand-100 text-brand-700">Default</span>}
                        </p>
                        <p className="mt-1 text-xs leading-relaxed text-slate-600">
                          {address.line1}{address.line2 ? `, ${address.line2}` : ''}, {address.city}, {address.state} {address.pincode}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">{address.phone}</p>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            ) : (
              <p className="mt-3 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-700">Add a delivery address to continue.</p>
            )}
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
            <h2 className="flex items-center gap-2 text-base font-semibold"><FiTruck className="h-4 w-4 text-brand-600" /> Shipment breakdown</h2>
            <div className="mt-4 space-y-4">
              {preview.subOrders.map((sub) => (
                <div key={sub.seller} className="rounded-xl border border-slate-100 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-800">{sub.storeName}</p>
                    <p className="text-sm font-bold">{formatPrice(sub.itemsTotal)}</p>
                  </div>
                  <div className="mt-2 space-y-1.5">
                    {sub.items.map((item) => (
                      <div key={item.product} className="flex justify-between gap-3 text-xs text-slate-500">
                        <span className="min-w-0 truncate">{item.name} × {item.quantity}</span>
                        <span>{formatPrice(item.subtotal)}</span>
                      </div>
                    ))}
                  </div>
                  <p className="mt-2 text-[11px] text-slate-400">
                    {sub.deliveryCharge ? `Delivery ${formatPrice(sub.deliveryCharge)}` : 'Free delivery'} · Seller commission {sub.commissionRate}%
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
            <h2 className="flex items-center gap-2 text-base font-semibold"><FiCreditCard className="h-4 w-4 text-brand-600" /> Payment method</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className={cn('cursor-pointer rounded-xl border p-4', paymentMethod === 'razorpay' ? 'border-brand-500 bg-brand-50/60' : 'border-slate-200')}>
                <input type="radio" name="payment" checked={paymentMethod === 'razorpay'} onChange={() => setPaymentMethod('razorpay')} className="h-4 w-4 text-brand-600" />
                <p className="mt-2 text-sm font-semibold text-slate-900">Pay online</p>
                <p className="mt-0.5 text-xs text-slate-500">Razorpay · UPI, cards, net banking. Uses demo mode if keys are not configured.</p>
              </label>
              <label className={cn('cursor-pointer rounded-xl border p-4', paymentMethod === 'cod' ? 'border-brand-500 bg-brand-50/60' : 'border-slate-200')}>
                <input type="radio" name="payment" checked={paymentMethod === 'cod'} onChange={() => setPaymentMethod('cod')} className="h-4 w-4 text-brand-600" />
                <p className="mt-2 text-sm font-semibold text-slate-900">Cash on delivery</p>
                <p className="mt-0.5 text-xs text-slate-500">Pay the delivery partner when your order arrives.</p>
              </label>
            </div>
            <div className="mt-4">
              <label className="label" htmlFor="note">Order note <span className="text-slate-400">(optional)</span></label>
              <textarea id="note" rows={2} value={note} onChange={(e) => setNote(e.target.value)} className="input" placeholder="Delivery instructions for the seller..." maxLength={500} />
            </div>
          </section>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
            <h2 className="text-base font-semibold">Order summary</h2>
            <div className="mt-4 space-y-2.5 text-sm">
              <div className="flex justify-between text-slate-600"><span>Items ({preview.subOrders.reduce((s, x) => s + x.items.length, 0)})</span><span>{formatPrice(pricing.itemsTotal)}</span></div>
              <div className="flex justify-between text-slate-600"><span>Delivery</span><span>{pricing.deliveryTotal ? formatPrice(pricing.deliveryTotal) : 'Free'}</span></div>
              <div className="flex justify-between text-slate-600"><span>Tax</span><span>{formatPrice(pricing.tax)}</span></div>
              {pricing.discount > 0 && (
                <div className="flex justify-between text-emerald-600"><span>Coupon {pricing.couponCode}</span><span>-{formatPrice(pricing.discount)}</span></div>
              )}
              <div className="flex justify-between border-t border-dashed border-slate-200 pt-2.5 text-base font-bold text-slate-900"><span>Total payable</span><span>{formatPrice(pricing.grandTotal)}</span></div>
            </div>

            <div className="mt-5 rounded-xl bg-slate-50 p-3">
              <p className="flex items-center gap-1.5 text-xs font-semibold text-slate-600"><FiTag className="h-3.5 w-3.5" /> Have a coupon?</p>
              <form onSubmit={applyCoupon} className="mt-2 flex gap-2">
                <input value={coupon} onChange={(e) => setCoupon(e.target.value.toUpperCase())} placeholder="WELCOME10" className="input py-2 text-xs uppercase" />
                <Button type="submit" size="sm" variant="secondary" loading={couponBusy}>Apply</Button>
              </form>
              {appliedCoupon && (
                <div className="mt-2 flex items-center justify-between rounded-lg bg-emerald-50 px-2.5 py-1.5 text-xs text-emerald-700">
                  <span className="flex items-center gap-1"><FiCheckCircle /> {appliedCoupon} applied</span>
                  <button type="button" onClick={removeCoupon} className="font-semibold underline">Remove</button>
                </div>
              )}
              <p className="mt-2 text-[10px] text-slate-400">Try WELCOME10 (10% up to ₹200) or FESTIVE500 (₹500 off above ₹2999).</p>
            </div>

            <Button className="mt-5 w-full" size="lg" loading={placing} disabled={!addressId} onClick={placeOrder}>
              {paymentMethod === 'cod' ? 'Place COD order' : `Pay ${formatPrice(pricing.grandTotal)}`}
            </Button>
            <p className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-slate-500"><FiShield className="h-3.5 w-3.5 text-emerald-500" /> Prices and stock are validated on the server</p>
          </div>
        </div>
      </div>

      <Modal open={addressOpen} onClose={() => setAddressOpen(false)} title="Add delivery address" size="lg">
        <AddressForm onSubmit={addAddress} onCancel={() => setAddressOpen(false)} submitting={addressBusy} />
      </Modal>
    </div>
  );
};

export default Checkout;
