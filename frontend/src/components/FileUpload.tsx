import React, { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Upload, X, CheckCircle, AlertCircle } from 'lucide-react'
import supabaseStorageService from '@/services/supabaseStorageService'

interface FileUploadProps {
  bucketId: string
  userId: string
  onUploadComplete?: (result: { success: boolean; url?: string; path?: string; error?: string }) => void
  onUploadStart?: () => void
  maxFileSize?: number // in MB
  allowedTypes?: string[]
  multiple?: boolean
  className?: string
  title?: string
  description?: string
  uploadFunction?: (file: File) => Promise<any>
}

const FileUpload: React.FC<FileUploadProps> = ({
  bucketId,
  userId,
  onUploadComplete,
  onUploadStart,
  maxFileSize = 10, // 10MB default
  allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],
  multiple = false,
  className = '',
  title = 'Upload File',
  description = 'Drag and drop files here or click to browse',
  uploadFunction
}) => {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadedFiles, setUploadedFiles] = useState<Array<{ name: string; url: string; path: string }>>([])
  const [error, setError] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const validateFile = (file: File): string | null => {
    // Check file type
    if (!allowedTypes.includes(file.type)) {
      return `File type ${file.type} is not allowed. Allowed types: ${allowedTypes.join(', ')}`
    }

    // Check file size
    if (file.size > maxFileSize * 1024 * 1024) {
      return `File size ${(file.size / 1024 / 1024).toFixed(2)}MB exceeds maximum size of ${maxFileSize}MB`
    }

    return null
  }

  const handleFileUpload = async (files: FileList) => {
    setError(null)
    setIsUploading(true)
    setUploadProgress(0)

    if (onUploadStart) {
      onUploadStart()
    }

    const fileArray = Array.from(files)
    const results: Array<{ name: string; url: string; path: string }> = []

    for (let i = 0; i < fileArray.length; i++) {
      const file = fileArray[i]
      
      // Validate file
      const validationError = validateFile(file)
      if (validationError) {
        setError(validationError)
        setIsUploading(false)
        return
      }

      try {
        // Update progress
        setUploadProgress((i / fileArray.length) * 100)

        let result
        if (uploadFunction) {
          result = await uploadFunction(file)
        } else {
          // Use default upload based on bucket
          switch (bucketId) {
            case 'kyc-documents':
              result = await supabaseStorageService.uploadKYCDocument(
                userId,
                file,
                'id_card' // Default document type
              )
              break
            case 'profile-avatars':
              result = await supabaseStorageService.uploadProfileAvatar(userId, file)
              break
            case 'deposit-proofs':
              result = await supabaseStorageService.uploadDepositProof(
                userId,
                file,
                `deposit-${Date.now()}`
              )
              break
            case 'trade-screenshots':
              result = await supabaseStorageService.uploadTradeScreenshot(
                userId,
                file,
                `trade-${Date.now()}`
              )
              break
            case 'support-attachments':
              result = await supabaseStorageService.uploadSupportAttachment(
                userId,
                file,
                `ticket-${Date.now()}`
              )
              break
            default:
              throw new Error(`Unknown bucket: ${bucketId}`)
          }
        }

        if (result.success && result.url) {
          results.push({
            name: file.name,
            url: result.url,
            path: result.path || ''
          })
        } else {
          throw new Error(result.error || 'Upload failed')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Upload failed')
        setIsUploading(false)
        return
      }
    }

    setUploadProgress(100)
    setIsUploading(false)
    setUploadedFiles(prev => [...prev, ...results])

    if (onUploadComplete && results.length > 0) {
      onUploadComplete({
        success: true,
        url: results[0].url,
        path: results[0].path
      }) // Return first result for single file uploads
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files)
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files)
    }
  }

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const clearAll = () => {
    setUploadedFiles([])
    setError(null)
  }

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Upload Area */}
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
              dragActive
                ? 'border-primary bg-primary/5'
                : 'border-muted-foreground/25 hover:border-muted-foreground/50'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground mb-2">{description}</p>
            <p className="text-xs text-muted-foreground mb-4">
              Max file size: {maxFileSize}MB | Allowed types: {allowedTypes.join(', ')}
            </p>
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              variant="outline"
            >
              Choose Files
            </Button>
            <Input
              ref={fileInputRef}
              type="file"
              multiple={multiple}
              accept={allowedTypes.join(',')}
              onChange={handleFileInput}
              className="hidden"
            />
          </div>

          {/* Upload Progress */}
          {isUploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Uploading...</span>
                <span>{Math.round(uploadProgress)}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
            </div>
          )}

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Uploaded Files */}
          {uploadedFiles.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">Uploaded Files</h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAll}
                  className="text-muted-foreground hover:text-foreground"
                >
                  Clear All
                </Button>
              </div>
              <div className="space-y-2">
                {uploadedFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 bg-muted rounded-md"
                  >
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm truncate">{file.name}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default FileUpload 