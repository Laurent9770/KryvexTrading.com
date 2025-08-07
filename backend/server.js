const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize Supabase client with error handling
let supabase;
try {
  supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
  );
  console.log('✅ Supabase client initialized');
} catch (error) {
  console.error('❌ Failed to initialize Supabase client:', error.message);
  supabase = null;
}

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'", "'unsafe-eval'", "'unsafe-inline'", "https://ftkeczodadvtnxofrwps.supabase.co"],
      connectSrc: ["'self'", "https://ftkeczodadvtnxofrwps.supabase.co", "wss://ftkeczodadvtnxofrwps.supabase.co", "https://kryvextrading-com.onrender.com"],
      workerSrc: ["'self'", "blob:"],
      childSrc: ["'self'", "blob:"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"]
    }
  }
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Middleware
app.use(compression());
app.use(cors({
  origin: [
    process.env.CORS_ORIGIN || 'https://kryvex-frontend.onrender.com',
    'https://kryvextrading-com.onrender.com',
    'http://localhost:8080',
    'http://localhost:3000'
  ],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    supabase: process.env.SUPABASE_URL ? 'configured' : 'not configured',
    cors_origin: process.env.CORS_ORIGIN,
    port: PORT
  });
});

// Test Supabase connection
app.get('/api/test-supabase', async (req, res) => {
  if (!supabase) {
    return res.status(500).json({ 
      error: 'Supabase not configured',
      message: 'SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set'
    });
  }

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);

    if (error) throw error;
    
    res.json({ 
      status: 'connected',
      message: 'Supabase connection successful',
      data: data
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Supabase connection failed',
      message: error.message
    });
  }
});

// Admin authentication middleware
const authenticateAdmin = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    // Verify admin token (you can implement your own admin auth logic)
    // For now, we'll use a simple check
    if (token === process.env.JWT_SECRET) {
      next();
    } else {
      res.status(403).json({ error: 'Invalid admin token' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Authentication failed' });
  }
};

// Admin API endpoints
app.get('/api/admin/users', authenticateAdmin, async (req, res) => {
  if (!supabase) {
    return res.status(500).json({ error: 'Supabase not configured' });
  }

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json({ users: data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/admin/trades', authenticateAdmin, async (req, res) => {
  if (!supabase) {
    return res.status(500).json({ error: 'Supabase not configured' });
  }

  try {
    const { data, error } = await supabase
      .from('trades')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json({ trades: data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/admin/withdrawals', authenticateAdmin, async (req, res) => {
  if (!supabase) {
    return res.status(500).json({ error: 'Supabase not configured' });
  }

  try {
    const { data, error } = await supabase
      .from('withdrawal_requests')
      .select('*')
      .order('requested_at', { ascending: false });

    if (error) throw error;
    res.json({ withdrawals: data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/admin/withdrawals/:id/approve', authenticateAdmin, async (req, res) => {
  if (!supabase) {
    return res.status(500).json({ error: 'Supabase not configured' });
  }

  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('withdrawal_requests')
      .update({ 
        status: 'approved',
        processed_at: new Date().toISOString(),
        remarks: req.body.remarks || 'Admin approved'
      })
      .eq('id', id);

    if (error) throw error;
    res.json({ success: true, withdrawal: data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/admin/withdrawals/:id/reject', authenticateAdmin, async (req, res) => {
  if (!supabase) {
    return res.status(500).json({ error: 'Supabase not configured' });
  }

  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('withdrawal_requests')
      .update({ 
        status: 'rejected',
        processed_at: new Date().toISOString(),
        remarks: req.body.remarks || 'Admin rejected'
      })
      .eq('id', id);

    if (error) throw error;
    res.json({ success: true, withdrawal: data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Public API endpoints
app.get('/api/stats', async (req, res) => {
  if (!supabase) {
    return res.status(500).json({ error: 'Supabase not configured' });
  }

  try {
    // Get basic stats from Supabase
    const { data: users } = await supabase
      .from('profiles')
      .select('id');

    const { data: trades } = await supabase
      .from('trades')
      .select('id');

    const { data: withdrawals } = await supabase
      .from('withdrawal_requests')
      .select('id')
      .eq('status', 'pending');

    res.json({
      totalUsers: users?.length || 0,
      totalTrades: trades?.length || 0,
      pendingWithdrawals: withdrawals?.length || 0
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Catch-all handler for SPA
app.get('*', (req, res) => {
  res.json({ 
    message: 'Kryvex Trading API',
    status: 'running',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/api/health',
      test_supabase: '/api/test-supabase',
      stats: '/api/stats',
      admin_users: '/api/admin/users',
      admin_trades: '/api/admin/trades',
      admin_withdrawals: '/api/admin/withdrawals'
    }
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Error:', error);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Kryvex Backend Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV}`);
  console.log(`🔗 Supabase: ${process.env.SUPABASE_URL ? 'Configured' : 'Not configured'}`);
  console.log(`🌐 CORS Origin: ${process.env.CORS_ORIGIN}`);
  console.log(`🔑 Service Role Key: ${process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Set' : 'Not set'}`);
});

module.exports = app; 