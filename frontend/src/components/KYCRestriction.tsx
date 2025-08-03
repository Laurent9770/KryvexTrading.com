import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import kycService from '@/services/kycService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Lock, 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  Mail, 
  User, 
  MapPin,
  ArrowRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface KYCRestrictionProps {
  requiredLevel: 1 | 2 | 3;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showUpgradePrompt?: boolean;
}

const KYCRestriction = ({ 
  requiredLevel, 
  children, 
  fallback,
  showUpgradePrompt = true 
}: KYCRestrictionProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  if (!user) {
    return <div>Please log in to access this feature.</div>;
  }

  const kycUser = kycService.getUser(user.id);
  if (!kycUser) {
    return <div>Loading KYC status...</div>;
  }

  const currentLevel = kycUser.kycLevel.level;
  const canAccess = currentLevel >= requiredLevel;

  if (canAccess) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  const getLevelInfo = (level: number) => {
    switch (level) {
      case 1:
        return {
          title: 'Email Verification Required',
          description: 'Please verify your email address to access this feature.',
          icon: <Mail className="w-8 h-8 text-blue-500" />,
          action: 'Verify Email',
          actionLink: '/kyc'
        };
      case 2:
        return {
          title: 'Identity Verification Required',
          description: 'Please complete identity verification to access this feature.',
          icon: <User className="w-8 h-8 text-green-500" />,
          action: 'Verify Identity',
          actionLink: '/kyc'
        };
      case 3:
        return {
          title: 'Address Verification Required',
          description: 'Please complete address verification to access this feature.',
          icon: <MapPin className="w-8 h-8 text-purple-500" />,
          action: 'Verify Address',
          actionLink: '/kyc'
        };
      default:
        return {
          title: 'Verification Required',
          description: 'Please complete verification to access this feature.',
          icon: <Shield className="w-8 h-8 text-gray-500" />,
          action: 'Complete Verification',
          actionLink: '/kyc'
        };
    }
  };

  const levelInfo = getLevelInfo(requiredLevel);
  const progress = (currentLevel / 3) * 100;

  if (!showUpgradePrompt) {
    return null;
  }

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          {levelInfo.icon}
        </div>
        <CardTitle className="text-xl">{levelInfo.title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-muted-foreground text-center">
          {levelInfo.description}
        </p>

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Verification Progress</span>
            <span>Level {currentLevel} of 3</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Current Status */}
        <div className="flex items-center justify-center gap-2">
          <Badge variant={currentLevel >= 1 ? "default" : "secondary"}>
            {currentLevel >= 1 ? <CheckCircle className="w-3 h-3 mr-1" /> : <Lock className="w-3 h-3 mr-1" />}
            Level 1
          </Badge>
          <ArrowRight className="w-4 h-4 text-muted-foreground" />
          <Badge variant={currentLevel >= 2 ? "default" : "secondary"}>
            {currentLevel >= 2 ? <CheckCircle className="w-3 h-3 mr-1" /> : <Lock className="w-3 h-3 mr-1" />}
            Level 2
          </Badge>
          <ArrowRight className="w-4 h-4 text-muted-foreground" />
          <Badge variant={currentLevel >= 3 ? "default" : "secondary"}>
            {currentLevel >= 3 ? <CheckCircle className="w-3 h-3 mr-1" /> : <Lock className="w-3 h-3 mr-1" />}
            Level 3
          </Badge>
        </div>

        {/* Restrictions */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <AlertTriangle className="w-4 h-4" />
            Current restrictions:
          </div>
          <ul className="text-sm text-muted-foreground space-y-1">
            {!kycUser.restrictions.canTrade && (
              <li>• Trading is restricted until Level 1 verification</li>
            )}
            {!kycUser.restrictions.canDeposit && (
              <li>• Deposits are restricted until Level 2 verification</li>
            )}
            {!kycUser.restrictions.canWithdraw && (
              <li>• Withdrawals are restricted until Level 2 verification</li>
            )}
            {!kycUser.restrictions.canAccessFullPlatform && (
              <li>• Full platform access requires Level 3 verification</li>
            )}
          </ul>
        </div>

        {/* Action Button */}
        <Button 
          onClick={() => navigate(levelInfo.actionLink)}
          className="w-full"
        >
          {levelInfo.action}
        </Button>
      </CardContent>
    </Card>
  );
};

export default KYCRestriction; 