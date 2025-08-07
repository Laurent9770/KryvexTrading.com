# Advanced Supabase Auth Implementation for Kryvex

## 🔐 **Advanced Authentication Features**

This guide covers implementing advanced Supabase Auth features for the Kryvex trading platform.

## 🕵️ **1. Anonymous User Implementation**

### **Why Anonymous Users for Kryvex?**

Anonymous users allow potential traders to:
- Browse trading features without registration
- View market data and charts
- Test the platform interface
- Convert to full accounts later

### **Database Schema for Anonymous Users**

```sql
-- Enable anonymous user support
-- This is handled automatically by Supabase Auth

-- Create policies for anonymous users
CREATE POLICY "Anonymous users can view public data" ON public_data
FOR SELECT TO authenticated
USING (true);

-- Restrictive policy for authenticated users only
CREATE POLICY "Only permanent users can trade" ON trades
AS RESTRICTIVE FOR INSERT TO authenticated
WITH CHECK ((SELECT (auth.jwt()->>'is_anonymous')::boolean) IS FALSE);

-- Allow anonymous users to view trades but not create them
CREATE POLICY "Anonymous users can view trades" ON trades
FOR SELECT TO authenticated
USING (true);
```

### **Frontend Anonymous User Service**

```typescript
// frontend/src/services/anonymousAuthService.ts

import { supabase } from '../integrations/supabase/client';

class AnonymousAuthService {
  // Sign in anonymously
  async signInAnonymously() {
    try {
      const { data, error } = await supabase.auth.signInAnonymously();
      
      if (error) throw error;
      
      console.log('Anonymous user created:', data.user?.id);
      return data;
    } catch (error) {
      console.error('Anonymous sign-in error:', error);
      throw error;
    }
  }

  // Check if user is anonymous
  async isAnonymousUser() {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.user?.is_anonymous || false;
  }

  // Convert anonymous user to permanent user
  async convertToPermanentUser(email: string, password: string) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user?.is_anonymous) {
        throw new Error('User is not anonymous');
      }

      // Update user with email and password
      const { data, error } = await supabase.auth.updateUser({
        email,
        password,
      });

      if (error) {
        // Handle email conflict
        if (error.message.includes('already registered')) {
          return this.handleEmailConflict(session.user.id, email, password);
        }
        throw error;
      }

      // Migrate anonymous user data
      await this.migrateAnonymousData(session.user.id, data.user?.id);

      return data;
    } catch (error) {
      console.error('Convert to permanent user error:', error);
      throw error;
    }
  }

  // Handle email conflict when converting anonymous user
  private async handleEmailConflict(anonymousUserId: string, email: string, password: string) {
    try {
      // Sign in to existing account
      const { data: { user: existingUser }, error: signInError } = 
        await supabase.auth.signInWithPassword({ email, password });

      if (signInError) throw signInError;

      if (existingUser) {
        // Migrate anonymous user data to existing account
        await this.migrateAnonymousData(anonymousUserId, existingUser.id);
        
        return { user: existingUser };
      }
    } catch (error) {
      console.error('Handle email conflict error:', error);
      throw error;
    }
  }

  // Migrate anonymous user data to permanent user
  private async migrateAnonymousData(anonymousUserId: string, permanentUserId: string) {
    try {
      // Update user preferences
      await supabase
        .from('user_preferences')
        .update({ user_id: permanentUserId })
        .eq('user_id', anonymousUserId);

      // Update watchlist
      await supabase
        .from('watchlist')
        .update({ user_id: permanentUserId })
        .eq('user_id', anonymousUserId);

      // Update saved charts
      await supabase
        .from('saved_charts')
        .update({ user_id: permanentUserId })
        .eq('user_id', anonymousUserId);

      console.log('Anonymous user data migrated successfully');
    } catch (error) {
      console.error('Migrate anonymous data error:', error);
      // Don't throw error to avoid blocking user conversion
    }
  }

  // Clean up anonymous users (run periodically)
  async cleanupAnonymousUsers() {
    try {
      const { data, error } = await supabase.rpc('cleanup_anonymous_users');
      
      if (error) throw error;
      
      console.log('Anonymous users cleaned up:', data);
      return data;
    } catch (error) {
      console.error('Cleanup anonymous users error:', error);
      throw error;
    }
  }
}

export const anonymousAuthService = new AnonymousAuthService();
```

