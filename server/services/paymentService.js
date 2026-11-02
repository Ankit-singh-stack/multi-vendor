const crypto = require('crypto');
const Razorpay = require('razorpay');

const isRazorpayConfigured = () =>
  Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);

const getRazorpay = () => {
  if (!isRazorpayConfigured()) return null;
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
};

const createProviderOrder = async (amount, receipt) => {
  const razorpay = getRazorpay();
  if (!razorpay) {
    return {
      id: `demo_${crypto.randomBytes(8).toString('hex')}`,
      amount: Math.round(amount * 100),
      currency: 'INR',
      receipt,
      demo: true,
    };
  }
  const order = await razorpay.orders.create({
    amount: Math.round(amount * 100),
    currency: 'INR',
    receipt,
    notes: { platform: 'MarketSphere' },
  });
  return { ...order, demo: false };
};

const verifySignature = ({ razorpayOrderId, razorpayPaymentId, signature, demo = false }) => {
  if (demo) return true;
  const expected = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest('hex');
  return expected === signature;
};

const verifyWebhookSignature = (rawBody, signature) => {
  if (!process.env.RAZORPAY_WEBHOOK_SECRET) return false;
  const expected = crypto
    .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
    .update(rawBody)
    .digest('hex');
  return expected === signature;
};

module.exports = {
  isRazorpayConfigured,
  getRazorpay,
  createProviderOrder,
  verifySignature,
  verifyWebhookSignature,
};
