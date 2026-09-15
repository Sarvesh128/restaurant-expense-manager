# AI-Powered Restaurant Expense Management and Automated Financial Reconciliation System

An intelligent, modular, and reliable restaurant expense management platform that reduces manual accounting errors, automates document processing via OCR & NLP/ML, detects duplicate and anomalous transactions, and reconciles financial records with strict deterministic accounting principles.

---

## 📌 Project Overview

Managing expenses in a fast-paced restaurant environment is prone to errors, misplaced receipts, duplicate entries, and inconsistent categorization. This system combines **AI/ML capabilities** (for OCR, document extraction, intelligent categorization, duplicate detection, and anomaly detection) with **deterministic financial logic** in the backend (for additions, subtractions, totals, aggregations, and financial reports).

---

## 🎯 Objectives & Key Features

* **Manual & Automated Expense Entry**: Add expenses manually or via invoice/receipt uploads.
* **OCR & Document Understanding**: Extract text and key values (vendor, date, total, line items) from uploaded bills/invoices.
* **Automated Expense Classification**: Machine Learning (TF-IDF + Logistic Regression) automatically maps descriptions to expense categories.
* **Duplicate Detection**: Deterministic rule matching combined with similarity logic flags potential double entries.
* **Anomaly Detection**: ML models (Isolation Forest) flag unusual spending patterns or suspicious high-value items for review.
* **Automated Financial Reconciliation**: Verifies uploaded invoices against recorded database expenses.
* **Financial Analytics & Reporting**: Authoritative, mathematically exact aggregations for daily, weekly, and monthly expense analytics.
* **Human-in-the-Loop Review**: Discrepancies and low-confidence extractions are clearly flagged for human review.

---

## ⚖️ Critical Financial Principle

> **Financial accuracy is the highest priority.**  
> **AI/ML is NEVER responsible for authoritative financial arithmetic.**

* **AI/ML handles**: OCR, text extraction, expense classification, duplicate similarity scoring, anomaly scoring, and natural language insights.
* **Deterministic Backend handles**: Addition, subtraction, sub-totals, monthly totals, category totals, vendor totals, reconciliation status flags, validation rules, and financial reporting.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React.js, Vite, Tailwind CSS, React Router DOM, Axios, Recharts |
| **Backend API** | Node.js, Express.js, MongoDB, Mongoose, JWT, bcryptjs, Multer |
| **AI / ML Service** | Python 3.10+, FastAPI, Pandas, NumPy, scikit-learn, spaCy |
| **OCR Service** | Tesseract OCR / PaddleOCR (modular adapter pattern) |
| **Containerization** | Docker, Docker Compose |

---

## 🏗️ System Architecture

```
                     ┌─────────────────────┐
                     │    React Frontend   │
                     │ Dashboard / Forms   │
                     └──────────┬──────────┘
                                │
                           REST API
                                │
                                ▼
                     ┌─────────────────────┐
                     │ Node.js + Express   │
                     │ Business/API Layer  │
                     └─────────┬───────────┘
                               │
             ┌─────────────────┼─────────────────┐
             │                 │                 │
             ▼                 ▼                 ▼
        MongoDB          Python AI Service    File Storage
             │                 │
             │                 │
             │        ┌────────┼──────────┐
             │        ▼        ▼          ▼
             │       OCR      NLP/ML    Anomaly
             │        │        │          │
             │        └────────┼──────────┘
             │                 ▼
             │          Document Processing
             │                 │
             └─────────────────┼───────────────
                               ▼
                       Reconciliation
                               │
                               ▼
                     Verified Expense Data
                               │
                               ▼
                        Analytics/Reports
```

---

## 🔄 AI Document Processing Pipeline

```
UPLOAD DOCUMENT
      │
      ▼
FILE VALIDATION (Type & Size Check)
      │
      ▼
OCR PROCESSING (Extract Raw Text)
      │
      ▼
INFORMATION EXTRACTION (Vendor, Invoice #, Date, Amount, Line Items)
      │
      ▼
STRUCTURED EXPENSE CANDIDATE
      │
      ▼
VALIDATION & VERIFICATION (Backend Schema Check)
      │
      ▼
ML CLASSIFICATION (TF-IDF + Logistic Regression)
      │
      ▼
DUPLICATE DETECTION (Deterministic Rules + Similarity)
      │
      ▼
ANOMALY DETECTION (Isolation Forest)
      │
      ▼
RECONCILIATION (Match Invoice vs Database Record)
      │
      ▼
HUMAN REVIEW (If low confidence or discrepancy flagged)
      │
      ▼
VERIFIED EXPENSE DATA ➔ ANALYTICS & REPORTS
```

