const express = require('express');
const {
  registerDeliveryPartner,
  getProfile,
  updateProfile,
  getAssignedOrders,
  getDeliveryOrder,
  acceptAssignment,
  getEarnings,
  getDashboard,
} = require('../controllers/deliveryController');
const { updateOrderStatus } = require('../controllers/orderController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

const router = express.Router();

router.post('/register', protect, authorize('customer'), registerDeliveryPartner);

router.use(protect, authorize('delivery'));

router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.get('/dashboard', getDashboard);
router.get('/orders', getAssignedOrders);
router.get('/orders/:id', getDeliveryOrder);
router.post('/orders/:id/accept', acceptAssignment);
router.put('/orders/:id/status', updateOrderStatus);
router.get('/earnings', getEarnings);

module.exports = router;
