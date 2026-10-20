const documentService = require('../services/document.service');

/**
 * Controller to upload an invoice or receipt document.
 * POST /api/v1/documents
 */
const upload = async (req, res, next) => {
  try {
    const result = await documentService.uploadDocument(req.file, req.user);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Controller to list restaurant documents with filters & pagination.
 * GET /api/v1/documents
 */
const getAll = async (req, res, next) => {
  try {
    const result = await documentService.getDocuments(req.query, req.user);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Controller to retrieve single document metadata by ID.
 * GET /api/v1/documents/:id
 */
const getById = async (req, res, next) => {
  try {
    const result = await documentService.getDocumentById(req.params.id, req.user);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Controller to securely download original document file.
 * GET /api/v1/documents/:id/download
 */
const download = async (req, res, next) => {
  try {
    const { document, filePath } = await documentService.downloadDocument(req.params.id, req.user);
    res.download(filePath, document.originalFileName);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  upload,
  getAll,
  getById,
  download
};
