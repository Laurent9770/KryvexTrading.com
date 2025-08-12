import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import supabaseKYCService from '@/services/supabaseKYCService';
import supabaseAdminDataService, { AdminKYCUser } from '@/services/supabaseAdminDataService';
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
  const [users, setUsers] = useState<AdminKYCUser[]>([]);
  const [submissions, setSubmissions] = useState<KYCSubmission[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<KYCSubmission | null>(null);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [reviewStatus, setReviewStatus] = useState<'approved' | 'rejected'>('approved');
  const [rejectionReason, setRejectionReason] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [filterLevel, setFilterLevel] = useState<'all' | 1 | 2 | 3>('all');

  const loadData = useCallback(async () => {
    console.log('=== DEBUG: AdminKYCVerification loading data ===');
    
    try {
      // Load KYC users from admin data service
      const kycUsers = await supabaseAdminDataService.getKYCUsers();
      setUsers(kycUsers);
      
      // For now, create mock submissions from users with pending KYC
      const mockSubmissions: KYCSubmission[] = kycUsers
        .filter(user => user.kycStatus === 'pending')
        .map(user => ({
          id: `submission-${user.id}`,
          userId: user.id,
          level: user.kycLevel,
          status: user.kycStatus,
          submittedAt: user.lastUpdated,
          documents: {},
          personalInfo: {
            fullName: `${user.firstName} ${user.lastName}`,
            dateOfBirth: '',
            nationalId: '',
            country: ''
          }
        }));
      
      setSubmissions(mockSubmissions);
      
      console.log('=== DEBUG: AdminKYCVerification admin service data loading complete ===');
    } catch (error) {
      console.error('Error loading KYC data:', error);
      
      // Fallback to local data
      console.log('=== DEBUG: AdminKYCVerification local data loading complete ===');
      
      // Create mock data for demonstration
      const mockUsers: AdminKYCUser[] = [
        {
          id: 'user-1',
          email: 'user1@example.com',
          firstName: 'John',
          lastName: 'Doe',
          kycLevel: 1,
          kycStatus: 'pending',
          documentsSubmitted: true,
          lastUpdated: new Date().toISOString(),
          submissionCount: 1
        },
        {
          id: 'user-2',
          email: 'user2@example.com',
          firstName: 'Jane',
          lastName: 'Smith',
          kycLevel: 2,
          kycStatus: 'verified',
          documentsSubmitted: true,
          lastUpdated: new Date().toISOString(),
          submissionCount: 1
        }
      ];
      
      const mockSubmissions: KYCSubmission[] = [
        {
          id: 'submission-1',
          userId: 'user-1',
          level: 1,
          status: 'pending',
          submittedAt: new Date().toISOString(),
          documents: {
            idCard: 'document-url-1',
            selfie: 'document-url-2'
          },
          personalInfo: {
            fullName: 'John Doe',
            dateOfBirth: '1990-01-01',
            nationalId: 'ID123456',
            address: '123 Main St',
            city: 'New York',
            country: 'USA'
          }
        }
      ];
      
      setUsers(mockUsers);
      setSubmissions(mockSubmissions);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleApproveKYC = async (submissionId: string, reason: string) => {
    try {
      const submission = submissions.find(s => s.id === submissionId);
      if (!submission) return;

      // Update KYC status using admin data service
      await supabaseAdminDataService.updateKYCStatus(submission.userId, 'verified');
      
      // Update local state
      setSubmissions(prev => prev.map(s => 
        s.id === submissionId 
          ? { ...s, status: 'approved', reviewedAt: new Date().toISOString() }
          : s
      ));
      
      setUsers(prev => prev.map(u => 
        u.id === submission.userId 
          ? { ...u, kycStatus: 'verified', kycLevel: Math.max(u.kycLevel, submission.level) }
          : u
      ));
      
      setShowReviewDialog(false);
      setSelectedSubmission(null);
      
      toast({
        title: "KYC Approved",
        description: `KYC for user ${submission.userId} has been approved.`,
      });
    } catch (error) {
      console.error('Error approving KYC:', error);
      toast({
        title: "Error",
        description: "Failed to approve KYC",
        variant: "destructive"
      });
    }
  };

  const handleRejectKYC = async (submissionId: string, reason: string) => {
    try {
      const submission = submissions.find(s => s.id === submissionId);
      if (!submission) return;

      // Update KYC status using admin data service
      await supabaseAdminDataService.updateKYCStatus(submission.userId, 'rejected');
      
      // Update local state
      setSubmissions(prev => prev.map(s => 
        s.id === submissionId 
          ? { ...s, status: 'rejected', reviewedAt: new Date().toISOString(), rejectionReason: reason }
          : s
      ));
      
      setUsers(prev => prev.map(u => 
        u.id === submission.userId 
          ? { ...u, kycStatus: 'rejected' }
          : u
      ));
      
      setShowReviewDialog(false);
      setSelectedSubmission(null);
      
      toast({
        title: "KYC Rejected",
        description: `KYC for user ${submission.userId} has been rejected.`,
      });
    } catch (error) {
      console.error('Error rejecting KYC:', error);
      toast({
        title: "Error",
        description: "Failed to reject KYC",
        variant: "destructive"
      });
    }
  };

  const handleReviewSubmission = (submission: KYCSubmission) => {
    setSelectedSubmission(submission);
    setShowReviewDialog(true);
    setReviewStatus('approved');
    setRejectionReason('');
  };

  const filteredSubmissions = submissions.filter(submission => {
    const matchesStatus = filterStatus === 'all' || submission.status === filterStatus;
    const matchesLevel = filterLevel === 'all' || submission.level === filterLevel;
    return matchesStatus && matchesLevel;
  });

  const filteredUsers = users.filter(user => {
    const matchesStatus = filterStatus === 'all' || user.kycStatus === filterStatus;
    const matchesLevel = filterLevel === 'all' || user.kycLevel === filterLevel;
    return matchesStatus && matchesLevel;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">KYC Verification</h2>
          <p className="text-slate-400">Review and manage user KYC submissions</p>
        </div>
        <Button onClick={loadData} variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Total Users</CardTitle>
            <Users className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{users.length}</div>
            <p className="text-xs text-slate-400">All KYC levels</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Pending Review</CardTitle>
            <Clock className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {submissions.filter(s => s.status === 'pending').length}
            </div>
            <p className="text-xs text-slate-400">Awaiting approval</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Verified</CardTitle>
            <CheckCircle className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {users.filter(u => u.kycStatus === 'verified').length}
            </div>
            <p className="text-xs text-slate-400">Approved users</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Rejected</CardTitle>
            <X className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {users.filter(u => u.kycStatus === 'rejected').length}
            </div>
            <p className="text-xs text-slate-400">Rejected submissions</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <Select value={filterStatus} onValueChange={(value: 'all' | 'pending' | 'approved' | 'rejected') => setFilterStatus(value)}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterLevel} onValueChange={(value: 'all' | 1 | 2 | 3) => setFilterLevel(value)}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by level" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Levels</SelectItem>
            <SelectItem value={1}>Level 1</SelectItem>
            <SelectItem value={2}>Level 2</SelectItem>
            <SelectItem value={3}>Level 3</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Content Tabs */}
      <Tabs defaultValue="submissions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="submissions">KYC Submissions ({filteredSubmissions.length})</TabsTrigger>
          <TabsTrigger value="users">All Users ({filteredUsers.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="submissions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>KYC Submissions</CardTitle>
            </CardHeader>
            <CardContent>
              {filteredSubmissions.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  No KYC submissions found.
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredSubmissions.map((submission) => {
                    const user = users.find(u => u.id === submission.userId);
                    return (
                      <div key={submission.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                              <User className="h-5 w-5" />
                            </div>
                            <div>
                              <h3 className="font-medium">{user?.firstName} {user?.lastName}</h3>
                              <p className="text-sm text-slate-400">{user?.email}</p>
                              <div className="flex items-center space-x-2 mt-1">
                                <Badge variant="outline">Level {submission.level}</Badge>
                                <Badge variant={
                                  submission.status === 'approved' ? 'default' :
                                  submission.status === 'rejected' ? 'destructive' : 'secondary'
                                }>
                                  {submission.status}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleReviewSubmission(submission)}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              Review
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredUsers.map((user) => (
                  <div key={user.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <User className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="font-medium">{user.firstName} {user.lastName}</h3>
                          <p className="text-sm text-slate-400">{user.email}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge variant="outline">Level {user.kycLevel}</Badge>
                            <Badge variant={
                              user.kycStatus === 'verified' ? 'default' :
                              user.kycStatus === 'rejected' ? 'destructive' : 'secondary'
                            }>
                              {user.kycStatus}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="text-sm text-slate-400">
                        {user.documentsSubmitted ? (
                          <div className="flex items-center space-x-1">
                            <FileText className="h-4 w-4" />
                            <span>Documents submitted</span>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-1">
                            <AlertTriangle className="h-4 w-4" />
                            <span>No documents</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Review Dialog */}
      <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Review KYC Submission</DialogTitle>
          </DialogHeader>
          {selectedSubmission && (
            <div className="space-y-6">
              {/* User Info */}
              <div className="border rounded-lg p-4">
                <h3 className="font-medium mb-2">User Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <Label>Full Name</Label>
                    <p>{selectedSubmission.personalInfo?.fullName}</p>
                  </div>
                  <div>
                    <Label>Date of Birth</Label>
                    <p>{selectedSubmission.personalInfo?.dateOfBirth}</p>
                  </div>
                  <div>
                    <Label>National ID</Label>
                    <p>{selectedSubmission.personalInfo?.nationalId}</p>
                  </div>
                  <div>
                    <Label>Country</Label>
                    <p>{selectedSubmission.personalInfo?.country}</p>
                  </div>
                </div>
              </div>

              {/* Documents */}
              <div className="border rounded-lg p-4">
                <h3 className="font-medium mb-2">Documents</h3>
                <div className="space-y-2">
                  {Object.entries(selectedSubmission.documents || {}).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between">
                      <span className="text-sm capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Review Actions */}
              <div className="space-y-4">
                <div>
                  <Label>Review Decision</Label>
                  <Select value={reviewStatus} onValueChange={(value: 'approved' | 'rejected') => setReviewStatus(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="approved">Approve</SelectItem>
                      <SelectItem value="rejected">Reject</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {reviewStatus === 'rejected' && (
                  <div>
                    <Label>Rejection Reason</Label>
                    <Textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Enter reason for rejection"
                      rows={3}
                    />
                  </div>
                )}

                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setShowReviewDialog(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={() => {
                      if (reviewStatus === 'approved') {
                        handleApproveKYC(selectedSubmission.id, 'Approved by admin');
                      } else {
                        handleRejectKYC(selectedSubmission.id, rejectionReason);
                      }
                    }}
                    variant={reviewStatus === 'approved' ? 'default' : 'destructive'}
                  >
                    {reviewStatus === 'approved' ? 'Approve' : 'Reject'}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminKYCVerification; 