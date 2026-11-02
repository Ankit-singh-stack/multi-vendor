const ContactMessage = require('../models/ContactMessage');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

const createMessage = asyncHandler(async (req, res) => {
  const { name, email, subject, message } = req.body;
  if (!name || !email || !subject || !message) {
    throw new ApiError(400, 'Name, email, subject and message are required.');
  }
  const contact = await ContactMessage.create({ name, email, subject, message });
  res.status(201).json({
    success: true,
    message: 'Thanks for reaching out. Our team will respond within one business day.',
    contact: { _id: contact._id },
  });
});

const getMessages = asyncHandler(async (req, res) => {
  const messages = await ContactMessage.find().sort('-createdAt');
  res.json({ success: true, messages });
});

module.exports = { createMessage, getMessages };
