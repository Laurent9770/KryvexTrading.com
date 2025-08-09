// HTTP-Based Supabase Client - Bypasses SDK Issues
console.log('🚀 Creating HTTP-based Supabase client...');

const SUPABASE_URL = 'https://ftkeczodadvtnxofrwps.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ0a2Vjem9kYWR2dG54b2Zyd3BzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4NjM5NTQsImV4cCI6MjA2OTQzOTk1NH0.rW4WIL5gGjvYIRhjTgbfGbPdF1E-hqxHKckeVdZtalg';

// HTTP headers for Supabase API
const getHeaders = (authToken?: string) => ({
  'Content-Type': 'application/json',
  'apikey': SUPABASE_ANON_KEY,
  'Authorization': `Bearer ${authToken || SUPABASE_ANON_KEY}`,
  'Prefer': 'return=representation'
});

// HTTP-based authentication methods
export const httpAuth = {
  // Sign up with email/password
  async signUp(email: string, password: string, userData?: any) {
    try {
      console.log('🔐 HTTP Sign up for:', email);
      console.log('🔐 User data:', userData);
      
      // Validate inputs
      if (!email || !email.includes('@')) {
        return { data: null, error: { message: 'Please enter a valid email address' } };
      }
      
      // Enhanced password validation to match Supabase requirements
      if (!password || password.length < 8) {
        return { data: null, error: { message: 'Password must be at least 8 characters long' } };
      }
      
      // Check for required character types
      const hasLower = /[a-z]/.test(password);
      const hasUpper = /[A-Z]/.test(password);
      const hasNumber = /[0-9]/.test(password);
      const hasSpecial = /[!@#$%^&*()_+\-=\[\]{}|\\:";'<>?,.\/]/.test(password);
      
      if (!hasLower || !hasUpper || !hasNumber || !hasSpecial) {
        return { 
          data: null, 
          error: { 
            message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (!@#$%^&*()_+-=[]{}|\\:";\'<>?,./)' 
          } 
        };
      }

      const requestBody = {
        email: email.trim().toLowerCase(),
        password,
      };

      // Only add userData if it exists and has content
      if (userData && Object.keys(userData).length > 0) {
        (requestBody as any).data = userData;
      }

      console.log('🔐 Signup request body:', { ...requestBody, password: '[HIDDEN]' });
      
      const response = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(requestBody)
      });

      console.log('🔐 Signup response status:', response.status);
      const result = await response.json();
      console.log('🔐 Signup response data:', result);
      
      if (!response.ok) {
        console.error('❌ HTTP signup error:', response.status, result);
        
        // Handle specific error cases
        let errorMessage = result.msg || result.message || result.error_description || 'Registration failed';
        
        if (response.status === 422) {
          if (result.msg?.includes('password')) {
            errorMessage = 'Password must be at least 6 characters long';
          } else if (result.msg?.includes('email')) {
            errorMessage = 'Please enter a valid email address';
          } else if (result.msg?.includes('already')) {
            errorMessage = 'An account with this email already exists';
          } else {
            errorMessage = 'Invalid registration data. Please check your information.';
          }
        } else if (response.status === 400) {
          errorMessage = 'Invalid registration data. Please check your information.';
        }
        
        return { data: null, error: { message: errorMessage, status: response.status } };
      }

      console.log('✅ HTTP signup successful');
      return { data: result, error: null };
    } catch (error: any) {
      console.error('❌ HTTP signup failed:', error);
      return { data: null, error: { message: error.message || 'Network error during signup' } };
    }
  },

  // Sign in with email/password
  async signInWithPassword(email: string, password: string) {
    try {
      console.log('🔐 HTTP Sign in for:', email);
      
      const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          email,
          password
        })
      });

      const result = await response.json();
      
      if (!response.ok) {
        console.error('❌ HTTP signin error:', result);
        return { data: null, error: result };
      }

      console.log('✅ HTTP signin successful');
      
      // Store session in localStorage
      if (result.access_token) {
        localStorage.setItem('supabase.auth.token', JSON.stringify(result));
      }
      
      return { data: result, error: null };
    } catch (error) {
      console.error('❌ HTTP signin failed:', error);
      return { data: null, error: { message: 'Network error during signin' } };
    }
  },

  // Sign out
  async signOut() {
    try {
      console.log('🔐 HTTP Sign out');
      
      const session = this.getSession();
      if (session?.access_token) {
        await fetch(`${SUPABASE_URL}/auth/v1/logout`, {
          method: 'POST',
          headers: getHeaders(session.access_token)
        });
      }

      localStorage.removeItem('supabase.auth.token');
      console.log('✅ HTTP signout successful');
      return { error: null };
    } catch (error) {
      console.error('❌ HTTP signout failed:', error);
      return { error: { message: 'Network error during signout' } };
    }
  },

  // Get current session
  getSession() {
    try {
      const stored = localStorage.getItem('supabase.auth.token');
      if (stored) {
        const session = JSON.parse(stored);
        // Check if token is expired
        if (session.expires_at && Date.now() / 1000 > session.expires_at) {
          localStorage.removeItem('supabase.auth.token');
          return null;
        }
        return session;
      }
      return null;
    } catch (error) {
      console.error('❌ Error getting session:', error);
      return null;
    }
  },

  // Get current user
  getUser() {
    const session = this.getSession();
    return session?.user || null;
  },

  // Google OAuth (redirect method)
  async signInWithGoogle() {
    try {
      console.log('🔐 Starting Google OAuth...');
      
      const redirectTo = `${window.location.origin}/auth/callback`;
      const googleOAuthUrl = `${SUPABASE_URL}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(redirectTo)}`;
      
      console.log('🔗 Redirecting to:', googleOAuthUrl);
      window.location.href = googleOAuthUrl;
      
      return { data: { url: googleOAuthUrl }, error: null };
    } catch (error) {
      console.error('❌ Google OAuth failed:', error);
      return { data: null, error: { message: 'Failed to initiate Google OAuth' } };
    }
  }
};

// HTTP-based database methods
export const httpDb = {
  // Query data
  async select(table: string, columns = '*', filters?: any) {
    try {
      const session = httpAuth.getSession();
      let url = `${SUPABASE_URL}/rest/v1/${table}?select=${columns}`;
      
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          url += `&${key}=eq.${value}`;
        });
      }

      const response = await fetch(url, {
        headers: getHeaders(session?.access_token)
      });

      const result = await response.json();
      
      if (!response.ok) {
        return { data: null, error: result };
      }

      return { data: result, error: null };
    } catch (error) {
      console.error('❌ HTTP select failed:', error);
      return { data: null, error: { message: 'Network error during select' } };
    }
  },

  // Insert data
  async insert(table: string, data: any) {
    try {
      const session = httpAuth.getSession();
      
      const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
        method: 'POST',
        headers: getHeaders(session?.access_token),
        body: JSON.stringify(data)
      });

      const result = await response.json();
      
      if (!response.ok) {
        return { data: null, error: result };
      }

      return { data: result, error: null };
    } catch (error) {
      console.error('❌ HTTP insert failed:', error);
      return { data: null, error: { message: 'Network error during insert' } };
    }
  }
};

console.log('✅ HTTP-based Supabase client ready!');
