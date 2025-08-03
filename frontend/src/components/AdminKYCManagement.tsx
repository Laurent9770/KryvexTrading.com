import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { 
  Shield, 
  Search, 
  Filter, 
  Eye, 
  CheckCircle, 
  XCircle,
  AlertTriangle,
  Clock,
  Download,
  RefreshCw,
  User,
  FileText,
  Calendar,
  MapPin,
  CreditCard
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import kycService from '@/services/kycService';
import { Label } from '@/components/ui/label';

interface KYCSubmission {
  userId: string;
  level2: {
    status: 'pending' | 'approved' | 'rejected';
    submittedAt: string;
    reviewedAt?: string;
    rejectionReason?: string;
    documents?: {
      fullName: string;
      dateOfBirth: string;
      country: string;
      idType: string;
      idNumber: string;
      frontUrl?: string;
      backUrl?: string;
      selfieUrl?: string;
    };
  };
}

export default function AdminKYCManagement() {
  const { toast } = useToast();
  const [submissions, setSubmissions] = useState<KYCSubmission[]>([]);
  const [filteredSubmissions, setFilteredSubmissions] = useState<KYCSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedSubmission, setSelectedSubmission] = useState<KYCSubmission | null>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewData, setReviewData] = useState({
    status: 'approved' as 'approved' | 'rejected',
    reason: ''
  });

  useEffect(() => {
    fetchKYCSubmissions();
  }, []);

  useEffect(() => {
    filterSubmissions();
  }, [submissions, searchTerm, statusFilter]);

  const fetchKYCSubmissions = async () => {
    setIsLoading(true);
    try {
      const data = await kycService.getKYCSubmissions();
      setSubmissions(data);
    } catch (error) {
      console.error('Error fetching KYC submissions:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load KYC submissions",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filterSubmissions = () => {
    let filtered = submissions;

    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(submission => 
        submission.userId.toLowerCase().includes(searchLower) ||
        submission.level2.documents?.fullName.toLowerCase().includes(searchLower) ||
        submission.level2.documents?.idNumber.toLowerCase().includes(searchLower)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(submission => submission.level2.status === statusFilter);
    }

    setFilteredSubmissions(filtered);
  };

  const handleReviewSubmission = async () => {
    if (!selectedSubmission) return;

    setIsLoading(true);
    try {
      const result = await kycService.reviewKYCSubmission(
        selectedSubmission.userId,
        reviewData.status,
        reviewData.status === 'rejected' ? reviewData.reason : undefined
      );

      if (result.success) {
        toast({
          title: "Review Completed",
          description: result.message,
        });

        // Refresh submissions
        await fetchKYCSubmissions();
        setIsReviewModalOpen(false);
        setSelectedSubmission(null);
        setReviewData({ status: 'approved', reason: '' });
      } else {
        toast({
          variant: "destructive",
          title: "Review Failed",
          description: result.message,
        });
      }
    } catch (error) {
      console.error('Error reviewing KYC submission:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to review KYC submission",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const exportKYCData = () => {
    try {
      const csvContent = [
        ['User ID', 'Full Name', 'Date of Birth', 'Country', 'ID Type', 'ID Number', 'Status', 'Submitted At', 'Reviewed At', 'Rejection Reason'],
        ...filteredSubmissions.map(submission => [
          submission.userId,
          submission.level2.documents?.fullName || '',
          submission.level2.documents?.dateOfBirth || '',
          submission.level2.documents?.country || '',
          submission.level2.documents?.idType || '',
          submission.level2.documents?.idNumber || '',
          submission.level2.status,
          submission.level2.submittedAt,
          submission.level2.reviewedAt || '',
          submission.level2.rejectionReason || ''
        ])
      ].map(row => row.join(',')).join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'kyc_submissions_export.csv';
      a.click();
      window.URL.revokeObjectURL(url);

      toast({
        title: "Export Successful",
        description: "KYC data exported to CSV",
      });
    } catch (error) {
      console.error('Error exporting KYC data:', error);
      toast({
        variant: "destructive",
        title: "Export Failed",
        description: "Failed to export KYC data",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-500/10 text-green-400">Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-red-500/10 text-red-400">Rejected</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500/10 text-yellow-400">Pending</Badge>;
      default:
        return <Badge className="bg-gray-500/10 text-gray-400">Unknown</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">KYC Management</h2>
          <p className="text-muted-foreground">
            Review and manage user identity verification submissions.
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={fetchKYCSubmissions} 
            variant="outline" 
            size="sm"
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button 
            onClick={exportKYCData} 
            variant="outline" 
            size="sm"
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by user ID, name, or ID number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div className="w-full sm:w-48">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* KYC Submissions Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            KYC Submissions ({filteredSubmissions.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Full Name</TableHead>
                  <TableHead>ID Type</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSubmissions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      {isLoading ? (
                        <div className="flex items-center justify-center gap-2">
                          <RefreshCw className="h-4 w-4 animate-spin" />
                          Loading submissions...
                        </div>
                      ) : (
                        "No KYC submissions found"
                      )}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSubmissions.map((submission) => (
                    <TableRow key={submission.userId}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{submission.userId}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {submission.level2.documents?.fullName || 'N/A'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-4 w-4 text-muted-foreground" />
                          <span className="capitalize">
                            {submission.level2.documents?.idType?.replace('_', ' ') || 'N/A'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>{formatDate(submission.level2.submittedAt)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(submission.level2.status)}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedSubmission(submission);
                                setIsReviewModalOpen(true);
                              }}
                            >
                              <FileText className="h-4 w-4 mr-2" />
                              Review Details
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Review Modal */}
      <Dialog open={isReviewModalOpen} onOpenChange={setIsReviewModalOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Review KYC Submission</DialogTitle>
            <DialogDescription>
              Review the identity verification documents and approve or reject the submission.
            </DialogDescription>
          </DialogHeader>
          
          {selectedSubmission && (
            <div className="space-y-6">
              {/* User Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">User ID</Label>
                  <p className="text-sm text-muted-foreground">{selectedSubmission.userId}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Full Name</Label>
                  <p className="text-sm text-muted-foreground">
                    {selectedSubmission.level2.documents?.fullName || 'N/A'}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Date of Birth</Label>
                  <p className="text-sm text-muted-foreground">
                    {selectedSubmission.level2.documents?.dateOfBirth || 'N/A'}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Country</Label>
                  <p className="text-sm text-muted-foreground">
                    {selectedSubmission.level2.documents?.country || 'N/A'}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">ID Type</Label>
                  <p className="text-sm text-muted-foreground">
                    {selectedSubmission.level2.documents?.idType?.replace('_', ' ') || 'N/A'}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">ID Number</Label>
                  <p className="text-sm text-muted-foreground">
                    {selectedSubmission.level2.documents?.idNumber || 'N/A'}
                  </p>
                </div>
              </div>

              {/* Document Previews */}
              <div className="space-y-4">
                <h4 className="font-semibold">Document Images</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {selectedSubmission.level2.documents?.frontUrl && (
                    <div className="space-y-2">
                      <Label className="text-sm">Front of ID</Label>
                      <img 
                        src={selectedSubmission.level2.documents.frontUrl} 
                        alt="Front of ID" 
                        className="w-full h-32 object-cover rounded border"
                      />
                    </div>
                  )}
                  {selectedSubmission.level2.documents?.backUrl && (
                    <div className="space-y-2">
                      <Label className="text-sm">Back of ID</Label>
                      <img 
                        src={selectedSubmission.level2.documents.backUrl} 
                        alt="Back of ID" 
                        className="w-full h-32 object-cover rounded border"
                      />
                    </div>
                  )}
                  {selectedSubmission.level2.documents?.selfieUrl && (
                    <div className="space-y-2">
                      <Label className="text-sm">Selfie with ID</Label>
                      <img 
                        src={selectedSubmission.level2.documents.selfieUrl} 
                        alt="Selfie with ID" 
                        className="w-full h-32 object-cover rounded border"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Review Actions */}
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Review Decision</Label>
                  <Select 
                    value={reviewData.status} 
                    onValueChange={(value: 'approved' | 'rejected') => setReviewData(prev => ({ ...prev, status: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="approved">Approve</SelectItem>
                      <SelectItem value="rejected">Reject</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {reviewData.status === 'rejected' && (
                  <div>
                    <Label className="text-sm font-medium">Rejection Reason</Label>
                    <Textarea
                      placeholder="Provide a reason for rejection..."
                      value={reviewData.reason}
                      onChange={(e) => setReviewData(prev => ({ ...prev, reason: e.target.value }))}
                      rows={3}
                    />
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    onClick={handleReviewSubmission}
                    disabled={isLoading || (reviewData.status === 'rejected' && !reviewData.reason)}
                    className="flex-1"
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        {reviewData.status === 'approved' ? (
                          <CheckCircle className="h-4 w-4 mr-2" />
                        ) : (
                          <XCircle className="h-4 w-4 mr-2" />
                        )}
                        {reviewData.status === 'approved' ? 'Approve' : 'Reject'}
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setIsReviewModalOpen(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
} 