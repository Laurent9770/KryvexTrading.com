import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import KryvexLogo from '@/components/KryvexLogo';
import WhatsAppButton from '@/components/WhatsAppButton';
import PasswordInput from '@/components/PasswordInput';
import { validatePassword } from '@/utils/passwordValidation';
import { Shield, Mail, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';

const Auth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [signInForm, setSignInForm] = useState({ 
    email: '', 
    password: '',
    rememberMe: false
  });
  const [signUpForm, setSignUpForm] = useState({ 
    email: '', 
    password: '', 
    confirmPassword: '', 
    firstName: '',
    lastName: '',
    phone: '',
    agreeToTerms: false
  });
  
  const { login, register } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    console.log('Attempting to sign in with:', signInForm.email);

    try {
      await login(signInForm.email, signInForm.password, signInForm.rememberMe);
      
      toast({
        title: "Welcome back!",
        description: "You have successfully signed in."
      });
      navigate('/');
    } catch (error) {
      console.error('Sign in error:', error);
      toast({
        variant: "destructive",
        title: "Sign In Failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred."
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate password strength
    const passwordValidation = validatePassword(signUpForm.password);
    if (!passwordValidation.isValid) {
      toast({
        variant: "destructive",
        title: "Weak Password",
        description: "Please ensure your password meets all security requirements."
      });
      return;
    }
    
    if (signUpForm.password !== signUpForm.confirmPassword) {
      toast({
        variant: "destructive",
        title: "Password Mismatch",
        description: "Passwords do not match."
      });
      return;
    }

    if (!signUpForm.agreeToTerms) {
      toast({
        variant: "destructive",
        title: "Terms Agreement Required",
        description: "You must agree to the Terms and Conditions to create an account."
      });
      return;
    }

    setIsLoading(true);

    try {
      await register(signUpForm.email, signUpForm.password, signUpForm.firstName, signUpForm.lastName, signUpForm.phone);
      
      toast({
        title: "Account Created!",
        description: "You can now sign in with your credentials."
      });
    } catch (error) {
      console.error('Sign up error:', error);
      toast({
        variant: "destructive",
        title: "Sign Up Failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred."
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-elegant flex items-center justify-center p-4 relative">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      <div className="absolute top-20 left-10 w-72 h-72 bg-kucoin-green/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-kucoin-yellow/10 rounded-full blur-3xl"></div>
      
      {/* Back Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate('/')}
        className="absolute top-6 left-6 z-20 bg-card/80 backdrop-blur-sm border border-border/50 hover:bg-card/90 transition-all duration-200"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Home
      </Button>
      
      {/* WhatsApp Button */}
      <WhatsAppButton />
      
      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-6">
            <KryvexLogo size="lg" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Join the Future of Trading
          </h1>
          <p className="text-muted-foreground">
            Secure, Fast, and Professional Crypto Trading Platform
          </p>
        </div>

        <Card className="kucoin-card p-6">
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6 bg-kucoin-dark">
              <TabsTrigger value="signin" className="data-[state=active]:bg-kucoin-green data-[state=active]:text-white">Sign In</TabsTrigger>
              <TabsTrigger value="signup" className="data-[state=active]:bg-kucoin-green data-[state=active]:text-white">Sign Up</TabsTrigger>
            </TabsList>
            
            <TabsContent value="signin" className="space-y-4">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Email</label>
                  <Input
                    type="email"
                    placeholder="Enter your email"
                    className="kucoin-input"
                    value={signInForm.email}
                    onChange={(e) => setSignInForm({...signInForm, email: e.target.value})}
                    required
                  />
                </div>
                
                <PasswordInput
                  value={signInForm.password}
                  onChange={(value) => setSignInForm({...signInForm, password: value})}
                  placeholder="Enter your password"
                  label="Password"
                  required
                />
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="rememberMe"
                    checked={signInForm.rememberMe}
                    onCheckedChange={(checked) => 
                      setSignInForm({...signInForm, rememberMe: checked as boolean})
                    }
                  />
                  <label
                    htmlFor="rememberMe"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Remember me
                  </label>
                </div>
                
                <Button
                  type="submit" 
                  className="kucoin-btn-primary w-full"
                  disabled={isLoading}
                >
                  <Mail className="w-4 h-4 mr-2" />
                  {isLoading ? 'Signing In...' : 'Sign In'}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup" className="space-y-4">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">First Name</label>
                  <Input
                    type="text"
                    placeholder="Enter your first name"
                    className="kucoin-input"
                    value={signUpForm.firstName}
                    onChange={(e) => setSignUpForm({...signUpForm, firstName: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Last Name</label>
                  <Input
                    type="text"
                    placeholder="Enter your last name"
                    className="kucoin-input"
                    value={signUpForm.lastName}
                    onChange={(e) => setSignUpForm({...signUpForm, lastName: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Phone Number</label>
                  <Input
                    type="tel"
                    placeholder="Enter your phone number"
                    className="kucoin-input"
                    value={signUpForm.phone}
                    onChange={(e) => setSignUpForm({...signUpForm, phone: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Email</label>
                  <Input
                    type="email"
                    placeholder="Enter your email"
                    className="kucoin-input"
                    value={signUpForm.email}
                    onChange={(e) => setSignUpForm({...signUpForm, email: e.target.value})}
                    required
                  />
                </div>
                
                <PasswordInput
                  value={signUpForm.password}
                  onChange={(value) => setSignUpForm({...signUpForm, password: value})}
                  placeholder="Create a strong password"
                  label="Password"
                  required
                  showStrength
                />
                
                <PasswordInput
                  value={signUpForm.confirmPassword}
                  onChange={(value) => setSignUpForm({...signUpForm, confirmPassword: value})}
                  placeholder="Confirm your password"
                  label="Confirm Password"
                  required
                />
                
                <div className="space-y-3">
                  <div className="flex items-start space-x-2">
                    <Checkbox
                      id="agreeToTerms"
                      checked={signUpForm.agreeToTerms}
                      onCheckedChange={(checked) => 
                        setSignUpForm({...signUpForm, agreeToTerms: checked as boolean})
                      }
                      className="mt-1"
                    />
                    <label
                      htmlFor="agreeToTerms"
                      className="text-sm leading-relaxed peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      I agree to the{' '}
                      <a 
                        href="/terms" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-kucoin-green hover:underline"
                      >
                        Terms and Conditions
                      </a>
                      {' '}and{' '}
                      <a 
                        href="/privacy" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-kucoin-green hover:underline"
                      >
                        Privacy Policy
                      </a>
                    </label>
                  </div>
                  
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                    <div className="flex items-start space-x-2">
                      <CheckCircle className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                      <div className="text-xs text-blue-700 dark:text-blue-300">
                        <p className="font-medium mb-1">Password Requirements:</p>
                        <ul className="space-y-1">
                          <li>• At least 8 characters</li>
                          <li>• At least one uppercase letter</li>
                          <li>• At least one lowercase letter</li>
                          <li>• At least one number</li>
                          <li>• At least one special character</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
                
                <Button
                  type="submit" 
                  className="kucoin-btn-primary w-full"
                  disabled={isLoading || !signUpForm.agreeToTerms}
                >
                  <Mail className="w-4 h-4 mr-2" />
                  {isLoading ? 'Creating Account...' : 'Create Account'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="mt-6 text-center">
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Shield className="w-4 h-4" />
              <span>Bank-level security & encryption</span>
            </div>
            <div className="mt-4 text-xs text-muted-foreground">
              Need help? Contact us on WhatsApp: +17153046643
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Auth;