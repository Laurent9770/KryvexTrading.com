import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import supabase from '@/lib/supabaseClient';
import { 
  FileText, 
  CheckCircle, 
  XCircle, 
  Clock, 
  User, 
  Calendar,
  Eye,
  Download,
  Search,
  RefreshCw
} from 'lucide-react';

interface KYCDocument {
  id: string;
  user_id: string;
  document_type: 'passport' | 'national_id' | 'drivers_license' | 'utility_bill';
  document_number?: string;
  document_file: string;
  status: 'pending' | 'approved' | 'rejected';
  submitted_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
  rejection_reason?: string;
  user_email?: string;
  user_name?: string;
}

const AdminKYCManager: React.FC = () => {
  const [kycDocuments, setKycDocuments] = useState<KYCDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDocument, setSelectedDocument] = useState<KYCDocument | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState('pending');

  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    loadKYCDocuments();
  }, []);

  const loadKYCDocuments = async () => {
    try {
      setIsLoading(true);
      
      // Load KYC documents with user information
      const { data: documents, error } = await supabase
        .from('kyc_documents')
        .select(`
          *,
          profiles:user_id(email, full_name)
        `)
        .order('submitted_at', { ascending: false });

      if (error) throw error;

      // Map the data to include user information
      const mappedDocuments: KYCDocument[] = (documents || []).map((doc: any) => ({
        ...doc,
        user_email: doc.profiles?.email,
        user_name: doc.profiles?.full_name
      }));

      setKycDocuments(mappedDocuments);
      
    } catch (error) {
      console.error('Error loading KYC documents:', error);
      toast({
        title: "Error",
        description: "Failed to load KYC documents",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproveKYC = async (documentId: string) => {
    if (!user) return;

    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from('kyc_documents')
        .update({
          status: 'approved',
          reviewed_at: new Date().toISOString(),
          reviewed_by: user.id
        })
        .eq('id', documentId);

      if (error) throw error;

      // Update user profile KYC status
      const document = kycDocuments.find(doc => doc.id === documentId);
      if (document) {
        await supabase
          .from('profiles')
          .update({
            kyc_status: 'approved',
            updated_at: new Date().toISOString()
          })
          .eq('user_id', document.user_id);
      }

      // Log admin action
      await supabase
        .from('admin_actions')
        .insert({
          admin_email: user.email,
          action_type: 'kyc_approved',
          target_user_id: document?.user_id,
          details: {
            document_id: documentId,
            document_type: document?.document_type,
            user_email: document?.user_email
          }
        });

      toast({
        title: "KYC Approved",
        description: "KYC document has been approved successfully"
      });

      loadKYCDocuments();
      
    } catch (error) {
      console.error('Error approving KYC:', error);
      toast({
        title: "Error",
        description: "Failed to approve KYC document",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRejectKYC = async (documentId: string) => {
    if (!user || !rejectionReason.trim()) {
      toast({
        title: "Error",
        description: "Please provide a rejection reason",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from('kyc_documents')
        .update({
          status: 'rejected',
          reviewed_at: new Date().toISOString(),
          reviewed_by: user.id,
          rejection_reason: rejectionReason
        })
        .eq('id', documentId);

      if (error) throw error;

      // Update user profile KYC status
      const document = kycDocuments.find(doc => doc.id === documentId);
      if (document) {
        await supabase
          .from('profiles')
          .update({
            kyc_status: 'rejected',
            updated_at: new Date().toISOString()
          })
          .eq('user_id', document.user_id);
      }

      // Log admin action
      await supabase
        .from('admin_actions')
        .insert({
          admin_email: user.email,
          action_type: 'kyc_rejected',
          target_user_id: document?.user_id,
          details: {
            document_id: documentId,
            document_type: document?.document_type,
            user_email: document?.user_email,
            rejection_reason: rejectionReason
          }
        });

      toast({
        title: "KYC Rejected",
        description: "KYC document has been rejected"
      });

      setRejectionReason('');
      setSelectedDocument(null);
      loadKYCDocuments();
      
    } catch (error) {
      console.error('Error rejecting KYC:', error);
      toast({
        title: "Error",
        description: "Failed to reject KYC document",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="flex items-center gap-1"><Clock className="w-3 h-3" /> Pending</Badge>;
      case 'approved':
        return <Badge variant="default" className="flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive" className="flex items-center gap-1"><XCircle className="w-3 h-3" /> Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getDocumentTypeBadge = (type: string) => {
    switch (type) {
      case 'passport':
        return <Badge variant="outline">Passport</Badge>;
      case 'national_id':
        return <Badge variant="outline">National ID</Badge>;
      case 'drivers_license':
        return <Badge variant="outline">Driver's License</Badge>;
      case 'utility_bill':
        return <Badge variant="outline">Utility Bill</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getFilteredDocuments = () => {
    let filtered = kycDocuments;

    // Status filter
    if (activeTab !== 'all') {
      filtered = filtered.filter(doc => doc.status === activeTab);
    }

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(doc => 
        doc.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.document_type.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  };

  const stats = {
    total: kycDocuments.length,
    pending: kycDocuments.filter(doc => doc.status === 'pending').length,
    approved: kycDocuments.filter(doc => doc.status === 'approved').length,
    rejected: kycDocuments.filter(doc => doc.status === 'rejected').length
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading KYC documents...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total KYC</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-500" />
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold">{stats.pending}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Approved</p>
                <p className="text-2xl font-bold">{stats.approved}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-500" />
              <div>
                <p className="text-sm text-muted-foreground">Rejected</p>
                <p className="text-2xl font-bold">{stats.rejected}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* KYC Documents */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                KYC Documents
              </CardTitle>
              <CardDescription>
                Review and manage user KYC verification documents
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Search by user or document type..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={loadKYCDocuments}
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="pending">Pending ({stats.pending})</TabsTrigger>
              <TabsTrigger value="approved">Approved ({stats.approved})</TabsTrigger>
              <TabsTrigger value="rejected">Rejected ({stats.rejected})</TabsTrigger>
              <TabsTrigger value="all">All ({stats.total})</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-6">
              <div className="space-y-4">
                {getFilteredDocuments().length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No {activeTab} KYC documents found.
                  </div>
                ) : (
                  getFilteredDocuments().map((document) => (
                    <Card key={document.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-4 mb-2">
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-muted-foreground" />
                              <span className="font-medium">{document.user_name || 'Unknown'}</span>
                              <span className="text-sm text-muted-foreground">({document.user_email})</span>
                            </div>
                            {getStatusBadge(document.status)}
                            {getDocumentTypeBadge(document.document_type)}
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                            <div>
                              <p className="text-sm text-muted-foreground">Document Number</p>
                              <p className="font-medium">{document.document_number || 'N/A'}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Submitted</p>
                              <p className="font-medium">{formatDate(document.submitted_at)}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Reviewed</p>
                              <p className="font-medium">{document.reviewed_at ? formatDate(document.reviewed_at) : 'Not reviewed'}</p>
                            </div>
                          </div>

                          {document.rejection_reason && (
                            <div className="mb-3">
                              <p className="text-sm text-muted-foreground mb-1">Rejection Reason</p>
                              <p className="text-sm text-red-600">{document.rejection_reason}</p>
                            </div>
                          )}
                        </div>

                        <div className="flex gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <Eye className="w-4 h-4 mr-1" />
                                View
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>KYC Document - {document.user_name}</DialogTitle>
                                <DialogDescription>
                                  Review the submitted KYC document
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <p className="text-sm font-medium">Document Type</p>
                                    <p className="text-sm text-muted-foreground">{document.document_type}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium">Document Number</p>
                                    <p className="text-sm text-muted-foreground">{document.document_number || 'N/A'}</p>
                                  </div>
                                </div>
                                <div>
                                  <p className="text-sm font-medium mb-2">Document Preview</p>
                                  <div className="border rounded-lg p-4 bg-gray-50">
                                    <img 
                                      src={document.document_file} 
                                      alt="KYC Document" 
                                      className="max-w-full h-auto rounded"
                                      onError={(e) => {
                                        e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+Cjx0ZXh0IHg9IjEwMCIgeT0iMTAwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM2QjcyODAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5Eb2N1bWVudCBQcmV2aWV3PC90ZXh0Pgo8L3N2Zz4K';
                                      }}
                                    />
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => window.open(document.document_file, '_blank')}
                                  >
                                    <Download className="w-4 h-4 mr-1" />
                                    Download
                                  </Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>

                          {document.status === 'pending' && (
                            <>
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => handleApproveKYC(document.id)}
                                disabled={isProcessing}
                              >
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Approve
                              </Button>
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button variant="destructive" size="sm">
                                    <XCircle className="w-4 h-4 mr-1" />
                                    Reject
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Reject KYC Document</DialogTitle>
                                    <DialogDescription>
                                      Provide a reason for rejecting this KYC document
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="space-y-4">
                                    <div>
                                      <label className="text-sm font-medium mb-2 block">Rejection Reason</label>
                                      <Textarea
                                        placeholder="Enter reason for rejection..."
                                        value={rejectionReason}
                                        onChange={(e) => setRejectionReason(e.target.value)}
                                        rows={3}
                                      />
                                    </div>
                                  </div>
                                  <DialogFooter>
                                    <Button variant="outline" onClick={() => setRejectionReason('')}>
                                      Cancel
                                    </Button>
                                    <Button 
                                      variant="destructive"
                                      onClick={() => handleRejectKYC(document.id)}
                                      disabled={isProcessing || !rejectionReason.trim()}
                                    >
                                      {isProcessing ? 'Processing...' : 'Reject'}
                                    </Button>
                                  </DialogFooter>
                                </DialogContent>
                              </Dialog>
                            </>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminKYCManager;
