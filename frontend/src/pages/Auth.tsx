import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import KryvexLogo from '@/components/KryvexLogo';
import WhatsAppButton from '@/components/WhatsAppButton';
import { Shield, Mail, ArrowLeft } from 'lucide-react';

const Auth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [signInForm, setSignInForm] = useState({ email: '', password: '' });
  const [signUpForm, setSignUpForm] = useState({ 
    email: '', 
    password: '', 
    confirmPassword: '', 
    firstName: '',
    lastName: '',
    phone: ''
  });
  
  const { login, register } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    console.log('Attempting to sign in with:', signInForm.email);

    try {
      await login(signInForm.email, signInForm.password);
      
      toast({
        title: "Welcome back!",
        description: "You have successfully signed in."
      });
      navigate('/dashboard');
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
    
    if (signUpForm.password !== signUpForm.confirmPassword) {
      toast({
        variant: "destructive",
        title: "Password Mismatch",
        description: "Passwords do not match."
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
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Password</label>
                  <Input
                    type="password"
                    placeholder="Enter your password"
                    className="kucoin-input"
                    value={signInForm.password}
                    onChange={(e) => setSignInForm({...signInForm, password: e.target.value})}
                    required
                  />
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
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Password</label>
                  <Input
                    type="password"
                    placeholder="Create a password"
                    className="kucoin-input"
                    value={signUpForm.password}
                    onChange={(e) => setSignUpForm({...signUpForm, password: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Confirm Password</label>
                  <Input
                    type="password"
                    placeholder="Confirm your password"
                    className="kucoin-input"
                    value={signUpForm.confirmPassword}
                    onChange={(e) => setSignUpForm({...signUpForm, confirmPassword: e.target.value})}
                    required
                  />
                </div>
                
                <Button
                  type="submit" 
                  className="kucoin-btn-primary w-full"
                  disabled={isLoading}
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