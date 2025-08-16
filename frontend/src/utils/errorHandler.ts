import logger from './logger';

// =============================================
// GLOBAL ERROR HANDLER UTILITY
// =============================================

interface ErrorHandlerConfig {
  enableConsoleLogging: boolean;
  enableErrorReporting: boolean;
  maxErrorCount: number;
  errorTimeout: number;
}

const defaultConfig: ErrorHandlerConfig = {
  enableConsoleLogging: import.meta.env.DEV,
  enableErrorReporting: true,
  maxErrorCount: 10,
  errorTimeout: 5000,
};

class GlobalErrorHandler {
  private config: ErrorHandlerConfig;
  private errorCount = 0;
  private lastErrorTime = 0;
  private errorQueue: Array<{ error: Error; context: string; timestamp: number }> = [];

  constructor(config: Partial<ErrorHandlerConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
    this.setupGlobalHandlers();
  }

  private setupGlobalHandlers() {
    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      // Filter out Smartsupp-related errors
      if (this.isSmartsuppError(event.reason)) {
        if (import.meta.env.DEV) {
          console.log('🔧 Ignoring Smartsupp promise rejection:', event.reason);
        }
        event.preventDefault();
        return;
      }
      
      this.handleError(event.reason, 'Unhandled Promise Rejection');
      event.preventDefault();
    });

    // Handle global errors
    window.addEventListener('error', (event) => {
      // Filter out Smartsupp-related errors
      if (this.isSmartsuppError(event.error || event.message)) {
        if (import.meta.env.DEV) {
          console.log('🔧 Ignoring Smartsupp error:', event.error || event.message);
        }
        event.preventDefault();
        return;
      }
      
      this.handleError(event.error || new Error(event.message), 'Global Error');
      event.preventDefault();
    });

    // Handle React errors (if React is available)
    if (typeof window !== 'undefined' && (window as any).React) {
      const originalConsoleError = console.error;
      console.error = (...args) => {
        // Check for React error patterns
        const errorMessage = args.join(' ');
        if (errorMessage.includes('React') || errorMessage.includes('Warning')) {
          this.handleError(new Error(errorMessage), 'React Error');
        }
        originalConsoleError.apply(console, args);
      };
    }

    // Handle CSP violations
    if ('SecurityPolicyViolationEvent' in window) {
      document.addEventListener('securitypolicyviolation', (event) => {
        this.handleCSPViolation(event);
      });
    }

    // Handle network errors
    window.addEventListener('online', () => {
      logger.log('Network connection restored');
    });

    window.addEventListener('offline', () => {
      this.handleError(new Error('Network connection lost'), 'Network Error');
    });
  }

  public handleError(error: Error, context: string) {
    const now = Date.now();
    
    // Rate limiting
    if (now - this.lastErrorTime < this.config.errorTimeout) {
      this.errorCount++;
      if (this.errorCount > this.config.maxErrorCount) {
        return; // Ignore excessive errors
      }
    } else {
      this.errorCount = 1;
      this.lastErrorTime = now;
    }

    // Add to queue
    this.errorQueue.push({
      error,
      context,
      timestamp: now,
    });

    // Keep only recent errors
    if (this.errorQueue.length > 20) {
      this.errorQueue.shift();
    }

    // Log error
    if (this.config.enableConsoleLogging) {
      logger.error(`[${context}] ${error.message}`, {
        stack: error.stack,
        timestamp: new Date(now).toISOString(),
        errorCount: this.errorCount,
      });
    }

    // Report error if enabled
    if (this.config.enableErrorReporting) {
      this.reportError(error, context);
    }
  }

  private isSmartsuppError(error: any): boolean {
    if (!error) return false;
    
    const errorMessage = typeof error === 'string' ? error : error.message || '';
    const errorStack = error.stack || '';
    const errorSource = error.filename || '';
    
    return (
      errorMessage.toLowerCase().includes('smartsupp') ||
      errorMessage.toLowerCase().includes('bootstrap.smartsuppchat.com') ||
      errorStack.toLowerCase().includes('smartsupp') ||
      errorSource.toLowerCase().includes('smartsupp') ||
      errorMessage.includes('Request failed with status 0') ||
      errorMessage.includes('CSP Violation') && errorMessage.includes('smartsupp')
    );
  }

  private handleCSPViolation(event: SecurityPolicyViolationEvent) {
    const cspError = new Error(
      `CSP Violation: ${event.violatedDirective} directive violated by ${event.blockedURI}`
    );

    logger.warn('Content Security Policy Violation', {
      directive: event.violatedDirective,
      blockedURI: event.blockedURI,
      sourceFile: event.sourceFile,
      lineNumber: event.lineNumber,
      columnNumber: event.columnNumber,
    });

    this.handleError(cspError, 'CSP Violation');
  }

  private async reportError(error: Error, context: string) {
    try {
      // You can integrate with error reporting services here
      // Example: Sentry, LogRocket, etc.
      
      const errorReport = {
        message: error.message,
        stack: error.stack,
        context,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        errorCount: this.errorCount,
      };

      // For now, just log to console in development
      if (import.meta.env.DEV) {
        console.group('🚨 Error Report');
        console.log('Error:', errorReport);
        console.groupEnd();
      }

      // You could send to your backend or error reporting service
      // await fetch('/api/error-report', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(errorReport),
      // });

    } catch (reportError) {
      // Don't let error reporting cause more errors
      if (import.meta.env.DEV) {
        console.error('Failed to report error:', reportError);
      }
    }
  }

  // Public methods
  public getErrorQueue() {
    return [...this.errorQueue];
  }

  public clearErrorQueue() {
    this.errorQueue = [];
    this.errorCount = 0;
  }

  public getErrorStats() {
    return {
      totalErrors: this.errorQueue.length,
      recentErrorCount: this.errorCount,
      lastErrorTime: this.lastErrorTime,
    };
  }
}

// Create global instance
const globalErrorHandler = new GlobalErrorHandler();

// Export setup function
export const setupGlobalErrorHandler = () => {
  return globalErrorHandler;
};

// Export utility functions
export const handleAsyncError = async <T>(
  asyncFn: () => Promise<T>,
  context: string = 'Async Operation'
): Promise<T | null> => {
  try {
    return await asyncFn();
  } catch (error) {
    globalErrorHandler.handleError(error as Error, context);
    return null;
  }
};

export const handleSyncError = <T>(
  syncFn: () => T,
  context: string = 'Sync Operation'
): T | null => {
  try {
    return syncFn();
  } catch (error) {
    globalErrorHandler.handleError(error as Error, context);
    return null;
  }
};

// Supabase-specific error handler
export const handleSupabaseError = (error: any, operation: string) => {
  const errorMessage = error?.message || 'Unknown Supabase error';
  const context = `Supabase ${operation}`;
  
  logger.error(`[${context}] ${errorMessage}`, {
    error,
    operation,
    timestamp: new Date().toISOString(),
  });

  globalErrorHandler.handleError(new Error(errorMessage), context);
};

// React-specific error handler
export const handleReactError = (error: Error, errorInfo?: any) => {
  const context = 'React Component Error';
  
  logger.error(`[${context}] ${error.message}`, {
    error,
    errorInfo,
    componentStack: errorInfo?.componentStack,
    timestamp: new Date().toISOString(),
  });

  globalErrorHandler.handleError(error, context);
};

export default globalErrorHandler;
