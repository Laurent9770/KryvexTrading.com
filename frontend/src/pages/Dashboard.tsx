import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  TrendingUp, 
  DollarSign, 
  Wallet, 
  Clock,
  RefreshCw,
  Activity,
  BarChart3,
  Target,
  Shield,
  Mail,
  CheckCircle,
  AlertTriangle,
  X,
  Upload,
  Camera,
  Save,
  User,
  Calendar,
  Globe,
  CreditCard
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import supabaseTradingService from "@/services/supabaseTradingService";
import supabaseKYCService from "@/services/supabaseKYCService";

// KYC Interfaces
interface KYCLevel2Data {
  fullName: string;
  dateOfBirth: string;
  country: string;
  idType: 'passport' | 'drivers_license' | 'national_id';
  idNumber: string;
  frontFile?: File;
  backFile?: File;
  selfieFile?: File;
}

interface KYCStatus {
  level1: { status: 'unverified' | 'verified' | 'pending' };
  level2: { status: 'not_started' | 'pending' | 'approved' | 'rejected' };
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading, isAdmin } = useAuth();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState("overview");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tradingStats, setTradingStats] = useState({
    totalTrades: 0,
    wins: 0,
    losses: 0,
    netProfit: 0,
    winRate: 0
  });
  const [recentTrades, setRecentTrades] = useState<any[]>([]);
  const [portfolioData, setPortfolioData] = useState({
    totalBalance: 0,
    totalValue: 0,
    totalPnL: 0,
    pnlPercentage: 0
  });

  // KYC State
  const [kycStatus, setKycStatus] = useState<KYCStatus>({
    level1: { status: 'unverified' },
    level2: { status: 'not_started' }
  });
  const [identityData, setIdentityData] = useState<KYCLevel2Data>({
    fullName: '',
    dateOfBirth: '',
    country: '',
    idType: 'passport',
    idNumber: ''
  });
  const [filePreviews, setFilePreviews] = useState<{
    front?: string;
    back?: string;
    selfie?: string;
  }>({});
  const [isSubmittingKYC, setIsSubmittingKYC] = useState(false);

  const { 
    tradingAccount, 
    fundingAccount, 
    activityFeed, 
    tradingHistory, 
    portfolioStats,
    realTimePrices,
    updateTradingBalance,
    updateFundingBalance,
    addActivity,
    addTrade,
    updatePortfolioStats
  } = useAuth();

  // Load user data when authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      loadUserData();
      loadKYCStatus();
    }
  }, [isAuthenticated, user]);

  // Handle URL parameter for tab switching
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && ['overview', 'trading', 'portfolio', 'activity', 'kyc'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  // KYC Functions
  const loadKYCStatus = async () => {
    if (!user?.id) return;

    try {
      const { success, data } = await supabaseKYCService.getUserKYCStatus(user.id);
      if (success && data) {
        const newStatus: KYCStatus = {
          level1: { status: data.isVerified ? 'verified' : 'unverified' },
          level2: { status: data.status as 'not_started' | 'pending' | 'approved' | 'rejected' }
        };
        setKycStatus(newStatus);
      }
    } catch (error) {
      console.error('Error loading KYC status:', error);
    }
  };

  const handleFileUpload = (field: 'frontFile' | 'backFile' | 'selfieFile', file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setFilePreviews(prev => ({
        ...prev,
        [field.replace('File', '')]: e.target?.result as string
      }));
    };
    reader.readAsDataURL(file);

    setIdentityData(prev => ({
      ...prev,
      [field]: file
    }));
  };

  const removeFile = (field: 'frontFile' | 'backFile' | 'selfieFile') => {
    setFilePreviews(prev => ({
      ...prev,
      [field.replace('File', '')]: undefined
    }));

    setIdentityData(prev => ({
      ...prev,
      [field]: undefined
    }));
  };

  const handleSubmitIdentityVerification = async () => {
    if (!user?.id) return;

    // Validation
    if (!identityData.fullName || !identityData.dateOfBirth || !identityData.country || 
        !identityData.idNumber || !identityData.frontFile || !identityData.selfieFile) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields and upload required documents.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmittingKYC(true);

    try {
      const formData = new FormData();
      formData.append('fullName', identityData.fullName);
      formData.append('dateOfBirth', identityData.dateOfBirth);
      formData.append('country', identityData.country);
      formData.append('idType', identityData.idType);
      formData.append('idNumber', identityData.idNumber);
      
      if (identityData.frontFile) {
        formData.append('frontFile', identityData.frontFile);
      }
      if (identityData.backFile) {
        formData.append('backFile', identityData.backFile);
      }
      if (identityData.selfieFile) {
        formData.append('selfieFile', identityData.selfieFile);
      }

      const { success, data, error } = await supabaseKYCService.createKYCSubmission({
        fullName: identityData.fullName,
        dateOfBirth: identityData.dateOfBirth,
        country: identityData.country,
        idType: identityData.idType,
        idNumber: identityData.idNumber,
        frontFile: identityData.frontFile,
        backFile: identityData.backFile,
        selfieFile: identityData.selfieFile
      });

      if (success) {
        toast({
          title: "KYC Submitted Successfully",
          description: "Your identity verification has been submitted for review.",
        });
        
        // Reset form
        setIdentityData({
          fullName: '',
          dateOfBirth: '',
          country: '',
          idType: 'passport',
          idNumber: ''
        });
        setFilePreviews({});
        
        // Reload KYC status
        await loadKYCStatus();
      } else {
        toast({
          title: "KYC Submission Failed",
          description: error || "Failed to submit KYC verification. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error submitting KYC:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmittingKYC(false);
    }
  };

  const loadUserData = async () => {
    if (!user) return;

    setIsLoadingData(true);
    setError(null);

    try {
      // Load trading stats with error handling
      try {
        const { success: statsSuccess, stats } = await supabaseTradingService.getTradingStats(user.id);
        if (statsSuccess && stats) {
          setTradingStats({
            totalTrades: stats.totalTrades || 0,
            wins: stats.winningTrades || 0,
            losses: stats.losingTrades || 0,
            netProfit: stats.netProfit || 0,
            winRate: stats.winRate || 0
          });
        }
      } catch (statsError) {
        console.warn('Failed to load trading stats:', statsError);
        // Keep default values
      }

      // Load recent trades with error handling
      try {
        const { success: tradesSuccess, trades } = await supabaseTradingService.getRecentTrades(user.id, 10);
        if (tradesSuccess && trades && Array.isArray(trades)) {
          setRecentTrades(trades);
        } else {
          setRecentTrades([]);
        }
      } catch (tradesError) {
        console.warn('Failed to load recent trades:', tradesError);
        setRecentTrades([]);
      }

      // Load portfolio data with error handling
      try {
        const { success: portfolioSuccess, portfolio } = await supabaseTradingService.getPortfolioData(user.id);
        if (portfolioSuccess && portfolio) {
          setPortfolioData({
            totalBalance: portfolio.totalBalance || 0,
            totalValue: portfolio.totalValue || 0,
            totalPnL: portfolio.totalPnL || 0,
            pnlPercentage: portfolio.pnlPercentage || 0
          });
        }
      } catch (portfolioError) {
        console.warn('Failed to load portfolio data:', portfolioError);
        // Keep default values
      }

    } catch (error) {
      console.error('Error loading user data:', error);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await loadUserData();
      toast({
        title: "Dashboard refreshed",
        description: "Your dashboard data has been updated.",
      });
    } catch (error) {
      console.error('Error refreshing dashboard:', error);
      toast({
        title: "Refresh failed",
        description: "Failed to refresh dashboard data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleViewDetails = (activity: any) => {
    if (!activity || !activity.id) {
      console.warn('Invalid activity data:', activity);
      return;
    }
    
    try {
      navigate(`/trading-history/${activity.id}`);
    } catch (error) {
      console.error('Error navigating to activity details:', error);
    }
  };

  // Safe data access helpers
  const safeArray = (data: any): any[] => {
    return Array.isArray(data) ? data : [];
  };

  const safeNumber = (value: any): number => {
    return typeof value === 'number' && !isNaN(value) ? value : 0;
  };

  const safeString = (value: any): string => {
    return typeof value === 'string' ? value : '';
  };

  // Get safe data from auth context
  const safeTradingAccount = tradingAccount || {};
  const safeFundingAccount = fundingAccount || {};
  const safeActivityFeed = safeArray(activityFeed);
  const safeTradingHistory = safeArray(tradingHistory);
  const safePortfolioStats = portfolioStats || {};
  const safeRealTimePrices = realTimePrices || {};







  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Welcome back, {safeString(user?.email || 'User')}!
            </h1>
            <p className="text-muted-foreground mt-1">
              Here's what's happening with your trading account
            </p>
          </div>
          <Button 
            onClick={handleRefresh} 
            disabled={isRefreshing}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="trading">Trading</TabsTrigger>
            <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="kyc">KYC Verification</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Balance</p>
                    <p className="text-2xl font-bold text-foreground">
                      ${safeNumber(safeTradingAccount.balance || 0).toFixed(2)}
                    </p>
                  </div>
                  <Wallet className="h-8 w-8 text-primary" />
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Trades</p>
                    <p className="text-2xl font-bold text-foreground">
                      {safeNumber(tradingStats.totalTrades)}
                    </p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-primary" />
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Win Rate</p>
                    <p className="text-2xl font-bold text-foreground">
                      {safeNumber(tradingStats.winRate).toFixed(1)}%
                    </p>
                  </div>
                  <Target className="h-8 w-8 text-primary" />
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Net Profit</p>
                    <p className={`text-2xl font-bold ${safeNumber(tradingStats.netProfit) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ${safeNumber(tradingStats.netProfit).toFixed(2)}
                    </p>
                  </div>
                  <DollarSign className="h-8 w-8 text-primary" />
                </div>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground">Recent Activity</h3>
                <Button variant="outline" size="sm" onClick={() => setActiveTab("activity")}>
                  View All
                </Button>
              </div>
              <div className="space-y-3">
                {safeActivityFeed.slice(0, 5).map((activity, index) => (
                  <div key={activity?.id || index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                      <span className="text-sm text-foreground">
                        {safeString(activity?.description || 'Activity')}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {activity?.timestamp ? new Date(activity.timestamp).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                ))}
                {safeActivityFeed.length === 0 && (
                  <p className="text-center text-muted-foreground py-4">No recent activity</p>
                )}
              </div>
            </Card>
          </TabsContent>

          {/* Trading Tab */}
          <TabsContent value="trading" className="space-y-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Recent Trades</h3>
              <div className="space-y-3">
                {safeArray(recentTrades).slice(0, 10).map((trade, index) => (
                  <div key={trade?.id || index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${trade?.outcome === 'win' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      <span className="text-sm text-foreground">
                        {safeString(trade?.pair || 'Unknown Pair')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-medium ${safeNumber(trade?.profit || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ${safeNumber(trade?.profit || 0).toFixed(2)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {trade?.timestamp ? new Date(trade.timestamp).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                  </div>
                ))}
                {safeArray(recentTrades).length === 0 && (
                  <p className="text-center text-muted-foreground py-4">No recent trades</p>
                )}
              </div>
            </Card>
          </TabsContent>

          {/* Portfolio Tab */}
          <TabsContent value="portfolio" className="space-y-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Portfolio Overview</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Total Value</p>
                  <p className="text-2xl font-bold text-foreground">
                    ${safeNumber(portfolioData.totalValue).toFixed(2)}
                  </p>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Total P&L</p>
                  <p className={`text-2xl font-bold ${safeNumber(portfolioData.totalPnL) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ${safeNumber(portfolioData.totalPnL).toFixed(2)}
                  </p>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity" className="space-y-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">All Activity</h3>
              <div className="space-y-3">
                {safeActivityFeed.map((activity, index) => (
                  <div key={activity?.id || index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                      <span className="text-sm text-foreground">
                        {safeString(activity?.description || 'Activity')}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {activity?.timestamp ? new Date(activity.timestamp).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                ))}
                {safeActivityFeed.length === 0 && (
                  <p className="text-center text-muted-foreground py-4">No activity found</p>
                )}
              </div>
            </Card>
          </TabsContent>

          {/* KYC Verification Tab */}
          <TabsContent value="kyc" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Identity Verification
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {(kycStatus.level2.status === 'not_started' || !kycStatus.level2.status) ? (
                  <div className="space-y-6">
                    <div className="p-4 bg-blue-500/10 rounded-lg">
                      <p className="text-sm text-blue-600">
                        Please provide your identity information and upload required documents.
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="fullName">Full Name (as on ID)</Label>
                        <Input
                          id="fullName"
                          value={identityData.fullName}
                          onChange={(e) => setIdentityData(prev => ({ ...prev, fullName: e.target.value }))}
                          placeholder="Enter your full name"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="dateOfBirth">Date of Birth</Label>
                        <Input
                          id="dateOfBirth"
                          type="date"
                          value={identityData.dateOfBirth}
                          onChange={(e) => setIdentityData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="country">Country</Label>
                        <Select value={identityData.country} onValueChange={(value) => setIdentityData(prev => ({ ...prev, country: value }))}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select country" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="US">United States</SelectItem>
                            <SelectItem value="CA">Canada</SelectItem>
                            <SelectItem value="GB">United Kingdom</SelectItem>
                            <SelectItem value="AU">Australia</SelectItem>
                            <SelectItem value="DE">Germany</SelectItem>
                            <SelectItem value="FR">France</SelectItem>
                            <SelectItem value="JP">Japan</SelectItem>
                            <SelectItem value="SG">Singapore</SelectItem>
                            <SelectItem value="HK">Hong Kong</SelectItem>
                            <SelectItem value="CH">Switzerland</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label htmlFor="idType">ID Type</Label>
                        <Select value={identityData.idType} onValueChange={(value: any) => setIdentityData(prev => ({ ...prev, idType: value }))}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select ID type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="passport">Passport</SelectItem>
                            <SelectItem value="national_id">National ID</SelectItem>
                            <SelectItem value="drivers_license">Driver's License</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="md:col-span-2">
                        <Label htmlFor="idNumber">ID Number</Label>
                        <Input
                          id="idNumber"
                          value={identityData.idNumber}
                          onChange={(e) => setIdentityData(prev => ({ ...prev, idNumber: e.target.value }))}
                          placeholder="Enter your ID number"
                        />
                      </div>
                    </div>
                    
                    {/* Document Upload */}
                    <div className="space-y-4">
                      <h4 className="font-semibold">Document Upload</h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Front of ID */}
                        <div className="space-y-2">
                          <Label>Front of ID *</Label>
                          <div className="border-2 border-dashed border-border rounded-lg p-4 text-center">
                            {filePreviews.front ? (
                              <div className="space-y-2">
                                <img src={filePreviews.front} alt="Front" className="w-full h-32 object-cover rounded" />
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => removeFile('frontFile')}
                                >
                                  <X className="w-4 h-4 mr-2" />
                                  Remove
                                </Button>
                              </div>
                            ) : (
                              <div className="space-y-2">
                                <Upload className="w-8 h-8 mx-auto text-muted-foreground" />
                                <Input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => e.target.files?.[0] && handleFileUpload('frontFile', e.target.files[0])}
                                  className="hidden"
                                  id="frontFile"
                                />
                                <Label htmlFor="frontFile" className="cursor-pointer text-sm text-muted-foreground">
                                  Click to upload
                                </Label>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* Back of ID */}
                        <div className="space-y-2">
                          <Label>Back of ID (Optional)</Label>
                          <div className="border-2 border-dashed border-border rounded-lg p-4 text-center">
                            {filePreviews.back ? (
                              <div className="space-y-2">
                                <img src={filePreviews.back} alt="Back" className="w-full h-32 object-cover rounded" />
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => removeFile('backFile')}
                                >
                                  <X className="w-4 h-4 mr-2" />
                                  Remove
                                </Button>
                              </div>
                            ) : (
                              <div className="space-y-2">
                                <Upload className="w-8 h-8 mx-auto text-muted-foreground" />
                                <Input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => e.target.files?.[0] && handleFileUpload('backFile', e.target.files[0])}
                                  className="hidden"
                                  id="backFile"
                                />
                                <Label htmlFor="backFile" className="cursor-pointer text-sm text-muted-foreground">
                                  Click to upload
                                </Label>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* Selfie with ID */}
                        <div className="space-y-2">
                          <Label>Selfie with ID *</Label>
                          <div className="border-2 border-dashed border-border rounded-lg p-4 text-center">
                            {filePreviews.selfie ? (
                              <div className="space-y-2">
                                <img src={filePreviews.selfie} alt="Selfie" className="w-full h-32 object-cover rounded" />
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => removeFile('selfieFile')}
                                >
                                  <X className="w-4 h-4 mr-2" />
                                  Remove
                                </Button>
                              </div>
                            ) : (
                              <div className="space-y-2">
                                <Camera className="w-8 h-8 mx-auto text-muted-foreground" />
                                <Input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => e.target.files?.[0] && handleFileUpload('selfieFile', e.target.files[0])}
                                  className="hidden"
                                  id="selfieFile"
                                />
                                <Label htmlFor="selfieFile" className="cursor-pointer text-sm text-muted-foreground">
                                  Click to upload
                                </Label>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <Button 
                      onClick={handleSubmitIdentityVerification}
                      disabled={isSubmittingKYC}
                      className="w-full"
                    >
                      {isSubmittingKYC ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Submit for Review
                        </>
                      )}
                    </Button>
                  </div>
                ) : kycStatus.level2.status === 'pending' ? (
                  <div className="p-4 bg-yellow-500/10 rounded-lg">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-yellow-500" />
                      <span className="font-semibold text-yellow-600">Under Review</span>
                    </div>
                    <p className="text-sm text-yellow-600 mt-1">
                      Your identity verification is currently under review. You will be notified of the status.
                    </p>
                  </div>
                ) : kycStatus.level2.status === 'approved' ? (
                  <div className="p-4 bg-green-500/10 rounded-lg">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <span className="font-semibold text-green-600">Approved</span>
                    </div>
                    <p className="text-sm text-green-600 mt-1">
                      Your identity verification has been approved. You can now withdraw funds.
                    </p>
                  </div>
                ) : kycStatus.level2.status === 'rejected' ? (
                  <div className="p-4 bg-red-500/10 rounded-lg">
                    <div className="flex items-center gap-2">
                      <X className="w-5 h-5 text-red-500" />
                      <span className="font-semibold text-red-600">Rejected</span>
                    </div>
                    <p className="text-sm text-red-600 mt-1">
                      Your identity verification was rejected. Please review the requirements and try again.
                    </p>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;