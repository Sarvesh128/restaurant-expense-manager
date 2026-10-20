const request = require('supertest');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

const app = require('../src/app');
const Document = require('../src/models/Document');
const documentService = require('../src/services/document.service');
const { generateToken } = require('../src/utils/jwt');
const { getDocumentsDir, verifyMagicBytes } = require('../src/middleware/upload.middleware');

describe('Phase 5 Document Upload, Management, and Security Tests', () => {
  const restaurantA_Id = new mongoose.Types.ObjectId().toString();
  const restaurantB_Id = new mongoose.Types.ObjectId().toString();
  const userA_Id = new mongoose.Types.ObjectId().toString();
  const userB_Id = new mongoose.Types.ObjectId().toString();

  const tokenUserA = generateToken({
    userId: userA_Id,
    email: 'manager_a@bistro.com',
    role: 'MANAGER',
    restaurantId: restaurantA_Id
  });

  const tokenUserB = generateToken({
    userId: userB_Id,
    email: 'manager_b@diner.com',
    role: 'MANAGER',
    restaurantId: restaurantB_Id
  });

  const tokenUserWithoutRestaurant = generateToken({
    userId: new mongoose.Types.ObjectId().toString(),
    email: 'unaffiliated@bistro.com',
    role: 'MANAGER',
    restaurantId: null
  });

  // Valid sample file buffers
  const validPdfBuffer = Buffer.from('%PDF-1.4\n%âãÏÓ\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF');
  const validJpegBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01]);
  const validPngBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d]);
  const invalidFakePdfBuffer = Buffer.from('MZ\x90\x00\x03\x00\x00\x00ThisIsNotAPdfFile');

  // Track created files for cleanup
  const createdTestFiles = [];

  afterEach(() => {
    jest.restoreAllMocks();
  });

  afterAll(() => {
    // Clean up any files created during tests
    createdTestFiles.forEach((fPath) => {
      if (fs.existsSync(fPath)) {
        try {
          fs.unlinkSync(fPath);
        } catch (e) {}
      }
    });
  });

  // ==========================================
  // 1. AUTHENTICATION & ACCESS CONTROL
  // ==========================================
  describe('1. Authentication & Tenant Authorization Security', () => {
    test('rejects unauthenticated upload with 401 Unauthorized', async () => {
      const res = await request(app)
        .post('/api/v1/documents')
        .attach('file', validPdfBuffer, 'invoice.pdf');

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/no authentication token/i);
    });

    test('rejects unauthenticated list request with 401 Unauthorized', async () => {
      const res = await request(app).get('/api/v1/documents');
      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });

    test('rejects unauthenticated metadata request with 401 Unauthorized', async () => {
      const validId = new mongoose.Types.ObjectId().toString();
      const res = await request(app).get(`/api/v1/documents/${validId}`);
      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });

    test('rejects unauthenticated download request with 401 Unauthorized', async () => {
      const validId = new mongoose.Types.ObjectId().toString();
      const res = await request(app).get(`/api/v1/documents/${validId}/download`);
      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });

    test('rejects user without restaurant association on upload with 403 Forbidden', async () => {
      const res = await request(app)
        .post('/api/v1/documents')
        .set('Authorization', `Bearer ${tokenUserWithoutRestaurant}`)
        .attach('file', validPdfBuffer, 'invoice.pdf');

      expect(res.statusCode).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/not associated with any restaurant/i);
    });

    test('rejects user without restaurant association on list with 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/v1/documents')
        .set('Authorization', `Bearer ${tokenUserWithoutRestaurant}`);

      expect(res.statusCode).toBe(403);
      expect(res.body.success).toBe(false);
    });

    test('rejects invalid document ID format on GET /:id with 400 Bad Request', async () => {
      const res = await request(app)
        .get('/api/v1/documents/invalid-mongo-id')
        .set('Authorization', `Bearer ${tokenUserA}`);

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/invalid document id format/i);
    });

    test('rejects invalid document ID format on GET /:id/download with 400 Bad Request', async () => {
      const res = await request(app)
        .get('/api/v1/documents/123-bad-id/download')
        .set('Authorization', `Bearer ${tokenUserA}`);

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/invalid document id format/i);
    });
  });

  // ==========================================
  // 2. UPLOAD VALIDATION & STORAGE SAFETY
  // ==========================================
  describe('2. Upload Validation and Storage Safety', () => {
    test('succeeds uploading a valid PDF document with 201 Created', async () => {
      const mockSavedDoc = {
        _id: new mongoose.Types.ObjectId(),
        restaurantId: new mongoose.Types.ObjectId(restaurantA_Id),
        uploadedBy: new mongoose.Types.ObjectId(userA_Id),
        originalFileName: 'supplier_invoice.pdf',
        storedFileName: 'doc_mock_123.pdf',
        mimeType: 'application/pdf',
        fileSizeBytes: validPdfBuffer.length,
        fileHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        storageKey: 'documents/doc_mock_123.pdf',
        processingStatus: 'UPLOADED',
        createdAt: new Date(),
        updatedAt: new Date(),
        toJSON: function () {
          return {
            id: this._id.toString(),
            restaurantId: this.restaurantId,
            uploadedBy: this.uploadedBy,
            originalFileName: this.originalFileName,
            originalName: this.originalFileName,
            storedFileName: this.storedFileName,
            storedFilename: this.storedFileName,
            mimeType: this.mimeType,
            fileSizeBytes: this.fileSizeBytes,
            size: this.fileSizeBytes,
            fileHash: this.fileHash,
            storageKey: this.storageKey,
            processingStatus: this.processingStatus,
            status: this.processingStatus,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
          };
        }
      };

      jest.spyOn(Document, 'create').mockImplementation(async (data) => {
        // Track for cleanup
        const storageDir = getDocumentsDir();
        createdTestFiles.push(path.join(storageDir, data.storedFileName));
        return mockSavedDoc;
      });

      const res = await request(app)
        .post('/api/v1/documents')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .attach('file', validPdfBuffer, 'supplier_invoice.pdf');

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.document).toBeDefined();
      expect(res.body.document.originalName).toBe('supplier_invoice.pdf');
      expect(res.body.document.mimeType).toBe('application/pdf');
      expect(res.body.document.status).toBe('UPLOADED');
      expect(res.body.document.restaurantId.toString()).toBe(restaurantA_Id);
      expect(res.body.document.uploadedBy.toString()).toBe(userA_Id);
    });

    test('succeeds uploading a valid JPEG document with 201 Created', async () => {
      jest.spyOn(Document, 'create').mockImplementation(async (data) => {
        const storageDir = getDocumentsDir();
        createdTestFiles.push(path.join(storageDir, data.storedFileName));
        return {
          _id: new mongoose.Types.ObjectId(),
          ...data,
          toJSON: () => ({ id: 'mock_id', ...data, status: 'UPLOADED', size: data.fileSizeBytes })
        };
      });

      const res = await request(app)
        .post('/api/v1/documents')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .attach('file', validJpegBuffer, 'vegetables_receipt.jpg');

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.document.mimeType).toBe('image/jpeg');
    });

    test('succeeds uploading a valid PNG document with 201 Created', async () => {
      jest.spyOn(Document, 'create').mockImplementation(async (data) => {
        const storageDir = getDocumentsDir();
        createdTestFiles.push(path.join(storageDir, data.storedFileName));
        return {
          _id: new mongoose.Types.ObjectId(),
          ...data,
          toJSON: () => ({ id: 'mock_id', ...data, status: 'UPLOADED', size: data.fileSizeBytes })
        };
      });

      const res = await request(app)
        .post('/api/v1/documents')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .attach('file', validPngBuffer, 'gas_bill.png');

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.document.mimeType).toBe('image/png');
    });

    test('rejects request with missing file with 400 Bad Request', async () => {
      const res = await request(app)
        .post('/api/v1/documents')
        .set('Authorization', `Bearer ${tokenUserA}`);

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/no file uploaded/i);
    });

    test('rejects unsupported file type (.txt) with 400 Bad Request', async () => {
      const res = await request(app)
        .post('/api/v1/documents')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .attach('file', Buffer.from('plain text invoice'), 'notes.txt');

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/invalid file type/i);
    });

    test('rejects spoofed file (executable masquerading as .pdf) via magic byte check', async () => {
      const res = await request(app)
        .post('/api/v1/documents')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .attach('file', invalidFakePdfBuffer, 'trojan.pdf');

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/invalid file signature/i);
    });

    test('rejects oversized file (>10MB) with 400 Bad Request', async () => {
      // Create buffer exceeding 10 MiB limit
      const oversizedBuffer = Buffer.alloc(10 * 1024 * 1024 + 1024);

      const res = await request(app)
        .post('/api/v1/documents')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .attach('file', oversizedBuffer, 'huge_invoice.pdf');

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/exceeds maximum limit of 10mb/i);
    });

    test('sanitizes client-side path-traversal filename attempts in metadata', async () => {
      let savedOriginalName = null;
      let savedStoredName = null;

      jest.spyOn(Document, 'create').mockImplementation(async (data) => {
        savedOriginalName = data.originalFileName;
        savedStoredName = data.storedFileName;
        const storageDir = getDocumentsDir();
        createdTestFiles.push(path.join(storageDir, data.storedFileName));
        return {
          _id: new mongoose.Types.ObjectId(),
          ...data,
          toJSON: () => ({ id: 'mock_id', ...data })
        };
      });

      const res = await request(app)
        .post('/api/v1/documents')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .attach('file', validPdfBuffer, '../../../../etc/passwd.pdf');

      expect(res.statusCode).toBe(201);
      // Path traversal characters stripped
      expect(savedOriginalName).toBe('passwd.pdf');
      // Server-generated stored filename begins with doc_ and is in safe dir
      expect(savedStoredName).toMatch(/^doc_\d+_[a-f0-9]+\.pdf$/);
    });

    test('ignores client-supplied restaurantId or uploadedBy form fields', async () => {
      let capturedDocData = null;

      jest.spyOn(Document, 'create').mockImplementation(async (data) => {
        capturedDocData = data;
        const storageDir = getDocumentsDir();
        createdTestFiles.push(path.join(storageDir, data.storedFileName));
        return {
          _id: new mongoose.Types.ObjectId(),
          ...data,
          toJSON: () => ({ id: 'mock_id', ...data })
        };
      });

      const fakeRestaurantId = new mongoose.Types.ObjectId().toString();
      const fakeUserId = new mongoose.Types.ObjectId().toString();

      const res = await request(app)
        .post('/api/v1/documents')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .field('restaurantId', fakeRestaurantId)
        .field('uploadedBy', fakeUserId)
        .attach('file', validPdfBuffer, 'invoice.pdf');

      expect(res.statusCode).toBe(201);
      // Stored record must strictly match the authenticated token identity, NOT client fields
      expect(capturedDocData.restaurantId.toString()).toBe(restaurantA_Id);
      expect(capturedDocData.uploadedBy.toString()).toBe(userA_Id);
    });
  });

  // ==========================================
  // 3. DATABASE CONSISTENCY & FAILURE CLEANUP
  // ==========================================
  describe('3. Database Consistency and Failure Handling', () => {
    test('cleans up newly uploaded disk file when database persistence fails', async () => {
      let writtenFilePath = null;

      jest.spyOn(Document, 'create').mockImplementation(async (data) => {
        const storageDir = getDocumentsDir();
        writtenFilePath = path.join(storageDir, data.storedFileName);
        // Simulate database crash / connection timeout
        throw new Error('MongoNetworkError: connection timed out');
      });

      const res = await request(app)
        .post('/api/v1/documents')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .attach('file', validPdfBuffer, 'receipt_crash_test.pdf');

      expect(res.statusCode).toBe(500);
      expect(res.body.success).toBe(false);

      // Verify physical file was unlinked and not orphaned on disk
      if (writtenFilePath) {
        expect(fs.existsSync(writtenFilePath)).toBe(false);
      }
    });

    test('returns 503 when global in-memory fallback mode is active', async () => {
      global.DEV_FALLBACK_MODE = true;

      const res = await request(app)
        .post('/api/v1/documents')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .attach('file', validPdfBuffer, 'fallback_test.pdf');

      expect(res.statusCode).toBe(503);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/database unavailable.*mongodb/i);

      global.DEV_FALLBACK_MODE = false;
    });

    test('download returns 404 when database record exists but physical file is missing', async () => {
      const docId = new mongoose.Types.ObjectId();
      const mockDoc = {
        _id: docId,
        restaurantId: new mongoose.Types.ObjectId(restaurantA_Id),
        storedFileName: 'non_existent_ghost_file.pdf',
        originalFileName: 'ghost.pdf'
      };

      jest.spyOn(Document, 'findOne').mockResolvedValue(mockDoc);

      const res = await request(app)
        .get(`/api/v1/documents/${docId.toString()}/download`)
        .set('Authorization', `Bearer ${tokenUserA}`);

      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/document file not found on storage server/i);
    });
  });

  // ==========================================
  // 4. MULTI-TENANT ISOLATION
  // ==========================================
  describe('4. Multi-Tenant Cross-Restaurant Isolation', () => {
    test('Restaurant A cannot access Restaurant B document metadata (returns 404)', async () => {
      const docB_Id = new mongoose.Types.ObjectId().toString();

      // Mongoose findOne scoped to restaurantId will return null for cross-tenant query
      jest.spyOn(Document, 'findOne').mockImplementation((query) => {
        if (query.restaurantId.toString() === restaurantB_Id && query._id.toString() === docB_Id) {
          return Promise.resolve({
            _id: new mongoose.Types.ObjectId(docB_Id),
            restaurantId: new mongoose.Types.ObjectId(restaurantB_Id),
            toJSON: () => ({ id: docB_Id, restaurantId: restaurantB_Id })
          });
        }
        return Promise.resolve(null);
      });

      // User A attempts to view User B's document
      const res = await request(app)
        .get(`/api/v1/documents/${docB_Id}`)
        .set('Authorization', `Bearer ${tokenUserA}`);

      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/document not found/i);
    });

    test('Restaurant A cannot download Restaurant B document file (returns 404)', async () => {
      const docB_Id = new mongoose.Types.ObjectId().toString();

      jest.spyOn(Document, 'findOne').mockResolvedValue(null);

      const res = await request(app)
        .get(`/api/v1/documents/${docB_Id}/download`)
        .set('Authorization', `Bearer ${tokenUserA}`);

      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/document not found/i);
    });

    test('GET /api/v1/documents scopes listing query strictly to authorized restaurant', async () => {
      let capturedQuery = null;

      jest.spyOn(Document, 'countDocuments').mockImplementation(async (q) => {
        capturedQuery = q;
        return 1;
      });

      jest.spyOn(Document, 'find').mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              lean: jest.fn().mockResolvedValue([
                {
                  _id: new mongoose.Types.ObjectId(),
                  restaurantId: new mongoose.Types.ObjectId(restaurantA_Id),
                  uploadedBy: new mongoose.Types.ObjectId(userA_Id),
                  originalFileName: 'bills.pdf',
                  storedFileName: 'doc_1.pdf',
                  fileSizeBytes: 2048,
                  processingStatus: 'UPLOADED',
                  createdAt: new Date()
                }
              ])
            })
          })
        })
      });

      // Even if attacker attempts ?restaurantId=attacker_id in query parameters
      const res = await request(app)
        .get(`/api/v1/documents?restaurantId=${restaurantB_Id}`)
        .set('Authorization', `Bearer ${tokenUserA}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      // Query MUST be scoped to Restaurant A
      expect(capturedQuery.restaurantId.toString()).toBe(restaurantA_Id);
    });
  });

  // ==========================================
  // 5. QUERY VALIDATION & METADATA PAGINATION
  // ==========================================
  describe('5. Query Validation and Pagination', () => {
    test('rejects invalid page query parameter', async () => {
      const res = await request(app)
        .get('/api/v1/documents?page=0')
        .set('Authorization', `Bearer ${tokenUserA}`);

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/positive integer/i);
    });

    test('rejects invalid limit query parameter (>100)', async () => {
      const res = await request(app)
        .get('/api/v1/documents?limit=200')
        .set('Authorization', `Bearer ${tokenUserA}`);

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/between 1 and 100/i);
    });

    test('rejects invalid mimeType in query', async () => {
      const res = await request(app)
        .get('/api/v1/documents?mimeType=application/zip')
        .set('Authorization', `Bearer ${tokenUserA}`);

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/invalid query mimetype/i);
    });

    test('rejects invalid status in query', async () => {
      const res = await request(app)
        .get('/api/v1/documents?status=PURGED_UNKNOWN')
        .set('Authorization', `Bearer ${tokenUserA}`);

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/invalid document status/i);
    });

    test('rejects invalid sortBy field in query', async () => {
      const res = await request(app)
        .get('/api/v1/documents?sortBy=passwordHash')
        .set('Authorization', `Bearer ${tokenUserA}`);

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/invalid sortby field/i);
    });
  });

  // ==========================================
  // 6. PUBLIC STATIC PATH SECURITY VERIFICATION
  // ==========================================
  describe('6. Public Static Path Exposure Security', () => {
    test('ensures /uploads is NOT accessible via public unauthenticated static route', async () => {
      const res = await request(app).get('/uploads/documents/.gitkeep');
      // Express default 404 when static middleware is disabled
      expect(res.statusCode).toBe(404);
    });
  });
});
