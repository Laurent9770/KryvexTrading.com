import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import kycService, { KYCUser, KYCSubmission } from '@/services/kycService';
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
  
  const [kycUser, setKycUser] = useState<KYCUser | null>(null);
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

    // Initialize KYC user if not exists
    let currentUser = kycService.getUser(user.id);
    if (!currentUser) {
      currentUser = kycService.createUser(user.id, user.email);
    }
    setKycUser(currentUser);

    // Listen for KYC updates
    kycService.on('user_updated', (updatedUser: KYCUser) => {
      if (updatedUser.id === user.id) {
        setKycUser(updatedUser);
      }
    });

    kycService.on('level_verified', (data: any) => {
      if (data.userId === user.id) {
        toast({
          title: `Level ${data.level} Verified!`,
          description: `You have successfully completed Level ${data.level} verification.`,
        });
      }
    });

    kycService.on('submission_reviewed', (data: any) => {
      if (data.user.id === user.id) {
        const { submission, user: updatedUser } = data;
        setKycUser(updatedUser);
        
        if (submission.status === 'approved') {
          toast({
            title: 'Verification Approved!',
            description: `Your Level ${submission.level} verification has been approved.`,
          });
        } else {
          toast({
            title: 'Verification Rejected',
            description: submission.rejectionReason || 'Your verification was rejected. Please try again.',
            variant: 'destructive'
          });
        }
      }
    });
  }, [user, isAuthenticated, navigate, toast]);

  const handleLevel1Verification = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const success = await kycService.verifyEmail(user.id);
      if (success) {
        toast({
          title: 'Email Verification Complete',
          description: 'Your email has been verified successfully.',
        });
      } else {
        toast({
          title: 'Verification Failed',
          description: 'Email verification failed. Please try again.',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An error occurred during verification.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLevel2Submission = async () => {
    if (!user || !level2Data.fullName || !level2Data.dateOfBirth || !level2Data.nationalId || !level2Data.idDocument) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all required fields and upload your ID document.',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);
    try {
      await kycService.submitIdentityVerification(user.id, level2Data);
      setShowLevel2Dialog(false);
      setLevel2Data({
        fullName: '',
        dateOfBirth: '',
        nationalId: '',
        idDocument: null,
        selfie: null
      });
      toast({
        title: 'Identity Verification Submitted',
        description: 'Your documents have been submitted for review. You will be notified once verified.',
      });
    } catch (error) {
      toast({
        title: 'Submission Failed',
        description: 'Failed to submit verification. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLevel3Submission = async () => {
    if (!user || !level3Data.address || !level3Data.city || !level3Data.postalCode || !level3Data.country || !level3Data.addressProof) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all required fields and upload your address proof.',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);
    try {
      await kycService.submitAddressVerification(user.id, level3Data);
      setShowLevel3Dialog(false);
      setLevel3Data({
        address: '',
        city: '',
        postalCode: '',
        country: '',
        addressProof: null
      });
      toast({
        title: 'Address Verification Submitted',
        description: 'Your address proof has been submitted for review. You will be notified once verified.',
      });
    } catch (error) {
      toast({
        title: 'Submission Failed',
        description: 'Failed to submit verification. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
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
    if (!kycUser) return { status: 'not_started', icon: <Lock className="w-8 h-8 text-gray-500" />, badge: <Badge variant="secondary">Not Started</Badge> };
    
    const submission = kycUser.submissions.find(s => s.level === level);
    const currentLevel = kycUser.kycLevel.level;
    
    if (level === 1) {
      if (currentLevel >= 1) {
        return { 
          status: 'completed', 
          icon: <CheckCircle className="w-8 h-8 text-green-500" />, 
          badge: <Badge className="bg-green-500/10 text-green-400">Completed</Badge> 
        };
      } else {
        return { 
          status: 'pending', 
          icon: <Mail className="w-8 h-8 text-blue-500" />, 
          badge: <Badge className="bg-blue-500/10 text-blue-400">Pending</Badge> 
        };
      }
    }
    
    if (level === 2) {
      if (currentLevel >= 2) {
        return { 
          status: 'completed', 
          icon: <CheckCircle className="w-8 h-8 text-green-500" />, 
          badge: <Badge className="bg-green-500/10 text-green-400">Completed</Badge> 
        };
      } else if (currentLevel >= 1) {
        if (submission?.status === 'pending') {
          return { 
            status: 'pending_review', 
            icon: <Clock className="w-8 h-8 text-yellow-500" />, 
            badge: <Badge className="bg-yellow-500/10 text-yellow-400">Under Review</Badge> 
          };
        } else if (submission?.status === 'rejected') {
          return { 
            status: 'rejected', 
            icon: <X className="w-8 h-8 text-red-500" />, 
            badge: <Badge className="bg-red-500/10 text-red-400">Rejected</Badge> 
          };
        } else {
          return { 
            status: 'available', 
            icon: <User className="w-8 h-8 text-blue-500" />, 
            badge: <Badge className="bg-blue-500/10 text-blue-400">Available</Badge> 
          };
        }
      } else {
        return { 
          status: 'locked', 
          icon: <Lock className="w-8 h-8 text-gray-500" />, 
          badge: <Badge variant="secondary">Locked</Badge> 
        };
      }
    }
    
    if (level === 3) {
      if (currentLevel >= 3) {
        return { 
          status: 'completed', 
          icon: <CheckCircle className="w-8 h-8 text-green-500" />, 
          badge: <Badge className="bg-green-500/10 text-green-400">Completed</Badge> 
        };
      } else if (currentLevel >= 2) {
        if (submission?.status === 'pending') {
          return { 
            status: 'pending_review', 
            icon: <Clock className="w-8 h-8 text-yellow-500" />, 
            badge: <Badge className="bg-yellow-500/10 text-yellow-400">Under Review</Badge> 
          };
        } else if (submission?.status === 'rejected') {
          return { 
            status: 'rejected', 
            icon: <X className="w-8 h-8 text-red-500" />, 
            badge: <Badge className="bg-red-500/10 text-red-400">Rejected</Badge> 
          };
        } else {
          return { 
            status: 'available', 
            icon: <MapPin className="w-8 h-8 text-blue-500" />, 
            badge: <Badge className="bg-blue-500/10 text-blue-400">Available</Badge> 
          };
        }
      } else {
        return { 
          status: 'locked', 
          icon: <Lock className="w-8 h-8 text-gray-500" />, 
          badge: <Badge variant="secondary">Locked</Badge> 
        };
      }
    }
    
    return { status: 'not_started', icon: <Lock className="w-8 h-8 text-gray-500" />, badge: <Badge variant="secondary">Not Started</Badge> };
  };

  const getProgress = () => {
    if (!kycUser) return 0;
    return (kycUser.kycLevel.level / 3) * 100;
  };

  const getRestrictions = () => {
    if (!kycUser) return [];
    
    const restrictions = [];
    if (!kycUser.restrictions.canTrade) {
      restrictions.push('Trading is restricted until Level 1 verification');
    }
    if (!kycUser.restrictions.canDeposit) {
      restrictions.push('Deposits are restricted until Level 2 verification');
    }
    if (!kycUser.restrictions.canWithdraw) {
      restrictions.push('Withdrawals are restricted until Level 2 verification');
    }
    if (!kycUser.restrictions.canAccessFullPlatform) {
      restrictions.push('Full platform access requires Level 3 verification');
    }
    
    return restrictions;
  };

  if (!kycUser) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading KYC verification...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-20">
      <div className="kucoin-container py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">KYC Verification</h1>
          <p className="text-muted-foreground">Complete your verification to unlock full platform access</p>
        </div>

        {/* Progress Bar */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold">Verification Progress</h3>
                <p className="text-sm text-muted-foreground">
                  Level {kycUser.kycLevel.level} of 3 completed
                </p>
              </div>
              <Badge variant={kycUser.kycLevel.completed ? "default" : "secondary"}>
                {kycUser.kycLevel.completed ? "Fully Verified" : "In Progress"}
              </Badge>
            </div>
            <Progress value={getProgress()} className="h-3" />
          </CardContent>
        </Card>

        {/* KYC Levels */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Level 1 */}
          <Card className="relative">
            <CardContent className="pt-6 text-center">
              {getLevelStatus(1).icon}
              <h3 className="font-semibold mt-4 mb-2">Level 1</h3>
              <p className="text-sm text-muted-foreground mb-4">Email Verification</p>
              {getLevelStatus(1).badge}
              
              {getLevelStatus(1).status === 'pending' && (
                <Button 
                  onClick={handleLevel1Verification}
                  disabled={isLoading}
                  className="mt-4 w-full"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  {isLoading ? 'Verifying...' : 'Verify Email'}
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Level 2 */}
          <Card className="relative">
            <CardContent className="pt-6 text-center">
              {getLevelStatus(2).icon}
              <h3 className="font-semibold mt-4 mb-2">Level 2</h3>
              <p className="text-sm text-muted-foreground mb-4">Identity Verification</p>
              {getLevelStatus(2).badge}
              
              {getLevelStatus(2).status === 'available' && (
                <Button 
                  onClick={() => setShowLevel2Dialog(true)}
                  className="mt-4 w-full"
                >
                  <User className="w-4 h-4 mr-2" />
                  Verify Identity
                </Button>
              )}
              
              {getLevelStatus(2).status === 'rejected' && (
                <Button 
                  onClick={() => setShowLevel2Dialog(true)}
                  variant="outline"
                  className="mt-4 w-full"
                >
                  <ArrowRight className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Level 3 */}
          <Card className="relative">
            <CardContent className="pt-6 text-center">
              {getLevelStatus(3).icon}
              <h3 className="font-semibold mt-4 mb-2">Level 3</h3>
              <p className="text-sm text-muted-foreground mb-4">Address Verification</p>
              {getLevelStatus(3).badge}
              
              {getLevelStatus(3).status === 'available' && (
                <Button 
                  onClick={() => setShowLevel3Dialog(true)}
                  className="mt-4 w-full"
                >
                  <MapPin className="w-4 h-4 mr-2" />
                  Verify Address
                </Button>
              )}
              
              {getLevelStatus(3).status === 'rejected' && (
                <Button 
                  onClick={() => setShowLevel3Dialog(true)}
                  variant="outline"
                  className="mt-4 w-full"
                >
                  <ArrowRight className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Current Restrictions */}
        {getRestrictions().length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Current Restrictions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {getRestrictions().map((restriction, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <AlertTriangle className="w-4 h-4 text-yellow-500" />
                    {restriction}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Level 2 Dialog */}
        <Dialog open={showLevel2Dialog} onOpenChange={setShowLevel2Dialog}>
          <DialogContent className="sm:max-w-md">
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
                <Label htmlFor="selfie">Selfie (Optional)</Label>
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
                <Button 
                  onClick={handleLevel2Submission}
                  disabled={isLoading}
                  className="flex-1"
                >
                  {isLoading ? 'Submitting...' : 'Submit Verification'}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowLevel2Dialog(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Level 3 Dialog */}
        <Dialog open={showLevel3Dialog} onOpenChange={setShowLevel3Dialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Address Verification</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="address">Street Address</Label>
                <Input
                  id="address"
                  value={level3Data.address}
                  onChange={(e) => setLevel3Data(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="Enter your street address"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={level3Data.city}
                    onChange={(e) => setLevel3Data(prev => ({ ...prev, city: e.target.value }))}
                    placeholder="City"
                  />
                </div>
                
                <div>
                  <Label htmlFor="postalCode">Postal Code</Label>
                  <Input
                    id="postalCode"
                    value={level3Data.postalCode}
                    onChange={(e) => setLevel3Data(prev => ({ ...prev, postalCode: e.target.value }))}
                    placeholder="Postal Code"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="country">Country</Label>
                <Select value={level3Data.country} onValueChange={(value) => setLevel3Data(prev => ({ ...prev, country: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="us">United States</SelectItem>
                    <SelectItem value="ca">Canada</SelectItem>
                    <SelectItem value="uk">United Kingdom</SelectItem>
                    <SelectItem value="de">Germany</SelectItem>
                    <SelectItem value="fr">France</SelectItem>
                    <SelectItem value="au">Australia</SelectItem>
                    <SelectItem value="jp">Japan</SelectItem>
                    <SelectItem value="sg">Singapore</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="addressProof">Proof of Address</Label>
                <Input
                  id="addressProof"
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload('addressProof', file);
                  }}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Upload a utility bill, bank statement, or government letter (dated within last 3 months)
                </p>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  onClick={handleLevel3Submission}
                  disabled={isLoading}
                  className="flex-1"
                >
                  {isLoading ? 'Submitting...' : 'Submit Verification'}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowLevel3Dialog(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default KYCVerificationPage; 