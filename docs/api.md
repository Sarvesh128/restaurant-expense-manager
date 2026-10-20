# REST API Specification

All REST APIs operate under the base path: `/api/v1`.  
All request payload and response formats utilize `application/json` (except document upload which uses `multipart/form-data`).

---

## 1. Authentication Endpoints

### `POST /api/v1/auth/register`
* **Description**: Register a new user and restaurant account.
* **Payload**:
  ```json
  {
    "name": "Admin User",
    "email": "admin@bistro.com",
    "password": "SecurePassword123!",
    "restaurantName": "Gourmet Bistro"
  }
  ```
* **Response (201 Created)**:
  ```json
  {
    "success": true,
    "token": "JWT_BEARER_TOKEN",
    "user": { "id": "...", "name": "Admin User", "role": "ADMIN" }
  }
  ```

### `POST /api/v1/auth/login`
* **Description**: Authenticate user and issue JWT token.
* **Payload**:
  ```json
  {
    "email": "admin@bistro.com",
    "password": "SecurePassword123!"
  }
  ```
* **Response (200 OK)**:
  ```json
  {
    "success": true,
    "token": "JWT_BEARER_TOKEN",
    "user": {
      "id": "6500a1b2c3...",
      "name": "Admin User",
      "email": "admin@bistro.com",
      "role": "ADMIN",
      "restaurantId": "6500a1b2c2..."
    }
  }
  ```

### `GET /api/v1/auth/me`
* **Description**: Retrieve currently authenticated user profile.
* **Headers**: `Authorization: Bearer <JWT_TOKEN>`
* **Response (200 OK)**:
  ```json
  {
    "success": true,
    "user": {
      "id": "6500a1b2c3...",
      "name": "Admin User",
      "email": "admin@bistro.com",
      "role": "ADMIN",
      "restaurantId": {
        "id": "6500a1b2c2...",
        "name": "Gourmet Bistro",
        "currency": "INR"
      }
    }
  }
  ```
* **Error Response (401 Unauthorized)**:
  ```json
  {
    "success": false,
    "message": "Access denied. No authentication token provided."
  }
  ```

---

## 2. Expense Endpoints

