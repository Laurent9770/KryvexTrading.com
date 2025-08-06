import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import supabaseKYCService, { KYCStatus } from '@/services/supabaseKYCService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  CheckCircle, 
  AlertTriangle, 
  X, 
  Mail, 
  User, 
  MapPin, 
  Upload, 
  Lock, 
  Shield,
  ArrowRight,
  Clock,
  FileText
} from 'lucide-react';

const KYCVerificationPage = () => {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [kycStatus, setKycStatus] = useState<KYCStatus>({
    level1: { status: 'unverified' },
    level2: { status: 'not_started' }
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showLevel2Dialog, setShowLevel2Dialog] = useState(false);
  const [showLevel3Dialog, setShowLevel3Dialog] = useState(false);
  const [level2Data, setLevel2Data] = useState({
    fullName: '',
    dateOfBirth: '',
    nationalId: '',
    idDocument: null as File | null,
    selfie: null as File | null
  });
  const [level3Data, setLevel3Data] = useState({
    address: '',
    city: '',
    postalCode: '',
    country: '',
    addressProof: null as File | null
  });

  useEffect(() => {
    if (!isAuthenticated || !user) {
      navigate('/auth');
      return;
    }

    // Load KYC status
    loadKYCStatus();

    // Create event handlers
    const handleUserUpdated = () => {
      loadKYCStatus();
    };

    const handleLevelVerified = (data: any) => {
      if (data.userId === user.id) {
        toast({
          title: `Level ${data.level} Verified!`,
          description: `You have successfully completed Level ${data.level} verification.`,
        });
        loadKYCStatus();
      }
    };

    const handleSubmissionReviewed = (data: any) => {
      if (data.user.id === user.id) {
        loadKYCStatus();
        
        if (data.submission.status === 'approved') {
          toast({
            title: 'Verification Approved!',
            description: `Your Level ${data.submission.level} verification has been approved.`,
          });
        } else {
          toast({
            title: 'Verification Rejected',
            description: data.submission.rejectionReason || 'Your verification was rejected. Please try again.',
            variant: 'destructive'
          });
        }
      }
    };

    // Listen for KYC updates
    supabaseKYCService.on('user_updated', handleUserUpdated);
    supabaseKYCService.on('level_verified', handleLevelVerified);
    supabaseKYCService.on('submission_reviewed', handleSubmissionReviewed);

    return () => {
              supabaseKYCService.off('user_updated', handleUserUpdated);
        supabaseKYCService.off('level_verified', handleLevelVerified);
        supabaseKYCService.off('submission_reviewed', handleSubmissionReviewed);
    };
  }, [user?.id, isAuthenticated, navigate, toast]);

  const loadKYCStatus = useCallback(async () => {
    if (!user?.email) return;
    
    try {
      const status = await kycService.getKYCStatus(user.email);
      setKycStatus(status);
    } catch (error) {
      console.error('Error loading KYC status:', error);
    }
  }, [user?.email]);

  const handleLevel1Verification = async () => {
    if (!user?.email) return;
    
    setIsLoading(true);
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
      setIsLoading(false);
    }
  };

  const handleLevel2Submission = async () => {
    if (!user?.email) return;
    
    setIsLoading(true);
    try {
      // Convert level2Data to the format expected by kycService
      const identityData = {
        fullName: level2Data.fullName,
        dateOfBirth: level2Data.dateOfBirth,
        country: level3Data.country, // Use country from level3Data
        idType: 'national_id' as const,
        idNumber: level2Data.nationalId,
        frontFile: level2Data.idDocument,
        backFile: undefined,
        selfieFile: level2Data.selfie
      };

      const result = await kycService.submitIdentityVerification(identityData);
      
      if (result.success) {
        toast({
          title: "Identity Verification Submitted",
          description: "Your documents have been submitted for review.",
        });
        setShowLevel2Dialog(false);
        await loadKYCStatus();
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
        description: "Failed to submit identity verification.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLevel3Submission = async () => {
    // Level 3 is not implemented in the current kycService
    toast({
      title: "Not Available",
      description: "Level 3 verification is not yet implemented.",
      variant: "destructive"
    });
  };

  const handleFileUpload = (field: string, file: File) => {
    if (field === 'idDocument') {
      setLevel2Data(prev => ({ ...prev, idDocument: file }));
    } else if (field === 'selfie') {
      setLevel2Data(prev => ({ ...prev, selfie: file }));
    } else if (field === 'addressProof') {
      setLevel3Data(prev => ({ ...prev, addressProof: file }));
    }
  };

  const getLevelStatus = (level: number) => {
    if (level === 1) {
      const status = kycStatus.level1.status;
      if (status === 'verified') {
        return { 
          status: 'completed', 
          icon: <CheckCircle className="w-8 h-8 text-green-500" />, 
          badge: <Badge variant="default">Verified</Badge> 
        };
      } else {
        return { 
          status: 'not_started', 
          icon: <Lock className="w-8 h-8 text-gray-500" />, 
          badge: <Badge variant="secondary">Not Started</Badge> 
        };
      }
    } else if (level === 2) {
      const status = kycStatus.level2.status;
      if (status === 'approved') {
        return { 
          status: 'completed', 
          icon: <CheckCircle className="w-8 h-8 text-green-500" />, 
          badge: <Badge variant="default">Approved</Badge> 
        };
      } else if (status === 'pending') {
        return { 
          status: 'pending', 
          icon: <Clock className="w-8 h-8 text-yellow-500" />, 
          badge: <Badge variant="secondary">Pending</Badge> 
        };
      } else if (status === 'rejected') {
        return { 
          status: 'rejected', 
          icon: <X className="w-8 h-8 text-red-500" />, 
          badge: <Badge variant="destructive">Rejected</Badge> 
        };
      } else {
        return { 
          status: 'not_started', 
          icon: <Lock className="w-8 h-8 text-gray-500" />, 
          badge: <Badge variant="secondary">Not Started</Badge> 
        };
      }
    }
    
    return { 
      status: 'not_started', 
      icon: <Lock className="w-8 h-8 text-gray-500" />, 
      badge: <Badge variant="secondary">Not Started</Badge> 
    };
  };

  const getProgress = () => {
    let completed = 0;
    if (kycStatus.level1.status === 'verified') completed++;
    if (kycStatus.level2.status === 'approved') completed++;
    return (completed / 2) * 100; // Only 2 levels implemented
  };

  const getRestrictions = () => {
    const restrictions = [];
    
    if (kycStatus.level1.status !== 'verified') {
      restrictions.push('Email verification required for trading');
    }
    
    if (kycStatus.level2.status !== 'approved') {
      restrictions.push('Identity verification required for withdrawals');
    }
    
    return restrictions;
  };

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Please log in to access KYC verification.</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Loading KYC verification...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">KYC Verification</h1>
        <p className="text-muted-foreground">
          Complete your verification to unlock all platform features
        </p>
      </div>

      {/* Progress Overview */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Verification Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Overall Progress</span>
              <span className="text-sm text-muted-foreground">
                {Math.round(getProgress())}% Complete
              </span>
            </div>
            <Progress value={getProgress()} className="w-full" />
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle className="w-4 h-4" />
              {Math.round(getProgress())}% of verification levels completed
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KYC Levels */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Level 1: Email Verification */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Level 1: Email Verification
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              {getLevelStatus(1).icon}
              {getLevelStatus(1).badge}
            </div>
            <p className="text-sm text-muted-foreground">
              Verify your email address to access basic trading features
            </p>
            {kycStatus.level1.status !== 'verified' && (
              <Button onClick={handleLevel1Verification} disabled={isLoading}>
                {isLoading ? 'Sending...' : 'Send Verification Email'}
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Level 2: Identity Verification */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Level 2: Identity Verification
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              {getLevelStatus(2).icon}
              {getLevelStatus(2).badge}
            </div>
            <p className="text-sm text-muted-foreground">
              Submit identity documents to enable withdrawals
            </p>
            {kycStatus.level1.status === 'verified' && kycStatus.level2.status === 'not_started' && (
              <Button onClick={() => setShowLevel2Dialog(true)}>
                Submit Documents
              </Button>
            )}
            {kycStatus.level2.status === 'rejected' && (
              <Button onClick={() => setShowLevel2Dialog(true)} variant="outline">
                Resubmit Documents
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Restrictions */}
      {getRestrictions().length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-500" />
              Current Restrictions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {getRestrictions().map((restriction, index) => (
                <li key={index} className="flex items-center gap-2 text-sm">
                  <X className="w-4 h-4 text-red-500" />
                  {restriction}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Level 2 Dialog */}
      <Dialog open={showLevel2Dialog} onOpenChange={setShowLevel2Dialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Identity Verification</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                value={level2Data.fullName}
                onChange={(e) => setLevel2Data(prev => ({ ...prev, fullName: e.target.value }))}
                placeholder="Enter your full name"
              />
            </div>
            <div>
              <Label htmlFor="dateOfBirth">Date of Birth</Label>
              <Input
                id="dateOfBirth"
                type="date"
                value={level2Data.dateOfBirth}
                onChange={(e) => setLevel2Data(prev => ({ ...prev, dateOfBirth: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="nationalId">National ID Number</Label>
              <Input
                id="nationalId"
                value={level2Data.nationalId}
                onChange={(e) => setLevel2Data(prev => ({ ...prev, nationalId: e.target.value }))}
                placeholder="Enter your national ID number"
              />
            </div>
            <div>
              <Label htmlFor="country">Country</Label>
              <Select value={level3Data.country} onValueChange={(value) => setLevel3Data(prev => ({ ...prev, country: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select your country" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="US">United States</SelectItem>
                  <SelectItem value="UK">United Kingdom</SelectItem>
                  <SelectItem value="CA">Canada</SelectItem>
                  <SelectItem value="AU">Australia</SelectItem>
                  <SelectItem value="DE">Germany</SelectItem>
                  <SelectItem value="FR">France</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="idDocument">ID Document</Label>
              <Input
                id="idDocument"
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload('idDocument', file);
                }}
              />
            </div>
            <div>
              <Label htmlFor="selfie">Selfie with ID</Label>
              <Input
                id="selfie"
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload('selfie', file);
                }}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleLevel2Submission} disabled={isLoading}>
                {isLoading ? 'Submitting...' : 'Submit'}
              </Button>
              <Button variant="outline" onClick={() => setShowLevel2Dialog(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default KYCVerificationPage; 