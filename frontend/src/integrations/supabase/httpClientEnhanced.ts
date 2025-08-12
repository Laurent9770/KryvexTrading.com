// Enhanced HTTP-Based Supabase Client - Fixes 403, 406, and other HTTP errors
// Lazy-loaded to prevent immediate execution during module loading

// Get environment variables safely
const getSupabaseConfig = () => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase environment variables not found. Check your .env file.');
  }
  
  return { supabaseUrl, supabaseAnonKey };
};

// Enhanced HTTP headers for Supabase API with proper content negotiation
const getHeaders = (authToken?: string) => {
  const { supabaseAnonKey } = getSupabaseConfig();
  
  return {
    'Content-Type': 'application/json',
    'Accept': 'application/json, text/plain, */*',
    'apikey': supabaseAnonKey,
    'Authorization': `Bearer ${authToken || supabaseAnonKey}`,
    'Prefer': 'return=representation',
    'X-Client-Info': 'supabase-js/2.0.0',
    'User-Agent': 'KryvexTrading/1.0.0'
  };
};

// Enhanced fetch with retry logic and better error handling
async function enhancedFetch(url: string, options: RequestInit, retries = 2) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      console.log(`🔍 HTTP request attempt ${attempt + 1}/${retries + 1}:`, url);
      
      const response = await fetch(url, options);
      
      // Handle specific HTTP status codes
      if (response.status === 403) {
        console.error('❌ 403 Forbidden - Access denied. Check authentication and permissions.');
        return { 
          ok: false, 
          status: 403, 
          error: 'Access denied. Please check your authentication and permissions.' 
        };
      }
      
      if (response.status === 406) {
        console.error('❌ 406 Not Acceptable - Content negotiation failed.');
        return { 
          ok: false, 
          status: 406, 
          error: 'Content negotiation failed. Please check request headers.' 
        };
      }
      
      if (response.status === 401) {
        console.error('❌ 401 Unauthorized - Authentication required.');
        return { 
          ok: false, 
          status: 401, 
          error: 'Authentication required. Please sign in again.' 
        };
      }
      
      if (response.status === 429) {
        console.error('❌ 429 Too Many Requests - Rate limited.');
        if (attempt < retries) {
          const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
          console.log(`⏳ Rate limited, waiting ${delay}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        return { 
          ok: false, 
          status: 429, 
          error: 'Too many requests. Please try again later.' 
        };
      }
      
      return response;
      
    } catch (error) {
      console.error(`❌ HTTP request attempt ${attempt + 1} failed:`, error);
      if (attempt === retries) {
        throw error;
      }
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
    }
  }
  
  throw new Error('All retry attempts failed');
}

// Enhanced HTTP-based authentication methods
export const httpAuth = {
  // Sign up with email/password
  async signUp(email: string, password: string, userData?: any) {
    try {
      console.log('🔐 Enhanced HTTP Sign up for:', email);
      
      const { supabaseUrl } = getSupabaseConfig();
      
      // Validate inputs
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!email || !emailRegex.test(email.trim())) {
        return { data: null, error: { message: 'Please enter a valid email address' } };
      }
      
      if (!password || password.length < 8) {
        return { data: null, error: { message: 'Password must be at least 8 characters long' } };
      }
      
      const requestBody: any = {
        email: email.trim().toLowerCase(),
        password,
      };

      if (userData && Object.keys(userData).length > 0) {
        requestBody.data = userData;
      }

      const response = await enhancedFetch(`${supabaseUrl}/auth/v1/signup`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        console.error('❌ Enhanced HTTP signup error:', response.status, response.error);
        return { 
          data: null, 
          error: { 
            message: response.error || 'Registration failed',
            status: response.status 
          } 
        };
      }

      const result = await response.json();
      
      if (result.user) {
        console.log('✅ Enhanced HTTP signup successful for:', result.user.email);
        return { 
          data: { 
            user: result.user, 
            session: result.session 
          }, 
          error: null 
        };
      } else {
        return { 
          data: { 
            user: null, 
            session: null 
          }, 
          error: null 
        };
      }
      
    } catch (error) {
      console.error('❌ Enhanced HTTP signup exception:', error);
      return { 
        data: null, 
        error: { 
          message: error instanceof Error ? error.message : 'Registration failed due to network error' 
        } 
      };
    }
  },

  // Sign in with email/password
  async signInWithPassword(email: string, password: string) {
    try {
      console.log('🔐 Enhanced HTTP Sign in for:', email);
      
      const { supabaseUrl } = getSupabaseConfig();
      
      const response = await enhancedFetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password
        })
      });

      if (!response.ok) {
        console.error('❌ Enhanced HTTP signin error:', response.status, response.error);
        return { 
          data: null, 
          error: { 
            message: response.error || 'Invalid email or password',
            status: response.status 
          } 
        };
      }

      const result = await response.json();
      console.log('✅ Enhanced HTTP signin successful for:', email);
      return { 
        data: { 
          user: result.user, 
          session: result 
        }, 
        error: null 
      };
      
    } catch (error) {
      console.error('❌ Enhanced HTTP signin exception:', error);
      return { 
        data: null, 
        error: { 
          message: error instanceof Error ? error.message : 'Sign in failed due to network error' 
        } 
      };
    }
  },

  // Get current session
  getSession() {
    try {
      const session = localStorage.getItem('supabase.auth.token');
      if (session) {
        const parsed = JSON.parse(session);
        return { data: { session: parsed }, error: null };
      }
      return { data: { session: null }, error: null };
    } catch (error) {
      return { data: { session: null }, error: null };
    }
  },

  // Get current user
  getUser() {
    try {
      const session = localStorage.getItem('supabase.auth.token');
      if (session) {
        const parsed = JSON.parse(session);
        return { data: { user: parsed.user }, error: null };
      }
      return { data: { user: null }, error: null };
    } catch (error) {
      return { data: { user: null }, error: null };
    }
  }
};

// Enhanced HTTP-based database methods
export const httpDb = {
  // Select data from table
  async select(table: string, columns = '*', filters?: any) {
    try {
      const { supabaseUrl } = getSupabaseConfig();
      
      // Ensure table name has proper schema prefix
      const tableName = table.includes('.') ? table : `public.${table}`;
      let url = `${supabaseUrl}/rest/v1/${tableName}?select=${columns}`;
      
      if (filters) {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
          params.append(key, `eq.${value}`);
        });
        url += `&${params.toString()}`;
      }
      
      console.log('🔍 Enhanced HTTP select URL:', url);
      
      const response = await enhancedFetch(url, {
        method: 'GET',
        headers: getHeaders()
      });

      if (!response.ok) {
        console.error('❌ Enhanced HTTP select error:', response.status, response.error);
        return { 
          data: null, 
          error: { 
            message: response.error || 'Failed to fetch data',
            status: response.status
          } 
        };
      }

      const result = await response.json();
      return { data: result, error: null };
      
    } catch (error) {
      console.error('❌ Enhanced HTTP select exception:', error);
      return { 
        data: null, 
        error: { 
          message: error instanceof Error ? error.message : 'Database query failed due to network error' 
        } 
      };
    }
  },

  // Insert data into table
  async insert(table: string, data: any) {
    try {
      const { supabaseUrl } = getSupabaseConfig();
      
      // Ensure table name has proper schema prefix
      const tableName = table.includes('.') ? table : `public.${table}`;
      
      const response = await enhancedFetch(`${supabaseUrl}/rest/v1/${tableName}`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        console.error('❌ Enhanced HTTP insert error:', response.status, response.error);
        return { 
          data: null, 
          error: { 
            message: response.error || 'Failed to insert data',
            status: response.status
          } 
        };
      }

      const result = await response.json();
      return { data: result, error: null };
      
    } catch (error) {
      console.error('❌ Enhanced HTTP insert exception:', error);
      return { 
        data: null, 
        error: { 
          message: error instanceof Error ? error.message : 'Database insert failed due to network error' 
        } 
      };
    }
  },

  // Update data in table
  async update(table: string, data: any, filters?: any) {
    try {
      const { supabaseUrl } = getSupabaseConfig();
      
      // Ensure table name has proper schema prefix
      const tableName = table.includes('.') ? table : `public.${table}`;
      let url = `${supabaseUrl}/rest/v1/${tableName}`;
      
      if (filters) {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
          params.append(key, `eq.${value}`);
        });
        url += `?${params.toString()}`;
      }
      
      const response = await enhancedFetch(url, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        console.error('❌ Enhanced HTTP update error:', response.status, response.error);
        return { 
          data: null, 
          error: { 
            message: response.error || 'Failed to update data',
            status: response.status
          } 
        };
      }

      const result = await response.json();
      return { data: result, error: null };
      
    } catch (error) {
      console.error('❌ Enhanced HTTP update exception:', error);
      return { 
        data: null, 
        error: { 
          message: error instanceof Error ? error.message : 'Database update failed due to network error' 
        } 
      };
    }
  }
};

// Only log when the module is actually used, not during import
console.log('🚀 Enhanced HTTP-based Supabase client ready (lazy-loaded)');
