// =============================================
// ENVIRONMENT VALIDATION UTILITY
// =============================================

export interface EnvironmentConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  apiUrl?: string;
  wsUrl?: string;
  mode: string;
  isProduction: boolean;
  isDevelopment: boolean;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  config: EnvironmentConfig;
}

// =============================================
// ENVIRONMENT VALIDATION FUNCTIONS
// =============================================

export const validateEnvironment = (): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Get environment variables
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const apiUrl = import.meta.env.VITE_API_URL;
  const wsUrl = import.meta.env.VITE_WS_URL;
  const mode = import.meta.env.MODE;
  
  // Validate Supabase URL
  if (!supabaseUrl) {
    errors.push('VITE_SUPABASE_URL is not defined');
  } else if (!supabaseUrl.startsWith('https://')) {
    errors.push('VITE_SUPABASE_URL must be a valid HTTPS URL');
  } else if (supabaseUrl.includes('your-project') || supabaseUrl.includes('placeholder')) {
    errors.push('VITE_SUPABASE_URL contains placeholder values');
  }
  
  // Validate Supabase Anon Key
  if (!supabaseAnonKey) {
    errors.push('VITE_SUPABASE_ANON_KEY is not defined');
  } else if (supabaseAnonKey.length < 50) {
    errors.push('VITE_SUPABASE_ANON_KEY appears to be invalid (too short)');
  } else if (supabaseAnonKey.includes('your-anon-key') || supabaseAnonKey.includes('placeholder')) {
    errors.push('VITE_SUPABASE_ANON_KEY contains placeholder values');
  }
  
  // Validate API URL (optional)
  if (apiUrl && !apiUrl.startsWith('http')) {
    warnings.push('VITE_API_URL should be a valid HTTP/HTTPS URL');
  }
  
  // Validate WebSocket URL (optional)
  if (wsUrl && !wsUrl.startsWith('ws')) {
    warnings.push('VITE_WS_URL should be a valid WebSocket URL');
  }
  
  // Environment mode validation
  if (!mode) {
    warnings.push('Environment mode is not defined');
  }
  
  const config: EnvironmentConfig = {
    supabaseUrl: supabaseUrl || '',
    supabaseAnonKey: supabaseAnonKey || '',
    apiUrl,
    wsUrl,
    mode: mode || 'development',
    isProduction: mode === 'production',
    isDevelopment: mode === 'development'
  };
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    config
  };
};

// =============================================
// ENVIRONMENT LOGGING
// =============================================

export const logEnvironmentStatus = (validation: ValidationResult) => {
  console.group('🔍 Environment Status');
  
  console.log('Mode:', validation.config.mode);
  console.log('Is Production:', validation.config.isProduction);
  console.log('Is Development:', validation.config.isDevelopment);
  
  console.log('Supabase URL:', validation.config.supabaseUrl ? '✓ Set' : '✗ Missing');
  console.log('Supabase Key:', validation.config.supabaseAnonKey ? `✓ Set (${validation.config.supabaseAnonKey.length} chars)` : '✗ Missing');
  console.log('API URL:', validation.config.apiUrl ? '✓ Set' : '○ Optional');
  console.log('WS URL:', validation.config.wsUrl ? '✓ Set' : '○ Optional');
  
  if (validation.errors.length > 0) {
    console.error('❌ Errors:', validation.errors);
  }
  
  if (validation.warnings.length > 0) {
    console.warn('⚠️ Warnings:', validation.warnings);
  }
  
  if (validation.isValid) {
    console.log('✅ Environment is valid');
  } else {
    console.error('❌ Environment has errors');
  }
  
  console.groupEnd();
};

// =============================================
// ENVIRONMENT HELPERS
// =============================================

export const getEnvironmentConfig = (): EnvironmentConfig => {
  const validation = validateEnvironment();
  return validation.config;
};

export const isEnvironmentValid = (): boolean => {
  const validation = validateEnvironment();
  return validation.isValid;
};

export const getEnvironmentErrors = (): string[] => {
  const validation = validateEnvironment();
  return validation.errors;
};
