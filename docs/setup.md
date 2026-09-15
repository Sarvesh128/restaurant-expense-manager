# Local Development Setup Guide

Follow this guide to set up the development environment for the **AI-Powered Restaurant Expense Management and Automated Financial Reconciliation System**.

---

## 📋 Prerequisites

Before starting, ensure you have the following installed on your machine:

1. **Node.js**: v18.x or v20.x LTS ([Download Node.js](https://nodejs.org/))
2. **Python**: v3.10 or v3.11 ([Download Python](https://www.python.org/))
3. **MongoDB**: Local MongoDB Community Edition or MongoDB Atlas cluster URI ([Download MongoDB](https://www.mongodb.com/try/download/community))
4. **Tesseract OCR**: (For Phase 6 OCR capabilities)
   - **Windows**: Install via [UB-Mannheim Tesseract Installer](https://github.com/UB-Mannheim/tesseract/wiki) and add to System PATH.
   - **Linux**: `sudo apt-get install tesseract-ocr`
   - **macOS**: `brew install tesseract`
5. **Git**: Installed for version control.

---

## 🛠️ Phase 1 Setup Verification

### 1. Repository Structure
Ensure your workspace matches the following:
```bash
restaurant-expense-ai/
├── frontend/
├── backend/
├── ai-service/
├── docs/
└── sample-data/
```

### 2. Inspect Sample Dataset
Navigate to `sample-data/expenses.csv` to verify the 50+ realistic restaurant expense training records.

---

## 🚀 Environment Configuration Setup (Future Phases)

### Backend Configuration (`backend/.env`)
Copy `backend/.env.example` to `backend/.env`:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/restaurant_expense_db
JWT_SECRET=your_super_secret_jwt_key_change_in_production
AI_SERVICE_URL=http://localhost:8000
```

### AI Service Configuration (`ai-service/.env`)
Copy `ai-service/.env.example` to `ai-service/.env`:
```env
PORT=8000
DEBUG=True
TESSERACT_CMD=C:\Program Files\Tesseract-OCR\tesseract.exe
```

### Frontend Configuration (`frontend/.env`)
Copy `frontend/.env.example` to `frontend/.env`:
```env
VITE_API_BASE_URL=http://localhost:5000/api/v1
```

---

## 🏃 Running Services Locally (Summary for Phase 2+)

```bash
# Terminal 1: Backend API
cd backend
npm install
npm run dev

# Terminal 2: Python AI Service
cd ai-service
python -m venv venv
# Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# Terminal 3: React Frontend
cd frontend
npm install
npm run dev
```
