import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Copy,
  QrCode,
  ExternalLink,
  Clock,
  Shield,
  DollarSign,
  Network,
  Smartphone,
  Monitor
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const DepositGuidePage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("general");

  const handleBack = () => {
    navigate('/deposit');
  };

  const openSmartsuppChat = () => {
    // Open Smartsupp chat in new window
    const chatUrl = 'https://www.smartsupp.com/chat/67805a30e60ab37fa695869a4b94967b14e41dbb';
    window.open(chatUrl, '_blank', 'width=400,height=600');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Text copied to clipboard",
    });
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            onClick={handleBack}
            className="text-slate-400 hover:text-white"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Deposit
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-white">Deposit Guide</h1>
            <p className="text-slate-400 mt-2">Complete guide to depositing funds to your Kryvex account</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4 bg-slate-800">
                <TabsTrigger value="general" className="text-slate-300">General</TabsTrigger>
                <TabsTrigger value="usdt" className="text-slate-300">USDT</TabsTrigger>
                <TabsTrigger value="btc" className="text-slate-300">Bitcoin</TabsTrigger>
                <TabsTrigger value="eth" className="text-slate-300">Ethereum</TabsTrigger>
              </TabsList>

              {/* General Guide */}
              <TabsContent value="general" className="space-y-6">
                <Card className="bg-slate-800/50 border-slate-700 p-6">
                  <h2 className="text-xl font-semibold mb-4 text-white flex items-center gap-2">
                    <Shield className="w-5 h-5 text-blue-400" />
                    Security First
                  </h2>
                  <div className="space-y-4 text-slate-300">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-white">Always verify the address</p>
                        <p className="text-sm">Double-check the deposit address before sending funds</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-white">Use the correct network</p>
                        <p className="text-sm">Ensure you're using the right blockchain network for your cryptocurrency</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-white">Keep transaction details</p>
                        <p className="text-sm">Save your transaction hash for verification purposes</p>
                      </div>
                    </div>
                  </div>
                </Card>

                <Card className="bg-slate-800/50 border-slate-700 p-6">
                  <h2 className="text-xl font-semibold mb-4 text-white flex items-center gap-2">
                    <Clock className="w-5 h-5 text-yellow-400" />
                    Processing Times
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-green-500/10 rounded border border-green-500/20">
                      <p className="text-sm text-slate-400">Bitcoin</p>
                      <p className="text-lg font-bold text-green-400">2 confirmations</p>
                      <p className="text-xs text-slate-400">~10-30 minutes</p>
                    </div>
                    <div className="p-4 bg-blue-500/10 rounded border border-blue-500/20">
                      <p className="text-sm text-slate-400">Ethereum</p>
                      <p className="text-lg font-bold text-blue-400">12 confirmations</p>
                      <p className="text-xs text-slate-400">~3-5 minutes</p>
                    </div>
                    <div className="p-4 bg-purple-500/10 rounded border border-purple-500/20">
                      <p className="text-sm text-slate-400">USDT</p>
                      <p className="text-lg font-bold text-purple-400">15-20 confirmations</p>
                      <p className="text-xs text-slate-400">~1-3 minutes</p>
                    </div>
                  </div>
                </Card>

                <Card className="bg-slate-800/50 border-slate-700 p-6">
                  <h2 className="text-xl font-semibold mb-4 text-white flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-green-400" />
                    Minimum Deposits
                  </h2>
                  <div className="space-y-3 text-slate-300">
                    <div className="flex justify-between items-center p-3 bg-slate-700/50 rounded">
                      <span>Bitcoin (BTC)</span>
                      <Badge className="bg-green-500/10 text-green-400">0.001 BTC</Badge>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-slate-700/50 rounded">
                      <span>Ethereum (ETH)</span>
                      <Badge className="bg-blue-500/10 text-blue-400">0.01 ETH</Badge>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-slate-700/50 rounded">
                      <span>USDT (All Networks)</span>
                      <Badge className="bg-purple-500/10 text-purple-400">10 USDT</Badge>
                    </div>
                  </div>
                </Card>
              </TabsContent>

              {/* USDT Guide */}
              <TabsContent value="usdt" className="space-y-6">
                <Card className="bg-slate-800/50 border-slate-700 p-6">
                  <h2 className="text-xl font-semibold mb-4 text-white flex items-center gap-2">
                    <Network className="w-5 h-5 text-purple-400" />
                    USDT Network Guide
                  </h2>
                  <div className="space-y-4">
                    <div className="p-4 bg-purple-500/10 rounded border border-purple-500/20">
                      <h3 className="font-semibold text-white mb-2">TRC20 (Tron Network)</h3>
                      <div className="space-y-2 text-sm text-slate-300">
                        <p>• <strong>Fee:</strong> 1 USDT</p>
                        <p>• <strong>Confirmations:</strong> 20</p>
                        <p>• <strong>Speed:</strong> Fastest (1-3 minutes)</p>
                        <p>• <strong>Best for:</strong> Regular deposits</p>
                      </div>
                    </div>
                    <div className="p-4 bg-blue-500/10 rounded border border-blue-500/20">
                      <h3 className="font-semibold text-white mb-2">ERC20 (Ethereum Network)</h3>
                      <div className="space-y-2 text-sm text-slate-300">
                        <p>• <strong>Fee:</strong> 5 USDT</p>
                        <p>• <strong>Confirmations:</strong> 12</p>
                        <p>• <strong>Speed:</strong> Medium (3-5 minutes)</p>
                        <p>• <strong>Best for:</strong> High-value deposits</p>
                      </div>
                    </div>
                    <div className="p-4 bg-yellow-500/10 rounded border border-yellow-500/20">
                      <h3 className="font-semibold text-white mb-2">BEP20 (Binance Smart Chain)</h3>
                      <div className="space-y-2 text-sm text-slate-300">
                        <p>• <strong>Fee:</strong> 1 USDT</p>
                        <p>• <strong>Confirmations:</strong> 15</p>
                        <p>• <strong>Speed:</strong> Fast (2-4 minutes)</p>
                        <p>• <strong>Best for:</strong> Cost-effective deposits</p>
                      </div>
                    </div>
                  </div>
                </Card>

                <Card className="bg-slate-800/50 border-slate-700 p-6">
                  <h2 className="text-xl font-semibold mb-4 text-white flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-yellow-400" />
                    Important USDT Notes
                  </h2>
                  <div className="space-y-3 text-slate-300">
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2 flex-shrink-0"></div>
                      <p>Always select the correct network before sending USDT</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2 flex-shrink-0"></div>
                      <p>Sending USDT on the wrong network may result in permanent loss</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2 flex-shrink-0"></div>
                      <p>TRC20 is recommended for most users due to lower fees</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2 flex-shrink-0"></div>
                      <p>Keep your transaction hash for verification</p>
                    </div>
                  </div>
                </Card>
              </TabsContent>

              {/* Bitcoin Guide */}
              <TabsContent value="btc" className="space-y-6">
                <Card className="bg-slate-800/50 border-slate-700 p-6">
                  <h2 className="text-xl font-semibold mb-4 text-white flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-orange-400" />
                    Bitcoin Deposit Guide
                  </h2>
                  <div className="space-y-4 text-slate-300">
                    <div className="p-4 bg-orange-500/10 rounded border border-orange-500/20">
                      <h3 className="font-semibold text-white mb-2">Bitcoin Network</h3>
                      <div className="space-y-2 text-sm">
                        <p>• <strong>Fee:</strong> Variable (network dependent)</p>
                        <p>• <strong>Confirmations:</strong> 2</p>
                        <p>• <strong>Speed:</strong> 10-30 minutes</p>
                        <p>• <strong>Minimum:</strong> 0.001 BTC</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <h3 className="font-semibold text-white">Step-by-Step Process:</h3>
                      <ol className="list-decimal list-inside space-y-2 text-sm">
                        <li>Copy the Bitcoin deposit address from your deposit page</li>
                        <li>Open your Bitcoin wallet or exchange</li>
                        <li>Paste the address in the recipient field</li>
                        <li>Enter the amount you want to deposit (minimum 0.001 BTC)</li>
                        <li>Review the transaction details and fees</li>
                        <li>Confirm and send the transaction</li>
                        <li>Wait for 2 confirmations (usually 10-30 minutes)</li>
                        <li>Funds will be credited to your account automatically</li>
                      </ol>
                    </div>
                  </div>
                </Card>
              </TabsContent>

              {/* Ethereum Guide */}
              <TabsContent value="eth" className="space-y-6">
                <Card className="bg-slate-800/50 border-slate-700 p-6">
                  <h2 className="text-xl font-semibold mb-4 text-white flex items-center gap-2">
                    <Network className="w-5 h-5 text-blue-400" />
                    Ethereum Deposit Guide
                  </h2>
                  <div className="space-y-4 text-slate-300">
                    <div className="p-4 bg-blue-500/10 rounded border border-blue-500/20">
                      <h3 className="font-semibold text-white mb-2">Ethereum Network</h3>
                      <div className="space-y-2 text-sm">
                        <p>• <strong>Fee:</strong> Variable (gas fees)</p>
                        <p>• <strong>Confirmations:</strong> 12</p>
                        <p>• <strong>Speed:</strong> 3-5 minutes</p>
                        <p>• <strong>Minimum:</strong> 0.01 ETH</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <h3 className="font-semibold text-white">Step-by-Step Process:</h3>
                      <ol className="list-decimal list-inside space-y-2 text-sm">
                        <li>Copy the Ethereum deposit address from your deposit page</li>
                        <li>Open your Ethereum wallet (MetaMask, etc.)</li>
                        <li>Paste the address in the recipient field</li>
                        <li>Enter the amount you want to deposit (minimum 0.01 ETH)</li>
                        <li>Set appropriate gas fees for faster processing</li>
                        <li>Review and confirm the transaction</li>
                        <li>Wait for 12 confirmations (usually 3-5 minutes)</li>
                        <li>Funds will be credited to your account automatically</li>
                      </ol>
                    </div>
                  </div>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card className="bg-slate-800/50 border-slate-700 p-6">
              <h3 className="text-lg font-semibold mb-4 text-white">Quick Actions</h3>
              <div className="space-y-3">
                <Button 
                  onClick={() => navigate('/deposit')}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  <DollarSign className="w-4 h-4 mr-2" />
                  Go to Deposit Page
                </Button>
                <Button 
                  onClick={openSmartsuppChat}
                  variant="outline" 
                  className="w-full border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Contact Support
                </Button>
              </div>
            </Card>

            {/* Common Issues */}
            <Card className="bg-slate-800/50 border-slate-700 p-6">
              <h3 className="text-lg font-semibold mb-4 text-white">Common Issues</h3>
              <div className="space-y-3 text-sm text-slate-300">
                <div className="p-3 bg-red-500/10 rounded border border-red-500/20">
                  <p className="font-medium text-red-400">Wrong Network</p>
                  <p className="text-xs">Sending USDT on wrong network</p>
                </div>
                <div className="p-3 bg-yellow-500/10 rounded border border-yellow-500/20">
                  <p className="font-medium text-yellow-400">Low Amount</p>
                  <p className="text-xs">Below minimum deposit amount</p>
                </div>
                <div className="p-3 bg-blue-500/10 rounded border border-blue-500/20">
                  <p className="font-medium text-blue-400">Pending</p>
                  <p className="text-xs">Waiting for confirmations</p>
                </div>
              </div>
            </Card>

            {/* Support */}
            <Card className="bg-slate-800/50 border-slate-700 p-6">
              <h3 className="text-lg font-semibold mb-4 text-white">Need Help?</h3>
              <p className="text-sm text-slate-400 mb-4">
                If you're having trouble with deposits, our support team is here to help.
              </p>
              <Button 
                onClick={openSmartsuppChat}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Chat with Support
              </Button>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DepositGuidePage;
