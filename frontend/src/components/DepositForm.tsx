import { useState, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Upload, X, CheckCircle } from 'lucide-react';

interface DepositOption {
  label: string;
  network: string;
  address: string;
}

interface DepositFormProps {
  depositAddresses: DepositOption[];
}

const DepositForm = ({ depositAddresses }: DepositFormProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedOption, setSelectedOption] = useState<DepositOption | null>(null);
  const [amount, setAmount] = useState('');
  const [transactionHash, setTransactionHash] = useState('');
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          variant: "destructive",
          title: "File too large",
          description: "Please select a file smaller than 5MB."
        });
        return;
      }

      if (!file.type.startsWith('image/')) {
        toast({
          variant: "destructive",
          title: "Invalid file type",
          description: "Please select an image file."
        });
        return;
      }

      setProofFile(file);
      
      // Create preview URL
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const removeFile = () => {
    setProofFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const uploadProofImage = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${user?.id}/${Date.now()}.${fileExt}`;
    
    const { error } = await supabase.storage
      .from('deposit-proofs')
      .upload(fileName, file);

    if (error) {
      throw error;
    }

    const { data } = supabase.storage
      .from('deposit-proofs')
      .getPublicUrl(fileName);

    return data.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        variant: "destructive",
        title: "Authentication required",
        description: "Please log in to submit a deposit."
      });
      return;
    }

    if (!selectedOption || !amount || !proofFile) {
      toast({
        variant: "destructive",
        title: "Missing information",
        description: "Please fill in all required fields and upload proof."
      });
      return;
    }

    if (isNaN(Number(amount)) || Number(amount) <= 0) {
      toast({
        variant: "destructive",
        title: "Invalid amount",
        description: "Please enter a valid amount."
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Upload proof image
      const proofImageUrl = await uploadProofImage(proofFile);

      // Submit deposit record
      const { error } = await supabase
        .from('deposits')
        .insert({
          user_id: user.id,
          currency: selectedOption.label,
          network: selectedOption.network,
          amount: Number(amount),
          deposit_address: selectedOption.address,
          transaction_hash: transactionHash || null,
          proof_image_url: proofImageUrl
        });

      if (error) {
        throw error;
      }

      toast({
        title: "Deposit submitted successfully!",
        description: "Your deposit proof has been submitted for review. You'll be notified once it's processed.",
      });

      // Reset form
      setSelectedOption(null);
      setAmount('');
      setTransactionHash('');
      removeFile();
      setIsOpen(false);

    } catch (error: any) {
      console.error('Deposit submission error:', error);
      toast({
        variant: "destructive",
        title: "Submission failed",
        description: error.message || "Failed to submit deposit. Please try again."
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="kucoin-btn-primary w-full">
          <Upload className="w-4 h-4 mr-2" />
          Submit Deposit Proof
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Submit Deposit Proof</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="deposit-option">Deposit Address</Label>
            <Select onValueChange={(value) => {
              const option = depositAddresses.find((_, index) => index.toString() === value);
              setSelectedOption(option || null);
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Select deposit address" />
              </SelectTrigger>
              <SelectContent>
                {depositAddresses.map((option, index) => (
                  <SelectItem key={index} value={index.toString()}>
                    {option.label} ({option.network})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedOption && (
            <div className="p-3 bg-muted/50 rounded border">
              <Label className="text-xs text-muted-foreground">Deposit Address:</Label>
              <p className="text-sm font-mono break-all">{selectedOption.address}</p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="amount">Amount Deposited</Label>
            <Input
              id="amount"
              type="number"
              step="0.00000001"
              placeholder="Enter amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="transaction-hash">Transaction Hash (Optional)</Label>
            <Input
              id="transaction-hash"
              type="text"
              placeholder="Enter transaction hash"
              value={transactionHash}
              onChange={(e) => setTransactionHash(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Deposit Proof Screenshot *</Label>
            <div className="border-2 border-dashed border-border rounded-lg p-4">
              {!proofFile ? (
                <div className="text-center">
                  <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground mb-2">
                    Upload a screenshot of your deposit transaction
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Choose File
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Max file size: 5MB
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-sm font-medium">{proofFile.name}</span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={removeFile}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  {previewUrl && (
                    <img
                      src={previewUrl}
                      alt="Proof preview"
                      className="w-full h-32 object-cover rounded"
                    />
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !selectedOption || !amount || !proofFile}
              className="flex-1 kucoin-btn-primary"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Proof'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default DepositForm;