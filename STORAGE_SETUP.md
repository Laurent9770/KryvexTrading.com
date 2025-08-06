# Supabase Storage Setup for Kryvex Trading Platform

## 📁 Storage Overview

This document outlines the comprehensive storage setup for the Kryvex Trading Platform using Supabase Storage. The platform uses multiple storage buckets for different types of files with proper security policies.

## 🗂️ Storage Buckets

### 1. **Deposit Proofs** (`deposit-proofs`)
- **Purpose**: Store proof images for deposit transactions
- **Privacy**: Private (users can only access their own files)
- **File Types**: Images (JPEG, PNG, GIF)
- **Max Size**: 10MB per file
- **Path Structure**: `{userId}/{depositId}-proof.{ext}`

### 2. **KYC Documents** (`kyc-documents`)
- **Purpose**: Store KYC verification documents
- **Privacy**: Private (users can only access their own files, admins can view all)
- **File Types**: Images and PDFs (JPEG, PNG, PDF)
- **Max Size**: 10MB per file
- **Path Structure**: `{userId}/{documentType}-{timestamp}.{ext}`

### 3. **Profile Avatars** (`profile-avatars`)
- **Purpose**: Store user profile pictures
- **Privacy**: Public (anyone can view)
- **File Types**: Images (JPEG, PNG, GIF)
- **Max Size**: 5MB per file
- **Path Structure**: `{userId}/avatar.{ext}`

### 4. **Trade Screenshots** (`trade-screenshots`)
- **Purpose**: Store trade result screenshots
- **Privacy**: Private (users can only access their own files, admins can view all)
- **File Types**: Images (JPEG, PNG, GIF)
- **Max Size**: 10MB per file
- **Path Structure**: `{userId}/{tradeId}-screenshot.{ext}`

### 5. **Support Attachments** (`support-attachments`)
- **Purpose**: Store support ticket attachments
- **Privacy**: Private (users can only access their own files, admins can view all)
- **File Types**: Images and documents (JPEG, PNG, PDF, DOC, DOCX)
- **Max Size**: 15MB per file
- **Path Structure**: `{userId}/{ticketId}-{timestamp}.{ext}`

## 🔐 Security Policies

### Row Level Security (RLS)
All storage buckets have RLS enabled with the following policies:

#### **User Access Policies**
- Users can upload files to their own folder
- Users can view their own files
- Users can update their own files
- Users can delete their own files

#### **Admin Access Policies**
- Admins can view all files in all buckets
- Admins can manage all files (for moderation purposes)

#### **Public Access**
- Profile avatars are publicly viewable
- All other buckets are private

## 🚀 Usage Examples

### Frontend Usage

#### **Upload KYC Document**
```typescript
import supabaseStorageService from '@/services/supabaseStorageService'

const uploadKYC = async (file: File, userId: string) => {
  const result = await supabaseStorageService.uploadKYCDocument(
    userId,
    file,
    'passport'
  )
  
  if (result.success) {
    console.log('Upload successful:', result.url)
  }
}
```

#### **Upload Profile Avatar**
```typescript
const uploadAvatar = async (file: File, userId: string) => {
  const result = await supabaseStorageService.uploadProfileAvatar(userId, file)
  
  if (result.success) {
    // Update user profile with new avatar URL
    await updateUserProfile({ avatar_url: result.url })
  }
}
```

#### **Using FileUpload Component**
```typescript
import FileUpload from '@/components/FileUpload'

<FileUpload
  bucketId="kyc-documents"
  userId={user.id}
  title="Upload KYC Document"
  description="Upload your identification document"
  allowedTypes={['image/jpeg', 'image/png', 'application/pdf']}
  maxFileSize={10}
  onUploadComplete={(result) => {
    if (result.success) {
      // Handle successful upload
    }
  }}
/>
```

### Backend Usage