---

## 📁 Project Folder Structure

```
restaurant-expense-ai/
├── frontend/             # React + Vite UI Application
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   ├── pages/        # Dashboard, Expenses, Uploads, Reports pages
│   │   ├── layouts/      # App layouts & navigation wrappers
│   │   ├── services/     # Axios API service instances
│   │   ├── hooks/        # Custom React hooks
│   │   ├── context/      # Auth & Global App context
│   │   ├── utils/        # Formatting & helper utilities
│   │   └── charts/       # Recharts visualization components
│   └── package.json
├── backend/              # Node.js + Express Core Business API
│   ├── src/
│   │   ├── config/       # Database config (db.js) & environment
│   │   ├── controllers/  # API endpoint handlers (Phase 3+)
│   │   ├── middleware/   # Auth, error & upload middleware
│   │   ├── models/       # Mongoose Schemas (User, Expense, Document, etc.)
│   │   ├── routes/       # Express route handlers (Phase 3+)
│   │   ├── services/     # Business logic & AI service client calls
│   │   └── validators/   # Request payload validation schemas
│   └── package.json
├── ai-service/           # Python FastAPI Machine Learning & OCR Service
│   ├── app/
│   │   ├── api/          # FastAPI route routers
│   │   ├── ml/           # Classification, Anomaly & Duplicate models
│   │   ├── ocr/          # Tesseract/PaddleOCR engine wrappers
│   │   ├── extraction/   # Regex & NLP document extraction logic
│   │   └── reconciliation/# Reconciliation scoring engine
│   └── requirements.txt
├── docs/                 # Architecture, DB Schema, API & Pipeline Specs
├── sample-data/          # 50+ realistic restaurant expenses CSV & test invoices
├── tests/                # System integration tests
└── docker-compose.yml    # Container deployment manifest
```

---

## 🚀 Implementation Roadmap Status

* [x] **PHASE 1: Project Architecture and Scaffolding** `[COMPLETED]`
* [x] **PHASE 2: MongoDB + Backend Foundation** `[COMPLETED]`
  - MongoDB connection module via Mongoose (`src/config/db.js`)
  - Environment configuration (`.env.example` with `MONGODB_URI`)
  - Async backend startup sequence (Database connect ➔ Express server start)
  - Database connection error handling and safe logging
  - Enhanced Health check endpoint (`/health` returns DB connection status)
  - Centralized Express error middleware (`src/middleware/error.middleware.js`)
* [ ] **PHASE 3: Expense CRUD** `[PLANNED]`
* [ ] **PHASE 4: Authentication and Authorization** `[PLANNED]`
* [ ] **PHASE 5: Document Upload** `[PLANNED]`
* [ ] **PHASE 6: OCR Engine Integration** `[PLANNED]`
* [ ] **PHASE 7: Information Extraction** `[PLANNED]`
* [ ] **PHASE 8: ML Expense Classification** `[PLANNED]`
* [ ] **PHASE 9: Complete AI Document-Processing Pipeline** `[PLANNED]`
* [ ] **PHASE 10: Duplicate Detection** `[PLANNED]`
* [ ] **PHASE 11: Anomaly Detection** `[PLANNED]`
* [ ] **PHASE 12: Financial Reconciliation** `[PLANNED]`
* [ ] **PHASE 13: Analytics Dashboard** `[PLANNED]`
* [ ] **PHASE 14: Reports** `[PLANNED]`
* [ ] **PHASE 15: AI-Assisted Financial Insights** `[PLANNED]`
* [ ] **PHASE 16: Testing, Security, Optimization and Deployment** `[PLANNED]`

---

## 💻 Local Setup

See [`docs/setup.md`](docs/setup.md) for full local environment setup instructions.

```bash
# 1. Clone repository
git clone https://github.com/your-username/restaurant-expense-ai.git
cd restaurant-expense-ai

# 2. Setup Backend & MongoDB
cd backend
npm install
cp .env.example .env
npm run dev
```

---

## 📄 License & Attribution

Developed as a Final-Year Engineering Project adhering to industry standards for software architecture, financial precision, and machine learning explainability.
