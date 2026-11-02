const crypto = require('crypto');
const User = require('../models/User');
const SellerProfile = require('../models/SellerProfile');
const DeliveryPartnerProfile = require('../models/DeliveryPartnerProfile');
const Store = require('../models/Store');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const generateToken = require('../utils/generateToken');
const { sendPasswordReset, isMailConfigured } = require('../services/emailService');

const authPayload = async (user) => {
  const payload = { user: user.toJSON() };
  if (user.role === 'seller') {
    payload.sellerProfile = await SellerProfile.findOne({ user: user._id });
  }
  if (user.role === 'delivery') {
    payload.deliveryProfile = await DeliveryPartnerProfile.findOne({ user: user._id });
  }
  return payload;
};

const sendTokenResponse = async (res, user, statusCode = 200) => {
  const token = generateToken(user._id);
  const payload = await authPayload(user);
  res
    .status(statusCode)
    .cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    })
    .json({ success: true, token, ...payload });
};

const register = asyncHandler(async (req, res) => {
  const { name, email, password, phone, role = 'customer', businessName, vehicleType, vehicleNumber } = req.body;

  if (!name || !email || !password) {
    throw new ApiError(400, 'Name, email and password are required.');
  }
  if (password.length < 6) throw new ApiError(400, 'Password must be at least 6 characters.');
  if (!['customer', 'seller', 'delivery'].includes(role)) {
    throw new ApiError(400, 'Invalid account type. Admin accounts are created by the platform.');
  }

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) throw new ApiError(409, 'An account with this email already exists.');

  const user = await User.create({ name, email, password, phone, role });

  if (role === 'seller') {
    const profile = await SellerProfile.create({
      user: user._id,
      businessName: businessName || `${name}'s Store`,
      ownerName: name,
      phone: phone || '',
      status: 'pending',
    });
    await Store.create({
      seller: user._id,
      sellerProfile: profile._id,
      name: businessName || `${name}'s Store`,
      description: `${businessName || name} on MarketSphere`,
      isActive: false,
    });
    user.sellerProfile = profile._id;
    await user.save();
  }

  if (role === 'delivery') {
    const profile = await DeliveryPartnerProfile.create({
      user: user._id,
      vehicleType: vehicleType || 'bike',
      vehicleNumber: vehicleNumber || '',
      status: 'pending',
    });
    user.deliveryProfile = profile._id;
    await user.save();
  }

  await sendTokenResponse(res, user, 201);
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) throw new ApiError(400, 'Email and password are required.');

  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
  if (!user) throw new ApiError(401, 'Invalid email or password.');
  const matches = await user.comparePassword(password);
  if (!matches) throw new ApiError(401, 'Invalid email or password.');
  if (!user.isActive) throw new ApiError(403, 'This account has been disabled.');

  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  await sendTokenResponse(res, user);
});

const logout = asyncHandler(async (req, res) => {
  res.clearCookie('token').json({ success: true, message: 'Logged out successfully.' });
});

const me = asyncHandler(async (req, res) => {
  const payload = await authPayload(req.user);
  res.json({ success: true, ...payload });
});

const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) throw new ApiError(400, 'Email is required.');
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    return res.json({ success: true, message: 'If that email exists, a reset link has been sent.' });
  }

  const rawToken = crypto.randomBytes(32).toString('hex');
  user.resetPasswordToken = crypto.createHash('sha256').update(rawToken).digest('hex');
  user.resetPasswordExpire = Date.now() + 30 * 60 * 1000;
  await user.save({ validateBeforeSave: false });

  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  const resetUrl = `${clientUrl}/reset-password/${rawToken}`;
  await sendPasswordReset(user, resetUrl);

  res.json({
    success: true,
    message: 'If that email exists, a reset link has been sent.',
    ...(!isMailConfigured() && process.env.NODE_ENV !== 'production' ? { devResetUrl: resetUrl } : {}),
  });
});

const resetPassword = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;
  if (!password || password.length < 6) throw new ApiError(400, 'Password must be at least 6 characters.');

  const hashed = crypto.createHash('sha256').update(token).digest('hex');
  const user = await User.findOne({
    resetPasswordToken: hashed,
    resetPasswordExpire: { $gt: Date.now() },
  });
  if (!user) throw new ApiError(400, 'Reset link is invalid or has expired.');

  user.password = password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  await sendTokenResponse(res, user);
});

module.exports = { register, login, logout, me, forgotPassword, resetPassword, authPayload };
