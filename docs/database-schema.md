# Database Schema Specification

## Overview

The system uses **MongoDB** as its primary document store, managed via **Mongoose ORM** in the Node.js backend. This document specifies the planned collections, field data types, indexes, and relationships.

---

## Planned Collections & Entity Relationship Summary

```
 ┌──────────────┐       1:N       ┌──────────────────┐
 │  Restaurant  ├─────────────────►      User        │
 └──────┬───────┘                 └──────────────────┘
        │
        │ 1:N
        ├───► ┌──────────────────┐       1:1       ┌─────────────────────┐
        │     │     Document     ├─────────────────►  AIProcessingResult │
        │     └─────────┬────────┘                 └─────────────────────┘
        │               │
        │               │ 1:1 (Optional)
        ▼               ▼
 ┌──────────────┐  1:1 / 1:N      ┌──────────────────┐
 │   Expense    ├─────────────────►  Reconciliation  │
 └──────────────┘                 └──────────────────┘
```

---

## Entity Schemas

### 1. User Model (`users`)
Stores platform accounts for restaurant owners, managers, and accountants.

```javascript
{
  _id: ObjectId,
  restaurantId: ObjectId, // Ref: Restaurant
  name: String,           // Required
  email: String,          // Required, Unique, Indexed
  passwordHash: String,   // Required
  role: String,           // Enum: ['ADMIN', 'MANAGER', 'ACCOUNTANT'], Default: 'ADMIN'
  status: String,         // Enum: ['ACTIVE', 'INACTIVE'], Default: 'ACTIVE'
  createdAt: Date,
  updatedAt: Date
}
```

---

### 2. Restaurant Model (`restaurants`)
Stores restaurant business profiles.

```javascript
{
  _id: ObjectId,
  name: String,           // Required
  currency: String,       // Default: 'INR'
  address: String,
  phone: String,
  taxNumber: String,      // GSTIN / FSSAI number
  ownerId: ObjectId,      // Ref: User
  createdAt: Date,
  updatedAt: Date
}
```

---

### 3. Category Model (`categories`)
Stores standard and custom expense classification categories.

```javascript
{
  _id: ObjectId,
  name: String,           // Required (e.g. 'Raw Materials', 'Utilities', 'Salaries')
  description: String,
  restaurantId: ObjectId, // Ref: Restaurant (null for system defaults)
  isDefault: Boolean,     // Default: false
  createdAt: Date,
  updatedAt: Date
}
```

---

### 4. Expense Model (`expenses`)
The primary authoritative transaction ledger.

```javascript
{
  _id: ObjectId,
  restaurantId: ObjectId,     // Ref: Restaurant, Indexed
  description: String,        // Required, e.g. "Bought 50kg onions and tomatoes"
  vendor: String,             // Required, Indexed
  amount: Number,             // Required, Strict positive number
  currency: String,           // Default: 'INR'
  category: String,           // Enum: ['Raw Materials', 'Utilities', 'Salaries', 'Rent', 'Packaging', 'Maintenance', 'Transportation', 'Miscellaneous']
  subcategory: String,        // Optional detailed tag
  date: Date,                 // Required, Indexed
  paymentMethod: String,      // Enum: ['CASH', 'BANK_TRANSFER', 'CREDIT_CARD', 'UPI', 'CHEQUE', 'OTHER']
  invoiceNumber: String,      // Optional vendor invoice code
  documentId: ObjectId,       // Ref: Document (Optional, if created via invoice upload)
  source: String,             // Enum: ['MANUAL', 'OCR_UPLOAD', 'IMPORT']
  confidenceScore: Number,    // AI extraction confidence 0.0 - 1.0 (1.0 for manual)
  verificationStatus: String, // Enum: ['VERIFIED', 'PENDING_REVIEW', 'REJECTED']
  reconciliationStatus: String,// Enum: ['UNRECONCILED', 'MATCHED', 'DISCREPANCY']
  anomalyStatus: String,      // Enum: ['NORMAL', 'ANOMALY_FLAGGED']
  duplicateStatus: String,    // Enum: ['UNIQUE', 'POTENTIAL_DUPLICATE']
  notes: String,
  createdAt: Date,
  updatedAt: Date
}
```

