const express = require('express');
const {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  toggleWishlist,
} = require('../controllers/wishlistController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);
router.get('/', getWishlist);
router.post('/', addToWishlist);
router.post('/toggle', toggleWishlist);
router.delete('/:productId', removeFromWishlist);

module.exports = router;
