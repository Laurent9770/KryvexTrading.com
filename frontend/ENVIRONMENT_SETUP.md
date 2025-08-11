# Environment Setup Guide

## 🔧 Required Environment Variables

### Supabase Configuration
```bash
# Required - Your Supabase project URL
VITE_SUPABASE_URL=https://your-project-id.supabase.co

# Required - Your Supabase anonymous key
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### Optional Configuration
```bash
# Optional - API URL for additional services
VITE_API_URL=https://your-api-domain.com

# Optional - WebSocket URL for real-time features
VITE_WS_URL=wss://your-ws-domain.com
```

## 📋 Setup Instructions

### 1. Get Your Supabase Credentials

1. **Go to your Supabase Dashboard**: https://supabase.com/dashboard
2. **Select your project** (or create a new one)
3. **Navigate to Settings → API**
4. **Copy the following values**:
   - **Project URL** → Use as `VITE_SUPABASE_URL`
   - **anon public** key → Use as `VITE_SUPABASE_ANON_KEY`

### 2. Create Environment File

Create a `.env` file in the `frontend` directory:

```bash
# Navigate to frontend directory
cd frontend

# Create .env file
touch .env
```

### 3. Add Environment Variables

Add your Supabase credentials to the `.env` file:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# Optional Configuration
VITE_API_URL=https://your-api-domain.com
VITE_WS_URL=wss://your-ws-domain.com
```

### 4. Verify Configuration

After setting up your environment variables:

1. **Restart your development server**:
   ```bash
   npm run dev
   ```

2. **Check the browser console** for environment validation messages:
   - ✅ Environment is valid
   - ✅ Supabase client created successfully
   - ✅ Supabase connection test successful

## 🚨 Common Issues & Solutions

### Issue: "VITE_SUPABASE_URL is not defined"
**Solution**: Make sure your `.env` file is in the correct location (`frontend/.env`) and contains the correct variable name.

### Issue: "VITE_SUPABASE_ANON_KEY appears to be invalid"
**Solution**: 
- Copy the **anon public** key (not the service_role key)
- Ensure the key is at least 50 characters long
- Don't include quotes around the key value

### Issue: "Cannot read properties of undefined (reading 'headers')"
**Solution**: 
- Update to the latest Supabase client version
- Ensure environment variables are properly set
- Clear browser cache and restart development server

### Issue: "Supabase client initialization failed"
**Solution**:
- Verify your Supabase project is active
- Check that your project URL and key are correct
- Ensure your Supabase project has the required tables and policies

## 🔍 Environment Validation

The application includes automatic environment validation that will:

- ✅ Check if all required variables are defined
- ✅ Validate URL formats
- ✅ Verify key lengths
- ✅ Test Supabase connectivity
- ✅ Log detailed status information

## 📝 Example .env File

```env
# =============================================
# SUPABASE CONFIGURATION
# =============================================
VITE_SUPABASE_URL=https://ftkeczodadvtnxofrwps.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ0a2Vjem9kYWR2dG54b2Zyd3BzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI5NzI4MDAsImV4cCI6MjA0ODU0ODgwMH0.your-actual-key-here

# =============================================
# OPTIONAL CONFIGURATION
# =============================================
VITE_API_URL=https://api.kryvex.com
VITE_WS_URL=wss://ws.kryvex.com
```

## 🚀 Production Deployment

For production deployment, ensure your hosting platform supports environment variables:

### Vercel
- Add environment variables in the Vercel dashboard
- Prefix with `VITE_` for client-side access

### Netlify
- Add environment variables in the Netlify dashboard
- Prefix with `VITE_` for client-side access

### Render
- Add environment variables in the Render dashboard
- Prefix with `VITE_` for client-side access

## 🔒 Security Notes

- ✅ **Public Keys Only**: Use only the `anon` public key, never the `service_role` key
- ✅ **Environment Variables**: Never commit `.env` files to version control
- ✅ **HTTPS Only**: Always use HTTPS URLs in production
- ✅ **Key Rotation**: Regularly rotate your Supabase keys

## 📞 Support

If you continue to experience issues:

1. **Check the browser console** for detailed error messages
2. **Verify your Supabase project** is active and accessible
3. **Test your credentials** in the Supabase dashboard
4. **Review the environment validation** output in the console

For additional help, refer to the [Supabase Documentation](https://supabase.com/docs).
