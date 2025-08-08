import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useCryptoPrices } from '@/hooks/useCryptoPrices'
import { TrendingUp, TrendingDown, Search, Star, Eye, Lock } from 'lucide-react'

const ViewOnlyMarketPage: React.FC = () => {
  const navigate = useNavigate()
  const { getPrice } = useCryptoPrices()
  const [searchTerm, setSearchTerm] = useState('')

  const handleGetStarted = () => {
    navigate('/auth')
  }

  const cryptoData = [
    { symbol: 'BTC', name: 'Bitcoin', marketCap: '$1.2T', volume: '$45.2B', change24h: 2.5 },
    { symbol: 'ETH', name: 'Ethereum', marketCap: '$450B', volume: '$18.7B', change24h: -1.2 },
    { symbol: 'BNB', name: 'Binance Coin', marketCap: '$85B', volume: '$2.1B', change24h: 3.8 },
    { symbol: 'ADA', name: 'Cardano', marketCap: '$35B', volume: '$890M', change24h: -0.5 },
    { symbol: 'SOL', name: 'Solana', marketCap: '$28B', volume: '$1.2B', change24h: 5.2 },
    { symbol: 'DOT', name: 'Polkadot', marketCap: '$22B', volume: '$650M', change24h: -2.1 },
    { symbol: 'LINK', name: 'Chainlink', marketCap: '$18B', volume: '$420M', change24h: 1.8 },
    { symbol: 'MATIC', name: 'Polygon', marketCap: '$15B', volume: '$380M', change24h: 4.3 },
    { symbol: 'AVAX', name: 'Avalanche', marketCap: '$12B', volume: '$290M', change24h: -1.7 },
    { symbol: 'UNI', name: 'Uniswap', marketCap: '$10B', volume: '$180M', change24h: 2.9 },
    { symbol: 'ATOM', name: 'Cosmos', marketCap: '$8B', volume: '$150M', change24h: -0.8 },
    { symbol: 'FTM', name: 'Fantom', marketCap: '$6B', volume: '$120M', change24h: 6.1 }
  ]

  const filteredData = cryptoData.filter(crypto =>
    crypto.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    crypto.symbol.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Market Overview</h1>
          <p className="text-muted-foreground">Real-time cryptocurrency market data</p>
        </div>
        <Button onClick={handleGetStarted} className="bg-gradient-to-r from-blue-600 to-purple-600">
          Start Trading
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search cryptocurrencies..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Market Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">$2.5T</div>
            <div className="text-sm text-muted-foreground">Total Market Cap</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">$85.2B</div>
            <div className="text-sm text-muted-foreground">24h Volume</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">2,847</div>
            <div className="text-sm text-muted-foreground">Active Pairs</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">150+</div>
            <div className="text-sm text-muted-foreground">Countries</div>
          </CardContent>
        </Card>
      </div>

      {/* Market Table */}
      <Card>
        <CardHeader>
          <CardTitle>Top Cryptocurrencies</CardTitle>
          <CardDescription>Live market data and price information</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredData.map((crypto) => {
              const priceData = getPrice(crypto.symbol)
              const isPositive = crypto.change24h > 0
              
              return (
                <div key={crypto.symbol} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <Star className="h-4 w-4 text-yellow-500" />
                      <span className="font-semibold">{crypto.symbol}</span>
                    </div>
                    <div>
                      <div className="font-medium">{crypto.name}</div>
                      <div className="text-sm text-muted-foreground">{crypto.marketCap}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-6">
                    <div className="text-right">
                      <div className="font-semibold">{priceData?.price || '$--'}</div>
                      <div className={`text-sm ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                        {isPositive ? '+' : ''}{crypto.change24h}%
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">Volume</div>
                      <div className="font-medium">{crypto.volume}</div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {isPositive ? (
                        <TrendingUp className="h-4 w-4 text-green-600" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-red-600" />
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate('/auth')}
                        className="flex items-center space-x-1"
                      >
                        <Lock className="h-3 w-3" />
                        <span>Trade</span>
                      </Button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* CTA Section */}
      <div className="text-center space-y-6 py-12 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
        <h2 className="text-3xl font-bold">Ready to Start Trading?</h2>
        <p className="text-lg text-muted-foreground">
          Create an account to access advanced trading features, real-time charts, and automated trading bots.
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

export default ViewOnlyMarketPage
