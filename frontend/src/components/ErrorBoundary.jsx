import React from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mb-4">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-bold text-white mb-2">Something went wrong</h1>
          <p className="text-sm text-slate-400 max-w-md mb-6">
            An unexpected error occurred while rendering the application component.
          </p>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-xs font-mono text-rose-300 max-w-lg overflow-x-auto text-left mb-6">
            {this.state.error?.toString() || 'Unknown UI Error'}
          </div>
          <button
            onClick={this.handleReload}
            className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-450 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20 flex items-center space-x-2 transition-all active:scale-95"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reload Application</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
