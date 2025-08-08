import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Lock, TrendingUp, Shield, Zap, Users } from 'lucide-react'

interface LoginPromptProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  description?: string
}

const LoginPrompt: React.FC<LoginPromptProps> = ({
  isOpen,
  onClose,
  title = "Authentication Required",
  description = "Please sign in or create an account to access this feature."
}) => {
  const navigate = useNavigate()

  const handleSignIn = () => {
    onClose()
    navigate('/auth')
  }

  const handleSignUp = () => {
    onClose()
    navigate('/auth')
  }

  const features = [
    {
      icon: <TrendingUp className="h-5 w-5" />,
      title: "Advanced Trading",
      description: "Access spot, futures, options, and binary trading"
    },
    {
      icon: <Zap className="h-5 w-5" />,
      title: "Trading Bots",
      description: "Automated trading strategies and algorithms"
    },
    {
      icon: <Shield className="h-5 w-5" />,
      title: "Secure Platform",
      description: "Bank-grade security with KYC verification"
    },
    {
      icon: <Users className="h-5 w-5" />,
      title: "Community",
      description: "Join thousands of active traders"
    }
  ]

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center space-x-2">
            <Lock className="h-6 w-6 text-blue-600" />
            <DialogTitle>{title}</DialogTitle>
          </div>
          <DialogDescription>
            {description}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Features Grid */}
          <div className="grid grid-cols-2 gap-4">
            {features.map((feature, index) => (
              <Card key={index} className="border-dashed">
                <CardContent className="pt-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="text-blue-600">
                      {feature.icon}
                    </div>
                    <CardTitle className="text-sm">{feature.title}</CardTitle>
                  </div>
                  <CardDescription className="text-xs">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col space-y-3">
            <Button onClick={handleSignUp} className="w-full bg-gradient-to-r from-blue-600 to-purple-600">
              Create Account
            </Button>
            <Button variant="outline" onClick={handleSignIn} className="w-full">
              Sign In
            </Button>
          </div>

          {/* Additional Info */}
          <div className="text-center text-sm text-muted-foreground">
            <p>Creating an account is free and takes less than 2 minutes.</p>
            <p>No credit card required to start.</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default LoginPrompt
