const ApiError = require('../utils/ApiError');
const SellerProfile = require('../models/SellerProfile');
const DeliveryPartnerProfile = require('../models/DeliveryPartnerProfile');
const asyncHandler = require('../utils/asyncHandler');

const authorize = (...roles) => (req, res, next) => {
  if (!req.user) return next(new ApiError(401, 'Not authorized.'));
  if (!roles.includes(req.user.role)) {
    return next(new ApiError(403, 'You do not have permission to perform this action.'));
  }
  next();
};

const requireApprovedSeller = asyncHandler(async (req, res, next) => {
  if (req.user.role !== 'seller') throw new ApiError(403, 'Seller access only.');
  const profile = await SellerProfile.findOne({ user: req.user._id });
  if (!profile) throw new ApiError(403, 'Seller profile not found.');
  if (profile.status !== 'approved') {
    throw new ApiError(403, 'Your seller account is pending approval.');
  }
  req.sellerProfile = profile;
  next();
});

const requireApprovedDelivery = asyncHandler(async (req, res, next) => {
  if (req.user.role !== 'delivery') throw new ApiError(403, 'Delivery partner access only.');
  const profile = await DeliveryPartnerProfile.findOne({ user: req.user._id });
  if (!profile) throw new ApiError(403, 'Delivery partner profile not found.');
  if (profile.status !== 'approved') {
    throw new ApiError(403, 'Your delivery partner account is pending approval.');
  }
  req.deliveryProfile = profile;
  next();
});

module.exports = { authorize, requireApprovedSeller, requireApprovedDelivery };
