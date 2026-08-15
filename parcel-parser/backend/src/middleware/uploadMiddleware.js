import multer from 'multer';

/**
 * Multer File Upload Configuration
 * Supports JPG, JPEG, PNG, WEBP, BMP, TIFF, PDF file formats.
 */

const storage = multer.memoryStorage();

const allowedMimeTypes = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/bmp',
  'image/tiff',
  'application/pdf'
];

const fileFilter = (req, file, cb) => {
  if (allowedMimeTypes.includes(file.mimetype) || file.originalname.match(/\.(jpg|jpeg|png|webp|bmp|tiff|tif|pdf)$/i)) {
    cb(null, true);
  } else {
    cb(new Error(`Unsupported file type: ${file.mimetype || file.originalname}. Only JPG, PNG, WEBP, BMP, TIFF, and PDF files are allowed.`), false);
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 25 * 1024 * 1024 // 25 MB max file size
  }
});
