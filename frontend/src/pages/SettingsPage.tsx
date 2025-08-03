import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  User, 
  Settings, 
  Shield, 
  Bell, 
  Key, 
  Smartphone, 
  Mail, 
  Eye, 
  EyeOff, 
  Copy, 
  Upload,
  Camera,
  AlertTriangle,
  CheckCircle,
  Globe,
  Moon,
  Sun,
  Monitor,
  CreditCard,
  Clock,
  MapPin,
  FileText,
  Palette,
  Lock,
  RefreshCw,
  Save,
  X,
  Plus
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import websocketService from "@/services/websocketService";
import { useLanguage } from "@/contexts/LanguageContext";

// Types for the settings functionality
interface SettingsData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  country: string;
  bio: string;
  avatar?: string;
}

interface SecuritySettings {
  twoFactorEnabled: boolean;
  withdrawalWhitelist: boolean;
  antiPhishingCode: boolean;
  deviceVerification: boolean;
}

interface NotificationPreferences {
  emailNotifications: boolean;
  pushNotifications: boolean;
  tradingAlerts: boolean;
}

interface DisplayPreferences {
  theme: 'light' | 'dark' | 'system';
  language: string;
  currency: string;
  timezone: string;
}

interface KYCSettings {
  level1: { completed: boolean; status: 'completed' | 'pending' | 'failed' };
  level2: { completed: boolean; status: 'completed' | 'pending' | 'failed' };
  level3: { completed: boolean; status: 'completed' | 'pending' | 'failed' };
}

interface PasswordChangeData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const SettingsPage = () => {
  const { user, updateUserProfile, isAdmin } = useAuth();
  const { t, currentLanguage, setLanguage, getAvailableLanguages } = useLanguage();
  const { toast } = useToast();
  
  // Redirect admin users to admin dashboard
  if (isAdmin) {
    return <Navigate to="/admin" replace />;
  }
  
  // State management
  const [isLoading, setIsLoading] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [showSecretKey, setShowSecretKey] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [showKYCUploadDialog, setShowKYCUploadDialog] = useState(false);
  
  // Settings data
  const [settingsData, setSettingsData] = useState<SettingsData>({
    firstName: '',
    lastName: '',
    email: user?.email || '',
    phone: '',
    country: '',
    bio: ''
  });
  
  // Security settings
  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>({
    twoFactorEnabled: false,
    withdrawalWhitelist: false,
    antiPhishingCode: true,
    deviceVerification: true
  });
  
  // Notification preferences
  const [notificationPrefs, setNotificationPrefs] = useState<NotificationPreferences>({
    emailNotifications: true,
    pushNotifications: true,
    tradingAlerts: true
  });
  
  // Display preferences
  const [displayPrefs, setDisplayPrefs] = useState<DisplayPreferences>({
    theme: 'system',
    language: 'en',
    currency: 'USD',
    timezone: 'UTC'
  });
  
  // KYC settings
  const [kycSettings, setKycSettings] = useState<KYCSettings>({
    level1: { completed: false, status: 'pending' },
    level2: { completed: false, status: 'pending' },
    level3: { completed: false, status: 'pending' }
  });
  
  // Password change
  const [passwordData, setPasswordData] = useState<PasswordChangeData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  // KYC upload files
  const [kycFiles, setKycFiles] = useState({
    proofOfResidence: null as File | null,
    selfieWithId: null as File | null,
    additionalDocuments: null as File | null
  });
  
  // Profile picture upload
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState<string | null>(null);
  const [showProfilePictureDialog, setShowProfilePictureDialog] = useState(false);
  
  // API keys
  const [apiKey, setApiKey] = useState("kc_api_abc123...xyz789");
  const [secretKey, setSecretKey] = useState("kc_secret_def456...uvw012");
  const [apiPermissions, setApiPermissions] = useState({
    read: true,
    trade: false,
    withdraw: false
  });