#### **Admin File Management**
```javascript
// Get user storage usage
const usage = await supabaseAdminService.getUserStorageUsage(userId)

// Delete user files
await supabaseAdminService.deleteUserFiles(userId, 'kyc-documents')

// List user files
const files = await supabaseAdminService.listUserFiles(userId, 'deposit-proofs')
```

## 📊 Storage Management

### **Storage Usage Tracking**
The platform includes functions to track storage usage:

```sql
-- Get user storage usage
SELECT * FROM get_user_storage_usage('user-uuid');

-- Get platform storage summary
SELECT * FROM storage_usage_summary;

-- Get user storage breakdown
SELECT * FROM user_storage_usage WHERE user_id = 'user-uuid';
```

### **File Cleanup**
Automatic cleanup functions are available:

```sql
-- Clean up user files when account is deleted
SELECT cleanup_user_files('user-uuid');
```

## 🔧 Setup Instructions

### 1. **Run Storage Migration**
```bash
# Apply the storage setup migration
psql -h your-supabase-host -U postgres -d postgres -f supabase/migrations/20250730140000-storage-setup.sql
```

### 2. **Verify Bucket Creation**
Check that all buckets are created in your Supabase dashboard:
- Go to Storage section
- Verify all 5 buckets exist
- Check that RLS policies are applied

### 3. **Test Upload Functionality**
```typescript
// Test file upload
const testUpload = async () => {
  const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
  const result = await supabaseStorageService.uploadProfileAvatar(userId, file)
  console.log('Upload result:', result)
}
```

## 📋 File Validation

### **Supported File Types**
- **Images**: JPEG, PNG, GIF
- **Documents**: PDF, DOC, DOCX
- **Size Limits**: 5MB - 15MB depending on bucket

### **Validation Rules**
```typescript
// File type validation
const isValidType = supabaseStorageService.validateFileType(file, allowedTypes)

// File size validation
const isValidSize = supabaseStorageService.validateFileSize(file, maxSizeMB)
```

## 🛡️ Security Considerations

### **File Access Control**
- All files are stored with user-specific paths
- RLS policies ensure users can only access their own files
- Admin access is controlled through role-based policies

### **File Upload Security**
- File type validation prevents malicious uploads
- File size limits prevent abuse
- Unique file naming prevents conflicts

### **Privacy Protection**
- Private buckets require authentication
- Public buckets only for non-sensitive content
- Admin access logged for audit trails

## 📈 Monitoring and Analytics

### **Storage Metrics**
- Track total storage usage per bucket
- Monitor user storage consumption
- Alert on storage limits

### **Audit Logging**
- All file uploads are logged
- Admin actions are tracked
- File access is monitored

## 🔄 Migration from Existing Storage

If migrating from existing storage:

1. **Export existing files**
2. **Update file references in database**
3. **Upload files to new Supabase buckets**
4. **Update application code to use new storage service**

## 🚨 Troubleshooting

### **Common Issues**

1. **Upload Fails**
   - Check file size limits
   - Verify file type is allowed
   - Ensure user is authenticated

2. **Access Denied**
   - Verify RLS policies are applied
   - Check user permissions
   - Ensure bucket exists

3. **File Not Found**
   - Verify file path is correct
   - Check if file was deleted
   - Ensure bucket is accessible

### **Debug Commands**
```typescript
// Check bucket info
const bucketInfo = supabaseStorageService.getBucketInfo('kyc-documents')

// List user files
const files = await supabaseStorageService.listUserFiles(userId, 'deposit-proofs')

// Get file URL
const url = await supabaseStorageService.getFileUrl('profile-avatars', 'user/avatar.jpg')
```

## 📚 Additional Resources

- [Supabase Storage Documentation](https://supabase.com/docs/guides/storage)
- [Storage API Reference](https://supabase.com/docs/reference/javascript/storage-createbucket)
- [RLS Policies Guide](https://supabase.com/docs/guides/auth/row-level-security)

---

**Storage Setup Complete**: Your trading platform now has comprehensive file storage with proper security, validation, and management capabilities! 🎉 