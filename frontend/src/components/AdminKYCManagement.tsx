import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { 
  UserCheck, 
  Search, 
  Filter, 
  Eye, 
  CheckCircle, 
  XCircle, 
  Clock,
  FileText,
  AlertTriangle,
  Shield,
  Download,
  MoreHorizontal,
  Image,
  File,
  Calendar,
  Mail,
  Phone,
  MapPin,
  CreditCard,
  Banknote
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface KYCApplication {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone?: string;
  date_of_birth?: string;
  nationality?: string;
  address?: string;
  city?: string;
  country?: string;
  postal_code?: string;
  document_type: string;
  document_number?: string;
  document_front_url?: string;
  document_back_url?: string;
  selfie_url?: string;
  proof_of_address_url?: string;
  verification_level: string;
  status: string;
  submitted_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
  rejection_reason?: string;
  kyc_notes?: string;
}

export default function AdminKYCManagement() {
  const { toast } = useToast();
  const [kycApplications, setKycApplications] = useState<KYCApplication[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<KYCApplication[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [levelFilter, setLevelFilter] = useState('all');
  const [selectedApplication, setSelectedApplication] = useState<KYCApplication | null>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewData, setReviewData] = useState({
    status: 'approved',
    verification_level: 'basic',
    notes: '',
    rejection_reason: ''
  });

  useEffect(() => {
    fetchKYCApplications();
  }, []);

  useEffect(() => {
    filterApplications();
  }, [kycApplications, searchTerm, statusFilter, levelFilter]);

  const fetchKYCApplications = async () => {
    try {
      // Mock KYC applications data
      const mockApplications: KYCApplication[] = [
        {
          id: '1',
          user_id: 'user-001',
          full_name: 'John Trader',
          email: 'trader1@example.com',
          phone: '+1234567891',
          date_of_birth: '1985-05-15',
          nationality: 'Canadian',
          address: '123 Trading Street',
          city: 'Toronto',
          country: 'Canada',
          postal_code: 'M5V 3A8',
          document_type: 'Passport',
          document_number: 'CA123456789',
          document_front_url: '/mock-document-front.jpg',
          document_back_url: '/mock-document-back.jpg',
          selfie_url: '/mock-selfie.jpg',
          proof_of_address_url: '/mock-address.jpg',
          verification_level: 'basic',
          status: 'pending',
          submitted_at: '2024-01-15T10:30:00Z',
          reviewed_at: undefined,
          reviewed_by: undefined,
          rejection_reason: undefined,
          kyc_notes: undefined
        },
        {
          id: '2',
          user_id: 'user-002',
          full_name: 'Sarah Investor',
          email: 'sarah@example.com',
          phone: '+1234567892',
          date_of_birth: '1992-08-20',
          nationality: 'British',
          address: '456 Investment Lane',
          city: 'London',
          country: 'United Kingdom',
          postal_code: 'SW1A 1AA',
          document_type: 'Driver License',
          document_number: 'UK987654321',
          document_front_url: '/mock-document-front.jpg',
          document_back_url: '/mock-document-back.jpg',
          selfie_url: '/mock-selfie.jpg',
          proof_of_address_url: '/mock-address.jpg',
          verification_level: 'advanced',
          status: 'approved',
          submitted_at: '2024-01-10T14:20:00Z',
          reviewed_at: '2024-01-12T09:15:00Z',
          reviewed_by: 'admin-001',
          rejection_reason: undefined,
          kyc_notes: 'All documents verified successfully'
        }
      ];

      setKycApplications(mockApplications);
    } catch (error) {
      console.error('Error fetching KYC applications:', error);
      toast({
        title: "Error",
        description: "Failed to load KYC applications",
        variant: "destructive"
      });
    }
  };

  const filterApplications = () => {
    let filtered = kycApplications;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(app =>
        app.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.document_number?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(app => app.status === statusFilter);
    }

    // Level filter
    if (levelFilter !== 'all') {
      filtered = filtered.filter(app => app.verification_level === levelFilter);
    }

    setFilteredApplications(filtered);
  };

  const handleKYCReview = async () => {
    if (!selectedApplication) return;

    try {
      // Mock KYC review - in a real app, this would update the database
      const updatedApplications = kycApplications.map(app => {
        if (app.id === selectedApplication.id) {
          return {
            ...app,
            status: reviewData.status,
            verification_level: reviewData.verification_level,
            reviewed_at: new Date().toISOString(),
            reviewed_by: 'admin-001',
            rejection_reason: reviewData.status === 'rejected' ? reviewData.rejection_reason : undefined,
            kyc_notes: reviewData.notes
          };
        }
        return app;
      });

      setKycApplications(updatedApplications);

      toast({
        title: "Success",
        description: `KYC application ${reviewData.status} successfully`
      });

      setIsReviewModalOpen(false);
      setReviewData({ status: 'approved', verification_level: 'basic', notes: '', rejection_reason: '' });
    } catch (error) {
      console.error('Error reviewing KYC:', error);
      toast({
        title: "Error",
        description: "Failed to review KYC application",
        variant: "destructive"
      });
    }
  };

  const exportKYCData = () => {
    const csvContent = [
      ['Name', 'Email', 'Document Type', 'Status', 'Level', 'Submitted', 'Reviewed'],
      ...filteredApplications.map(app => [
        app.full_name || 'N/A',
        app.email,
        app.document_type,
        app.status,
        app.verification_level,
        new Date(app.submitted_at).toLocaleDateString(),
        app.reviewed_at ? new Date(app.reviewed_at).toLocaleDateString() : 'Pending'
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'kyc_applications_export.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      case 'pending':
        return <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      default:
        return <Badge className="bg-slate-500/20 text-slate-400 border-slate-500/30">{status}</Badge>;
    }
  };

  const getLevelBadge = (level: string) => {
    switch (level) {
      case 'basic':
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Basic</Badge>;
      case 'advanced':
        return <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">Advanced</Badge>;
      case 'premium':
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Premium</Badge>;
      default:
        return <Badge className="bg-slate-500/20 text-slate-400 border-slate-500/30">{level}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-900/50 to-blue-800/30 border-blue-700/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-white">{filteredApplications.length}</p>
                <p className="text-blue-300 text-sm">Total Applications</p>
              </div>
              <FileText className="w-8 h-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-900/50 to-orange-800/30 border-orange-700/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-white">
                  {filteredApplications.filter(app => app.status === 'pending').length}
                </p>
                <p className="text-orange-300 text-sm">Pending Review</p>
              </div>
              <Clock className="w-8 h-8 text-orange-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-900/50 to-green-800/30 border-green-700/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-white">
                  {filteredApplications.filter(app => app.status === 'approved').length}
                </p>
                <p className="text-green-300 text-sm">Approved</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-900/50 to-red-800/30 border-red-700/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-white">
                  {filteredApplications.filter(app => app.status === 'rejected').length}
                </p>
                <p className="text-red-300 text-sm">Rejected</p>
              </div>
              <XCircle className="w-8 h-8 text-red-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <Card className="bg-slate-900/50 border-slate-700">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex flex-col md:flex-row gap-4 flex-1">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="Search applications..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-slate-800 border-slate-600 text-white w-64"
                />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48 bg-slate-800 border-slate-600 text-white">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-600">
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>

              <Select value={levelFilter} onValueChange={setLevelFilter}>
                <SelectTrigger className="w-48 bg-slate-800 border-slate-600 text-white">
                  <Shield className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-600">
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="basic">Basic</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button onClick={exportKYCData} variant="outline" className="border-slate-600 text-slate-300">
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* KYC Applications Table */}
      <Card className="bg-slate-900/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">KYC Review Center</CardTitle>
          <CardDescription className="text-slate-400">
            Review and approve user verification documents
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-slate-700">
                <TableHead className="text-slate-300">Applicant</TableHead>
                <TableHead className="text-slate-300">Document</TableHead>
                <TableHead className="text-slate-300">Status</TableHead>
                <TableHead className="text-slate-300">Level</TableHead>
                <TableHead className="text-slate-300">Submitted</TableHead>
                <TableHead className="text-slate-300">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredApplications.map((application) => (
                <TableRow key={application.id} className="border-slate-700">
                  <TableCell>
                    <div>
                      <div className="font-medium text-white">{application.full_name}</div>
                      <div className="text-sm text-slate-400">{application.email}</div>
                      {application.phone && (
                        <div className="text-xs text-slate-500">{application.phone}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Document className="w-4 h-4 text-blue-400" />
                      <span className="text-white">{application.document_type}</span>
                      {application.document_number && (
                        <span className="text-xs text-slate-400">#{application.document_number}</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(application.status)}
                  </TableCell>
                  <TableCell>
                    {getLevelBadge(application.verification_level)}
                  </TableCell>
                  <TableCell className="text-slate-300">
                    {new Date(application.submitted_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="bg-slate-800 border-slate-600">
                        <DropdownMenuItem 
                          onClick={() => {
                            setSelectedApplication(application);
                            setIsReviewModalOpen(true);
                          }}
                          className="text-slate-300 hover:bg-slate-700"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Review Application
                        </DropdownMenuItem>
                        {application.status === 'pending' && (
                          <>
                            <DropdownMenuItem 
                              onClick={() => {
                                setSelectedApplication(application);
                                setReviewData({ ...reviewData, status: 'approved' });
                                setIsReviewModalOpen(true);
                              }}
                              className="text-green-300 hover:bg-slate-700"
                            >
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Approve
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => {
                                setSelectedApplication(application);
                                setReviewData({ ...reviewData, status: 'rejected' });
                                setIsReviewModalOpen(true);
                              }}
                              className="text-red-300 hover:bg-slate-700"
                            >
                              <XCircle className="w-4 h-4 mr-2" />
                              Reject
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* KYC Review Modal */}
      <Dialog open={isReviewModalOpen} onOpenChange={setIsReviewModalOpen}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Review KYC Application</DialogTitle>
            <DialogDescription className="text-slate-400">
              Review documents and approve or reject the application
            </DialogDescription>
          </DialogHeader>
          {selectedApplication && (
            <div className="space-y-6">
              {/* Applicant Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white">Applicant Information</h3>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <UserCheck className="w-4 h-4 text-blue-400" />
                      <span className="text-white font-medium">{selectedApplication.full_name}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Mail className="w-4 h-4 text-slate-400" />
                      <span className="text-slate-300">{selectedApplication.email}</span>
                    </div>
                    {selectedApplication.phone && (
                      <div className="flex items-center space-x-2">
                        <Phone className="w-4 h-4 text-slate-400" />
                        <span className="text-slate-300">{selectedApplication.phone}</span>
                      </div>
                    )}
                    {selectedApplication.date_of_birth && (
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        <span className="text-slate-300">{selectedApplication.date_of_birth}</span>
                      </div>
                    )}
                    {selectedApplication.nationality && (
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-4 h-4 text-slate-400" />
                        <span className="text-slate-300">{selectedApplication.nationality}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white">Address Information</h3>
                  <div className="space-y-2">
                    {selectedApplication.address && (
                      <div className="text-slate-300">{selectedApplication.address}</div>
                    )}
                    {(selectedApplication.city || selectedApplication.country) && (
                      <div className="text-slate-300">
                        {selectedApplication.city}, {selectedApplication.country}
                      </div>
                    )}
                    {selectedApplication.postal_code && (
                      <div className="text-slate-300">{selectedApplication.postal_code}</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Document Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">Document Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Document className="w-4 h-4 text-blue-400" />
                      <span className="text-white font-medium">{selectedApplication.document_type}</span>
                    </div>
                    {selectedApplication.document_number && (
                      <div className="text-slate-300">Number: {selectedApplication.document_number}</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Document Images */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">Document Images</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {selectedApplication.document_front_url && (
                    <div className="space-y-2">
                      <label className="text-sm text-slate-400">Front Side</label>
                      <div className="bg-slate-800 rounded-lg p-4 border border-slate-600">
                        <Image className="w-full h-32 object-cover rounded" />
                        <p className="text-xs text-slate-400 mt-2">Document Front</p>
                      </div>
                    </div>
                  )}
                  {selectedApplication.document_back_url && (
                    <div className="space-y-2">
                      <label className="text-sm text-slate-400">Back Side</label>
                      <div className="bg-slate-800 rounded-lg p-4 border border-slate-600">
                        <Image className="w-full h-32 object-cover rounded" />
                        <p className="text-xs text-slate-400 mt-2">Document Back</p>
                      </div>
                    </div>
                  )}
                  {selectedApplication.selfie_url && (
                    <div className="space-y-2">
                      <label className="text-sm text-slate-400">Selfie</label>
                      <div className="bg-slate-800 rounded-lg p-4 border border-slate-600">
                        <Image className="w-full h-32 object-cover rounded" />
                        <p className="text-xs text-slate-400 mt-2">Selfie Verification</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Review Form */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">Review Decision</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-slate-400">Status</label>
                    <Select value={reviewData.status} onValueChange={(value) => setReviewData(prev => ({ ...prev, status: value }))}>
                      <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-600">
                        <SelectItem value="approved">Approve</SelectItem>
                        <SelectItem value="rejected">Reject</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm text-slate-400">Verification Level</label>
                    <Select value={reviewData.verification_level} onValueChange={(value) => setReviewData(prev => ({ ...prev, verification_level: value }))}>
                      <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-600">
                        <SelectItem value="basic">Basic</SelectItem>
                        <SelectItem value="advanced">Advanced</SelectItem>
                        <SelectItem value="premium">Premium</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {reviewData.status === 'rejected' && (
                  <div>
                    <label className="text-sm text-slate-400">Rejection Reason</label>
                    <Textarea
                      value={reviewData.rejection_reason}
                      onChange={(e) => setReviewData(prev => ({ ...prev, rejection_reason: e.target.value }))}
                      className="bg-slate-800 border-slate-600 text-white"
                      placeholder="Reason for rejection"
                      rows={3}
                    />
                  </div>
                )}

                <div>
                  <label className="text-sm text-slate-400">Review Notes</label>
                  <Textarea
                    value={reviewData.notes}
                    onChange={(e) => setReviewData(prev => ({ ...prev, notes: e.target.value }))}
                    className="bg-slate-800 border-slate-600 text-white"
                    placeholder="Additional notes about this application"
                    rows={3}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-2">
                <Button 
                  onClick={handleKYCReview}
                  className={reviewData.status === 'approved' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
                >
                  {reviewData.status === 'approved' ? (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Approve Application
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4 mr-2" />
                      Reject Application
                    </>
                  )}
                </Button>
                <Button 
                  onClick={() => setIsReviewModalOpen(false)} 
                  variant="outline"
                  className="border-slate-600 text-slate-300"
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
} 