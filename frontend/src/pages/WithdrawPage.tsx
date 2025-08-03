import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Send, 
  Copy, 
  AlertCircle, 
  ArrowLeft,
  ExternalLink,
  RefreshCw,
  CheckCircle,
  X,
  Info,
  Shield
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const WithdrawPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedCrypto, setSelectedCrypto] = useState("USDT");
  const [amount, setAmount] = useState("");
  const [address, setAddress] = useState("");
  const [tag, setTag] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const walletBalances = [
    { symbol: "USDT", name: "Tether", balance: "15,420.50", usdValue: "$15,420.50", available: "15,320.50" }
  ];

  const withdrawalFees = {
    USDT: { fee: "1", minWithdraw: "10", maxWithdraw: "100000" }
  };

  const getSelectedBalance = () => {
    return walletBalances.find(balance => balance.symbol === selectedCrypto) || walletBalances[0];
  };

  const getSelectedFees = () => {
    return withdrawalFees[selectedCrypto as keyof typeof withdrawalFees] || withdrawalFees.USDT;
  };

  const handleBack = () => {
    navigate('/wallet');
  };

  const handleMaxAmount = () => {
    const balance = getSelectedBalance();
    const fees = getSelectedFees();
    const maxAmount = parseFloat(balance.available) - parseFloat(fees.fee);
    setAmount(maxAmount.toString());
  };

  const validateForm = () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid withdrawal amount",
        variant: "destructive"
      });
      return false;
    }

    if (!address.trim()) {
      toast({
        title: "Address Required",
        description: "Please enter a valid withdrawal address",
        variant: "destructive"
      });
      return false;
    }

    // Check if trying to withdraw non-USDT assets
    if (selectedCrypto !== "USDT") {
      toast({
        title: "Conversion Required",
        description: "Please convert your assets to USDT and transfer to your Funding Account before withdrawing.",
        variant: "destructive"
      });
      return false;
    }

    const fees = getSelectedFees();
    const numAmount = parseFloat(amount);
    const numMin = parseFloat(fees.minWithdraw);
    const numMax = parseFloat(fees.maxWithdraw);

    if (numAmount < numMin) {
      toast({
        title: "Amount Too Small",
        description: `Minimum withdrawal amount is ${fees.minWithdraw} ${selectedCrypto}`,
        variant: "destructive"
      });
      return false;
    }

    if (numAmount > numMax) {
      toast({
        title: "Amount Too Large",
        description: `Maximum withdrawal amount is ${fees.maxWithdraw} ${selectedCrypto}`,
        variant: "destructive"
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      toast({
        title: "Withdrawal Submitted",
        description: "Your withdrawal request has been submitted successfully",
      });
      setIsSubmitting(false);
      setShowConfirmation(true);
      
      // Reset form after confirmation
      setTimeout(() => {
        setAmount("");
        setAddress("");
        setTag("");
        setShowConfirmation(false);
      }, 3000);
    }, 2000);
  };

  const recentWithdrawals = [
    { symbol: "BTC", amount: "0.05", status: "Completed", time: "2 hours ago" },
    { symbol: "ETH", amount: "1.2", status: "Processing", time: "5 hours ago" },
    { symbol: "USDT", amount: "500", status: "Pending", time: "1 day ago" }
  ];

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
              <h1 className="text-3xl font-bold text-white">Withdraw</h1>
              <p className="text-slate-400">Withdraw funds from your wallet</p>
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
          {/* Main Withdrawal Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Asset Selection */}
            <Card className="bg-slate-800/50 border-slate-700 p-6">
              <h2 className="text-xl font-bold mb-4 text-white">Select Asset</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {walletBalances.map((balance, index) => (
                  <Button
                    key={index}
                    variant={selectedCrypto === balance.symbol ? "default" : "outline"}
                    className={`h-20 flex-col ${
                      selectedCrypto === balance.symbol 
                        ? "bg-blue-600 hover:bg-blue-700 text-white" 
                        : "border-slate-600 text-slate-300 hover:bg-slate-700"
                    }`}
                    onClick={() => setSelectedCrypto(balance.symbol)}
                  >
                    <span className="font-bold text-lg">{balance.symbol}</span>
                    <span className="text-xs opacity-80">{balance.available} {balance.symbol}</span>
                    <span className="text-xs opacity-60">${balance.usdValue}</span>
                  </Button>
                ))}
              </div>
            </Card>

            {/* Withdrawal Form */}
            <Card className="bg-slate-800/50 border-slate-700 p-6">
              <h2 className="text-xl font-bold mb-4 text-white">Withdrawal Details</h2>
              
              <div className="space-y-4">
                {/* Amount */}
                <div>
                  <Label htmlFor="amount" className="text-sm font-medium text-slate-300">
                    Amount ({selectedCrypto})
                  </Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      id="amount"
                      type="number"
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                    <Button
                      variant="outline"
                      onClick={handleMaxAmount}
                      className="border-slate-600 text-slate-300 hover:bg-slate-700"
                    >
                      MAX
                    </Button>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Available: {getSelectedBalance().available} {selectedCrypto}
                  </p>
                </div>

                {/* Address */}
                <div>
                  <Label htmlFor="address" className="text-sm font-medium text-slate-300">
                    Withdrawal Address
                  </Label>
                  <Input
                    id="address"
                    placeholder={`Enter ${selectedCrypto} address`}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white mt-1"
                  />
                </div>

                {/* Tag/Memo (for XRP, XLM, etc.) */}
                {(selectedCrypto === "XRP" || selectedCrypto === "XLM") && (
                  <div>
                    <Label htmlFor="tag" className="text-sm font-medium text-slate-300">
                      Tag/Memo
                    </Label>
                    <Input
                      id="tag"
                      placeholder="Enter tag/memo (optional)"
                      value={tag}
                      onChange={(e) => setTag(e.target.value)}
                      className="bg-slate-700 border-slate-600 text-white mt-1"
                    />
                  </div>
                )}

                {/* Fee Information */}
                <div className="p-4 bg-slate-700/50 rounded-lg border border-slate-600">
                  <h3 className="text-sm font-medium text-slate-300 mb-2">Fee Information</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-slate-400">Network Fee</p>
                      <p className="font-semibold text-white">{getSelectedFees().fee} {selectedCrypto}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">You'll Receive</p>
                      <p className="font-semibold text-green-400">
                        {amount && parseFloat(amount) > 0 
                          ? (parseFloat(amount) - parseFloat(getSelectedFees().fee)).toFixed(6)
                          : "0.000000"
                        } {selectedCrypto}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting || !amount || !address}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Submit Withdrawal
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
                  <p>Double-check the withdrawal address before submitting.</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2 flex-shrink-0"></div>
                  <p>Withdrawals are processed within 24 hours for security verification.</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2 flex-shrink-0"></div>
                  <p>Network fees are deducted from your withdrawal amount.</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2 flex-shrink-0"></div>
                  <p>Minimum withdrawal: {getSelectedFees().minWithdraw} {selectedCrypto}</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <Card className="bg-slate-800/50 border-slate-700 p-6">
              <h3 className="text-lg font-semibold mb-4 text-white">Withdrawal Stats</h3>
              <div className="space-y-4">
                <div className="p-3 bg-blue-500/10 rounded border border-blue-500/20">
                  <p className="text-sm text-slate-400">Total Withdrawals (24h)</p>
                  <p className="text-xl font-bold text-blue-400">$8,450.67</p>
                </div>
                <div className="p-3 bg-yellow-500/10 rounded border border-yellow-500/20">
                  <p className="text-sm text-slate-400">Pending Withdrawals</p>
                  <p className="text-xl font-bold text-yellow-400">$1,340.00</p>
                </div>
                <div className="p-3 bg-green-500/10 rounded border border-green-500/20">
                  <p className="text-sm text-slate-400">Average Time</p>
                  <p className="text-xl font-bold text-green-400">~2 hours</p>
                </div>
              </div>
            </Card>

            {/* Recent Withdrawals */}
            <Card className="bg-slate-800/50 border-slate-700 p-6">
              <h3 className="text-lg font-semibold mb-4 text-white">Recent Withdrawals</h3>
              <div className="space-y-3">
                {recentWithdrawals.map((withdrawal, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border border-slate-700 rounded hover:bg-slate-700/50 transition-colors">
                    <div>
                      <p className="font-medium text-white">{withdrawal.amount} {withdrawal.symbol}</p>
                      <p className="text-sm text-slate-400">{withdrawal.time}</p>
                    </div>
                    <Badge className={
                      withdrawal.status === 'Completed' 
                        ? 'bg-green-500/10 text-green-400' 
                        : withdrawal.status === 'Processing'
                        ? 'bg-blue-500/10 text-blue-400'
                        : 'bg-yellow-500/10 text-yellow-400'
                    }>
                      {withdrawal.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </Card>

            {/* Security */}
            <Card className="bg-slate-800/50 border-slate-700 p-6">
              <h3 className="text-lg font-semibold mb-4 text-white flex items-center gap-2">
                <Shield className="w-5 h-5 text-green-400" />
                Security
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="text-sm text-slate-300">2FA Enabled</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="text-sm text-slate-300">Email Verification</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="text-sm text-slate-300">Withdrawal Whitelist</span>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Confirmation Modal */}
        {showConfirmation && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="bg-slate-800 border-slate-700 p-6 max-w-md w-full mx-4">
              <div className="text-center">
                <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">Withdrawal Submitted!</h3>
                <p className="text-slate-400 mb-4">
                  Your withdrawal request has been submitted successfully. You'll receive a confirmation email shortly.
                </p>
                <Button
                  onClick={() => setShowConfirmation(false)}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  OK
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default WithdrawPage; 