### **Anonymous User Database Functions**

```sql
-- Create function to cleanup anonymous users
CREATE OR REPLACE FUNCTION cleanup_anonymous_users()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete anonymous users older than 30 days
  DELETE FROM auth.users
  WHERE is_anonymous IS TRUE 
    AND created_at < NOW() - INTERVAL '30 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION cleanup_anonymous_users() TO authenticated;
```

## 🔑 **2. Google OAuth Implementation**

### **Google OAuth Setup for Kryvex**

#### **Step 1: Google Cloud Console Configuration**

1. **Create Google Cloud Project:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create new project: "Kryvex Trading Platform"

2. **Configure OAuth Consent Screen:**
   ```
   Application Name: Kryvex Trading Platform
   User Support Email: support@kryvex.com
   Developer Contact Email: admin@kryvex.com
   Authorized Domains: kryvextrading-com.onrender.com
   ```

3. **Create OAuth Credentials:**
   ```
   Application Type: Web application
   Name: Kryvex Trading Platform Web
   Authorized JavaScript Origins:
   - https://kryvextrading-com.onrender.com
   - http://localhost:3000 (development)
   
   Authorized Redirect URIs:
   - https://ftkeczodadvtnxofrwps.supabase.co/auth/v1/callback
   ```

#### **Step 2: Supabase Configuration**

```typescript
// frontend/src/services/googleAuthService.ts

import { supabase } from '../integrations/supabase/client';

class GoogleAuthService {
  // Sign in with Google (Application Code)
  async signInWithGoogle() {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Google sign-in error:', error);
      throw error;
    }
  }

  // Sign in with Google ID Token (Pre-built)
  async signInWithIdToken(token: string, nonce?: string) {
    try {
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token,
        nonce,
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Google ID token sign-in error:', error);
      throw error;
    }
  }

  // Get Google user profile
  async getGoogleProfile() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.provider_token) {
        throw new Error('No Google provider token available');
      }

      // Use Google People API to get profile
      const response = await fetch(
        `https://people.googleapis.com/v1/people/me?personFields=names,emailAddresses,photos`,
        {
          headers: {
            Authorization: `Bearer ${session.provider_token}`,
          },
        }
      );

      if (!response.ok) throw new Error('Failed to fetch Google profile');
      
      return await response.json();
    } catch (error) {
      console.error('Get Google profile error:', error);
      throw error;
    }
  }

  // Save Google tokens for later use
  async saveGoogleTokens() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.provider_token) {
        // Store tokens securely (encrypt if needed)
        localStorage.setItem('google_access_token', session.provider_token);
        
        if (session.provider_refresh_token) {
          localStorage.setItem('google_refresh_token', session.provider_refresh_token);
        }
      }
    } catch (error) {
      console.error('Save Google tokens error:', error);
    }
  }
}

export const googleAuthService = new GoogleAuthService();
```

### **Google OAuth Components**

#### **1. Google Sign-In Button Component**

```typescript
// frontend/src/components/GoogleSignIn.tsx

import React, { useEffect } from 'react';
import { googleAuthService } from '../services/googleAuthService';

interface GoogleSignInProps {
  onSuccess?: (user: any) => void;
  onError?: (error: any) => void;
  variant?: 'standard' | 'one-tap';
}

