# System Architecture Document

## 1. Architectural Overview

The **AI-Powered Restaurant Expense Management and Automated Financial Reconciliation System** is built using a modern **Decoupled Service Architecture**. The platform cleanly separates user interactions (Frontend), business logic & financial accounting (Node.js Core Backend), intelligent processing (Python AI Service), and persistent storage (MongoDB & File Storage).

```
                      ┌─────────────────────────┐
                      │     React Frontend      │
                      │  Dashboard / Analytics  │
                      └────────────┬────────────┘
                                   │ HTTP / REST
                                   ▼
                      ┌─────────────────────────┐
                      │    Node.js / Express    │
                      │   Business Core API     │
                      └────┬───────┬───────┬────┘
                           │       │       │
             ┌─────────────┘       │       └─────────────┐
             │ REST API            │ DB Driver           │ File System
             ▼                     ▼                     ▼
┌─────────────────────────┐  ┌───────────┐     ┌───────────────────┐
│    Python AI Service    │  │  MongoDB  │     │ Upload File Store │
│ FastAPI / OCR / ML Engine│  └───────────┘     │ /uploads/invoices │
└─────────────────────────┘                    └───────────────────┘
```

---

## 2. Core Architectural Principles

1. **Deterministic Financial Calculation**:
   - Machine Learning models and OCR algorithms are inherently probabilistic.
   - Financial aggregations (monthly totals, category sums, tax additions, reconciliation status evaluation) are strictly calculated using deterministic Node.js backend logic and MongoDB database aggregation primitives.
2. **Service Decoupling & Single Source of Truth**:
   - The **Node.js Backend** is the primary gateway, authorization provider, business manager, and database controller.
   - The **Python AI Service** operates strictly as an auxiliary microservice for OCR, text extraction, ML classification, duplicate detection, and anomaly scoring. It does NOT write directly to the database or modify financial records independently.
3. **Auditability & Explainability**:
   - Every AI-extracted expense or AI-classified item retains metadata: `confidenceScore`, `extractionMethod`, `isAnomaly`, `anomalyScore`, `reconciliationStatus`, and `notes`.
   - Low-confidence predictions require human review before becoming verified financial entries.

---

## 3. Microservice Roles & Responsibilities

### 3.1 React Frontend (`frontend/`)
- User Interface for expense logging, document uploads, analytics, and reconciliation reviews.
- Renders responsive charts (Recharts) for visual spending trends.
- Displays AI confidence tags, duplicate alerts, anomaly warnings, and mismatch review UI.
- Never performs independent financial calculations; displays authoritative figures received from backend APIs.

### 3.2 Node.js Business Core Backend (`backend/`)
- Handles JWT Authentication, Password Hashing (bcrypt), Role Authorization.
- Exposes RESTful API endpoints for Expenses, Documents, Reconciliation, and Reports.
- Handles file uploads via Multer and stores physical files securely.
- Orchestrates AI processing pipeline calls to Python FastAPI.
- Validates data payloads, saves records into MongoDB, and performs strict database aggregation queries (`$group`, `$sum`, `$match`).

### 3.3 Python AI Service (`ai-service/`)
- Powered by FastAPI, Pandas, NumPy, and scikit-learn.
- Performs Optical Character Recognition (OCR) via modular Tesseract/PaddleOCR engine wrappers.
- Runs NLP-based information extraction (Regex + NER) to extract vendor, date, invoice numbers, tax, line items, and total amount.
- Executes TF-IDF + Logistic Regression for automated Expense Category Classification.
- Performs deterministic rule matching and text similarity logic for Duplicate Detection.
- Executes Isolation Forest models for Anomaly Detection.

### 3.4 Database & File Storage (`MongoDB` & `/uploads`)
- **MongoDB**: Persists collections for Users, Restaurants, Expenses, Documents, AIProcessingResults, and Reconciliations.
- **File System**: Securely stores uploaded invoice PDFs, JPEG/PNG receipts, and document scans.

---

## 4. System Communication Flow

### Document Upload & Processing Sequence
1. **User** uploads invoice image/PDF via Frontend.
2. **Frontend** POSTs file to Node.js Backend (`POST /api/v1/documents/upload`).
3. **Node.js Backend**:
   - Saves file to disk under `/uploads/`.
   - Creates a `Document` record in MongoDB with status `PENDING`.
   - Sends file path to Python AI Service (`POST http://ai-service:8000/process-document`).
4. **Python AI Service**:
   - Runs OCR to extract raw text.
   - Parses text into structured fields (vendor, date, total, line items).
   - Predicts category using TF-IDF + Logistic Regression.
   - Evaluates duplicate probability and anomaly score.
   - Returns structured JSON response to Node.js Backend.
5. **Node.js Backend**:
   - Saves `AIProcessingResult` in MongoDB.
   - Compares candidate against existing expenses for Reconciliation.
   - Updates `Document` and creates `Expense` candidate.
   - Returns verified payload or review flag to Frontend.
