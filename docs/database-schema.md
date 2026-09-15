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
  createdAt: Date,
  updatedAt: Date
}
```

---

### 3. Expense Model (`expenses`)
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

### 4. Document Model (`documents`)
Metadata tracking uploaded invoice scans, receipts, and bills.

```javascript
{
  _id: ObjectId,
  restaurantId: ObjectId,     // Ref: Restaurant
  uploadedBy: ObjectId,       // Ref: User
  originalFileName: String,
  storedFileName: String,     // Unique file path on storage
  mimeType: String,           // 'image/jpeg', 'image/png', 'application/pdf'
  fileSizeBytes: Number,
  fileHash: String,           // SHA-256 hash for duplicate check
  processingStatus: String,   // Enum: ['UPLOADED', 'PROCESSING', 'COMPLETED', 'FAILED']
  errorMessage: String,
  createdAt: Date,
  updatedAt: Date
}
```

---

### 5. AIProcessingResult Model (`aiprocessingresults`)
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

### 6. Reconciliation Model (`reconciliations`)
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