export const GoogleSignIn: React.FC<GoogleSignInProps> = ({ 
  onSuccess, 
  onError, 
  variant = 'standard' 
}) => {
  useEffect(() => {
    if (variant === 'one-tap') {
      initializeGoogleOneTap();
    }
  }, [variant]);

  const initializeGoogleOneTap = () => {
    // Load Google One Tap
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);

    script.onload = () => {
      // @ts-ignore
      window.google?.accounts?.id?.initialize({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        callback: handleGoogleSignIn,
        auto_select: true,
        cancel_on_tap_outside: false,
      });

      // @ts-ignore
      window.google?.accounts?.id?.prompt();
    };
  };

  const handleGoogleSignIn = async (response: any) => {
    try {
      const data = await googleAuthService.signInWithIdToken(response.credential);
      
      if (data.user) {
        onSuccess?.(data.user);
      }
    } catch (error) {
      onError?.(error);
    }
  };

  const handleStandardSignIn = async () => {
    try {
      const data = await googleAuthService.signInWithGoogle();
      onSuccess?.(data);
    } catch (error) {
      onError?.(error);
    }
  };

  if (variant === 'one-tap') {
    return null; // One Tap renders automatically
  }

  return (
    <div className="google-signin-container">
      <button
        onClick={handleStandardSignIn}
        className="google-signin-button"
      >
        <img src="/google-icon.svg" alt="Google" />
        Continue with Google
      </button>
    </div>
  );
};
```

#### **2. Auth Callback Handler**

```typescript
// frontend/src/components/AuthCallback.tsx

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../integrations/supabase/client';

export const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    handleAuthCallback();
  }, []);

  const handleAuthCallback = async () => {
    try {
      const { searchParams } = new URL(window.location.href);
      const code = searchParams.get('code');
      const next = searchParams.get('next') || '/';

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        
        if (error) {
          setError(error.message);
          return;
        }

        // Redirect to intended page
        navigate(next);
      } else {
        setError('No authorization code received');
      }
    } catch (error) {
      setError('Authentication failed');
      console.error('Auth callback error:', error);
    }
  };

  if (error) {
    return (
      <div className="auth-callback-error">
        <h2>Authentication Error</h2>
        <p>{error}</p>
        <button onClick={() => navigate('/auth')}>
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="auth-callback-loading">
      <h2>Completing Authentication...</h2>
      <div className="loading-spinner"></div>
    </div>
  );
};
```

### **Enhanced Auth Context**

```typescript
// frontend/src/contexts/AuthContext.tsx

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../integrations/supabase/client';
import { anonymousAuthService } from '../services/anonymousAuthService';
import { googleAuthService } from '../services/googleAuthService';

