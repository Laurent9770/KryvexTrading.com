import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import supabaseWalletService from '@/services/supabaseWalletService';
import { Wallet, AlertCircle, CheckCircle } from 'lucide-react';

interface WithdrawalRequestFormProps {
  onRequestSubmitted?: () => void;
}

const WithdrawalRequestForm: React.FC<WithdrawalRequestFormProps> = ({ onRequestSubmitted }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    amount: '',
    asset: 'USDT',
    blockchain: 'TRC20',
    walletAddress: '',
    remarks: ''
  });

  const { user } = useAuth();
  const { toast } = useToast();

  const assetOptions = [
    { value: 'USDT', label: 'USDT (Tether)', blockchains: ['TRC20', 'ERC20', 'BEP20'] },
    { value: 'BTC', label: 'Bitcoin', blockchains: ['Bitcoin'] },
    { value: 'ETH', label: 'Ethereum', blockchains: ['Ethereum'] },
    { value: 'SOL', label: 'Solana', blockchains: ['Solana'] },
    { value: 'ADA', label: 'Cardano', blockchains: ['Cardano'] }
  ];

  const blockchainOptions = assetOptions
    .find(asset => asset.value === formData.asset)?.blockchains || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        variant: "destructive",
        title: "Authentication Required",
        description: "Please log in to submit withdrawal requests."
      });
      return;
    }

    const amount = parseFloat(formData.amount);
    if (!amount || amount <= 0) {
      toast({
        variant: "destructive",
        title: "Invalid Amount",
        description: "Please enter a valid amount greater than 0."
      });
      return;
    }

    if (!formData.walletAddress.trim()) {
      toast({
        variant: "destructive",
        title: "Wallet Address Required",
        description: "Please enter a valid wallet address."
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const request = await supabaseWalletService.createWithdrawalRequest(
        user.id,
        user.username || user.email.split('@')[0],
        user.email,
        amount,
        formData.asset,
        formData.blockchain,
        formData.walletAddress.trim(),
        formData.remarks.trim() || undefined
      );

      toast({
        title: "Withdrawal Request Submitted",
        description: `Your ${formData.asset} withdrawal request has been submitted and is pending admin approval.`
      });

      // Reset form
      setFormData({
        amount: '',
        asset: 'USDT',
        blockchain: 'TRC20',
        walletAddress: '',
        remarks: ''
      });

      onRequestSubmitted?.();
    } catch (error) {
      console.error('Error submitting withdrawal request:', error);
      toast({
        variant: "destructive",
        title: "Submission Failed",
        description: "Failed to submit withdrawal request. Please try again."
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAssetChange = (asset: string) => {
    setFormData(prev => ({
      ...prev,
      asset,
      blockchain: assetOptions.find(a => a.value === asset)?.blockchains[0] || ''
    }));
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="w-5 h-5" />
          Withdrawal Request
        </CardTitle>
        <CardDescription>
          Submit a withdrawal request. All requests are reviewed by our admin team for security.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              placeholder="Enter withdrawal amount"
              value={formData.amount}
              onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
              required
            />
          </div>

          {/* Asset Selection */}
          <div className="space-y-2">
            <Label htmlFor="asset">Asset</Label>
            <Select value={formData.asset} onValueChange={handleAssetChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select asset" />
              </SelectTrigger>
              <SelectContent>
                {assetOptions.map((asset) => (
                  <SelectItem key={asset.value} value={asset.value}>
                    {asset.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Blockchain Selection */}
          <div className="space-y-2">
            <Label htmlFor="blockchain">Blockchain Network</Label>
            <Select 
              value={formData.blockchain} 
              onValueChange={(blockchain) => setFormData(prev => ({ ...prev, blockchain }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select blockchain" />
              </SelectTrigger>
              <SelectContent>
                {blockchainOptions.map((blockchain) => (
                  <SelectItem key={blockchain} value={blockchain}>
                    {blockchain}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Wallet Address */}
          <div className="space-y-2">
            <Label htmlFor="walletAddress">Wallet Address</Label>
            <Input
              id="walletAddress"
              placeholder={`Enter your ${formData.blockchain} wallet address`}
              value={formData.walletAddress}
              onChange={(e) => setFormData(prev => ({ ...prev, walletAddress: e.target.value }))}
              required
            />
            <p className="text-xs text-muted-foreground">
              Make sure to use the correct {formData.blockchain} network address for {formData.asset}
            </p>
          </div>

          {/* Remarks */}
          <div className="space-y-2">
            <Label htmlFor="remarks">Remarks (Optional)</Label>
            <Textarea
              id="remarks"
              placeholder="Any additional information for the admin team"
              value={formData.remarks}
              onChange={(e) => setFormData(prev => ({ ...prev, remarks: e.target.value }))}
              rows={3}
            />
          </div>

          {/* Security Notice */}
          <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-amber-800 dark:text-amber-200 mb-1">
                  Security Notice
                </p>
                <ul className="text-amber-700 dark:text-amber-300 space-y-1">
                  <li>• Double-check your wallet address before submitting</li>
                  <li>• Ensure you're using the correct blockchain network</li>
                  <li>• Withdrawal requests are processed within 24-48 hours</li>
                  <li>• Minimum withdrawal amount may apply</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <Button 
            type="submit" 
            className="w-full" 
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Submitting Request...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Submit Withdrawal Request
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default WithdrawalRequestForm; 