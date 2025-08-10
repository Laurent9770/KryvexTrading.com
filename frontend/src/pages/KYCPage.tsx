import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Save,
  Mail,
  Lock,
  Unlock,
  AlertTriangle
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import supabaseKYCService, { CreateKYCData } from '@/services/supabaseKYCService';
import { getCountries } from '@/utils/countries';


// Local interfaces for KYC page
interface KYCLevel1Data {
  email: string;
  verificationCode: string;
}

interface KYCLevel2Data {
  fullName: string;
  dateOfBirth: string;
  country: string;
  idType: 'passport' | 'drivers_license' | 'national_id';
  idNumber: string;
  frontFile?: File;
  backFile?: File;
  selfieFile?: File;
}

interface KYCStatus {
  level1: { status: 'unverified' | 'verified' | 'pending' };
  level2: { status: 'not_started' | 'pending' | 'approved' | 'rejected' };
}

const KYCPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, updateUserProfile, sendKYCEmailVerification, verifyKYCEmailCode, resendKYCEmailVerification } = useAuth();
  const { toast } = useToast();
  
  // Get redirect info from withdrawal flow
  const searchParams = new URLSearchParams(location.search);
  const fromWithdrawal = searchParams.get('from') === 'withdrawal';
  const withdrawalAmount = searchParams.get('amount');
  const withdrawalAddress = searchParams.get('address');

  const [activeTab, setActiveTab] = useState('level2'); // Default to Identity Verification
  const [isLoading, setIsLoading] = useState(false);
  const [kycStatus, setKycStatus] = useState<KYCStatus>({
    level1: { status: 'unverified' },
    level2: { status: 'not_started' }
  });
  
  // Level 1: Email Verification
  const [emailVerificationCode, setEmailVerificationCode] = useState('');
  const [emailVerificationId, setEmailVerificationId] = useState('');
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);
  const [emailCountdown, setEmailCountdown] = useState(0);
  
  // Level 2: Identity Verification
  const [identityData, setIdentityData] = useState<KYCLevel2Data>({
    fullName: user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : '',
    dateOfBirth: '',
    country: user?.country || '',
    idType: 'passport',
    idNumber: '',
    frontFile: undefined,
    backFile: undefined,
    selfieFile: undefined
  });

  const [filePreviews, setFilePreviews] = useState<{
    front?: string;
    back?: string;
    selfie?: string;
  }>({});

  // Get countries list
  const countries = getCountries();

  // Load KYC status on component mount
  useEffect(() => {
    if (user?.id) {
      loadKYCStatus();
    }
  }, [user?.id]);

  // Debug: Log active tab changes
  useEffect(() => {
    console.log('🎯 Current active tab:', activeTab);
  }, [activeTab]);

  // Debug: Log KYC status changes
  useEffect(() => {
    console.log('🆔 Current KYC status:', kycStatus);
  }, [kycStatus]);

  // Email verification countdown timer
  useEffect(() => {
    if (emailCountdown > 0) {
      const timer = setTimeout(() => setEmailCountdown(emailCountdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [emailCountdown]);

  const loadKYCStatus = async () => {
    if (!user?.id) return;
    
    try {
      console.log('🆔 Loading KYC status for user:', user.id);
      const { success, data } = await supabaseKYCService.getUserKYCStatus(user.id);
      console.log('🆔 KYC status result:', { success, data });
      
      if (success && data) {
        console.log('🆔 Raw KYC data received:', data);
        const newStatus: KYCStatus = {
          level1: { status: data.isVerified ? 'verified' : 'unverified' },
          level2: { status: data.status as 'not_started' | 'pending' | 'approved' | 'rejected' }
        };
        console.log('🆔 Setting KYC status:', newStatus);
        setKycStatus(newStatus);
      } else {
        console.log('🆔 KYC status load failed or no data, keeping default status');
        // Keep the default status if loading fails
      }
    } catch (error) {
      console.error('Error loading KYC status:', error);
    }
  };

  // Level 1: Send verification email
  const handleSendVerificationEmail = async () => {
    if (!user?.email) return;
    
    setIsSendingCode(true);
    try {
      const result = await sendKYCEmailVerification(user.email);
      if (result.success && result.verificationId) {
        setEmailVerificationId(result.verificationId);
        setEmailCountdown(600); // 10 minutes countdown
        setKycStatus(prev => ({
          ...prev,
          level1: { status: 'pending' }
        }));
        
        toast({
          title: "Verification Code Sent",
          description: `A 6-digit verification code has been sent to ${user.email}. Please check your email.`,
          duration: 8000,
        });
      }
    } catch (error) {
      // Error already handled in AuthContext
    } finally {
      setIsSendingCode(false);
    }
  };

  // Level 1: Verify email code
  const handleVerifyEmailCode = async () => {
    if (!emailVerificationCode) {
      toast({
        title: "Verification Code Required",
        description: "Please enter the verification code",
        variant: "destructive"
      });
      return;
    }

    if (!emailVerificationId || !user?.email) {
      toast({
        title: "Error",
        description: "Please request a new verification code",
        variant: "destructive"
      });
      return;
    }

    setIsVerifyingCode(true);
    try {
      const result = await verifyKYCEmailCode(emailVerificationId, emailVerificationCode, user.email);
      if (result.success) {
        setKycStatus(prev => ({
          ...prev,
          level1: { status: 'verified' }
        }));
        setEmailCountdown(0);
        setActiveTab('level2');
      }
    } catch (error) {
      // Error already handled in AuthContext
    } finally {
      setIsVerifyingCode(false);
    }
  };

  // Level 1: Resend verification email
  const handleResendVerificationEmail = async () => {
    if (!emailVerificationId) {
      // If no verification ID, send new email
      handleSendVerificationEmail();
      return;
    }
    
    setIsSendingCode(true);
    try {
      const result = await resendKYCEmailVerification(emailVerificationId);
      if (result.success && result.verificationId) {
        setEmailVerificationId(result.verificationId);
        setEmailCountdown(600); // 10 minutes countdown
        setEmailVerificationCode(''); // Clear previous code
      }
    } catch (error) {
      // Error already handled in AuthContext
    } finally {
      setIsSendingCode(false);
    }
  };

  // Level 2: Handle file upload
  const handleFileUpload = (field: 'frontFile' | 'backFile' | 'selfieFile', file: File) => {
    setIdentityData(prev => ({
      ...prev,
      [field]: file
    }));

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setFilePreviews(prev => ({
        ...prev,
        [field.replace('File', '')]: e.target?.result as string
      }));
    };
    reader.readAsDataURL(file);
  };

  // Level 2: Remove file
  const removeFile = (field: 'frontFile' | 'backFile' | 'selfieFile') => {
    setIdentityData(prev => ({
      ...prev,
      [field]: undefined
    }));
    setFilePreviews(prev => ({
      ...prev,
      [field.replace('File', '')]: undefined
    }));
  };

  // Level 2: Submit identity verification
  const handleSubmitIdentityVerification = async () => {
    if (!user?.id) return;

    // Validate required fields
    if (!identityData.fullName || !identityData.dateOfBirth || !identityData.country || !identityData.idNumber) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    if (!identityData.frontFile || !identityData.selfieFile) {
      toast({
        title: "Missing Documents",
        description: "Please upload front document and selfie",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const kycData: CreateKYCData = {
        fullName: identityData.fullName,
        dateOfBirth: identityData.dateOfBirth,
        country: identityData.country,
        idType: identityData.idType,
        idNumber: identityData.idNumber,
        frontFile: identityData.frontFile,
        backFile: identityData.backFile,
        selfieFile: identityData.selfieFile
      };

      const { success, error } = await supabaseKYCService.createKYCSubmission(kycData);
      
      if (success) {
        toast({
          title: "KYC Submitted",
          description: "Your identity verification has been submitted for review",
        });
        setKycStatus(prev => ({
          ...prev,
          level2: { status: 'pending' }
        }));
        
        // Update user profile with KYC status
        if (updateUserProfile) {
          updateUserProfile({ kycStatus: 'pending' });
        }
        
        // Redirect if coming from withdrawal
        if (fromWithdrawal) {
          handleBackToWithdrawal();
        }
      } else {
        toast({
          title: "Submission Failed",
          description: error || "Failed to submit KYC verification",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToWithdrawal = () => {
    const params = new URLSearchParams();
    if (withdrawalAmount) params.set('amount', withdrawalAmount);
    if (withdrawalAddress) params.set('address', withdrawalAddress);
    navigate(`/withdraw?${params.toString()}`);
  };

  const handleBackToSettings = () => {
    navigate('/settings');
  };

  const getLevel1StatusIcon = () => {
    switch (kycStatus.level1.status) {
      case 'verified': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'pending': return <RefreshCw className="w-5 h-5 text-yellow-500 animate-spin" />;
      default: return <AlertCircle className="w-5 h-5 text-red-500" />;
    }
  };

  const getLevel2StatusIcon = () => {
    switch (kycStatus.level2.status) {
      case 'approved': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'pending': return <RefreshCw className="w-5 h-5 text-yellow-500 animate-spin" />;
      case 'rejected': return <AlertTriangle className="w-5 h-5 text-red-500" />;
      default: return <AlertCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getLevel1StatusBadge = () => {
    switch (kycStatus.level1.status) {
      case 'verified': return <Badge className="bg-green-500">Verified</Badge>;
      case 'pending': return <Badge className="bg-yellow-500">Pending</Badge>;
      default: return <Badge variant="outline">Unverified</Badge>;
    }
  };

  const getLevel2StatusBadge = () => {
    switch (kycStatus.level2.status) {
      case 'approved': return <Badge className="bg-green-500">Approved</Badge>;
      case 'pending': return <Badge className="bg-yellow-500">Pending</Badge>;
      case 'rejected': return <Badge className="bg-red-500">Rejected</Badge>;
      default: return <Badge variant="outline">Not Started</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-background pt-20">
      <div className="kucoin-container py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={fromWithdrawal ? handleBackToWithdrawal : handleBackToSettings}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <h1 className="text-3xl font-bold text-foreground">KYC Verification</h1>
          </div>
          <p className="text-muted-foreground">
            Complete your Know Your Customer verification to unlock full platform access.
          </p>
        </div>

        {/* Helpful Instructions */}
        <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-200 mb-6">
          <p className="text-sm text-blue-600">
            <strong>How to use:</strong> Click on either the status cards above or the tabs below to access the verification forms. 
            You can complete Level 2 (Identity Verification) without completing Level 1 (Email Verification).
          </p>
        </div>

        {/* KYC Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className={`border-0 cursor-pointer hover:bg-accent/50 transition-colors ${activeTab === 'level1' ? 'ring-2 ring-blue-500 bg-blue-500/10' : ''}`} onClick={() => {
            console.log('🔄 Switching to Level 1 (Email Verification)');
            setActiveTab('level1');
          }}>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                {getLevel1StatusIcon()}
                <div>
                  <h3 className="font-semibold">Level 1: Email Verification</h3>
                  <p className="text-sm text-muted-foreground">Verify your email address</p>
                </div>
              </div>
              {getLevel1StatusBadge()}
              {kycStatus.level1.status === 'unverified' && (
                <p className="text-sm text-muted-foreground mt-2">
                  Required to access trading features
                </p>
              )}
              <p className="text-xs text-blue-500 mt-2">Click to access email verification</p>
            </CardContent>
          </Card>

          <Card className={`border-0 cursor-pointer hover:bg-accent/50 transition-colors ${activeTab === 'level2' ? 'ring-2 ring-blue-500 bg-blue-500/10' : ''}`} onClick={() => {
            console.log('🔄 Switching to Level 2 (Identity Verification)');
            setActiveTab('level2');
          }}>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                {getLevel2StatusIcon()}
                <div>
                  <h3 className="font-semibold">Level 2: Identity Verification</h3>
                  <p className="text-sm text-muted-foreground">Verify your identity</p>
                </div>
              </div>
              {getLevel2StatusBadge()}
              {kycStatus.level2.status === 'not_started' && (
                <p className="text-sm text-muted-foreground mt-2">
                  Required for withdrawals
                </p>
              )}
              <p className="text-xs text-blue-500 mt-2">Click to access identity verification</p>
            </CardContent>
          </Card>
        </div>

        {/* KYC Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="level1" className="cursor-pointer">Email Verification</TabsTrigger>
            <TabsTrigger value="level2" className="cursor-pointer">
              Identity Verification
            </TabsTrigger>
          </TabsList>

          {/* Level 1: Email Verification */}
          <TabsContent value="level1" className="space-y-6">
            <Card className="border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="w-5 h-5" />
                  Email Verification
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  {kycStatus.level1.status === 'verified' && (
                    <div className="p-4 bg-green-500/10 rounded-lg">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-green-500" />
                        <span className="font-semibold text-green-600">Email Verified</span>
                      </div>
                      <p className="text-sm text-green-600 mt-1">
                        Your email has been verified. You can verify again if needed.
                      </p>
                    </div>
                  )}
                  
                  {kycStatus.level1.status !== 'verified' && (
                    <div className="p-4 bg-blue-500/10 rounded-lg">
                      <p className="text-sm text-blue-600">
                        Email verification is optional. You can already access all trading features.
                      </p>
                    </div>
                  )}
                    
                    <div className="space-y-4">
                      <Button 
                        onClick={handleSendVerificationEmail}
                        disabled={isSendingCode}
                        className="w-full"
                      >
                        {isSendingCode ? (
                          <>
                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                            Sending Code...
                          </>
                        ) : (
                          <>
                            <Mail className="w-4 h-4 mr-2" />
                            Send Verification Code
                          </>
                        )}
                      </Button>

                      
                      <div className="space-y-2">
                        <Label htmlFor="verificationCode">Verification Code</Label>
                        <Input
                          id="verificationCode"
                          placeholder="Enter 6-digit code"
                          value={emailVerificationCode}
                          onChange={(e) => setEmailVerificationCode(e.target.value)}
                          maxLength={6}
                        />
                      </div>
                      
                      <Button 
                        onClick={handleVerifyEmailCode}
                        disabled={!emailVerificationCode || isVerifyingCode}
                        className="w-full"
                      >
                        {isVerifyingCode ? (
                          <>
                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                            Verifying...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Verify Code
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Level 2: Identity Verification */}
          <TabsContent value="level2" className="space-y-6">
            <Card className="border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Identity Verification
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {(kycStatus.level2.status === 'not_started' || !kycStatus.level2.status) ? (
                  <div className="space-y-6">
                    <div className="p-4 bg-blue-500/10 rounded-lg">
                      <p className="text-sm text-blue-600">
                        Please provide your identity information and upload required documents.
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="fullName">Full Name (as on ID)</Label>
                        <Input
                          id="fullName"
                          value={identityData.fullName}
                          onChange={(e) => setIdentityData(prev => ({ ...prev, fullName: e.target.value }))}
                          placeholder="Enter your full name"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="dateOfBirth">Date of Birth</Label>
                        <Input
                          id="dateOfBirth"
                          type="date"
                          value={identityData.dateOfBirth}
                          onChange={(e) => setIdentityData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="country">Country</Label>
                        <Select value={identityData.country} onValueChange={(value) => setIdentityData(prev => ({ ...prev, country: value }))}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select country" />
                          </SelectTrigger>
                          <SelectContent>
                            {countries.map(country => (
                              <SelectItem key={country.code} value={country.code}>
                                {country.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label htmlFor="idType">ID Type</Label>
                        <Select value={identityData.idType} onValueChange={(value: any) => setIdentityData(prev => ({ ...prev, idType: value }))}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select ID type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="passport">Passport</SelectItem>
                            <SelectItem value="national_id">National ID</SelectItem>
                            <SelectItem value="drivers_license">Driver's License</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="md:col-span-2">
                        <Label htmlFor="idNumber">ID Number</Label>
                        <Input
                          id="idNumber"
                          value={identityData.idNumber}
                          onChange={(e) => setIdentityData(prev => ({ ...prev, idNumber: e.target.value }))}
                          placeholder="Enter your ID number"
                        />
                      </div>
                    </div>
                    
                    {/* Document Upload */}
                    <div className="space-y-4">
                      <h4 className="font-semibold">Document Upload</h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Front of ID */}
                        <div className="space-y-2">
                          <Label>Front of ID *</Label>
                          <div className="border-2 border-dashed border-border rounded-lg p-4 text-center">
                            {filePreviews.front ? (
                              <div className="space-y-2">
                                <img src={filePreviews.front} alt="Front" className="w-full h-32 object-cover rounded" />
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => removeFile('frontFile')}
                                >
                                  <X className="w-4 h-4 mr-2" />
                                  Remove
                                </Button>
                              </div>
                            ) : (
                              <div className="space-y-2">
                                <Upload className="w-8 h-8 mx-auto text-muted-foreground" />
                                <Input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => e.target.files?.[0] && handleFileUpload('frontFile', e.target.files[0])}
                                  className="hidden"
                                  id="frontFile"
                                />
                                <Label htmlFor="frontFile" className="cursor-pointer text-sm text-muted-foreground">
                                  Click to upload
                                </Label>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* Back of ID */}
                        <div className="space-y-2">
                          <Label>Back of ID (Optional)</Label>
                          <div className="border-2 border-dashed border-border rounded-lg p-4 text-center">
                            {filePreviews.back ? (
                              <div className="space-y-2">
                                <img src={filePreviews.back} alt="Back" className="w-full h-32 object-cover rounded" />
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => removeFile('backFile')}
                                >
                                  <X className="w-4 h-4 mr-2" />
                                  Remove
                                </Button>
                              </div>
                            ) : (
                              <div className="space-y-2">
                                <Upload className="w-8 h-8 mx-auto text-muted-foreground" />
                                <Input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => e.target.files?.[0] && handleFileUpload('backFile', e.target.files[0])}
                                  className="hidden"
                                  id="backFile"
                                />
                                <Label htmlFor="backFile" className="cursor-pointer text-sm text-muted-foreground">
                                  Click to upload
                                </Label>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* Selfie with ID */}
                        <div className="space-y-2">
                          <Label>Selfie with ID *</Label>
                          <div className="border-2 border-dashed border-border rounded-lg p-4 text-center">
                            {filePreviews.selfie ? (
                              <div className="space-y-2">
                                <img src={filePreviews.selfie} alt="Selfie" className="w-full h-32 object-cover rounded" />
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => removeFile('selfieFile')}
                                >
                                  <X className="w-4 h-4 mr-2" />
                                  Remove
                                </Button>
                              </div>
                            ) : (
                              <div className="space-y-2">
                                <Camera className="w-8 h-8 mx-auto text-muted-foreground" />
                                <Input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => e.target.files?.[0] && handleFileUpload('selfieFile', e.target.files[0])}
                                  className="hidden"
                                  id="selfieFile"
                                />
                                <Label htmlFor="selfieFile" className="cursor-pointer text-sm text-muted-foreground">
                                  Click to upload
                                </Label>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <Button 
                      onClick={handleSubmitIdentityVerification}
                      disabled={isLoading}
                      className="w-full"
                    >
                      {isLoading ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Submit for Review
                        </>
                      )}
                    </Button>
                  </div>
                ) : kycStatus.level2.status === 'pending' ? (
                  <div className="p-4 bg-yellow-500/10 rounded-lg">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-yellow-500" />
                      <span className="font-semibold text-yellow-600">Under Review</span>
                    </div>
                    <p className="text-sm text-yellow-600 mt-1">
                      Your identity verification is currently under review. You will be notified of the status.
                    </p>
                  </div>
                ) : kycStatus.level2.status === 'approved' ? (
                  <div className="p-4 bg-green-500/10 rounded-lg">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <span className="font-semibold text-green-600">Approved</span>
                    </div>
                    <p className="text-sm text-green-600 mt-1">
                      Your identity verification has been approved. You can now withdraw funds.
                    </p>
                  </div>
                ) : kycStatus.level2.status === 'rejected' ? (
                  <div className="p-4 bg-red-500/10 rounded-lg">
                    <div className="flex items-center gap-2">
                      <X className="w-5 h-5 text-red-500" />
                      <span className="font-semibold text-red-600">Rejected</span>
                    </div>
                    <p className="text-sm text-red-600 mt-1">
                      Your identity verification was rejected. Please review the requirements and try again.
                    </p>
                    {/* The rejectionReason is not directly available from getUserKYCStatus,
                        so we'll keep the original structure but note it's not displayed here
                        unless the backend provides it. */}
                    {/* {kycStatus.level2.rejectionReason && (
                      <p className="text-sm text-red-600 mt-2">
                        Reason: {kycStatus.level2.rejectionReason}
                      </p>
                    )} */}
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default KYCPage; 