  // Load persisted data from localStorage
  useEffect(() => {
    const loadPersistedData = () => {
      try {
        // Load user profile data
        const persistedProfile = localStorage.getItem('userProfile');
        if (persistedProfile) {
          const profileData = JSON.parse(persistedProfile);
          setSettingsData(prev => ({ ...prev, ...profileData }));
        }

        // Load security settings
        const persistedSecurity = localStorage.getItem('securitySettings');
        if (persistedSecurity) {
          setSecuritySettings(JSON.parse(persistedSecurity));
        }

        // Load notification preferences
        const persistedNotifications = localStorage.getItem('notificationPreferences');
        if (persistedNotifications) {
          setNotificationPrefs(JSON.parse(persistedNotifications));
        }

        // Load display preferences
        const persistedDisplay = localStorage.getItem('displayPreferences');
        if (persistedDisplay) {
          setDisplayPrefs(JSON.parse(persistedDisplay));
        }

        // Load KYC settings - new users start with pending status
        const persistedKYC = localStorage.getItem('kycSettings');
        if (persistedKYC) {
          const kycData = JSON.parse(persistedKYC);
          // For new users, start with pending status for all levels
          if (user && !user.firstName && !user.lastName) {
            // New user - clear KYC settings and start fresh
            localStorage.removeItem('kycSettings');
            setKycSettings({
              level1: { completed: false, status: 'pending' },
              level2: { completed: false, status: 'pending' },
              level3: { completed: false, status: 'pending' }
            });
          } else {
            setKycSettings(kycData);
          }
        }
      } catch (error) {
        console.error('Error loading persisted data:', error);
      }
    };

    loadPersistedData();
  }, []);

