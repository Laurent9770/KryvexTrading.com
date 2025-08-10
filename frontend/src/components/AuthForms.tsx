import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Eye, EyeOff, Mail, Lock, User, Phone, MessageSquare, Clock } from 'lucide-react';
import ForgotPassword from './ForgotPassword';

interface LoginFormProps {
  onSuccess?: () => void;
}

interface RegisterFormProps {
  onSuccess?: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const { login, loginWithGoogle } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await login(email, password);
      console.log('✅ Login completed, preparing to navigate...');
      
      // Add a small delay to ensure auth state is updated
      setTimeout(() => {
        console.log('🔄 Navigating to dashboard...');
        onSuccess?.();
        
        // Try React Router navigation first, fallback to window.location
        try {
          navigate('/dashboard', { replace: true });
        } catch (navError) {
          console.warn('React Router navigation failed, using window.location:', navError);
          window.location.href = '/dashboard';
        }
      }, 500);
      
    } catch (error) {
      toast({
        title: "Login Failed",
        description: error instanceof Error ? error.message : "Invalid credentials. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      await loginWithGoogle();
      // Redirect will happen automatically with OAuth
    } catch (error) {
      toast({
        title: "Google Sign-In Failed",
        description: error instanceof Error ? error.message : "Failed to sign in with Google. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGoogleLoading(false);
    }
  };

  if (showForgotPassword) {
    return (
      <ForgotPassword onBack={() => setShowForgotPassword(false)} />
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
        <CardDescription>Sign in to your Kryvex Trading account</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Google Sign-In Button */}
        <Button
          type="button"
          variant="outline"
          className="w-full mb-4"
          onClick={handleGoogleSignIn}
          disabled={isGoogleLoading || isLoading}
        >
          <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          {isGoogleLoading ? "Signing in..." : "Continue with Google"}
        </Button>

        {/* Divider */}
        <div className="relative mb-4">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Or continue with email
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10"
                required
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 pr-10"
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
            <div className="text-right">
              <Button
                type="button"
                variant="link"
                size="sm"
                className="px-0 text-sm text-blue-600 hover:text-blue-800"
                onClick={() => setShowForgotPassword(true)}
              >
                Forgot password?
              </Button>
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Signing in..." : "Sign In"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export const RegisterForm: React.FC<RegisterFormProps> = ({ onSuccess }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const { register, loginWithGoogle } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Passwords Don't Match",
        description: "Please make sure your passwords match.",
        variant: "destructive"
      });
      return;
    }

    if (formData.password.length < 8) {
      toast({
        title: "Password Too Short",
        description: "Password must be at least 8 characters long.",
        variant: "destructive"
      });
      return;
    }

    // Enhanced password validation to match Supabase requirements
    const hasLower = /[a-z]/.test(formData.password);
    const hasUpper = /[A-Z]/.test(formData.password);
    const hasNumber = /[0-9]/.test(formData.password);
    const hasSpecial = /[!@#$%^&*()_+\-=\[\]{}|\\:";'<>?,.\/]/.test(formData.password);
    
    if (!hasLower || !hasUpper || !hasNumber || !hasSpecial) {
      toast({
        title: "Password Requirements",
        description: "Password must contain at least one uppercase letter, lowercase letter, number, and special character.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      await register(
        formData.email,
        formData.password,
        formData.firstName,
        formData.lastName,
        formData.phone
      );
      console.log('✅ Registration completed, preparing to navigate...');
      
      // Add a small delay to ensure auth state is updated
      setTimeout(() => {
        console.log('🔄 Navigating to dashboard after registration...');
        toast({
          title: "Registration Successful",
          description: "Welcome to Kryvex Trading! Your account has been created.",
        });
        onSuccess?.();
        
        // Try React Router navigation first, fallback to window.location
        try {
          navigate('/dashboard', { replace: true });
        } catch (navError) {
          console.warn('React Router navigation failed, using window.location:', navError);
          window.location.href = '/dashboard';
        }
      }, 500);
      
    } catch (error) {
      toast({
        title: "Registration Failed",
        description: error instanceof Error ? error.message : "Failed to create account. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      await loginWithGoogle();
      // Redirect will happen automatically with OAuth
    } catch (error) {
      toast({
        title: "Google Sign-In Failed",
        description: error instanceof Error ? error.message : "Failed to sign in with Google. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">Create Account</CardTitle>
        <CardDescription>Join Kryvex Trading Platform</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Google Sign-In Button */}
        <Button
          type="button"
          variant="outline"
          className="w-full mb-4"
          onClick={handleGoogleSignIn}
          disabled={isGoogleLoading || isLoading}
        >
          <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          {isGoogleLoading ? "Signing in..." : "Continue with Google"}
        </Button>

        {/* Divider */}
        <div className="relative mb-4">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Or create account with email
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="firstName"
                  type="text"
                  placeholder="First name"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="lastName"
                  type="text"
                  placeholder="Last name"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="pl-10"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone (Optional)</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="phone"
                type="tel"
                placeholder="Enter your phone number"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Create a password"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                className="pl-10 pr-10"
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Password must contain: uppercase, lowercase, number, and special character
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                className="pl-10 pr-10"
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Creating account..." : "Create Account"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export const PhoneLoginForm: React.FC<LoginFormProps> = ({ onSuccess }) => {
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [sessionId, setSessionId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const { sendPhoneOTP, loginWithPhone, resendPhoneOTP } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Countdown timer for OTP expiry
  React.useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const formatPhoneNumber = (value: string) => {
    // Remove all non-digits
    const cleaned = value.replace(/\D/g, '');
    
    // Format as international number
    if (cleaned.startsWith('44')) {
      return '+' + cleaned;
    } else if (cleaned.startsWith('0')) {
      return '+44' + cleaned.slice(1);
    } else if (cleaned.length <= 11) {
      return '+44' + cleaned;
    }
    
    return '+' + cleaned;
  };

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const formattedPhone = formatPhoneNumber(phoneNumber);
      const result = await sendPhoneOTP(formattedPhone);
      
      if (result.success && result.sessionId) {
        setSessionId(result.sessionId);
        setStep('otp');
        setCountdown(60); // 60 seconds countdown
        toast({
          title: "OTP Sent",
          description: `Verification code sent to ${formattedPhone}`,
        });
      }
    } catch (error) {
      // Error already handled in AuthContext
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const formattedPhone = formatPhoneNumber(phoneNumber);
      await loginWithPhone(sessionId, otp, formattedPhone);
      onSuccess?.();
      navigate('/dashboard');
    } catch (error) {
      // Error already handled in AuthContext
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setIsLoading(true);
    try {
      const formattedPhone = formatPhoneNumber(phoneNumber);
      const result = await resendPhoneOTP(sessionId, formattedPhone);
      
      if (result.success && result.sessionId) {
        setSessionId(result.sessionId);
        setCountdown(60);
        setOtp(''); // Clear previous OTP
      }
    } catch (error) {
      // Error already handled in AuthContext
    } finally {
      setIsLoading(false);
    }
  };

  const goBack = () => {
    setStep('phone');
    setOtp('');
    setCountdown(0);
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">
          {step === 'phone' ? 'Phone Login' : 'Verify OTP'}
        </CardTitle>
        <CardDescription>
          {step === 'phone' 
            ? 'Enter your phone number to receive a verification code'
            : `Enter the 6-digit code sent to ${formatPhoneNumber(phoneNumber)}`
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        {step === 'phone' ? (
          <form onSubmit={handleSendOTP} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+44 7123 456789"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Enter with country code (e.g., +44 for UK)
              </p>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Sending..." : "Send Verification Code"}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOTP} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="otp">Verification Code</Label>
              <div className="relative">
                <MessageSquare className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="otp"
                  type="text"
                  placeholder="123456"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="pl-10 text-center text-lg tracking-widest"
                  maxLength={6}
                  required
                />
              </div>
              {countdown > 0 && (
                <div className="flex items-center justify-center text-sm text-muted-foreground">
                  <Clock className="h-4 w-4 mr-1" />
                  Code expires in {countdown}s
                </div>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isLoading || otp.length !== 6}>
              {isLoading ? "Verifying..." : "Verify & Login"}
            </Button>

            <div className="flex flex-col space-y-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleResendOTP}
                disabled={isLoading || countdown > 0}
                className="w-full"
              >
                {isLoading ? "Resending..." : "Resend Code"}
              </Button>
              
              <Button
                type="button"
                variant="ghost"
                onClick={goBack}
                className="w-full"
              >
                Change Phone Number
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
};

export const AuthTabs: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Redirect if already authenticated
  if (isAuthenticated) {
    navigate('/dashboard');
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="login">Email</TabsTrigger>
            <TabsTrigger value="phone">Phone</TabsTrigger>
            <TabsTrigger value="register">Sign Up</TabsTrigger>
          </TabsList>
          
          <TabsContent value="login">
            <LoginForm />
          </TabsContent>
          
          <TabsContent value="phone">
            <PhoneLoginForm />
          </TabsContent>
          
          <TabsContent value="register">
            <RegisterForm />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
