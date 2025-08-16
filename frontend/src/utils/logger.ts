// =============================================
// PRODUCTION-SAFE LOGGER UTILITY
// =============================================

interface Logger {
  log: (...args: any[]) => void;
  warn: (...args: any[]) => void;
  error: (...args: any[]) => void;
  info: (...args: any[]) => void;
  debug: (...args: any[]) => void;
}

// Development logger - shows all logs
const devLogger: Logger = {
  log: (...args) => console.log(...args),
  warn: (...args) => console.warn(...args),
  error: (...args) => console.error(...args),
  info: (...args) => console.info(...args),
  debug: (...args) => console.debug(...args),
};

// Production logger - only shows errors and warnings
const prodLogger: Logger = {
  log: () => {}, // No-op in production
  warn: (...args) => console.warn(...args), // Keep warnings in production
  error: (...args) => console.error(...args), // Keep errors in production
  info: () => {}, // No-op in production
  debug: () => {}, // No-op in production
};

// Export the appropriate logger based on environment
const logger = (() => {
  try {
    // Try import.meta first (development)
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.DEV) {
      return devLogger;
    }
  } catch (error) {
    // import.meta not available, fall back to window.env
  }
  
  // Fallback to window.env (production)
  if (typeof window !== 'undefined' && (window as any).env && (window as any).env.NODE_ENV === 'development') {
    return devLogger;
  }
  
  return prodLogger;
})();

export default logger;

// Convenience functions for common logging patterns
export const logAuth = (message: string, data?: any) => {
  logger.log(`🔐 ${message}`, data);
};

export const logWallet = (message: string, data?: any) => {
  logger.log(`💰 ${message}`, data);
};

export const logError = (message: string, error?: any) => {
  logger.error(`❌ ${message}`, error);
};

export const logSuccess = (message: string, data?: any) => {
  logger.log(`✅ ${message}`, data);
};

export const logWarning = (message: string, data?: any) => {
  logger.warn(`⚠️ ${message}`, data);
};

export const logDebug = (message: string, data?: any) => {
  logger.debug(`🔍 ${message}`, data);
};