interface AuthContextType {
  user: any;
  session: any;
  loading: boolean;
  isAnonymous: boolean;
  signInAnonymously: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithGoogleIdToken: (token: string) => Promise<void>;
  convertToPermanentUser: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any>(null);
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isAnonymous, setIsAnonymous] = useState(false);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsAnonymous(session?.user?.is_anonymous ?? false);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setIsAnonymous(session?.user?.is_anonymous ?? false);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signInAnonymously = async () => {
    try {
      await anonymousAuthService.signInAnonymously();
    } catch (error) {
      console.error('Anonymous sign-in error:', error);
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    try {
      await googleAuthService.signInWithGoogle();
    } catch (error) {
      console.error('Google sign-in error:', error);
      throw error;
    }
  };

  const signInWithGoogleIdToken = async (token: string) => {
    try {
      await googleAuthService.signInWithIdToken(token);
    } catch (error) {
      console.error('Google ID token sign-in error:', error);
      throw error;
    }
  };

  const convertToPermanentUser = async (email: string, password: string) => {
    try {
      await anonymousAuthService.convertToPermanentUser(email, password);
    } catch (error) {
      console.error('Convert to permanent user error:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  };

  const value = {
    user,
    session,
    loading,
    isAnonymous,
    signInAnonymously,
    signInWithGoogle,
    signInWithGoogleIdToken,
    convertToPermanentUser,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
```

## 🛡️ **3. Security and Rate Limiting**

### **Rate Limiting for Anonymous Users**

```typescript
// frontend/src/services/rateLimitService.ts

class RateLimitService {
  private limits = {
    anonymous_signup: 30, // per hour
    google_signin: 100,   // per hour
    api_calls: 1000,      // per hour
  };

  private storage = new Map<string, { count: number; resetTime: number }>();

  async checkRateLimit(action: string, identifier: string): Promise<boolean> {
    const key = `${action}:${identifier}`;
    const now = Date.now();
    const limit = this.limits[action as keyof typeof this.limits] || 100;
    const window = 60 * 60 * 1000; // 1 hour

    const current = this.storage.get(key);
    
    if (!current || now > current.resetTime) {
      this.storage.set(key, { count: 1, resetTime: now + window });
      return true;
    }

    if (current.count >= limit) {
      return false;
    }

    current.count++;
    return true;
  }

  async checkAnonymousSignup(ip: string): Promise<boolean> {
    return this.checkRateLimit('anonymous_signup', ip);
  }

  async checkGoogleSignin(ip: string): Promise<boolean> {
    return this.checkRateLimit('google_signin', ip);
  }
}

export const rateLimitService = new RateLimitService();
```

### **CAPTCHA Integration**

```typescript
// frontend/src/components/CaptchaProtection.tsx

import React from 'react';

interface CaptchaProtectionProps {
  onVerify: (token: string) => void;
  children: React.ReactNode;
}

export const CaptchaProtection: React.FC<CaptchaProtectionProps> = ({ 
  onVerify, 
  children 
}) => {
  const handleCaptchaVerify = (token: string) => {
    onVerify(token);
  };

  return (
    <div className="captcha-protection">
      {/* Integrate with Cloudflare Turnstile or reCAPTCHA */}
      <div 
        className="cf-turnstile" 
        data-sitekey={import.meta.env.VITE_CAPTCHA_SITE_KEY}
        data-callback={handleCaptchaVerify}
      />
      {children}
    </div>
  );
};
```

## 📊 **4. Analytics and Monitoring**

### **Auth Analytics Service**

```typescript
// frontend/src/services/authAnalyticsService.ts

class AuthAnalyticsService {
  async trackAuthEvent(event: string, data: any) {
    try {
      await supabase
        .from('auth_analytics')
        .insert({
          event,
          user_id: data.user?.id,
          provider: data.provider,
          is_anonymous: data.user?.is_anonymous,
          timestamp: new Date().toISOString(),
          user_agent: navigator.userAgent,
          ip_address: await this.getClientIP(),
        });
    } catch (error) {
      console.error('Auth analytics error:', error);
    }
  }

  private async getClientIP(): Promise<string> {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch (error) {
      return 'unknown';
    }
  }

  async trackAnonymousConversion(userId: string) {
    await this.trackAuthEvent('anonymous_conversion', { user_id: userId });
  }

  async trackGoogleSignIn(userId: string) {
    await this.trackAuthEvent('google_signin', { user_id: userId });
  }
}

export const authAnalyticsService = new AuthAnalyticsService();
```

## 🚀 **5. Implementation Checklist**

### **✅ Anonymous Users:**
- [ ] Database policies for anonymous users
- [ ] Anonymous sign-in service
- [ ] Data migration on conversion
- [ ] Cleanup function for old anonymous users
- [ ] Rate limiting for anonymous signups

### **✅ Google OAuth:**
- [ ] Google Cloud Console setup
- [ ] Supabase OAuth configuration
- [ ] Google sign-in components
- [ ] Auth callback handling
- [ ] Token storage and management

### **✅ Security:**
- [ ] Rate limiting implementation
- [ ] CAPTCHA integration
- [ ] IP-based restrictions
- [ ] Analytics tracking

### **✅ Frontend Integration:**
- [ ] Enhanced AuthContext
- [ ] Anonymous user components
- [ ] Google sign-in buttons
- [ ] Conversion flow UI

## 📝 **Environment Variables**

```env
# Google OAuth
VITE_GOOGLE_CLIENT_ID=your-google-client-id
VITE_GOOGLE_CLIENT_SECRET=your-google-client-secret

# CAPTCHA
VITE_CAPTCHA_SITE_KEY=your-captcha-site-key
VITE_CAPTCHA_SECRET_KEY=your-captcha-secret-key

# Rate Limiting
VITE_RATE_LIMIT_ENABLED=true
VITE_ANONYMOUS_RATE_LIMIT=30
VITE_GOOGLE_RATE_LIMIT=100
```

**Your advanced authentication system is now ready for implementation!** 🎉

This provides a complete solution for anonymous users and Google OAuth integration with proper security measures and analytics tracking. 