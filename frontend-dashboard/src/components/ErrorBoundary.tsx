import { Component, ReactNode, ErrorInfo } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info);
  }

  reset = () => this.setState({ error: null });

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#070d1a] px-4">
          <div className="max-w-lg w-full bg-[#0b1120] border border-red-500/20 rounded-2xl p-6">
            <h2 className="text-lg font-bold text-red-400 mb-2">Something went wrong</h2>
            <p className="text-sm text-white/50 mb-4">
              The page crashed. Check the browser console for details.
            </p>
            <pre className="text-xs bg-[#070d1a] border border-white/5 rounded p-3 text-white/40 overflow-x-auto mb-4">
              {this.state.error.message}
            </pre>
            <div className="flex gap-2">
              <button
                onClick={this.reset}
                className="text-sm px-4 py-2 rounded-lg bg-[#00e599] hover:bg-[#00d488] text-black font-bold transition-colors"
              >
                Try again
              </button>
              <button
                onClick={() => (window.location.href = '/')}
                className="text-sm px-4 py-2 rounded-lg border border-white/10 text-white/60 hover:text-white hover:border-white/20 transition-colors"
              >
                Go home
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
