import multer from 'multer';

/**
 * Multer File Upload Configuration
 *
 * Supported formats:
 *  Images: JPEG, PNG, WEBP, BMP, TIFF (standard raster label photos)
 *  PDF:    application/pdf (single or multi-page shipping documents, invoices)
 *
 * File size: 50 MB max (accommodates large multi-page scanned PDFs)
 *
 * MIME detection: checks both file.mimetype AND file extension to handle
 * cases where browsers misreport the MIME type (e.g. some OS report .tiff as
 * application/octet-stream). Extension-based fallback ensures no valid file
 * is rejected due to browser MIME quirks.
 */

const storage = multer.memoryStorage();

const ALLOWED_MIMES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/bmp',
  'image/tiff',
  'image/x-tiff',
  'application/pdf'
]);

const ALLOWED_EXTENSIONS = /\.(jpg|jpeg|png|webp|bmp|tiff|tif|pdf)$/i;

const fileFilter = (req, file, cb) => {
  const mimeAllowed = ALLOWED_MIMES.has(file.mimetype.toLowerCase());
  const extAllowed  = ALLOWED_EXTENSIONS.test(file.originalname);

  if (mimeAllowed || extAllowed) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `Unsupported file type: "${file.mimetype}" (${file.originalname}). ` +
        `Allowed: JPG, PNG, WEBP, BMP, TIFF, PDF.`
      ),
      false
    );
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024  // 50 MB — supports large multi-page PDFs
  }
});
