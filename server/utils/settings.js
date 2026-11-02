const Setting = require('../models/Setting');

const DEFAULTS = {
  commissionRate: Number(process.env.DEFAULT_COMMISSION_RATE || 10),
  deliveryCharge: Number(process.env.DEFAULT_DELIVERY_CHARGE || 49),
  taxRate: Number(process.env.DEFAULT_TAX_RATE || 5),
  freeDeliveryAbove: 999,
  platformName: 'MarketSphere',
};

const getMarketplaceSettings = async () => {
  const rows = await Setting.find({ key: { $in: Object.keys(DEFAULTS) } });
  const settings = { ...DEFAULTS };
  rows.forEach((row) => {
    settings[row.key] = row.value;
  });
  return settings;
};

const setSetting = async (key, value, description = '') => {
  if (!(key in DEFAULTS)) {
    const err = new Error(`Unknown setting: ${key}`);
    err.statusCode = 400;
    throw err;
  }
  return Setting.findOneAndUpdate(
    { key },
    { key, value, description },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
};

module.exports = { DEFAULTS, getMarketplaceSettings, setSetting };
