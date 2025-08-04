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
import kycService, { KYCLevel1Data, KYCLevel2Data, KYCStatus } from '@/services/kycService';

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

  const [activeTab, setActiveTab] = useState('level1');
  const [isLoading, setIsLoading] = useState(false);
  const [kycStatus, setKycStatus] = useState<KYCStatus>({
    level1: { status: 'unverified' },
    level2: { status: 'not_started' }
  });
  
  // Level 1: Email Verification
  const [emailVerificationCode, setEmailVerificationCode] = useState('');
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);
  
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
  const countries = kycService.getCountries();

  // Load KYC status on component mount
  useEffect(() => {
    if (user?.email) {
      loadKYCStatus();
    }
  }, [user?.email]);

  const loadKYCStatus = async () => {
    if (!user?.email) return;
    
    try {
      const status = await kycService.getKYCStatus(user.email);
      setKycStatus(status);
    } catch (error) {
      console.error('Error loading KYC status:', error);
    }
  };

  // Level 1: Send verification email
  const handleSendVerificationEmail = async () => {
    if (!user?.email) return;
    
    setIsSendingCode(true);
    try {
      const result = await kycService.sendVerificationEmail(user.email);
      
      if (result.success) {
        toast({
          title: "Verification Email Sent",
          description: "Please check your email for the verification code.",
        });
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send verification email.",
        variant: "destructive"
      });
    } finally {
      setIsSendingCode(false);
    }
  };

  // Level 1: Verify email code
  const handleVerifyEmailCode = async () => {
    if (!user?.email || !emailVerificationCode) return;
    
    setIsVerifyingCode(true);
    try {
      const result = await kycService.verifyEmail(user.email, emailVerificationCode);
      
      if (result.success) {
        toast({
          title: "Email Verified Successfully",
          description: "Your email has been verified. You can now access trading features.",
        });
        
        // Update user profile
        updateUserProfile({
          kycLevel1: {
            status: 'verified',
            verifiedAt: new Date().toISOString()
          }
        });
        
        // Reload KYC status
        await loadKYCStatus();
        
        // Switch to Level 2 tab
        setActiveTab('level2');
      } else {
        toast({
          title: "Verification Failed",
          description: result.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to verify email code.",
        variant: "destructive"
      });
    } finally {
      setIsVerifyingCode(false);
    }
  };

  // Level 2: Handle file upload
  const handleFileUpload = (field: 'frontFile' | 'backFile' | 'selfieFile', file: File) => {
    setIdentityData(prev => ({ ...prev, [field]: file }));
    
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
    setIdentityData(prev => ({ ...prev, [field]: undefined }));
    setFilePreviews(prev => {
      const newPreviews = { ...prev };
      delete newPreviews[field.replace('File', '') as keyof typeof newPreviews];
      return newPreviews;
    });
  };

  // Level 2: Submit identity verification
  const handleSubmitIdentityVerification = async () => {
    if (!identityData.fullName || !identityData.dateOfBirth || !identityData.country || 
        !identityData.idNumber || !identityData.frontFile || !identityData.selfieFile) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields and upload required documents.",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoading(true);
    try {
      const result = await kycService.submitIdentityVerification(identityData);
      
      if (result.success) {
        toast({
          title: "Identity Verification Submitted",
          description: "Your identity verification has been submitted for review. You will be notified of the status.",
        });
        
        // Reload KYC status
        await loadKYCStatus();
      } else {
        toast({
          title: "Submission Failed",
          description: result.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit identity verification.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToWithdrawal = () => {
    if (fromWithdrawal && withdrawalAmount && withdrawalAddress) {
      navigate(`/withdraw?amount=${withdrawalAmount}&address=${withdrawalAddress}`);
    } else {
      navigate('/withdraw');
    }
  };

  const handleBackToSettings = () => {
    navigate('/settings');
  };

  const getLevel1StatusIcon = () => {
    return kycStatus.level1.status === 'verified' ? (
      <CheckCircle className="w-8 h-8 text-green-500" />
    ) : (
      <AlertCircle className="w-8 h-8 text-yellow-500" />
    );
  };

  const getLevel2StatusIcon = () => {
    switch (kycStatus.level2.status) {
      case 'approved':
        return <CheckCircle className="w-8 h-8 text-green-500" />;
      case 'rejected':
        return <X className="w-8 h-8 text-red-500" />;
      case 'pending':
        return <AlertTriangle className="w-8 h-8 text-yellow-500" />;
      default:
        return <Lock className="w-8 h-8 text-gray-500" />;
    }
  };

  const getLevel1StatusBadge = () => {
    return kycStatus.level1.status === 'verified' ? (
      <Badge className="bg-green-500/10 text-green-400">Verified</Badge>
    ) : (
      <Badge className="bg-yellow-500/10 text-yellow-400">Unverified</Badge>
    );
  };

  const getLevel2StatusBadge = () => {
    switch (kycStatus.level2.status) {
      case 'approved':
        return <Badge className="bg-green-500/10 text-green-400">Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-red-500/10 text-red-400">Rejected</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500/10 text-yellow-400">Pending Review</Badge>;
      default:
        return <Badge className="bg-gray-500/10 text-gray-400">Not Started</Badge>;
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

        {/* KYC Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="border-0">
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
            </CardContent>
          </Card>

          <Card className="border-0">
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
            </CardContent>
          </Card>
        </div>

        {/* KYC Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="level1">Email Verification</TabsTrigger>
            <TabsTrigger value="level2" disabled={kycStatus.level1.status !== 'verified'}>
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
                {kycStatus.level1.status === 'unverified' ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-500/10 rounded-lg">
                      <p className="text-sm text-blue-600">
                        Please verify your email address to unlock trading features.
                      </p>
                    </div>
                    
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
                ) : (
                  <div className="p-4 bg-green-500/10 rounded-lg">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <span className="font-semibold text-green-600">Email Verified</span>
                    </div>
                    <p className="text-sm text-green-600 mt-1">
                      Your email has been verified. You can now access trading features.
                    </p>
                  </div>
                )}
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
                {kycStatus.level2.status === 'not_started' ? (
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
                    {kycStatus.level2.rejectionReason && (
                      <p className="text-sm text-red-600 mt-2">
                        Reason: {kycStatus.level2.rejectionReason}
                      </p>
                    )}
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