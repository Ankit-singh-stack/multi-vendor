const express = require('express');
const {
  createPayment,
  verifyPayment,
  markPaymentFailed,
  razorpayWebhook,
  getPaymentByOrder,
  isRazorpayConfigured,
} = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/webhook', razorpayWebhook);
router.get('/config', isRazorpayConfigured);

router.use(protect);
router.post('/create', createPayment);
router.post('/verify', verifyPayment);
router.post('/failed', markPaymentFailed);
router.get('/order/:orderId', getPaymentByOrder);

module.exports = router;
