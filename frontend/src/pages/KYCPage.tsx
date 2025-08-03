import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  ArrowLeft, 
  Upload, 
  Camera, 
  X, 
  CheckCircle, 
  AlertCircle,
  User,
  Calendar,
  FileText,
  Home,
  Shield,
  Eye,
  EyeOff,
  RefreshCw,
  Save
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface KYCData {
  fullName: string;
  dateOfBirth: string;
  nationality: string;
  idType: string;
  idNumber: string;
  address: string;
  city: string;
  country: string;
  postalCode: string;
  phone: string;
}

interface KYCFiles {
  idDocument: File | null;
  addressProof: File | null;
  selfie: File | null;
}

interface KYCStatus {
  isCompleted: boolean;
  isVerified: boolean;
  isPending: boolean;
  isRejected: boolean;
  rejectionReason?: string;
  submittedAt?: string;
  verifiedAt?: string;
}

const KYCPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, updateUserProfile } = useAuth();
  const { toast } = useToast();
  
  // Get redirect info from withdrawal flow
  const searchParams = new URLSearchParams(location.search);
  const fromWithdrawal = searchParams.get('from') === 'withdrawal';
  const withdrawalAmount = searchParams.get('amount');
  const withdrawalAddress = searchParams.get('address');

  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [kycData, setKycData] = useState<KYCData>({
    fullName: user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : '',
    dateOfBirth: '',
    nationality: '',
    idType: '',
    idNumber: '',
    address: '',
    city: '',
    country: user?.country || '',
    postalCode: '',
    phone: user?.phone || ''
  });

  const [kycFiles, setKycFiles] = useState<KYCFiles>({
    idDocument: null,
    addressProof: null,
    selfie: null
  });

  const [filePreviews, setFilePreviews] = useState<{
    idDocument?: string;
    addressProof?: string;
    selfie?: string;
  }>({});

  const [kycStatus, setKycStatus] = useState<KYCStatus>({
    isCompleted: false,
    isVerified: false,
    isPending: false,
    isRejected: false
  });

  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState('');

  // Load existing KYC data if available
  useEffect(() => {
    loadKYCData();
  }, []);

  const loadKYCData = async () => {
    setIsLoading(true);
    try {
      // Load KYC data from localStorage or API
      const savedKYC = localStorage.getItem(`kyc_${user?.id}`);
      if (savedKYC) {
        const parsed = JSON.parse(savedKYC);
        setKycData(parsed.data || kycData);
        setKycStatus(parsed.status || kycStatus);
      }
    } catch (error) {
      console.error('Error loading KYC data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveKYCData = async () => {
    if (!user?.id) return;
    
    const kycDataToSave = {
      data: kycData,
      status: kycStatus,
      files: kycFiles,
      submittedAt: new Date().toISOString()
    };
    
    localStorage.setItem(`kyc_${user.id}`, JSON.stringify(kycDataToSave));
  };

  const handleFileUpload = (field: keyof KYCFiles, file: File) => {
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      toast({
        title: "File Too Large",
        description: "Please select a file smaller than 10MB",
        variant: "destructive"
      });
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid File Type",
        description: "Please upload JPEG, PNG, or PDF files only",
        variant: "destructive"
      });
      return;
    }

    setKycFiles(prev => ({ ...prev, [field]: file }));

    // Create preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setFilePreviews(prev => ({ ...prev, [field]: e.target?.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const removeFile = (field: keyof KYCFiles) => {
    setKycFiles(prev => ({ ...prev, [field]: null }));
    setFilePreviews(prev => ({ ...prev, [field]: undefined }));
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(kycData.fullName && kycData.dateOfBirth && kycData.nationality);
      case 2:
        return !!(kycData.idType && kycData.idNumber && kycFiles.idDocument);
      case 3:
        return !!(kycData.address && kycData.city && kycData.country && kycData.postalCode && kycFiles.addressProof);
      case 4:
        return !!(kycFiles.selfie && password);
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 4));
    } else {
      toast({
        title: "Incomplete Information",
        description: "Please fill in all required fields before proceeding",
        variant: "destructive"
      });
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(4)) {
      toast({
        title: "Incomplete Information",
        description: "Please fill in all required fields before submitting",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Simulate API call for KYC submission
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Update KYC status
      const newStatus: KYCStatus = {
        isCompleted: true,
        isVerified: false,
        isPending: true,
        isRejected: false,
        submittedAt: new Date().toISOString()
      };
      
      setKycStatus(newStatus);
      await saveKYCData();

      // Update user profile
      updateUserProfile({
        kycStatus: 'pending',
        kycSubmittedAt: new Date().toISOString()
      });

      toast({
        title: "KYC Submitted Successfully",
        description: "Your verification documents have been submitted and are under review",
      });

      // If coming from withdrawal, redirect back
      if (fromWithdrawal) {
        navigate(`/withdraw?amount=${withdrawalAmount}&address=${withdrawalAddress}&kyc=submitted`);
      } else {
        setCurrentStep(5); // Show success step
      }
    } catch (error) {
      toast({
        title: "Submission Failed",
        description: "Please try again or contact support",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackToWithdrawal = () => {
    navigate(`/withdraw?amount=${withdrawalAmount}&address=${withdrawalAddress}&kyc=completed`);
  };

  const handleBackToSettings = () => {
    navigate('/settings');
  };

  const getStepIcon = (step: number) => {
    if (currentStep > step) return <CheckCircle className="w-5 h-5 text-green-500" />;
    if (currentStep === step) return <AlertCircle className="w-5 h-5 text-blue-500" />;
    return <div className="w-5 h-5 rounded-full border-2 border-gray-300" />;
  };

  const getStepStatus = (step: number) => {
    if (currentStep > step) return 'completed';
    if (currentStep === step) return 'current';
    return 'pending';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pt-20">
        <div className="kucoin-container py-8">
          <div className="flex items-center justify-center">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-20">
      <div className="kucoin-container py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              onClick={fromWithdrawal ? handleBackToWithdrawal : handleBackToSettings}
              className="text-slate-400 hover:text-white"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              {fromWithdrawal ? 'Back to Withdrawal' : 'Back to Settings'}
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-white">KYC Verification</h1>
              <p className="text-slate-400">
                {fromWithdrawal 
                  ? 'Complete verification to continue with your withdrawal'
                  : 'Verify your identity to unlock all platform features'
                }
              </p>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              {getStepIcon(1)}
              <span className={`text-sm ${getStepStatus(1) === 'completed' ? 'text-green-500' : getStepStatus(1) === 'current' ? 'text-blue-500' : 'text-gray-400'}`}>
                Personal Information
              </span>
            </div>
            <div className="flex items-center gap-4">
              {getStepIcon(2)}
              <span className={`text-sm ${getStepStatus(2) === 'completed' ? 'text-green-500' : getStepStatus(2) === 'current' ? 'text-blue-500' : 'text-gray-400'}`}>
                ID Verification
              </span>
            </div>
            <div className="flex items-center gap-4">
              {getStepIcon(3)}
              <span className={`text-sm ${getStepStatus(3) === 'completed' ? 'text-green-500' : getStepStatus(3) === 'current' ? 'text-blue-500' : 'text-gray-400'}`}>
                Address Verification
              </span>
            </div>
            <div className="flex items-center gap-4">
              {getStepIcon(4)}
              <span className={`text-sm ${getStepStatus(4) === 'completed' ? 'text-green-500' : getStepStatus(4) === 'current' ? 'text-blue-500' : 'text-gray-400'}`}>
                Final Review
              </span>
            </div>
          </div>
          <Progress value={(currentStep / 4) * 100} className="h-2" />
        </div>

        {/* KYC Status Check */}
        {kycStatus.isCompleted && (
          <Card className="mb-6 p-6 bg-slate-800/50 border-slate-700">
            <div className="flex items-center gap-4">
              {kycStatus.isVerified ? (
                <CheckCircle className="w-8 h-8 text-green-500" />
              ) : kycStatus.isPending ? (
                <RefreshCw className="w-8 h-8 text-yellow-500 animate-spin" />
              ) : (
                <AlertCircle className="w-8 h-8 text-red-500" />
              )}
              <div>
                <h3 className="text-lg font-semibold text-white">
                  {kycStatus.isVerified ? 'KYC Verified' : kycStatus.isPending ? 'KYC Under Review' : 'KYC Rejected'}
                </h3>
                <p className="text-slate-400">
                  {kycStatus.isVerified 
                    ? 'Your identity has been verified successfully'
                    : kycStatus.isPending 
                    ? 'Your documents are being reviewed. This usually takes 1-3 business days.'
                    : kycStatus.rejectionReason || 'Your KYC was rejected. Please review and resubmit.'
                  }
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Step Content */}
        <Card className="bg-slate-800/50 border-slate-700 p-6">
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold mb-4 text-white">Personal Information</h2>
                <p className="text-slate-400 mb-6">Please provide your basic personal information</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="fullName" className="text-white">Full Legal Name *</Label>
                  <Input
                    id="fullName"
                    value={kycData.fullName}
                    onChange={(e) => setKycData({...kycData, fullName: e.target.value})}
                    placeholder="Enter your full legal name"
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                
                <div>
                  <Label htmlFor="dateOfBirth" className="text-white">Date of Birth *</Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    value={kycData.dateOfBirth}
                    onChange={(e) => setKycData({...kycData, dateOfBirth: e.target.value})}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                
                <div>
                  <Label htmlFor="nationality" className="text-white">Nationality *</Label>
                  <Select value={kycData.nationality} onValueChange={(value) => setKycData({...kycData, nationality: value})}>
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                      <SelectValue placeholder="Select your nationality" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-600">
                      <SelectItem value="US">United States</SelectItem>
                      <SelectItem value="CA">Canada</SelectItem>
                      <SelectItem value="UK">United Kingdom</SelectItem>
                      <SelectItem value="DE">Germany</SelectItem>
                      <SelectItem value="FR">France</SelectItem>
                      <SelectItem value="JP">Japan</SelectItem>
                      <SelectItem value="AU">Australia</SelectItem>
                      <SelectItem value="SG">Singapore</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="phone" className="text-white">Phone Number</Label>
                  <Input
                    id="phone"
                    value={kycData.phone}
                    onChange={(e) => setKycData({...kycData, phone: e.target.value})}
                    placeholder="Enter your phone number"
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold mb-4 text-white">ID Verification</h2>
                <p className="text-slate-400 mb-6">Please upload a government-issued ID document</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="idType" className="text-white">ID Type *</Label>
                  <Select value={kycData.idType} onValueChange={(value) => setKycData({...kycData, idType: value})}>
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                      <SelectValue placeholder="Select ID type" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-600">
                      <SelectItem value="passport">Passport</SelectItem>
                      <SelectItem value="drivers_license">Driver's License</SelectItem>
                      <SelectItem value="national_id">National ID Card</SelectItem>
                      <SelectItem value="residence_permit">Residence Permit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="idNumber" className="text-white">ID Number *</Label>
                  <Input
                    id="idNumber"
                    value={kycData.idNumber}
                    onChange={(e) => setKycData({...kycData, idNumber: e.target.value})}
                    placeholder="Enter your ID number"
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
              </div>
              
              <div>
                <Label className="text-white">ID Document Upload *</Label>
                <div className="mt-2">
                  {kycFiles.idDocument ? (
                    <div className="border border-slate-600 rounded-lg p-4 bg-slate-700">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <FileText className="w-5 h-5 text-blue-500" />
                          <div>
                            <p className="text-white font-medium">{kycFiles.idDocument.name}</p>
                            <p className="text-slate-400 text-sm">
                              {(kycFiles.idDocument.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile('idDocument')}
                          className="text-red-500 hover:text-red-400"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                      {filePreviews.idDocument && (
                        <img 
                          src={filePreviews.idDocument} 
                          alt="ID Document Preview" 
                          className="mt-3 max-w-xs rounded border"
                        />
                      )}
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-slate-600 rounded-lg p-8 text-center hover:border-slate-500 transition-colors">
                      <input
                        type="file"
                        id="idDocument"
                        accept="image/*,.pdf"
                        onChange={(e) => e.target.files?.[0] && handleFileUpload('idDocument', e.target.files[0])}
                        className="hidden"
                      />
                      <label htmlFor="idDocument" className="cursor-pointer">
                        <Upload className="w-8 h-8 text-slate-400 mx-auto mb-3" />
                        <p className="text-white font-medium">Upload ID Document</p>
                        <p className="text-slate-400 text-sm">JPEG, PNG, or PDF (max 10MB)</p>
                      </label>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold mb-4 text-white">Address Verification</h2>
                <p className="text-slate-400 mb-6">Please provide your current residential address</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <Label htmlFor="address" className="text-white">Street Address *</Label>
                  <Input
                    id="address"
                    value={kycData.address}
                    onChange={(e) => setKycData({...kycData, address: e.target.value})}
                    placeholder="Enter your street address"
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                
                <div>
                  <Label htmlFor="city" className="text-white">City *</Label>
                  <Input
                    id="city"
                    value={kycData.city}
                    onChange={(e) => setKycData({...kycData, city: e.target.value})}
                    placeholder="Enter your city"
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                
                <div>
                  <Label htmlFor="country" className="text-white">Country *</Label>
                  <Select value={kycData.country} onValueChange={(value) => setKycData({...kycData, country: value})}>
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                      <SelectValue placeholder="Select your country" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-600">
                      <SelectItem value="US">United States</SelectItem>
                      <SelectItem value="CA">Canada</SelectItem>
                      <SelectItem value="UK">United Kingdom</SelectItem>
                      <SelectItem value="DE">Germany</SelectItem>
                      <SelectItem value="FR">France</SelectItem>
                      <SelectItem value="JP">Japan</SelectItem>
                      <SelectItem value="AU">Australia</SelectItem>
                      <SelectItem value="SG">Singapore</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="postalCode" className="text-white">Postal Code *</Label>
                  <Input
                    id="postalCode"
                    value={kycData.postalCode}
                    onChange={(e) => setKycData({...kycData, postalCode: e.target.value})}
                    placeholder="Enter your postal code"
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
              </div>
              
              <div>
                <Label className="text-white">Proof of Address *</Label>
                <div className="mt-2">
                  {kycFiles.addressProof ? (
                    <div className="border border-slate-600 rounded-lg p-4 bg-slate-700">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Home className="w-5 h-5 text-green-500" />
                          <div>
                            <p className="text-white font-medium">{kycFiles.addressProof.name}</p>
                            <p className="text-slate-400 text-sm">
                              {(kycFiles.addressProof.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile('addressProof')}
                          className="text-red-500 hover:text-red-400"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                      {filePreviews.addressProof && (
                        <img 
                          src={filePreviews.addressProof} 
                          alt="Address Proof Preview" 
                          className="mt-3 max-w-xs rounded border"
                        />
                      )}
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-slate-600 rounded-lg p-8 text-center hover:border-slate-500 transition-colors">
                      <input
                        type="file"
                        id="addressProof"
                        accept="image/*,.pdf"
                        onChange={(e) => e.target.files?.[0] && handleFileUpload('addressProof', e.target.files[0])}
                        className="hidden"
                      />
                      <label htmlFor="addressProof" className="cursor-pointer">
                        <Upload className="w-8 h-8 text-slate-400 mx-auto mb-3" />
                        <p className="text-white font-medium">Upload Proof of Address</p>
                        <p className="text-slate-400 text-sm">Utility bill, bank statement, or lease agreement</p>
                      </label>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold mb-4 text-white">Final Review</h2>
                <p className="text-slate-400 mb-6">Please review your information and upload a selfie for verification</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label className="text-white">Selfie with ID *</Label>
                  <div className="mt-2">
                    {kycFiles.selfie ? (
                      <div className="border border-slate-600 rounded-lg p-4 bg-slate-700">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <User className="w-5 h-5 text-purple-500" />
                            <div>
                              <p className="text-white font-medium">{kycFiles.selfie.name}</p>
                              <p className="text-slate-400 text-sm">
                                {(kycFiles.selfie.size / 1024 / 1024).toFixed(2)} MB
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFile('selfie')}
                            className="text-red-500 hover:text-red-400"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                        {filePreviews.selfie && (
                          <img 
                            src={filePreviews.selfie} 
                            alt="Selfie Preview" 
                            className="mt-3 max-w-xs rounded border"
                          />
                        )}
                      </div>
                    ) : (
                      <div className="border-2 border-dashed border-slate-600 rounded-lg p-8 text-center hover:border-slate-500 transition-colors">
                        <input
                          type="file"
                          id="selfie"
                          accept="image/*"
                          onChange={(e) => e.target.files?.[0] && handleFileUpload('selfie', e.target.files[0])}
                          className="hidden"
                        />
                        <label htmlFor="selfie" className="cursor-pointer">
                          <Camera className="w-8 h-8 text-slate-400 mx-auto mb-3" />
                          <p className="text-white font-medium">Upload Selfie</p>
                          <p className="text-slate-400 text-sm">Take a photo holding your ID document</p>
                        </label>
                      </div>
                    )}
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="password" className="text-white">Confirm Password *</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password to confirm"
                      className="bg-slate-700 border-slate-600 text-white pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-slate-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-slate-400" />
                      )}
                    </Button>
                  </div>
                  <p className="text-slate-400 text-sm mt-1">
                    This confirms that you are the account holder
                  </p>
                </div>
              </div>
              
              <div className="bg-slate-700/50 rounded-lg p-4">
                <h3 className="font-semibold text-white mb-3">Information Summary</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-slate-400">Full Name</p>
                    <p className="text-white">{kycData.fullName}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Date of Birth</p>
                    <p className="text-white">{kycData.dateOfBirth}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Nationality</p>
                    <p className="text-white">{kycData.nationality}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">ID Type</p>
                    <p className="text-white">{kycData.idType}</p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-slate-400">Address</p>
                    <p className="text-white">{kycData.address}, {kycData.city}, {kycData.country} {kycData.postalCode}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentStep === 5 && (
            <div className="text-center space-y-6">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">KYC Submitted Successfully!</h2>
                <p className="text-slate-400">
                  Your verification documents have been submitted and are under review. 
                  You will receive a notification once the verification is complete.
                </p>
              </div>
              
              <div className="bg-slate-700/50 rounded-lg p-4">
                <h3 className="font-semibold text-white mb-2">What happens next?</h3>
                <ul className="text-slate-400 text-sm space-y-1 text-left">
                  <li>• Our team will review your documents within 1-3 business days</li>
                  <li>• You'll receive an email notification once verified</li>
                  <li>• Once verified, you can proceed with withdrawals</li>
                  <li>• You can check your KYC status in your profile settings</li>
                </ul>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          {currentStep < 5 && (
            <div className="flex justify-between mt-8">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={currentStep === 1}
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                Back
              </Button>
              
              {currentStep < 4 ? (
                <Button
                  onClick={handleNext}
                  disabled={!validateStep(currentStep)}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Next
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={!validateStep(currentStep) || isSubmitting}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Submit KYC
                    </>
                  )}
                </Button>
              )}
            </div>
          )}

          {currentStep === 5 && (
            <div className="flex justify-center mt-8">
              <Button
                onClick={fromWithdrawal ? handleBackToWithdrawal : handleBackToSettings}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {fromWithdrawal ? 'Continue to Withdrawal' : 'Back to Settings'}
              </Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default KYCPage; 