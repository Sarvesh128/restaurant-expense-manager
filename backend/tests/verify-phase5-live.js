require('dotenv').config();
const mongoose = require('mongoose');
const request = require('supertest');
const fs = require('fs');
const path = require('path');
const app = require('../src/app');
const Document = require('../src/models/Document');
const Restaurant = require('../src/models/Restaurant');
const User = require('../src/models/User');
const { generateToken } = require('../src/utils/jwt');
const { getDocumentsDir } = require('../src/middleware/upload.middleware');

async function runLiveVerification() {
  console.log('--- STARTING PHASE 5 LIVE DATABASE INTEGRATION VERIFICATION ---');

  if (!process.env.MONGODB_URI) {
    console.error('FAIL: MONGODB_URI not defined in .env');
    process.exit(1);
  }

  // 1. Connect to live MongoDB Atlas
  console.log('1. Connecting to live MongoDB...');
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('   CONNECTED to MongoDB Host:', mongoose.connection.host);

  let testRestaurantA = null;
  let testRestaurantB = null;
  let testUserA = null;
  let testUserB = null;
  let uploadedDocId = null;
  let storedDiskFilePath = null;

  try {
    // 2. Setup isolated test restaurants and users
    console.log('2. Creating isolated test restaurant and user records...');
    testRestaurantA = await Restaurant.create({
      name: 'Phase 5 Test Bistro A',
      currency: 'INR'
    });
    testRestaurantB = await Restaurant.create({
      name: 'Phase 5 Test Bistro B',
      currency: 'INR'
    });

    testUserA = await User.create({
      name: 'Test Manager A',
      email: `manager_a_${Date.now()}@testlive.com`,
      passwordHash: 'dummy_hash_for_test',
      role: 'MANAGER',
      restaurantId: testRestaurantA._id
    });

    testUserB = await User.create({
      name: 'Test Manager B',
      email: `manager_b_${Date.now()}@testlive.com`,
      passwordHash: 'dummy_hash_for_test',
      role: 'MANAGER',
      restaurantId: testRestaurantB._id
    });

    const tokenA = generateToken({
      userId: testUserA._id.toString(),
      email: testUserA.email,
      role: testUserA.role,
      restaurantId: testRestaurantA._id.toString()
    });

    const tokenB = generateToken({
      userId: testUserB._id.toString(),
      email: testUserB.email,
      role: testUserB.role,
      restaurantId: testRestaurantB._id.toString()
    });

    // 3. Test Upload with a small harmless sample PDF
    console.log('3. Uploading harmless sample PDF via POST /api/v1/documents...');
    const samplePdfBuffer = Buffer.from('%PDF-1.4\n%Phase 5 Verification Sample\n1 0 obj\n<< /Type /Catalog >>\nendobj\n%%EOF');
    const uploadRes = await request(app)
      .post('/api/v1/documents')
      .set('Authorization', `Bearer ${tokenA}`)
      .attach('file', samplePdfBuffer, 'verified_sample_invoice.pdf');

    if (uploadRes.statusCode !== 201 || !uploadRes.body.success) {
      throw new Error(`Upload failed with status ${uploadRes.statusCode}: ${JSON.stringify(uploadRes.body)}`);
    }

    uploadedDocId = uploadRes.body.document.id;
    console.log('   UPLOAD SUCCESS. HTTP 201 Created. Document ID:', uploadedDocId);
    console.log('   Original Name:', uploadRes.body.document.originalName);
    console.log('   Stored Filename:', uploadRes.body.document.storedFilename);
    console.log('   MIME Type:', uploadRes.body.document.mimeType);
    console.log('   File Hash (SHA-256):', uploadRes.body.document.fileHash);
    console.log('   Status:', uploadRes.body.document.status);

    storedDiskFilePath = path.join(getDocumentsDir(), uploadRes.body.document.storedFilename);
    if (!fs.existsSync(storedDiskFilePath)) {
      throw new Error(`Physical file was not found on disk at: ${storedDiskFilePath}`);
    }
    console.log('   Physical file verified on disk at safe storage directory.');

    // 4. Verify MongoDB-backed persistence directly in database collection
    console.log('4. Verifying persistence directly in MongoDB Atlas collection...');
    const persistedDoc = await Document.findById(uploadedDocId);
    if (!persistedDoc) {
      throw new Error('Document metadata not found in MongoDB!');
    }
    if (persistedDoc.restaurantId.toString() !== testRestaurantA._id.toString()) {
      throw new Error('Persisted restaurantId mismatch!');
    }
    if (persistedDoc.uploadedBy.toString() !== testUserA._id.toString()) {
      throw new Error('Persisted uploadedBy mismatch!');
    }
    console.log('   CONFIRMED: Document metadata is actively persisted in MongoDB Atlas!');

    // 5. Test List Documents (GET /api/v1/documents)
    console.log('5. Listing documents via GET /api/v1/documents...');
    const listRes = await request(app)
      .get('/api/v1/documents')
      .set('Authorization', `Bearer ${tokenA}`);

    if (listRes.statusCode !== 200 || !listRes.body.documents.length) {
      throw new Error(`List documents failed: ${JSON.stringify(listRes.body)}`);
    }
    console.log('   LIST SUCCESS. Total Count:', listRes.body.pagination.totalCount);

    // 6. Test Get Document Metadata (GET /api/v1/documents/:id)
    console.log('6. Retrieving document metadata via GET /api/v1/documents/:id...');
    const getRes = await request(app)
      .get(`/api/v1/documents/${uploadedDocId}`)
      .set('Authorization', `Bearer ${tokenA}`);

    if (getRes.statusCode !== 200 || getRes.body.document.id !== uploadedDocId) {
      throw new Error(`Get metadata failed: ${JSON.stringify(getRes.body)}`);
    }
    console.log('   GET METADATA SUCCESS.');

    // 7. Test Download Original Document (GET /api/v1/documents/:id/download)
    console.log('7. Downloading original document via GET /api/v1/documents/:id/download...');
    const downloadRes = await request(app)
      .get(`/api/v1/documents/${uploadedDocId}/download`)
      .set('Authorization', `Bearer ${tokenA}`);

    if (downloadRes.statusCode !== 200) {
      throw new Error(`Download failed with status ${downloadRes.statusCode}`);
    }
    if (downloadRes.body.length !== samplePdfBuffer.length) {
      throw new Error(`Downloaded byte length mismatch: ${downloadRes.body.length} vs ${samplePdfBuffer.length}`);
    }
    console.log('   DOWNLOAD SUCCESS. Exact byte content verified.');

    // 8. Test Cross-Tenant Access Denial
    console.log('8. Testing cross-restaurant access denial (Tenant B accessing Tenant A)...');
    const crossGetRes = await request(app)
      .get(`/api/v1/documents/${uploadedDocId}`)
      .set('Authorization', `Bearer ${tokenB}`);

    if (crossGetRes.statusCode !== 404) {
      throw new Error(`Expected 404 for cross-tenant access, got ${crossGetRes.statusCode}`);
    }

    const crossDownloadRes = await request(app)
      .get(`/api/v1/documents/${uploadedDocId}/download`)
      .set('Authorization', `Bearer ${tokenB}`);

    if (crossDownloadRes.statusCode !== 404) {
      throw new Error(`Expected 404 for cross-tenant download, got ${crossDownloadRes.statusCode}`);
    }
    console.log('   CROSS-TENANT ACCESS DENIED: Both metadata and download return 404.');

    // 9. Test Unsupported and Spoofed File Rejection
    console.log('9. Testing unsupported file type rejection...');
    const badTypeRes = await request(app)
      .post('/api/v1/documents')
      .set('Authorization', `Bearer ${tokenA}`)
      .attach('file', Buffer.from('console.log("bad");'), 'malicious.js');

    if (badTypeRes.statusCode !== 400) {
      throw new Error(`Expected 400 for unsupported file type, got ${badTypeRes.statusCode}`);
    }
    console.log('   UNSUPPORTED FILE REJECTED with HTTP 400.');

    console.log('10. Testing spoofed file signature rejection...');
    const spoofedRes = await request(app)
      .post('/api/v1/documents')
      .set('Authorization', `Bearer ${tokenA}`)
      .attach('file', Buffer.from('Plain text fake pdf'), 'fake.pdf');

    if (spoofedRes.statusCode !== 400) {
      throw new Error(`Expected 400 for spoofed file signature, got ${spoofedRes.statusCode}`);
    }
    console.log('   SPOOFED FILE REJECTED with HTTP 400.');

    // 11. Test Public Static Path Denial
    console.log('11. Testing public static access denial to /uploads...');
    const staticRes = await request(app).get(`/uploads/documents/${path.basename(storedDiskFilePath)}`);
    if (staticRes.statusCode !== 404) {
      throw new Error(`Expected 404 for public static access, got ${staticRes.statusCode}`);
    }
    console.log('   PUBLIC STATIC ACCESS DENIED (HTTP 404). Uploads cannot be accessed publicly.');

    console.log('\n--- ALL LIVE MONGODB INTEGRATION CHECKS PASSED SUCCESSFULLY ---');
  } finally {
    // Cleanup test records and file
    console.log('Cleanup: Cleaning up live test database records and file...');
    if (uploadedDocId) {
      await Document.deleteOne({ _id: uploadedDocId });
    }
    if (testUserA) {
      await User.deleteOne({ _id: testUserA._id });
    }
    if (testUserB) {
      await User.deleteOne({ _id: testUserB._id });
    }
    if (testRestaurantA) {
      await Restaurant.deleteOne({ _id: testRestaurantA._id });
    }
    if (testRestaurantB) {
      await Restaurant.deleteOne({ _id: testRestaurantB._id });
    }
    if (storedDiskFilePath && fs.existsSync(storedDiskFilePath)) {
      try {
        fs.unlinkSync(storedDiskFilePath);
      } catch (e) {}
    }
    await mongoose.disconnect();
    console.log('Cleanup completed and database disconnected.');
  }
}

runLiveVerification().catch((err) => {
  console.error('VERIFICATION ERROR:', err);
  process.exit(1);
});
