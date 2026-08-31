import multer from 'multer';
import { InvalidImageError } from '../utils/errors';

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp'
]);

const storage = multer.memoryStorage();

export const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      return cb(new InvalidImageError(`Unsupported image MIME type '${file.mimetype}'. Allowed: JPEG, PNG, WebP.`));
    }
    cb(null, true);
  }
});
