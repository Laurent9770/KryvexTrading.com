const { createClient } = require('@supabase/supabase-js');

// Create Supabase client with service role key for admin operations
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Admin authentication middleware
const authenticateAdmin = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'No token provided'
      });
    }

    // For now, use a simple token check
    // In production, you should implement proper JWT verification
    if (token.startsWith('admin-token-')) {
      // Add admin user to request
      req.user = {
        id: 'admin',
        email: process.env.ADMIN_EMAIL,
        isAdmin: true
      };
      next();
    } else {
      return res.status(401).json({
        error: 'Authentication failed',
        message: 'Invalid admin token'
      });
    }
  } catch (error) {
    return res.status(401).json({
      error: 'Authentication failed',
      message: 'Invalid token'
    });
  }
};

// Optional admin authentication (for endpoints that can work with or without admin)
const optionalAdminAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (token && token.startsWith('admin-token-')) {
      req.user = {
        id: 'admin',
        email: process.env.ADMIN_EMAIL,
        isAdmin: true
      };
    }
    
    next();
  } catch (error) {
    next();
  }
};

module.exports = {
  authenticateAdmin,
  optionalAdminAuth
}; 