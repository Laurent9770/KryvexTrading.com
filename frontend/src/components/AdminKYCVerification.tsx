import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import kycService from '@/services/kycService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  Clock, 
  CheckCircle, 
  X, 
  Eye, 
  Download,
  AlertTriangle,
  Shield,
  FileText,
  User,
  MapPin,
  Mail
} from 'lucide-react';

// Define types locally since they're not exported from kycService
interface KYCUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  kycLevel: {
    level: number;
    status: string;
    verifiedAt?: string;
  };
  submissions: any[];
  restrictions?: {
    canTrade: boolean;
    canDeposit: boolean;
    canWithdraw: boolean;
    canAccessFullPlatform: boolean;
    tradeLimit?: number;
  };
}

interface KYCSubmission {
  id: string;
  userId: string;
  level: number;
  status: string;
  submittedAt: string;
  reviewedAt?: string;
  rejectionReason?: string;
  documents?: any;
  personalInfo?: {
    fullName: string;
    dateOfBirth: string;
    nationalId: string;
    address?: string;
    city?: string;
    country: string;
  };
}

const AdminKYCVerification = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState<KYCUser[]>([]);
  const [submissions, setSubmissions] = useState<KYCSubmission[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<KYCSubmission | null>(null);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [reviewStatus, setReviewStatus] = useState<'approved' | 'rejected'>('approved');
  const [rejectionReason, setRejectionReason] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [filterLevel, setFilterLevel] = useState<'all' | 1 | 2 | 3>('all');

  useEffect(() => {
    loadData();
    
    // Listen for KYC updates
    kycService.on('user_created', loadData);
    kycService.on('user_updated', loadData);
    kycService.on('submission_created', loadData);
    kycService.on('submission_reviewed', loadData);
  }, []);

  const loadData = () => {
    console.log('=== DEBUG: AdminKYCVerification loading data ===');
    
    const allUsers = kycService.getAllUsers();
    console.log('KYC Users loaded:', allUsers.length);
    console.log('KYC Users data:', allUsers);
    
    const allSubmissions = kycService.getSubmissionsByStatus('pending');
    console.log('KYC Submissions loaded:', allSubmissions.length);
    console.log('KYC Submissions data:', allSubmissions);
    
    setUsers(allUsers);
    setSubmissions(allSubmissions);
    
    console.log('=== DEBUG: AdminKYCVerification data loading complete ===');
  };

  const handleReviewSubmission = async () => {
    if (!selectedSubmission) return;

    try {
      const success = await kycService.reviewSubmission(
        selectedSubmission.id,
        reviewStatus,
        reviewStatus === 'rejected' ? rejectionReason : undefined
      );

      if (success) {
        toast({
          title: `Submission ${reviewStatus === 'approved' ? 'Approved' : 'Rejected'}`,
          description: `Level ${selectedSubmission.level} verification has been ${reviewStatus}.`,
        });
        setShowReviewDialog(false);
        setSelectedSubmission(null);
        setRejectionReason('');
        loadData();
      } else {
        toast({
          title: 'Review Failed',
          description: 'Failed to review submission. Please try again.',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An error occurred while reviewing the submission.',
        variant: 'destructive'
      });
    }
  };

  const getFilteredSubmissions = () => {
    let filtered = submissions;

    if (filterStatus !== 'all') {
      filtered = filtered.filter(sub => sub.status === filterStatus);
    }

    if (filterLevel !== 'all') {
      filtered = filtered.filter(sub => sub.level === filterLevel);
    }

    return filtered.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
  };

  const getFilteredUsers = () => {
    let filtered = users;

    if (filterStatus !== 'all') {
      filtered = filtered.filter(user => {
        if (filterStatus === 'pending') {
          return user.submissions.some(sub => sub.status === 'pending');
        } else if (filterStatus === 'approved') {
          return user.kycLevel.status === 'verified';
        } else if (filterStatus === 'rejected') {
          return user.submissions.some(sub => sub.status === 'rejected');
        }
        return true;
      });
    }

    if (filterLevel !== 'all') {
      filtered = filtered.filter(user => user.kycLevel.level === filterLevel);
    }

    return filtered.sort((a, b) => new Date(b.kycLevel.verifiedAt || '0').getTime() - new Date(a.kycLevel.verifiedAt || '0').getTime());
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-500/10 text-yellow-400">Pending</Badge>;
      case 'approved':
        return <Badge className="bg-green-500/10 text-green-400">Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-red-500/10 text-red-400">Rejected</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const getLevelIcon = (level: number) => {
    switch (level) {
      case 1:
        return <Mail className="w-4 h-4" />;
      case 2:
        return <User className="w-4 h-4" />;
      case 3:
        return <MapPin className="w-4 h-4" />;
      default:
        return <Shield className="w-4 h-4" />;
    }
  };

  const getStats = () => {
    const totalUsers = users.length;
    const pendingSubmissions = submissions.filter(sub => sub.status === 'pending').length;
    const level1Users = users.filter(user => user.kycLevel.level >= 1).length;
    const level2Users = users.filter(user => user.kycLevel.level >= 2).length;
    const level3Users = users.filter(user => user.kycLevel.level >= 3).length;

    return {
      totalUsers,
      pendingSubmissions,
      level1Users,
      level2Users,
      level3Users
    };
  };

  const stats = getStats();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            KYC Verification Management
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Review and manage KYC submissions. Approve or reject based on document verification.
          </p>
        </CardHeader>
        <CardContent>
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-foreground">{stats.totalUsers}</div>
              <div className="text-sm text-muted-foreground">Total Users</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-yellow-500">{stats.pendingSubmissions}</div>
              <div className="text-sm text-muted-foreground">Pending Reviews</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-blue-500">{stats.level1Users}</div>
              <div className="text-sm text-muted-foreground">Level 1 Verified</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-green-500">{stats.level2Users}</div>
              <div className="text-sm text-muted-foreground">Level 2 Verified</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-purple-500">{stats.level3Users}</div>
              <div className="text-sm text-muted-foreground">Level 3 Verified</div>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-4 mb-6">
            <div>
              <Label htmlFor="status-filter">Status</Label>
              <Select value={filterStatus} onValueChange={(value: any) => setFilterStatus(value)}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="level-filter">Level</Label>
              <Select value={filterLevel.toString()} onValueChange={(value: any) => setFilterLevel(value === 'all' ? 'all' : parseInt(value) as 1 | 2 | 3)}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="1">Level 1</SelectItem>
                  <SelectItem value="2">Level 2</SelectItem>
                  <SelectItem value="3">Level 3</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Tabs defaultValue="submissions" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="submissions">Pending Submissions</TabsTrigger>
              <TabsTrigger value="users">All Users</TabsTrigger>
            </TabsList>

            <TabsContent value="submissions" className="space-y-4">
              {getFilteredSubmissions().length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No pending submissions found.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {getFilteredSubmissions().map((submission) => {
                    const user = users.find(u => u.id === submission.userId);
                    return (
                      <Card key={submission.id}>
                        <CardContent className="pt-6">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              {getLevelIcon(submission.level)}
                              <div>
                                <h3 className="font-semibold">
                                  Level {submission.level} Verification - {user?.email}
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                  Submitted: {new Date(submission.submittedAt).toLocaleDateString()}
                                </p>
                                {submission.personalInfo && (
                                  <p className="text-sm text-muted-foreground">
                                    {submission.personalInfo.fullName} • {submission.personalInfo.nationalId}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {getStatusBadge(submission.status)}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedSubmission(submission);
                                  setShowReviewDialog(true);
                                }}
                              >
                                <Eye className="w-4 h-4 mr-2" />
                                Review
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            <TabsContent value="users" className="space-y-4">
              {getFilteredUsers().length === 0 ? (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No users found.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {getFilteredUsers().map((user) => (
                    <Card key={user.id}>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold">{user.email}</h3>
                            <p className="text-sm text-muted-foreground">
                              Level {user.kycLevel.level} • {user.kycLevel.status}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Submissions: {user.submissions.length}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {getStatusBadge(user.kycLevel.status)}
                            <div className="text-sm text-muted-foreground">
                              Trade Limit: ${user.restrictions?.tradeLimit?.toLocaleString() || '0'}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Review Dialog */}
      <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Review Submission</DialogTitle>
          </DialogHeader>
          {selectedSubmission && (
            <div className="space-y-4">
              <div>
                <Label>Submission Details</Label>
                <div className="mt-2 p-3 border rounded-lg">
                  <p><strong>Level:</strong> {selectedSubmission.level}</p>
                  <p><strong>User:</strong> {users.find(u => u.id === selectedSubmission.userId)?.email}</p>
                  <p><strong>Submitted:</strong> {new Date(selectedSubmission.submittedAt).toLocaleString()}</p>
                  {selectedSubmission.personalInfo && (
                    <>
                      <p><strong>Name:</strong> {selectedSubmission.personalInfo.fullName}</p>
                      <p><strong>Date of Birth:</strong> {selectedSubmission.personalInfo.dateOfBirth}</p>
                      <p><strong>National ID:</strong> {selectedSubmission.personalInfo.nationalId}</p>
                      {selectedSubmission.level === 3 && (
                        <>
                          <p><strong>Address:</strong> {selectedSubmission.personalInfo.address}</p>
                          <p><strong>City:</strong> {selectedSubmission.personalInfo.city}</p>
                          <p><strong>Country:</strong> {selectedSubmission.personalInfo.country}</p>
                        </>
                      )}
                    </>
                  )}
                </div>
              </div>

              <div>
                <Label>Documents</Label>
                <div className="mt-2 space-y-2">
                  {selectedSubmission.documents.idDocument && (
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      <span>ID Document: {selectedSubmission.documents.idDocument.name}</span>
                      <Button variant="outline" size="sm">
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                  {selectedSubmission.documents.selfie && (
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      <span>Selfie: {selectedSubmission.documents.selfie.name}</span>
                      <Button variant="outline" size="sm">
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                  {selectedSubmission.documents.addressProof && (
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      <span>Address Proof: {selectedSubmission.documents.addressProof.name}</span>
                      <Button variant="outline" size="sm">
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <Label>Review Decision</Label>
                <div className="mt-2 space-y-4">
                  <div className="flex gap-4">
                    <Button
                      variant={reviewStatus === 'approved' ? 'default' : 'outline'}
                      onClick={() => setReviewStatus('approved')}
                      className="flex-1"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Approve
                    </Button>
                    <Button
                      variant={reviewStatus === 'rejected' ? 'destructive' : 'outline'}
                      onClick={() => setReviewStatus('rejected')}
                      className="flex-1"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Reject
                    </Button>
                  </div>

                  {reviewStatus === 'rejected' && (
                    <div>
                      <Label htmlFor="rejection-reason">Rejection Reason</Label>
                      <Textarea
                        id="rejection-reason"
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        placeholder="Provide a reason for rejection..."
                        className="mt-2"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <Button 
                  onClick={handleReviewSubmission}
                  className="flex-1"
                  variant={reviewStatus === 'approved' ? 'default' : 'destructive'}
                >
                  {reviewStatus === 'approved' ? 'Approve' : 'Reject'} Submission
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowReviewDialog(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminKYCVerification; 