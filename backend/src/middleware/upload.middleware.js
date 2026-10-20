const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

/**
 * Resolves the upload directory, respecting UPLOAD_DIR environment variable if specified.
 * Ensures the target directory exists on disk.
 */
const getDocumentsDir = () => {
  const dir = process.env.UPLOAD_DIR
    ? path.resolve(process.env.UPLOAD_DIR)
    : path.join(__dirname, '../../uploads/documents');

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
};

const DOCUMENTS_DIR = getDocumentsDir();

// 10 MiB maximum file size limit
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

// Explicitly allowed MIME types and extensions
const ALLOWED_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];
const ALLOWED_EXTENSIONS = ['.pdf', '.jpeg', '.jpg', '.png'];

/**
 * Disk storage engine generating unpredictable filenames.
 * Client-supplied names are never used for disk storage.
 */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, getDocumentsDir());
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeExt = ALLOWED_EXTENSIONS.includes(ext) ? ext : '.bin';
    const randomName = `doc_${Date.now()}_${crypto.randomBytes(16).toString('hex')}${safeExt}`;
    cb(null, randomName);
  }
});

/**
 * Preliminary MIME and extension boundary filter.
 */
const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const mime = (file.mimetype || '').toLowerCase();

  if (!ALLOWED_MIME_TYPES.includes(mime) || !ALLOWED_EXTENSIONS.includes(ext)) {
    const err = new Error(
      `Invalid file type '${file.mimetype}' with extension '${ext}'. Only PDF, JPEG, and PNG files under 10MB are permitted.`
    );
    err.statusCode = 400;
    return cb(err, false);
  }

  cb(null, true);
};

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
  fileFilter
});

/**
 * Validates file magic byte signature on disk to reject spoofed file types.
 *
 * @param {string} filePath
 * @param {string} mimeType
 * @returns {boolean}
 */
const verifyMagicBytes = (filePath, mimeType) => {
  let fd = null;
  try {
    const stats = fs.statSync(filePath);
    if (!stats.isFile() || stats.size < 4) {
      return false;
    }

    fd = fs.openSync(filePath, 'r');
    const bytesToRead = Math.min(stats.size, 16);
    const buffer = Buffer.alloc(bytesToRead);
    fs.readSync(fd, buffer, 0, bytesToRead, 0);

    const normalizedMime = (mimeType || '').toLowerCase();

    if (normalizedMime === 'application/pdf') {
      // PDF specification requires %PDF (0x25, 0x50, 0x44, 0x46)
      return buffer.slice(0, 4).toString('utf8') === '%PDF';
    }

    if (normalizedMime === 'image/jpeg') {
      // JPEG requires SOI marker FF D8 FF
      return bytesToRead >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
    }

    if (normalizedMime === 'image/png') {
      // PNG header 89 50 4E 47 0D 0A 1A 0A
      return (
        bytesToRead >= 8 &&
        buffer[0] === 0x89 &&
        buffer[1] === 0x50 &&
        buffer[2] === 0x4e &&
        buffer[3] === 0x47 &&
        buffer[4] === 0x0d &&
        buffer[5] === 0x0a &&
        buffer[6] === 0x1a &&
        buffer[7] === 0x0a
      );
    }

    return false;
  } catch (error) {
    return false;
  } finally {
    if (fd !== null) {
      try {
        fs.closeSync(fd);
      } catch (closeErr) {}
    }
  }
};

/**
 * Express middleware wrapper for single document upload under form field 'file'.
 */
const uploadDocumentFile = (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err) {
      // Clean up partial file if created
      if (req.file && req.file.path && fs.existsSync(req.file.path)) {
        try {
          fs.unlinkSync(req.file.path);
        } catch (unlinkErr) {}
      }

      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            success: false,
            message: 'File size exceeds maximum limit of 10MB.'
          });
        }
        return res.status(400).json({
          success: false,
          message: `File upload error: ${err.message}`
        });
      }

      return res.status(err.statusCode || 400).json({
        success: false,
        message: err.message
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded. Please attach a file under the multipart form-data field "file".'
      });
    }

    // Perform deep magic byte inspection
    const isValidSignature = verifyMagicBytes(req.file.path, req.file.mimetype);
    if (!isValidSignature) {
      // Clean up unsafe file immediately
      if (fs.existsSync(req.file.path)) {
        try {
          fs.unlinkSync(req.file.path);
        } catch (unlinkErr) {}
      }

      return res.status(400).json({
        success: false,
        message: 'Invalid file signature or corrupted content. Declared file format does not match actual file structure.'
      });
    }

    next();
  });
};

module.exports = {
  uploadDocumentFile,
  verifyMagicBytes,
  getDocumentsDir,
  DOCUMENTS_DIR,
  MAX_FILE_SIZE_BYTES,
  ALLOWED_MIME_TYPES,
  ALLOWED_EXTENSIONS
};
