import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  CheckCircle, 
  XCircle, 
  Eye, 
  Download, 
  RefreshCw,
  Search,
  Filter,
  FileText,
  ExternalLink
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { subscribeToTransactions } from '@/services/walletService';
import supabaseAdminDataService, { AdminDepositRequest } from '@/services/supabaseAdminDataService';
import { useAuth } from '@/contexts/AuthContext';
import supabase from '@/lib/supabaseClient';

const AdminDepositManager = () => {
  const { toast } = useToast();
  const { t } = useLanguage();
  const { user } = useAuth();
  const [depositRequests, setDepositRequests] = useState<AdminDepositRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<AdminDepositRequest[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [networkFilter, setNetworkFilter] = useState<'all' | 'TRC20' | 'ERC20' | 'BEP20'>('all');
  const [selectedRequest, setSelectedRequest] = useState<AdminDepositRequest | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const fetchDepositRequests = async () => {
      try {
        console.log('=== DEBUG: AdminDepositManager loading deposit requests ===');
        
            // Use supabaseAdminDataService to get real deposit requests based on actual users
    const requests = await supabaseAdminDataService.getDepositRequests();
        console.log('Deposit requests loaded:', requests.length);
        console.log('Deposit requests data:', requests);
        
        setDepositRequests(requests);
        setFilteredRequests(requests);
        
        console.log('=== DEBUG: AdminDepositManager data loading complete ===');
      } catch (error) {
        console.error('Error fetching deposit requests:', error);
      }
    };
    
    fetchDepositRequests();
    
    // Set up WebSocket listener for real-time deposit requests
    const handleNewDepositRequest = (data: any) => {
      console.log('AdminDepositManager: New deposit request received:', data);
      
      const newRequest: AdminDepositRequest = {
        id: data.requestId || `deposit-${Date.now()}`,
        userId: data.userId,
        userEmail: data.userEmail,
        amount: data.amount,
        network: data.network || 'TRC20',
        transactionHash: data.transactionHash,
        notes: data.notes,
        proofFile: data.proofFile,
        proofPreview: data.proofPreview,
        status: 'pending',
        createdAt: new Date().toISOString()
      };
      
      setDepositRequests(prev => [newRequest, ...prev]);
      
      toast({
        title: "New Deposit Request",
        description: `${data.userEmail} has submitted a deposit request for ${data.amount} ${data.currency}`,
        duration: 5000
      });
    };
    
    // Subscribe to Supabase real-time events
    const depositSubscription = subscribeToTransactions(handleNewDepositRequest);
    
    // Set up periodic refresh
    const interval = setInterval(fetchDepositRequests, 30000);
    
    return () => {
      clearInterval(interval);
      if (depositSubscription) depositSubscription.unsubscribe();
    };
  }, []);

  // Filter requests
  useEffect(() => {
    let filtered = depositRequests;

    if (searchTerm) {
      filtered = filtered.filter(request => 
        request.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.transactionHash?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(request => request.status === statusFilter);
    }

    if (networkFilter !== 'all') {
      filtered = filtered.filter(request => request.network === networkFilter);
    }

    setFilteredRequests(filtered);
  }, [depositRequests, searchTerm, statusFilter, networkFilter]);

  const handleApproveDeposit = async (depositId: string) => {
    try {
      const { error } = await supabase
        .from('deposits')
        .update({
          status: 'approved',
          processed_at: new Date().toISOString()
        })
        .eq('id', depositId);
      
      if (error) throw error;
      
      toast({
        title: "Deposit Approved",
        description: "The deposit has been approved successfully.",
      });
      
      // Refresh deposits list
      fetchDeposits();
    } catch (error) {
      console.error('Error approving deposit:', error);
      toast({
        title: "Error",
        description: "Failed to approve deposit.",
        variant: "destructive"
      });
    }
  };

  const handleRejectDeposit = async (depositId: string, reason: string) => {
    try {
      const { error } = await supabase
        .from('deposits')
        .update({
          status: 'rejected',
          processed_at: new Date().toISOString(),
          remarks: reason
        })
        .eq('id', depositId);
      
      if (error) throw error;
      
      toast({
        title: "Deposit Rejected",
        description: "The deposit has been rejected.",
      });
      
      // Refresh deposits list
      fetchDeposits();
    } catch (error) {
      console.error('Error rejecting deposit:', error);
      toast({
        title: "Error",
        description: "Failed to reject deposit.",
        variant: "destructive"
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-500/10 text-green-400 border-green-500/20';
      case 'rejected':
        return 'bg-red-500/10 text-red-400 border-red-500/20';
      default:
        return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
    }
  };

  const getNetworkColor = (network: string) => {
    switch (network) {
      case 'TRC20':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'ERC20':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'BEP20':
        return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
      default:
        return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Deposit Management</h2>
          <p className="text-muted-foreground">Review and process user deposit requests</p>
        </div>
        <Button onClick={() => window.location.reload()} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search by email, hash, or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <div>
            <label className="text-sm font-medium mb-2 block">Status</label>
            <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
              <SelectTrigger>
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
            <label className="text-sm font-medium mb-2 block">Network</label>
            <Select value={networkFilter} onValueChange={(value: any) => setNetworkFilter(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Networks</SelectItem>
                <SelectItem value="TRC20">TRC20</SelectItem>
                <SelectItem value="ERC20">ERC20</SelectItem>
                <SelectItem value="BEP20">BEP20</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-end">
            <Button 
              variant="outline" 
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setNetworkFilter('all');
              }}
              className="w-full"
            >
              <Filter className="w-4 h-4 mr-2" />
              Clear Filters
            </Button>
          </div>
        </div>
      </Card>

      {/* Deposit Requests */}
      <Card className="p-6">
        <div className="space-y-4">
          {filteredRequests.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No deposit requests found
            </div>
          ) : (
            filteredRequests.map((request) => (
              <div key={request.id} className="border rounded-lg p-4 space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">Request #{request.id}</h3>
                      <Badge className={getStatusColor(request.status)}>
                        {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                      </Badge>
                      <Badge className={getNetworkColor(request.network)}>
                        {request.network}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{request.userEmail}</p>
                    <p className="text-lg font-bold">{request.amount} USDT</p>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedRequest(request)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View Details
                    </Button>
                    
                    {request.status === 'pending' && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleApproveDeposit(request.id)}
                          disabled={isProcessing}
                          className="text-green-600 border-green-600 hover:bg-green-50"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Approve
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRejectDeposit(request.id, 'Rejected by admin')}
                          disabled={isProcessing}
                          className="text-red-600 border-red-600 hover:bg-red-50"
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Reject
                        </Button>
                      </>
                    )}
                  </div>
                </div>
                
                {request.transactionHash && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Transaction Hash: </span>
                    <span className="font-mono">{request.transactionHash}</span>
                  </div>
                )}
                
                {request.notes && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Notes: </span>
                    <span>{request.notes}</span>
                  </div>
                )}
                
                <div className="text-xs text-muted-foreground">
                  Created: {new Date(request.createdAt).toLocaleString()}
                  {request.processedAt && (
                    <span className="ml-4">
                      Processed: {new Date(request.processedAt).toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* Detail Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-bold">Deposit Request Details</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedRequest(null)}
              >
                <XCircle className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Request ID</label>
                  <p className="font-semibold">{selectedRequest.id}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">User Email</label>
                  <p className="font-semibold">{selectedRequest.userEmail}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Amount</label>
                  <p className="font-semibold">{selectedRequest.amount} USDT</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Network</label>
                  <p className="font-semibold">{selectedRequest.network}</p>
                </div>
              </div>
              
              {selectedRequest.transactionHash && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Transaction Hash</label>
                  <p className="font-mono text-sm break-all">{selectedRequest.transactionHash}</p>
                </div>
              )}
              
              {selectedRequest.notes && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Notes</label>
                  <p className="text-sm">{selectedRequest.notes}</p>
                </div>
              )}
              
              {selectedRequest.proofFile && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Payment Proof</label>
                  <div className="flex items-center gap-2 mt-2">
                    <FileText className="w-4 h-4 text-blue-400" />
                    <span className="text-sm">{selectedRequest.proofFile.name}</span>
                    <Button variant="outline" size="sm">
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                  </div>
                  {selectedRequest.proofPreview && (
                    <img 
                      src={selectedRequest.proofPreview} 
                      alt="Proof preview" 
                      className="mt-2 max-w-xs rounded"
                    />
                  )}
                </div>
              )}
              
              <div className="text-sm text-muted-foreground">
                <p>Created: {new Date(selectedRequest.createdAt).toLocaleString()}</p>
                {selectedRequest.processedAt && (
                  <p>Processed: {new Date(selectedRequest.processedAt).toLocaleString()}</p>
                )}
                {selectedRequest.processedBy && (
                  <p>Processed by: {selectedRequest.processedBy}</p>
                )}
              </div>
              
              {selectedRequest.status === 'pending' && (
                <div className="flex gap-2 pt-4">
                  <Button
                    onClick={() => handleApproveDeposit(selectedRequest.id)}
                    disabled={isProcessing}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Approve Deposit
                  </Button>
                  <Button
                    onClick={() => handleRejectDeposit(selectedRequest.id, 'Rejected by admin')}
                    disabled={isProcessing}
                    variant="destructive"
                    className="flex-1"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Reject Deposit
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDepositManager; 