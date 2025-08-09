# 🗄️ Storage Setup Guide for KYC Documents

This guide helps you set up secure file storage for KYC documents and profile images in your Kryvex Trading app.

## 📋 Overview

The storage system includes:
- **KYC Documents Bucket** - Private bucket for identity documents
- **Profile Images Bucket** - Public bucket for user avatars
- **Security Policies** - User-specific access controls
- **File Upload Service** - Frontend integration

---

## 🚀 Setup Instructions

### 1️⃣ **Run Storage Policies in Supabase**

1. Open your **Supabase Dashboard**
2. Go to **SQL Editor**
3. Copy and paste the contents of `supabase/storage_policies.sql`
4. Click **Run** to create buckets and policies

This will create:
- ✅ `kyc-documents` bucket (private, 10MB limit)
- ✅ `profile-images` bucket (public, 5MB limit)
- ✅ User-specific access policies
- ✅ Admin viewing permissions
- ✅ Automatic cleanup functions

### 2️⃣ **Verify Bucket Creation**

1. Go to **Storage** in Supabase Dashboard
2. You should see two buckets:
   - `kyc-documents` (🔒 Private)
   - `profile-images` (🌐 Public)

### 3️⃣ **Test Policies (Optional)**

You can test the policies work correctly:

```sql
-- Test user can only access their own folder
SELECT storage.foldername('user-123/passport.jpg');
-- Should return: {"user-123"}

-- Test file type restrictions
SELECT storage.extension('document.pdf');
-- Should return: "pdf"
```

---

## 📁 Folder Structure

### KYC Documents (`kyc-documents` bucket):
```
kyc-documents/
├── user-uuid-1/
│   ├── passport-front.jpg
│   ├── passport-back.jpg
│   └── selfie.jpg
├── user-uuid-2/
│   ├── drivers-license-front.jpg
│   ├── drivers-license-back.jpg
│   └── selfie.jpg
```

### Profile Images (`profile-images` bucket):
```
profile-images/
├── user-uuid-1/
│   └── profile.jpg
├── user-uuid-2/
│   └── profile.png
```

---

## 🔐 Security Features

### **Access Control:**
- ✅ Users can only upload to their own folders (`user-id/`)
- ✅ Users can only view their own KYC documents
- ✅ Admins can view all KYC documents for verification
- ✅ Profile images are publicly viewable but user-controlled

### **File Restrictions:**
- ✅ **KYC Documents**: JPG, PNG, WebP, PDF (max 10MB)
- ✅ **Profile Images**: JPG, PNG, WebP (max 5MB)
- ✅ Automatic file extension validation
- ✅ MIME type checking

### **Additional Security:**
- ✅ Signed URLs for private documents (1 hour expiry)
- ✅ Automatic cleanup of old documents
- ✅ File size limits enforced at bucket level

---

## 💻 Frontend Integration

### **Import Storage Service:**
```typescript
import storageService from '@/services/storageService';
```

### **Upload KYC Document:**
```typescript
const uploadKYCDocument = async (file: File, documentType: string) => {
  const result = await storageService.uploadKYCDocument(
    file,
    user.id,
    documentType as any
  );
  
  if (result.success) {
    console.log('Document uploaded:', result.path);
    console.log('Access URL:', result.url);
  } else {
    console.error('Upload failed:', result.error);
  }
};
```

### **Upload Profile Image:**
```typescript
const uploadProfileImage = async (file: File) => {
  const result = await storageService.uploadProfileImage(file, user.id);
  
  if (result.success) {
    console.log('Profile image uploaded:', result.url);
  }
};
```

### **Get Document URL:**
```typescript
const getDocumentUrl = async (filePath: string) => {
  const url = await storageService.getKYCDocumentUrl(filePath);
  return url; // Signed URL valid for 1 hour
};
```

---

## 🧪 Testing

### **Test File Upload:**
1. **Login** to your app
2. **Navigate** to KYC page
3. **Upload** a document (JPG/PNG/PDF)
4. **Verify** it appears in the correct user folder
5. **Check** that other users cannot access it

### **Test Admin Access:**
1. **Login** as admin user
2. **Verify** you can view all KYC documents
3. **Test** that regular users cannot see others' documents

### **Test File Restrictions:**
1. **Try uploading** a file larger than 10MB (should fail)
2. **Try uploading** an unsupported file type (should fail)
3. **Upload** valid files (should succeed)

---

## 🔧 Troubleshooting

### **Common Issues:**

#### "Access denied" errors:
- ✅ Check user is authenticated
- ✅ Verify user ID matches folder name
- ✅ Ensure policies are applied correctly

#### "File too large" errors:
- ✅ KYC documents: 10MB limit
- ✅ Profile images: 5MB limit
- ✅ Check file size before upload

#### "Invalid file type" errors:
- ✅ KYC: Only JPG, PNG, WebP, PDF allowed
- ✅ Profile: Only JPG, PNG, WebP allowed

### **Debug Commands:**

Check bucket exists:
```sql
SELECT * FROM storage.buckets WHERE id = 'kyc-documents';
```

Check policies:
```sql
SELECT * FROM pg_policies WHERE tablename = 'objects';
```

Test file path parsing:
```sql
SELECT storage.foldername('user-123/passport.jpg');
SELECT storage.filename('user-123/passport.jpg');
SELECT storage.extension('passport.jpg');
```

---

## 📊 Admin Features

### **View All KYC Documents:**
Admins can access all user documents for verification:

```typescript
// Admin can get any user's documents
const getAllUserDocuments = async (userId: string) => {
  const { data, error } = await supabase.storage
    .from('kyc-documents')
    .list(userId);
    
  return data; // Array of files
};
```

### **Approve/Reject Documents:**
Connect with your KYC service to update verification status:

```typescript
const updateKYCStatus = async (userId: string, status: string) => {
  // Update KYC status in database
  // Move or flag documents as verified
};
```

---

## 🎯 Next Steps

1. ✅ **Run the SQL policies** in Supabase
2. ✅ **Test file uploads** in your KYC page
3. ✅ **Verify security** with different user accounts
4. ✅ **Implement admin review** functionality
5. ✅ **Add progress indicators** for uploads
6. ✅ **Connect with KYC verification** workflow

Your secure file storage system is now ready for production use! 🎉
