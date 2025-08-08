import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useCryptoPrices } from '@/hooks/useCryptoPrices'
import { TrendingUp, TrendingDown, DollarSign, Users, Activity, Shield, Zap, Globe } from 'lucide-react'

const ViewOnlyDashboard: React.FC = () => {
  const navigate = useNavigate()
  const { getPrice } = useCryptoPrices()

  const handleGetStarted = () => {
    navigate('/auth')
  }

  const cryptoData = [
    { symbol: 'BTC', name: 'Bitcoin' },
    { symbol: 'ETH', name: 'Ethereum' },
    { symbol: 'BNB', name: 'Binance Coin' },
    { symbol: 'ADA', name: 'Cardano' },
    { symbol: 'SOL', name: 'Solana' },
    { symbol: 'DOT', name: 'Polkadot' }
  ]

  const features = [
    {
      icon: <TrendingUp className="h-6 w-6" />,
      title: 'Advanced Trading',
      description: 'Spot, futures, options, and binary trading with real-time data'
    },
    {
      icon: <Zap className="h-6 w-6" />,
      title: 'Trading Bots',
      description: 'Automated trading strategies with customizable parameters'
    },
    {
      icon: <Shield className="h-6 w-6" />,
      title: 'Secure Platform',
      description: 'Bank-grade security with KYC verification and 2FA protection'
    },
    {
      icon: <Globe className="h-6 w-6" />,
      title: 'Global Access',
      description: 'Trade from anywhere with our mobile-responsive platform'
    }
  ]

  const stats = [
    { label: 'Active Users', value: '50K+', icon: <Users className="h-4 w-4" /> },
    { label: 'Daily Volume', value: '$2.5B+', icon: <Activity className="h-4 w-4" /> },
    { label: 'Countries', value: '150+', icon: <Globe className="h-4 w-4" /> },
    { label: 'Security', value: '99.9%', icon: <Shield className="h-4 w-4" /> }
  ]

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Hero Section */}
      <div className="text-center space-y-6 py-12">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Welcome to Kryvex Trading
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Experience the future of cryptocurrency trading with advanced tools, real-time data, and secure transactions.
        </p>
        <div className="flex justify-center space-x-4">
          <Button size="lg" onClick={handleGetStarted} className="bg-gradient-to-r from-blue-600 to-purple-600">
            Get Started
          </Button>
          <Button variant="outline" size="lg" onClick={() => navigate('/market')}>
            View Markets
          </Button>
        </div>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index} className="text-center">
            <CardContent className="pt-6">
              <div className="flex justify-center mb-2">
                {stat.icon}
              </div>
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Live Crypto Prices */}
      <div>
        <h2 className="text-2xl font-bold mb-6">Live Market Prices</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cryptoData.map((crypto) => {
            const priceData = getPrice(crypto.symbol)
            return (
              <Card key={crypto.symbol} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="text-lg">{crypto.name}</CardTitle>
                      <CardDescription>{crypto.symbol}/USD</CardDescription>
                    </div>
                    <Badge variant={priceData?.isPositive ? 'default' : 'secondary'}>
                      {priceData?.isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {priceData?.price || '$--'}
                  </div>
                  <div className={`text-sm ${priceData?.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                    {priceData?.change || '--'}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Features Section */}
      <div>
        <h2 className="text-2xl font-bold mb-6">Platform Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.map((feature, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="text-blue-600">
                    {feature.icon}
                  </div>
                  <CardTitle>{feature.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="text-center space-y-6 py-12 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
        <h2 className="text-3xl font-bold">Ready to Start Trading?</h2>
        <p className="text-lg text-muted-foreground">
          Join thousands of traders and experience the most advanced cryptocurrency trading platform.
        </p>
        <div className="flex justify-center space-x-4">
          <Button size="lg" onClick={handleGetStarted} className="bg-gradient-to-r from-blue-600 to-purple-600">
            Create Account
          </Button>
          <Button variant="outline" size="lg" onClick={() => navigate('/auth')}>
            Sign In
          </Button>
        </div>
      </div>
    </div>
  )
}

export default ViewOnlyDashboard
