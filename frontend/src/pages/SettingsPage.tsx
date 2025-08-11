import { useState, useEffect } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  User, 
  Settings, 
  Shield, 
  Mail, 
  CheckCircle,
  AlertTriangle,
  Clock,
  RefreshCw,
  Save
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useUserProfile } from "@/hooks/useUserProfile";
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
}

const SettingsPage = () => {
  const { user, updateUserProfile, isAdmin } = useAuth();
  const { profile } = useUserProfile();
  const { t, currentLanguage, setLanguage, getAvailableLanguages } = useLanguage();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // Redirect admin users to admin dashboard
  if (isAdmin) {
    return <Navigate to="/admin" replace />;
  }
  
  // State management
  const [isLoading, setIsLoading] = useState(false);
  
  // Settings data
  const [settingsData, setSettingsData] = useState<SettingsData>({
    firstName: '',
    lastName: '',
    email: user?.email || '',
    phone: '',
    country: ''
  });

  // Load user data on component mount
  useEffect(() => {
    loadUserData();
  }, [user, profile]);

  const loadUserData = () => {
    if (profile) {
      const nameParts = profile.full_name?.split(' ') || [];
      setSettingsData({
        firstName: nameParts[0] || '',
        lastName: nameParts.slice(1).join(' ') || '',
        email: user?.email || '',
        phone: profile.phone || '',
        country: profile.country || ''
      });
    }
  };

  const handleSaveSettings = async () => {
    setIsLoading(true);
    
    try {
      const fullName = `${settingsData.firstName} ${settingsData.lastName}`.trim();
      
      // Update profile data
      const updatedProfile = {
        full_name: fullName,
        phone: settingsData.phone,
        country: settingsData.country
      };

      // Call the update function from AuthContext
      if (updateUserProfile) {
        await updateUserProfile(updatedProfile);
      }

      toast({
        title: "Settings Saved",
        description: "Your profile settings have been updated successfully.",
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pt-20">
      <div className="kucoin-container py-8">
        {/* Header */}
        <div className="flex items-center gap-6 mb-8">
          <Avatar className="w-20 h-20">
            <AvatarImage src={profile?.avatar_url || user?.avatar} />
            <AvatarFallback className="text-2xl bg-gradient-to-br from-kucoin-green to-kucoin-blue text-white">
              {profile?.full_name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-3xl font-bold text-foreground">{t('profileSettings')}</h1>
            <p className="text-muted-foreground">Manage your account settings and preferences</p>
            <div className="flex items-center gap-2 mt-2">
              {profile?.kyc_status === 'approved' && (
                <Badge className="bg-kucoin-green/10 text-kucoin-green">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Verified
                </Badge>
              )}
              {profile?.kyc_status === 'pending' && (
                <Badge className="bg-yellow-500/10 text-yellow-600">
                  <Clock className="w-3 h-3 mr-1" />
                  Pending Verification
                </Badge>
              )}
              {profile?.kyc_status === 'rejected' && (
                <Badge className="bg-red-500/10 text-red-600">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  Verification Rejected
                </Badge>
              )}
              {(!profile?.kyc_status || profile?.kyc_status === 'unverified') && (
                <Badge className="bg-gray-500/10 text-gray-600">
                  <Shield className="w-3 h-3 mr-1" />
                  Unverified
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Profile Information */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="kucoin-card p-6">
            <h2 className="text-xl font-bold mb-6">{t('profile')} Information</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">{t('firstName')}</Label>
                  <Input 
                    id="firstName" 
                    placeholder="John" 
                    value={settingsData.firstName} 
                    onChange={(e) => setSettingsData({...settingsData, firstName: e.target.value})} 
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">{t('lastName')}</Label>
                  <Input 
                    id="lastName" 
                    placeholder="Doe" 
                    value={settingsData.lastName} 
                    onChange={(e) => setSettingsData({...settingsData, lastName: e.target.value})} 
                  />
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
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;