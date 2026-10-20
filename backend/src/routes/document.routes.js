const express = require('express');
const router = express.Router();

const authenticate = require('../middleware/auth.middleware');
const { uploadDocumentFile } = require('../middleware/upload.middleware');
const documentController = require('../controllers/document.controller');
const {
  validateDocumentId,
  validateQueryDocument
} = require('../validators/document.validator');

// All document routes require authentication
router.use(authenticate);

// 1. Upload document (POST /api/v1/documents)
router.post('/', uploadDocumentFile, documentController.upload);

// 2. List documents with pagination and query filters (GET /api/v1/documents)
router.get('/', validateQueryDocument, documentController.getAll);

// 3. Download original document file (GET /api/v1/documents/:id/download)
router.get('/:id/download', validateDocumentId, documentController.download);

// 4. Retrieve single document metadata (GET /api/v1/documents/:id)
router.get('/:id', validateDocumentId, documentController.getById);

module.exports = router;