---

### 5. Document Model (`documents`)
Metadata tracking uploaded invoice scans, receipts, and bills (Phase 5 Ingestion Foundation).

```javascript
{
  _id: ObjectId,
  restaurantId: ObjectId,     // Ref: Restaurant, Indexed (Tenant isolation)
  uploadedBy: ObjectId,       // Ref: User, Indexed (Uploader audit trail)
  originalFileName: String,   // Sanitized client filename (metadata only)
  storedFileName: String,     // Unpredictable server-generated filename (doc_<timestamp>_<hex>.<ext>)
  mimeType: String,           // Enum: ['application/pdf', 'image/jpeg', 'image/png']
  fileSizeBytes: Number,      // Strictly positive file size in bytes (max 10 MiB)
  fileHash: String,           // SHA-256 cryptographic digest for audit tracking
  storageKey: String,         // Relative storage path ('documents/<storedFileName>')
  processingStatus: String,   // Enum: ['UPLOADED', 'PROCESSING', 'COMPLETED', 'FAILED'], Default: 'UPLOADED'
  errorMessage: String,       // Error diagnostics if later extraction fails
  createdAt: Date,            // Timestamps
  updatedAt: Date
}
```

* **Indexes**:
  * `{ restaurantId: 1 }`: Fast tenant filtering.
  * `{ uploadedBy: 1 }`: Uploader audit lookups.
  * `{ restaurantId: 1, createdAt: -1 }`: Compound index for paginated reverse-chronological listings.
* **Virtual Aliases**:
  * `originalName` ➔ maps to `originalFileName`
  * `storedFilename` ➔ maps to `storedFileName`
  * `size` ➔ maps to `fileSizeBytes`
  * `status` ➔ maps to `processingStatus`

---

### 6. AIProcessingResult Model (`aiprocessingresults`)
Audit log storing raw AI outputs, OCR text, and model scores.

```javascript
{
  _id: ObjectId,
  documentId: ObjectId,       // Ref: Document, Unique
  rawOcrText: String,         // Full text extracted by OCR engine
  extractedVendor: String,
  extractedInvoiceNumber: String,
  extractedDate: Date,
  extractedAmount: Number,
  extractedTax: Number,
  extractedLineItems: [
    {
      itemDescription: String,
      quantity: Number,
      unitPrice: Number,
      totalPrice: Number
    }
  ],
  predictedCategory: String,
  categoryConfidence: Number,
  anomalyScore: Number,       // Isolation forest anomaly score
  isAnomaly: Boolean,
  duplicateMatchId: ObjectId,// Ref: Expense (if matched as duplicate)
  duplicateConfidence: Number,
  processingTimeMs: Number,
  createdAt: Date
}
```

---

### 7. Reconciliation Model (`reconciliations`)
Tracks verification audit results between source documents and recorded database expenses.

```javascript
{
  _id: ObjectId,
  restaurantId: ObjectId,
  expenseId: ObjectId,        // Ref: Expense
  documentId: ObjectId,       // Ref: Document
  status: String,             // Enum: ['MATCHED', 'AMOUNT_MISMATCH', 'DATE_MISMATCH', 'VENDOR_MISMATCH', 'DUPLICATE', 'MISSING_RECORD', 'MISSING_DOCUMENT', 'NEEDS_REVIEW']
  amountDifference: Number,   // Recorded amount minus document amount
  dateDifferenceDays: Number,
  discrepancyReason: String,  // Clear explanation for accounting audit
  reviewedBy: ObjectId,       // Ref: User (when manually resolved)
  reviewedAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```
