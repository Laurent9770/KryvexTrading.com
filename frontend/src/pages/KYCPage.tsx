import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Shield,
  Mail,
  CheckCircle,
  AlertTriangle,
  X,
  Upload,
  Camera,
  Save,
  User,
  Calendar,
  Globe,
  CreditCard,
  ArrowLeft,
  RefreshCw
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import supabaseKYCService from "@/services/supabaseKYCService";

// KYC Interfaces
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
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('level2'); // Default to Identity Verification
  const [kycStatus, setKycStatus] = useState<KYCStatus>({
    level1: { status: 'unverified' },
    level2: { status: 'not_started' }
  });
  const [identityData, setIdentityData] = useState<KYCLevel2Data>({
    fullName: '',
    dateOfBirth: '',
    country: '',
    idType: 'passport',
    idNumber: ''
  });
  const [filePreviews, setFilePreviews] = useState<{
    front?: string;
    back?: string;
    selfie?: string;
  }>({});
  const [isSubmittingKYC, setIsSubmittingKYC] = useState(false);

  // Load KYC status on component mount
  useEffect(() => {
    if (user?.id) {
      loadKYCStatus();
    }
  }, [user?.id]);

  // KYC Functions
  const loadKYCStatus = async () => {
    if (!user?.id) return;

    try {
      const { success, data } = await supabaseKYCService.getUserKYCStatus(user.id);
      if (success && data) {
        const newStatus: KYCStatus = {
          level1: { status: data.isVerified ? 'verified' : 'unverified' },
          level2: { status: data.status as 'not_started' | 'pending' | 'approved' | 'rejected' }
        };
        setKycStatus(newStatus);
      }
    } catch (error) {
      console.error('Error loading KYC status:', error);
    }
  };

  const handleFileUpload = (field: 'frontFile' | 'backFile' | 'selfieFile', file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setFilePreviews(prev => ({
        ...prev,
        [field.replace('File', '')]: e.target?.result as string
      }));
    };
    reader.readAsDataURL(file);

    setIdentityData(prev => ({
      ...prev,
      [field]: file
    }));
  };

  const removeFile = (field: 'frontFile' | 'backFile' | 'selfieFile') => {
    setFilePreviews(prev => ({
      ...prev,
      [field.replace('File', '')]: undefined
    }));

    setIdentityData(prev => ({
      ...prev,
      [field]: undefined
    }));
  };

  const handleSubmitIdentityVerification = async () => {
    if (!user?.id) return;

    // Validation
    if (!identityData.fullName || !identityData.dateOfBirth || !identityData.country || 
        !identityData.idNumber || !identityData.frontFile || !identityData.selfieFile) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields and upload required documents.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmittingKYC(true);

    try {
      const { success, data, error } = await supabaseKYCService.createKYCSubmission({
        fullName: identityData.fullName,
        dateOfBirth: identityData.dateOfBirth,
        country: identityData.country,
        idType: identityData.idType,
        idNumber: identityData.idNumber,
        frontFile: identityData.frontFile,
        backFile: identityData.backFile,
        selfieFile: identityData.selfieFile
      });

      if (success) {
        toast({
          title: "KYC Submitted Successfully",
          description: "Your identity verification has been submitted for review.",
        });
        
        // Reset form
        setIdentityData({
          fullName: '',
          dateOfBirth: '',
          country: '',
          idType: 'passport',
          idNumber: ''
        });
        setFilePreviews({});
        
        // Reload KYC status
        await loadKYCStatus();
      } else {
        toast({
          title: "KYC Submission Failed",
          description: error || "Failed to submit KYC verification. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error submitting KYC:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmittingKYC(false);
    }
  };

  const handleBack = () => {
    navigate('/dashboard');
  };

  const getLevel1StatusIcon = () => {
    switch (kycStatus.level1.status) {
      case 'verified':
        return <CheckCircle className="w-6 h-6 text-green-500" />;
      case 'pending':
        return <AlertTriangle className="w-6 h-6 text-yellow-500" />;
      default:
        return <X className="w-6 h-6 text-red-500" />;
    }
  };

  const getLevel2StatusIcon = () => {
    switch (kycStatus.level2.status) {
      case 'approved':
        return <CheckCircle className="w-6 h-6 text-green-500" />;
      case 'pending':
        return <AlertTriangle className="w-6 h-6 text-yellow-500" />;
      case 'rejected':
        return <X className="w-6 h-6 text-red-500" />;
      default:
        return <User className="w-6 h-6 text-gray-500" />;
    }
  };

  const getLevel1StatusBadge = () => {
    switch (kycStatus.level1.status) {
      case 'verified':
        return <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Verified</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">Pending</Badge>;
      default:
        return <Badge className="bg-gray-500/10 text-gray-500 border-gray-500/20">Unverified</Badge>;
    }
  };

  const getLevel2StatusBadge = () => {
    switch (kycStatus.level2.status) {
      case 'approved':
        return <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Approved</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">Pending</Badge>;
      case 'rejected':
        return <Badge className="bg-red-500/10 text-red-500 border-red-500/20">Rejected</Badge>;
      default:
        return <Badge className="bg-gray-500/10 text-gray-500 border-gray-500/20">Not Started</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
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
                            <SelectItem value="US">United States</SelectItem>
                            <SelectItem value="CA">Canada</SelectItem>
                            <SelectItem value="GB">United Kingdom</SelectItem>
                            <SelectItem value="AU">Australia</SelectItem>
                            <SelectItem value="DE">Germany</SelectItem>
                            <SelectItem value="FR">France</SelectItem>
                            <SelectItem value="JP">Japan</SelectItem>
                            <SelectItem value="SG">Singapore</SelectItem>
                            <SelectItem value="HK">Hong Kong</SelectItem>
                            <SelectItem value="CH">Switzerland</SelectItem>
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
                      disabled={isSubmittingKYC}
                      className="w-full"
                    >
                      {isSubmittingKYC ? (
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
