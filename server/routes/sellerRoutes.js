const express = require('express');
const {
  registerSeller,
  getProfile,
  updateProfile,
  getSellerProducts,
  getSellerOrders,
  getDashboard,
  getAnalytics,
  getCommissionHistory,
  getPayoutHistory,
  getSellerReviews,
  replyToReview,
} = require('../controllers/sellerController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { upload } = require('../middleware/uploadMiddleware');

const router = express.Router();

router.post('/register', protect, authorize('customer'), upload.single('logo'), registerSeller);

router.use(protect, authorize('seller'));

router.get('/profile', getProfile);
router.put('/profile', upload.single('logo'), updateProfile);
router.get('/dashboard', getDashboard);
router.get('/products', getSellerProducts);
router.get('/orders', getSellerOrders);
router.get('/analytics', getAnalytics);
router.get('/commissions', getCommissionHistory);
router.get('/payouts', getPayoutHistory);
router.get('/reviews', getSellerReviews);
router.put('/reviews/:id/reply', replyToReview);

module.exports = router;
