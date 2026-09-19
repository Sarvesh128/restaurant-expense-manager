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

## 3. Document Processing Endpoints

### `POST /api/v1/documents/upload`
* **Description**: Upload invoice image/PDF for OCR & AI pipeline processing.
* **Content-Type**: `multipart/form-data`
* **Form Field**: `file` (Binary Image/PDF file)
* **Response (200 OK)**:
  ```json
  {
    "success": true,
    "documentId": "6500a1b2c3...",
    "processingResult": {
      "vendor": "Fresh Veggies Wholesale",
      "invoiceNumber": "INV-2026-089",
      "date": "2026-09-14",
      "totalAmount": 2500,
      "predictedCategory": "Raw Materials",
      "categoryConfidence": 0.94,
      "isAnomaly": false,
      "duplicateMatchId": null
    }
  }
  ```

### `GET /api/v1/documents/:id`
* **Description**: Retrieve document processing details and raw OCR output.

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
