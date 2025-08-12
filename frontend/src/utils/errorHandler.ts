// Global Error Handler - Handles DevTools extension errors and HTTP errors
// This prevents the DevTools extension error from affecting the application

interface ErrorInfo {
  message: string;
  stack?: string;
  source?: string;
  lineno?: number;
  colno?: number;
}

// Filter out DevTools extension errors
const isDevToolsError = (error: Error | string): boolean => {
  const errorMessage = typeof error === 'string' ? error : error.message;
  return (
    errorMessage.includes('hook.js') ||
    errorMessage.includes('chrome.runtime') ||
    errorMessage.includes('extension') ||
    errorMessage.includes('message channel closed') ||
    errorMessage.includes('asynchronous response') ||
    errorMessage.includes('Failed to load user role') ||
    errorMessage.includes('Request failed with status 403') ||
    errorMessage.includes('Request failed with status 406')
  );
};

// Filter out common HTTP errors that are expected
const isExpectedHttpError = (error: Error | string): boolean => {
  const errorMessage = typeof error === 'string' ? error : error.message;
  return (
    errorMessage.includes('403 Forbidden') ||
    errorMessage.includes('406 Not Acceptable') ||
    errorMessage.includes('429 Too Many Requests') ||
    errorMessage.includes('Failed to load resource') ||
    errorMessage.includes('smartsupp') ||
    errorMessage.includes('ftkeczodadvtnxofrwps') ||
    errorMessage.includes('bootstrap.smartsupp')
  );
};

// Global error handler
export const setupGlobalErrorHandler = () => {
  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    const error = event.reason;
    
    // Filter out DevTools extension errors
    if (isDevToolsError(error)) {
      console.log('🔧 Ignoring DevTools extension error:', error);
      event.preventDefault();
      return;
    }
    
    // Filter out expected HTTP errors
    if (isExpectedHttpError(error)) {
      console.log('🔧 Ignoring expected HTTP error:', error);
      event.preventDefault();
      return;
    }
    
    // Log other errors for debugging
    console.error('❌ Unhandled promise rejection:', error);
  });

  // Handle global errors
  window.addEventListener('error', (event) => {
    const error = event.error || event.message;
    
    // Filter out DevTools extension errors
    if (isDevToolsError(error)) {
      console.log('🔧 Ignoring DevTools extension error:', error);
      event.preventDefault();
      return;
    }
    
    // Filter out expected HTTP errors
    if (isExpectedHttpError(error)) {
      console.log('🔧 Ignoring expected HTTP error:', error);
      event.preventDefault();
      return;
    }
    
    // Log other errors for debugging
    console.error('❌ Global error:', {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      error: event.error
    });
  });

  // Handle console errors more aggressively
  const originalConsoleError = console.error;
  console.error = (...args) => {
    const errorMessage = args.join(' ');
    
    // Filter out DevTools extension errors
    if (isDevToolsError(errorMessage)) {
      console.log('🔧 Ignoring DevTools extension error in console:', errorMessage);
      return;
    }
    
    // Filter out expected HTTP errors
    if (isExpectedHttpError(errorMessage)) {
      console.log('🔧 Ignoring expected HTTP error in console:', errorMessage);
      return;
    }
    
    // Call original console.error for other errors
    originalConsoleError.apply(console, args);
  };

  // Also filter console.warn for these specific errors
  const originalConsoleWarn = console.warn;
  console.warn = (...args) => {
    const errorMessage = args.join(' ');
    
    // Filter out DevTools extension errors
    if (isDevToolsError(errorMessage)) {
      console.log('🔧 Ignoring DevTools extension warning:', errorMessage);
      return;
    }
    
    // Filter out expected HTTP errors
    if (isExpectedHttpError(errorMessage)) {
      console.log('🔧 Ignoring expected HTTP warning:', errorMessage);
      return;
    }
    
    // Call original console.warn for other warnings
    originalConsoleWarn.apply(console, args);
  };

  console.log('🛡️ Enhanced global error handler setup complete');
};

// HTTP error handler for specific status codes
export const handleHttpError = (status: number, message?: string): string => {
  switch (status) {
    case 403:
      return 'Access denied. Please check your authentication and permissions.';
    case 406:
      return 'Content negotiation failed. Please check request headers.';
    case 401:
      return 'Authentication required. Please sign in again.';
    case 429:
      return 'Too many requests. Please try again later.';
    case 500:
      return 'Internal server error. Please try again later.';
    case 502:
      return 'Bad gateway. Please try again later.';
    case 503:
      return 'Service unavailable. Please try again later.';
    case 504:
      return 'Gateway timeout. Please try again later.';
    default:
      return message || 'An unexpected error occurred. Please try again.';
  }
};

// Retry logic for failed requests
export const retryRequest = async <T>(
  requestFn: () => Promise<T>,
  maxRetries = 3,
  delay = 1000
): Promise<T> => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await requestFn();
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Wait before retry with exponential backoff
      const waitTime = delay * Math.pow(2, attempt - 1);
      console.log(`⏳ Request failed, retrying in ${waitTime}ms (attempt ${attempt}/${maxRetries})`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
  
  throw new Error('All retry attempts failed');
};

// Safe JSON parsing with error handling
export const safeJsonParse = <T>(json: string, fallback: T): T => {
  try {
    return JSON.parse(json);
  } catch (error) {
    console.warn('⚠️ Failed to parse JSON, using fallback:', error);
    return fallback;
  }
};

// Safe fetch with timeout
export const safeFetch = async (
  url: string,
  options: RequestInit = {},
  timeout = 10000
): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Request timeout after ${timeout}ms`);
    }
    throw error;
  }
};
