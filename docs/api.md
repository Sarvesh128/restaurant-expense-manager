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

---

## 2. Expense Endpoints

### `POST /api/v1/expenses`
* **Description**: Manually record a new expense.
* **Headers**: `Authorization: Bearer <JWT_TOKEN>`
* **Payload**:
  ```json
  {
    "description": "50kg Onions purchase",
    "vendor": "Fresh Veggies Wholesale",
    "amount": 2500,
    "category": "Raw Materials",
    "date": "2026-09-15",
    "paymentMethod": "UPI"
  }
  ```

### `GET /api/v1/expenses`
* **Description**: Retrieve paginated expenses with filtering.
* **Query Parameters**: `startDate`, `endDate`, `category`, `vendor`, `verificationStatus`, `page`, `limit`

### `GET /api/v1/expenses/:id`
* **Description**: Retrieve single expense by ID.

### `PUT /api/v1/expenses/:id`
* **Description**: Update expense details or verify flagged item.

### `DELETE /api/v1/expenses/:id`
* **Description**: Delete an expense record.

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
