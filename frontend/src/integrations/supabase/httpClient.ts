// HTTP-Based Supabase Client - Bypasses SDK Issues
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

// HTTP headers for Supabase API
const getHeaders = (authToken?: string) => {
  const { supabaseAnonKey } = getSupabaseConfig();
  
  return {
    'Content-Type': 'application/json',
    'apikey': supabaseAnonKey,
    'Authorization': `Bearer ${authToken || supabaseAnonKey}`,
    'Prefer': 'return=representation'
  };
};

// HTTP-based authentication methods
export const httpAuth = {
  // Sign up with email/password
  async signUp(email: string, password: string, userData?: any) {
    try {
      console.log('🔐 HTTP Sign up for:', email);
      console.log('🔐 User data:', userData);
      
      const { supabaseUrl } = getSupabaseConfig();
      
      // Validate inputs - use proper email regex
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!email || !emailRegex.test(email.trim())) {
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

      const requestBody: any = {
        email: email.trim().toLowerCase(),
        password,
      };

      // Add user metadata if provided
      if (userData && Object.keys(userData).length > 0) {
        requestBody.data = userData;
      }

      // Ensure we're not sending empty data object
      if (requestBody.data && Object.keys(requestBody.data).length === 0) {
        delete requestBody.data;
      }

      console.log('🔐 Signup request body:', { ...requestBody, password: '[HIDDEN]' });
      console.log('🔐 Full request body (for debugging):', JSON.stringify(requestBody, null, 2));
      
      const response = await fetch(`${supabaseUrl}/auth/v1/signup`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(requestBody)
      });

      console.log('🔐 Signup response status:', response.status);
      const result = await response.json();
      console.log('🔐 Signup response data:', result);
      
      if (!response.ok) {
        console.error('❌ HTTP signup error:', response.status, result);
        console.error('❌ Full error details:', JSON.stringify(result, null, 2));
        
        // Handle specific error cases with better parsing
        let errorMessage = 'Registration failed';
        
        // Try to extract error message from various possible locations
        if (result.error_description) {
          errorMessage = result.error_description;
        } else if (result.msg) {
          errorMessage = result.msg;
        } else if (result.message) {
          errorMessage = result.message;
        } else if (result.error) {
          errorMessage = result.error;
        } else if (typeof result === 'string') {
          errorMessage = result;
        }
        
        // Handle specific status codes
        if (response.status === 422) {
          if (errorMessage.toLowerCase().includes('password')) {
            errorMessage = 'Password must be at least 6 characters long';
          } else if (errorMessage.toLowerCase().includes('email')) {
            errorMessage = 'Please enter a valid email address';
          }
        } else if (response.status === 409) {
          errorMessage = 'An account with this email already exists';
        } else if (response.status === 400) {
          if (errorMessage.toLowerCase().includes('weak')) {
            errorMessage = 'Password is too weak. Please choose a stronger password.';
          }
        }
        
        return { 
          data: null, 
          error: { 
            message: errorMessage,
            status: response.status 
          } 
        };
      }

      // Success case
      if (result.user) {
        console.log('✅ HTTP signup successful for:', result.user.email);
        return { 
          data: { 
            user: result.user, 
            session: result.session 
          }, 
          error: null 
        };
      } else {
        console.log('✅ HTTP signup successful (no user returned)');
        return { 
          data: { 
            user: null, 
            session: null 
          }, 
          error: null 
        };
      }
      
    } catch (error) {
      console.error('❌ HTTP signup exception:', error);
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
      console.log('🔐 HTTP Sign in for:', email);
      
      const { supabaseUrl } = getSupabaseConfig();
      
      const response = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password
        })
      });

      const result = await response.json();
      
      if (!response.ok) {
        console.error('❌ HTTP signin error:', response.status, result);
        return { 
          data: null, 
          error: { 
            message: result.error_description || result.msg || 'Invalid email or password' 
          } 
        };
      }

      console.log('✅ HTTP signin successful for:', email);
      return { 
        data: { 
          user: result.user, 
          session: result 
        }, 
        error: null 
      };
      
    } catch (error) {
      console.error('❌ HTTP signin exception:', error);
      return { 
        data: null, 
        error: { 
          message: error instanceof Error ? error.message : 'Sign in failed due to network error' 
        } 
      };
    }
  },

  // Sign out
  async signOut() {
    try {
      const { supabaseUrl } = getSupabaseConfig();
      
      const response = await fetch(`${supabaseUrl}/auth/v1/logout`, {
        method: 'POST',
        headers: getHeaders()
      });

      console.log('✅ HTTP signout successful');
      return { error: null };
      
    } catch (error) {
      console.error('❌ HTTP signout exception:', error);
      return { 
        error: { 
          message: error instanceof Error ? error.message : 'Sign out failed' 
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
  },

  // Sign in with Google (OAuth)
  async signInWithGoogle() {
    try {
      const { supabaseUrl } = getSupabaseConfig();
      
      // Redirect to Google OAuth
      window.location.href = `${supabaseUrl}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(window.location.origin)}/auth/callback`;
      
      return { data: null, error: null };
    } catch (error) {
      console.error('❌ HTTP Google signin exception:', error);
      return { 
        data: null, 
        error: { 
          message: error instanceof Error ? error.message : 'Google sign in failed' 
        } 
      };
    }
  },

  // Reset password
  async resetPasswordForEmail(email: string, options?: any) {
    try {
      console.log('🔐 HTTP Reset password for:', email);
      
      const { supabaseUrl } = getSupabaseConfig();
      
      const response = await fetch(`${supabaseUrl}/auth/v1/recover`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          ...options
        })
      });

      const result = await response.json();
      
      if (!response.ok) {
        console.error('❌ HTTP reset password error:', response.status, result);
        return { 
          data: null, 
          error: { 
            message: result.error_description || result.msg || 'Failed to send reset email' 
          } 
        };
      }

      console.log('✅ HTTP reset password email sent to:', email);
      return { data: {}, error: null };
      
    } catch (error) {
      console.error('❌ HTTP reset password exception:', error);
      return { 
        data: null, 
        error: { 
          message: error instanceof Error ? error.message : 'Reset password failed due to network error' 
        } 
      };
    }
  },

  // Update user
  async updateUser(updates: any) {
    try {
      console.log('🔐 HTTP Update user:', updates);
      
      const { supabaseUrl } = getSupabaseConfig();
      const session = this.getSession();
      
      if (!session.data.session?.access_token) {
        return { 
          data: null, 
          error: { message: 'No active session found' } 
        };
      }
      
      const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
        method: 'PUT',
        headers: getHeaders(session.data.session.access_token),
        body: JSON.stringify(updates)
      });

      const result = await response.json();
      
      if (!response.ok) {
        console.error('❌ HTTP update user error:', response.status, result);
        return { 
          data: null, 
          error: { 
            message: result.error_description || result.msg || 'Failed to update user' 
          } 
        };
      }

      console.log('✅ HTTP update user successful');
      return { data: { user: result }, error: null };
      
    } catch (error) {
      console.error('❌ HTTP update user exception:', error);
      return { 
        data: null, 
        error: { 
          message: error instanceof Error ? error.message : 'Update user failed due to network error' 
        } 
      };
    }
  }
};

