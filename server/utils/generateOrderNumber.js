const crypto = require('crypto');

const generateOrderNumber = () => {
  const date = new Date().toISOString().slice(2, 10).replace(/-/g, '');
  const random = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `MS-${date}-${random}`;
};

module.exports = generateOrderNumber;