  // Sync settings data with user from AuthContext
  useEffect(() => {
    if (user) {
      setSettingsData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
        country: user.country || '',
        bio: user.bio || '',
        avatar: user.avatar || ''
      });
    }
  }, [user]);

  // Apply theme changes
  useEffect(() => {
    applyTheme(displayPrefs.theme);
  }, [displayPrefs.theme]);

  const loadUserData = () => {
    const { user } = useAuth();
    if (user) {
      setSettingsData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
        country: user.country || '',
        bio: user.bio || '',
        avatar: user.avatar || ''
      });
    }
  };

  const applyTheme = (theme: 'light' | 'dark' | 'system') => {
    const root = document.documentElement;
    
    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.toggle('dark', systemTheme === 'dark');
    } else {
      root.classList.toggle('dark', theme === 'dark');
    }
    
    // Save to localStorage
    localStorage.setItem('theme', theme);
  };

  const handleSaveSettings = async () => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update user profile in AuthContext for real-time updates across the app
      updateUserProfile({
        firstName: settingsData.firstName,
        lastName: settingsData.lastName,
        email: settingsData.email,
        phone: settingsData.phone,
        country: settingsData.country,
        bio: settingsData.bio
      });
      
      // Persist to localStorage
      localStorage.setItem('userProfile', JSON.stringify({
        firstName: settingsData.firstName,
        lastName: settingsData.lastName,
        email: settingsData.email,
        phone: settingsData.phone,
        country: settingsData.country,
        bio: settingsData.bio
      }));
      
      // Emit real-time update to admin
      websocketService.updateProfile('current-user', {
        firstName: settingsData.firstName,
        lastName: settingsData.lastName,
        email: settingsData.email,
        phone: settingsData.phone,
        country: settingsData.country,
        bio: settingsData.bio,
        updatedAt: new Date().toISOString()
      });
      
      toast({
        title: "Settings Updated",
        description: "Your settings have been saved successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update settings",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords do not match",
        variant: "destructive"
      });
      return;
    }

    if (passwordData.newPassword.length < 8) {
      toast({
        title: "Error",
        description: "Password must be at least 8 characters long",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Password Changed",
        description: "Your password has been updated successfully.",
      });
      
      setShowPasswordDialog(false);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to change password",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle2FA = async () => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newTwoFactorEnabled = !securitySettings.twoFactorEnabled;
      
      setSecuritySettings(prev => ({
        ...prev,
        twoFactorEnabled: newTwoFactorEnabled
      }));
      
      // Persist to localStorage
      localStorage.setItem('securitySettings', JSON.stringify({
        ...securitySettings,
        twoFactorEnabled: newTwoFactorEnabled
      }));
      
      // Emit real-time update to admin
      websocketService.updateSecuritySettings('current-user', {
        twoFactorEnabled: newTwoFactorEnabled,
        updatedAt: new Date().toISOString()
      });
      
      toast({
        title: newTwoFactorEnabled ? "2FA Enabled" : "2FA Disabled",
        description: newTwoFactorEnabled 
          ? "Two-factor authentication has been enabled."
          : "Two-factor authentication has been disabled.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update 2FA settings",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveNotifications = async () => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Persist to localStorage
      localStorage.setItem('notificationPreferences', JSON.stringify(notificationPrefs));
      
      // Emit real-time update to admin
      websocketService.updateNotificationPreferences('current-user', {
        ...notificationPrefs,
        updatedAt: new Date().toISOString()
      });
      
      toast({
        title: "Settings Saved",
        description: "Your notification preferences have been updated.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save notification settings",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSavePreferences = async () => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Persist to localStorage
      localStorage.setItem('displayPreferences', JSON.stringify(displayPrefs));
      
      // Emit real-time update to admin
      websocketService.updateDisplayPreferences('current-user', {
        ...displayPrefs,
        updatedAt: new Date().toISOString()
      });
      
      toast({
        title: "Preferences Saved",
        description: "Your display preferences have been updated.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save preferences",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLevel1Verification = async () => {
    setIsLoading(true);
    try {
      // Simulate email verification
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newKycSettings = {
        ...kycSettings,
        level1: { completed: true, status: 'completed' as const }
      };
      
      setKycSettings(newKycSettings);
      
      // Persist to localStorage
      localStorage.setItem('kycSettings', JSON.stringify(newKycSettings));
      
      toast({
        title: "Level 1 Verification Complete",
        description: "Your email has been verified successfully.",
      });
    } catch (error) {
      toast({
        title: "Verification Failed",
        description: "Failed to verify email. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLevel2Verification = async () => {
    setIsLoading(true);
    try {
      // Simulate identity verification
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const newKycSettings = {
        ...kycSettings,
        level2: { completed: true, status: 'completed' as const }
      };
      
      setKycSettings(newKycSettings);
      
      // Persist to localStorage
      localStorage.setItem('kycSettings', JSON.stringify(newKycSettings));
      
      toast({
        title: "Level 2 Verification Complete",
        description: "Your identity has been verified successfully.",
      });
    } catch (error) {
      toast({
        title: "Verification Failed",
        description: "Failed to verify identity. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKYCUpload = async () => {
    if (!kycFiles.proofOfResidence || !kycFiles.selfieWithId) {
      toast({
        title: "Missing Documents",
        description: "Please upload all required documents for Level 3 verification.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const newKycSettings = {
        ...kycSettings,
        level3: { completed: true, status: 'pending' as const }
      };
      
      setKycSettings(newKycSettings);
      
      // Persist to localStorage
      localStorage.setItem('kycSettings', JSON.stringify(newKycSettings));
      
      // Emit real-time update to admin
      websocketService.updateKYCStatus('current-user', {
        level3: { completed: true, status: 'pending' },
        documents: {
          proofOfResidence: kycFiles.proofOfResidence?.name,
          selfieWithId: kycFiles.selfieWithId?.name,
          additionalDocuments: kycFiles.additionalDocuments?.name
        },
        updatedAt: new Date().toISOString()
      });
      
      setShowKYCUploadDialog(false);
      setKycFiles({
        proofOfResidence: null,
        selfieWithId: null,
        additionalDocuments: null
      });
      
      toast({
        title: "KYC Submitted",
        description: "Your Level 3 verification documents have been submitted for review.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to upload KYC documents",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateApiKey = async () => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newApiKey = `kc_api_${Math.random().toString(36).substr(2, 15)}`;
      const newSecretKey = `kc_secret_${Math.random().toString(36).substr(2, 20)}`;
      
      setApiKey(newApiKey);
      setSecretKey(newSecretKey);
      
      toast({
        title: "API Key Generated",
        description: "New API key has been generated successfully. Please save it securely.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate API key",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${type} copied to clipboard`,
    });
  };

  const handleFileUpload = (field: keyof typeof kycFiles, file: File) => {
    setKycFiles(prev => ({
      ...prev,
      [field]: file
    }));
  };

  const handleProfilePictureUpload = (file: File | null) => {
    if (!file) {
      setProfilePicture(null);
      setProfilePicturePreview(null);
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid File Type",
        description: "Please select an image file (JPG, PNG, GIF, etc.)",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please select an image smaller than 5MB",
        variant: "destructive"
      });
      return;
    }

    setProfilePicture(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setProfilePicturePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfilePicture = async () => {
    if (!profilePicture) {
      toast({
        title: "No Image Selected",
        description: "Please select an image to upload",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Update user profile in AuthContext with new avatar
      updateUserProfile({
        avatar: profilePicturePreview || user?.avatar
      });
      
      // Persist avatar to localStorage
      const currentProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');
      localStorage.setItem('userProfile', JSON.stringify({
        ...currentProfile,
        avatar: profilePicturePreview
      }));
      
      // Emit real-time update to admin
      websocketService.updateProfile('current-user', {
        avatar: profilePicturePreview,
        updatedAt: new Date().toISOString()
      });
      
      setShowProfilePictureDialog(false);
      
      toast({
        title: "Profile Picture Updated",
        description: "Your profile picture has been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to upload profile picture",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveProfilePicture = () => {
    setProfilePicture(null);
    setProfilePicturePreview(null);
    
    // Update user profile in AuthContext
    updateUserProfile({
      avatar: undefined
    });
    
    // Emit real-time update to admin
    websocketService.updateProfile('current-user', {
      avatar: null,
      updatedAt: new Date().toISOString()
    });
    
    toast({
      title: "Profile Picture Removed",
      description: "Your profile picture has been removed.",
    });
  };

  const getKYCStatusBadge = (level: keyof KYCSettings) => {
    const status = kycSettings[level].status;
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500/10 text-green-400">Completed</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500/10 text-yellow-400">Pending</Badge>;
      case 'failed':
        return <Badge className="bg-red-500/10 text-red-400">Failed</Badge>;
      default:
        return <Badge className="bg-gray-500/10 text-gray-400">Not Started</Badge>;
    }
  };

  const getKYCStatusIcon = (level: keyof KYCSettings) => {
    const status = kycSettings[level].status;
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />;
      case 'pending':
        return <AlertTriangle className="w-8 h-8 text-yellow-500 mx-auto mb-2" />;
      case 'failed':
        return <X className="w-8 h-8 text-red-500 mx-auto mb-2" />;
      default:
        return <AlertTriangle className="w-8 h-8 text-gray-500 mx-auto mb-2" />;
    }
  };

  return (
    <div className="min-h-screen bg-background pt-20">
      <div className="kucoin-container py-8">
        {/* Header */}
        <div className="flex items-center gap-6 mb-8">
          <Avatar className="w-20 h-20">
            <AvatarImage src="/placeholder.svg" />
            <AvatarFallback className="text-2xl bg-gradient-to-br from-kucoin-green to-kucoin-blue text-white">
              {user?.email?.charAt(0).toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-3xl font-bold text-foreground">{t('profileSettings')}</h1>
            <p className="text-muted-foreground">Manage your account settings and preferences</p>
            <div className="flex items-center gap-2 mt-2">
              <Badge className="bg-kucoin-green/10 text-kucoin-green">
                <CheckCircle className="w-3 h-3 mr-1" />
                Verified
              </Badge>
              <Badge className="bg-kucoin-blue/10 text-kucoin-blue">Pro Trader</Badge>
            </div>
          </div>
        </div>

        <Tabs defaultValue="account" className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="account">{t('profile')}</TabsTrigger>
            <TabsTrigger value="security">{t('securitySettings')}</TabsTrigger>
            <TabsTrigger value="api">API Keys</TabsTrigger>
            <TabsTrigger value="notifications">{t('notificationPreferences')}</TabsTrigger>
            <TabsTrigger value="preferences">{t('displayPreferences')}</TabsTrigger>
            <TabsTrigger value="kyc" onClick={() => window.location.href = '/kyc'}>{t('kycVerification')}</TabsTrigger>
          </TabsList>

          {/* Account Tab */}
          <TabsContent value="account" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="kucoin-card p-6">
                <h2 className="text-xl font-bold mb-6">{t('profile')} Information</h2>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName">{t('firstName')}</Label>
                      <Input id="firstName" placeholder="John" value={settingsData.firstName} onChange={(e) => setSettingsData({...settingsData, firstName: e.target.value})} />
                    </div>
                    <div>
                      <Label htmlFor="lastName">{t('lastName')}</Label>
                      <Input id="lastName" placeholder="Doe" value={settingsData.lastName} onChange={(e) => setSettingsData({...settingsData, lastName: e.target.value})} />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="email">{t('email')}</Label>
                    <Input id="email" type="email" value={settingsData.email} disabled />
                  </div>
                  
                  <div>
                    <Label htmlFor="phone">{t('phone')}</Label>
                    <Input 
                      id="phone" 
                      placeholder="Enter your phone number" 
                      value={settingsData.phone} 
                      onChange={(e) => setSettingsData({...settingsData, phone: e.target.value})} 
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="country">{t('country')}</Label>
                    <Select value={settingsData.country} onValueChange={(value) => setSettingsData({...settingsData, country: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select country" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="us">United States</SelectItem>
                        <SelectItem value="ca">Canada</SelectItem>
                        <SelectItem value="uk">United Kingdom</SelectItem>
                        <SelectItem value="de">Germany</SelectItem>
                        <SelectItem value="fr">France</SelectItem>
                        <SelectItem value="jp">Japan</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="bio">Bio</Label>
                    <textarea 
                      id="bio" 
                      className="w-full p-3 border border-border rounded-md bg-background"
                      rows={3}
                      placeholder="Tell us about yourself..."
                      value={settingsData.bio}
                      onChange={(e) => setSettingsData({...settingsData, bio: e.target.value})}
                    />
                  </div>
                  
                  <Button onClick={handleSaveSettings} className="kucoin-btn-primary" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        {t('loading')}
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        {t('saveChanges')}
                      </>
                    )}
                  </Button>
                </div>
              </Card>
              
              <div className="space-y-6">
                <Card className="kucoin-card p-6">
                  <h3 className="text-lg font-semibold mb-4">Profile Picture</h3>
                  <div className="text-center space-y-4">
                    <Avatar className="w-24 h-24 mx-auto">
                      <AvatarImage 
                        src={profilePicturePreview || user?.avatar || "/placeholder.svg"} 
                        alt="Profile Picture"
                      />
                      <AvatarFallback className="text-xl bg-gradient-to-br from-kucoin-green to-kucoin-blue text-white">
                        {user?.firstName?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    
                    {profilePicturePreview && (
                      <div className="p-2 bg-green-500/10 border border-green-500/20 rounded-lg">
                        <p className="text-sm text-green-600 font-medium">Preview Ready</p>
                        <p className="text-xs text-green-500">{profilePicture?.name}</p>
                      </div>
                    )}
                    
                    <div className="flex gap-2 justify-center">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => document.getElementById('profilePictureInput')?.click()}
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Upload
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => document.getElementById('cameraInput')?.click()}
                      >
                        <Camera className="w-4 h-4 mr-2" />
                        Camera
                      </Button>
                      {profilePicture && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={handleRemoveProfilePicture}
                          className="text-red-500 hover:text-red-600"
                        >
                          <X className="w-4 h-4 mr-2" />
                          Remove
                        </Button>
                      )}
                    </div>
                    
                    {profilePicture && (
                      <Button 
                        onClick={handleSaveProfilePicture} 
                        className="kucoin-btn-primary w-full"
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <>
                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4 mr-2" />
                            Save Profile Picture
                          </>
                        )}
                      </Button>
                    )}
                    
                    {/* Hidden file inputs */}
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={(e) => handleProfilePictureUpload(e.target.files?.[0] || null)}
                      className="hidden"
                      id="profilePictureInput"
                      aria-label="Upload profile picture"
                    />
                    <input 
                      type="file" 
                      accept="image/*" 
                      capture="environment"
                      onChange={(e) => handleProfilePictureUpload(e.target.files?.[0] || null)}
                      className="hidden"
                      id="cameraInput"
                      aria-label="Take profile picture with camera"
                    />
                  </div>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="kucoin-card p-6">
                <h2 className="text-xl font-bold mb-6">Security Settings</h2>
                <div className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="font-semibold">Change Password</h3>
                    <div className="space-y-3">
                      <Button onClick={() => setShowPasswordDialog(true)} className="kucoin-btn-primary">
                        Change Password
                      </Button>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-4">
                    <h3 className="font-semibold">Two-Factor Authentication</h3>
                    <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Smartphone className="w-5 h-5 text-kucoin-green" />
                        <div>
                          <p className="font-medium">Authenticator App</p>
                          <p className="text-sm text-muted-foreground">Google Authenticator</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {securitySettings.twoFactorEnabled ? (
                          <Badge className="bg-kucoin-green/10 text-kucoin-green">Enabled</Badge>
                        ) : (
                          <Badge className="bg-gray-500/10 text-gray-400">Disabled</Badge>
                        )}
                        <Switch 
                          checked={securitySettings.twoFactorEnabled} 
                          onCheckedChange={handleToggle2FA}
                          disabled={isLoading}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>

          {/* API Tab */}
          <TabsContent value="api" className="space-y-6">
            <Card className="kucoin-card p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">API Management</h2>
                <Button onClick={handleGenerateApiKey} className="kucoin-btn-primary" disabled={isLoading}>
                  {isLoading ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : "Generate New Key"}
                </Button>
              </div>
              
              <div className="space-y-6">
                <div className="p-4 bg-kucoin-yellow/10 border border-kucoin-yellow/20 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-5 h-5 text-kucoin-yellow" />
                    <span className="font-semibold text-kucoin-yellow">Security Notice</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Keep your API keys secure. Never share them publicly or store them in client-side code.
                  </p>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="apiKey">API Key</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Input 
                        id="apiKey" 
                        value={showApiKey ? apiKey : "••••••••••••••••••••••••••••••••"}
                        readOnly 
                      />
                      <Button 
                        variant="outline" 
                        size="icon"
                        onClick={() => setShowApiKey(!showApiKey)}
                      >
                        {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                      <Button 
                        variant="outline" 
                        size="icon"
                        onClick={() => copyToClipboard(apiKey, "API Key")}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="secretKey">Secret Key</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Input 
                        id="secretKey" 
                        value={showSecretKey ? secretKey : "••••••••••••••••••••••••••••••••"}
                        readOnly 
                      />
                      <Button 
                        variant="outline" 
                        size="icon"
                        onClick={() => setShowSecretKey(!showSecretKey)}
                      >
                        {showSecretKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                      <Button 
                        variant="outline" 
                        size="icon"
                        onClick={() => copyToClipboard(secretKey, "Secret Key")}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-6">
            <Card className="kucoin-card p-6">
              <h2 className="text-xl font-bold mb-6">Notification Preferences</h2>
              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Mail className="w-5 h-5 text-kucoin-blue" />
                      <div>
                        <p className="font-medium">Email Notifications</p>
                        <p className="text-sm text-muted-foreground">Receive notifications via email</p>
                      </div>
                    </div>
                    <Switch checked={notificationPrefs.emailNotifications} onCheckedChange={() => setNotificationPrefs({...notificationPrefs, emailNotifications: !notificationPrefs.emailNotifications})} />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Bell className="w-5 h-5 text-kucoin-green" />
                      <div>
                        <p className="font-medium">Push Notifications</p>
                        <p className="text-sm text-muted-foreground">Receive browser push notifications</p>
                      </div>
                    </div>
                    <Switch checked={notificationPrefs.pushNotifications} onCheckedChange={() => setNotificationPrefs({...notificationPrefs, pushNotifications: !notificationPrefs.pushNotifications})} />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="w-5 h-5 text-kucoin-yellow" />
                      <div>
                        <p className="font-medium">Trading Alerts</p>
                        <p className="text-sm text-muted-foreground">Price alerts and trading notifications</p>
                      </div>
                    </div>
                    <Switch checked={notificationPrefs.tradingAlerts} onCheckedChange={() => setNotificationPrefs({...notificationPrefs, tradingAlerts: !notificationPrefs.tradingAlerts})} />
                  </div>
                </div>
              </div>
              <Button onClick={handleSaveNotifications} className="kucoin-btn-primary mt-6" disabled={isLoading}>
                {isLoading ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : "Save Notifications"}
              </Button>
            </Card>
          </TabsContent>

          {/* Preferences Tab */}
          <TabsContent value="preferences" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="kucoin-card p-6">
                <h2 className="text-xl font-bold mb-6">{t('generalPreferences')}</h2>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="language" className="flex items-center gap-2">
                      <Globe className="w-4 h-4" />
                      {t('language')}
                    </Label>
                    <Select value={currentLanguage} onValueChange={setLanguage}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(getAvailableLanguages()).map(([code, lang]) => (
                          <SelectItem key={code} value={code}>
                            <div className="flex items-center gap-2">
                              <span>{lang.flag}</span>
                              <span>{lang.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="currency" className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4" />
                      {t('defaultCurrency')}
                    </Label>
                    <Select value={displayPrefs.currency} onValueChange={(value) => setDisplayPrefs({...displayPrefs, currency: value})}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD - US Dollar</SelectItem>
                        <SelectItem value="EUR">EUR - Euro</SelectItem>
                        <SelectItem value="GBP">GBP - British Pound</SelectItem>
                        <SelectItem value="JPY">JPY - Japanese Yen</SelectItem>
                        <SelectItem value="CNY">CNY - Chinese Yuan</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="timezone" className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      {t('timezone')}
                    </Label>
                    <Select value={displayPrefs.timezone} onValueChange={(value) => setDisplayPrefs({...displayPrefs, timezone: value})}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="UTC">UTC</SelectItem>
                        <SelectItem value="EST">EST - Eastern Time</SelectItem>
                        <SelectItem value="PST">PST - Pacific Time</SelectItem>
                        <SelectItem value="GMT">GMT - Greenwich Mean Time</SelectItem>
                        <SelectItem value="JST">JST - Japan Standard Time</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </Card>
            </div>
            <Button onClick={handleSavePreferences} className="kucoin-btn-primary mt-6" disabled={isLoading}>
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  {t('loading')}
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {t('savePreferences')}
                </>
              )}
            </Button>
          </TabsContent>

          {/* Appearance Tab */}
          <TabsContent value="appearance" className="space-y-6">
            <Card className="kucoin-card p-6">
              <h2 className="text-xl font-bold mb-6">Theme Preferences</h2>
              <div className="space-y-4">
                <Label>Theme Mode</Label>
                <div className="grid grid-cols-3 gap-4">
                  <div 
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      displayPrefs.theme === 'light' ? 'border-kucoin-blue bg-kucoin-blue/10' : 'border-border'
                    }`}
                    onClick={() => setDisplayPrefs({...displayPrefs, theme: 'light'})}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <Sun className="w-6 h-6" />
                      <span className="text-sm font-medium">Light</span>
                    </div>
                  </div>
                  
                  <div 
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      displayPrefs.theme === 'dark' ? 'border-kucoin-blue bg-kucoin-blue/10' : 'border-border'
                    }`}
                    onClick={() => setDisplayPrefs({...displayPrefs, theme: 'dark'})}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <Moon className="w-6 h-6" />
                      <span className="text-sm font-medium">Dark</span>
                    </div>
                  </div>
                  
                  <div 
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      displayPrefs.theme === 'system' ? 'border-kucoin-blue bg-kucoin-blue/10' : 'border-border'
                    }`}
                    onClick={() => setDisplayPrefs({...displayPrefs, theme: 'system'})}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <Monitor className="w-6 h-6" />
                      <span className="text-sm font-medium">System</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* KYC Tab */}
          <TabsContent value="kyc" className="space-y-6">
            <Card className="kucoin-card p-6">
              <h2 className="text-xl font-bold mb-6">KYC Verification</h2>
              
              {/* KYC Status Overview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="p-4 border border-border rounded-lg text-center">
                  {getKYCStatusIcon('level1')}
                  <h3 className="font-semibold mb-2">Level 1</h3>
                  <p className="text-sm text-muted-foreground mb-2">Email Verification</p>
                  {getKYCStatusBadge('level1')}
                </div>
                
                <div className="p-4 border border-border rounded-lg text-center">
                  {getKYCStatusIcon('level2')}
                  <h3 className="font-semibold mb-2">Level 2</h3>
                  <p className="text-sm text-muted-foreground mb-2">Identity Verification</p>
                  {getKYCStatusBadge('level2')}
                </div>
                
                <div className="p-4 border border-border rounded-lg text-center">
                  {getKYCStatusIcon('level3')}
                  <h3 className="font-semibold mb-2">Level 3</h3>
                  <p className="text-sm text-muted-foreground mb-2">Enhanced Verification</p>
                  {getKYCStatusBadge('level3')}
                </div>
              </div>

              {/* Level 1 and Level 2 Verification */}
              {kycSettings.level1.status === 'pending' && (
                <div className="space-y-6">
                  <div className="flex items-center gap-4 p-4 bg-kucoin-blue/10 rounded-lg">
                    <Mail className="w-6 h-6 text-kucoin-blue" />
                    <div>
                      <h3 className="font-semibold">Complete Level 1 Verification</h3>
                      <p className="text-sm text-muted-foreground">
                        Verify your email address to complete Level 1 KYC.
                      </p>
                    </div>
                  </div>
                  
                  <Button 
                    onClick={() => handleLevel1Verification()} 
                    className="kucoin-btn-primary"
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Verify Email Address
                  </Button>
                </div>
              )}

              {kycSettings.level2.status === 'pending' && kycSettings.level1.status === 'completed' && (
                <div className="space-y-6">
                  <div className="flex items-center gap-4 p-4 bg-kucoin-blue/10 rounded-lg">
                    <User className="w-6 h-6 text-kucoin-blue" />
                    <div>
                      <h3 className="font-semibold">Complete Level 2 Verification</h3>
                      <p className="text-sm text-muted-foreground">
                        Verify your identity with basic personal information.
                      </p>
                    </div>
                  </div>
                  
                  <Button 
                    onClick={() => handleLevel2Verification()} 
                    className="kucoin-btn-primary"
                  >
                    <User className="w-4 h-4 mr-2" />
                    Verify Identity
                  </Button>
                </div>
              )}

              {/* Level 3 Verification */}
              {kycSettings.level3.status === 'pending' && !kycSettings.level3.completed && (
                <div className="space-y-6">
                  <div className="flex items-center gap-4 p-4 bg-kucoin-blue/10 rounded-lg">
                    <FileText className="w-6 h-6 text-kucoin-blue" />
                    <div>
                      <h3 className="font-semibold">Complete Level 3 Verification</h3>
                      <p className="text-sm text-muted-foreground">
                        Upload additional documents for enhanced verification.
                      </p>
                    </div>
                  </div>
                  
                  <Button 
                    onClick={() => setShowKYCUploadDialog(true)} 
                    className="kucoin-btn-primary"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Complete Level 3 Verification
                  </Button>
                </div>
              )}

              {kycSettings.level3.status === 'pending' && kycSettings.level3.completed && (
                <div className="space-y-6">
                  <div className="flex items-center gap-4 p-4 bg-kucoin-yellow/10 rounded-lg">
                    <AlertTriangle className="w-6 h-6 text-kucoin-yellow" />
                    <div>
                      <h3 className="font-semibold">Verification Pending</h3>
                      <p className="text-sm text-muted-foreground">
                        Your Level 3 verification documents are under review.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {kycSettings.level3.status === 'completed' && (
                <div className="space-y-6">
                  <div className="flex items-center gap-4 p-4 bg-kucoin-green/10 rounded-lg">
                    <CheckCircle className="w-6 h-6 text-kucoin-green" />
                    <div>
                      <h3 className="font-semibold">KYC Level 3 Verified</h3>
                      <p className="text-sm text-muted-foreground">
                        Your KYC Level 3 verification has been completed.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {kycSettings.level3.status === 'failed' && (
                <div className="space-y-6">
                  <div className="flex items-center gap-4 p-4 bg-kucoin-red/10 rounded-lg">
                    <X className="w-6 h-6 text-kucoin-red" />
                    <div>
                      <h3 className="font-semibold">KYC Verification Failed</h3>
                      <p className="text-sm text-muted-foreground">
                        Your KYC Level 3 verification has failed. Please try again or contact support.
                      </p>
                    </div>
                  </div>
                  <Button 
                    onClick={() => setShowKYCUploadDialog(true)} 
                    className="kucoin-btn-primary"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Try Again
                  </Button>
                </div>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Password Change Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input 
                id="currentPassword" 
                type="password" 
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="newPassword">New Password</Label>
              <Input 
                id="newPassword" 
                type="password" 
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input 
                id="confirmPassword" 
                type="password" 
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowPasswordDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleChangePassword} disabled={isLoading}>
                {isLoading ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : "Change Password"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* KYC Upload Dialog */}
      <Dialog open={showKYCUploadDialog} onOpenChange={setShowKYCUploadDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Complete Level 3 Verification</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="proofOfResidence">Proof of Residence</Label>
              <Input 
                type="file" 
                accept="image/*"
                onChange={(e) => handleFileUpload('proofOfResidence', e.target.files?.[0] || null)}
              />
            </div>
            <div>
              <Label htmlFor="selfieWithId">Selfie with ID</Label>
              <Input 
                type="file" 
                accept="image/*"
                onChange={(e) => handleFileUpload('selfieWithId', e.target.files?.[0] || null)}
              />
            </div>
            <div>
              <Label htmlFor="additionalDocuments">Additional Documents (Optional)</Label>
              <Input 
                type="file" 
                accept="image/*"
                onChange={(e) => handleFileUpload('additionalDocuments', e.target.files?.[0] || null)}
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowKYCUploadDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleKYCUpload} disabled={isLoading}>
                {isLoading ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : "Submit for Review"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Profile Picture Upload Dialog */}
      <Dialog open={showProfilePictureDialog} onOpenChange={setShowProfilePictureDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Profile Picture</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-center">
              <div className="border-2 border-dashed border-border rounded-lg p-6 mb-4">
                <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm font-medium mb-1">Drop your image here</p>
                <p className="text-xs text-muted-foreground mb-4">or click to browse</p>
                <Input 
                  type="file" 
                  accept="image/*"
                  onChange={(e) => handleProfilePictureUpload(e.target.files?.[0] || null)}
                  className="cursor-pointer"
                />
              </div>
              
              {profilePicturePreview && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-green-600">Preview:</p>
                  <div className="flex justify-center">
                    <Avatar className="w-16 h-16">
                      <AvatarImage src={profilePicturePreview} alt="Preview" />
                      <AvatarFallback className="text-sm">
                        {user?.firstName?.charAt(0)?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <p className="text-xs text-muted-foreground">{profilePicture?.name}</p>
                </div>
              )}
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowProfilePictureDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleSaveProfilePicture} 
                disabled={!profilePicture || isLoading}
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Picture
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SettingsPage;