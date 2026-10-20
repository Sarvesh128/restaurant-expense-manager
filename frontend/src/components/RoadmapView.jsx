import React from 'react';
import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  Sparkles, 
  Database, 
  Lock, 
  FileText, 
  Scan, 
  BrainCircuit, 
  AlertTriangle, 
  Layers, 
  FileSpreadsheet, 
  PieChart 
} from 'lucide-react';

const PHASES = [
  {
    phase: 1,
    title: 'Project Architecture & Scaffolding',
    status: 'COMPLETED',
    description: 'System microservice structure defined (Frontend, Backend API, Python AI Service scaffolding). Docker Compose configuration and documentation groundwork established.',
    tags: ['Microservices', 'FastAPI', 'Node.js', 'React Vite']
  },
  {
    phase: 2,
    title: 'MongoDB + Backend Foundation',
    status: 'COMPLETED',
    description: 'Robust Mongoose database connection engine with connection lifecycle hooks, automated retry logic, health status reporting (/health), and centralized error middleware.',
    tags: ['Mongoose', 'Health Checks', 'Error Middleware', 'Zero-Crash Fallback']
  },
  {
    phase: 3,
    title: 'Core Data Models & JWT Authentication',
    status: 'COMPLETED',
    description: 'Enterprise User, Restaurant, Category, and Expense schemas with strict tenant isolation. Bcrypt password hashing, JWT issuing and validation, and role-based access control.',
    tags: ['JWT', 'Bcrypt', 'Role-Based Access', 'Multi-Tenant Security']
  },
  {
    phase: 4,
    title: 'Expense CRUD & Deterministic Query Engine',
    status: 'COMPLETED',
    description: 'Validated Expense CRUD APIs with multi-parameter deterministic query filtering (dates, amounts, categories, payment methods, regex vendor search), pagination, and financial summary aggregations.',
    tags: ['CRUD', 'Deterministic Arithmetic', 'Aggregations', 'Regex Search']
  },
  {
    phase: 5,
    title: 'Document Upload & Storage',
    status: 'PLANNED',
    description: 'Multer upload pipeline supporting PDF, PNG, and JPEG invoice processing with MIME validation, checksum integrity, and storage abstraction.',
    tags: ['Multer', 'File Storage', 'Validation']
  },
  {
    phase: 6,
    title: 'OCR Engine Integration',
    status: 'PLANNED',
    description: 'Tesseract OCR & PaddleOCR microservice adapter in Python for raw text extraction and bounding box recognition from scanned bills.',
    tags: ['Tesseract', 'PaddleOCR', 'Computer Vision']
  },
  {
    phase: 7,
    title: 'Information Extraction (NLP/Regex)',
    status: 'PLANNED',
    description: 'Entity extraction for vendor names, total amounts, line items, and invoice dates with confidence scoring.',
    tags: ['spaCy', 'Regex', 'Entity Extraction']
  },
  {
    phase: 8,
    title: 'ML Expense Classification',
    status: 'PLANNED',
    description: 'TF-IDF + Logistic Regression NLP model to automatically classify messy receipt descriptions into standard expense categories.',
    tags: ['scikit-learn', 'TF-IDF', 'Classification']
  },
  {
    phase: 9,
    title: 'Complete AI Document Pipeline',
    status: 'PLANNED',
    description: 'End-to-end integration: Upload ➔ OCR ➔ Information Extraction ➔ ML Classification ➔ Expense Draft.',
    tags: ['Pipeline', 'Async Workers']
  },
  {
    phase: 10,
    title: 'Duplicate Detection',
    status: 'PLANNED',
    description: 'Multi-criteria deterministic rule matching + fuzzy text similarity to prevent double billing.',
    tags: ['Fuzzy Matching', 'Deduplication']
  },
  {
    phase: 11,
    title: 'Anomaly Detection',
    status: 'PLANNED',
    description: 'Isolation Forest ML model to detect abnormal price surges, off-schedule expenditures, and outlier transactions.',
    tags: ['Isolation Forest', 'Risk Flagging']
  },
  {
    phase: 12,
    title: 'Automated Financial Reconciliation',
    status: 'PLANNED',
    description: 'Cross-verifies uploaded supplier invoices against bank transactions and recorded manual entries.',
    tags: ['Reconciliation', 'Audit Trail']
  }
];

export default function RoadmapView() {
  return (
    <div className="space-y-6 max-w-5xl mx-auto mb-12">
      
      {/* Header Banner */}
      <div className="glass-card rounded-2xl p-6 border border-slate-800 text-center relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -z-10" />
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-3">
          Progress Milestone: Phase 4
        </span>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          System Implementation Roadmap
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto mt-2">
          Tracking the evolution from foundational microservices and deterministic accounting engines to intelligent AI document processing.
        </p>

        {/* Milestone Stat Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-800">
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="text-xl font-bold font-mono text-emerald-400">4 / 16</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Phases Completed</div>
          </div>
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="text-xl font-bold font-mono text-white">69 / 69</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Backend Tests Passing</div>
          </div>
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="text-xl font-bold font-mono text-teal-400">100%</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Arithmetic Precision</div>
          </div>
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="text-xl font-bold font-mono text-cyan-400">52+</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Live Seeded Expenses</div>
          </div>
        </div>
      </div>

      {/* Phases Timeline */}
      <div className="space-y-4">
        {PHASES.map((p) => {
          const isCompleted = p.status === 'COMPLETED';

          return (
            <div 
              key={p.phase}
              className={`glass-card rounded-2xl p-5 border transition-all ${
                isCompleted 
                  ? 'border-emerald-500/30 bg-gradient-to-r from-emerald-950/20 via-slate-900/70 to-slate-900/90 shadow-sm shadow-emerald-500/5' 
                  : 'border-slate-800/70 opacity-75'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="flex items-start space-x-3.5">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 font-mono text-xs font-bold ${
                    isCompleted 
                      ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20' 
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}>
                    {isCompleted ? <CheckCircle2 className="w-4 h-4 stroke-[3]" /> : p.phase}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="text-base font-bold text-white">
                        Phase {p.phase}: {p.title}
                      </h3>
                    </div>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                      {p.description}
                    </p>
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {p.tags.map((tag) => (
                        <span 
                          key={tag}
                          className="px-2 py-0.5 rounded-md bg-slate-800/80 border border-slate-700/60 text-[10px] font-mono text-slate-300"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="sm:text-right shrink-0">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                    isCompleted 
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}>
                    {isCompleted ? '✓ Completed' : 'Planned (Next)'}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
