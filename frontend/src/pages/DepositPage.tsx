import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Download, 
  Copy, 
  QrCode, 
  CheckCircle, 
  AlertCircle, 
  ArrowLeft,
  ExternalLink,
  RefreshCw,
  Eye,
  EyeOff,
  Upload,
  FileText,
  X,
  Send
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import walletService from "@/services/walletService";

interface DepositRequest {
  amount: string;
  network: string;
  transactionHash?: string;
  notes?: string;
  proofFile?: File;
  proofPreview?: string;
}

interface DepositStats {
  totalDeposits24h: number;
  pendingDeposits: number;
  averageTime: string;
}

interface RecentDeposit {
  amount: string;
  symbol: string;
  time: string;
  status: string;
}

const DepositPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLanguage();
  const { user } = useAuth();
  const [selectedCrypto, setSelectedCrypto] = useState("USDT");
  const [selectedNetwork, setSelectedNetwork] = useState("TRC20");
  const [showQR, setShowQR] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  const [depositRequest, setDepositRequest] = useState<DepositRequest>({
    amount: "",
    network: "TRC20",
    transactionHash: "",
    notes: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Real-time deposit data
  const [depositStats, setDepositStats] = useState<DepositStats>({
    totalDeposits24h: 0,
    pendingDeposits: 0,
    averageTime: "~15 minutes"
  });
  const [recentDeposits, setRecentDeposits] = useState<RecentDeposit[]>([]);

  // USDT Network addresses - can be configured by admin
  const usdtNetworks = [
    { 
      name: "TRC20", 
      label: "TRC20 (Tron)", 
      address: "TXgmyWRAyuLfoJipSijEwjWJtApuMa4tYU",
      minDeposit: "10 USDT",
      confirmations: "20 confirmations",
      fee: "1 USDT"
    },
    { 
      name: "ERC20", 
      label: "ERC20 (Ethereum)", 
      address: "0xa32e2d5aa997affac06db8b17562577e25640970",
      minDeposit: "10 USDT",
      confirmations: "12 confirmations",
      fee: "5 USDT"
    },
    { 
      name: "BEP20", 
      label: "BEP20 (Binance Smart Chain)", 
      address: "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
      minDeposit: "10 USDT",
      confirmations: "15 confirmations",
      fee: "1 USDT"
    }
  ];

  const depositAddresses = [
    { 
      label: "Bitcoin", 
      symbol: "BTC", 
      network: "Bitcoin", 
      address: "1AWD2apeV7mZ9roEyUqyWzQkeQPaUdbzJX",
      minDeposit: "0.001 BTC",
      confirmations: "2 confirmations"
    },
    { 
      label: "Ethereum", 
      symbol: "ETH", 
      network: "ERC-20", 
      address: "0xa32e2d5aa997affac06db8b17562577e25640970",
      minDeposit: "0.01 ETH",
      confirmations: "12 confirmations"
    },
    { 
      label: "USDT", 
      symbol: "USDT", 
      network: "Multi-Network", 
      address: "TXgmyWRAyuLfoJipSijEwjWJtApuMa4tYU",
      minDeposit: "10 USDT",
      confirmations: "20 confirmations"
    }
  ];

  // Create unique cryptocurrencies for selection (no duplicates)
  const uniqueCryptocurrencies = [
    { symbol: "BTC", label: "Bitcoin" },
    { symbol: "ETH", label: "Ethereum" },
    { symbol: "USDT", label: "USDT" }
  ];

  const getSelectedAddress = () => {
    if (selectedCrypto === "USDT") {
      return usdtNetworks.find(network => network.name === selectedNetwork) || usdtNetworks[0];
    }
    return depositAddresses.find(addr => addr.symbol === selectedCrypto) || depositAddresses[0];
  };

  const getSelectedUSDTAddress = () => {
    return usdtNetworks.find(network => network.name === selectedNetwork) || usdtNetworks[0];
  };

  const getSelectedCryptoAddress = () => {
    return depositAddresses.find(addr => addr.symbol === selectedCrypto) || depositAddresses[0];
  };

  const copyToClipboard = (address: string, symbol: string) => {
    navigator.clipboard.writeText(address);
    setCopiedAddress(symbol);
    toast({
      title: "Address copied!",
      description: `${symbol} address copied to clipboard`,
    });
    setTimeout(() => setCopiedAddress(null), 2000);
  };

  const handleBack = () => {
    navigate('/wallet');
  };

  const generateQRCode = (address: string) => {
    // In a real app, you'd use a QR code library
    // For now, we'll simulate it
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(address)}`;
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
      if (!validTypes.includes(file.type)) {
        toast({
          title: "Invalid file type",
          description: "Please upload JPG, PNG, or PDF files only",
          variant: "destructive"
        });
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please upload files smaller than 5MB",
          variant: "destructive"
        });
        return;
      }

      // Create preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setDepositRequest(prev => ({
            ...prev,
            proofFile: file,
            proofPreview: e.target?.result as string
          }));
        };
        reader.readAsDataURL(file);
      } else {
        setDepositRequest(prev => ({
          ...prev,
          proofFile: file
        }));
      }

      toast({
        title: "File uploaded successfully",
        description: `${file.name} has been uploaded`,
      });
    }
  };

  const removeFile = () => {
    setDepositRequest(prev => ({
      ...prev,
      proofFile: undefined,
      proofPreview: undefined
    }));
  };

  const handleSubmitDeposit = async () => {
    // Validation
    if (!depositRequest.amount || parseFloat(depositRequest.amount) <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid deposit amount",
        variant: "destructive"
      });
      return;
    }

    if (selectedCrypto === "USDT" && !selectedNetwork) {
      toast({
        title: "Network required",
        description: "Please select a network for USDT deposit",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      toast({
        title: "Deposit request submitted",
        description: "Your deposit request has been submitted for review",
      });

      // Reset form
      setDepositRequest({
        amount: "",
        network: "TRC20",
        transactionHash: "",
        notes: ""
      });

    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit deposit request. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    const fetchDepositStats = async () => {
      try {
        const stats = await walletService.getDepositStats(user?.id);
        setDepositStats(stats);
      } catch (error) {
        console.error("Failed to fetch deposit stats:", error);
        toast({
          title: "Error fetching stats",
          description: "Could not load deposit statistics. Please try again.",
          variant: "destructive"
        });
      }
    };

    const fetchRecentDeposits = async () => {
      try {
        const deposits = await walletService.getRecentDeposits(user?.id);
        setRecentDeposits(deposits);
      } catch (error) {
        console.error("Failed to fetch recent deposits:", error);
        toast({
          title: "Error fetching recent deposits",
          description: "Could not load recent deposits. Please try again.",
          variant: "destructive"
        });
      }
    };

    fetchDepositStats();
    fetchRecentDeposits();
    const interval = setInterval(() => {
      fetchDepositStats();
      fetchRecentDeposits();
    }, 30000); // Poll every 30 seconds
    return () => clearInterval(interval);
  }, [user?.id]);

  return (
    <div className="min-h-screen bg-background pt-20">
      <div className="kucoin-container py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              onClick={handleBack}
              className="text-slate-400 hover:text-white"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Wallet
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-white">Deposit</h1>
              <p className="text-slate-400">Add funds to your wallet</p>
            </div>
          </div>
          <Button 
            variant="outline" 
            className="border-slate-600 text-slate-300 hover:bg-slate-700"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Deposit Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Crypto Selection */}
            <Card className="bg-slate-800/50 border-slate-700 p-6">
              <h2 className="text-xl font-bold mb-4 text-white">Select Cryptocurrency</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {uniqueCryptocurrencies.map((crypto, index) => (
                  <Button
                    key={index}
                    variant={selectedCrypto === crypto.symbol ? "default" : "outline"}
                    className={`h-16 flex-col ${
                      selectedCrypto === crypto.symbol 
                        ? "bg-blue-600 hover:bg-blue-700 text-white" 
                        : "border-slate-600 text-slate-300 hover:bg-slate-700"
                    }`}
                    onClick={() => setSelectedCrypto(crypto.symbol)}
                  >
                    <span className="font-bold text-lg">{crypto.symbol}</span>
                    <span className="text-xs opacity-80">{crypto.label}</span>
                  </Button>
                ))}
              </div>
            </Card>

            {/* Network Selection for USDT */}
            {selectedCrypto === "USDT" && (
              <Card className="bg-slate-800/50 border-slate-700 p-6">
                <h2 className="text-xl font-bold mb-4 text-white">Select Network</h2>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="network" className="text-white mb-2 block">Network</Label>
                    <Select value={selectedNetwork} onValueChange={setSelectedNetwork}>
                      <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                        <SelectValue placeholder="Select network" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-600">
                        {usdtNetworks.map((network) => (
                          <SelectItem key={network.name} value={network.name} className="text-white">
                            {network.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-3 bg-slate-700/50 rounded border border-slate-600">
                      <p className="text-sm text-slate-400">Network Fee</p>
                      <p className="font-semibold text-white">{getSelectedUSDTAddress().fee}</p>
                    </div>
                    <div className="p-3 bg-slate-700/50 rounded border border-slate-600">
                      <p className="text-sm text-slate-400">Min Deposit</p>
                      <p className="font-semibold text-white">{getSelectedUSDTAddress().minDeposit}</p>
                    </div>
                    <div className="p-3 bg-slate-700/50 rounded border border-slate-600">
                      <p className="text-sm text-slate-400">Confirmations</p>
                      <p className="font-semibold text-white">{getSelectedUSDTAddress().confirmations}</p>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* Deposit Address */}
            <Card className="bg-slate-800/50 border-slate-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white">Deposit Address</h2>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowQR(!showQR)}
                    className="border-slate-600 text-slate-300 hover:bg-slate-700"
                  >
                    {showQR ? <EyeOff className="w-4 h-4" /> : <QrCode className="w-4 h-4" />}
                    {showQR ? "Hide QR" : "Show QR"}
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-slate-700/50 rounded-lg border border-slate-600">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-400">
                      {selectedCrypto === "USDT" 
                        ? `${getSelectedUSDTAddress().label} (${getSelectedUSDTAddress().name})`
                        : `${getSelectedCryptoAddress().label} (${getSelectedCryptoAddress().network})`
                      }
                    </span>
                    <Badge className="bg-green-500/10 text-green-400 border-green-500/20">Active</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-mono text-white break-all">
                      {selectedCrypto === "USDT" 
                        ? getSelectedUSDTAddress().address 
                        : getSelectedCryptoAddress().address
                      }
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard(
                        selectedCrypto === "USDT" 
                          ? getSelectedUSDTAddress().address 
                          : getSelectedCryptoAddress().address, 
                        selectedCrypto
                      )}
                      className="text-slate-400 hover:text-white hover:bg-slate-700"
                    >
                      {copiedAddress === selectedCrypto ? (
                        <CheckCircle className="w-4 h-4 text-green-400" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>

                {showQR && (
                  <div className="flex justify-center p-6 bg-white rounded-lg">
                    <img 
                      src={generateQRCode(
                        selectedCrypto === "USDT" 
                          ? getSelectedUSDTAddress().address 
                          : getSelectedCryptoAddress().address
                      )} 
                      alt="QR Code" 
                      className="w-48 h-48"
                    />
                  </div>
                )}
              </div>
            </Card>

            {/* Deposit Request Form */}
            <Card className="bg-slate-800/50 border-slate-700 p-6">
              <h2 className="text-xl font-bold mb-4 text-white">Submit Deposit Request</h2>
              <div className="space-y-4">
                {/* Amount Input */}
                <div>
                  <Label htmlFor="amount" className="text-white mb-2 block">Amount ({selectedCrypto})</Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="Enter amount"
                    value={depositRequest.amount}
                    onChange={(e) => setDepositRequest(prev => ({ ...prev, amount: e.target.value }))}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>

                {/* Transaction Hash */}
                <div>
                  <Label htmlFor="transactionHash" className="text-white mb-2 block">Transaction Hash (Optional)</Label>
                  <Input
                    id="transactionHash"
                    placeholder="Enter transaction hash"
                    value={depositRequest.transactionHash}
                    onChange={(e) => setDepositRequest(prev => ({ ...prev, transactionHash: e.target.value }))}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>

                {/* Payment Proof Upload */}
                <div>
                  <Label htmlFor="proof" className="text-white mb-2 block">Upload Payment Proof</Label>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => document.getElementById('proof')?.click()}
                        className="border-slate-600 text-slate-300 hover:bg-slate-700"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Choose File
                      </Button>
                      <span className="text-sm text-slate-400">JPG, PNG, or PDF (max 5MB)</span>
                    </div>
                    <input
                      id="proof"
                      type="file"
                      accept=".jpg,.jpeg,.png,.pdf"
                      onChange={handleFileUpload}
                      className="hidden"
                      aria-label="Upload proof file"
                      title="Upload proof file"
                    />
                    
                    {depositRequest.proofFile && (
                      <div className="p-3 bg-slate-700/50 rounded border border-slate-600">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-blue-400" />
                            <span className="text-sm text-white">{depositRequest.proofFile.name}</span>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={removeFile}
                            className="text-red-400 hover:text-red-300"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                        {depositRequest.proofPreview && (
                          <img 
                            src={depositRequest.proofPreview} 
                            alt="Proof preview" 
                            className="mt-2 max-w-xs rounded"
                          />
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <Label htmlFor="notes" className="text-white mb-2 block">Additional Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    placeholder="Add any additional information..."
                    value={depositRequest.notes}
                    onChange={(e) => setDepositRequest(prev => ({ ...prev, notes: e.target.value }))}
                    className="bg-slate-700 border-slate-600 text-white"
                    rows={3}
                  />
                </div>

                {/* Submit Button */}
                <Button
                  onClick={handleSubmitDeposit}
                  disabled={isSubmitting || !depositRequest.amount}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Submit Deposit Request
                    </>
                  )}
                </Button>
              </div>
            </Card>

            {/* Important Notes */}
            <Card className="bg-slate-800/50 border-slate-700 p-6">
              <h3 className="text-lg font-semibold mb-4 text-white flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-yellow-400" />
                Important Notes
              </h3>
              <div className="space-y-3 text-sm text-slate-300">
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2 flex-shrink-0"></div>
                  <p>Only send {selectedCrypto} to this address. Sending other cryptocurrencies may result in permanent loss.</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2 flex-shrink-0"></div>
                  <p>Deposits will be credited after {selectedCrypto === "USDT" 
                    ? getSelectedUSDTAddress().confirmations 
                    : getSelectedCryptoAddress().confirmations}.</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2 flex-shrink-0"></div>
                  <p>Minimum deposit amount: {selectedCrypto === "USDT" 
                    ? getSelectedUSDTAddress().minDeposit 
                    : getSelectedCryptoAddress().minDeposit}</p>
                </div>
                {selectedCrypto === "USDT" && (
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2 flex-shrink-0"></div>
                    <p>Make sure the network matches your selected network type ({selectedNetwork}).</p>
                  </div>
                )}
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2 flex-shrink-0"></div>
                  <p>Double-check the address before sending your funds.</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2 flex-shrink-0"></div>
                  <p>Upload the payment receipt or transaction hash for verification.</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <Card className="bg-slate-800/50 border-slate-700 p-6">
              <h3 className="text-lg font-semibold mb-4 text-white">Deposit Stats</h3>
              <div className="space-y-4">
                <div className="p-3 bg-green-500/10 rounded border border-green-500/20">
                  <p className="text-sm text-slate-400">Total Deposits (24h)</p>
                  <p className="text-xl font-bold text-green-400">${depositStats.totalDeposits24h.toFixed(2)}</p>
                </div>
                <div className="p-3 bg-blue-500/10 rounded border border-blue-500/20">
                  <p className="text-sm text-slate-400">Pending Deposits</p>
                  <p className="text-xl font-bold text-blue-400">${depositStats.pendingDeposits.toFixed(2)}</p>
                </div>
                <div className="p-3 bg-yellow-500/10 rounded border border-yellow-500/20">
                  <p className="text-sm text-slate-400">Average Time</p>
                  <p className="text-xl font-bold text-yellow-400">{depositStats.averageTime}</p>
                </div>
              </div>
            </Card>

            {/* Recent Deposits */}
            <Card className="bg-slate-800/50 border-slate-700 p-6">
              <h3 className="text-lg font-semibold mb-4 text-white">Recent Deposits</h3>
              <div className="space-y-3">
                {recentDeposits.map((deposit, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border border-slate-700 rounded hover:bg-slate-700/50 transition-colors">
                    <div>
                      <p className="font-medium text-white">{deposit.amount} {deposit.symbol}</p>
                      <p className="text-sm text-slate-400">{deposit.time}</p>
                    </div>
                    <Badge className={
                      deposit.status === 'Completed' 
                        ? 'bg-green-500/10 text-green-400' 
                        : 'bg-yellow-500/10 text-yellow-400'
                    }>
                      {deposit.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </Card>

            {/* Support */}
            <Card className="bg-slate-800/50 border-slate-700 p-6">
              <h3 className="text-lg font-semibold mb-4 text-white">Need Help?</h3>
              <div className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View Deposit Guide
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Contact Support
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DepositPage; 