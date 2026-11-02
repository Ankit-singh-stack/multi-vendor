const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { isCloudinaryConfigured, uploadToCloudinary } = require('../config/cloudinary');

const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${crypto.randomBytes(4).toString('hex')}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|webp|gif/;
  const validExt = allowed.test(path.extname(file.originalname).toLowerCase());
  const validMime = allowed.test(file.mimetype);
  if (validExt && validMime) return cb(null, true);
  cb(new Error('Only image files (jpg, png, webp, gif) are allowed.'));
};

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024, files: 6 },
  fileFilter,
});

const fileToImage = async (file) => {
  if (isCloudinaryConfigured()) {
    try {
      const result = await uploadToCloudinary(file.path);
      fs.unlink(file.path, () => {});
      return { url: result.secure_url, publicId: result.public_id };
    } catch (err) {
      console.error('Cloudinary upload failed, using local file:', err.message);
    }
  }
  return { url: `/uploads/${file.filename}`, publicId: '' };
};

const filesToImages = (files = []) => Promise.all(files.map(fileToImage));

module.exports = { upload, fileToImage, filesToImages };
