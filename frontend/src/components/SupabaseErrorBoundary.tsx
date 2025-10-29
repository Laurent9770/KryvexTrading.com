import React, { Component, ErrorInfo, ReactNode } from 'react';
import logger from '@/utils/logger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class SupabaseErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Check if this is a Supabase-related error
    const isSupabaseError = this.isSupabaseError(error);
    
    if (isSupabaseError) {
      // Limit noisy logging to development for clearer production consoles
      if (import.meta && import.meta.env && import.meta.env.DEV) {
        logger.error('Supabase Error caught by boundary:', error);
        logger.error('Error stack:', error.stack);
        logger.error('Component stack:', errorInfo.componentStack);
      } else {
        // Keep a single concise error entry in production
        logger.error('Supabase Error caught by boundary:', error.message);
      }
    } else {
      // Re-throw non-Supabase errors to parent error boundaries in development
      // to aid debugging. In production, capture and render a generic fallback
      // to avoid duplicate console noise from multiple boundaries.
      if (import.meta && import.meta.env && import.meta.env.DEV) {
        throw error;
      }
    }

    this.setState({
      error,
      errorInfo,
    });
  }

  private isSupabaseError(error: Error): boolean {
    const errorMessage = error.message.toLowerCase();
    const errorStack = error.stack?.toLowerCase() || '';
    
    return (
      errorMessage.includes('supabase') ||
      errorMessage.includes('postgrest') ||
      errorMessage.includes('realtime') ||
      errorMessage.includes('auth') ||
      errorMessage.includes('database') ||
      errorMessage.includes('sql') ||
      errorMessage.includes('postgres') ||
      errorStack.includes('supabase') ||
      errorStack.includes('postgrest') ||
      errorStack.includes('realtime')
    );
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleRefresh = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default Supabase error UI
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <div className="max-w-md w-full text-center">
            <div className="text-blue-500 text-6xl mb-4">🔌</div>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Database Connection Issue
            </h1>
            <p className="text-muted-foreground mb-6">
              We're experiencing issues connecting to our database. This might be a temporary problem.
            </p>
            
            <div className="space-y-3">
              <button
                onClick={this.handleRetry}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Try Again
              </button>
              
              <button
                onClick={this.handleRefresh}
                className="w-full bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh Page
              </button>
            </div>

            {/* Error details for development */}
            {import.meta.env.DEV && this.state.error && (
              <details className="mt-6 text-left">
                <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
                  Supabase Error Details (Development)
                </summary>
                <div className="mt-2 p-3 bg-blue-50 rounded text-xs font-mono overflow-auto max-h-40">
                  <div className="mb-2">
                    <strong>Error:</strong>
                    <pre className="whitespace-pre-wrap">{this.state.error.toString()}</pre>
                  </div>
                  {this.state.errorInfo && (
                    <div className="mb-2">
                      <strong>Error stack:</strong>
                      <pre className="whitespace-pre-wrap">{this.state.error.stack}</pre>
                    </div>
                  )}
                  {this.state.errorInfo && (
                    <div>
                      <strong>Component stack:</strong>
                      <pre className="whitespace-pre-wrap">{this.state.errorInfo.componentStack}</pre>
                    </div>
                  )}
                </div>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default SupabaseErrorBoundary;
