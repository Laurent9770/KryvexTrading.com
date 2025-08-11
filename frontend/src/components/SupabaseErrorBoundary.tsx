import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class SupabaseErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Supabase Error Boundary caught an error:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  handleRefresh = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const error = this.state.error;
      const isSupabaseError = error?.message?.includes('Supabase') || 
                             error?.message?.includes('headers') ||
                             error?.message?.includes('environment');

      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <CardTitle className="text-xl">Connection Error</CardTitle>
              <CardDescription>
                {isSupabaseError 
                  ? "We're having trouble connecting to our services."
                  : "Something went wrong with the application."
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isSupabaseError && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    This appears to be a configuration issue. Please check your environment setup.
                  </AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-2">
                <Button 
                  onClick={this.handleRetry} 
                  className="w-full"
                  variant="default"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Try Again
                </Button>
                
                <Button 
                  onClick={this.handleRefresh} 
                  className="w-full"
                  variant="outline"
                >
                  <Settings className="mr-2 h-4 w-4" />
                  Refresh Page
                </Button>
              </div>

              {process.env.NODE_ENV === 'development' && error && (
                <details className="mt-4 text-sm text-gray-600">
                  <summary className="cursor-pointer font-medium">Error Details (Development)</summary>
                  <pre className="mt-2 whitespace-pre-wrap rounded bg-gray-100 p-2 text-xs">
                    {error.message}
                    {this.state.errorInfo && `\n\n${this.state.errorInfo.componentStack}`}
                  </pre>
                </details>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default SupabaseErrorBoundary;
