# 🚂 Railway PostgreSQL Migration Guide

## 🎯 **Objective**
Move your local `kryvex_trading` PostgreSQL database to Railway and connect it to your Render backend and frontend services.

---

## 📋 **Prerequisites**

- ✅ Local PostgreSQL database (`kryvex_trading`)
- ✅ Railway account (https://railway.app)
- ✅ Render account (https://render.com)
- ✅ pgAdmin or psql CLI installed

---

## 🔧 **Step 1: Export Local Database**

### **Option A: Using pgAdmin (Recommended)**

1. **Open pgAdmin**
2. **Connect to your local PostgreSQL server**
3. **Right-click on `kryvex_trading` database**
4. **Select "Backup..."**
5. **Configure backup:**
   - **Format**: `Plain`
   - **Filename**: `kryvex_trading_backup.sql`
   - **Encoding**: `UTF8`
6. **Click "Backup"**

### **Option B: Using Command Line**

```bash
# Navigate to your project directory
cd "C:\Projects\Cryvex trading\kryvex-forge-main"

# Export database (update password)
pg_dump -h localhost -p 5432 -U postgres -d kryvex_trading > kryvex_trading_backup.sql
```

**File Location**: `kryvex_trading_backup.sql` in your project root

---

## 🌐 **Step 2: Create Railway PostgreSQL Database**

### **2.1 Create Railway Account**
1. Go to [https://railway.app](https://railway.app)
2. Sign in with GitHub (recommended)
3. Complete account setup

### **2.2 Provision PostgreSQL**
1. **Click "New Project"**
2. **Select "Provision PostgreSQL"**
3. **Wait for database creation** (usually 1-2 minutes)
4. **Note the project name** (e.g., `kryvex-trading-db`)

### **2.3 Get Connection Details**
1. **Click on your PostgreSQL service**
2. **Go to "Connect" tab**
3. **Copy the connection URL**:
   ```
   postgresql://postgres:password@host:port/railway
   ```

---

## 📤 **Step 3: Import Database to Railway**

### **Option A: Using pgAdmin**

1. **Add Railway Server in pgAdmin:**
   - Right-click "Servers" → "Register" → "Server"
   - **General tab**: Name = "Railway"
   - **Connection tab**:
     - Host: `your_railway_host`
     - Port: `5432`
     - Username: `postgres`
     - Password: `your_railway_password`
     - Database: `railway`

2. **Import SQL File:**
   - Connect to Railway server
   - Right-click on `railway` database
   - Select "Query Tool"
   - Open `kryvex_trading_backup.sql`
   - Execute (F5)

### **Option B: Using Command Line**

```bash
# Import using psql
psql "postgresql://postgres:password@host:port/railway" < kryvex_trading_backup.sql
```

### **Option C: Using Railway CLI**

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and link project
railway login
railway link

# Import database
railway up
```

---

## 🔗 **Step 4: Connect Render Backend to Railway**

### **4.1 Update Render Environment Variables**

1. **Go to your Render backend service**
2. **Navigate to "Environment" tab**
3. **Add these environment variables:**

```env
# Database Configuration
DATABASE_URL=${{ Postgres.DATABASE_URL }}

# Alternative manual configuration (if needed)
DB_HOST=your_railway_host
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_railway_password
DB_NAME=railway
```

### **4.2 Verify Backend Code**

Ensure your backend uses the correct database connection:

```javascript
// In your database connection file
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});
```

---

## 🖥️ **Step 5: Update Frontend Configuration**

### **5.1 Frontend Environment Variables**

In your Render frontend service, ensure these variables are set:

```env
VITE_API_URL=https://kryvextrading-com.onrender.com
VITE_WS_URL=wss://kryvextrading-com.onrender.com
```

### **5.2 Verify Frontend Code**

Ensure your frontend uses the correct API URLs:

```javascript
// In your API configuration
const API_BASE_URL = import.meta.env.VITE_API_URL;
const WS_URL = import.meta.env.VITE_WS_URL;
```

---

## 🧪 **Step 6: Test Everything**

### **6.1 Test Database Connection**

Run this query in Railway to verify:

```sql
SELECT 
  current_database() as database_name,
  current_user as current_user,
  version() as postgres_version,
  (SELECT count(*) FROM information_schema.tables) as table_count;
```

**Expected Results:**
- `database_name`: `railway`
- `current_user`: `postgres`
- `table_count`: Should show your imported tables

### **6.2 Test Backend API**

1. **Deploy your backend to Render**
2. **Test API endpoints:**
   ```
   https://kryvextrading-com.onrender.com/api/health
   https://kryvextrading-com.onrender.com/api/admin/users
   ```

### **6.3 Test Frontend**

1. **Deploy your frontend to Render**
2. **Visit your frontend URL**
3. **Check browser console for connection status**
4. **Test admin login and dashboard**

---

## 🔍 **Troubleshooting**

### **Common Issues**

#### **1. Database Connection Failed**
- ✅ Verify Railway connection URL
- ✅ Check SSL configuration
- ✅ Ensure environment variables are set correctly

#### **2. CORS Errors**
- ✅ Verify `CORS_ORIGIN` is set to your frontend URL
- ✅ Check that frontend and backend URLs match

#### **3. Import Failed**
- ✅ Check SQL file syntax
- ✅ Verify Railway connection details
- ✅ Try importing in smaller chunks

#### **4. Environment Variables Not Loading**
- ✅ Restart Render services after adding variables
- ✅ Check variable names for typos
- ✅ Verify variable values are correct

---

## 📊 **Verification Checklist**

### **Database Migration**
- [ ] Local database exported successfully
- [ ] Railway PostgreSQL created
- [ ] SQL file imported to Railway
- [ ] Database connection tested

### **Backend Configuration**
- [ ] Environment variables updated in Render
- [ ] Backend deployed successfully
- [ ] API endpoints responding
- [ ] Database queries working

### **Frontend Configuration**
- [ ] Environment variables updated
- [ ] Frontend deployed successfully
- [ ] API calls working
- [ ] WebSocket connection established

### **Security**
- [ ] Railway connection URL secured
- [ ] Environment variables not exposed
- [ ] SSL enabled for production
- [ ] Admin authentication working

---

## 🎯 **Final Steps**

### **Clean Up**
1. **Delete local backup file** after successful migration
2. **Update documentation** with new connection details
3. **Test all functionality** in production environment

### **Monitoring**
1. **Set up logging** for database connections
2. **Monitor Railway usage** and costs
3. **Set up alerts** for connection issues

---

## 📞 **Support**

If you encounter issues:

1. **Check Railway logs** for database errors
2. **Check Render logs** for backend errors
3. **Check browser console** for frontend errors
4. **Verify environment variables** are set correctly
5. **Test database connection** manually

---

*Last updated: $(date)*
*Status: ✅ Ready for Migration* 