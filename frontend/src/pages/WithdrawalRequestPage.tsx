import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { getWithdrawalRequests } from '@/services/walletService';

interface WithdrawalRequest {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  walletAddress: string;
  blockchain: string;
  status: 'pending' | 'completed' | 'failed';
  notes?: string;
  createdAt: string;
}
import WithdrawalRequestForm from '@/components/WithdrawalRequestForm';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  DollarSign, 
  Calendar,
  Copy,
  Eye,
  Wallet,
  AlertCircle
} from 'lucide-react';

const WithdrawalRequestPage: React.FC = () => {
  const [userRequests, setUserRequests] = useState<WithdrawalRequest[]>([]);
  const [activeTab, setActiveTab] = useState('new');
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadUserRequests();
    }
  }, [user]);

  const loadUserRequests = async () => {
    if (!user) return;
    
          const allRequests = await getWithdrawalRequests();
    const userRequests = allRequests.filter(request => request.userId === user.id);
    setUserRequests(userRequests);
  };

  const handleRequestSubmitted = () => {
    loadUserRequests();
    setActiveTab('history');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatAmount = (amount: number, asset: string) => {
    return `${amount.toLocaleString()} ${asset}`;
  };

  const getFilteredRequests = () => {
    if (activeTab === 'all') return userRequests;
    return userRequests.filter(request => request.status === activeTab);
  };

  const stats = {
    pending: userRequests.filter(r => r.status === 'pending').length,
    approved: userRequests.filter(r => r.status === 'approved').length,
    rejected: userRequests.filter(r => r.status === 'rejected').length,
    totalAmount: userRequests
      .filter(r => r.status === 'approved')
      .reduce((sum, r) => sum + r.amount, 0)
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Authentication Required</h2>
            <p className="text-muted-foreground">Please log in to access withdrawal requests.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Withdrawal Requests</h1>
            <p className="text-muted-foreground mt-2">
              Submit withdrawal requests and track their status
            </p>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-blue-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Withdrawn</p>
                  <p className="text-2xl font-bold">${stats.totalAmount.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="new">New Request</TabsTrigger>
            <TabsTrigger value="pending">Pending ({stats.pending})</TabsTrigger>
            <TabsTrigger value="approved">Approved ({stats.approved})</TabsTrigger>
            <TabsTrigger value="all">All ({userRequests.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="new" className="mt-6">
            <WithdrawalRequestForm onRequestSubmitted={handleRequestSubmitted} />
          </TabsContent>

          <TabsContent value={activeTab} className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="w-5 h-5" />
                  {activeTab === 'pending' ? 'Pending Requests' : 
                   activeTab === 'approved' ? 'Approved Requests' : 'All Requests'}
                </CardTitle>
                <CardDescription>
                  {activeTab === 'pending' ? 'Your pending withdrawal requests awaiting admin approval' :
                   activeTab === 'approved' ? 'Your approved and completed withdrawal requests' :
                   'All your withdrawal request history'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {getFilteredRequests().length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      {activeTab === 'pending' ? 'No pending withdrawal requests.' :
                       activeTab === 'approved' ? 'No approved withdrawal requests.' :
                       'No withdrawal requests found.'}
                    </div>
                  ) : (
                    getFilteredRequests().map((request) => (
                      <Card key={request.id} className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-4 mb-2">
                              <div className="flex items-center gap-2">
                                <DollarSign className="w-4 h-4 text-muted-foreground" />
                                <span className="font-medium">{formatAmount(request.amount, request.asset)}</span>
                              </div>
                              {getStatusBadge(request.status)}
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                              <div>
                                <p className="text-sm text-muted-foreground">Network</p>
                                <p className="font-medium">{request.blockchain}</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground">Requested</p>
                                <p className="font-medium">{formatDate(request.requestDate)}</p>
                              </div>
                              {request.processedDate && (
                                <div>
                                  <p className="text-sm text-muted-foreground">Processed</p>
                                  <p className="font-medium">{formatDate(request.processedDate)}</p>
                                </div>
                              )}
                            </div>

                            <div className="mb-3">
                              <p className="text-sm text-muted-foreground mb-1">Wallet Address</p>
                              <div className="flex items-center gap-2">
                                <code className="text-xs bg-muted px-2 py-1 rounded flex-1">
                                  {request.walletAddress}
                                </code>
                                <button
                                  onClick={() => copyToClipboard(request.walletAddress)}
                                  className="text-xs text-muted-foreground hover:text-foreground"
                                  title="Copy wallet address"
                                  aria-label="Copy wallet address"
                                >
                                  <Copy className="w-3 h-3" />
                                </button>
                              </div>
                            </div>

                            {request.remarks && (
                              <div className="mb-3">
                                <p className="text-sm text-muted-foreground mb-1">Remarks</p>
                                <p className="text-sm">{request.remarks}</p>
                              </div>
                            )}

                            {request.status === 'approved' && request.txHash && (
                              <div className="mb-3">
                                <p className="text-sm text-muted-foreground mb-1">Transaction Hash</p>
                                <div className="flex items-center gap-2">
                                  <code className="text-xs bg-muted px-2 py-1 rounded flex-1">
                                    {request.txHash}
                                  </code>
                                  <button
                                    onClick={() => copyToClipboard(request.txHash!)}
                                    className="text-xs text-muted-foreground hover:text-foreground"
                                    title="Copy transaction hash"
                                    aria-label="Copy transaction hash"
                                  >
                                    <Copy className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            )}

                            {request.status === 'rejected' && request.remarks && (
                              <div className="mb-3">
                                <p className="text-sm text-muted-foreground mb-1">Rejection Reason</p>
                                <p className="text-sm text-red-600">{request.remarks}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default WithdrawalRequestPage; 