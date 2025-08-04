import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import walletService, { WithdrawalRequest } from '@/services/walletService';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  Eye, 
  DollarSign, 
  User, 
  Calendar,
  Copy,
  ExternalLink
} from 'lucide-react';
import websocketService from '@/services/websocketService';

const AdminWithdrawalManager: React.FC = () => {
  const [withdrawalRequests, setWithdrawalRequests] = useState<WithdrawalRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<WithdrawalRequest | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [txHash, setTxHash] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [activeTab, setActiveTab] = useState('pending');

  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    loadWithdrawalRequests();
    
    // Set up WebSocket listener for real-time withdrawal requests
    const handleNewWithdrawalRequest = (data: any) => {
      console.log('AdminWithdrawalManager: New withdrawal request received:', data);
      
      const newRequest: WithdrawalRequest = {
        id: data.requestId || `withdrawal-${Date.now()}`,
        userId: data.userId,
        username: data.username,
        userEmail: data.userEmail,
        amount: data.amount,
        asset: data.asset,
        blockchain: data.blockchain,
        walletAddress: data.walletAddress,
        status: 'pending',
        requestDate: new Date().toISOString(),
        remarks: data.remarks
      };
      
      setWithdrawalRequests(prev => [newRequest, ...prev]);
      
      toast({
        title: "New Withdrawal Request",
        description: `${data.username} has requested withdrawal of ${data.amount} ${data.asset}`,
        duration: 5000
      });
    };
    
    // Subscribe to WebSocket events
    websocketService.on('withdrawal_request', handleNewWithdrawalRequest);
    
    // Set up periodic refresh
    const interval = setInterval(loadWithdrawalRequests, 30000);
    
    return () => {
      clearInterval(interval);
      websocketService.off('withdrawal_request', handleNewWithdrawalRequest);
    };
  }, []);

  const loadWithdrawalRequests = () => {
    const requests = walletService.getWithdrawalRequests();
    setWithdrawalRequests(requests);
  };

  const handleApprove = async (request: WithdrawalRequest) => {
    if (!user) return;

    setIsProcessing(true);
    try {
      const updatedRequest = walletService.approveWithdrawal(request.id, user.email, txHash);
      
      if (updatedRequest) {
        toast({
          title: "Withdrawal Approved",
          description: `Successfully approved ${request.amount} ${request.asset} withdrawal for ${request.username}`
        });
        loadWithdrawalRequests();
        setSelectedRequest(null);
        setTxHash('');
      } else {
        toast({
          variant: "destructive",
          title: "Approval Failed",
          description: "Insufficient balance or invalid request status"
        });
      }
    } catch (error) {
      console.error('Error approving withdrawal:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to approve withdrawal request"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async (request: WithdrawalRequest) => {
    if (!user) return;

    setIsProcessing(true);
    try {
      const updatedRequest = walletService.rejectWithdrawal(request.id, user.email, rejectReason);
      
      if (updatedRequest) {
        toast({
          title: "Withdrawal Rejected",
          description: `Successfully rejected ${request.amount} ${request.asset} withdrawal for ${request.username}`
        });
        loadWithdrawalRequests();
        setSelectedRequest(null);
        setRejectReason('');
      } else {
        toast({
          variant: "destructive",
          title: "Rejection Failed",
          description: "Invalid request status"
        });
      }
    } catch (error) {
      console.error('Error rejecting withdrawal:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to reject withdrawal request"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "Address copied to clipboard"
    });
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
    if (activeTab === 'all') return withdrawalRequests;
    return withdrawalRequests.filter(request => request.status === activeTab);
  };

  const stats = walletService.getWithdrawalStats();

  return (
    <div className="space-y-6">
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
                <p className="text-sm text-muted-foreground">Total Amount</p>
                <p className="text-2xl font-bold">${stats.totalAmount.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Withdrawal Requests */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Withdrawal Requests</CardTitle>
              <CardDescription>
                Manage user withdrawal requests. Review and approve or reject based on verification.
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                walletService.clearAllMockData();
                loadWithdrawalRequests();
                toast({
                  title: "Mock Data Cleared",
                  description: "All mock withdrawal requests have been removed."
                });
              }}
              className="text-xs"
            >
              Clear Mock Data
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="pending">Pending ({stats.pending})</TabsTrigger>
              <TabsTrigger value="approved">Approved ({stats.approved})</TabsTrigger>
              <TabsTrigger value="rejected">Rejected ({stats.rejected})</TabsTrigger>
              <TabsTrigger value="all">All ({stats.totalRequests})</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-6">
              <div className="space-y-4">
                {getFilteredRequests().length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No {activeTab} withdrawal requests found.
                  </div>
                ) : (
                  getFilteredRequests().map((request) => (
                    <Card key={request.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-4 mb-2">
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-muted-foreground" />
                              <span className="font-medium">{request.username}</span>
                              <span className="text-sm text-muted-foreground">({request.userEmail})</span>
                            </div>
                            {getStatusBadge(request.status)}
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                            <div>
                              <p className="text-sm text-muted-foreground">Amount</p>
                              <p className="font-medium">{formatAmount(request.amount, request.asset)}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Network</p>
                              <p className="font-medium">{request.blockchain}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Requested</p>
                              <p className="font-medium">{formatDate(request.requestDate)}</p>
                            </div>
                          </div>

                          <div className="mb-3">
                            <p className="text-sm text-muted-foreground mb-1">Wallet Address</p>
                            <div className="flex items-center gap-2">
                              <code className="text-xs bg-muted px-2 py-1 rounded flex-1">
                                {request.walletAddress}
                              </code>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyToClipboard(request.walletAddress)}
                              >
                                <Copy className="w-3 h-3" />
                              </Button>
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
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => copyToClipboard(request.txHash!)}
                                >
                                  <Copy className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>

                        {request.status === 'pending' && (
                          <div className="flex gap-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button 
                                  variant="default" 
                                  size="sm"
                                  onClick={() => setSelectedRequest(request)}
                                >
                                  <CheckCircle className="w-4 h-4 mr-1" />
                                  Approve
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Approve Withdrawal</DialogTitle>
                                  <DialogDescription>
                                    Approve the withdrawal request for {request.username} ({formatAmount(request.amount, request.asset)})
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div>
                                    <Label htmlFor="txHash">Transaction Hash (Optional)</Label>
                                    <Input
                                      id="txHash"
                                      placeholder="Enter transaction hash"
                                      value={txHash}
                                      onChange={(e) => setTxHash(e.target.value)}
                                    />
                                  </div>
                                </div>
                                <DialogFooter>
                                  <Button variant="outline" onClick={() => setSelectedRequest(null)}>
                                    Cancel
                                  </Button>
                                  <Button 
                                    onClick={() => handleApprove(request)}
                                    disabled={isProcessing}
                                  >
                                    {isProcessing ? 'Processing...' : 'Approve'}
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>

                            <Dialog>
                              <DialogTrigger asChild>
                                <Button 
                                  variant="destructive" 
                                  size="sm"
                                  onClick={() => setSelectedRequest(request)}
                                >
                                  <XCircle className="w-4 h-4 mr-1" />
                                  Reject
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Reject Withdrawal</DialogTitle>
                                  <DialogDescription>
                                    Reject the withdrawal request for {request.username} ({formatAmount(request.amount, request.asset)})
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div>
                                    <Label htmlFor="rejectReason">Reason for Rejection</Label>
                                    <Textarea
                                      id="rejectReason"
                                      placeholder="Enter reason for rejection"
                                      value={rejectReason}
                                      onChange={(e) => setRejectReason(e.target.value)}
                                    />
                                  </div>
                                </div>
                                <DialogFooter>
                                  <Button variant="outline" onClick={() => setSelectedRequest(null)}>
                                    Cancel
                                  </Button>
                                  <Button 
                                    variant="destructive"
                                    onClick={() => handleReject(request)}
                                    disabled={isProcessing}
                                  >
                                    {isProcessing ? 'Processing...' : 'Reject'}
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          </div>
                        )}
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

export default AdminWithdrawalManager; 