// HTTP-based database methods
export const httpDb = {
  // Select data from table
  async select(table: string, columns = '*', filters?: any) {
    try {
      const { supabaseUrl } = getSupabaseConfig();
      
      let url = `${supabaseUrl}/rest/v1/${table}?select=${columns}`;
      
      if (filters) {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
          params.append(key, `eq.${value}`);
        });
        url += `&${params.toString()}`;
      }
      
      const response = await fetch(url, {
        method: 'GET',
        headers: getHeaders()
      });

      const result = await response.json();
      
      if (!response.ok) {
        console.error('❌ HTTP select error:', response.status, result);
        return { 
          data: null, 
          error: { 
            message: result.message || result.error || 'Failed to fetch data' 
          } 
        };
      }

      return { data: result, error: null };
      
    } catch (error) {
      console.error('❌ HTTP select exception:', error);
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
      
      const response = await fetch(`${supabaseUrl}/rest/v1/${table}`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data)
      });

      const result = await response.json();
      
      if (!response.ok) {
        console.error('❌ HTTP insert error:', response.status, result);
        return { 
          data: null, 
          error: { 
            message: result.message || result.error || 'Failed to insert data' 
          } 
        };
      }

      return { data: result, error: null };
      
    } catch (error) {
      console.error('❌ HTTP insert exception:', error);
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
      
      let url = `${supabaseUrl}/rest/v1/${table}`;
      
      if (filters) {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
          params.append(key, `eq.${value}`);
        });
        url += `?${params.toString()}`;
      }
      
      const response = await fetch(url, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify(data)
      });

      const result = await response.json();
      
      if (!response.ok) {
        console.error('❌ HTTP update error:', response.status, result);
        return { 
          data: null, 
          error: { 
            message: result.message || result.error || 'Failed to update data' 
          } 
        };
      }

      return { data: result, error: null };
      
    } catch (error) {
      console.error('❌ HTTP update exception:', error);
      return { 
        data: null, 
        error: { 
          message: error instanceof Error ? error.message : 'Database update failed due to network error' 
        } 
      };
    }
  },

  // Delete data from table
  async delete(table: string, filters?: any) {
    try {
      const { supabaseUrl } = getSupabaseConfig();
      
      let url = `${supabaseUrl}/rest/v1/${table}`;
      
      if (filters) {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
          params.append(key, `eq.${value}`);
        });
        url += `?${params.toString()}`;
      }
      
      const response = await fetch(url, {
        method: 'DELETE',
        headers: getHeaders()
      });

      const result = await response.json();
      
      if (!response.ok) {
        console.error('❌ HTTP delete error:', response.status, result);
        return { 
          data: null, 
          error: { 
            message: result.message || result.error || 'Failed to delete data' 
          } 
        };
      }

      return { data: result, error: null };
      
    } catch (error) {
      console.error('❌ HTTP delete exception:', error);
      return { 
        data: null, 
        error: { 
          message: error instanceof Error ? error.message : 'Database delete failed due to network error' 
        } 
      };
    }
  }
};

// Only log when the module is actually used, not during import
console.log('🚀 HTTP-based Supabase client ready (lazy-loaded)');
