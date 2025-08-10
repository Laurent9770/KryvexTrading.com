import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { TrendingUp, TrendingDown, DollarSign, BarChart3, PieChart, Target, BookOpen, Activity, Settings, Star, Wallet, Clock, TrendingDown as Down, TrendingUp as Up, Brain, Bot, Lock, CircleDollarSign, RefreshCw, Zap, Shield, AlertTriangle, Calculator, Info, Timer, Search, Filter, Eye, Play, Pause, Plus, Code, Rocket, X, Loader2, Percent, Coins, Award, Unlock } from "lucide-react";
import TradeHistory from "@/components/TradeHistory";
import { useCryptoPrices } from "@/hooks/useCryptoPrices";
import TradingViewChart from "@/components/TradingViewChart";

import React, { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import supabaseTradingPageService, { TradeRequest } from "@/services/supabaseTradingPageService";
import { cryptoPriceService } from "@/services/cryptoPriceService";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { CardHeader, CardTitle, CardContent } from "@/components/ui/card";
// import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const TradingPage = () => {
  const { prices, getPrice } = useCryptoPrices();
  const { toast } = useToast();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { realTimePrices, tradingAccount, addActivity, addTrade, updateTradingBalance, user, isAuthenticated } = useAuth();
  
  // Set up user ID for trading service
  useEffect(() => {
    if (user?.id) {
      supabaseTradingPageService.setUserId(user.id);
    }
  }, [user?.id]);

  // Handle authentication for trading actions (KYC restrictions removed)
  const handleTradeAction = (action: string) => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please sign in or create an account to start trading",
        variant: "destructive"
      });
      navigate('/auth');
      return false;
    }

    // KYC restrictions removed - all authenticated users can trade
    return true; // Allow trading for all authenticated users
  };
  
  const [activeTab, setActiveTab] = useState("spot");
  const [selectedPair, setSelectedPair] = useState('BTC/USDT');
  const [orderType, setOrderType] = useState('limit');
  const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy');
  const [amount, setAmount] = useState('');
  const [price, setPrice] = useState('');
  const [stopPrice, setStopPrice] = useState('');
  const [percentage, setPercentage] = useState([25]);
  const [postOnly, setPostOnly] = useState(false);
  const [reduceOnly, setReduceOnly] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);

  // Spot Trading with Countdown Timer
  const [spotDirection, setSpotDirection] = useState<'buy' | 'sell'>('buy');
  const [spotAmount, setSpotAmount] = useState('');
  const [spotDuration, setSpotDuration] = useState(5); // minutes
  const [activeSpotTrade, setActiveSpotTrade] = useState<any>(null);
  const [spotCountdown, setSpotCountdown] = useState(0);
  const [spotTrades, setSpotTrades] = useState<any[]>([]);
  const [openPositions, setOpenPositions] = useState<any[]>([]);
  const [spotTradeHistory, setSpotTradeHistory] = useState<any[]>([]);

  // Futures Trading State
  const [futuresLeverage, setFuturesLeverage] = useState([10]);
  const [futuresPosition, setFuturesPosition] = useState<'long' | 'short'>('long');
  const [futuresOrderType, setFuturesOrderType] = useState<'market' | 'limit' | 'stop'>('limit');
  const [futuresAmount, setFuturesAmount] = useState("");
  const [futuresPrice, setFuturesPrice] = useState("");
  const [futuresStopPrice, setFuturesStopPrice] = useState("");
  const [futuresCrossMargin, setFuturesCrossMargin] = useState(true);
  const [futuresPostOnly, setFuturesPostOnly] = useState(false);
  const [futuresReduceOnly, setFuturesReduceOnly] = useState(false);

  // Timed Futures Trading
  const [futuresDuration, setFuturesDuration] = useState(5); // minutes
  const [activeFuturesTrade, setActiveFuturesTrade] = useState<any>(null);
  const [futuresCountdown, setFuturesCountdown] = useState(0);
  const [futuresOpenPositions, setFuturesOpenPositions] = useState<any[]>([]);
  const [futuresTradeHistory, setFuturesTradeHistory] = useState<any[]>([]);

  // Advanced Futures Order Types
  const [futuresTakeProfit, setFuturesTakeProfit] = useState("");
  const [futuresStopLoss, setFuturesStopLoss] = useState("");
  const [futuresTriggerPrice, setFuturesTriggerPrice] = useState("");
  const [futuresPendingOrders, setFuturesPendingOrders] = useState<any[]>([]);

  // Futures Data - Use real crypto prices instead of mock data
  const [futuresPairs, setFuturesPairs] = useState<any[]>([]);

  // Dynamic futures order book based on selected pair
  const [futuresOrderBook, setFuturesOrderBook] = useState({
    asks: [],
    bids: []
  });

  // Load real futures data from crypto price service
  useEffect(() => {
    const loadFuturesData = () => {
      const cryptoPrices = cryptoPriceService.getPrices();
      const pairs = Array.from(cryptoPrices.values()).map(crypto => ({
        symbol: `${crypto.symbol}USDT`,
        name: crypto.name,
        price: crypto.rawPrice,
        change: crypto.rawChange,
        volume: crypto.volume,
        funding: `${(Math.random() * 0.02 - 0.01).toFixed(4)}%` // Simulated funding rate
      }));
      setFuturesPairs(pairs);
      
      // Generate dynamic order book for selected pair
      const selectedPairData = pairs.find(p => p.symbol === selectedPair) || pairs[0];
      if (selectedPairData) {
        const basePrice = selectedPairData.price;
        const spread = basePrice * 0.001; // 0.1% spread
        
        const newBids = Array.from({ length: 5 }, (_, i) => {
          const price = basePrice - (spread * (i + 1));
          const amount = (Math.random() * 0.5 + 0.05).toFixed(5);
          const total = (parseFloat(amount) * price).toFixed(2);
          return {
            price: price,
            amount: parseFloat(amount),
            total: parseFloat(total)
          };
        });

        const newAsks = Array.from({ length: 5 }, (_, i) => {
          const price = basePrice + (spread * (i + 1));
          const amount = (Math.random() * 0.5 + 0.05).toFixed(5);
          const total = (parseFloat(amount) * price).toFixed(2);
          return {
            price: price,
            amount: parseFloat(amount),
            total: parseFloat(total)
          };
        });

        setFuturesOrderBook({ bids: newBids, asks: newAsks });
      }
    };

    loadFuturesData();
    
    // Subscribe to price updates
    const unsubscribe = cryptoPriceService.subscribe(() => {
      loadFuturesData();
    });

    return () => {
      if (unsubscribe && typeof unsubscribe === 'function') {
        try {
          unsubscribe();
        } catch (error) {
          console.warn('Error unsubscribing from crypto price service in TradingPage:', error);
        }
      }
    };
  }, [selectedPair]);

  // Real-time order book data
  const [orderBook, setOrderBook] = useState({
    bids: [
      { price: '45250.50', amount: '0.15432', total: '6,983.45' },
      { price: '45249.80', amount: '0.32156', total: '14,546.78' },
      { price: '45248.90', amount: '0.08965', total: '4,055.12' },
      { price: '45247.10', amount: '0.25478', total: '11,525.89' },
      { price: '45246.20', amount: '0.19832', total: '8,975.36' },
    ],
    asks: [
      { price: '45251.20', amount: '0.18956', total: '8,578.95' },
      { price: '45252.10', amount: '0.09876', total: '4,468.21' },
      { price: '45253.80', amount: '0.35214', total: '15,932.47' },
      { price: '45254.90', amount: '0.12456', total: '5,637.85' },
      { price: '45256.00', amount: '0.28745', total: '13,005.29' },
    ]
  });

  // Real-time recent trades
  const [recentTrades, setRecentTrades] = useState([
    { price: '45251.20', amount: '0.0125', time: '14:32:15', type: 'buy' },
    { price: '45250.80', amount: '0.0089', time: '14:32:12', type: 'sell' },
    { price: '45251.50', amount: '0.0156', time: '14:32:08', type: 'buy' },
    { price: '45250.20', amount: '0.0234', time: '14:32:05', type: 'sell' },
    { price: '45251.80', amount: '0.0078', time: '14:32:01', type: 'buy' },
  ]);

  // Update order book with real-time data
  useEffect(() => {
    const updateOrderBook = () => {
      const basePrice = realTimePrices[selectedPair.split('/')[0]]?.price || 48500;
      const spread = basePrice * 0.001; // 0.1% spread
      
      const newBids = Array.from({ length: 5 }, (_, i) => {
        const price = basePrice - (spread * (i + 1));
        const amount = (Math.random() * 0.5 + 0.05).toFixed(5);
        const total = (parseFloat(amount) * price).toFixed(2);
        return {
          price: price.toFixed(2),
          amount,
          total: parseFloat(total).toLocaleString()
        };
      });

      const newAsks = Array.from({ length: 5 }, (_, i) => {
        const price = basePrice + (spread * (i + 1));
        const amount = (Math.random() * 0.5 + 0.05).toFixed(5);
        const total = (parseFloat(amount) * price).toFixed(2);
        return {
          price: price.toFixed(2),
          amount,
          total: parseFloat(total).toLocaleString()
        };
      });

      setOrderBook({ bids: newBids, asks: newAsks });
    };

    updateOrderBook();
    const interval = setInterval(updateOrderBook, 3000); // Update every 3 seconds

    return () => clearInterval(interval);
  }, [realTimePrices, selectedPair]);

  // Update recent trades with real-time data
  useEffect(() => {
    const updateRecentTrades = () => {
      const basePrice = realTimePrices[selectedPair.split('/')[0]]?.price || 48500;
      const newTrade = {
        price: (basePrice + (Math.random() - 0.5) * 100).toFixed(2),
        amount: (Math.random() * 0.1 + 0.01).toFixed(4),
        time: new Date().toLocaleTimeString('en-US', { hour12: false }),
        type: Math.random() > 0.5 ? 'buy' : 'sell'
      };

      setRecentTrades(prev => [newTrade, ...prev.slice(0, 4)]);
    };

    const interval = setInterval(updateRecentTrades, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, [realTimePrices, selectedPair]);

  // Load existing spot trades from localStorage
  useEffect(() => {
    const loadSpotTrades = () => {
      try {
        const savedOpenPositions = localStorage.getItem('spotOpenPositions');
        const savedTradeHistory = localStorage.getItem('spotTradeHistory');
        
        if (savedOpenPositions) {
          const positions = JSON.parse(savedOpenPositions);
          // Filter out expired positions
          const validPositions = positions.filter((pos: any) => 
            new Date(pos.end_time).getTime() > new Date().getTime()
          );
          setOpenPositions(validPositions);
        }
        
        if (savedTradeHistory) {
          const history = JSON.parse(savedTradeHistory);
          // Only show trades from last 7 days
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
          const recentHistory = history.filter((trade: any) => 
            new Date(trade.start_time) > sevenDaysAgo
          );
          setSpotTradeHistory(recentHistory);
        }
      } catch (error) {
        console.error('Error loading spot trades:', error);
      }
    };

    const loadFuturesTrades = () => {
      try {
        const savedFuturesOpenPositions = localStorage.getItem('futuresOpenPositions');
        const savedFuturesTradeHistory = localStorage.getItem('futuresTradeHistory');
        
        if (savedFuturesOpenPositions) {
          const positions = JSON.parse(savedFuturesOpenPositions);
          // Filter out expired positions
          const validPositions = positions.filter((pos: any) => 
            new Date(pos.end_time).getTime() > new Date().getTime()
          );
          setFuturesOpenPositions(validPositions);
        }
        
        if (savedFuturesTradeHistory) {
          const history = JSON.parse(savedFuturesTradeHistory);
          // Only show trades from last 7 days
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
          const recentHistory = history.filter((trade: any) => 
            new Date(trade.start_time) > sevenDaysAgo
          );
          setFuturesTradeHistory(recentHistory);
        }
      } catch (error) {
        console.error('Error loading futures trades:', error);
      }
    };

    loadSpotTrades();
    loadFuturesTrades();
  }, []);

  // Save spot trades to localStorage
  const saveSpotTrades = () => {
    try {
      localStorage.setItem('spotOpenPositions', JSON.stringify(openPositions));
      localStorage.setItem('spotTradeHistory', JSON.stringify(spotTradeHistory));
    } catch (error) {
      console.error('Error saving spot trades:', error);
    }
  };

  // Save futures trades to localStorage
  const saveFuturesTrades = () => {
    try {
      localStorage.setItem('futuresOpenPositions', JSON.stringify(futuresOpenPositions));
      localStorage.setItem('futuresTradeHistory', JSON.stringify(futuresTradeHistory));
    } catch (error) {
      console.error('Error saving futures trades:', error);
    }
  };

  // Save trades whenever they change
  useEffect(() => {
    saveSpotTrades();
    saveFuturesTrades();
  }, [openPositions, spotTradeHistory, futuresOpenPositions, futuresTradeHistory]);

  const getTradingPairs = () => {
    const targetSymbols = ['BTC', 'ETH', 'BNB', 'SOL', 'ADA', 'XRP', 'DOT', 'LINK'];
    return targetSymbols.map(symbol => {
      const crypto = prices.find(p => p.symbol === symbol);
      const realTimeData = realTimePrices[symbol];
      
      return {
        symbol: `${crypto?.symbol || symbol}/USDT`,
        price: realTimeData ? `$${realTimeData.price.toLocaleString()}` : crypto?.price || '--',
        change: realTimeData ? `${realTimeData.change >= 0 ? '+' : ''}${realTimeData.change.toFixed(2)}%` : crypto?.change || '--',
        volume: crypto?.volume || '--',
        trend: realTimeData ? (realTimeData.change >= 0 ? 'up' : 'down') : (crypto?.isPositive ? 'up' : 'down')
      };
    });
  };

  const tradingPairs = getTradingPairs();
  const currentPrice = getPrice(selectedPair.split('/')[0]);
  const realTimePrice = realTimePrices[selectedPair.split('/')[0]];

  const handlePlaceOrder = async () => {
    if (!amount || (orderType !== 'market' && !price)) {
      toast({
        variant: "destructive",
        title: "Invalid Order",
        description: "Please fill in all required fields"
      });
      return;
    }

    const orderPrice = orderType === 'market' ? 
      (realTimePrice?.price || parseFloat(price)) : 
      parseFloat(price);

    const tradeAmount = parseFloat(amount);

    setIsExecuting(true);
    try {
      const tradeRequest: TradeRequest = {
        type: 'market',
        side: tradeType,
        symbol: selectedPair.split('/')[0],
        quantity: tradeAmount,
        price: orderPrice,
      };

      const result = await supabaseTradingPageService.placeSpotTrade(tradeRequest);

      if (result) {
        const tradeActivity = {
          type: "spot" as const,
          action: tradeType.toUpperCase(),
          description: `${tradeType.toUpperCase()} ${amount} ${selectedPair.split('/')[0]} at $${orderPrice.toLocaleString()}`,
          symbol: selectedPair,
          amount: `${amount} ${selectedPair.split('/')[0]}`,
          price: `$${orderPrice.toLocaleString()}`,
          pnl: '0', // Will be calculated when trade completes
          status: "completed" as const,
          time: "Just now",
          icon: tradeType === 'buy' ? "📈" : "📉"
        };
        addActivity(tradeActivity);
        addTrade({
          pair: selectedPair,
          type: tradeType,
          amount: amount,
          price: `$${orderPrice.toLocaleString()}`,
          pnl: '0', // Will be calculated when trade completes
          status: "completed"
        });

        toast({
          title: "Order Placed Successfully",
          description: `${tradeType.toUpperCase()} ${amount} ${selectedPair.split('/')[0]} at ${orderType === 'market' ? 'market price' : `$${price}`}`
        });
      } else {
        toast({
          variant: "destructive",
          title: "Order Failed",
          description: "Unknown error occurred."
        });
      }
    } catch (error) {
      console.error("Error placing order:", error);
      toast({
        variant: "destructive",
        title: "Order Failed",
        description: "Failed to place order due to an unexpected error."
      });
    } finally {
      setIsExecuting(false);
    }

    // Reset form
    setAmount('');
    setPrice('');
    setStopPrice('');
    setPercentage([25]);
  };

  // Navigation functions
  const handleIndicators = () => {
    toast({
      title: "Indicators",
      description: "Technical indicators panel opened",
    });
  };

  const handleDrawingTools = () => {
    toast({
      title: "Drawing Tools",
      description: "Drawing tools panel opened",
    });
  };

  const handleSettings = () => {
    toast({
      title: "Settings",
      description: "Chart settings opened"
    });
  };

  // Spot Trading Functions
  const calculateSpotProfit = (duration: number, baseProfit: number = 5) => {
    return baseProfit + (duration * 0.5); // 0.5% per minute
  };

  const startSpotTrade = async () => {
    // Check authentication first
    if (!handleTradeAction('spot')) {
      return;
    }

    if (!spotAmount || parseFloat(spotAmount) <= 0) {
      toast({
        variant: "destructive",
        title: "Invalid Amount",
        description: "Please enter a valid amount"
      });
      return;
    }

    const amount = parseFloat(spotAmount);
    const tradingBalance = parseFloat(tradingAccount.USDT?.available.replace(/,/g, '') || '0');
    
    if (amount > tradingBalance) {
      toast({
        variant: "destructive",
        title: "Insufficient Funds",
        description: "Insufficient Trading Funds. Please transfer from Funding Account."
      });
      return;
    }

    setIsExecuting(true);
    try {
      const entryPrice = realTimePrice?.price || getPrice(selectedPair.split('/')[0])?.price || 45000;
      const profitPercentage = calculateSpotProfit(spotDuration);
      const endTime = new Date(Date.now() + spotDuration * 60 * 1000);
      
      const spotTrade = {
        id: Date.now().toString(),
        user_id: 'current-user',
        trade_type: 'spot',
        direction: spotDirection,
        amount: amount,
        entry_price: entryPrice,
        start_time: new Date().toISOString(),
        duration: spotDuration,
        end_time: endTime.toISOString(),
        status: 'open',
        outcome: 'pending',
        payout: null,
        profit_percentage: profitPercentage
      };

      setActiveSpotTrade(spotTrade);
      setSpotCountdown(spotDuration * 60); // Convert to seconds
      setSpotTrades(prev => [spotTrade, ...prev]);
      setOpenPositions(prev => [spotTrade, ...prev]); // Add to open positions

      // Deduct amount from trading account
      updateTradingBalance('USDT', amount, 'subtract');

      // Add to unified trading engine
      const tradeRequest = {
        type: 'market',
        side: spotDirection as 'buy' | 'sell',
        symbol: selectedPair,
        quantity: amount as number,
        price: entryPrice
      };
      
      // Execute the trade in the trading engine
      const result = await supabaseTradingPageService.executeTrade(tradeRequest);
      
      if (!result) {
        toast({
          variant: "destructive",
          title: "Trade Failed",
          description: "Failed to execute trade"
        });
        return;
      }

      // Add activity for immediate display
      const tradeActivity = {
        type: "spot" as const,
        action: `${spotDirection.toUpperCase()} SPOT STARTED`,
        description: `${spotDirection.toUpperCase()} spot trade started for $${amount}`,
        symbol: selectedPair,
        amount: `$${amount}`,
        price: `$${entryPrice.toLocaleString()}`,
        pnl: `Pending (${profitPercentage.toFixed(1)}%)`,
        status: 'running' as const,
        icon: "⏱️"
      };
      addActivity(tradeActivity);

      toast({
        title: "Spot Trade Started",
        description: `${spotDirection.toUpperCase()} trade for $${amount} started. Duration: ${spotDuration} minutes.`
      });

      setSpotAmount('');
    } catch (error) {
      console.error("Error starting spot trade:", error);
      toast({
        variant: "destructive",
        title: "Trade Failed",
        description: "Failed to start spot trade"
      });
    } finally {
      setIsExecuting(false);
    }
  };

  const endSpotTrade = async (trade: any) => {
    const currentMarketPrice = realTimePrice?.price || getPrice(selectedPair.split('/')[0])?.price || 45000;
    const entryPrice = trade.entry_price;
    let outcome = 'lose';
    let payout = 0;

    if (trade.direction === 'buy') {
      if (currentMarketPrice > entryPrice) {
        outcome = 'win';
        payout = trade.amount * (1 + trade.profit_percentage / 100);
      }
    } else { // sell
      if (currentMarketPrice < entryPrice) {
        outcome = 'win';
        payout = trade.amount * (1 + trade.profit_percentage / 100);
      }
    }

    const updatedTrade = {
      ...trade,
      status: 'completed',
      outcome,
      payout,
      end_price: currentMarketPrice,
      exit_time: new Date().toISOString(),
      completed_at: new Date().toISOString()
    };

    setActiveSpotTrade(null);
    setSpotCountdown(0);
    
    // Update the trade in all relevant arrays
    setSpotTrades(prev => prev.map(t => t.id === trade.id ? updatedTrade : t));
    
    // Move from open positions to history
    setOpenPositions(prev => prev.filter(t => t.id !== trade.id));
    setSpotTradeHistory(prev => [updatedTrade, ...prev]);

    // Add payout to trading account if won
    if (outcome === 'win') {
      updateTradingBalance('USDT', payout, 'add');
    }

    // Complete the spot trade in the trading engine
    await supabaseTradingPageService.completeSpotTrade(trade.id, outcome as 'win' | 'lose', currentMarketPrice, parseFloat(trade.profit_percentage) || 5);

    const tradeActivity = {
      type: "spot" as const,
      action: `${trade.direction.toUpperCase()} ${outcome.toUpperCase()}`,
      description: `${trade.direction.toUpperCase()} spot trade ${outcome} - ${outcome === 'win' ? `+$${(payout - trade.amount).toFixed(2)}` : `-$${trade.amount}`}`,
      symbol: selectedPair,
      amount: `$${trade.amount}`,
      price: `$${currentMarketPrice.toLocaleString()}`,
      pnl: outcome === 'win' ? `+$${(payout - trade.amount).toFixed(2)}` : `-$${trade.amount}`,
      status: outcome as 'win' | 'lose',
      icon: outcome === 'win' ? "🎉" : "💸"
    };
    addActivity(tradeActivity);

    toast({
      title: `Spot Trade ${outcome.toUpperCase()}`,
      description: outcome === 'win' 
        ? `You won $${(payout - trade.amount).toFixed(2)}!` 
        : `You lost $${trade.amount}`
    });

    // Save updated trade history to localStorage
    saveSpotTrades();
  };

  // Enhanced Countdown Timer Effect for Active Trade
  useEffect(() => {
    if (activeSpotTrade && spotCountdown > 0) {
      const timer = setInterval(async () => {
        setSpotCountdown(prev => {
          if (prev <= 1) {
            endSpotTrade(activeSpotTrade);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [activeSpotTrade, spotCountdown]);

  // Enhanced Countdown Timer for All Open Positions
  useEffect(() => {
    if (openPositions.length > 0) {
      const timer = setInterval(() => {
        setOpenPositions(prev => 
          prev.map(position => {
            const timeRemaining = Math.max(0, Math.floor((new Date(position.end_time).getTime() - new Date().getTime()) / 1000));
            
            // Update the position with current countdown
            const updatedPosition = {
              ...position,
              countdown: timeRemaining
            };
            
            // If countdown finished, complete the trade
            if (timeRemaining <= 0) {
              endSpotTrade(updatedPosition);
              return updatedPosition; // Will be filtered out in endSpotTrade
            }
            
            return updatedPosition;
          })
        );
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [openPositions]);

  // Auto-save trades every 30 seconds to ensure persistence
  useEffect(() => {
    const autoSaveTimer = setInterval(() => {
      saveSpotTrades();
      saveFuturesTrades();
    }, 30000); // Save every 30 seconds

    return () => clearInterval(autoSaveTimer);
  }, [openPositions, spotTradeHistory, futuresOpenPositions, futuresTradeHistory]);

  const formatCountdown = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Clean up old trades (older than 7 days)
  const cleanupOldTrades = () => {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    // Clean up spot trade history
    setSpotTradeHistory(prev => 
      prev.filter(trade => new Date(trade.completed_at || trade.exit_time) > sevenDaysAgo)
    );
    
    // Clean up futures trade history
    setFuturesTradeHistory(prev => 
      prev.filter(trade => new Date(trade.completed_at || trade.exit_time) > sevenDaysAgo)
    );
    
    // Save cleaned up data
    saveSpotTrades();
    saveFuturesTrades();
  };

  // Run cleanup every hour
  useEffect(() => {
    const cleanupTimer = setInterval(cleanupOldTrades, 60 * 60 * 1000); // Every hour
    return () => clearInterval(cleanupTimer);
  }, []);

  // Debug function to check trading history
  const debugTradingHistory = async () => {
    const history = await supabaseTradingPageService.getTradeHistory();
    console.log('Current Trading History:', history);
    console.log('Spot Trades:', history.filter(t => t.type === 'spot'));
    console.log('Total Trades:', history.length);
  };

  // Futures Trading Functions
  const handleFuturesOrder = async () => {
    if (!futuresAmount || (futuresOrderType !== 'market' && !futuresPrice)) {
      toast({
        title: "Invalid Order",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setIsExecuting(true);
    try {
      const selectedFuturesPair = futuresPairs.find(p => p.symbol === selectedPair);
      const tradeRequest = {
        type: 'market',
        side: futuresPosition === 'long' ? 'buy' : 'sell',
        symbol: selectedPair.split('USDT')[0],
        quantity: parseFloat(futuresAmount),
        price: parseFloat(futuresPrice || selectedFuturesPair?.price.toString() || "0"),
        leverage: futuresLeverage[0],
      };

      const result = await supabaseTradingPageService.executeTrade(tradeRequest);

      if (result) {
        const tradeActivity = {
          type: "futures_trade",
          action: `${futuresPosition.toUpperCase()} FUTURES`,
          symbol: selectedPair,
          amount: `${futuresAmount} ${selectedPair}`,
          price: `$${parseFloat(futuresPrice || selectedFuturesPair?.price.toString() || "0").toLocaleString()}`,
          pnl: result.profit ? `+$${result.profit.toFixed(2)}` : result.loss ? `-$${result.loss.toFixed(2)}` : '0',
          status: "completed",
          time: "Just now",
          icon: futuresPosition === 'long' ? "📈" : "📉"
        };
        addActivity(tradeActivity);

        toast({
          title: "Futures Order Placed Successfully",
          description: `${futuresPosition.toUpperCase()} ${futuresAmount} ${selectedPair} at ${futuresOrderType === 'market' ? 'market price' : futuresPrice}`,
        });
      } else {
        toast({
          variant: "destructive",
          title: "Order Failed",
          description: result.message || "Unknown error occurred."
        });
      }
    } catch (error) {
      console.error("Error placing futures order:", error);
      toast({
        variant: "destructive",
        title: "Order Failed",
        description: "Failed to place order due to an unexpected error."
      });
    } finally {
      setIsExecuting(false);
    }

    // Reset form
    setFuturesAmount("");
    setFuturesPrice("");
    setFuturesStopPrice("");
  };

  // Futures Profit Calculation
  const calculateFuturesProfit = (duration: number, leverage: number, baseProfit: number = 3) => {
    return baseProfit + (duration * 0.3) + (leverage * 0.1); // Base + time bonus + leverage bonus
  };

  // Timed Futures Trading Functions
  const startFuturesTrade = async () => {
    if (!futuresAmount || parseFloat(futuresAmount) <= 0) {
      toast({
        variant: "destructive",
        title: "Invalid Amount",
        description: "Please enter a valid amount"
      });
      return;
    }

    const amount = parseFloat(futuresAmount);
    const tradingBalance = parseFloat(tradingAccount.USDT?.available.replace(/,/g, '') || '0');
    
    if (amount > tradingBalance) {
      toast({
        variant: "destructive",
        title: "Insufficient Funds",
        description: "Insufficient Trading Funds. Please transfer from Funding Account."
      });
      return;
    }

    setIsExecuting(true);
    try {
      const selectedFuturesPair = futuresPairs.find(p => p.symbol === selectedPair);
      const currentPrice = selectedFuturesPair?.price || 45000;
      const profitPercentage = calculateFuturesProfit(futuresDuration, futuresLeverage[0]);
      const endTime = new Date(Date.now() + futuresDuration * 60 * 1000);
      
      const futuresTrade = {
        id: Date.now().toString(),
        user_id: 'current-user',
        trade_type: 'futures',
        direction: futuresPosition,
        amount: amount,
        entry_price: currentPrice,
        start_time: new Date().toISOString(),
        duration: futuresDuration,
        end_time: endTime.toISOString(),
        status: 'open',
        outcome: 'pending',
        payout: null,
        profit_percentage: profitPercentage,
        leverage: futuresLeverage[0],
        order_type: futuresOrderType,
        take_profit: futuresTakeProfit ? parseFloat(futuresTakeProfit) : null,
        stop_loss: futuresStopLoss ? parseFloat(futuresStopLoss) : null,
        trigger_price: futuresTriggerPrice ? parseFloat(futuresTriggerPrice) : null
      };

      // Use enhanced trading engine for futures trades
      const tradeRequest: TradeRequest = {
        type: 'futures',
        action: futuresPosition === 'long' ? 'buy' : 'sell',
        symbol: selectedPair.split('USDT')[0],
        amount: amount,
        price: currentPrice,
        leverage: futuresLeverage[0],
        direction: futuresPosition,
        duration: futuresDuration,
        stopLoss: futuresStopLoss ? parseFloat(futuresStopLoss) : undefined,
        takeProfit: futuresTakeProfit ? parseFloat(futuresTakeProfit) : undefined
      };

      const result = await supabaseTradingPageService.executeTrade(tradeRequest);

      if (result) {
        // Handle different order types
        if (futuresOrderType === 'market') {
          // Market order - execute immediately
          await executeFuturesTrade(futuresTrade);
        } else if (futuresOrderType === 'limit') {
          // Limit order - add to pending orders
          const pendingOrder = {
            ...futuresTrade,
            status: 'pending',
            trigger_price: parseFloat(futuresTriggerPrice),
            trigger_type: 'limit'
          };
          setFuturesPendingOrders(prev => [pendingOrder, ...prev]);
          toast({
            title: "Limit Order Placed",
            description: `Order will execute when price reaches $${futuresTriggerPrice}`
          });
        } else if (futuresOrderType === 'stop') {
          // Stop order - add to pending orders
          const pendingOrder = {
            ...futuresTrade,
            status: 'pending',
            trigger_price: parseFloat(futuresTriggerPrice),
            trigger_type: 'stop'
          };
          setFuturesPendingOrders(prev => [pendingOrder, ...prev]);
          toast({
            title: "Stop Order Placed",
            description: `Order will execute when price reaches $${futuresTriggerPrice}`
          });
        }
      } else {
        toast({
          variant: "destructive",
          title: "Trade Failed",
          description: result.message
        });
        return;
      }

      setFuturesAmount('');
      setFuturesTakeProfit('');
      setFuturesStopLoss('');
      setFuturesTriggerPrice('');
    } catch (error) {
      console.error("Error starting futures trade:", error);
      toast({
        variant: "destructive",
        title: "Trade Failed",
        description: "Failed to start futures trade"
      });
    } finally {
      setIsExecuting(false);
    }
  };

  // Execute futures trade (for market orders or triggered limit/stop orders)
  const executeFuturesTrade = async (trade: any) => {
    const selectedFuturesPair = futuresPairs.find(p => p.symbol === selectedPair);
    const entryPrice = selectedFuturesPair?.price || 45000;
    const endTime = new Date(Date.now() + trade.duration * 60 * 1000);
    
    const executedTrade = {
      ...trade,
      entry_price: entryPrice,
      start_time: new Date().toISOString(),
      end_time: endTime.toISOString(),
      status: 'open'
    };

    setActiveFuturesTrade(executedTrade);
    setFuturesCountdown(trade.duration * 60); // Convert to seconds
    setFuturesOpenPositions(prev => [executedTrade, ...prev]);

    // Deduct amount from trading account
    updateTradingBalance('USDT', trade.amount, 'subtract');

    // Add to unified trading engine
    const tradeRequest: TradeRequest = {
      type: 'futures',
      action: trade.direction === 'long' ? 'buy' : 'sell',
      symbol: selectedPair.split('USDT')[0],
      amount: trade.amount,
      price: entryPrice,
      leverage: trade.leverage,
      duration: trade.duration
    };
    
    const result = await supabaseTradingPageService.executeTrade(tradeRequest);
    
    if (!result) {
      toast({
        variant: "destructive",
        title: "Trade Failed",
        description: result.message
      });
      return;
    }

    // Add activity for immediate display
    const tradeActivity = {
      type: "futures_trade",
      action: `${trade.direction.toUpperCase()} FUTURES STARTED`,
      symbol: selectedPair,
      amount: `$${trade.amount}`,
      price: `$${entryPrice.toLocaleString()}`,
      pnl: `Pending (${trade.profit_percentage.toFixed(1)}%)`,
      status: 'running',
      time: "Just now",
      icon: "⏱️"
    };
    addActivity(tradeActivity);

    toast({
      title: "Futures Trade Started",
      description: `${trade.direction.toUpperCase()} trade for $${trade.amount} started. Duration: ${trade.duration} minutes.`
    });
  };

  // Countdown Timer Effect
  useEffect(() => {
    if (activeFuturesTrade && futuresCountdown > 0) {
      const timer = setInterval(async () => {
        setFuturesCountdown(prev => {
          if (prev <= 1) {
            endFuturesTrade(activeFuturesTrade);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [activeFuturesTrade, futuresCountdown]);

  // Update countdown timers for all open positions
  useEffect(() => {
    if (futuresOpenPositions.length > 0) {
      const timer = setInterval(() => {
        setFuturesOpenPositions(prev => 
          prev.map(position => {
            const timeRemaining = Math.max(0, Math.floor((new Date(position.end_time).getTime() - new Date().getTime()) / 1000));
            
            // If countdown finished, complete the trade
            if (timeRemaining <= 0) {
              endFuturesTrade(position);
              return position; // Will be filtered out in endFuturesTrade
            }
            
            return position;
          })
        );
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [futuresOpenPositions]);

  // Monitor pending orders and trigger them when conditions are met
  useEffect(() => {
    if (futuresPendingOrders.length > 0) {
      const timer = setInterval(() => {
        const selectedFuturesPair = futuresPairs.find(p => p.symbol === selectedPair);
        const currentPrice = selectedFuturesPair?.price || 45000;
        
        setFuturesPendingOrders(prev => {
          const triggeredOrders = prev.filter(order => {
            if (order.trigger_type === 'limit') {
              // Limit order: trigger when price reaches or goes below trigger price
              return currentPrice <= order.trigger_price;
            } else if (order.trigger_type === 'stop') {
              // Stop order: trigger when price reaches or goes above trigger price
              return currentPrice >= order.trigger_price;
            }
            return false;
          });

          // Execute triggered orders
          triggeredOrders.forEach(order => {
            executeFuturesTrade(order);
          });

          // Return remaining pending orders
          return prev.filter(order => {
            if (order.trigger_type === 'limit') {
              return currentPrice > order.trigger_price;
            } else if (order.trigger_type === 'stop') {
              return currentPrice < order.trigger_price;
            }
            return true;
          });
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [futuresPendingOrders, selectedPair]);

  const endFuturesTrade = async (trade: any) => {
    const selectedFuturesPair = futuresPairs.find(p => p.symbol === selectedPair);
    const currentMarketPrice = selectedFuturesPair?.price || 45000;
    const entryPrice = trade.entry_price;
    let outcome = 'lose';
    let payout = 0;
    let exitReason = 'timer';

    // Check Take Profit and Stop Loss first
    if (trade.take_profit && currentMarketPrice >= trade.take_profit) {
      outcome = 'win';
      payout = trade.amount * (1 + trade.profit_percentage / 100);
      exitReason = 'take_profit';
    } else if (trade.stop_loss && currentMarketPrice <= trade.stop_loss) {
      outcome = 'lose';
      payout = 0;
      exitReason = 'stop_loss';
    } else {
      // Normal timer-based evaluation
      if (trade.direction === 'long') {
        if (currentMarketPrice > entryPrice) {
          outcome = 'win';
          payout = trade.amount * (1 + trade.profit_percentage / 100);
        }
      } else { // short
        if (currentMarketPrice < entryPrice) {
          outcome = 'win';
          payout = trade.amount * (1 + trade.profit_percentage / 100);
        }
      }
    }

    const updatedTrade = {
      ...trade,
      status: 'completed',
      outcome,
      payout,
      end_price: currentMarketPrice,
      exit_time: new Date().toISOString(),
      exit_reason: exitReason
    };

    setActiveFuturesTrade(null);
    setFuturesCountdown(0);
    
    // Move from open positions to history
    setFuturesOpenPositions(prev => prev.filter(t => t.id !== trade.id));
    setFuturesTradeHistory(prev => [updatedTrade, ...prev]);

    // Add payout to trading account if won
    if (outcome === 'win') {
      updateTradingBalance('USDT', payout, 'add');
    }

    // Complete the futures trade in the trading engine
    await supabaseTradingPageService.completeSpotTrade(trade.id, outcome as 'win' | 'lose', currentMarketPrice, trade.profit_percentage);

    const tradeActivity = {
      type: "futures_trade",
      action: `${trade.direction.toUpperCase()} ${outcome.toUpperCase()}`,
      symbol: selectedPair,
      amount: `$${trade.amount}`,
      price: `$${currentMarketPrice.toLocaleString()}`,
      pnl: outcome === 'win' ? `+$${(payout - trade.amount).toFixed(2)}` : `-$${trade.amount}`,
      status: outcome,
      time: "Just now",
      icon: outcome === 'win' ? "🎉" : "💸"
    };
    addActivity(tradeActivity);

    const exitReasonText = exitReason === 'take_profit' ? 'Take Profit Hit' : 
                          exitReason === 'stop_loss' ? 'Stop Loss Hit' : 'Timer Expired';

    toast({
      title: `Futures Trade ${outcome.toUpperCase()}`,
      description: `${exitReasonText} - ${outcome === 'win' ? `You won $${(payout - trade.amount).toFixed(2)}!` : `You lost $${trade.amount}`}`
    });
  };

  // Admin Override Function
  const handleAdminOverride = (tradeId: string, outcome: 'win' | 'lose') => {
    const trade = spotTrades.find(t => t.id === tradeId);
    if (!trade) return;

    const payout = outcome === 'win' ? trade.amount * (1 + trade.profit_percentage / 100) : 0;
    
    const updatedTrade = {
      ...trade,
      status: 'completed',
      outcome: 'admin_override',
      payout,
      admin_override: outcome
    };

    setSpotTrades(prev => prev.map(t => t.id === tradeId ? updatedTrade : t));
    
    // Add payout to trading account if admin forced win
    if (outcome === 'win') {
      updateTradingBalance('USDT', payout, 'add');
    }

    const tradeActivity = {
      type: "spot_trade",
      action: `${trade.direction.toUpperCase()} ADMIN_OVERRIDE`,
      symbol: selectedPair,
      amount: `$${trade.amount}`,
      price: `$${trade.entry_price.toLocaleString()}`,
      pnl: outcome === 'win' ? `+$${(payout - trade.amount).toFixed(2)}` : `-$${trade.amount}`,
      status: outcome,
      time: "Just now",
      icon: outcome === 'win' ? "👑" : "💸"
    };
    addActivity(tradeActivity);
  };

  // Options Trading State
  const [selectedAsset, setSelectedAsset] = useState("BTCUSDT");
  const [optionType, setOptionType] = useState<'call' | 'put'>('call');
  const [strategy, setStrategy] = useState<'long-call' | 'long-put' | 'covered-call' | 'cash-secured-put'>('long-call');
  const [strike, setStrike] = useState("");
  const [quantity, setQuantity] = useState("");

  // Advanced Options Trading State
  const [optionsOpenOrders, setOptionsOpenOrders] = useState<any[]>([]);
  const [optionsRecentTrades, setOptionsRecentTrades] = useState<any[]>([]);
  const [optionsTradingHistory, setOptionsTradingHistory] = useState<any[]>([]);
  const [activeOptionsTrade, setActiveOptionsTrade] = useState<any>(null);
  const [optionsCountdown, setOptionsCountdown] = useState(0);
  const [optionsExpiryTime, setOptionsExpiryTime] = useState(5); // minutes
  const [optionsEntryPremium, setOptionsEntryPremium] = useState("");
  const [optionsCurrentPrice, setOptionsCurrentPrice] = useState(67543);

  // Options Data
  const optionsChain = [
    { strike: 65000, callPrice: 2850, putPrice: 350, callIV: "45.2%", putIV: "43.8%", callDelta: "0.72", putDelta: "-0.28" },
    { strike: 67000, callPrice: 1920, putPrice: 620, callIV: "42.1%", putIV: "44.2%", callDelta: "0.58", putDelta: "-0.42" },
    { strike: 69000, callPrice: 1240, putPrice: 940, callIV: "40.8%", putIV: "45.1%", callDelta: "0.42", putDelta: "-0.58" },
    { strike: 71000, callPrice: 780, putPrice: 1480, callIV: "39.5%", putIV: "46.3%", callDelta: "0.28", putDelta: "-0.72" },
    { strike: 73000, callPrice: 450, putPrice: 2250, callIV: "38.9%", putIV: "47.8%", callDelta: "0.15", putDelta: "-0.85" },
  ];

  const strategies = [
    { 
      id: 'long-call', 
      name: 'Long Call', 
      description: 'Bullish strategy with unlimited upside', 
      risk: 'Limited', 
      reward: 'Unlimited',
      type: 'bullish',
      maxLoss: 'Premium paid',
      maxProfit: 'Unlimited',
      winCondition: 'Market price > strike + premium at expiry',
      color: 'green'
    },
    { 
      id: 'long-put', 
      name: 'Long Put', 
      description: 'Bearish strategy with high profit potential', 
      risk: 'Limited', 
      reward: 'High',
      type: 'bearish',
      maxLoss: 'Premium paid',
      maxProfit: 'High (up to strike price)',
      winCondition: 'Market price < strike - premium at expiry',
      color: 'red'
    },
    { 
      id: 'covered-call', 
      name: 'Covered Call', 
      description: 'Generate income from holdings', 
      risk: 'Moderate', 
      reward: 'Limited',
      type: 'neutral',
      maxLoss: 'Moderate (asset drop)',
      maxProfit: 'Limited (premium)',
      winCondition: 'Price stays below strike (keep premium)',
      color: 'yellow'
    },
    { 
      id: 'cash-secured-put', 
      name: 'Cash-Secured Put', 
      description: 'Income while waiting to buy', 
      risk: 'Moderate', 
      reward: 'Limited',
      type: 'mildly-bullish',
      maxLoss: 'Moderate (if assigned)',
      maxProfit: 'Limited (premium)',
      winCondition: 'Price stays above strike (keep premium)',
      color: 'orange'
    },
  ];

  // Options Trading Functions
  const handlePlaceOptionsOrder = async () => {
    if (!strike || !quantity || !optionsEntryPremium) {
      toast({
        title: "Invalid Order",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const premium = parseFloat(optionsEntryPremium);
    const strikePrice = parseFloat(strike);
    const quantityNum = parseFloat(quantity);
    const totalCost = premium * quantityNum;
    const tradingBalance = parseFloat(tradingAccount.USDT?.available.replace(/,/g, '') || '0');

    if (totalCost > tradingBalance) {
      toast({
        title: "Insufficient Funds",
        description: "Insufficient Trading Account Balance. Please transfer from Funding Account.",
        variant: "destructive",
      });
      return;
    }

    setIsExecuting(true);
    try {
      const selectedStrategy = strategies.find(s => s.id === strategy);
      const expiryTime = new Date(Date.now() + optionsExpiryTime * 60 * 1000);
      
      const optionsTrade = {
        id: Date.now().toString(),
        user_id: 'current-user',
        strategy: strategy,
        asset: selectedAsset,
        optionType: optionType,
        strikePrice: strikePrice,
        quantity: quantityNum,
        entryPremium: premium,
        totalCost: totalCost,
        expiryTime: expiryTime.toISOString(),
        startTime: new Date().toISOString(),
        status: 'open',
        outcome: 'pending',
        currentPrice: optionsCurrentPrice,
        timeRemaining: optionsExpiryTime * 60, // seconds
        strategyDetails: selectedStrategy
      };

      // Add to open orders
      setOptionsOpenOrders(prev => [optionsTrade, ...prev]);
      
      // Deduct from trading account
      updateTradingBalance('USDT', totalCost, 'subtract');

      // Add to unified trading engine
      const tradeRequest: TradeRequest = {
        type: 'options',
        action: optionType === 'call' ? 'buy' : 'sell',
        symbol: selectedAsset.split('USDT')[0],
        amount: totalCost,
        price: strikePrice,
      };

      const result = await supabaseTradingPageService.executeTrade(tradeRequest);

      if (result) {
        const tradeActivity = {
          type: "options_trade",
          action: `${strategy.toUpperCase()} ${optionType.toUpperCase()}`,
          symbol: selectedAsset,
          amount: `${quantityNum} contracts`,
          price: `$${strikePrice} strike`,
          pnl: `Premium: $${premium}`,
          status: "open",
          time: "Just now",
          icon: optionType === 'call' ? "📈" : "📉"
        };
        addActivity(tradeActivity);

        toast({
          title: "Options Order Placed Successfully",
          description: `${selectedStrategy?.name} ${optionType.toUpperCase()} ${quantityNum} contracts at $${strikePrice} strike`,
        });
      } else {
        toast({
          variant: "destructive",
          title: "Order Failed",
          description: result.message || "Unknown error occurred."
        });
      }
    } catch (error) {
      console.error("Error placing options order:", error);
      toast({
        variant: "destructive",
        title: "Order Failed",
        description: "Failed to place order due to an unexpected error."
      });
    } finally {
      setIsExecuting(false);
    }

    // Reset form
    setStrike("");
    setQuantity("");
    setOptionsEntryPremium("");
  };

  // Calculate options outcome based on strategy
  const calculateOptionsOutcome = (trade: any, currentPrice: number) => {
    const { strategy, optionType, strikePrice, entryPremium } = trade;
    
    switch (strategy) {
      case 'long-call':
        return currentPrice > (strikePrice + entryPremium) ? 'win' : 'loss';
      
      case 'long-put':
        return currentPrice < (strikePrice - entryPremium) ? 'win' : 'loss';
      
      case 'covered-call':
        return currentPrice < strikePrice ? 'win' : 'loss';
      
      case 'cash-secured-put':
        return currentPrice > strikePrice ? 'win' : 'loss';
      
      default:
        return 'loss';
    }
  };

  // Complete options trade
  const completeOptionsTrade = async (trade: any) => {
    const currentPrice = optionsCurrentPrice;
    const outcome = calculateOptionsOutcome(trade, currentPrice);
    
    let payout = 0;
    let profit = 0;
    let loss = 0;

    if (outcome === 'win') {
      switch (trade.strategy) {
        case 'long-call':
          profit = Math.max(0, currentPrice - trade.strikePrice - trade.entryPremium) * trade.quantity;
          payout = trade.totalCost + profit;
          break;
        case 'long-put':
          profit = Math.max(0, trade.strikePrice - currentPrice - trade.entryPremium) * trade.quantity;
          payout = trade.totalCost + profit;
          break;
        case 'covered-call':
        case 'cash-secured-put':
          payout = trade.totalCost; // Keep premium
          profit = trade.totalCost;
          break;
      }
    } else {
      loss = trade.totalCost;
    }

    const completedTrade = {
      ...trade,
      status: 'completed',
      outcome,
      exitPrice: currentPrice,
      exitTime: new Date().toISOString(),
      payout,
      profit: outcome === 'win' ? profit : 0,
      loss: outcome === 'loss' ? loss : 0
    };

    // Move from open orders to history
    setOptionsOpenOrders(prev => prev.filter(t => t.id !== trade.id));
    setOptionsTradingHistory(prev => [completedTrade, ...prev]);
    setOptionsRecentTrades(prev => [completedTrade, ...prev]);

    // Add payout to trading account if won
    if (outcome === 'win') {
      updateTradingBalance('USDT', payout, 'add');
    }

    // Add activity
    const tradeActivity = {
      type: "options_trade",
      action: `${trade.strategy.toUpperCase()} ${trade.optionType.toUpperCase()} ${outcome.toUpperCase()}`,
      symbol: trade.asset,
      amount: `${trade.quantity} contracts`,
      price: `$${trade.strikePrice} strike`,
      pnl: outcome === 'win' ? `+$${profit.toFixed(2)}` : `-$${loss.toFixed(2)}`,
      status: outcome,
      time: "Just now",
      icon: outcome === 'win' ? "🎉" : "💸"
    };
    addActivity(tradeActivity);

    toast({
      title: `Options Trade ${outcome.toUpperCase()}`,
      description: outcome === 'win' 
        ? `You won $${profit.toFixed(2)}!` 
        : `You lost $${loss.toFixed(2)}`
    });
  };

  // Format countdown timer
  const formatOptionsCountdown = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Check if option is in the money
  const isInTheMoney = (trade: any) => {
    const { strategy, optionType, strikePrice, currentPrice } = trade;
    
    switch (strategy) {
      case 'long-call':
        return currentPrice > strikePrice;
      case 'long-put':
        return currentPrice < strikePrice;
      case 'covered-call':
        return currentPrice < strikePrice;
      case 'cash-secured-put':
        return currentPrice > strikePrice;
      default:
        return false;
    }
  };

  // Monitor options trades and complete them when they expire
  useEffect(() => {
    if (optionsOpenOrders.length > 0) {
      const timer = setInterval(() => {
        setOptionsOpenOrders(prev => 
          prev.map(trade => {
            const timeRemaining = Math.max(0, Math.floor((new Date(trade.expiryTime).getTime() - new Date().getTime()) / 1000));
            
            // If countdown finished, complete the trade
            if (timeRemaining <= 0) {
              completeOptionsTrade(trade);
              return trade; // Will be filtered out in completeOptionsTrade
            }
            
            // Update time remaining
            return {
              ...trade,
              timeRemaining,
              currentPrice: optionsCurrentPrice
            };
          })
        );
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [optionsOpenOrders, optionsCurrentPrice]);

  // Binary Options Trading State
  const [binarySelectedAsset, setBinarySelectedAsset] = useState("BTCUSDT");
  const [binaryPrediction, setBinaryPrediction] = useState<'higher' | 'lower'>('higher');
  const [binaryAmount, setBinaryAmount] = useState("");
  const [binaryExpiration, setBinaryExpiration] = useState("5m");
  const [binaryTimeRemaining, setBinaryTimeRemaining] = useState(300);
  const [binaryActivePositions, setBinaryActivePositions] = useState<any[]>([]);
  const [binaryTradeHistory, setBinaryTradeHistory] = useState<any[]>([]);

  // Quant Trading State
  const [quantSelectedProduct, setQuantSelectedProduct] = useState<string | null>(null);
  const [quantInvestmentAmount, setQuantInvestmentAmount] = useState("");

  // Trading Bots State
  const [botsActiveTab, setBotsActiveTab] = useState('marketplace');
  const [botsSearchTerm, setBotsSearchTerm] = useState('');
  const [botsSelectedCategory, setBotsSelectedCategory] = useState('all');
  const [botsSelectedBot, setBotsSelectedBot] = useState(null);
  const [botsIsSubscriptionModalOpen, setBotsIsSubscriptionModalOpen] = useState(false);

  // Strategy Builder State
  const [strategyComponents, setStrategyComponents] = useState<any[]>([]);
  const [strategyName, setStrategyName] = useState("");
  const [strategySymbol, setStrategySymbol] = useState("");
  const [positionSize, setPositionSize] = useState("");
  const [maxPositions, setMaxPositions] = useState("");
  const [stopLoss, setStopLoss] = useState("");
  const [takeProfit, setTakeProfit] = useState("");
  const [backtestPeriod, setBacktestPeriod] = useState("");
  const [initialCapital, setInitialCapital] = useState("");
  const [deployName, setDeployName] = useState("");
  const [deployCapital, setDeployCapital] = useState("");
  const [backtestResults, setBacktestResults] = useState<any>(null);

  // My Bots State
  const [myBots, setMyBots] = useState<any[]>([]);
  const [isCreateBotModalOpen, setIsCreateBotModalOpen] = useState(false);
  const [selectedBotForSettings, setSelectedBotForSettings] = useState<any>(null);
  const [isBotSettingsModalOpen, setIsBotSettingsModalOpen] = useState(false);

  // Bot Stake Modal State
  const [selectedBotForStake, setSelectedBotForStake] = useState<any>(null);
  const [isStakeModalOpen, setIsStakeModalOpen] = useState(false);
  const [stakeAmount, setStakeAmount] = useState('');
  const [stakeDuration, setStakeDuration] = useState(30);
  const [estimatedProfit, setEstimatedProfit] = useState(0);
  const [profitPercentage, setProfitPercentage] = useState(0);

  // Staking State
  const [stakingActiveTab, setStakingActiveTab] = useState("pools");
  const [stakingIsExecuting, setStakingIsExecuting] = useState(false);
  const [selectedPool, setSelectedPool] = useState(null);
  const [isStakingModalOpen, setIsStakingModalOpen] = useState(false);
  const [isUnstakeModalOpen, setIsUnstakeModalOpen] = useState(false);
  const [selectedStake, setSelectedStake] = useState(null);
  
  // Staking Calculator State
  const [calculatorAmount, setCalculatorAmount] = useState("");
  const [calculatorDuration, setCalculatorDuration] = useState("30");
  const [calculatorToken, setCalculatorToken] = useState("ETH");
  const [estimatedRewards, setEstimatedRewards] = useState(0);
  
  // Staking Modal State
  const [stakingStakeAmount, setStakingStakeAmount] = useState("");

  // Binary Options Data
  const binaryAssets = [
    // Crypto
    { symbol: "BTCUSDT", name: "Bitcoin", price: 67543.21, change: 2.34, payout: "85%", category: "Crypto" },
    { symbol: "ETHUSDT", name: "Ethereum", price: 3234.56, change: 1.23, payout: "82%", category: "Crypto" },
    { symbol: "BNBUSDT", name: "BNB", price: 623.45, change: -0.56, payout: "80%", category: "Crypto" },
    { symbol: "SOLUSDT", name: "Solana", price: 234.67, change: 4.12, payout: "83%", category: "Crypto" },
    // Forex
    { symbol: "EURUSD", name: "EUR/USD", price: 1.0864, change: 0.12, payout: "78%", category: "Forex" },
    { symbol: "GBPUSD", name: "GBP/USD", price: 1.2734, change: -0.08, payout: "80%", category: "Forex" },
    { symbol: "USDJPY", name: "USD/JPY", price: 148.32, change: 0.24, payout: "79%", category: "Forex" },
    // Stocks
    { symbol: "AAPL", name: "Apple", price: 185.67, change: 1.45, payout: "82%", category: "Stocks" },
    { symbol: "TSLA", name: "Tesla", price: 248.85, change: 2.67, payout: "84%", category: "Stocks" },
    { symbol: "GOOGL", name: "Google", price: 2845.32, change: -0.45, payout: "81%", category: "Stocks" },
    // Commodities
    { symbol: "XAUUSD", name: "Gold", price: 2015.67, change: 0.78, payout: "83%", category: "Commodities" },
    { symbol: "XAGUSD", name: "Silver", price: 24.85, change: 1.23, payout: "80%", category: "Commodities" },
    // Indices
    { symbol: "SPX500", name: "S&P 500", price: 4785.23, change: 0.45, payout: "79%", category: "Indices" },
    { symbol: "NAS100", name: "NASDAQ", price: 15234.56, change: 0.89, payout: "81%", category: "Indices" },
  ];

  const binaryExpirationTimes = [
    { value: "1m", label: "1 Minute", seconds: 60 },
    { value: "5m", label: "5 Minutes", seconds: 300 },
    { value: "15m", label: "15 Minutes", seconds: 900 },
    { value: "30m", label: "30 Minutes", seconds: 1800 },
    { value: "1h", label: "1 Hour", seconds: 3600 },
    { value: "4h", label: "4 Hours", seconds: 14400 },
    { value: "1d", label: "1 Day", seconds: 86400 },
  ];

  // Quant Trading Data
  const quantArbitrageProducts = [
    {
      id: 1,
      duration: "1 Day",
      arbitrageId: "Arbitrage: 1",
      purchaseLimit: "Limit: 3",
      investmentRange: "$1,000 – $29,999",
      dailyIncomeRange: "0.8% – 0.88%",
      cryptos: ["BTC", "ETH", "USDT"],
      totalReturn: "30.2%",
      riskLevel: "Low"
    },
    {
      id: 2,
      duration: "3 Days",
      arbitrageId: "Arbitrage: 2",
      purchaseLimit: "Limit: 5",
      investmentRange: "$5,000 – $99,999",
      dailyIncomeRange: "1.2% – 1.45%",
      cryptos: ["BTC", "ETH", "BNB"],
      totalReturn: "42.8%",
      riskLevel: "Medium"
    },
    {
      id: 3,
      duration: "7 Days",
      arbitrageId: "Arbitrage: 3",
      purchaseLimit: "Limit: 3",
      investmentRange: "$10,000 – $199,999",
      dailyIncomeRange: "1.8% – 2.1%",
      cryptos: ["BTC", "ETH", "SOL", "ADA"],
      totalReturn: "65.4%",
      riskLevel: "Medium"
    },
    {
      id: 4,
      duration: "14 Days",
      arbitrageId: "Arbitrage: 4",
      purchaseLimit: "Limit: 2",
      investmentRange: "$25,000 – $499,999",
      dailyIncomeRange: "2.3% – 2.8%",
      cryptos: ["BTC", "ETH", "BNB", "DOT"],
      totalReturn: "89.2%",
      riskLevel: "High"
    },
    {
      id: 5,
      duration: "30 Days",
      arbitrageId: "Arbitrage: 5",
      purchaseLimit: "Limit: 1",
      investmentRange: "$50,000 – $999,999",
      dailyIncomeRange: "3.2% – 3.8%",
      cryptos: ["BTC", "ETH", "BNB", "ADA", "SOL"],
      totalReturn: "156.7%",
      riskLevel: "Very High"
    },
    {
      id: 6,
      duration: "60 Days",
      arbitrageId: "Arbitrage: 6",
      purchaseLimit: "Limit: 1",
      investmentRange: "$100,000+",
      dailyIncomeRange: "4.1% – 4.9%",
      cryptos: ["BTC", "ETH", "BNB", "ADA", "SOL", "DOT"],
      totalReturn: "234.5%",
      riskLevel: "Premium"
    }
  ];

  // Staking Pools Data
  const stakingPools = [
    {
      id: 'eth-pool',
      token: "ETH",
      name: "Ethereum 2.0 Staking",
      apy: 4.5,
      minStake: 0.1,
      totalStaked: 2500000000,
      rewardType: "ETH",
      duration: "Flexible",
      status: "Active",
      description: "Stake ETH and earn rewards while supporting the Ethereum network",
      icon: "🔵",
      color: "from-blue-500/20 to-indigo-500/20"
    },
    {
      id: 'sol-pool',
      token: "SOL",
      name: "Solana Staking",
      apy: 7.2,
      minStake: 1,
      totalStaked: 890000000,
      rewardType: "SOL",
      duration: "Epoch (~2 days)",
      status: "Active",
      description: "High-performance staking with fast reward distribution",
      icon: "🟣",
      color: "from-purple-500/20 to-pink-500/20"
    },
    {
      id: 'ada-pool',
      token: "ADA",
      name: "Cardano Staking",
      apy: 5.1,
      minStake: 10,
      totalStaked: 12300000000,
      rewardType: "ADA",
      duration: "Epoch (~5 days)",
      status: "Active",
      description: "Sustainable staking with proof-of-stake consensus",
      icon: "🟢",
      color: "from-green-500/20 to-emerald-500/20"
    },
    {
      id: 'dot-pool',
      token: "DOT",
      name: "Polkadot Staking",
      apy: 12.8,
      minStake: 1,
      totalStaked: 5800000000,
      rewardType: "DOT",
      duration: "28 days",
      status: "Limited",
      description: "Cross-chain staking with high APY returns",
      icon: "🟡",
      color: "from-yellow-500/20 to-orange-500/20"
    },
    {
      id: 'avax-pool',
      token: "AVAX",
      name: "Avalanche Staking",
      apy: 9.3,
      minStake: 25,
      totalStaked: 3200000000,
      rewardType: "AVAX",
      duration: "Flexible",
      status: "Active",
      description: "Fast and secure staking on the Avalanche network",
      icon: "🔴",
      color: "from-red-500/20 to-pink-500/20"
    },
    {
      id: 'matic-pool',
      token: "MATIC",
      name: "Polygon Staking",
      apy: 6.7,
      minStake: 100,
      totalStaked: 1800000000,
      rewardType: "MATIC",
      duration: "7 days",
      status: "Active",
      description: "Layer 2 scaling solution staking with competitive returns",
      icon: "🟣",
      color: "from-purple-500/20 to-violet-500/20"
    }
  ];

  // My Stakes Data
  const [myStakes, setMyStakes] = useState([
    // TODO: Replace with real API call to load user's staking data
  ]);

  // Staking Overview Stats
  const stakingStats = {
    totalStaked: 0, // TODO: Replace with real API call to get user's total staked amount
    totalRewards: 0, // TODO: Replace with real API call to get user's total rewards
    avgApy: 0, // TODO: Replace with real API call to get average APY
    activeStakes: 0, // TODO: Replace with real API call to get active stakes count
    totalValue: 0 // TODO: Replace with real API call to get total staking value
  };

  // Trading Bots Data
  const botsMarketplace = [
    {
      id: 'apexon',
      name: 'Apexon',
      description: 'Precision at the peak of every market move. Sharp, decisive, and elite scalping bot.',
      creator: 'CryptoWizard',
      rating: 4.8,
      users: 2847,
      performance: '+45.3%',
      price: 99,
      category: 'Scalping',
      riskLevel: 'High',
      winRate: '78%',
      icon: Target,
      minStake: 1000,
      maxStake: 9999,
      profitRange: '24% - 49%',
      color: 'from-red-500/20 to-orange-500/20',
      tier: 'Tier 1'
    },
    {
      id: 'voltrax',
      name: 'VoltraX',
      description: 'Lightning-fast execution with voltage precision. High-frequency trading with microsecond accuracy.',
      creator: 'VoltageMaster',
      rating: 4.7,
      users: 1923,
      performance: '+52.1%',
      price: 199,
      category: 'HFT',
      riskLevel: 'High',
      winRate: '76%',
      icon: Zap,
      minStake: 10000,
      maxStake: 39999,
      profitRange: '27% - 64%',
      color: 'from-blue-500/20 to-purple-500/20',
      tier: 'Tier 2'
    },
    {
      id: 'chronopulse',
      name: 'ChronoPulse',
      description: 'Time-based market synchronization. Pulsates with market rhythms for optimal entry/exit timing.',
      creator: 'TimeTrader',
      rating: 4.6,
      users: 1567,
      performance: '+38.9%',
      price: 149,
      category: 'Timing',
      riskLevel: 'Medium',
      winRate: '85%',
      icon: Clock,
      minStake: 40000,
      maxStake: 99999,
      profitRange: '31% - 76%',
      color: 'from-green-500/20 to-teal-500/20',
      tier: 'Tier 3'
    },
    {
      id: 'nebutrade',
      name: 'NebuTrade',
      description: 'Sees patterns before they form. AI/ML-based prediction bot — futuristic, adaptive, intuitive.',
      creator: 'AITrader',
      rating: 4.9,
      users: 3421,
      performance: '+67.8%',
      price: 299,
      category: 'AI',
      riskLevel: 'High',
      winRate: '72%',
      icon: Brain,
      minStake: 100000,
      maxStake: 299999,
      profitRange: '36% - 85%',
      color: 'from-purple-500/20 to-pink-500/20',
      tier: 'Tier 4'
    },
    {
      id: 'scalpex',
      name: 'Scalpex',
      description: 'Scalping excellence with surgical precision. Micro-trades with maximum efficiency.',
      creator: 'ScalpMaster',
      rating: 4.5,
      users: 1876,
      performance: '+34.6%',
      price: 179,
      category: 'Scalping',
      riskLevel: 'Medium',
      winRate: '82%',
      icon: TrendingUp,
      minStake: 300000,
      maxStake: 1000000,
      profitRange: '49% - 118%',
      color: 'from-yellow-500/20 to-orange-500/20',
      tier: 'Tier 5'
    },
    {
      id: 'titanedge',
      name: 'TitanEdge',
      description: 'Titanic force with razor-sharp edges. Combines massive power with surgical precision.',
      creator: 'TitanTrader',
      rating: 4.8,
      users: 2156,
      performance: '+41.2%',
      price: 249,
      category: 'Power',
      riskLevel: 'Low',
      winRate: '89%',
      icon: Shield,
      minStake: 1000,
      maxStake: 9999,
      profitRange: '24% - 49%',
      color: 'from-gray-500/20 to-slate-500/20',
      tier: 'Tier 1'
    },
    {
      id: 'quantumsync',
      name: 'QuantumSync',
      description: 'Where quantum logic meets alpha. For statistical arbitrage or mean-reversion trading.',
      creator: 'QuantMaster',
      rating: 4.9,
      users: 2987,
      performance: '+58.3%',
      price: 399,
      category: 'Quantum',
      riskLevel: 'High',
      winRate: '74%',
      icon: Calculator,
      minStake: 10000,
      maxStake: 39999,
      profitRange: '27% - 64%',
      color: 'from-indigo-500/20 to-blue-500/20',
      tier: 'Tier 2'
    }
  ];

  const botsMyBots = [
    {
      id: 1,
      name: 'My Apexon Bot',
      strategy: 'Apexon',
      status: 'active',
      profit: 1247.50,
      trades: 89,
      startDate: '2024-06-15',
      allocation: 5000
    },
    {
      id: 2,
      name: 'Nebulix Strategy',
      strategy: 'Nebulix',
      status: 'paused',
      profit: -234.80,
      trades: 156,
      startDate: '2024-07-01',
      allocation: 3000
    },
    {
      id: 3,
      name: 'Voltrix Futures',
      strategy: 'Voltrix',
      status: 'active',
      profit: 2891.25,
      trades: 67,
      startDate: '2024-05-20',
      allocation: 8000
    }
  ];

  const botsCategories = ['all', 'Scalping', 'AI', 'Futures', 'Swing', 'Arbitrage', 'Momentum'];

  const botsFilteredBots = botsMarketplace.filter(bot => {
    const matchesSearch = bot.name.toLowerCase().includes(botsSearchTerm.toLowerCase()) ||
                         bot.description.toLowerCase().includes(botsSearchTerm.toLowerCase());
    const matchesCategory = botsSelectedCategory === 'all' || bot.category === botsSelectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Binary Options Functions
  const handlePlaceBinaryTrade = async () => {
    if (!binaryAmount) {
      toast({
        title: "Invalid Trade",
        description: "Please enter an investment amount",
        variant: "destructive",
      });
      return;
    }

    const amount = parseFloat(binaryAmount);
    const tradingBalance = parseFloat(tradingAccount.USDT?.available.replace(/,/g, '') || '0');
    
    if (amount > tradingBalance) {
      toast({
        title: "Insufficient Funds",
        description: "Insufficient Trading Account Balance. Please transfer from Funding Account.",
        variant: "destructive",
      });
      return;
    }

    setIsExecuting(true);
    try {
      const selectedExpiry = binaryExpirationTimes.find(e => e.value === binaryExpiration);
      const selectedAssetData = binaryAssets.find(a => a.symbol === binarySelectedAsset);
      
      const binaryTrade = {
        id: Date.now().toString(),
        user_id: 'current-user',
        asset: binarySelectedAsset,
        prediction: binaryPrediction,
        amount: amount,
        payout: selectedAssetData?.payout || "80%",
        expiry: selectedExpiry?.seconds || 300,
        startTime: new Date().toISOString(),
        status: 'open',
        outcome: 'pending',
        timeRemaining: selectedExpiry?.seconds || 300
      };

      console.log('🔵 Binary Trade Created:', binaryTrade);

      // Add to active positions
      setBinaryActivePositions(prev => {
        const newPositions = [binaryTrade, ...prev];
        console.log('🔵 Added to active positions:', newPositions.length);
        return newPositions;
      });
      
      // Deduct from trading account
      updateTradingBalance('USDT', amount, 'subtract');

      const tradeRequest: TradeRequest = {
        type: 'binary',
        action: binaryPrediction === 'higher' ? 'buy' : 'sell',
        symbol: binarySelectedAsset.split('USDT')[0] || binarySelectedAsset,
        amount: amount,
        direction: binaryPrediction === 'higher' ? 'up' : 'down',
        expiryTime: selectedExpiry?.seconds || 300,
        payout: parseFloat(selectedAssetData?.payout?.replace('%', '') || '80')
      };

      const result = await supabaseTradingPageService.executeTrade(tradeRequest);

      if (result) {
        const tradeActivity = {
          type: "binary_trade",
          action: `BINARY ${binaryPrediction.toUpperCase()}`,
          symbol: binarySelectedAsset,
          amount: `$${amount}`,
          price: `${selectedExpiry?.label} expiry`,
          pnl: `Pending`,
          status: "open",
          time: "Just now",
          icon: binaryPrediction === 'higher' ? "📈" : "📉"
        };
        addActivity(tradeActivity);

        toast({
          title: "Binary Option Created Successfully",
          description: `Predict ${binarySelectedAsset} will go ${binaryPrediction} in ${selectedExpiry?.label} for $${amount}`,
        });
      } else {
        toast({
          variant: "destructive",
          title: "Trade Failed",
          description: result.message || "Unknown error occurred."
        });
      }
    } catch (error) {
      console.error("Error placing binary option:", error);
      toast({
        variant: "destructive",
        title: "Trade Failed",
        description: "Failed to place trade due to an unexpected error."
      });
    } finally {
      setIsExecuting(false);
    }

    // Reset form
    setBinaryAmount("");
  };

  // Quant Trading Functions
  const handleQuantPurchase = async (product: any) => {
    if (!quantInvestmentAmount) {
      toast({
        title: "Investment Required",
        description: "Please enter an investment amount",
        variant: "destructive",
      });
      return;
    }

    const amount = parseFloat(quantInvestmentAmount);
    const tradingBalance = parseFloat(tradingAccount.USDT?.available.replace(/,/g, '') || '0');
    
    if (amount > tradingBalance) {
      toast({
        title: "Insufficient Funds",
        description: "Insufficient Trading Account Balance. Please transfer from Funding Account.",
        variant: "destructive",
      });
      return;
    }

    setIsExecuting(true);
    try {
      const tradeRequest: TradeRequest = {
        type: 'quant',
        action: 'buy',
        symbol: 'ARBITRAGE',
        amount: amount,
        duration: parseInt(product.duration.split(' ')[0]) * 24 * 60 * 60, // Convert days to seconds
        direction: 'up' // Quant trading is generally bullish
      };

      const result = await supabaseTradingPageService.executeTrade(tradeRequest);

      if (result) {
        const tradeActivity = {
          type: "trade",
          action: "ARBITRAGE PURCHASE",
          symbol: product.arbitrageId,
          amount: `$${quantInvestmentAmount}`,
          price: `${product.duration}`,
          pnl: result.profit ? `+$${result.profit.toFixed(2)}` : result.loss ? `-$${result.loss.toFixed(2)}` : '0',
          status: "completed",
          time: "Just now",
          icon: "📊"
        };
        addActivity(tradeActivity);
        addTrade({
          pair: product.arbitrageId,
          type: 'arbitrage',
          amount: quantInvestmentAmount,
          price: product.duration,
          pnl: result.profit ? `+$${result.profit.toFixed(2)}` : result.loss ? `-$${result.loss.toFixed(2)}` : '0',
          status: "completed"
        });

        toast({
          title: "Arbitrage Purchase Successful",
          description: `Invested $${quantInvestmentAmount} in ${product.arbitrageId} (${product.duration})`,
        });
      } else {
        toast({
          variant: "destructive",
          title: "Purchase Failed",
          description: result.message || "Unknown error occurred."
        });
      }
    } catch (error) {
      console.error("Error purchasing arbitrage:", error);
      toast({
        variant: "destructive",
        title: "Purchase Failed",
        description: "Failed to purchase due to an unexpected error."
      });
    } finally {
      setIsExecuting(false);
    }

    // Reset form
    setQuantInvestmentAmount("");
    setQuantSelectedProduct(null);
  };

  const getQuantRiskColor = (risk: string) => {
    switch (risk) {
      case "Low": return "bg-green-500/20 text-green-500";
      case "Medium": return "bg-yellow-500/20 text-yellow-500";
      case "High": return "bg-orange-500/20 text-orange-500";
      case "Very High": return "bg-red-500/20 text-red-500";
      case "Premium": return "bg-purple-500/20 text-purple-500";
      default: return "bg-muted text-muted-foreground";
    }
  };

  // Trading Bots Functions
  const handleBotsSubscribeClick = (bot: any) => {
    setBotsSelectedBot(bot);
    setBotsIsSubscriptionModalOpen(true);
  };

  const getBotsRiskColor = (risk: string) => {
    switch (risk) {
      case 'Low': return 'text-green-500 bg-green-500/10';
      case 'Medium': return 'text-yellow-500 bg-yellow-500/10';
      case 'High': return 'text-red-500 bg-red-500/10';
      default: return 'text-muted-foreground bg-muted/10';
    }
  };

  const getBotsStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-500 bg-green-500/10';
      case 'paused': return 'text-yellow-500 bg-yellow-500/10';
      case 'stopped': return 'text-muted-foreground bg-muted/10';
      default: return 'text-muted-foreground bg-muted/10';
    }
  };

  const handleBotsBotAction = (botId: number, action: string) => {
    toast({
      title: `Bot ${action}`,
      description: `Bot action "${action}" has been executed successfully.`
    });
  };

  const handleBotsSubscribe = async (botId: string) => {
    setIsExecuting(true);
    try {
      const bot = botsMarketplace.find(b => b.id.toString() === botId);
      if (!bot) {
        toast({
          title: "Bot Not Found",
          description: "The selected bot could not be found.",
          variant: "destructive",
        });
        return;
      }

      const tradingBalance = parseFloat(tradingAccount.USDT?.available.replace(/,/g, '') || '0');
      
      if (bot.price > tradingBalance) {
        toast({
          title: "Insufficient Funds",
          description: "Insufficient Trading Account Balance. Please transfer from Funding Account.",
          variant: "destructive",
        });
        return;
      }

      const tradeRequest: TradeRequest = {
        type: 'bot',
        action: 'buy',
        symbol: bot.name.toUpperCase(),
        amount: bot.price,
        price: bot.price,
      };

      const result = await supabaseTradingPageService.executeTrade(tradeRequest);

      if (result) {
        // Deduct from trading account
        updateTradingBalance('USDT', bot.price, 'subtract');

        const tradeActivity = {
          type: "trade",
          action: "BOT SUBSCRIPTION",
          symbol: bot.name,
          amount: `$${bot.price}`,
          price: `${bot.category} Bot`,
          pnl: '0', // Bot subscriptions don't have immediate PnL
          status: "completed",
          time: "Just now",
          icon: "🤖"
        };
        addActivity(tradeActivity);
        addTrade({
          pair: bot.name,
          type: 'bot',
          amount: bot.price.toString(),
          price: `${bot.category} Bot`,
          pnl: '0', // Bot subscriptions don't have immediate PnL
          status: "completed"
        });

        toast({
          title: "Bot Subscription Successful",
          description: `Successfully subscribed to ${bot.name} for $${bot.price}`,
        });
      } else {
        toast({
          variant: "destructive",
          title: "Subscription Failed",
          description: "Failed to subscribe to bot."
        });
      }
    } catch (error) {
      console.error("Error subscribing to bot:", error);
      toast({
        variant: "destructive",
        title: "Subscription Failed",
        description: "Failed to subscribe due to an unexpected error."
      });
    } finally {
      setIsExecuting(false);
      setBotsIsSubscriptionModalOpen(false);
    }
  };

  // Strategy Builder Functions
  const handleStrategyComponentDrop = (data: any) => {
    const component = {
      id: Date.now().toString(),
      ...data,
      timestamp: new Date().toISOString()
    };
    setStrategyComponents(prev => [...prev, component]);
  };

  const handleRunBacktest = async () => {
    if (strategyComponents.length === 0) {
      toast({
        title: "No Strategy Components",
        description: "Please add some components to your strategy before running backtest.",
        variant: "destructive",
      });
      return;
    }

    setIsExecuting(true);
    try {
      // Simulate backtest calculation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const results = {
        totalReturn: 15.3,
        winRate: 78,
        totalTrades: 156,
        avgTradeDuration: "2.3 hours",
        maxDrawdown: -4.2,
        sharpeRatio: 1.8
      };
      
      setBacktestResults(results);
      
      toast({
        title: "Backtest Completed",
        description: `Strategy achieved ${results.totalReturn}% return with ${results.winRate}% win rate.`,
      });
    } catch (error) {
      console.error("Backtest error:", error);
      toast({
        variant: "destructive",
        title: "Backtest Failed",
        description: "Failed to run backtest due to an unexpected error."
      });
    } finally {
      setIsExecuting(false);
    }
  };

  const handleDeployStrategy = async () => {
    if (!deployName || !deployCapital || !backtestResults) {
      toast({
        title: "Missing Information",
        description: "Please complete strategy settings and run backtest before deployment.",
        variant: "destructive",
      });
      return;
    }

    const capital = parseFloat(deployCapital);
    const tradingBalance = parseFloat(tradingAccount.USDT?.available.replace(/,/g, '') || '0');
    
    if (capital > tradingBalance) {
      toast({
        title: "Insufficient Funds",
        description: "Insufficient Trading Account Balance. Please transfer from Funding Account.",
        variant: "destructive",
      });
      return;
    }

    setIsExecuting(true);
    try {
      // Deduct from trading account
      updateTradingBalance('USDT', capital, 'subtract');

      const tradeRequest: TradeRequest = {
        type: 'strategy',
        action: 'buy',
        symbol: strategySymbol || 'CUSTOM',
        amount: capital,
        price: capital,
      };

      const result = await supabaseTradingPageService.executeTrade(tradeRequest);

      if (result) {
        const tradeActivity = {
          type: "trade",
          action: "STRATEGY DEPLOYMENT",
          symbol: deployName,
          amount: `$${capital}`,
          price: `Custom Strategy`,
          pnl: '0', // Strategy deployment doesn't have immediate PnL
          status: "completed",
          time: "Just now",
          icon: "🤖"
        };
        addActivity(tradeActivity);
        addTrade({
          pair: deployName,
          type: 'strategy',
          amount: capital.toString(),
          price: `Custom Strategy`,
          pnl: '0', // Strategy deployment doesn't have immediate PnL
          status: "completed"
        });

        toast({
          title: "Strategy Deployed Successfully",
          description: `Custom strategy "${deployName}" deployed with $${capital} investment.`,
        });

        // Reset form
        setStrategyComponents([]);
        setStrategyName("");
        setStrategySymbol("");
        setPositionSize("");
        setMaxPositions("");
        setStopLoss("");
        setTakeProfit("");
        setDeployName("");
        setDeployCapital("");
        setBacktestResults(null);
      } else {
        toast({
          variant: "destructive",
          title: "Deployment Failed",
          description: "Failed to deploy strategy."
        });
      }
    } catch (error) {
      console.error("Strategy deployment error:", error);
      toast({
        variant: "destructive",
        title: "Deployment Failed",
        description: "Failed to deploy strategy due to an unexpected error."
      });
    } finally {
      setIsExecuting(false);
    }
  };

  const handleUseTemplate = (template: any) => {
    // Pre-fill strategy with template components
    const templateComponents = [
      { type: 'indicator', name: 'Moving Average', icon: '📈' },
      { type: 'condition', name: 'Price Above', icon: '⬆️' },
      { type: 'action', name: 'Buy', icon: '🟢' }
    ];
    
    setStrategyComponents(templateComponents);
    setStrategyName(template.name);
    
    toast({
      title: "Template Applied",
      description: `${template.name} template has been loaded into your strategy.`,
    });
  };

  // Bot Management Functions
  const handleBotAction = (botId: string, action: 'start' | 'pause' | 'stop') => {
    setMyBots(prev => prev.map(bot => {
      if (bot.id === botId) {
        const newStatus = action === 'start' ? 'active' : action === 'pause' ? 'paused' : 'stopped';
        return { ...bot, status: newStatus };
      }
      return bot;
    }));

    const actionText = action === 'start' ? 'started' : action === 'pause' ? 'paused' : 'stopped';
    toast({
      title: `Bot ${actionText}`,
      description: `Bot has been ${actionText} successfully.`,
    });
  };

  const handleBotSettings = (bot: any) => {
    setSelectedBotForSettings(bot);
    setIsBotSettingsModalOpen(true);
  };

  const handleCreateNewBot = () => {
    setIsCreateBotModalOpen(true);
  };

  const handleUpdateBotSettings = (botId: string, settings: any) => {
    setMyBots(prev => prev.map(bot => {
      if (bot.id === botId) {
        return { ...bot, ...settings };
      }
      return bot;
    }));

    setIsBotSettingsModalOpen(false);
    setSelectedBotForSettings(null);

    toast({
      title: "Bot Settings Updated",
      description: "Bot settings have been updated successfully.",
    });
  };

  const handleDeleteBot = (botId: string) => {
    setMyBots(prev => prev.filter(bot => bot.id !== botId));
    
    toast({
      title: "Bot Deleted",
      description: "Bot has been deleted successfully.",
    });
  };

  const getBotStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'paused': return 'bg-yellow-500';
      case 'stopped': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getPnlColor = (pnl: number) => {
    return pnl >= 0 ? 'text-green-500' : 'text-red-500';
  };

  // Bot Stake Functions
  const calculateBotProfit = (amount: number, duration: number, botTier: string) => {
    // Tier-based profit calculation
    let baseProfit = 24; // Default Tier 1
    
    switch (botTier) {
      case 'Tier 1':
        baseProfit = 24; // $1,000 - $9,999
        break;
      case 'Tier 2':
        baseProfit = 27; // $10,000 - $39,999
        break;
      case 'Tier 3':
        baseProfit = 31; // $40,000 - $99,999
        break;
      case 'Tier 4':
        baseProfit = 36; // $100,000 - $299,999
        break;
      case 'Tier 5':
        baseProfit = 49; // $300,000 - $1,000,000+
        break;
      default:
        baseProfit = 24;
    }
    
    const durationMultiplier = duration / 60; // Duration factor (0.167 to 1.0)
    const amountMultiplier = Math.min(amount / 10000, 1); // Amount factor
    
    // Calculate profit percentage with tier-based returns
    const profitPercentage = baseProfit + (durationMultiplier * 15) + (amountMultiplier * 10);
    const profitAmount = (amount * profitPercentage) / 100;
    
    return {
      percentage: profitPercentage,
      amount: profitAmount
    };
  };

  const handleBotStakeClick = (bot: any) => {
    setSelectedBotForStake(bot);
    setStakeAmount('');
    setStakeDuration(30);
    setEstimatedProfit(0);
    setProfitPercentage(0);
    setIsStakeModalOpen(true);
  };

  const handleStakeAmountChange = (amount: string) => {
    setStakeAmount(amount);
    const numAmount = parseFloat(amount) || 0;
    const profit = calculateBotProfit(numAmount, stakeDuration, selectedBotForStake?.tier || 'Tier 1');
    setEstimatedProfit(profit.amount);
    setProfitPercentage(profit.percentage);
  };

  const handleStakeDurationChange = (duration: number) => {
    setStakeDuration(duration);
    const numAmount = parseFloat(stakeAmount) || 0;
    const profit = calculateBotProfit(numAmount, duration, selectedBotForStake?.tier || 'Tier 1');
    setEstimatedProfit(profit.amount);
    setProfitPercentage(profit.percentage);
  };

  const handleStartBot = async () => {
    const amount = parseFloat(stakeAmount);
    const tradingBalance = parseFloat(tradingAccount.USDT?.available.replace(/,/g, '') || '0');
    
    if (amount < selectedBotForStake.minStake || amount > selectedBotForStake.maxStake) {
      toast({
        title: "Invalid Stake Amount",
        description: `Stake amount must be between $${selectedBotForStake.minStake.toLocaleString()} and $${selectedBotForStake.maxStake.toLocaleString()}`,
        variant: "destructive",
      });
      return;
    }
    
    if (amount > tradingBalance) {
      toast({
        title: "Insufficient Funds",
        description: "Insufficient Trading Account Balance. Please transfer from Funding Account.",
        variant: "destructive",
      });
      return;
    }

    setIsExecuting(true);
    try {
      // Deduct from trading account
      updateTradingBalance('USDT', amount, 'subtract');

      // Create new bot instance
      const newBot = {
        id: `bot-${Date.now()}`,
        name: selectedBotForStake.name,
        status: 'running',
        pnl: 0,
        trades: 0,
        allocation: amount,
        started: new Date().toLocaleDateString(),
        type: selectedBotForStake.category.toLowerCase(),
        performance: '0%',
        originalBot: selectedBotForStake,
        stakeAmount: amount,
        stakeDuration: stakeDuration,
        startTime: new Date(),
        endTime: new Date(Date.now() + stakeDuration * 60 * 1000),
        estimatedProfit: estimatedProfit,
        profitPercentage: profitPercentage
      };

      setMyBots(prev => [newBot, ...prev]);

      // Add to trade history
      const tradeRequest: TradeRequest = {
        type: 'bot',
        action: 'buy',
        symbol: selectedBotForStake.name,
        amount: amount,
        botId: selectedBotForStake.id,
        duration: stakeDuration,
        direction: 'up' // Bot trading is generally bullish
      };

      const result = await supabaseTradingPageService.executeTrade(tradeRequest);

      if (result) {
        const tradeActivity = {
          type: "trade",
          action: "BOT STARTED",
          symbol: selectedBotForStake.name,
          amount: `$${amount}`,
          price: `Duration: ${stakeDuration}min`,
          pnl: `Est. Profit: +$${estimatedProfit.toFixed(2)}`,
          status: "running",
          time: "Just now",
          icon: "🤖"
        };
        addActivity(tradeActivity);
        addTrade({
          pair: selectedBotForStake.name,
          type: 'bot',
          amount: amount.toString(),
          price: `Duration: ${stakeDuration}min`,
          pnl: `Est. Profit: +$${estimatedProfit.toFixed(2)}`,
          status: "running"
        });

        toast({
          title: "Bot Started Successfully",
          description: `${selectedBotForStake.name} bot started with $${amount} stake for ${stakeDuration} minutes.`,
        });

        setIsStakeModalOpen(false);
        setSelectedBotForStake(null);
      } else {
        toast({
          variant: "destructive",
          title: "Bot Start Failed",
          description: "Failed to start bot."
        });
      }
    } catch (error) {
      console.error("Bot start error:", error);
      toast({
        variant: "destructive",
        title: "Bot Start Failed",
        description: "Failed to start bot due to an unexpected error."
      });
    } finally {
      setIsExecuting(false);
    }
  };

  const formatBinaryTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  // Complete binary options trade
  const completeBinaryTrade = async (trade: any) => {
    const selectedAssetData = binaryAssets.find(a => a.symbol === trade.asset);
    const currentPrice = selectedAssetData?.price || 67543;
    const entryPrice = selectedAssetData?.price || 67543;
    
    let outcome = 'loss';
    let payout = 0;
    let profit = 0;
    let loss = 0;

    // Determine outcome based on prediction and price movement
    if (trade.prediction === 'higher') {
      if (currentPrice > entryPrice) {
        outcome = 'win';
        const payoutRate = parseFloat(trade.payout.replace('%', '')) / 100;
        payout = trade.amount * (1 + payoutRate);
        profit = payout - trade.amount;
      } else {
        loss = trade.amount;
      }
    } else { // lower
      if (currentPrice < entryPrice) {
        outcome = 'win';
        const payoutRate = parseFloat(trade.payout.replace('%', '')) / 100;
        payout = trade.amount * (1 + payoutRate);
        profit = payout - trade.amount;
      } else {
        loss = trade.amount;
      }
    }

    const completedTrade = {
      ...trade,
      status: 'completed',
      outcome,
      exitPrice: currentPrice,
      exitTime: new Date().toISOString(),
      payout: outcome === 'win' ? payout : 0,
      profit: outcome === 'win' ? profit : 0,
      loss: outcome === 'loss' ? loss : 0
    };

    // Move from active positions to history
    setBinaryActivePositions(prev => prev.filter(t => t.id !== trade.id));
    setBinaryTradeHistory(prev => [completedTrade, ...prev]);

    // Add payout to trading account if won
    if (outcome === 'win') {
      updateTradingBalance('USDT', payout, 'add');
    }

    // Add activity
    const tradeActivity = {
      type: "binary_trade",
      action: `BINARY ${trade.prediction.toUpperCase()} ${outcome.toUpperCase()}`,
      symbol: trade.asset,
      amount: `$${trade.amount}`,
      price: `$${currentPrice.toLocaleString()}`,
      pnl: outcome === 'win' ? `+$${profit.toFixed(2)}` : `-$${loss.toFixed(2)}`,
      status: outcome,
      time: "Just now",
      icon: outcome === 'win' ? "🎉" : "💸"
    };
    addActivity(tradeActivity);

    toast({
      title: `Binary Trade ${outcome.toUpperCase()}`,
      description: outcome === 'win' 
        ? `You won $${profit.toFixed(2)}!` 
        : `You lost $${loss.toFixed(2)}`
    });
  };

  // Staking Functions
  const handleStakeClick = (pool: any) => {
    console.log('Stake button clicked for pool:', pool);
    setSelectedPool(pool);
    setIsStakingModalOpen(true);
    setStakingStakeAmount(""); // Reset stake amount when opening modal
  };

  const handleUnstakeClick = (stake: any) => {
    console.log('Unstake button clicked for stake:', stake);
    setSelectedStake(stake);
    setIsUnstakeModalOpen(true);
  };

  const handleClaim = async (stake: any) => {
    console.log('Claim button clicked for stake:', stake);
    setStakingIsExecuting(true);
    try {
      // For claiming rewards, we don't need to use trading engine
      // Just add the reward value to trading account
      const rewardValue = stake.rewards * getTokenPrice(stake.token);
      updateTradingBalance('USDT', rewardValue, 'add');

      // Log activity
      const tradeActivity = {
        type: "trade",
        action: "REWARDS CLAIMED",
        symbol: `${stake.token} Staking`,
        amount: `${stake.rewards} ${stake.token}`,
        price: `Claimed`,
        pnl: `+$${rewardValue.toFixed(2)}`,
        status: "completed",
        time: "Just now",
        icon: "💰"
      };
      addActivity(tradeActivity);
      addTrade({
        pair: `${stake.token} Staking`,
        type: 'claim',
        amount: stake.rewards.toString(),
        price: "Claimed",
        pnl: `+$${rewardValue.toFixed(2)}`,
        status: "completed"
      });

      // Update stake rewards to 0
      setMyStakes(prev => prev.map(s => 
        s.id === stake.id ? { ...s, rewards: 0, canClaim: false } : s
      ));

      toast({
        title: "Rewards Claimed Successfully!",
        description: `Claimed ${stake.rewards} ${stake.token} worth $${rewardValue.toFixed(2)}`,
      });

      setStakingIsExecuting(false);
      return;
      
    } catch (error) {
      console.error("Error claiming rewards:", error);
      toast({
        variant: "destructive",
        title: "Claim Failed",
        description: "Failed to claim rewards due to an unexpected error."
      });
    } finally {
      setStakingIsExecuting(false);
    }
  };

  const handleUnstake = async (stake: any) => {
    setStakingIsExecuting(true);
    try {
      const tradeRequest: TradeRequest = {
        type: 'staking',
        action: 'unstake',
        symbol: stake.token,
        amount: stake.value, // Use USD value for trading account
        poolId: stake.poolId
      };

      const result = await supabaseTradingPageService.executeTrade(tradeRequest);

      if (result) {
        // Update trading balance with unstaked amount
        updateTradingBalance('USDT', stake.value, 'add');

        // Log activity
        const tradeActivity = {
          type: "trade",
          action: "UNSTAKE INITIATED",
          symbol: `${stake.token} Staking`,
          amount: `${stake.amount} ${stake.token}`,
          price: `Unstaking`,
          pnl: `+$${stake.value.toFixed(2)}`,
          status: "pending",
          time: "Just now",
          icon: "📤"
        };
        addActivity(tradeActivity);
        addTrade({
          pair: `${stake.token} Staking`,
          type: 'unstake',
          amount: stake.amount.toString(),
          price: "Unstaking",
          pnl: `+$${stake.value.toFixed(2)}`,
          status: "pending"
        });

        // Update stake status
        setMyStakes(prev => prev.map(s => 
          s.id === stake.id ? { ...s, status: "Pending Unstake", canUnstake: false } : s
        ));

        toast({
          title: "Unstaking Initiated Successfully",
          description: "Your unstaking request has been submitted. It will be processed within 24 hours.",
        });

        setIsUnstakeModalOpen(false);
      } else {
        toast({
          variant: "destructive",
          title: "Unstake Failed",
          description: "Failed to initiate unstaking."
        });
      }
    } catch (error) {
      console.error("Error unstaking:", error);
      toast({
        variant: "destructive",
        title: "Unstake Failed",
        description: "Failed to initiate unstaking due to an unexpected error."
      });
    } finally {
      setStakingIsExecuting(false);
    }
  };

  const handleStake = async (amount: number, pool: any) => {
    setStakingIsExecuting(true);
    try {
      // Validate minimum stake
      if (amount < pool.minStake) {
        toast({
          variant: "destructive",
          title: "Invalid Stake Amount",
          description: `Minimum stake for ${pool.token} is ${pool.minStake} ${pool.token}`,
        });
        return;
      }

      // Calculate stake value in USD
      const stakeValue = amount * getTokenPrice(pool.token);
      
      // Check if user has sufficient balance
      const tradingBalance = parseFloat(tradingAccount.USDT?.available.replace(/,/g, '') || '0');
      if (stakeValue > tradingBalance) {
        toast({
          variant: "destructive",
          title: "Insufficient Balance",
          description: "Insufficient Trading Account Balance. Please transfer from Funding Account.",
        });
        return;
      }

      // Use enhanced trading engine for staking
      const tradeRequest: TradeRequest = {
        type: 'staking',
        action: 'stake',
        symbol: pool.token,
        amount: stakeValue,
        poolId: pool.id
      };

      const result = await supabaseTradingPageService.executeTrade(tradeRequest);

      if (result) {
        // Create new stake
        const newStake = {
          id: `stake-${Date.now()}`,
          poolId: pool.id,
          token: pool.token,
          amount: amount,
          value: stakeValue,
          rewards: 0,
          apy: pool.apy,
          status: "Active",
          startDate: new Date().toISOString().split('T')[0],
          lockPeriod: pool.duration,
          canClaim: false,
          canUnstake: true
        };

        setMyStakes(prev => [newStake, ...prev]);
      } else {
        toast({
          variant: "destructive",
          title: "Stake Failed",
          description: "Failed to initiate stake."
        });
        return;
      }

      // Log activity
      const tradeActivity = {
        type: "trade",
        action: "STAKE INITIATED",
        symbol: `${pool.token} Staking`,
        amount: `${amount} ${pool.token}`,
        price: `Staked`,
        pnl: `-$${stakeValue.toFixed(2)}`,
        status: "completed",
        time: "Just now",
        icon: "🔒"
      };
      addActivity(tradeActivity);
      addTrade({
        pair: `${pool.token} Staking`,
        type: 'stake',
        amount: amount.toString(),
        price: "Staked",
        pnl: `-$${stakeValue.toFixed(2)}`,
        status: "completed"
      });

      toast({
        title: "Stake Initiated Successfully!",
        description: `Staked ${amount} ${pool.token} worth $${stakeValue.toFixed(2)}`,
      });

      setIsStakingModalOpen(false);
      setSelectedPool(null);
    } catch (error) {
      console.error("Error staking:", error);
      toast({
        variant: "destructive",
        title: "Stake Failed",
        description: "Failed to initiate stake due to an unexpected error."
      });
    } finally {
      setStakingIsExecuting(false);
    }
  };

  // Helper functions for staking
  const getTokenPrice = (token: string) => {
    const prices = {
      'ETH': 3890.25,
      'SOL': 185.75,
      'ADA': 0.45,
      'DOT': 125.00,
      'AVAX': 128.00,
      'MATIC': 0.85
    };
    return prices[token] || 0;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-green-500/10 text-green-500';
      case 'Limited': return 'bg-yellow-500/10 text-yellow-500';
      case 'Full': return 'bg-red-500/10 text-red-500';
      case 'Pending Unstake': return 'bg-orange-500/10 text-orange-500';
      default: return 'bg-gray-500/10 text-gray-500';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatTokenAmount = (amount: number, token: string) => {
    return `${amount.toLocaleString()} ${token}`;
  };

  // Calculate estimated rewards
  useEffect(() => {
    if (calculatorAmount && calculatorDuration && calculatorToken) {
      const pool = stakingPools.find(p => p.token === calculatorToken);
      if (pool) {
        const amount = parseFloat(calculatorAmount);
        const duration = parseInt(calculatorDuration);
        const apy = pool.apy;
        const estimatedReward = (amount * apy * duration) / (365 * 100);
        setEstimatedRewards(estimatedReward);
      }
    }
  }, [calculatorAmount, calculatorDuration, calculatorToken]);

  // Monitor binary options trades and complete them when they expire
  useEffect(() => {
    if (binaryActivePositions.length > 0) {
      console.log('🔵 Binary Active Positions:', binaryActivePositions.length);
      const timer = setInterval(() => {
        setBinaryActivePositions(prev => {
          const updatedPositions = prev.map(trade => {
            const timeRemaining = Math.max(0, Math.floor((new Date(trade.startTime).getTime() + trade.expiry * 1000 - new Date().getTime()) / 1000));
            
            console.log(`🔵 Trade ${trade.id}: ${timeRemaining}s remaining`);
            
            // If countdown finished, complete the trade
            if (timeRemaining <= 0) {
              console.log(`🔵 Completing trade ${trade.id}`);
              completeBinaryTrade(trade);
              return null; // Mark for removal
            }
            
            // Update time remaining
            return {
              ...trade,
              timeRemaining
            };
          });
          
          // Filter out completed trades (null values)
          return updatedPositions.filter(trade => trade !== null);
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [binaryActivePositions]);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[1600px] mx-auto px-2 sm:px-4 py-3 sm:py-6">
        {/* Trading Pair Header */}
        <div className="mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-card border rounded-lg p-3 sm:p-4 gap-3 sm:gap-0">
            <div className="flex items-center gap-3 sm:gap-6">
              <div>
                <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground">{selectedPair}</h1>
                <p className="text-xs sm:text-sm text-muted-foreground">{t('trading')}</p>
              </div>
              <div className="flex items-center gap-2 sm:gap-4">
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Last Price</p>
                  <p className={`text-sm sm:text-lg font-bold ${realTimePrice?.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    ${realTimePrice?.price.toLocaleString() || currentPrice?.price || '--'}
                  </p>
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">24h Change</p>
                  <p className={`text-sm sm:text-lg font-bold ${realTimePrice?.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {realTimePrice ? `${realTimePrice.change >= 0 ? '+' : ''}${realTimePrice.change.toFixed(2)}%` : currentPrice?.change || '--'}
                  </p>
                </div>
                <div className="hidden sm:block">
                  <p className="text-xs sm:text-sm text-muted-foreground">24h Volume</p>
                  <p className="text-sm sm:text-lg font-bold">
                    ${realTimePrice?.volume ? (realTimePrice.volume / 1000000).toFixed(1) + 'M' : currentPrice?.volume || '--'}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1 sm:gap-2">
              <Button variant="outline" size="sm" className="text-xs sm:text-sm">
                <Star className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                <span className="hidden sm:inline">Add to Favorites</span>
                <span className="sm:hidden">Fav</span>
              </Button>
              <Button variant="outline" size="sm" className="text-xs sm:text-sm">
                <Settings className="w-3 h-3 sm:w-4 sm:h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Trading Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6">
          <TabsList className="flex w-full gap-1 bg-muted/20 p-1 rounded-lg overflow-x-auto scrollbar-hide">
            <TabsTrigger value="spot" className="text-xs sm:text-sm font-medium data-[state=active]:bg-background data-[state=active]:text-foreground whitespace-nowrap flex-shrink-0">Spot</TabsTrigger>
            <TabsTrigger value="futures" className="text-xs sm:text-sm font-medium data-[state=active]:bg-background data-[state=active]:text-foreground whitespace-nowrap flex-shrink-0">Futures</TabsTrigger>
            <TabsTrigger value="options" className="text-xs sm:text-sm font-medium data-[state=active]:bg-background data-[state=active]:text-foreground whitespace-nowrap flex-shrink-0">Options</TabsTrigger>
            <TabsTrigger value="binary" className="text-xs sm:text-sm font-medium data-[state=active]:bg-background data-[state=active]:text-foreground whitespace-nowrap flex-shrink-0">Binary</TabsTrigger>
            <TabsTrigger value="quant" className="text-xs sm:text-sm font-medium data-[state=active]:bg-background data-[state=active]:text-foreground whitespace-nowrap flex-shrink-0">Quant</TabsTrigger>
            <TabsTrigger value="bots" className="text-xs sm:text-sm font-medium data-[state=active]:bg-background data-[state=active]:text-foreground whitespace-nowrap flex-shrink-0">Bots</TabsTrigger>
            <TabsTrigger value="staking" className="text-xs sm:text-sm font-medium data-[state=active]:bg-background data-[state=active]:text-foreground whitespace-nowrap flex-shrink-0">Staking</TabsTrigger>
          </TabsList>

          {/* Spot Trading Tab */}
          <TabsContent value="spot" className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
              {/* Left Sidebar - Trading Pairs & Order Book */}
              <div className="lg:col-span-3 space-y-4 sm:space-y-6">
                {/* Trading Pairs */}
                <Card className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold">Markets</h3>
                    <Button variant="ghost" size="sm">
                      <Settings className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="space-y-1">
                    {tradingPairs.map((pair, index) => (
                      <div 
                        key={index} 
                        className={`flex items-center justify-between p-2 rounded cursor-pointer hover:bg-muted/50 ${selectedPair === pair.symbol ? 'bg-primary/10' : ''}`}
                        onClick={() => setSelectedPair(pair.symbol)}
                      >
                        <div>
                          <p className="font-medium text-sm">{pair.symbol}</p>
                          <p className="text-xs text-muted-foreground">{pair.volume}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-sm">{pair.price}</p>
                          <p className={`text-xs ${pair.trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
                            {pair.change}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Order Book */}
                <Card className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold">Order Book</h3>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" className="w-6 h-6 p-0">
                        <BookOpen className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                  
                  {/* Asks */}
                  <div className="space-y-1 mb-4">
                    {orderBook.asks.reverse().map((ask, index) => (
                      <div key={index} className="grid grid-cols-3 text-xs">
                        <span className="text-red-500 font-mono">{ask.price}</span>
                        <span className="text-right font-mono">{ask.amount}</span>
                        <span className="text-right text-muted-foreground font-mono">{ask.total}</span>
                      </div>
                    ))}
                  </div>

                  {/* Current Price */}
                  <div className="text-center py-2 mb-4 border-t border-b">
                    <span className={`font-bold ${realTimePrice?.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      ${realTimePrice?.price.toLocaleString() || currentPrice?.price || '--'}
                    </span>
                  </div>

                  {/* Bids */}
                  <div className="space-y-1">
                    {orderBook.bids.map((bid, index) => (
                      <div key={index} className="grid grid-cols-3 text-xs">
                        <span className="text-green-500 font-mono">{bid.price}</span>
                        <span className="text-right font-mono">{bid.amount}</span>
                        <span className="text-right text-muted-foreground font-mono">{bid.total}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>

              {/* Main Trading Area */}
              <div className="xl:col-span-6 space-y-6">
                {/* Chart */}
                <Card className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold">Price Chart</h3>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={handleIndicators}>
                        <BarChart3 className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={handleDrawingTools}>
                        <PieChart className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={handleSettings}>
                        <Settings className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="h-96">
                    <TradingViewChart symbol={selectedPair} />
                  </div>
                </Card>

                {/* Trading Form */}
                <Card className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold">Spot Trading</h3>
                    <div className="flex gap-2">
                      <Button 
                        variant={spotDirection === 'buy' ? 'default' : 'outline'} 
                        size="sm"
                        onClick={() => setSpotDirection('buy')}
                        className={spotDirection === 'buy' ? 'bg-green-600 hover:bg-green-700' : ''}
                      >
                        {t('buy')} (Price Up)
                      </Button>
                      <Button 
                        variant={spotDirection === 'sell' ? 'default' : 'outline'} 
                        size="sm"
                        onClick={() => setSpotDirection('sell')}
                        className={spotDirection === 'sell' ? 'bg-red-600 hover:bg-red-700' : ''}
                      >
                        {t('sell')} (Price Down)
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="spotAmount">{t('amount')} (USDT)</Label>
                      <Input 
                        id="spotAmount"
                        type="number" 
                        placeholder="0.00" 
                        value={spotAmount}
                        onChange={(e) => setSpotAmount(e.target.value)}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="spotDuration">Duration (Minutes)</Label>
                      <Select value={spotDuration.toString()} onValueChange={(value) => setSpotDuration(parseInt(value))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1 minute</SelectItem>
                          <SelectItem value="5">5 minutes</SelectItem>
                          <SelectItem value="10">10 minutes</SelectItem>
                          <SelectItem value="15">15 minutes</SelectItem>
                          <SelectItem value="30">30 minutes</SelectItem>
                          <SelectItem value="60">60 minutes</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Profit Display */}
                    <div className="p-3 bg-muted/30 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Potential Profit:</span>
                        <span className="font-semibold text-green-500">
                          +{calculateSpotProfit(spotDuration).toFixed(1)}%
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Base: 5% + {spotDuration * 0.5}% per minute
                      </div>
                    </div>

                    {/* Active Trade Countdown */}
                    {activeSpotTrade && (
                      <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-blue-600">Active Trade</span>
                          <span className="text-2xl font-bold text-blue-600">
                            {formatCountdown(spotCountdown)}
                          </span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {activeSpotTrade.direction.toUpperCase()} ${activeSpotTrade.amount} - 
                          Entry: ${activeSpotTrade.entry_price.toLocaleString()}
                        </div>
                      </div>
                    )}
                    
                    <Button 
                      onClick={startSpotTrade}
                      disabled={isExecuting || activeSpotTrade}
                      className={`w-full ${spotDirection === 'buy' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
                    >
                      {isExecuting ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          {t('executing')}...
                        </>
                      ) : activeSpotTrade ? (
                        <>
                          <Clock className="w-4 h-4 mr-2" />
                          Trade in Progress
                        </>
                      ) : (
                        <>
                          {spotDirection === 'buy' ? <TrendingUp className="w-4 h-4 mr-2" /> : <TrendingDown className="w-4 h-4 mr-2" />}
                          Start {spotDirection.toUpperCase()} Trade
                        </>
                      )}
                    </Button>

                    {/* Debug Button */}
                    <Button 
                      onClick={debugTradingHistory}
                      variant="outline"
                      size="sm"
                      className="w-full mt-2"
                    >
                      Debug Trading History
                    </Button>
                  </div>
                </Card>
              </div>

              {/* Right Sidebar - Recent Trades & Spot History */}
              <div className="xl:col-span-3 space-y-6">
                {/* Recent Trades */}
                <Card className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold">Recent Trades</h3>
                    <Button variant="ghost" size="sm">
                      <Activity className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {recentTrades.map((trade, index) => (
                      <div key={index} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${trade.type === 'buy' ? 'bg-green-500' : 'bg-red-500'}`} />
                          <span className="font-mono">{trade.price}</span>
                        </div>
                        <span className="font-mono">{trade.amount}</span>
                        <span className="text-muted-foreground">{trade.time}</span>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Open Positions */}
                <Card className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold">Open Positions</h3>
                    <Badge variant="secondary">{openPositions.length}</Badge>
                  </div>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {openPositions.map((position) => (
                      <div key={position.id} className="p-3 border rounded-lg bg-slate-800/50">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className={`font-semibold ${position.direction === 'buy' ? 'text-green-500' : 'text-red-500'}`}>
                                {position.direction.toUpperCase()}
                              </span>
                              <Badge variant="outline" className="text-xs">
                                ${position.amount}
                              </Badge>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Entry: ${position.entry_price.toLocaleString()} • Duration: {position.duration}m
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center gap-1 text-blue-500">
                              <Clock className="w-4 h-4" />
                              <span className="font-mono text-sm">
                                {formatCountdown(Math.max(0, Math.floor((new Date(position.end_time).getTime() - new Date().getTime()) / 1000)))}
                              </span>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              +{position.profit_percentage.toFixed(1)}%
                            </div>
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Started: {new Date(position.start_time).toLocaleDateString()} {new Date(position.start_time).toLocaleTimeString()}
                        </div>
                        {position.take_profit && (
                          <div className="text-xs text-green-500 mt-1">
                            TP: ${position.take_profit.toLocaleString()}
                          </div>
                        )}
                        {position.stop_loss && (
                          <div className="text-xs text-red-500 mt-1">
                            SL: ${position.stop_loss.toLocaleString()}
                          </div>
                        )}
                        <div className="text-xs text-muted-foreground mt-1">
                          Order: {position.order_type?.toUpperCase() || 'MARKET'}
                        </div>
                      </div>
                    ))}
                    {openPositions.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        <Wallet className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No open positions</p>
                      </div>
                    )}
                  </div>
                </Card>

                {/* Spot Trading History */}
                <Card className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold">Spot Trade History</h3>
                    <Badge variant="secondary">{spotTradeHistory.length}</Badge>
                  </div>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {spotTradeHistory.slice(0, 10).map((trade) => (
                      <div key={trade.id} className="p-2 border rounded text-xs">
                        <div className="flex justify-between items-center mb-1">
                          <span className={`font-semibold ${trade.direction === 'buy' ? 'text-green-500' : 'text-red-500'}`}>
                            {trade.direction.toUpperCase()}
                          </span>
                          <span className={`font-semibold ${trade.outcome === 'win' ? 'text-green-500' : trade.outcome === 'lose' ? 'text-red-500' : 'text-yellow-500'}`}>
                            {trade.outcome ? trade.outcome.toUpperCase() : 'PENDING'}
                          </span>
                        </div>
                        <div className="text-muted-foreground">
                          ${trade.amount} • {trade.duration}m • {trade.profit_percentage.toFixed(1)}%
                        </div>
                        {trade.outcome && (
                          <div className="text-xs mt-1">
                            Entry: ${trade.entry_price.toLocaleString()} • Exit: ${trade.end_price?.toLocaleString() || '--'}
                          </div>
                        )}
                        {trade.outcome && (
                          <div className="text-xs mt-1">
                            {trade.outcome === 'win' ? `+$${(trade.payout - trade.amount).toFixed(2)}` : `-$${trade.amount}`}
                          </div>
                        )}
                        <div className="text-xs text-muted-foreground mt-1">
                          {new Date(trade.start_time).toLocaleDateString()} {new Date(trade.start_time).toLocaleTimeString()}
                        </div>
                      </div>
                    ))}
                    {spotTradeHistory.length === 0 && (
                      <div className="text-center py-4 text-muted-foreground">
                        <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No trades found</p>
                      </div>
                    )}
                  </div>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Futures Trading Tab */}
          <TabsContent value="futures" className="space-y-6">
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
              {/* Left Sidebar - Futures Pairs & Order Book */}
              <div className="xl:col-span-3 space-y-6">
                {/* Futures Pairs */}
                <Card className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold">Futures Pairs</h3>
                    <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/30">
                      <Zap className="w-3 h-3 mr-1" />
                      Up to 125x
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    {futuresPairs.map((pair, index) => (
                      <div 
                        key={index} 
                        className={`flex items-center justify-between p-2 rounded cursor-pointer hover:bg-muted/50 ${selectedPair === pair.symbol ? 'bg-primary/10' : ''}`}
                        onClick={() => setSelectedPair(pair.symbol)}
                      >
                        <div>
                          <p className="font-medium text-sm">{pair.symbol}</p>
                          <p className="text-xs text-muted-foreground">{pair.volume}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-sm">${pair.price.toLocaleString()}</p>
                          <p className={`text-xs ${pair.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {pair.change >= 0 ? '+' : ''}{pair.change}%
                          </p>
                          <p className={`text-xs ${pair.funding.includes('-') ? 'text-red-500' : 'text-green-500'}`}>
                            {pair.funding}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Futures Order Book */}
                <Card className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold">Order Book</h3>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" className="w-6 h-6 p-0">
                        <BookOpen className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                  
                  {/* Asks */}
                  <div className="space-y-1 mb-4">
                    {futuresOrderBook.asks.reverse().map((ask, index) => (
                      <div key={index} className="grid grid-cols-3 text-xs">
                        <span className="text-red-500 font-mono">{ask.price.toLocaleString()}</span>
                        <span className="text-right font-mono">{ask.amount}</span>
                        <span className="text-right text-muted-foreground font-mono">{ask.total}</span>
                      </div>
                    ))}
                  </div>

                  {/* Current Price */}
                  <div className="text-center py-2 mb-4 border-t border-b">
                    <span className="font-bold text-white">
                      ${futuresPairs.find(p => p.symbol === selectedPair)?.price.toLocaleString() || '--'}
                    </span>
                  </div>

                  {/* Bids */}
                  <div className="space-y-1">
                    {futuresOrderBook.bids.map((bid, index) => (
                      <div key={index} className="grid grid-cols-3 text-xs">
                        <span className="text-green-500 font-mono">{bid.price.toLocaleString()}</span>
                        <span className="text-right font-mono">{bid.amount}</span>
                        <span className="text-right text-muted-foreground font-mono">{bid.total}</span>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Futures Positions */}
                <Card className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold">Open Positions</h3>
                    <Badge variant="secondary">{futuresOpenPositions.length}</Badge>
                  </div>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {futuresOpenPositions.map((position) => (
                      <div key={position.id} className="p-3 border rounded-lg bg-slate-800/50">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className={`font-semibold ${position.direction === 'long' ? 'text-green-500' : 'text-red-500'}`}>
                                {position.direction.toUpperCase()}
                              </span>
                              <Badge variant="outline" className="text-xs">
                                ${position.amount}
                              </Badge>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Entry: ${position.entry_price.toLocaleString()} • Duration: {position.duration}m • {position.leverage}x
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center gap-1 text-blue-500">
                              <Clock className="w-4 h-4" />
                              <span className="font-mono text-sm">
                                {formatCountdown(Math.max(0, Math.floor((new Date(position.end_time).getTime() - new Date().getTime()) / 1000)))}
                              </span>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              +{position.profit_percentage.toFixed(1)}%
                            </div>
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Started: {new Date(position.start_time).toLocaleDateString()} {new Date(position.start_time).toLocaleTimeString()}
                        </div>
                        {position.take_profit && (
                          <div className="text-xs text-green-500 mt-1">
                            TP: ${position.take_profit.toLocaleString()}
                          </div>
                        )}
                        {position.stop_loss && (
                          <div className="text-xs text-red-500 mt-1">
                            SL: ${position.stop_loss.toLocaleString()}
                          </div>
                        )}
                        <div className="text-xs text-muted-foreground mt-1">
                          Order: {position.order_type?.toUpperCase() || 'MARKET'}
                        </div>
                      </div>
                    ))}
                    {futuresOpenPositions.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        <Wallet className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No open positions</p>
                      </div>
                    )}
                  </div>
                </Card>

                {/* Futures Trade History */}
                <Card className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold">Futures Trade History</h3>
                    <Badge variant="secondary">{futuresTradeHistory.length}</Badge>
                  </div>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {futuresTradeHistory.slice(0, 10).map((trade) => (
                      <div key={trade.id} className="p-2 border rounded text-xs">
                        <div className="flex justify-between items-center mb-1">
                          <span className={`font-semibold ${trade.direction === 'long' ? 'text-green-500' : 'text-red-500'}`}>
                            {trade.direction.toUpperCase()}
                          </span>
                          <span className={`font-semibold ${trade.outcome === 'win' ? 'text-green-500' : trade.outcome === 'lose' ? 'text-red-500' : 'text-yellow-500'}`}>
                            {trade.outcome ? trade.outcome.toUpperCase() : 'PENDING'}
                          </span>
                        </div>
                        <div className="text-muted-foreground">
                          ${trade.amount} • {trade.duration}m • {trade.leverage}x • {trade.profit_percentage.toFixed(1)}%
                        </div>
                        {trade.outcome && (
                          <div className="text-xs mt-1">
                            Entry: ${trade.entry_price.toLocaleString()} • Exit: ${trade.end_price?.toLocaleString() || '--'}
                          </div>
                        )}
                        {trade.outcome && (
                          <div className="text-xs mt-1">
                            {trade.outcome === 'win' ? `+$${(trade.payout - trade.amount).toFixed(2)}` : `-$${trade.amount}`}
                          </div>
                        )}
                        {trade.exit_reason && (
                          <div className="text-xs text-muted-foreground mt-1">
                            Exit: {trade.exit_reason === 'take_profit' ? 'Take Profit Hit' : 
                                   trade.exit_reason === 'stop_loss' ? 'Stop Loss Hit' : 'Timer Expired'}
                          </div>
                        )}
                        <div className="text-xs text-muted-foreground mt-1">
                          {new Date(trade.start_time).toLocaleDateString()} {new Date(trade.start_time).toLocaleTimeString()}
                        </div>
                      </div>
                    ))}
                    {futuresTradeHistory.length === 0 && (
                      <div className="text-center py-4 text-muted-foreground">
                        <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No trades found</p>
                      </div>
                    )}
                  </div>
                </Card>

                {/* Pending Orders */}
                <Card className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold">Pending Orders</h3>
                    <Badge variant="secondary">{futuresPendingOrders.length}</Badge>
                  </div>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {futuresPendingOrders.slice(0, 10).map((order) => (
                      <div key={order.id} className="p-2 border rounded text-xs">
                        <div className="flex justify-between items-center mb-1">
                          <span className={`font-semibold ${order.direction === 'long' ? 'text-green-500' : 'text-red-500'}`}>
                            {order.direction.toUpperCase()}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {order.trigger_type === 'limit' ? 'LIMIT' : 'STOP'}
                          </Badge>
                        </div>
                        <div className="text-muted-foreground">
                          ${order.amount} • {order.duration}m • {order.leverage}x • {order.profit_percentage.toFixed(1)}%
                        </div>
                        <div className="text-xs mt-1">
                          Trigger: ${order.trigger_price?.toLocaleString() || '--'}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {order.trigger_type === 'limit' 
                            ? 'Executes when price ≤ trigger'
                            : 'Executes when price ≥ trigger'
                          }
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {new Date(order.start_time).toLocaleDateString()} {new Date(order.start_time).toLocaleTimeString()}
                        </div>
                      </div>
                    ))}
                    {futuresPendingOrders.length === 0 && (
                      <div className="text-center py-4 text-muted-foreground">
                        <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No pending orders</p>
                      </div>
                    )}
                  </div>
                </Card>
              </div>

              {/* Main Trading Area */}
              <div className="xl:col-span-6 space-y-6">
                {/* Chart */}
                <Card className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold">Price Chart</h3>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={handleIndicators}>
                        <BarChart3 className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={handleDrawingTools}>
                        <PieChart className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={handleSettings}>
                        <Settings className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="h-96">
                    <TradingViewChart symbol={selectedPair} />
                  </div>
                </Card>

                {/* Futures Trading Form */}
                <Card className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold">Futures Trading</h3>
                    <div className="flex gap-2">
                      <Button 
                        variant={futuresPosition === 'long' ? 'default' : 'outline'} 
                        size="sm"
                        onClick={() => setFuturesPosition('long')}
                        className={futuresPosition === 'long' ? 'bg-green-600 hover:bg-green-700' : ''}
                      >
                        Long
                      </Button>
                      <Button 
                        variant={futuresPosition === 'short' ? 'default' : 'outline'} 
                        size="sm"
                        onClick={() => setFuturesPosition('short')}
                        className={futuresPosition === 'short' ? 'bg-red-600 hover:bg-red-700' : ''}
                      >
                        Short
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    {/* Leverage */}
                    <div>
                      <Label htmlFor="leverage">Leverage</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <Slider
                          value={futuresLeverage}
                          onValueChange={setFuturesLeverage}
                          max={125}
                          min={1}
                          step={1}
                          className="flex-1"
                        />
                        <span className="text-sm font-mono w-12">{futuresLeverage[0]}x</span>
                      </div>
                    </div>

                    {/* Order Type */}
                    <div>
                      <Label htmlFor="orderType">Order Type</Label>
                      <Select value={futuresOrderType} onValueChange={(value) => setFuturesOrderType(value as any)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="market">Market (Instant)</SelectItem>
                          <SelectItem value="limit">Limit (Pending)</SelectItem>
                          <SelectItem value="stop">Stop (Breakout)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Trigger Price for Limit/Stop Orders */}
                    {(futuresOrderType === 'limit' || futuresOrderType === 'stop') && (
                      <div>
                        <Label htmlFor="triggerPrice">
                          {futuresOrderType === 'limit' ? 'Limit Price' : 'Stop Price'} (USDT)
                        </Label>
                        <Input 
                          id="triggerPrice"
                          type="number" 
                          placeholder="0.00" 
                          value={futuresTriggerPrice}
                          onChange={(e) => setFuturesTriggerPrice(e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          {futuresOrderType === 'limit' 
                            ? 'Order executes when price reaches or goes below this level'
                            : 'Order executes when price reaches or goes above this level'
                          }
                        </p>
                      </div>
                    )}

                    {/* Duration */}
                    <div>
                      <Label htmlFor="duration">Duration (Minutes)</Label>
                      <Select value={futuresDuration.toString()} onValueChange={(value) => setFuturesDuration(parseInt(value))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1 minute</SelectItem>
                          <SelectItem value="5">5 minutes</SelectItem>
                          <SelectItem value="10">10 minutes</SelectItem>
                          <SelectItem value="15">15 minutes</SelectItem>
                          <SelectItem value="30">30 minutes</SelectItem>
                          <SelectItem value="60">60 minutes</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Take Profit */}
                    <div>
                      <Label htmlFor="takeProfit">Take Profit (Optional)</Label>
                      <Input 
                        id="takeProfit"
                        type="number" 
                        placeholder="0.00" 
                        value={futuresTakeProfit}
                        onChange={(e) => setFuturesTakeProfit(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Trade ends with WIN if price reaches this level
                      </p>
                    </div>

                    {/* Stop Loss */}
                    <div>
                      <Label htmlFor="stopLoss">Stop Loss (Optional)</Label>
                      <Input 
                        id="stopLoss"
                        type="number" 
                        placeholder="0.00" 
                        value={futuresStopLoss}
                        onChange={(e) => setFuturesStopLoss(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Trade ends with LOSE if price reaches this level
                      </p>
                    </div>

                    {/* Amount */}
                    <div>
                      <Label htmlFor="amount">Amount ({selectedPair.slice(0, -4)})</Label>
                      <Input 
                        id="amount"
                        type="number" 
                        placeholder="0.00" 
                        value={futuresAmount}
                        onChange={(e) => setFuturesAmount(e.target.value)}
                      />
                    </div>

                    {/* Profit Display */}
                    <div className="p-3 bg-muted/30 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Potential Profit:</span>
                        <span className="font-semibold text-green-500">
                          +{calculateFuturesProfit(futuresDuration, futuresLeverage[0]).toFixed(1)}%
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Base: 3% + {futuresDuration * 0.3}% + {futuresLeverage[0] * 0.1}% per minute
                      </div>
                    </div>

                    {/* Active Trade Countdown */}
                    {activeFuturesTrade && (
                      <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-blue-600">Active Trade</span>
                          <span className="text-2xl font-bold text-blue-600">
                            {formatCountdown(futuresCountdown)}
                          </span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {activeFuturesTrade.direction.toUpperCase()} ${activeFuturesTrade.amount} - 
                          Entry: ${activeFuturesTrade.entry_price.toLocaleString()}
                        </div>
                        {activeFuturesTrade.take_profit && (
                          <div className="text-xs text-green-500 mt-1">
                            TP: ${activeFuturesTrade.take_profit.toLocaleString()}
                          </div>
                        )}
                        {activeFuturesTrade.stop_loss && (
                          <div className="text-xs text-red-500 mt-1">
                            SL: ${activeFuturesTrade.stop_loss.toLocaleString()}
                          </div>
                        )}
                      </div>
                    )}
                    
                    <Button 
                      onClick={startFuturesTrade}
                      disabled={isExecuting || activeFuturesTrade}
                      className={`w-full ${futuresPosition === 'long' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
                    >
                      {isExecuting ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Placing Order...
                        </>
                      ) : activeFuturesTrade ? (
                        <>
                          <Clock className="w-4 h-4 mr-2" />
                          Trade in Progress
                        </>
                      ) : (
                        <>
                          {futuresPosition === 'long' ? <TrendingUp className="w-4 h-4 mr-2" /> : <TrendingDown className="w-4 h-4 mr-2" />}
                          {futuresOrderType === 'market' ? 'Place Market Order' : 
                           futuresOrderType === 'limit' ? 'Place Limit Order' : 'Place Stop Order'}
                        </>
                      )}
                    </Button>
                  </div>
                </Card>
              </div>

              {/* Right Sidebar - Account Info */}
              <div className="xl:col-span-3 space-y-6">
                {/* Account Balance */}
                <Card className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold">Futures Account</h3>
                    <Shield className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Available Balance:</span>
                      <span className="text-sm font-medium">$12,450.00</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Used Margin:</span>
                      <span className="text-sm">$3,998.00</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Unrealized PnL:</span>
                      <span className="text-sm text-green-500">+$653.50</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-muted-foreground">Total Balance:</span>
                      <span className="text-sm font-bold">$16,448.00</span>
                    </div>
                  </div>
                </Card>

                {/* Risk Management */}
                <Card className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold">Risk Management</h3>
                    <AlertTriangle className="w-4 h-4 text-yellow-500" />
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Margin Ratio:</span>
                      <span className="text-sm text-green-500">24.3%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Liquidation Price:</span>
                      <span className="text-sm text-red-500">$58,234.56</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Max Leverage:</span>
                      <span className="text-sm">125x</span>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Options Trading Tab */}
          <TabsContent value="options" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Left Column - Strategy Builder */}
              <div className="space-y-6">
                {/* Strategy Selection */}
                <Card className="kucoin-card-professional border-0">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm text-muted-foreground">Strategy Builder</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {strategies.map((strat) => (
                      <div
                        key={strat.id}
                        className={`p-3 rounded-lg cursor-pointer transition-all ${
                          strategy === strat.id 
                            ? 'bg-purple-500/10 border border-purple-500/30' 
                            : 'hover:bg-muted/50'
                        }`}
                        onClick={() => setStrategy(strat.id as any)}
                      >
                        <div className="font-medium text-foreground mb-1">{strat.name}</div>
                        <div className="text-xs text-muted-foreground mb-2">{strat.description}</div>
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Risk: {strat.risk}</span>
                          <span className="text-muted-foreground">Reward: {strat.reward}</span>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Greeks Display */}
                <Card className="kucoin-card-professional border-0">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm text-muted-foreground">Greeks Analysis</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="text-center p-2 rounded bg-muted/30">
                        <div className="text-xs text-muted-foreground">Delta</div>
                        <div className="font-semibold text-purple-500">0.58</div>
                      </div>
                      <div className="text-center p-2 rounded bg-muted/30">
                        <div className="text-xs text-muted-foreground">Gamma</div>
                        <div className="font-semibold text-blue-500">0.023</div>
                      </div>
                      <div className="text-center p-2 rounded bg-muted/30">
                        <div className="text-xs text-muted-foreground">Theta</div>
                        <div className="font-semibold text-orange-500">-45.2</div>
                      </div>
                      <div className="text-center p-2 rounded bg-muted/30">
                        <div className="text-xs text-muted-foreground">Vega</div>
                        <div className="font-semibold text-green-500">125.8</div>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Implied Volatility:</span>
                        <span className="text-foreground">42.1%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Time to Expiry:</span>
                        <span className="text-foreground">7 days</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Break-even:</span>
                        <span className="text-foreground">$68,920</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Center Column - Chart & Options Chain */}
              <div className="lg:col-span-2 space-y-6">
                {/* Chart */}
                <Card className="kucoin-card-professional border-0 h-[400px]">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-foreground">{selectedAsset} Options</CardTitle>
                  </CardHeader>
                  <CardContent className="h-full">
                    <TradingViewChart 
                      symbol={`BINANCE:${selectedAsset}`}
                      theme="dark"
                      height={320}
                      interval="1D"
                    />
                  </CardContent>
                </Card>

                {/* Options Chain */}
                <Card className="kucoin-card-professional border-0">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm text-muted-foreground">Options Chain</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {/* Headers */}
                      <div className="grid grid-cols-7 gap-2 text-xs text-muted-foreground mb-3">
                        <div className="text-center">Call Price</div>
                        <div className="text-center">Call IV</div>
                        <div className="text-center">Delta</div>
                        <div className="text-center font-semibold">Strike</div>
                        <div className="text-center">Delta</div>
                        <div className="text-center">Put IV</div>
                        <div className="text-center">Put Price</div>
                      </div>

                      {/* Options Data */}
                      {optionsChain.map((option, index) => (
                        <div key={index} className="grid grid-cols-7 gap-2 text-xs hover:bg-muted/20 p-2 rounded">
                          <div className="text-center text-green-500 font-medium">${option.callPrice}</div>
                          <div className="text-center text-muted-foreground">{option.callIV}</div>
                          <div className="text-center text-muted-foreground">{option.callDelta}</div>
                          <div className="text-center font-bold text-foreground">${option.strike.toLocaleString()}</div>
                          <div className="text-center text-muted-foreground">{option.putDelta}</div>
                          <div className="text-center text-muted-foreground">{option.putIV}</div>
                          <div className="text-center text-red-500 font-medium">${option.putPrice}</div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right Column - Order Form */}
              <div className="space-y-6">
                {/* Order Form */}
                <Card className="kucoin-card-professional border-0">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-foreground">Place Options Order</CardTitle>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    {/* Option Type */}
                    <Tabs value={optionType} onValueChange={(value) => setOptionType(value as 'call' | 'put')}>
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="call" className="text-green-500 data-[state=active]:bg-green-500 data-[state=active]:text-white">
                          <TrendingUp className="w-4 h-4 mr-2" />
                          Call
                        </TabsTrigger>
                        <TabsTrigger value="put" className="text-red-500 data-[state=active]:bg-red-500 data-[state=active]:text-white">
                          <TrendingDown className="w-4 h-4 mr-2" />
                          Put
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>

                    {/* Expiry Time (Minutes) */}
                    <div className="space-y-2">
                      <Label className="text-sm text-muted-foreground">Expiry Time (Minutes)</Label>
                      <Select value={optionsExpiryTime.toString()} onValueChange={(value) => setOptionsExpiryTime(parseInt(value))}>
                        <SelectTrigger className="kucoin-input-professional">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1 minute</SelectItem>
                          <SelectItem value="5">5 minutes</SelectItem>
                          <SelectItem value="10">10 minutes</SelectItem>
                          <SelectItem value="15">15 minutes</SelectItem>
                          <SelectItem value="30">30 minutes</SelectItem>
                          <SelectItem value="60">60 minutes</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Strike Price */}
                    <div className="space-y-2">
                      <Label className="text-sm text-muted-foreground">Strike Price (USDT)</Label>
                      <Input
                        type="number"
                        placeholder="67000"
                        value={strike}
                        onChange={(e) => setStrike(e.target.value)}
                        className="kucoin-input-professional"
                      />
                    </div>

                    {/* Entry Premium */}
                    <div className="space-y-2">
                      <Label className="text-sm text-muted-foreground">Entry Premium (USDT)</Label>
                      <Input
                        type="number"
                        placeholder="1920"
                        value={optionsEntryPremium}
                        onChange={(e) => setOptionsEntryPremium(e.target.value)}
                        className="kucoin-input-professional"
                      />
                    </div>

                    {/* Quantity */}
                    <div className="space-y-2">
                      <Label className="text-sm text-muted-foreground">Quantity (Contracts)</Label>
                      <Input
                        type="number"
                        placeholder="1"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        className="kucoin-input-professional"
                      />
                    </div>

                    {/* Order Summary */}
                    {strike && quantity && optionsEntryPremium && (
                      <div className="space-y-2 p-3 rounded-lg bg-muted/30 border border-border/50">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Strategy:</span>
                          <span className="text-foreground font-medium">{strategies.find(s => s.id === strategy)?.name}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Premium Cost:</span>
                          <span className="text-foreground">${(parseFloat(optionsEntryPremium) * parseFloat(quantity)).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Break-even:</span>
                          <span className="text-foreground">
                            {strategy === 'long-call' ? `$${(parseFloat(strike) + parseFloat(optionsEntryPremium)).toFixed(2)}` :
                             strategy === 'long-put' ? `$${(parseFloat(strike) - parseFloat(optionsEntryPremium)).toFixed(2)}` :
                             `$${parseFloat(strike).toFixed(2)}`}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Max Profit:</span>
                          <span className="text-green-500">
                            {strategy === 'long-call' ? 'Unlimited' :
                             strategy === 'long-put' ? 'High' :
                             'Limited (Premium)'}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Max Loss:</span>
                          <span className="text-red-500">
                            {strategy === 'long-call' || strategy === 'long-put' ? 'Premium Paid' :
                             'Moderate'}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Expiry:</span>
                          <span className="text-foreground">{optionsExpiryTime} minutes</span>
                        </div>
                      </div>
                    )}

                    {/* Place Order Button */}
                    <Button 
                      onClick={handlePlaceOptionsOrder}
                      className={`w-full ${
                        optionType === 'call' 
                          ? 'bg-green-500 hover:bg-green-600 text-white' 
                          : 'bg-red-500 hover:bg-red-600 text-white'
                      }`}
                      disabled={isExecuting}
                    >
                      {isExecuting ? 'Placing Order...' : `Buy ${optionType === 'call' ? 'Call' : 'Put'} Option`}
                    </Button>
                  </CardContent>
                </Card>

                {/* Open Orders */}
                <Card className="kucoin-card-professional border-0">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm text-muted-foreground">Open Options Orders</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {optionsOpenOrders.slice(0, 5).map((order) => (
                      <div key={order.id} className="p-3 rounded-lg bg-muted/30 border border-border/50">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`font-semibold text-sm ${
                                order.strategy === 'long-call' ? 'text-green-500' : 
                                order.strategy === 'long-put' ? 'text-red-500' :
                                order.strategy === 'covered-call' ? 'text-yellow-500' : 'text-orange-500'
                              }`}>
                                {order.strategyDetails?.name}
                              </span>
                              <Badge variant="outline" className="text-xs">
                                {order.optionType.toUpperCase()}
                              </Badge>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {order.asset} • ${order.strikePrice.toLocaleString()} strike • {order.quantity} contracts
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center gap-1 text-blue-500">
                              <Clock className="w-4 h-4" />
                              <span className="font-mono text-sm">
                                {formatOptionsCountdown(order.timeRemaining)}
                              </span>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              ${order.entryPremium} premium
                            </div>
                          </div>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-muted-foreground">
                            Status: {isInTheMoney(order) ? 'In The Money' : 'Out of The Money'}
                          </span>
                          <span className={`text-xs ${
                            isInTheMoney(order) ? 'text-green-500' : 'text-red-500'
                          }`}>
                            ${order.currentPrice.toLocaleString()}
                          </span>
                        </div>
                        <div className="mt-2 p-2 bg-blue-500/10 rounded text-center">
                          <div className="text-xs text-blue-500 font-medium">Countdown Timer</div>
                          <div className="text-lg font-mono text-blue-600">
                            {formatOptionsCountdown(order.timeRemaining)}
                          </div>
                        </div>
                      </div>
                    ))}
                    {optionsOpenOrders.length === 0 && (
                      <div className="text-center py-4 text-muted-foreground">
                        <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No open orders</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Recent Trades */}
                <Card className="kucoin-card-professional border-0">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm text-muted-foreground">Recent Options Trades</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {optionsRecentTrades.slice(0, 5).map((trade) => (
                      <div key={trade.id} className="p-3 rounded-lg bg-muted/30 border border-border/50">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`font-semibold text-sm ${
                                trade.strategy === 'long-call' ? 'text-green-500' : 
                                trade.strategy === 'long-put' ? 'text-red-500' :
                                trade.strategy === 'covered-call' ? 'text-yellow-500' : 'text-orange-500'
                              }`}>
                                {trade.strategyDetails?.name}
                              </span>
                              <Badge variant={trade.outcome === 'win' ? 'default' : 'secondary'} className="text-xs">
                                {trade.outcome.toUpperCase()}
                              </Badge>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {trade.asset} • ${trade.strikePrice.toLocaleString()} strike • {trade.quantity} contracts
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`font-semibold ${
                              trade.outcome === 'win' ? 'text-green-500' : 'text-red-500'
                            }`}>
                              {trade.outcome === 'win' ? `+$${trade.profit?.toFixed(2)}` : `-$${trade.loss?.toFixed(2)}`}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Exit: ${trade.exitPrice?.toLocaleString()}
                            </div>
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(trade.exitTime).toLocaleTimeString()}
                        </div>
                      </div>
                    ))}
                    {optionsRecentTrades.length === 0 && (
                      <div className="text-center py-4 text-muted-foreground">
                        <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No recent trades</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Options Wallet */}
                <Card className="kucoin-card-professional border-0">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm text-muted-foreground">Trading Account</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Available Balance:</span>
                      <span className="text-sm font-medium text-foreground">${tradingAccount.USDT?.available || '0.00'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Open Orders:</span>
                      <span className="text-sm text-foreground">{optionsOpenOrders.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Today's P&L:</span>
                      <span className="text-sm text-green-500">+$284.50</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Binary Options Tab */}
          <TabsContent value="binary" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Left Column - Asset Selection */}
              <div className="space-y-6">
                {/* Assets */}
                <Card className="kucoin-card-professional border-0">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm text-muted-foreground">Select Asset</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {binaryAssets.map((asset) => (
                      <div
                        key={asset.symbol}
                        className={`p-3 rounded-lg cursor-pointer transition-all ${
                          binarySelectedAsset === asset.symbol 
                            ? 'bg-blue-500/10 border border-blue-500/30' 
                            : 'hover:bg-muted/50'
                        }`}
                        onClick={() => setBinarySelectedAsset(asset.symbol)}
                      >
                        <div className="flex justify-between items-start mb-1">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-foreground">{asset.symbol}</span>
                            <Badge className="bg-green-500/20 text-green-500 border-0 text-xs">
                              {asset.payout}
                            </Badge>
                          </div>
                          <div className="text-xs text-muted-foreground">{asset.category}</div>
                        </div>
                        <div className="text-sm text-foreground">${asset.price.toLocaleString()}</div>
                        <div className={`text-xs ${asset.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {asset.change >= 0 ? '+' : ''}{asset.change}% (24h)
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Active Positions */}
                <Card className="kucoin-card-professional border-0">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm text-muted-foreground">Active Positions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {binaryActivePositions.slice(0, 5).map((position) => (
                      <div key={position.id} className="p-3 rounded-lg bg-muted/30 border border-border/50">
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-medium text-foreground text-sm">{position.asset}</span>
                          <Badge variant="outline" className="text-xs">
                            {position.prediction}
                          </Badge>
                        </div>
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Amount:</span>
                            <span className="text-foreground">${position.amount}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Payout:</span>
                            <span className="text-green-500">{position.payout}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Time Left:</span>
                            <span className="text-blue-500 font-mono">
                              {formatBinaryTime(position.timeRemaining || 0)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Status:</span>
                            <span className="text-blue-500">Active</span>
                          </div>
                        </div>
                      </div>
                    ))}
                    {binaryActivePositions.length === 0 && (
                      <div className="text-center py-4 text-muted-foreground">
                        <Target className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No active positions</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Center Column - Chart & Price */}
              <div className="lg:col-span-2">
                <Card className="kucoin-card-professional border-0 h-[600px]">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-foreground">{binarySelectedAsset}</CardTitle>
                      <div className="flex items-center space-x-4">
                        <div className="text-2xl font-bold text-foreground">
                          ${binaryAssets.find(a => a.symbol === binarySelectedAsset)?.price.toLocaleString()}
                        </div>
                        <div className={`flex items-center space-x-1 ${
                          binaryAssets.find(a => a.symbol === binarySelectedAsset)?.change && 
                          binaryAssets.find(a => a.symbol === binarySelectedAsset)!.change >= 0 
                            ? 'text-green-500' : 'text-red-500'
                        }`}>
                          {binaryAssets.find(a => a.symbol === binarySelectedAsset)?.change && 
                           binaryAssets.find(a => a.symbol === binarySelectedAsset)!.change >= 0 ? (
                            <TrendingUp className="w-4 h-4" />
                          ) : (
                            <TrendingDown className="w-4 h-4" />
                          )}
                          <span className="font-medium">
                            {binaryAssets.find(a => a.symbol === binarySelectedAsset)?.change && 
                             binaryAssets.find(a => a.symbol === binarySelectedAsset)!.change >= 0 ? '+' : ''
                            }{binaryAssets.find(a => a.symbol === binarySelectedAsset)?.change}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="h-full">
                    {/* Simple Price Chart Simulation */}
                    <div className="h-[400px] bg-muted/20 rounded-lg p-4 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-4xl font-bold text-foreground mb-2">
                          ${binaryAssets.find(a => a.symbol === binarySelectedAsset)?.price.toLocaleString()}
                        </div>
                        <div className={`text-lg ${
                          binaryAssets.find(a => a.symbol === binarySelectedAsset)?.change && 
                          binaryAssets.find(a => a.symbol === binarySelectedAsset)!.change >= 0 
                            ? 'text-green-500' : 'text-red-500'
                        }`}>
                          {binaryAssets.find(a => a.symbol === binarySelectedAsset)?.change && 
                           binaryAssets.find(a => a.symbol === binarySelectedAsset)!.change >= 0 ? '+' : ''
                          }{binaryAssets.find(a => a.symbol === binarySelectedAsset)?.change}% (24h)
                        </div>
                        <div className="mt-4 text-sm text-muted-foreground">
                          Live price updates every second
                        </div>
                      </div>
                    </div>

                    {/* Prediction Buttons */}
                    <div className="grid grid-cols-2 gap-4 mt-6">
                      <Button
                        onClick={() => setBinaryPrediction('higher')}
                        className={`h-16 ${binaryPrediction === 'higher' ? 'bg-green-500 hover:bg-green-600' : 'bg-muted hover:bg-green-500/20'} text-white`}
                      >
                        <div className="text-center">
                          <TrendingUp className="w-6 h-6 mx-auto mb-1" />
                          <div className="font-semibold">HIGHER</div>
                          <div className="text-xs opacity-80">Price will rise</div>
                        </div>
                      </Button>
                      <Button
                        onClick={() => setBinaryPrediction('lower')}
                        className={`h-16 ${binaryPrediction === 'lower' ? 'bg-red-500 hover:bg-red-600' : 'bg-muted hover:bg-red-500/20'} text-white`}
                      >
                        <div className="text-center">
                          <TrendingDown className="w-6 h-6 mx-auto mb-1" />
                          <div className="font-semibold">LOWER</div>
                          <div className="text-xs opacity-80">Price will fall</div>
                        </div>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right Column - Trade Form */}
              <div className="space-y-6">
                {/* Trade Form */}
                <Card className="kucoin-card-professional border-0">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-foreground">Place Binary Option</CardTitle>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    {/* Expiration Time */}
                    <div className="space-y-2">
                      <Label className="text-sm text-muted-foreground">Expiration Time</Label>
                      <Select value={binaryExpiration} onValueChange={setBinaryExpiration}>
                        <SelectTrigger className="kucoin-input-professional">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {binaryExpirationTimes.map((time) => (
                            <SelectItem key={time.value} value={time.value}>
                              {time.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Investment Amount */}
                    <div className="space-y-2">
                      <Label className="text-sm text-muted-foreground">Investment Amount (USDT)</Label>
                      <Input
                        type="number"
                        placeholder="10.00"
                        value={binaryAmount}
                        onChange={(e) => setBinaryAmount(e.target.value)}
                        className="kucoin-input-professional"
                      />
                      <div className="flex space-x-2">
                        {['10', '25', '50', '100'].map((preset) => (
                          <Button
                            key={preset}
                            variant="outline"
                            size="sm"
                            onClick={() => setBinaryAmount(preset)}
                            className="flex-1 text-xs"
                          >
                            ${preset}
                          </Button>
                        ))}
                      </div>
                    </div>

                    {/* Trade Summary */}
                    {binaryAmount && (
                      <div className="space-y-3 p-3 rounded-lg bg-muted/30 border border-border/50">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Asset:</span>
                          <span className="text-foreground">{binarySelectedAsset}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Prediction:</span>
                          <span className={binaryPrediction === 'higher' ? 'text-green-500' : 'text-red-500'}>
                            {binaryPrediction.toUpperCase()}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Investment:</span>
                          <span className="text-foreground">${binaryAmount}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Payout Rate:</span>
                          <span className="text-green-500">{binaryAssets.find(a => a.symbol === binarySelectedAsset)?.payout}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Potential Profit:</span>
                          <span className="text-green-500">
                            ${binaryAmount ? (
                              (parseFloat(binaryAmount) * parseFloat(binaryAssets.find(a => a.symbol === binarySelectedAsset)?.payout.replace('%', '') || '0') / 100) - parseFloat(binaryAmount)
                            ).toFixed(2) : '0.00'}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm font-semibold">
                          <span className="text-muted-foreground">Total Payout:</span>
                          <span className="text-foreground">
                            ${binaryAmount ? (
                              parseFloat(binaryAmount) * (1 + parseFloat(binaryAssets.find(a => a.symbol === binarySelectedAsset)?.payout.replace('%', '') || '0') / 100)
                            ).toFixed(2) : '0.00'}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Place Trade Button */}
                    <Button 
                      onClick={handlePlaceBinaryTrade}
                      className={`w-full ${
                        binaryPrediction === 'higher' 
                          ? 'bg-green-500 hover:bg-green-600 text-white' 
                          : 'bg-red-500 hover:bg-red-600 text-white'
                      }`}
                      disabled={!binaryAmount || isExecuting}
                    >
                      <Timer className="w-4 h-4 mr-2" />
                      {isExecuting ? 'Placing Trade...' : `Predict ${binaryPrediction === 'higher' ? 'Higher' : 'Lower'}`}
                    </Button>
                  </CardContent>
                </Card>

                {/* Asset Categories */}
                <Card className="kucoin-card-professional border-0">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm text-muted-foreground">Asset Categories</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {["All", "Crypto", "Forex", "Stocks", "Commodities", "Indices"].map((category) => (
                      <Button
                        key={category}
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start text-left"
                      >
                        {category}
                      </Button>
                    ))}
                  </CardContent>
                </Card>

                {/* Trade History */}
                <Card className="kucoin-card-professional border-0">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm text-muted-foreground">Recent Trades</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {binaryTradeHistory.slice(0, 5).map((trade) => (
                      <div key={trade.id} className="p-3 rounded-lg bg-muted/30 border border-border/50">
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-medium text-foreground text-sm">{trade.asset}</span>
                          <Badge variant={trade.outcome === 'win' ? 'default' : 'destructive'} className="text-xs">
                            {trade.prediction}
                          </Badge>
                        </div>
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Investment:</span>
                            <span className="text-foreground">${trade.amount}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Result:</span>
                            <span className={trade.outcome === 'win' ? 'text-green-500' : 'text-red-500'}>
                              {trade.outcome === 'win' ? `+$${trade.payout}` : `-$${trade.amount}`}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Time:</span>
                            <span className="text-foreground">{new Date(trade.startTime).toLocaleTimeString()}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                    {binaryTradeHistory.length === 0 && (
                      <div className="text-center py-4 text-muted-foreground">
                        <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No recent trades</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Quant Trading Tab */}
          <TabsContent value="quant" className="space-y-6">
            <div className="max-w-7xl mx-auto">
              {/* Header Section */}
              <div className="mb-8">
                <div className="text-center mb-8">
                  <h1 className="text-4xl font-bold text-foreground mb-4">
                    <span className="bg-gradient-to-r from-green-500 to-blue-500 bg-clip-text text-transparent">
                      Quant Trading
                    </span>
                  </h1>
                  <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                    Advanced algorithmic arbitrage strategies with guaranteed returns and risk management
                  </p>
                </div>

                {/* Metrics Dashboard */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                  <Card className="border-0 bg-gradient-to-br from-green-500/10 to-green-500/5">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Total Entrusted</p>
                          {/* TODO: Replace with real API call to get user's total entrusted funds */}
                          <p className="text-2xl font-bold text-foreground">$0.00</p>
                          <p className="text-xs text-muted-foreground">≈ 0.00 BTC</p>
                        </div>
                        <DollarSign className="w-8 h-8 text-green-500" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-0 bg-gradient-to-br from-blue-500/10 to-blue-500/5">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Today's Earnings</p>
                          {/* TODO: Replace with real API call to get today's earnings */}
                          <p className="text-2xl font-bold text-green-500">$0.00</p>
                          <p className="text-xs text-green-500">0.00% today</p>
                        </div>
                        <TrendingUp className="w-8 h-8 text-blue-500" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-0 bg-gradient-to-br from-purple-500/10 to-purple-500/5">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Total Earnings</p>
                          {/* TODO: Replace with real API call to get total earnings */}
                          <p className="text-2xl font-bold text-foreground">$0.00</p>
                          <p className="text-xs text-green-500">0.00% overall</p>
                        </div>
                        <BarChart3 className="w-8 h-8 text-purple-500" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-0 bg-gradient-to-br from-yellow-500/10 to-yellow-500/5">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Active Strategies</p>
                          {/* TODO: Replace with real API call to get active strategies count */}
                          <p className="text-2xl font-bold text-foreground">0</p>
                          <p className="text-xs text-muted-foreground">Running smoothly</p>
                        </div>
                        <Activity className="w-8 h-8 text-yellow-500" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-center gap-4 mb-8">
                  {/* TODO: Implement real settlement functionality */}
                  <Button className="bg-green-600 hover:bg-green-700">
                    <Shield className="w-4 h-4 mr-2" />
                    Daily Settlement
                  </Button>
                  {/* TODO: Implement real returns functionality */}
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <Target className="w-4 h-4 mr-2" />
                    Stable Returns
                  </Button>
                  {/* TODO: Implement real withdrawal functionality */}
                  <Button variant="outline">
                    <Zap className="w-4 h-4 mr-2" />
                    Fast Withdrawal
                  </Button>
                </div>
              </div>

              <Tabs defaultValue="products" className="space-y-8">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="products">Arbitrage Products</TabsTrigger>
                  <TabsTrigger value="portfolio">My Portfolio</TabsTrigger>
                  <TabsTrigger value="history">Trade History</TabsTrigger>
                </TabsList>

                <TabsContent value="products" className="space-y-6">
                  {/* Arbitrage Product Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {quantArbitrageProducts.map((product) => (
                      <Card 
                        key={product.id} 
                        className="border-0 hover:shadow-lg transition-all duration-300 cursor-pointer group"
                        onClick={() => setQuantSelectedProduct(product.id.toString())}
                      >
                        <CardHeader className="pb-4">
                          <div className="flex items-center justify-between mb-2">
                            <CardTitle className="text-lg text-foreground">{product.duration}</CardTitle>
                            <Badge className={getQuantRiskColor(product.riskLevel)}>
                              {product.riskLevel}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">{product.arbitrageId}</div>
                          <div className="text-xs text-muted-foreground">{product.purchaseLimit}</div>
                        </CardHeader>
                        
                        <CardContent className="space-y-4">
                          {/* Investment Range */}
                          <div className="p-3 rounded-lg bg-muted/30">
                            <div className="text-xs text-muted-foreground mb-1">Investment Range</div>
                            <div className="font-semibold text-foreground">{product.investmentRange}</div>
                          </div>

                          {/* Daily Income */}
                          <div className="p-3 rounded-lg bg-green-500/10">
                            <div className="text-xs text-muted-foreground mb-1">Daily Income Range</div>
                            <div className="font-bold text-green-500 text-lg">{product.dailyIncomeRange}</div>
                          </div>

                          {/* Total Return */}
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Total Return</span>
                            <span className="font-bold text-blue-500">{product.totalReturn}</span>
                          </div>

                          {/* Crypto Icons */}
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">Assets:</span>
                            <div className="flex gap-1">
                              {product.cryptos.map((crypto, index) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {crypto}
                                </Badge>
                              ))}
                            </div>
                          </div>

                          {/* Purchase Button */}
                          <Button 
                            className="w-full bg-green-600 hover:bg-green-700 group-hover:bg-green-700 group-hover:text-white"
                            onClick={(e) => {
                              e.stopPropagation();
                              setQuantSelectedProduct(product.id.toString());
                            }}
                          >
                            <Calculator className="w-4 h-4 mr-2" />
                            Purchase
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {/* Investment Modal */}
                  {quantSelectedProduct && (
                    <Card className="border-0 max-w-md mx-auto">
                      <CardHeader>
                        <CardTitle className="text-foreground">Invest in Arbitrage Strategy</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="quant-amount">Investment Amount (USDT)</Label>
                          <Input
                            id="quant-amount"
                            type="number"
                            placeholder="Enter amount"
                            value={quantInvestmentAmount}
                            onChange={(e) => setQuantInvestmentAmount(e.target.value)}
                          />
                        </div>
                        
                        <div className="flex gap-2">
                          <Button 
                            onClick={() => handleQuantPurchase(quantArbitrageProducts.find(p => p.id.toString() === quantSelectedProduct))}
                            className="flex-1 bg-green-600 hover:bg-green-700"
                            disabled={isExecuting}
                          >
                            {isExecuting ? 'Processing...' : 'Confirm Investment'}
                          </Button>
                          <Button 
                            variant="outline"
                            onClick={() => setQuantSelectedProduct(null)}
                            className="flex-1"
                          >
                            Cancel
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="portfolio" className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card className="border-0">
                      <CardHeader>
                        <CardTitle className="text-foreground">Active Investments</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {[
                          { strategy: "Arbitrage: 3", amount: "$25,000", duration: "7 Days", progress: 65, earnings: "+$1,250" },
                          { strategy: "Arbitrage: 1", amount: "$10,000", duration: "1 Day", progress: 100, earnings: "+$85" },
                          { strategy: "Arbitrage: 5", amount: "$50,000", duration: "30 Days", progress: 23, earnings: "+$3,680" }
                        ].map((investment, index) => (
                          <div key={index} className="p-4 border border-border rounded-lg">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <div className="font-semibold text-foreground">{investment.strategy}</div>
                                <div className="text-sm text-muted-foreground">{investment.duration}</div>
                              </div>
                              <div className="text-right">
                                <div className="font-semibold text-foreground">{investment.amount}</div>
                                <div className="text-sm text-green-500">{investment.earnings}</div>
                              </div>
                            </div>
                            <div className="w-full bg-muted rounded-full h-2">
                              <div 
                                className="bg-green-500 h-2 rounded-full transition-all duration-300" 
                                style={{ width: `${investment.progress}%` }}
                              ></div>
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">{investment.progress}% complete</div>
                          </div>
                        ))}
                      </CardContent>
                    </Card>

                    <Card className="border-0">
                      <CardHeader>
                        <CardTitle className="text-foreground">Performance Analytics</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="text-center p-3 rounded-lg bg-muted/30">
                            <div className="text-2xl font-bold text-green-500">0.0%</div>
                            <div className="text-xs text-muted-foreground">Success Rate</div>
                          </div>
                          <div className="text-center p-3 rounded-lg bg-muted/30">
                            <div className="text-2xl font-bold text-foreground">0.0x</div>
                            <div className="text-xs text-muted-foreground">Avg Multiplier</div>
                          </div>
                          <div className="text-center p-3 rounded-lg bg-muted/30">
                            <div className="text-2xl font-bold text-purple-500">0</div>
                            <div className="text-xs text-muted-foreground">Total Trades</div>
                          </div>
                          <div className="text-center p-3 rounded-lg bg-muted/30">
                            <div className="text-2xl font-bold text-blue-500">0.0%</div>
                            <div className="text-xs text-muted-foreground">Monthly ROI</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="history">
                  <TradeHistory />
                </TabsContent>
              </Tabs>
            </div>
          </TabsContent>

          {/* Trading Bots Tab */}
          <TabsContent value="bots" className="space-y-6">
            <div className="max-w-7xl mx-auto">
              {/* Header */}
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h1 className="text-4xl font-bold text-foreground mb-4 flex items-center">
                    <Bot className="w-10 h-10 mr-4 text-cyan-500" />
                    Trading Bots Hub
                  </h1>
                  <p className="text-muted-foreground">
                    Automate your trading with professional-grade bots and strategies
                  </p>
                </div>
                <div className="flex items-center space-x-4">
                  <Badge className="bg-cyan-500/10 text-cyan-500 border-cyan-500/20">
                    <Activity className="w-4 h-4 mr-2" />
                    {botsMyBots.filter(bot => bot.status === 'active').length} Active Bots
                  </Badge>
                </div>
              </div>

              <Tabs value={botsActiveTab} onValueChange={setBotsActiveTab} className="space-y-8">
                <TabsList className="grid w-full grid-cols-5 bg-card/50 backdrop-blur-sm">
                  <TabsTrigger value="marketplace" className="data-[state=active]:bg-cyan-500">
                    Bot Marketplace
                  </TabsTrigger>
                  <TabsTrigger value="my-bots" className="data-[state=active]:bg-cyan-500">
                    My Bots
                  </TabsTrigger>
                  <TabsTrigger value="strategy-builder" className="data-[state=active]:bg-cyan-500">
                    Strategy Builder
                  </TabsTrigger>
                  <TabsTrigger value="bot-config" className="data-[state=active]:bg-cyan-500">
                    Bot Config
                  </TabsTrigger>
                  <TabsTrigger value="analytics" className="data-[state=active]:bg-cyan-500">
                    Analytics
                  </TabsTrigger>
                </TabsList>

                {/* Marketplace Tab */}
                <TabsContent value="marketplace" className="space-y-8">
                  {/* Search and Filter */}
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Search trading bots..."
                        value={botsSearchTerm}
                        onChange={(e) => setBotsSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <Select value={botsSelectedCategory} onValueChange={setBotsSelectedCategory}>
                      <SelectTrigger className="w-48">
                        <Filter className="w-4 h-4 mr-2" />
                        <SelectValue placeholder="Category" />
                      </SelectTrigger>
                      <SelectContent>
                        {botsCategories.map(category => (
                          <SelectItem key={category} value={category}>
                            {category === 'all' ? 'All Categories' : category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Bot Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {botsFilteredBots.map((bot) => {
                      const IconComponent = bot.icon;
                      return (
                        <Card key={bot.id} className="border-0 p-6 relative overflow-hidden group hover:shadow-lg transition-all duration-300">
                          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-cyan-500/10 to-transparent rounded-full blur-xl"></div>
                          
                          <div className="relative">
                            {/* Header */}
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex items-center space-x-3">
                                <div className="w-12 h-12 bg-cyan-500/10 rounded-xl flex items-center justify-center">
                                  <IconComponent className="w-6 h-6 text-cyan-500" />
                                </div>
                                <div>
                                  <h3 className="font-bold text-lg">{bot.name}</h3>
                                  <p className="text-sm text-muted-foreground">by {bot.creator}</p>
                                </div>
                              </div>
                              <Badge className={getBotsRiskColor(bot.riskLevel)}>
                                {bot.riskLevel}
                              </Badge>
                            </div>

                            {/* Description */}
                            <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                              {bot.description}
                            </p>

                            {/* Metrics */}
                            <div className="grid grid-cols-2 gap-4 mb-4">
                              <div className="text-center p-3 bg-card/30 rounded-lg">
                                <p className="text-sm text-muted-foreground">Performance</p>
                                <p className="font-bold text-green-500">{bot.performance}</p>
                              </div>
                              <div className="text-center p-3 bg-card/30 rounded-lg">
                                <p className="text-sm text-muted-foreground">Win Rate</p>
                                <p className="font-bold text-blue-500">{bot.winRate}</p>
                              </div>
                            </div>

                            {/* Stats */}
                            <div className="flex items-center justify-between mb-4 text-sm">
                              <div className="flex items-center space-x-1">
                                <Star className="w-4 h-4 text-yellow-500 fill-current" />
                                <span>{bot.rating}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Bot className="w-4 h-4 text-muted-foreground" />
                                <span>{bot.users.toLocaleString()} users</span>
                              </div>
                            </div>

                            {/* Action */}
                            <div className="flex items-center justify-end space-x-2">
                              <Button size="sm" variant="outline">
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button 
                                size="sm" 
                                className="bg-cyan-600 hover:bg-cyan-700"
                                onClick={() => handleBotStakeClick(bot)}
                              >
                                Start
                              </Button>
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                </TabsContent>

                {/* My Bots Tab */}
                <TabsContent value="my-bots" className="space-y-8">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-foreground">Your Active Bots</h2>
                    <Button 
                      className="bg-cyan-600 hover:bg-cyan-700"
                      onClick={() => {
                        setBotsActiveTab("strategy-builder");
                        toast({
                          title: "Strategy Builder Opened",
                          description: "Create your custom bot using the Strategy Builder.",
                        });
                      }}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create New Bot
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {myBots.map((bot) => (
                      <Card key={bot.id} className="border-0 p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="font-bold text-lg">{bot.name}</h3>
                            <p className="text-sm text-muted-foreground">{bot.type}</p>
                          </div>
                          <Badge className={getBotStatusColor(bot.status)}>
                            {bot.status}
                          </Badge>
                        </div>

                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="text-center p-3 bg-card/30 rounded-lg">
                              <p className="text-sm text-muted-foreground">P&L</p>
                              <p className={`font-bold ${getPnlColor(bot.pnl)}`}>
                                {bot.pnl >= 0 ? '+' : ''}${Math.abs(bot.pnl).toLocaleString()}
                              </p>
                            </div>
                            <div className="text-center p-3 bg-card/30 rounded-lg">
                              <p className="text-sm text-muted-foreground">Trades</p>
                              <p className="font-bold text-foreground">{bot.trades}</p>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Allocation:</span>
                              <span className="font-medium">${bot.allocation.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span>Started:</span>
                              <span className="font-medium">{bot.started}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span>Performance:</span>
                              <span className={`font-medium ${getPnlColor(bot.pnl)}`}>{bot.performance}</span>
                            </div>
                          </div>

                          <div className="flex space-x-2">
                            {bot.status === 'active' ? (
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="flex-1"
                                onClick={() => handleBotAction(bot.id, 'pause')}
                              >
                                <Pause className="w-4 h-4 mr-2" />
                                Pause
                              </Button>
                            ) : (
                              <Button 
                                size="sm" 
                                className="bg-cyan-600 hover:bg-cyan-700 flex-1"
                                onClick={() => handleBotAction(bot.id, 'start')}
                              >
                                <Play className="w-4 h-4 mr-2" />
                                Start
                              </Button>
                            )}
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => {
                                setSelectedBotForSettings(bot);
                                setBotsActiveTab("bot-config");
                                toast({
                                  title: "Bot Configuration Opened",
                                  description: `Configure settings for ${bot.name}`,
                                });
                              }}
                            >
                              <Settings className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>

                  {/* Create New Bot Modal - Temporarily Disabled */}
                  {/* <Dialog open={isCreateBotModalOpen} onOpenChange={setIsCreateBotModalOpen}>
                    <DialogContent className="sm:max-w-[425px]">
                      <DialogHeader>
                        <DialogTitle>Create New Bot</DialogTitle>
                        <DialogDescription>
                          Create a new trading bot with custom settings.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="bot-name" className="text-right">
                            Bot Name
                          </Label>
                          <Input
                            id="bot-name"
                            placeholder="My Custom Bot"
                            className="col-span-3"
                          />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="bot-type" className="text-right">
                            Strategy
                          </Label>
                          <Select>
                            <SelectTrigger className="col-span-3">
                              <SelectValue placeholder="Select strategy" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="trend-following">Trend Following</SelectItem>
                              <SelectItem value="mean-reversion">Mean Reversion</SelectItem>
                              <SelectItem value="arbitrage">Arbitrage</SelectItem>
                              <SelectItem value="scalping">Scalping</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="bot-allocation" className="text-right">
                            Allocation
                          </Label>
                          <Input
                            id="bot-allocation"
                            type="number"
                            placeholder="1000"
                            className="col-span-3"
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCreateBotModalOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={() => {
                          // Add new bot logic here
                          const newBot = {
                            id: `bot-${Date.now()}`,
                            name: 'New Custom Bot',
                            status: 'active',
                            pnl: 0,
                            trades: 0,
                            allocation: 1000,
                            started: new Date().toLocaleDateString(),
                            type: 'trend-following',
                            performance: '0%'
                          };
                          setMyBots(prev => [newBot, ...prev]);
                          setIsCreateBotModalOpen(false);
                          toast({
                            title: "Bot Created",
                            description: "New trading bot has been created successfully.",
                          });
                        }}>
                          Create Bot
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog> */}

                  {/* Bot Settings Modal - Temporarily Disabled */}
                  {/* <Dialog open={isBotSettingsModalOpen} onOpenChange={setIsBotSettingsModalOpen}>
                    <DialogContent className="sm:max-w-[425px]">
                      <DialogHeader>
                        <DialogTitle>Bot Settings</DialogTitle>
                        <DialogDescription>
                          Configure settings for {selectedBotForSettings?.name}.
                        </DialogDescription>
                      </DialogHeader>
                      {selectedBotForSettings && (
                        <div className="grid gap-4 py-4">
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="settings-name" className="text-right">
                              Bot Name
                            </Label>
                            <Input
                              id="settings-name"
                              defaultValue={selectedBotForSettings.name}
                              className="col-span-3"
                            />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="settings-allocation" className="text-right">
                              Allocation
                            </Label>
                            <Input
                              id="settings-allocation"
                              type="number"
                              defaultValue={selectedBotForSettings.allocation}
                              className="col-span-3"
                            />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="settings-risk" className="text-right">
                              Risk Level
                            </Label>
                            <Select defaultValue="medium">
                              <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="Select risk level" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="low">Low</SelectItem>
                                <SelectItem value="medium">Medium</SelectItem>
                                <SelectItem value="high">High</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="settings-stop-loss" className="text-right">
                              Stop Loss
                            </Label>
                            <Input
                              id="settings-stop-loss"
                              type="number"
                              placeholder="5"
                              className="col-span-3"
                            />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="settings-take-profit" className="text-right">
                              Take Profit
                            </Label>
                            <Input
                              id="settings-take-profit"
                              type="number"
                              placeholder="10"
                              className="col-span-3"
                            />
                          </div>
                        </div>
                      )}
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsBotSettingsModalOpen(false)}>
                          Cancel
                        </Button>
                        <Button 
                          variant="destructive" 
                          onClick={() => {
                            if (selectedBotForSettings) {
                              handleDeleteBot(selectedBotForSettings.id);
                              setIsBotSettingsModalOpen(false);
                            }
                          }}
                        >
                          Delete Bot
                        </Button>
                        <Button onClick={() => {
                          if (selectedBotForSettings) {
                            handleUpdateBotSettings(selectedBotForSettings.id, {
                              name: 'Updated Bot Name',
                              allocation: 5000
                            });
                          }
                        }}>
                          Save Changes
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog> */}
                </TabsContent>

                {/* Strategy Builder Tab */}
                <TabsContent value="strategy-builder" className="space-y-8">
                  <div className="max-w-7xl mx-auto">
                    {/* Strategy Builder Header */}
                    <div className="text-center mb-8">
                      <div className="w-20 h-20 bg-cyan-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Code className="w-10 h-10 text-cyan-500" />
                      </div>
                      <h2 className="text-3xl font-bold text-foreground mb-4">Strategy Builder</h2>
                      <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
                        Create your own custom trading strategies with our visual strategy builder. 
                        Combine indicators, set conditions, and backtest your strategies before deployment.
                      </p>
                    </div>

                    {/* Strategy Builder Interface */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                      {/* Left Panel - Strategy Components */}
                      <div className="space-y-6">
                        <Card className="border-0">
                          <CardHeader>
                            <CardTitle className="text-foreground">Strategy Components</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            {/* Indicators */}
                            <div>
                              <h4 className="font-semibold mb-3 text-foreground">Indicators</h4>
                              <div className="space-y-2">
                                {[
                                  { name: 'Moving Average', icon: '📈', type: 'trend' },
                                  { name: 'RSI', icon: '📊', type: 'momentum' },
                                  { name: 'MACD', icon: '📉', type: 'trend' },
                                  { name: 'Bollinger Bands', icon: '📋', type: 'volatility' },
                                  { name: 'Stochastic', icon: '🎯', type: 'momentum' }
                                ].map((indicator, index) => (
                                  <div
                                    key={index}
                                    className="p-3 border border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                                    draggable
                                    onDragStart={(e) => {
                                      e.dataTransfer.setData('text/plain', JSON.stringify({
                                        type: 'indicator',
                                        name: indicator.name,
                                        icon: indicator.icon
                                      }));
                                    }}
                                  >
                                    <div className="flex items-center gap-3">
                                      <span className="text-lg">{indicator.icon}</span>
                                      <div>
                                        <div className="font-medium text-foreground">{indicator.name}</div>
                                        <div className="text-xs text-muted-foreground capitalize">{indicator.type}</div>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Conditions */}
                            <div>
                              <h4 className="font-semibold mb-3 text-foreground">Conditions</h4>
                              <div className="space-y-2">
                                {[
                                  { name: 'Price Above', icon: '⬆️', type: 'comparison' },
                                  { name: 'Price Below', icon: '⬇️', type: 'comparison' },
                                  { name: 'Volume > Average', icon: '📈', type: 'volume' },
                                  { name: 'RSI Oversold', icon: '🟢', type: 'signal' },
                                  { name: 'RSI Overbought', icon: '🔴', type: 'signal' }
                                ].map((condition, index) => (
                                  <div
                                    key={index}
                                    className="p-3 border border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                                    draggable
                                    onDragStart={(e) => {
                                      e.dataTransfer.setData('text/plain', JSON.stringify({
                                        type: 'condition',
                                        name: condition.name,
                                        icon: condition.icon
                                      }));
                                    }}
                                  >
                                    <div className="flex items-center gap-3">
                                      <span className="text-lg">{condition.icon}</span>
                                      <div>
                                        <div className="font-medium text-foreground">{condition.name}</div>
                                        <div className="text-xs text-muted-foreground capitalize">{condition.type}</div>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Actions */}
                            <div>
                              <h4 className="font-semibold mb-3 text-foreground">Actions</h4>
                              <div className="space-y-2">
                                {[
                                  { name: 'Buy', icon: '🟢', type: 'entry' },
                                  { name: 'Sell', icon: '🔴', type: 'entry' },
                                  { name: 'Set Stop Loss', icon: '🛑', type: 'risk' },
                                  { name: 'Set Take Profit', icon: '💰', type: 'profit' },
                                  { name: 'Close Position', icon: '🚪', type: 'exit' }
                                ].map((action, index) => (
                                  <div
                                    key={index}
                                    className="p-3 border border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                                    draggable
                                    onDragStart={(e) => {
                                      e.dataTransfer.setData('text/plain', JSON.stringify({
                                        type: 'action',
                                        name: action.name,
                                        icon: action.icon
                                      }));
                                    }}
                                  >
                                    <div className="flex items-center gap-3">
                                      <span className="text-lg">{action.icon}</span>
                                      <div>
                                        <div className="font-medium text-foreground">{action.name}</div>
                                        <div className="text-xs text-muted-foreground capitalize">{action.type}</div>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>

                      {/* Center Panel - Strategy Canvas */}
                      <div className="space-y-6">
                        <Card className="border-0">
                          <CardHeader>
                            <CardTitle className="text-foreground">Strategy Canvas</CardTitle>
                            <p className="text-sm text-muted-foreground">Drag components here to build your strategy</p>
                          </CardHeader>
                          <CardContent>
                                                         <div
                               className="min-h-[400px] border-2 border-dashed border-muted-foreground/30 rounded-lg p-6 bg-muted/10"
                               onDragOver={(e) => e.preventDefault()}
                               onDrop={(e) => {
                                 e.preventDefault();
                                 const data = JSON.parse(e.dataTransfer.getData('text/plain'));
                                 handleStrategyComponentDrop(data);
                               }}
                             >
                               {strategyComponents.length === 0 ? (
                                 <div className="flex items-center justify-center h-full text-muted-foreground">
                                   <div className="text-center">
                                     <Code className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                     <p>Drag strategy components here</p>
                                     <p className="text-sm">Build your trading logic step by step</p>
                                   </div>
                                 </div>
                               ) : (
                                 <div className="space-y-3">
                                   {strategyComponents.map((component, index) => (
                                     <div key={component.id} className="flex items-center gap-3 p-3 bg-card rounded-lg border">
                                       <span className="text-lg">{component.icon}</span>
                                       <div className="flex-1">
                                         <div className="font-medium text-foreground">{component.name}</div>
                                         <div className="text-xs text-muted-foreground capitalize">{component.type}</div>
                                       </div>
                                       <Button
                                         size="sm"
                                         variant="outline"
                                         onClick={() => setStrategyComponents(prev => prev.filter((_, i) => i !== index))}
                                       >
                                         Remove
                                       </Button>
                                     </div>
                                   ))}
                                 </div>
                               )}
                             </div>
                          </CardContent>
                        </Card>

                        {/* Strategy Settings */}
                        <Card className="border-0">
                          <CardHeader>
                            <CardTitle className="text-foreground">Strategy Settings</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                                                         <div className="grid grid-cols-2 gap-4">
                               <div>
                                 <Label htmlFor="strategy-name">Strategy Name</Label>
                                 <Input 
                                   id="strategy-name" 
                                   placeholder="My Custom Strategy"
                                   value={strategyName}
                                   onChange={(e) => setStrategyName(e.target.value)}
                                 />
                               </div>
                               <div>
                                 <Label htmlFor="strategy-symbol">Trading Pair</Label>
                                 <Select value={strategySymbol} onValueChange={setStrategySymbol}>
                                   <SelectTrigger>
                                     <SelectValue placeholder="Select pair" />
                                   </SelectTrigger>
                                   <SelectContent>
                                     <SelectItem value="BTCUSDT">BTC/USDT</SelectItem>
                                     <SelectItem value="ETHUSDT">ETH/USDT</SelectItem>
                                     <SelectItem value="BNBUSDT">BNB/USDT</SelectItem>
                                   </SelectContent>
                                 </Select>
                               </div>
                             </div>
                             <div className="grid grid-cols-2 gap-4">
                               <div>
                                 <Label htmlFor="position-size">Position Size (%)</Label>
                                 <Input 
                                   id="position-size" 
                                   type="number" 
                                   placeholder="5"
                                   value={positionSize}
                                   onChange={(e) => setPositionSize(e.target.value)}
                                 />
                               </div>
                               <div>
                                 <Label htmlFor="max-positions">Max Positions</Label>
                                 <Input 
                                   id="max-positions" 
                                   type="number" 
                                   placeholder="3"
                                   value={maxPositions}
                                   onChange={(e) => setMaxPositions(e.target.value)}
                                 />
                               </div>
                             </div>
                             <div className="grid grid-cols-2 gap-4">
                               <div>
                                 <Label htmlFor="stop-loss">Stop Loss (%)</Label>
                                 <Input 
                                   id="stop-loss" 
                                   type="number" 
                                   placeholder="2"
                                   value={stopLoss}
                                   onChange={(e) => setStopLoss(e.target.value)}
                                 />
                               </div>
                               <div>
                                 <Label htmlFor="take-profit">Take Profit (%)</Label>
                                 <Input 
                                   id="take-profit" 
                                   type="number" 
                                   placeholder="6"
                                   value={takeProfit}
                                   onChange={(e) => setTakeProfit(e.target.value)}
                                 />
                               </div>
                             </div>
                          </CardContent>
                        </Card>
                      </div>

                      {/* Right Panel - Backtesting & Results */}
                      <div className="space-y-6">
                        <Card className="border-0">
                          <CardHeader>
                            <CardTitle className="text-foreground">Backtesting</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                                                         <div className="grid grid-cols-2 gap-4">
                               <div>
                                 <Label htmlFor="backtest-period">Period</Label>
                                 <Select value={backtestPeriod} onValueChange={setBacktestPeriod}>
                                   <SelectTrigger>
                                     <SelectValue placeholder="Select period" />
                                   </SelectTrigger>
                                   <SelectContent>
                                     <SelectItem value="1d">1 Day</SelectItem>
                                     <SelectItem value="7d">7 Days</SelectItem>
                                     <SelectItem value="30d">30 Days</SelectItem>
                                     <SelectItem value="90d">90 Days</SelectItem>
                                   </SelectContent>
                                 </Select>
                               </div>
                               <div>
                                 <Label htmlFor="initial-capital">Initial Capital</Label>
                                 <Input 
                                   id="initial-capital" 
                                   type="number" 
                                   placeholder="10000"
                                   value={initialCapital}
                                   onChange={(e) => setInitialCapital(e.target.value)}
                                 />
                               </div>
                             </div>
                             <Button 
                               className="w-full bg-cyan-600 hover:bg-cyan-700"
                               onClick={handleRunBacktest}
                               disabled={isExecuting}
                             >
                               <Target className="w-4 h-4 mr-2" />
                               {isExecuting ? 'Running...' : 'Run Backtest'}
                             </Button>
                          </CardContent>
                        </Card>

                        {/* Backtest Results */}
                        <Card className="border-0">
                          <CardHeader>
                            <CardTitle className="text-foreground">Backtest Results</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                                                         {backtestResults ? (
                               <>
                                 <div className="grid grid-cols-2 gap-4 text-center">
                                   <div className="p-3 bg-green-500/10 rounded-lg">
                                     <div className="text-2xl font-bold text-green-500">+{backtestResults.totalReturn}%</div>
                                     <div className="text-xs text-muted-foreground">Total Return</div>
                                   </div>
                                   <div className="p-3 bg-blue-500/10 rounded-lg">
                                     <div className="text-2xl font-bold text-blue-500">{backtestResults.winRate}%</div>
                                     <div className="text-xs text-muted-foreground">Win Rate</div>
                                   </div>
                                 </div>
                                 <div className="space-y-2">
                                   <div className="flex justify-between text-sm">
                                     <span>Total Trades:</span>
                                     <span className="font-medium">{backtestResults.totalTrades}</span>
                                   </div>
                                   <div className="flex justify-between text-sm">
                                     <span>Avg Trade Duration:</span>
                                     <span className="font-medium">{backtestResults.avgTradeDuration}</span>
                                   </div>
                                   <div className="flex justify-between text-sm">
                                     <span>Max Drawdown:</span>
                                     <span className="font-medium text-red-500">{backtestResults.maxDrawdown}%</span>
                                   </div>
                                   <div className="flex justify-between text-sm">
                                     <span>Sharpe Ratio:</span>
                                     <span className="font-medium">{backtestResults.sharpeRatio}</span>
                                   </div>
                                 </div>
                               </>
                             ) : (
                               <div className="text-center py-8 text-muted-foreground">
                                 <Target className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                 <p>Run backtest to see results</p>
                               </div>
                             )}
                          </CardContent>
                        </Card>

                        {/* Deploy Strategy */}
                        <Card className="border-0">
                          <CardHeader>
                            <CardTitle className="text-foreground">Deploy Strategy</CardTitle>
                          </CardHeader>
                                                     <CardContent className="space-y-4">
                             <div>
                               <Label htmlFor="deploy-name">Bot Name</Label>
                               <Input 
                                 id="deploy-name" 
                                 placeholder="My Custom Bot"
                                 value={deployName}
                                 onChange={(e) => setDeployName(e.target.value)}
                               />
                             </div>
                             <div>
                               <Label htmlFor="deploy-capital">Investment Amount</Label>
                               <Input 
                                 id="deploy-capital" 
                                 type="number" 
                                 placeholder="1000"
                                 value={deployCapital}
                                 onChange={(e) => setDeployCapital(e.target.value)}
                               />
                             </div>
                             <Button 
                               className="w-full bg-green-600 hover:bg-green-700"
                               onClick={handleDeployStrategy}
                               disabled={isExecuting || !backtestResults}
                             >
                               <Rocket className="w-4 h-4 mr-2" />
                               {isExecuting ? 'Deploying...' : 'Deploy Strategy'}
                             </Button>
                           </CardContent>
                        </Card>
                      </div>
                    </div>

                    {/* Strategy Templates */}
                    <div className="mt-8">
                      <Card className="border-0">
                        <CardHeader>
                          <CardTitle className="text-foreground">Strategy Templates</CardTitle>
                          <p className="text-sm text-muted-foreground">Quick start with pre-built strategies</p>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {[
                              {
                                name: 'Moving Average Crossover',
                                description: 'Buy when fast MA crosses above slow MA',
                                icon: '📈',
                                performance: '+12.5%'
                              },
                              {
                                name: 'RSI Divergence',
                                description: 'Trade RSI divergence signals',
                                icon: '📊',
                                performance: '+18.2%'
                              },
                              {
                                name: 'Bollinger Band Squeeze',
                                description: 'Trade breakouts from tight ranges',
                                icon: '📋',
                                performance: '+22.1%'
                              }
                            ].map((template, index) => (
                              <div key={index} className="p-4 border border-border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors">
                                <div className="flex items-center gap-3 mb-3">
                                  <span className="text-2xl">{template.icon}</span>
                                  <div>
                                    <div className="font-semibold text-foreground">{template.name}</div>
                                    <div className="text-sm text-muted-foreground">{template.description}</div>
                                  </div>
                                </div>
                                                                 <div className="flex items-center justify-between">
                                   <span className="text-sm text-green-500 font-medium">{template.performance}</span>
                                   <Button 
                                     size="sm" 
                                     variant="outline"
                                     onClick={() => handleUseTemplate(template)}
                                   >
                                     Use Template
                                   </Button>
                                 </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </TabsContent>

                {/* Bot Config Tab */}
                <TabsContent value="bot-config" className="space-y-8">
                  {selectedBotForSettings ? (
                    <div className="max-w-4xl mx-auto">
                      {/* Bot Configuration Header */}
                      <div className="text-center mb-8">
                        <div className="w-20 h-20 bg-cyan-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                          <Settings className="w-10 h-10 text-cyan-500" />
                        </div>
                        <h2 className="text-3xl font-bold text-foreground mb-4">Bot Configuration</h2>
                        <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
                          Configure and modify settings for {selectedBotForSettings.name}
                        </p>
                      </div>

                      {/* Bot Configuration Interface */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Left Panel - Current Bot Info */}
                        <div className="space-y-6">
                          <Card className="border-0">
                            <CardHeader>
                              <CardTitle className="text-foreground">Current Bot Information</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label>Bot Name</Label>
                                  <Input 
                                    defaultValue={selectedBotForSettings.name}
                                    onChange={(e) => {
                                      setSelectedBotForSettings(prev => ({
                                        ...prev,
                                        name: e.target.value
                                      }));
                                    }}
                                  />
                                </div>
                                <div>
                                  <Label>Bot Type</Label>
                                  <Input 
                                    defaultValue={selectedBotForSettings.type}
                                    disabled
                                  />
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label>Allocation</Label>
                                  <Input 
                                    type="number"
                                    defaultValue={selectedBotForSettings.allocation}
                                    onChange={(e) => {
                                      setSelectedBotForSettings(prev => ({
                                        ...prev,
                                        allocation: parseInt(e.target.value) || 0
                                      }));
                                    }}
                                  />
                                </div>
                                <div>
                                  <Label>Status</Label>
                                  <Select 
                                    value={selectedBotForSettings.status}
                                    onValueChange={(value) => {
                                      setSelectedBotForSettings(prev => ({
                                        ...prev,
                                        status: value
                                      }));
                                    }}
                                  >
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="active">Active</SelectItem>
                                      <SelectItem value="paused">Paused</SelectItem>
                                      <SelectItem value="stopped">Stopped</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label>Risk Level</Label>
                                  <Select defaultValue="medium">
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="low">Low</SelectItem>
                                      <SelectItem value="medium">Medium</SelectItem>
                                      <SelectItem value="high">High</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div>
                                  <Label>Trading Pair</Label>
                                  <Select defaultValue="BTCUSDT">
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="BTCUSDT">BTC/USDT</SelectItem>
                                      <SelectItem value="ETHUSDT">ETH/USDT</SelectItem>
                                      <SelectItem value="BNBUSDT">BNB/USDT</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                            </CardContent>
                          </Card>

                          <Card className="border-0">
                            <CardHeader>
                              <CardTitle className="text-foreground">Risk Management</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label>Stop Loss (%)</Label>
                                  <Input 
                                    type="number"
                                    placeholder="5"
                                    defaultValue="5"
                                  />
                                </div>
                                <div>
                                  <Label>Take Profit (%)</Label>
                                  <Input 
                                    type="number"
                                    placeholder="10"
                                    defaultValue="10"
                                  />
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label>Max Positions</Label>
                                  <Input 
                                    type="number"
                                    placeholder="3"
                                    defaultValue="3"
                                  />
                                </div>
                                <div>
                                  <Label>Position Size (%)</Label>
                                  <Input 
                                    type="number"
                                    placeholder="5"
                                    defaultValue="5"
                                  />
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </div>

                        {/* Right Panel - Strategy Components */}
                        <div className="space-y-6">
                          <Card className="border-0">
                            <CardHeader>
                              <CardTitle className="text-foreground">Strategy Components</CardTitle>
                              <p className="text-sm text-muted-foreground">Current strategy configuration</p>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-3">
                                {[
                                  { type: 'indicator', name: 'Moving Average', icon: '📈', status: 'active' },
                                  { type: 'condition', name: 'Price Above', icon: '⬆️', status: 'active' },
                                  { type: 'action', name: 'Buy', icon: '🟢', status: 'active' },
                                  { type: 'condition', name: 'RSI Oversold', icon: '🟢', status: 'inactive' },
                                  { type: 'action', name: 'Set Stop Loss', icon: '🛑', status: 'inactive' }
                                ].map((component, index) => (
                                  <div key={index} className="flex items-center gap-3 p-3 border border-border rounded-lg">
                                    <span className="text-lg">{component.icon}</span>
                                    <div className="flex-1">
                                      <div className="font-medium text-foreground">{component.name}</div>
                                      <div className="text-xs text-muted-foreground capitalize">{component.type}</div>
                                    </div>
                                    <Badge variant={component.status === 'active' ? 'default' : 'secondary'}>
                                      {component.status}
                                    </Badge>
                                  </div>
                                ))}
                              </div>
                            </CardContent>
                          </Card>

                          <Card className="border-0">
                            <CardHeader>
                              <CardTitle className="text-foreground">Performance Metrics</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                              <div className="grid grid-cols-2 gap-4 text-center">
                                <div className="p-3 bg-green-500/10 rounded-lg">
                                  <div className="text-2xl font-bold text-green-500">
                                    {selectedBotForSettings.pnl >= 0 ? '+' : ''}${Math.abs(selectedBotForSettings.pnl).toLocaleString()}
                                  </div>
                                  <div className="text-xs text-muted-foreground">P&L</div>
                                </div>
                                <div className="p-3 bg-blue-500/10 rounded-lg">
                                  <div className="text-2xl font-bold text-blue-500">{selectedBotForSettings.trades}</div>
                                  <div className="text-xs text-muted-foreground">Total Trades</div>
                                </div>
                              </div>
                              <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                  <span>Started:</span>
                                  <span className="font-medium">{selectedBotForSettings.started}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span>Performance:</span>
                                  <span className={`font-medium ${getPnlColor(selectedBotForSettings.pnl)}`}>
                                    {selectedBotForSettings.performance}
                                  </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span>Allocation:</span>
                                  <span className="font-medium">${selectedBotForSettings.allocation.toLocaleString()}</span>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex justify-center gap-4 mt-8">
                        <Button 
                          variant="outline"
                          onClick={() => setBotsActiveTab("my-bots")}
                        >
                          Back to My Bots
                        </Button>
                        <Button 
                          className="bg-cyan-600 hover:bg-cyan-700"
                          onClick={() => {
                            handleUpdateBotSettings(selectedBotForSettings.id, selectedBotForSettings);
                            setBotsActiveTab("my-bots");
                            toast({
                              title: "Bot Updated",
                              description: `${selectedBotForSettings.name} has been updated successfully.`,
                            });
                          }}
                        >
                          Save Changes
                        </Button>
                        <Button 
                          variant="destructive"
                          onClick={() => {
                            handleDeleteBot(selectedBotForSettings.id);
                            setBotsActiveTab("my-bots");
                            toast({
                              title: "Bot Deleted",
                              description: `${selectedBotForSettings.name} has been deleted.`,
                            });
                          }}
                        >
                          Delete Bot
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Settings className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                      <h3 className="text-xl font-semibold text-foreground mb-2">No Bot Selected</h3>
                      <p className="text-muted-foreground mb-4">
                        Select a bot from My Bots to configure its settings.
                      </p>
                      <Button 
                        onClick={() => setBotsActiveTab("my-bots")}
                        className="bg-cyan-600 hover:bg-cyan-700"
                      >
                        Go to My Bots
                      </Button>
                    </div>
                  )}
                </TabsContent>

                {/* Analytics Tab */}
                <TabsContent value="analytics" className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Card className="border-0 p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center">
                          <DollarSign className="w-6 h-6 text-green-500" />
                        </div>
                        <Badge className="bg-green-500/10 text-green-500">0.0%</Badge>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Total Bot Profit</p>
                        {/* TODO: Replace with real API call to get total bot profit */}
                        <p className="text-2xl font-bold text-foreground">$0.00</p>
                        <p className="text-xs text-green-500 mt-1">Last 30 days</p>
                      </div>
                    </Card>

                    <Card className="border-0 p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center">
                          <Activity className="w-6 h-6 text-blue-500" />
                        </div>
                        <Badge className="bg-blue-500/10 text-blue-500">Live</Badge>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Active Trades</p>
                        {/* TODO: Replace with real API call to get active trades count */}
                        <p className="text-2xl font-bold text-foreground">0</p>
                        <p className="text-xs text-muted-foreground mt-1">Across all bots</p>
                      </div>
                    </Card>

                    <Card className="border-0 p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-yellow-500/10 rounded-xl flex items-center justify-center">
                          <Target className="w-6 h-6 text-yellow-500" />
                        </div>
                        <Badge className="bg-yellow-500/10 text-yellow-500">85%</Badge>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Success Rate</p>
                        {/* TODO: Replace with real API call to get success rate */}
                        <p className="text-2xl font-bold text-foreground">0.0%</p>
                        <p className="text-xs text-muted-foreground mt-1">Win rate average</p>
                      </div>
                    </Card>

                    <Card className="border-0 p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center">
                          <Clock className="w-6 h-6 text-purple-500" />
                        </div>
                        <Badge className="bg-purple-500/10 text-purple-500">24/7</Badge>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Uptime</p>
                        {/* TODO: Replace with real API call to get uptime percentage */}
                        <p className="text-2xl font-bold text-foreground">0.0%</p>
                        <p className="text-xs text-muted-foreground mt-1">Last 30 days</p>
                      </div>
                    </Card>
                  </div>

                  {/* Performance Chart Placeholder */}
                  <Card className="border-0 p-6">
                    <h3 className="text-xl font-bold text-foreground mb-6">Bot Performance Overview</h3>
                    {/* TODO: Replace with real performance charts from API */}
                    <div className="h-64 flex items-center justify-center bg-muted/20 rounded-lg">
                      <div className="text-center">
                        <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">Performance charts will be displayed here</p>
                      </div>
                    </div>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </TabsContent>

          {/* Staking Tab */}
          <TabsContent value="staking" className="space-y-6">
            <div className="max-w-7xl mx-auto">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-foreground">Staking</h2>
                  <p className="text-muted-foreground">Earn rewards by staking your cryptocurrencies</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                  </Button>
                </div>
              </div>

              {/* Staking Overview */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <Card className="border-0 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Total Staked</p>
                      <p className="text-2xl font-bold text-foreground">$0.00</p>
                    </div>
                    <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center">
                      <Coins className="w-6 h-6 text-blue-500" />
                    </div>
                  </div>
                </Card>

                <Card className="border-0 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Total Rewards</p>
                      <p className="text-2xl font-bold text-foreground">$0.00</p>
                    </div>
                    <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center">
                      <Award className="w-6 h-6 text-green-500" />
                    </div>
                  </div>
                </Card>

                <Card className="border-0 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Active Stakes</p>
                      <p className="text-2xl font-bold text-foreground">0</p>
                    </div>
                    <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center">
                      <Lock className="w-6 h-6 text-purple-500" />
                    </div>
                  </div>
                </Card>

                <Card className="border-0 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Avg. APY</p>
                      <p className="text-2xl font-bold text-foreground">0.00%</p>
                    </div>
                    <div className="w-12 h-12 bg-orange-500/10 rounded-xl flex items-center justify-center">
                      <Percent className="w-6 h-6 text-orange-500" />
                    </div>
                  </div>
                </Card>
              </div>

              {/* Staking Pools */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="border-0 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-foreground">Available Staking Pools</h3>
                    <Button variant="outline" size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Pool
                    </Button>
                  </div>
                  
                  <div className="space-y-4">
                    {stakingPools.map((pool) => (
                      <div key={pool.token} className="flex items-center justify-between p-4 bg-muted/20 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500/20 to-indigo-500/20 rounded-lg flex items-center justify-center">
                            <span className="text-lg">{pool.icon}</span>
                          </div>
                          <div>
                            <h4 className="font-semibold text-foreground">{pool.name}</h4>
                            <p className="text-sm text-muted-foreground">{pool.description}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-foreground">{pool.apy}% APY</p>
                          <p className="text-sm text-muted-foreground">Min: {pool.minStake} {pool.token}</p>
                          <Button 
                            size="sm" 
                            className="mt-2"
                            onClick={() => handleOpenStakingModal(pool)}
                          >
                            Stake
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>

                <Card className="border-0 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-foreground">Your Active Stakes</h3>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="text-center py-8">
                      <Lock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No active stakes</p>
                      <p className="text-sm text-muted-foreground mt-2">Start staking to earn rewards</p>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Staking Calculator */}
              <Card className="border-0 p-6 mt-6">
                <h3 className="text-xl font-bold text-foreground mb-6">Staking Calculator</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <Label htmlFor="calculatorToken">Token</Label>
                    <Select value={calculatorToken} onValueChange={setCalculatorToken}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select token" />
                      </SelectTrigger>
                      <SelectContent>
                        {stakingPools.map((pool) => (
                          <SelectItem key={pool.token} value={pool.token}>
                            {pool.token}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="calculatorAmount">Amount</Label>
                    <Input
                      id="calculatorAmount"
                      type="number"
                      placeholder="Enter amount"
                      value={calculatorAmount}
                      onChange={(e) => setCalculatorAmount(e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="calculatorPeriod">Period (days)</Label>
                    <Input
                      id="calculatorPeriod"
                      type="number"
                      placeholder="Enter days"
                      value={calculatorPeriod}
                      onChange={(e) => setCalculatorPeriod(e.target.value)}
                    />
                  </div>
                </div>
                
                {calculatorToken && calculatorAmount && calculatorPeriod && (
                  <div className="mt-6 p-4 bg-muted/20 rounded-lg">
                    <h4 className="font-semibold text-foreground mb-2">Estimated Returns</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Rewards</p>
                        <p className="text-lg font-bold text-foreground">
                          ${calculateStakingRewards().toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">APY</p>
                        <p className="text-lg font-bold text-foreground">
                          {stakingPools.find(p => p.token === calculatorToken)?.apy || 0}%
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Total Value</p>
                        <p className="text-lg font-bold text-foreground">
                          ${(parseFloat(calculatorAmount) + calculateStakingRewards()).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Staking Modal */}
      {isStakingModalOpen && selectedPool && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500/20 to-indigo-500/20 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">{selectedPool.icon}</span>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground">{selectedPool.name}</h2>
                  <p className="text-sm text-muted-foreground">Stake your {selectedPool.token}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsStakingModalOpen(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-6">
              {/* Pool Info */}
              <div className="p-4 bg-muted/30 rounded-lg">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">APY:</span>
                    <p className="font-medium text-green-500">{selectedPool.apy}%</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Min Stake:</span>
                    <p className="font-medium">{selectedPool.minStake} {selectedPool.token}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Duration:</span>
                    <p className="font-medium">{selectedPool.duration}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Reward Type:</span>
                    <p className="font-medium">{selectedPool.rewardType}</p>
                  </div>
                </div>
              </div>

              {/* Stake Amount */}
              <div className="space-y-2">
                <Label htmlFor="stake-amount">Stake Amount ({selectedPool.token})</Label>
                <Input
                  id="stake-amount"
                  type="number"
                  placeholder={`${selectedPool.minStake} ${selectedPool.token}`}
                  min={selectedPool.minStake}
                  value={stakingStakeAmount}
                  onChange={(e) => setStakingStakeAmount(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Available: {formatCurrency(parseFloat(tradingAccount.USDT?.available.replace(/,/g, '') || '0'))}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setIsStakingModalOpen(false);
                    setStakingStakeAmount("");
                  }}
                  disabled={stakingIsExecuting}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                  onClick={() => handleStake(parseFloat(stakingStakeAmount) || 0, selectedPool)}
                  disabled={stakingIsExecuting || !stakingStakeAmount || parseFloat(stakingStakeAmount) < selectedPool.minStake}
                >
                  {stakingIsExecuting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Staking...
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4 mr-2" />
                      Stake {selectedPool.token}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Unstake Modal */}
      {isUnstakeModalOpen && selectedStake && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-xl flex items-center justify-center">
                  <Unlock className="w-6 h-6 text-orange-500" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground">Confirm Unstake</h2>
                  <p className="text-sm text-muted-foreground">Unstake your {selectedStake.token}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsUnstakeModalOpen(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-6">
              {/* Warning */}
              <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-orange-500" />
                  <span className="font-medium text-orange-500">Early Unstake Warning</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Unstaking before the lock period may result in reduced rewards or fees.
                </p>
              </div>

              {/* Stake Details */}
              <div className="p-4 bg-muted/30 rounded-lg">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Staked Amount:</span>
                    <p className="font-medium">{formatTokenAmount(selectedStake.amount, selectedStake.token)}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Current Value:</span>
                    <p className="font-medium">{formatCurrency(selectedStake.value)}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">APY:</span>
                    <p className="font-medium text-green-500">{selectedStake.apy}%</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Lock Period:</span>
                    <p className="font-medium">{selectedStake.lockPeriod}</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setIsUnstakeModalOpen(false)}
                  disabled={stakingIsExecuting}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-orange-600 hover:bg-orange-700"
                  onClick={() => handleUnstake(selectedStake)}
                  disabled={stakingIsExecuting}
                >
                  {stakingIsExecuting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Unstaking...
                    </>
                  ) : (
                    <>
                      <Unlock className="w-4 h-4 mr-2" />
                      Confirm Unstake
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bot Stake Modal */}
      {isStakeModalOpen && selectedBotForStake && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-xl flex items-center justify-center">
                  {React.createElement(selectedBotForStake.icon, { className: "w-6 h-6 text-cyan-500" })}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground">{selectedBotForStake.name}</h2>
                  <p className="text-sm text-muted-foreground">Configure your stake</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsStakeModalOpen(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-6">
              {/* Bot Info */}
              <div className="p-4 bg-muted/30 rounded-lg">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Tier:</span>
                    <p className="font-medium text-blue-500">{selectedBotForStake.tier}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Min Stake:</span>
                    <p className="font-medium">${selectedBotForStake.minStake.toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Max Stake:</span>
                    <p className="font-medium">${selectedBotForStake.maxStake.toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Profit Range:</span>
                    <p className="font-medium text-green-500">{selectedBotForStake.profitRange}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Risk Level:</span>
                    <p className="font-medium">{selectedBotForStake.riskLevel}</p>
                  </div>
                </div>
              </div>

              {/* Stake Amount */}
              <div className="space-y-2">
                <Label htmlFor="stake-amount">Stake Amount (USD)</Label>
                <Input
                  id="stake-amount"
                  type="number"
                  placeholder={`${selectedBotForStake.minStake.toLocaleString()} - ${selectedBotForStake.maxStake.toLocaleString()}`}
                  value={stakeAmount}
                  onChange={(e) => handleStakeAmountChange(e.target.value)}
                  min={selectedBotForStake.minStake}
                  max={selectedBotForStake.maxStake}
                />
                <p className="text-xs text-muted-foreground">
                  Available: ${tradingAccount.USDT?.available || '0'}
                </p>
              </div>

              {/* Duration */}
              <div className="space-y-2">
                <Label htmlFor="stake-duration">Duration (Minutes)</Label>
                <Select value={stakeDuration.toString()} onValueChange={(value) => handleStakeDurationChange(parseInt(value))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10 minutes</SelectItem>
                    <SelectItem value="15">15 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="45">45 minutes</SelectItem>
                    <SelectItem value="60">60 minutes</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Estimated Profit */}
              {stakeAmount && parseFloat(stakeAmount) > 0 && (
                <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Estimated Profit</p>
                    <p className="text-2xl font-bold text-green-500">
                      +${estimatedProfit.toFixed(2)} ({profitPercentage.toFixed(3)}%)
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Based on {stakeDuration} minutes duration
                    </p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setIsStakeModalOpen(false)}
                  disabled={isExecuting}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-cyan-600 hover:bg-cyan-700"
                  onClick={handleStartBot}
                  disabled={isExecuting || !stakeAmount || parseFloat(stakeAmount) < selectedBotForStake.minStake}
                >
                  {isExecuting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Starting...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      Start Bot
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TradingPage;