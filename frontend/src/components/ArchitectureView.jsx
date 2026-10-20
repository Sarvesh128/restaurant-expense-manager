import React from 'react';
import { 
  Server, 
  Database, 
  BrainCircuit, 
  Cpu, 
  ShieldCheck, 
  Layers, 
  FileText,
  FileCheck2,
  Workflow
} from 'lucide-react';

export default function ArchitectureView() {
  return (
    <div className="space-y-6 max-w-5xl mx-auto mb-12">
      
      {/* Principle Callout */}
      <div className="glass-card rounded-2xl p-6 border border-emerald-500/30 bg-gradient-to-r from-emerald-950/30 via-slate-900 to-slate-900">
        <div className="flex items-start space-x-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              Core Architectural Invariant
            </span>
            <h2 className="text-lg font-bold text-white mt-0.5">
              Strict Division: Deterministic Financial Arithmetic vs. AI/ML Understanding
            </h2>
            <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
              In accordance with banking and statutory accounting standards, AI and Machine Learning are 
              <strong className="text-emerald-400 font-semibold"> NEVER </strong> 
              permitted to perform financial arithmetic (addition, subtraction, totals, or tax reconciliations). 
              AI is dedicated to perception and fuzzy pattern tasks (OCR, Classification, Duplicate Similarity, Anomaly Detection). 
              All financial reporting and totals are executed deterministically in the Node.js/MongoDB backend.
            </p>
          </div>
        </div>
      </div>

      {/* Layer Architecture Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Layer 1: Client Application */}
        <div className="glass-card rounded-2xl p-5 border border-slate-800">
          <div className="w-9 h-9 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20 flex items-center justify-center mb-3">
            <Layers className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-white">Client Presentation Layer</h3>
          <p className="text-xs text-slate-400 mt-1">
            React 18 + Vite SPA styled with high-contrast glassmorphic Tailwind CSS.
          </p>
          <ul className="mt-3 space-y-1.5 text-xs text-slate-300">
            <li className="flex items-center space-x-2">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-400" />
              <span>Real-time Financial Aggregations</span>
            </li>
            <li className="flex items-center space-x-2">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-400" />
              <span>Multi-Parameter Query Filters</span>
            </li>
            <li className="flex items-center space-x-2">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-400" />
              <span>Deterministic Charting (Recharts)</span>
            </li>
          </ul>
        </div>

        {/* Layer 2: Core Business API */}
        <div className="glass-card rounded-2xl p-5 border border-slate-800">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center mb-3">
            <Server className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-white">Deterministic Business API</h3>
          <p className="text-xs text-slate-400 mt-1">
            Node.js + Express REST API managing authentication and authoritative calculations.
          </p>
          <ul className="mt-3 space-y-1.5 text-xs text-slate-300">
            <li className="flex items-center space-x-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>Strict Multi-Tenant Scoping</span>
            </li>
            <li className="flex items-center space-x-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>JWT & Role-based Access Control</span>
            </li>
            <li className="flex items-center space-x-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>Audit Logging & Schema Validation</span>
            </li>
          </ul>
        </div>

        {/* Layer 3: Python AI Microservice */}
        <div className="glass-card rounded-2xl p-5 border border-slate-800">
          <div className="w-9 h-9 rounded-xl bg-violet-500/10 text-violet-400 border border-violet-500/20 flex items-center justify-center mb-3">
            <BrainCircuit className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-white">Python AI / ML Service</h3>
          <p className="text-xs text-slate-400 mt-1">
            FastAPI microservice for document perception and statistical machine learning.
          </p>
          <ul className="mt-3 space-y-1.5 text-xs text-slate-300">
            <li className="flex items-center space-x-2">
              <span className="w-1.5 h-1.5 rounded-full bg-violet-400" />
              <span>OCR (Tesseract / PaddleOCR)</span>
            </li>
            <li className="flex items-center space-x-2">
              <span className="w-1.5 h-1.5 rounded-full bg-violet-400" />
              <span>TF-IDF + Logistic Regression ML</span>
            </li>
            <li className="flex items-center space-x-2">
              <span className="w-1.5 h-1.5 rounded-full bg-violet-400" />
              <span>Isolation Forest Anomaly Scoring</span>
            </li>
          </ul>
        </div>

      </div>

      {/* Pipeline Diagram */}
      <div className="glass-card rounded-2xl p-6 border border-slate-800">
        <h3 className="text-sm font-bold text-white mb-4 flex items-center space-x-2">
          <Workflow className="w-4 h-4 text-emerald-400" />
          <span>AI Document Processing & Reconciliation Pipeline</span>
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2 text-center text-xs">
          {[
            { step: '1', title: 'Upload', desc: 'PDF / Image' },
            { step: '2', title: 'OCR', desc: 'Raw Text' },
            { step: '3', title: 'Extract', desc: 'NLP Entities' },
            { step: '4', title: 'Classify', desc: 'ML Category' },
            { step: '5', title: 'Deduplicate', desc: 'Similarity Rule' },
            { step: '6', title: 'Anomaly', desc: 'Isolation Forest' },
            { step: '7', title: 'Reconcile', desc: 'Deterministic' },
          ].map((item, idx) => (
            <div key={item.step} className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
              <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-mono font-bold mx-auto mb-1.5 text-[10px]">
                {item.step}
              </div>
              <div className="font-semibold text-slate-200">{item.title}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">{item.desc}</div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
