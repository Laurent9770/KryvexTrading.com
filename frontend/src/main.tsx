import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';
import { validateEnvironment } from './utils/envChecker';
import './lib/envDebugger';

// Validate environment variables before app initialization
const envValid = validateEnvironment();

if (!envValid) {
  // Create a simple fallback UI when environment is not properly configured
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <div style={{ 
        padding: '20px', 
        maxWidth: '600px', 
        margin: '0 auto', 
        textAlign: 'center',
        fontFamily: 'Arial, sans-serif'
      }}>
        <h1>Configuration Error</h1>
        <p>Missing required environment variables. Check browser console for details.</p>
        <p>Please make sure your .env file or deployment configuration includes all required variables.</p>
      </div>
    </React.StrictMode>,
  );
} else {
  // Normal app initialization when environment is properly configured
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </React.StrictMode>,
  );
}
