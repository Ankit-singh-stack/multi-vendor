const User = require('../models/User');
const Address = require('../models/Address');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { fileToImage } = require('../middleware/uploadMiddleware');

const getProfile = asyncHandler(async (req, res) => {
  res.json({ success: true, user: req.user });
});

const updateProfile = asyncHandler(async (req, res) => {
  const { name, phone } = req.body;
  const updates = {};
  if (name) updates.name = name;
  if (phone !== undefined) updates.phone = phone;

  if (req.file) {
    updates.avatar = await fileToImage(req.file);
  }

  const user = await User.findByIdAndUpdate(req.user._id, updates, {
    new: true,
    runValidators: true,
  });
  res.json({ success: true, user, message: 'Profile updated.' });
});

const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) throw new ApiError(400, 'Current and new password are required.');
  if (newPassword.length < 6) throw new ApiError(400, 'New password must be at least 6 characters.');

  const user = await User.findById(req.user._id).select('+password');
  const matches = await user.comparePassword(currentPassword);
  if (!matches) throw new ApiError(400, 'Current password is incorrect.');

  user.password = newPassword;
  await user.save();
  res.json({ success: true, message: 'Password changed successfully.' });
});

const getAddresses = asyncHandler(async (req, res) => {
  const addresses = await Address.find({ user: req.user._id }).sort('-isDefault -createdAt');
  res.json({ success: true, addresses });
});

const createAddress = asyncHandler(async (req, res) => {
  const { fullName, phone, line1, line2, city, state, pincode, label, isDefault } = req.body;
  if (!fullName || !phone || !line1 || !city || !state || !pincode) {
    throw new ApiError(400, 'Full name, phone, address line, city, state and pincode are required.');
  }
  if (isDefault) {
    await Address.updateMany({ user: req.user._id }, { isDefault: false });
  }
  const address = await Address.create({
    user: req.user._id,
    fullName,
    phone,
    line1,
    line2,
    city,
    state,
    pincode,
    label,
    isDefault: Boolean(isDefault),
  });
  res.status(201).json({ success: true, address, message: 'Address added.' });
});

const updateAddress = asyncHandler(async (req, res) => {
  const address = await Address.findOne({ _id: req.params.id, user: req.user._id });
  if (!address) throw new ApiError(404, 'Address not found.');

  const fields = ['fullName', 'phone', 'line1', 'line2', 'city', 'state', 'pincode', 'label', 'isDefault'];
  fields.forEach((f) => {
    if (req.body[f] !== undefined) address[f] = req.body[f];
  });
  if (req.body.isDefault) {
    await Address.updateMany({ user: req.user._id, _id: { $ne: address._id } }, { isDefault: false });
  }
  await address.save();
  res.json({ success: true, address, message: 'Address updated.' });
});

const deleteAddress = asyncHandler(async (req, res) => {
  const address = await Address.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!address) throw new ApiError(404, 'Address not found.');
  res.json({ success: true, message: 'Address removed.' });
});

module.exports = {
  getProfile,
  updateProfile,
  changePassword,
  getAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
};
