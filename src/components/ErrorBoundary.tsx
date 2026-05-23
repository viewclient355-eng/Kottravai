import React, { ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // You can also log the error to an analytics service
    console.error('Uncaught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-white px-4 text-center">
            <div className="max-w-md">
                <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
                </div>
                <h1 className="text-2xl font-bold text-[#2D1B4E] mb-4">Something went wrong</h1>
                <p className="text-gray-500 mb-8">
                    We encountered an unexpected error while loading this page. Please try refreshing or visiting our home page.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <button 
                        onClick={() => window.location.reload()} 
                        className="px-8 py-3 bg-[#b5128f] text-white rounded-xl font-bold hover:bg-[#8E2A8B] transition-all"
                    >
                        Refresh Page
                    </button>
                    <a 
                        href="/" 
                        className="px-8 py-3 border border-gray-200 text-gray-600 rounded-xl font-bold hover:bg-gray-50 transition-all"
                    >
                        Back to Home
                    </a>
                </div>
                {import.meta.env.DEV && (
                    <div className="mt-10 p-4 bg-gray-50 rounded-lg text-left overflow-auto max-h-40">
                        <pre className="text-[10px] text-red-600 font-mono">
                            {this.state.error?.toString()}
                        </pre>
                    </div>
                )}
            </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
