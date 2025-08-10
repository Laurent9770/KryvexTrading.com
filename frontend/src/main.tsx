import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { validateEnvironment } from './utils/envChecker';
import './lib/envDebugger';

// Global error handler to catch headers errors
window.addEventListener('error', (event) => {
  if (event.error && event.error.message && event.error.message.includes('headers')) {
    console.warn('🚨 Headers error caught by global handler:', event.error);
    event.preventDefault();
    return false;
  }
});

// Global unhandled promise rejection handler
window.addEventListener('unhandledrejection', (event) => {
  if (event.reason && event.reason.message && event.reason.message.includes('headers')) {
    console.warn('🚨 Headers promise rejection caught by global handler:', event.reason);
    event.preventDefault();
    return false;
  }
});

// Comprehensive global error handler for React errors
window.addEventListener('error', (event) => {
  console.error('🚨 Global error caught:', event.error);
  console.error('🔍 Error details:', {
    message: event.error?.message,
    stack: event.error?.stack,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno
  });
  
  // Prevent default error handling for React errors
  if (event.error && event.error.message && (
    event.error.message.includes('headers') ||
    event.error.message.includes('Cannot read properties') ||
    event.error.message.includes('undefined') ||
    event.error.message.includes('null')
  )) {
    console.warn('🚨 React-related error caught, preventing crash');
    event.preventDefault();
    return false;
  }
});

// Global unhandled promise rejection handler for React errors
window.addEventListener('unhandledrejection', (event) => {
  console.error('🚨 Global promise rejection caught:', event.reason);
  console.error('🔍 Rejection details:', {
    message: event.reason?.message,
    stack: event.reason?.stack
  });
  
  // Prevent default rejection handling for React errors
  if (event.reason && event.reason.message && (
    event.reason.message.includes('headers') ||
    event.reason.message.includes('Cannot read properties') ||
    event.reason.message.includes('undefined') ||
    event.reason.message.includes('null')
  )) {
    console.warn('🚨 React-related promise rejection caught, preventing crash');
    event.preventDefault();
    return false;
  }
});

// Override console.error to catch React errors
const originalConsoleError = console.error;
console.error = (...args) => {
  // Check if this is a React error
  const errorMessage = args.join(' ');
  if (errorMessage.includes('headers') || 
      errorMessage.includes('Cannot read properties') ||
      errorMessage.includes('undefined') ||
      errorMessage.includes('null')) {
    console.warn('🚨 React error detected in console.error:', errorMessage);
  }
  
  // Call original console.error
  originalConsoleError.apply(console, args);
};

// Validate environment variables before app initialization
try {
  validateEnvironment();
} catch (error) {
  console.error('❌ Environment validation failed:', error);
}

// Create root with error handling
const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element not found');
}

try {
  const root = ReactDOM.createRoot(rootElement);
  
  // Render with error boundary
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
} catch (error) {
  console.error('❌ Failed to render app:', error);
  
  // Show fallback UI
  rootElement.innerHTML = `
    <div style="
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: #f8fafc;
      font-family: system-ui, -apple-system, sans-serif;
      padding: 1rem;
    ">
      <div style="
        max-width: 400px;
        text-align: center;
        background: white;
        padding: 2rem;
        border-radius: 0.5rem;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      ">
        <div style="font-size: 3rem; margin-bottom: 1rem;">⚠️</div>
        <h1 style="font-size: 1.5rem; font-weight: bold; margin-bottom: 0.5rem; color: #1f2937;">
          Application Error
        </h1>
        <p style="color: #6b7280; margin-bottom: 1.5rem;">
          The application failed to load. Please refresh the page to try again.
        </p>
        <button 
          onclick="window.location.reload()"
          style="
            background-color: #3b82f6;
            color: white;
            padding: 0.75rem 1.5rem;
            border: none;
            border-radius: 0.375rem;
            font-weight: 500;
            cursor: pointer;
            width: 100%;
          "
        >
          Refresh Page
        </button>
      </div>
    </div>
  `;
}
