import React from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

interface Props { children: React.ReactNode; }
interface State { hasError: boolean; error: Error | null; }

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-[100dvh] bg-[#0d0d14] p-6">
          <div className="text-center max-w-md space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-rose-500/20 flex items-center justify-center mx-auto">
              <AlertTriangle size={32} className="text-rose-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white mb-2">Something went wrong</h1>
              <p className="text-sm text-white/50 leading-relaxed">
                An unexpected error occurred. Your data is safe in local storage.
              </p>
            </div>
            {this.state.error && (
              <pre className="text-xs text-rose-400/70 bg-rose-500/10 border border-rose-500/20 rounded-xl p-4 text-left overflow-auto max-h-32">
                {this.state.error.message}
              </pre>
            )}
            <button onClick={this.handleReset} className="inline-flex items-center gap-2 bg-blue-500 hover:bg-blue-400 text-white font-medium rounded-xl px-6 py-3 transition-all shadow-lg shadow-blue-900/30">
              <RotateCcw size={16} /> Try Again
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
