const express = require('express');
const {
  previewOrder,
  createOrder,
  getMyOrders,
  getOrderById,
  trackOrder,
  updateOrderStatus,
  cancelOrder,
  requestRefund,
  getMyRefunds,
} = require('../controllers/orderController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

const router = express.Router();

router.use(protect);

router.post('/preview', previewOrder);
router.post('/', createOrder);
router.get('/', getMyOrders);
router.get('/refunds/mine', getMyRefunds);
router.get('/:id', getOrderById);
router.get('/:id/track', trackOrder);
router.put('/:id/status', authorize('seller', 'delivery', 'admin'), updateOrderStatus);
router.post('/:id/cancel', cancelOrder);
router.post('/:id/refund', requestRefund);

module.exports = router;
