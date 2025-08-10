import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './lib/envDebugger'

// Debug: Log current domain
console.log('🌐 Current domain:', window.location.hostname);
console.log('🔗 Full URL:', window.location.href);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