### `POST /api/v1/expenses`
* **Description**: Manually record a new expense (strictly scoped to authenticated user's restaurant).
* **Headers**: `Authorization: Bearer <JWT_TOKEN>`
* **Payload**:
  ```json
  {
    "description": "50kg Onions purchase",
    "vendor": "Fresh Veggies Wholesale",
    "amount": 2500,
    "category": "Raw Materials",
    "date": "2026-09-15",
    "paymentMethod": "UPI",
    "subcategory": "Vegetables",
    "invoiceNumber": "INV-2026-001",
    "notes": "Delivered to kitchen"
  }
  ```
* **Response (201 Created)**:
  ```json
  {
    "success": true,
    "expense": {
      "id": "6500b1c2d3...",
      "restaurantId": "6500a1b2c2...",
      "description": "50kg Onions purchase",
      "vendor": "Fresh Veggies Wholesale",
      "amount": 2500,
      "category": "Raw Materials",
      "date": "2026-09-15T00:00:00.000Z",
      "paymentMethod": "UPI",
      "verificationStatus": "VERIFIED",
      "reconciliationStatus": "UNRECONCILED",
      "anomalyStatus": "NORMAL",
      "duplicateStatus": "UNIQUE"
    }
  }
  ```

### `GET /api/v1/expenses`
* **Description**: Retrieve paginated expenses with deterministic filtering and sorting.
* **Headers**: `Authorization: Bearer <JWT_TOKEN>`
* **Query Parameters**: `startDate`, `endDate`, `minAmount`, `maxAmount`, `category`, `paymentMethod`, `vendor`, `search`, `verificationStatus`, `reconciliationStatus`, `anomalyStatus`, `duplicateStatus`, `sortBy`, `sortOrder`, `page`, `limit`
* **Response (200 OK)**:
  ```json
  {
    "success": true,
    "expenses": [ ... ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "totalCount": 25,
      "totalPages": 3,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  }
  ```

### `GET /api/v1/expenses/meta/categories`
* **Description**: Retrieve list of standard expense categories, payment methods, and system statuses.
* **Headers**: `Authorization: Bearer <JWT_TOKEN>`
* **Response (200 OK)**:
  ```json
  {
    "success": true,
    "categories": ["Raw Materials", "Utilities", "Salaries", "Rent", "Packaging", "Maintenance", "Transportation", "Miscellaneous"],
    "paymentMethods": ["CASH", "BANK_TRANSFER", "CREDIT_CARD", "UPI", "CHEQUE", "OTHER"],
    "sources": ["MANUAL", "OCR_UPLOAD", "IMPORT"],
    "verificationStatuses": ["VERIFIED", "PENDING_REVIEW", "REJECTED"],
    "reconciliationStatuses": ["UNRECONCILED", "MATCHED", "DISCREPANCY"],
    "anomalyStatuses": ["NORMAL", "ANOMALY_FLAGGED"],
    "duplicateStatuses": ["UNIQUE", "POTENTIAL_DUPLICATE"]
  }
  ```

### `GET /api/v1/expenses/meta/summary`
* **Description**: Compute deterministic financial totals, category breakdown, and status counts for a date window.
* **Headers**: `Authorization: Bearer <JWT_TOKEN>`
* **Query Parameters**: `startDate`, `endDate`, `category`
* **Response (200 OK)**:
  ```json
  {
    "success": true,
    "summary": {
      "totalAmount": 15450.75,
      "expenseCount": 5,
      "averageAmount": 3090.15,
      "categoryBreakdown": [
        { "category": "Raw Materials", "totalAmount": 8450.75, "count": 3, "percentage": 54.69 },
        { "category": "Utilities", "totalAmount": 7000, "count": 2, "percentage": 45.31 }
      ],
      "statusCounts": {
        "verifiedCount": 4,
        "pendingReviewCount": 1,
        "rejectedCount": 0,
        "anomalyFlaggedCount": 1
      }
    }
  }
  ```

### `GET /api/v1/expenses/:id`
* **Description**: Retrieve single expense by ID (enforces restaurant tenant isolation).
* **Headers**: `Authorization: Bearer <JWT_TOKEN>`

### `PUT /api/v1/expenses/:id`
* **Description**: Update expense details (supports partial update, prevents modification of restaurantId).
* **Headers**: `Authorization: Bearer <JWT_TOKEN>`

### `DELETE /api/v1/expenses/:id`
* **Description**: Permanently delete an expense record per documented deletion strategy.
* **Headers**: `Authorization: Bearer <JWT_TOKEN>`

---

## 3. Document Management Endpoints (Phase 5 Ingestion Foundation)

All document endpoints operate under `/api/v1/documents`, enforce JWT authentication, and guarantee strict restaurant tenant isolation.

> **Phase Boundary Note**: Document endpoints in Phase 5 represent the secure ingestion and persistent storage foundation. Uploading a document safely stores the file and persists its metadata with initial status `UPLOADED`. OCR extraction, ML parsing, and expense generation are deferred to later phases.

### `POST /api/v1/documents`
* **Description**: Securely upload an invoice scan, receipt image, or PDF document.
* **Headers**:
  * `Authorization: Bearer <JWT_TOKEN>`
  * `Content-Type: multipart/form-data`
* **Form Field**:
  * `file`: Binary file payload (single file per request).
* **Validation Rules**:
  * Allowed media types: `application/pdf`, `image/jpeg`, `image/png`.
  * Allowed file extensions: `.pdf`, `.jpeg`, `.jpg`, `.png`.
  * Maximum file size: **10 MiB** (10,485,760 bytes).
  * Magic byte verification: Validates file headers on disk (`%PDF`, `FF D8 FF`, `89 50 4E 47`) to reject disguised/spoofed executables.
  * Server-controlled storage: Stored with randomized, unpredictable filename (`doc_<timestamp>_<hex>.<ext>`). Client filenames are never used for disk paths.
  * Tenant derivation: `restaurantId` and `uploadedBy` are strictly derived from the authenticated token; client-supplied ownership fields are rejected.
* **Success Response (201 Created)**:
  ```json
  {
    "success": true,
    "document": {
      "id": "6ace9d08b36bb023970aa874",
      "restaurantId": "6500a1b2c2...",
      "uploadedBy": "6500a1b2c3...",
      "originalName": "supplier_invoice_sep2026.pdf",
      "storedFilename": "doc_1791925512174_38b206581ee9eecc1113b979b62cf007.pdf",
      "mimeType": "application/pdf",
      "size": 45120,
      "fileHash": "e420087c819bac159fd00c16d40c174e326be1e384c9ad576f06c495ef7ca3b5",
      "storageKey": "documents/doc_1791925512174_38b206581ee9eecc1113b979b62cf007.pdf",
      "status": "UPLOADED",
      "createdAt": "2026-10-14T02:35:12.174Z",
      "updatedAt": "2026-10-14T02:35:12.174Z"
    }
  }
  ```
* **Error Responses**:
  * `400 Bad Request` (Missing file):
    ```json
    {
      "success": false,
      "message": "No file uploaded. Please attach a file under the multipart form-data field \"file\"."
    }
    ```
  * `400 Bad Request` (Invalid type / Spoofed signature / Oversized):
    ```json
    {
      "success": false,
      "message": "Invalid file type 'application/zip' with extension '.zip'. Only PDF, JPEG, and PNG files under 10MB are permitted."
    }
    ```
  * `401 Unauthorized` (Missing or invalid token).
  * `403 Forbidden` (User is not associated with any authorized restaurant).
  * `503 Service Unavailable` (Persistent MongoDB storage unavailable / in-memory fallback active).

---

### `GET /api/v1/documents`
* **Description**: Retrieve paginated list of uploaded documents scoped strictly to the authenticated user's restaurant.
* **Headers**: `Authorization: Bearer <JWT_TOKEN>`
* **Query Parameters**:
  * `page`: Integer >= 1 (Default: `1`).
  * `limit`: Integer between 1 and 100 (Default: `10`).
  * `status`: Filter by processing status (`UPLOADED`, `PROCESSING`, `COMPLETED`, `FAILED`).
  * `mimeType`: Filter by MIME type (`application/pdf`, `image/jpeg`, `image/png`).
  * `sortBy`: Sort field (`createdAt`, `originalFileName`, `fileSizeBytes`, `mimeType`, `processingStatus`) (Default: `createdAt`).
  * `sortOrder`: `asc` or `desc` (Default: `desc`).
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "documents": [
      {
        "id": "6ace9d08b36bb023970aa874",
        "restaurantId": "6500a1b2c2...",
        "uploadedBy": "6500a1b2c3...",
        "originalName": "supplier_invoice_sep2026.pdf",
        "storedFilename": "doc_1791925512174_38b206581ee9eecc1113b979b62cf007.pdf",
        "mimeType": "application/pdf",
        "size": 45120,
        "fileHash": "e420087c819bac159fd00c16d40c174e326be1e384c9ad576f06c495ef7ca3b5",
        "storageKey": "documents/doc_1791925512174_38b206581ee9eecc1113b979b62cf007.pdf",
        "status": "UPLOADED",
        "createdAt": "2026-10-14T02:35:12.174Z",
        "updatedAt": "2026-10-14T02:35:12.174Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "totalCount": 1,
      "totalPages": 1,
      "hasNextPage": false,
      "hasPrevPage": false
    }
  }
  ```

---

### `GET /api/v1/documents/:id`
* **Description**: Retrieve metadata for a single uploaded document by ID.
* **Headers**: `Authorization: Bearer <JWT_TOKEN>`
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "document": {
      "id": "6ace9d08b36bb023970aa874",
      "restaurantId": "6500a1b2c2...",
      "uploadedBy": "6500a1b2c3...",
      "originalName": "supplier_invoice_sep2026.pdf",
      "storedFilename": "doc_1791925512174_38b206581ee9eecc1113b979b62cf007.pdf",
      "mimeType": "application/pdf",
      "size": 45120,
      "fileHash": "e420087c819bac159fd00c16d40c174e326be1e384c9ad576f06c495ef7ca3b5",
      "storageKey": "documents/doc_1791925512174_38b206581ee9eecc1113b979b62cf007.pdf",
      "status": "UPLOADED",
      "createdAt": "2026-10-14T02:35:12.174Z",
      "updatedAt": "2026-10-14T02:35:12.174Z"
    }
  }
  ```
* **Error Response (404 Not Found)**:
  ```json
  {
    "success": false,
    "message": "Document not found."
  }
  ```
  *(Returned identically for nonexistent records and cross-restaurant unauthorized access attempts without data leakage).*

---

### `GET /api/v1/documents/:id/download`
* **Description**: Securely download the original binary document file.
* **Headers**: `Authorization: Bearer <JWT_TOKEN>`
* **Security & Behavior**:
  * Enforces restaurant tenant ownership before locating file.
  * Resolves stored file from server-controlled storage identifier (`storedFileName`).
  * Enforces strict path containment preventing directory traversal.
  * Upload directory is NOT exposed publicly (`/uploads` static routing is disabled).
  * Returns original filename in `Content-Disposition` attachment header.
* **Success Response (200 OK)**:
  * Headers:
    * `Content-Disposition: attachment; filename="supplier_invoice_sep2026.pdf"`
    * `Content-Type: application/pdf` (or `image/jpeg`, `image/png`)
  * Body: Binary stream.

---

## 4. Reconciliation Endpoints

### `GET /api/v1/reconciliation/mismatches`
* **Description**: List all flagged discrepancies requiring human review.

### `POST /api/v1/reconciliation/verify/:id`
* **Description**: Mark a reconciliation entry as verified/resolved by accountant.

---

## 5. Analytics & Financial Reports Endpoints

### `GET /api/v1/analytics/summary`
* **Description**: Authoritative backend database aggregation for dashboard.
* **Response (200 OK)**:
  ```json
  {
    "totalMonthlyExpense": 145000,
    "previousMonthExpense": 138000,
    "monthOverMonthChangePercent": +5.07,
    "verifiedExpensesCount": 142,
    "pendingReviewCount": 3,
    "categoryBreakdown": [
      { "category": "Raw Materials", "total": 65000 },
      { "category": "Salaries", "total": 45000 }
    ]
  }
  ```

### `GET /api/v1/analytics/trends`
* **Description**: Daily and monthly spending trends.
