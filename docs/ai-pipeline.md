# AI Document Processing & Machine Learning Pipeline Specification

## 1. End-to-End Pipeline Architecture

```
  ┌─────────────────────────────────────────────────────────────┐
  │                    1. DOCUMENT UPLOAD                       │
  │     Accepts JPG, PNG, PDF receipts/invoices (Max 10MB)      │
  └──────────────────────────────┬──────────────────────────────┘
                                 │
                                 ▼
  ┌─────────────────────────────────────────────────────────────┐
  │                   2. OCR TEXT EXTRACTION                    │
  │ Modular Engine: Tesseract / PaddleOCR ➔ Raw Unstructured Text │
  └──────────────────────────────┬──────────────────────────────┘
                                 │
                                 ▼
  ┌─────────────────────────────────────────────────────────────┐
  │                3. INFORMATION EXTRACTION                    │
  │   Regex + NLP ➔ Vendor, Date, Invoice #, Amount, Tax, Items │
  └──────────────────────────────┬──────────────────────────────┘
                                 │
                                 ▼
  ┌─────────────────────────────────────────────────────────────┐
  │               4. ML EXPENSE CLASSIFICATION                  │
  │     TF-IDF + Logistic Regression ➔ Predicted Category       │
  └──────────────────────────────┬──────────────────────────────┘
                                 │
                                 ▼
  ┌─────────────────────────────────────────────────────────────┐
  │                    5. DUPLICATE DETECTION                   │
  │ Deterministic Match (Invoice#, Vendor, Amount) + Similarity │
  └──────────────────────────────┬──────────────────────────────┘
                                 │
                                 ▼
  ┌─────────────────────────────────────────────────────────────┐
  │                    6. ANOMALY DETECTION                     │
  │   Isolation Forest Model ➔ Anomaly Score & Spending Alerts  │
  └──────────────────────────────┬──────────────────────────────┘
                                 │
                                 ▼
  ┌─────────────────────────────────────────────────────────────┐
  │                   7. RECONCILIATION MATCH                   │
  │  Compare Invoice Candidates vs Recorded DB Expenses         │
  └──────────────────────────────┬──────────────────────────────┘
                                 │
                                 ▼
  ┌─────────────────────────────────────────────────────────────┐
  │              8. HUMAN-IN-THE-LOOP VERIFICATION              │
  │   Low confidence (<0.85) or mismatch ➔ Flagged for Review   │
  └─────────────────────────────────────────────────────────────┘
```

---

## 2. Phase-by-Phase Technical Details

### Phase 6: OCR (Optical Character Recognition)
* **Goal**: Convert binary document pixel data or PDF text vectors into raw string content.
* **Architecture**: Interface wrapper `BaseOCREngine` with pluggable implementations (`TesseractEngine`, `PaddleOCREngine`).
* **Preprocessing**: Image binarization, noise removal, grayscale conversion, and deskewing via OpenCV/PIL.

### Phase 7: Information Extraction
* **Goal**: Transform raw text into structured JSON candidate objects.
* **Target Fields**:
  - `vendor`: Identified via top-lines heuristics, regex block matching, and keyword dictionary lookup.
  - `invoiceNumber`: Matched via pattern expressions (`INV-\d+`, `Invoice\s*#?\s*:\s*([A-Z0-9-]+)`).
  - `date`: Parsed via dateutil engine supporting multiple date formats (`DD/MM/YYYY`, `YYYY-MM-DD`, `DD Mon YYYY`).
  - `totalAmount`: Identified via monetary keywords (`Total`, `Grand Total`, `Net Amount`) taking the maximum valid numeric pattern.

### Phase 8: ML Expense Classification
* **Input**: Expense Description string (e.g., `"Purchased 10 cans cooking oil and spices"`).
* **Pipeline**:
  1. Text Cleaning: Lowercasing, punctuation stripping, stopword removal.
  2. Vectorization: `TfidfVectorizer(ngram_range=(1, 2), max_features=1000)`.
  3. Classifier: `LogisticRegression(C=1.0, solver='lbfgs', multi_class='multinomial')`.
* **Output**: Category label (`Raw Materials`, `Utilities`, etc.) + `categoryConfidence` (0.0 to 1.0).
* **Evaluation Metrics**: Precision, Recall, F1 Score, Confusion Matrix computed on test split.

### Phase 10: Duplicate Detection
* **Level 1 (Deterministic)**: Match (`invoiceNumber` + `vendor`) OR (`vendor` + `amount` + `date`).
* **Level 2 (Similarity)**: Levenshtein distance on descriptions + fuzzy matching on vendor names within a 3-day date window.
* **Output**: `isDuplicate: boolean`, `matchedExpenseId`, `confidence`.

### Phase 11: Anomaly Detection
* **Model**: `IsolationForest(n_estimators=100, contamination=0.05, random_state=42)`.
* **Features**:
  - `amount`: Transaction numerical magnitude.
  - `category_encoded`: Categorical index.
  - `deviation_from_category_mean`: Z-score relative to category historical mean.
  - `vendor_frequency`: Frequency of transaction with this vendor.
* **Output**: `isAnomaly: boolean`, `anomalyScore` (-1 to 1).

### Phase 12: Reconciliation Engine
* Compares Source Invoice values against Recorded DB Expense entries.
* Emits status: `MATCHED`, `AMOUNT_MISMATCH`, `DATE_MISMATCH`, `VENDOR_MISMATCH`, `MISSING_RECORD`, `MISSING_DOCUMENT`.
* Always generates explicit human-readable reasons (e.g., *"Invoice amount ₹12,500 differs from recorded expense amount ₹13,500 by ₹1,000"*).
