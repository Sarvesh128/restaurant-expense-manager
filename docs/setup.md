# Local Development Setup Guide

Follow this guide to set up the development environment for the **AI-Powered Restaurant Expense Management and Automated Financial Reconciliation System**.

---

## 📋 Prerequisites

Before starting, ensure you have the following installed on your machine:

1. **Node.js**: v18.x or v20.x LTS ([Download Node.js](https://nodejs.org/))
2. **MongoDB**: Local MongoDB Community Edition or MongoDB Atlas cluster URI ([Download MongoDB](https://www.mongodb.com/try/download/community))
3. **Python**: v3.10 or v3.11 ([Download Python](https://www.python.org/))
4. **Tesseract OCR**: (For Phase 6 OCR capabilities)
   - **Windows**: Install via [UB-Mannheim Tesseract Installer](https://github.com/UB-Mannheim/tesseract/wiki) and add to System PATH.
   - **Linux**: `sudo apt-get install tesseract-ocr`
   - **macOS**: `brew install tesseract`
5. **Git**: Installed for version control.

---

## ⚙️ Phase 2 Database & Backend Setup

### 1. Backend Environment Configuration
Navigate to the `backend/` folder and create a `.env` file based on `.env.example`:

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env` to configure your MongoDB URI:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/restaurant_expense_ai
```

> **Note**: For MongoDB Atlas, use your cluster connection string format in `MONGODB_URI`:  
> `MONGODB_URI=mongodb+sandbox://<username>:<password>@cluster0.mongodb.net/restaurant_expense_ai?retryWrites=true&w=majority`

### 2. Install Backend Dependencies
```bash
cd backend
npm install
```

### 3. Start Backend API Server
```bash
npm run dev
```

Expected Terminal Output on Success:
```text
[Database]: MongoDB connected successfully to 127.0.0.1/restaurant_expense_ai
[Server]: Server running on port 5000 in development mode.
```

### 4. Verify Health Endpoint
Open a web browser or run `curl`:
```bash
curl http://localhost:5000/health
```

Expected JSON Response:
```json
{
  "status": "ok",
  "service": "Restaurant Expense Business API",
  "database": "connected",
  "timestamp": "2026-09-16T03:30:00.000Z"
}
```

---

## 🏃 Complete Local Microservices Execution (Summary for Phase 2+)

```bash
# Terminal 1: Backend API (Node.js + MongoDB)
cd backend
npm install
npm run dev

# Terminal 2: Python AI Service (Scaffolding)
cd ai-service
python -m venv venv
# Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# Terminal 3: React Frontend (Scaffolding)
cd frontend
npm install
npm run dev
```
