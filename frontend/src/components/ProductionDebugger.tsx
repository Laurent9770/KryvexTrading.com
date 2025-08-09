import React, { useEffect, useState } from 'react';

interface DebugInfo {
  hostname: string;
  userAgent: string;
  timestamp: string;
  supabaseClient: boolean;
  errors: string[];
}

const ProductionDebugger: React.FC = () => {
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Only show in production if there are issues
    const hostname = window.location.hostname;
    const isProduction = !hostname.includes('localhost') && !hostname.includes('127.0.0.1');
    
    if (isProduction) {
      const errors: string[] = [];
      let supabaseClient = false;

      try {
        // Check if Supabase client is available
        const { supabase } = require('@/integrations/supabase/client');
        supabaseClient = !!(supabase && supabase.auth);
      } catch (error) {
        errors.push(`Supabase import error: ${error}`);
      }

      const info: DebugInfo = {
        hostname,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        supabaseClient,
        errors
      };

      setDebugInfo(info);
      
      // Auto-show if there are errors
      if (errors.length > 0 || !supabaseClient) {
        setIsVisible(true);
      }

      // Log for debugging
      console.log('🔧 Production Debug Info:', info);
    }
  }, []);

  if (!debugInfo) return null;

  return (
    <>
      {/* Debug toggle button */}
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="fixed bottom-4 right-4 z-50 bg-red-600 text-white px-3 py-2 rounded-full text-xs"
        style={{ zIndex: 9999 }}
      >
        DEBUG
      </button>

      {/* Debug panel */}
      {isVisible && (
        <div 
          className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-80 z-50 flex items-center justify-center p-4"
          style={{ zIndex: 9998 }}
        >
          <div className="bg-gray-900 text-white p-6 rounded-lg max-w-lg w-full max-h-96 overflow-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">🔧 Production Debug</h2>
              <button
                onClick={() => setIsVisible(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <div>
                <strong>Hostname:</strong> {debugInfo.hostname}
              </div>
              <div>
                <strong>Timestamp:</strong> {debugInfo.timestamp}
              </div>
              <div>
                <strong>Supabase Client:</strong> 
                <span className={debugInfo.supabaseClient ? 'text-green-400' : 'text-red-400'}>
                  {debugInfo.supabaseClient ? ' ✅ Working' : ' ❌ Failed'}
                </span>
              </div>

              {debugInfo.errors.length > 0 && (
                <div>
                  <strong className="text-red-400">Errors:</strong>
                  <ul className="mt-2 space-y-1">
                    {debugInfo.errors.map((error, index) => (
                      <li key={index} className="text-red-300 text-xs bg-red-900 p-2 rounded">
                        {error}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="text-xs text-gray-400 mt-4">
                Check browser console for more details
              </div>

              <div className="flex space-x-2 mt-4">
                <button
                  onClick={() => window.location.reload()}
                  className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-xs"
                >
                  Reload
                </button>
                <button
                  onClick={() => window.location.href = '/'}
                  className="bg-gray-600 hover:bg-gray-700 px-3 py-1 rounded text-xs"
                >
                  Home
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ProductionDebugger;
