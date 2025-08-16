import React, { Component, ErrorInfo, ReactNode } from 'react';
import logger from '@/utils/logger';

interface Props {
  children: ReactNode;
  componentName: string;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class SafeComponent extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error(`SafeComponent Error in ${this.props.componentName}:`, error);
    logger.error('Error stack:', error.stack);
    logger.error('Component stack:', errorInfo.componentStack);

    this.setState({
      error,
    });
  }

  componentDidMount() {
    logger.log(`SafeComponent mounted: ${this.props.componentName}`);
  }

  componentWillUnmount() {
    logger.log(`SafeComponent unmounting: ${this.props.componentName}`);
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
    });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default safe component error UI
      return (
        <div className="p-4 border border-red-200 rounded-md bg-red-50">
          <div className="flex items-center gap-2 mb-2">
            <div className="text-red-500 text-lg">⚠️</div>
            <h3 className="text-sm font-medium text-red-800">
              Component Error: {this.props.componentName}
            </h3>
          </div>
          <p className="text-xs text-red-600 mb-3">
            This component encountered an error and couldn't render properly.
          </p>
          <button
            onClick={this.handleRetry}
            className="text-xs bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700 transition-colors"
          >
            Retry
          </button>

          {/* Error details for development */}
          {import.meta.env.DEV && this.state.error && (
            <details className="mt-3">
              <summary className="cursor-pointer text-xs text-red-600 hover:text-red-800">
                Error Details (Development)
              </summary>
              <div className="mt-1 p-2 bg-red-100 rounded text-xs font-mono overflow-auto max-h-20">
                <pre className="whitespace-pre-wrap">{this.state.error.toString()}</pre>
              </div>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default SafeComponent;
