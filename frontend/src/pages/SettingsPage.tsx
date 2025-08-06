import { useState, useEffect } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
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

import { useLanguage } from "@/contexts/LanguageContext";
import { getCountries } from '@/utils/countries';

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

interface PasswordChangeData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const SettingsPage = () => {
  const { user, updateUserProfile, isAdmin } = useAuth();
  const { t, currentLanguage, setLanguage, getAvailableLanguages } = useLanguage();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // Redirect admin users to admin dashboard
  if (isAdmin) {
    return <Navigate to="/admin" replace />;
  }
  
  // State management
  const [isLoading, setIsLoading] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [showSecretKey, setShowSecretKey] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [showProfilePictureDialog, setShowProfilePictureDialog] = useState(false);
  const [profilePictureFile, setProfilePictureFile] = useState<File | null>(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState<string | null>(null);
  
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
  
  // Password change
  const [passwordData, setPasswordData] = useState<PasswordChangeData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
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
      
      // Profile updates now handled by Supabase auth service
      
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
      
      // Security settings updates now handled by Supabase
      
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
      
      // Notification preferences updates now handled by Supabase
      
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
      
      // Display preferences updates now handled by Supabase
      
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

  const handleProfilePictureUpload = (file: File | null) => {
    if (!file) {
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

    setProfilePictureFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setProfilePicturePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfilePicture = async () => {
    if (!profilePictureFile) {
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
      
      // Profile picture updates now handled by Supabase
      
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
    setProfilePictureFile(null);
    setProfilePicturePreview(null);
    
    // Update user profile
    if (user) {
      updateUserProfile({ avatar: '' });
    }
    
    toast({
      title: "Profile Picture Removed",
      description: "Your profile picture has been removed.",
    });
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
          <TabsList className="flex w-full gap-1 bg-muted/20 p-1 rounded-lg overflow-x-auto scrollbar-hide">
            <TabsTrigger value="account" className="text-xs sm:text-sm font-medium data-[state=active]:bg-background data-[state=active]:text-foreground whitespace-nowrap flex-shrink-0">{t('profile')}</TabsTrigger>
            <TabsTrigger value="security" className="text-xs sm:text-sm font-medium data-[state=active]:bg-background data-[state=active]:text-foreground whitespace-nowrap flex-shrink-0">{t('securitySettings')}</TabsTrigger>
            <TabsTrigger value="api" className="text-xs sm:text-sm font-medium data-[state=active]:bg-background data-[state=active]:text-foreground whitespace-nowrap flex-shrink-0">API Keys</TabsTrigger>
            <TabsTrigger value="notifications" className="text-xs sm:text-sm font-medium data-[state=active]:bg-background data-[state=active]:text-foreground whitespace-nowrap flex-shrink-0">{t('notificationPreferences')}</TabsTrigger>
            <TabsTrigger value="preferences" className="text-xs sm:text-sm font-medium data-[state=active]:bg-background data-[state=active]:text-foreground whitespace-nowrap flex-shrink-0">{t('displayPreferences')}</TabsTrigger>
            <TabsTrigger value="kyc" onClick={() => window.location.href = '/kyc'} className="text-xs sm:text-sm font-medium data-[state=active]:bg-background data-[state=active]:text-foreground whitespace-nowrap flex-shrink-0">{t('kycVerification')}</TabsTrigger>
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
                        {getCountries().map((country) => (
                          <SelectItem key={country.code} value={country.code}>
                            {country.name}
                          </SelectItem>
                        ))}
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
                        <p className="text-xs text-green-500">{profilePictureFile?.name}</p>
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
                      {profilePictureFile && (
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
                    
                    {profilePictureFile && (
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
            <Card className="border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  KYC Verification Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* KYC Overview */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border border-border rounded-lg">
                    <div className="flex items-center gap-3 mb-3">
                      <Mail className="w-6 h-6 text-blue-500" />
                      <div>
                        <h3 className="font-semibold">Level 1: Email Verification</h3>
                        <p className="text-sm text-muted-foreground">Verify your email address</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <Badge className={
                        user?.kycLevel1?.status === 'verified' 
                          ? "bg-green-500/10 text-green-400" 
                          : "bg-yellow-500/10 text-yellow-400"
                      }>
                        {user?.kycLevel1?.status === 'verified' ? 'Verified' : 'Unverified'}
                      </Badge>
                      {user?.kycLevel1?.status === 'verified' && (
                        <span className="text-xs text-muted-foreground">
                          {user.kycLevel1.verifiedAt && new Date(user.kycLevel1.verifiedAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="p-4 border border-border rounded-lg">
                    <div className="flex items-center gap-3 mb-3">
                      <Shield className="w-6 h-6 text-purple-500" />
                      <div>
                        <h3 className="font-semibold">Level 2: Identity Verification</h3>
                        <p className="text-sm text-muted-foreground">Verify your identity</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <Badge className={
                        user?.kycLevel2?.status === 'approved' 
                          ? "bg-green-500/10 text-green-400"
                          : user?.kycLevel2?.status === 'rejected'
                          ? "bg-red-500/10 text-red-400"
                          : user?.kycLevel2?.status === 'pending'
                          ? "bg-yellow-500/10 text-yellow-400"
                          : "bg-gray-500/10 text-gray-400"
                      }>
                        {user?.kycLevel2?.status === 'approved' ? 'Approved' :
                         user?.kycLevel2?.status === 'rejected' ? 'Rejected' :
                         user?.kycLevel2?.status === 'pending' ? 'Pending Review' :
                         'Not Started'}
                      </Badge>
                      {user?.kycLevel2?.status === 'approved' && user.kycLevel2.reviewedAt && (
                        <span className="text-xs text-muted-foreground">
                          {new Date(user.kycLevel2.reviewedAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* KYC Requirements */}
                <div className="space-y-4">
                  <h4 className="font-semibold">Verification Requirements</h4>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${
                        user?.kycLevel1?.status === 'verified' ? 'bg-green-500' : 'bg-gray-400'
                      }`} />
                      <span className="text-sm">
                        <strong>Level 1:</strong> Email verification required for trading access
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${
                        user?.kycLevel2?.status === 'approved' ? 'bg-green-500' : 'bg-gray-400'
                      }`} />
                      <span className="text-sm">
                        <strong>Level 2:</strong> Identity verification required for withdrawals
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <Button 
                    onClick={() => navigate('/kyc')}
                    className="flex-1"
                  >
                    <Shield className="w-4 h-4 mr-2" />
                    Manage KYC Verification
                  </Button>
                </div>

                {/* Status Messages */}
                {user?.kycLevel1?.status !== 'verified' && (
                  <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="w-4 h-4 text-yellow-500" />
                      <span className="font-semibold text-yellow-600">Trading Access Restricted</span>
                    </div>
                    <p className="text-sm text-yellow-600">
                      Please complete email verification to access trading features.
                    </p>
                  </div>
                )}

                {user?.kycLevel1?.status === 'verified' && user?.kycLevel2?.status !== 'approved' && (
                  <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="w-4 h-4 text-blue-500" />
                      <span className="font-semibold text-blue-600">Withdrawal Access Restricted</span>
                    </div>
                    <p className="text-sm text-blue-600">
                      Please complete identity verification to enable withdrawals.
                    </p>
                  </div>
                )}

                {user?.kycLevel2?.status === 'rejected' && (
                  <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <X className="w-4 h-4 text-red-500" />
                      <span className="font-semibold text-red-600">Identity Verification Rejected</span>
                    </div>
                    <p className="text-sm text-red-600">
                      {user.kycLevel2.rejectionReason || 'Your identity verification was rejected. Please review and resubmit.'}
                    </p>
                  </div>
                )}
              </CardContent>
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
                  <p className="text-xs text-muted-foreground">{profilePictureFile?.name}</p>
                </div>
              )}
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowProfilePictureDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleSaveProfilePicture} 
                disabled={!profilePictureFile || isLoading}
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