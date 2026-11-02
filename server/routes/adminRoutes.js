const express = require('express');
const {
  getDashboard,
  getUsers,
  setUserStatus,
  getSellers,
  reviewSeller,
  getAdminProducts,
  getAdminOrders,
  assignDeliveryPartner,
  getPayments,
  getRefunds,
  updateRefund,
  getDeliveryPartners,
  reviewDeliveryPartner,
  getCommissions,
  settleCommission,
  getSettings,
  updateSettings,
  getAnalytics,
  getCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
} = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

const router = express.Router();

router.use(protect, authorize('admin'));

router.get('/dashboard', getDashboard);
router.get('/analytics', getAnalytics);

router.get('/users', getUsers);
router.put('/users/:id/status', setUserStatus);

router.get('/sellers', getSellers);
router.put('/sellers/:id/approve', reviewSeller);
router.put('/sellers/:id/review', reviewSeller);

router.get('/products', getAdminProducts);

router.get('/orders', getAdminOrders);
router.put('/orders/:id/assign', assignDeliveryPartner);

router.get('/payments', getPayments);

router.get('/refunds', getRefunds);
router.put('/refunds/:id', updateRefund);

router.get('/delivery-partners', getDeliveryPartners);
router.put('/delivery-partners/:id/approve', reviewDeliveryPartner);
router.put('/delivery-partners/:id/review', reviewDeliveryPartner);

router.get('/commissions', getCommissions);
router.put('/commissions/:id/settle', settleCommission);

router.get('/settings', getSettings);
router.put('/settings', updateSettings);

router.get('/coupons', getCoupons);
router.post('/coupons', createCoupon);
router.put('/coupons/:id', updateCoupon);
router.delete('/coupons/:id', deleteCoupon);

module.exports = router;
