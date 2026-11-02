const Category = require('../models/Category');
const Product = require('../models/Product');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { fileToImage } = require('../middleware/uploadMiddleware');

const getCategories = asyncHandler(async (req, res) => {
  const filter = req.query.all === 'true' ? {} : { isActive: true };
  const categories = await Category.find(filter).sort('displayOrder name');
  const counts = await Product.aggregate([
    { $match: { status: 'active' } },
    { $group: { _id: '$category', count: { $sum: 1 } } },
  ]);
  const countMap = {};
  counts.forEach((c) => {
    countMap[String(c._id)] = c.count;
  });
  res.json({
    success: true,
    categories: categories.map((c) => ({ ...c.toJSON(), productCount: countMap[String(c._id)] || 0 })),
  });
});

const getCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) throw new ApiError(404, 'Category not found.');
  res.json({ success: true, category });
});

const createCategory = asyncHandler(async (req, res) => {
  const { name, description, icon, parent, displayOrder, isActive } = req.body;
  if (!name) throw new ApiError(400, 'Category name is required.');
  const exists = await Category.findOne({ name: new RegExp(`^${name}$`, 'i') });
  if (exists) throw new ApiError(409, 'A category with this name already exists.');

  let image = { url: '', publicId: '' };
  if (req.file) image = await fileToImage(req.file);

  const category = await Category.create({
    name,
    description,
    icon,
    parent: parent || null,
    displayOrder: displayOrder || 0,
    isActive: isActive !== undefined ? isActive : true,
    image,
  });
  res.status(201).json({ success: true, category, message: 'Category created.' });
});

const updateCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) throw new ApiError(404, 'Category not found.');

  ['name', 'description', 'icon', 'parent', 'displayOrder', 'isActive'].forEach((field) => {
    if (req.body[field] !== undefined) {
      category[field] = field === 'parent' && !req.body[field] ? null : req.body[field];
    }
  });
  if (req.file) category.image = await fileToImage(req.file);
  await category.save();
  res.json({ success: true, category, message: 'Category updated.' });
});

const deleteCategory = asyncHandler(async (req, res) => {
  const productCount = await Product.countDocuments({ category: req.params.id });
  if (productCount > 0) {
    throw new ApiError(400, `Cannot delete category with ${productCount} product(s). Reassign them first.`);
  }
  const category = await Category.findByIdAndDelete(req.params.id);
  if (!category) throw new ApiError(404, 'Category not found.');
  res.json({ success: true, message: 'Category deleted.' });
});

module.exports = { getCategories, getCategory, createCategory, updateCategory, deleteCategory };
